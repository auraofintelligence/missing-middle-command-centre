import {scrypt,timingSafeEqual} from 'node:crypto';

const windowMs = 15 * 60 * 1000;
const sessionSeconds = 12 * 60 * 60;
const cookieName = '__Host-MMI-Session';

export function validPassword(value) {
  return typeof value === 'string' && value.length > 0 && value.isWellFormed() && Array.from(value).length <= 128;
}
function randomHex(size) {
  return hex(crypto.getRandomValues(new Uint8Array(size)));
}
function hex(bytes) {
  return Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
}
function bytes(value) {
  return Uint8Array.from(value.match(/../g),part=>parseInt(part,16));
}
async function hashToken(token) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))));
}
function derive(password,salt) {
  return new Promise((resolve,reject)=>{
    scrypt(password,bytes(salt),32,{N:32768,r:8,p:3,maxmem:48*1024*1024},(error,key)=>{
      if(error) reject(error);
      else resolve(key);
    });
  });
}

export async function reserveAttempt(db, accountId, now = Date.now()) {
  return db.prepare(`INSERT INTO password_attempt_windows (account_id,generation,expires_at,attempts)
    SELECT ?1,?2,?3+?4,1 FROM accounts WHERE id=?1 AND active=1
    ON CONFLICT(account_id) DO UPDATE SET
      generation=CASE WHEN expires_at<=?3 THEN excluded.generation ELSE generation END,
      expires_at=CASE WHEN expires_at<=?3 THEN excluded.expires_at ELSE expires_at END,
      attempts=CASE WHEN expires_at<=?3 THEN 1 ELSE attempts+1 END
    WHERE expires_at<=?3 OR attempts<3
    RETURNING generation,expires_at,attempts`).bind(accountId,crypto.randomUUID(),now,windowMs).first();
}

async function resetAttempts(db, accountId, generation) {
  await db.prepare('DELETE FROM password_attempt_windows WHERE account_id=? AND generation=?')
    .bind(accountId,generation).run();
}

export async function credentialsFor(db, identifier, byId = false) {
  const column=byId?'id':'email';
  return db.prepare(`SELECT a.id,a.name,a.owner,c.salt,c.verifier,c.version
    FROM accounts a JOIN password_credentials c ON c.account_id=a.id
    WHERE a.${column}=? AND a.active=1`).bind(identifier).first();
}

export async function verifyPassword(db, credentials, password, ctx) {
  if (!credentials) return {status:'invalid'};
  const pending = reserveAttempt(db,credentials.id);
  // Persist the reservation even if the client closes the page after submitting.
  ctx?.waitUntil(pending.then(()=>{},()=>{}));
  const attempt = await pending;
  if (!attempt) return {status:'blocked'};
  if (!validPassword(password)) return {status:'invalid'};
  const candidate=await derive(password,credentials.salt);
  if (!timingSafeEqual(candidate,bytes(credentials.verifier))) return {status:'invalid'};
  const current=await credentialsFor(db,credentials.id,true);
  if(!current||current.version!==credentials.version) return {status:'invalid'};
  await resetAttempts(db,credentials.id,attempt.generation);
  return {status:'verified',credential:current};
}

export async function enrolPassword(db, accountId, password) {
  const salt=randomHex(24);
  const verifier=hex(await derive(password,salt));
  return db.prepare(`INSERT INTO password_credentials (account_id,salt,verifier)
    SELECT ?,?,? FROM accounts WHERE id=? AND active=1
    ON CONFLICT(account_id) DO NOTHING RETURNING version`).bind(accountId,salt,verifier,accountId).first();
}

export async function changePassword(db, credential, password) {
  const salt=randomHex(24);
  const verifier=hex(await derive(password,salt));
  return db.prepare(`UPDATE password_credentials SET salt=?,verifier=?,version=version+1
    WHERE account_id=? AND version=? AND EXISTS(SELECT 1 FROM accounts WHERE id=? AND active=1)
    RETURNING version`).bind(salt,verifier,credential.id,credential.version,credential.id).first();
}

function storedToken(request) {
  const source=request.headers.get('Cookie') || '';
  if(source.length>16384) return null;
  const candidates=source.split(';').map(x=>x.trim()).filter(x=>x.startsWith(cookieName+'='));
  if(candidates.length!==1) return null;
  const token=candidates[0].slice(cookieName.length+1);
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function passwordSession(db, request) {
  const token=storedToken(request);
  if(!token) return null;
  const digest=await hashToken(token);
  const session=await db.prepare(`SELECT a.id,a.name,a.owner,s.token_hash,s.confirmed_at
    FROM password_sessions s JOIN accounts a ON a.id=s.account_id
    JOIN password_credentials c ON c.account_id=a.id AND c.version=s.credential_version
    WHERE s.token_hash=? AND s.expires_at>? AND a.active=1`).bind(digest,Date.now()).first();
  return session ? {...session,passwordSignIn:true} : null;
}

export async function startSession(db, accountId, version) {
  const token=randomHex(32);
  const digest=await hashToken(token);
  const now=Date.now();
  const result=await db.prepare(`INSERT INTO password_sessions (token_hash,account_id,credential_version,expires_at)
    SELECT ?,a.id,c.version,? FROM accounts a JOIN password_credentials c ON c.account_id=a.id
    WHERE a.id=? AND a.active=1 AND c.version=? RETURNING token_hash`)
    .bind(digest,now+sessionSeconds*1000,accountId,version).first();
  if(!result) return null;
  return cookieName+'='+token+'; Path=/; Max-Age='+sessionSeconds+'; Secure; HttpOnly; SameSite=Lax';
}

export async function confirmSession(db, session, version) {
  return db.prepare(`UPDATE password_sessions SET confirmed_at=? WHERE token_hash=? AND account_id=?
    AND credential_version=? AND expires_at>? AND EXISTS (
      SELECT 1 FROM password_credentials c JOIN accounts a ON a.id=c.account_id
      WHERE c.account_id=? AND c.version=? AND a.active=1
    ) RETURNING confirmed_at`).bind(Date.now(),session.token_hash,session.id,version,Date.now(),session.id,version).first();
}

export async function endSession(db, session) {
  if(session) await db.prepare('DELETE FROM password_sessions WHERE token_hash=?').bind(session.token_hash).run();
  return cookieName+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax';
}

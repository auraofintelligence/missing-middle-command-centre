const teamOrigin = /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/;
const keySets = new Map();
const decoder = new TextDecoder('utf-8', {fatal:true});

function decodePart(value) {
  if (!/^[\w-]+$/.test(value)) throw new Error('Malformed token');
  return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
}

async function signingKeys(issuer, refresh = false) {
  const existing = keySets.get(issuer);
  if (!refresh && existing && existing.until > Date.now()) return existing.keys;
  const response = await fetch(issuer + '/cdn-cgi/access/certs', {
    redirect:'error', signal:AbortSignal.timeout(4500)
  });
  if (!response.ok) throw new Error('Access keys unavailable');
  const {keys} = await response.json();
  if (!Array.isArray(keys)) throw new Error('Invalid key set');
  keySets.set(issuer,{keys,until:Date.now()+300000,loaded:Date.now()});
  return keys;
}

function accessToken(request) {
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (assertion !== null) return assertion;
  const cookies = request.headers.get('Cookie');
  if (!cookies || cookies.length > 65536) return null;
  const session = cookies.split(';').map(cookie => cookie.trim()).filter(cookie => cookie.startsWith('CF_Authorization='));
  return session.length === 1 ? session[0].slice('CF_Authorization='.length) : null;
}

export async function accessIdentity(request, env, reportFailure = () => {}) {
  const reject = reason => { reportFailure(reason); return null; };
  const token = accessToken(request);
  const issuer = env.ACCESS_ISSUER;
  if (!teamOrigin.test(issuer || '') || !env.ACCESS_AUD) return reject('configuration');
  if (!token) return reject('missing_session');
  if (token.length > 65536) return reject('malformed_session');
  const parts = token.split('.');
  if (parts.length !== 3) return reject('malformed_session');
  let stage = 'malformed_session';
  try {
    const [header, claims] = parts.slice(0,2).map(part => JSON.parse(decoder.decode(decodePart(part))));
    const now = Math.floor(Date.now()/1000);
    if (claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD)) return reject('wrong_application');
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' ||
        !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
        !Number.isSafeInteger(claims.iat) || claims.iat > now + 30 ||
        (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now)) ||
        claims.type !== 'app' || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 256 ||
        typeof claims.email !== 'string' || claims.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+$/.test(claims.email)) return reject('invalid_claims');
    stage = 'signing_keys_unavailable';
    const match = key => key.kid === header.kid && key.kty === 'RSA' && key.alg === 'RS256' && key.use === 'sig';
    let jwk = (await signingKeys(issuer)).find(match);
    if (!jwk && Date.now() - keySets.get(issuer).loaded > 30000) jwk = (await signingKeys(issuer,true)).find(match);
    if (!jwk) return reject('unknown_signing_key');
    stage = 'signature_failed';
    const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodePart(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return valid ? {subject:claims.sub,email:claims.email.toLowerCase()} : reject('signature_failed');
  } catch {
    return reject(stage);
  }
}

export async function accountFor(db, identity) {
  const select = db.prepare('SELECT id,name,owner FROM accounts WHERE subject=? AND email=? AND active=1');
  const current = await select.bind(identity.subject,identity.email).first();
  if (current) return current;
  await db.prepare('UPDATE accounts SET subject=? WHERE email=? AND subject IS NULL AND active=1')
    .bind(identity.subject,identity.email).run();
  return select.bind(identity.subject,identity.email).first();
}

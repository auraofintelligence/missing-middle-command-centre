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

export async function accessIdentity(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  const issuer = env.ACCESS_ISSUER;
  if (!token || token.length > 65536 || !teamOrigin.test(issuer || '') || !env.ACCESS_AUD) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const [header, claims] = parts.slice(0,2).map(part => JSON.parse(decoder.decode(decodePart(part))));
    const now = Math.floor(Date.now()/1000);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' ||
        claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD) ||
        !Number.isSafeInteger(claims.exp) || claims.exp <= now ||
        !Number.isSafeInteger(claims.iat) || claims.iat > now + 30 ||
        (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > now)) ||
        claims.type !== 'app' || typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 256 ||
        typeof claims.email !== 'string' || claims.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+$/.test(claims.email)) return null;
    const match = key => key.kid === header.kid && key.kty === 'RSA' && key.alg === 'RS256' && key.use === 'sig';
    let jwk = (await signingKeys(issuer)).find(match);
    if (!jwk && Date.now() - keySets.get(issuer).loaded > 30000) jwk = (await signingKeys(issuer,true)).find(match);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodePart(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return valid ? {subject:claims.sub,email:claims.email.toLowerCase()} : null;
  } catch {
    return null;
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

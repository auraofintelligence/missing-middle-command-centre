import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {test} from 'node:test';
import {accessIdentity,accountFor} from '../src/access.mjs';
import {readProject,readHistory,listProjects,saveProject,roleView} from '../src/projects.mjs';
import worker from '../src/worker.mjs';
import demo from '../src/demo.mjs';
import {validPassword,reserveAttempt,enrolPassword,passwordSession} from '../src/passwords.mjs';

function database() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_projects.sql','0002_password_accounts.sql']) {
    sqlite.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  }
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      const numbered = Array.from(sql.matchAll(/\?(\d+)/g),m=>Number(m[1]));
      return {
        bind(...params) {
          const bindings = numbered.length
            ? [Object.fromEntries(params.map((v,i)=>['?'+(i+1),v]))] : params;
          return {
            async first() { return statement.get(...bindings) ?? null; },
            async all() { return {results:statement.all(...bindings)}; },
            async run() { return {meta:statement.run(...bindings)}; }
          };
        }
      };
    }
  };
  return {db,sqlite};
}

const origin = 'https://command.example.com';
const owner = {id:'owner',name:'Owner',owner:1};
const editor = {id:'editor',name:'Project Officer',owner:0};
const auditor = {id:'auditor',name:'Auditor',owner:0};
const fullProject = {
  title:'Candidate pool',postcode:'4183',locality:'Example locality',host:'Example host',
  workload:'Training jobs',heat_use:'Pool',evidence:'Host feasibility notes',lead:'Programme officer',
  next_action:'Confirm heat demand',due_date:'2027-01-04',blocker:'',
  delivery:'Site brief',funding:'Researching',coop:'People interested'
};
function form(overrides={}, key=crypto.randomUUID()) {
  return new Request(origin+'/projects',{method:'POST',headers:{origin},body:new URLSearchParams({
    ...fullProject,reason:'Example evidence',request_key:key,version:'0',...overrides
  })});
}

test('project saves persist, keep signatures and reject stale or reused saves', async () => {
  const {db,sqlite} = database();
  sqlite.exec("INSERT INTO accounts (id,email,name,owner) VALUES ('owner','owner@example.com','Owner',1)");
  const key = crypto.randomUUID();
  const id = await saveProject(db,owner,null,null,form({},key));
  assert.equal(await saveProject(db,owner,null,null,form({},key)),id);
  await assert.rejects(saveProject(db,owner,null,null,form({title:'Duplicate'},key)),{status:409});
  await saveProject(db,owner,null,id,form({version:'1',reason:'Switch funding stage',funding:'Unassessed'}));
  await assert.rejects(saveProject(db,owner,null,id,form({version:'1'})),{status:409});
  assert.equal((await readProject(db,owner,null,id)).version,2);
  const history = await readHistory(db,owner,null,id,null);
  assert.equal(history[0].reason,'Switch funding stage');
  assert.equal(history[0].actor_name,'Owner');
  assert.equal(history[1].snapshot.funding,'Researching');
  assert.equal(history[0].snapshot.coop,'People interested');
  assert.equal((await listProjects(db,owner,null,'4183','')).length,1);
  await assert.rejects(saveProject(db,owner,null,null,form({host:''})),{status:422});
  await assert.rejects(saveProject(db,owner,{role:'Auditor',id},id,form({version:'2'})),{status:403});
});

test('a stable active account and project grant control reads, writes and history', async () => {
  const {db,sqlite} = database();
  sqlite.exec("INSERT INTO accounts (id,email,name,owner) VALUES ('owner','owner@example.com','Owner',1),('editor','edit@example.com','Project Officer',0),('auditor','audit@example.com','Auditor',0)");
  assert.equal((await accountFor(db,{email:'edit@example.com',subject:'actual'})).id,'editor');
  assert.equal(await accountFor(db,{email:'edit@example.com',subject:'unregistered'}),null);
  const id = await saveProject(db,owner,null,null,form());
  const other = await saveProject(db,owner,null,null,form({title:'Other project'}));
  sqlite.prepare('INSERT INTO project_grants (account_id,project_id,role) VALUES (?,?,?)').run(editor.id,id,'Project manager');
  sqlite.prepare('INSERT INTO project_grants (account_id,project_id,role) VALUES (?,?,?)').run(auditor.id,id,'Auditor');
  assert.equal((await readProject(db,editor,null,id)).id,id);
  await assert.rejects(readProject(db,editor,null,other),{status:404});
  assert.deepEqual(await readHistory(db,editor,null,other,null),[]);
  const preview = roleView(new URL(origin+'/?preview=Auditor&scope='+id),owner);
  assert.equal((await listProjects(db,owner,preview,'',''))[0].id,id);
  await assert.rejects(readProject(db,owner,preview,other),{status:404});
  await assert.rejects(saveProject(db,auditor,null,id,form({version:'1'})),{status:403});
  await saveProject(db,editor,null,id,form({version:'1',title:'Updated candidate'}));
  assert.equal((await readHistory(db,owner,null,id,null))[0].actor_name,'Project Officer');
  sqlite.prepare('UPDATE project_grants SET revoked_at=? WHERE account_id=?').run('2026-02-01',editor.id);
  await assert.rejects(readProject(db,editor,null,id),{status:404});
});

test('Access claims must match the trusted application and a valid signature', async t => {
  const pair = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const key = await crypto.subtle.exportKey('jwk',pair.publicKey);
  const issuer = 'https://test-identity.cloudflareaccess.com';
  const env = {ACCESS_ISSUER:issuer,ACCESS_AUD:'expected-audience'};
  const now = Math.floor(Date.now()/1000);
  t.mock.method(globalThis,'fetch', async (url,options) => {
    assert.equal(options.redirect,'manual');
    if (url === 'https://redirected-keys.cloudflareaccess.com/cdn-cgi/access/certs') {
      return Response.redirect(issuer+'/cdn-cgi/access/certs');
    }
    assert.equal(url,issuer+'/cdn-cgi/access/certs');
    return Response.json({keys:[{...key,kid:'test-key',use:'sig'}]});
  });
  const encode = obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
  async function request(claims={}) {
    const data = encode({alg:'RS256',kid:'test-key'})+'.'+encode({
      typ:'JWT',type:'app',iss:issuer,aud:[env.ACCESS_AUD],iat:now-60,
      nbf:now-60,exp:now+600,sub:'test-subject',email:'owner@example.com',...claims
    });
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(data));
    return new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':data+'.'+Buffer.from(signature).toString('base64url')}});
  }
  assert.equal((await accessIdentity(await request(),env)).subject,'test-subject');
  for (const claims of [{iss:'https://other.cloudflareaccess.com'},{exp:now-1},{aud:['different-app']},{type:'org'}]) {
    assert.equal(await accessIdentity(await request(claims),env),null);
  }
  const redirectedIssuer = 'https://redirected-keys.cloudflareaccess.com';
  let rejection;
  assert.equal(await accessIdentity(await request({iss:redirectedIssuer}),
    {...env,ACCESS_ISSUER:redirectedIssuer},reason => { rejection = reason; }),null);
  assert.equal(rejection,'signing_keys_unavailable');
  const token = (await request()).headers.get('Cf-Access-Jwt-Assertion');
  const cookie = value => new Request(origin,{headers:{Cookie:value}});
  assert.equal((await accessIdentity(cookie('preferences=on; CF_Authorization='+token),env)).subject,'test-subject');
  assert.equal(await accessIdentity(cookie('CF_Authorization='+token+'; CF_Authorization='+token),env),null);
  assert.equal(await accessIdentity(new Request(origin,{headers:{
    'Cf-Access-Jwt-Assertion':'invalid',
    Cookie:'CF_Authorization='+token
  }}),env),null);
  assert.equal(await accessIdentity(cookie('Unrelated_CF_Authorization='+token),env),null);
  const dot = token.lastIndexOf('.')+1;
  const corrupted = token.slice(0,dot)+(token[dot]==='A'?'B':'A')+token.slice(dot+1);
  assert.equal(await accessIdentity(new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':corrupted}}),env),null);
  const {db,sqlite}=database();
  sqlite.exec("INSERT INTO accounts (id,email,name,owner) VALUES ('owner','owner@example.com','Owner',1)");
  const appEnv={...env,DB:db,APP_HOST:'command.example.com'};
  assert.equal((await worker.fetch(await request(),appEnv)).status,200);
  assert.equal((await worker.fetch(cookie('CF_Authorization='+token),appEnv)).status,200);
  for (const path of ['/','/projects/new','/exports','/assets/app.js']) {
    assert.equal((await worker.fetch(new Request(origin+path),appEnv)).status,401);
  }
  assert.equal((await worker.fetch(new Request('https://alternate.example.com/'),appEnv)).status,404);
});

test('fictional demo has no write or export route',async () => {
  const start = demo.fetch(new Request(origin));
  assert.match(await start.text(),/Wattle Reach Aquatic Centre/);
  assert.equal(demo.fetch(new Request(origin+'/projects',{method:'POST'})).status,405);
  assert.equal(demo.fetch(new Request(origin+'/exports')).status,404);
});

test('Unicode passwords preserve boundary spaces and count code points',()=>{
  for (const value of [' ','  é  ','🔑'.repeat(128)]) assert.equal(validPassword(value),true);
  for (const value of ['',null,'🔑'.repeat(129),'\ud800']) assert.equal(validPassword(value),false);
});

test('abandoned attempts occupy three shared slots and blocked requests do not extend the window',async ()=>{
  const {db,sqlite}=database();
  sqlite.exec("INSERT INTO accounts (id,email,name,owner) VALUES ('owner','owner@example.com','Owner',1),('other','other@example.com','Other',0)");
  const start=1_000_000, duration=900_000;
  const attempts=await Promise.all(Array.from({length:5},()=>reserveAttempt(db,'owner',start)));
  assert.equal(attempts.filter(Boolean).length,3);
  assert.equal((await reserveAttempt(db,'other',start)).attempts,1);
  assert.equal(await reserveAttempt(db,'owner',start+duration-1),null);
  const next=await reserveAttempt(db,'owner',start+duration);
  assert.equal(next.attempts,1);
  assert.equal(next.expires_at,start+2*duration);
});

test('sign-in and confirmation share attempts and use a revocable session',async ()=>{
  const {db,sqlite}=database();
  sqlite.exec("INSERT INTO accounts (id,email,name,owner) VALUES ('owner','owner@example.com','Owner',1)");
  const password='  a 🔑  ';
  assert.equal((await enrolPassword(db,'owner',password)).version,1);
  const env={APP_HOST:'command.example.com',ACCESS_ISSUER:'https://team.cloudflareaccess.com',ACCESS_AUD:'app',PASSWORD_AUTH:'enabled',DB:db};
  const request=(route,values,cookie)=>new Request(origin+route,values?{
    method:'POST',headers:{origin,...(cookie?{cookie}:{})},body:new URLSearchParams(values)
  }:{headers:cookie?{cookie}:{}});
  const login=value=>worker.fetch(request('/account/login',{email:'owner@example.com',password:value}),env);
  assert.equal((await worker.fetch(request('/'),env)).headers.get('Location'),'/account/login');
  const page=await worker.fetch(request('/account/login'),env);
  assert.equal(page.headers.get('Referrer-Policy'),'same-origin');
  for (const invalidOrigin of [null,'null','https://elsewhere.example']) {
    const post=new Request(origin+'/account/login',{
      method:'POST',
      headers:invalidOrigin===null?{}:{Origin:invalidOrigin},
      body:new URLSearchParams({email:'owner@example.com',password})
    });
    assert.equal((await worker.fetch(post,env)).status,403);
  }
  assert.match(page.headers.get('Content-Security-Policy'),/script-src 'nonce-/);
  assert.match(await page.text(),/aria-label="Show password"/);
  assert.equal((await login(password.trim())).status,401);
  const signedIn=await login(password);
  assert.equal(signedIn.status,303);
  const cookie=signedIn.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await passwordSession(db,request('/',null,cookie))).id,'owner');
  assert.equal((await worker.fetch(request('/',null,cookie),env)).status,200);
  assert.equal((await worker.fetch(request('/account/confirm',{password:'wrong'},cookie),env)).status,401);
  assert.equal((await login('wrong from another device')).status,401);
  assert.equal((await worker.fetch(request('/account/password',{password:'wrong again'},cookie),env)).status,401);
  assert.equal((await worker.fetch(request('/account/confirm',{password},cookie),env)).status,429);
  assert.equal((await worker.fetch(request('/account/sign-out',{},cookie),env)).status,303);
  assert.equal(await passwordSession(db,request('/',null,cookie)),null);
});

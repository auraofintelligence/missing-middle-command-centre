import {accessIdentity,accountFor} from './access.mjs';
import {formValues,Problem} from './projects.mjs';
import {validPassword,credentialsFor,verifyPassword,enrolPassword,changePassword,startSession,
  confirmSession,endSession} from './passwords.mjs';

const forms={
  '/account/login':['Sign in','Use the password you chose for the command centre.'],
  '/account/setup':['Choose your password','Choose something memorable. You can include spaces.'],
  '/account/password':['Change password','Enter your current password and choose your new one.'],
  '/account/confirm':['Confirm your password','Enter your current password to verify it’s you.']
};
const eye='<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/><path class="strike" d="M4 4l16 16"/></svg>';
const toggleScript=`for (const button of document.querySelectorAll("[data-password]")) {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.password);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.setAttribute("aria-pressed", String(show));
    const label = (show ? "Hide " : "Show ") + button.dataset.field;
    button.setAttribute("aria-label", label);
    button.title = label;
  });
}`;
function field(name,label,autocomplete) {
  const fieldName=label.toLowerCase();
  return `<label for="${name}">${label}</label><div class="password-input">
    <input id="${name}" name="${name}" type="password" autocomplete="${autocomplete}"
      autocapitalize="off" spellcheck="false" required>
    <button type="button" aria-controls="${name}" aria-pressed="false"
      aria-label="Show ${fieldName}" title="Show ${fieldName}"
      data-password="${name}" data-field="${fieldName}">${eye}</button></div>`;
}
function settings(message='') {
  return `<section class="card">${message?'<p role="status">'+message+'</p>':''}
    <p><a href="/account/password">Change password</a></p>
    <p><a href="/account/confirm">Confirm password</a></p>
    <form method="post" action="/account/sign-out"><button>Sign out</button></form></section>`;
}
export function accountPage(render,path,{message='',status=200,account=null}={}) {
  const [title,description]=forms[path]??['Your account','Manage your password and current session.'];
  if(!forms[path]) return render(title,description,settings(message),status,account);
  const login=path==='/account/login';
  const setup=path==='/account/setup';
  const change=path==='/account/password';
  const nonce=crypto.randomUUID().replaceAll('-','');
  const currentField=setup?'':field('password',change?'Current password':'Password','current-password');
  const newFields=setup||change?field('new_password','New password','new-password')+
    field('repeat_password','Repeat new password','new-password')+
    '<small>Up to 128 characters. Spaces at the start and end are kept.</small>':'';
  const email=login?'<label for="email">Email</label><input id="email" type="email" name="email" autocomplete="username" maxlength="254" required>':'';
  const action=login?'Sign in':setup?'Set password':change?'Save password':'Confirm password';
  const link=login?'<p><a href="/account/setup">Set up your password</a></p>':'';
  const body=`<style>
  .password-input{position:relative;margin-bottom:.8rem}.password-input input{padding-right:3.4rem}
  .password-input button{position:absolute;top:50%;right:.28rem;transform:translateY(-50%);
    padding:.38rem;background:white;color:var(--navy);border:0;display:grid;place-items:center}
  .password-input button[aria-pressed=false] .strike{display:none}
  .account-form{max-width:33rem}.account-form>input{margin-bottom:.8rem}
  </style><section class="card account-form">
  ${message?'<p class="notice" role="alert">'+message+'</p>':''}
  <form method="post" action="${path}">${email}${currentField}${newFields}
  <div class="controls"><button>${action}</button></div></form>${link}</section>
  <script nonce="${nonce}">${toggleScript}</script>`;
  return render(title,description,body,status,account,nonce);
}

function redirect(location,cookie) {
  const headers={Location:location,'Cache-Control':'private, no-store'};
  if(cookie) headers['Set-Cookie']=cookie;
  return new Response(null,{status:303,headers});
}
const mismatch='The new passwords must match exactly.';
const invalidNew='Choose a password of 1 to 128 Unicode characters.';
const locked='Three attempts were started. Wait until the 15-minute window ends.';
const loginFailed='Sign-in failed. After three attempts, wait for the 15-minute window to end.';

function newPassword(values) {
  const pass=values.get('new_password');
  return {pass,problem:!validPassword(pass)?invalidNew:pass!==values.get('repeat_password')?mismatch:null};
}

export async function accountRoute(request,env,ctx,session,render) {
  const path=new URL(request.url).pathname, db=env.DB;
  const display=(message='',status=200,account=session)=>accountPage(render,path,{message,status,account});
  if(!['GET','HEAD','POST'].includes(request.method)) throw new Problem(405,'Method not allowed.');
  const read=request.method!=='POST';
  if(path==='/account/login') {
    if(session) return redirect('/');
    if(read) return display();
    const values=await formValues(request);
    const email=(values.get('email')??'').trim().toLowerCase();
    const credential=email.length<=254?await credentialsFor(db,email):null;
    const result=await verifyPassword(db,credential,values.get('password'),ctx);
    if(result.status!=='verified') return display(loginFailed,401);
    const cookie=await startSession(db,credential.id,credential.version);
    return cookie?redirect('/',cookie):display(loginFailed,401);
  }
  if(path==='/account/setup') {
    const identity=await accessIdentity(request,env);
    const account=identity?await accountFor(db,identity):null;
    if(!account) throw new Problem(403,'Sign in to Cloudflare to set up your workspace password.');
    if(await credentialsFor(db,account.id,true)) return redirect('/account/login');
    if(read) return display('',200,null);
    const values=await formValues(request);
    const {pass,problem}=newPassword(values);
    if(problem) return display(problem,422,null);
    const saved=await enrolPassword(db,account.id,pass);
    if(!saved) return redirect('/account/login');
    const cookie=await startSession(db,account.id,saved.version);
    return redirect(cookie?'/':'/account/login',cookie);
  }
  if(!session) return redirect('/account/login');
  if(path==='/account/sign-out') {
    if(read) throw new Problem(405,'Use the sign-out button.');
    await formValues(request);
    return redirect('/account/login',await endSession(db,session));
  }
  if(path==='/account') {
    if(!read) throw new Problem(405,'Method not allowed.');
    return display(new URL(request.url).searchParams.get('confirmed')==='1'?'Password confirmed.':'');
  }
  if(!['/account/confirm','/account/password'].includes(path)) throw new Problem(404,'Account page not found.');
  if(read) return display();
  const values=await formValues(request);
  const credential=await credentialsFor(db,session.id,true);
  const verified=await verifyPassword(db,credential,values.get('password'),ctx);
  if(verified.status==='blocked') return display(locked,429);
  if(verified.status!=='verified') return display('The current password did not match.',401);
  if(path==='/account/confirm') {
    const confirmed=await confirmSession(db,session,credential.version);
    return redirect(confirmed?'/account?confirmed=1':'/account/login');
  }
  const {pass,problem}=newPassword(values);
  if(problem) return display(problem,422);
  const changed=await changePassword(db,credential,pass);
  if(!changed) return redirect('/account/login');
  const cookie=await startSession(db,session.id,changed.version);
  return redirect(cookie?'/account':'/account/login',cookie);
}

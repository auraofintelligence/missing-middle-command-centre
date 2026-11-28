import {accessIdentity,accountFor} from './access.mjs';
import {accountRoute} from './account.mjs';
import {passwordSession} from './passwords.mjs';
import {Problem,roleView,listProjects,readProject,readHistory,canEdit,saveProject} from './projects.mjs';
import {desks,page,portfolio,detail,editor,projectUrl} from './views.mjs';

export const headers = {
  'Cache-Control':'private, no-store',
  'Content-Type':'text/html; charset=utf-8',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex, nofollow'
};
export function html(body,status=200,nonce) {
  const responseHeaders=nonce?{...headers,'Content-Security-Policy':headers['Content-Security-Policy']+"; script-src 'nonce-"+nonce+"'"}:headers;
  return new Response(body,{status,headers:responseHeaders});
}
function failure(status,message) {
  return new Response(message,{status,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}});
}

const projectPath = /^\/projects\/([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})(\/edit)?$/;

export default {
  async fetch(request,env,ctx) {
    const url = new URL(request.url);
    if (!env.APP_HOST || url.host !== env.APP_HOST || url.protocol !== 'https:') return failure(404,'Workspace not found.');
    if (!env.DB || !env.ACCESS_ISSUER || !env.ACCESS_AUD) return failure(503,'Workspace setup is incomplete.');
    try {
      let account;
      if (env.PASSWORD_AUTH==='enabled') {
        const session=await passwordSession(env.DB,request);
        if (url.pathname==='/account'||url.pathname.startsWith('/account/')) {
          if (request.method==='POST' && (url.searchParams.has('preview')||url.searchParams.has('scope'))) return failure(403,'Role preview is view only.');
          const renderAccount=(title,description,body,status,identity,nonce)=>
            html(page({title,description,body,account:identity}),status,nonce);
          return await accountRoute(request,env,ctx,session,renderAccount);
        }
        if(!session) return new Response(null,{status:303,headers:{...headers,Location:'/account/login'}});
        account=session;
      } else {
        let sessionIssue;
        const identity = await accessIdentity(request,env,reason => { sessionIssue = reason; });
        if (!identity) {
          console.warn('Command centre Access verification',sessionIssue);
          return html(page({
            title:'Sign-in needed',
            description:sessionIssue === 'missing_session'
              ? 'The workspace did not receive a Cloudflare Access session.'
              : 'The workspace could not verify your Cloudflare Access session.',
            body:'<section class="card"><p>Open the workspace in the browser where you’re signed in to Cloudflare.</p><a class="button" href="/">Open workspace</a></section>'
          }),401);
        }
        account = await accountFor(env.DB,identity);
        if (!account) return failure(403,'This account does not have workspace access.');
      }
      const preview = roleView(url,account);
      const requestedDesk = url.searchParams.get('desk');
      const desk = Object.hasOwn(desks,requestedDesk) ? requestedDesk : 'programme';
      if (desk==='webmaster' && !account.owner) return failure(404,'Workspace not found.');
      const query = (url.searchParams.get('q') ?? '').trim().slice(0,100);
      const cursor = (url.searchParams.get('cursor') ?? '').slice(0,80);
      const options = {account,preview,desk,query,cursor};
      const render = (title,description,body,status) => html(page({...options,title,description,body}),status);
      const match = projectPath.exec(url.pathname);
      const id = match?.[1];
      const editing = Boolean(match?.[2]);
      const newProject = url.pathname === '/projects/new';
      if (request.method==='POST') {
        if (preview) return failure(403,'Role preview is view only.');
        if (url.pathname!=='/projects' && (!id||editing)) return failure(404,'Workspace not found.');
        try {
          const saved = await saveProject(env.DB,account,preview,id,request);
          return new Response(null,{status:303,headers:{...headers,Location:projectUrl(saved,desk,null,query,cursor)}});
        } catch (error) {
          if (error instanceof Problem && error.values) {
            const project = id ? await readProject(env.DB,account,preview,id) : null;
            if (project && String(project.version)!==error.values.get('version')) {
              return failure(409,'Someone has saved a newer version. Open the project and review those changes.');
            }
            return render(project?'Edit project':'New project','Record the evidence and the next action.',
              editor(project,{...options,warning:error.message,values:error.values}),422);
          }
          throw error;
        }
      }
      if (!['GET','HEAD'].includes(request.method)) return failure(405,'Method not allowed.');
      if (url.pathname==='/') {
        const projects = await listProjects(env.DB,account,preview,query,cursor);
        return render(...desks[desk],portfolio(projects,{...options,signOut:desk==='webmaster'&&!preview}));
      }
      if (newProject) {
        if (!account.owner || preview) return failure(403,'Project creation is unavailable in this view.');
        return render('New project','Record a candidate locality, supporting research and who owns the next action.',editor(null,options));
      }
      if (id) {
        const project = await readProject(env.DB,account,preview,id);
        const canWrite = await canEdit(env.DB,account,preview,id);
        if (editing) {
          if (!canWrite) return failure(403,'Project editing is unavailable in this view.');
          return render('Edit project','Save a signed change to the shared project record.',editor(project,options));
        }
        const v = Number(url.searchParams.get('before'));
        const before = Number.isSafeInteger(v) && v>0 ? v : null;
        const history = await readHistory(env.DB,account,preview,id,before);
        return render(project.title,project.locality+' · '+project.postcode,
          detail(project,history,{...options,canWrite,before}));
      }
      return failure(404,'Workspace not found.');
    } catch (error) {
      if (error instanceof Problem) return failure(error.status,error.message);
      console.error('Command centre request failed',error?.name ?? 'Error');
      return failure(500,'The workspace could not complete this request.');
    }
  }
};

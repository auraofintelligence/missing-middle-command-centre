import {accessIdentity,accountFor} from './access.mjs';
import {accountRoute} from './account.mjs';
import {passwordSession} from './passwords.mjs';
import {Problem,roleView,listProjects,readProject,readHistory,canEdit,saveProject,projectChoices} from './projects.mjs';
import {desks,page,detail,editor,projectUrl} from './views.mjs';
import {tools,forDesk} from './desk-tools.mjs';
import {listDeskRecords,getDeskRecord,deskHistory,deskCounts,saveDeskRecord} from './desk-records.mjs';
import {workspace,recordPage,recordEditor,recordLink,projectTools,validId,validMonth,currentMonth} from './workspace.mjs';

export const headers = {
  'Cache-Control':'private, no-store',
  'Content-Type':'text/html; charset=utf-8',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options':'nosniff',
  // Native same-origin POSTs need their Origin header for form validation.
  'Referrer-Policy':'same-origin',
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
      const requestedProject=url.searchParams.get('project')||'';
      const project=requestedProject||preview?.id||'';
      if(project&&!validId(project))return failure(404,'Project not found.');
      const requestedTool=url.searchParams.get('tool')||'';
      const monthFilter=url.searchParams.get('month')||'';
      const month=validMonth(monthFilter)?monthFilter:currentMonth();
      const options={account,preview,desk,query,cursor,project,month};
      const render=(title,description,body,status)=>html(page({...options,title,description,body}),status);
      if(url.pathname.startsWith('/tools/')||url.pathname.startsWith('/records/')){
        return await recordRoute(request,env.DB,url,options);
      }
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
        const scoped=project?await readProject(env.DB,account,preview,project):null;
        const [choices,writable]=await Promise.all([
          projectChoices(env.DB,account,preview),
          preview?[]:projectChoices(env.DB,account,null,true)
        ]);
        if(scoped&&!choices.some(item=>item.id===scoped.id))choices.unshift(scoped);
        const showContacts=!preview&&Boolean(account.owner||writable.length);
        const allowed=forDesk(desk).filter(k=>k!=='contact'||showContacts);
        const tool=allowed.includes(requestedTool)?requestedTool:desk==='programme'?'':allowed[0];
        const offset=/^\d{1,6}$/.test(cursor)&&tool?Number(cursor):0;
        const o={...options,tool,projectChoices:choices,showContacts,offset,
          canCreateRecord:!preview&&(project?writable.some(p=>p.id===project):writable.length>0)};
        const overview=desk==='programme'&&!tool;
        const [projects,records,counts,milestones]=await Promise.all([
          overview?listProjects(env.DB,account,project?{id:project}:preview,query,cursor):[],
          overview?[]:listDeskRecords(env.DB,account,preview,{kind:tool,project,query,offset,
            month:tool==='calendar'?month:'',limit:tool==='calendar'?150:25}),
          deskCounts(env.DB,account,preview,project,query),
          overview?listDeskRecords(env.DB,account,preview,{kind:'milestone',project,query,limit:50}):[]
        ]);
        const [title,description]=desks[desk];
        return html(page({...o,title,description,context:scoped?scoped.title+' · '+scoped.postcode:'',
          body:workspace(o,{projects,records,counts,milestones})}));
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
        const counts=await deskCounts(env.DB,account,preview,id);
        return render(project.title,project.locality+' · '+project.postcode,
          detail(project,history,{...options,canWrite,before,
            more:projectTools(project,counts,{...options,showContacts:!preview&&canWrite})}));
      }
      return failure(404,'Workspace not found.');
    } catch (error) {
      if (error instanceof Problem) return failure(error.status,error.message);
      console.error('Command centre request failed',error?.name ?? 'Error');
      return failure(500,'The workspace could not complete this request.');
    }
  }
};

async function recordRoute(request,db,url,o){
  const {account,preview}=o;
  const newMatch=/^\/tools\/([a-z_]+)\/new$/.exec(url.pathname);
  const viewMatch=/^\/records\/([a-f0-9-]+)(\/edit)?$/.exec(url.pathname);
  if(!newMatch&&!viewMatch)throw new Problem(404,'Tool not found.');
  const id=viewMatch?.[1];
  const record=id?await getDeskRecord(db,account,preview,id):null;
  const kind=record?.kind??newMatch?.[1];
  if(!Object.hasOwn(tools,kind))throw new Problem(404,'Tool not found.');
  const [desk,title,description]=tools[kind];
  const project=record?.project_id||o.project;
  o={...o,desk,tool:kind,project};
  const target=project?await readProject(db,account,preview,project):null;
  const canWrite=Boolean(project&&await canEdit(db,account,preview,project));
  const render=(label,body,status=200)=>html(page({...o,title:label,description,
    context:target?.title,body}),status);
  if(!['GET','HEAD','POST'].includes(request.method))throw new Problem(405,'Method not allowed.');
  if(viewMatch&&!viewMatch[2]){
    if(request.method==='POST')throw new Problem(405,'Use the edit form to save changes.');
    const n=Number(url.searchParams.get('before'));
    const before=Number.isSafeInteger(n)&&n>0?n:null;
    const history=await deskHistory(db,account,preview,id,before);
    return render(record.title,recordPage(record,history,{...o,canWrite}));
  }
  if(preview||project&&!canWrite)throw new Problem(403,'Project editing is unavailable in this view.');
  const label=record?'Edit '+record.title:'New record · '+title;
  if(!project){
    if(request.method==='POST')throw new Problem(400,'Choose a project before saving.');
    const choices=await projectChoices(db,account,null,true);
    return render(label,recordEditor(kind,{...o,projectChoices:choices}));
  }
  const relatedKinds=tools[kind][4].flatMap(field=>field.kinds||[]);
  const related=async ()=> (await Promise.all(relatedKinds.map(k=>listDeskRecords(db,account,null,{project,kind:k,limit:100})))).flat();
  if(request.method==='POST'){
    try{
      const saved=await saveDeskRecord(db,account,preview,{kind,project,id},request);
      return new Response(null,{status:303,headers:{...headers,Location:recordLink({id:saved},o)}});
    }catch(error){
      if(!(error instanceof Problem&&error.values))throw error;
      const fresh=id?await getDeskRecord(db,account,null,id):null;
      if(fresh&&String(fresh.version)!==error.values.get('version'))throw new Problem(409,'Someone saved a newer version. Open the record before editing.');
      return render(label,recordEditor(kind,o,{record:fresh,related:await related(),values:error.values,warning:error.message}),422);
    }
  }
  return render(label,recordEditor(kind,o,{record,related:await related()}));
}

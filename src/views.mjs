import {brandHead,brandLogo} from './brand.mjs';
import {fields,stages} from './projects.mjs';

export const desks = {
  programme:['Programme','Find projects, check what is blocked and see who owns the next action.'],
  places:['Places and outreach','Follow postcode research, localities and potential hosts.'],
  sites:['Sites and delivery','Build site briefs around workloads, host constraints and useful heat.'],
  funding:['Funding and finance','Track the funding stage alongside delivery and co-op readiness.'],
  coops:['Co-ops and handover','Review local readiness as the site moves forward.'],
  media:['Media and CMS','Use project milestones as context for future editorial work.'],
  records:['Records and decisions','Read the signed change history on each project.'],
  operations:['Continuing operations','Review project blockers and upcoming responsibilities.'],
  webmaster:['Webmaster','Inspect the workspace through a read-only project scope.']
};

export const deskOrder=Object.keys(desks);
export const deskSpriteUrl='https://raw.githubusercontent.com/auraofintelligence/missing-middle-command-centre/main/assets/desk-sprites.png';
export function sprite(desk) {
  const index=deskOrder.indexOf(desk);
  return index<0?'':`<span class="desk-sprite" style="--sx:${index%3*50}%;--sy:${Math.floor(index/3)*50}%" aria-hidden="true"></span>`;
}

const css = `
:root{--navy:#183344;--paper:#f4f7f6;--mint:#bfe8d9;--ink:#183344;--gold:#f5c75d;--line:#cedbd8;--muted:#45606b}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:1rem/1.55 system-ui,sans-serif}
a{color:#185c64;text-underline-offset:.2em}
a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid #00706b;outline-offset:3px}
header{background:var(--navy);color:white;padding:1rem max(1rem,calc((100vw - 84rem)/2));display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap}
header a{color:var(--mint);font-weight:750}
.brand{display:flex;align-items:center;gap:.75rem}
.brand-mark{display:block;width:2.3rem;height:2.3rem;flex:none;border-radius:.48rem}
.shell{max-width:84rem;margin:auto;display:grid;grid-template-columns:minmax(11rem,15rem) 1fr;gap:1.5rem;padding:1.5rem 1rem 3rem}
nav{position:sticky;top:1rem;align-self:start}
nav a{display:block;padding:.48rem .7rem;border-radius:.45rem;margin-bottom:.15rem;text-decoration:none}
nav a[aria-current]{background:var(--navy);color:white;font-weight:700}
nav h2{font-size:.95rem;padding-left:.7rem}
main{min-width:0}
.hero{background:var(--navy);color:white;border-radius:.8rem;padding:clamp(1.15rem,4vw,2.4rem);box-shadow:inset 0 4px var(--gold);margin-bottom:1.3rem}
.hero p{margin:0;max-width:70ch;color:var(--mint)}
h1{font-size:clamp(1.85rem,4vw,2.85rem);line-height:1.12;margin:0 0 .65rem}
h2{margin:.1rem 0 .55rem;font-size:1.35rem}
h3{margin:0 0 .5rem}
p{margin:.4rem 0 .95rem}
.card,.notice{background:white;border:1px solid var(--line);border-radius:.7rem;padding:1rem;margin:1rem 0;overflow-wrap:anywhere}
.notice{border-left:5px solid #ad7200}
.cards,.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.cards .card{margin:0}
.tracks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem;margin:.95rem 0}
.tracks span{padding:.45rem;background:#e9f4ef;border-radius:.35rem;font-size:.9rem}
.tracks b{display:block}
.controls{display:flex;align-items:end;flex-wrap:wrap;gap:.6rem;margin:1rem 0}
.controls form{display:flex;align-items:end;gap:.45rem;flex-wrap:wrap}
label{display:block;font-weight:650}
input,select,textarea{display:block;width:100%;font:inherit;padding:.55rem .65rem;margin-top:.2rem;border:1px solid #8ca6a9;border-radius:.35rem;color:var(--ink);background:white}
textarea{resize:vertical;min-height:5rem}
.wide{grid-column:1/-1}
.button,button{display:inline-block;padding:.55rem .8rem;border:1px solid var(--navy);border-radius:.45rem;background:var(--navy);color:white;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
.button.secondary{background:white;color:var(--navy)}
.muted,small,dt{color:var(--muted)}
dl{display:grid;grid-template-columns:minmax(8rem,1fr) 3fr;gap:.4rem .8rem;margin:.8rem 0}
dt{font-weight:650}
dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
summary{cursor:pointer;font-weight:650;padding:.45rem 0}
footer{max-width:84rem;margin:auto;padding:0 1rem 1.5rem;color:var(--muted)}

:root{--surface:#fff;--navwash:#eaf2ef;--sea:#065f62;--tint:#e3f4ec}
.shell{grid-template-columns:minmax(12rem,15rem) minmax(0,1fr);gap:clamp(1rem,3vw,2.25rem);padding-top:2rem}
.desk-nav{background:var(--surface);border:1px solid var(--line);border-radius:.9rem;padding:.7rem;box-shadow:0 8px 28px #1735430b}
.desk-nav a{min-height:2.75rem;display:flex;align-items:center;gap:.55rem;font-size:.87rem;line-height:1.2;border:1px solid transparent}
.desk-nav a:hover{background:var(--navwash);color:var(--navy)}
.desk-nav a[aria-current=page]{background:var(--navy);color:white;border-color:var(--navy)}
.desk-nav h2{padding:.25rem .55rem .4rem}
.desk-sprite{display:inline-block;width:2rem;height:2rem;flex:none;background:#edf3ee url('${deskSpriteUrl}') var(--sx) var(--sy)/300% 300% no-repeat;border-radius:.45rem}
.hero.workspace{display:flex;justify-content:space-between;align-items:center;gap:1.25rem;position:relative;overflow:hidden;padding:clamp(1.2rem,4vw,2.5rem)}
.hero.workspace .desk-sprite{width:clamp(4.8rem,12vw,9rem);height:clamp(4.8rem,12vw,9rem);border-radius:1rem;border:3px solid var(--mint);box-shadow:0 8px 35px #0003}
.hero .workspace-context{margin-top:.8rem;color:#fff;font-size:.91rem}
.hero a{color:var(--mint)}
.overview-grid,.tool-grid,.stat-grid{display:grid;gap:.8rem;grid-template-columns:repeat(auto-fit,minmax(min(11.9rem,100%),1fr))}
.overview-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.tile,.stat{border:1px solid var(--line);border-radius:.72rem;background:var(--surface);padding:.95rem;color:var(--ink)}
.tile{display:block;text-decoration:none;border-top:3px solid #78a99c}
.tile:hover{border-color:var(--sea);box-shadow:0 6px 17px #18334417}
.tile[aria-current]{border-color:var(--sea);border-top:3px solid var(--sea);background:var(--tint)}
.tile h3{font-size:1rem;margin:.35rem 0}.tile p{font-size:.87rem;color:var(--muted);margin:0}
.tile-head{display:flex;align-items:center;justify-content:space-between;gap:.5rem}.tile-head .desk-sprite{width:3.4rem;height:3.4rem}
.tool-sprite{display:inline-block;width:2.7rem;height:2.7rem;flex:none;border-radius:.45rem;background:#edf3ee url('https://raw.githubusercontent.com/auraofintelligence/missing-middle-command-centre/main/assets/tool-sprites.png') var(--sx) var(--sy)/400% 400% no-repeat}
.tool-label{display:flex;align-items:center;gap:.45rem}
.stat strong{display:block;font-size:1.6rem;line-height:1.2}.stat span{color:var(--muted);font-size:.92rem}
.desk-section{background:var(--surface);border:1px solid var(--line);border-radius:.9rem;margin:1.3rem 0;overflow:hidden}
.section-heading{background:var(--navwash);padding:1rem 1.15rem;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:.8rem;flex-wrap:wrap}
.section-heading h2,.section-heading p{margin:0}.section-heading p{font-size:.9rem;color:var(--muted)}.section-body{padding:1.05rem 1.15rem}
.status-pill{display:inline-block;border-radius:1rem;padding:.15rem .52rem;background:var(--tint);font-weight:700;font-size:.78rem;color:#1c534c}
.status-pill.attention{background:#f9ecd0;color:#704800}.status-pill.done{background:#e0ecf9;color:#224669}
.record-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr));gap:.8rem}
.record-tile{padding:.85rem;border:1px solid var(--line);border-radius:.65rem;overflow-wrap:anywhere}.record-tile h3{font-size:1.05rem}
.record-tile p{font-size:.91rem;margin:.4rem 0}.record-tile .meta{font-size:.81rem;color:var(--muted)}
.context-bar{display:flex;align-items:end;gap:.6rem;flex-wrap:wrap;margin:.15rem 0 1.2rem}.context-bar label{min-width:min(12rem,100%);flex:1}.context-bar button{white-space:nowrap}
.empty-state{border:1px dashed #97b1aa;border-radius:.6rem;padding:1rem;background:#f7fbf8}.empty-state p{margin:.2rem 0 .65rem}
.month-nav{display:flex;align-items:center;justify-content:space-between;gap:.6rem;margin-bottom:.8rem}
.month-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.weekday{font-weight:700;text-align:center;font-size:.82rem;color:var(--muted)}
.day{min-height:4.4rem;border:1px solid var(--line);padding:.2rem .33rem;border-radius:.3rem;font-size:.82rem}
.day.has-entries{background:#eaf5ef;border-color:#94bcb1}.day a{display:block;font-size:.76rem;line-height:1.25;overflow-wrap:anywhere;padding:.15rem 0}
.workspace-note{color:var(--muted);font-size:.87rem;margin:.6rem 0 0}
.preview-link{display:inline-block;margin:.3rem 0 .25rem .5rem;font-size:.82rem}
@media(max-width:940px){.overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:510px){.overview-grid{grid-template-columns:1fr}.month-grid{display:none}.hero.workspace{gap:.45rem}.section-heading,.section-body{padding:.8rem}}
@media(max-width:760px){.shell{display:block}nav{position:static;margin-bottom:1rem}nav h2{padding:0}nav div{display:flex;flex-wrap:wrap;gap:.2rem}nav a{padding:.3rem .45rem;font-size:.9rem}.desk-nav{padding:.55rem}.desk-nav a{min-height:2.15rem}.desk-nav .desk-sprite{width:1.35rem;height:1.35rem}.cards{grid-template-columns:1fr}}
@media(max-width:420px){.fields,dl{grid-template-columns:1fr}.tracks{grid-template-columns:1fr}dd{margin-bottom:.35rem}}
`;

export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const required = ['title','postcode','locality','evidence','lead','next_action'];
const long = ['workload','heat_use','evidence','next_action','blocker'];
export const q = (options) => {
  const params = new URLSearchParams();
  for (const [key,value] of Object.entries(options)) if (value) params.set(key,value);
  return params.size ? '?'+params : '';
};
export const toAU = date => date ? new Intl.DateTimeFormat('en-AU',{dateStyle:'medium',timeStyle:'short',timeZone:'Australia/Brisbane'}).format(new Date(date))+' AEST' : '';
export const packPreview = preview => preview ? {preview:preview.role,scope:preview.id} : {};
export function deskUrl(desk, preview, query, cursor, project, tool, month) { return '/' + q({desk,...packPreview(preview),q:query,cursor,project,tool,month}); }
export function projectUrl(id, desk, preview, query, cursor, before) {
  return '/projects/' + id + q({desk,...packPreview(preview),q:query,cursor,before});
}

export function page({title,description,desk,preview,account,demo=false,body,project,context}) {
  const visibleDesks = account||demo ? Object.entries(desks).filter(([key])=>key!=='webmaster'||account?.owner||demo) : [];
  const navigation = visibleDesks.map(([key,[name]])=>`<a href="${escape(deskUrl(key,preview,null,null,project))}"${key===desk?' aria-current="page"':''}>${sprite(key)}${name}</a>`).join('');
  const notice = demo ? '<aside class="notice">Fictional demonstration. Records are view only.</aside>' : preview ?
    `<aside class="notice"><strong>Role preview</strong> · ${escape(preview.role)} · View only · Signed in as ${escape(account.name)}. <a href="/?desk=webmaster">Return to Webmaster</a></aside>` : '';
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex, nofollow">${brandHead}<title>${escape(title)} | Missing Middle</title><style>${css}</style></head>
  <body id="top"><header><div class="brand"><img class="brand-mark" src="${brandLogo}" width="38" height="38" alt=""><a href="${escape(deskUrl('programme',preview))}">Missing Middle Command Centre</a></div>
  <span>${demo?'Webmaster demo':escape(account?.name || 'Private workspace')}${!demo&&account?.owner?' · Webmaster':''}${account?.passwordSignIn?' · <a href="/account">Account</a>':''}</span></header>
  <div class="shell"${visibleDesks.length?'':' style="display:block;max-width:51rem"'}>${visibleDesks.length?`<nav class="desk-nav" aria-label="Desks"><h2>Desks</h2><div>${navigation}</div>${!demo&&!preview?'<a class="preview-link" href="https://missing-middle-command-centre-demo.auraofintelligence.workers.dev/">View fictional demo</a>':''}</nav>`:''}<main id="main">
  <div class="hero${desk?' workspace':''}"><div><h1>${escape(title)}</h1><p>${escape(description)}</p>${context?`<p class="workspace-context">${escape(context)}</p>`:''}</div>${desk?sprite(desk):''}</div>${notice}${body}</main></div>
  <footer>Missing Middle Infrastructure · <a href="#top">Back to top</a></footer></body></html>`;
}

export function tracks(project) {
  return '<div class="tracks">' + [['Delivery','delivery'],['Funding','funding'],['Co-op','coop']]
    .map(([label,key])=>`<span><b>${label}</b>${escape(project[key])}</span>`).join('') + '</div>';
}

export function portfolio(projects,{desk,query='',cursor,preview,account,demo=false,signOut=false,hideSearch=false}) {
  const canCreate = account?.owner && !preview && !demo;
  const data = projects.slice(0,50);
  const html = data.map(p=>`<article class="card"><h3><a href="${escape(projectUrl(p.id,desk,preview,query,cursor))}">${escape(p.title)}</a></h3>
  <p class="muted">${escape(p.locality)} · ${escape(p.postcode)} · v${p.version}</p>${tracks(p)}
  <p><strong>${p.blocker?'Blocked':'Next action'}</strong> · ${escape(p.blocker||p.next_action)}</p>
  <small>${escape(p.lead)}${p.due_date?' · '+escape(p.due_date):''}</small></article>`).join('');
  const hidden = Object.entries({desk,...packPreview(preview)}).map(([key,value])=>`<input type="hidden" name="${key}" value="${escape(value)}">`).join('');
  const last = data.at(-1);
  const next = projects.length > 50 ? `<p><a href="${escape(deskUrl(desk,preview,query,last.changed_at+'|'+last.id))}">Older projects</a></p>` : '';
  const previewBox = desk==='webmaster' && canCreate && projects.length ? `<section class="card"><h2>Preview project access</h2>
    <form method="get" action="/" class="controls"><label>Role<select name="preview"><option>Project manager</option><option>Auditor</option></select></label>
    <label>Project<select name="scope">${data.map(p=>`<option value="${p.id}">${escape(p.title)}</option>`).join('')}</select></label>
    <button>Open read-only preview</button></form></section>` : '';
  const actions = `<div class="controls"><form method="get" action="/">${hidden}<label>Find a project
    <input type="search" name="q" value="${escape(query)}" maxlength="100" placeholder="Name, locality or postcode"></label><button>Search</button></form>
    ${canCreate?`<a class="button secondary" href="/projects/new${escape(q({desk}))}">New project</a>`:''}</div>`;
  return `${hideSearch?'':actions}${previewBox}${signOut&&!account?.passwordSignIn?'<p><a href="/cdn-cgi/access/logout">Sign out of Cloudflare Access</a></p>':''}
    ${html?'<section class="cards" aria-label="Projects">'+html+'</section>':'<p class="card">No projects match this view.</p>'}
    ${next}${cursor?`<p><a href="${escape(deskUrl(desk,preview,query))}">Back to newest projects</a></p>`:''}`;
}

function descriptions(project, pairs) {
  return '<dl>'+pairs.filter(key=>project[key]).map(key=>`<dt>${fields[key][0]}</dt><dd>${escape(project[key])}</dd>`).join('')+'</dl>';
}

function changes(row, older) {
  const entries = Object.keys(fields).filter(key=>!older || older.snapshot[key]!==row.snapshot[key]);
  return entries.length ? '<dl>'+entries.map(key=>`<dt>${escape(fields[key][0])}</dt><dd>${escape(row.snapshot[key])||'Cleared'}</dd>`).join('')+'</dl>' : '<p>No project field changes.</p>';
}

export function detail(project,history,{desk,preview,query,cursor,canWrite,before,more=''}) {
  const url = projectUrl(project.id,desk,preview,query,cursor);
  const versions = history.slice(0,30).map((row,index)=>`<details class="card">
    <summary>Version ${row.version} · ${escape(row.actor_name)} · ${escape(toAU(row.changed_at))}</summary>
    <p>${escape(row.reason)}</p>${changes(row,history[index+1])}</details>`).join('');
  return `<div class="controls"><a class="button secondary" href="${escape(deskUrl(desk,preview,query,cursor,project.id))}">Return to ${desks[desk][0]}</a>
    ${canWrite?`<a class="button" href="${escape('/projects/'+project.id+'/edit'+q({desk,q:query,cursor}))}">Edit project</a>`:''}</div>
    <section class="card"><h2>Current work</h2>${tracks(project)}
    ${descriptions(project,['lead','next_action','due_date','blocker'])}
    <small>Version ${project.version} · ${escape(project.actor_name)} · ${escape(toAU(project.changed_at))}</small></section>
    <section class="card"><h2>Site brief</h2>
    ${descriptions(project,['postcode','locality','host','workload','heat_use','evidence'])}</section>
    ${more}<section><h2>Signed revisions</h2>${versions}
    ${history.length>30?`<a href="${escape(projectUrl(project.id,desk,preview,query,cursor,history[29].version))}">Older revisions</a>`:''}
    ${before?`<p><a href="${escape(url)}">Back to newest revisions</a></p>`:''}</section>`;
}

export function editor(project,{desk,query,cursor,warning,values}) {
  const url = project ? projectUrl(project.id,desk,null,query,cursor) : deskUrl(desk,null,query,cursor);
  const action = '/projects'+(project?'/'+project.id:'')+q({desk,q:query,cursor});
  const input = Object.entries(fields).map(([key,[label,max]])=>{
    const value = values?.get(key) ?? project?.[key] ?? stages[key]?.[0] ?? '';
    const requiredAttr = required.includes(key) ? ' required' : '';
    let control;
    if (stages[key]) control = `<select name="${key}">${stages[key].map(s=>`<option${s===value?' selected':''}>${escape(s)}</option>`).join('')}</select>`;
    else if (long.includes(key)) control = `<textarea name="${key}" maxlength="${max}"${requiredAttr}>${escape(value)}</textarea>`;
    else control = `<input name="${key}" maxlength="${max}" value="${escape(value)}"${requiredAttr}${key==='postcode'?' inputmode="numeric" pattern="[0-9]{4}"':''}${key==='due_date'?' type="date"':''}>`;
    return `<label${long.includes(key)?' class="wide"':''}>${label}${control}</label>`;
  }).join('');
  return `${warning?`<p class="notice" role="alert">${escape(warning)}</p>`:''}
    <form method="post" action="${escape(action)}" class="card">
    <input type="hidden" name="version" value="${project?.version ?? 0}">
    <input type="hidden" name="request_key" value="${crypto.randomUUID()}">
    <div class="fields">${input}<label class="wide">Change note<textarea name="reason" maxlength="500" required>${escape(values?.get('reason'))}</textarea></label></div>
    <div class="controls"><button>Save project</button><a href="${escape(url)}">Cancel</a></div></form>`;
}

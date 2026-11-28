import {actions,forDesk,terminal,tools} from './desk-tools.mjs';
import {desks,deskUrl,projectUrl,sprite,escape as esc,packPreview,q,toAU,portfolio} from './views.mjs';

const demoLink='https://missing-middle-command-centre-demo.auraofintelligence.workers.dev/';
export const validId = id=>/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id);
const currency=new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'});
const brisbane=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit'});
const shortDate=new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
export const todayAU=()=>brisbane.format(new Date());
const displayDate=value=>value?shortDate.format(new Date(value+'T00:00:00Z')):'';
export const currentMonth = () => todayAU().slice(0,7);
export const validMonth = month => /^20\d{2}-(?:0[1-9]|1[0-2])$/.test(month);
const nextMonth=(month,offset)=>{const d=new Date(month+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+offset);return d.toISOString().slice(0,7);};
const recurring=[['programme','Portfolio, milestones and blocked work'],['places','Postcodes, organisations and permissions'],
  ['sites','Site briefs, dependencies and delivery'],['funding','Funding opportunities and budgets'],
  ['coops','Readiness and management handover'],['media','Editorial desk and calendar'],
  ['records','Decisions, evidence and history'],['operations','Operators, maintenance and incidents'],['webmaster','Account and role previews']];

export function deskLink(o,desk=o.desk,tool=o.tool,changes={}) {
  const merged={...o,...changes};
  return deskUrl(desk,o.preview,merged.query,merged.cursor,merged.project,tool,merged.month);
}
function contextQuery(o) {return {project:o.project,q:o.query,month:o.month,...packPreview(o.preview)};}
export const recordLink=(record,o,before)=>'/records/'+record.id+q({...contextQuery(o),before});
const newProject=(o)=>'/projects/new'+q({desk:o.desk,q:o.query});
function createLink(kind,o) {
  return '/tools/'+kind+'/new'+q(contextQuery(o));
}
function button(label,url,secondary=false) {
  return `<a class="button${secondary?' secondary':''}" href="${esc(url)}">${esc(label)}</a>`;
}
function status(value) {
  const tone=terminal.has(value)?' done':/blocked|pending|hold|changes requested/i.test(value)?' attention':'';
  return `<span class="status-pill${tone}">${esc(value)}</span>`;
}
function section(title,description,body,action='') {
  return `<section class="desk-section"><div class="section-heading"><div><h2>${esc(title)}</h2>
    ${description?`<p>${esc(description)}</p>`:''}</div>${action}</div><div class="section-body">${body}</div></section>`;
}
function options(projects,value){
  return projects.map(p=>`<option value="${esc(p.id)}"${value===p.id?' selected':''}>${esc(p.title)} · ${esc(p.postcode)}</option>`).join('');
}

export function contextBar(o) {
  return `<form class="context-bar" action="/" method="get"><input type="hidden" name="desk" value="${esc(o.desk)}">
  ${Object.entries({tool:o.tool,month:o.month,...packPreview(o.preview)}).filter(([,value])=>value).map(([key,value])=>
    `<input type="hidden" name="${key}" value="${esc(value)}">`).join('')}
  <label>Find work<input type="search" name="q" value="${esc(o.query)}" maxlength="100" placeholder="Project, record, locality or postcode"></label>
  <label>Project scope<select name="project"><option value="">All accessible projects</option>${options(o.projectChoices,o.project)}</select></label><button>Apply</button>
  ${o.query||o.project?button('Clear filters',deskLink(o,o.desk,o.tool,{query:'',project:'',cursor:''}),true):''}</form>`;
}

function recordCards(records,o) {
  return `<div class="record-grid">${records.map(row=>`<article class="record-tile">
    <h3><a href="${esc(recordLink(row,o))}">${esc(row.title)}</a></h3>${status(row.status)}
    <p class="meta">${esc(row.project_title)}${row.due_date?' · '+esc(displayDate(row.due_date)):''}</p>
    ${row.related_title?`<p>Linked to ${esc(row.related_title)}</p>`:''}
    <p class="meta">v${row.version} · ${esc(row.actor_name)}</p></article>`).join('')}</div>`;
}

function calendar(records,o) {
  const month=o.month||currentMonth();
  const first=new Date(month+'-01T00:00:00Z');
  const heading=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(first);
  const blank=(first.getUTCDay()+6)%7;
  const last=new Date(first.getUTCFullYear(),first.getUTCMonth()+1,0).getDate();
  const more=(offset,label)=>button(label,deskLink(o,'media','calendar',{month:nextMonth(month,offset)}),true);
  const cells=Array.from({length:last},(_,i)=>{
    const day=month+'-'+String(i+1).padStart(2,'0');
    const items=records.filter(r=>r.due_date===day);
    return `<div class="day${items.length?' has-entries':''}"><strong>${i+1}</strong>${items.map(r=>`<a href="${esc(recordLink(r,o))}">${esc(r.title)}</a>`).join('')}</div>`;
  }).join('');
  return `<div class="month-nav">${more(-1,'Previous month')}<strong>${heading}</strong>${more(1,'Next month')}</div>
    <div class="month-grid" aria-label="${heading}">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>'<div class="weekday">'+d+'</div>').join('')}
    ${'<div aria-hidden="true"></div>'.repeat(blank)}${cells}</div>`;
}
function toolSprite(kind){
  const index=Object.keys(tools).indexOf(kind);
  return `<span class="tool-sprite" style="--sx:${index%4*100/3}%;--sy:${Math.floor(index/4)*100/3}%" aria-hidden="true"></span>`;
}
function toolCards(kinds,active,counts,o){
  return `<div class="tool-grid">${kinds.map(k=>`<a class="tile" href="${esc(deskLink(o,o.desk,k,{cursor:''}))}"${active===k?' aria-current="page"':''}>
    <div class="tile-head"><div class="tool-label">${toolSprite(k)}<h3>${esc(tools[k][1])}</h3></div>${status(String(counts[k]||0))}</div><p>${esc(tools[k][2])}</p></a>`).join('')}</div>`;
}
function deskIndex(o){
  return section('Your desks','Open a desk to work on the current project or across the portfolio.',
    `<div class="overview-grid">${recurring.filter(([key])=>key!=='webmaster'||o.account?.owner||o.demo).map(([key,desc])=>
      `<a class="tile" href="${esc(deskLink(o,key,null,{cursor:'',query:'',month:''}))}"><div class="tile-head">
        <h3>${esc(desks[key][0])}</h3>${sprite(key)}</div><p>${desc}</p></a>`).join('')}</div>`);
}
function noRecords(kind,o) {
  if(!o.projectChoices.length&&!o.demo) return `<div class="empty-state"><strong>Add a project to start this register.</strong>
    <p>${esc(tools[kind][2])}</p>${o.account?.owner&&!o.preview?button('New project',newProject(o)):''}
    ${button('Explore the fictional demo',demoLink+'?desk='+o.desk,true)}</div>`;
  return '<div class="empty-state"><p>No entries in this view.</p></div>';
}
function toolSection(kind,records,counts,o) {
  const [,title,description]=tools[kind];
  const action=o.canCreateRecord&&o.projectChoices.length?button(actions[kind],createLink(kind,o)):'';
  const paging=kind==='calendar'?'':`<div class="controls">
    ${o.offset?button('Previous entries',deskLink(o,o.desk,kind,{cursor:String(Math.max(0,o.offset-24))}),true):''}
    ${records.length>24?button('More entries',deskLink(o,o.desk,kind,{cursor:String((o.offset||0)+24)}),true):''}</div>`;
  const live=records.slice(0,kind==='calendar'?records.length:24);
  return section(title,description,`${kind==='calendar'?calendar(live,o):''}
    ${live.length?recordCards(live,o):noRecords(kind,o)}${paging}`,action);
}
function webmaster(o,records){
  if(o.demo) return section('Role preview','Compare a delivery view with an auditor view.',
    '<p>In the workspace, Webmaster can preview the permissions for one project at a time. This walkthrough shows fictional data.</p>'+
    button('View example project',projectUrl(o.projectChoices[0].id,'webmaster'),true))+
    section('Recent changes','A signed record of recent work.',recordCards(records,o));
  const previewForm=o.projectChoices.length? `<form method="get" action="/" class="context-bar"><input type="hidden" name="desk" value="webmaster">
    <label>Role<select name="preview"><option>Project manager</option><option>Auditor</option></select></label>
    <label>Project<select name="scope">${options(o.projectChoices,o.project)}</select></label>
    <button>Open read-only preview</button></form>`:'<p>Add a project before previewing its scope.</p>';
  return section('Workspace access','Review your account or open a read-only project view.',
    `${button('Your account','/account',true)} ${button('Fictional demo',demoLink+'?desk=webmaster',true)}
      ${!o.preview?previewForm:'<p>Return to Webmaster to change the preview.</p>'}`) +
    section('Recent changes','Open a record to see its signed revisions.',records.length?recordCards(records,o):'<p>Saved changes will appear here.</p>');
}

export function workspace(o,{projects=[],records=[],counts={},milestones=[]}={}){
  const national=o.desk==='places'||o.desk==='programme'&&!o.tool?
    section('National coverage','Search the Census baseline before choosing a site.',
      button('Open National Coverage','/coverage'+q(packPreview(o.preview)),true)):'';
  const controls=contextBar(o);
  if(o.desk==='webmaster')return controls+webmaster(o,records);
  if(o.desk==='programme'&&!o.tool){
    const today=todayAU();
    const blocked=projects.filter(p=>p.blocker).length;
    const upcoming=[...projects,...milestones].filter(p=>p.due_date&&p.due_date>=today).sort((a,b)=>a.due_date.localeCompare(b.due_date)).slice(0,5);
    const statistics=`<div class="stat-grid">${[[projects.length===51?'50+':projects.length,'Projects in this view'],[blocked,'Projects blocked'],[counts.milestone||0,'Milestones in scope']]
      .map(([v,name])=>`<div class="stat"><strong>${v}</strong><span>${name}</span></div>`).join('')}</div>`;
    const empty= !o.projectChoices.length&&!o.demo ? `<div class="empty-state"><strong>What location are you working on?</strong>
      <p>Start with a postcode and evidence source. The project will connect the work in each desk.</p>
      ${o.account?.owner&&!o.preview?button('New project',newProject(o)):''} ${button('Open the worked example',demoLink,true)}</div>`:'';
    const next=upcoming.length?`<ul>${upcoming.map(p=>`<li>${esc(displayDate(p.due_date))} · <a href="${esc(p.kind?recordLink(p,o):projectUrl(p.id,o.desk,o.preview,o.query,o.cursor))}">${esc(p.title)}</a></li>`).join('')}</ul>`:'<p>No upcoming commitments in this view.</p>';
    return national+controls+statistics+section('Portfolio','Current delivery, funding and co-op stages.',
        empty||portfolio(projects,{...o,signOut:false,hideSearch:true}),o.account?.owner&&!o.preview&&o.projectChoices.length?button('New project',newProject(o),true):'')+
      section('Upcoming commitments','Project actions and milestone dates.',next,button('Open milestones',deskLink(o,'programme','milestone'),true))+deskIndex(o);
  }
  const kinds=forDesk(o.desk).filter(k=>k!=='contact'||o.showContacts);
  const selected=kinds.includes(o.tool)?o.tool:kinds[0];
  if(!selected)return controls+deskIndex(o);
  const extra=o.desk==='places'?'<p class="workspace-note">Keep research sources, contact permissions and established relationships visible as separate records.</p>':'';
  return national+controls+toolCards(kinds,selected,counts,o)+extra+toolSection(selected,records,counts,o);
}
export function projectTools(project,counts,o){
  const available=Object.keys(tools).filter(k=>counts[k]&&!(!o.showContacts&&k==='contact'));
  const body=`<div class="tool-grid">${(available.length?available:['opportunity','site','milestone','decision']).map(kind=>
    `<a class="tile" href="${esc(deskLink(o,tools[kind][0],kind,{project:project.id,cursor:'',query:''}))}">
      <div class="tool-label">${toolSprite(kind)}<h3>${esc(tools[kind][1])}</h3></div><p>${counts[kind]??0} linked records</p></a>`).join('')}</div>`;
  return section('Project desks','Work across the same project record.',body);
}
function showData(record){
  return '<dl>'+tools[record.kind][4].flatMap(field=>{
    const value=field.type==='link'?record.related_title:record.data[field.key];
    if(value===''||value===undefined||value===null)return [];
    const display=field.type==='money'?currency.format(value/100):field.type==='date'?displayDate(value):value;
    return `<dt>${esc(field.label)}</dt><dd>${esc(display)}</dd>`;
  }).join('')+'</dl>';
}
export function recordPage(record,history,o){
  const back=button('Return to '+desks[tools[record.kind][0]][0],deskLink(o,tools[record.kind][0],record.kind,{
    project:o.project,cursor:''}),true);
  const linked=record.related_id&&record.related_title?button('Open linked '+tools[record.related_kind][1].toLowerCase(),
    recordLink({id:record.related_id},o),true):'';
  const edit=o.canWrite?button('Edit record','/records/'+record.id+'/edit'+q(contextQuery(o))):'';
  const versions=history.slice(0,25).map(row=>{
    const snap={...record,...row.snapshot,related_title:row.snapshot.related_id===record.related_id?record.related_title:row.snapshot.related_id?'Earlier linked record':''};
    return `<details class="card"><summary>Version ${row.revision} · ${esc(row.actor_name)} · ${esc(toAU(row.changed_at))}</summary>
      <p>${esc(row.reason)}</p>${status(snap.status)}${showData(snap)}</details>`;
  }).join('');
  return `<div class="controls">${back}${edit}${linked}
    ${button('Open project',projectUrl(record.project_id,tools[record.kind][0],o.preview,o.query),true)}</div>
    ${section('Current record',record.project_title,status(record.status)+showData(record)+
     `<p class="meta">Version ${record.version} · ${esc(record.actor_name)} · ${esc(toAU(record.changed_at))}</p>`)}
    ${section('Signed revisions','Expand a version to see the saved details.',versions+
      (history.length>25?button('Older revisions',recordLink(record,o,history[24].revision),true):''))}`;
}
export function recordEditor(kind,o,{record=null,related=[],values=null,warning=''}={}){
  if(!o.project){
    return section('Choose a project','Every record belongs to a project.',
      o.projectChoices.length?`<form class="context-bar" method="get" action="/tools/${kind}/new">
        <label>Project<select name="project" required><option value="">Choose a project</option>${options(o.projectChoices,'')}</select></label><button>Continue</button></form>`:
        `<p>No accessible projects.</p>${o.account?.owner?button('New project',newProject(o),true):''}`);
  }
  const fields=tools[kind][4];
  const statuses=tools[kind][3];
  const value=(key,fallback='')=>values?.get(key)??fallback;
  const selectedOption=(name,value)=>`<option value="${esc(name)}"${value===name?' selected':''}>${esc(name)}</option>`;
  const controls=fields.map(field=>{
    let initial=record?.data[field.key]??(field.key==='event_date'&&o.month?o.month+'-01':'');
    if(field.type==='link')initial=record?.related_id??'';
    if(field.type==='money'&&typeof initial==='number')initial=(initial/100).toFixed(2);
    const val=value(field.key,initial);
    const required=field.required?' required':'';
    let input;
    if(field.type==='note')input=`<textarea name="${field.key}" maxlength="2000"${required}>${esc(val)}</textarea>`;
    else if(field.type==='choice')input=`<select name="${field.key}"${required}>${selectedOption('',val)}${field.values.map(x=>selectedOption(x,val)).join('')}</select>`;
    else if(field.type==='link')input=`<select name="${field.key}"><option value="">Select when available</option>
      ${related.filter(r=>field.kinds.includes(r.kind)).map(r=>`<option value="${esc(r.id)}"${val===r.id?' selected':''}>${esc(r.title)}</option>`).join('')}</select>`;
    else input=`<input name="${field.key}" value="${esc(val)}" ${field.type==='date'?'type="date"':field.type==='money'?'inputmode="decimal"':field.type==='postcode'?'inputmode="numeric" pattern="[0-9]{4}"':'maxlength="200"'}${required}>`;
    return `<label${field.type==='note'?' class="wide"':''}>${esc(field.label)}${input}</label>`;
  }).join('');
  const target=(record?'/records/'+record.id+'/edit':'/tools/'+kind+'/new')+q(contextQuery(o));
  const cancel=record?recordLink(record,o):deskLink(o,o.desk,kind);
  return `${warning?`<p class="notice" role="alert">${esc(warning)}</p>`:''}
    <form class="card" method="post" action="${esc(target)}">
    <input name="version" type="hidden" value="${record?.version??0}">
    <input name="request_key" type="hidden" value="${crypto.randomUUID()}">
    <div class="fields">
      <label>Title<input name="title" maxlength="150" required value="${esc(value('title',record?.title))}"></label>
      <label>Status<select name="status">${statuses.map(x=>selectedOption(x,value('status',record?.status??statuses[0]))).join('')}</select></label>
      ${controls}<label class="wide">Change note<textarea name="reason" maxlength="500" required>${esc(value('reason'))}</textarea></label>
    </div><div class="controls"><button>Save record</button><a href="${esc(cancel)}">Cancel</a></div></form>`;
}

import {Problem,formValues,projectScope,readProject,canEdit} from './projects.mjs';
import {tools} from './desk-tools.mjs';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const selected='r.id,r.project_id,r.kind,r.title,r.status,r.due_date,r.related_id,r.data,r.version,r.actor_name,r.changed_at,r.reason';
const joins=`FROM desk_records r JOIN projects ON projects.id=r.project_id
  LEFT JOIN desk_records related ON related.id=r.related_id AND related.project_id=r.project_id`;
function access(account,preview,write=false) {
  const {sql,params}=projectScope(account,preview,write);
  return {params,sql:`${sql} AND (r.kind!='contact' OR (?2 IS NULL AND EXISTS (
    SELECT 1 FROM accounts a WHERE a.id=?1 AND a.active=1 AND (a.owner=1 OR EXISTS (
      SELECT 1 FROM project_grants g WHERE g.account_id=a.id AND g.project_id=r.project_id
      AND g.role='Project manager' AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>?3)
    )))))`};
}
function decode(row){return {...row,data:JSON.parse(row.data)};}

export async function listDeskRecords(db,account,preview,{kind='',project='',query='',offset=0,limit=25,month=''}={}) {
  const {sql,params}=access(account,preview);
  const result=await db.prepare(`SELECT ${selected},projects.title AS project_title,related.title AS related_title,related.kind AS related_kind
    ${joins} WHERE ${sql} AND (?4='' OR r.kind=?4) AND (?5='' OR r.project_id=?5)
    AND (?6='' OR instr(lower(r.title),lower(?6))>0 OR instr(lower(projects.title),lower(?6))>0
                OR instr(projects.postcode,?6)>0 OR instr(lower(projects.locality),lower(?6))>0)
    AND (?9='' OR substr(r.due_date,1,7)=?9)
    ORDER BY CASE WHEN r.kind='calendar' AND r.due_date!='' THEN r.due_date ELSE '9999-12-31' END,
    r.changed_at DESC,r.id DESC LIMIT ?7 OFFSET ?8`).bind(...params,kind,project,query,limit,offset,month).all();
  return result.results.map(decode);
}

export async function getDeskRecord(db,account,preview,id) {
  if(!uuid.test(id)) throw new Problem(404,'Record not found.');
  const {sql,params}=access(account,preview);
  const row=await db.prepare(`SELECT ${selected},projects.title AS project_title,related.title AS related_title,related.kind AS related_kind
    ${joins} WHERE ${sql} AND r.id=?4`).bind(...params,id).first();
  if(!row)throw new Problem(404,'Record not found.');
  return decode(row);
}
export async function deskHistory(db,account,preview,id,before=null) {
  const {sql,params}=access(account,preview);
  const {results}=await db.prepare(`SELECT h.revision,h.snapshot,h.actor_name,h.changed_at,h.reason
    FROM desk_record_revisions h JOIN desk_records r ON r.id=h.record_id
    JOIN projects ON projects.id=r.project_id WHERE ${sql} AND r.id=?4 AND (?5 IS NULL OR h.revision<?5)
    ORDER BY h.revision DESC LIMIT 26`).bind(...params,id,before).all();
  return results.map(h=>({...h,snapshot:JSON.parse(h.snapshot)}));
}
export async function deskCounts(db,account,preview,project='',query='') {
  const {sql,params}=access(account,preview);
  const {results}=await db.prepare(`SELECT r.kind,count(*) AS count
    FROM desk_records r JOIN projects ON projects.id=r.project_id WHERE ${sql}
    AND (?4='' OR r.project_id=?4) AND (?5='' OR instr(lower(r.title),lower(?5))>0
      OR instr(lower(projects.title),lower(?5))>0 OR instr(projects.postcode,?5)>0 OR instr(lower(projects.locality),lower(?5))>0)
    GROUP BY r.kind`).bind(...params,project,query).all();
  return Object.fromEntries(results.map(r=>[r.kind,r.count]));
}

function convert(field,value) {
  if(!value) {
    if(field.required) throw new Problem(422,'Enter '+field.label.toLowerCase()+'.');
    return '';
  }
  if(field.type==='choice'&&!field.values.includes(value))throw new Problem(422,'Choose '+field.label.toLowerCase()+'.');
  if(field.type==='postcode'&&!/^\d{4}$/.test(value))throw new Problem(422,'Enter a four digit postcode.');
  if(field.type==='date'){
    const date=new Date(value+'T00:00:00.000Z');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(+date)||date.toISOString().slice(0,10)!==value)
      throw new Problem(422,'Enter a valid '+field.label.toLowerCase()+'.');
  }
  if(field.type==='money'){
    if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(value))throw new Problem(422,'Enter an AUD amount with up to two decimal places.');
    const [whole,decimal='']=value.split('.');
    return Number(whole)*100+Number(decimal.padEnd(2,'0'));
  }
  if(value.length>(field.type==='note'?2000:200))throw new Problem(422,field.label+' is too long.');
  return value;
}
function verifyRequirements(kind,status,data,related,account) {
  const require=(ok,message)=>{if(!ok)throw new Problem(422,message);};
  const accountable=(ok,message)=>{
    if(!account.owner)throw new Problem(403,'This decision requires the Webmaster.');
    require(ok,message);
  };
  if(kind==='contact'){
    if(status==='Consented')require(data.consent_date&&data.consent&&data.channel,'Record the permission date, scope and contact details.');
    else if(data.channel)throw new Problem(422,'Clear contact details unless permission is recorded.');
  }
  if(kind==='site'&&status==='Site brief ready')require(related&&data.power&&data.workload&&data.heat&&data.evidence,
    'A ready site brief needs a host organisation, power and connectivity, workloads, heat assessment and evidence.');
  if(kind==='work_package'&&status==='Complete')require(related&&data.evidence,'Link the site and record completion evidence.');
  if(kind==='budget'&&status==='Committed')accountable(typeof data.committed==='number'&&data.evidence,'Record the committed amount and its approval reference.');
  if(kind==='budget'&&status==='Actual recorded')require(typeof data.actual==='number'&&data.evidence,'Record the actual amount and its evidence.');
  if(kind==='funding_bid'&&status==='Decision recorded')accountable(data.evidence,'Record the funding decision reference.');
  if(kind==='handover'&&status==='Acceptance recorded')accountable(related&&data.effective&&data.evidence,
    'Link the site and record the effective date and acceptance evidence.');
  if(kind==='story'&&status==='Review recorded')accountable(data.rights&&data.review&&data.outlet,
    'Record usage permission, the outlet and the review decision.');
  if(kind==='calendar')require(data.event_date,'Enter the calendar date.');
  if(kind==='decision'&&status==='Decision recorded')accountable(data.authority&&data.decided&&data.evidence,
    'Record the decision maker, date and evidence.');
  if(kind==='operating'&&['Interim','Active'].includes(status))accountable(related&&data.due&&data.evidence,
    'Link the site and record the review date and source of authority.');
  if(kind==='maintenance'&&status==='Resolved')require(data.resolution,'Record the resolution.');
}

export async function saveDeskRecord(db,account,preview,{kind,project,id=null},request) {
  if(preview)throw new Problem(403,'Role preview is view only.');
  if(!Object.hasOwn(tools,kind)||!uuid.test(project))throw new Problem(404,'Tool not found.');
  await readProject(db,account,null,project);
  if(!await canEdit(db,account,null,project))throw new Problem(403,'You have view access to this project.');
  const existing=id?await getDeskRecord(db,account,null,id):null;
  if(existing&&(existing.kind!==kind||existing.project_id!==project))throw new Problem(404,'Record not found.');
  const values=await formValues(request);
  try{
    const title=values.get('title')?.trim(),reason=values.get('reason')?.trim(),status=values.get('status');
    if(!title||title.length>150||!reason||reason.length>500)throw new Problem(422,'Enter a title and a change note.');
    if(!tools[kind][3].includes(status))throw new Problem(422,'Choose a valid status.');
    const data={};
    let related=null;
    for(const field of tools[kind][4]){
      const value=convert(field,(values.get(field.key)||'').trim());
      if(field.type!=='link'){data[field.key]=value;continue;}
      if(!value)continue;
      if(!uuid.test(value))throw new Problem(422,'Choose a related record from this project.');
      const target=await getDeskRecord(db,account,null,value);
      if(target.project_id!==project||!field.kinds.includes(target.kind))throw new Problem(422,'Choose a related record from this project.');
      related=value;
    }
    verifyRequirements(kind,status,data,related,account);
    const requested=values.get('version')||'';
    const version=Number(requested);
    const requestKey=values.get('request_key')||'';
    if(!/^\d+$/.test(requested)||!Number.isSafeInteger(version)||!uuid.test(requestKey)||(id?version<1:version!==0))
      throw new Problem(400,'Reload the form before saving.');
    const due=data.event_date||data.due||'';
    const snapshot={title,status,due_date:due,related_id:related,data};
    const payload=JSON.stringify(data);
    const previous=async ()=>{
      const row=await db.prepare(`SELECT h.record_id,h.snapshot,h.reason,h.revision,r.project_id,r.kind
        FROM desk_record_revisions h JOIN desk_records r ON r.id=h.record_id WHERE h.actor_id=? AND h.request_key=?`)
        .bind(account.id,requestKey).first();
      if(!row)return null;
      if((id&&id!==row.record_id)||row.revision!==version+1||row.project_id!==project||row.kind!==kind||
        row.reason!==reason||JSON.stringify(JSON.parse(row.snapshot))!==JSON.stringify(snapshot))
        throw new Problem(409,'This save key has already been used. Reload the form.');
      await getDeskRecord(db,account,null,row.record_id);
      return row.record_id;
    };
    const prior=await previous();
    if(prior)return prior;
    const {sql,params}=projectScope(account,null,true);
    const recordId=id||crypto.randomUUID();
    const current=[title,status,due,related,payload,account.id,account.name,new Date().toISOString(),reason,requestKey];
    const editAccess=`EXISTS(SELECT 1 FROM projects WHERE projects.id=?4 AND ${sql})`;
    try{
      const result=id
        ? await db.prepare(`UPDATE desk_records SET title=?5,status=?6,due_date=?7,related_id=?8,data=?9,
          actor_id=?10,actor_name=?11,changed_at=?12,reason=?13,request_key=?14,version=version+1
          WHERE id=?15 AND project_id=?4 AND kind=?16 AND version=?17 AND ${editAccess}`)
          .bind(...params,project,...current,recordId,kind,version).run()
        : await db.prepare(`INSERT INTO desk_records(id,project_id,kind,title,status,due_date,related_id,data,version,actor_id,actor_name,changed_at,reason,request_key)
          SELECT ?15,?4,?16,?5,?6,?7,?8,?9,1,?10,?11,?12,?13,?14 WHERE ${editAccess}`)
          .bind(...params,project,...current,recordId,kind).run();
      if(result.meta.changes)return recordId;
    }catch(error){
      const retry=await previous();
      if(retry)return retry;
      throw error;
    }
    const retry=await previous();
    if(retry)return retry;
    if(!await canEdit(db,account,null,project))throw new Problem(403,'Project editing access has changed.');
    throw new Problem(409,'Someone saved a newer version. Open the record and review those changes.');
  }catch(error){
    if(error instanceof Problem&&error.status===422)error.values=values;
    throw error;
  }
}

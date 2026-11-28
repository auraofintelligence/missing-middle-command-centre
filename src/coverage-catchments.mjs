import {Problem,formValues} from './projects.mjs';
import {coverageMeta,parseCodes} from './coverage-model.mjs';

const rowFields='id,title,postcodes,notes,source_version,version,actor_name,changed_at,reason';
const decode=row=>row?{...row,postcodes:JSON.parse(row.postcodes)}:null;
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ownerExists='EXISTS(SELECT 1 FROM accounts WHERE id=? AND owner=1 AND active=1)';
const requireOwner=(account,preview)=>{
  if(!account?.owner||preview)throw new Problem(403,'Catchment planning requires the Webmaster.');
};

export async function listCatchments(db,account,preview){
  requireOwner(account,preview);
  const {results}=await db.prepare(`SELECT ${rowFields} FROM coverage_catchments WHERE ${ownerExists}
    ORDER BY title COLLATE NOCASE`).bind(account.id).all();
  return results.map(decode);
}

export async function getCatchment(db,account,preview,id){
  requireOwner(account,preview);
  if(!uuid.test(id))throw new Problem(404,'Catchment not found.');
  const row=await db.prepare(`SELECT ${rowFields} FROM coverage_catchments
    WHERE id=? AND ${ownerExists}`).bind(id,account.id).first();
  if(!row)throw new Problem(404,'Catchment not found.');
  return decode(row);
}

export async function catchmentHistory(db,account,preview,id,before=null){
  await getCatchment(db,account,preview,id);
  const {results}=await db.prepare(`SELECT version,snapshot,actor_name,changed_at,reason
    FROM coverage_catchment_history WHERE catchment_id=? AND (? IS NULL OR version<?) AND ${ownerExists}
    ORDER BY version DESC LIMIT 26`).bind(id,before,before,account.id).all();
  return results.map(row=>({...row,snapshot:JSON.parse(row.snapshot)}));
}

export async function saveCatchment(db,account,preview,id,request){
  requireOwner(account,preview);
  if(id)await getCatchment(db,account,preview,id);
  const values=await formValues(request);
  try{
    const title=(values.get('title')||'').trim(),notes=(values.get('notes')||'').trim(),reason=(values.get('reason')||'').trim();
    const key=values.get('request_key')||'', v=values.get('version')||'';
    const version=Number(v);
    if(!uuid.test(key)||!/^\d+$/.test(v)||!Number.isSafeInteger(version)||(id?version<1:version!==0))
      throw new Problem(400,'Reload the form before saving.');
    if(!title||title.length>120||notes.length>1500||!reason||reason.length>500)
      throw new Problem(422,'Enter a catchment name and a change note. Keep notes to 1,500 characters.');
    let codes;
    try{codes=parseCodes(values.get('postcodes'));}
    catch(error){throw new Problem(422,error.message);}
    if(!codes.length)throw new Problem(422,'Enter at least one postcode.');
    const payload=JSON.stringify(codes), timestamp=new Date().toISOString(), identifier=id||crypto.randomUUID();
    const source=coverageMeta.version;
    const previous=async()=>{
      const prior=await db.prepare(`SELECT catchment_id,version,snapshot,reason
        FROM coverage_catchment_history WHERE actor_id=? AND request_key=? AND ${ownerExists}`).bind(account.id,key,account.id).first();
      if(!prior)return null;
      const old=JSON.parse(prior.snapshot);
      if((id&&id!==prior.catchment_id)||prior.version!==version+1||prior.reason!==reason||old.title!==title||
        old.notes!==notes||old.source_version!==source||JSON.stringify(old.postcodes)!==payload)
        throw new Problem(409,'This save has already been used. Reload before editing.');
      return prior.catchment_id;
    };
    const existing=await previous();
    if(existing)return existing;
    const fields=[title,payload,notes,source,account.id,account.name,timestamp,reason,key];
    try{
      const r=id
        ? await db.prepare(`UPDATE coverage_catchments SET title=?,postcodes=?,notes=?,source_version=?,
          actor_id=?,actor_name=?,changed_at=?,reason=?,request_key=?,version=version+1
          WHERE id=? AND version=? AND ${ownerExists}`).bind(...fields,identifier,version,account.id).run()
        : await db.prepare(`INSERT INTO coverage_catchments
          (id,title,postcodes,notes,source_version,actor_id,actor_name,changed_at,reason,request_key,version)
          SELECT ?,?,?,?,?,?,?,?,?,?,1 WHERE ${ownerExists}`).bind(identifier,...fields,account.id).run();
      if(r.meta.changes)return identifier;
    }catch(error){
      const retry=await previous();
      if(retry)return retry;
      const dupe=await db.prepare(`SELECT id FROM coverage_catchments
         WHERE title=? AND id<>? AND ${ownerExists}`).bind(title,identifier,account.id).first();
      if(dupe)throw new Problem(422,'A saved catchment already has that name.');
      throw error;
    }
    const retry=await previous();
    if(retry)return retry;
    throw new Problem(409,'This record changed before the save. Reopen the catchment to review the latest version.');
  }catch(error){
    if(error instanceof Problem&&error.status===422)error.values=values;
    throw error;
  }
}

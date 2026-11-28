export const stages = {
  delivery:['Research','Host discussion','Site brief'],
  funding:['Unassessed','Researching','Application in preparation'],
  coop:['Unassessed','People interested','Formation underway']
};

export const fields = {
  title:['Project name',120], postcode:['Postcode',4], locality:['Locality',100],
  host:['Candidate host or organisation',160], workload:['Potential compute workload',1200],
  heat_use:['Potential heat use',1200], evidence:['Research or evidence reference',1200],
  lead:['Responsible person or role',120], next_action:['Next action',500],
  due_date:['Next action due',10], blocker:['What is blocking progress?',500],
  delivery:['Delivery stage',50], funding:['Funding stage',50], coop:['Co-op stage',50]
};
const names = Object.keys(fields);
const required = ['title','postcode','locality','evidence','lead','next_action'];
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const columns = ['id', ...names, 'version','actor_name','changed_at','reason'];
const previewRoles = ['Project manager','Auditor'];

export class Problem extends Error {
  constructor(status,message) { super(message); this.status = status; }
}

export async function formValues(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin ||
      !request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    throw new Problem(403,'Submit the form from this workspace.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new Problem(400,'The form is empty.');
  const decoder = new TextDecoder('utf-8',{fatal:true});
  let body = '', bytes = 0;
  for (;;) {
    const {value,done} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 24000) {
      await reader.cancel();
      throw new Problem(413,'This form is too large.');
    }
    body += decoder.decode(value,{stream:true});
  }
  return new URLSearchParams(body + decoder.decode());
}

export function roleView(url, account) {
  const role = url.searchParams.get('preview');
  const id = url.searchParams.get('scope');
  if (role === null && id === null) return null;
  if (account.owner !== 1 || !previewRoles.includes(role) || !uuid.test(id || '')) {
    throw new Problem(404,'Workspace not found.');
  }
  return {role,id};
}

function scope(account, preview, editing = false) {
  const sql = `EXISTS (SELECT 1 FROM accounts a WHERE a.id=?1 AND a.active=1 AND
    ((a.owner=1 AND (?2 IS NULL OR projects.id=?2)) OR EXISTS (
      SELECT 1 FROM project_grants g WHERE g.account_id=a.id AND g.project_id=projects.id
      AND g.revoked_at IS NULL AND (g.expires_at IS NULL OR g.expires_at>?3)
      ${editing ? "AND g.role='Project manager'" : ''})))`;
  return {sql,params:[account.id,preview?.id ?? null,new Date().toISOString()]};
}

export async function listProjects(db, account, preview, query, cursor) {
  const {sql,params} = scope(account,preview);
  const after = cursor?.split('|') ?? [];
  const paginating = after.length === 2 && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(after[0]) && uuid.test(after[1]);
  const {results} = await db.prepare(`SELECT ${columns.join(',')} FROM projects WHERE ${sql}
    AND (?4='' OR instr(lower(title),lower(?4))>0 OR instr(postcode,?4)>0
      OR instr(lower(locality),lower(?4))>0)
    AND (?5 IS NULL OR (changed_at,id)<(?5,?6))
    ORDER BY changed_at DESC,id DESC LIMIT 51`)
    .bind(...params,query,paginating ? after[0] : null,paginating ? after[1] : null).all();
  return results;
}

export async function readProject(db, account, preview, id) {
  const {sql,params} = scope(account,preview);
  const project = await db.prepare(`SELECT ${columns.join(',')} FROM projects WHERE ${sql} AND id=?4`)
    .bind(...params,id).first();
  if (!project) throw new Problem(404,'Project not found.');
  return project;
}

export async function canEdit(db, account, preview, id) {
  if (preview) return false;
  const {sql,params} = scope(account,null,true);
  return Boolean(await db.prepare(`SELECT id FROM projects WHERE ${sql} AND id=?4`).bind(...params,id).first());
}

export async function readHistory(db, account, preview, id, before) {
  const {sql,params} = scope(account,preview);
  const {results} = await db.prepare(`SELECT r.version,r.actor_name,r.changed_at,r.reason,r.snapshot
    FROM project_revisions r JOIN projects ON projects.id=r.project_id
    WHERE ${sql} AND projects.id=?4 AND (?5 IS NULL OR r.version<?5)
    ORDER BY r.version DESC LIMIT 31`).bind(...params,id,before).all();
  return results.map(row => ({...row,snapshot:JSON.parse(row.snapshot)}));
}

function validate(values) {
  const project = Object.fromEntries(names.map(key => [key,(values.get(key) ?? '').trim()]));
  const reason = (values.get('reason') ?? '').trim();
  for (const key of names) {
    if (project[key].length > fields[key][1] || (required.includes(key) && !project[key])) {
      throw new Problem(422,`Check ${fields[key][0].toLowerCase()}.`);
    }
  }
  if (!/^\d{4}$/.test(project.postcode)) throw new Problem(422,'Enter a four digit Australian postcode.');
  for (const [key, options] of Object.entries(stages)) {
    if (!options.includes(project[key])) throw new Problem(422,`Choose a valid ${fields[key][0].toLowerCase()}.`);
  }
  if (project.due_date) {
    const date = new Date(project.due_date + 'T00:00:00.000Z');
    if (!/^\d{4}-\d\d-\d\d$/.test(project.due_date) || !Number.isFinite(+date) ||
        date.toISOString().slice(0,10) !== project.due_date) throw new Problem(422,'Enter a valid due date.');
  }
  if (project.delivery === 'Site brief' && (!project.host || !project.workload || !project.heat_use)) {
    throw new Problem(422,'Add a candidate host, expected workload and heat use assessment before saving a site brief.');
  }
  if (!reason || reason.length > 500) throw new Problem(422,'Enter a change note of up to 500 characters.');
  return {project,reason};
}

export async function saveProject(db, account, preview, id, request) {
  if (preview) throw new Problem(403,'Role preview is view only.');
  if (!id && account.owner !== 1) throw new Problem(403,'Only the Webmaster can start a project.');
  if (id) {
    await readProject(db,account,null,id);
    if (!await canEdit(db,account,null,id)) throw new Problem(403,'You have view access to this project.');
  }
  const values = await formValues(request);
  try {
    const {project,reason} = validate(values);
    const requestKey = values.get('request_key') ?? '';
    const version = Number(values.get('version'));
    if (!uuid.test(requestKey) || !Number.isSafeInteger(version) || (id ? version < 1 : version !== 0)) {
      throw new Problem(400,'Reload the project form before saving.');
    }
    const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([id,version,project,reason])));
    const hash = Array.from(new Uint8Array(digest),b => b.toString(16).padStart(2,'0')).join('');
    const previous = async () => {
      const row = await db.prepare('SELECT project_id,request_hash FROM project_revisions WHERE actor=? AND request_key=?')
        .bind(account.id,requestKey).first();
      if (!row) return null;
      if (hash !== row.request_hash) throw new Problem(409,'This save key has already been used. Reload the form.');
      await readProject(db,account,null,row.project_id);
      return row.project_id;
    };
    const alreadySaved = await previous();
    if (alreadySaved) return alreadySaved;
    let projectId = id ?? crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const metadata = [account.id,account.name,timestamp,reason,requestKey,hash];
    try {
      if (id) {
        const {sql,params} = scope(account,null,true);
        const setters = names.map((name,i) => name+'=?'+(i+6));
        const offset = 6 + names.length;
        const result = await db.prepare(`UPDATE projects SET ${setters.join(',')}, version=version+1,
          actor=?${offset},actor_name=?${offset+1},changed_at=?${offset+2},reason=?${offset+3},
          request_key=?${offset+4},request_hash=?${offset+5} WHERE ${sql} AND id=?4 AND version=?5`)
          .bind(...params,id,version,...names.map(key => project[key]),...metadata).run();
        if (!result.meta.changes) {
          const retry = await previous();
          if (retry) return retry;
          if (!await canEdit(db,account,null,id)) throw new Problem(403,'Project editing access has changed.');
          throw new Problem(409,'Someone has saved a newer version. Open the project and review those changes.');
        }
      } else {
        const result = await db.prepare(`INSERT INTO projects
          (id,${names.join(',')},version,actor,actor_name,changed_at,reason,request_key,request_hash)
          SELECT ${Array(2+names.length+metadata.length).fill('?').join(',')}
          WHERE EXISTS(SELECT 1 FROM accounts WHERE id=? AND active=1 AND owner=1)`)
          .bind(projectId,...names.map(key => project[key]),1,...metadata,account.id).run();
        if (!result.meta.changes) throw new Problem(403,'Webmaster access has changed.');
      }
    } catch (error) {
      if (error instanceof Problem) throw error;
      const retry = await previous();
      if (retry) return retry;
      throw error;
    }
    return projectId;
  } catch (error) {
    if (error instanceof Problem && error.status === 422) error.values = values;
    throw error;
  }
}

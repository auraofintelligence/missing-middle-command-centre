import {desks,page,detail} from './views.mjs';
import {tools,forDesk} from './desk-tools.mjs';
import {workspace,recordPage,projectTools,validMonth,validId} from './workspace.mjs';

const id = '87021a74-6945-4d87-aca9-134bd9777300';
const initial = {
  id,title:'Wattle Reach Aquatic Centre',locality:'Wattle Reach (fictional)',postcode:'4999',
  host:'',workload:'',heat_use:'',evidence:'Illustrative municipality facility list',
  lead:'Mira Banks · Programme',next_action:'Check heat demand and available electrical capacity.',
  due_date:'2027-03-15',blocker:'',delivery:'Research',funding:'Unassessed',coop:'Unassessed',
  version:1,actor_name:'Mira Banks',changed_at:'2027-02-10T04:00:00Z',reason:'Record the research lead.'
};
const brief = {
  ...initial,host:'Wattle Reach Aquatic Centre (fictional)',delivery:'Site brief',funding:'Researching',
  coop:'People interested',workload:'Local business batch processing and shared coursework compute.',
  heat_use:'Use recovered heat to preheat pool makeup water. Verify useful heat demand against the daily load.',
  evidence:'Fictional host meeting and indicative utility review.',
  next_action:'Confirm heat exchanger design inputs with the host.',
  version:2,actor_name:'Harper Quinn',changed_at:'2027-03-01T04:00:00Z',reason:'Record the example host discussion and site brief.'
};
const operating = {
  ...brief,delivery:'Operating',funding:'Funding committed',coop:'Active management',
  lead:'Harper Quinn · Co-op operator',next_action:'Review metering and availability after three months.',
  due_date:'2027-12-15',evidence:'Fictional commissioning report and accepted management package v2. Equipment title remains with the asset company.',
  version:3,actor_name:'Harper Quinn',changed_at:'2027-09-15T04:00:00Z',reason:'Record accepted local management and separate ownership.'
};
const history = [operating,brief,initial].map(row => ({
  version:row.version, actor_name:row.actor_name, changed_at:row.changed_at, reason:row.reason, snapshot:row
}));
const learning={
  ...initial,id:'a5a513ec-b81f-4591-b6ca-f216f91987d9',title:'Banksia Bend Learning Hub',
  locality:'Banksia Bend (fictional)',postcode:'4888',delivery:'Host discussion',
  lead:'Mira Banks · Programme',next_action:'Check whether the evening classes can use a shared compute room.',
  due_date:'2027-10-05',blocker:'Waiting for the host to confirm room access.'
};
const projects=[operating,learning];
const makeId=n=>'444b7ee2-3ad2-4c0d-a5f1-'+String(n).padStart(12,'0');
const examples=[
  ['organisation','Wattle Reach Community Facilities','Confirmed',{role:'Host',locality:'Wattle Reach',relationship:'Manages the fictional aquatic centre and can supply operational evidence.',evidence:'Host discussion record WR-14.'}],
  ['opportunity','Recover useful heat at postcode 4999','Qualified',{postcode:'4999',locality:'Wattle Reach',need:'The centre heats makeup water year-round and asked about using rack heat.',lead:'Mira Banks',next:'Compare demand profile with compute forecast.'},1],
  ['contact','Riley Stone, venue coordinator','Consented',{channel:'riley@example.invalid',purpose:'Confirm site access and pool heat data',consent_date:'2027-03-03',consent:'Fictional written permission to contact about this study only.'},1],
  ['site','Aquatic centre plant room','Site brief ready',{locality:'Wattle Reach',power:'Spare three-phase capacity identified for assessment; fibre nearby.',workload:'Training and small business batch jobs.',heat:'Preheat pool makeup water using a plate exchanger.',constraints:'Maintain access for the pool maintenance crew.',evidence:'Feasibility note WR-F-02.'},1],
  ['work_package','UPS installation and test','Complete',{category:'UPS installation',scope:'Install and test the UPS and hand over its evidence. Network operation is outside scope.',lead:'Electrical contractor',due:'2027-08-24',evidence:'Fictional UPS acceptance WR-U-04.'},4],
  ['funding_bid','Regional facilities upgrade grant','Decision recorded',{requested:12500000,awarded:9500000,due:'2027-06-28',conditions:'Provide participation and heat savings evidence over six months.',evidence:'Fictional award reference WR-G-06.'}],
  ['budget','UPS package and commissioning costs','Actual recorded',{estimate:3400000,committed:3200000,actual:3175000,evidence:'Fictional invoice WR-A-19.'},5],
  ['readiness','Wattle Reach co-op readiness review','Readiness evidenced',{capability:'Two trained operators and an elected operations contact.',gaps:'Schedule a recovery drill.',lead:'Harper Quinn',evidence:'Fictional training and authority sign-off WR-C-08.'}],
  ['handover','Aquatic centre management acceptance','Acceptance recorded',{receiver:'Wattle Reach Community Co-op (fictional)',interim:'Facility delivery team',effective:'2027-09-15',
    responsibilities:'Monitoring, reporting and first-line support.',retained:'Hardware owner retains title and warranty obligations.',
    ownership:'Fictional asset schedule WR-A-03. No title transfer on the management date.',evidence:'Fictional signed package WR-H-02 revision 2.'},4],
  ['story','A warm pool and a useful local compute service','Ready for review',{outlet:'Local community bulletin',copy:'A worked example of how useful heat from a shared rack could support a community pool.',rights:'Host image permission under review.',review:'Confirm metering before the story is cleared.',lead:'Mira Banks',due:'2027-09-23'}],
  ['calendar','Host briefing and photo walk','Planned',{event_date:'2027-09-22',channel:'Venue meeting room',brief:'Walk through the heat reclaim installation and check photo permissions.',lead:'Mira Banks'}],
  ['decision','Accept commissioning evidence pack','Decision recorded',{authority:'Fictional delivery board',decided:'2027-09-12',resolution:'Accept completion of the agreed technical scope and retain maintenance obligations.',evidence:'Fictional board minutes WR-D-12.'}],
  ['evidence','Commissioning measurements and tests','Checked',{reference:'WR-T-07',custodian:'Delivery team',recorded:'2027-09-12',summary:'Records electrical commissioning and heat exchanger test results.',limits:'Fictional sample record.'}],
  ['operating','Co-op site operating responsibility','Active',{operator:'Wattle Reach Community Co-op (fictional)',duties:'Monitor service availability and respond to the facility manager.',due:'2027-12-15',evidence:'Fictional signed operations appendix.'},4],
  ['maintenance','Review heat meter after first month','Scheduled',{category:'Maintenance',lead:'Harper Quinn',due:'2027-10-15',impact:'Compare meter readings with the baseline and inspect the exchanger.'},4],
  ['milestone','First quarterly operating review','Planned',{lead:'Harper Quinn',due:'2027-12-15',next:'Collect metering results and usage figures for the host.'}],
  ['opportunity','Learning hub evening workload study','In discussion',{postcode:'4888',locality:'Banksia Bend',need:'Shared compute for local workshops and youth training.',lead:'Mira Banks',due:'2027-10-05',next:'Confirm room access with venue manager.'},null,true],
  ['calendar','Community information drop-in','Proposed',{event_date:'2027-09-28',channel:'Library meeting room',brief:'Show the project brief and gather questions.',lead:'Mira Banks'}]
];
const records=examples.map(([kind,title,status,data,linked,second],i)=>{
  const project=second?learning:operating;
  return {id:makeId(i+1),kind,title,status,data,project_title:project.title,project_id:project.id,
    due_date:data.event_date||data.due||'',related_id:linked?makeId(linked):null,
    related_title:linked?examples[linked-1][1]:'',related_kind:linked?examples[linked-1][0]:'',
    version:1,actor_name:i%2?'Mira Banks':'Harper Quinn',changed_at:'2027-09-15T04:00:00Z',reason:'Record the fictional worked example.'};
});
const headers = {
  'Content-Type':'text/html; charset=utf-8',
  'Cache-Control':'no-store',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex, nofollow'
};
export default {
  fetch(request) {
    const url=new URL(request.url);
    if(!['GET','HEAD'].includes(request.method))return new Response('The demo is view only.',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
    const requested=url.searchParams.get('desk');
    const desk=Object.hasOwn(desks,requested)?requested:'programme';
    const query=(url.searchParams.get('q')||'').trim().slice(0,100).toLowerCase();
    const project=url.searchParams.get('project')||'';
    const monthParam=url.searchParams.get('month')||'';
    const month=validMonth(monthParam)?monthParam:'2027-09';
    const active=url.searchParams.get('tool');
    const kinds=forDesk(desk);
    const tool=kinds.includes(active)?active:desk==='programme'?'':kinds[0];
    const options={desk,query,project,month,tool,demo:true,projectChoices:projects,showContacts:true};
    const response=(title,description,body,extra={})=>new Response(page({...options,...extra,title,description,body}),{headers});
    const subset=records.filter(r=>(!project||r.project_id===project)&&(!query||
      [r.title,r.project_title,projects.find(p=>p.id===r.project_id)?.postcode].some(x=>x?.toLowerCase().includes(query))));
    const count=rows=>rows.reduce((tot,r)=>({...tot,[r.kind]:(tot[r.kind]||0)+1}),{});
    if(url.pathname==='/'){
      const matches=projects.filter(p=>(!project||p.id===project)&&[p.title,p.locality,p.postcode].some(x=>x.toLowerCase().includes(query)));
      return response(...desks[desk],workspace(options,{projects:matches,counts:count(subset),
        records:subset.filter(r=>!tool||r.kind===tool&&(tool!=='calendar'||r.due_date.startsWith(month))),
        milestones:subset.filter(r=>r.kind==='milestone')}));
    }
    if(url.pathname.startsWith('/projects/')){
      const selected=projects.find(p=>p.id===url.pathname.slice(10));
      if(selected)return response(selected.title,selected.locality,detail(selected,selected===operating?history:[{
        version:1,actor_name:'Mira Banks',changed_at:learning.changed_at,
        reason:'Record initial host discussion.',snapshot:learning}],{...options,
        more:projectTools(selected,count(records.filter(r=>r.project_id===selected.id)),options)}));
    }
    if(url.pathname.startsWith('/records/')){
      const record=records.find(r=>validId(r.id)&&r.id===url.pathname.slice(9));
      if(record){
        const [recordDesk,,description]=tools[record.kind];
        const o={...options,desk:recordDesk,tool:record.kind,project:record.project_id};
        const revision={revision:record.version,actor_name:record.actor_name,changed_at:record.changed_at,reason:record.reason,snapshot:record};
        return response(record.title,description,recordPage(record,[revision],o),o);
      }
    }
    return new Response('Demo page not found.',{status:404,headers});
  }
};

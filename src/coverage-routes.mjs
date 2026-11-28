import {Problem} from './projects.mjs';
import {page} from './views.mjs';
import {options,filteredAreas,csvAreas,parseCodes} from './coverage-model.mjs';
import {nationalOverview,compareCatchment,coverageUrl,savedCatchments,catchmentDetail,catchmentEditor} from './coverage-view.mjs';
import {listCatchments,getCatchment,catchmentHistory,saveCatchment} from './coverage-catchments.mjs';

const descriptions={
  '/coverage':['National coverage','Explore Australian Postal Areas, their 2021 populations and the national compute scenario.'],
  '/coverage/compare':['Compare catchments','Calculate a shared service area using one or more postcodes.'],
  '/coverage/catchments':['Saved catchments','Plan shared coverage before creating a project or selecting a site.']
};
const coverageRoute=pathname=>pathname==='/coverage'||pathname.startsWith('/coverage/');
export {coverageRoute};

export function readCoverage(request,headers,account,preview,demo=false){
  const url=new URL(request.url);
  const settings=options(url.searchParams);
  const path=url.pathname;
  const ownerView=Boolean(account?.owner&&!preview&&!demo);
  const render=(title,description,body,status=200)=>new Response(request.method==='HEAD'?null:
    page({title,description,body,account,preview,desk:'places',demo,demoNotice:'Read-only demo. Population figures come from the ABS 2021 Census.'}),{status,headers});
  if(!['/coverage','/coverage/compare','/coverage/postal-areas.csv'].includes(path))return null;
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed.',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  if(path==='/coverage/postal-areas.csv'){
    return new Response(request.method==='HEAD'?null:csvAreas(filteredAreas(settings),settings),
      {headers:{...headers,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="missing-middle-postal-areas-2021.csv"'}});
  }
  if(path==='/coverage')return render(...descriptions[path],nationalOverview(filteredAreas(settings),settings,preview,ownerView));
  const input=(url.searchParams.get('codes')||'').slice(0,1801);
  let codes=[],problem='';
  try{codes=parseCodes(input);}catch(error){problem=error.message;}
  return render(...descriptions[path],compareCatchment(settings,preview,ownerView,codes,input,problem),problem?422:200);
}

export async function manageCoverage(request,headers,db,account,preview){
  if(!account?.owner||preview)throw new Problem(403,'Catchment planning requires the Webmaster.');
  const url=new URL(request.url);
  const path=url.pathname,settings=options(url.searchParams);
  const render=(title,description,body,status=200)=>new Response(request.method==='HEAD'?null:
    page({title,description,body,account,desk:'places'}),{status,headers});
  const editing=path==='/coverage/catchments/new'||path.endsWith('/edit');
  const detail=/^\/coverage\/catchments\/([a-f0-9-]+)(?:\/edit)?$/.exec(path);
  if(path!=='/coverage/catchments'&&!detail&&path!=='/coverage/catchments/new')throw new Problem(404,'Coverage page not found.');
  if(request.method==='POST'&&!editing)throw new Problem(405,'Open the catchment form to save.');
  if(!['GET','HEAD','POST'].includes(request.method))throw new Problem(405,'Method not allowed.');
  const id=detail?.[1];
  const record=id?await getCatchment(db,account,preview,id):null;
  if(request.method==='POST'){
    try{
      const saved=await saveCatchment(db,account,preview,id,request);
      return new Response(null,{status:303,headers:{...headers,Location:coverageUrl('/coverage/catchments/'+saved,settings,null)}});
    }catch(error){
      if(!(error instanceof Problem&&error.values))throw error;
      const fresh=id?await getCatchment(db,account,preview,id):null;
      if(fresh&&String(fresh.version)!==error.values.get('version'))throw new Problem(409,'Open the latest catchment before editing.');
      return render('Save catchment','Review the inputs before saving.',catchmentEditor(settings,fresh,error.values,'',error.message),422);
    }
  }
  if(editing)return render(record?'Edit catchment':'New planning catchment','Group postcodes without creating a project.',
    catchmentEditor(settings,record,null,(url.searchParams.get('codes')||'').slice(0,1800)));
  if(record){
    const n=Number(url.searchParams.get('before'));
    const before=Number.isSafeInteger(n)&&n>0?n:null;
    const history=await catchmentHistory(db,account,preview,id,before);
    return render(record.title,'Review the saved catchment and its planning benchmark.',catchmentDetail(record,history,settings,before));
  }
  return render(...descriptions[path],savedCatchments(await listCatchments(db,account,preview),settings));
}

import {escape as esc,packPreview,q,toAU} from './views.mjs';
import {coverageMeta,postalAreas,regionPaths,regionNames,stateNames,labels,sortColumns,scale,totals} from './coverage-model.mjs';

import {activateCoverageMap,mapWidth,mapHeight,pointBounds} from './coverage-map.mjs';

const number=new Intl.NumberFormat('en-AU');
const decimal=new Intl.NumberFormat('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
const n=value=>number.format(Math.round(value));
const d=value=>decimal.format(value);
const palette=['#7994a4','#3abd9e','#24aee2','#c08af1','#ffd09a'];
const size=[1.2,1.55,2.15,2.6,3.3];
const bins=[['Under 1,000',0],['1,000 to 4,999',1000],['5,000 to 9,999',5000],['10,000 to 24,999',10000],['25,000 or more',25000]];
const styles=`<style>
.coverage-tabs{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.9rem}
.coverage-tabs [aria-current]{background:#174a52;color:#fff}
.coverage-grid{display:grid;grid-template-columns:minmax(0,2.2fr) minmax(15rem,1fr);gap:1rem;align-items:start}
.coverage-grid .desk-section{margin-top:0}.coverage-stats{margin:1rem 0}
.coverage-stat{border-top:4px solid #3bbf9b}.coverage-stat:nth-child(2){border-top-color:#49b7e6}.coverage-stat:nth-child(3){border-top-color:#ab79d7}.coverage-stat:nth-child(4){border-top-color:#d9a355}
.coverage-stat strong{font-size:clamp(1.4rem,3vw,2rem)}.coverage-stat small{display:block;margin-top:.35rem}
.coverage-map{display:block;width:100%;aspect-ratio:790/626;height:auto;background:#112d42;border-radius:.7rem;touch-action:pan-y}
.coverage-map:focus-visible{outline:3px solid #065f62;outline-offset:3px}
[data-zoomed=true] .coverage-map{cursor:grab;touch-action:none}
[data-dragging=true] .coverage-map{cursor:grabbing}
.coverage-map-toolbar{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap;margin-bottom:.65rem}
.coverage-map-toolbar[hidden]{display:none}
.coverage-map-toolbar button{min-width:2.75rem;min-height:2.65rem}
.coverage-map-toolbar button[aria-disabled=true]{opacity:.6}
.coverage-map-toolbar output{white-space:nowrap;font-size:.85rem;color:#314d55}
.coverage-map-help{font-size:.85rem;margin:.55rem 0}
.coverage-sort-link{display:inline-flex;align-items:center;gap:.3rem;color:#15434f;text-decoration:underline;text-underline-offset:.18em}
.coverage-sort-link[aria-label] span{font-weight:bold}
.coverage-table th[aria-sort]{background:#deefe8}
#coverage-filters,#register{scroll-margin-top:1rem}
.coverage-legend{display:flex;flex-wrap:wrap;gap:.35rem .85rem;margin:.7rem 0;font-size:.78rem}
.coverage-legend span{display:inline-flex;align-items:center;gap:.35rem}.coverage-legend i{width:.65rem;height:.65rem;border-radius:100%;display:inline-block;border:1px solid #527180}
.coverage-regions{display:grid;grid-template-columns:1fr;gap:.45rem}
.coverage-region{display:flex;justify-content:space-between;text-decoration:none;gap:.35rem;padding:.4rem .5rem;border:1px solid #cedbd8;border-radius:.45rem;align-items:center;font-size:.89rem}
.coverage-region[aria-current]{background:#e3f4ec;border-color:#065f62}.coverage-region:hover{border-color:#065f62}
.coverage-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(10rem,100%),1fr));gap:.7rem;align-items:end}
.coverage-form textarea{min-height:6rem}.coverage-form .span-all{grid-column:1/-1}
.coverage-table-wrap{overflow:auto}.coverage-table{width:100%;border-collapse:collapse;text-align:left;font-size:.9rem}
.coverage-table th,.coverage-table td{padding:.48rem .55rem;border-bottom:1px solid #e0eae6}.coverage-table th{background:#eaf2ef;white-space:nowrap}
.coverage-table td:nth-child(n+3){font-variant-numeric:tabular-nums}.coverage-table tr:hover{background:#f4faf8}
.coverage-result{padding:.85rem 1rem;border-left:4px solid #3bbf9b;background:#eef8f3;margin:.8rem 0;border-radius:.35rem;overflow-wrap:anywhere}
.coverage-source li{margin:.4rem 0}.coverage-codes{overflow-wrap:anywhere}.coverage-notes{white-space:pre-wrap;overflow-wrap:anywhere}
@media(max-width:940px){.coverage-grid{grid-template-columns:1fr}.coverage-regions{grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))}}
</style>`;

function section(title,description,body){
  return `<section class="desk-section"><div class="section-heading"><div><h2>${esc(title)}</h2>
  <p>${esc(description)}</p></div></div><div class="section-body">${body}</div></section>`;
}
function stat(value,label,detail=''){
  return `<div class="stat coverage-stat"><strong>${esc(value)}</strong><span>${esc(label)}</span>
  ${detail?`<small>${esc(detail)}</small>`:''}</div>`;
}
export function coverageUrl(path,settings,preview,changes={}){
  const m={...settings,...changes};
  return path+q({q:m.prefix,region:m.region,sort:m.sort==='code'?'':m.sort,dir:m.direction==='desc'?'desc':'',population:m.population,rate:m.rate,
    page:m.page>1?m.page:'',...packPreview(preview),codes:m.codes,before:m.before});
}
const link=(title,url,active=false)=>`<a class="button secondary" href="${esc(url)}"${active?' aria-current="page"':''}>${esc(title)}</a>`;
const hidden=(name,value)=>value?`<input type="hidden" name="${esc(name)}" value="${esc(value)}">`:'';
const preserve=(preview)=>Object.entries(packPreview(preview)).map(([key,value])=>hidden(key,value)).join('');
function tabs(path,settings,preview,showSaved){
  return `<nav class="coverage-tabs" aria-label="National coverage views" style="position:static">
    ${link('National overview',coverageUrl('/coverage',settings,preview,{page:1}),path==='/coverage')}
    ${link('Compare a catchment',coverageUrl('/coverage/compare',settings,preview,{page:1}),path==='/coverage/compare')}
    ${showSaved?link('Saved catchments',coverageUrl('/coverage/catchments',settings,preview,{page:1}),path.startsWith('/coverage/catchments')):''}</nav>`;
}
const countrySvg=regionNames.map(name=>regionPaths[name]?`<path d="${esc(regionPaths[name])}" fill-rule="evenodd"><title>${esc(labels[name])}</title></path>`:'').join('');
const srcPop='https://www.abs.gov.au/census/find-census-data/datapacks';
const srcNational='https://www.abs.gov.au/statistics/people/population/population-census/2021';
const srcGeo='https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files';
function mapLayers(rows){
  const points=Array.from({length:5},()=>[]);
  for(const [,population,x,y] of rows){
    if(x===null||population===null)continue;
    let i=0;
    while(i<4&&population>=bins[i+1][1])i++;
    points[i].push(`M${x},${y}h.01`);
  }
  return points.map((parts,i)=>parts.length?`<path d="${parts.join('')}" stroke="${palette[i]}" stroke-width="${2*size[i]}" vector-effect="non-scaling-stroke"/>`:'').join('');
}
const completeLayers=mapLayers(postalAreas);
function coverageMap(rows,nonce){
  const bounds=pointBounds(rows);
  const mark=rows.length===1&&rows[0][2]!==null?
    `<circle data-map-focus cx="${rows[0][2]}" cy="${rows[0][3]}" r="7" stroke="#fff" stroke-width="1.7" fill="none" vector-effect="non-scaling-stroke"/>`:'';
  return `<div id="coverage-zoom" data-extent="${bounds?.join(',')||''}">
  <div class="coverage-map-toolbar" role="group" aria-label="Map zoom controls" data-map-toolbar hidden>
    <button type="button" data-map-action="in" aria-label="Zoom in">+</button>
    <button type="button" data-map-action="out" aria-label="Zoom out">−</button>
    <button type="button" data-map-action="fit"${bounds?'':' disabled'}>Fit results</button>
    <button type="button" data-map-action="reset">Reset map</button>
    <output data-map-status aria-live="polite">Zoom 100%</output>
  </div>
  <svg class="coverage-map" viewBox="0 0 ${mapWidth} ${mapHeight}" role="img"
    aria-label="Map of Australian Postal Areas by 2021 population" aria-describedby="coverage-map-help">
    <g fill="#26465c" stroke="#6d8b9b" stroke-width="1">${countrySvg}</g>
    <g fill="none" opacity=".84" stroke-linecap="round">${rows.length===postalAreas.length?completeLayers:mapLayers(rows)}</g>${mark}
  </svg>
  <p id="coverage-map-help" class="coverage-map-help">Zoom with + or −, then drag or use the arrow keys. Fit results shows the areas that match your filters.</p>
  ${nonce?`<script nonce="${nonce}">(${activateCoverageMap.toString()})(document.getElementById('coverage-zoom'));</script>`:''}
  </div>
  <div class="coverage-legend">${bins.map(([label],i)=>`<span><i style="background:${palette[i]}"></i>${label}</span>`).join('')}</div>
  <p class="muted">Each dot marks a representative point for a 2021 ABS Postal Area. The register also includes the ${n(coverageMeta.notOnMap)} areas outside this national map frame.</p>`;
}
const regionCounts=Object.fromEntries(regionNames.map((name,i)=>[name,postalAreas.filter(row=>row[4]&(1<<i)).length]));
function regionPanel(settings,preview){
  const all=[['','All of Australia',coverageMeta.areaCount],...regionNames.map(name=>[name,labels[name],regionCounts[name]])];
  return `<div class="coverage-regions">${all.map(([id,label,count])=>`<a class="coverage-region" href="${esc(coverageUrl('/coverage',settings,preview,{region:id,page:1})+'#map')}"
    ${settings.region===id?' aria-current="page"':''}>${esc(label)} <strong>${n(count)}</strong></a>`).join('')}</div>
    <p class="workspace-note">Areas that cross a border appear in more than one regional filter. The national count includes each area once.</p>`;
}
const opts=(items,selected)=>items.map(([value,label])=>`<option value="${esc(value)}"${selected===value?' selected':''}>${esc(label)}</option>`).join('');
function searchForm(settings,preview){
  return `<form class="coverage-form" method="get" action="/coverage#coverage-filters">${preserve(preview)}
    <label>Postcode or prefix<input type="search" name="q" inputmode="numeric" maxlength="4" value="${esc(settings.prefix)}" placeholder="e.g. 4183"></label>
    <label>State or territory<select name="region">${opts([['','All of Australia'],...regionNames.map(r=>[r,labels[r]])],settings.region)}</select></label>
    <label>Sort by<select name="sort">${opts(Object.entries(sortColumns),settings.sort)}</select></label>
    <label>Order<select name="dir">${opts([['asc','Ascending'],['desc','Descending']],settings.direction)}</select></label>
    <label>National scenario population<input name="population" type="number" min="1000000" max="100000000" value="${settings.population}" required></label>
    <label>Residents per rack<input name="rate" type="number" min="100" max="1000000" value="${settings.rate}" required></label>
    <button type="submit">Apply</button></form>`;
}
function columns(rows,settings,preview,sortable=false){
  const headings=Object.entries(sortColumns).map(([key,label])=>{
    if(!sortable)return `<th scope="col">${esc(label)}</th>`;
    const active=settings.sort===key;
    const next=active?(settings.direction==='asc'?'desc':'asc'):['code','region'].includes(key)?'asc':'desc';
    const aria=active?` aria-sort="${settings.direction==='asc'?'ascending':'descending'}"`:'';
    const href=coverageUrl('/coverage',settings,preview,{sort:key,direction:next,page:1})+'#register';
    const arrow=active?(settings.direction==='asc'?'↑':'↓'):'↕';
    return `<th scope="col"${aria}><a class="coverage-sort-link" href="${esc(href)}"
      aria-label="Sort by ${esc(label)}, ${next==='asc'?'ascending':'descending'}">${esc(label)} <span aria-hidden="true">${arrow}</span></a></th>`;
  }).join('');
  return `<div class="coverage-table-wrap"><table class="coverage-table">
    <thead><tr>${headings}</tr></thead><tbody>
    ${rows.map(row=>{
      const scenario=scale(row[1],settings);
      const href=coverageUrl('/coverage',settings,preview,{prefix:row[0],region:'',page:1})+'#register';
      return `<tr><th scope="row"><a href="${esc(href)}">${esc(row[0])}</a></th>
        <td>${esc(stateNames(row).join(', ')||'Unmatched')}</td>
        <td>${row[1]===null?'No population match':n(row[1])}</td>
        <td>${scenario?n(scenario.people):'–'}</td><td>${scenario?d(scenario.racks):'–'}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}
function methodology(){
  return `<details class="card coverage-source"><summary>Sources and how the scenario is calculated</summary><ul>
    <li><a href="${srcPop}">ABS 2021 Census General Community Profile</a>, Postal Areas, G01 Total Persons at place of usual residence. The source is versioned as <code>${esc(coverageMeta.version)}</code>.</li>
    <li><a href="${srcGeo}">ABS ASGS Edition 3 boundaries</a> provide the 2021 Postal Areas and the state and territory outlines. Regions are based on geographic overlap. Some Postal Areas cross regional boundaries. Their resident count is recorded once per Postal Area and is never split or duplicated in the national total.</li>
    <li>ABS Postal Areas approximate geographic delivery postcodes. A number with no matching area may be absent from the 2021 geography or may be a non-geographic postal code. The register does not establish whether a postal code is currently valid.</li>
    <li>Each area’s scenario population uses its share of the national Census baseline. The scenario holds that share constant and does not predict local growth. Rack equivalents divide that result by the residents-per-rack assumption. Fractions help compare catchments; they are not site commitments.</li>
    <li>The <a href="${srcNational}">published national Census count</a> includes people outside mapped Postal Areas. Census perturbation also affects reconciliation, so the national count and the sum of areas are shown separately.</li>
    <li>Source data: Australian Bureau of Statistics, 2021 Census and ASGS Edition 3, <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Map outlines, display points and scenario figures are derived.</li>
    </ul></details>`;
}
export function nationalOverview(rows,settings,preview,showSaved,nonce){
  const first=(settings.page-1)*40,paged=rows.slice(first,first+40), pages=Math.max(1,Math.ceil(rows.length/40));
  const manualMissing=settings.prefix.length===4&&/^\d{4}$/.test(settings.prefix)&&!postalAreas.some(row=>row[0]===settings.prefix);
  const filteredPopulation=rows.reduce((sum,row)=>sum+(row[1]??0),0);
  const unmapped=Math.max(0,coverageMeta.nationalPopulation-coverageMeta.mappedPopulation);
  const benchmark=settings.population/settings.rate;
  return styles+tabs('/coverage',settings,preview,showSaved)+
    `<div class="stat-grid coverage-stats">
      ${stat(n(coverageMeta.areaCount),'ABS Postal Areas','2021 Census geography')}
      ${stat(n(coverageMeta.mappedPopulation),'Residents in mapped areas','2021 usual resident counts')}
      ${stat(n(settings.population),'Scenario population','Adjust in the planning filters')}
      ${stat(d(benchmark),'National rack equivalents','One per '+n(settings.rate)+' scenario residents')}
    </div>`+
    `<div class="controls">${link('Find a postcode or adjust the scenario','#coverage-filters')}</div>`+
    `<div id="map" class="coverage-grid">`+
    section('National population map','Colour and size represent 2021 usual residents.',coverageMap(rows,nonce))+
    section('Regions','Filter the register using 2021 boundaries.',regionPanel(settings,preview))+
    '</div>'+
    `<div id="coverage-filters">`+section('Planning filters','Change assumptions without altering the Census baseline.',searchForm(settings,preview))+'</div>'+
    `<div id="register">`+section('Postcode and population register','Every mapped area is available here and in the CSV.',
      `<p><strong>${n(rows.length)}</strong> matching areas · <strong>${n(filteredPopulation)}</strong> Census residents in those areas.</p>
      ${manualMissing?`<p class="coverage-result"><strong>No population match for ${esc(settings.prefix)}.</strong> This code has no matching mapped ABS Postal Area in the 2021 dataset.</p>`:''}
      ${paged.length?columns(paged,settings,preview,true):rows.length?'<p>This page is outside the selected results.</p>':'<p>Try another four-digit code or prefix.</p>'}
      <div class="controls">
      ${settings.page>1?link('Previous page',coverageUrl('/coverage',settings,preview,{page:Math.min(pages,settings.page-1)})+'#register'):''}
      ${settings.page<pages?link('Next page',coverageUrl('/coverage',settings,preview,{page:settings.page+1})+'#register'):''}
      ${rows.length?`<span>Page ${n(settings.page)} of ${n(pages)}</span>`:''}
      ${link('Download this selection as CSV',coverageUrl('/coverage/postal-areas.csv',settings,preview,{page:1}))}
      </div>`)+`</div>`+
    section('Census reconciliation','Planning calculations use the published national baseline.',
      `<p><strong>${n(coverageMeta.nationalPopulation)}</strong> published national Census count · <strong>${n(coverageMeta.mappedPopulation)}</strong> summed mapped areas.</p>
       <p>The difference is ${n(unmapped)} people on the Census baseline. ${d(scale(unmapped,settings).racks)} scenario rack equivalents remain outside this mapped allocation.</p>`)+methodology();
}
function resultSummary(result,settings,preview){
  return `<div class="stat-grid coverage-stats">
    ${stat(n(result.matched),'Matched Postal Areas',n(result.missing.length)+' without a population match')}
    ${stat(result.matched?n(result.residents):'–','Known Census residents','2021')}
    ${stat(result.estimate?n(result.estimate.people):'–','Scenario residents','Within the matched areas')}
    ${stat(result.estimate?d(result.estimate.racks):'–','Rack equivalents','Sum residents before dividing')}
  </div>
  ${result.missing.length?`<p class="coverage-result coverage-codes"><strong>No population match:</strong> ${esc(result.missing.join(', '))}. The totals cover the matched areas only.</p>`:''}
  ${result.rows.length?columns(result.rows,settings,preview):''}`;
}
export function compareCatchment(settings,preview,showSaved,codes,input,problem=''){
  const keep=hidden('population',settings.population)+hidden('rate',settings.rate)+preserve(preview);
  const calculated=codes.length?totals(codes,settings):null;
  return styles+tabs('/coverage/compare',settings,preview,showSaved)+
    section('Catchment calculator','Group postcodes before calculating rack equivalents.',
      `<form class="coverage-form" method="get" action="/coverage/compare">${keep}
       <label class="span-all">Postcodes<textarea name="codes" maxlength="1800" placeholder="Separate four-digit codes with commas or spaces">${esc(input)}</textarea></label>
       <button type="submit">Calculate catchment</button></form>
       ${problem?`<p class="notice" role="alert">${esc(problem)}</p>`:''}
       <p class="workspace-note">National scenario: ${n(settings.population)} residents · one rack per ${n(settings.rate)}. Duplicate codes count once.</p>`)+
    (calculated?section('Catchment results','Uses only the known population across the selected areas.',
      resultSummary(calculated,settings,preview)+(showSaved?`<div class="controls">${link('Save this catchment',coverageUrl('/coverage/catchments/new',settings,null,{codes:codes.join(',')}))}</div>`:'')):'');
}
export function savedCatchments(catchments,settings){
  const scoped=catchments.map(c=>({...c,result:totals(c.postcodes,settings)}));
  const allCodes=scoped.flatMap(c=>c.postcodes);
  const combined=totals(allCodes,settings);
  const duplicateCount=allCodes.length-new Set(allCodes).size;
  return styles+tabs('/coverage/catchments',settings,null,true)+
    section('Saved planning catchments','Review which areas have been grouped and where those groups overlap.',
      `<div class="controls">${link('Create a catchment',coverageUrl('/coverage/catchments/new',settings,null))}</div>
      ${scoped.length?`<div class="record-grid">${scoped.map(c=>`<article class="record-tile">
        <h3><a href="${esc(coverageUrl('/coverage/catchments/'+c.id,settings,null))}">${esc(c.title)}</a></h3>
        <p>${c.result.matched?n(c.result.residents)+' Census residents':'No population match'} ·
          ${c.result.estimate?d(c.result.estimate.racks)+' rack equivalents':'No estimate'}</p>
        <p class="meta">${n(c.postcodes.length)} codes · v${c.version} · ${esc(c.actor_name)}</p></article>`).join('')}</div>`:
        '<div class="empty-state">No catchments saved. Use the calculator or create a group of postcodes.</div>'}`)+
    (scoped.length?section('Combined planning footprint','Counts every Postal Area once across all the saved catchments.',
      `<p>${duplicateCount?n(duplicateCount)+' repeated selections were counted once across groups.':'The saved catchments have no overlapping codes.'}</p>
       <div class="stat-grid">${stat(n(combined.matched),'Unique matched areas')}
         ${stat(combined.matched?n(combined.residents):'–','Known Census residents')}
         ${stat(combined.estimate?d(combined.estimate.racks):'–','Rack equivalents')}
       </div>${combined.missing.length?`<p>${n(combined.missing.length)} selected codes have no population match.</p>`:''}`):'');
}
export function catchmentDetail(record,history,settings,before){
  const result=totals(record.postcodes,settings);
  const base='/coverage/catchments/'+record.id;
  return styles+tabs('/coverage/catchments',settings,null,true)+
    section(record.title,'A saved planning group in the national register.',
      `<div class="controls">${link('Edit catchment',coverageUrl(base+'/edit',settings,null))}
        ${link('Compare in calculator',coverageUrl('/coverage/compare',settings,null,{codes:record.postcodes.join(',')}))}</div>
       ${record.notes?`<p class="coverage-notes">${esc(record.notes)}</p>`:''}
       <p class="muted">v${record.version} · ${esc(record.actor_name)} · ${esc(toAU(record.changed_at))} · saved against ${esc(record.source_version)}</p>
       ${resultSummary(result,settings,null)}`)+section('Signed revisions','Review the saved geographic scope and change notes.',
      `${history.slice(0,25).map(row=>`<details class="card"><summary>v${row.version} · ${esc(row.actor_name)} · ${esc(toAU(row.changed_at))}</summary>
        <p>${esc(row.reason)}</p><p class="coverage-codes">${esc(row.snapshot.postcodes.join(', '))}</p>
        ${row.snapshot.notes?`<p class="coverage-notes">${esc(row.snapshot.notes)}</p>`:''}</details>`).join('')}
      <div class="controls">${history.length>25?link('Older revisions',coverageUrl(base,settings,null,{before:history[24].version})):''}
      ${before?link('Newest revisions',coverageUrl(base,settings,null)):''}</div>`);
}
export function catchmentEditor(settings,record,values,input,problem=''){
  const path=record?'/coverage/catchments/'+record.id+'/edit':'/coverage/catchments/new';
  const val=(k,fallback='')=>values?.get(k)??fallback;
  const postcodeValue=record?record.postcodes.join(', '):input;
  return styles+tabs(path,settings,null,true)+section(record?'Edit catchment':'New catchment','Name the group and keep a signed note of why it was saved.',
    `${problem?`<p class="notice" role="alert">${esc(problem)}</p>`:''}
    <form class="coverage-form" action="${esc(coverageUrl(path,settings,null))}" method="post">
    <input type="hidden" name="version" value="${record?.version??0}">
    <input type="hidden" name="request_key" value="${crypto.randomUUID()}">
    <label class="span-all">Catchment name<input name="title" required maxlength="120" value="${esc(val('title',record?.title))}"></label>
    <label class="span-all">Postcodes<textarea name="postcodes" required maxlength="1800" placeholder="Four digits each. Keep leading zeroes.">${esc(val('postcodes',postcodeValue))}</textarea></label>
    <label class="span-all">Planning notes<textarea name="notes" maxlength="1500">${esc(val('notes',record?.notes))}</textarea></label>
    <label class="span-all">Reason for this save<textarea name="reason" required maxlength="500">${esc(val('reason'))}</textarea></label>
    <button type="submit">Save catchment</button> <a href="${esc(coverageUrl(record?'/coverage/catchments/'+record.id:'/coverage/catchments',settings,null))}">Cancel</a></form>`);
}

import {coverageMeta,postalAreas,regionNames,regionPaths} from './coverage-data.mjs';
export {coverageMeta,postalAreas,regionNames,regionPaths};

export const defaultPopulation=30_000_000;
export const defaultRate=10_000;
export const largeAreaMinimum=10_000;
export const smallAreaMaximum=largeAreaMinimum-1;
export const byPostcode=new Map(postalAreas.map(row=>[row[0],row]));
export const labels={NSW:'New South Wales',VIC:'Victoria',QLD:'Queensland',SA:'South Australia',WA:'Western Australia',
  TAS:'Tasmania',NT:'Northern Territory',ACT:'Australian Capital Territory',OT:'Other Territories'};
export const stateNames=row=>regionNames.filter((_,i)=>row[4]&(1<<i));
export const sortColumns={code:'Postal Area',region:'Region',census:'2021 residents',scenario:'Scenario residents',racks:'Rack equivalents'};
const regionSortKey=Object.fromEntries(postalAreas.map(row=>[
  row[0],stateNames(row).map(name=>labels[name]).sort().join(', ')||null
]));
const compare=(a,b)=>a<b?-1:a>b?1:0;

function bound(value,fallback,min,max) {
  if(!/^\d{1,9}$/.test(value||'')) return fallback;
  const n=Number(value);
  return n>=min&&n<=max?n:fallback;
}

export function options(params) {
  const entered=params.get('q')||'';
  const prefix=entered.trim().slice(0,24);
  const region=params.get('region')||'';
  const requestedBand=params.get('band')??(params.get('small')==='1'?'small':'all');
  const band=['small','large'].includes(requestedBand)?requestedBand:'all';
  const sort=params.get('sort')||(band==='all'?'code':'census');
  const direction=params.get('dir')||(sort==='high'||(band==='large'&&!params.get('sort'))?'desc':'asc');
  return {
    prefix,region:Object.hasOwn(labels,region)?region:'',
    sort:sort==='high'||sort==='low'?'census':Object.hasOwn(sortColumns,sort)?sort:'code',
    direction:direction==='desc'?'desc':'asc',
    band, maximum:bound(params.get('max'),smallAreaMaximum,0,smallAreaMaximum),
    population:bound(params.get('population'),defaultPopulation,1_000_000,100_000_000),
    rate:bound(params.get('rate'),defaultRate,100,1_000_000),
    page:bound(params.get('page'),1,1,300)
  };
}

export function filteredAreas(settings) {
  const bit=settings.region?1<<regionNames.indexOf(settings.region):0;
  const {band,maximum}=settings;
  const rows=postalAreas.filter(row=>{
    if((bit&&!(row[4]&bit))||!row[0].startsWith(settings.prefix))return false;
    const population=row[1];
    if(band==='small')return population!==null&&population<=maximum;
    if(band==='large')return population!==null&&population>=largeAreaMinimum;
    return true;
  });

  const {sort,direction}=settings;
  const directionFactor=direction==='desc'?-1:1;
  if(sort==='code')return directionFactor<0?rows.reverse():rows;
  const value=sort==='region'?row=>regionSortKey[row[0]]:row=>row[1];
  // Scenario residents and rack equivalents are positive multiples of 2021 residents.
  rows.sort((a,b)=>{
    const first=value(a),second=value(b);
    if(first===null||second===null)return first===second?compare(a[0],b[0]):first===null?1:-1;
    return directionFactor*compare(first,second)||compare(a[0],b[0]);
  });
  return rows;
}

export function scale(population,settings){
  if(population===null)return null;
  const denominator=Math.max(coverageMeta.nationalPopulation,coverageMeta.mappedPopulation);
  const estimate=population/denominator*settings.population;
  return {people:estimate,racks:estimate/settings.rate};
}

export function parseCodes(text) {
  const entered=(text||'').trim();
  if(entered.length>1800)throw new RangeError('Enter up to 250 different four-digit postcodes.');
  const parts=entered?entered.split(/[\s,;]+/):[];
  const codes=[...new Set(parts)].sort();
  if(codes.length>250)throw new RangeError('Enter up to 250 different four-digit postcodes.');
  if(codes.some(x=>!/^\d{4}$/.test(x)))throw new TypeError('Use four digits per postcode and retain any leading zero.');
  return codes;
}

export function totals(codes,settings) {
  const distinct=[...new Set(codes)];
  const rows=distinct.map(code=>byPostcode.get(code)||[code,null,null,null,0]);
  const missing=rows.filter(row=>row[1]===null).map(row=>row[0]);
  const matched=rows.length-missing.length;
  const residents=rows.reduce((total,row)=>total+(row[1]??0),0);
  return {rows,missing,matched,residents,estimate:matched?scale(residents,settings):null};
}

export function csvAreas(rows,settings){
  const header='postal_area_2021,states_and_territories,usual_residents_2021,scenario_population,rack_equivalents,source_version';
  return [header,...rows.map(row=>{
    const scenario=scale(row[1],settings);
    return [row[0],stateNames(row).join('|'),row[1]??'',scenario?scenario.people.toFixed(2):'',
      scenario?scenario.racks.toFixed(6):'',coverageMeta.version].join(',');
  })].join('\r\n')+'\r\n';
}

import {desks,page,portfolio,detail} from './views.mjs';

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
const headers = {
  'Content-Type':'text/html; charset=utf-8',
  'Cache-Control':'no-store',
  'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex, nofollow'
};
export default {
  fetch(request) {
    const url = new URL(request.url);
    const notFound = 'Demo page not found.';
    if (!['GET','HEAD'].includes(request.method)) {
      return new Response('The demo is view only.',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
    }
    const requested = url.searchParams.get('desk');
    const desk = Object.hasOwn(desks,requested) ? requested : 'programme';
    const query = (url.searchParams.get('q') ?? '').trim().slice(0,100);
    const options = {desk,query,demo:true};
    if (url.pathname==='/') {
      const matches = [operating.title,operating.locality,operating.postcode]
        .some(value=>value.toLowerCase().includes(query.toLowerCase()));
      const [title,description] = desks[desk];
      return new Response(page({...options,title,description,body:portfolio(matches?[operating]:[],options)}),{headers});
    }
    if (url.pathname==='/projects/'+id) {
      return new Response(page({...options,title:operating.title,description:operating.locality,
        body:detail(operating,history,options)}),{headers});
    }
    return new Response(notFound,{status:404,headers});
  }
};

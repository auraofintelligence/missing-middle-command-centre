const text=(key,label,required=false)=>({key,label,required,type:'text'});
const note=(key,label,required=false)=>({key,label,required,type:'note'});
const date=(key,label)=>({key,label,type:'date'});
const money=(key,label)=>({key,label,type:'money'});
const choice=(key,label,values)=>({key,label,type:'choice',values});
const link=(key,label,kinds)=>({key,label,type:'link',kinds});
const lead=text('lead','Responsible person or role',true);
const next=note('next','Next action');
const due=date('due','Due date');
const evidence=note('evidence','Evidence or reference');

export const tools = {
  milestone: ['programme','Milestones','Track upcoming commitments and what is blocked.',['Planned','Under way','Blocked','Complete'],[lead,due,next,evidence]],
  organisation: ['places','Organisations','Record a host, funder, delivery partner or proposed co-op.',['Prospect','In discussion','Confirmed','Closed'],[choice('role','Organisation role',['Host','Funder','Delivery partner','Co-op','Other']),text('locality','Locality'),note('relationship','Relationship and interests',true),evidence,next]],
  opportunity: ['places','Postcode opportunities','Research local demand, facilities and community participation.',['Research','Qualified','In discussion','On hold','Closed'],[{key:'postcode',label:'Postcode',type:'postcode',required:true},text('locality','Locality',true),link('related','Potential host',['organisation']),note('need','Local need or opportunity',true),lead,due,next,evidence]],
  contact: ['places','Consented contacts','Keep contact permissions and follow-ups together.',['Permission pending','Consented','Declined','Withdrawn'],[link('related','Organisation',['organisation']),text('channel','Consented contact details'),text('purpose','Contact purpose',true),date('consent_date','Permission recorded on'),note('consent','Permission source and scope'),due,next]],
  site: ['sites','Candidate sites','Record feasibility for power, connectivity, workload and useful heat.',['Research','Feasibility','Site brief ready','On hold'],[text('locality','Locality',true),link('related','Host organisation',['organisation']),note('power','Power and connectivity'),note('workload','Expected workloads'),note('heat','Potential heat use'),note('constraints','Site constraints'),evidence]],
  work_package: ['sites','Work packages','Define the scope, dependencies and evidence for delivery.',['Draft','Scoped','In progress','Evidence received','Complete'],[link('related','Candidate site',['site']),choice('category','Package type',['Site assessment','Design','Heat recovery','UPS installation','Other installation','Commissioning']),note('scope','Scope and exclusions',true),note('dependencies','Dependencies'),lead,due,evidence]],
  funding_bid: ['funding','Funding pipeline','Track opportunities, applications, decisions and grant conditions.',['Research','Preparing','Submitted','Decision recorded','Closed'],[link('related','Funding organisation',['organisation']),money('requested','Amount requested (AUD)'),money('awarded','Amount awarded (AUD)'),due,note('conditions','Eligibility or conditions'),evidence]],
  budget: ['funding','Budget lines','Record estimates, commitments and actuals as separate amounts.',['Estimate','Committed','Actual recorded'],[link('related','Related work package',['work_package']),money('estimate','Estimate (AUD)'),money('committed','Committed (AUD)'),money('actual','Actual (AUD)'),evidence]],
  readiness: ['coops','Co-op readiness','Record formation, workforce and operating readiness.',['Exploring','People interested','Formation under way','Readiness evidenced'],[link('related','Co-op organisation',['organisation']),note('capability','Capacity and training',true),note('gaps','Outstanding readiness items'),lead,due,next,evidence]],
  handover: ['coops','Management handovers','Record the receiving operator, exact agreement and effective date.',['Draft','In review','Acceptance recorded'],[link('related','Related site',['site']),text('receiver','Receiving entity',true),text('interim','Interim operator'),date('effective','Management effective date'),note('responsibilities','Management responsibilities',true),note('retained','Retained obligations and review'),note('ownership','Ownership or custody reference'),evidence]],
  story: ['media','Editorial workspace','Draft project stories, record outlet and review the copy.',['Draft','Ready for review','Changes requested','Review recorded'],[text('outlet','Intended audience or outlet'),note('copy','Draft copy',true),note('rights','Source and usage permissions'),note('review','Review decision or feedback'),lead,due]],
  calendar: ['media','Media calendar','Plan project updates and events by date.',['Proposed','Planned','Complete','Cancelled'],[date('event_date','Calendar date'),text('channel','Channel or venue'),note('brief','Activity and preparation',true),lead]],
  decision: ['records','Decision register','Record the resolution, who made it and its evidence.',['Draft','For review','Decision recorded','Superseded'],[text('authority','Decision maker or authority'),date('decided','Decision date'),note('resolution','Proposed or recorded decision',true),evidence,next]],
  evidence: ['records','Evidence register','Index a document, meeting note or other evidence against a project.',['To check','Checked','Superseded'],[text('reference','Document or meeting reference',true),text('custodian','Custodian'),date('recorded','Evidence date'),note('summary','What this evidence establishes',true),note('limits','Use or access restrictions')]],
  operating: ['operations','Operator register','Record who is responsible for support, operation and review.',['Proposed','Interim','Active','Closed'],[link('related','Related site',['site']),text('operator','Accountable operator',true),note('duties','Duties and support contacts',true),due,evidence]],
  maintenance: ['operations','Maintenance and incidents','Log changes, service issues and renewal actions.',['Open','Scheduled','In progress','Resolved'],[link('related','Related site',['site']),choice('category','Work type',['Maintenance','Incident','Renewal','Access review']),lead,due,note('impact','Impact or work required',true),note('resolution','Resolution or review outcome'),evidence]]
};
export const forDesk = desk => Object.entries(tools).filter(([,tool])=>tool[0]===desk).map(([kind])=>kind);
export const terminal = new Set(['Complete','Closed','Resolved','Cancelled','Superseded']);
export const actions = {
  milestone:'Add milestone',organisation:'Add organisation',opportunity:'Add opportunity',contact:'Add contact',
  site:'Add site',work_package:'Add work package',funding_bid:'Add funding opportunity',budget:'Add budget line',
  readiness:'Add readiness review',handover:'Add handover',story:'Draft a story',calendar:'Plan an activity',
  decision:'Add decision',evidence:'Add evidence reference',operating:'Add operator',maintenance:'Log service work'
};

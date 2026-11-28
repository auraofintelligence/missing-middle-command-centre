export const mapWidth=790;
export const mapHeight=626;

export function pointBounds(rows) {
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  for(const [,population,x,y] of rows) {
    if(population===null||x===null||y===null)continue;
    left=Math.min(left,x);
    top=Math.min(top,y);
    right=Math.max(right,x);
    bottom=Math.max(bottom,y);
  }
  return Number.isFinite(left)?[left,top,right,bottom]:null;
}

// This function is shared verbatim with the browser as a nonce-authorised script.
export function activateCoverageMap(root) {
  const map=root.querySelector('svg');
  const toolbar=root.querySelector('[data-map-toolbar]');
  const status=root.querySelector('[data-map-status]');
  const focusMark=root.querySelector('[data-map-focus]');
  const buttons=Object.fromEntries([...toolbar.querySelectorAll('button')].map(button=>[button.dataset.mapAction,button]));
  const original=map.viewBox.baseVal;
  const width=original.width,height=original.height,maxZoom=24;
  const bounds=root.dataset.extent.split(',').map(Number);
  const pointers=new Map();
  let x=0,y=0,zoom=1;

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  function update(nextX,nextY,nextZoom) {
    zoom=clamp(nextZoom,1,maxZoom);
    const w=width/zoom,h=height/zoom;
    x=clamp(nextX,0,width-w);
    y=clamp(nextY,0,height-h);
    map.setAttribute('viewBox',[x,y,w,h].join(' '));
    root.dataset.zoomed=String(zoom>1.001);
    buttons.in.setAttribute('aria-disabled',String(zoom>=maxZoom));
    buttons.out.setAttribute('aria-disabled',String(zoom<=1));
    buttons.reset.setAttribute('aria-disabled',String(zoom<=1));
    if(focusMark)focusMark.setAttribute('r',String(7/zoom));
    const formatted='Zoom '+Math.round(zoom*100)+'%';
    if(status.textContent!==formatted)status.textContent=formatted;
  }

  function scale(nextZoom,u=0.5,v=0.5,nextU=u,nextV=v) {
    const target=clamp(nextZoom,1,maxZoom);
    update(x+u*width/zoom-nextU*width/target,y+v*height/zoom-nextV*height/target,target);
  }

  function fit() {
    if(bounds.length!==4)return;
    const [left,top,right,bottom]=bounds;
    const target=clamp(Math.min(width/Math.max(48,right-left+54),height/Math.max(48,bottom-top+54)),1,maxZoom);
    update((left+right-width/target)/2,(top+bottom-height/target)/2,target);
  }

  function fraction(clientX,clientY) {
    const rect=map.getBoundingClientRect();
    return [clamp((clientX-rect.left)/rect.width,0,1),clamp((clientY-rect.top)/rect.height,0,1)];
  }

  buttons.in.addEventListener('click',()=>scale(zoom*1.5));
  buttons.out.addEventListener('click',()=>scale(zoom/1.5));
  buttons.reset.addEventListener('click',()=>update(0,0,1));
  buttons.fit.addEventListener('click',fit);
  map.addEventListener('wheel',event=>{
    if(!event.ctrlKey&&!event.metaKey)return;
    event.preventDefault();
    if(event.deltaY)scale(zoom*(event.deltaY<0?1.25:0.8),...fraction(event.clientX,event.clientY));
  },{passive:false});
  map.addEventListener('keydown',event=>{
    if(event.key==='+'||event.key==='=')scale(zoom*1.5);
    else if(event.key==='-')scale(zoom/1.5);
    else if(event.key==='0')update(0,0,1);
    else {
      const arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      const offset=arrows[event.key];
      if(!offset||zoom<=1)return;
      update(x+offset[0]*width/zoom*0.12,y+offset[1]*height/zoom*0.12,zoom);
    }
    event.preventDefault();
  });

  map.addEventListener('pointerdown',event=>{
    if(zoom<=1||event.button!==0||pointers.size>=2)return;
    pointers.set(event.pointerId,[event.clientX,event.clientY]);
    map.setPointerCapture(event.pointerId);
    root.dataset.dragging='true';
  });
  map.addEventListener('pointermove',event=>{
    const previous=pointers.get(event.pointerId);
    if(!previous)return;
    const next=[event.clientX,event.clientY];
    const other=[...pointers].find(([id])=>id!==event.pointerId)?.[1];
    pointers.set(event.pointerId,next);
    if(other) {
      const oldDistance=Math.hypot(previous[0]-other[0],previous[1]-other[1]);
      const nextDistance=Math.hypot(next[0]-other[0],next[1]-other[1]);
      if(oldDistance>=8&&nextDistance>=8) {
        const oldMid=fraction((previous[0]+other[0])/2,(previous[1]+other[1])/2);
        const nextMid=fraction((next[0]+other[0])/2,(next[1]+other[1])/2);
        scale(zoom*nextDistance/oldDistance,...oldMid,...nextMid);
      }
    }else{
      const rect=map.getBoundingClientRect();
      update(x-(next[0]-previous[0])*width/zoom/rect.width,y-(next[1]-previous[1])*height/zoom/rect.height,zoom);
    }
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) {
    map.addEventListener(type,event=>{
      pointers.delete(event.pointerId);
      if(!pointers.size)root.dataset.dragging='false';
    });
  }

  map.tabIndex=0;
  toolbar.hidden=false;
  update(0,0,1);
}

export function activatePopulationScale(form) {
  const band=form.querySelector('[name=band]');
  const number=form.querySelector('[name=max]');
  const slider=form.querySelector('[data-population-slider]');
  const sort=form.querySelector('[name=sort]');
  const direction=form.querySelector('[name=dir]');
  const controls=form.querySelectorAll('[data-population-scale], [data-population-limit]');
  function updateCutoff(){
    const small=band.value==='small';
    for(const control of controls)control.hidden=!small;
    number.disabled=!small;
  }
  band.addEventListener('change',()=>{
    if(band.value!=='all'){
      sort.value='census';
      direction.value=band.value==='large'?'desc':'asc';
    }
    updateCutoff();
  });
  slider.addEventListener('input',()=>{number.value=slider.value;});
  number.addEventListener('input',()=>{
    if(number.value&&number.validity.valid)slider.value=number.value;
  });
  updateCutoff();
}

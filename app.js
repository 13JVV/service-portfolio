const coordinates=[[830,100],[1060,535],[340,700],[70,260],[490,45]];
const names=['CrowdSense','It’s me','반갑꼬리','AI subscription'];
const artLibrary=[
'<path d="M0 20H200M0 55H200M0 90H200M30 0V110M80 0V110M140 0V110M180 0V110" opacity=".25"/><circle cx="80" cy="55" r="29"/><circle cx="80" cy="55" r="17"/><path d="M80 10V100M35 55H125"/><circle cx="145" cy="24" r="6"/><circle cx="32" cy="88" r="4"/>',
'<rect x="44" y="6" width="60" height="96" rx="3"/><rect x="118" y="14" width="55" height="88" rx="3"/><circle cx="74" cy="35" r="10"/><path d="M57 59H91M57 69H84M57 86H91"/><rect x="132" y="43" width="27" height="27"/><path d="M138 49H144V55H138ZM148 60H153V65H148Z"/>',
'<path d="M22 76Q40 20 73 57T130 50T187 72" stroke-dasharray="3 5"/><path d="M89 24a20 20 0 0 1 40 0c0 18-20 40-20 40S89 42 89 24Z"/><circle cx="109" cy="24" r="6"/><ellipse cx="108" cy="85" rx="47" ry="10"/>',
'<path d="M40 80L50 26L99 7L163 39L149 88Z"/><path d="M40 80L99 57L163 39M50 26L99 57L149 88M99 7V57"/><circle cx="99" cy="57" r="14"/><circle cx="50" cy="26" r="4"/><circle cx="149" cy="88" r="4"/>',
'<path d="M20 10V94H190"/><path d="M45 90V55H63V90M83 90V36H101V90M121 90V14H139V90M159 90V25H177V90"/><path d="M26 52L79 32L128 8L186 15" stroke-dasharray="2 4"/>',
'<path d="M6 55H192"/><rect x="12" y="34" width="39" height="40"/><rect x="82" y="34" width="39" height="40"/><rect x="153" y="34" width="39" height="40"/><path d="M60 48L68 55L60 62M132 48L140 55L132 62"/><path d="M26 85H175" stroke-dasharray="4 7"/>',
'<path d="M84 38H118L123 66H78ZM88 38V23H113V38M82 63L64 85H52M118 63L134 85H147M90 69L100 88L110 69"/><path d="M15 105L43 97L70 103H140L167 91L195 101"/><circle cx="165" cy="20" r="10"/>'
];
const arts=[artLibrary[0],artLibrary[1],artLibrary[2],artLibrary[4]];
// Keep navigation native; previews are optional and animation work is demand-driven.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover:hover) and (pointer:fine)');
let storedMotion=null;
try { storedMotion=localStorage.getItem('portfolio-motion'); } catch { /* Storage can be unavailable in private/embedded contexts. */ }
let userPaused=storedMotion==='paused';
let paused = reduced.matches||userPaused, active = -2, detail = -1, time = 0;
let frameId = 0, last = 0, lastPaint = 0, hoverTimer = 0;
let tx = 0, ty = 0, cx = 0, cy = 0, previousFocus = null;
const universe = document.querySelector('#universe');
const nodeRoot = document.querySelector('#nodes');
const scene = document.querySelector('#spatial-scene');
const dialog = document.querySelector('#project-dialog');
const about = document.querySelector('#about-dialog');
const indexPanel = document.querySelector('#index-panel');
const motion = document.querySelector('#motion');
const core = document.querySelector('#core-button');
const coreChargeDuration = 1400;
let coreTimer = 0, coreHovered = false, coreBlocked = false;
core.style.setProperty('--core-charge-duration',`${coreChargeDuration}ms`);
function cancelCoreCharge(block=false) {
  clearTimeout(coreTimer); coreTimer=0;
  core.classList.remove('is-charging','charge-complete');
  if(block&&coreHovered) coreBlocked=true;
}
function canChargeCore() {
  return fine.matches&&!coreBlocked&&!document.hidden&&indexPanel.hidden&&!dialog.open&&!about.open;
}
function startCoreCharge(event) {
  if(event.pointerType==='touch'||core.contains(event.relatedTarget)) return;
  coreHovered=true;
  if(!canChargeCore()||coreTimer) return;
  // Freeze camera drift while the pointer is dwelling on this 3D control.
  tx=cx;ty=cy;clearTimeout(hoverTimer);activate(-1);syncFrame();
  core.classList.add('is-charging');
  coreTimer=setTimeout(()=>{
    if(!coreHovered||!canChargeCore()) {cancelCoreCharge();return;}
    core.classList.add('charge-complete');
    // Let the complete fill paint before the dialog covers the button.
    coreTimer=setTimeout(()=>{
      if(!coreHovered||!canChargeCore()) {cancelCoreCharge();return;}
      coreBlocked=true;
      core.focus({preventScroll:true});
      navigate('#about');
    },80);
  },coreChargeDuration);
}
core.addEventListener('pointerenter',startCoreCharge);
core.addEventListener('pointerleave',event=>{
  if(core.contains(event.relatedTarget)) return;
  coreHovered=false;cancelCoreCharge();
  // Opening a top-layer dialog also emits leave; that must not re-arm hover.
  if(!dialog.open&&!about.open) coreBlocked=false;
});
core.addEventListener('pointercancel',()=>cancelCoreCharge(true));
document.addEventListener('pointermove',event=>{
  if(coreBlocked&&!dialog.open&&!about.open&&!core.contains(event.target)) {
    coreBlocked=false;coreHovered=false;
  }
},{passive:true});
addEventListener('blur',()=>cancelCoreCharge(true));
fine.addEventListener('change',()=>cancelCoreCharge(true));
const detailContext = document.querySelector('#detail-canvas').getContext('2d');
const captionIndex = document.querySelector('.caption-index');
const captionTitle = document.querySelector('.caption-title');
const captionHelp = document.querySelector('.caption-help');
const projectURL = p => `./projects/${p.id}/`;
nodeRoot.innerHTML = projects.map((p, i) => `<div class="node" style="left:${coordinates[i][0]}px;top:${coordinates[i][1]}px;--i:${i}" data-index="${i}"><a class="node-trigger" href="${projectURL(p)}" aria-label="${p.title} 프로젝트 기록 읽기"><span class="node-base"><span class="base-status">${String(i+1).padStart(2,'0')} / ${i===0?'AWARD WINNING':'PROJECT FIELD'}</span><span class="base-art"><svg viewBox="0 0 210 110" aria-hidden="true">${arts[i]}</svg></span><span class="base-corner">↗</span></span><span class="base-label"><small>${String(i+1).padStart(2,'0')}</small>${names[i]}</span></a></div>`).join('');
// ETC groups the three earlier studies behind one secondary link.
nodeRoot.insertAdjacentHTML('beforeend', `<div class="node node-collection" style="left:${coordinates[4][0]}px;top:${coordinates[4][1]}px;--i:4"><a class="node-trigger" href="./projects/etc/" data-collection="etc" aria-label="ETC: 캠퍼스 안전, 생산 공정, 강화학습 요약 읽기"><span class="node-base"><span class="base-status">ETC / 03 SHORT STUDIES</span><span class="base-art"><svg viewBox="0 0 210 110" aria-hidden="true"><rect x="15" y="25" width="50" height="60"/><rect x="80" y="25" width="50" height="60"/><rect x="145" y="25" width="50" height="60"/><path d="M25 43H55M90 43H120M155 43H185M25 57H47M90 57H112M155 57H177"/></svg></span><span class="base-corner">↗</span></span><span class="base-label"><small>ETC</small>Data &amp; Models</span></a></div>`);
document.querySelector('.connections').innerHTML = coordinates.map(([x,y],i) => {
  const endX=x+(i===4?95:123),endY=y+(i===4?59:74),path=`M700 445 L${700+(endX-700)*.5} ${445+(endY-445)*.17} L${endX} ${endY}`;
  return `<path class="track" d="${path}"/><path class="pulse" style="animation-delay:-${i*1.1}s" d="${path}"/><circle cx="${endX}" cy="${endY}" r="3"/>`;
}).join('');
const floating = document.createElement('div');
floating.id='floating-holo';
floating.setAttribute('aria-hidden','true');
floating.innerHTML='<div class="projection-light"></div><div class="floating-face"><canvas width="960" height="540"></canvas><div class="floating-foot">PROJECT PREVIEW <span>CLICK TO READ ↗</span></div></div>';
document.querySelector('#universe').append(floating);
const floatingContext=floating.querySelector('canvas').getContext('2d');
const nodes=[...document.querySelectorAll('.node:not(.node-collection)')];
function positionPreview(i) {
  const r=nodes[i].querySelector('.node-base').getBoundingClientRect();
  const w=innerWidth<700?235:365;
  floating.style.width=w+'px';
  floating.style.left=Math.max(16,Math.min(innerWidth-w-16,r.x+r.width/2-w/2))+'px';
  floating.style.top=Math.max(innerWidth<700?295:200,r.y-(innerWidth<700?110:155))+'px';
}
function activate(i) {
  if(i===active) return;
  active=i;
  floating.classList.toggle('shown',i>=0);
  nodes.forEach((n,k)=>n.classList.toggle('is-active',k===i));
  const p=projects[i];
  captionIndex.textContent=p?p.channel:'00 / EXPLORE THE FIELD';
  captionTitle.textContent=p?p.title:'하나의 질문이, 하나의 세계로.';
  captionHelp.textContent=p?'선택하면 프로젝트 기록으로 바로 이동합니다 ↗':(fine.matches?'패널 위에 마우스를 올려 미리보기':'패널을 터치하면 프로젝트 기록으로 이동합니다');
  if(p) { positionPreview(i); scenes[p.id](floatingContext,time); }
  syncFrame();
}
nodes.forEach((node,i)=>{
  const trigger=node.querySelector('a');
  node.addEventListener('pointerenter',()=>{
    if(!fine.matches) return;
    clearTimeout(hoverTimer); activate(i);
  });
  node.addEventListener('pointerleave',()=>{
    if(!fine.matches) return;
    clearTimeout(hoverTimer);
    hoverTimer=setTimeout(()=>{
      if(!node.contains(document.activeElement)) activate(-1);
    },120);
  });
  trigger.addEventListener('focus',()=>{clearTimeout(hoverTimer);activate(i)});
  trigger.addEventListener('blur',()=>{clearTimeout(hoverTimer);activate(-1)});
});
const collectionLink=document.querySelector('.node-collection .node-trigger');
collectionLink.addEventListener('focus',()=>{clearTimeout(hoverTimer);activate(-1)});
collectionLink.addEventListener('pointerenter',()=>{if(fine.matches){clearTimeout(hoverTimer);activate(-1)}});
function fit() {
  document.documentElement.style.setProperty('--world-scale',Math.min(innerWidth/1550,(Math.max(innerHeight,700)-170)/750,1.16));
  if(active>=0) positionPreview(active);
}
fit(); addEventListener('resize',fit);
document.querySelector('#universe').addEventListener('pointermove',e=>{
  if(!fine.matches||paused||coreHovered||active>=0||!indexPanel.hidden||dialog.open||about.open) return;
  tx=(e.clientX/innerWidth-.5)*18; ty=(e.clientY/innerHeight-.5)*10; syncFrame();
},{passive:true});
document.querySelector('#universe').addEventListener('pointerleave',()=>{tx=ty=0;syncFrame()});
function cameraMoving() { return Math.abs(tx-cx)>.02||Math.abs(ty-cy)>.02; }
function needsFrame() {
  return !paused&&!document.hidden&&!about.open&&(detail>=0||(indexPanel.hidden&&(active>=0||cameraMoving())));
}
function syncFrame() {
  if(needsFrame()) {
    if(!frameId) { last=0; frameId=requestAnimationFrame(frame); }
  } else if(frameId) { cancelAnimationFrame(frameId);frameId=0;last=0; }
}
function frame(now) {
  frameId=0;
  if(!needsFrame()) return;
  time+=last?Math.min((now-last)/1000,.05):0; last=now;
  if(now-lastPaint>=1000/30) {
    if(detail>=0) scenes[projects[detail].id](detailContext,time);
    else if(active>=0) scenes[projects[active].id](floatingContext,time);
    else if(cameraMoving()) {
      cx+=(tx-cx)*.2; cy+=(ty-cy)*.2;
      if(!cameraMoving()) {cx=tx;cy=ty;}
      scene.style.setProperty('--camera-x',`${cx}px`);
      scene.style.setProperty('--camera-y',`${cy}px`);
    }
    lastPaint=now;
  }
  if(needsFrame()) frameId=requestAnimationFrame(frame);
}
function syncMotion() {
  cancelCoreCharge(true);
  document.body.classList.toggle('paused',paused);
  motion.setAttribute('aria-pressed',String(paused));
  motion.setAttribute('aria-label',paused?'애니메이션 재생':'애니메이션 일시정지');
  motion.querySelector('span').textContent=paused?'MOTION OFF':'MOTION ON';
  syncFrame();
}
motion.addEventListener('click',()=>{paused=!paused;userPaused=paused;try {localStorage.setItem('portfolio-motion',paused?'paused':'playing')} catch {} syncMotion()});
reduced.addEventListener('change',e=>{paused=e.matches||userPaused;syncMotion()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden) cancelCoreCharge(true);
  document.body.classList.toggle('page-hidden',document.hidden); syncFrame();
});
function populateDetail(i) {
  detail=(i+projects.length)%projects.length;
  const p=projects[detail];
  document.querySelector('#detail-channel').textContent=p.channel;
  document.querySelector('#detail-status').textContent=p.status;
  document.querySelector('#detail-title').textContent=p.title;
  document.querySelector('#detail-question').textContent=p.problem;
  document.querySelector('#detail-description').innerHTML=p.description;
  document.querySelector('#detail-metric').innerHTML=`<strong>${p.metric}</strong>${p.metricText}`;
  document.querySelector('#detail-tags').innerHTML=p.tags.map(s=>`<span>${s}</span>`).join('');
  document.querySelector('#detail-link').href=projectURL(p);
  document.querySelector('#detail-count').textContent=`${String(detail+1).padStart(2,'0')} / ${String(projects.length).padStart(2,'0')}`;
  scenes[p.id](detailContext,time); dialog.scrollTop=0;
}
// Hash entries let Back dismiss previews and Forward restore them.
function navigate(hash,replace=false) {
  if(location.hash===hash) return;
  const overlay=hash.startsWith('#preview/')||hash==='#about';
  const state=overlay?{portfolioOverlay:true,returnHash:history.state?.returnHash??location.hash}:null;
  history[replace?'replaceState':'pushState'](state,'',hash||location.pathname+location.search);
  renderRoute();
}
function closeOverlay() {
  if(history.state?.portfolioOverlay) history.back();
  else {history.replaceState(null,'',location.pathname+location.search);renderRoute();}
}
// overflow:hidden can retain focus-driven scroll in the spatial wrapper.
// Only the project list should scroll; never reset the page or list position here.
function resetWorldScroll() {
  universe.scrollTop=0;
  universe.scrollLeft=0;
}
function setView(index) {
  indexPanel.hidden=!index;
  document.querySelector('#spatial-view').classList.toggle('selected',!index);
  document.querySelector('#index-view').classList.toggle('selected',index);
  document.querySelector('#spatial-view').setAttribute('aria-pressed',String(!index));
  document.querySelector('#index-view').setAttribute('aria-pressed',String(index));
  scene.inert=index;
  document.body.classList.toggle('list-view',index);
  document.querySelector('.hover-caption').hidden=index;
  clearTimeout(hoverTimer);activate(-1);syncFrame();
}
function renderRoute() {
  cancelCoreCharge(true);
  const hash=location.hash;
  const i=hash.startsWith('#preview/')?projects.findIndex(p=>hash==='#preview/'+p.id):-1;
  const showAbout=hash==='#about';
  if(i<0&&dialog.open) dialog.close();
  if(!showAbout&&about.open) about.close();
  if(i>=0) {
    if(!dialog.open) {previousFocus=document.activeElement;clearTimeout(hoverTimer);activate(-1);}
    populateDetail(i);
    if(!dialog.open) dialog.showModal();
  } else detail=-1;
  if(showAbout&&!about.open) {previousFocus=document.activeElement;activate(-1);about.showModal();}
  if(i<0&&!showAbout) {
    setView(hash==='#projects');
    if(previousFocus?.isConnected) {previousFocus.focus({preventScroll:true});previousFocus=null;}
  }
  document.body.classList.toggle('overlay-open',i>=0||showAbout);
  resetWorldScroll();
  syncFrame();
}
const featured=['crowdsense','itsme','pet','subscription'];
const ordered=[...featured,...projects.map(p=>p.id).filter(id=>!featured.includes(id))];
document.querySelector('#index-list').innerHTML=ordered.map(id=>{
  const i=projects.findIndex(p=>p.id===id),p=projects[i];
  return `<div class="index-item"><a class="index-row" href="${projectURL(p)}"><small>${String(i+1).padStart(2,'0')}</small><strong>${p.title}</strong><em>${featured.includes(id)?'SELECTED CASE STUDY':'DATA & EXPERIMENT'}</em><span aria-hidden="true">↗</span></a><button class="preview-button" data-index="${i}" aria-label="${p.title} 요약 보기" aria-haspopup="dialog">요약 보기</button></div>`;
}).join('');
document.querySelector('#index-list').insertAdjacentHTML('beforeend','<div class="index-item index-collection"><a class="index-row" data-collection="etc" href="./projects/etc/"><small>ETC</small><strong>데이터·모델링 실험</strong><em>03 SHORT STUDIES</em><span aria-hidden="true">↗</span></a></div>');
document.querySelectorAll('.preview-button').forEach(b=>b.addEventListener('click',()=>navigate('#preview/'+projects[Number(b.dataset.index)].id)));
document.querySelector('#prev-project').addEventListener('click',()=>navigate('#preview/'+projects[(detail-1+projects.length)%projects.length].id,true));
document.querySelector('#next-project').addEventListener('click',()=>navigate('#preview/'+projects[(detail+1)%projects.length].id,true));
document.querySelectorAll('dialog .close').forEach(b=>b.addEventListener('click',closeOverlay));
[dialog,about].forEach(d=>d.addEventListener('cancel',e=>{e.preventDefault();closeOverlay()}));
document.querySelector('#about-button').addEventListener('click',()=>navigate('#about'));
core.addEventListener('click',()=>{cancelCoreCharge(true);navigate('#about')});
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();navigate('#projects');indexPanel.focus({preventScroll:true});resetWorldScroll()});
document.querySelector('#spatial-view').addEventListener('click',()=>navigate(''));
document.querySelector('#index-view').addEventListener('click',()=>navigate('#projects'));
document.querySelector('#world-button').addEventListener('click',()=>navigate('#projects'));
addEventListener('hashchange',renderRoute);
addEventListener('popstate',renderRoute);
addEventListener('pageshow',()=>{clearTimeout(hoverTimer);activate(-1);renderRoute()});
addEventListener('pagehide',()=>{cancelCoreCharge(true);clearTimeout(hoverTimer);if(frameId)cancelAnimationFrame(frameId);frameId=0;last=0;});
addEventListener('keydown',e=>{
  if(e.key==='Tab') cancelCoreCharge(true);
  if(e.key==='Escape'&&!dialog.open&&!about.open) {cancelCoreCharge(true);clearTimeout(hoverTimer);activate(-1);}
});
dialog.setAttribute('aria-labelledby','detail-title');
syncMotion(); renderRoute(); document.body.classList.add('world-enter');

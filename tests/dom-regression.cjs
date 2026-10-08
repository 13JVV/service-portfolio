// DOM-level regressions. This is not a browser rendering/performance benchmark.
// Install jsdom separately, then: NODE_PATH=/path/to/node_modules node tests/dom-regression.cjs
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const source=f=>fs.readFileSync(path.join(root,f),'utf8');
let checks=0;
function ok(value,label){assert.ok(value,label);checks++;console.log('PASS',label);}
const tick=()=>new Promise(r=>setTimeout(r,50));
function setup(file='index.html',options={}) {
  const errors=[];
  const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/navigation|CSS|stylesheet/i.test(e.message))errors.push(e.message)});
  const d=new JSDOM(source(file),{url:'https://portfolio.test/'+file.replace('index.html','')+(options.hash||''),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
  const w=d.window,frames=new Map(),media=new Map();let sequence=0,paints=0,hidden=false;
  w.matchMedia=query=>{const m={matches:query.includes('reduced')?!!options.reduced:!options.touch,addEventListener(type,fn){this.listener=fn}};media.set(query,m);return m};
  w.requestAnimationFrame=fn=>{frames.set(++sequence,fn);return sequence};
  w.cancelAnimationFrame=id=>frames.delete(id);
  Object.defineProperty(w.document,'hidden',{get:()=>hidden});
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:20})},{get(o,k){return o[k]||(()=>{if(k==='fillRect'||k==='fill')paints++})},set(o,k,v){o[k]=v;return true}});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');this.querySelector('button')?.focus()};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'))};
  if(options.savedMotion) w.localStorage.setItem('portfolio-motion',options.savedMotion);
  const run=s=>vm.runInContext(s,d.getInternalVMContext());
  for(const el of w.document.querySelectorAll('script')) {
    if(el.src) {const p=path.resolve(root,path.dirname(file),el.getAttribute('src'));run(fs.readFileSync(p,'utf8'))}
    else if(el.textContent.trim())run(el.textContent);
  }
  return {d,w,frames,media,errors,get paints(){return paints},flush(t){const batch=[...frames.values()];frames.clear();batch.forEach(fn=>fn(t))},hide(value){hidden=value;w.document.dispatchEvent(new w.Event('visibilitychange'))}};
}
(async()=>{
const env=setup(),{w,frames}=env,q=s=>w.document.querySelector(s),all=s=>[...w.document.querySelectorAll(s)];
await tick();
ok(env.errors.length===0,'home scripts initialize without DOM errors');
ok(q('#about-dialog').textContent.includes('산업경영공학에서 배운 문제 구조화와 운영 개선'),'local About paragraph survives the merge');
ok(all('.node-trigger[href]:not([data-collection])').length===4&&all('.node-trigger[href][data-collection]').length===1,'space has four main links and one ETC link');
ok(all('.index-row[href]:not([data-collection])').length===4&&all('.index-row[href][data-collection]').length===1,'list has four main links and one ETC link');
ok(all('.index-row').slice(0,4).map(a=>a.getAttribute('href')).join(',')==='./projects/crowdsense/,./projects/itsme/,./projects/pet/,./projects/subscription/','four selected cases appear first');
ok(all('canvas').length===2,'only floating and optional detail canvases remain');
ok(q('#world-button sup').textContent==='04 + ETC'&&q('.index-heading').textContent.includes('04 CASES + ETC'),'home counts distinguish four main cases and ETC');
ok(!all('.node-trigger,.index-row').some(a=>/campus|factory|lunar/.test(a.href)),'supplementary records stay outside home discovery');
ok(frames.size===0,'idle home schedules no JavaScript animation frames');
const first=q('.node-trigger');
for(const props of [{},{ctrlKey:true},{metaKey:true},{button:1}]) {
  const e=new w.MouseEvent('click',{bubbles:true,cancelable:true,...props});
  first.dispatchEvent(e);ok(!e.defaultPrevented,'native link behavior remains unhandled '+JSON.stringify(props));
}
first.focus();ok(frames.size===1,'keyboard focus starts one preview loop');
env.flush(50);ok(frames.size===1,'preview loop does not duplicate');
q('.node-collection .node-trigger').focus();ok(frames.size===0&&!q('#project-dialog').open,'ETC focus is a plain summary link without animation');first.focus();
q('#motion').click();ok(frames.size===0,'MOTION OFF cancels preview animation');
ok(w.localStorage.getItem('portfolio-motion')==='paused','motion choice is saved');
q('#motion').click();ok(frames.size===1,'MOTION ON resumes visible preview');
env.hide(true);ok(frames.size===0,'hidden page stops animation');env.hide(false);ok(frames.size===1,'visible preview resumes once');
q('#index-view').click();ok(!q('#index-panel').hidden&&frames.size===0,'list view stops canvas animation');
ok(q('#spatial-scene').inert===true,'hidden spatial links become inert');
const universe=q('#universe');
universe.scrollTop=162;universe.scrollLeft=18;q('#index-panel').scrollTop=90;

const preview=q('.preview-button');preview.focus();preview.click();
ok(q('#project-dialog').open&&w.location.hash==='#preview/crowdsense','optional preview opens with a history URL');
q('#prev-project').click();ok(w.location.hash==='#preview/subscription'&&q('#detail-count').textContent==='04 / 04','summary navigation wraps only through selected four');q('#next-project').click();
ok(universe.scrollTop===0&&universe.scrollLeft===0,'opening a preview clears only the world wrapper scroll');
ok(q('#index-panel').scrollTop===90,'preview keeps the reader position in the project list');

ok(q('#detail-link').getAttribute('target')===null,'full record stays in the same tab by default');
q('#next-project').click();ok(w.location.hash==='#preview/itsme'&&q('#detail-title').textContent==='It’s me','next preview updates data and route');
universe.scrollTop=162;
q('#project-dialog').dispatchEvent(new w.Event('cancel',{cancelable:true}));await tick();
ok(!q('#project-dialog').open&&w.location.hash==='#projects','Escape closes to prior list route');
ok(w.document.activeElement===preview,'Escape restores trigger focus');
ok(universe.scrollTop===0,'Escape clears focus-driven world wrapper scroll');
w.history.forward();await tick();ok(q('#project-dialog').open&&w.location.hash==='#preview/itsme','Forward restores latest preview');
w.history.back();await tick();ok(!q('#project-dialog').open,'Back dismisses preview');
q('#about-button').focus();q('#about-button').click();ok(q('#about-dialog').open&&frames.size===0,'About opens without background animation');
q('#about-dialog .close').click();await tick();ok(!q('#about-dialog').open&&w.document.activeElement===q('#about-button'),'About close restores focus');
universe.scrollTop=162;universe.scrollLeft=18;
q('#spatial-view').click();ok(universe.scrollTop===0&&universe.scrollLeft===0,'returning to space clears both world scroll axes');q('#core-button').focus();ok(!q('#about-dialog').open,'focusing the central button never auto-opens About');q('#core-button').click();ok(q('#about-dialog').open,'central button opens About on click');
q('#about-dialog .close').click();await tick();
q('.skip-link').click();ok(!q('#index-panel').hidden&&w.document.activeElement===q('#index-panel'),'skip link opens and focuses list');
universe.scrollTop=162;w.dispatchEvent(new w.Event('pageshow'));ok(universe.scrollTop===0,'BFCache/pageshow clears restored world wrapper scroll');
ok(env.errors.length===0,'all interaction routes complete without DOM exceptions');
env.d.window.close();
for(const options of [{reduced:true},{savedMotion:'paused'},{touch:true}]) {
 const e=setup('index.html',options);await tick();const a=e.w.document.querySelector('.node-trigger');a.focus();
 if(options.reduced||options.savedMotion)ok(e.frames.size===0&&e.w.document.body.classList.contains('paused'),'reduced/saved motion creates a static preview '+JSON.stringify(options));
 if(options.touch){ok(/터치|선택/.test(e.w.document.querySelector('.caption-help').textContent),'touch help is correct on initial load');const event=new e.w.MouseEvent('click',{bubbles:true,cancelable:true});a.dispatchEvent(event);ok(!event.defaultPrevented&&!e.w.document.querySelector('#project-dialog').open,'touch link has no double-tap arming');}
 if(options.savedMotion){const m=[...e.media.entries()].find(([q])=>q.includes('reduced'))[1];m.listener({matches:true});m.listener({matches:false});ok(e.frames.size===0&&e.w.document.body.classList.contains('paused'),'manual pause survives OS reduced-motion changes');}
 e.d.window.close();
}
const deep=setup('index.html',{hash:'#preview/pet'});await tick();deep.w.document.querySelector('#project-dialog .close').click();await tick();ok(!deep.w.document.querySelector('#project-dialog').open&&deep.w.location.hash==='','direct preview URL closes without leaving site');deep.d.window.close();
for(const id of ['crowdsense','itsme','pet','subscription','factory','campus','lunar','etc']) {
 const file=`projects/${id}/index.html`,e=setup(file);await tick();
 ok(e.errors.length===0,`${id}: inline/shared scripts execute`);
 const doc=e.w.document,ids=[...doc.querySelectorAll('[id]')].map(x=>x.id);
 ok(new Set(ids).size===ids.length,`${id}: no duplicate ids`);
 const broken=[...doc.querySelectorAll('a[href^="#"]')].filter(a=>a.hash.length>1&&!doc.getElementById(decodeURIComponent(a.hash.slice(1))));
 ok(broken.length===0,`${id}: section links resolve after cleanup`);
 ok(!!doc.querySelector('meta[name="viewport"]'),`${id}: mobile viewport exists`);
 ok(!!doc.querySelector('a[href="../../#projects"]'),`${id}: native return-to-list link exists`);
 if(['crowdsense','itsme','pet','subscription'].includes(id))ok(doc.querySelectorAll('.case-decision-figure').length===1&&!!doc.querySelector('.case-decision-figure[aria-label]')&&doc.querySelector('h1').nextElementSibling.classList.contains('case-decision-figure'),`${id}: accessible decision diagram follows title`);
 if(id==='pet')ok(doc.body.textContent.includes('1.1.4')&&doc.body.textContent.includes('Planning')&&!doc.body.textContent.includes('App Store 공개 배포 전'),'pet local planning survives with current release status');
 if(id==='itsme')ok(doc.body.textContent.includes('P0 · 교환의 순간')&&doc.body.textContent.includes('AI Agent Development')&&!doc.body.textContent.includes('자기소개서에 쓸 소재'),'itsme local priorities survive without restored coaching');
 if(id==='campus')ok(doc.getElementById('s2-plan')&&doc.getElementById('s2-ai')&&doc.getElementById('s9-reflection')&&!doc.getElementById('g1'),'campus local process and reflection survive without removed guides');
 if(id==='crowdsense')ok(doc.body.textContent.includes('AI Agent Development')&&doc.body.textContent.includes('실측 화면·실시간 경보·예측 성능을 나타내지')&&!doc.body.textContent.includes('WATCH · +18분'),'CrowdSense local process survives with honestly labeled mockup');
 if(id==='etc') {
   const detailLinks=[...doc.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'));
   ok(['../campus/','../factory/','../lunar/'].every(h=>detailLinks.includes(h)),'ETC summary preserves all three original detail links');
   ok(!doc.querySelector('script,canvas,dialog'),'ETC summary adds no scripts, animated canvases or dialogs');
 }
 if(id==='subscription') {
   const values=()=>[...doc.querySelectorAll('#out .v')].map(x=>parseFloat(x.textContent));
   const baseline=values();
   ok(baseline.join(',')==='25.5,30.2,44.3','simulator initializes expected model probabilities');
   const price=doc.querySelector('#pr2');price.value='3';price.dispatchEvent(new e.w.Event('change',{bubbles:true}));
   ok(values()[2]<baseline[2],'raising one alternative price lowers its model share');
   ok(Math.abs(values().reduce((a,b)=>a+b,0)-100)<.2,'displayed model shares sum to 100 within rounding');
   doc.querySelector('#reset').click();ok(values().join(',')===baseline.join(','),'simulator reset restores all baseline probabilities');
   ok(doc.querySelector('#out').getAttribute('aria-live')==='polite','simulator updates are announced accessibly');
 }

 e.d.window.close();
}
console.log(`\n${checks} DOM regression checks passed. No real-browser layout or speed claim.`);
})().catch(e=>{console.error(e);process.exitCode=1});

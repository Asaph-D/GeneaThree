import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { BrowserPage } from './render-review-browser.mjs';
import { polygamyConstructionStates } from '../GeneaTree/scripts/fixtures/polygamy-construction.mjs';

const out = 'GeneaTree/test-artifacts/polygamy-priority';
await fs.mkdir(out, {recursive:true});
const page = await BrowserPage.create();
const states = polygamyConstructionStates();
const phase = value => page.wait(`JSON.parse(localStorage.getItem('geneatree.assistant.session.v1') || '{}').phase === ${JSON.stringify(value)}`);
async function click(label) {
  await page.evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(label)} && !b.disabled); if(!b) throw Error('Missing button '+${JSON.stringify(label)}); b.click(); })()`);
}
async function add(host, relation, name, union) {
  await page.evaluate(`(() => { const n = [...document.querySelectorAll('.tree-node')].find(n=>(n.__data__.person.firstName || n.__data__.person.lastName)===${JSON.stringify(host)}); if(!n) throw Error('Missing person'); n.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); })()`);
  await page.wait(`document.querySelector('#assistant-selected-person')?.selectedOptions[0]?.textContent.includes(${JSON.stringify(host)})`);
  await click(`Ajouter un ${relation}`);
  if(union) { await phase('kin-union'); await click(union); }
  await phase('kin-last');
  await page.evaluate(`(() => { const i=document.querySelector('form input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(name)}); i.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await page.evaluate('document.querySelector("form").requestSubmit()');
  await phase('kin-first'); await click('Passer'); await phase('kin-gender');
  await click('Homme'); await phase('grow');
}
const positions = () => page.evaluate(`[...document.querySelectorAll('.tree-node')].map(n=>({name:n.__data__.person.firstName || n.__data__.person.lastName,x:n.__data__.x,y:n.__data__.y,tx:n.transform.baseVal.consolidate().matrix.e,ty:n.transform.baseVal.consolidate().matrix.f}))`);
async function verify(principal) {
  const nodes=await positions(), find=name=>nodes.find(n=>n.name===name);
  for(const n of nodes) { assert.ok(Math.abs(n.tx-n.x)<0.001,`${n.name} moving across branches`); assert.ok(Math.abs(n.ty-n.y)<0.001); }
  assert.equal(await page.evaluate(`[...document.querySelectorAll('.node-first-name,.node-secondary-detail')].filter(n=>n.getComputedTextLength()>104.01).length`),0,'Names overlap neighbouring cards');
  if(principal) assert.ok(find(principal).x > find('Moyopo').x, 'Principal branch must face interior');
  if(find('Léon')) {
    const lo=Math.min(...['Paul','David','Léon'].map(n=>find(n).x)), hi=Math.max(...['Paul','David','Léon'].map(n=>find(n).x));
    assert.ok(find('Brigitte').x<lo || find('Brigitte').x>hi,'Brigitte trapped between co-wife children');
  }
  return nodes;
}
async function seed(state) {
  await page.goto('http://localhost:5173/demo');
  await page.wait('document.querySelector("#demo")');
  await page.evaluate(`(async()=>{ const service=await import('/src/services/localFamilyService.ts'); await service.createLocalTree('Contrôle polygamie',${JSON.stringify({persons:state.persons,marriages:state.marriages})}); localStorage.setItem('geneatree.example','custom'); localStorage.setItem('geneatree.demo.view',JSON.stringify({viewType:'tree',generations:6,focusPersonId:'asaph'})); localStorage.removeItem('geneatree.assistant.session.v1'); })()`);
  await page.goto('http://localhost:5173/demo');
  await page.wait(`document.querySelector('#demo') && document.querySelectorAll('.tree-node').length===${state.persons.length}`);
}
try {
  await page.call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  for(const state of states) {
    await seed(state);
    await verify();
    await page.capture(`${out}/snapshot-${state.label}.png`);
  }
  await seed(states[8]);
  await page.goto('http://localhost:5173/assistant?from=demo');
  await phase('grow'); await page.wait('document.querySelectorAll(".tree-node").length===9');
  await verify('Mayoumo');
  await add('Moyopo','enfant','Léon','Moyopo et Mamouo');
  await verify('Mayoumo'); await page.capture(`${out}/live-01-leon.png`);
  await add('Léon','conjoint','Conjoint Léon');
  await add('Léon','enfant','Enfant 1','Léon et Conjoint Léon');
  await add('Léon','enfant','Enfant 2','Léon et Conjoint Léon');
  await verify('Mayoumo'); await page.capture(`${out}/live-02-equality.png`);
  await add('Enfant 1','enfant','Petit enfant');
  for(let i=0;i<12;i++) await verify('Mamouo');
  await new Promise(resolve=>setTimeout(resolve,250));
  await page.capture(`${out}/live-03-mamouo-priority.png`);
  const assistant=await positions();
  await click('Ouvrir l’arbre');
  await page.wait('document.querySelector("#demo") && document.querySelectorAll(".tree-node").length===14');
  assert.deepEqual((await positions()).map(n=>[n.name,n.x,n.y]),assistant.map(n=>[n.name,n.x,n.y]));
  await page.capture(`${out}/live-04-demo.png`);
  for(const deltaY of [-1000,1300]) {
    await page.call('Input.dispatchMouseEvent',{type:'mouseWheel',x:850,y:350,deltaX:0,deltaY});
    await verify('Mamouo');
    assert.equal(await page.evaluate(`[...document.querySelectorAll('.links .link')].filter(n=>getComputedStyle(n).stroke==='none').length`),0);
  }
  await page.call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.goto('http://localhost:5173/demo');
  await page.wait('document.querySelectorAll(".tree-node").length===14');
  await verify('Mamouo'); await page.capture(`${out}/live-05-mobile.png`);
  console.log(JSON.stringify({snapshots:states.length,liveConstruction:true,prioritySwitch:true,demoParity:true,mobile:true,runtimeErrors:page.errors}));
} finally { await page.close(); }

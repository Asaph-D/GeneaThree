import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { BrowserPage } from './render-review-browser.mjs';
import { polygamyConstructionStates } from '../GeneaTree/scripts/fixtures/polygamy-construction.mjs';

const out='GeneaTree/test-artifacts/polygamy-priority';
const api='http://localhost:8086/api';
const email='visual-polygamy-priority@example.invalid', password='LocalVisualAudit2026!';
const headers={Authorization:`Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,'Content-Type':'application/json'};
const place=p=>typeof p==='string'?p:[p?.city,p?.region,p?.country].filter(Boolean).join(', ');
let response=await fetch(`${api}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,treeName:'Contrôle local polygamie',privacyConsent:true})});
if(!response.ok) response=await fetch(`${api}/auth/me`,{headers});
assert.ok(response.ok,await response.clone().text());
const account=await response.json(), treeId=account.trees.find(t=>t.role==='OWNER').id;
const page=await BrowserPage.create();
const positions=()=>page.evaluate(`[...document.querySelectorAll('.tree-node')].map(n=>[n.__data__.person.id,n.__data__.x,n.__data__.y]).sort((a,b)=>a[0].localeCompare(b[0]))`);
try {
  await page.call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  for(const index of [8,9,13,24]) {
    const state=polygamyConstructionStates()[index], snapshot={persons:state.persons,marriages:state.marriages};
    response=await fetch(`${api}/trees/${treeId}/family`,{method:'PUT',headers,body:JSON.stringify({version:1,persons:snapshot.persons.map(p=>({...p,birthPlace:place(p.birthPlace),deathPlace:place(p.deathPlace)})),marriages:snapshot.marriages.map(m=>({...m,location:place(m.location)}))})});
    assert.ok(response.ok,await response.text());
    response=await fetch(`${api}/trees/${treeId}/share-link`,{method:'POST',headers});
    assert.ok(response.ok);
    const {token}=await response.json();
    await page.goto('http://localhost:5173/demo'); await page.wait('document.querySelector("#demo")');
    await page.evaluate(`(async()=>{const s=await import('/src/services/localFamilyService.ts'); await s.createLocalTree('Comparaison partage',${JSON.stringify(snapshot)}); localStorage.setItem('geneatree.example','custom'); localStorage.setItem('geneatree.demo.view',JSON.stringify({viewType:'tree',generations:6,focusPersonId:'asaph'}));})()`);
    await page.goto('http://localhost:5173/demo');
    await page.wait(`document.querySelectorAll('.tree-node').length===${snapshot.persons.length}`);
    const demo=await positions();
    await page.goto(`http://localhost:5173/shared/${token}?focus=asaph&generations=6&view=tree`);
    await page.wait(`!document.querySelector('#demo') && document.body.innerText.includes('Lecture seule') && document.querySelectorAll('.tree-node').length===${snapshot.persons.length}`);
    assert.deepEqual(await positions(),demo);
    await new Promise(resolve=>setTimeout(resolve,750));
    await page.capture(`${out}/shared-${state.label}.png`);
  }
  assert.deepEqual(page.errors,[]);
  await fs.writeFile(`${out}/shared-result.json`,JSON.stringify({backendPersistence:true,sharedParity:true,states:[9,10,14,25],runtimeErrors:page.errors},null,2));
  console.log('Partage réel : états 9, 10, 14 et 25 enregistrés sur le backend ; positions identiques à /demo, aucune erreur JavaScript.');
} finally {await page.close();}

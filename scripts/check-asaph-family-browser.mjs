import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserPage } from './render-review-browser.mjs';

const out = 'GeneaTree/test-artifacts/asaph-family-boundaries';
await fs.mkdir(out, { recursive: true });
const page = await BrowserPage.create();
await page.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
const evaluate = expression => page.evaluate(expression);
const phase = expected => page.wait(`JSON.parse(localStorage.getItem('geneatree.assistant.session.v1') || '{}').phase === ${JSON.stringify(expected)}`);
async function click(label) {
  await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)} && !b.disabled); if (!b) throw Error('Button missing: ' + ${JSON.stringify(label)}); b.click(); })()`);
}
async function submit(value, expected) {
  await page.wait('document.querySelector("form input") instanceof HTMLInputElement && !document.querySelector("form input").disabled');
  await evaluate(`(() => { const input = document.querySelector('form input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await evaluate('document.querySelector("form").requestSubmit()');
  await phase(expected);
}
async function shot(name) { await new Promise(resolve => setTimeout(resolve, 850)); await page.capture(`${out}/${name}.png`); }
async function select(name) {
  await evaluate(`(() => { const n = [...document.querySelectorAll('.tree-node')].find(n => (n.__data__?.person?.firstName || n.__data__?.person?.lastName) === ${JSON.stringify(name)}); if (!n) throw Error('Node missing'); n.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); })()`);
  await page.wait(`document.querySelector('#assistant-selected-person')?.selectedOptions[0]?.textContent.includes(${JSON.stringify(name)})`);
}
async function add(host, relation, name, gender, surname = '', union) {
  await select(host); await click(`Ajouter un ${relation}`);
  if (union) { await phase('kin-union'); await click(union); }
  await phase('kin-last');
  await submit(surname || name, 'kin-first');
  if (surname) await submit(name, 'kin-gender');
  else { await click('Passer'); await phase('kin-gender'); }
  await click(gender); await phase('grow');
}
const positions = () => evaluate('[...document.querySelectorAll(".tree-node")].map(n => ({ id:n.__data__.person.id, name:n.__data__.person.firstName || n.__data__.person.lastName, x:n.__data__.x, y:n.__data__.y, surname:n.__data__.person.lastName }))');
try {
  await page.goto('http://localhost:5173/assistant?new=1');
  await page.wait('document.querySelector("form input") instanceof HTMLInputElement');
  await page.wait('location.search === ""');
  await submit('Asaph', 'anchor-first'); await click('Passer'); await phase('anchor-gender');
  await click('Homme'); await phase('anchor-birth'); await click('Passer'); await phase('anchor-city'); await click('Passer'); await phase('grow');
  await add('Asaph', 'parent', 'Paul', 'Homme');
  await add('Asaph', 'parent', 'Brigitte', 'Femme');
  await add('Paul', 'parent', 'Innocent', 'Homme', 'Moyopo');
  await add('Paul', 'parent', 'Élise', 'Femme', 'Mayoumo');
  await shot('01-parents-paul');
  let nodes = await positions();
  assert.equal(nodes.length, 5);
  assert.equal(nodes.find(p => p.name === 'Asaph').surname, 'Asaph');
  assert.equal(nodes.find(p => p.name === 'Paul').surname, 'Paul');
  await add('Brigitte', 'parent', 'Antoine', 'Homme', 'Nkouokam');
  await add('Brigitte', 'parent', 'Marceline', 'Femme', 'Pouokam');
  await add('Innocent', 'conjoint', 'Marie', 'Femme', 'Mamouo');
  await shot('02-two-ancestries-second-wife');
  nodes = await positions();
  assert.equal(nodes.length, 8);
  const family = ['Innocent', 'Élise', 'Marie'].map(name => nodes.find(n => n.name === name));
  const min = Math.min(...family.map(n => n.x)), max = Math.max(...family.map(n => n.x));
  for (const foreign of nodes.filter(n => ['Antoine', 'Marceline'].includes(n.name))) {
    assert.ok(foreign.x < min || foreign.x > max, `${foreign.name} intersects Innocent's household`);
  }
  const assistantPositions = nodes;
  await click('Ouvrir l’arbre');
  await page.wait('document.querySelector("#demo") && document.querySelectorAll(".tree-node").length === 8');
  const demoPositions = await positions();
  assert.deepEqual(new Map(demoPositions.map(n => [n.id, [n.x,n.y]])), new Map(assistantPositions.map(n => [n.id, [n.x,n.y]])));
  await shot('03-demo');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.title.startsWith('Modifier l')).click()`);
  await page.wait(`[...document.querySelectorAll('button')].some(b=>b.title.startsWith('Terminer'))`);
  await evaluate(`(() => { const node = [...document.querySelectorAll('.tree-node')].find(n=>(n.__data__.person.firstName || n.__data__.person.lastName)==='Asaph'); node.dispatchEvent(new MouseEvent('mousedown',{bubbles:true})); })()`);
  await page.wait('document.querySelector("input[name=lastName]")');
  assert.equal(await evaluate('document.querySelector("input[name=firstName]").value'), '');
  await click('Enregistrer');
  await page.wait('!document.querySelector("input[name=lastName]")');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.title.startsWith('Terminer')).click()`);
  const inspectLines = () => evaluate(`(() => { const lines = [...document.querySelectorAll('.links .link')]; return { count:lines.length, gradients:lines.filter(l => getComputedStyle(l).stroke.includes('url(')).length, invisible:lines.filter(l => getComputedStyle(l).stroke === 'none' || Number(getComputedStyle(l).opacity) === 0).length, scale:document.querySelector('svg[aria-label]')?.__zoom?.k }; })()`);
  const initial = await inspectLines();
  assert.ok(initial.count > 0);
  assert.equal(initial.gradients, 0);
  for (const [name, deltaY] of [['04-zoom-in', -950], ['05-zoom-in-more', -500], ['06-zoom-out', 1200]]) {
    await page.call('Input.dispatchMouseEvent', { type:'mouseWheel', x:850, y:310, deltaX:0, deltaY });
    await shot(name);
    const after = await inspectLines();
    assert.equal(after.count, initial.count); assert.equal(after.invisible, 0); assert.equal(after.gradients, 0);
  }
  await page.call('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true });
  await page.goto('http://localhost:5173/demo');
  await page.wait('document.querySelector("#demo") && document.querySelectorAll(".tree-node").length === 8');
  await shot('07-mobile');
  const snapshot = await evaluate(`(async()=>{ const service = await import('/src/services/localFamilyService.ts'); return service.loadPersistentLocalFamily(); })()`);
  const api = 'http://localhost:8086/api';
  const email = 'visual-asaph-boundaries@example.invalid', password = 'LocalVisualAudit2026!';
  const headers = { Authorization:`Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`, 'Content-Type':'application/json' };
  let response = await fetch(`${api}/auth/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password,treeName:'Contrôle local Asaph',privacyConsent:true}) });
  if (!response.ok) response = await fetch(`${api}/auth/me`,{headers});
  assert.ok(response.ok);
  const account = await response.json(), treeId = account.trees.find(tree=>tree.role==='OWNER').id;
  const place = value => typeof value==='string' ? value : [value?.city,value?.region,value?.country].filter(Boolean).join(', ');
  response = await fetch(`${api}/trees/${treeId}/family`,{method:'PUT',headers,body:JSON.stringify({ version:1, persons:snapshot.persons.map(p=>({...p,birthPlace:place(p.birthPlace),deathPlace:place(p.deathPlace)})),marriages:snapshot.marriages.map(m=>({...m,location:place(m.location)})) })});
  assert.ok(response.ok, await response.text());
  response = await fetch(`${api}/trees/${treeId}/share-link`,{method:'POST',headers});
  assert.ok(response.ok);
  const shared = await response.json(), focus = snapshot.persons.find(p=>(p.firstName||p.lastName)==='Asaph').id;
  await page.call('Emulation.setDeviceMetricsOverride', { width:1280,height:720,deviceScaleFactor:1,mobile:false });
  await page.goto(`http://localhost:5173/shared/${shared.token}?focus=${focus}&generations=4&view=tree`);
  await page.wait('location.pathname.startsWith("/shared/") && !document.querySelector("#demo") && document.body.innerText.includes("Lecture seule") && document.querySelectorAll(".tree-node").length === 8');
  const sharedPositions = await positions();
  assert.deepEqual(new Map(sharedPositions.map(n=>[n.id,[n.x,n.y]])), new Map(assistantPositions.map(n=>[n.id,[n.x,n.y]])));
  await shot('08-shared');
  await page.call('Input.dispatchMouseEvent',{type:'mouseWheel',x:850,y:310,deltaX:0,deltaY:-1000});
  await shot('09-shared-zoom');
  const sharedLines = await inspectLines();
  assert.equal(sharedLines.count,initial.count); assert.equal(sharedLines.invisible,0); assert.equal(sharedLines.gradients,0);
  await page.goto('http://localhost:5173/demo');
  await page.wait('document.querySelector("#demo") && document.querySelectorAll(".tree-node").length === 8');
  await evaluate('document.querySelector("[data-tour=demo-assistant]").click()');
  await phase('grow');
  await page.wait('document.querySelector("#assistant-selected-person") && document.querySelectorAll(".tree-node").length === 8');
  const resumedPositions = await positions();
  assert.deepEqual(new Map(resumedPositions.map(n=>[n.id,[n.x,n.y]])),new Map(demoPositions.map(n=>[n.id,[n.x,n.y]])),'Reprendre l’arbre doit conserver les positions de l’import.');
  await shot('10-resumed-before-david');
  await add('Innocent','enfant','David','Homme','','Innocent Moyopo et Élise Mayoumo');
  const withDavid = await positions();
  assert.equal(withDavid.length,9);
  const paul=withDavid.find(p=>p.name==='Paul'), brigitte=withDavid.find(p=>p.name==='Brigitte'), david=withDavid.find(p=>p.name==='David');
  assert.ok(brigitte.x<Math.min(paul.x,david.x)||brigitte.x>Math.max(paul.x,david.x),'Brigitte ne doit pas couper la fratrie de Paul et David.');
  assert.ok(david.x<Math.min(paul.x,brigitte.x)||david.x>Math.max(paul.x,brigitte.x),'David ne doit pas traverser le couple Paul–Brigitte.');
  await shot('11-david-after-resume');
  await click('Ouvrir l’arbre');
  await page.wait('document.querySelector("#demo") && document.querySelectorAll(".tree-node").length === 9');
  await shot('12-david-demo');
  // Import a complete archive with all four unions, the opposite orientation
  // for Paul–Brigitte, and the second parental union ranked after Marie.
  const explicitUnions = await evaluate(`(async()=>{ const layout = await import('/src/components/demo/bandLayout.ts'); return layout.parentalHouseholds(${JSON.stringify(snapshot.persons)},${JSON.stringify(snapshot.marriages)}); })()`);
  const ids = Object.fromEntries(snapshot.persons.map(person=>[person.firstName||person.lastName,person.id]));
  explicitUnions.forEach(union=>{
    if ([union.spouse1Id,union.spouse2Id].includes(ids.Paul)) { union.spouse1Id=ids.Brigitte; union.spouse2Id=ids.Paul; }
    if ([union.spouse1Id,union.spouse2Id].includes(ids['Élise'])) union.rank=2;
  });
  const explicitPersons = [...snapshot.persons].reverse().map(person=>({ ...person,
    parentIds:person.id===focus?[...person.parentIds].reverse():person.parentIds,
    spouseIds:[...new Set([...person.spouseIds,...explicitUnions.flatMap(union=>union.spouse1Id===person.id?[union.spouse2Id]:union.spouse2Id===person.id?[union.spouse1Id]:[])])],
  }));
  const archiveFile=path.resolve(out,'explicit-four-unions.geneatree.json');
  await fs.writeFile(archiveFile,JSON.stringify({format:'geneatree-family',version:1,exportedAt:new Date().toISOString(),persons:explicitPersons,marriages:explicitUnions,view:{viewType:'tree',generations:4,focusPersonId:focus}}));
  const {root}=await page.call('DOM.getDocument');
  const {nodeId}=await page.call('DOM.querySelector',{nodeId:root.nodeId,selector:'input[type=file][accept*="geneatree"]'});
  await page.call('DOM.setFileInputFiles',{nodeId,files:[archiveFile]});
  await page.wait('document.querySelector("#import-family-title")');
  await click('Importer cet arbre');
  await page.wait('!document.querySelector("#import-family-title") && document.querySelectorAll(".tree-node").length===8');
  const importedPositions=await positions();
  await shot('13-explicit-import');
  await evaluate('document.querySelector("[data-tour=demo-assistant]").click()');
  await phase('grow'); await page.wait('document.querySelector("#assistant-selected-person") && document.querySelectorAll(".tree-node").length===8');
  assert.deepEqual(new Map((await positions()).map(n=>[n.id,[n.x,n.y]])),new Map(importedPositions.map(n=>[n.id,[n.x,n.y]])),'La reprise doit conserver le placement de l’import à quatre unions.');
  await add('Innocent','enfant','David','Homme','','Innocent Moyopo et Élise Mayoumo');
  const importedWithDavid=await positions();
  const p=importedWithDavid.find(n=>n.name==='Paul'), b=importedWithDavid.find(n=>n.name==='Brigitte'), d=importedWithDavid.find(n=>n.name==='David');
  assert.ok(b.x<Math.min(p.x,d.x)||b.x>Math.max(p.x,d.x)); assert.ok(d.x<Math.min(p.x,b.x)||d.x>Math.max(p.x,b.x));
  assert.ok(await evaluate('document.body.innerText.includes("4 unions")'));
  await shot('14-david-after-explicit-import');
  await fs.writeFile(`${out}/results.json`, JSON.stringify({ assistantPositions, demoPositions, sharedPositions, resumedPositions, withDavid, initial, final:sharedLines, mononyms:true, mononymEdited:true, sharedTreeId:treeId },null,2));
  console.log('Asaph → parents → parents de Paul → parents de Brigitte → deuxième épouse : huit personnes, foyers séparés, noms facultatifs, coordonnées identiques dans /demo et traits continus au zoom.');
} finally { await page.close(); }

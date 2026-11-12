import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BrowserPage } from './render-review-browser.mjs';

const output = 'GeneaTree/test-artifacts/assistant-permissions';
await fs.mkdir(output, { recursive: true });
const page = await BrowserPage.create();
const exceptions = [];
page.socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
});
const evaluate = expression => page.evaluate(expression);
const selector = value => `document.querySelector(${JSON.stringify(value)})`;
async function shot(name) {
  await new Promise(resolve => setTimeout(resolve, 800));
  await page.capture(`${output}/${name}.png`);
}
async function phase(expected) {
  await page.wait(`JSON.parse(localStorage.getItem('geneatree.assistant.session.v1') || '{}').phase === ${JSON.stringify(expected)}`);
}
async function submit(value, expected) {
  await page.wait('document.querySelector("form input") instanceof HTMLInputElement && !document.querySelector("form input").disabled');
  await evaluate(`(() => { const input = document.querySelector('form input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await evaluate('document.querySelector("form").requestSubmit()');
  await phase(expected);
}
async function click(label) {
  await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(label)} && !b.disabled); if (!button) throw Error('Button unavailable: ' + ${JSON.stringify(label)}); button.click(); })()`);
}
async function select(name) {
  await evaluate(`(() => { const node = [...document.querySelectorAll('.tree-node')].find(n => n.__data__?.person?.firstName === ${JSON.stringify(name)}); if (!node) throw Error('Node absent'); node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); })()`);
  await page.wait(`document.querySelector('#assistant-selected-person')?.selectedOptions[0]?.textContent.includes(${JSON.stringify(name)})`);
}
async function add(host, relation, firstName, gender = 'Homme', union) {
  await select(host);
  await click(`Ajouter un ${relation}`);
  if (union) { await phase('kin-union'); await click(union); }
  await phase('kin-last');
  await submit('Essomba', 'kin-first');
  await submit(firstName, 'kin-gender');
  await click(gender);
  await phase('grow');
  await page.wait(`[...document.querySelectorAll('.tree-node')].some(n => n.__data__?.person?.firstName === ${JSON.stringify(firstName)})`);
}
try {
  await page.goto('http://localhost:5173/atelier');
  await page.wait('document.querySelectorAll("article button").length > 0');
  await evaluate('document.querySelector("article button").click()');
  await page.wait('location.pathname === "/demo" && document.querySelector("#demo") && document.querySelectorAll(".tree-node").length > 0');
  const before = await evaluate('localStorage.getItem("geneatree.current-tree.v1")');
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b => b.title.startsWith('Modifier l')).disabled`), true);
  assert.equal(await evaluate('document.querySelector("[data-tour=demo-assistant]").disabled'), true);
  assert.equal(await evaluate(`${selector('[data-tour=demo-export]')}.disabled`), false);
  await shot('catalogue-readonly');
  const downloadDirectory = path.resolve(output, 'downloads');
  await fs.mkdir(downloadDirectory, { recursive: true });
  await page.call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDirectory });
  await evaluate(`${selector('[data-tour=demo-export]')}.click()`);
  let archive;
  for (let attempt = 0; attempt < 50; attempt++) {
    const files = (await fs.readdir(downloadDirectory)).filter(name => name.endsWith('.json'));
    if (files.length) { archive = JSON.parse(await fs.readFile(path.join(downloadDirectory, files.at(-1)), 'utf8')); break; }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.ok(archive?.predefined?.id, 'Le téléchargement conserve la provenance du catalogue.');
  await evaluate('document.querySelector(".tree-node").dispatchEvent(new MouseEvent("mousedown", {bubbles:true}))');
  await page.wait(selector('button[title="Mettre à jour la photo"]'));
  assert.equal(await evaluate(`${selector('button[title="Mettre à jour la photo"]')}.disabled`), true);
  assert.equal(await evaluate(`${selector('button[title="Modifier cette personne"]')}.disabled`), true);
  await shot('profile-readonly');
  await page.goto('http://localhost:5173/assistant?from=demo');
  await page.wait('document.querySelector("form input")?.disabled');
  await shot('assistant-readonly');

  await page.goto('http://localhost:5173/demo');
  await page.wait(selector('#demo a[href="/assistant?new=1"]'));
  await evaluate(`${selector('#demo a[href="/assistant?new=1"]')}.click()`);
  await phase('anchor-last');
  await page.wait('location.search === ""');
  await submit('Essomba', 'anchor-first');
  assert.match(await evaluate('document.querySelector("[data-tour=assistant-thread]").lastElementChild.textContent'), /pr.nom/);
  await page.goto('http://localhost:5173/assistant');
  await phase('anchor-first');
  await submit('Amina', 'anchor-gender');
  await click('Femme'); await phase('anchor-birth');
  await submit('', 'anchor-city'); await submit('', 'grow');
  await add('Amina', 'parent', 'Jean');
  await add('Jean', 'parent', 'Paul');
  await add('Paul', 'conjoint', 'Marie', 'Femme');
  await add('Paul', 'conjoint', 'Anne', 'Femme');
  await add('Paul', 'enfant', 'Luc', 'Homme', 'Paul Essomba et Anne Essomba');
  await add('Luc', 'enfant', 'Aline', 'Femme');
  await add('Marie', 'enfant', 'Matthieu', 'Homme', 'Marie Essomba seul · sans conjoint');
  const nodes = await evaluate('[...document.querySelectorAll(".tree-node")].map(n => n.__data__.person)');
  const find = name => nodes.find(p => p.firstName === name);
  assert.deepEqual(new Set(find('Luc').parentIds), new Set([find('Paul').id, find('Anne').id]));
  assert.deepEqual(find('Aline').parentIds, [find('Luc').id]);
  assert.ok(!find('Marie').childrenIds.includes(find('Luc').id));
  assert.deepEqual(find('Matthieu').parentIds, [find('Marie').id]);
  assert.ok(!find('Paul').childrenIds.includes(find('Matthieu').id));
  assert.ok(find('Paul').spouseIds.includes(find('Marie').id));
  assert.ok(find('Marie').spouseIds.includes(find('Paul').id));
  assert.ok(await evaluate('document.body.innerText.includes("2 unions")'));
  await shot('assistant-selected-branch');
  await page.call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await shot('assistant-mobile');
  await click('Choisir dans l’arbre');
  await shot('assistant-mobile-tree');
  await click('Revenir aux questions');
  await click('Ouvrir l’arbre');
  await page.wait('location.pathname === "/demo" && document.querySelector("#demo") && document.querySelectorAll(".tree-node").length === 8');
  assert.notEqual(await evaluate('localStorage.getItem("geneatree.current-tree.v1")'), before);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b => b.title.startsWith('Modifier l')).disabled`), false);
  await shot('new-personal-tree');
  await page.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evaluate('document.querySelector("[data-tour=demo-assistant]").click()');
  await phase('grow');
  await page.wait('document.querySelectorAll(".tree-node").length === 8');
  assert.ok(await evaluate('document.body.textContent.includes("Amina")'));
  const extensionExceptions = exceptions.filter(error => error.url?.startsWith('chrome-extension://') || error.url?.startsWith('extension://'));
  const appExceptions = exceptions.filter(error => !extensionExceptions.includes(error));
  await fs.writeFile(`${output}/browser-results.json`, JSON.stringify({ nodes: nodes.length, readonly: true, newTreePreservedPrevious: true, selectedUnion: ['Paul', 'Anne'], cousinParent: 'Luc', exceptions: appExceptions, extensionExceptions }, null, 2));
  assert.deepEqual(appExceptions, []);
  console.log('Navigateur réel : lecture seule, nouveau brouillon, reprise, sélection de nœud, deux unions, cousin, mobile et nouvel arbre enregistrés.');
} finally { await page.close(); }

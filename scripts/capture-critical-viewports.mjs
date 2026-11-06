import fs from 'node:fs/promises';
import {BrowserPage} from './render-review-browser.mjs';
const root='GeneaTree/test-artifacts/saints-review';
const stored=JSON.parse(await fs.readFile(`${root}/stored-trees.json`,'utf8'));
const catalog=JSON.parse(await fs.readFile('api/geneatree/src/main/resources/discovery/popular-trees.json','utf8'));
const selected=['vierge-marie','saint-jean-paul-ii','saint-louis-ix','sainte-elisabeth-de-hongrie','sainte-marguerite-ecosse','saint-thomas-aquin','sainte-brigitte-suede','sainte-katharine-drexel'];
const page=await BrowserPage.create();await page.call('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
for(const id of selected){const item=stored.find(e=>e.id===id);const entry=catalog.entries.find(e=>e.id===id);await page.goto('http://localhost:5173');const generations=await page.evaluate(`import('/src/components/demo/bandLayout.ts').then(m=>m.familyGenerationCount(${JSON.stringify(entry.tree.persons)},${JSON.stringify(entry.tree.marriages)}))`);await page.goto(`http://localhost:5173/shared/${item.token}?focus=${item.focus}&generations=${generations}&view=tree`);await page.wait(`document.querySelectorAll('.tree-node').length===${entry.personCount}`);await new Promise(r=>setTimeout(r,900));await page.capture(`${root}/${id}-1280.png`);await page.evaluate('document.querySelector("button[title=Recentrer]").click()');await new Promise(r=>setTimeout(r,650));await page.capture(`${root}/${id}-1280-overview.png`);console.log('1280',id);}
await page.close();

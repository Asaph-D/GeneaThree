import fs from 'node:fs/promises';
import {BrowserPage} from './render-review-browser.mjs';
const out='GeneaTree/test-artifacts/saints-review';
const catalog=JSON.parse(await fs.readFile('api/geneatree/src/main/resources/discovery/popular-trees.json','utf8'));
const limit=Number(process.argv[2]??catalog.entries.length);
const page=await BrowserPage.create();
let results=[];try{results=JSON.parse(await fs.readFile(`${out}/rendered-results.json`,'utf8')).filter(item=>!item.error&&item.sharedUrl);}catch{}
for(const entry of catalog.entries.slice(0,limit)){
 if(results.some(item=>item.id===entry.id))continue;
 try{
 if(await page.evaluate("!!document.querySelector('a[href=\"/atelier\"]')")){await page.evaluate("document.querySelector('a[href=\"/atelier\"]').click()");}else{await page.goto('http://localhost:5173/atelier');}
 await page.wait('document.querySelector("input[placeholder]") && document.querySelectorAll("article h3").length > 0');
 await page.evaluate(`(()=>{const input=document.querySelector('form input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(entry.title)});input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await new Promise(r=>setTimeout(r,100));
 await page.evaluate('document.querySelector("form").requestSubmit()');
 await page.wait(`Array.from(document.querySelectorAll('article h3')).some(h=>h.textContent===${JSON.stringify(entry.title)})`);
 await page.evaluate(`Array.from(document.querySelectorAll('article h3')).find(h=>h.textContent===${JSON.stringify(entry.title)}).closest('article').querySelector('button').click()`);
 await page.wait(`location.pathname==='/demo' && document.querySelectorAll('.tree-node').length===${entry.personCount}`);
 await new Promise(r=>setTimeout(r,900));
 const inspect=await page.evaluate(`(()=>{const nodes=Array.from(document.querySelectorAll('.tree-node'));const svg=document.querySelector('svg[aria-label="Arbre g\u00e9n\u00e9alogique"]');const bounds=svg.getBoundingClientRect();const focus=nodes.find(n=>n.__data__.person.id===${JSON.stringify(entry.tree.view.focusPersonId)});const b=focus?.getBoundingClientRect();return {nodes:nodes.length,focusName:focus?.textContent,focusVisible:!!b&&b.x>=bounds.x&&b.right<=bounds.right&&b.y>=bounds.y&&b.bottom<=bounds.bottom,view:JSON.parse(localStorage.getItem('geneatree.demo.view')),names:nodes.map(n=>n.textContent)}})()`);
 await page.capture(`${out}/${entry.id}-demo.png`);
 await page.evaluate('document.querySelector("button[title=Recentrer]").click()');
 await new Promise(r=>setTimeout(r,650));
 await page.capture(`${out}/${entry.id}-overview.png`);
 const manifest=JSON.parse(await fs.readFile(`${out}/stored-trees.json`,'utf8'));
 const stored=manifest.find(item=>item.id===entry.id);
 if(stored){const url=`http://localhost:5173/shared/${stored.token}?focus=${encodeURIComponent(entry.tree.view.focusPersonId)}&generations=${inspect.view.generations}&view=tree`;await page.goto(url);await page.wait(`document.querySelectorAll('.tree-node').length===${entry.personCount}`);await new Promise(r=>setTimeout(r,850));await page.capture(`${out}/${entry.id}-shared.png`);inspect.sharedUrl=url;inspect.sharedNodes=await page.evaluate("document.querySelectorAll('.tree-node').length");}
 results.push({id:entry.id,title:entry.title,...inspect});console.log('CAPTURED',entry.id,inspect.nodes,inspect.focusVisible);
 }catch(error){results.push({id:entry.id,error:error.message});console.log('ERROR',entry.id,error.message);}
 await fs.writeFile(`${out}/rendered-results.json`,JSON.stringify(results,null,2));
}
await page.close();

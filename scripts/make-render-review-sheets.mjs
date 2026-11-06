import fs from 'node:fs/promises';
import {BrowserPage} from './render-review-browser.mjs';
const root='GeneaTree/test-artifacts/saints-review';
const entries=JSON.parse(await fs.readFile(`${root}/rendered-results.json`,'utf8')).filter(e=>!e.error);
const page=await BrowserPage.create();
await page.call('Emulation.setDeviceMetricsOverride',{width:1920,height:1950,deviceScaleFactor:1,mobile:false});
for(const mode of ['demo','shared']){
 for(let start=0;start<entries.length;start+=6){
  if(entries.length<73&&start+6>entries.length)continue;
  let html='<html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#171717;color:white;font:18px Arial}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}figcaption{height:40px;padding:8px;background:#282828}img{width:100%;height:600px;object-fit:contain;background:#09090b}</style></head><body><div class="grid">';
  for(const entry of entries.slice(start,start+6)){
   const png=await fs.readFile(`${root}/${entry.id}-${mode}.png`);
   html+=`<figure><figcaption>${entry.title} - ${mode} (${entry.nodes} personnes)</figcaption><img src="data:image/png;base64,${png.toString('base64')}"></figure>`;
  }
  html+='</div></body></html>';
  await page.evaluate(`document.open();document.write(${JSON.stringify(html)});document.close();`);
  await page.wait('Array.from(document.images).every(img=>img.complete)');
  await page.capture(`${root}/sheet-${mode}-${String(start/6+1).padStart(2,'0')}.png`);
 }
}
await page.close();console.log('Contact sheets',entries.length);

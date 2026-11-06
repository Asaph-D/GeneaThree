import fs from 'node:fs/promises';
import path from 'node:path';
import {normalizeDiscoveryDates} from './discovery-dates.mjs';
const root='tmp-saints-genealogy/catalogue';
const catalog=JSON.parse(await fs.readFile(`${root}/catalog.json`,'utf8'));
let count=0,files=0;
for(const item of catalog.entries.filter(item=>item.kind==='saint')){
 const metadataPath=path.join(root,item.metadata);
 const metadata=JSON.parse(await fs.readFile(metadataPath,'utf8'));
 const archivePath=path.join(path.dirname(metadataPath),metadata.archive);
 const archive=JSON.parse(await fs.readFile(archivePath,'utf8'));
 const changes=normalizeDiscoveryDates(archive);
 if(changes){await fs.writeFile(archivePath,JSON.stringify(archive,null,2)+'\n');count+=changes;files++;}
}
console.log('Source archives normalized:',files,'date indications preserved:',count);

import fs from 'node:fs/promises';
const output='GeneaTree/test-artifacts/saints-review';
const api='http://localhost:8086/api';
await fs.mkdir(output,{recursive:true});
const catalog=JSON.parse(await fs.readFile('api/geneatree/src/main/resources/discovery/popular-trees.json','utf8'));
let manifest=[];try{manifest=JSON.parse(await fs.readFile(`${output}/stored-trees.json`,'utf8'));}catch{}
const password='LocalVisualAudit2026!';
for(const entry of catalog.entries){
 if(manifest.some(item=>item.id===entry.id&&item.stored))continue;
 const email=`visual-${entry.id}@example.invalid`;
 const headers={Authorization:`Basic ${Buffer.from(`${email}:${password}`).toString('base64')}`,'Content-Type':'application/json'};
 let response=await fetch(`${api}/auth/register`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,treeName:entry.title,privacyConsent:true})});
 let account=await response.json();
 if(!response.ok){response=await fetch(`${api}/auth/me`,{headers});account=await response.json();}
 if(!response.ok)throw new Error(JSON.stringify(account));
 const treeId=account.trees.find(t=>t.role==='OWNER').id;
 const place=value=>typeof value==='string'?value:[value?.city,value?.region,value?.country].filter(Boolean).join(', ');
 const snapshot={version:1,persons:entry.tree.persons.map(p=>({...p,birthPlace:place(p.birthPlace),deathPlace:place(p.deathPlace)})),marriages:entry.tree.marriages.map(m=>({...m,location:place(m.location)}))};
 response=await fetch(`${api}/trees/${treeId}/family`,{method:'PUT',headers,body:JSON.stringify(snapshot)});
 if(!response.ok){console.log('FAIL',entry.id,response.status,await response.text());continue;}
 const loaded=await(await fetch(`${api}/trees/${treeId}/family`,{headers})).json();
 response=await fetch(`${api}/trees/${treeId}/share-link`,{method:'POST',headers});
 const shared=await response.json();
 manifest.push({id:entry.id,title:entry.title,treeId,token:shared.token,focus:entry.tree.view.focusPersonId,generations:entry.tree.view.generations,persons:loaded.persons.length,stored:true});
 await fs.writeFile(`${output}/stored-trees.json`,JSON.stringify(manifest,null,2));
 console.log('STORED',entry.id,loaded.persons.length);
}
console.log('Stored',manifest.length,'/',catalog.entries.length);

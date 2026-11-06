import fs from 'node:fs/promises';
const root='GeneaTree/test-artifacts/saints-review';
const rows=JSON.parse(await fs.readFile(`${root}/rendered-results.json`,'utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
let html='<!doctype html><html lang="fr"><meta charset="utf-8"><title>Examen visuel des arbres</title><style>body{margin:32px;background:#111;color:#eee;font:16px/1.6 system-ui}h1{font-size:30px}a{color:#70cbff}article{border:1px solid #444;border-radius:14px;padding:20px;margin:20px 0}.views{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}img{width:100%;border:1px solid #555}summary{cursor:pointer}small{color:#bbb}nav{display:flex;gap:20px;flex-wrap:wrap}</style><h1>Captures du rendu r\u00e9el</h1><p>Backend Spring Boot + PostgreSQL 16. Navigation dans Chromium, ouverture depuis D\u00e9couvrir puis rechargement du partage depuis la base.</p><p>Les images de cette page sont des captures du navigateur. Elles ne certifient pas les filiations historiques.</p><nav><a href="http://localhost:5173/atelier">Ouvrir D\u00e9couvrir</a><a href="stored-trees.json">Arbres en base</a><a href="rendered-results.json">Relev\u00e9 des captures</a><a href="postgresql.dump">Sauvegarde PostgreSQL</a></nav>';
for(const r of rows){if(r.error){html+=`<article><h2>${escape(r.title??r.id)}</h2><p>${escape(r.error)}</p></article>`;continue;}
html+=`<article id="${r.id}"><h2>${escape(r.title)}</h2><p>${r.nodes} personnes enregistr\u00e9es et affich\u00e9es. <a href="${escape(r.sharedUrl)}" target="_blank">Ouvrir cet arbre depuis PostgreSQL</a> | <a href="archives/${r.id}.geneatree.json">Archive</a></p><div class="views">`;
for(const [mode,label] of [['demo','Ouverture depuis D\u00e9couvrir'],['overview','Vue d\u2019ensemble'],['shared','Partage recharg\u00e9 depuis PostgreSQL']])html+=`<div><h3>${label}</h3><a href="${r.id}-${mode}.png" target="_blank"><img loading="lazy" src="${r.id}-${mode}.png" alt="${escape(r.title)} - ${label}"></a></div>`;
html+='</div></article>';
}
await fs.writeFile(`${root}/index.html`,html+'</html>');console.log('Gallery entries',rows.length);

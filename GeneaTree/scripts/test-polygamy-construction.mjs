import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { polygamyConstructionStates } from './fixtures/polygamy-construction.mjs';

const {outputFiles}=await build({stdin:{contents:"export {layoutBands} from './src/components/demo/bandLayout'",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'esm'});
const {layoutBands}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const states=polygamyConstructionStates();
let scenarios=0;
for(const state of states){
  const variants=[state,JSON.parse(JSON.stringify(state)),{...state,persons:[...state.persons].reverse()},
    {...state,marriages:[...state.marriages].reverse()},
    {...state,marriages:state.marriages.map(u=>({...u,spouse1Id:u.spouse2Id,spouse2Id:u.spouse1Id}))},
    {...state,marriages:state.marriages.map(u=>({...u,rank:1}))}];
  for(const [v,variant]of variants.entries())for(const generations of [1,2,3,4,12]){
    const label=`${state.label}, variante ${v}, G${generations}`;
    const before=JSON.stringify(variant);
    const layout=layoutBands(variant.persons,variant.marriages,generations);
    assert.equal(JSON.stringify(variant),before,`${label}: données modifiées`);
    const nodes=new Map(layout.nodes.map(n=>[n.person.id,n]));
    assert.equal(nodes.size,layout.nodes.length,`${label}: personne dupliquée`);
    if(generations===12)assert.equal(nodes.size,variant.persons.length,`${label}: personne perdue`);
    for(const a of layout.nodes)for(const b of layout.nodes){
      if(a.person.id!==b.person.id&&a.depth===b.depth)assert.ok(Math.abs(a.x-b.x)>=115.999,`${label}: chevauchement ${a.person.id}/${b.person.id}`);
    }
    const households=variant.marriages.filter(u=>[u.spouse1Id,u.spouse2Id].includes('moyopo'));
    if(households.length<2)continue;
    const descendants=union=>{
      const result=new Set(),queue=[...union.childrenIds];
      while(queue.length){const id=queue.pop();if(result.has(id))continue;result.add(id);queue.push(...(variant.persons.find(p=>p.id===id)?.childrenIds??[]));}
      return result;
    };
    const groups=households.map(union=>({union,spouseId:union.spouse1Id==='moyopo'?union.spouse2Id:union.spouse1Id,descendants:descendants(union)}));
    const principal=[...groups].sort((a,b)=>b.descendants.size-a.descendants.size||(a.union.rank??99)-(b.union.rank??99)||a.union.id.localeCompare(b.union.id))[0];
    const hub=nodes.get('moyopo');
    const spouses=groups.map(g=>nodes.get(g.spouseId));
    assert.ok(hub&&spouses.every(Boolean),`${label}: foyer incomplet`);
    const forward=variant.persons.findIndex(p=>p.id==='moyopo')<Math.min(...['nkouokam','pouokam'].map(id=>variant.persons.findIndex(p=>p.id===id)));
    assert.equal(nodes.get(principal.spouseId).x,forward?Math.max(...spouses.map(n=>n.x)):Math.min(...spouses.map(n=>n.x)),`${label}: la branche dominante n’est pas prioritaire`);
    if(groups.length===2)assert.ok(forward?nodes.get(principal.spouseId).x>hub.x:nodes.get(principal.spouseId).x<hub.x,`${label}: conjointe dominante du mauvais côté`);
    for(const other of ['nkouokam','pouokam'])if(nodes.has(other))assert.ok(nodes.get(other).x<Math.min(hub.x,...spouses.map(n=>n.x))||nodes.get(other).x>Math.max(hub.x,...spouses.map(n=>n.x)),`${label}: ${other} traverse le foyer polygamique`);
    for(let a=0;a<groups.length;a++)for(let b=a+1;b<groups.length;b++){
      const ga=groups[a],gb=groups[b];
      for(const depth of new Set(layout.nodes.map(n=>n.depth))){
        const na=layout.nodes.filter(n=>n.depth===depth&&ga.descendants.has(n.person.id)&&!gb.descendants.has(n.person.id));
        const nb=layout.nodes.filter(n=>n.depth===depth&&gb.descendants.has(n.person.id)&&!ga.descendants.has(n.person.id));
        if(!na.length||!nb.length)continue;
        const left=nodes.get(ga.spouseId).x<nodes.get(gb.spouseId).x;
        assert.ok(left?Math.max(...na.map(n=>n.x))<Math.min(...nb.map(n=>n.x)):Math.max(...nb.map(n=>n.x))<Math.min(...na.map(n=>n.x)),`${label}: descendance d’une conjointe à travers l’autre branche`);
      }
    }
    const brigitte=nodes.get('brigitte'),paul=nodes.get('paul');
    const direct=layout.nodes.filter(n=>n.depth===paul?.depth&&groups.some(g=>g.union.childrenIds.includes(n.person.id)));
    if(brigitte&&direct.length){
      assert.ok(brigitte.x<Math.min(...direct.map(n=>n.x))||brigitte.x>Math.max(...direct.map(n=>n.x)),`${label}: Brigitte intercalée dans les enfants des différentes conjointes`);
      for(const branch of groups){
        const kids=branch.union.childrenIds.map(id=>nodes.get(id)).filter(Boolean);
        if(!kids.length)continue;
        const drop=layout.drops.find(d=>Math.abs(d.x1-nodes.get(branch.spouseId).x)<.001&&Math.abs(d.y1-(hub.y+100))<.001&&kids.every(k=>d.drops.some(end=>Math.abs(end.x-k.x)<.001)));
        assert.ok(drop,`${label}: branche raccordée à la mauvaise conjointe`);
        assert.ok(brigitte.x<drop.span.x1||brigitte.x>drop.span.x2,`${label}: la barre de filiation traverse la famille de Brigitte`);
      }
    }
    scenarios++;
  }
}
console.log(`Polygamie : ${states.length} états successifs, ${scenarios} états polygamiques vérifiés ; priorité, égalités, basculements, troisième conjointe et branches séparées.`);

// Every state is a valid snapshot after one construction action.
export function polygamyConstructionStates() {
  const people = new Map(), unions = [];
  const snapshots = [];
  const person = (id, name = id, gender = 'unknown') => {
    people.set(id, { id, firstName:'', lastName:name, gender, birthDate:'', birthPlace:{city:'',region:'',country:''}, deceased:false,
      parentIds:[], childrenIds:[], spouseIds:[], siblingIds:[], eventIds:[] });
  };
  const couple = (id, a, b, rank = 1) => {
    unions.push({id,spouse1Id:a,spouse2Id:b,rank,childrenIds:[]});
    people.get(a).spouseIds.push(b); people.get(b).spouseIds.push(a);
  };
  const parent = (childId, parentId) => {
    people.get(childId).parentIds.push(parentId); people.get(parentId).childrenIds.push(childId);
  };
  const child = (id, name, unionId) => {
    person(id,name);
    const union = unions.find(item=>item.id===unionId);
    parent(id,union.spouse1Id); parent(id,union.spouse2Id); union.childrenIds.push(id);
  };
  const take = label => snapshots.push({label,persons:structuredClone([...people.values()]),marriages:structuredClone(unions)});
  person('asaph','Asaph'); take('01-asaph');
  person('paul','Paul'); parent('asaph','paul'); take('02-paul');
  person('brigitte','Brigitte'); parent('asaph','brigitte'); couple('paul-brigitte','paul','brigitte'); unions[0].childrenIds.push('asaph'); take('03-brigitte');
  person('moyopo','Moyopo'); parent('paul','moyopo'); take('04-moyopo');
  person('mayoumo','Mayoumo'); parent('paul','mayoumo'); couple('mayoumo-union','moyopo','mayoumo',1); unions.at(-1).childrenIds.push('paul'); take('05-mayoumo');
  person('nkouokam','Nkouokam'); parent('brigitte','nkouokam'); take('06-nkouokam');
  person('pouokam','Pouokam'); parent('brigitte','pouokam'); couple('nkouokam-union','nkouokam','pouokam'); unions.at(-1).childrenIds.push('brigitte'); take('07-pouokam');
  person('mamouo','Mamouo'); couple('mamouo-union','moyopo','mamouo',2); take('08-mamouo');
  child('david','David','mayoumo-union'); take('09-david');
  child('leon','Léon','mamouo-union'); take('10-leon');
  person('leon-spouse','Conjointe de Léon'); couple('leon-union','leon','leon-spouse'); take('11-leon-spouse');
  child('leon-child-1','Enfant 1 de Léon','leon-union'); take('12-mamouo-two-descendants');
  child('leon-child-2','Enfant 2 de Léon','leon-union'); take('13-equal-branches');
  person('grandchild','Petit-enfant de Léon'); parent('grandchild','leon-child-1'); take('14-mamouo-dominant');
  child('paul-sibling','Autre enfant de Mayoumo','mayoumo-union'); take('15-equal-again');
  child('mamouo-child','Autre enfant de Mamouo','mamouo-union'); take('16-mamouo-dominant-again');
  person('third-wife','Troisième conjointe'); couple('third-union','moyopo','third-wife',3); take('17-third-wife');
  child('third-child','Enfant de la troisième conjointe','third-union'); take('18-third-child');
  person('third-spouse','Conjoint de cet enfant'); couple('third-child-union','third-child','third-spouse'); take('19-third-spouse');
  for (let i=1;i<=6;i++) { child(`third-grandchild-${i}`,`Petit-enfant ${i} de la troisième branche`,'third-child-union'); take(`third-branch-growth-${i}`); }
  return snapshots;
}

import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFile, unlink } from 'node:fs/promises';
import { build } from 'esbuild';

const output = join(tmpdir(), `geneatree-assistant-${process.pid}.mjs`);

const person = (id, firstName, gender, parentIds = [], siblingIds = [], childrenIds = []) => ({
  id,
  firstName,
  lastName: 'Essomba',
  gender,
  birthDate: '',
  birthPlace: { city: '', region: '', country: '' },
  deathDate: '',
  deathPlace: { city: '', region: '', country: '' },
  deceased: false,
  occupation: '',
  photoUrl: '',
  biography: '',
  notes: '',
  contact: {},
  eventIds: [],
  spouseIds: [],
  parentIds,
  siblingIds,
  childrenIds,
});

const people = [
  person('david', 'David', 'male', ['jean', 'claire']),
  person('jean', 'Jean', 'male', ['paul', 'marie'], ['luc'], ['david']),
  person('claire', 'Claire', 'female', [], [], ['david']),
  person('paul', 'Paul', 'male', [], [], ['jean', 'luc']),
  person('marie', 'Marie', 'female', [], [], ['jean', 'luc']),
  person('anne', 'Anne', 'female', [], [], []),
  person('luc', 'Luc', 'male', ['paul', 'marie'], ['jean'], ['aline']),
  person('aline', 'Aline', 'female', ['luc']),
];

try {
  await build({
    entryPoints: [join(process.cwd(), 'src', 'pages', 'AssistantPage.tsx')],
    outfile: output,
    bundle: true,
    platform: 'node',
    format: 'esm',
    banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
    treeShaking: true,
    define: { 'import.meta.env': '{}' },
    plugins: [{
      name: 'expose-assistant-model',
      setup(context) {
        context.onLoad({ filter: /AssistantPage\.tsx$/ }, async ({ path }) => {
          const source = await readFile(path, 'utf8');
          return {
            contents: source
              .replace('function draftFromFamily(', 'export function draftFromFamily(')
              .replace('function finishKin(', 'export function finishKin(')
              .replace('function buildFamily(', 'export function buildFamily(')
              .replace('function mergeFamilies(', 'export function mergeFamilies(')
              .replace('function routeKin(', 'export function routeKin('),
            loader: 'tsx',
            resolveDir: dirname(path),
          };
        });
      },
    }],
    logLevel: 'silent',
  });

  const { draftFromFamily, routeKin, finishKin, buildFamily, mergeFamilies } = await import(`${pathToFileURL(output).href}?v=${Date.now()}`);
  const draft = draftFromFamily(people, [], 'david');
  assert.ok(draft, 'Le brouillon de David doit être construit.');
  const initialProjection = buildFamily(draft);
  assert.deepEqual(mergeFamilies({persons:people,marriages:[]}, initialProjection, initialProjection), {persons:people,marriages:[]},
    'Reprendre un arbre ne doit ni ajouter des unions supposées ni modifier les données importées.');
  const surnameOnly = buildFamily({ ...draft, anchor: { ...draft.anchor, firstName:'', lastName:'Essomba' } });
  assert.ok(surnameOnly.persons.some(person=>person.id==='david' && person.firstName==='' && person.lastName==='Essomba'),
    'Un nom de famille seul doit suffire à construire la personne focale.');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.grandfather?.id, 'paul');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.grandmother?.id, 'marie');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.cousins[0]?.id, 'aline');
  assert.deepEqual(draft.branches.find((branch) => branch.parentId === 'jean')?.collaterals[0]?.parentIds, ['paul', 'marie']);
  assert.equal(routeKin('uncle', draft, 'jean').phase, 'kin-last', 'Jean ne doit pas redemander le parent commun.');
  assert.equal(routeKin('uncle', draft, 'claire').phase, 'kin-link-role', 'Claire doit demander quel parent est commun.');
  const multiUnionDraft = draftFromFamily(people, [
    { id: 'union-paul-marie', spouse1Id: 'paul', spouse2Id: 'marie', rank: 1, childrenIds: ['jean', 'luc'] },
    { id: 'union-paul-anne', spouse1Id: 'paul', spouse2Id: 'anne', rank: 2, childrenIds: [] },
  ], 'david');
  assert.equal(routeKin('uncle', multiUnionDraft, 'jean').phase, 'kin-parent-union', 'Plusieurs unions doivent être proposées.');
  const referencedSpouse = multiUnionDraft.extraSpouses.find(item => item.spouse.id === 'anne').spouse;
  const preservedUnions = buildFamily({ ...multiUnionDraft, linkedPeople: [referencedSpouse] });
  assert.ok(preservedUnions.marriages.some(union => [union.spouse1Id, union.spouse2Id].includes('paul') && [union.spouse1Id, union.spouse2Id].includes('anne')),
    'Sélectionner un conjoint comme parent ne doit pas supprimer son union existante.');
  const withParent = finishKin(draft, { kin: 'node-parent', hostId: 'aline', firstName: 'Emma', lastName: 'Essomba', gender: 'female' }).draft;
  const withChild = finishKin(withParent, { kin: 'node-child', hostId: 'aline', firstName: 'Noa', lastName: 'Essomba', gender: 'unknown', unionSpouseId: null }).draft;
  const rebuilt = buildFamily(withChild);
  const emma = rebuilt.persons.find(person => person.firstName === 'Emma');
  const noa = rebuilt.persons.find(person => person.firstName === 'Noa');
  assert.ok(rebuilt.persons.find(person => person.id === 'aline').parentIds.includes(emma.id));
  assert.ok(emma.childrenIds.includes('aline'));
  assert.deepEqual(noa.parentIds, ['aline']);
  assert.ok(rebuilt.persons.find(person => person.id === 'aline').childrenIds.includes(noa.id));
  const preserved = mergeFamilies({persons:people,marriages:[]}, rebuilt, initialProjection);
  assert.equal(preserved.marriages.length,0,'Les unions déduites par le brouillon ne doivent pas être enregistrées lors d’un ajout.');
  assert.ok(preserved.persons.find(person=>person.id==='aline').parentIds.includes(emma.id));
  assert.ok(preserved.persons.find(person=>person.id==='aline').childrenIds.includes(noa.id));
  const catalogue=JSON.parse(await readFile('../api/geneatree/src/main/resources/discovery/popular-trees.json','utf8'));
  for (const entry of catalogue.entries) {
    const base={persons:entry.tree.persons,marriages:entry.tree.marriages};
    const loaded=draftFromFamily(base.persons,base.marriages,entry.tree.view.focusPersonId);
    const projection=buildFamily(loaded);
    assert.deepEqual(mergeFamilies(base,projection,projection),base,`${entry.id}: la reprise doit conserver exactement l’archive`);
  }
  console.log('Assistant : branches existantes et ajout réciproque de parent/enfant depuis un nœud validés.');
} finally {
  await unlink(output).catch(() => undefined);
}

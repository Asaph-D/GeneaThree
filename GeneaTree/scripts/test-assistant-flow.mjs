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
              .replace('function routeKin(', 'export function routeKin('),
            loader: 'tsx',
            resolveDir: dirname(path),
          };
        });
      },
    }],
    logLevel: 'silent',
  });

  const { draftFromFamily, routeKin } = await import(`${pathToFileURL(output).href}?v=${Date.now()}`);
  const draft = draftFromFamily(people, [], 'david');
  assert.ok(draft, 'Le brouillon de David doit être construit.');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.grandfather?.id, 'paul');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.grandmother?.id, 'marie');
  assert.equal(draft.branches.find((branch) => branch.parentId === 'jean')?.cousins[0]?.id, 'aline');
  assert.deepEqual(draft.branches.find((branch) => branch.parentId === 'jean')?.collaterals[0]?.parentIds, ['paul', 'marie']);
  assert.equal(routeKin('uncle', draft, 'jean').phase, 'kin-first', 'Jean ne doit pas redemander le parent commun.');
  assert.equal(routeKin('uncle', draft, 'claire').phase, 'kin-link-role', 'Claire doit demander quel parent est commun.');
  const multiUnionDraft = draftFromFamily(people, [
    { id: 'union-paul-marie', spouse1Id: 'paul', spouse2Id: 'marie', rank: 1, childrenIds: ['jean', 'luc'] },
    { id: 'union-paul-anne', spouse1Id: 'paul', spouse2Id: 'anne', rank: 2, childrenIds: [] },
  ], 'david');
  assert.equal(routeKin('uncle', multiUnionDraft, 'jean').phase, 'kin-parent-union', 'Plusieurs unions doivent être proposées.');
  console.log('Assistant cousin flow: 7 vérifications réussies.');
} finally {
  await unlink(output).catch(() => undefined);
}

import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { unlink } from 'node:fs/promises';
import { build } from 'esbuild';

const output = join(tmpdir(), `geneatree-layout-${process.pid}.mjs`);
const place = { city: '', region: '', country: '' };
const person = (id, parentIds = [], childrenIds = [], spouseIds = []) => ({
  id, firstName: id, lastName: '', gender: 'unknown', birthDate: '', birthPlace: place,
  deceased: false, parentIds, childrenIds, spouseIds, siblingIds: [],
});
const marriage = (id, spouse1Id, spouse2Id, childrenIds, rank = 1) => ({ id, spouse1Id, spouse2Id, childrenIds, rank, location: place });

function assertStableLayout(name, persons, marriages, generations = 7) {
  const layout = layoutBands(persons, marriages, generations);
  assert.equal(new Set(layout.nodes.map((node) => node.person.id)).size, layout.nodes.length, `${name}: nœuds dupliqués`);
  assert.ok(layout.nodes.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)), `${name}: coordonnées invalides`);
  assert.ok(layout.unions.every((union) => [union.x1, union.x2, union.y].every(Number.isFinite)), `${name}: union invalide`);
  assert.ok(layout.drops.every((drop) => [drop.x1, drop.y1, drop.barY, ...drop.drops.flatMap((item) => [item.x, item.y])].every(Number.isFinite)), `${name}: filiation invalide`);
  assert.ok(layout.width > 0 && layout.height > 0, `${name}: dimensions invalides`);
  return layout;
}

let layoutBands;
try {
  await build({
    entryPoints: [join(process.cwd(), 'scripts', 'tree-layout-test-entry.ts')],
    outfile: output,
    bundle: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  });
  const module = await import(`${pathToFileURL(output).href}?v=${Date.now()}`);
  layoutBands = module.layoutBands;

  for (const sample of module.SAMPLE_FAMILIES) {
    const family = module.getSampleFamily(sample.id);
    assertStableLayout(sample.id, family.persons, family.marriages);
    const linked = new Set(family.marriages.flatMap((union) => [union.spouse1Id, union.spouse2Id, ...(union.childrenIds ?? [])]));
    family.persons.forEach((item) => {
      if (item.parentIds.length || item.childrenIds.length || item.spouseIds.length) linked.add(item.id);
    });
    assert.equal(linked.size, family.persons.length, `${sample.id}: une personne sans aucune relation est présente dans la fixture.`);
  }

  const exportedFamily = module.getSampleFamily('polygame');
  const exportedView = { viewType: 'tree', generations: 6, focusPersonId: exportedFamily.focusId };
  const archive = module.parseFamilyArchive(module.serializeFamilyArchive(exportedFamily.persons, exportedFamily.marriages, exportedView));
  assert.deepEqual(archive.persons, exportedFamily.persons, 'L’import doit restituer toutes les personnes exportées.');
  assert.deepEqual(archive.marriages, exportedFamily.marriages, 'L’import doit restituer toutes les unions exportées.');
  assert.deepEqual(archive.view, exportedView, 'L’import doit restituer la vue exportée.');
  assert.throws(
    () => module.parseFamilyArchive(JSON.stringify({ ...archive, persons: [...archive.persons, archive.persons[0]] })),
    /dupliqué/,
    'Une archive contenant des identifiants dupliqués doit être refusée.',
  );
  assert.throws(
    () => module.parseFamilyArchive(JSON.stringify({ ...archive, format: 'inconnu' })),
    /compatible/,
    'Un format étranger doit être refusé.',
  );
  const pdf = await module.buildFamilyPdf(exportedFamily.persons, exportedFamily.marriages, exportedView.generations);
  const pdfBytes = new Uint8Array(pdf.output('arraybuffer'));
  assert.ok(pdfBytes.length > 1_000, 'Le PDF vectoriel doit contenir un document complet.');
  assert.equal(new TextDecoder().decode(pdfBytes.slice(0, 4)), '%PDF', 'Le fichier généré doit être un PDF valide.');
  assert.match(new TextDecoder().decode(pdfBytes.slice(-16)), /%%EOF/, 'Le PDF doit être correctement finalisé.');
  for (const template of module.PDF_TEMPLATES) {
    const styledPdf = await module.buildFamilyPdf(exportedFamily.persons, exportedFamily.marriages, exportedView.generations, { ...module.DEFAULT_PDF_DESIGN, templateId: template.id, frameStyle: template.frameStyle, particleType: 'stars' });
    const styledBytes = new Uint8Array(styledPdf.output('arraybuffer'));
    assert.equal(new TextDecoder().decode(styledBytes.slice(0, 4)), '%PDF', `Le modèle ${template.id} doit générer un PDF valide.`);
  }
  for (const gradient of module.PDF_GRADIENTS) {
    const gradientPdf = await module.buildFamilyPdf(exportedFamily.persons, exportedFamily.marriages, exportedView.generations, { ...module.DEFAULT_PDF_DESIGN, backgroundGradient: gradient.id, gradientIntensity: 82 });
    const gradientBytes = new Uint8Array(gradientPdf.output('arraybuffer'));
    assert.equal(new TextDecoder().decode(gradientBytes.slice(0, 4)), '%PDF', `Le fond ${gradient.id} doit générer un PDF valide.`);
  }

  const persons = [
    person('paul-pere', [], ['paul', 'paul-frere'], ['paul-mere']),
    person('paul-mere', [], ['paul', 'paul-frere'], ['paul-pere']),
    person('paul', ['paul-pere', 'paul-mere'], ['david'], ['marceline']),
    person('paul-frere', ['paul-pere', 'paul-mere']),
    person('marceline-pere', [], ['marceline', 'marceline-soeur'], ['marceline-mere']),
    person('marceline-mere', [], ['marceline', 'marceline-soeur'], ['marceline-pere']),
    person('marceline', ['marceline-pere', 'marceline-mere'], ['david'], ['paul']),
    person('marceline-soeur', ['marceline-pere', 'marceline-mere']),
    person('david', ['paul', 'marceline']),
  ];
  const marriages = [
    marriage('u1', 'paul-pere', 'paul-mere', ['paul', 'paul-frere']),
    marriage('u2', 'paul', 'marceline', ['david']),
    marriage('u3', 'marceline-pere', 'marceline-mere', ['marceline', 'marceline-soeur']),
  ];
  const converging = assertStableLayout('ascendances convergentes', persons, marriages);
  const byId = new Map(converging.nodes.map((node) => [node.person.id, node]));
  assert.ok(byId.has('marceline-pere') && byId.has('marceline-mere') && byId.has('marceline'), 'La branche de Marceline doit rester groupée et reliée.');
  assert.ok(byId.get('paul-frere').x < byId.get('paul').x, 'La fratrie de Paul doit rester du côté de la famille de Paul.');
  assert.ok(byId.get('marceline-soeur').x > byId.get('marceline').x, 'La fratrie de Marceline doit rester du côté de la famille de Marceline.');
  assert.ok(byId.get('paul-frere').x < byId.get('marceline').x && byId.get('marceline-soeur').x > byId.get('paul').x, 'Les deux grandes familles doivent rester séparées par le couple.');
  assert.ok(converging.drops.some((drop) => drop.drops.some((child) => Math.abs(child.x - byId.get('marceline').x) < 1)), 'Un raccord enfant doit rejoindre Marceline sans déplacer son foyer parental.');

  assert.deepEqual(module.descendantIds('paul', persons).sort(), ['david'].sort());
  assert.equal(module.orphanedDirectChildren('paul', persons).length, 0, 'David conserve Marceline comme second parent.');
  const singleParentFamily = [person('parent', [], ['child']), person('child', ['parent'])];
  assert.equal(module.orphanedDirectChildren('parent', singleParentFamily).length, 1, 'Un enfant à parent unique doit être signalé orphelin.');
  assert.deepEqual(module.descendantIds('parent', singleParentFamily), ['child']);
  assert.deepEqual(module.isolatedAfterDeletion('parent', singleParentFamily).map((item) => item.id), ['child']);
  const siblings = [
    person('parent', [], ['a', 'b']),
    { ...person('a', ['parent']), siblingIds: ['b'] },
    { ...person('b', ['parent']), siblingIds: ['a'] },
  ];
  assert.equal(module.isolatedAfterDeletion('parent', siblings).length, 0, 'La fratrie doit rester reliée après la suppression du parent.');

  console.log(`Tree layout scenarios: ${module.SAMPLE_FAMILIES.length + 3} familles et suppressions validées.`);
} finally {
  await unlink(output).catch(() => undefined);
}

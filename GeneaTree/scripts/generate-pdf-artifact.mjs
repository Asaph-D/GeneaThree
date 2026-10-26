import { build } from 'esbuild';
import { join } from 'node:path';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const output = join(tmpdir(), `geneatree-pdf-artifact-${process.pid}.mjs`);
const artifacts = join(process.cwd(), 'test-artifacts');
try {
  await build({ entryPoints: [join(process.cwd(), 'scripts', 'tree-layout-test-entry.ts')], outfile: output, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
  const module = await import(`${pathToFileURL(output).href}?v=${Date.now()}`);
  const family = module.getSampleFamily('monogame');
  const options = { ...module.createDefaultPdfDesign(true), templateId: 'pur', frameStyle: 'none', backgroundGradient: 'prism', gradientIntensity: 30, backgroundPattern: 'diagonal', particleType: 'stars', particleDensity: 18, particleNetwork: true, globalBorderEnabled: true, globalBorderColor: '#26364f', globalBorderWidth: 1.5 };
  const pdf = await module.buildFamilyPdf(family.persons, family.marriages, 6, options);
  await mkdir(artifacts, { recursive: true });
  const target = join(artifacts, 'geneatree-studio-reference.pdf');
  await writeFile(target, Buffer.from(pdf.output('arraybuffer')));
  console.log(target);
} finally {
  await unlink(output).catch(() => undefined);
}

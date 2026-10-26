import { AlignCenter, AlignLeft, AlignRight, ChevronDown, Download, Image, Layers3, Minus, Palette, Plus, Shapes, Sparkles, Type, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import React, { useMemo, useRef, useState } from 'react';
import { layoutBands } from '../demo/bandLayout';
import { Marriage, Person } from '../../types/family';
import { PDF_GRADIENTS, PDF_TEMPLATES, PdfDesignOptions, TextAlignment, createDefaultPdfDesign } from '../../services/pdfDesign';

interface PdfExportStudioProps {
  persons: Person[];
  marriages: Marriage[];
  generations: number;
  initialSvg: string;
  testPreset?: boolean;
  onClose: () => void;
  onDownload: (options: PdfDesignOptions) => Promise<void>;
}

type PanelId = 'templates' | 'background' | 'portraits' | 'borders' | 'effects' | 'text';

export default function PdfExportStudio({ persons, marriages, generations, initialSvg, testPreset = false, onClose, onDownload }: PdfExportStudioProps) {
  const [options, setOptions] = useState<PdfDesignOptions>(() => {
    const base = createDefaultPdfDesign(document.body.classList.contains('dark'));
    return testPreset ? { ...base, templateId: 'constellation', frameStyle: 'constellation', backgroundPattern: 'grid', particleType: 'stars', particleNetwork: true, globalBorderEnabled: true, title: 'Mémoire de famille', titleAlign: 'center', message: 'Nos racines traversent les générations', messagePosition: 'bottom' } : base;
  });
  const darkMode = document.body.classList.contains('dark');
  const [panel, setPanel] = useState<PanelId>('templates');
  const [busy, setBusy] = useState(false);
  const backgroundCaptureRef = useRef<HTMLDivElement>(null);
  const treeCaptureRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => layoutBands(persons, marriages, generations), [persons, marriages, generations]);
  const hasHeading = Boolean(options.title || (options.message && options.messagePosition === 'top'));
  const viewBox = `${layout.minX - 36} ${layout.minY - (hasHeading ? 86 : 36)} ${layout.width + 72} ${layout.height + (hasHeading ? 128 : 78)}`;
  const update = <Key extends keyof PdfDesignOptions>(key: Key, value: PdfDesignOptions[Key]) => { setOptions((current) => ({ ...current, [key]: value })); };
  const download = async () => { setBusy(true); try {
    const backgroundCanvas = backgroundCaptureRef.current ? await html2canvas(backgroundCaptureRef.current, { backgroundColor: null, scale: 3, logging: false, useCORS: true }) : null;
    const treeCanvas = treeCaptureRef.current ? await html2canvas(treeCaptureRef.current, { backgroundColor: null, scale: 4, logging: false, useCORS: true }) : null;
    await onDownload({ ...options, capturedBackgroundDataUrl: backgroundCanvas?.toDataURL('image/jpeg', .96), capturedTreeDataUrl: treeCanvas?.toDataURL('image/png'), capturedViewportWidth: backgroundCaptureRef.current?.clientWidth, capturedViewportHeight: backgroundCaptureRef.current?.clientHeight });
  } finally { setBusy(false); } };

  return (
    <div className="fixed inset-0 z-[120] flex bg-zinc-950/90 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="pdf-studio-title">
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 sm:px-6">
          <div><p className="text-[10px] uppercase tracking-[0.2em] text-sky-300">Validation avant export</p><h2 id="pdf-studio-title" className="font-serif text-xl text-white">Studio PDF</h2></div>
          <div className="flex items-center gap-2"><button onClick={onClose} disabled={busy} className="rounded-xl border border-white/10 p-2 text-zinc-300 hover:bg-white/10" aria-label="Fermer"><X size={18} /></button><button onClick={() => void download()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 disabled:opacity-50"><Download size={16} />{busy ? 'Génération…' : 'Télécharger'}</button></div>
        </header>
        <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_85%_90%,rgba(99,102,241,.13),transparent_32%)] p-3 sm:p-6">
          <div className="relative h-full max-h-full w-full max-w-full overflow-hidden rounded-md shadow-[0_30px_100px_rgba(0,0,0,.55)] ring-1 ring-white/10" style={{ backgroundColor: options.backgroundColor }}>
            <div ref={backgroundCaptureRef} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ backgroundColor: options.backgroundColor }}>
              {usesCssDepthBackground(options.backgroundGradient) && <div className="absolute inset-0" style={{ background: PDF_GRADIENTS.find((gradient) => gradient.id === options.backgroundGradient)?.preview, opacity: options.gradientIntensity / 100 }} />}
              <svg className="absolute inset-0 h-full w-full" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
                <defs><PreviewGradient options={options} idPrefix="studio-background" /></defs>
                {options.backgroundGradient !== 'none' && !usesCssDepthBackground(options.backgroundGradient) && <rect x={layout.minX - 36} y={layout.minY - 86} width={layout.width + 72} height={layout.height + 128} fill="url(#studio-background-background-gradient)" opacity={options.gradientIntensity / 100} />}
                {!usesCssDepthBackground(options.backgroundGradient) && <PreviewDepthBackground options={options} idPrefix="studio-background" x={layout.minX - 36} y={layout.minY - 86} width={layout.width + 72} height={layout.height + 128} />}
                <PreviewDecorations options={options} x={layout.minX - 28} y={layout.minY - (hasHeading ? 78 : 28)} width={layout.width + 56} height={layout.height + (hasHeading ? 112 : 62)} />
              </svg>
            </div>
            <div ref={treeCaptureRef} className="absolute inset-0 z-[1] h-full w-full">
            {initialSvg ? <><div className="h-full w-full [&_svg]:static [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: initialSvg }} /><TreeTextOverlay options={options} /></> : <svg className="h-full w-full" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
              {options.title && <PreviewText value={options.title} align={options.titleAlign} y={layout.minY - 48} color={options.textColor} font={options.fontFamily} minX={layout.minX} width={layout.width} size={24} bold />}
              {options.message && options.messagePosition === 'top' && <PreviewText value={options.message} align={options.messageAlign} y={layout.minY - 22} color={options.messageColor} font={options.fontFamily} minX={layout.minX} width={layout.width} size={10} />}
              {options.message && options.messagePosition === 'watermark' && <PreviewText value={options.message} align="center" y={layout.minY + layout.height / 2} color={options.messageColor} font={options.fontFamily} minX={layout.minX} width={layout.width} size={34} bold opacity={0.09} />}
              {[...new Set(layout.nodes.map((node) => node.depth))].map((depth) => <text key={`g-${depth}`} x={layout.minX + 8} y={layout.nodes.find((node) => node.depth === depth)?.y ?? 0} fill={options.textColor} opacity=".65" fontSize="8">G{depth}</text>)}
              <g fill="none" stroke={options.lineColor} strokeWidth="2">
                {layout.unions.map((union, index) => <path key={`u-${index}`} d={`M ${union.x1} ${union.y} H ${union.x2}`} />)}
                {layout.drops.map((drop, index) => <path key={`d-${index}`} d={`M ${drop.x1} ${drop.y1} V ${drop.barY} M ${drop.span.x1} ${drop.barY} H ${drop.span.x2} ${drop.drops.map((child) => `M ${child.x} ${drop.barY} V ${child.y}`).join(' ')}`} />)}
              </g>
              {layout.unions.flatMap((union, index) => (union.rail ? union.ticks.map((tick, tickIndex) => ({ key: `${index}-${tickIndex}`, x: tick.x, y: union.y })) : [{ key: `${index}`, x: (union.x1 + union.x2) / 2, y: union.y }])).map((joint) => <g key={`diamond-${joint.key}`}><rect x={joint.x - 4.5} y={joint.y - 4.5} width="9" height="9" transform={`rotate(45 ${joint.x} ${joint.y})`} fill={options.backgroundColor} stroke={options.lineColor} strokeWidth="1.2" /><rect x={joint.x - 2} y={joint.y - 2} width="4" height="4" transform={`rotate(45 ${joint.x} ${joint.y})`} fill="none" stroke={options.lineColor} strokeOpacity=".4" strokeWidth=".7" /></g>)}
              {layout.nodes.map((node) => {
                const hasPhoto = Boolean(node.person.photoUrl);
                const radius = 24;
                const clipId = `preview-${node.person.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
                const shape = options.portraitShape;
                return <g key={node.person.id} transform={`translate(${node.x} ${node.y})`}>
                  <defs><clipPath id={clipId}>{shape === 'circle' ? <circle r={radius} /> : <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={shape === 'rounded' ? 9 : 0} />}</clipPath></defs>
                  {(!hasPhoto || options.showPhotoBackground) && (shape === 'circle' ? <circle r={radius} fill={node.person.gender === 'female' ? '#b3485c' : '#2f6b95'} /> : <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={shape === 'rounded' ? 9 : 0} fill={node.person.gender === 'female' ? '#b3485c' : '#2f6b95'} />)}
                  {hasPhoto ? <image href={node.person.photoUrl} x={-radius} y={-radius} width={radius * 2} height={radius * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} /> : <text y="5" textAnchor="middle" fill="white" fontSize="15" fontWeight="700">{node.person.firstName.charAt(0)}</text>}
                  {options.borderEnabled && (shape === 'circle' ? <circle r={radius} fill="none" stroke={options.borderColor} strokeWidth={options.borderWidth} /> : <rect x={-radius} y={-radius} width={radius * 2} height={radius * 2} rx={shape === 'rounded' ? 9 : 0} fill="none" stroke={options.borderColor} strokeWidth={options.borderWidth} />)}
                  <text y="37" textAnchor="middle" fill={options.textColor} fontFamily={options.fontFamily} fontSize="9" fontWeight="700">{node.person.firstName}</text><text y="48" textAnchor="middle" fill={options.textColor} fontFamily={options.fontFamily} fontSize="8">{node.person.lastName}</text>
                </g>;
              })}
              {options.message && options.messagePosition === 'bottom' && <PreviewText value={options.message} align={options.messageAlign} y={layout.minY + layout.height + 28} color={options.messageColor} font={options.fontFamily} minX={layout.minX} width={layout.width} size={11} />}
            </svg>}
            </div>
          </div>
        </div>
      </main>
      <aside className="absolute inset-x-0 bottom-0 z-20 max-h-[44vh] shrink-0 overflow-y-auto border-t border-white/10 bg-zinc-950/95 shadow-2xl md:static md:block md:max-h-none md:w-[340px] md:border-l md:border-t-0">
        <div className="border-b border-white/10 p-5"><p className="text-xs font-semibold text-white">Personnalisation</p><p className="mt-1 text-xs leading-5 text-zinc-500">Ouvrez uniquement l’outil dont vous avez besoin.</p></div>
        <Panel id="templates" icon={<Layers3 size={16} />} title="Cadres" active={panel} onToggle={setPanel}><p className="text-[11px] leading-5 text-zinc-500">Le cadre ne modifie plus vos particules.</p><div className="flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-color:#38bdf8_transparent] [scrollbar-width:thin]">{PDF_TEMPLATES.map((template) => <button key={template.id} onClick={() => setOptions((current) => ({ ...current, templateId: template.id, frameStyle: template.frameStyle }))} className={`min-w-[150px] snap-start rounded-xl border p-3 text-left transition ${options.templateId === template.id ? 'border-sky-400 bg-sky-400/10' : 'border-white/10 hover:bg-white/5'}`}><FrameThumbnail frameStyle={template.frameStyle} color={options.accentColor} /><span className="mt-3 block text-sm font-medium text-white">{template.name}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{template.description}</span></button>)}</div></Panel>
        <Panel id="background" icon={<Palette size={16} />} title="Fond & palette" active={panel} onToggle={setPanel}>
          <button onClick={() => setOptions((current) => ({ ...createDefaultPdfDesign(darkMode), portraitShape: current.portraitShape }))} className="w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-200">Reprendre exactement le thème de /demo</button>
          <p className="pt-1 text-[10px] uppercase tracking-wider text-zinc-500">Dégradés</p>
          <div className="flex items-stretch gap-2"><div className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto pb-2 [scrollbar-color:#38bdf8_transparent] [scrollbar-width:thin]">{PDF_GRADIENTS.map((gradient) => <button key={gradient.id} type="button" onClick={() => update('backgroundGradient', gradient.id)} className={`min-w-[98px] snap-start rounded-xl border p-2 text-left ${options.backgroundGradient === gradient.id ? 'border-sky-400 bg-sky-400/10' : 'border-white/10'}`}><GradientThumbnail gradientId={gradient.id} options={options} /><span className="mt-2 block text-[11px] text-zinc-300">{gradient.name}</span></button>)}</div><VerticalIntensity value={options.gradientIntensity} disabled={options.backgroundGradient === 'none'} onChange={(value) => update('gradientIntensity', value)} /></div>
          <ColorField label="Fond uni" value={options.backgroundColor} onChange={(value) => { update('backgroundColor', value); update('backgroundGradient', 'none'); }} />
          <ColorField label="Accent" value={options.accentColor} onChange={(value) => update('accentColor', value)} /><ColorField label="Liaisons" value={options.lineColor} onChange={(value) => update('lineColor', value)} />
          <label className="block text-xs text-zinc-400">Motif<select value={options.backgroundPattern} onChange={(event) => update('backgroundPattern', event.target.value as PdfDesignOptions['backgroundPattern'])} className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"><option value="none">Aucun</option><option value="grid">Grille complète</option><option value="dots">Points</option><option value="diagonal">Diagonales croisées</option></select></label>
        </Panel>
        <Panel id="portraits" icon={<Image size={16} />} title="Portraits" active={panel} onToggle={setPanel}><div className="grid grid-cols-3 gap-2">{(['circle', 'rounded', 'square'] as const).map((shape) => <button key={shape} onClick={() => update('portraitShape', shape)} className={`rounded-lg border px-2 py-3 text-xs ${options.portraitShape === shape ? 'border-sky-400 bg-sky-400/10 text-white' : 'border-white/10 text-zinc-400'}`}>{shape === 'circle' ? 'Rond' : shape === 'rounded' ? 'Arrondi' : 'Carré'}</button>)}</div><Toggle label="Fond coloré derrière les photos" checked={options.showPhotoBackground} onChange={(value) => update('showPhotoBackground', value)} /></Panel>
        <Panel id="borders" icon={<Shapes size={16} />} title="Contours" active={panel} onToggle={setPanel}><p className="text-[10px] uppercase tracking-wider text-zinc-500">Nœuds</p><Toggle label="Contours des nœuds" checked={options.borderEnabled} onChange={(value) => update('borderEnabled', value)} /><ColorField label="Couleur" value={options.borderColor} onChange={(value) => update('borderColor', value)} /><Range label="Épaisseur" value={options.borderWidth} min={0.5} max={5} step={0.5} onChange={(value) => update('borderWidth', value)} /><p className="pt-3 text-[10px] uppercase tracking-wider text-zinc-500">Page</p><Toggle label="Contour global" checked={options.globalBorderEnabled} onChange={(value) => update('globalBorderEnabled', value)} /><ColorField label="Couleur globale" value={options.globalBorderColor} onChange={(value) => update('globalBorderColor', value)} /><Range label="Épaisseur globale" value={options.globalBorderWidth} min={0.5} max={6} step={0.5} onChange={(value) => update('globalBorderWidth', value)} /></Panel>
        <Panel id="effects" icon={<Sparkles size={16} />} title="Particules" active={panel} onToggle={setPanel}><label className="block text-xs text-zinc-400">Type<select value={options.particleType} onChange={(event) => update('particleType', event.target.value as PdfDesignOptions['particleType'])} className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"><option value="none">Aucune</option><option value="dots">Points</option><option value="stars">Étoiles</option><option value="leaves">Feuilles</option><option value="diamonds">Losanges</option><option value="lines">Traits</option></select></label><Range label="Densité" value={options.particleDensity} min={4} max={40} step={2} onChange={(value) => update('particleDensity', value)} /><Toggle label="Réseau entre particules" checked={options.particleNetwork} onChange={(value) => update('particleNetwork', value)} /></Panel>
        <Panel id="text" icon={<Type size={16} />} title="Texte & message" active={panel} onToggle={setPanel}><TextField label="Titre" value={options.title} onChange={(value) => update('title', value)} /><AlignButtons value={options.titleAlign} onChange={(value) => update('titleAlign', value)} /><TextField label="Message superposé" value={options.message} onChange={(value) => update('message', value)} multiline /><AlignButtons value={options.messageAlign} onChange={(value) => update('messageAlign', value)} /><ColorField label="Couleur du message" value={options.messageColor} onChange={(value) => update('messageColor', value)} /><label className="mt-4 block text-xs text-zinc-400">Police<select value={options.fontFamily} onChange={(event) => update('fontFamily', event.target.value as PdfDesignOptions['fontFamily'])} className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"><option value="helvetica">Helvetica</option><option value="times">Times</option><option value="courier">Courier</option></select></label><label className="mt-4 block text-xs text-zinc-400">Position<select value={options.messagePosition} onChange={(event) => update('messagePosition', event.target.value as PdfDesignOptions['messagePosition'])} className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white"><option value="top">Sous le titre</option><option value="bottom">Bas de page</option><option value="watermark">Filigrane central</option></select></label></Panel>
      </aside>
    </div>
  );
}

function TreeTextOverlay({ options }: { options: PdfDesignOptions }) {
  const alignment = options.titleAlign === 'left' ? 'text-left' : options.titleAlign === 'right' ? 'text-right' : 'text-center';
  const messageAlignment = options.messageAlign === 'left' ? 'text-left' : options.messageAlign === 'right' ? 'text-right' : 'text-center';
  return <div className="pointer-events-none absolute inset-0 p-[4%]" style={{ fontFamily: options.fontFamily }}>
    {options.title && <div className={`${alignment} text-[clamp(16px,2.2vw,32px)] font-bold`} style={{ color: options.textColor }}>{options.title}</div>}
    {options.message && options.messagePosition === 'top' && <div className={`${messageAlignment} mt-2 whitespace-pre-wrap text-[clamp(10px,1vw,15px)]`} style={{ color: options.messageColor }}>{options.message}</div>}
    {options.message && options.messagePosition === 'watermark' && <div className={`absolute inset-x-[8%] top-1/2 -translate-y-1/2 whitespace-pre-wrap ${messageAlignment} text-[clamp(24px,5vw,68px)] font-bold opacity-10`} style={{ color: options.messageColor }}>{options.message}</div>}
    {options.message && options.messagePosition === 'bottom' && <div className={`absolute inset-x-[4%] bottom-[3%] whitespace-pre-wrap ${messageAlignment} text-[clamp(10px,1vw,15px)]`} style={{ color: options.messageColor }}>{options.message}</div>}
  </div>;
}

function PreviewText({ value, align, y, color, font, minX, width, size, bold = false, opacity = 1 }: { value: string; align: TextAlignment; y: number; color: string; font: string; minX: number; width: number; size: number; bold?: boolean; opacity?: number }) {
  const x = align === 'left' ? minX : align === 'right' ? minX + width : minX + width / 2;
  const lines = wrapPreviewText(value, Math.max(18, Math.floor(width / (size * .58))));
  return <text x={x} y={y - ((lines.length - 1) * size * .6)} fill={color} opacity={opacity} textAnchor={align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle'} fontFamily={font} fontSize={size} fontWeight={bold ? 700 : 400}>{lines.map((line, index) => <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : size * 1.25}>{line}</tspan>)}</text>;
}

function wrapPreviewText(value: string, maxCharacters: number) {
  return value.split(/\n/).flatMap((paragraph) => {
    const lines: string[] = []; let line = '';
    paragraph.split(/\s+/).filter(Boolean).forEach((word) => { const next = line ? `${line} ${word}` : word; if (next.length > maxCharacters && line) { lines.push(line); line = word; } else line = next; });
    lines.push(line || ' '); return lines;
  });
}

function PreviewGradient({ options, idPrefix }: { options: PdfDesignOptions; idPrefix: string }) {
  const preset = PDF_GRADIENTS.find((gradient) => gradient.id === options.backgroundGradient) ?? PDF_GRADIENTS[0];
  const depth = ['orbital', 'prism', 'topography', 'portal'].includes(options.backgroundGradient);
  return <>
    {depth ? <radialGradient id={`${idPrefix}-background-gradient`} cx=".62" cy=".42" r=".9"><stop offset="0" stopColor={preset.colors[1]} stopOpacity=".28" /><stop offset=".42" stopColor={preset.colors[2]} stopOpacity=".16" /><stop offset="1" stopColor={preset.colors[0]} /></radialGradient> : <linearGradient id={`${idPrefix}-background-gradient`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={preset.colors[0]} /><stop offset=".52" stopColor={preset.colors[1]} /><stop offset="1" stopColor={preset.colors[2]} /></linearGradient>}
    <radialGradient id={`${idPrefix}-depth-orb`} cx="38%" cy="32%"><stop offset="0" stopColor="#e0f2fe" /><stop offset=".08" stopColor="#38bdf8" /><stop offset=".38" stopColor="#0369a1" /><stop offset=".72" stopColor="#172554" /><stop offset="1" stopColor="#020617" /></radialGradient>
    <radialGradient id={`${idPrefix}-portal-glow`}><stop offset="0" stopColor="#c4b5fd" stopOpacity=".95" /><stop offset=".18" stopColor="#6366f1" stopOpacity=".62" /><stop offset=".55" stopColor="#312e81" stopOpacity=".2" /><stop offset="1" stopColor="#020617" stopOpacity="0" /></radialGradient>
    <linearGradient id={`${idPrefix}-prism-violet`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#7c3aed" stopOpacity="0" /><stop offset=".72" stopColor="#7c3aed" stopOpacity=".78" /><stop offset="1" stopColor="#ddd6fe" stopOpacity=".95" /></linearGradient>
    <linearGradient id={`${idPrefix}-prism-cyan`} x1="0" y1=".5" x2="1" y2=".5"><stop stopColor="#22d3ee" stopOpacity="0" /><stop offset=".74" stopColor="#0891b2" stopOpacity=".72" /><stop offset="1" stopColor="#cffafe" stopOpacity=".92" /></linearGradient>
    <filter id={`${idPrefix}-depth-blur`}><feGaussianBlur stdDeviation="12" /></filter><filter id={`${idPrefix}-depth-soft`}><feGaussianBlur stdDeviation="4" /></filter>
  </>;
}

function PreviewDepthBackground({ options, idPrefix, x, y, width, height }: { options: PdfDesignOptions; idPrefix: string; x: number; y: number; width: number; height: number }) {
  const opacity = options.gradientIntensity / 100;
  if (options.backgroundGradient === 'orbital') { const cx = x + width * .72; const cy = y + height * .38; return <g opacity={opacity}><circle cx={cx} cy={cy} r={Math.min(width, height) * .2} fill={options.accentColor} opacity=".14" filter={`url(#${idPrefix}-depth-blur)`} /><circle cx={cx} cy={cy} r={Math.min(width, height) * .12} fill={`url(#${idPrefix}-depth-orb)`} /><g fill="none" stroke={options.accentColor} opacity=".42"><ellipse cx={cx} cy={cy} rx={width * .2} ry={height * .075} transform={`rotate(-14 ${cx} ${cy})`} /><ellipse cx={cx} cy={cy} rx={width * .13} ry={height * .18} transform={`rotate(24 ${cx} ${cy})`} /></g><circle cx={cx - width * .025} cy={cy - height * .035} r="3" fill="white" opacity=".9" /></g>; }
  if (options.backgroundGradient === 'prism') { const px = x + width * .67; const py = y + height * .42; return <g opacity={opacity}><path d={`M${x + width * .06} ${y + height * .1}L${px} ${py}L${x + width * .06} ${y + height * .58}Z`} fill={`url(#${idPrefix}-prism-violet)`} filter={`url(#${idPrefix}-depth-soft)`} /><path d={`M${x + width * .94} ${y + height * .12}L${px} ${py}L${x + width * .94} ${y + height * .7}Z`} fill={`url(#${idPrefix}-prism-cyan)`} filter={`url(#${idPrefix}-depth-soft)`} /><circle cx={px} cy={py} r={Math.min(width, height) * .035} fill="#020617" /><circle cx={px} cy={py} r={Math.min(width, height) * .018} fill="#e0f2fe" opacity=".7" filter={`url(#${idPrefix}-depth-soft)`} /></g>; }
  if (options.backgroundGradient === 'topography') { const cx = x + width * .7; const cy = y + height * .52; return <g fill="none" stroke={options.accentColor} opacity={opacity * .32}>{Array.from({ length: 13 }, (_, index) => <path key={index} d={`M${cx - width * (.08 + index * .026)} ${cy}C${cx - width * (.06 + index * .022)} ${cy - height * (.08 + index * .021)},${cx + width * (.04 + index * .027)} ${cy - height * (.07 + index * .018)},${cx + width * (.08 + index * .026)} ${cy}S${cx + width * (.02 + index * .02)} ${cy + height * (.08 + index * .02)},${cx - width * (.08 + index * .026)} ${cy}`} strokeWidth={index % 3 === 0 ? 1.1 : .55} opacity={1 - index * .055} />)}</g>; }
  if (options.backgroundGradient === 'portal') { const vanishingX = x + width * .55; const vanishingY = y + height * .3; const rings = Array.from({ length: 12 }, (_, index) => { const progress = index / 11; return { cx: vanishingX + width * .04 * progress, cy: vanishingY + height * .19 * progress, rx: width * (.025 + progress * .19), ry: height * (.035 + progress * .25), opacity: .3 + progress * .48 }; }); const front = rings[rings.length - 1]; return <g opacity={opacity}><ellipse cx={front.cx} cy={front.cy} rx={front.rx * 1.35} ry={front.ry * 1.25} fill={`url(#${idPrefix}-portal-glow)`} filter={`url(#${idPrefix}-depth-blur)`} /><g fill="none" stroke={options.accentColor}>{rings.map((ring, index) => <ellipse key={index} cx={ring.cx} cy={ring.cy} rx={ring.rx} ry={ring.ry} strokeWidth={.35 + index * .075} opacity={ring.opacity} />)}<path d={`M${rings[0].cx - rings[0].rx} ${rings[0].cy}L${front.cx - front.rx} ${front.cy} M${rings[0].cx + rings[0].rx} ${rings[0].cy}L${front.cx + front.rx} ${front.cy}`} opacity=".35" /></g><ellipse cx={vanishingX} cy={vanishingY} rx={width * .019} ry={height * .027} fill="#020617" /></g>; }
  return null;
}

function GradientThumbnail({ gradientId, options }: { gradientId: PdfDesignOptions['backgroundGradient']; options: PdfDesignOptions }) {
  const preset = PDF_GRADIENTS.find((gradient) => gradient.id === gradientId) ?? PDF_GRADIENTS[0];
  return <span className="relative block h-12 overflow-hidden rounded-lg shadow-inner" style={{ background: preset.preview, opacity: Math.max(.25, options.gradientIntensity / 100) }}>{preset.depth && <span className="absolute right-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[8px] font-semibold text-white">3D</span>}</span>;
}

function usesCssDepthBackground(gradient: PdfDesignOptions['backgroundGradient']) {
  return gradient === 'prism' || gradient === 'topography' || gradient === 'portal';
}


function FrameThumbnail({ frameStyle, color }: { frameStyle: PdfDesignOptions['frameStyle']; color: string }) {
  return <svg viewBox="0 0 120 54" className="block h-14 w-full rounded-lg bg-black/25" fill="none" stroke={color} strokeWidth=".8">
    {frameStyle === 'none' && <path d="M20 27H100" strokeDasharray="3 4" opacity=".35" />}
    {frameStyle === 'fine' && <rect x="5" y="5" width="110" height="44" rx="2" />}
    {frameStyle === 'double' && <><rect x="4" y="4" width="112" height="46" rx="2" /><rect x="9" y="9" width="102" height="36" rx="1" /></>}
    {frameStyle === 'corners' && <path d="M5 19V5H19 M101 5H115V19 M5 35V49H19 M101 49H115V35" />}
    {frameStyle === 'wave' && <path d="M4 12Q31 1 60 12T116 12 M4 42Q31 53 60 42T116 42" />}
    {frameStyle === 'arch' && <path d="M10 49V22Q60-8 110 22V49" />}
    {frameStyle === 'geometric' && <path d="M5 15L15 5H105L115 15V39L105 49H15L5 39Z" />}
    {frameStyle === 'botanical' && <><path d="M7 47Q15 27 38 16 M113 7Q105 27 82 38" />{[0, 1, 2].map((index) => <g key={index}><ellipse cx={14 + index * 8} cy={39 - index * 8} rx="5" ry="2" transform={`rotate(-35 ${14 + index * 8} ${39 - index * 8})`} /><ellipse cx={106 - index * 8} cy={15 + index * 8} rx="5" ry="2" transform={`rotate(-35 ${106 - index * 8} ${15 + index * 8})`} /></g>)}</>}
    {frameStyle === 'constellation' && <><path d="M7 34L25 10L43 27 M77 27L95 44L113 20" />{[[7,34],[25,10],[43,27],[77,27],[95,44],[113,20]].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" fill={color} stroke="none" />)}</>}
    {frameStyle === 'ribbon' && <><path d="M15 10H105 M23 15H97 M15 44H105 M23 39H97" /><path d="M15 10L7 15L15 20 M105 10L113 15L105 20 M15 44L7 39L15 34 M105 44L113 39L105 34" /></>}
  </svg>;
}

function VerticalIntensity({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (value: number) => void }) {
  return <div className={`flex w-8 shrink-0 flex-col items-center justify-between rounded-xl border border-white/10 bg-white/[.025] py-1 ${disabled ? 'opacity-35' : ''}`} title={`Intensité du fond : ${value}%`}><Plus size={12} className="text-zinc-400" /><input aria-label="Intensité du dégradé" disabled={disabled} type="range" min="15" max="100" value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-16 w-4 cursor-pointer accent-sky-400 disabled:cursor-not-allowed" style={{ writingMode: 'vertical-lr', direction: 'rtl' }} /><Minus size={12} className="text-zinc-500" /></div>;
}

function PreviewDecorations({ options, x, y, width, height }: { options: PdfDesignOptions; x: number; y: number; width: number; height: number }) {
  const inset = 8;
  const particles = Array.from({ length: options.particleType === 'none' ? 0 : options.particleDensity }, (_, index) => ({
    x: x + 18 + ((index * 83) % Math.max(20, width - 36)), y: y + 18 + ((index * 47) % Math.max(20, height - 36)), size: 1.5 + (index % 3),
  }));
  const networkDistance = Math.min(150, Math.max(72, Math.min(width, height) * .22));
  const networkLinks = particles.flatMap((source, sourceIndex) => particles.slice(sourceIndex + 1).map((target, offset) => ({ source, target, sourceIndex, targetIndex: sourceIndex + offset + 1, distance: Math.hypot(target.x - source.x, target.y - source.y) }))).filter((link) => link.distance <= networkDistance);
  const motion = (particle: typeof particles[number], index: number) => ({ x: particle.x + (index % 2 ? 5 : -5), y: particle.y - 7 });
  return <g pointerEvents="none" fill="none" stroke={options.accentColor}>
    <g opacity=".08" strokeWidth=".65">{options.backgroundPattern === 'grid' && <>{Array.from({ length: 12 }, (_, index) => <line key={`v${index}`} x1={x + index * width / 11} y1={y} x2={x + index * width / 11} y2={y + height} />)}{Array.from({ length: 8 }, (_, index) => <line key={`h${index}`} x1={x} y1={y + index * height / 7} x2={x + width} y2={y + index * height / 7} />)}</>}{options.backgroundPattern === 'diagonal' && <>{Array.from({ length: 18 }, (_, index) => <line key={`d1-${index}`} x1={x - height + index * (width + height) / 17} y1={y + height} x2={x + index * (width + height) / 17} y2={y} />)}{Array.from({ length: 18 }, (_, index) => <line key={`d2-${index}`} x1={x - height + index * (width + height) / 17} y1={y} x2={x + index * (width + height) / 17} y2={y + height} />)}</>}{options.backgroundPattern === 'dots' && Array.from({ length: 70 }, (_, index) => <circle key={index} cx={x + 10 + (index * 43) % Math.max(20, width - 20)} cy={y + 10 + (index * 29) % Math.max(20, height - 20)} r="1.2" fill={options.accentColor} stroke="none" />)}</g>
    {options.globalBorderEnabled && <rect x={x} y={y} width={width} height={height} rx="4" stroke={options.globalBorderColor} strokeWidth={options.globalBorderWidth} />}
    {options.frameStyle === 'double' && <rect x={x + inset} y={y + inset} width={width - inset * 2} height={height - inset * 2} strokeWidth="1" opacity=".7" />}
    {options.frameStyle === 'corners' && <path d={`M${x} ${y + 40}V${y}H${x + 40} M${x + width - 40} ${y}H${x + width}V${y + 40} M${x} ${y + height - 40}V${y + height}H${x + 40} M${x + width - 40} ${y + height}H${x + width}V${y + height - 40}`} />}
    {options.frameStyle === 'wave' && <path d={`M${x} ${y + 22} Q${x + width * .25} ${y - 12} ${x + width * .5} ${y + 22} T${x + width} ${y + 22} M${x} ${y + height - 20} Q${x + width * .25} ${y + height + 12} ${x + width * .5} ${y + height - 20} T${x + width} ${y + height - 20}`} />}
    {options.frameStyle === 'arch' && <path d={`M${x + 24} ${y + height}V${y + 90}Q${x + width / 2} ${y - 70} ${x + width - 24} ${y + 90}V${y + height}`} />}
    {options.frameStyle === 'geometric' && <path d={`M${x} ${y + 40}L${x + 40} ${y}H${x + width - 40}L${x + width} ${y + 40}V${y + height - 40}L${x + width - 40} ${y + height}H${x + 40}L${x} ${y + height - 40}Z`} />}
    {options.frameStyle === 'botanical' && <path d={`M${x + 12} ${y + height - 12}Q${x + 38} ${y + height - 74} ${x + 102} ${y + height - 104} M${x + width - 12} ${y + 12}Q${x + width - 38} ${y + 74} ${x + width - 102} ${y + 104}`} />}
    {options.frameStyle === 'constellation' && <path d={`M${x + 20} ${y + 55}L${x + 70} ${y + 20}L${x + 115} ${y + 65} M${x + width - 20} ${y + height - 55}L${x + width - 70} ${y + height - 20}L${x + width - 115} ${y + height - 65}`} opacity=".7" />}
    {options.frameStyle === 'ribbon' && <path d={`M${x + 28} ${y + 18}H${x + width - 28} M${x + 42} ${y + 27}H${x + width - 42} M${x + 28} ${y + height - 18}H${x + width - 28} M${x + 42} ${y + height - 27}H${x + width - 42}`} />}
    {options.particleNetwork && <g opacity=".16" strokeWidth=".8">{networkLinks.map((link) => { const sourceMotion = motion(link.source, link.sourceIndex); const targetMotion = motion(link.target, link.targetIndex); return <line key={`${link.sourceIndex}-${link.targetIndex}`} x1={link.source.x} y1={link.source.y} x2={link.target.x} y2={link.target.y}><animate attributeName="x1" values={`${link.source.x};${sourceMotion.x};${link.source.x}`} dur={`${4 + link.sourceIndex % 4}s`} repeatCount="indefinite" /><animate attributeName="y1" values={`${link.source.y};${sourceMotion.y};${link.source.y}`} dur={`${4 + link.sourceIndex % 4}s`} repeatCount="indefinite" /><animate attributeName="x2" values={`${link.target.x};${targetMotion.x};${link.target.x}`} dur={`${4 + link.targetIndex % 4}s`} repeatCount="indefinite" /><animate attributeName="y2" values={`${link.target.y};${targetMotion.y};${link.target.y}`} dur={`${4 + link.targetIndex % 4}s`} repeatCount="indefinite" /></line>; })}</g>}
    <g fill={options.accentColor} stroke="none" opacity=".38">{particles.map((particle, index) => <g key={index} transform={`translate(${particle.x} ${particle.y})`}><animateTransform attributeName="transform" type="translate" values={`${particle.x} ${particle.y};${particle.x + (index % 2 ? 5 : -5)} ${particle.y - 7};${particle.x} ${particle.y}`} dur={`${4 + index % 4}s`} repeatCount="indefinite" />{options.particleType === 'stars' ? <path d="M0-4L1-1L4 0L1 1L0 4L-1 1L-4 0L-1-1Z" /> : options.particleType === 'leaves' ? <ellipse rx={particle.size * 1.8} ry={particle.size} transform="rotate(-35)" /> : options.particleType === 'diamonds' ? <rect x={-particle.size} y={-particle.size} width={particle.size * 2} height={particle.size * 2} transform="rotate(45)" /> : options.particleType === 'lines' ? <rect x="-1" y="-5" width="2" height="10" rx="1" /> : <circle r={particle.size} />}</g>)}</g>
  </g>;
}

function Panel({ id, icon, title, active, onToggle, children }: { id: PanelId; icon: React.ReactNode; title: string; active: PanelId; onToggle: (id: PanelId) => void; children: React.ReactNode }) { const open = active === id; return <section className="border-b border-white/10"><button onClick={() => onToggle(id)} className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm text-zinc-200">{icon}<span className="flex-1">{title}</span><ChevronDown size={15} className={`transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="space-y-3 px-5 pb-5">{children}</div>}</section>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="flex items-center justify-between text-xs text-zinc-400"><span>{label}</span><span className="flex items-center gap-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" /><input value={value} onChange={(event) => onChange(event.target.value)} className="w-24 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 font-mono text-[11px] text-white" /></span></label>; }
function TextField({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return <label className="block text-xs text-zinc-400">{label}{multiline ? <textarea value={value} maxLength={240} rows={3} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 leading-5 text-white outline-none focus:border-sky-400" /> : <input value={value} maxLength={90} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-sky-400" />}</label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="mt-4 flex cursor-pointer items-center justify-between text-xs text-zinc-300"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-sky-500" /></label>; }
function Range({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) { return <label className="mt-4 block text-xs text-zinc-400">{label} : {value}<input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 w-full accent-sky-500" /></label>; }
function AlignButtons({ value, onChange }: { value: TextAlignment; onChange: (value: TextAlignment) => void }) { return <div className="flex rounded-lg border border-white/10 p-1">{([{ id: 'left', icon: <AlignLeft size={15} /> }, { id: 'center', icon: <AlignCenter size={15} /> }, { id: 'right', icon: <AlignRight size={15} /> }] as const).map((item) => <button key={item.id} onClick={() => onChange(item.id)} className={`flex flex-1 justify-center rounded-md py-1.5 ${value === item.id ? 'bg-sky-500 text-white' : 'text-zinc-500 hover:text-white'}`} aria-label={`Aligner ${item.id}`}>{item.icon}</button>)}</div>; }

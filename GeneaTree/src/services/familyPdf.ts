import { jsPDF, RGBAData } from 'jspdf';
import { layoutBands } from '../components/demo/bandLayout';
import { Marriage, Person } from '../types/family';
import { DEFAULT_PDF_DESIGN, PDF_GRADIENTS, PdfDesignOptions, PortraitShape } from './pdfDesign';

const NODE_RADIUS = 24;
const COLORS = { male: '#2f6b95', female: '#b3485c', unknown: '#64748b' };

export async function exportFamilyPdf(persons: Person[], marriages: Marriage[], generations: number, design: PdfDesignOptions = DEFAULT_PDF_DESIGN) {
  const pdf = await buildFamilyPdf(persons, marriages, generations, design);
  pdf.save(`arbre-genealogique-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function buildFamilyPdf(persons: Person[], marriages: Marriage[], generations: number, design: PdfDesignOptions = DEFAULT_PDF_DESIGN) {
  const layout = layoutBands(persons, marriages, generations);
  const capturedAspect = design.capturedViewportWidth && design.capturedViewportHeight ? design.capturedViewportWidth / design.capturedViewportHeight : null;
  const format = capturedAspect ? [1190.55, 1190.55 / capturedAspect] : 'a3';
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format, compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const header = design.title || (design.message && design.messagePosition === 'top') ? 54 : 0;
  const scale = Math.min((pageWidth - margin * 2) / layout.width, (pageHeight - margin * 2 - header) / layout.height, 1.5);
  const scaleX = scale * .73; const scaleY = scale * .96; const visualScale = scale * .75;
  const offsetX = (pageWidth - layout.width * scaleX) / 2 - layout.minX * scaleX;
  const offsetY = margin + 9 + header - layout.minY * scaleY;
  const x = (value: number) => offsetX + value * scaleX;
  const y = (value: number) => offsetY + value * scaleY;

  if (design.capturedBackgroundDataUrl) pdf.addImage(design.capturedBackgroundDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
  else { await drawPdfBackground(pdf, design, pageWidth, pageHeight); drawPageDecorations(pdf, design, pageWidth, pageHeight); }
  if (design.capturedTreeDataUrl) { pdf.addImage(design.capturedTreeDataUrl, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST'); return pdf; }
  if (design.title) {
    pdf.setTextColor(design.textColor);
    pdf.setFont(design.fontFamily, 'bold');
    pdf.setFontSize(19);
    drawAlignedText(pdf, design.title, design.titleAlign, margin, pageWidth - margin, 38);
  }

  pdf.setDrawColor(design.lineColor);
  pdf.setLineWidth(Math.max(0.7, 1.2 * visualScale));
  layout.unions.forEach((union) => {
    pdf.line(x(union.x1), y(union.y), x(union.x2), y(union.y));
    union.ticks.forEach((tick) => pdf.line(x(tick.x), y(union.y - 7), x(tick.x), y(union.y + 7)));
    const joints = union.rail ? union.ticks.map((tick) => tick.x) : [(union.x1 + union.x2) / 2];
    joints.forEach((jointX) => drawDiamond(pdf, x(jointX), y(union.y), Math.max(3, 5 * visualScale), design.backgroundColor, design.lineColor));
  });
  layout.drops.forEach((drop) => {
    pdf.line(x(drop.x1), y(drop.y1), x(drop.x2), y(drop.barY));
    pdf.line(x(drop.span.x1), y(drop.barY), x(drop.span.x2), y(drop.barY));
    drop.drops.forEach((child) => pdf.line(x(child.x), y(drop.barY), x(child.x), y(child.y)));
  });
  pdf.setFont(design.fontFamily, 'normal');
  pdf.setFontSize(Math.max(5, 7 * visualScale));
  pdf.setTextColor(design.textColor);
  [...new Set(layout.nodes.map((node) => node.depth))].forEach((depth) => {
    const node = layout.nodes.find((item) => item.depth === depth);
    if (node) pdf.text(`G${depth}`, x(layout.minX + 8), y(node.y));
  });

  for (const node of layout.nodes) {
    const centerX = x(node.x);
    const centerY = y(node.y);
    const radius = NODE_RADIUS * visualScale;
    const color = COLORS[node.person.gender];
    const portrait = node.person.photoUrl ? await loadPortrait(node.person.photoUrl, design.portraitShape) : null;
    if (!portrait || design.showPhotoBackground) {
      pdf.setFillColor(color);
      drawNodeShape(pdf, centerX, centerY, radius, design.portraitShape, 'F');
    }
    if (portrait) {
      pdf.addImage(portrait, 'PNG', centerX - radius, centerY - radius, radius * 2, radius * 2, undefined, 'FAST');
    } else {
      pdf.setFont(design.fontFamily, 'bold');
      pdf.setFontSize(Math.max(7, 13 * visualScale));
      pdf.setTextColor('#ffffff');
      pdf.text((node.person.firstName || '?').charAt(0).toUpperCase(), centerX, centerY + 4 * visualScale, { align: 'center' });
    }
    if (design.borderEnabled) {
      pdf.setDrawColor(design.borderColor);
      pdf.setLineWidth(Math.max(0.5, design.borderWidth * visualScale));
      drawNodeShape(pdf, centerX, centerY, radius, design.portraitShape, 'S');
    }
    pdf.setFont(design.fontFamily, 'bold');
    pdf.setFontSize(Math.max(5.5, 8 * visualScale));
    pdf.setTextColor(design.textColor);
    const name = `${node.person.firstName} ${node.person.lastName}`.trim();
    const lines = pdf.splitTextToSize(name, Math.max(44, 94 * visualScale)).slice(0, 2);
    pdf.text(lines, centerX, centerY + radius + 11 * visualScale, { align: 'center' });
  }

  if (design.message) {
    pdf.setFont(design.fontFamily, 'normal');
    pdf.setTextColor(design.messageColor);
    if (design.messagePosition === 'top') drawAlignedText(pdf, design.message, design.messageAlign, margin, pageWidth - margin, 69);
    if (design.messagePosition === 'bottom') drawAlignedText(pdf, design.message, design.messageAlign, margin, pageWidth - margin, pageHeight - 32);
    if (design.messagePosition === 'watermark') {
      pdf.setGState(new pdf.GState({ opacity: 0.1 }));
      pdf.setFontSize(38);
      pdf.text(design.message, pageWidth / 2, pageHeight / 2, { align: 'center', angle: 18 });
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
  }
  return pdf;
}

function drawAlignedText(pdf: jsPDF, value: string, align: PdfDesignOptions['titleAlign'], left: number, right: number, y: number) {
  const x = align === 'left' ? left : align === 'right' ? right : (left + right) / 2;
  const lines = value.split('\n').flatMap((line) => pdf.splitTextToSize(line || ' ', right - left));
  pdf.text(lines, x, y, { align, lineHeightFactor: 1.2 });
}

async function drawPdfBackground(pdf: jsPDF, design: PdfDesignOptions, width: number, height: number) {
  const raster = renderDepthBackground(design);
  if (raster) { pdf.addImage(raster, typeof raster === 'string' ? 'JPEG' : 'RGBA', 0, 0, width, height, undefined, 'FAST'); return; }
  const preset = PDF_GRADIENTS.find((gradient) => gradient.id === design.backgroundGradient);
  if (!preset || design.backgroundGradient === 'none') { pdf.setFillColor(design.backgroundColor); pdf.rect(0, 0, width, height, 'F'); return; }
  const steps = 48;
  for (let index = 0; index < steps; index += 1) {
    const progress = index / Math.max(1, steps - 1); const local = progress <= .52 ? progress / .52 : (progress - .52) / .48;
    const from = progress <= .52 ? preset.colors[0] : preset.colors[1]; const to = progress <= .52 ? preset.colors[1] : preset.colors[2];
    const gradientColor = mixHex(from, to, local); const intensity = Math.max(.15, Math.min(1, design.gradientIntensity / 100));
    pdf.setFillColor(mixHex(design.backgroundColor, gradientColor, intensity)); pdf.rect(index * width / steps, 0, width / steps + 1, height, 'F');
  }
}

function renderDepthBackground(design: PdfDesignOptions): string | RGBAData | null {
  if (design.backgroundGradient === 'prism') return renderPrismPixels(design);
  if (typeof document === 'undefined' || !['topography', 'portal'].includes(design.backgroundGradient)) return null;
  const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 1700; const context = canvas.getContext('2d'); if (!context) return null;
  context.fillStyle = design.backgroundColor; context.fillRect(0, 0, canvas.width, canvas.height); context.globalAlpha = Math.max(.15, design.gradientIntensity / 100);
  if (design.backgroundGradient === 'portal') {
    const radius = Math.max(canvas.width, canvas.height) * .56; const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, radius); gradient.addColorStop(0, '#818cf8'); gradient.addColorStop(.04, '#818cf8'); gradient.addColorStop(.12, '#312e81'); gradient.addColorStop(.38, '#0f172a'); gradient.addColorStop(.7, '#020617'); gradient.addColorStop(1, '#020617'); context.fillStyle = gradient; context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const base = context.createLinearGradient(0, 0, canvas.width, canvas.height); base.addColorStop(0, '#06131d'); base.addColorStop(.5, '#164e63'); base.addColorStop(1, '#020617'); context.fillStyle = base; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = '#22d3ee55'; context.lineWidth = 3; for (let index = 1; index <= 22; index += 1) { context.beginPath(); context.ellipse(canvas.width * .72, canvas.height * .55, index * 54, index * 31, -.2, 0, Math.PI * 2); context.stroke(); }
  }
  context.globalAlpha = 1; return canvas.toDataURL('image/jpeg', .96);
}

function renderPrismPixels(design: PdfDesignOptions): RGBAData {
  const width = 2400; const height = 1700; const data = new Uint8ClampedArray(width * height * 4); const centerX = width * .64; const centerY = height * .42; const intensity = Math.max(.15, design.gradientIntensity / 100);
  const stops = [{ at: 0, color: '#09090b' }, { at: .2333, color: '#7c3aed' }, { at: .4667, color: '#06b6d4' }, { at: .7, color: '#09090b' }, { at: 1, color: '#09090b' }];
  const background = hexChannels(design.backgroundColor);
  for (let pixelY = 0; pixelY < height; pixelY += 1) for (let pixelX = 0; pixelX < width; pixelX += 1) {
    const cssAngle = (Math.atan2(pixelY - centerY, pixelX - centerX) * 180 / Math.PI + 90 + 360) % 360; const progress = ((cssAngle - 220 + 360) % 360) / 360;
    const upperIndex = Math.max(1, stops.findIndex((stop) => progress <= stop.at)); const lower = stops[upperIndex - 1]; const upper = stops[upperIndex]; const local = (progress - lower.at) / Math.max(.0001, upper.at - lower.at); const gradient = interpolateChannels(hexChannels(lower.color), hexChannels(upper.color), local); const mixed = interpolateChannels(background, gradient, intensity); const offset = (pixelY * width + pixelX) * 4;
    const diagonalPeriod = 132; const diagonalWidth = 1.8; const forward = ((pixelX + pixelY) % diagonalPeriod + diagonalPeriod) % diagonalPeriod; const backward = ((pixelX - pixelY) % diagonalPeriod + diagonalPeriod) % diagonalPeriod; const onDiagonal = design.backgroundPattern === 'diagonal' && (forward < diagonalWidth || diagonalPeriod - forward < diagonalWidth || backward < diagonalWidth || diagonalPeriod - backward < diagonalWidth); const finalColor = onDiagonal ? interpolateChannels(mixed, hexChannels(design.accentColor), .075) : mixed;
    data[offset] = finalColor[0]; data[offset + 1] = finalColor[1]; data[offset + 2] = finalColor[2]; data[offset + 3] = 255;
  }
  return { data, width, height };
}

function hexChannels(value: string): [number, number, number] { return [1, 3, 5].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]; }
function interpolateChannels(from: [number, number, number], to: [number, number, number], amount: number): [number, number, number] { return from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount)) as [number, number, number]; }

function mixHex(from: string, to: string, amount: number) {
  const channel = (value: string, offset: number) => Number.parseInt(value.slice(offset, offset + 2), 16);
  const result = [1, 3, 5].map((offset) => Math.round(channel(from, offset) + (channel(to, offset) - channel(from, offset)) * amount).toString(16).padStart(2, '0'));
  return `#${result.join('')}`;
}

function drawDiamond(pdf: jsPDF, x: number, y: number, radius: number, fill: string, stroke: string) {
  pdf.setFillColor(fill); pdf.setDrawColor(stroke);
  pdf.lines([[radius, radius], [-radius, radius], [-radius, -radius], [radius, -radius]], x, y - radius, [1, 1], 'FD', true);
  const inner = radius * 0.42;
  pdf.lines([[inner, inner], [-inner, inner], [-inner, -inner], [inner, -inner]], x, y - inner, [1, 1], 'S', true);
}

function drawPageDecorations(pdf: jsPDF, design: PdfDesignOptions, width: number, height: number) {
  const margin = 18; const borderMargin = 5;
  pdf.setDrawColor(design.globalBorderColor);
  pdf.setLineWidth(design.globalBorderWidth);
  if (design.globalBorderEnabled) pdf.roundedRect(borderMargin, borderMargin, width - borderMargin * 2, height - borderMargin * 2, 4, 4, 'S');
  pdf.setDrawColor(design.accentColor);
  pdf.setLineWidth(0.45);
  drawDepthDecoration(pdf, design, width, height);
  if (design.backgroundGradient !== 'prism') {
    pdf.setGState(new pdf.GState({ opacity: .025 }));
    if (design.backgroundPattern === 'grid') { for (let x = margin + 24; x < width - margin; x += 52) pdf.line(x, margin, x, height - margin); for (let y = margin + 24; y < height - margin; y += 52) pdf.line(margin, y, width - margin, y); }
    if (design.backgroundPattern === 'diagonal') for (let x = -height; x < width; x += 52) { pdf.line(x, height - margin, x + height, margin); pdf.line(x, margin, x + height, height - margin); }
    if (design.backgroundPattern === 'dots') for (let x = margin + 20; x < width - margin; x += 30) for (let y = margin + 20; y < height - margin; y += 30) pdf.circle(x, y, 0.8, 'F');
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  }
  if (design.frameStyle === 'double') pdf.rect(margin + 8, margin + 8, width - (margin + 8) * 2, height - (margin + 8) * 2, 'S');
  if (design.frameStyle === 'corners') [[margin, margin, 1, 1], [width - margin, margin, -1, 1], [margin, height - margin, 1, -1], [width - margin, height - margin, -1, -1]].forEach(([x, y, sx, sy]) => { pdf.line(x, y, x + 42 * sx, y); pdf.line(x, y, x, y + 42 * sy); });
  if (design.frameStyle === 'wave') {
    const segments = 32; let previousTop = margin + 12; let previousBottom = height - margin - 12;
    for (let index = 1; index <= segments; index += 1) { const currentX = margin + (width - margin * 2) * index / segments; const top = margin + 12 + Math.sin(index * Math.PI / 4) * 8; const bottom = height - margin - 12 - Math.sin(index * Math.PI / 4) * 8; const priorX = margin + (width - margin * 2) * (index - 1) / segments; pdf.line(priorX, previousTop, currentX, top); pdf.line(priorX, previousBottom, currentX, bottom); previousTop = top; previousBottom = bottom; }
  }
  if (design.frameStyle === 'arch') {
    const center = width / 2; const top = margin + 18; const side = margin + 26;
    pdf.lines([[center - side, -46], [center - side, 46], [0, height - margin - top]], side, height - margin, [1, 1], 'S');
  }
  if (design.frameStyle === 'geometric') {
    const cut = 38;
    pdf.lines([[width - margin * 2 - cut * 2, 0], [cut, cut], [0, height - margin * 2 - cut * 2], [-cut, cut], [-(width - margin * 2 - cut * 2), 0], [-cut, -cut], [0, -(height - margin * 2 - cut * 2)], [cut, -cut]], margin + cut, margin, [1, 1], 'S', true);
  }
  if (design.frameStyle === 'botanical') {
    for (let index = 0; index < 6; index += 1) { pdf.ellipse(margin + 18 + index * 13, height - margin - 18 - index * 10, 7, 3, 'S'); pdf.ellipse(width - margin - 18 - index * 13, margin + 18 + index * 10, 7, 3, 'S'); }
  }
  if (design.frameStyle === 'constellation') {
    const points = [[margin + 20, margin + 52], [margin + 67, margin + 22], [margin + 112, margin + 64], [width - margin - 20, height - margin - 52], [width - margin - 67, height - margin - 22], [width - margin - 112, height - margin - 64]];
    pdf.line(points[0][0], points[0][1], points[1][0], points[1][1]); pdf.line(points[1][0], points[1][1], points[2][0], points[2][1]); pdf.line(points[3][0], points[3][1], points[4][0], points[4][1]); pdf.line(points[4][0], points[4][1], points[5][0], points[5][1]);
  }
  if (design.frameStyle === 'ribbon') [[margin + 28, width - margin - 28, margin + 10], [margin + 42, width - margin - 42, margin + 18], [margin + 28, width - margin - 28, height - margin - 10], [margin + 42, width - margin - 42, height - margin - 18]].forEach(([x1, x2, y]) => pdf.line(x1, y, x2, y));
  pdf.setFillColor(design.accentColor);
  const particlePoints: { x: number; y: number }[] = [];
  for (let index = 0; index < (design.particleType === 'none' ? 0 : design.particleDensity); index += 1) {
    const randomX = Math.abs(Math.sin((index + 1) * 12.9898) * 43758.5453) % 1; const randomY = Math.abs(Math.sin((index + 1) * 78.233) * 12741.371) % 1;
    const x = margin + 15 + randomX * Math.max(20, width - margin * 2 - 30);
    const y = margin + 15 + randomY * Math.max(20, height - margin * 2 - 30);
    particlePoints.push({ x, y });
    const size = 1.2 + index % 3;
    if (design.particleType === 'diamonds') drawDiamond(pdf, x, y, size + 1, design.accentColor, design.accentColor);
    else if (design.particleType === 'lines') pdf.rect(x, y - 4, 1.5, 8, 'F');
    else if (design.particleType === 'leaves') pdf.ellipse(x, y, size * 1.8, size, 'F');
    else if (design.particleType === 'stars') pdf.lines([[1, 2], [2, 1], [-2, 1], [-1, 2], [-1, -2], [-2, -1], [2, -1], [1, -2]], x, y - 3, [1, 1], 'F', true);
    else pdf.circle(x, y, size, 'F');
  }
  if (design.particleNetwork) {
    pdf.setDrawColor(design.accentColor); pdf.setLineWidth(0.35); const threshold = 46;
    particlePoints.forEach((source, sourceIndex) => particlePoints.slice(sourceIndex + 1).forEach((target) => { if (Math.hypot(target.x - source.x, target.y - source.y) <= threshold) pdf.line(source.x, source.y, target.x, target.y); }));
  }
}

function drawDepthDecoration(pdf: jsPDF, design: PdfDesignOptions, width: number, height: number) {
  if (design.backgroundGradient === 'prism' || (typeof document !== 'undefined' && ['topography', 'portal'].includes(design.backgroundGradient))) return;
  const opacity = Math.max(.04, design.gradientIntensity / 100 * .16);
  if (!['orbital', 'prism', 'topography', 'portal'].includes(design.backgroundGradient)) return;
  pdf.setGState(new pdf.GState({ opacity })); pdf.setDrawColor(design.accentColor); pdf.setLineWidth(.55);
  if (design.backgroundGradient === 'orbital') {
    const cx = width * .72; const cy = height * .38;
    for (let index = 8; index > 0; index -= 1) { pdf.setFillColor(mixHex('#020617', design.accentColor, index / 12)); pdf.circle(cx, cy, Math.min(width, height) * (.04 + index * .009), 'F'); }
    pdf.setDrawColor(design.accentColor); pdf.ellipse(cx, cy, width * .2, height * .075, 'S'); pdf.ellipse(cx, cy, width * .13, height * .18, 'S');
  } else if (design.backgroundGradient === 'prism') {
    const px = width * .67; const py = height * .42;
    for (let index = 0; index < 12; index += 1) { const fraction = index / 11; pdf.setFillColor(mixHex('#7c3aed', '#020617', fraction * .72)); pdf.triangle(width * .06, height * (.1 + fraction * .48), px, py, width * .06, height * (.14 + fraction * .48), 'F'); pdf.setFillColor(mixHex('#22d3ee', '#020617', fraction * .72)); pdf.triangle(width * .94, height * (.12 + fraction * .58), px, py, width * .94, height * (.17 + fraction * .58), 'F'); }
    pdf.setFillColor('#e0f2fe'); pdf.circle(px, py, 4, 'F'); pdf.setFillColor('#020617'); pdf.circle(px, py, 2.2, 'F');
  } else if (design.backgroundGradient === 'topography') {
    for (let index = 0; index < 13; index += 1) { pdf.setLineWidth(index % 3 === 0 ? .65 : .3); pdf.ellipse(width * .7, height * .52, width * (.055 + index * .024), height * (.045 + index * .019), 'S'); }
  } else {
    const vanishingX = width * .55; const vanishingY = height * .3;
    for (let index = 0; index < 12; index += 1) { const progress = index / 11; const cx = vanishingX + width * .04 * progress; const cy = vanishingY + height * .19 * progress; pdf.setLineWidth(.25 + index * .055); pdf.ellipse(cx, cy, width * (.025 + progress * .19), height * (.035 + progress * .25), 'S'); }
    pdf.line(vanishingX - width * .025, vanishingY, width * .59 - width * .215, height * .49); pdf.line(vanishingX + width * .025, vanishingY, width * .59 + width * .215, height * .49);
    pdf.setFillColor('#020617'); pdf.ellipse(vanishingX, vanishingY, width * .019, height * .027, 'F');
  }
  pdf.setGState(new pdf.GState({ opacity: 1 }));
}

function drawNodeShape(pdf: jsPDF, centerX: number, centerY: number, radius: number, shape: PortraitShape, style: 'F' | 'S') {
  if (shape === 'circle') pdf.circle(centerX, centerY, radius, style);
  else if (shape === 'rounded') pdf.roundedRect(centerX - radius, centerY - radius, radius * 2, radius * 2, radius * 0.35, radius * 0.35, style);
  else pdf.rect(centerX - radius, centerY - radius, radius * 2, radius * 2, style);
}

async function loadPortrait(source: string, shape: PortraitShape): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const timeout = window.setTimeout(() => resolve(null), 5000);
    image.onload = () => {
      window.clearTimeout(timeout);
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) return resolve(null);
      context.save();
      context.beginPath();
      if (shape === 'circle') context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      else if (shape === 'rounded') context.roundRect(0, 0, size, size, size * 0.18);
      else context.rect(0, 0, size, size);
      context.clip();
      const crop = Math.min(image.naturalWidth, image.naturalHeight);
      context.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2, crop, crop, 0, 0, size, size);
      context.restore();
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    image.src = source;
  });
}

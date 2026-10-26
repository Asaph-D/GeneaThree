export type PortraitShape = 'circle' | 'rounded' | 'square';
export type PdfFontFamily = 'helvetica' | 'times' | 'courier';
export type MessagePosition = 'top' | 'bottom' | 'watermark';
export type TextAlignment = 'left' | 'center' | 'right';
export type ParticleType = 'none' | 'dots' | 'stars' | 'leaves' | 'diamonds' | 'lines';
export type BackgroundPattern = 'none' | 'grid' | 'dots' | 'diagonal';
export type BackgroundGradient = 'none' | 'aurora' | 'midnight' | 'ember' | 'ocean' | 'forest' | 'violet' | 'orbital' | 'prism' | 'topography' | 'portal';
export type FrameStyle = 'none' | 'fine' | 'double' | 'corners' | 'wave' | 'arch' | 'geometric' | 'botanical' | 'constellation' | 'ribbon';

export interface PdfDesignOptions {
  templateId: string;
  backgroundColor: string;
  accentColor: string;
  lineColor: string;
  textColor: string;
  portraitShape: PortraitShape;
  showPhotoBackground: boolean;
  borderEnabled: boolean;
  borderColor: string;
  borderWidth: number;
  globalBorderEnabled: boolean;
  globalBorderColor: string;
  globalBorderWidth: number;
  frameStyle: FrameStyle;
  particleType: ParticleType;
  particleDensity: number;
  particleNetwork: boolean;
  backgroundPattern: BackgroundPattern;
  backgroundGradient: BackgroundGradient;
  gradientIntensity: number;
  title: string;
  titleAlign: TextAlignment;
  message: string;
  messageColor: string;
  messageAlign: TextAlignment;
  fontFamily: PdfFontFamily;
  messagePosition: MessagePosition;
  capturedBackgroundDataUrl?: string;
  capturedTreeDataUrl?: string;
  capturedViewportWidth?: number;
  capturedViewportHeight?: number;
}

export interface PdfTemplate { id: string; name: string; description: string; frameStyle: FrameStyle; }

export const PDF_TEMPLATES: PdfTemplate[] = [
  { id: 'pur', name: 'Pur', description: 'Aucun cadre.', frameStyle: 'none' },
  { id: 'galerie', name: 'Galerie', description: 'Trait fin et discret.', frameStyle: 'fine' },
  { id: 'heritage', name: 'Héritage', description: 'Double filet classique.', frameStyle: 'double' },
  { id: 'angles', name: 'Angles', description: 'Coins éditoriaux.', frameStyle: 'corners' },
  { id: 'horizon', name: 'Horizon', description: 'Vagues inspirées de l’accueil.', frameStyle: 'wave' },
  { id: 'portique', name: 'Portique', description: 'Arc architectural.', frameStyle: 'arch' },
  { id: 'facettes', name: 'Facettes', description: 'Cadre géométrique.', frameStyle: 'geometric' },
  { id: 'racines', name: 'Racines', description: 'Ornement végétal.', frameStyle: 'botanical' },
  { id: 'constellation', name: 'Constellation', description: 'Éclats reliés très fins.', frameStyle: 'constellation' },
  { id: 'ruban', name: 'Ruban', description: 'Filets cérémoniels légers.', frameStyle: 'ribbon' },
];

export function createDefaultPdfDesign(dark = false): PdfDesignOptions {
  return {
    templateId: 'pur', backgroundColor: dark ? '#09090b' : '#f4f1ea', accentColor: dark ? '#38bdf8' : '#2563eb',
    lineColor: dark ? '#d6d3d1' : '#44403c', textColor: dark ? '#f5f5f4' : '#1c1917', portraitShape: 'circle',
    showPhotoBackground: false, borderEnabled: true, borderColor: dark ? '#d6d3d1' : '#44403c', borderWidth: 1.5,
    globalBorderEnabled: false, globalBorderColor: dark ? '#38bdf8' : '#2563eb', globalBorderWidth: 1.5,
    frameStyle: 'none', particleType: 'none', particleDensity: 18, particleNetwork: false, backgroundPattern: 'none', backgroundGradient: 'none', gradientIntensity: 70, title: '', titleAlign: 'left',
    message: '', messageColor: dark ? '#bae6fd' : '#1d4ed8', messageAlign: 'center', fontFamily: 'helvetica', messagePosition: 'top',
  };
}

export const DEFAULT_PDF_DESIGN = createDefaultPdfDesign(false);

export const PDF_GRADIENTS: Array<{ id: BackgroundGradient; name: string; colors: [string, string, string]; preview: string; depth?: boolean }> = [
  { id: 'none', name: 'Uni', colors: ['#09090b', '#09090b', '#09090b'], preview: '#09090b' },
  { id: 'aurora', name: 'Aurore', colors: ['#020617', '#0c4a6e', '#312e81'], preview: 'linear-gradient(135deg,#020617,#0c4a6e 48%,#312e81)' },
  { id: 'midnight', name: 'Minuit', colors: ['#030712', '#172554', '#020617'], preview: 'linear-gradient(155deg,#030712,#172554 52%,#020617)' },
  { id: 'ember', name: 'Braise', colors: ['#180a0a', '#7c2d12', '#431407'], preview: 'linear-gradient(135deg,#180a0a,#7c2d12,#431407)' },
  { id: 'ocean', name: 'Océan', colors: ['#082f49', '#0e7490', '#172554'], preview: 'linear-gradient(135deg,#082f49,#0e7490,#172554)' },
  { id: 'forest', name: 'Forêt', colors: ['#052e16', '#14532d', '#0f172a'], preview: 'linear-gradient(135deg,#052e16,#14532d,#0f172a)' },
  { id: 'violet', name: 'Violet', colors: ['#1e1b4b', '#581c87', '#0f172a'], preview: 'linear-gradient(135deg,#1e1b4b,#581c87,#0f172a)' },
  { id: 'orbital', name: 'Orbital 3D', colors: ['#020617', '#075985', '#020617'], preview: 'radial-gradient(circle at 68% 38%,#38bdf8 0 5%,#075985 7%,transparent 25%),radial-gradient(circle at 68% 38%,transparent 0 28%,#1d4ed8 29% 31%,transparent 33%),#020617', depth: true },
  { id: 'prism', name: 'Prisme 3D', colors: ['#09090b', '#4c1d95', '#082f49'], preview: 'conic-gradient(from 220deg at 64% 42%,#09090b,#7c3aed,#06b6d4,#09090b 70%)', depth: true },
  { id: 'topography', name: 'Relief 3D', colors: ['#06131d', '#164e63', '#020617'], preview: 'repeating-radial-gradient(ellipse at 72% 55%,transparent 0 7px,#22d3ee55 8px 9px,transparent 10px 17px),linear-gradient(145deg,#06131d,#164e63,#020617)', depth: true },
  { id: 'portal', name: 'Portail 3D', colors: ['#020617', '#312e81', '#0f172a'], preview: 'radial-gradient(ellipse at center,#818cf8 0 4%,#312e81 12%,#0f172a 38%,#020617 70%)', depth: true },
];

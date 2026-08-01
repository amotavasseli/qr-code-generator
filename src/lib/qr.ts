import QRCode from 'qrcode';
import type { QrItem, RenderOptions } from './types';

/**
 * A logo covers modules, so the code only stays readable because of error
 * correction. Level H tolerates ~30% loss, which comfortably absorbs a centred
 * mark at the scale we allow — so a logo silently forces H regardless of what
 * the user picked.
 */
export const effectiveErrorLevel = (options: RenderOptions) =>
  options.logo ? 'H' : options.errorLevel;

const baseOptions = (options: RenderOptions) => ({
  width: options.size,
  margin: 2,
  errorCorrectionLevel: effectiveErrorLevel(options),
  color: {
    dark: options.foreground,
    light: options.background
  }
});

/** Loads a data URL into an Image so it can be drawn onto a canvas. */
export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load that image.'));
    img.src = src;
  });

const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser blocked canvas rendering.');
  return ctx;
};

/**
 * Draws the logo over the centre of an already-rendered code, on a padded
 * plate in the background colour so it reads as deliberate quiet space rather
 * than damage.
 */
const drawLogo = async (
  ctx: CanvasRenderingContext2D,
  options: RenderOptions,
  x: number,
  y: number,
  size: number
) => {
  if (!options.logo) return;

  const img = await loadImage(options.logo.dataUrl);
  const logoWidth = size * options.logo.scale;
  // Preserve the logo's aspect ratio rather than squashing it into a square.
  const ratio = img.naturalHeight / img.naturalWidth || 1;
  const logoHeight = logoWidth * ratio;
  const pad = size * 0.02;

  const cx = x + size / 2;
  const cy = y + size / 2;

  ctx.fillStyle = options.background;
  ctx.fillRect(
    cx - logoWidth / 2 - pad,
    cy - logoHeight / 2 - pad,
    logoWidth + pad * 2,
    logoHeight + pad * 2
  );

  ctx.drawImage(img, cx - logoWidth / 2, cy - logoHeight / 2, logoWidth, logoHeight);
};

/** Renders one code as a PNG data URL, with the logo composited if there is one. */
export const generateQRCode = async (
  text: string,
  options: RenderOptions
): Promise<string> => {
  const dataUrl = await QRCode.toDataURL(text, baseOptions(options));

  if (!options.logo) return dataUrl;

  const canvas = document.createElement('canvas');
  canvas.width = options.size;
  canvas.height = options.size;
  const ctx = context2d(canvas);

  ctx.drawImage(await loadImage(dataUrl), 0, 0, options.size, options.size);
  await drawLogo(ctx, options, 0, 0, options.size);

  return canvas.toDataURL('image/png');
};

/**
 * SVG is vector, so it bypasses the canvas path entirely. A logo is injected as
 * an <image> in viewBox units, which keeps the whole file resolution-independent.
 */
export const generateQRSvg = async (
  text: string,
  options: RenderOptions
): Promise<string> => {
  const svg = await QRCode.toString(text, { ...baseOptions(options), type: 'svg' });

  if (!options.logo) return svg;

  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!viewBox) return svg;

  const extent = parseFloat(viewBox[1]);
  const width = extent * options.logo.scale;
  const pad = extent * 0.02;
  const img = await loadImage(options.logo.dataUrl);
  const height = width * (img.naturalHeight / img.naturalWidth || 1);
  const cx = extent / 2;
  const cy = extent / 2;

  const overlay =
    `<rect x="${cx - width / 2 - pad}" y="${cy - height / 2 - pad}" ` +
    `width="${width + pad * 2}" height="${height + pad * 2}" fill="${options.background}"/>` +
    `<image x="${cx - width / 2}" y="${cy - height / 2}" ` +
    `width="${width}" height="${height}" href="${options.logo.dataUrl}" ` +
    `preserveAspectRatio="xMidYMid meet"/>`;

  return svg.replace('</svg>', `${overlay}</svg>`);
};

/** Shortens a label with an ellipsis until it fits within maxWidth. */
export const fitLabel = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string => {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  return `${truncated}…`;
};

/**
 * Composes several codes into one labelled grid image. Combined sheets are
 * raster-only because they are drawn on a canvas.
 */
export const createMultiQRImage = async (
  items: QrItem[],
  withLabels: boolean,
  options: RenderOptions
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = context2d(canvas);

  const cellSize = options.size;
  // Scale the label strip with the cell so text stays proportional at any size.
  const scale = cellSize / 300;
  const labelHeight = withLabels ? Math.round(44 * scale) : 0;
  const cellHeight = cellSize + labelHeight;
  const cols = Math.ceil(Math.sqrt(items.length));
  const rows = Math.ceil(items.length / cols);

  canvas.width = cols * cellSize;
  canvas.height = rows * cellHeight;

  // The sheet's own ground matches the codes so the label strips blend in.
  ctx.fillStyle = options.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < items.length; i++) {
    const x = (i % cols) * cellSize;
    const y = Math.floor(i / cols) * cellHeight;

    // Render without the logo, then composite it per cell, so the logo is not
    // scaled twice.
    const codeUrl = await QRCode.toDataURL(items[i].url, baseOptions(options));
    ctx.drawImage(await loadImage(codeUrl), x, y, cellSize, cellSize);
    await drawLogo(ctx, options, x, y, cellSize);

    // Label each code so a batch sheet stays identifiable after printing.
    const label = withLabels ? items[i].name || items[i].url : '';
    if (label) {
      ctx.fillStyle = options.foreground;
      ctx.font = `${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        fitLabel(ctx, label, cellSize - 20 * scale),
        x + cellSize / 2,
        y + cellSize + labelHeight / 2 - 4 * scale
      );
    }
  }

  return canvas.toDataURL('image/png');
};

import QRCode from 'qrcode';
import type { QrItem, RenderOptions } from './types';

/** Base options shared by every render path. */
const baseOptions = ({ size, errorLevel }: RenderOptions) => ({
  width: size,
  margin: 2,
  errorCorrectionLevel: errorLevel,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

export const generateQRCode = (text: string, options: RenderOptions): Promise<string> =>
  QRCode.toDataURL(text, baseOptions(options));

/** SVG is vector, so it bypasses the canvas path entirely. */
export const generateQRSvg = (text: string, options: RenderOptions): Promise<string> =>
  QRCode.toString(text, { ...baseOptions(options), type: 'svg' });

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

/** Loads a data URL into an Image so it can be drawn onto a canvas. */
const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not render a QR code to the sheet.'));
    img.src = src;
  });

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
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Your browser blocked canvas rendering, so sheets cannot be drawn.');
  }

  const cellSize = options.size;
  // Scale the label strip with the cell so text stays proportional at any size.
  const scale = cellSize / 300;
  const labelHeight = withLabels ? Math.round(44 * scale) : 0;
  const cellHeight = cellSize + labelHeight;
  const cols = Math.ceil(Math.sqrt(items.length));
  const rows = Math.ceil(items.length / cols);

  canvas.width = cols * cellSize;
  canvas.height = rows * cellHeight;

  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < items.length; i++) {
    const x = (i % cols) * cellSize;
    const y = Math.floor(i / cols) * cellHeight;

    const img = await loadImage(await generateQRCode(items[i].url, options));
    ctx.drawImage(img, x, y, cellSize, cellSize);

    // Label each code so a batch sheet stays identifiable after printing.
    const label = withLabels ? items[i].name || items[i].url : '';
    if (label) {
      ctx.fillStyle = '#333333';
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

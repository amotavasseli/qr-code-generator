/**
 * Contrast helpers. A QR scanner needs a clear light/dark distinction, and the
 * usual advice is a ratio of at least 3:1 between the modules and the
 * background — well below the 4.5:1 used for text, but far above what a pair of
 * similar brand colours will produce.
 */

const MIN_SCAN_CONTRAST = 3;

export const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ];
};

/** WCAG relative luminance. */
const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (a: string, b: string): number => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Scanners look for dark modules on a light field. Inverting that — light
 * modules on a dark field — fails on a lot of older readers even when the
 * contrast is fine, so it is worth warning about separately.
 */
export const inspectColors = (foreground: string, background: string) => {
  const ratio = contrastRatio(foreground, background);
  const inverted = luminance(foreground) > luminance(background);

  if (ratio < MIN_SCAN_CONTRAST) {
    return {
      ok: false,
      message: `These colours are too close together (${ratio.toFixed(1)}:1). Many phones will not read this code — aim for at least ${MIN_SCAN_CONTRAST}:1.`
    };
  }

  if (inverted) {
    return {
      ok: true,
      message:
        'This code is lighter than its background. It will scan on most modern phones, but older readers expect dark modules on a light field.'
    };
  }

  return { ok: true, message: '' };
};

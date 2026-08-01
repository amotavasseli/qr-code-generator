import type { QrItem } from './types';

/** Letters and digits survive; everything else collapses to a single underscore. */
export const sanitizeFilename = (name: string): string =>
  name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

/**
 * Resolves the output name for an item, falling back to sequential numbering
 * and suffixing duplicates so JSZip does not silently overwrite entries.
 */
export const resolveFilename = (
  item: QrItem,
  index: number,
  usedNames: Set<string>,
  prefix: string,
  ext: string
): string => {
  const sanitized = item.name ? sanitizeFilename(`${prefix}${item.name}`) : '';
  const base = sanitized || `qr_code_${index + 1}`;

  let candidate = base;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix++;
  }
  usedNames.add(candidate);

  return `${candidate}.${ext}`;
};

import JSZip from 'jszip';
import { createMultiQRImage, generateQRCode, generateQRSvg } from './qr';
import { resolveFilename } from './filenames';
import type { ExportOptions, QrItem } from './types';

export type ZipResult = {
  blob: Blob;
  fileCount: number;
};

/**
 * All three input modes normalise to QrItem[] before arriving here, so this is
 * the single place that decides what actually lands in the archive.
 */
export const buildZip = async (
  items: QrItem[],
  options: ExportOptions,
  onStatus: (message: string) => void
): Promise<ZipResult> => {
  const zip = new JSZip();
  const { size, errorLevel, qrPerImage, includeLabels, outputFormat, filenamePrefix } = options;
  const renderOptions = { size, errorLevel };
  let fileCount: number;

  if (qrPerImage > 1) {
    // Several codes per image: chunk the list and compose a labelled grid each.
    const chunks: QrItem[][] = [];
    for (let i = 0; i < items.length; i += qrPerImage) {
      chunks.push(items.slice(i, i + qrPerImage));
    }

    for (let i = 0; i < chunks.length; i++) {
      const imageData = await createMultiQRImage(chunks[i], includeLabels, renderOptions);
      zip.file(`qr_codes_batch_${i + 1}.png`, imageData.split(',')[1], { base64: true });
    }

    fileCount = chunks.length;
  } else {
    const usedNames = new Set<string>();
    const asSvg = outputFormat === 'svg';

    for (let i = 0; i < items.length; i++) {
      const name = resolveFilename(items[i], i, usedNames, filenamePrefix, asSvg ? 'svg' : 'png');

      if (asSvg) {
        zip.file(name, await generateQRSvg(items[i].url, renderOptions));
      } else {
        const dataUrl = await generateQRCode(items[i].url, renderOptions);
        zip.file(name, dataUrl.split(',')[1], { base64: true });
      }
    }

    fileCount = items.length;
  }

  onStatus('Creating ZIP file...');

  return { blob: await zip.generateAsync({ type: 'blob' }), fileCount };
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

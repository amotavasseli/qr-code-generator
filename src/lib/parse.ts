import Papa from 'papaparse';
import type { CsvRow, QrItem } from './types';

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

/** A column literally named "url" or "link" is the obvious default. */
export const detectUrlColumn = (headers: string[]): string =>
  headers.find((h) => /^(url|link)$/i.test(h.trim())) || headers[0];

export const parseCsvFile = (file: File): Promise<ParsedCsv> =>
  new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data.filter((row) =>
          Object.values(row).some((val) => val && String(val).trim())
        );

        if (headers.length === 0 || rows.length === 0) {
          reject(new Error('No data found in CSV file.'));
          return;
        }

        resolve({ headers, rows });
      },
      error: (error: Error) => reject(new Error(`Error parsing CSV: ${error.message}`))
    });
  });

/**
 * One entry per line. A tab or comma splits the line into url + filename, so
 * two columns pasted straight out of a spreadsheet work as-is.
 */
export const parsePastedList = (text: string): QrItem[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^([^\t,]+)[\t,](.*)$/);
      return match
        ? { url: match[1].trim(), name: match[2].trim() }
        : { url: line, name: '' };
    })
    .filter((item) => item.url);

/** Maps CSV rows onto the shared { url, name } shape the export pipeline takes. */
export const csvRowsToItems = (
  rows: CsvRow[],
  urlColumn: string,
  filenameColumn: string
): QrItem[] =>
  rows
    .map((row) => ({
      url: (row[urlColumn] || '').trim(),
      name: filenameColumn ? (row[filenameColumn] || '').trim() : ''
    }))
    .filter((item) => item.url);

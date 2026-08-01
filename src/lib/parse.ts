import Papa from 'papaparse';
import type { CsvRow, QrItem } from './types';

export type ParsedSheet = {
  headers: string[];
  rows: CsvRow[];
};

export const SPREADSHEET_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

/** A column literally named "url" or "link" is the obvious default. */
export const detectUrlColumn = (headers: string[]): string =>
  headers.find((h) => /^(url|link)$/i.test(h.trim())) || headers[0];

const hasContent = (row: CsvRow) =>
  Object.values(row).some((val) => val && String(val).trim());

const parseCsv = (file: File): Promise<ParsedSheet> =>
  new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data.filter(hasContent);

        if (headers.length === 0 || rows.length === 0) {
          reject(new Error('No data found in that file.'));
          return;
        }

        resolve({ headers, rows });
      },
      error: (error: Error) => reject(new Error(`Could not read that file: ${error.message}`))
    });
  });

/**
 * Excel files are read entirely in the browser, same as CSVs — nothing is
 * uploaded. Values are coerced to strings so a numeric SKU column does not
 * arrive as 1.0e4.
 *
 * SheetJS is imported dynamically because it roughly doubles the bundle, and
 * most people arrive with a CSV. Nobody pays for it until they pick a workbook.
 */
const parseExcel = async (file: File): Promise<ParsedSheet> => {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

  if (!firstSheet) throw new Error('That workbook has no sheets in it.');

  const rows = XLSX.utils
    .sheet_to_json<CsvRow>(firstSheet, { defval: '', raw: false })
    .filter(hasContent);

  const headers = Object.keys(rows[0] ?? {});

  if (headers.length === 0 || rows.length === 0) {
    throw new Error('No data found on the first sheet. Is there a header row?');
  }

  return { headers, rows };
};

export const parseSpreadsheet = (file: File): Promise<ParsedSheet> => {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv')) return parseCsv(file);
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseExcel(file);

  return Promise.reject(
    new Error('Please choose a .csv, .xlsx or .xls file.')
  );
};

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

/** Maps sheet rows onto the shared { url, name } shape the export pipeline takes. */
export const rowsToItems = (
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

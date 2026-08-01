/** A single QR code to render: what it encodes, and what to call the file. */
export type QrItem = {
  url: string;
  name: string;
};

/** One row of the "Enter manually" form. */
export type ManualEntry = {
  id: number;
  url: string;
  filename: string;
  copies: number;
};

/** Papa Parse gives us string-keyed rows once `header: true` is set. */
export type CsvRow = Record<string, string>;

export type InputMode = 'csv' | 'manual' | 'paste';
export type OutputFormat = 'png' | 'svg';

/** QR error correction: Low, Medium, Quartile, High. */
export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

/** Everything that affects how a single code is drawn. */
export type RenderOptions = {
  size: number;
  errorLevel: ErrorLevel;
};

/** Everything that affects what comes out of a batch. */
export type ExportOptions = RenderOptions & {
  qrPerImage: number;
  includeLabels: boolean;
  outputFormat: OutputFormat;
  filenamePrefix: string;
};

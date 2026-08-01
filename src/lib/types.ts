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

export type InputMode = 'csv' | 'manual' | 'paste' | 'sequence' | 'types';
export type OutputFormat = 'png' | 'svg';

/** QR error correction: Low, Medium, Quartile, High. */
export type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

/**
 * What kind of thing the code encodes. Everything is still a static QR code —
 * these only change how the payload string is assembled.
 */
export type DataType = 'url' | 'text' | 'wifi' | 'vcard' | 'tel' | 'sms' | 'email';

/** A logo drawn over the middle of the code. */
export type Logo = {
  dataUrl: string;
  /** Width of the logo as a fraction of the code's width. */
  scale: number;
};

/** Everything that affects how a single code is drawn. */
export type RenderOptions = {
  size: number;
  errorLevel: ErrorLevel;
  foreground: string;
  background: string;
  logo: Logo | null;
};

/** Everything that affects what comes out of a batch. */
export type ExportOptions = RenderOptions & {
  qrPerImage: number;
  includeLabels: boolean;
  outputFormat: OutputFormat;
  filenamePrefix: string;
};

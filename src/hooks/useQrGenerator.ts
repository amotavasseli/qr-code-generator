import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildZip, downloadBlob } from '@/lib/export';
import {
  detectUrlColumn,
  parsePastedList,
  parseSpreadsheet,
  rowsToItems,
  SPREADSHEET_EXTENSIONS
} from '@/lib/parse';
import { generateQRCode } from '@/lib/qr';
import { buildSequence, sequenceCount, type SequenceFields } from '@/lib/sequence';
import type {
  CsvRow,
  ErrorLevel,
  ExportOptions,
  InputMode,
  Logo,
  ManualEntry,
  OutputFormat,
  QrItem,
  RenderOptions
} from '@/lib/types';

let nextEntryId = 1;

const blankEntry = (): ManualEntry => ({
  id: nextEntryId++,
  url: '',
  filename: '',
  copies: 1
});

const DEFAULT_SEQUENCE: SequenceFields = {
  prefix: 'ASSET-',
  suffix: '',
  start: 1,
  end: 25,
  step: 1,
  padTo: 4
};

export function useQrGenerator() {
  const [inputMode, setInputMode] = useState<InputMode>('csv');

  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [sheetRows, setSheetRows] = useState<CsvRow[]>([]);
  const [urlColumn, setUrlColumn] = useState('');
  const [filenameColumn, setFilenameColumn] = useState('');
  const [filenamePrefix, setFilenamePrefix] = useState('qr_');

  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([blankEntry()]);
  const [pastedList, setPastedList] = useState('');
  const [sequence, setSequence] = useState<SequenceFields>(DEFAULT_SEQUENCE);
  // Built by the Wi-Fi / vCard / phone forms, which own their own field state.
  const [typedPayload, setTypedPayload] = useState('');
  const [typedName, setTypedName] = useState('qr_code');

  const [qrPerImage, setQrPerImage] = useState(1);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [qrSize, setQrSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');

  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [logo, setLogo] = useState<Logo | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const renderOptions: RenderOptions = useMemo(
    () => ({ size: qrSize, errorLevel, foreground, background, logo }),
    [qrSize, errorLevel, foreground, background, logo]
  );

  const resetSheetState = () => {
    setSheetFile(null);
    setSheetHeaders([]);
    setSheetRows([]);
    setUrlColumn('');
    setFilenameColumn('');
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setStatus('Please choose a .csv, .xlsx or .xls file.');
      resetSheetState();
      return;
    }

    setStatus('Reading file…');

    try {
      const { headers, rows } = await parseSpreadsheet(file);

      setSheetFile(file);
      setSheetHeaders(headers);
      setSheetRows(rows);
      setUrlColumn(detectUrlColumn(headers));
      setFilenameColumn('');
      setStatus(
        `Loaded ${rows.length} row${rows.length === 1 ? '' : 's'}. ` +
          'Choose your columns, then click "Generate QR Codes".'
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read that file.');
      resetSheetState();
    }
  };

  const updateManualEntry = <K extends keyof ManualEntry>(
    id: number,
    field: K,
    value: ManualEntry[K]
  ) => {
    setManualEntries((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const addManualEntry = () => setManualEntries((entries) => [...entries, blankEntry()]);

  const removeManualEntry = (id: number) =>
    setManualEntries((entries) => entries.filter((entry) => entry.id !== id));

  const updateSequence = <K extends keyof SequenceFields>(field: K, value: SequenceFields[K]) =>
    setSequence((s) => ({ ...s, [field]: value }));

  /** Collects whatever the active tab holds into the shared item shape. */
  const collectItems = useCallback((): QrItem[] => {
    if (inputMode === 'csv') return rowsToItems(sheetRows, urlColumn, filenameColumn);
    if (inputMode === 'paste') return parsePastedList(pastedList);
    if (inputMode === 'sequence') return buildSequence(sequence);
    if (inputMode === 'types')
      return typedPayload ? [{ url: typedPayload, name: typedName }] : [];

    // A row with copies > 1 repeats the same URL that many times, so a single
    // value can fill a whole sheet.
    return manualEntries
      .filter((entry) => entry.url.trim())
      .flatMap((entry) =>
        Array.from({ length: entry.copies }, () => ({
          url: entry.url.trim(),
          name: entry.filename.trim()
        }))
      );
  }, [
    inputMode,
    sheetRows,
    urlColumn,
    filenameColumn,
    pastedList,
    sequence,
    typedPayload,
    typedName,
    manualEntries
  ]);

  const items = useMemo(() => collectItems(), [collectItems]);

  const generateAndDownload = async () => {
    if (inputMode === 'csv' && !sheetFile) {
      setStatus('Please choose a file first.');
      return;
    }

    if (items.length === 0) {
      setStatus('There is nothing to generate yet.');
      return;
    }

    setIsProcessing(true);
    setStatus(`Found ${items.length} entries. Generating QR codes…`);

    try {
      const options: ExportOptions = {
        ...renderOptions,
        qrPerImage,
        includeLabels,
        outputFormat,
        // Only the spreadsheet path applies the prefix; the other tabs carry
        // their names inline.
        filenamePrefix: inputMode === 'csv' ? filenamePrefix : ''
      };

      const { blob, fileCount } = await buildZip(items, options, setStatus);

      downloadBlob(blob, 'qr_codes.zip');
      setStatus(
        `Success! Generated and downloaded ${fileCount} image${fileCount === 1 ? '' : 's'}.`
      );
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Something went wrong.'}`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Live preview of the first item, redrawn whenever the styling changes.
  const [preview, setPreview] = useState('');
  const previewValue = items[0]?.url ?? '';

  useEffect(() => {
    if (!previewValue) {
      setPreview('');
      return;
    }

    let cancelled = false;
    // Preview at a fixed size so changing the export size does not resize the
    // on-screen image.
    generateQRCode(previewValue, { ...renderOptions, size: 320 })
      .then((url) => {
        if (!cancelled) setPreview(url);
      })
      .catch(() => {
        if (!cancelled) setPreview('');
      });

    return () => {
      cancelled = true;
    };
  }, [previewValue, renderOptions]);

  const pastedCount = useMemo(() => parsePastedList(pastedList).length, [pastedList]);
  // Combined sheets are composed on a canvas, so they can only be raster.
  const svgAvailable = qrPerImage === 1;

  return {
    inputMode,
    setInputMode,

    sheetFile,
    sheetHeaders,
    urlColumn,
    setUrlColumn,
    filenameColumn,
    setFilenameColumn,
    filenamePrefix,
    setFilenamePrefix,
    handleFileChange,

    manualEntries,
    updateManualEntry,
    addManualEntry,
    removeManualEntry,

    pastedList,
    setPastedList,
    pastedCount,

    sequence,
    updateSequence,
    sequenceCount: sequenceCount(sequence),

    typedPayload,
    setTypedPayload,
    setTypedName,

    qrPerImage,
    setQrPerImage,
    includeLabels,
    setIncludeLabels,
    outputFormat,
    setOutputFormat,
    qrSize,
    setQrSize,
    errorLevel,
    setErrorLevel,

    foreground,
    setForeground,
    background,
    setBackground,
    logo,
    setLogo,

    preview,
    itemCount: items.length,
    isProcessing,
    status,
    setStatus,
    svgAvailable,
    canGenerate: items.length > 0,
    handleGenerate: generateAndDownload
  };
}

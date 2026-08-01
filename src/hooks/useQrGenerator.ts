import { useMemo, useState } from 'react';
import { buildZip, downloadBlob } from '@/lib/export';
import { csvRowsToItems, detectUrlColumn, parseCsvFile, parsePastedList } from '@/lib/parse';
import type {
  CsvRow,
  ErrorLevel,
  ExportOptions,
  InputMode,
  ManualEntry,
  OutputFormat,
  QrItem
} from '@/lib/types';

let nextEntryId = 1;

const blankEntry = (): ManualEntry => ({
  id: nextEntryId++,
  url: '',
  filename: '',
  copies: 1
});

export function useQrGenerator() {
  const [inputMode, setInputMode] = useState<InputMode>('csv');

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [urlColumn, setUrlColumn] = useState('');
  const [filenameColumn, setFilenameColumn] = useState('');
  const [filenamePrefix, setFilenamePrefix] = useState('qr_');

  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([blankEntry()]);
  const [pastedList, setPastedList] = useState('');

  const [qrPerImage, setQrPerImage] = useState(1);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');
  const [qrSize, setQrSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');

  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const resetCsvState = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setUrlColumn('');
    setFilenameColumn('');
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus('Please upload a file with a .csv extension.');
      resetCsvState();
      return;
    }

    setStatus('Reading CSV file...');

    try {
      const { headers, rows } = await parseCsvFile(file);

      setCsvFile(file);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setUrlColumn(detectUrlColumn(headers));
      setFilenameColumn('');
      setStatus(
        `CSV file loaded with ${rows.length} row${rows.length === 1 ? '' : 's'}. ` +
          'Choose your columns, then click "Generate QR Codes".'
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read that CSV file.');
      resetCsvState();
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

  const exportOptions = (): ExportOptions => ({
    size: qrSize,
    errorLevel,
    qrPerImage,
    includeLabels,
    outputFormat,
    filenamePrefix
  });

  const generateAndDownload = async (items: QrItem[], prefix = '') => {
    setIsProcessing(true);
    setStatus(`Found ${items.length} URLs. Generating QR codes...`);

    try {
      const { blob, fileCount } = await buildZip(
        items,
        { ...exportOptions(), filenamePrefix: prefix },
        setStatus
      );

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

  const generateFromCsv = () => {
    if (!csvFile) {
      setStatus('Please upload a CSV file first.');
      return;
    }

    if (!urlColumn) {
      setStatus('Please choose which column contains the URLs.');
      return;
    }

    const items = csvRowsToItems(csvRows, urlColumn, filenameColumn);

    if (items.length === 0) {
      setStatus(`No URLs found in the "${urlColumn}" column.`);
      return;
    }

    void generateAndDownload(items, filenamePrefix);
  };

  const generateFromForm = () => {
    // A row with copies > 1 repeats the same URL that many times, so a single
    // value can fill a whole sheet.
    const items = manualEntries
      .filter((entry) => entry.url.trim())
      .flatMap((entry) =>
        Array.from({ length: entry.copies }, () => ({
          url: entry.url.trim(),
          name: entry.filename.trim()
        }))
      );

    if (items.length === 0) {
      setStatus('Please enter at least one URL.');
      return;
    }

    void generateAndDownload(items);
  };

  const generateFromPaste = () => {
    const items = parsePastedList(pastedList);

    if (items.length === 0) {
      setStatus('Please paste at least one URL.');
      return;
    }

    void generateAndDownload(items);
  };

  const handleGenerate = () => {
    if (inputMode === 'csv') generateFromCsv();
    else if (inputMode === 'paste') generateFromPaste();
    else generateFromForm();
  };

  const pastedCount = useMemo(() => parsePastedList(pastedList).length, [pastedList]);
  const hasManualUrl = manualEntries.some((entry) => entry.url.trim());
  // Combined sheets are composed on a canvas, so they can only be raster.
  const svgAvailable = qrPerImage === 1;

  const canGenerate =
    inputMode === 'csv' ? Boolean(csvFile) : inputMode === 'paste' ? pastedCount > 0 : hasManualUrl;

  return {
    inputMode,
    setInputMode,
    csvFile,
    csvHeaders,
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
    isProcessing,
    status,
    svgAvailable,
    canGenerate,
    handleGenerate
  };
}

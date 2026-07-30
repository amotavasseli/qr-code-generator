import React, { useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import Papa from 'papaparse';
import './App.css';

let nextEntryId = 1;

const blankEntry = () => ({ id: nextEntryId++, url: '', filename: '', copies: 1 });

function App() {
  const [inputMode, setInputMode] = useState('csv');

  const [csvFile, setCsvFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);
  const [urlColumn, setUrlColumn] = useState('');
  const [filenameColumn, setFilenameColumn] = useState('');
  const [filenamePrefix, setFilenamePrefix] = useState('qr_');

  const [manualEntries, setManualEntries] = useState([blankEntry()]);

  const [pastedList, setPastedList] = useState('');

  const [qrPerImage, setQrPerImage] = useState(1);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [outputFormat, setOutputFormat] = useState('png');
  const [qrSize, setQrSize] = useState(300);
  const [errorLevel, setErrorLevel] = useState('M');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const resetCsvState = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setUrlColumn('');
    setFilenameColumn('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus('Please upload a file with a .csv extension.');
      resetCsvState();
      return;
    }

    setStatus('Reading CSV file...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data.filter((row) =>
          Object.values(row).some((val) => val && String(val).trim())
        );

        if (headers.length === 0 || rows.length === 0) {
          setStatus('No data found in CSV file.');
          resetCsvState();
          return;
        }

        const detectedUrlColumn =
          headers.find((h) => /^(url|link)$/i.test(h.trim())) || headers[0];

        setCsvFile(file);
        setCsvHeaders(headers);
        setCsvRows(rows);
        setUrlColumn(detectedUrlColumn);
        setFilenameColumn('');
        setStatus(
          `CSV file loaded with ${rows.length} row${rows.length === 1 ? '' : 's'}. ` +
            'Choose your columns, then click "Generate QR Codes".'
        );
      },
      error: (error) => {
        setStatus(`Error parsing CSV: ${error.message}`);
        resetCsvState();
      }
    });
  };

  const updateManualEntry = (id, field, value) => {
    setManualEntries((entries) =>
      entries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const addManualEntry = () => {
    setManualEntries((entries) => [...entries, blankEntry()]);
  };

  const removeManualEntry = (id) => {
    setManualEntries((entries) => entries.filter((entry) => entry.id !== id));
  };

  const sanitizeFilename = (name) => {
    return name
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Resolves the .png name for an item, falling back to sequential numbering and
  // suffixing duplicates so JSZip does not silently overwrite entries.
  const resolveFilename = (item, index, usedNames, prefix, ext) => {
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

  const qrOptions = (overrides = {}) => ({
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: errorLevel,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    ...overrides
  });

  const generateQRCode = async (text, overrides = {}) => {
    return await QRCode.toDataURL(text, qrOptions(overrides));
  };

  // SVG is vector, so it bypasses the canvas path entirely.
  const generateQRSvg = async (text) => {
    return await QRCode.toString(text, { ...qrOptions(), type: 'svg' });
  };

  // Shortens a label with an ellipsis until it fits within maxWidth.
  const fitLabel = (ctx, text, maxWidth) => {
    if (ctx.measureText(text).width <= maxWidth) return text;

    let truncated = text;
    while (
      truncated.length > 1 &&
      ctx.measureText(`${truncated}…`).width > maxWidth
    ) {
      truncated = truncated.slice(0, -1);
    }

    return `${truncated}…`;
  };

  const createMultiQRImage = async (items, withLabels) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = qrSize;
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

      const qrDataUrl = await generateQRCode(items[i].url);
      const img = new Image();

      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, x, y, cellSize, cellSize);
          resolve();
        };
        img.src = qrDataUrl;
      });

      // Label each code so a batch sheet stays identifiable after printing.
      const label = withLabels && (items[i].name || items[i].url);
      if (label) {
        ctx.fillStyle = '#333333';
        ctx.font =
          `${Math.round(18 * scale)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
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

  // Both input modes normalize to [{ url, name }] and share this pipeline.
  const generateAndDownload = async (items, prefix = '') => {
    setIsProcessing(true);
    setStatus(`Found ${items.length} URLs. Generating QR codes...`);

    try {
      const zip = new JSZip();
      let fileCount;

      if (qrPerImage > 1) {
        // Generate multiple QR codes on a single image
        const chunks = [];
        for (let i = 0; i < items.length; i += qrPerImage) {
          chunks.push(items.slice(i, i + qrPerImage));
        }

        for (let i = 0; i < chunks.length; i++) {
          const imageData = await createMultiQRImage(chunks[i], includeLabels);
          const base64Data = imageData.split(',')[1];
          zip.file(`qr_codes_batch_${i + 1}.png`, base64Data, { base64: true });
        }

        fileCount = chunks.length;
      } else {
        // Generate individual QR codes
        const usedNames = new Set();
        const asSvg = outputFormat === 'svg';

        for (let i = 0; i < items.length; i++) {
          const name = resolveFilename(
            items[i],
            i,
            usedNames,
            prefix,
            asSvg ? 'svg' : 'png'
          );

          if (asSvg) {
            zip.file(name, await generateQRSvg(items[i].url));
          } else {
            const qrDataUrl = await generateQRCode(items[i].url);
            zip.file(name, qrDataUrl.split(',')[1], { base64: true });
          }
        }

        fileCount = items.length;
      }

      setStatus('Creating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr_codes.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus(
        `Success! Generated and downloaded ${fileCount} image${
          fileCount === 1 ? '' : 's'
        }.`
      );
    } catch (error) {
      setStatus(`Error: ${error.message}`);
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

    const items = csvRows
      .map((row) => ({
        url: (row[urlColumn] || '').trim(),
        name: filenameColumn ? (row[filenameColumn] || '').trim() : ''
      }))
      .filter((item) => item.url);

    if (items.length === 0) {
      setStatus(`No URLs found in the "${urlColumn}" column.`);
      return;
    }

    generateAndDownload(items, filenamePrefix);
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

    generateAndDownload(items);
  };

  // One entry per line. A tab or comma splits the line into url + filename, so
  // two columns pasted straight out of a spreadsheet work as-is.
  const parsePastedList = (text) =>
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

  const generateFromPaste = () => {
    const items = parsePastedList(pastedList);

    if (items.length === 0) {
      setStatus('Please paste at least one URL.');
      return;
    }

    generateAndDownload(items);
  };

  const handleGenerate = () => {
    if (inputMode === 'csv') {
      generateFromCsv();
    } else if (inputMode === 'paste') {
      generateFromPaste();
    } else {
      generateFromForm();
    }
  };

  const hasManualUrl = manualEntries.some((entry) => entry.url.trim());
  const pastedCount = parsePastedList(pastedList).length;
  // Combined sheets are composed on a canvas, so they can only be raster.
  const svgAvailable = qrPerImage === 1;
  const canGenerate =
    inputMode === 'csv'
      ? Boolean(csvFile)
      : inputMode === 'paste'
        ? pastedCount > 0
        : hasManualUrl;

  return (
    <div className="App">
      {/* The page <h1> and tagline live in public/index.html as static markup
          so crawlers see them without executing JavaScript. */}
      <main className="App-main">
        <div className="mode-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'csv'}
            className={`mode-tab ${inputMode === 'csv' ? 'active' : ''}`}
            onClick={() => setInputMode('csv')}
          >
            Upload CSV
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'manual'}
            className={`mode-tab ${inputMode === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMode('manual')}
          >
            Enter manually
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'paste'}
            className={`mode-tab ${inputMode === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMode('paste')}
          >
            Paste a list
          </button>
        </div>

        {inputMode === 'csv' ? (
          <>
            <div className="upload-section">
              <label htmlFor="csv-upload" className="upload-label">
                Choose CSV File
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="file-input"
              />
              {csvFile && <p className="file-name">Selected: {csvFile.name}</p>}
            </div>

            {csvHeaders.length > 0 && (
              <div className="options-section column-section">
                <div className="column-field">
                  <label htmlFor="url-column">Column containing URLs:</label>
                  <select
                    id="url-column"
                    value={urlColumn}
                    onChange={(e) => setUrlColumn(e.target.value)}
                    className="select-input"
                  >
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="column-field">
                  <label htmlFor="filename-column">
                    Column to name files after:
                  </label>
                  <select
                    id="filename-column"
                    value={filenameColumn}
                    onChange={(e) => setFilenameColumn(e.target.value)}
                    className="select-input"
                  >
                    <option value="">Numbered (qr_code_1, qr_code_2...)</option>
                    {csvHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>

                {filenameColumn && (
                  <div className="column-field">
                    <label htmlFor="filename-prefix">
                      Filename prefix (optional):
                    </label>
                    <input
                      id="filename-prefix"
                      type="text"
                      value={filenamePrefix}
                      onChange={(e) => setFilenamePrefix(e.target.value)}
                      className="text-input"
                    />
                  </div>
                )}

                <small>
                  Files are named from your chosen column. Characters other than
                  letters and numbers become underscores, and duplicates get a
                  numeric suffix.
                </small>
              </div>
            )}
          </>
        ) : inputMode === 'paste' ? (
          <div className="manual-section">
            <label htmlFor="pasted-list" className="paste-label">
              One URL per line. Add a filename after a comma or a tab:
            </label>
            <textarea
              id="pasted-list"
              value={pastedList}
              onChange={(e) => setPastedList(e.target.value)}
              className="paste-input"
              rows="10"
              spellCheck="false"
              placeholder={
                'https://example.com/a, welcome-packet\n' +
                'https://example.com/b, badge-ada\n' +
                'https://example.com/c'
              }
            />
            <small className="paste-count">
              {pastedCount === 0
                ? 'Nothing to generate yet.'
                : `${pastedCount} URL${pastedCount === 1 ? '' : 's'} ready. Tab-separated works too, so you can paste two columns straight out of a spreadsheet.`}
            </small>
          </div>
        ) : (
          <div className="manual-section">
            <div className="form-row form-row-header">
              <span>URL</span>
              <span>Filename (optional)</span>
              <span>Copies</span>
              <span className="sr-only">Remove</span>
            </div>

            {manualEntries.map((entry, index) => (
              <div key={entry.id} className="form-row">
                <input
                  type="url"
                  value={entry.url}
                  onChange={(e) =>
                    updateManualEntry(entry.id, 'url', e.target.value)
                  }
                  placeholder="https://example.com"
                  aria-label={`URL for row ${index + 1}`}
                  className="text-input"
                />
                <input
                  type="text"
                  value={entry.filename}
                  onChange={(e) =>
                    updateManualEntry(entry.id, 'filename', e.target.value)
                  }
                  placeholder={`qr_code_${index + 1}`}
                  aria-label={`Filename for row ${index + 1}`}
                  className="text-input"
                />
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={entry.copies}
                  onChange={(e) =>
                    updateManualEntry(
                      entry.id,
                      'copies',
                      Math.min(500, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  aria-label={`Copies for row ${index + 1}`}
                  className="copies-input"
                />
                <button
                  type="button"
                  onClick={() => removeManualEntry(entry.id)}
                  disabled={manualEntries.length === 1}
                  aria-label={`Remove row ${index + 1}`}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}

            <button type="button" onClick={addManualEntry} className="add-button">
              + Add another
            </button>
          </div>
        )}

        <div className="options-section">
          <label htmlFor="qr-per-image">QR codes per image:</label>
          <input
            id="qr-per-image"
            type="number"
            min="1"
            max="100"
            value={qrPerImage}
            onChange={(e) => setQrPerImage(parseInt(e.target.value) || 1)}
            className="number-input"
          />
          <small>
            Set to 1 for individual QR codes, or higher to combine multiple on
            one image
          </small>

          {qrPerImage > 1 && (
            <label htmlFor="include-labels" className="checkbox-label">
              <input
                id="include-labels"
                type="checkbox"
                checked={includeLabels}
                onChange={(e) => setIncludeLabels(e.target.checked)}
              />
              Print a label under each QR code
            </label>
          )}
        </div>

        <div className="options-section column-section">
          <div className="column-field">
            <label htmlFor="output-format">File format:</label>
            <select
              id="output-format"
              value={svgAvailable ? outputFormat : 'png'}
              onChange={(e) => setOutputFormat(e.target.value)}
              disabled={!svgAvailable}
              className="select-input"
            >
              <option value="png">PNG (image)</option>
              <option value="svg">SVG (vector, scales to any size)</option>
            </select>
            {!svgAvailable && (
              <small>
                SVG is only available at 1 QR code per image — combined sheets
                are composed as a raster image. Set "QR codes per image" back to
                1 to choose SVG.
              </small>
            )}
          </div>

          <div className="column-field">
            <label htmlFor="qr-size">
              {qrPerImage > 1 ? 'Size of each code:' : 'Image size:'}
            </label>
            <select
              id="qr-size"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="select-input"
            >
              <option value="300">300 × 300 px — labels, badges</option>
              <option value="600">600 × 600 px — flyers, signage</option>
              <option value="1000">1000 × 1000 px — posters, large print</option>
            </select>
          </div>

          <div className="column-field">
            <label htmlFor="error-level">Error correction:</label>
            <select
              id="error-level"
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value)}
              className="select-input"
            >
              <option value="L">Low — smallest pattern, screens only</option>
              <option value="M">Medium — the usual choice</option>
              <option value="Q">Quartile — printed labels</option>
              <option value="H">High — harsh conditions, logos</option>
            </select>
            <small>
              Higher levels stay scannable when a code is scuffed or partly
              covered, at the cost of a denser pattern.{' '}
              <a
                href="guides/qr-code-error-correction-levels.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Which level should I pick?
              </a>
            </small>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isProcessing}
          className="generate-button"
        >
          {isProcessing ? 'Processing...' : 'Generate QR Codes'}
        </button>

        {status && <p className="status-message">{status}</p>}

        {/* Usage instructions live in public/index.html as static markup below
            this component — crawlable, and no duplicate copy to keep in sync. */}
      </main>
    </div>
  );
}

export default App;

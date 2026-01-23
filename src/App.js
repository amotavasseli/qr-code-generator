import React, { useState } from 'react';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [csvFile, setCsvFile] = useState(null);
  const [qrPerImage, setQrPerImage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setStatus('CSV file loaded. Click "Generate QR Codes" to proceed.');
    } else {
      setStatus('Please upload a valid CSV file.');
      setCsvFile(null);
    }
  };

  const extractEmailFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      return params.get('email') || params.get('e') || params.get('user') || null;
    } catch {
      return null;
    }
  };

  const generateQRCode = async (text, options = {}) => {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    });
  };

  const createMultiQRImage = async (urls) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrSize = 300;
    const cols = Math.ceil(Math.sqrt(urls.length));
    const rows = Math.ceil(urls.length / cols);
    
    canvas.width = cols * qrSize;
    canvas.height = rows * qrSize;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < urls.length; i++) {
      const x = (i % cols) * qrSize;
      const y = Math.floor(i / cols) * qrSize;
      
      const qrDataUrl = await generateQRCode(urls[i]);
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, x, y, qrSize, qrSize);
          resolve();
        };
        img.src = qrDataUrl;
      });
    }

    return canvas.toDataURL('image/png');
  };

  const processCSV = async () => {
    if (!csvFile) {
      setStatus('Please upload a CSV file first.');
      return;
    }

    setIsProcessing(true);
    setStatus('Processing CSV file...');

    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        try {
          const data = results.data.filter(row => {
            return Object.values(row).some(val => val && val.trim());
          });

          if (data.length === 0) {
            setStatus('No data found in CSV file.');
            setIsProcessing(false);
            return;
          }

          setStatus(`Found ${data.length} rows. Generating QR codes...`);

          const zip = new JSZip();
          let chunks = [];
          
          if (qrPerImage > 1) {
            // Generate multiple QR codes on a single image
            for (let i = 0; i < data.length; i += qrPerImage) {
              chunks.push(data.slice(i, i + qrPerImage));
            }

            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              const urls = chunk.map(row => {
                return row.url || row.URL || row.link || Object.values(row)[0] || '';
              }).filter(url => url);

              if (urls.length > 0) {
                const imageData = await createMultiQRImage(urls);
                const base64Data = imageData.split(',')[1];
                zip.file(`qr_codes_batch_${i + 1}.png`, base64Data, { base64: true });
              }
            }
          } else {
            // Generate individual QR codes
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              const url = row.url || row.URL || row.link || Object.values(row)[0] || '';
              
              if (!url) continue;

              let email = row.email || row.Email || row.e || extractEmailFromUrl(url);
              
              const qrDataUrl = await generateQRCode(url);
              const base64Data = qrDataUrl.split(',')[1];
              
              let filename;
              if (email) {
                filename = `qr_${email.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
              } else {
                filename = `qr_code_${i + 1}.png`;
              }
              
              zip.file(filename, base64Data, { base64: true });
            }
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

          setStatus(`Success! Generated and downloaded ${qrPerImage > 1 ? chunks.length : data.length} QR code${qrPerImage > 1 || data.length > 1 ? 's' : ''}.`);
        } catch (error) {
          setStatus(`Error: ${error.message}`);
          console.error(error);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setStatus(`Error parsing CSV: ${error.message}`);
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>QR Code Generator</h1>
        <p>Upload a CSV file to generate QR codes</p>
      </header>
      
      <main className="App-main">
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

        <div className="options-section">
          <label htmlFor="qr-per-image">
            QR codes per image:
          </label>
          <input
            id="qr-per-image"
            type="number"
            min="1"
            max="100"
            value={qrPerImage}
            onChange={(e) => setQrPerImage(parseInt(e.target.value) || 1)}
            className="number-input"
          />
          <small>Set to 1 for individual QR codes, or higher to combine multiple on one image</small>
        </div>

        <button
          onClick={processCSV}
          disabled={!csvFile || isProcessing}
          className="generate-button"
        >
          {isProcessing ? 'Processing...' : 'Generate QR Codes'}
        </button>

        {status && <p className="status-message">{status}</p>}

        <div className="instructions">
          <h2>Instructions:</h2>
          <ol>
            <li>Prepare a CSV file with URLs (column names: url, URL, or link)</li>
            <li>Optionally include an email column for custom filenames</li>
            <li>Or include emails in URL parameters (e.g., ?email=user@example.com)</li>
            <li>Choose how many QR codes to include per image (1 for individual files)</li>
            <li>Click "Generate QR Codes" to download a ZIP file</li>
          </ol>
          
          <h3>CSV Format Example:</h3>
          <pre className="csv-example">
{`url,email
https://example.com?id=1,user1@example.com
https://example.com?id=2,user2@example.com`}
          </pre>
        </div>
      </main>

      <footer className="App-footer">
        <p>Built with React and qrcode npm package</p>
      </footer>
    </div>
  );
}

export default App;

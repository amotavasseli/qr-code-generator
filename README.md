# QR Code Generator

A React-based web application that generates QR codes from a CSV file or from URLs you type in, with support for batch processing and custom file naming.

## Features

- 📁 Upload CSV files containing URLs
- ✍️ Or enter URLs in a form, one row at a time, with a copies count per row
- 📋 Or paste a list, one URL per line, comma- or tab-separated
- 🔢 Generate multiple QR codes on a single image (batch mode), with optional labels
- 🏷️ Name output files from any column you choose, with an optional prefix
- 🖼️ PNG (300/600/1000 px) or SVG vector output
- 🛡️ Selectable error correction level (L/M/Q/H)
- 📦 Download all QR codes as a ZIP file
- 🎨 Clean and responsive user interface
- 🚀 Hosted on GitHub Pages

## Live Demo

Visit the live application at: [https://www.batchqrcodes.com](https://www.batchqrcodes.com)

## Installation

```bash
npm install
```

## Usage

### Development

```bash
npm start
```

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Build

```bash
npm run build
```

Builds the app for production to the `build` folder.

### Deploy to GitHub Pages

```bash
npm run deploy
```

Deploys the application to GitHub Pages.

## Input Modes

### Upload CSV

The application expects a CSV file with a header row and a column of URLs. Any column name works — after upload, you pick which column holds the URLs. A column named `url` or `link` is selected automatically if present.

For filenames, pick any other column: employee IDs, product codes, names, or whatever naming convention you already use. Leave it on "Numbered" to get `qr_code_1.png`, `qr_code_2.png`, and so on. You can also set a prefix that goes in front of every filename.

A sample CSV file (`sample.csv`) is included in the repository for reference.

#### Example CSV Format

```csv
url,employee_id
https://example.com?id=1,E10432
https://example.com?id=2,E10433
```

### Enter manually

Switch to the "Enter manually" tab to type URLs directly. Each row takes a URL, an optional filename, and a copies count; leave the filename blank for numbered naming. Use "+ Add another" for as many rows as you need.

Set **Copies** to repeat the same URL. One row with 20 copies and "QR codes per image" set to 20 produces a single sheet filled with that one code — handy for printing a page of identical codes.

### Paste a list

The "Paste a list" tab takes one URL per line. Add a filename after a comma or a tab:

```
https://example.com/a, welcome-packet
https://example.com/b	handbook
https://example.com/c
```

Tab separation means two columns copied straight out of a spreadsheet work without saving a file first.

## Output options

| Option | Values | Notes |
| --- | --- | --- |
| File format | PNG, SVG | SVG is vector and only available at 1 code per image, since combined sheets are composed on a canvas |
| Size | 300, 600, 1000 px | In batch mode this sets each cell; the label strip scales with it |
| Error correction | L, M, Q, H | Higher tolerates more damage but produces a denser pattern |

Delimiter detection is automatic for uploaded CSVs — comma, semicolon and tab all parse correctly.

## How It Works

1. **Provide URLs**: Upload a CSV or enter rows in the manual form
2. **Configure**: Choose your columns (CSV mode) and the number of QR codes per image
3. **Generate**: Click "Generate QR Codes"
4. **Download**: A ZIP file containing all QR codes will be automatically downloaded

### Individual QR Codes (QR codes per image = 1)
- Each URL gets its own PNG file
- Files are named from your chosen column or manual filename entry
- Characters other than letters and numbers become underscores (e.g., `E-10432` → `E_10432.png`)
- Duplicate names get a numeric suffix (`sales.png`, `sales_2.png`)
- Falls back to numbered naming when no name is given (e.g., `qr_code_1.png`)

### Batch Mode (QR codes per image > 1)
- Multiple QR codes are arranged in a grid on a single image
- Each code is labelled underneath with its name (from your chosen column or manual entry), falling back to the URL when no name is given
- Long labels are truncated with an ellipsis so they stay inside their cell
- Labels can be switched off with the "Print a label under each QR code" toggle, which appears whenever more than one code per image is selected
- Images are named sequentially (e.g., `qr_codes_batch_1.png`, `qr_codes_batch_2.png`)
- Useful for printing multiple codes at once

## Site structure

The React app is the generator only. Everything else on the site is plain static
HTML in `public/`, which CRA copies verbatim into `build/`:

```
public/
  index.html      React tool mounts into #root; the H1, FAQ, how-to and
                  footer around it are static markup so crawlers see them
                  without executing JavaScript
  site.css        shared styling for all static pages
  about.html  contact.html  privacy.html  terms.html
  guides/         eight long-form guides + an index
  robots.txt  sitemap.xml  ads.txt  CNAME
```

Internal links are **relative**, not root-absolute (`about.html`, `../privacy.html`). That keeps every page navigable when opened straight off disk as a `file://` URL, under the dev server, and in production. `homepage` in `package.json` is `"."` for the same reason — it makes CRA emit relative asset paths. Canonical tags and `sitemap.xml` stay absolute, pointing at `https://www.batchqrcodes.com/` — the `www` subdomain is canonical, matching `public/CNAME`; see [DEPLOYMENT.md](DEPLOYMENT.md) for why.

This split is deliberate. Googlebot defers JavaScript rendering to a second
crawl wave, and AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JS
at all — anything rendered only by React is effectively invisible to them. Text
that needs to be indexed therefore lives in HTML, not in components.

When adding a guide: create the file in `public/guides/`, add its URL to
`sitemap.xml`, and link it from both `guides/index.html` and the guide list on
the homepage.

## Technologies Used

- **React 19**: UI framework
- **qrcode**: QR code generation
- **JSZip**: ZIP file creation
- **PapaParse**: CSV parsing
- **gh-pages**: GitHub Pages deployment

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

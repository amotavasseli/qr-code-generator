# QR Code Generator

A React-based web application that generates QR codes from CSV files with support for batch processing and custom file naming.

## Features

- 📁 Upload CSV files containing URLs
- 🔢 Generate multiple QR codes on a single image (batch mode)
- 📧 Automatic filename generation based on email addresses
- 📦 Download all QR codes as a ZIP file
- 🎨 Clean and responsive user interface
- 🚀 Hosted on GitHub Pages

## Live Demo

Visit the live application at: [https://amotavasseli.github.io/qr-code-generator](https://amotavasseli.github.io/qr-code-generator)

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

## CSV Format

The application expects a CSV file with URLs. You can use any of these column names for URLs:
- `url`
- `URL`
- `link`

For custom filenames, include an email column:
- `email`
- `Email`
- `e`

Alternatively, emails can be included as URL parameters (e.g., `?email=user@example.com`).

A sample CSV file (`sample.csv`) is included in the repository for reference.

### Example CSV Format

```csv
url,email
https://example.com?id=1,user1@example.com
https://example.com?id=2,user2@example.com
https://example.com?email=user3@example.com,
```

## How It Works

1. **Upload CSV**: Select a CSV file containing URLs and optional email addresses
2. **Configure**: Set the number of QR codes per image (1 for individual files, higher for batch)
3. **Generate**: Click "Generate QR Codes" to process the file
4. **Download**: A ZIP file containing all QR codes will be automatically downloaded

### Individual QR Codes (QR codes per image = 1)
- Each URL gets its own PNG file
- Files are named using the email address if available (e.g., `qr_user@example_com.png`)
- Falls back to numbered naming if no email is found (e.g., `qr_code_1.png`)

### Batch Mode (QR codes per image > 1)
- Multiple QR codes are arranged on a single image
- Images are named sequentially (e.g., `qr_codes_batch_1.png`, `qr_codes_batch_2.png`)
- Useful for printing multiple codes at once

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

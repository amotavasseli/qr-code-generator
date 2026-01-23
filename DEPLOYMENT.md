# Deployment Guide

This guide explains how to deploy the QR Code Generator to GitHub Pages.

## Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the `main` branch.

### Setup Steps:

1. **Enable GitHub Pages**:
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Build and deployment", set Source to "GitHub Actions"

2. **Merge the PR**:
   - Once this PR is merged to `main`, the workflow will automatically run
   - The site will be deployed to: `https://amotavasseli.github.io/qr-code-generator`

3. **Check Deployment Status**:
   - Go to the "Actions" tab in your repository
   - Look for the "Deploy to GitHub Pages" workflow
   - Once complete, your site will be live!

## Manual Deployment

If you prefer to deploy manually:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

This will build the app and push it to the `gh-pages` branch, which GitHub Pages will serve.

## Configuration

The deployment is configured in `package.json`:

- `homepage`: Points to your GitHub Pages URL
- `predeploy`: Builds the app before deploying
- `deploy`: Uses gh-pages package to deploy the build folder

## Troubleshooting

### Site not loading after deployment

- Ensure GitHub Pages is enabled in repository settings
- Check that the Source is set correctly (GitHub Actions or gh-pages branch)
- Wait a few minutes for GitHub Pages to update

### 404 errors

- Verify the `homepage` field in `package.json` matches your repository name
- For custom domains, update the `homepage` field accordingly

### Build failures

- Check the Actions tab for error details
- Ensure all dependencies are properly installed
- Verify Node.js version compatibility (v18 recommended)

## Local Development

To test the app locally before deploying:

```bash
npm start
```

This will start the development server at `http://localhost:3000/qr-code-generator`

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Create React App Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [gh-pages Package](https://www.npmjs.com/package/gh-pages)

# Building the Extension

## Automated Build (GitHub Actions)

This project uses GitHub Actions for automated building and releasing.

### On Every Commit
- Extension is automatically built and linted
- Build artifacts are available in the Actions tab

### On Release
- Create a GitHub release with a version tag (e.g., `v1.0.1`)
- Automatically updates version numbers
- Builds and publishes to Firefox Add-ons
- Attaches `.zip` to GitHub release

**See `.github/WORKFLOWS.md` for detailed setup instructions.**

---

## Manual Build

### Option 1: Using web-ext (Recommended)

### Install web-ext
```bash
npm install
```

### Build the extension
```bash
npm run build
```

This creates a `.zip` file in `web-ext-artifacts/` directory that you can:
- Upload to Firefox Add-ons (AMO) for distribution
- Load temporarily in Firefox for testing

### Lint the extension
```bash
npm run lint
```

## Option 2: Manual ZIP

Create a zip file manually (excluding development files):

```bash
zip -r aws-sso-tab-grouper.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "web-ext-artifacts/*" \
  -x "*.DS_Store" \
  -x "package*.json" \
  -x "DEVELOPMENT.md" \
  -x "BUILD.md"
```

## Testing the Built Extension

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `.zip` file from `web-ext-artifacts/` or your manual zip
4. The extension will be loaded

## Publishing to Firefox Add-ons

1. Create an account at https://addons.mozilla.org/
2. Go to Developer Hub
3. Submit your extension (.zip file)
4. Fill in the required metadata
5. Wait for review

## Signing (For Distribution Outside AMO)

If you want to self-distribute:

```bash
npm run sign
```

You'll need to set up API credentials first:
- Get API key from https://addons.mozilla.org/developers/addon/api/key/
- Set environment variables or use `--api-key` and `--api-secret` flags

## Version Updates

1. Update version in `manifest.json`
2. Update version in `package.json`
3. Rebuild: `npm run build`

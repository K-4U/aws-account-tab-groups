# GitHub Actions Workflows

This repository uses GitHub Actions for automated building and publishing.

## Workflows

### 1. Build (`build.yml`)
**Trigger:** Push to main, or Pull Request

**Actions:**
- Installs dependencies
- Lints the extension
- Builds the extension
- Uploads build artifact (available for 30 days)

### 2. Release and Publish (`release.yml`)
**Trigger:** Creating a GitHub Release

**Actions:**
- Extracts version from release tag
- Updates `manifest.json` and `package.json` with new version
- Builds the extension
- Publishes to Firefox Add-ons store using `browser-actions/release-firefox-addon`
- Uploads `.zip` to GitHub Release
- Commits version updates back to main branch

## Setup Instructions

### 1. Get Firefox Add-ons API Credentials

1. Go to https://addons.mozilla.org/developers/addon/api/key/
2. Generate new credentials (if you don't have them)
3. Copy your API Key and API Secret

### 2. Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `WEB_EXT_API_KEY`: Your Firefox Add-ons JWT issuer
   - `WEB_EXT_API_SECRET`: Your Firefox Add-ons JWT secret

**Note:** After your first manual submission to Firefox Add-ons, you'll also need to update the `addon-id` in `.github/workflows/release.yml` with your actual addon ID.

### 3. Create a Release

#### Option A: Via GitHub UI
1. Go to Releases → Draft a new release
2. Create a new tag (e.g., `v1.0.1`, `v1.1.0`, `v2.0.0`)
3. Fill in release title and description
4. Click "Publish release"

#### Option B: Via Command Line
```bash
# Create and push a tag
git tag v1.0.1
git push origin v1.0.1

# Then create release on GitHub UI
```

#### Option C: Using GitHub CLI
```bash
gh release create v1.0.1 --title "Version 1.0.1" --notes "Bug fixes and improvements"
```

## Version Naming Convention

Use semantic versioning:
- **Major** (v2.0.0): Breaking changes
- **Minor** (v1.1.0): New features, backwards compatible
- **Patch** (v1.0.1): Bug fixes, backwards compatible

The tag MUST start with `v` (e.g., `v1.0.1`)

## What Happens on Release

1. ✅ Version extracted from tag
2. ✅ `manifest.json` and `package.json` updated
3. ✅ Extension built and linted
4. ✅ Signed with Mozilla
5. ✅ Published to Firefox Add-ons store
6. ✅ `.zip` attached to GitHub Release
7. ✅ Version changes committed back to repo

## Testing Before Release

Every push to main/master automatically:
- Builds the extension
- Runs linting
- Creates downloadable artifact

Check the Actions tab to see build status and download test builds.

## Troubleshooting

### Release fails with "Unauthorized"
- Check that `WEB_EXT_API_KEY` and `WEB_EXT_API_SECRET` are set correctly
- Verify credentials at https://addons.mozilla.org/developers/addon/api/key/

### Version not updating
- Ensure tag starts with `v` (e.g., `v1.0.1`)
- Check the Actions log for errors

### Can't push version commit
- The workflow needs write permissions
- Go to Settings → Actions → General → Workflow permissions
- Select "Read and write permissions"

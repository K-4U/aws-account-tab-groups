# Firefox AWS SSO Tab Grouping Extension

## Project Overview
This is a Firefox browser extension that detects AWS SSO (awsapps) login sessions and automatically groups tabs by AWS role name.

## Project Type
Browser Extension (Firefox)

## Key Features
- Monitor AWS SSO authentication events
- Extract role names from AWS SSO sessions
- Automatically group tabs using container tabs or color-coding
- Manage tab groups based on AWS role context

## Development Setup
- Manifest V2 for Firefox compatibility
- Background scripts for monitoring AWS SSO authentication
- Content scripts for AWS SSO page interaction and role extraction
- Storage API for persisting role-tab mappings
- Contextual Identities API for container tab management

## Project Structure
- `manifest.json` - Extension configuration
- `background.js` - Background service for tab and authentication management
- `content.js` - Content script for role detection on AWS pages
- `popup.html/popup.js` - Extension popup interface
- `icons/` - Extension icons (SVG placeholders)

## Progress Tracking
- [x] Create project structure
- [x] Scaffold manifest and core files
- [x] Implement AWS SSO detection (background.js, content.js)
- [x] Implement tab grouping logic (using Firefox containers)
- [x] Create popup interface
- [x] Create documentation (README.md, DEVELOPMENT.md)
- [x] Add icon placeholders

## Testing Instructions
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file from this directory
4. Navigate to your AWS SSO portal and log in
5. Verify that tabs are grouped in containers by role name

## Notes
- SVG icons are placeholders - replace with PNG if needed
- Extension uses Firefox Contextual Identities API (container tabs)
- Supports multiple role detection strategies for various AWS SSO configurations

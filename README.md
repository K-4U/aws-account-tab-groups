# AWS SSO Tab Grouper for Firefox

A Firefox browser extension that automatically detects AWS SSO (awsapps) login sessions and groups all tabs from that session together by AWS role name.

## Features

- 🔐 **Automatic AWS SSO Detection**: Recognizes when you log in with AWS SSO (awsapps)
- 📁 **Role-Based Tab Grouping**: Automatically groups tabs using Firefox tab groups based on the AWS role name
- 🎨 **Color-Coded Groups**: Each AWS role gets a unique tab group with a distinct color
- 🔄 **Session Management**: Maintains tab groups across browser sessions
- 📊 **Visual Dashboard**: Popup interface showing current role and active role groups

## How It Works

1. **Login Detection**: The extension monitors AWS Console page loads after SSO authentication
2. **Role Extraction**: Automatically extracts the role name from the AWS Console page
3. **Tab Group Creation**: Creates a dedicated Firefox tab group for each unique role (e.g., "AWS: AdminRole")
4. **Tab Management**: Moves all AWS Console tabs to the appropriate group based on the detected role
5. **Persistent Grouping**: Remembers role-group mappings across browser sessions

## Installation

### From Source (Development)

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the extension directory and select the `manifest.json` file

### From Firefox Add-ons (When Published)

*Coming soon to Firefox Add-ons marketplace*

## Usage

1. **Install the extension** following the installation steps above
2. **Log in to AWS SSO** through your organization's portal (*.awsapps.com)
3. **Select a role** when prompted by AWS SSO
4. **Open AWS Console** - tabs will automatically be grouped in a container named after your role
5. **Click the extension icon** to see your current role and all active role groups

## Permissions

The extension requires the following permissions:

- **tabs**: To manage and group tabs
- **tabGroups**: To create and manage tab groups
- **storage**: To persist role-group mappings across sessions
- **cookies**: To maintain AWS session state
- **webRequest & webRequestBlocking**: To detect AWS Console page loads
- **Host permissions**: Access to `*.awsapps.com`, `*.amazonaws.com`, and `*.console.aws.amazon.com`

## Technical Details

### Architecture

- **manifest.json**: Extension configuration (Manifest V2 for Firefox compatibility)
- **background.js**: Background script that monitors authentication and manages tab grouping
- **content.js**: Content script that runs on AWS pages to extract role information
- **popup.html/popup.js**: User interface for viewing current role and active groups

### Firefox Tab Groups

This extension uses Firefox's [Tab Groups API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabGroups) to create visual tab groups for each AWS role. Tab groups provide:

- Visual organization (color-coded and titled groups)
- Easy identification of tabs belonging to different roles
- Persistent grouping across browser sessions

### Role Detection Methods

The extension uses multiple strategies to detect AWS role names:

1. URL parameter parsing (`role_name`, `roleName`)
2. URL hash inspection (AWS Console URLs)
3. DOM element analysis (user menu, navigation bar)
4. Session storage inspection
5. AWS SSO portal interaction monitoring

## Development

### Project Structure

```
firefox-aws-group-plugin/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for AWS pages
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── icons/                # Extension icons
│   ├── icon-48.png
│   └── icon-96.png
└── README.md             # This file
```

### Building

No build step required - this is a pure JavaScript extension. Simply load it in Firefox using `about:debugging`.

### Testing

1. Load the extension in Firefox
2. Navigate to your AWS SSO portal
3. Log in with different roles
4. Verify that tabs are created in separate containers
5. Check the extension popup to see role groups

## Troubleshooting

### Tabs not being grouped

- Ensure you're accessing AWS Console (not just the SSO portal)
- Check the browser console for error messages
- Verify that the content script is loading on AWS Console pages

### Role name not detected

- The extension tries multiple methods to detect role names
- Some custom AWS SSO configurations may require additional detection logic
- Check the console logs for detected role information

### Tab groups not working

- Ensure you're using a recent version of Firefox that supports the Tab Groups API
- Check browser console for any API errors

## Privacy & Security

- **No data collection**: This extension does not collect or transmit any user data
- **Local storage only**: All role mappings are stored locally in your browser
- **No external requests**: The extension only monitors AWS-related domains

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Note**: This extension is not affiliated with or endorsed by Amazon Web Services (AWS).

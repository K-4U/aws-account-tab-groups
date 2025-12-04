# Development Notes

## Testing the Extension

To test this extension locally in Firefox:

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to this directory and select `manifest.json`
4. The extension will be loaded temporarily

## Icon Requirements

The extension requires icon files at:
- `icons/icon-48.png` (48x48 pixels)
- `icons/icon-96.png` (96x96 pixels)

You can create simple placeholder icons or use any AWS-themed icons you prefer.

## Manual Testing Steps

1. **Load the extension** in Firefox
2. **Navigate to AWS SSO portal** (your organization's *.awsapps.com URL)
3. **Log in and select a role**
4. **Open AWS Console** - verify tabs are in a container
5. **Click extension icon** - verify popup shows current role
6. **Log in with different role** - verify new container is created
7. **Check browser console** for debug logs

## Debugging

- Open Browser Console: Tools → Browser Tools → Browser Console (Ctrl+Shift+J)
- Check background script logs: Look for "AWS SSO Tab Grouper" messages
- Check content script logs: Inspect AWS pages and check console
- Use `about:debugging` to reload the extension after changes

## Known Limitations

- **Container Tabs Required**: Firefox must support Contextual Identities API
- **Temporary Installation**: Using "Load Temporary Add-on" means the extension is removed when Firefox closes
- **Role Detection**: May not work with all custom AWS SSO configurations
- **Icon Placeholders**: Replace with actual icons before distribution

## Next Steps

1. Create actual icon files (48x48 and 96x96 PNG)
2. Test with your specific AWS SSO setup
3. Customize role detection logic if needed
4. Consider adding options page for configuration
5. Package as XPI for permanent installation

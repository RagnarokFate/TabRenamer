# Tab Renamer

A browser extension that allows you to rename tabs for better organization and management of multiple browser tabs.

![Tab Renamer Screenshot](icons\logo.png)

## Features

- 🏷️ Rename any browser tab with a custom name
- 💾 Save names for specific websites for automatic renaming
- 📜 Keep a history of recently used names for quick reuse
- 🔄 Manage saved website-name associations
- 🌐 Works across multiple browsers (Chrome, Edge, Firefox)
- ⚡ High performance with minimal resource usage

## Installation

### From Source
1. Clone this repository
   ```
   git clone https://github.com/ragnarokfate/tab-renamer.git
   ```
2. Open Chrome/Edge and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

### From Chrome Web Store
*(Coming soon)*

## Usage

1. Click on the Tab Renamer icon in your browser toolbar
2. Enter a new name for the current tab
3. Click "Rename" or press Enter

To automatically rename a website every time you visit it:
1. Check the "Remember this name for this URL" option before renaming
2. The tab will be automatically renamed whenever you visit that website

## How It Works

Tab Renamer uses content scripts to modify the page's title element while preserving the original title. It uses a MutationObserver to ensure the custom title persists even when websites attempt to dynamically update their titles.

## Development

### Project Structure
```
tab-renamer/
├── icons/              # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json       # Extension configuration
├── popup.html          # UI that appears when clicking the extension icon
├── popup.css           # Styling for the popup UI
├── popup.js            # Logic for the popup interface
├── content.js          # Script that runs on web pages to modify titles
├── background.js       # Background script for persistent functionality
└── README.md           # This file
```

### Building and Testing

No build process is required. Simply load the unpacked extension in developer mode for testing.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need to better organize multiple browser tabs
- Thanks to all contributors who participate in this project

# Installation Guide

This guide covers all methods for installing the Obsidian Reminders plugin.

## Table of Contents

- [From Obsidian Community Plugins](#from-obsidian-community-plugins)
- [Manual Installation](#manual-installation)
- [Build From Source](#build-from-source)
- [Development Installation](#development-installation)
- [Verification](#verification)

## From Obsidian Community Plugins

This is the recommended method for most users.

### Steps

1. Open Obsidian and go to **Settings** (gear icon in the bottom left)
2. Navigate to **Community Plugins** in the left sidebar
3. If this is your first community plugin, you'll need to disable **Safe Mode**:
   - Click the **Turn on community plugins** button
   - Confirm the warning dialog
4. Click **Browse** next to "Community plugins"
5. Search for **"Reminders"** in the search bar
6. Click on the **Reminders** plugin by @gapmiss
7. Click **Install**
8. Once installed, click **Enable** to activate the plugin

### Updating

When updates are available:

1. Go to **Settings → Community Plugins**
2. Look for the Reminders plugin in your installed list
3. If an update is available, click **Update**
4. Restart Obsidian if prompted

## Manual Installation

Use this method if you have the plugin files or need to install a specific version.

### Prerequisites

- Access to your vault's file system
- Downloaded plugin files (main.js, manifest.json, styles.css)

### Steps

1. Download the latest release from the [GitHub Releases page](https://github.com/gapmiss/reminders/releases)
2. Extract the downloaded ZIP file
3. Navigate to your vault's plugins folder:
   - **Windows**: `C:\Users\YourName\Documents\YourVault\.obsidian\plugins\`
   - **macOS**: `/Users/YourName/Documents/YourVault/.obsidian/plugins/`
   - **Linux**: `/home/YourName/Documents/YourVault/.obsidian/plugins/`
4. Create a new folder called `reminders` inside the plugins folder
5. Copy these files into the `reminders` folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. Restart Obsidian
7. Go to **Settings → Community Plugins**
8. Find **Reminders** in the list and toggle it on

### Folder Structure

After installation, your folder structure should look like:

```
YourVault/
└── .obsidian/
    └── plugins/
        └── reminders/
            ├── main.js
            ├── manifest.json
            └── styles.css
```

## Build From Source

For developers or users who want the latest unreleased features.

### Prerequisites

- **Node.js** version 16 or higher
- **npm** (comes with Node.js) or **yarn**
- **Git**
- Basic command line knowledge

### Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/gapmiss/reminders.git
   cd reminders
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   Or with yarn:

   ```bash
   yarn install
   ```

3. **Build the plugin:**

   For production build:

   ```bash
   npm run build
   ```

   For development build with watch mode:

   ```bash
   npm run dev
   ```

4. **Copy files to your vault:**

   Copy these files from the project directory to your vault's plugins folder:
   - `main.js`
   - `manifest.json`
   - `styles.css`

   Example for macOS/Linux:

   ```bash
   cp main.js manifest.json styles.css ~/Documents/YourVault/.obsidian/plugins/reminders/
   ```

5. **Restart Obsidian and enable the plugin**

### Development Workflow

For active development:

1. **Create a symbolic link** from your vault's plugins folder to your development folder:

   ```bash
   # macOS/Linux
   ln -s /path/to/reminders ~/Documents/YourVault/.obsidian/plugins/reminders

   # Windows (Command Prompt as Administrator)
   mklink /D "C:\Users\YourName\Documents\YourVault\.obsidian\plugins\reminders" "C:\path\to\reminders"
   ```

2. **Run in development mode:**

   ```bash
   npm run dev
   ```

3. **Reload the plugin in Obsidian:**
   - Disable and re-enable the plugin in Settings, or
   - Use the **Reload app without saving** command (`Ctrl+R` or `Cmd+R`)

## Development Installation

For contributors working on the plugin.

### Full Setup

1. **Fork and clone:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/reminders.git
   cd reminders
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up testing:**

   ```bash
   npm test
   ```

4. **Create development build:**

   ```bash
   npm run dev
   ```

5. **Link to test vault:**

   Create a test vault in Obsidian and link the development directory:

   ```bash
   ln -s $(pwd) ~/Documents/TestVault/.obsidian/plugins/reminders
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Verification

After installation, verify the plugin is working:

1. **Check plugin is enabled:**
   - Go to **Settings → Community Plugins**
   - Verify **Reminders** appears in the list with a toggle switch
   - Ensure the toggle is turned on (blue/active)

2. **Verify UI elements:**
   - Look for a bell icon (🔔) in the left ribbon
   - Click it to open the reminder sidebar

3. **Test basic functionality:**
   - Press `Cmd/Ctrl+Shift+R` to open the reminder creation modal
   - Create a test reminder for 1 minute in the future
   - Wait for the notification to appear

4. **Check the console (optional):**
   - Open Obsidian Developer Tools: `Cmd+Option+I` (macOS) or `Ctrl+Shift+I` (Windows/Linux)
   - Look for any error messages related to "Reminders"
   - Enable debug logging in plugin settings for detailed logs

## Troubleshooting Installation

### Plugin Not Appearing in List

- Verify the files are in the correct location
- Check that the folder is named exactly `reminders`
- Ensure all required files are present (main.js, manifest.json, styles.css)
- Restart Obsidian completely (close all windows)

### Plugin Won't Enable

- Check the Obsidian console for error messages
- Verify you're running a compatible Obsidian version (1.1.0+)
- Try disabling other plugins to check for conflicts
- Reinstall the plugin from scratch

### Build Errors

- Ensure you have Node.js 16+ installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`
- Review the error messages for missing dependencies

### Permission Errors

- On macOS/Linux, you may need to use `sudo` for system-wide installations
- Ensure your user has write permissions to the vault folder
- Check your antivirus isn't blocking file operations

## Next Steps

Once installed, proceed to:

- [Quick Start Guide](quick-start.md) - Get up and running quickly
- [User Guide](user-guide.md) - Comprehensive usage documentation
- [Features](features.md) - Detailed feature overview

## Support

If you encounter issues:

- Check the [Troubleshooting Guide](troubleshooting.md)
- Search [existing issues](https://github.com/gapmiss/reminders/issues)
- Open a new issue with:
  - Your Obsidian version
  - Your operating system
  - Plugin version
  - Steps to reproduce
  - Error messages (if any)

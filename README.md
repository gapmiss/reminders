# Obsidian Reminders

A comprehensive reminder management system for [Obsidian.md](https://obsidian.md) that seamlessly integrates time-based notifications into your note-taking workflow.

## Features

### Core Functionality

- **📝 Multiple Creation Methods**: Create reminders from ribbon icons, command palette, context menus, text selections, or files
- **🔔 Dual Notification System**: Receive both OS-level system notifications and Obsidian in-app notices
- **⚡ Priority Levels**: Organize reminders by urgency (Low, Normal, High, Urgent)
- **📁 Category Organization**: Group related reminders with custom categories
- **🔗 Note Linking**: Connect reminders to specific notes and line numbers
- **⏰ Smart Snoozing**: Postpone reminders with preset durations or custom intervals
- **🔄 Re-notifications**: Get reminded again for overdue items at configurable intervals
- **📊 Real-time Statistics**: Track pending, overdue, snoozed, and completed reminders
- **🎯 Intuitive Sidebar**: Manage all reminders in a dedicated, filterable view
- **⌨️ Keyboard Shortcuts**: Quick access to common actions

### Advanced Features

- **Adaptive Scheduler**: Optimized checking intervals that adapt based on upcoming reminder times
- **Duplicate Prevention**: Intelligent tracking prevents redundant notifications
- **Interactive Notifications**: Complete, snooze, or dismiss directly from notifications
- **Bulk Operations**: Select and delete multiple reminders at once
- **Safe Deletion**: Confirmation modals prevent accidental data loss
- **Form Validation**: Comprehensive input validation with helpful error messages
- **Date Validation**: Robust date handling with graceful fallbacks for edge cases

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Navigate to **Community Plugins**
3. Disable **Safe Mode** if enabled
4. Click **Browse** and search for "Reminders"
5. Click **Install**
6. Enable the plugin in your Community Plugins list

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/gapmiss/reminders/releases)
2. Extract the files to your vault's plugins folder: `<vault>/.obsidian/plugins/reminders/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Build From Source

```bash
# Clone the repository
git clone https://github.com/gapmiss/reminders.git

# Navigate to the plugin directory
cd reminders

# Install dependencies
npm install

# Build for production
npm run build

# Or run in development mode with hot reload
npm run dev
```

## Quick Start

### Creating Your First Reminder

1. Click the bell icon in the left ribbon, or
2. Press `Cmd/Ctrl+Shift+R` to open the reminder creation modal
3. Fill in your reminder details:
   - **Message**: What you want to be reminded about
   - **Date & Time**: When you want to be notified
   - **Priority**: How urgent this reminder is
   - **Category**: Optional organizational grouping
4. Click **Create Reminder**

### Creating from Text Selection

1. Select text in any note
2. Right-click and choose **"Create reminder from selection"**, or
3. Press `Cmd/Ctrl+Alt+R`
4. The selected text becomes your reminder message

### Creating from Files

1. Right-click any file in the file explorer
2. Select **"Create reminder for this note"**
3. The reminder automatically links to that file

## Usage Guide

### Viewing Reminders

Access the reminder sidebar by:
- Clicking the bell icon in the ribbon
- Using the command palette: **"Show reminder sidebar"**

The sidebar displays:
- **Real-time statistics** at the top
- **Filter tabs** for different reminder views:
  - **Pending**: Incomplete reminders due within 24 hours
  - **Upcoming**: All future reminders
  - **Snoozed**: Currently snoozed reminders
  - **Done**: Completed reminders
  - **All**: Complete reminder list

### Managing Reminders

#### Completing Reminders

- Toggle the checkbox in the sidebar, or
- Click **Complete** in the notification popup
- Completed reminders move to the "Done" tab

#### Editing Reminders

1. Click the pencil icon next to any reminder
2. Modify the fields as needed
3. Click **Update** to save or **Cancel** to discard changes
4. **Note**: Changes are only applied when you save, not during editing

#### Snoozing Reminders

1. Click the clock icon on overdue reminders, or
2. Click **Snooze** in the notification
3. Choose from preset durations or enter custom minutes
4. Reminder will reappear after the snooze period

#### Deleting Reminders

1. Click the trash icon
2. Review the reminder details in the confirmation modal
3. Confirm deletion (this action is permanent)

#### Bulk Operations

1. Click **Select** in the sidebar header
2. Check the reminders you want to delete
3. Click **Delete Selected**
4. Confirm the deletion

### Notification Handling

When a reminder triggers:
- **System notification** appears (if enabled in settings)
- **Obsidian notice** appears (if enabled in settings)

Available actions:
- **Complete**: Mark the reminder as done
- **Snooze**: Postpone to a later time
- **Close/Dismiss**: Close without action

### Re-notifications

For overdue reminders that haven't been actioned, the plugin can notify you again at configurable intervals:

- Never (default)
- 30 seconds, 1 minute, 2 minutes (for testing)
- 5, 10, 15, 30 minutes
- 1, 2, 4, 8, 12, 24 hours

Configure this in Settings → Reminders → Re-notification interval.

## Settings

Access plugin settings via **Settings → Community Plugins → Reminders**:

### Notification Options

- **Show System Notifications**: Enable OS-level notifications
- **Show Obsidian Notices**: Enable in-app popup notices
- **Re-notification Interval**: How often to remind for overdue items

### Default Values

- **Default Priority**: Priority level for new reminders (Normal, Low, High, Urgent)

### Debugging

- **Show Debug Logs**: Enable console logging for troubleshooting

### Performance Tuning

- **Fast Check Interval**: How often to check when reminders are due soon (default: 5s)
- **Slow Check Interval**: How often to check when no reminders are imminent (default: 30s)

## Keyboard Shortcuts

### Default Shortcuts

- `Cmd/Ctrl+Shift+R`: Create new reminder
- `Cmd/Ctrl+Alt+R`: Create reminder from selection

### Customizable Commands

Configure these in **Settings → Hotkeys**:
- Show reminder sidebar
- Create new reminder
- Create reminder from selection

## Architecture

### Data Model

```typescript
interface Reminder {
    id: string;                    // Unique identifier
    message: string;               // Reminder text
    datetime: string;              // Due time (ISO string)
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: string;              // Organization category
    sourceNote?: string;           // Linked note path
    sourceLine?: number;           // Linked line number
    completed: boolean;            // Completion status
    completedAt?: string;          // Completion timestamp
    snoozedUntil?: string;        // Snooze end time
    snoozeCount: number;          // Snooze tracking
    notifiedAt?: string;          // First notification time
    created: string;              // Creation timestamp
    updated: string;              // Last update timestamp
}
```

### Core Components

- **ReminderDataManager**: Handles all CRUD operations and data persistence
- **Scheduler**: Monitors reminders and triggers notifications with adaptive timing
- **NotificationService**: Displays reminders through multiple channels
- **ReminderSidebarView**: Main UI for viewing and managing reminders
- **ReminderModal**: Comprehensive form for creating and editing reminders

For detailed architecture documentation, see [CLAUDE.md](./CLAUDE.md).

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Obsidian (for testing)

### Development Workflow

```bash
# Install dependencies
npm install

# Start development build with watch mode
npm run dev

# Run production build
npm run build

# Version bump (patch)
npm run version

# Create release (patch)
npm run release

# Create minor release
npm run release:minor

# Create major release
npm run release:major
```

### Project Structure

```
src/
├── main.ts                          # Plugin entry point
├── view.ts                          # Sidebar view component
├── types.ts                         # Shared type definitions
├── constants.ts                     # Constants and configuration
├── settings/
│   └── index.ts                     # Settings interface
├── managers/
│   ├── reminderDataManager.ts       # Data layer
│   ├── scheduler.ts                 # Timing & notifications
│   └── notificationService.ts       # Display notifications
├── modals/
│   ├── reminderModal.ts             # Create/edit form
│   ├── confirmDeleteModal.ts        # Delete confirmation
│   └── snoozeSuggestModal.ts        # Snooze picker
└── utils/
    ├── dateUtils.ts                 # Date formatting utilities
    ├── errorHandling.ts             # Error handling utilities
    └── errorRecovery.ts             # Error recovery utilities
```

### Testing

While automated tests are a future enhancement, manual testing checklist includes:

- [ ] Create reminder with all field types
- [ ] Edit existing reminder and verify non-destructive editing
- [ ] Cancel reminder editing and verify data preservation
- [ ] Test all filter views
- [ ] Verify notification triggering at correct times
- [ ] Test snooze functionality with various durations
- [ ] Test re-notification system
- [ ] Test completion workflow (especially with snoozed reminders)
- [ ] Test deletion with confirmation
- [ ] Test note linking and line numbers
- [ ] Test context menu integration
- [ ] Test keyboard shortcuts
- [ ] Test bulk operations
- [ ] Test date validation edge cases

## Troubleshooting

### Notifications Not Showing

1. Check plugin settings: ensure notifications are enabled
2. Verify browser/OS notification permissions for Obsidian
3. Try both system and Obsidian notice types
4. Check browser console for errors (enable debug logging)

### Scheduler Not Working

1. Enable debug logging in settings
2. Check console for scheduler status
3. Verify reminder datetime is in correct ISO format
4. Ensure reminder is not already completed or far in the future

### UI Not Updating

1. Try manually refreshing the sidebar (refresh button)
2. Check if reminder was saved successfully
3. Look for JavaScript errors in console
4. Restart Obsidian if issue persists

### Performance Issues

1. Check the number of reminders (very large numbers may slow UI)
2. Adjust scheduler intervals in settings
3. Clear completed reminders periodically
4. Check for other plugin conflicts

## Recent Updates

### Version 1.0.0

**New Features:**
- Re-notification system for overdue reminders with configurable intervals
- Bulk delete functionality for managing multiple reminders
- Expanded snooze interval options (30s to 24h)
- Header button improvements for better UX

**Improvements:**
- Migrated from moment.js to date-fns for better performance
- Enhanced date validation with graceful error handling
- Non-destructive editing in reminder modal
- Fixed ellipsis menu positioning for keyboard activation
- Improved error resilience across all components

**Bug Fixes:**
- Fixed re-notification blocking after first notification
- Fixed "Invalid time value" errors when completing snoozed reminders
- Fixed date validation edge cases
- Improved scheduler timing precision

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/gapmiss/reminders/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gapmiss/reminders/discussions)
- **Documentation**: [CLAUDE.md](./CLAUDE.md)

## Acknowledgments

- Built for [Obsidian.md](https://obsidian.md/)
- Uses [date-fns](https://date-fns.org/) for date manipulation
- Inspired by the Obsidian community's need for integrated reminder management

## Roadmap

Future enhancements under consideration:

- Recurring reminders (daily, weekly, monthly patterns)
- Reminder templates for common use cases
- Advanced filtering and search capabilities
- Export/import functionality
- Integration with calendar plugins
- Reminder dependencies and chains
- Mobile app optimization
- Automated testing suite

---

**Author**: [@gapmiss](https://github.com/gapmiss)

**Version**: 1.0.0

**Minimum Obsidian Version**: 1.1.0

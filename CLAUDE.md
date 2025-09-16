# CLAUDE.md - Obsidian Reminders Plugin

## Overview
This is a comprehensive reminder system for Obsidian that allows users to create, manage, and receive notifications for time-based reminders. The plugin integrates deeply with Obsidian's workflow by linking reminders to specific notes and lines.

## Architecture

### Core Components

#### Main Plugin (`src/main.ts`)
- **Purpose**: Entry point and coordinator for all plugin functionality
- **Key Responsibilities**:
  - Plugin lifecycle management (load/unload)
  - Service initialization and dependency injection
  - Command and UI registration
  - Context menu integration
  - Settings management

#### Data Layer (`src/managers/reminderDataManager.ts`)
- **Purpose**: Handles all CRUD operations for reminder data
- **Key Features**:
  - Reminder creation, reading, updating, deletion
  - Filtering and sorting by various criteria
  - Statistics generation for UI
  - Data persistence through plugin settings

#### Scheduler (`src/managers/scheduler.ts`)
- **Purpose**: Monitors reminders and triggers notifications at appropriate times
- **Key Features**:
  - Adaptive check intervals (fast when reminders due soon, slow otherwise)
  - Duplicate notification prevention
  - Precise timing validation
  - Debug logging capabilities

#### Notification Service (`src/managers/notificationService.ts`)
- **Purpose**: Displays reminders to users through multiple channels
- **Notification Types**:
  - Obsidian notices (in-app popups with action buttons)
  - System notifications (OS-level notifications)
- **Interactive Features**: Complete, snooze, or dismiss actions

#### UI Components

##### Sidebar View (`src/view.ts`)
- **Purpose**: Main interface for viewing and managing reminders
- **Features**:
  - Filterable reminder list (pending, upcoming, snoozed, completed, all)
  - Real-time statistics display
  - Interactive reminder items with completion toggles
  - Edit, delete, and snooze actions
  - Auto-updating relative time displays

##### Reminder Modal (`src/modals/reminderModal.ts`)
- **Purpose**: Comprehensive form for creating and editing reminders
- **Features**:
  - Message input with context auto-population
  - DateTime picker with quick-time buttons
  - Priority selection (low, normal, high, urgent)
  - Category organization
  - Note linking with file picker
  - Form validation

##### Confirmation Modal (`src/modals/confirmDeleteModal.ts`)
- **Purpose**: Prevents accidental deletions
- **Features**:
  - Reminder preview display
  - Clear warning about permanence
  - Safe default focus (cancel button)

##### Snooze Modal (`src/modals/snoozeSuggestModal.ts`)
- **Purpose**: Intuitive snooze duration selection
- **Features**:
  - Preset common durations
  - Custom minute input
  - Fuzzy search through presets

#### Settings (`src/settings/index.ts`)
- **Purpose**: User configuration interface
- **Settings Available**:
  - Notification preferences (system/Obsidian notices)
  - Default priority level
  - Debug logging toggle

## Data Model

### Reminder Interface
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
    created: string;              // Creation timestamp
    updated: string;              // Last update timestamp
}
```

## User Workflows

### Creating Reminders

#### Quick Creation
1. **Ribbon Icon**: Click bell icon → opens reminder modal
2. **Command Palette**: "Create new reminder" (Cmd/Ctrl+Shift+R)
3. **Context Menu**: Right-click in editor → "Create reminder here"

#### From Selection
1. Select text in editor
2. Right-click → "Create reminder from selection"
3. Or use hotkey (Cmd/Ctrl+Alt+R)
4. Modal opens with selected text as message

#### From File
1. Right-click file in explorer
2. "Create reminder for this note"
3. Reminder automatically linked to file

### Managing Reminders

#### Viewing Reminders
- **Sidebar**: Open via ribbon icon or "Show reminder sidebar" command
- **Filter Tabs**: Switch between pending, upcoming, snoozed, completed, all
- **Statistics**: Real-time counts for different reminder states

#### Editing Reminders
1. Click edit (pencil) icon on any reminder
2. Modal opens in edit mode with current values
3. Modify fields and save

#### Completing Reminders
1. **From Sidebar**: Toggle completion checkbox
2. **From Notification**: Click "Complete" button
3. Completed reminders move to "Done" filter

#### Snoozing Reminders
1. **From Sidebar**: Click snooze (clock+) icon on overdue reminders
2. **From Notification**: Click "Snooze" button
3. Select duration from presets or enter custom minutes

#### Deleting Reminders
1. Click delete (trash) icon
2. Confirm in deletion modal (shows reminder preview)

### Notification Handling

#### When Reminders Trigger
- System notification appears (if enabled)
- Obsidian notice appears (if enabled)
- Reminder marked as processed to prevent duplicates

#### Notification Actions
- **Complete**: Marks reminder as done
- **Snooze**: Opens snooze duration picker
- **Close**: Dismisses notification without action

## Commands Available

### Keyboard Commands
- `Cmd/Ctrl+Shift+R`: Create new reminder
- `Cmd/Ctrl+Alt+R`: Create reminder from selection
- Custom: Show reminder sidebar

### Context Menu Commands
- **Editor Context**: "Create reminder from selection", "Create reminder here"
- **File Context**: "Create reminder for this note", "View reminders (count)"

## Development Guidelines

### Code Organization
- **Services**: Stateful components managing specific functionality
- **Modals**: UI components for user interaction
- **Interfaces**: Shared type definitions
- **Settings**: Configuration management

### Adding New Features

#### New Reminder Fields
1. Update `Reminder` interface in `reminderModal.ts`
2. Add UI controls in `ReminderModal.onOpen()`
3. Update data manager CRUD operations
4. Add to statistics if needed
5. Update sidebar display logic

#### New Notification Channels
1. Extend `NotificationService.showReminder()`
2. Add settings toggle in `RemindersSettingTab`
3. Update default settings

#### New Filter Views
1. Add filter option to `view.ts` filter array
2. Implement filtering logic in `getFilteredReminders()`
3. Add data manager method if needed

### Testing Guidelines

#### Manual Testing Checklist
- [ ] Create reminder with all field types
- [ ] Edit existing reminder
- [ ] Test all filter views
- [ ] Verify notification triggering
- [ ] Test snooze functionality
- [ ] Test completion workflow
- [ ] Test deletion with confirmation
- [ ] Test note linking
- [ ] Test context menu integration
- [ ] Test keyboard shortcuts

#### Test Data Creation
```javascript
// In browser console while plugin is loaded
app.plugins.plugins.reminders.dataManager.createReminder({
    message: "Test reminder",
    datetime: moment().add(1, 'minute').toISOString(),
    priority: "high",
    category: "testing"
});
```

### Common Issues & Solutions

#### Scheduler Not Triggering
- Check if scheduler is running: `app.plugins.plugins.reminders.scheduler.isRunning`
- Verify reminder datetime format
- Check for JavaScript errors in console
- Enable debug logging in settings

#### Notifications Not Showing
- Check notification settings in plugin settings
- Verify browser notification permissions
- Test with both system and Obsidian notice types

#### UI Not Updating
- Sidebar auto-refreshes on data changes
- Manual refresh available via refresh button
- Check if `sidebarView.refresh()` is called after data operations

### Build & Development

#### Required Commands
```bash
npm install          # Install dependencies
npm run dev         # Development build with watch
npm run build       # Production build
```

#### File Structure
```
src/
├── main.ts                          # Plugin entry point
├── view.ts                          # Sidebar view component
├── settings/
│   └── index.ts                     # Settings interface
├── managers/
│   ├── reminderDataManager.ts       # Data layer
│   ├── scheduler.ts                 # Timing & notifications
│   └── notificationService.ts      # Display notifications
└── modals/
    ├── reminderModal.ts             # Create/edit form
    ├── confirmDeleteModal.ts        # Delete confirmation
    └── snoozeSuggestModal.ts        # Snooze picker
```

#### Plugin Manifest
- Ensure `main.js` points to compiled output
- Update version numbers for releases
- Test in both development and production builds

## Performance Considerations

### Scheduler Optimization
- Uses adaptive intervals (5s when reminders due soon, 30s otherwise)
- Prevents duplicate processing with Set tracking
- Efficient time calculations with moment.js

### UI Performance
- Lazy loading of reminder list items
- Efficient re-rendering on data changes
- Debounced time updates (5-second intervals)

### Memory Management
- Proper cleanup in `onunload()` methods
- Timer cleanup in `ReminderTimeUpdater.destroy()`
- Event listener cleanup in modal close handlers

## Security Considerations

### Data Storage
- All data stored in Obsidian's secure plugin data
- No external API calls or data transmission
- Local-only processing

### Input Validation
- Message length and content validation
- DateTime format validation
- File path validation for note linking
- Priority and category value validation

## Future Enhancement Ideas

### Potential Features
- Recurring reminders (daily, weekly, monthly)
- Reminder templates for common use cases
- Bulk operations (select multiple, mass edit)
- Reminder search and advanced filtering
- Export/import functionality
- Integration with calendar plugins
- Reminder dependencies (chain reminders)
- Location-based reminders (if geolocation available)
- Email/SMS notifications (with external service integration)

### Technical Improvements
- Database migration system for data model changes
- Plugin API for other plugins to create reminders
- Improved error handling and user feedback
- Performance monitoring and optimization
- Accessibility improvements (ARIA labels, keyboard navigation)
- Mobile responsiveness testing
- Automated testing suite

---

*This document should be updated whenever significant changes are made to the plugin architecture or functionality.*
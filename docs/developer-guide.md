# Developer Guide

Comprehensive guide for developers working on or extending the Obsidian Reminders plugin.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Data Layer](#data-layer)
5. [Building and Testing](#building-and-testing)
6. [Code Style](#code-style)
7. [Adding Features](#adding-features)
8. [Debugging](#debugging)
9. [Contributing](#contributing)
10. [Release Process](#release-process)

## Getting Started

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **TypeScript**: Installed via npm
- **Obsidian**: Latest version for testing
- **Git**: For version control
- **Code Editor**: VS Code recommended

### Development Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/reminders.git
   cd reminders
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Build the plugin:**

   ```bash
   # Development build with watch mode
   npm run dev

   # Production build
   npm run build
   ```

4. **Link to test vault:**

   ```bash
   # Create symbolic link
   ln -s $(pwd) ~/Documents/TestVault/.obsidian/plugins/reminders
   ```

5. **Enable in Obsidian:**
   - Open test vault
   - Settings → Community Plugins
   - Enable "Reminders"

### Project Structure

```
reminders/
├── src/                           # Source code
│   ├── main.ts                    # Plugin entry point
│   ├── view.ts                    # Sidebar view component
│   ├── types.ts                   # TypeScript type definitions
│   ├── constants.ts               # Constants and configuration
│   ├── managers/                  # Core managers
│   │   ├── reminderDataManager.ts # Data operations
│   │   ├── scheduler.ts           # Notification scheduler
│   │   └── notificationService.ts # Notification display
│   ├── modals/                    # UI modals
│   │   ├── reminderModal.ts       # Create/edit modal
│   │   ├── confirmDeleteModal.ts  # Delete confirmation
│   │   └── snoozeSuggestModal.ts  # Snooze duration picker
│   ├── settings/                  # Settings interface
│   │   └── index.ts              # Settings tab
│   └── utils/                     # Utility functions
│       ├── dateUtils.ts           # Date formatting
│       ├── errorHandling.ts       # Error handling
│       └── errorRecovery.ts       # Error recovery
├── tests/                         # Test suites
│   ├── unit/                      # Unit tests
│   └── integration/               # Integration tests
├── styles.css                     # Plugin styles
├── manifest.json                  # Plugin manifest
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── esbuild.config.mjs            # Build configuration
└── vitest.config.ts              # Test configuration
```

## Architecture Overview

### Plugin Lifecycle

```typescript
class RemindersPlugin extends Plugin {
    async onload() {
        // 1. Initialize settings
        await this.loadSettings();

        // 2. Create managers
        this.dataManager = new ReminderDataManager(this);
        this.scheduler = new Scheduler(this);
        this.notificationService = new NotificationService(this);

        // 3. Register UI components
        this.registerView(VIEW_TYPE_REMINDERS, ...);
        this.addRibbonIcon(...);

        // 4. Register commands
        this.addCommand(...);

        // 5. Add context menus
        this.registerEvent(...);

        // 6. Start scheduler
        this.scheduler.start();
    }

    async onunload() {
        // 1. Stop scheduler
        this.scheduler.stop();

        // 2. Clean up views
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_REMINDERS);

        // 3. Save data
        await this.saveData(this.settings);
    }
}
```

### Data Flow

```
User Action
    ↓
UI Component (Modal/View)
    ↓
ReminderDataManager
    ↓
Settings (Persistence)
    ↓
Scheduler (Monitoring)
    ↓
NotificationService (Display)
```

### Component Communication

Components communicate through:

1. **Plugin Instance**: Central coordinator with references to all managers
2. **Events**: Obsidian's event system for UI updates
3. **Direct Calls**: Managers call each other through plugin instance
4. **Callbacks**: UI components provide callbacks for async operations

## Core Components

### Main Plugin (`src/main.ts`)

**Purpose:** Entry point and coordinator for all plugin functionality.

**Key Responsibilities:**
- Plugin lifecycle management
- Service initialization
- Command registration
- Context menu integration
- Settings management

**Key Methods:**

```typescript
class RemindersPlugin extends Plugin {
    // Initialization
    async onload(): Promise<void>
    async onunload(): Promise<void>

    // Settings
    async loadSettings(): Promise<void>
    async saveSettings(): Promise<void>

    // UI
    private registerCommands(): void
    private registerViews(): void
    private registerContextMenus(): void

    // Data access
    get dataManager(): ReminderDataManager
    get scheduler(): Scheduler
    get notificationService(): NotificationService
}
```

**Adding New Commands:**

```typescript
this.addCommand({
    id: 'my-new-command',
    name: 'My New Command',
    callback: () => {
        // Command logic
    },
    hotkeys: [{
        modifiers: ['Mod', 'Shift'],
        key: 'R'
    }]
});
```

### Data Manager (`src/managers/reminderDataManager.ts`)

**Purpose:** Handles all CRUD operations for reminder data.

**Key Methods:**

```typescript
class ReminderDataManager {
    // CRUD operations
    createReminder(reminder: Omit<Reminder, 'id' | 'created' | 'updated'>): Reminder
    getReminder(id: string): Reminder | undefined
    updateReminder(id: string, updates: Partial<Reminder>): Reminder | undefined
    deleteReminder(id: string): boolean

    // Queries
    getAllReminders(): Reminder[]
    getPendingReminders(): Reminder[]
    getUpcomingReminders(): Reminder[]
    getSnoozedReminders(): Reminder[]
    getCompletedReminders(): Reminder[]

    // Filtering
    getFilteredByTag(tag: string): Reminder[]
    getFilteredByPriority(priority: Priority): Reminder[]
    getFilteredByTags(tags: string[]): Reminder[]

    // Statistics
    getStatistics(): ReminderStatistics
    getAllTags(): Map<string, number>

    // Bulk operations
    deleteAllCompleted(): number
    deleteAll(): void
}
```

**Usage Example:**

```typescript
// Create a reminder
const reminder = dataManager.createReminder({
    message: "Buy groceries",
    datetime: new Date(Date.now() + 3600000).toISOString(),
    priority: "normal",
    tags: ["shopping", "personal"],
    completed: false,
    snoozeCount: 0
});

// Query reminders
const pending = dataManager.getPendingReminders();
const tagged = dataManager.getFilteredByTag("work");

// Update reminder
dataManager.updateReminder(reminder.id, {
    completed: true,
    completedAt: new Date().toISOString()
});
```

### Scheduler (`src/managers/scheduler.ts`)

**Purpose:** Monitors reminders and triggers notifications at appropriate times.

**Key Features:**
- Adaptive check intervals (5s when due soon, 30s otherwise)
- Duplicate notification prevention
- Precise timing validation
- Debug logging

**Key Methods:**

```typescript
class Scheduler {
    start(): void
    stop(): void
    checkReminders(): void

    private shouldNotify(reminder: Reminder): boolean
    private shouldReNotify(reminder: Reminder): boolean
    private getCheckInterval(): number
}
```

**Scheduler Logic:**

```typescript
private checkReminders(): void {
    const now = new Date();
    const reminders = this.dataManager.getPendingReminders();

    for (const reminder of reminders) {
        // Skip if already notified
        if (this.processedReminders.has(reminder.id)) {
            if (this.shouldReNotify(reminder)) {
                this.notificationService.showReminder(reminder);
            }
            continue;
        }

        // Check if due
        const dueTime = new Date(reminder.datetime);
        if (now >= dueTime) {
            this.notificationService.showReminder(reminder);
            this.processedReminders.add(reminder.id);
        }
    }
}
```

**Adaptive Intervals:**

```typescript
private getCheckInterval(): number {
    const upcoming = this.dataManager.getUpcomingReminders();
    const now = new Date();

    for (const reminder of upcoming) {
        const dueTime = new Date(reminder.datetime);
        const minutesUntilDue = (dueTime.getTime() - now.getTime()) / 60000;

        if (minutesUntilDue <= 5) {
            return 5000; // 5 seconds
        }
    }

    return 30000; // 30 seconds
}
```

### Notification Service (`src/managers/notificationService.ts`)

**Purpose:** Displays reminders through multiple channels.

**Key Methods:**

```typescript
class NotificationService {
    showReminder(reminder: Reminder): void

    private showSystemNotification(reminder: Reminder): void
    private showObsidianNotice(reminder: Reminder): void
    private createActionButtons(reminder: Reminder): DocumentFragment
}
```

**Notification Display:**

```typescript
showReminder(reminder: Reminder): void {
    const settings = this.plugin.settings;

    // System notification
    if (settings.showSystemNotifications) {
        this.showSystemNotification(reminder);
    }

    // Obsidian notice
    if (settings.showObsidianNotices) {
        this.showObsidianNotice(reminder);
    }
}
```

**Action Buttons:**

```typescript
private createActionButtons(reminder: Reminder): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Complete button
    const completeBtn = fragment.createEl('button', { text: 'Complete' });
    completeBtn.addEventListener('click', () => {
        this.plugin.dataManager.updateReminder(reminder.id, {
            completed: true,
            completedAt: new Date().toISOString()
        });
    });

    // Snooze button
    const snoozeBtn = fragment.createEl('button', { text: 'Snooze' });
    snoozeBtn.addEventListener('click', () => {
        new SnoozeSuggestModal(this.app, this.plugin, reminder).open();
    });

    return fragment;
}
```

### Sidebar View (`src/view.ts`)

**Purpose:** Main UI for viewing and managing reminders.

**Key Features:**
- Filter tabs (Pending, Upcoming, Snoozed, Done, All)
- Real-time statistics
- Interactive reminder items
- Advanced filtering on All tab

**Key Methods:**

```typescript
class ReminderSidebarView extends ItemView {
    getViewType(): string
    getDisplayText(): string
    getIcon(): string

    async onOpen(): Promise<void>
    async onClose(): Promise<void>

    refresh(): void

    private renderStatistics(): void
    private renderFilterTabs(): void
    private renderReminderList(reminders: Reminder[]): void
    private renderReminderItem(reminder: Reminder): HTMLElement
}
```

**Rendering Reminders:**

```typescript
private renderReminderItem(reminder: Reminder): HTMLElement {
    const item = createDiv({ cls: 'reminder-item' });

    // Checkbox
    const checkbox = item.createEl('input', { type: 'checkbox' });
    checkbox.checked = reminder.completed;
    checkbox.addEventListener('change', () => {
        this.plugin.dataManager.updateReminder(reminder.id, {
            completed: checkbox.checked,
            completedAt: checkbox.checked ? new Date().toISOString() : undefined
        });
        this.refresh();
    });

    // Message
    item.createEl('div', {
        text: reminder.message,
        cls: 'reminder-message'
    });

    // Time
    item.createEl('div', {
        text: formatRelativeTime(reminder.datetime),
        cls: 'reminder-time'
    });

    // Tags
    if (reminder.tags.length > 0) {
        const tagContainer = item.createDiv({ cls: 'reminder-tags' });
        reminder.tags.forEach(tag => {
            tagContainer.createEl('span', {
                text: tag,
                cls: 'reminder-tag'
            });
        });
    }

    // Actions menu
    this.addActionsMenu(item, reminder);

    return item;
}
```

### Reminder Modal (`src/modals/reminderModal.ts`)

**Purpose:** Form for creating and editing reminders.

**Key Features:**
- Non-destructive editing (changes only on save)
- Form validation
- Quick time buttons
- Tag input
- Note linking

**Key Methods:**

```typescript
class ReminderModal extends Modal {
    constructor(app: App, plugin: RemindersPlugin, reminder?: Reminder)

    onOpen(): void
    onClose(): void

    private createFormFields(): void
    private validateForm(): boolean
    private saveReminder(): void
}
```

**Non-Destructive Editing:**

```typescript
class ReminderModal extends Modal {
    private reminder?: Reminder;      // Original data
    private formData: Partial<Reminder>; // Working copy

    onOpen(): void {
        // Initialize form data from reminder or defaults
        this.formData = this.reminder ? { ...this.reminder } : {
            message: '',
            datetime: '',
            priority: this.plugin.settings.defaultPriority,
            tags: [],
            completed: false,
            snoozeCount: 0
        };

        this.createFormFields();
    }

    private saveReminder(): void {
        if (!this.validateForm()) return;

        if (this.reminder) {
            // Update existing (merge formData into reminder)
            this.plugin.dataManager.updateReminder(
                this.reminder.id,
                this.formData
            );
        } else {
            // Create new
            this.plugin.dataManager.createReminder(this.formData);
        }

        this.close();
    }
}
```

## Data Layer

### Data Model

**Reminder Interface:**

```typescript
interface Reminder {
    id: string;                    // Unique identifier (UUID)
    message: string;               // Reminder text
    datetime: string;              // Due time (ISO string)
    priority: Priority;            // Urgency level
    tags: string[];                // Organization tags (lowercase)
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

type Priority = 'low' | 'normal' | 'high' | 'urgent';
```

### Settings Interface

```typescript
interface RemindersSettings {
    reminders: Reminder[];
    showSystemNotifications: boolean;
    showObsidianNotices: boolean;
    reNotificationInterval: number; // milliseconds, 0 = never
    defaultPriority: Priority;
    debug: boolean;
}

const DEFAULT_SETTINGS: RemindersSettings = {
    reminders: [],
    showSystemNotifications: true,
    showObsidianNotices: true,
    reNotificationInterval: 0,
    defaultPriority: 'normal',
    debug: false
};
```

### Data Persistence

```typescript
// Save settings (including reminders)
async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
}

// Load settings
async loadSettings(): Promise<void> {
    this.settings = Object.assign(
        {},
        DEFAULT_SETTINGS,
        await this.loadData()
    );
}
```

### Data Validation

```typescript
function isValidReminder(obj: any): obj is Reminder {
    return (
        typeof obj.id === 'string' &&
        typeof obj.message === 'string' &&
        typeof obj.datetime === 'string' &&
        ['low', 'normal', 'high', 'urgent'].includes(obj.priority) &&
        Array.isArray(obj.tags) &&
        typeof obj.completed === 'boolean' &&
        typeof obj.snoozeCount === 'number' &&
        typeof obj.created === 'string' &&
        typeof obj.updated === 'string'
    );
}
```

## Building and Testing

### Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build (minified)
npm run build

# Type checking only
npx tsc --noEmit

# Lint code
npm run lint
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- tests/unit/dateUtils.test.ts

# Run tests matching pattern
npm test -- --grep "date formatting"
```

### Test Structure

**Unit Test Example:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ReminderDataManager } from '../src/managers/reminderDataManager';

describe('ReminderDataManager', () => {
    let dataManager: ReminderDataManager;

    beforeEach(() => {
        // Setup fresh instance
        dataManager = new ReminderDataManager(mockPlugin);
    });

    describe('createReminder', () => {
        it('should create a reminder with all required fields', () => {
            const reminder = dataManager.createReminder({
                message: 'Test reminder',
                datetime: new Date().toISOString(),
                priority: 'normal',
                tags: [],
                completed: false,
                snoozeCount: 0
            });

            expect(reminder.id).toBeDefined();
            expect(reminder.message).toBe('Test reminder');
            expect(reminder.created).toBeDefined();
            expect(reminder.updated).toBeDefined();
        });

        it('should normalize tags to lowercase', () => {
            const reminder = dataManager.createReminder({
                message: 'Test',
                datetime: new Date().toISOString(),
                priority: 'normal',
                tags: ['WORK', 'Urgent'],
                completed: false,
                snoozeCount: 0
            });

            expect(reminder.tags).toEqual(['work', 'urgent']);
        });
    });
});
```

### Manual Testing

**Test Checklist:**

```markdown
- [ ] Create reminder with all field types
- [ ] Edit existing reminder
- [ ] Cancel editing (verify data preserved)
- [ ] Test all filter views
- [ ] Verify notification triggering
- [ ] Test snooze functionality
- [ ] Test re-notifications
- [ ] Test completion workflow
- [ ] Test deletion with confirmation
- [ ] Test note linking
- [ ] Test context menus
- [ ] Test keyboard shortcuts
- [ ] Test bulk operations
```

## Code Style

### TypeScript Guidelines

**Use strict typing:**

```typescript
// Good
function createReminder(message: string, datetime: Date): Reminder {
    // ...
}

// Bad
function createReminder(message: any, datetime: any): any {
    // ...
}
```

**Prefer interfaces over types for objects:**

```typescript
// Good
interface ReminderFormData {
    message: string;
    datetime: string;
    priority: Priority;
}

// Less preferred
type ReminderFormData = {
    message: string;
    datetime: string;
    priority: Priority;
};
```

**Use optional chaining and nullish coalescing:**

```typescript
// Good
const line = reminder.sourceLine ?? 0;
const note = reminder.sourceNote?.trim();

// Avoid
const line = reminder.sourceLine ? reminder.sourceLine : 0;
```

### Naming Conventions

```typescript
// Classes: PascalCase
class ReminderDataManager { }

// Interfaces: PascalCase
interface Reminder { }

// Functions/Methods: camelCase
function createReminder() { }

// Constants: UPPER_SNAKE_CASE
const DEFAULT_PRIORITY = 'normal';

// Private methods: camelCase with underscore
private _internalMethod() { }
```

### Documentation

**Use JSDoc comments:**

```typescript
/**
 * Creates a new reminder with the provided data.
 *
 * @param data - Reminder data without id and timestamps
 * @returns The created reminder with generated id and timestamps
 * @throws {Error} If required fields are missing
 */
createReminder(data: Omit<Reminder, 'id' | 'created' | 'updated'>): Reminder {
    // ...
}
```

### Error Handling

**Use try-catch for async operations:**

```typescript
async loadSettings(): Promise<void> {
    try {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    } catch (error) {
        console.error('Failed to load settings:', error);
        this.settings = DEFAULT_SETTINGS;
    }
}
```

**Validate before operations:**

```typescript
updateReminder(id: string, updates: Partial<Reminder>): Reminder | undefined {
    const reminder = this.getReminder(id);
    if (!reminder) {
        console.warn(`Reminder not found: ${id}`);
        return undefined;
    }

    // Proceed with update
    // ...
}
```

## Adding Features

### Adding a New Reminder Field

1. **Update types (`src/types.ts`):**

```typescript
interface Reminder {
    // ... existing fields
    category?: string; // New field
}
```

2. **Update data manager default:**

```typescript
createReminder(data: Omit<Reminder, 'id' | 'created' | 'updated'>): Reminder {
    return {
        ...data,
        id: generateId(),
        category: data.category ?? 'general', // Default value
        created: new Date().toISOString(),
        updated: new Date().toISOString()
    };
}
```

3. **Update modal form:**

```typescript
onOpen(): void {
    // ... other fields

    // Category input
    new Setting(this.modalEl)
        .setName('Category')
        .addText(text => text
            .setValue(this.formData.category ?? '')
            .onChange(value => {
                this.formData.category = value;
            })
        );
}
```

4. **Update view display:**

```typescript
private renderReminderItem(reminder: Reminder): HTMLElement {
    // ... existing rendering

    if (reminder.category) {
        item.createEl('div', {
            text: `Category: ${reminder.category}`,
            cls: 'reminder-category'
        });
    }
}
```

5. **Add tests:**

```typescript
describe('category field', () => {
    it('should save category when provided', () => {
        const reminder = dataManager.createReminder({
            // ... required fields
            category: 'work'
        });

        expect(reminder.category).toBe('work');
    });

    it('should use default when not provided', () => {
        const reminder = dataManager.createReminder({
            // ... required fields, no category
        });

        expect(reminder.category).toBe('general');
    });
});
```

### Adding a New Filter View

1. **Add filter type:**

```typescript
type FilterType =
    | 'pending'
    | 'upcoming'
    | 'snoozed'
    | 'completed'
    | 'high-priority' // New filter
    | 'all';
```

2. **Add data manager method:**

```typescript
getHighPriorityReminders(): Reminder[] {
    return this.getAllReminders()
        .filter(r => r.priority === 'high' || r.priority === 'urgent')
        .sort((a, b) =>
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );
}
```

3. **Add tab in view:**

```typescript
private renderFilterTabs(): void {
    const tabs = [
        { type: 'pending', label: 'Pending' },
        { type: 'upcoming', label: 'Upcoming' },
        { type: 'high-priority', label: 'High Priority' }, // New tab
        { type: 'snoozed', label: 'Snoozed' },
        { type: 'completed', label: 'Done' },
        { type: 'all', label: 'All' }
    ];

    // ... render tabs
}
```

4. **Add filter logic:**

```typescript
private getFilteredReminders(filter: FilterType): Reminder[] {
    switch (filter) {
        case 'pending':
            return this.plugin.dataManager.getPendingReminders();
        case 'high-priority':
            return this.plugin.dataManager.getHighPriorityReminders();
        // ... other cases
    }
}
```

### Adding a New Command

```typescript
this.addCommand({
    id: 'export-reminders',
    name: 'Export reminders to file',
    callback: async () => {
        const reminders = this.dataManager.getAllReminders();
        const json = JSON.stringify(reminders, null, 2);

        // Create file
        const file = await this.app.vault.create(
            'reminders-export.json',
            json
        );

        new Notice('Reminders exported successfully');
    }
});
```

## Debugging

### Console Logging

**Enable debug mode:**

```typescript
if (this.plugin.settings.debug) {
    console.log('[Reminders]', 'Debug message', data);
}
```

**Structured logging:**

```typescript
class Logger {
    constructor(private plugin: RemindersPlugin) {}

    log(message: string, ...args: any[]): void {
        if (this.plugin.settings.debug) {
            console.log(`[Reminders] ${message}`, ...args);
        }
    }

    error(message: string, error: Error): void {
        console.error(`[Reminders] ERROR: ${message}`, error);
    }

    warn(message: string, ...args: any[]): void {
        console.warn(`[Reminders] WARNING: ${message}`, ...args);
    }
}
```

### Debugging Scheduler

```typescript
private checkReminders(): void {
    if (this.plugin.settings.debug) {
        console.log('[Reminders] Scheduler check at', new Date().toISOString());
    }

    const reminders = this.plugin.dataManager.getPendingReminders();

    if (this.plugin.settings.debug) {
        console.log('[Reminders] Found', reminders.length, 'pending reminders');
    }

    // ... check logic
}
```

### Browser DevTools

**Access console:**
- macOS: `Cmd+Option+I`
- Windows/Linux: `Ctrl+Shift+I`

**Useful commands:**

```javascript
// Access plugin instance
const plugin = app.plugins.plugins.reminders;

// View all reminders
plugin.dataManager.getAllReminders();

// View settings
plugin.settings;

// Check scheduler status
plugin.scheduler.isRunning;

// Manually trigger check
plugin.scheduler.checkReminders();

// Create test reminder
plugin.dataManager.createReminder({
    message: 'Test reminder',
    datetime: new Date(Date.now() + 60000).toISOString(), // 1 min ahead
    priority: 'normal',
    tags: [],
    completed: false,
    snoozeCount: 0
});
```

## Contributing

### Contribution Workflow

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Make your changes**
4. **Write/update tests**
5. **Run tests:**
   ```bash
   npm test
   ```

6. **Commit your changes:**
   ```bash
   git commit -m "feat: add new feature"
   ```

7. **Push to your fork:**
   ```bash
   git push origin feature/my-new-feature
   ```

8. **Open a Pull Request**

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Examples:**

```
feat(scheduler): add adaptive check intervals

Implement smart checking that uses 5s intervals when reminders
are due soon and 30s intervals otherwise. This optimizes battery
usage while maintaining responsiveness.

Closes #42
```

```
fix(modal): preserve data when canceling edit

Previously, editing a reminder would modify the original object
even if the user canceled. Now uses a separate formData object
that only merges on save.

Fixes #38
```

### Pull Request Guidelines

**Title:** Clear, descriptive summary

**Description should include:**
- What the PR does
- Why the change is needed
- Any breaking changes
- Screenshots (if UI change)
- Testing performed

**Checklist:**
```markdown
- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested in Obsidian
```

## Release Process

### Version Bumping

```bash
# Patch release (1.0.0 → 1.0.1)
npm run version

# Minor release (1.0.0 → 1.1.0)
npm run release:minor

# Major release (1.0.0 → 2.0.0)
npm run release:major
```

This updates:
- `package.json` version
- `manifest.json` version
- `versions.json` entry

### Creating a Release

1. **Update CHANGELOG.md**
2. **Commit version bump:**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.1.0"
   ```

3. **Create tag:**
   ```bash
   git tag 1.1.0
   ```

4. **Push with tags:**
   ```bash
   git push origin main --tags
   ```

5. **GitHub Release:**
   - Go to GitHub Releases
   - Draft new release
   - Select tag
   - Add release notes
   - Upload build artifacts (main.js, manifest.json, styles.css)

### Release Checklist

```markdown
- [ ] All tests passing
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Documentation updated
- [ ] Tested in Obsidian
- [ ] No console errors
- [ ] Build artifacts generated
- [ ] Git tag created
- [ ] GitHub release created
- [ ] Community plugin submitted (if applicable)
```

---

## Additional Resources

- [Obsidian Plugin API Docs](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vitest Documentation](https://vitest.dev/)
- [date-fns Documentation](https://date-fns.org/docs/Getting-Started)

---

For architectural details, see [CLAUDE.md](../CLAUDE.md).

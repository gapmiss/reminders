# Features

Comprehensive overview of all Obsidian Reminders features.

## Table of Contents

1. [Core Features](#core-features)
2. [Creation Methods](#creation-methods)
3. [Organization Features](#organization-features)
4. [Notification System](#notification-system)
5. [Filtering and Views](#filtering-and-views)
6. [Time Management](#time-management)
7. [UI Features](#ui-features)
8. [Data Features](#data-features)
9. [Integration Features](#integration-features)
10. [Performance Features](#performance-features)

## Core Features

### Reminder Creation

Create reminders through multiple intuitive methods:

- **Ribbon icon**: Single click access
- **Command palette**: Search and create
- **Keyboard shortcuts**: Quick access (Cmd/Ctrl+Shift+R)
- **Context menus**: Right-click creation
- **Text selection**: Create from highlighted text
- **File linking**: Create from file explorer

### Reminder Properties

Each reminder includes:

- **Message**: The reminder text (required)
- **Date/Time**: When to be notified (required)
- **Priority**: Urgency level (low, normal, high, urgent)
- **Tags**: Multiple organizational tags
- **Source linking**: Connection to notes and line numbers
- **Completion status**: Track done/not done
- **Snooze state**: Postponement tracking
- **Timestamps**: Created, updated, completed, notified

### Reminder Lifecycle

Track reminders through their lifecycle:

1. **Created**: New reminder added
2. **Upcoming**: Future reminder waiting
3. **Due**: Time arrives, notifications triggered
4. **Pending**: Overdue but not completed
5. **Snoozed**: Temporarily postponed
6. **Completed**: Marked as done

## Creation Methods

### Quick Creation

**Ribbon Icon:**
- Single click on bell icon
- Instant modal access
- Fastest method for quick reminders

**Keyboard Shortcut:**
- `Cmd/Ctrl+Shift+R`
- Works from anywhere in Obsidian
- Modal opens immediately

**Command Palette:**
- Open with `Cmd/Ctrl+P`
- Type "Create new reminder"
- Select and create

### Context-Aware Creation

**From Selection:**
- Select any text in editor
- Press `Cmd/Ctrl+Alt+R`
- Text becomes message
- Auto-links to source note and line

**Example workflow:**
```markdown
Call Dr. Smith about test results on Friday
```
1. Select this text
2. Create reminder from selection
3. Set time for Friday
4. Reminder created with full context

**From Context Menu:**
- Right-click in editor
- "Create reminder here" or "from selection"
- Quick access without keyboard

**From File Explorer:**
- Right-click any note file
- "Create reminder for this note"
- Automatically links to file
- Great for file-based reminders

### Smart Defaults

When creating reminders:

- **Priority**: Uses your default setting
- **Tags**: Previous tags suggested (future feature)
- **Time**: Quick buttons for common times
- **Note link**: Auto-filled from context

## Organization Features

### Multi-Tag System

**Tag Capabilities:**
- Multiple tags per reminder
- Comma-separated input
- Case-insensitive storage
- Flexible organization

**Tag Features:**
- Badge display in UI
- Filter by any tag
- See all tags in use
- Tag usage counts

**Tag Input:**
```
work, urgent, meeting
project-alpha, deadline
personal, errands, shopping
```

**Tag Display:**
```
🏷️ work • urgent • meeting
```

### Priority System

**Four Priority Levels:**

**🔴 Urgent:**
- Critical, time-sensitive
- Highlighted prominently
- For immediate action
- Use sparingly

**🟡 High:**
- Important tasks
- Significant impact
- Should be handled soon
- Common for deadlines

**⚪ Normal:**
- Standard priority
- Default setting
- Most common use
- Balanced urgency

**🔵 Low:**
- Nice-to-have
- Low impact
- Can wait
- For future tasks

**Priority Indicators:**
- Color-coded icons
- Visual differentiation
- Filter by priority
- Combine with tags

### Note Linking

**Automatic Linking:**
- From text selection
- From file explorer
- From context menu
- Preserves source location

**Link Information:**
- File path
- Line number (when applicable)
- Click to navigate
- Context preservation

**Manual Linking:**
- File picker in modal
- Select any note
- Optional line number
- Update anytime

**Benefits:**
- Quick context access
- Navigate to source
- Project organization
- Related content

## Notification System

### Dual Notification Channels

**System Notifications:**
- OS-level notifications
- Notification center integration
- Persistent until dismissed
- Background operation
- Requires permissions

**Obsidian Notices:**
- In-app notifications
- Top-right corner
- Auto-dismiss option
- Always available
- No permissions needed

**Combined Benefits:**
- Redundancy for critical reminders
- Work in any context
- Flexible configuration

### Notification Content

**Every notification shows:**
- Reminder message
- Due time
- Action buttons
- Clear, readable format

**Action Buttons:**
- **Complete**: Mark as done
- **Snooze**: Postpone
- **Close**: Dismiss without action

### Re-notification System

**Configurable Re-alerts:**
- Never (default)
- 30 seconds, 1 minute, 2 minutes
- 5, 10, 15, 30 minutes
- 1, 2, 4, 8, 12, 24 hours

**How It Works:**
- Triggers on overdue reminders
- Repeats at interval
- Until completed or snoozed
- Per-reminder tracking

**Use Cases:**
- Critical deadlines: 5-15 minutes
- Important tasks: 30 minutes - 2 hours
- Regular tasks: Never or 4+ hours

### Smart Notification Logic

**Duplicate Prevention:**
- Tracks notified reminders
- Prevents spam
- Re-notifications separate
- Clean notification flow

**Precise Timing:**
- Checks at scheduled time
- ±30 second precision
- Adaptive checking intervals
- Battery efficient

## Filtering and Views

### Standard Views

**Pending Tab:**
- Overdue reminders only
- Past due time
- Not yet completed
- Sorted oldest first
- Red/warning highlight

**Upcoming Tab:**
- Future reminders
- Not yet due
- Sorted soonest first
- Relative time display
- Blue/calm color

**Snoozed Tab:**
- Currently snoozed only
- Shows snooze end time
- Sorted by snooze expiry
- Purple/postponed color

**Done Tab:**
- Completed reminders
- Sorted newest first
- Shows completion time
- Gray/completed color
- Uncomplete option

**All Tab:**
- Every reminder
- Any status
- Advanced filtering available
- Complete overview

### Advanced Filtering

**Available on All Tab:**

**Tag Filtering:**
- Select one or more tags
- OR logic (any match)
- Usage counts shown
- Checkmark indicators

**Priority Filtering:**
- Filter by any priority
- Multiple selectable
- Count indicators
- Color-coded

**Combined Filtering:**
- Tags AND priority
- OR logic across types
- Flexible combinations
- Shows: (tag1 OR tag2 OR priority)

**Filter UI:**
- Click active "All" tab to open
- Dropdown menu
- Checkmark selections
- Clear all option
- Visual indicators (chevron/filter-x icons)

**Filter Persistence:**
- Active while on All tab
- Cleared when switching tabs
- Manual clear available
- Filter state in tab label

**Example Filters:**
```
Filter: work + urgent priority
Shows: Tagged "work" OR urgent priority

Filter: meeting + personal + high priority
Shows: Tagged "meeting" OR "personal" OR high priority
```

## Time Management

### Snooze System

**Snooze Capabilities:**
- Postpone overdue reminders
- Preset durations
- Custom minute input
- Multiple snooze support

**Preset Durations:**
- 5, 15, 30 minutes
- 1, 2, 4 hours
- Tomorrow (same time)
- Next week (same time)

**Custom Duration:**
- Type any minute value
- Fuzzy search presets
- Flexible timing

**Snooze Tracking:**
- Snooze count recorded
- Expiry time shown
- Separate view (Snoozed tab)
- Automatic return to Pending

**Snooze from:**
- Sidebar menu
- Notification button
- Available for overdue only

### Time Display

**Relative Time:**
- "in 2 hours"
- "in 3 days"
- "5 minutes ago"
- "2 weeks ago"

**Auto-Update:**
- Refreshes every 5 seconds
- Always current
- No manual refresh needed

**Absolute Time:**
- Hover for exact time
- ISO format
- Full timestamp

**Smart Formatting:**
- Today: "Today at 3:00 PM"
- Tomorrow: "Tomorrow at 9:00 AM"
- This week: "Friday at 2:00 PM"
- Far future: "Dec 15 at 10:00 AM"

### Quick Time Buttons

**In Creation Modal:**

**1h Button:**
- 1 hour from current time
- Quick short-term reminders
- Common for "soon" tasks

**2h Button:**
- 2 hours from now
- Short-term planning
- Buffer time

**Tomorrow Button:**
- Tomorrow at current time
- Next-day tasks
- Common workflow

**Next Week Button:**
- 7 days from now at current time
- Weekly planning
- Future tasks

**Benefits:**
- One-click time setting
- Common use cases
- Faster than picker
- Still allows custom times

## UI Features

### Sidebar Interface

**Responsive Design:**
- Adapts to sidebar width
- Readable at any size
- Smooth scrolling
- Clean layout

**Real-time Updates:**
- Auto-refresh on changes
- Live time updates
- Instant filter changes
- No lag

**Interactive Elements:**
- Clickable checkboxes
- Expandable menus
- Hover states
- Clear focus indicators

**Visual Feedback:**
- Color-coded states
- Icon indicators
- Badge counts
- Loading states

### Statistics Panel

**Real-time Counts:**
- Pending count
- Upcoming count
- Snoozed count
- Completed count
- Total count

**Updates On:**
- Reminder creation
- Status changes
- Deletions
- Time passage

**Visual Design:**
- Clear numbers
- Descriptive labels
- Compact layout
- Always visible

### Reminder Cards

**Card Layout:**
```
☐ Reminder message here
  Time information
  🏷️ tags  ⚡ priority
  📄 linked note
  [...] actions
```

**Color Coding:**
- Pending: Red/orange
- Upcoming: Blue
- Snoozed: Purple
- Completed: Gray

**Interactive Parts:**
- Checkbox: Toggle completion
- Message: Selectable text
- Note link: Navigate to note
- Menu: Access actions

**Hover Effects:**
- Highlight on hover
- Tooltip for full info
- Clear clickable areas

### Modal Forms

**Creation/Edit Modal:**
- Clean layout
- Field validation
- Error messages
- Clear buttons

**Confirmation Modal:**
- Shows reminder preview
- Warning about permanence
- Safe default (Cancel)
- Clear action buttons

**Snooze Modal:**
- Preset options
- Custom input
- Fuzzy search
- Quick selection

## Data Features

### Data Persistence

**Storage:**
- Obsidian plugin data
- JSON format
- Auto-save on changes
- Reliable persistence

**Data Integrity:**
- Validation on load
- Error recovery
- Backup on changes
- Safe operations

**Migration:**
- Version tracking
- Future-proof structure
- Backward compatibility (planned)

### Data Operations

**CRUD Operations:**
- Create reminders
- Read/query reminders
- Update reminder properties
- Delete reminders

**Bulk Operations:**
- Delete all completed
- Delete all reminders
- Future: Bulk edit

**Filtering:**
- By status
- By tag
- By priority
- By date range

**Statistics:**
- Count by status
- Count by tag
- Count by priority
- Usage analytics

### Data Model

**Complete Reminder Object:**
```typescript
{
  id: "unique-id",
  message: "Reminder text",
  datetime: "2025-01-15T14:00:00.000Z",
  priority: "normal",
  tags: ["work", "urgent"],
  sourceNote: "path/to/note.md",
  sourceLine: 42,
  completed: false,
  completedAt: undefined,
  snoozedUntil: undefined,
  snoozeCount: 0,
  notifiedAt: undefined,
  created: "2025-01-10T10:00:00.000Z",
  updated: "2025-01-10T10:00:00.000Z"
}
```

**Field Types:**
- Strings: id, message, datetime, priority, paths
- Arrays: tags
- Numbers: line numbers, counts
- Booleans: completed flag
- Optional: timestamps, linking info

## Integration Features

### Obsidian Integration

**Command Palette:**
- Multiple commands
- Searchable
- Keyboard accessible

**Context Menus:**
- Editor context menu
- File explorer menu
- Right-click access

**Ribbon:**
- Custom icon
- Single-click access
- Visual reminder

**Hotkeys:**
- Customizable
- Default shortcuts
- Standard combinations

### Note Integration

**Text Selection:**
- Create from any text
- Preserves context
- Auto-linking

**File Linking:**
- Link to any note
- Line number support
- Navigate back easily

**Editor Context:**
- Create from cursor
- Create from selection
- Inline workflows

## Performance Features

### Adaptive Scheduler

**Smart Checking:**
- Fast mode: 5 seconds (when reminders due soon)
- Normal mode: 30 seconds (when quiet)
- Automatically adapts
- Optimizes battery and CPU

**Efficient Logic:**
- Minimal processing
- Only checks active reminders
- Skips completed/far future
- Date calculations optimized

### UI Optimization

**Efficient Rendering:**
- Virtual scrolling (future)
- Lazy loading
- Minimal re-renders
- Debounced updates

**Fast Filters:**
- Client-side filtering
- Instant results
- No lag
- Smooth transitions

### Memory Management

**Resource Cleanup:**
- Timer cleanup
- Event listener removal
- Proper unloading
- No memory leaks

**Efficient Storage:**
- Compact JSON
- Minimal redundancy
- Fast load/save
- Small data footprint

## Security and Privacy Features

### Data Security

**Local-Only:**
- No external APIs
- No data transmission
- Vault-contained
- Full privacy

**Permission Model:**
- OS notifications only external permission
- No network access
- No file system access outside vault
- Sandboxed

### Input Validation

**Form Validation:**
- Required field checks
- Date/time validation
- Length limits
- Type checking

**Data Sanitization:**
- Safe string handling
- No code injection
- Escaped output
- Validated inputs

### Safe Operations

**Deletion Confirmation:**
- Preview before delete
- Explicit confirmation
- No accidental loss
- Bulk operations protected

**Non-destructive Editing:**
- Changes only on save
- Cancel preserves data
- Safe exploration
- Undo-friendly

## Accessibility Features

**Keyboard Navigation:**
- Full keyboard support
- Tab navigation
- Shortcut access
- No mouse required

**Visual Clarity:**
- High contrast
- Clear icons
- Readable fonts
- Color coding (not only color)

**Screen Reader Support:**
- Semantic HTML
- ARIA labels (planned)
- Descriptive text
- Logical structure

## Future Features

Planned enhancements:

- **Recurring Reminders**: Daily, weekly, monthly patterns
- **Templates**: Pre-defined reminder templates
- **Search**: Full-text reminder search
- **Export/Import**: Backup and migration
- **Calendar Integration**: Sync with calendar plugins
- **Dependencies**: Chain reminders together
- **Mobile Optimization**: Better mobile support
- **Voice Input**: Create reminders by voice (if API available)
- **Natural Language**: "Remind me tomorrow at 2pm to..."

---

For detailed usage of these features, see the [User Guide](user-guide.md).

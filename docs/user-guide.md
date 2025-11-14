# User Guide

Complete guide to using the Obsidian Reminders plugin.

## Table of Contents

1. [Overview](#overview)
2. [Creating Reminders](#creating-reminders)
3. [Managing Reminders](#managing-reminders)
4. [The Sidebar Interface](#the-sidebar-interface)
5. [Notifications](#notifications)
6. [Tags and Organization](#tags-and-organization)
7. [Advanced Filtering](#advanced-filtering)
8. [Settings and Configuration](#settings-and-configuration)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Best Practices](#best-practices)

## Overview

Obsidian Reminders is a comprehensive reminder management system that seamlessly integrates into your Obsidian workflow. It allows you to create time-based reminders, link them to notes, organize with tags and priorities, and receive notifications through multiple channels.

### Key Concepts

- **Reminder**: A time-based notification with a message, due time, priority, and optional tags
- **Pending**: Reminders that are past their due time but not yet completed
- **Upcoming**: Future reminders that haven't triggered yet
- **Snoozed**: Reminders postponed to a later time
- **Completed**: Reminders marked as done

## Creating Reminders

### Method 1: Ribbon Icon

The quickest way to create a reminder:

1. Click the bell icon (🔔) in the left ribbon
2. The reminder creation modal opens
3. Fill in the form (see [Reminder Form Fields](#reminder-form-fields))
4. Click **Create Reminder**

### Method 2: Command Palette

1. Open command palette (`Cmd/Ctrl+P`)
2. Type "Create new reminder"
3. Press Enter
4. Fill in the form

Or use the keyboard shortcut: `Cmd/Ctrl+Shift+R`

### Method 3: From Text Selection

Create a reminder with pre-filled message from selected text:

1. Select text in any note
2. **Option A**: Right-click → "Create reminder from selection"
3. **Option B**: Press `Cmd/Ctrl+Alt+R`
4. The selected text becomes the reminder message
5. Set the date/time and other fields
6. The reminder automatically links to the source note and line number

**Example:**
```markdown
Remember to call dentist about appointment
```

Select this text, create a reminder, and you'll get:
- Message: "Remember to call dentist about appointment"
- Source note: Current file
- Source line: Line number of the selection

### Method 4: From Context Menu

Right-click anywhere in the editor:

- **"Create reminder here"**: Creates a reminder linked to the current line
- **"Create reminder from selection"**: Creates from selected text (if any)

### Method 5: From File Explorer

Create a reminder linked to a specific note:

1. Right-click any file in the file explorer
2. Select "Create reminder for this note"
3. Fill in the reminder details
4. The reminder automatically links to that file

### Reminder Form Fields

#### Message (Required)

The text of your reminder. This is what you'll see in notifications.

**Tips:**
- Be specific: "Call dentist about teeth cleaning appointment"
- Include context: "Review draft before meeting with Sarah"
- Keep it concise but clear

#### Date and Time (Required)

When you want to be reminded.

**Date picker:**
- Click the calendar icon
- Navigate months with arrows
- Click a date to select

**Time picker:**
- Use 24-hour format (14:00) or 12-hour format (2:00 PM)
- Type directly or use up/down arrows

**Quick time buttons:**
- **1h**: 1 hour from now
- **2h**: 2 hours from now
- **Tomorrow**: Tomorrow at the same time
- **Next Week**: Next week at the same time

**Validation:**
- You must select a future date/time
- Past times show an error message
- Invalid dates are prevented

#### Priority

Indicates the importance of the reminder:

- 🔴 **Urgent**: Critical, immediate attention required
- 🟡 **High**: Important, should be handled soon
- ⚪ **Normal**: Standard priority (default)
- 🔵 **Low**: Nice to have, can wait

**Setting default priority:**
Go to Settings → Reminders → Default Priority to change the default for new reminders.

#### Tags

Organize reminders with multiple tags:

**Format:** Comma-separated list
```
work, urgent, meeting
```

**Features:**
- Case-insensitive (stored as lowercase)
- Trimmed automatically (spaces removed)
- Multiple tags per reminder
- Used for filtering and organization

**Common tag strategies:**
- **By context**: work, personal, home, errands
- **By project**: project-alpha, redesign, research
- **By urgency**: urgent, important, someday
- **By type**: meeting, call, email, task

#### Source Note (Auto-filled)

When creating from a file, selection, or context menu, this field automatically links to:
- The file path
- The specific line number (if applicable)

**Manual linking:**
1. Click "Link to note" button
2. Select a file from the picker
3. Optionally specify a line number

**Benefits:**
- Quick navigation back to context
- See where the reminder originated
- Maintain connection to your notes

## Managing Reminders

### Viewing Reminders

Access the reminder sidebar:

- Click the bell icon in the ribbon, or
- Command palette: "Show reminder sidebar", or
- Set a custom hotkey in Settings → Hotkeys

### Completing Reminders

Mark a reminder as done:

**From sidebar:**
1. Find the reminder
2. Click the checkbox
3. The reminder moves to the "Done" tab

**From notification:**
1. When notification appears
2. Click "Complete" button
3. Reminder is marked done immediately

**What happens:**
- `completed` flag set to `true`
- `completedAt` timestamp recorded
- Moves to "Done" filter view
- Removed from "Pending" and "Upcoming" views

### Editing Reminders

Modify any aspect of an existing reminder:

1. Locate the reminder in the sidebar
2. Click the **three-dot menu** (⋯)
3. Select **Edit**
4. The reminder modal opens in edit mode
5. Modify any fields
6. Click **Update** to save changes
7. Or click **Cancel** to discard changes

**Important:** Changes are not applied until you click Update. This prevents accidental modifications while browsing reminder details.

**What you can edit:**
- Message text
- Date and time
- Priority level
- Tags
- Note linking

**What you cannot edit:**
- Unique ID
- Creation timestamp
- Completion status (use checkbox instead)

### Snoozing Reminders

Postpone an overdue reminder to a later time:

1. Click the **three-dot menu** (⋯) on an overdue reminder
2. Select **Snooze**
3. Choose a duration from presets:
   - 5 minutes
   - 15 minutes
   - 30 minutes
   - 1 hour
   - 2 hours
   - 4 hours
   - Tomorrow
   - Next week
4. Or type a custom number of minutes
5. The reminder is snoozed until that time

**From notification:**
- Click "Snooze" button
- Select duration
- Notification dismisses

**Snooze mechanics:**
- `snoozedUntil` timestamp set
- `snoozeCount` incremented
- Moves to "Snoozed" tab
- Will reappear when snooze expires
- Can be snoozed multiple times

**Finding snoozed reminders:**
- Switch to the "Snoozed" tab
- See time remaining until reminder returns
- Can edit or delete while snoozed

### Deleting Reminders

Permanently remove a reminder:

1. Click the **three-dot menu** (⋯)
2. Select **Delete**
3. Review reminder details in confirmation modal
4. Click **Delete** to confirm
5. Or click **Cancel** to abort

**Safety features:**
- Confirmation modal shows reminder preview
- Deletion is permanent (cannot be undone)
- Cancel button is focused by default

**Bulk deletion:**
From the sidebar header menu (⋯):
- **Delete Completed**: Removes all completed reminders
- **Delete All**: Removes all reminders (with confirmation)

## The Sidebar Interface

### Header Section

```
┌────────────────────────────────────┐
│ 🔔 Reminders              [⋯] [↻] │  ← Title and actions
└────────────────────────────────────┘
```

**Header actions:**
- **⋯ (Three dots)**: Bulk operations menu
  - Delete all completed
  - Delete all reminders
- **↻ (Refresh)**: Manually refresh the view

### Statistics Panel

Real-time counts of your reminders:

```
┌────────────────────────────────────┐
│ 📊 Statistics                      │
│                                    │
│ • 3 pending (overdue)              │
│ • 5 upcoming                       │
│ • 2 snoozed                        │
│ • 12 completed                     │
│                                    │
│ Total: 22 reminders                │
└────────────────────────────────────┘
```

**Updates automatically when:**
- Reminders are created, edited, or deleted
- Reminders become overdue
- Reminders are completed or snoozed

### Filter Tabs

Navigate between different views:

```
┌──────────────────────────────────────────┐
│ [Pending] [Upcoming] [Snoozed] [Done] [All] │
└──────────────────────────────────────────┘
```

#### Pending Tab

Shows overdue reminders (past their due time but not completed):

- Sorted by due date (oldest first)
- Highlighted in red/warning color
- Snooze action available
- High priority for attention

#### Upcoming Tab

Shows future reminders (not yet due):

- Sorted by due date (soonest first)
- Shows relative time ("in 2 hours", "in 3 days")
- Edit and delete actions available
- Cannot snooze (not yet overdue)

#### Snoozed Tab

Shows currently snoozed reminders:

- Sorted by snooze expiry (soonest first)
- Shows when snooze ends
- Can edit or delete
- Will move to Pending when snooze expires

#### Done Tab

Shows completed reminders:

- Sorted by completion time (newest first)
- Shows completion timestamp
- Can uncomplete (toggle checkbox)
- Can delete
- Useful for reviewing what you've accomplished

#### All Tab

Shows all reminders with advanced filtering:

- Includes all reminders regardless of status
- Click the tab again to open filter menu
- Filter by tags and/or priority
- Combine filters with OR logic
- See [Advanced Filtering](#advanced-filtering) for details

### Reminder List Items

Each reminder displays:

```
┌────────────────────────────────────────┐
│ ☐ Buy groceries for dinner party      │  ← Message
│   Tomorrow at 6:00 PM (in 14 hours)    │  ← Time (relative)
│   🏷️ shopping, food  ⚡ normal        │  ← Tags & Priority
│   📄 Notes/Shopping.md:42              │  ← Linked note (if any)
│   [...] Edit • Snooze • Delete         │  ← Actions menu
└────────────────────────────────────────┘
```

**Interactive elements:**
- **Checkbox**: Toggle completion
- **Message**: Click to focus/select
- **Linked note**: Click to open the note
- **Three-dot menu**: Access actions

**Color coding:**
- **Red/Orange**: Overdue (pending)
- **Blue**: Upcoming
- **Purple**: Snoozed
- **Gray**: Completed

**Time display:**
- Updates every 5 seconds
- Shows relative time ("in 2 hours", "3 days ago")
- Exact time on hover

## Notifications

### Notification Channels

The plugin supports two notification types:

#### 1. System Notifications

OS-level notifications that appear in your system notification center.

**Features:**
- Persist until dismissed
- Work even when Obsidian is in background
- Require OS notification permissions

**Enabling:**
1. Go to Settings → Reminders
2. Toggle "Show System Notifications"
3. Grant notification permissions if prompted

**macOS:**
- Appears in Notification Center
- Can be configured in System Preferences

**Windows:**
- Appears in Action Center
- Can be configured in Windows Settings

**Linux:**
- Depends on notification daemon
- Usually appears top-right

#### 2. Obsidian Notices

In-app notifications that appear within Obsidian.

**Features:**
- Always visible when Obsidian is active
- Auto-dismiss after a few seconds
- No external permissions needed

**Enabling:**
1. Go to Settings → Reminders
2. Toggle "Show Obsidian Notices"

**Appearance:**
- Appears top-right in Obsidian window
- Includes action buttons
- Stacks if multiple appear

### Notification Content

Every notification displays:

- **Title**: "Reminder"
- **Message**: Your reminder text
- **Time**: When it was due
- **Action buttons**:
  - Complete
  - Snooze
  - Close/Dismiss

### Notification Timing

Reminders trigger when:

1. **Exact time reached**: Scheduled datetime arrives
2. **Scheduler check**: Plugin checks every 5-30 seconds
3. **Grace period**: ±30 seconds for precision

**Adaptive checking:**
- **Fast mode** (5 seconds): When reminders due within 5 minutes
- **Normal mode** (30 seconds): When next reminder is further away
- Optimizes battery and performance

### Re-notifications

Get reminded again if you haven't actioned an overdue reminder.

**Configuration:**
1. Go to Settings → Reminders
2. Select "Re-notification interval"
3. Choose from options:
   - Never (default)
   - 30 seconds, 1 minute, 2 minutes (testing)
   - 5, 10, 15, 30 minutes
   - 1, 2, 4, 8, 12, 24 hours

**How it works:**
- Only applies to incomplete, overdue reminders
- Timer starts from first notification
- Continues until reminder is completed or snoozed
- Each notification resets the timer

**Use cases:**
- **Critical tasks**: Set to 5-15 minutes
- **Important deadlines**: Set to 1-2 hours
- **Low priority**: Keep at "Never"

### Duplicate Prevention

The plugin prevents duplicate notifications:

- Tracks which reminders have been notified
- Only notifies once per reminder becoming due
- Re-notifications use separate logic
- Snoozing resets notification state

## Tags and Organization

### Tag System

Tags provide flexible organization for your reminders.

#### Creating Tags

When creating or editing a reminder:

```
Tags: work, urgent, meeting, project-alpha
```

**Format rules:**
- Comma-separated
- Case-insensitive (stored lowercase)
- Spaces trimmed automatically
- No special characters needed (#, @ not required)

**Examples:**

```
work
work, personal
project-alpha, urgent, work
meeting, john-smith, q4-planning
```

#### Tag Best Practices

**By Context:**
```
work, personal, home, errands, study
```

**By Project:**
```
project-alpha, redesign, research, launch
```

**By Person:**
```
john, sarah, team-leads, clients
```

**By Status:**
```
urgent, important, waiting-for, someday
```

**By Type:**
```
meeting, call, email, task, deadline
```

**Combine strategies:**
```
Tags: work, project-alpha, meeting, urgent
```
This reminder is:
- Work-related
- Part of project alpha
- A meeting
- Urgent

#### Viewing All Tags

To see all tags in use:

1. Go to the "All" tab
2. Click the tab again to open the filter menu
3. All tags are listed with counts
4. Shows how many reminders use each tag

#### Tag Filtering

Filter reminders by tag:

1. Open the filter menu (click "All" tab)
2. Select one or more tags
3. View updates to show matching reminders
4. Active tags shown in tab label

See [Advanced Filtering](#advanced-filtering) for details.

## Advanced Filtering

Available on the "All" tab.

### Opening the Filter Menu

1. Navigate to the **All** tab
2. **Click the "All" tab again** while it's active
3. The filter dropdown menu appears

**Visual indicators:**
- **Chevron icon (▼)**: Menu available
- **Filter-x icon**: Filters are active
- **Tab label**: Shows active filters (e.g., "All • work • urgent")

### Filter Options

The menu contains:

#### Tag Filters

- Lists all tags with usage counts
- Click a tag to toggle filter
- Selected tags show checkmarks (✓)
- Multiple tags can be selected

**Example:**
```
☐ work (5)
☑ urgent (3)
☐ personal (7)
☑ meeting (2)
```

This shows reminders tagged "urgent" OR "meeting".

#### Priority Filters

- 🔴 Urgent (count)
- 🟡 High (count)
- ⚪ Normal (count)
- 🔵 Low (count)

Click to toggle each priority level.

#### Clear Filters

- "Clear all filters" option at bottom
- Removes all active filters
- Returns to showing all reminders

### Filter Logic

**OR Logic:**
Filters use OR logic - reminders matching ANY selected filter are shown.

**Examples:**

**Tag only:**
- Selected: `work`
- Shows: All reminders tagged "work"

**Priority only:**
- Selected: `urgent priority`
- Shows: All urgent reminders

**Combined:**
- Selected: `work tag` AND `urgent priority`
- Shows: Reminders tagged "work" OR urgent priority (or both)

**Multiple tags:**
- Selected: `work` AND `personal`
- Shows: Reminders tagged "work" OR "personal"

### Filter Persistence

- Filters persist while on "All" tab
- Switching to another tab clears filters
- Returning to "All" shows unfiltered view
- Manual clear available anytime

### Filter Counts

The menu shows:
- How many reminders have each tag
- How many reminders at each priority
- Total matching current filters

**Example:**
```
Active filters: work, urgent
Showing 8 of 22 reminders
```

## Settings and Configuration

Access settings: **Settings → Community Plugins → Reminders**

### Notification Settings

#### Show System Notifications

Toggle OS-level notifications on/off.

**Default:** On

**When to enable:**
- You want notifications even when Obsidian is in background
- You have OS notification permissions
- You want persistent notifications

**When to disable:**
- You find system notifications distracting
- You only use Obsidian in focus
- You have permission issues

#### Show Obsidian Notices

Toggle in-app notifications on/off.

**Default:** On

**When to enable:**
- You want in-app notifications
- You primarily work with Obsidian in focus
- You want action buttons in notifications

**When to disable:**
- You prefer only system notifications
- You find in-app notices distracting

**Recommendation:** Enable both for redundancy.

#### Re-notification Interval

How often to re-notify for overdue reminders.

**Options:**
- Never (default)
- 30 seconds, 1 minute, 2 minutes
- 5, 10, 15, 30 minutes
- 1, 2, 4, 8, 12, 24 hours

**Default:** Never

**Choosing an interval:**
- **Critical tasks**: 5-15 minutes
- **Important tasks**: 30 minutes - 2 hours
- **Regular tasks**: Never or 4-8 hours
- **Low priority**: Never

### Default Values

#### Default Priority

Sets the default priority for new reminders.

**Options:**
- Low
- Normal (default)
- High
- Urgent

**Use case:**
If most of your reminders are urgent, set this to "Urgent" to save time.

### Debugging

#### Debug Logging

Enable detailed console logging.

**Default:** Off

**When to enable:**
- Troubleshooting issues
- Reporting bugs
- Understanding plugin behavior

**What it logs:**
- Scheduler activity
- Notification triggers
- Data operations
- Timing calculations

**Viewing logs:**
1. Enable debug logging
2. Open developer console (`Cmd+Option+I` or `Ctrl+Shift+I`)
3. Filter by "Reminders"
4. See detailed log messages

## Keyboard Shortcuts

### Default Shortcuts

These work out of the box:

| Command | Windows/Linux | macOS | Description |
|---------|--------------|-------|-------------|
| Create reminder | `Ctrl+Shift+R` | `Cmd+Shift+R` | Opens creation modal |
| Create from selection | `Ctrl+Alt+R` | `Cmd+Alt+R` | Creates from selected text |

### Customizable Commands

Set custom shortcuts in **Settings → Hotkeys**:

1. Open Settings
2. Go to Hotkeys
3. Search for "Reminder"
4. Click + icon next to a command
5. Press your desired key combination
6. Click outside to save

**Available commands:**
- Show reminder sidebar
- Create new reminder
- Create reminder from selection

### Recommended Shortcuts

Some useful combinations:

```
Show sidebar: Ctrl/Cmd+Shift+B
Create reminder: Ctrl/Cmd+Shift+R (default)
Create from selection: Ctrl/Cmd+Alt+R (default)
```

### Modal Shortcuts

While in the reminder modal:

- `Enter`: Submit form (create/update)
- `Escape`: Cancel and close
- `Tab`: Navigate between fields

## Best Practices

### Message Writing

**Be specific:**
- ❌ "Meeting"
- ✓ "Team standup meeting in conference room B"

**Include context:**
- ❌ "Call"
- ✓ "Call Sarah about Q4 budget proposal"

**Add details:**
- ❌ "Review"
- ✓ "Review and approve PR #42 before deployment"

### Time Management

**Set realistic times:**
- Consider your schedule
- Add buffer time for preparation
- Account for travel time

**Use quick times wisely:**
- "1h" for quick tasks
- "Tomorrow" for next-day tasks
- Manual entry for specific times

**Lead time for meetings:**
- Set 15-30 minutes before meeting
- Allows preparation time
- Reduces being late

### Priority Usage

**Urgent (🔴):**
- Deadlines within hours
- Critical dependencies
- Emergency tasks

**High (🟡):**
- Important deadlines
- Significant impact
- High-value tasks

**Normal (⚪):**
- Regular tasks
- Standard importance
- Default for most

**Low (🔵):**
- Nice-to-have
- Low impact
- Can be deferred

**Don't over-use urgent:**
If everything is urgent, nothing is urgent. Reserve it for truly critical items.

### Tag Strategies

**Consistent naming:**
- Use lowercase
- Use hyphens for multi-word: "project-alpha"
- Be consistent: always "work" not sometimes "office"

**Limited tag set:**
- Don't create too many tags
- Aim for 10-20 meaningful tags
- Reuse existing tags

**Hierarchical tags:**
- Use prefixes: "proj-alpha", "proj-beta"
- Groups related items
- Easier filtering

**Multi-tag wisely:**
- Don't over-tag (3-5 tags max)
- Each tag should add value
- Consider filtering needs

### Organization

**Weekly review:**
- Check upcoming reminders
- Adjust times if needed
- Delete obsolete ones
- Clear completed items

**Daily triage:**
- Morning: Review pending and upcoming
- During day: Create as needed
- Evening: Prep tomorrow's reminders

**Project-based:**
- Tag all project reminders
- Filter by project to see all tasks
- Clean up when project completes

### Maintenance

**Regular cleanup:**
```
Weekly: Delete completed from last week
Monthly: Review all reminders
Quarterly: Audit tag usage
```

**Bulk operations:**
- Use "Delete completed" weekly
- Prevents clutter
- Keeps sidebar fast

**Review snoozed:**
- Check snoozed tab regularly
- Decide: complete, reschedule, or delete
- Don't let them pile up

### Linking to Notes

**When to link:**
- Reminder relates to specific note
- You'll need context when reminded
- Part of project in notes

**When not to link:**
- Standalone tasks
- Generic reminders
- No related notes

**Line numbers:**
- Use for specific sections
- Great for TODOs in notes
- Quick navigation to exact location

---

**Next:** Check out [Features](features.md) for detailed feature documentation or [Troubleshooting](troubleshooting.md) if you encounter issues.

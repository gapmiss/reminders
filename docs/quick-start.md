# Quick Start Guide

Get up and running with Obsidian Reminders in 5 minutes.

## Your First Reminder

### Method 1: Using the Ribbon Icon

1. **Open the creation modal:**
   - Click the bell icon (🔔) in the left ribbon

2. **Fill in the reminder:**
   - **Message**: "Buy groceries"
   - **Date**: Tomorrow
   - **Time**: 3:00 PM
   - **Priority**: Normal (default)

3. **Create the reminder:**
   - Click **Create Reminder**

4. **View your reminder:**
   - The sidebar automatically opens
   - Your reminder appears in the "Upcoming" tab

### Method 2: Using Keyboard Shortcuts

1. **Press** `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)
2. Fill in the reminder details
3. Press **Enter** or click **Create Reminder**

## Creating from Text

### From a Selection

1. **Write something in any note:**
   ```
   Call dentist about appointment
   ```

2. **Select the text**

3. **Right-click** and choose **"Create reminder from selection"**
   - Or press `Cmd+Alt+R` (macOS) or `Ctrl+Alt+R` (Windows/Linux)

4. The text becomes your reminder message - just set the date and time!

### From a File

1. **Right-click any file** in the file explorer
2. Select **"Create reminder for this note"**
3. The reminder automatically links to that file

## Understanding the Sidebar

### Opening the Sidebar

- Click the bell icon in the ribbon, or
- Use command palette: **"Show reminder sidebar"**

### Sidebar Sections

```
┌─────────────────────────────────┐
│  📊 Statistics                  │
│  • 3 pending, 5 upcoming        │
├─────────────────────────────────┤
│  [Pending] [Upcoming] [Done]    │  ← Filter Tabs
├─────────────────────────────────┤
│  ☐ Buy groceries                │  ← Reminder Item
│     Tomorrow at 3:00 PM         │
│     🏷️ shopping  ⚡ normal     │
│     [...] Edit/Snooze/Delete    │
└─────────────────────────────────┘
```

### Filter Tabs

- **Pending**: Overdue reminders (past due time)
- **Upcoming**: Future reminders
- **Snoozed**: Currently snoozed reminders
- **Done**: Completed reminders
- **All**: Everything, with advanced filtering

## Working with Reminders

### Completing a Reminder

**Option 1: From the sidebar**
- Click the checkbox next to the reminder

**Option 2: From the notification**
- Click **Complete** when the notification appears

### Editing a Reminder

1. Click the **three-dot menu** (...) on any reminder
2. Select **Edit**
3. Modify any fields
4. Click **Update** to save

**Pro tip:** Changes are only applied when you click Update, so you can safely explore the form without losing data.

### Snoozing a Reminder

1. Click the **three-dot menu** (...) on an overdue reminder
2. Select **Snooze**
3. Choose from preset durations:
   - 5 minutes
   - 15 minutes
   - 30 minutes
   - 1 hour
   - Or enter custom minutes

### Deleting a Reminder

1. Click the **three-dot menu** (...)
2. Select **Delete**
3. Confirm in the dialog (shows reminder details for safety)

## Using Tags

Tags help organize your reminders.

### Adding Tags

When creating/editing a reminder:

```
Tags: work, urgent, meeting
```

- Separate with commas
- Case doesn't matter (stored as lowercase)
- Use multiple tags for flexible organization

### Filtering by Tags

1. Go to the **All** tab in the sidebar
2. **Click the "All" tab again** to open the filter menu
3. Select one or more tags
4. The view updates to show matching reminders

**Visual cues:**
- Chevron icon (▼) shows filter menu available
- Filter-x icon when filters are active
- Active filters shown in tab: "All • work • urgent"

## Using Priorities

### Priority Levels

- **🔴 Urgent**: Critical, time-sensitive tasks
- **🟡 High**: Important, high priority
- **⚪ Normal**: Standard priority (default)
- **🔵 Low**: Nice to have, low priority

### Setting Priority

When creating a reminder:
1. Click the **Priority** dropdown
2. Select the appropriate level

### Filtering by Priority

1. Go to the **All** tab
2. Click the tab again to open filters
3. Select a priority level
4. View shows reminders of that priority

**Combine with tags:** Filters use OR logic, showing reminders matching either tag OR priority.

## Notification Basics

### When You'll Be Notified

Reminders trigger at their scheduled time:

1. **System notification** appears (if enabled)
   - Shows on your OS notification center
   - Persists until dismissed

2. **Obsidian notice** appears (if enabled)
   - Shows in Obsidian window
   - Auto-dismisses after a few seconds

### Notification Actions

Every notification has action buttons:

- **Complete**: Mark as done
- **Snooze**: Postpone (opens duration picker)
- **Close/Dismiss**: Close without action

### Re-notifications

For overdue reminders you haven't actioned:

1. Go to **Settings → Reminders**
2. Set **Re-notification interval**:
   - Never (default)
   - 5, 15, 30 minutes
   - 1, 2, 4, 8 hours
   - etc.

You'll be reminded again at these intervals until you complete or snooze the reminder.

## Keyboard Shortcuts

### Default Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Create reminder | `Ctrl+Shift+R` | `Cmd+Shift+R` |
| Create from selection | `Ctrl+Alt+R` | `Cmd+Alt+R` |

### Custom Shortcuts

Set your own shortcuts in **Settings → Hotkeys**:

1. Search for "Reminder"
2. Click the + icon next to any command
3. Press your desired key combination
4. Click outside to save

Available commands:
- Show reminder sidebar
- Create new reminder
- Create reminder from selection

## Quick Tips

### Efficient Workflows

1. **Use text selection** for quick reminder creation from notes
2. **Set default priority** in settings for your most common use case
3. **Use tags** to group related reminders (e.g., "work", "personal", "urgent")
4. **Enable both notifications** for redundancy (system + Obsidian)
5. **Set re-notifications** for critical reminders you can't miss

### Time-Saving Tricks

- **Quick times**: Use the preset time buttons (1h, 2h, Tomorrow, etc.)
- **Bulk delete**: Use the sidebar menu to delete all completed reminders at once
- **Filter views**: Use the filter tabs to focus on what matters now
- **Advanced filters**: Combine tags and priorities to find exactly what you need

### Best Practices

1. **Keep messages clear** - You'll thank yourself when the notification arrives
2. **Use priorities** - Not everything is urgent
3. **Link to notes** - Context helps when the reminder triggers
4. **Review regularly** - Check your upcoming reminders daily
5. **Clean up completed** - Delete old completed reminders periodically

## Common Workflows

### Daily Task Management

1. Morning: Check **Pending** tab for overdue items
2. During day: Create reminders from text selections
3. Evening: Review **Upcoming** tab for tomorrow

### Meeting Reminders

1. Create reminder from meeting note file
2. Set time 15 minutes before meeting
3. Set priority to High
4. Add tags: "meeting", "work"

### Recurring Tasks

For tasks you do regularly:

1. Create the reminder
2. When it triggers, create a new one for next time
3. Complete the current one

**Future feature:** True recurring reminders are on the roadmap!

### Project Deadlines

1. Create reminder for the deadline
2. Link to project note
3. Set priority to Urgent
4. Add tag: project name
5. Enable re-notifications every 2 hours

## Next Steps

Now that you're familiar with the basics:

- [User Guide](user-guide.md) - Comprehensive feature documentation
- [Features](features.md) - Detailed feature explanations
- [Troubleshooting](troubleshooting.md) - Solutions to common issues

## Getting Help

- **Documentation**: Browse the [docs folder](../docs/)
- **Issues**: [Report bugs](https://github.com/gapmiss/reminders/issues)
- **Discussions**: [Ask questions](https://github.com/gapmiss/reminders/discussions)

---

Ready to dive deeper? Check out the [complete user guide](user-guide.md)!

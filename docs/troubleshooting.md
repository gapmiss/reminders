# Troubleshooting Guide

Solutions to common issues with the Obsidian Reminders plugin.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Notification Problems](#notification-problems)
3. [Scheduler Issues](#scheduler-issues)
4. [UI Problems](#ui-problems)
5. [Performance Issues](#performance-issues)
6. [Data Issues](#data-issues)
7. [Compatibility Issues](#compatibility-issues)
8. [Debug Mode](#debug-mode)
9. [Getting Help](#getting-help)

## Installation Issues

### Plugin Not Appearing in Community Plugins

**Symptoms:**
- Can't find "Reminders" when searching
- Plugin not listed in community plugins

**Solutions:**

1. **Check Obsidian Version:**
   ```
   - Open Settings → About
   - Ensure version is 1.1.0 or higher
   - Update Obsidian if needed
   ```

2. **Refresh Plugin List:**
   ```
   - Settings → Community Plugins
   - Click refresh icon
   - Search again
   ```

3. **Check Internet Connection:**
   ```
   - Verify you're online
   - Plugin list requires internet to load
   - Try again after connection restored
   ```

### Plugin Won't Enable

**Symptoms:**
- Toggle switch immediately turns off
- Error message appears
- Plugin not in enabled list

**Solutions:**

1. **Check Console for Errors:**
   ```
   - Press Cmd+Option+I (macOS) or Ctrl+Shift+I (Windows/Linux)
   - Look for red error messages
   - Note any mentioning "reminders"
   ```

2. **Verify File Structure:**
   ```
   YourVault/.obsidian/plugins/reminders/
   ├── main.js          (required)
   ├── manifest.json    (required)
   └── styles.css       (required)
   ```

3. **Check File Permissions:**
   ```
   - Ensure files are readable
   - Check folder permissions
   - On Mac/Linux: chmod -R 755 reminders/
   ```

4. **Reinstall Plugin:**
   ```
   - Disable plugin
   - Delete reminders folder
   - Reinstall from community plugins
   - Enable again
   ```

5. **Check for Conflicts:**
   ```
   - Disable other plugins temporarily
   - Try enabling Reminders
   - If works, enable other plugins one by one
   - Identify conflicting plugin
   ```

### Manual Installation Fails

**Symptoms:**
- Files copied but plugin not appearing
- Wrong folder location

**Solutions:**

1. **Verify Correct Path:**
   ```
   Correct: <vault>/.obsidian/plugins/reminders/
   Wrong: <vault>/plugins/reminders/
   Wrong: <vault>/.obsidian/reminders/
   ```

2. **Check Hidden Folders:**
   ```
   - .obsidian folder is hidden on some systems
   - macOS: Cmd+Shift+. to show hidden files
   - Windows: Show hidden files in Explorer options
   - Linux: Ctrl+H in file manager
   ```

3. **Restart Obsidian:**
   ```
   - Close all Obsidian windows
   - Reopen vault
   - Check Settings → Community Plugins
   ```

## Notification Problems

### System Notifications Not Appearing

**Symptoms:**
- Setting is enabled but no notifications
- Only Obsidian notices work

**Solutions:**

1. **Check OS Permissions:**

   **macOS:**
   ```
   - System Preferences → Notifications
   - Find Obsidian in list
   - Enable notifications
   - Set style to "Alerts" (not "Banners")
   ```

   **Windows 10/11:**
   ```
   - Settings → System → Notifications
   - Find Obsidian in list
   - Ensure notifications are On
   - Check Focus Assist isn't blocking
   ```

   **Linux:**
   ```
   - Depends on notification daemon
   - Check libnotify is installed
   - Test with: notify-send "Test"
   - Check notification settings in DE
   ```

2. **Grant Permissions in Browser (Electron):**
   ```
   - Obsidian may prompt for permission
   - Click "Allow" when prompted
   - If missed, reset in OS settings
   ```

3. **Test Notifications:**
   ```
   - Create a test reminder for 1 minute ahead
   - Wait for notification
   - If none, check console for errors
   ```

4. **Check Notification Settings:**
   ```
   - Settings → Reminders
   - Ensure "Show System Notifications" is ON
   - Try toggling off and on again
   ```

### Obsidian Notices Not Appearing

**Symptoms:**
- System notifications work but not in-app notices

**Solutions:**

1. **Check Setting:**
   ```
   - Settings → Reminders
   - Ensure "Show Obsidian Notices" is ON
   ```

2. **Check Other Plugins:**
   ```
   - Some plugins may interfere with notices
   - Disable other plugins temporarily
   - Test if notices work
   ```

3. **Check Console:**
   ```
   - Open developer console
   - Look for errors related to notifications
   - Report if found
   ```

### Notifications Appearing Multiple Times

**Symptoms:**
- Same reminder notifies multiple times
- Duplicate notifications

**Solutions:**

1. **Check Multiple Instances:**
   ```
   - Close all Obsidian windows
   - Open only one vault
   - Test again
   ```

2. **Check Scheduler:**
   ```
   - Enable debug logging
   - Check console for "duplicate prevented" messages
   - May be a bug if not showing
   ```

3. **Reload Plugin:**
   ```
   - Settings → Community Plugins
   - Toggle Reminders off and on
   - Test again
   ```

### Notifications Not Appearing at Correct Time

**Symptoms:**
- Notifications late or early
- Inconsistent timing

**Solutions:**

1. **Check System Time:**
   ```
   - Verify system clock is correct
   - Check timezone settings
   - Sync time if needed
   ```

2. **Check Reminder Time:**
   ```
   - Open reminder in edit mode
   - Verify date/time is correct
   - Check for AM/PM confusion
   ```

3. **Understand Scheduler Precision:**
   ```
   - Plugin checks every 5-30 seconds
   - Notifications within ±30 seconds is normal
   - Enable debug logging to see check times
   ```

## Scheduler Issues

### Reminders Not Triggering

**Symptoms:**
- Time passes but no notification
- Reminder shows in Pending but didn't notify

**Solutions:**

1. **Enable Debug Logging:**
   ```
   - Settings → Reminders → Debug: ON
   - Open console
   - Watch for scheduler messages
   ```

2. **Check Scheduler Status:**
   ```
   - In console, type:
     app.plugins.plugins.reminders.scheduler.isRunning
   - Should return: true
   - If false, plugin not loaded correctly
   ```

3. **Verify Reminder Data:**
   ```
   - Edit the reminder
   - Check datetime format
   - Should be ISO string: 2025-01-15T14:00:00.000Z
   - If corrupted, recreate reminder
   ```

4. **Reload Plugin:**
   ```
   - Toggle plugin off and on
   - Scheduler restarts
   - Test with new reminder
   ```

5. **Check for Errors:**
   ```
   - Console may show JavaScript errors
   - Note exact error message
   - Report if persistent
   ```

### Re-notifications Not Working

**Symptoms:**
- Interval set but no re-alerts
- Only get first notification

**Solutions:**

1. **Verify Setting:**
   ```
   - Settings → Reminders → Re-notification interval
   - Ensure not set to "Never"
   - Try a short interval for testing (1 minute)
   ```

2. **Check Reminder State:**
   ```
   - Must be overdue (past due time)
   - Must not be completed
   - Must not be snoozed
   ```

3. **Wait for Interval:**
   ```
   - Re-notification after full interval passes
   - If set to 5 minutes, wait 5+ minutes
   - First notification doesn't count
   ```

4. **Enable Debug Logging:**
   ```
   - Watch for "re-notification triggered" messages
   - Check for "skipped" messages and reasons
   ```

## UI Problems

### Sidebar Not Appearing

**Symptoms:**
- Click ribbon icon but nothing happens
- Can't find sidebar

**Solutions:**

1. **Check Sidebar Toggle:**
   ```
   - Ribbon icon toggles sidebar on/off
   - Click again to show if hidden
   - Or use command: "Show reminder sidebar"
   ```

2. **Check Obsidian Layout:**
   ```
   - Sidebar appears in right sidebar by default
   - Check if right sidebar is collapsed
   - Expand sidebar area
   ```

3. **Reload Obsidian:**
   ```
   - Cmd/Ctrl+R to reload
   - Or restart Obsidian
   ```

### Sidebar Not Updating

**Symptoms:**
- Create reminder but doesn't appear
- Times don't update
- Stale data

**Solutions:**

1. **Manual Refresh:**
   ```
   - Click refresh button (↻) in sidebar header
   - Should reload all data
   ```

2. **Check Auto-Update:**
   ```
   - Should auto-refresh every 5 seconds
   - If not, JavaScript error may have occurred
   - Check console for errors
   ```

3. **Reload Plugin:**
   ```
   - Toggle plugin off and on
   - Reopens sidebar fresh
   ```

### Filter Menu Not Opening

**Symptoms:**
- Click "All" tab but menu doesn't open
- Can't access filters

**Solutions:**

1. **Ensure On All Tab:**
   ```
   - Must be on "All" tab first
   - Then click "All" again
   - Should toggle menu
   ```

2. **Check for Errors:**
   ```
   - Console may show errors
   - Try clicking different spots on tab
   ```

3. **Reload Sidebar:**
   ```
   - Close and reopen sidebar
   - Try again
   ```

### Reminder Actions Not Working

**Symptoms:**
- Click checkbox but nothing happens
- Edit/delete/snooze not working

**Solutions:**

1. **Check for Errors:**
   ```
   - Open console
   - Try action again
   - Note any error messages
   ```

2. **Reload Plugin:**
   ```
   - Toggle off and on
   - Actions should work
   ```

3. **Check Reminder State:**
   ```
   - Some actions only available in certain states
   - Snooze: only for overdue reminders
   - Can't snooze future/completed reminders
   ```

## Performance Issues

### Sidebar Slow/Laggy

**Symptoms:**
- Sidebar takes time to load
- Scrolling is choppy
- UI feels sluggish

**Solutions:**

1. **Check Reminder Count:**
   ```
   - View statistics panel
   - If >1000 reminders, consider cleanup
   - Delete completed reminders
   ```

2. **Clear Completed Reminders:**
   ```
   - Sidebar menu (⋯) → Delete completed
   - Reduces data to render
   - Improves performance
   ```

3. **Check System Resources:**
   ```
   - Close other applications
   - Check CPU/memory usage
   - Restart Obsidian if high
   ```

4. **Disable Other Plugins:**
   ```
   - Temporarily disable other plugins
   - Check if performance improves
   - Identify conflicting plugin
   ```

### High CPU Usage

**Symptoms:**
- Fan running constantly
- Battery draining quickly
- System slow when Obsidian open

**Solutions:**

1. **Check Scheduler Interval:**
   ```
   - Should be 5-30 seconds normally
   - Enable debug logging to verify
   - If checking too frequently, report bug
   ```

2. **Reduce Re-notification Frequency:**
   ```
   - If set to very short interval (30s)
   - Change to longer or Never
   - Test if CPU usage drops
   ```

3. **Check for Errors:**
   ```
   - Console errors in loops can cause high CPU
   - Look for repeating error messages
   - Report if found
   ```

## Data Issues

### Reminders Disappeared

**Symptoms:**
- All reminders gone
- Sidebar empty
- Statistics show 0

**Solutions:**

1. **Check Filter View:**
   ```
   - Switch to "All" tab
   - Clear any active filters
   - Check if reminders visible
   ```

2. **Check Data File:**
   ```
   - File: <vault>/.obsidian/plugins/reminders/data.json
   - Should contain reminder data
   - If empty, data was lost
   - Check backups
   ```

3. **Restore from Backup:**
   ```
   - Obsidian may have backups
   - Check: <vault>/.obsidian/plugins/reminders/
   - Look for data.json.bak or similar
   - Restore if found
   ```

4. **File Sync Issues:**
   ```
   - If using sync (Dropbox, iCloud, Obsidian Sync)
   - Check for sync conflicts
   - May need to resolve manually
   ```

### Reminder Data Corrupted

**Symptoms:**
- Strange characters in messages
- Invalid dates
- Plugin won't load

**Solutions:**

1. **Check Data File:**
   ```
   - Open: <vault>/.obsidian/plugins/reminders/data.json
   - Verify it's valid JSON
   - Use JSON validator online
   ```

2. **Manual Repair:**
   ```
   - Backup data.json first
   - Fix JSON syntax errors
   - Ensure proper formatting
   - Save and reload plugin
   ```

3. **Reset Data:**
   ```
   - Last resort only
   - Backup data.json
   - Delete data.json
   - Reload plugin (creates fresh file)
   - Manually recreate important reminders
   ```

### Tags Not Saving

**Symptoms:**
- Enter tags but they don't save
- Tags disappear after edit

**Solutions:**

1. **Check Format:**
   ```
   Correct: work, urgent, meeting
   Incorrect: #work #urgent (hashtags not needed)
   ```

2. **Click Update/Create:**
   ```
   - Changes only save when form submitted
   - Ensure you click Update/Create button
   - Cancel discards changes
   ```

3. **Check Console:**
   ```
   - May show validation errors
   - Fix any reported issues
   ```

## Compatibility Issues

### Conflicts with Other Plugins

**Symptoms:**
- Both plugins work alone
- Issues when both enabled

**Solutions:**

1. **Identify Conflict:**
   ```
   - Disable all plugins except Reminders
   - Test if works
   - Enable other plugins one by one
   - Note which causes issue
   ```

2. **Check Console:**
   ```
   - May show errors about conflicting code
   - Note plugin names mentioned
   - Report conflict
   ```

3. **Load Order:**
   ```
   - Try disabling and re-enabling plugins
   - Changes load order
   - May resolve conflict
   ```

### Theme Compatibility

**Symptoms:**
- Sidebar looks broken
- Colors wrong
- Text unreadable

**Solutions:**

1. **Switch to Default Theme:**
   ```
   - Settings → Appearance → Theme
   - Select default theme
   - If fixes issue, theme incompatibility
   ```

2. **Check CSS Snippets:**
   ```
   - Disable custom CSS snippets
   - Test if issue resolved
   - Identify problematic snippet
   ```

3. **Report to Theme Author:**
   ```
   - Note theme name and version
   - Describe issue
   - Include screenshots
   - Report to theme author
   ```

### Mobile Issues

**Symptoms:**
- Doesn't work well on mobile
- UI problems on phone/tablet

**Solutions:**

1. **Check Obsidian Mobile Version:**
   ```
   - Ensure updated to latest
   - Plugin requires mobile support
   ```

2. **Note Limitations:**
   ```
   - System notifications may not work on mobile
   - Some gestures may differ
   - Use Obsidian notices on mobile
   ```

3. **Report Mobile-Specific Issues:**
   ```
   - Note device and OS version
   - Describe issue
   - Include what works on desktop but not mobile
   ```

## Debug Mode

### Enabling Debug Mode

1. **Open Settings:**
   ```
   Settings → Community Plugins → Reminders
   ```

2. **Toggle Debug:**
   ```
   Debug: ON
   ```

3. **Open Console:**
   ```
   Cmd+Option+I (macOS)
   Ctrl+Shift+I (Windows/Linux)
   ```

### What Debug Mode Shows

**Scheduler Activity:**
```
[Reminders] Scheduler check at 14:23:45
[Reminders] Next reminder due in 2 hours
[Reminders] Using normal check interval (30s)
```

**Notification Triggers:**
```
[Reminders] Reminder due: "Buy groceries"
[Reminders] Showing system notification
[Reminders] Showing Obsidian notice
```

**Data Operations:**
```
[Reminders] Creating reminder: "Call dentist"
[Reminders] Updating reminder: abc123
[Reminders] Deleting reminder: xyz789
```

**Errors:**
```
[Reminders] ERROR: Invalid date format
[Reminders] ERROR: Reminder not found: abc123
```

### Collecting Debug Information

For bug reports, include:

1. **Console Output:**
   ```
   - Copy relevant log messages
   - Include errors (red text)
   - Include 20-30 lines of context
   ```

2. **Plugin Version:**
   ```
   - Settings → Community Plugins → Reminders
   - Note version number
   ```

3. **Obsidian Version:**
   ```
   - Settings → About
   - Note version number
   ```

4. **Operating System:**
   ```
   - macOS (version)
   - Windows (version)
   - Linux (distribution and version)
   ```

5. **Steps to Reproduce:**
   ```
   - Exact steps that cause issue
   - Expected behavior
   - Actual behavior
   ```

## Getting Help

### Before Asking for Help

1. **Check This Guide:**
   - Review relevant sections
   - Try suggested solutions
   - Note what you've tried

2. **Search Existing Issues:**
   - [GitHub Issues](https://github.com/gapmiss/reminders/issues)
   - Someone may have reported same issue
   - Check closed issues too

3. **Gather Information:**
   - Plugin version
   - Obsidian version
   - Operating system
   - Console errors
   - Steps to reproduce

### Where to Get Help

**GitHub Issues:**
- Report bugs
- Request features
- Track progress
- [Open an issue](https://github.com/gapmiss/reminders/issues/new)

**GitHub Discussions:**
- Ask questions
- Share tips
- Community help
- [Start a discussion](https://github.com/gapmiss/reminders/discussions)

**Obsidian Forum:**
- Plugin Help category
- Community support
- [Obsidian Forum](https://forum.obsidian.md/)

### Writing a Good Bug Report

Include:

1. **Clear Title:**
   ```
   Good: "Notifications not appearing on Windows 11"
   Bad: "It doesn't work"
   ```

2. **Environment:**
   ```
   - Plugin version: 1.0.0
   - Obsidian version: 1.4.0
   - OS: Windows 11 22H2
   - Debug mode: Enabled
   ```

3. **Steps to Reproduce:**
   ```
   1. Create a reminder for 1 minute ahead
   2. Wait for notification
   3. No notification appears
   ```

4. **Expected Behavior:**
   ```
   Should show system notification and Obsidian notice
   ```

5. **Actual Behavior:**
   ```
   No notifications appear, but reminder moves to Pending tab
   ```

6. **Console Output:**
   ```
   [Paste relevant console errors]
   ```

7. **Screenshots:**
   ```
   If UI issue, include screenshots
   ```

### Feature Requests

When requesting features:

1. **Describe Use Case:**
   ```
   "I need recurring reminders because I have daily standup meetings"
   ```

2. **Proposed Solution:**
   ```
   "Add a 'Repeat' option with daily/weekly/monthly patterns"
   ```

3. **Alternatives:**
   ```
   "Currently I create 7 reminders manually each week"
   ```

4. **Benefit:**
   ```
   "Would save time and reduce manual work for recurring tasks"
   ```

---

Still having issues? [Open a GitHub issue](https://github.com/gapmiss/reminders/issues/new) with detailed information.

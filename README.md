# Obsidian Reminders

> Never miss a deadline, meeting, or important task again. A powerful, flexible reminder system that integrates seamlessly with your Obsidian workflow.

[![GitHub release](https://img.shields.io/github/v/release/gapmiss/reminders?style=flat-square)](https://github.com/gapmiss/reminders/releases)
[![License](https://img.shields.io/github/license/gapmiss/reminders?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-226%20passing-brightgreen?style=flat-square)](tests/)

---

## ✨ What is Obsidian Reminders?

Obsidian Reminders is a comprehensive reminder management plugin for [Obsidian.md](https://obsidian.md) that brings time-based notifications directly into your note-taking workflow. Create reminders from your notes, organize them with tags and priorities, and receive notifications through multiple channels—all without leaving Obsidian.

### Why Use This Plugin?

- 🎯 **Context-Aware**: Create reminders from text selections and automatically link them to your notes
- 🏷️ **Flexible Organization**: Use multiple tags and four priority levels to organize reminders your way
- 🔔 **Reliable Notifications**: Dual notification system (system + in-app) ensures you never miss important reminders
- ⚡ **Lightning Fast**: Built with performance in mind, with adaptive scheduling and efficient rendering
- 🔍 **Advanced Filtering**: Powerful filtering system to find exactly what you need
- 🎨 **Beautiful UI**: Clean, intuitive interface that fits naturally into Obsidian
- 🔒 **Privacy First**: All data stored locally, no external services or tracking

---

## 🚀 Quick Start

### Installation

#### From Obsidian (Recommended)

1. Open **Settings** → **Community Plugins**
2. Disable **Safe Mode** if needed
3. Click **Browse** and search for **"Reminders"**
4. Click **Install**, then **Enable**

#### Manual Installation

Download the [latest release](https://github.com/gapmiss/reminders/releases) and extract to `<vault>/.obsidian/plugins/reminders/`

📖 **Detailed instructions:** [Installation Guide](docs/installation.md)

### Your First Reminder

1. Click the bell icon (🔔) in the left ribbon
2. Fill in your reminder:
   - **Message**: "Team standup meeting"
   - **Time**: Tomorrow at 9:00 AM
   - **Priority**: High
   - **Tags**: work, meeting
3. Click **Create Reminder**

🎓 **Learn more:** [Quick Start Guide](docs/quick-start.md)

---

## 🎯 Key Features

### Multiple Creation Methods

- **Ribbon icon**: Single-click access
- **Keyboard shortcuts**: `Cmd/Ctrl+Shift+R` to create, `Cmd/Ctrl+Alt+R` from selection
- **Context menus**: Right-click in editor or file explorer
- **Text selection**: Highlight text and create a reminder with automatic linking

### Powerful Organization

- **Multi-tag system**: Organize with multiple tags per reminder (e.g., "work, urgent, meeting")
- **Priority levels**: 🔴 Urgent, 🟡 High, ⚪ Normal, 🔵 Low
- **Advanced filtering**: Filter by tags and/or priority with OR logic
- **Note linking**: Automatically link reminders to specific notes and line numbers

### Smart Notifications

- **Dual channels**: System notifications + Obsidian in-app notices
- **Re-notifications**: Configurable intervals for overdue reminders (never miss critical tasks)
- **Interactive actions**: Complete, snooze, or dismiss directly from notifications
- **Precise timing**: Adaptive scheduler checks every 5-30 seconds for accuracy

### Flexible Views

- **Pending**: Overdue reminders needing attention
- **Upcoming**: Future reminders on the horizon
- **Snoozed**: Postponed reminders
- **Done**: Completed reminders
- **All**: Everything, with advanced tag/priority filtering

### Time Management

- **Smart snoozing**: Preset durations from 5 minutes to 24 hours
- **Quick time buttons**: Set reminders for 1h, 2h, tomorrow, or next week with one click
- **Relative time display**: See "in 2 hours" or "3 days ago" at a glance
- **Bulk operations**: Delete all completed reminders at once

📚 **Explore all features:** [Complete Feature List](docs/features.md)

---

## 📖 Documentation

### For Users

- **[Quick Start Guide](docs/quick-start.md)** - Get up and running in 5 minutes
- **[User Guide](docs/user-guide.md)** - Complete usage documentation
- **[Features](docs/features.md)** - Detailed feature explanations
- **[Installation](docs/installation.md)** - Installation methods and troubleshooting
- **[Troubleshooting](docs/troubleshooting.md)** - Solutions to common issues

### For Developers

- **[Developer Guide](docs/developer-guide.md)** - Architecture, APIs, and contributing
- **[CLAUDE.md](CLAUDE.md)** - Internal architecture documentation
- **[CHANGELOG](docs/CHANGELOG.md)** - Version history and release notes

---

## ⚡ At a Glance

### Creating Reminders

```
📝 From text selection
Select "Call dentist tomorrow" → Cmd/Ctrl+Alt+R → Reminder created with context

🎯 From file explorer
Right-click note → "Create reminder for this note" → Linked reminder

⌨️ From keyboard
Cmd/Ctrl+Shift+R → Quick creation modal
```

### Managing Reminders

```
✓ Complete: Click checkbox or notification button
⏰ Snooze: Choose from presets or custom duration
✏️ Edit: Change any field, non-destructive editing
🗑️ Delete: With confirmation to prevent accidents
```

### Organizing Reminders

```
🏷️ Tags: work, urgent, meeting, personal
⚡ Priorities: Urgent, High, Normal, Low
🔍 Filters: Combine tags and priorities with OR logic
📊 Statistics: Real-time counts of all reminder states
```

---

## 🎓 Usage Examples

### Daily Task Management

Create a reminder from your daily note:
```markdown
1. Review pull requests
2. Team standup at 9 AM ← Select this text
3. Lunch with client at 12 PM
```
Select text → `Cmd/Ctrl+Alt+R` → Set time → Tagged with "work, meeting"

### Project Deadlines

1. Right-click project note in file explorer
2. "Create reminder for this note"
3. Set deadline with Urgent priority
4. Tag with project name
5. Enable re-notifications every 2 hours

### Weekly Review

Filter view:
1. Switch to "All" tab
2. Click "All" again to open filters
3. Select "work" tag + High priority
4. Review and update as needed

---

## ⚙️ Settings

Access via **Settings → Reminders**

### Notification Options

- **System Notifications**: OS-level notifications (recommended: ON)
- **Obsidian Notices**: In-app popups (recommended: ON)
- **Re-notification Interval**: How often to re-alert for overdue reminders

### Defaults

- **Default Priority**: Priority level for new reminders (Normal, Low, High, Urgent)

### Debug

- **Debug Mode**: Enable console logging for troubleshooting

---

## 🎨 Screenshots

### Sidebar View with Filters
```
┌─────────────────────────────────────┐
│ 🔔 Reminders              [⋯] [↻] │
├─────────────────────────────────────┤
│ 📊 Statistics                       │
│ • 3 pending • 5 upcoming            │
│ • 2 snoozed • 12 completed          │
├─────────────────────────────────────┤
│ [Pending] [Upcoming] [Done] [All▼] │
├─────────────────────────────────────┤
│ ☐ Team standup meeting              │
│   Tomorrow at 9:00 AM (in 14h)      │
│   🏷️ work • meeting  ⚡ high       │
│   [...] Edit • Snooze • Delete      │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

This plugin includes a comprehensive automated test suite:

```bash
# Run all tests (226 tests)
npm test

# Run tests with coverage (~60% overall)
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

**Coverage highlights:**
- ✅ 100% coverage on date utilities and constants
- ✅ 94% coverage on error handling
- ✅ 68% coverage on data manager
- ✅ Comprehensive testing of business logic

Manual testing checklist available in [User Guide](docs/user-guide.md#manual-testing-checklist).

---

## 🗺️ Roadmap

### Coming Soon (v1.1.0)

- 🔄 Recurring reminders (daily, weekly, monthly)
- 📋 Reminder templates
- 📆 Calendar view integration
- 🗣️ Natural language date input

### Under Consideration

- 🔍 Full-text search
- 📤 Export/import functionality
- 🔗 Reminder dependencies and chains
- 📱 Enhanced mobile support
- 🌐 Integration with calendar plugins

### Completed

- ✅ Multi-tag support
- ✅ Advanced filtering system
- ✅ Re-notification system
- ✅ Comprehensive test suite (226 tests)
- ✅ Bulk operations

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 💻 Code contributions
- 🎨 UI/UX suggestions

**Get started:**

1. Read the [Developer Guide](docs/developer-guide.md)
2. Check [existing issues](https://github.com/gapmiss/reminders/issues)
3. Fork, create a feature branch, and submit a PR

**Development setup:**

```bash
git clone https://github.com/YOUR_USERNAME/reminders.git
cd reminders
npm install
npm run dev  # Watch mode
```

📖 **Full details:** [Developer Guide](docs/developer-guide.md#contributing)

---

## 📊 Project Stats

- **226** automated tests
- **~60%** code coverage
- **1.0.0** current version
- **MIT** licensed
- **TypeScript** + **date-fns** + **Vitest**

---

## 🐛 Troubleshooting

### Common Issues

**Notifications not showing?**
- Check Settings → Reminders → Enable both notification types
- Verify OS notification permissions for Obsidian
- [Full troubleshooting guide](docs/troubleshooting.md#notification-problems)

**Reminders not triggering?**
- Enable debug mode and check console
- Verify datetime is in the future
- [Scheduler troubleshooting](docs/troubleshooting.md#scheduler-issues)

**UI not updating?**
- Click the refresh button (↻) in sidebar
- Toggle plugin off/on in settings
- [UI troubleshooting](docs/troubleshooting.md#ui-problems)

📖 **More help:** [Complete Troubleshooting Guide](docs/troubleshooting.md)

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built for [Obsidian.md](https://obsidian.md/)
- Powered by [date-fns](https://date-fns.org/) for reliable date handling
- Tested with [Vitest](https://vitest.dev/)
- Inspired by the Obsidian community's need for integrated reminder management

---

## 📞 Support & Community

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/gapmiss/reminders/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/gapmiss/reminders/discussions)
- **📖 Documentation**: [docs/](docs/)
- **📧 Contact**: [@gapmiss](https://github.com/gapmiss)

---

## ⭐ Show Your Support

If you find this plugin useful, please:

- ⭐ Star this repository
- 🐛 Report bugs and suggest features
- 📢 Share with other Obsidian users
- 💖 Consider [sponsoring development](https://github.com/sponsors/gapmiss)

---

<div align="center">

**Made with ❤️ for the Obsidian community**

[Documentation](docs/) • [Issues](https://github.com/gapmiss/reminders/issues) • [Discussions](https://github.com/gapmiss/reminders/discussions) • [Changelog](docs/CHANGELOG.md)

</div>

# Changelog

All notable changes to the Obsidian Reminders plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-14

### Added

#### Core Features
- **Multi-tag support**: Replaced single category with multiple tags
  - Comma-separated input format (e.g., "work, urgent, meeting")
  - Case-insensitive storage (all tags normalized to lowercase)
  - Badge display in reminder list
  - Tag filtering capabilities

- **Advanced filtering system** on "All" tab:
  - Interactive filter menu (click active "All" tab to open)
  - Filter by tags with OR logic
  - Filter by priority with OR logic
  - Combined tag/priority filtering
  - Visual indicators: chevron icon for menu available, filter-x icon when filters active
  - Active filters shown in tab label (e.g., "All • work • urgent")
  - Checkmark indicators for selected filters

- **Re-notification system**:
  - Configurable intervals for overdue reminders
  - Options: Never, 30s, 1m, 2m, 5m, 10m, 15m, 30m, 1h, 2h, 4h, 8h, 12h, 24h
  - Testing-friendly short intervals (30s, 1m, 2m)
  - Practical intervals for workflows (5m-30m)
  - Extended intervals for long-term reminders (2h-24h)

- **Bulk operations**:
  - Delete all completed reminders
  - Delete all reminders with confirmation
  - Accessible via sidebar header menu

- **Expanded snooze intervals**:
  - Added 30 seconds, 1 minute, 2 minutes for testing
  - Full range: 30s to 24 hours

- **Comprehensive test suite**:
  - 226 automated tests
  - ~60% overall code coverage
  - 100% coverage on date utilities and constants
  - 94% coverage on error handling
  - Comprehensive testing of core business logic

#### Developer Features
- Complete TypeScript type definitions
- Extensive JSDoc documentation
- Error recovery utilities
- Comprehensive developer documentation

### Changed

#### Improvements
- **Date handling**: Migrated from moment.js to date-fns
  - Better performance and smaller bundle size
  - More tree-shakeable and modular
  - Better TypeScript support

- **Enhanced date validation**:
  - All date formatting operations include validation
  - Graceful fallbacks for invalid dates
  - Prevents "Invalid time value" errors
  - Shows meaningful fallback text instead of crashes

- **Non-destructive editing**:
  - Reminder modal uses two-layer data approach
  - Original data unchanged until form submission
  - Canceling preserves all original data
  - Safer user experience

- **Improved scheduler logic**:
  - Fixed re-notification blocking after first notification
  - Enhanced timing logic for first vs re-notification
  - More precise time calculations using date-fns
  - Separate validation logic for re-notifications

- **Better error handling**:
  - ReminderTimeUpdater handles invalid dates gracefully
  - All components more resilient to edge cases
  - Better error messages
  - Runtime stability improvements

- **Header button improvements**:
  - Better visual design
  - Improved accessibility
  - Clearer action indicators

- **UI/UX enhancements**:
  - Priority icons in filter menu (🔴 🟡 ⚪ 🔵)
  - Usage counts shown for tags and priorities
  - Better visual feedback for active filters
  - Improved ellipsis menu positioning

### Fixed

#### Critical Bugs
- **Re-notification blocking**: Fixed critical bug where re-notifications were blocked by processedReminders Set after first notification
- **Completion errors**: Fixed "Invalid time value" errors when completing snoozed reminders
- **Date validation**: Fixed edge cases where invalid dates caused runtime crashes
- **Scheduler timing**: Improved precision and reliability of notification timing

#### Minor Bugs
- Ellipsis menu positioning for keyboard activation
- Date formatting edge cases
- Form validation consistency
- Tag normalization consistency

### Developer

#### Testing
- Added vitest test framework
- Comprehensive unit tests for all utilities
- Integration tests for data manager
- Test coverage reporting
- Test documentation

#### Documentation
- Complete user guide
- Developer guide
- API documentation
- Troubleshooting guide
- Feature documentation
- Installation guide
- Quick start guide

#### Architecture
- Improved data manager structure
- Better separation of concerns
- Enhanced type safety
- Cleaner error handling patterns

### Security
- All data stored locally (no external API calls)
- Input validation on all forms
- Safe HTML rendering
- No code injection vulnerabilities

## [0.9.0] - 2024-12-15 (Pre-release)

### Added
- Initial beta release
- Core reminder functionality
- System and Obsidian notifications
- Priority system (low, normal, high, urgent)
- Single category support
- Snooze functionality
- Note linking
- Sidebar view with filter tabs
- Context menu integration
- Keyboard shortcuts

### Known Issues
- Single category limitation (fixed in 1.0.0)
- Re-notification not working reliably (fixed in 1.0.0)
- Date validation edge cases (fixed in 1.0.0)

---

## Release Types

### Major (X.0.0)
Breaking changes that require user action:
- Data model changes requiring migration
- API changes for other plugins
- Major feature removals
- Significant behavior changes

### Minor (0.X.0)
New features, backward compatible:
- New functionality
- New settings
- UI improvements
- Non-breaking enhancements

### Patch (0.0.X)
Bug fixes and minor improvements:
- Bug fixes
- Performance improvements
- Documentation updates
- Minor UI tweaks

---

## Upgrade Notes

### Upgrading to 1.0.0

#### Breaking Changes
None - fully backward compatible with 0.9.x

#### Data Migration
- Existing `category` field automatically migrated to `tags` array
- No user action required
- Data migration happens automatically on plugin load

#### New Features Available
- Set default priority in settings
- Configure re-notification interval
- Use advanced filtering on "All" tab
- Bulk delete operations
- Multiple tags per reminder

#### Recommended Actions
1. Update plugin via Community Plugins
2. Review new settings (Settings → Reminders)
3. Explore advanced filtering (click "All" tab twice)
4. Try multi-tag organization for existing reminders

### Future Deprecations
No features currently planned for deprecation.

---

## Roadmap

### Planned for 1.1.0
- Recurring reminders (daily, weekly, monthly patterns)
- Reminder templates
- Natural language date input
- Calendar view

### Under Consideration
- Full-text search
- Export/import functionality
- Integration with calendar plugins
- Reminder dependencies
- Voice input support
- Mobile app optimization

### Long-term Goals
- Plugin API for other plugins
- Advanced statistics and insights
- Reminder sharing (between vaults)
- Smart suggestions based on usage
- Integration with task plugins

---

## Contributing

We welcome contributions! See our [Developer Guide](developer-guide.md) for details on:
- Setting up development environment
- Code style guidelines
- Testing requirements
- Commit message format
- Pull request process

Report bugs and request features on [GitHub Issues](https://github.com/gapmiss/reminders/issues).

---

**Legend:**
- `Added`: New features
- `Changed`: Changes to existing functionality
- `Deprecated`: Soon-to-be removed features
- `Removed`: Removed features
- `Fixed`: Bug fixes
- `Security`: Security improvements

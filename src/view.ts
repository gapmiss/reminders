import { ItemView, WorkspaceLeaf, Notice, Setting, setIcon } from "obsidian";
import ReminderPlugin from "./main";
import { Reminder } from "./modals/reminderModal";
import { SnoozeSuggestModal } from "./modals/snoozeSuggestModal";
import { ConfirmDeleteModal } from "./modals/confirmDeleteModal";
import { ReminderTimeUpdater } from "./managers/reminderDataManager";

/**
 * Sidebar view component that displays reminders in Obsidian's interface.
 * This extends ItemView, which is Obsidian's base class for creating custom panels.
 *
 * Key features:
 * - Shows reminders in different filtered views (pending, upcoming, snoozed, etc.)
 * - Provides interactive controls for completing, editing, snoozing, and deleting reminders
 * - Auto-updates time displays to keep "5 minutes ago" text current
 * - Integrates with the main plugin for all reminder operations
 */
export class ReminderSidebarView extends ItemView {
    private plugin: ReminderPlugin;                    // Reference to main plugin for accessing data and methods
    private currentFilter: 'pending' | 'snoozed' | 'upcoming' | 'all' | 'completed' = 'pending';  // Currently selected filter tab
    private reminderUpdater: ReminderTimeUpdater;     // Service that updates relative time displays ("5 minutes ago")

    /**
     * Constructor for the sidebar view.
     *
     * @param leaf - The workspace leaf (panel) where this view will be displayed
     * @param plugin - Reference to the main plugin instance for accessing data and methods
     */
    constructor(leaf: WorkspaceLeaf, plugin: ReminderPlugin) {
        // Call the parent ItemView constructor with the leaf
        super(leaf);
        // Store plugin reference for later use
        this.plugin = plugin;
    }

    /**
     * Returns the unique identifier for this view type.
     * Obsidian uses this to register and manage the view.
     */
    getViewType(): string {
        return 'reminder-sidebar';
    }

    /**
     * Returns the display name shown in the view's tab.
     */
    getDisplayText(): string {
        return 'Reminders';
    }

    /**
     * Returns the icon displayed in the view's tab and ribbon.
     * Uses Obsidian's built-in concierge-bell icon.
     */
    getIcon(): string {
        return 'concierge-bell';
    }

    /**
     * Called when the view is opened/displayed.
     * Sets up the time updater and renders the initial content.
     */
    async onOpen() {
        // Initialize the time updater service that keeps relative times current
        this.reminderUpdater = new ReminderTimeUpdater();
        // Render the initial view content
        this.render();
    }

    /**
     * Called when the view is closed/hidden.
     * Performs cleanup to prevent memory leaks.
     */
    async onClose() {
        // Stop the time updater to prevent it from running when view is closed
        this.reminderUpdater.destroy();
    }

    /**
     * Main render method that builds the entire sidebar interface.
     * This method is called whenever the view needs to be refreshed.
     */
    render() {
        // Clear any existing content
        this.contentEl.empty();
        // Add CSS class for styling
        this.contentEl.addClass('reminder-sidebar');

        // Build the UI components in order from top to bottom
        this.createHeader();      // Title and action buttons
        this.createFilterTabs();  // Tabs for filtering reminders
        this.createStats();       // Summary statistics
        this.createReminderList(); // List of actual reminders
    }

    /**
     * Creates the header section with title and action buttons.
     * This appears at the top of the sidebar.
     */
    private createHeader() {
        // Create container for the header
        const headerEl = this.contentEl.createDiv({ cls: 'reminder-sidebar-header' });

        // Add the main title
        headerEl.createEl('h3', { text: 'Reminders' });

        // Create container for action buttons
        const actionsEl = headerEl.createDiv({ cls: 'reminder-actions' });

        // "+ New" button for creating reminders
        const newBtn = actionsEl.createEl('button', {
            text: '+ New',
            cls: 'mod-cta'  // Obsidian's call-to-action button style
        });
        newBtn.addEventListener('click', () => {
            // Open the reminder creation modal
            this.plugin.openReminderModal();
        });

        // Refresh button to manually reload the view
        const refreshBtn = actionsEl.createEl('button', { text: '↻' });
        setIcon(refreshBtn, 'rotate-ccw');  // Use Obsidian's refresh icon
        refreshBtn.addEventListener('click', () => {
            // Re-render the entire view to get latest data
            this.render();
        });
    }

    /**
     * Creates the filter tabs that allow users to switch between different views.
     * Each tab shows a different subset of reminders (pending, upcoming, etc.).
     */
    private createFilterTabs() {
        // Create container for the tab buttons
        const tabsEl = this.contentEl.createDiv({ cls: 'reminder-filter-tabs' });

        // Define all available filter options with their display properties
        const filters = [
            { key: 'pending', label: 'Pending', icon: 'hourglass' },        // 1. Most urgent - what needs attention now
            { key: 'upcoming', label: 'Upcoming', icon: 'arrow-up-right' }, // 2. Next priority - what's coming up
            { key: 'snoozed', label: 'Snoozed', icon: 'bell-off' },     // 3. Temporarily hidden items
            { key: 'completed', label: 'Done', icon: 'check-circle' }, // 4. Recently finished (for reference)
            { key: 'all', label: 'All', icon: 'filter' }              // 5. Complete overview (least frequent)
        ];

        // Create a button for each filter option
        filters.forEach(filter => {
            const tab = tabsEl.createEl('button', {
                // Apply 'active' class to currently selected filter
                cls: `filter-tab ${this.currentFilter === filter.key ? 'active' : ''}`,
                attr: { 'data-tooltip-position': 'top', 'aria-label': filter.label }
            });

            // Add icon to the tab
            let iconSpan = tab.createSpan('filter-icon');
            setIcon(iconSpan, filter.icon);

            // Add text label to the tab
            tab.createSpan({ text: filter.label, cls: 'filter-label' });

            // Handle tab clicks
            tab.addEventListener('click', () => {
                // Update the current filter
                this.currentFilter = filter.key as any;
                // Re-render to show the new filtered view
                this.render();
            });
        });
    }

    /**
     * Creates the statistics section showing summary counts.
     * This gives users a quick overview of their reminder status.
     */
    private createStats() {
        // Get current statistics from the data manager
        const stats = this.plugin.dataManager.getStatistics();
        // Create container for statistics display
        const statsEl = this.contentEl.createDiv({ cls: 'reminder-stats' });

        // Define which statistics to show and their styling
        const statItems = [
            { label: 'Overdue', value: stats.overdue, cls: `overdue${stats.overdue > 0 ? ' warning' : ''}` },  // Highlight overdue items
            { label: 'Snoozed', value: stats.snoozed, cls: 'snoozed' },
            { label: 'Today', value: stats.upcoming24h, cls: 'today' },    // Reminders due in next 24 hours
            { label: 'Total', value: stats.total, cls: 'total' }           // Total count of all reminders
        ];

        // Create a display box for each statistic
        statItems.forEach(item => {
            const statEl = statsEl.createDiv({ cls: `reminder-stat ${item.cls}` });
            // Large number display
            statEl.createDiv({ text: item.value.toString(), cls: 'stat-value' });
            // Descriptive label below the number
            statEl.createDiv({ text: item.label, cls: 'stat-label' });
        });
    }

    /**
     * Creates the main list of reminders based on the current filter.
     * This is the core content area of the sidebar.
     */
    private createReminderList() {
        // Create container for the reminder list
        const listEl = this.contentEl.createDiv({ cls: 'reminder-list' });

        // Get reminders that match the current filter
        let reminders = this.getFilteredReminders();

        // Show empty state if no reminders match the filter
        if (reminders.length === 0) {
            listEl.createDiv({
                text: 'No reminders found',
                cls: 'reminder-empty-state'
            });
            return;
        }

        // Create a UI item for each reminder
        reminders.forEach(reminder => {
            this.createReminderItem(listEl, reminder);
        });
    }

    /**
     * Creates a single reminder item in the list.
     * Each item shows the reminder details and provides interactive controls.
     *
     * @param container - The parent element to add this reminder item to
     * @param reminder - The reminder data to display
     */
    private createReminderItem(container: HTMLElement, reminder: Reminder) {
        // Create the main container for this reminder item
        // CSS classes help with styling and indicate the reminder's state
        const itemEl = container.createDiv({
            cls: `reminder-item priority-${reminder.priority} ${reminder.completed ? 'completed' : ''} ${reminder.snoozedUntil ? 'snoozed' : ''}`
        });

        // Add a completion toggle checkbox using Obsidian's Setting component
        new Setting(itemEl)
            .addToggle(toggle => toggle
                .setValue(reminder.completed)  // Set initial state
                .onChange(async (value) => {
                    if (value) {
                        // User checked the box - mark reminder as complete
                        await this.plugin.dataManager.completeReminder(reminder.id);
                        new Notice('✅ Reminder completed');
                    } else {
                        // User unchecked the box - mark reminder as incomplete
                        await this.plugin.dataManager.updateReminder(reminder.id, {
                            completed: false,
                            completedAt: undefined
                        });
                    }
                    // Refresh the view to reflect the change
                    this.render();
                })
            );

        // Create the main content area for reminder details
        const contentEl = itemEl.createDiv({ cls: 'reminder-content' });

        // Display the reminder message (main text)
        const messageEl = contentEl.createDiv({
            text: reminder.message,
            cls: 'reminder-message'
        });

        // Create container for metadata (time, category, source note, etc.)
        const metaEl = contentEl.createDiv({ cls: 'reminder-meta' });

        // Display the reminder time in both absolute and relative formats
        const timeStr = window.moment(reminder.datetime).format('MMM D, h:mm A');  // "Jan 15, 2:30 PM"
        const relativeTime = window.moment(reminder.datetime).fromNow();           // "5 minutes ago"
        const timeSpan = metaEl.createSpan({ cls: 'time-span', text: `${timeStr} (${relativeTime})` });
        // Register this element for automatic time updates
        this.reminderUpdater.addReminder(reminder, timeSpan);

        // If reminder is snoozed, show when it will reappear
        if (reminder.snoozedUntil) {
            const snoozeRelativeTime = window.moment(reminder.snoozedUntil).fromNow();
            const snoozeUntil = `${window.moment(reminder.snoozedUntil).format('MMM D, h:mm A')} (${snoozeRelativeTime})`;
            const snoozeSpan = metaEl.createSpan({
                text: `⏰ Snoozed until ${snoozeUntil}`,
                cls: 'reminder-snoozed'
            });
            // Also register snooze time for automatic updates
            this.reminderUpdater.addReminder(reminder, snoozeSpan);
        }

        // Show category if one is assigned
        if (reminder.category) {
            metaEl.createSpan({
                text: reminder.category,
                cls: 'reminder-category'
            });
        }

        // Show linked source note with clickable link to open it
        if (reminder.sourceNote) {
            const noteLink = metaEl.createEl('a', {
                text: reminder.sourceNote.split('/').pop(),  // Show just the filename, not full path
                cls: 'reminder-note-link'
            });
            noteLink.addEventListener('click', () => {
                // Open the linked note in Obsidian
                this.app.workspace.openLinkText(reminder.sourceNote!, '');
            });
        }

        // Create container for action buttons (edit, delete, snooze)
        const actionsEl = itemEl.createDiv({ cls: 'reminder-item-actions' });

        // Only show snooze button for incomplete reminders that are overdue
        // This helps users deal with reminders that have already passed their time
        if (!reminder.completed && window.moment(reminder.datetime).isBefore(window.moment())) {
            const snoozeBtn = actionsEl.createEl('button', {
                cls: 'clickable-icon',
                attr: { 'aria-label': 'Snooze' }
            });
            setIcon(snoozeBtn, 'alarm-clock-plus');
            snoozeBtn.addEventListener('click', () => {
                // Open snooze modal to let user choose how long to snooze
                const modal = new SnoozeSuggestModal(
                    this.app,
                    reminder,
                    this.plugin,
                    async (minutes: number) => {
                        // Calculate new snooze time from current moment
                        const snoozeUntil = window.moment().add(minutes, 'minutes').toISOString();
                        await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);

                        // Show user-friendly confirmation message
                        const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                        new Notice(`⏰ Reminder snoozed for ${timeLabel}`);

                        // Refresh view to reflect the change
                        this.render();
                    }
                );
                modal.open();
            });
        }

        // Edit button - always available for all reminders
        const editBtn = actionsEl.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Edit' }
        });
        editBtn.addEventListener('click', () => {
            // Open the reminder modal in edit mode with current reminder data
            this.plugin.openReminderModal(reminder);
        });
        setIcon(editBtn, 'pencil');

        // Delete button - always available for all reminders
        const deleteBtn = actionsEl.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Delete' }
        });
        setIcon(deleteBtn, 'trash');

        deleteBtn.addEventListener('click', () => {
            // Show confirmation modal before actually deleting
            // This prevents accidental deletions
            const confirmModal = new ConfirmDeleteModal(
                this.app,
                reminder,
                async () => {
                    // This callback runs if user confirms the deletion
                    await this.plugin.dataManager.deleteReminder(reminder.id);
                    new Notice('Reminder deleted');
                    // Refresh view to remove the deleted item
                    this.render();
                }
            );
            confirmModal.open();
        });
    }

    /**
     * Gets reminders filtered by the currently selected tab.
     * Each filter shows a different subset of reminders with appropriate sorting.
     *
     * @returns Array of reminders matching the current filter
     */
    private getFilteredReminders(): Reminder[] {
        let reminders = this.plugin.dataManager.reminders;

        switch (this.currentFilter) {
            case 'pending':
                // Show only incomplete reminders that need attention
                reminders = this.plugin.dataManager.getPendingReminders();
                break;
            case 'snoozed':
                // Show only reminders that are currently snoozed
                reminders = this.plugin.dataManager.getSnoozedReminders();
                break;
            case 'upcoming':
                // Show reminders due in the near future (limit to 50 for performance)
                reminders = this.plugin.dataManager.getUpcomingReminders(50);
                break;
            case 'completed':
                // Show only completed reminders, sorted by completion time (newest first)
                reminders = reminders.filter(r => r.completed)
                    .sort((a, b) => window.moment(b.completedAt || b.datetime).diff(window.moment(a.completedAt || a.datetime)));
                break;
            case 'all':
                // Show all reminders with smart sorting:
                // 1. Incomplete reminders first (sorted by due time)
                // 2. Completed reminders last (sorted by completion time)
                reminders = reminders.slice().sort((a, b) => {
                    // If one is completed and one isn't, incomplete comes first
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;

                    // If both have same completion status, sort by appropriate date
                    if (a.completed && b.completed) {
                        // Both completed: newest completion first
                        return window.moment(b.completedAt || b.datetime).diff(window.moment(a.completedAt || a.datetime));
                    } else {
                        // Both incomplete: soonest datetime first
                        return window.moment(a.datetime).diff(window.moment(b.datetime));
                    }
                });
                break;
        }
        return reminders;
    }

    /**
     * Public method to refresh the view.
     * This is called by the main plugin when data changes.
     */
    refresh() {
        this.render();
    }
}
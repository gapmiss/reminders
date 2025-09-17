import { ItemView, WorkspaceLeaf, Notice, Setting, setIcon, Menu, debounce } from "obsidian";
import ReminderPlugin from "./main";
import type { Reminder, FilterType } from './types';
import { ICONS, CSS_CLASSES, FILTER_CONFIG, UI_CONFIG, SVG_CONFIG, DATE_FORMATS } from './constants';
import { SnoozeSuggestModal } from "./modals/snoozeSuggestModal";
import { ConfirmDeleteModal } from "./modals/confirmDeleteModal";
import { ReminderTimeUpdater } from "./managers/reminderDataManager";
import { formatTimeWithRelative, formatSnoozeTime, isInPast, createSnoozeTime, sortByDatetimeAsc, sortByDatetimeDesc, sortByCompletionTime } from './utils/dateUtils';

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
    private debouncedRender: () => void;              // Debounced version of render method to prevent excessive re-renders

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
        // Initialize debounced render function to prevent excessive re-renders
        this.debouncedRender = debounce(this.render.bind(this), UI_CONFIG.RENDER_DEBOUNCE_DELAY, true);
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
        return ICONS.BELL;
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
        // Cancel any pending debounced renders to prevent memory leaks
        // Note: Obsidian's debounce function handles cleanup automatically
    }

    /**
     * Main render method that builds the entire sidebar interface.
     * This method is called whenever the view needs to be refreshed.
     */
    render() {
        // Skip rendering if the view is not currently visible to improve performance
        if (!this.containerEl.isConnected) {
            return;
        }

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

        const headerIcon = headerEl.createDiv('header-icon');
        setIcon(headerIcon, ICONS.BELL);

        // Add the main title
        headerEl.createEl('h6', { text: 'Reminders', cls: 'header-heading' });

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
        const refreshBtn = actionsEl.createEl('button', {
            cls: 'refresh-button'
        });
        setIcon(refreshBtn, 'rotate-ccw');  // Use Obsidian's refresh icon
        refreshBtn.addEventListener('click', () => {
            // Create spinner overlay relative to the view's content area
            this.containerEl.style.position = 'relative';
            const spinner = this.containerEl.createDiv({ cls: 'refresh-spinner' });

            // Create SVG element
            const svg = document.createElementNS(SVG_CONFIG.NAMESPACE, 'svg');
            svg.setAttribute('class', CSS_CLASSES.SPINNER_ICON);
            svg.setAttribute('viewBox', '0 0 24 24');

            // Create circle element
            const circle = document.createElementNS(SVG_CONFIG.NAMESPACE, 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', SVG_CONFIG.CIRCLE_RADIUS);
            circle.setAttribute('stroke', 'currentColor');
            circle.setAttribute('stroke-width', SVG_CONFIG.STROKE_WIDTH);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke-dasharray', SVG_CONFIG.DASH_ARRAY);
            circle.setAttribute('stroke-dashoffset', SVG_CONFIG.DASH_OFFSET);

            // Append circle to SVG and SVG to spinner
            svg.appendChild(circle);
            spinner.appendChild(svg);

            // Re-render the entire view to get latest data
            this.render();

            // Remove spinner after a short delay
            setTimeout(() => {
                spinner.remove();
            }, UI_CONFIG.SPINNER_DELAY);
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
        const filters = FILTER_CONFIG;

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
                this.currentFilter = filter.key as FilterType;
                // Re-render to show the new filtered view
                this.debouncedRender();
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
                    this.debouncedRender();
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
        const timeDisplayText = formatTimeWithRelative(reminder.datetime, 'No date set');
        const timeSpan = metaEl.createSpan({ cls: 'time-span', text: timeDisplayText });
        // Register this element for automatic time updates
        this.reminderUpdater.addReminder(reminder, timeSpan);

        // If reminder is snoozed, show when it will reappear
        if (reminder.snoozedUntil) {
            const snoozeSpan = metaEl.createSpan({
                text: formatSnoozeTime(reminder.snoozedUntil),
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
                text: reminder.sourceNote.split('/').pop()?.replace('.md', ''),  // Show just the filename, not full path
                cls: 'reminder-note-link',
                attr: { 'aria-label': `Open "${reminder.sourceNote}"`}
            });
            noteLink.addEventListener('click', () => {
                // Open the linked note in Obsidian
                this.app.workspace.openLinkText(reminder.sourceNote!, '');
            });
        }

        // Create container for action button (ellipsis menu)
        const actionsEl = itemEl.createDiv({ cls: 'reminder-item-actions' });

        // Single ellipsis button that opens a context menu with all actions
        const menuBtn = actionsEl.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'More actions' }
        });
        setIcon(menuBtn, 'more-horizontal');

        menuBtn.addEventListener('click', (event) => {
            // Create and show context menu
            const menu = new Menu();

            // Add snooze option only for incomplete reminders that are overdue
            if (!reminder.completed && isInPast(reminder.datetime)) {
                menu.addItem((item) => {
                    item.setTitle('Snooze')
                        .setIcon('alarm-clock-plus')
                        .onClick(() => {
                            // Open snooze modal to let user choose how long to snooze
                            const modal = new SnoozeSuggestModal(
                                this.app,
                                reminder,
                                this.plugin,
                                async (minutes: number) => {
                                    // Calculate new snooze time from current moment
                                    const snoozeUntil = createSnoozeTime(minutes);
                                    await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);

                                    // Show user-friendly confirmation message
                                    const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                                    new Notice(`⏰ Reminder snoozed for ${timeLabel}`);

                                    // Refresh view to reflect the change
                                    this.debouncedRender();
                                }
                            );
                            modal.open();
                        });
                });
            }

            // Add edit option - always available for all reminders
            menu.addItem((item) => {
                item.setTitle('Edit')
                    .setIcon('pencil')
                    .onClick(() => {
                        // Open the reminder modal in edit mode with current reminder data
                        this.plugin.openReminderModal(reminder);
                    });
            });

            // Add delete option - always available for all reminders
            menu.addItem((item) => {
                item.setTitle('Delete')
                    .setIcon('trash')
                    .onClick(() => {
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
                                this.debouncedRender();
                            }
                        );
                        confirmModal.open();
                    });
            });

            // Show the menu at the button position (works for both mouse and keyboard)
            if (event.type === 'click' && event.detail === 0) {
                // Keyboard activation (Enter/Space) - position menu at button
                const rect = menuBtn.getBoundingClientRect();
                menu.showAtPosition({ x: rect.left, y: rect.bottom });
            } else {
                // Mouse click - use mouse position
                menu.showAtMouseEvent(event);
            }
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
                    .sort(sortByCompletionTime);
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
                        return sortByCompletionTime(a, b);
                    } else {
                        // Both incomplete: soonest datetime first
                        return sortByDatetimeAsc(a, b);
                    }
                });
                break;
        }
        return reminders;
    }

    /**
     * Sets the current filter and refreshes the view.
     * Used to programmatically switch tabs when certain actions occur.
     *
     * @param filter - The filter to switch to
     */
    setFilter(filter: 'pending' | 'snoozed' | 'upcoming' | 'all' | 'completed') {
        this.currentFilter = filter;
        this.render();
    }

    /**
     * Public method to refresh the view.
     * This is called by the main plugin when data changes.
     * Uses debounced rendering to prevent excessive re-renders.
     */
    refresh() {
        this.debouncedRender();
    }
}
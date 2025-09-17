import ReminderPlugin from "../main";
import { Reminder } from "../modals/reminderModal";
import { format, formatDistanceToNow, addHours, addDays, isBefore, isAfter, differenceInMilliseconds } from 'date-fns';

/**
 * Data manager responsible for all CRUD operations on reminder data.
 * This class handles creating, reading, updating, and deleting reminders,
 * as well as providing filtered views and statistics.
 *
 * Key responsibilities:
 * - Reminder CRUD operations (create, read, update, delete)
 * - Data persistence through plugin settings
 * - Filtering and sorting reminders by various criteria
 * - Generating statistics for the UI
 * - Managing reminder state changes (complete, snooze)
 */
export class ReminderDataManager {
    private plugin: ReminderPlugin;  // Reference to main plugin for accessing settings and methods

    /**
     * Constructor for the data manager.
     *
     * @param plugin - Main plugin instance for accessing settings and save methods
     */
    constructor(plugin: ReminderPlugin) {
        this.plugin = plugin;
    }

    /**
     * Creates a new reminder with the provided data.
     * Fills in default values for any missing fields and generates a unique ID.
     *
     * @param reminderData - Partial reminder data from user input
     * @returns Promise that resolves to the created reminder
     */
    async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
        // Create a complete reminder object with defaults for missing fields
        const reminder: Reminder = {
            id: this.generateId(),                                                    // Generate unique identifier
            message: reminderData.message || '',                                     // Reminder text (required)
            datetime: reminderData.datetime || addHours(new Date(), 1).toISOString(), // Default to 1 hour from now
            priority: reminderData.priority || this.plugin.settings.defaultPriority, // Use user's default priority setting
            category: reminderData.category || '',                                   // Optional category for organization
            sourceNote: reminderData.sourceNote,                                    // Optional link to source note
            sourceLine: reminderData.sourceLine,                                    // Optional link to specific line
            completed: false,                                                        // New reminders start incomplete
            snoozeCount: 0,                                                         // Track how many times snoozed
            created: new Date().toISOString(),                                 // Timestamp when created
            updated: new Date().toISOString()                                  // Timestamp when last modified
        };

        // Add to the reminders array in settings
        this.plugin.settings.reminders.push(reminder);
        // Persist changes to disk
        await this.plugin.saveSettings();
        return reminder;
    }

    /**
     * Updates an existing reminder with new data.
     * Automatically updates the 'updated' timestamp.
     *
     * @param id - Unique identifier of the reminder to update
     * @param updates - Partial reminder data with fields to update
     * @returns Promise that resolves to updated reminder, or null if not found
     */
    async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
        // Find the reminder by ID
        const index = this.plugin.settings.reminders.findIndex((r) => r.id === id);
        if (index === -1) return null;  // Reminder not found

        // Get reference to the reminder object
        const reminder = this.plugin.settings.reminders[index];

        // Apply updates and set the updated timestamp
        Object.assign(reminder, updates, {
            updated: new Date().toISOString()  // Always update the timestamp
        });

        // Persist changes to disk
        await this.plugin.saveSettings();
        return reminder;
    }

    /**
     * Deletes a reminder by its ID.
     *
     * @param id - Unique identifier of the reminder to delete
     * @returns Promise that resolves to true if deleted, false if not found
     */
    async deleteReminder(id: string): Promise<boolean> {
        // Find the reminder by ID
        const index = this.plugin.settings.reminders.findIndex((r) => r.id === id);
        if (index === -1) return false;  // Reminder not found

        // Remove from array
        this.plugin.settings.reminders.splice(index, 1);
        // Persist changes to disk
        await this.plugin.saveSettings();
        return true;
    }

    /**
     * Marks a reminder as completed.
     * This sets the completed flag, records completion time, and clears any snooze.
     *
     * @param id - Unique identifier of the reminder to complete
     * @returns Promise that resolves to updated reminder, or null if not found
     */
    async completeReminder(id: string): Promise<Reminder | null> {
        // Update the reminder with completion data
        const result = await this.updateReminder(id, {
            completed: true,                               // Mark as completed
            completedAt: new Date().toISOString(),   // Record when completed
            snoozedUntil: undefined                       // Clear any active snooze
        });

        // Refresh the sidebar view if it's open to show the change immediately
        if (this.plugin.sidebarView) {
            this.plugin.sidebarView.refresh();
        }

        return result;
    }

    /**
     * Snoozes a reminder until a specified time.
     * This temporarily hides the reminder and increments the snooze counter.
     *
     * @param id - Unique identifier of the reminder to snooze
     * @param snoozeUntil - ISO string of when to show the reminder again
     * @returns Promise that resolves to updated reminder, or null if not found
     */
    async snoozeReminder(id: string, snoozeUntil: string): Promise<Reminder | null> {
        // Find the reminder to get current snooze count
        const reminder = this.findReminder(id);
        if (!reminder) return null;

        // Update the reminder with snooze information
        const result = await this.updateReminder(id, {
            snoozedUntil: snoozeUntil,                      // When to show again
            snoozeCount: reminder.snoozeCount + 1          // Increment snooze counter for tracking
        });

        // Refresh the sidebar view and switch to snoozed tab if it's open
        if (this.plugin.sidebarView) {
            this.plugin.sidebarView.setFilter('snoozed');
        }

        return result;
    }

    /**
     * Finds a reminder by its unique ID.
     *
     * @param id - Unique identifier to search for
     * @returns The reminder if found, undefined otherwise
     */
    findReminder(id: string): Reminder | undefined {
        return this.plugin.settings.reminders.find(r => r.id === id);
    }

    /**
     * Gets all reminders that are overdue and need attention.
     * This includes reminders that:
     * - Are not completed
     * - Have a due time in the past
     * - Are not currently snoozed (or snooze has expired)
     *
     * @returns Array of pending reminders sorted by due time (oldest first)
     */
    getPendingReminders(): Reminder[] {
        const now = new Date();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&                                                          // Not already done
                isBefore(new Date(r.datetime), now) &&                             // Due time has passed
                (!r.snoozedUntil || isBefore(new Date(r.snoozedUntil), now))      // Not snoozed or snooze expired
            )
            .sort((a, b) => differenceInMilliseconds(new Date(a.datetime), new Date(b.datetime))); // Sort by due time (oldest first)
    }

    /**
     * Gets all reminders that are currently snoozed.
     * This includes reminders that:
     * - Are not completed
     * - Have an active snooze time in the future
     *
     * @returns Array of snoozed reminders sorted by snooze end time (soonest first)
     */
    getSnoozedReminders(): Reminder[] {
        const now = new Date();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&                                    // Not already done
                r.snoozedUntil &&                                 // Has a snooze time set
                isAfter(new Date(r.snoozedUntil), now)       // Snooze time is in the future
            )
            .sort((a, b) => differenceInMilliseconds(new Date(a.snoozedUntil!), new Date(b.snoozedUntil!))); // Sort by snooze end time
    }

    /**
     * Gets reminders that are due in the future.
     * This includes reminders that:
     * - Are not completed
     * - Have a due time in the future
     * - Are not currently snoozed (or snooze has expired)
     *
     * @param limit - Maximum number of reminders to return (default: 10)
     * @returns Array of upcoming reminders sorted by due time (soonest first)
     */
    getUpcomingReminders(limit = 10): Reminder[] {
        const now = new Date();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&                                                          // Not already done
                isAfter(new Date(r.datetime), now) &&                             // Due time is in future
                (!r.snoozedUntil || isBefore(new Date(r.snoozedUntil), now))      // Not snoozed or snooze expired
            )
            .sort((a, b) => differenceInMilliseconds(new Date(a.datetime), new Date(b.datetime))) // Sort by due time (soonest first)
            .slice(0, limit);                                                          // Limit results for performance
    }

    /**
     * Gets all reminders linked to a specific note.
     * Useful for showing note-specific reminders in context menus.
     *
     * @param notePath - Path of the note to find reminders for
     * @returns Array of reminders linked to the note, sorted by due time
     */
    getRemindersByNote(notePath: string): Reminder[] {
        return this.plugin.settings.reminders
            .filter(r => r.sourceNote === notePath)                                    // Match source note path
            .sort((a, b) => differenceInMilliseconds(new Date(a.datetime), new Date(b.datetime))); // Sort by due time
    }

    /**
     * Generates a unique identifier for new reminders.
     * Uses timestamp + random string to ensure uniqueness.
     *
     * @returns Unique string identifier
     */
    private generateId(): string {
        return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Getter for accessing all reminders.
     * Provides direct access to the reminders array.
     *
     * @returns Array of all reminders
     */
    get reminders(): Reminder[] {
        return this.plugin.settings.reminders;
    }

    /**
     * Calculates summary statistics for all reminders.
     * Used by the UI to show counts in the sidebar stats section.
     *
     * @returns Object containing various reminder counts
     */
    getStatistics() {
        const now = new Date();
        const next24Hours = addDays(now, 1);
        const reminders = this.plugin.settings.reminders;

        return {
            total: reminders.length,                                               // Total number of reminders
            completed: reminders.filter(r => r.completed).length,                 // How many are done
            pending: reminders.filter(r => !r.completed).length,                  // How many are not done
            snoozed: reminders.filter(r =>                                        // How many are currently snoozed
                !r.completed && r.snoozedUntil && isAfter(new Date(r.snoozedUntil), now)
            ).length,
            overdue: reminders.filter(r =>                                        // How many are overdue
                !r.completed && isBefore(new Date(r.datetime), now)
            ).length,
            upcoming24h: reminders.filter(r =>                                    // How many are due in next 24 hours
                !r.completed &&
                isAfter(new Date(r.datetime), now) &&
                isBefore(new Date(r.datetime), next24Hours)
            ).length
        };
    }
}

/**
 * Utility class for automatically updating relative time displays in the UI.
 * This keeps time strings like "5 minutes ago" current without requiring full re-renders.
 *
 * Key features:
 * - Automatically updates time displays every 5 seconds
 * - Manages pairs of reminders and their corresponding HTML elements
 * - Handles both regular reminder times and snooze times
 * - Provides cleanup methods to prevent memory leaks
 */
export class ReminderTimeUpdater {
    private intervalId: number | null = null;     // Timer ID for the update interval
    private reminders: any[] = [];               // Array of reminder objects to track
    private timeSpanElements: HTMLSpanElement[] = []; // Corresponding HTML elements to update

    /**
     * Constructor that automatically starts the update timer.
     */
    constructor() {
        this.startAutoUpdate();
    }

    /**
     * Registers a reminder and its HTML element for automatic time updates.
     * The reminder and element are kept in sync by index.
     *
     * @param reminder - The reminder object containing datetime information
     * @param timeSpanElement - The HTML element that displays the time string
     */
    addReminder(reminder: any, timeSpanElement: HTMLSpanElement): void {
        this.reminders.push(reminder);
        this.timeSpanElements.push(timeSpanElement);
    }

    /**
     * Removes a reminder and its corresponding element from tracking.
     * Used when reminder items are removed from the UI.
     *
     * @param index - Index of the reminder/element pair to remove
     */
    removeReminder(index: number): void {
        this.reminders.splice(index, 1);
        this.timeSpanElements.splice(index, 1);
    }

    /**
     * Clears all tracked reminders and elements.
     * Used when the view is refreshed or closed.
     */
    clearAll(): void {
        this.reminders = [];
        this.timeSpanElements = [];
    }

    /**
     * Starts the automatic update timer.
     * Updates all tracked time displays every 5 seconds.
     */
    startAutoUpdate(): void {
        if (this.intervalId) return; // Already running, don't start another

        // Set up interval to update all time displays
        this.intervalId = window.setInterval(() => {
            this.updateAll();
        }, 5000); // Update every 5 seconds (not 30 as the comment incorrectly stated)
    }

    /**
     * Stops the automatic update timer.
     * Used when the view is closed or the service is no longer needed.
     */
    stopAutoUpdate(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Updates all tracked reminder time displays.
     * Called automatically by the timer interval.
     */
    private updateAll(): void {
        this.updateAllReminderTimes(this.reminders, this.timeSpanElements);
    }

    /**
     * Updates the time display for a single reminder.
     * Handles both regular reminder times and snooze times.
     *
     * @param reminder - The reminder object containing time information
     * @param timeSpanElement - The HTML element to update with new time text
     * @param isSnoozed - Whether to show snooze time instead of reminder time
     */
    updateReminderTime(reminder: any, timeSpanElement: HTMLSpanElement, isSnoozed: boolean): void {
        if (isSnoozed) {
            // Show snooze information with clock emoji
            if (reminder.snoozedUntil) {
                const snoozedDate = new Date(reminder.snoozedUntil);
                if (!isNaN(snoozedDate.getTime())) {
                    const timeStr = format(snoozedDate, 'MMM d, h:mm a');  // "Jan 15, 2:30 pm"
                    const relativeTime = formatDistanceToNow(snoozedDate, { addSuffix: true, includeSeconds: true }).replace(/^about /, '~');           // "in 5 minutes"
                    timeSpanElement.textContent = `⏰ Snoozed until ${timeStr} (${relativeTime})`;
                } else {
                    timeSpanElement.textContent = '⏰ Snooze time invalid';
                }
            } else {
                timeSpanElement.textContent = '⏰ Not snoozed';
            }
        } else {
            // Show regular reminder time
            if (reminder.datetime) {
                const reminderDate = new Date(reminder.datetime);
                if (!isNaN(reminderDate.getTime())) {
                    const timeStr = format(reminderDate, 'MMM d, h:mm a');      // "Jan 15, 2:30 pm"
                    const relativeTime = formatDistanceToNow(reminderDate, { addSuffix: true, includeSeconds: true }).replace(/^about /, '~');               // "5 minutes ago"
                    timeSpanElement.textContent = `${timeStr} (${relativeTime})`;
                } else {
                    timeSpanElement.textContent = 'Invalid date';
                }
            } else {
                timeSpanElement.textContent = 'No date set';
            }
        }
    }

    /**
     * Updates time displays for multiple reminders at once.
     * Determines whether each reminder is snoozed based on CSS class.
     *
     * @param reminders - Array of reminder objects
     * @param timeSpanElements - Array of corresponding HTML elements
     */
    updateAllReminderTimes(reminders: any[], timeSpanElements: HTMLSpanElement[]): void {
        reminders.forEach((reminder, index) => {
            // Check if the corresponding element still exists
            if (timeSpanElements[index]) {
                // Determine if this is a snooze time display by checking CSS class
                const isSnoozed = timeSpanElements[index].className === 'reminder-snoozed';
                this.updateReminderTime(reminder, timeSpanElements[index], isSnoozed);
            }
        });
    }

    /**
     * Complete cleanup method.
     * Stops the timer and clears all tracked data to prevent memory leaks.
     * Should be called when the plugin is disabled or view is destroyed.
     */
    destroy(): void {
        this.stopAutoUpdate(); // Stop the update timer
        this.clearAll();       // Clear all tracked reminders and elements
    }
}
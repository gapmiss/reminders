import ReminderPlugin from "../main";
import { ReminderDataManager } from "./reminderDataManager";
import { NotificationService } from "./notificationService";

/**
 * Scheduler service that monitors reminders and triggers notifications at the right time.
 * This class implements an adaptive scheduling system that checks more frequently when
 * reminders are due soon, and less frequently when no immediate reminders exist.
 *
 * Key features:
 * - Adaptive check intervals (fast when reminders due soon, slow otherwise)
 * - Prevents duplicate notifications for the same reminder
 * - Precise timing to avoid early or late notifications
 * - Debug logging for troubleshooting
 * - Handles snooze functionality and reminder state management
 */
export class Scheduler {
    private plugin: ReminderPlugin;                      // Reference to main plugin for settings
    private dataManager: ReminderDataManager;            // For accessing reminder data
    private notificationService: NotificationService;    // For showing notifications
    private isRunning = false;                          // Tracks whether scheduler is active
    private processedReminders = new Set<string>();     // Prevents duplicate notifications
    private checkCount = 0;                             // For debugging - tracks number of checks performed

    /**
     * Constructor for the scheduler.
     *
     * @param plugin - Main plugin instance for accessing settings
     * @param dataManager - Service for accessing reminder data
     * @param notificationService - Service for displaying notifications
     */
    constructor(
        plugin: ReminderPlugin,
        dataManager: ReminderDataManager,
        notificationService: NotificationService
    ) {
        this.plugin = plugin;
        this.dataManager = dataManager;
        this.notificationService = notificationService;
    }

    /**
     * Starts the scheduler to begin monitoring reminders.
     * This sets up the recursive checking loop.
     */
    async start(): Promise<void> {
        // Prevent starting multiple instances
        if (this.isRunning) return;

        // Debug logging if enabled
        if (this.plugin.settings.showDebugLog) console.log('Starting high-frequency reminder scheduler');

        // Set state and reset counters
        this.isRunning = true;
        this.checkCount = 0;

        // Begin the checking loop
        this.scheduleCheck();
    }

    /**
     * Stops the scheduler and cleans up resources.
     * This is called when the plugin is unloaded.
     */
    stop(): void {
        // Nothing to stop if not running
        if (!this.isRunning) return;

        // Debug logging if enabled
        if (this.plugin.settings.showDebugLog) console.log('Stopping high-frequency scheduler');

        // Stop the checking loop
        this.isRunning = false;

        // Clear processed reminders set to free memory
        this.processedReminders.clear();
    }

    /**
     * Schedules the next reminder check.
     * Uses adaptive intervals: fast when reminders are due soon, slow otherwise.
     * This creates a recursive loop that continues until the scheduler is stopped.
     */
    private scheduleCheck(): void {
        // Stop scheduling if scheduler was stopped
        if (!this.isRunning) return;

        // Adaptive interval selection:
        // - Fast checking (every 5 seconds) when reminders are due soon
        // - Slow checking (every 30 seconds) when no immediate reminders
        // This balances responsiveness with performance
        const interval = this.hasUpcomingReminders() ?
            this.plugin.settings.fastCheckInterval :   // Default: 5000ms (5 seconds)
            this.plugin.settings.slowCheckInterval;    // Default: 30000ms (30 seconds)

        // Schedule the next check
        setTimeout(async () => {
            // Double-check that scheduler is still running (could have been stopped)
            if (this.isRunning) {
                // Perform the reminder check
                await this.checkReminders();
                // Schedule the next check (recursive)
                this.scheduleCheck();
            }
        }, interval);
    }

    /**
     * Checks if there are any reminders due within the next 5 minutes.
     * This helps determine whether to use fast or slow check intervals.
     *
     * @returns True if reminders are due soon, false otherwise
     */
    private hasUpcomingReminders(): boolean {
        const now = window.moment();
        const fiveMinutesFromNow = now.clone().add(5, 'minutes');

        // Check if any reminder should trigger in the next 5 minutes
        return this.dataManager.reminders.some(reminder => {
            // Skip completed reminders
            if (reminder.completed) return false;

            // Determine the effective due time - snoozedUntil takes precedence over datetime
            let effectiveTime;
            if (reminder.snoozedUntil) {
                const snoozeTime = window.moment(reminder.snoozedUntil);
                if (snoozeTime.isAfter(now)) {
                    // Still snoozed, skip this reminder
                    return false;
                } else {
                    // Snooze expired, use snooze time as the effective due time
                    effectiveTime = snoozeTime;
                }
            } else {
                // No snooze, use original datetime
                effectiveTime = window.moment(reminder.datetime);
            }

            // Check if effective time falls within the next 5 minutes
            return effectiveTime.isBetween(now, fiveMinutesFromNow);
        });
    }

    /**
     * Performs the actual check for due reminders.
     * This is the core logic that determines which reminders should trigger notifications.
     */
    private async checkReminders(): Promise<void> {
        // Increment check counter for debugging
        this.checkCount++;

        // Debug logging if enabled (shows check frequency and timing)
        if (this.plugin.settings.showDebugLog) {
            console.log(`High-frequency check #${this.checkCount} at ${new Date().toISOString()}`);
        }

        try {
            const now = window.moment();
            const allReminders = this.dataManager.reminders;

            // Find reminders that should trigger now
            const dueReminders = allReminders.filter(reminder => {
                // Skip completed reminders
                if (reminder.completed) return false;

                // Handle snoozed reminders - snoozedUntil is the sole source of truth
                if (reminder.snoozedUntil) {
                    const snoozeExpired = window.moment(reminder.snoozedUntil).isBefore(now);
                    if (snoozeExpired) {
                        // Snooze has expired, clear it and allow the reminder to trigger
                        // Remove from processed set so it can trigger again
                        this.processedReminders.delete(reminder.id);
                        // Clear the snooze time asynchronously (don't wait for it)
                        this.dataManager.updateReminder(reminder.id, { snoozedUntil: undefined });
                        // Continue to check if reminder is due
                    } else {
                        // Still snoozed, skip this reminder entirely
                        return false;
                    }
                }

                // Precise timing check to determine if reminder is due
                const reminderTime = window.moment(reminder.datetime);
                const secondsDiff = reminderTime.diff(now, 'seconds');

                // Trigger if time has passed or within next 30 seconds
                // The 30-second window ensures we don't miss reminders due to check timing
                return secondsDiff <= 30;
            });

            // Process each due reminder
            for (const reminder of dueReminders) {
                // Only process reminders we haven't already shown
                // This prevents duplicate notifications for the same reminder
                if (!this.processedReminders.has(reminder.id)) {
                    // Double-check timing before triggering (final validation)
                    const exactTime = window.moment(reminder.datetime);
                    const exactDiff = exactTime.diff(now, 'seconds');

                    // Only trigger if the reminder is actually due (not early)
                    if (exactDiff <= 0) {
                        // Show the notification
                        await this.notificationService.showReminder(reminder);

                        // Mark as processed to prevent duplicates
                        this.processedReminders.add(reminder.id);

                        // Debug logging for successful triggers
                        if (this.plugin.settings.showDebugLog) {
                            console.log(`Precisely triggered reminder: ${reminder.message}`);
                        }
                    }
                }
            }

        } catch (error) {
            // Log any errors that occur during checking
            console.error('Error in high-frequency check:', error);
        }
    }

    /**
     * Triggers an immediate reminder check.
     * This is useful when reminders are created/updated and we want to
     * check immediately rather than waiting for the next scheduled check.
     */
    async scheduleImmediate(): Promise<void> {
        await this.checkReminders();
    }
}
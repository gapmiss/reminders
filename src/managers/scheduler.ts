import ReminderPlugin from "../main";
import { ReminderDataManager } from "./reminderDataManager";
import { NotificationService } from "./notificationService";
import { addMinutes, isAfter, differenceInSeconds } from 'date-fns';
import { ErrorCategory } from '../utils/errorHandling';

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
        const now = new Date();
        const fiveMinutesFromNow = addMinutes(now, 5);

        // Check if any reminder should trigger in the next 5 minutes
        return this.dataManager.reminders.some(reminder => {
            // Skip completed reminders
            if (reminder.completed) return false;

            // Determine the effective due time - snoozedUntil takes precedence over datetime
            let effectiveTime;
            if (reminder.snoozedUntil) {
                // For snoozed reminders, the effective due time is the snooze expiration time
                effectiveTime = new Date(reminder.snoozedUntil);
            } else {
                // No snooze, use original datetime
                effectiveTime = new Date(reminder.datetime);
            }

            // Check if effective time falls within the next 5 minutes
            return effectiveTime >= now && effectiveTime <= fiveMinutesFromNow;
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
            console.log(`${this.hasUpcomingReminders() ? 'High-frequency' : 'Low-frequency'} check #${this.checkCount} at ${new Date().toISOString()}`);
        }

        try {
            const now = new Date();
            const allReminders = this.dataManager.reminders;

            // Find reminders that should trigger now
            const dueReminders = allReminders.filter(reminder => {
                // Skip completed reminders
                if (reminder.completed) return false;

                // Determine effective due time - snoozedUntil takes precedence over datetime
                let effectiveTime;
                if (reminder.snoozedUntil) {
                    const snoozeTime = new Date(reminder.snoozedUntil);
                    if (isAfter(snoozeTime, now) || snoozeTime.getTime() === now.getTime()) {
                        // Still snoozed, skip this reminder entirely
                        return false;
                    } else {
                        // Snooze has expired, clear it and use snooze time as effective due time
                        this.processedReminders.delete(reminder.id);
                        this.dataManager.updateReminder(reminder.id, { snoozedUntil: undefined });
                        effectiveTime = snoozeTime;
                    }
                } else {
                    // No snooze, use original datetime
                    effectiveTime = new Date(reminder.datetime);
                }

                // Precise timing check using effective due time
                const secondsDiff = differenceInSeconds(effectiveTime, now);

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
                    const exactTime = new Date(reminder.datetime);
                    const exactDiff = differenceInSeconds(exactTime, now);

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
            // Use centralized error handling for scheduler errors
            this.plugin.errorHandler.handleSchedulerError(
                'Error occurred during reminder check cycle',
                error instanceof Error ? error : new Error(String(error)),
                {
                    checkCount: this.checkCount,
                    isRunning: this.isRunning,
                    processedCount: this.processedReminders.size
                }
            );
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
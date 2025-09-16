import ReminderPlugin from "../main";
import { ReminderDataManager } from "./reminderDataManager";
import { NotificationService } from "./notificationService";

export class Scheduler {
    private plugin: ReminderPlugin;
    private dataManager: ReminderDataManager;
    private notificationService: NotificationService;
    private isRunning = false;
    private processedReminders = new Set<string>();
    private checkCount = 0;

    constructor(
        plugin: ReminderPlugin,
        dataManager: ReminderDataManager,
        notificationService: NotificationService
    ) {
        this.plugin = plugin;
        this.dataManager = dataManager;
        this.notificationService = notificationService;
    }

    async start(): Promise<void> {
        if (this.isRunning) return;

        if (this.plugin.settings.showDebugLog) console.log('Starting high-frequency reminder scheduler');
        this.isRunning = true;
        this.checkCount = 0;

        this.scheduleCheck();
    }

    stop(): void {
        if (!this.isRunning) return;

        if (this.plugin.settings.showDebugLog) console.log('Stopping high-frequency scheduler');
        this.isRunning = false;
        this.processedReminders.clear();
    }

    private scheduleCheck(): void {
        if (!this.isRunning) return;

        // Use fast checking (every 5 seconds) when reminders are due soon
        // Use slow checking (every 30 seconds) when no immediate reminders
        const interval = this.hasUpcomingReminders() ?
            this.plugin.settings.fastCheckInterval :
            this.plugin.settings.slowCheckInterval;

        setTimeout(async () => {
            if (this.isRunning) {
                await this.checkReminders();
                this.scheduleCheck();
            }
        }, interval);
    }

    private hasUpcomingReminders(): boolean {
        const now = window.moment();
        const fiveMinutesFromNow = now.clone().add(5, 'minutes');

        return this.dataManager.reminders.some(reminder => {
            if (reminder.completed) return false;
            if (reminder.snoozedUntil && window.moment(reminder.snoozedUntil).isAfter(now)) return false;

            const reminderTime = window.moment(reminder.datetime);
            return reminderTime.isBetween(now, fiveMinutesFromNow);
        });
    }

    private async checkReminders(): Promise<void> {
        this.checkCount++;
        // const isDetailedCheck = this.checkCount % 15 === 0; // Every 15th check is detailed
        if (this.plugin.settings.showDebugLog) console.log(`High-frequency check #${this.checkCount} at ${new Date().toISOString()}`);

        try {
            const now = window.moment();
            const allReminders = this.dataManager.reminders;

            // Find reminders that should trigger now
            const dueReminders = allReminders.filter(reminder => {
                if (reminder.completed) return false;

                // if (reminder.snoozedUntil) {
                //     const snoozeExpired = window.moment(reminder.snoozedUntil).isBefore(now);
                //     // if (snoozeExpired && isDetailedCheck) {
                //     if (snoozeExpired) {
                //         this.dataManager.updateReminder(reminder.id, { snoozedUntil: undefined });
                //         this.processedReminders.delete(reminder.id);
                //         return true;
                //     }
                //     return false;
                // }

                // More precise timing check
                const reminderTime = window.moment(reminder.datetime);
                const secondsDiff = reminderTime.diff(now, 'seconds');

                // Trigger if time has passed or within next 30 seconds
                return secondsDiff <= 30;
            });

            for (const reminder of dueReminders) {
                if (!this.processedReminders.has(reminder.id)) {
                    // Double-check timing before triggering
                    const exactTime = window.moment(reminder.datetime);
                    const exactDiff = exactTime.diff(now, 'seconds');

                    if (exactDiff <= 0) { // Only trigger if actually due
                        await this.notificationService.showReminder(reminder);
                        this.processedReminders.add(reminder.id);
                        if (this.plugin.settings.showDebugLog) console.log(`Precisely triggered reminder: ${reminder.message}`);
                    }
                }
            }

        } catch (error) {
            console.error('Error in high-frequency check:', error);
        }
    }

    async scheduleImmediate(): Promise<void> {
        await this.checkReminders();
    }
}
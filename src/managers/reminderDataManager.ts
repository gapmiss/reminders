import ReminderPlugin from "../main";
import { Reminder } from "../modals/reminderModal";

export class ReminderDataManager {
    private plugin: ReminderPlugin;

    constructor(plugin: ReminderPlugin) {
        this.plugin = plugin;
    }

    async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
        const reminder: Reminder = {
            id: this.generateId(),
            message: reminderData.message || '',
            datetime: reminderData.datetime || window.moment().add(1, 'hour').toISOString(),
            priority: reminderData.priority || this.plugin.settings.defaultPriority,
            category: reminderData.category || '',
            sourceNote: reminderData.sourceNote,
            sourceLine: reminderData.sourceLine,
            completed: false,
            snoozeCount: 0,
            created: window.moment().toISOString(),
            updated: window.moment().toISOString()
        };

        this.plugin.settings.reminders.push(reminder);
        await this.plugin.saveSettings();
        return reminder;
    }

    async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
        const index = this.plugin.settings.reminders.findIndex((r) => r.id === id);
        if (index === -1) return null;

        const reminder = this.plugin.settings.reminders[index];
        Object.assign(reminder, updates, {
            updated: window.moment().toISOString()
        });

        await this.plugin.saveSettings();
        return reminder;
    }

    async deleteReminder(id: string): Promise<boolean> {
        const index = this.plugin.settings.reminders.findIndex((r) => r.id === id);
        if (index === -1) return false;

        this.plugin.settings.reminders.splice(index, 1);
        await this.plugin.saveSettings();
        return true;
    }

    async completeReminder(id: string): Promise<Reminder | null> {
        const result = await this.updateReminder(id, {
            completed: true,
            completedAt: window.moment().toISOString(),
            snoozedUntil: undefined
        });

        // Refresh the sidebar view when completing from Notice
        if (this.plugin.sidebarView) {
            this.plugin.sidebarView.refresh();
        }

        return result;
    }

    async snoozeReminder(id: string, snoozeUntil: string): Promise<Reminder | null> {
        const reminder = this.findReminder(id);
        if (!reminder) return null;

        const result = await this.updateReminder(id, {
            snoozedUntil: snoozeUntil,
            snoozeCount: reminder.snoozeCount + 1
        });

        // Refresh the sidebar view when snoozing
        if (this.plugin.sidebarView) {
            this.plugin.sidebarView.refresh();
        }

        return result;
    }

    findReminder(id: string): Reminder | undefined {
        return this.plugin.settings.reminders.find(r => r.id === id);
    }

    getPendingReminders(): Reminder[] {
        const now = window.moment();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&
                window.moment(r.datetime).isBefore(now) &&
                (!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
            )
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
    }

    getSnoozedReminders(): Reminder[] {
        const now = window.moment();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&
                r.snoozedUntil &&
                window.moment(r.snoozedUntil).isAfter(now)
            )
            .sort((a, b) => window.moment(a.snoozedUntil!).diff(window.moment(b.snoozedUntil!)));
    }

    getUpcomingReminders(limit = 10): Reminder[] {
        const now = window.moment();
        return this.plugin.settings.reminders
            .filter(r =>
                !r.completed &&
                window.moment(r.datetime).isAfter(now) &&
                (!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
            )
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)))
            .slice(0, limit);
    }

    getRemindersByNote(notePath: string): Reminder[] {
        return this.plugin.settings.reminders
            .filter(r => r.sourceNote === notePath)
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
    }

    private generateId(): string {
        return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    get reminders(): Reminder[] {
        return this.plugin.settings.reminders;
    }

    getStatistics() {
        const now = window.moment();
        const reminders = this.plugin.settings.reminders;

        return {
            total: reminders.length,
            completed: reminders.filter(r => r.completed).length,
            pending: reminders.filter(r => !r.completed).length,
            snoozed: reminders.filter(r =>
                !r.completed && r.snoozedUntil && window.moment(r.snoozedUntil).isAfter(now)
            ).length,
            overdue: reminders.filter(r =>
                !r.completed && window.moment(r.datetime).isBefore(now)
            ).length,
            upcoming24h: reminders.filter(r =>
                !r.completed &&
                window.moment(r.datetime).isAfter(now) &&
                window.moment(r.datetime).isBefore(now.clone().add(24, 'hours'))
            ).length
        };
    }
}

export class ReminderTimeUpdater {
    private intervalId: number | null = null;
    private reminders: any[] = [];
    private timeSpanElements: HTMLSpanElement[] = [];

    constructor() {
        this.startAutoUpdate();
    }

    // Add a reminder and its corresponding span element
    addReminder(reminder: any, timeSpanElement: HTMLSpanElement): void {
        this.reminders.push(reminder);
        this.timeSpanElements.push(timeSpanElement);
    }

    // Remove a reminder by index
    removeReminder(index: number): void {
        this.reminders.splice(index, 1);
        this.timeSpanElements.splice(index, 1);
    }

    // Clear all reminders
    clearAll(): void {
        this.reminders = [];
        this.timeSpanElements = [];
    }

    // Start the auto-update timer
    startAutoUpdate(): void {
        if (this.intervalId) return; // Already running

        this.intervalId = window.setInterval(() => {
            this.updateAll();
        }, 5000); // Update every 30 seconds
    }

    // Stop the auto-update timer
    stopAutoUpdate(): void {
        if (this.intervalId) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Update all reminder times
    private updateAll(): void {
        this.updateAllReminderTimes(this.reminders, this.timeSpanElements);
    }

    updateReminderTime(reminder: any, timeSpanElement: HTMLSpanElement, isSnoozed: boolean): void {
        if (isSnoozed) {
            const timeStr = window.moment(reminder.snoozedUntil).format('MMM D, h:mm A');
            const relativeTime = window.moment(reminder.snoozedUntil).fromNow();
            timeSpanElement.textContent = `⏰ Snoozed until ${timeStr} (${relativeTime})`;
        } else {
            const timeStr = window.moment(reminder.datetime).format('MMM D, h:mm A');
            const relativeTime = window.moment(reminder.datetime).fromNow();
            timeSpanElement.textContent = `${timeStr} (${relativeTime})`;
        }
    }

    updateAllReminderTimes(reminders: any[], timeSpanElements: HTMLSpanElement[]): void {
        reminders.forEach((reminder, index) => {
            if (timeSpanElements[index]) {
                this.updateReminderTime(reminder, timeSpanElements[index], timeSpanElements[index].className === 'reminder-snoozed');
            }
        });
    }

    // Cleanup method - call this when plugin is disabled or view is destroyed
    destroy(): void {
        this.stopAutoUpdate();
        this.clearAll();
    }
}
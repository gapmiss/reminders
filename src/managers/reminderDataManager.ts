import ReminderPlugin from "../main";
import { Reminder } from "../modals/reminderModal";

export interface ReminderSettings {
	scanInterval: number; // milliseconds
	showSystemNotification: boolean;
	showObsidianNotice: boolean;
	notificationSound: boolean;
	defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
}

interface PluginData {
	reminders: Reminder[];
	settings: ReminderSettings;
}

export class ReminderDataManager {
    private plugin: ReminderPlugin;
    private data: PluginData;
    private saveTimeout?: NodeJS.Timeout;

    constructor(plugin: ReminderPlugin) {
        this.plugin = plugin;
    }

    async loadData(): Promise<void> {
        const defaultData: PluginData = {
            reminders: [],
            settings: {
                scanInterval: 15000,
                showSystemNotification: true,
                showObsidianNotice: true,
                notificationSound: false,
                defaultPriority: 'normal'
            }
        };

        this.data = Object.assign(defaultData, await this.plugin.loadData());
    }

    async saveData(immediate = false): Promise<void> {
        if (immediate) {
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
                this.saveTimeout = undefined;
            }
            await this.plugin.saveData(this.data);
        } else {
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
            }

            this.saveTimeout = setTimeout(async () => {
                await this.plugin.saveData(this.data);
                this.saveTimeout = undefined;
            }, 1000);
        }
    }

    async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
        const reminder: Reminder = {
            id: this.generateId(),
            message: reminderData.message || '',
            datetime: reminderData.datetime || window.moment().add(1, 'hour').toISOString(),
            priority: reminderData.priority || this.data.settings.defaultPriority,
            category: reminderData.category || '',
            sourceNote: reminderData.sourceNote,
            sourceLine: reminderData.sourceLine,
            completed: false,
            snoozeCount: 0,
            created: window.moment().toISOString(),
            updated: window.moment().toISOString()
        };

        this.data.reminders.push(reminder);
        await this.saveData();
        return reminder;
    }

    async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
        const index = this.data.reminders.findIndex(r => r.id === id);
        if (index === -1) return null;

        const reminder = this.data.reminders[index];
        Object.assign(reminder, updates, {
            updated: window.moment().toISOString()
        });

        await this.saveData();
        return reminder;
    }

    async deleteReminder(id: string): Promise<boolean> {
        const index = this.data.reminders.findIndex(r => r.id === id);
        if (index === -1) return false;

        this.data.reminders.splice(index, 1);
        await this.saveData();
        return true;
    }

    async completeReminder(id: string): Promise<Reminder | null> {
        const result = await this.updateReminder(id, {
            completed: true,
            completedAt: window.moment().toISOString()
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
        return this.data.reminders.find(r => r.id === id);
    }

    getPendingReminders(): Reminder[] {
        const now = window.moment();
        return this.data.reminders
            .filter(r =>
                !r.completed &&
                window.moment(r.datetime).isBefore(now) &&
                (!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
            )
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
    }

    getSnoozedReminders(): Reminder[] {
        const now = window.moment();
        return this.data.reminders
            .filter(r =>
                !r.completed &&
                r.snoozedUntil &&
                window.moment(r.snoozedUntil).isAfter(now)
            )
            .sort((a, b) => window.moment(a.snoozedUntil!).diff(window.moment(b.snoozedUntil!)));
    }

    getUpcomingReminders(limit = 10): Reminder[] {
        const now = window.moment();
        return this.data.reminders
            .filter(r =>
                !r.completed &&
                window.moment(r.datetime).isAfter(now) &&
                (!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
            )
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)))
            .slice(0, limit);
    }

    getRemindersByNote(notePath: string): Reminder[] {
        return this.data.reminders
            .filter(r => r.sourceNote === notePath)
            .sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
    }

    private generateId(): string {
        return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    get reminders(): Reminder[] {
        return this.data.reminders;
    }

    get settings(): ReminderSettings {
        return this.data.settings;
    }

    async updateSettings(newSettings: Partial<ReminderSettings>): Promise<void> {
        Object.assign(this.data.settings, newSettings);
        await this.saveData();
    }

    getStatistics() {
        const now = window.moment();
        const reminders = this.data.reminders;

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
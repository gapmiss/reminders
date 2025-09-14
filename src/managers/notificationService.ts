import { Notice } from "obsidian";
import ReminderPlugin from "../main";
import { Reminder } from "../modals/reminderModal";
import { SnoozeSuggestModal } from "../modals/snoozeSuggestModal";

export class NotificationService {
    private plugin: ReminderPlugin;

    constructor(plugin: ReminderPlugin) {
        this.plugin = plugin;
    }

    async showReminder(reminder: Reminder): Promise<void> {
        const settings = this.plugin.dataManager.settings;

        if (settings.showObsidianNotice) {
            this.showObsidianNotice(reminder);
        }

        if (settings.showSystemNotification) {
            await this.showSystemNotification(reminder);
        }
    }

    private showObsidianNotice(reminder: Reminder) {
        const notice = new Notice('', 0); // No auto-dismiss

        const content = notice.noticeEl.createDiv({ cls: 'reminder-notice' });

        const messageEl = content.createDiv();
        messageEl.createEl('strong', { text: '🔔 Reminder' });
        messageEl.createEl('div', { text: reminder.message });

        const actionsEl = content.createDiv({ cls: 'reminder-notice-actions' });

        const completeBtn = actionsEl.createEl('button', {
            text: 'Complete',
            cls: 'mod-cta'
        });
        completeBtn.addEventListener('click', async () => {
            await this.plugin.dataManager.completeReminder(reminder.id);
            notice.hide();
            new Notice('✅ Reminder completed');
        });

        const snoozeBtn = actionsEl.createEl('button', { text: 'Snooze' });
        snoozeBtn.addEventListener('click', () => {
            notice.hide();
            const modal = new SnoozeSuggestModal(
                this.plugin.app,
                reminder,
                this.plugin,
                async (minutes: number) => {
                    const snoozeUntil = window.moment().add(minutes, 'minutes').toISOString();
                    await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);
                    const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                    new Notice(`⏰ Reminder snoozed for ${timeLabel}`);
                }
            );
            modal.open();
        });

        const closeBtn = actionsEl.createEl('button', { text: '×' });
        closeBtn.addEventListener('click', () => {
            notice.hide();
        });
    }

    private async showSystemNotification(reminder: Reminder): Promise<void> {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
        }

        if (Notification.permission !== 'granted') return;

        const notification = new Notification('Obsidian Reminder', {
            body: reminder.message,
            tag: reminder.id,
            requireInteraction: reminder.priority === 'urgent' || reminder.priority === 'high'
        });

        notification.onclick = () => {
            window.focus();
            this.plugin.openReminderSidebar();
            notification.close();
        };
    }
}
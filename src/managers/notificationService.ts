import { Notice } from "obsidian";
import ReminderPlugin from "../main";
import type { Reminder } from '../types';
import { SnoozeSuggestModal } from "../modals/snoozeSuggestModal";
import { addMinutes } from 'date-fns';

/**
 * Service responsible for displaying reminders to users through various notification methods.
 * This class handles both Obsidian's internal notices and OS-level system notifications.
 *
 * Key features:
 * - Shows interactive Obsidian notices with action buttons (complete, snooze, dismiss)
 * - Displays system notifications that appear in the OS notification center
 * - Respects user settings for which notification types to show
 * - Handles notification permissions for system notifications
 */
export class NotificationService {
    private plugin: ReminderPlugin;  // Reference to main plugin for accessing settings and methods

    /**
     * Constructor for the notification service.
     *
     * @param plugin - The main plugin instance for accessing settings and other services
     */
    constructor(plugin: ReminderPlugin) {
        this.plugin = plugin;
    }

    /**
     * Main method to display a reminder to the user.
     * This checks user settings and shows appropriate notification types.
     *
     * @param reminder - The reminder to display
     */
    async showReminder(reminder: Reminder): Promise<void> {
        // Get current user settings to determine which notification types to show
        const settings = this.plugin.settings;

        // Show Obsidian's in-app notice if user has this enabled
        // This appears as a popup within Obsidian with action buttons
        if (settings.showObsidianNotice) {
            this.showObsidianNotice(reminder);
        }

        // Show OS system notification if user has this enabled
        // This appears in the system notification center/area
        if (settings.showSystemNotification) {
            await this.showSystemNotification(reminder);
        }
    }

    /**
     * Shows an interactive notice within Obsidian.
     * This creates a popup with the reminder message and action buttons.
     *
     * @param reminder - The reminder to display
     */
    private showObsidianNotice(reminder: Reminder) {
        // Create a Notice that doesn't auto-dismiss (0 = no timeout)
        // This ensures users see the reminder until they take action
        const notice = new Notice('', 0);

        // Create a container for our custom notice content
        const content = notice.noticeEl.createDiv({ cls: 'reminder-notice' });

        // Create the message section
        const messageEl = content.createDiv();
        messageEl.createEl('strong', { text: '🔔 Reminder' });  // Header with bell icon
        messageEl.createEl('div', { text: reminder.message });         // The actual reminder text

        // Create container for action buttons
        const actionsEl = content.createDiv({ cls: 'reminder-notice-actions' });

        // "Complete" button - marks the reminder as done
        const completeBtn = actionsEl.createEl('button', {
            text: 'Complete',
            cls: 'mod-cta'  // Obsidian's call-to-action button style (usually blue/prominent)
        });
        completeBtn.addEventListener('click', async () => {
            // Mark the reminder as completed in the data store
            await this.plugin.dataManager.completeReminder(reminder.id);
            // Hide this notice since it's been handled
            notice.hide();
            // Show confirmation that the action was successful
            new Notice('✅ Reminder completed');
        });

        // "Snooze" button - temporarily hides the reminder
        const snoozeBtn = actionsEl.createEl('button', { text: 'Snooze' });
        snoozeBtn.addEventListener('click', () => {
            // Hide the notice first
            notice.hide();

            // Open the snooze modal to let user choose snooze duration
            const modal = new SnoozeSuggestModal(
                this.plugin.app,
                reminder,
                this.plugin,
                async (minutes: number) => {
                    // Calculate when to show the reminder again
                    const snoozeUntil = addMinutes(new Date(), minutes).toISOString();
                    // Update the reminder with snooze information
                    await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);

                    // Show user-friendly confirmation
                    const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                    new Notice(`⏰ Reminder snoozed for ${timeLabel}`);
                }
            );
            modal.open();
        });

        // "Close" button - dismisses the notice without taking action
        // Uses × symbol for a clear "close" indication
        const closeBtn = actionsEl.createEl('button', { text: '×' });
        closeBtn.addEventListener('click', () => {
            // Simply hide the notice
            // The reminder remains unchanged and will trigger again based on scheduler logic
            notice.hide();
        });
    }

    /**
     * Shows a system-level notification (appears in OS notification center).
     * This handles permission requests and creates notifications that persist outside Obsidian.
     *
     * @param reminder - The reminder to display
     */
    private async showSystemNotification(reminder: Reminder): Promise<void> {
        // Check if the browser supports the Notification API
        if (!('Notification' in window)) return;

        // Request permission if we haven't asked before
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
        }

        // Don't show notification if user has denied permission
        if (Notification.permission !== 'granted') return;

        // Create the system notification
        const notification = new Notification('Obsidian Reminder', {
            body: reminder.message,                    // The reminder text
            tag: reminder.id,                         // Unique ID to prevent duplicates
            requireInteraction: true                   // Notification stays visible until user interacts
            // Note: Could make this conditional based on priority:
            // requireInteraction: reminder.priority === 'urgent' || reminder.priority === 'high'
        });

        // Handle clicks on the system notification
        notification.onclick = () => {
            // Bring Obsidian window to focus
            window.focus();
            // Open the reminders sidebar to show all reminders
            this.plugin.openReminderSidebar();
            // Close the system notification
            notification.close();
        };
    }
}
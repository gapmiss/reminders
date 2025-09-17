import { type App, Modal } from "obsidian";
import type { Reminder } from '../types';
import { format } from 'date-fns';
import { UI_CONFIG, DATE_FORMATS } from '../constants';

/**
 * Confirmation dialog for deleting reminders.
 * This modal prevents accidental deletions by requiring explicit user confirmation.
 * Shows a preview of the reminder being deleted and warns about irreversibility.
 *
 * Key features:
 * - Shows reminder preview (message, time, snooze status)
 * - Clear warning about permanent deletion
 * - Focuses cancel button by default for safety
 * - Executes callback only on explicit confirmation
 */
export class ConfirmDeleteModal extends Modal {
    private reminder: Reminder;       // The reminder to be deleted
    private onConfirm: () => void;   // Callback function to execute if user confirms deletion

    /**
     * Constructor for the delete confirmation modal.
     *
     * @param app - Obsidian app instance
     * @param reminder - The reminder that will be deleted
     * @param onConfirm - Function to call if user confirms deletion
     */
    constructor(app: App, reminder: Reminder, onConfirm: () => void) {
        super(app);
        this.reminder = reminder;
        this.onConfirm = onConfirm;
    }

    /**
     * Called when the modal is opened.
     * Builds the confirmation dialog interface.
     */
    onOpen() {
        const { contentEl } = this;
        // Clear any existing content
        contentEl.empty();
        // Add CSS class for styling
        contentEl.addClass('confirm-delete-modal');

        // Main title
        contentEl.createEl('h2', { text: 'Delete Reminder' });

        // Message section containing question, preview, and warning
        const messageEl = contentEl.createDiv({ cls: 'confirm-message' });

        // Confirmation question
        messageEl.createEl('p', { text: 'Are you sure you want to delete this reminder?' });

        // Preview of the reminder being deleted
        // This helps users confirm they're deleting the right reminder
        const reminderPreview = messageEl.createDiv({ cls: 'reminder-preview' });
        // Show the reminder message prominently
        reminderPreview.createEl('strong', { text: this.reminder.message });

        // Show the reminder date/time
        let timeStr = 'No date set';
        if (this.reminder.datetime) {
            const reminderDate = new Date(this.reminder.datetime);
            if (!isNaN(reminderDate.getTime())) {
                timeStr = format(reminderDate, DATE_FORMATS.TIME_LONG);
            } else {
                timeStr = 'Invalid date';
            }
        }
        reminderPreview.createEl('div', {
            text: timeStr,
            cls: 'reminder-time'
        });

        // Show snooze status if applicable
        if (this.reminder.snoozedUntil) {
            const snoozedDate = new Date(this.reminder.snoozedUntil);
            if (!isNaN(snoozedDate.getTime())) {
                const snoozeUntil = `${format(snoozedDate, DATE_FORMATS.TIME_SHORT)}`;
                const snoozeSpan = reminderPreview.createSpan({
                    text: `⏰ Snoozed until ${snoozeUntil}`,
                    cls: 'reminder-snoozed'
                });
            }
        }

        // Warning about permanence
        messageEl.createEl('p', {
            text: 'This action cannot be undone.',
            cls: 'warning-text'
        });

        // Action buttons
        const buttonDiv = contentEl.createDiv({ cls: 'confirm-buttons' });

        // Cancel button - closes modal without doing anything
        const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        // Delete button - performs the actual deletion
        const deleteBtn = buttonDiv.createEl('button', {
            text: 'Delete',
            cls: 'mod-warning'  // Obsidian's warning button style (usually red)
        });
        deleteBtn.addEventListener('click', () => {
            // Execute the deletion callback
            this.onConfirm();
            // Close the modal
            this.close();
        });

        // Focus the cancel button by default for safety
        // This prevents accidental deletions if user presses Enter quickly
        setTimeout(() => cancelBtn.focus(), UI_CONFIG.FOCUS_DELAY);
    }

    /**
     * Called when the modal is closed.
     * Cleans up the modal content.
     */
    onClose() {
        const { contentEl } = this;
        // Clear the content to free up memory
        contentEl.empty();
    }
}

import { type App, Modal } from "obsidian";
import type { Reminder } from '../types';
import { formatDateDisplayLong, formatSnoozeTime } from '../utils/dateUtils';
import { UI_CONFIG, DATE_FORMATS } from '../constants';

/**
 * Configuration for confirmation dialog
 */
interface ConfirmDialogConfig {
    title: string;
    message: string;
    warning: string;
    confirmButtonText: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

/**
 * Confirmation dialog for deleting reminders and other dangerous actions.
 * This modal prevents accidental deletions by requiring explicit user confirmation.
 * Supports both single reminder deletion and generic confirmation dialogs.
 *
 * Key features:
 * - Shows reminder preview for single reminder deletion
 * - Supports generic confirmation with custom messages
 * - Clear warning about permanent deletion
 * - Focuses cancel button by default for safety
 * - Executes callback only on explicit confirmation
 */
export class ConfirmDeleteModal extends Modal {
    private reminder?: Reminder;              // The reminder to be deleted (for single reminder mode)
    private config?: ConfirmDialogConfig;     // Configuration for generic confirmation
    private onConfirm: () => void;            // Callback function to execute if user confirms
    private onCancel?: () => void;            // Optional callback for cancel action

    /**
     * Constructor for single reminder deletion.
     *
     * @param app - Obsidian app instance
     * @param reminder - The reminder that will be deleted
     * @param onConfirm - Function to call if user confirms deletion
     */
    constructor(app: App, reminder: Reminder, onConfirm: () => void);
    /**
     * Constructor for generic confirmation dialog.
     *
     * @param app - Obsidian app instance
     * @param config - Configuration for the confirmation dialog
     */
    constructor(app: App, config: ConfirmDialogConfig);
    constructor(app: App, reminderOrConfig: Reminder | ConfirmDialogConfig, onConfirm?: () => void) {
        super(app);

        if ('id' in reminderOrConfig) {
            // Single reminder deletion mode
            this.reminder = reminderOrConfig;
            this.onConfirm = onConfirm!;
        } else {
            // Generic confirmation mode
            this.config = reminderOrConfig;
            this.onConfirm = reminderOrConfig.onConfirm;
            this.onCancel = reminderOrConfig.onCancel;
        }
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

        if (this.reminder) {
            // Single reminder deletion mode
            this.renderReminderDeletion();
        } else if (this.config) {
            // Generic confirmation mode
            this.renderGenericConfirmation();
        }
    }

    /**
     * Renders the reminder deletion confirmation interface.
     */
    private renderReminderDeletion() {
        const { contentEl } = this;

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
        reminderPreview.createEl('strong', { text: this.reminder!.message });

        // Show the reminder date/time
        const timeStr = formatDateDisplayLong(this.reminder!.datetime, 'No date set');
        reminderPreview.createEl('div', {
            text: timeStr,
            cls: 'reminder-time'
        });

        // Show snooze status if applicable
        if (this.reminder!.snoozedUntil) {
            const snoozeSpan = reminderPreview.createSpan({
                text: formatSnoozeTime(this.reminder!.snoozedUntil),
                cls: 'reminder-snoozed'
            });
        }

        // Warning about permanence
        messageEl.createEl('p', {
            text: 'This action cannot be undone.',
            cls: 'warning-text'
        });

        this.renderButtons('Cancel', 'Delete');
    }

    /**
     * Renders the generic confirmation interface.
     */
    private renderGenericConfirmation() {
        const { contentEl } = this;

        // Main title
        contentEl.createEl('h2', { text: this.config!.title });

        // Message section
        const messageEl = contentEl.createDiv({ cls: 'confirm-message' });

        // Main message
        messageEl.createEl('p', { text: this.config!.message });

        // Warning text
        messageEl.createEl('p', {
            text: this.config!.warning,
            cls: 'warning-text'
        });

        this.renderButtons('Cancel', this.config!.confirmButtonText);
    }

    /**
     * Renders the action buttons.
     */
    private renderButtons(cancelText: string, confirmText: string) {
        const { contentEl } = this;

        // Action buttons
        const buttonDiv = contentEl.createDiv({ cls: 'confirm-buttons' });

        // Cancel button - closes modal without doing anything
        const cancelBtn = buttonDiv.createEl('button', { text: cancelText });
        cancelBtn.addEventListener('click', () => {
            if (this.onCancel) {
                this.onCancel();
            }
            this.close();
        });

        // Confirm button - performs the action
        const confirmBtn = buttonDiv.createEl('button', {
            text: confirmText,
            cls: 'mod-warning'  // Obsidian's warning button style (usually red)
        });
        confirmBtn.addEventListener('click', () => {
            // Execute the confirmation callback
            this.onConfirm();
            // Close the modal
            this.close();
        });

        // Focus the cancel button by default for safety
        // This prevents accidental actions if user presses Enter quickly
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

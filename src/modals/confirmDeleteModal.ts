import { type App, Modal } from "obsidian";
import { type Reminder } from "./reminderModal";

export class ConfirmDeleteModal extends Modal {
    private reminder: Reminder;
    private onConfirm: () => void;

    constructor(app: App, reminder: Reminder, onConfirm: () => void) {
        super(app);
        this.reminder = reminder;
        this.onConfirm = onConfirm;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('confirm-delete-modal');

        // Title
        contentEl.createEl('h2', { text: 'Delete Reminder' });

        // Message
        const messageEl = contentEl.createDiv({ cls: 'confirm-message' });
        messageEl.createEl('p', { text: 'Are you sure you want to delete this reminder?' });

        const reminderPreview = messageEl.createDiv({ cls: 'reminder-preview' });
        reminderPreview.createEl('strong', { text: this.reminder.message });

        const timeStr = window.moment(this.reminder.datetime).format('MMM D, YYYY h:mm A');
        reminderPreview.createEl('div', {
            text: timeStr,
            cls: 'reminder-time'
        });

        // Warning
        messageEl.createEl('p', {
            text: 'This action cannot be undone.',
            cls: 'warning-text'
        });

        // Buttons
        const buttonDiv = contentEl.createDiv({ cls: 'confirm-buttons' });

        const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const deleteBtn = buttonDiv.createEl('button', {
            text: 'Delete',
            cls: 'mod-warning'
        });
        deleteBtn.addEventListener('click', () => {
            this.onConfirm();
            this.close();
        });

        // Focus cancel button by default
        setTimeout(() => cancelBtn.focus(), 100);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

import { type App, Modal, MarkdownView, Setting, TFile, Notice } from "obsidian";
// import ReminderPlugin from "../main";

export interface Reminder {
    id: string;
    message: string;
    datetime: string; // ISO string
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: string;
    sourceNote?: string;
    sourceLine?: number;
    completed: boolean;
    completedAt?: string;
    snoozedUntil?: string;
    snoozeCount: number;
    created: string;
    updated: string;
}

export class ReminderModal extends Modal {
    private reminder: Partial<Reminder>;
    private onSubmit: (reminder: Reminder, isEdit: boolean) => void;
    private isEdit: boolean;

    constructor(
        app: App,
        onSubmit: (reminder: Reminder, isEdit: boolean) => void,
        existingReminder?: Partial<Reminder>
    ) {
        super(app);
        this.onSubmit = onSubmit;
        this.isEdit = !!existingReminder?.id;

        this.reminder = existingReminder || {
            message: '',
            datetime: window.moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),
            priority: 'normal',
            category: ''
        };

        // Auto-populate context if creating from active note
        if (!existingReminder) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                this.reminder.sourceNote = activeFile.path;
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    const cursor = view.editor.getCursor();
                    this.reminder.sourceLine = cursor.line;

                    const selection = view.editor.getSelection();
                    if (selection) {
                        this.reminder.message = `Reminder: ${selection}`;
                    }
                }
            }
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('reminder-modal');

        contentEl.createEl('h2', {
            text: this.isEdit ? 'Edit Reminder' : 'Create Reminder'
        });

        // Message input
        new Setting(contentEl)
            .setName('Message')
            .setDesc('What should I remind you about?')
            .addTextArea(text => {
                text.setPlaceholder('Enter your reminder message...')
                    .setValue(this.reminder.message || '')
                    .onChange(value => {
                        this.reminder.message = value;
                    });

                text.inputEl.addClass('reminder-textarea')
                setTimeout(() => text.inputEl.focus(), 100);
            });

        // Date and time picker
        new Setting(contentEl)
            .setName('Date & Time')
            .setDesc('When should I remind you?')
            .addText(text => {
                text.inputEl.type = 'datetime-local';
                text.setValue(this.reminder.datetime || '')
                    .onChange(value => {
                        this.reminder.datetime = value;
                    });
            });

        // Quick time buttons
        const quickTimeDiv = contentEl.createDiv({ cls: 'quick-time-buttons' });
        quickTimeDiv.createEl('span', { text: 'Quick times: ' });

        const quickTimes = [
            { label: '1 hour', hours: 1 },
            { label: '4 hours', hours: 4 },
            { label: 'Tomorrow 9am', time: window.moment().add(1, 'day').hour(9).minute(0) }
        ];

        quickTimes.forEach(qt => {
            const btn = quickTimeDiv.createEl('button', { text: qt.label });
            btn.addEventListener('click', () => {
                let newTime;
                if (qt.hours) {
                    newTime = window.moment().add(qt.hours, 'hours');
                } else {
                    newTime = qt.time as moment.Moment;
                }
                this.reminder.datetime = newTime.format('YYYY-MM-DDTHH:mm');
                this.refreshDateTime();
            });
        });

        // Priority selection
        new Setting(contentEl)
            .setName('Priority')
            .setDesc('How important is this reminder?')
            .addDropdown(dropdown => {
                dropdown.addOption('low', '🔵 Low')
                    .addOption('normal', '⚪ Normal')
                    .addOption('high', '🟡 High')
                    .addOption('urgent', '🔴 Urgent')
                    .setValue(this.reminder.priority || 'normal')
                    .onChange(value => {
                        this.reminder.priority = value as any;
                    });
            });

        // Category input
        new Setting(contentEl)
            .setName('Category')
            .setDesc('Optional: organize your reminders')
            .addText(text => {
                text.setPlaceholder('work, personal, health...')
                    .setValue(this.reminder.category || '')
                    .onChange(value => {
                        this.reminder.category = value;
                    });
            });

        // Source note display
        if (this.reminder.sourceNote) {
            new Setting(contentEl)
                .setName('Linked to note')
                .setDesc(this.reminder.sourceNote)
                .addButton(button => {
                    button.setButtonText('Open note')
                        .onClick(() => {
                            const file = this.app.vault.getAbstractFileByPath(this.reminder.sourceNote!);
                            if (file instanceof TFile) {
                                this.app.workspace.openLinkText(file.path, '');
                            }
                        });
                });
        }

        // Action buttons
        const buttonDiv = contentEl.createDiv({ cls: 'reminder-modal-buttons' });

        const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const saveBtn = buttonDiv.createEl('button', {
            text: this.isEdit ? 'Update' : 'Create',
            cls: 'mod-cta'
        });
        saveBtn.addEventListener('click', () => this.handleSubmit());
    }

    private refreshDateTime() {
        // Find and update the datetime input
        const datetimeInput = this.contentEl.querySelector('input[type="datetime-local"]') as HTMLInputElement;
        if (datetimeInput && this.reminder.datetime) {
            datetimeInput.value = this.reminder.datetime;
        }
    }

    private handleSubmit() {
        if (!this.reminder.message?.trim()) {
            new Notice('Please enter a message for your reminder');
            return;
        }

        if (!this.reminder.datetime) {
            new Notice('Please select a date and time');
            return;
        }

        if (window.moment(this.reminder.datetime).isBefore(window.moment()) && !this.reminder.completed) {
            new Notice('Please select a future date and time');
            return;
        }

        if (!this.reminder.id) {
            this.reminder.id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        this.onSubmit(this.reminder as Reminder, this.isEdit);
        this.close();
    }
}
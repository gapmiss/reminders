import { type App, Modal, MarkdownView, Setting, TFile, FuzzySuggestModal, Notice } from "obsidian";
import ReminderPlugin from "../main";

/**
 * Main interface defining the structure of a reminder.
 * This is the core data type used throughout the plugin.
 */
export interface Reminder {
    id: string;                                           // Unique identifier for the reminder
    message: string;                                      // The reminder text shown to the user
    datetime: string;                                     // When to trigger (ISO string format)
    priority: 'low' | 'normal' | 'high' | 'urgent';     // Importance level
    category: string;                                     // Optional organization category
    sourceNote?: string;                                  // Optional link to source note file path
    sourceLine?: number;                                  // Optional link to specific line in note
    completed: boolean;                                   // Whether the reminder has been finished
    completedAt?: string;                                 // When it was completed (ISO string)
    snoozedUntil?: string;                               // When snoozed reminder should reappear (ISO string)
    snoozeCount: number;                                  // How many times this reminder has been snoozed
    created: string;                                      // When reminder was created (ISO string)
    updated: string;                                      // When reminder was last modified (ISO string)
}

/**
 * Modal dialog for creating and editing reminders.
 * This provides a comprehensive form interface for all reminder properties.
 *
 * Key features:
 * - Create new reminders or edit existing ones
 * - Auto-populate context from active note and selection
 * - Quick time selection buttons for common durations
 * - File linking with picker modal
 * - Form validation and error handling
 * - Responsive UI that adapts to edit vs create mode
 */
export class ReminderModal extends Modal {
    private reminder: Partial<Reminder>;                              // Reminder data being edited (partial for new reminders)
    private onSubmit: (reminder: Reminder, isEdit: boolean) => void;  // Callback when user submits the form
    private isEdit: boolean;                                          // Whether we're editing existing reminder or creating new one
    plugin: ReminderPlugin;                                           // Plugin instance for accessing settings and methods

    /**
     * Constructor for the reminder modal.
     *
     * @param app - Obsidian app instance
     * @param plugin - Plugin instance for accessing settings
     * @param onSubmit - Callback function called when user submits the form
     * @param existingReminder - Optional existing reminder data for edit mode
     */
    constructor(
        app: App,
        plugin: ReminderPlugin,
        onSubmit: (reminder: Reminder, isEdit: boolean) => void,
        existingReminder?: Partial<Reminder>
    ) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
        // Determine if we're editing based on whether existing reminder has an ID
        this.isEdit = !!existingReminder?.id;

        // Initialize reminder data with existing data or sensible defaults
        this.reminder = existingReminder || {
            message: '',                                                                    // Empty message for user to fill
            datetime: window.moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm'),         // Default to 1 hour from now
            priority: this.plugin.settings.defaultPriority,                               // Use user's default priority setting
            category: ''                                                                   // Empty category
        };

        // For existing reminders, convert ISO datetime to format compatible with datetime-local input
        if (existingReminder?.datetime) {
            this.reminder.datetime = window.moment(existingReminder.datetime).format('YYYY-MM-DDTHH:mm');
        }

        // Auto-populate context if creating a new reminder from the active note
        if (!existingReminder) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                // Link the reminder to the currently active file
                this.reminder.sourceNote = activeFile.path;
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    // Link to the current cursor position
                    const cursor = view.editor.getCursor();
                    this.reminder.sourceLine = cursor.line;

                    // If text is selected, use it as the reminder message
                    const selection = view.editor.getSelection();
                    if (selection) {
                        this.reminder.message = `Reminder: ${selection}`;
                    }
                }
            }
        }
    }

    /**
     * Called when the modal is opened.
     * Builds the entire form interface for creating/editing reminders.
     */
    onOpen() {
        const { contentEl } = this;
        // Clear any existing content
        contentEl.empty();
        // Add CSS class for styling
        contentEl.addClass('reminder-modal');

        // Main title - changes based on edit vs create mode
        contentEl.createEl('h2', {
            text: this.isEdit ? 'Edit Reminder' : 'Create Reminder'
        });

        // Message input field
        // This is the main content of the reminder that will be shown to the user
        new Setting(contentEl)
            .setName('Message')
            .setDesc('What should I remind you about?')
            .addTextArea(text => {
                text.setPlaceholder('Enter your reminder message...')
                    .setValue(this.reminder.message || '')    // Pre-fill with existing value
                    .onChange(value => {
                        this.reminder.message = value;        // Update reminder data as user types
                    });

                // Add CSS class for styling and focus the field
                text.inputEl.addClass('reminder-textarea')
                setTimeout(() => text.inputEl.focus(), 100);  // Focus after modal opens
            });

        // Date and time picker
        // Uses HTML5 datetime-local input for native date/time selection
        new Setting(contentEl)
            .setName('Date & Time')
            .setDesc('When should I remind you?')
            .addText(text => {
                // Set input type to datetime-local for native picker
                text.inputEl.type = 'datetime-local';
                text.setValue(this.reminder.datetime || '')     // Pre-fill with existing value
                    .onChange(value => {
                        this.reminder.datetime = value;         // Update reminder data when changed
                    });
            });

        // Quick time selection buttons
        // These provide shortcuts for common reminder times to save users from manual input
        const quickTimeDiv = contentEl.createDiv({ cls: 'quick-time-buttons' });
        quickTimeDiv.createEl('span', { text: 'Quick times: ' });

        // Define common time presets that users frequently need
        const quickTimes = [
            { label: '15 mins', minutes: 15 },     // Short-term reminders
            { label: '30 mins', minutes: 30 },     // Half hour delay
            { label: '1 hr', hours: 1 },          // One hour from now
            { label: '4 hrs', hours: 4 },         // Later today
            { label: 'Tomorrow 9am', time: window.moment().add(1, 'day').hour(9).minute(0) }  // Next morning
        ];

        // Create a button for each quick time option
        quickTimes.forEach(qt => {
            const btn = quickTimeDiv.createEl('button', { text: qt.label });
            btn.addEventListener('click', () => {
                // Calculate the target time based on the button clicked
                let newTime;
                if (qt.hours) {
                    // Add specified hours to current time
                    newTime = window.moment().add(qt.hours, 'hours');
                } else if (qt.minutes) {
                    // Add specified minutes to current time
                    newTime = window.moment().add(qt.minutes, 'minutes');
                } else {
                    // Use specific time (like "Tomorrow 9am")
                    newTime = qt.time as moment.Moment;
                }
                // Update the reminder data and refresh the datetime input
                this.reminder.datetime = newTime.format('YYYY-MM-DDTHH:mm');
                this.refreshDateTime();
            });
        });

        // Priority selection dropdown
        // Helps users categorize reminders by importance level
        new Setting(contentEl)
            .setName('Priority')
            .setDesc('How important is this reminder?')
            .addDropdown(dropdown => {
                dropdown.addOption('low', '🔵 Low')        // Blue circle - least urgent
                    .addOption('normal', '⚪ Normal')    // White circle - standard priority
                    .addOption('high', '🟡 High')        // Yellow circle - important
                    .addOption('urgent', '🔴 Urgent')      // Red circle - needs immediate attention
                    .setValue(this.reminder.priority || 'normal')  // Pre-select current priority
                    .onChange(value => {
                        this.reminder.priority = value as any;    // Update reminder data
                    });
            });

        // Category input field
        // Optional organizational tool for grouping related reminders
        new Setting(contentEl)
            .setName('Category')
            .setDesc('Optional: organize your reminders')
            .addText(text => {
                text.setPlaceholder('work, personal, health...')  // Give examples of common categories
                    .setValue(this.reminder.category || '')       // Pre-fill with existing value
                    .onChange(value => {
                        this.reminder.category = value;           // Update reminder data
                    });
            });

        // Note linking section
        // This allows users to associate reminders with specific notes for context
        let toggleComponent: any; // Store reference to toggle component for later access
        new Setting(contentEl)
            .setName('Link to note')
            .setDesc(this.reminder.sourceNote || 'No note linked')  // Show current link status
            .addToggle(toggle => {
                toggleComponent = toggle; // Store reference for later updates
                toggle
                    .setValue(!!this.reminder.sourceNote)  // Set toggle based on whether note is linked
                    .onChange(async (value) => {
                        if (value) {
                            // User wants to link a note - open file picker
                            new FileSuggestModal(this.app, (selectedFile) => {
                                if (selectedFile) {
                                    // User selected a file
                                    this.reminder.sourceNote = selectedFile.path;
                                    // Update the UI to show the linked note
                                    const setting = contentEl.querySelector('.setting-item.mod-toggle > .setting-item-info > .setting-item-description') as HTMLElement;
                                    if (setting) {
                                        setting.textContent = selectedFile.path;
                                    }
                                    new Notice(`Linked reminder to: ${selectedFile.basename}`);
                                } else {
                                    // User cancelled file selection, turn toggle back off
                                    toggle.setValue(false);
                                }
                            }).open();
                        } else {
                            // User wants to unlink the note
                            this.reminder.sourceNote = '';
                            // Update the UI to show no link
                            const setting = contentEl.querySelector('.setting-item.mod-toggle > .setting-item-info > .setting-item-description') as HTMLElement;
                            if (setting) {
                                setting.textContent = 'No note linked';
                            }
                            new Notice('Unlinked reminder from note');
                        }
                    });
            })
            .addButton(button => {
                // Add a button that changes behavior based on link status
                if (this.reminder.sourceNote) {
                    // If note is linked, show "Open" button to navigate to it
                    button
                        .setButtonText('Open')
                        .setTooltip('Open linked note')
                        .setClass('mod-cta')  // Prominent button style
                        .onClick(() => {
                            // Try to open the linked file
                            const file = this.app.vault.getAbstractFileByPath(this.reminder.sourceNote!);
                            if (file instanceof TFile) {
                                this.app.workspace.openLinkText(file.path, '');
                            } else {
                                new Notice('Linked file not found');
                            }
                        });
                }
                else {
                    // If no note is linked, show "Select" button to choose one
                    button
                        .setButtonText('Select')
                        .setTooltip('Select a note to link')
                        .onClick(async () => {
                            // Alternative way to open file picker (same as toggle functionality)
                            new FileSuggestModal(this.app, async (selectedFile) => {
                                if (selectedFile) {
                                    // User selected a file
                                    this.reminder.sourceNote = selectedFile.path;
                                    // Update toggle state to reflect the link
                                    toggleComponent.setValue(true);
                                    // Update the description text
                                    const setting = contentEl.querySelector('.setting-item:last-child .setting-item-description') as HTMLElement;
                                    if (setting) {
                                        setting.textContent = selectedFile.path;
                                    }
                                    // Update button to "Open" mode
                                    button
                                        .setButtonText('Open')
                                        .setTooltip('Open linked note')
                                        .setClass('mod-cta');

                                    new Notice(`Linked reminder to: ${selectedFile.basename}`);
                                }
                            }).open();
                        });
                }
            });

        // Action buttons at bottom of modal
        const buttonDiv = contentEl.createDiv({ cls: 'reminder-modal-buttons' });

        // Cancel button - closes modal without saving
        const cancelBtn = buttonDiv.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => {
            this.close();  // Close without triggering onSubmit callback
        });

        // Save/Update button - validates and saves the reminder
        const saveBtn = buttonDiv.createEl('button', {
            text: this.isEdit ? 'Update' : 'Create',  // Different text for edit vs create mode
            cls: 'mod-cta'  // Prominent button style
        });
        saveBtn.addEventListener('click', () => this.handleSubmit());
    }

    /**
     * Updates the datetime input field with the current reminder datetime value.
     * This is called when quick time buttons are clicked to sync the input display.
     */
    private refreshDateTime() {
        // Find the datetime input element in the modal
        const datetimeInput = this.contentEl.querySelector('input[type="datetime-local"]') as HTMLInputElement;
        if (datetimeInput && this.reminder.datetime) {
            // Update the input's displayed value
            datetimeInput.value = this.reminder.datetime;
        }
    }

    /**
     * Validates the form data and submits the reminder.
     * Performs comprehensive validation before calling the onSubmit callback.
     */
    private handleSubmit() {
        // Validate that user entered a message
        if (!this.reminder.message?.trim()) {
            new Notice('Please enter a message for your reminder');
            return;
        }

        // Validate that user selected a date/time
        if (!this.reminder.datetime) {
            new Notice('Please select a date and time');
            return;
        }

        // Validate that the time is in the future (for new incomplete reminders)
        // Allow past times for completed reminders or when editing
        if (window.moment(this.reminder.datetime).isBefore(window.moment()) && !this.reminder.completed) {
            new Notice('Please select a future date and time');
            return;
        }

        // Generate ID for new reminders (existing reminders already have one)
        if (!this.reminder.id) {
            this.reminder.id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Convert datetime to ISO format with seconds for consistent timing precision
        // The modal uses 'YYYY-MM-DDTHH:mm' format, but we need full ISO string for consistency with snoozedUntil
        this.reminder.datetime = window.moment(this.reminder.datetime).toISOString();

        // All validation passed - submit the reminder
        this.onSubmit(this.reminder as Reminder, this.isEdit);
        this.close();
    }
}

/**
 * Custom file picker modal for selecting notes to link to reminders.
 * Extends Obsidian's FuzzySuggestModal to provide file search functionality.
 *
 * Key features:
 * - Fuzzy search through all markdown files in the vault
 * - Real-time filtering as user types
 * - Keyboard navigation support
 * - Callback-based result handling
 */
class FileSuggestModal extends FuzzySuggestModal<TFile> {
    private onSubmit: (file: TFile) => void;  // Callback function for when user selects a file

    /**
     * Constructor for the file suggestion modal.
     *
     * @param app - Obsidian app instance
     * @param onSubmit - Callback function called when user selects a file
     */
    constructor(app: App, onSubmit: (file: TFile) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.setPlaceholder('Search for a file to link...');
    }

    /**
     * Returns all available items for the suggest modal.
     * Gets all markdown files in the vault.
     *
     * @returns Array of TFile objects representing markdown files
     */
    getItems(): TFile[] {
        return this.app.vault.getMarkdownFiles();
    }

    /**
     * Returns the text to display and search against for each file.
     * Uses the full file path for comprehensive searching.
     *
     * @param file - The file to get display text for
     * @returns The file path as a string
     */
    getItemText(file: TFile): string {
        return file.path;
    }

    /**
     * Called when user selects a file (by clicking or pressing Enter).
     * Executes the callback and closes the modal.
     *
     * @param file - The selected file
     * @param evt - The triggering mouse or keyboard event
     */
    onChooseItem(file: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.onSubmit(file);  // Call the callback with selected file
        this.close();         // Close the modal
    }
}
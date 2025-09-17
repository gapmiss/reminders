import { type App, Modal, MarkdownView, Setting, TFile, FuzzySuggestModal, Notice } from "obsidian";
import ReminderPlugin from "../main";
import { formatForInput, createDateHoursFromNow, createTomorrow9AM, isInPast, parseDate } from '../utils/dateUtils';
import { addMinutes } from 'date-fns';
import type { Reminder, ReminderPriority } from '../types';
import { UI_CONFIG, DATE_FORMATS, PRIORITY_CONFIG, CSS_CLASSES, QUICK_TIME_PRESETS } from '../constants';
import { ErrorCategory } from '../utils/errorHandling';

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
    private reminder: Partial<Reminder>;                              // Original reminder data (unchanged until form submission)
    private formData: Partial<Reminder>;                              // Form data being edited (temporary until submission)
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

        // Initialize original reminder data (unchanged until form submission)
        this.reminder = existingReminder || {};

        // Initialize form data with existing data or sensible defaults
        this.formData = existingReminder ? { ...existingReminder } : {
            message: '',                                                                    // Empty message for user to fill
            datetime: formatForInput(createDateHoursFromNow(UI_CONFIG.DEFAULT_HOURS_AHEAD)),         // Default to 1 hour from now
            priority: this.plugin.settings.defaultPriority,                               // Use user's default priority setting
            category: ''                                                                   // Empty category
        };

        // For existing reminders, convert ISO datetime to format compatible with datetime-local input
        if (existingReminder?.datetime) {
            this.formData.datetime = formatForInput(existingReminder.datetime);
        }

        // Auto-populate context if creating a new reminder from the active note
        if (!existingReminder) {
            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                // Link the reminder to the currently active file
                this.formData.sourceNote = activeFile.path;
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    // Link to the current cursor position
                    const cursor = view.editor.getCursor();
                    this.formData.sourceLine = cursor.line;

                    // If text is selected, use it as the reminder message
                    const selection = view.editor.getSelection();
                    if (selection) {
                        this.formData.message = `Reminder: ${selection}`;
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
        contentEl.addClass(CSS_CLASSES.MODAL);

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
                    .setValue(this.formData.message || '')    // Pre-fill with existing value
                    .onChange(value => {
                        this.formData.message = value;        // Update form data as user types
                    });

                // Add CSS class for styling and focus the field
                text.inputEl.addClass(CSS_CLASSES.TEXTAREA)
                setTimeout(() => text.inputEl.focus(), UI_CONFIG.FOCUS_DELAY);  // Focus after modal opens
            });

        // Date and time picker
        // Uses HTML5 datetime-local input for native date/time selection
        new Setting(contentEl)
            .setName('Date & Time')
            .setDesc('When should I remind you?')
            .addText(text => {
                // Set input type to datetime-local for native picker
                text.inputEl.type = 'datetime-local';
                text.setValue(this.formData.datetime || '')     // Pre-fill with existing value
                    .onChange(value => {
                        this.formData.datetime = value;         // Update form data when changed
                    });
            });

        // Quick time selection buttons
        // These provide shortcuts for common reminder times to save users from manual input
        const quickTimeDiv = contentEl.createDiv({ cls: CSS_CLASSES.QUICK_TIME_BUTTONS });
        quickTimeDiv.createEl('span', { text: 'Quick times: ' });

        // Define common time presets that users frequently need
        const quickTimes = [
            ...QUICK_TIME_PRESETS,
            { label: 'Tomorrow 9am', minutes: 0, time: createTomorrow9AM() }  // Next morning
        ];

        // Create a button for each quick time option
        quickTimes.forEach(qt => {
            const btn = quickTimeDiv.createEl('button', { text: qt.label });
            btn.addEventListener('click', () => {
                // Calculate the target time based on the button clicked
                let newTime;
                if ('time' in qt && qt.time instanceof Date) {
                    // Use specific time (like "Tomorrow 9am")
                    newTime = qt.time;
                } else {
                    // Add specified minutes to current time
                    newTime = addMinutes(new Date(), qt.minutes);
                }
                // Update the form data and refresh the datetime input
                this.formData.datetime = formatForInput(newTime);
                this.refreshDateTime();
            });
        });

        // Priority selection dropdown
        // Helps users categorize reminders by importance level
        new Setting(contentEl)
            .setName('Priority')
            .setDesc('How important is this reminder?')
            .addDropdown(dropdown => {
                dropdown.addOption('low', `${PRIORITY_CONFIG.low.icon} ${PRIORITY_CONFIG.low.label}`)        // Blue circle - least urgent
                    .addOption('normal', `${PRIORITY_CONFIG.normal.icon} ${PRIORITY_CONFIG.normal.label}`)    // White circle - standard priority
                    .addOption('high', `${PRIORITY_CONFIG.high.icon} ${PRIORITY_CONFIG.high.label}`)        // Yellow circle - important
                    .addOption('urgent', `${PRIORITY_CONFIG.urgent.icon} ${PRIORITY_CONFIG.urgent.label}`)      // Red circle - needs immediate attention
                    .setValue(this.formData.priority || 'normal')  // Pre-select current priority
                    .onChange(value => {
                        this.formData.priority = value as ReminderPriority;    // Update form data with proper type
                    });
            });

        // Category input field
        // Optional organizational tool for grouping related reminders
        new Setting(contentEl)
            .setName('Category')
            .setDesc('Optional: organize your reminders')
            .addText(text => {
                text.setPlaceholder('work, personal, health...')  // Give examples of common categories
                    .setValue(this.formData.category || '')       // Pre-fill with existing value
                    .onChange(value => {
                        this.formData.category = value;           // Update form data
                    });
            });

        // Note linking section
        // This allows users to associate reminders with specific notes for context
        let toggleComponent: any; // Store reference to toggle component for later access
        let buttonComponent: any; // Store reference to button component for later updates
        let isUpdatingToggle = false; // Prevent recursive onChange calls
        let wasLinkedBeforeToggle = false; // Track if file was linked before toggle change
        new Setting(contentEl)
            .setName('Link to note')
            .setDesc(this.formData.sourceNote || 'No note linked')  // Show current link status
            .addToggle(toggle => {
                toggleComponent = toggle; // Store reference for later updates
                toggle
                    .setValue(!!this.formData.sourceNote)  // Set toggle based on whether note is linked
                    .onChange(async (value) => {
                        // Prevent recursive calls when programmatically setting toggle value
                        if (isUpdatingToggle) return;

                        // Store the previous state before making changes
                        wasLinkedBeforeToggle = !!this.formData.sourceNote;

                        if (value) {
                            // User wants to link a note - open file picker
                            new FileSuggestModal(this.app, (selectedFile) => {
                                if (selectedFile) {
                                    // User selected a file
                                    this.formData.sourceNote = selectedFile.path;
                                    // Update the UI to show the linked note
                                    const setting = contentEl.querySelector('.setting-item.mod-toggle > .setting-item-info > .setting-item-description');
                                    if (setting instanceof HTMLElement) {
                                        setting.textContent = selectedFile.path;
                                    }
                                    // Ensure toggle stays on since file was selected
                                    isUpdatingToggle = true;
                                    toggle.setValue(true);
                                    isUpdatingToggle = false;
                                    // Update button to "Open" mode
                                    if (buttonComponent) {
                                        buttonComponent
                                            .setButtonText('Open')
                                            .setTooltip('Open linked note')
                                            .setClass('mod-cta');
                                    }
                                    new Notice(`Linked reminder to: ${selectedFile.basename}`);
                                } else {
                                    // User cancelled file selection, restore previous state
                                    isUpdatingToggle = true;
                                    toggle.setValue(wasLinkedBeforeToggle);
                                    isUpdatingToggle = false;
                                }
                            }).open();
                        } else {
                            // User wants to unlink the note
                            this.formData.sourceNote = '';
                            // Update the UI to show no link
                            const setting = contentEl.querySelector('.setting-item.mod-toggle > .setting-item-info > .setting-item-description');
                            if (setting instanceof HTMLElement) {
                                setting.textContent = 'No note linked';
                            }
                            // Update button to "Select" mode
                            if (buttonComponent) {
                                buttonComponent
                                    .setButtonText('Select')
                                    .setTooltip('Select a note to link');
                                // Remove the mod-cta class by accessing the button element directly
                                buttonComponent.buttonEl?.removeClass('mod-cta');
                                // Update click handler to open file picker instead of trying to open a file
                                buttonComponent.onClick(() => {
                                    new FileSuggestModal(this.app, (selectedFile) => {
                                        if (selectedFile) {
                                            // User selected a file
                                            this.reminder.sourceNote = selectedFile.path;
                                            // Update toggle state to reflect the link
                                            isUpdatingToggle = true;
                                            toggleComponent.setValue(true);
                                            isUpdatingToggle = false;
                                            // Update the description text
                                            const setting = contentEl.querySelector('.setting-item.mod-toggle > .setting-item-info > .setting-item-description');
                                            if (setting instanceof HTMLElement) {
                                                setting.textContent = selectedFile.path;
                                            }
                                            // Update button back to "Open" mode
                                            buttonComponent
                                                .setButtonText('Open')
                                                .setTooltip('Open linked note')
                                                .setClass('mod-cta');
                                            // Update click handler back to open file
                                            buttonComponent.onClick(() => {
                                                const file = this.app.vault.getAbstractFileByPath(this.reminder.sourceNote!);
                                                if (file instanceof TFile) {
                                                    this.app.workspace.openLinkText(file.path, '');
                                                } else {
                                                    new Notice('Linked file not found');
                                                }
                                            });
                                            new Notice(`Linked reminder to: ${selectedFile.basename}`);
                                        }
                                        // Note: if selectedFile is null (cancelled), do nothing - keep toggle off
                                    }).open();
                                });
                            }
                            new Notice('Unlinked reminder from note');
                        }
                    });
            })
            .addButton(button => {
                buttonComponent = button; // Store reference for updates in toggle callback
                // Add a button that changes behavior based on link status
                if (this.formData.sourceNote) {
                    // If note is linked, show "Open" button to navigate to it
                    button
                        .setButtonText('Open')
                        .setTooltip('Open linked note')
                        .setClass('mod-cta')  // Prominent button style
                        .onClick(() => {
                            // Try to open the linked file
                            const file = this.app.vault.getAbstractFileByPath(this.formData.sourceNote!);
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
                                    this.formData.sourceNote = selectedFile.path;
                                    // Update toggle state to reflect the link
                                    toggleComponent.setValue(true);
                                    // Update the description text
                                    const setting = contentEl.querySelector('.setting-item:last-child .setting-item-description');
                                    if (setting instanceof HTMLElement) {
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
        const buttonDiv = contentEl.createDiv({ cls: CSS_CLASSES.MODAL_BUTTONS });

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
        const datetimeInput = this.contentEl.querySelector('input[type="datetime-local"]');
        if (datetimeInput instanceof HTMLInputElement && this.formData.datetime) {
            // Update the input's displayed value
            datetimeInput.value = this.formData.datetime;
        }
    }

    /**
     * Validates the form data and submits the reminder.
     * Performs comprehensive validation before calling the onSubmit callback.
     */
    private handleSubmit() {
        // Validate that user entered a message
        if (!this.formData.message?.trim()) {
            this.plugin.errorHandler.handleValidationError(
                'Empty reminder message submitted',
                'Please enter a message for your reminder'
            );
            return;
        }

        // Validate that user selected a date/time
        if (!this.formData.datetime) {
            this.plugin.errorHandler.handleValidationError(
                'No datetime selected for reminder',
                'Please select a date and time'
            );
            return;
        }

        // Validate that the time is in the future (for new incomplete reminders)
        // Allow past times for completed reminders or when editing
        if (isInPast(this.formData.datetime) && !this.formData.completed) {
            this.plugin.errorHandler.handleValidationError(
                'Past datetime selected for incomplete reminder',
                'Please select a future date and time'
            );
            return;
        }

        // Create the final reminder by merging original data with form data
        const finalReminder = { ...this.reminder, ...this.formData };

        // Generate ID for new reminders (existing reminders already have one)
        if (!finalReminder.id) {
            finalReminder.id = `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }

        // Convert datetime to ISO format with seconds for consistent timing precision
        // The modal uses 'yyyy-MM-dd'T'HH:mm' format, but we need full ISO string for consistency with snoozedUntil
        if (finalReminder.datetime) {
            const parsedDate = parseDate(finalReminder.datetime);
            finalReminder.datetime = parsedDate ? parsedDate.toISOString() : finalReminder.datetime;
        }

        // All validation passed - submit the reminder
        // Type assertion is safe here because we've validated all required fields above
        this.onSubmit(finalReminder as Reminder, this.isEdit);
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
    private onSubmit: (file: TFile | null) => void;  // Callback function for when user selects a file or cancels
    private hasSelected: boolean = false;  // Track if user actually selected a file

    /**
     * Constructor for the file suggestion modal.
     *
     * @param app - Obsidian app instance
     * @param onSubmit - Callback function called when user selects a file or cancels (null)
     */
    constructor(app: App, onSubmit: (file: TFile | null) => void) {
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
        this.hasSelected = true;  // Mark that user selected a file
        this.onSubmit(file);      // Call the callback with selected file
        this.close();             // Close the modal
    }

    /**
     * Called when the modal is closed.
     * If no file was selected, call the callback with null to indicate cancellation.
     */
    onClose(): void {
        super.onClose();
        if (!this.hasSelected) {
            this.onSubmit(null);  // Call callback with null to indicate cancellation
        }
    }
}
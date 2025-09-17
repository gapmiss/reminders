import { Plugin, Notice, Menu, TFile, MarkdownView, Editor } from 'obsidian';
import { DEFAULT_SETTINGS, RemindersSettingTab, type RemindersSettings } from "./settings";
import { ReminderModal } from "./modals/reminderModal";
import type { Reminder } from './types';
import { ICONS, UI_CONFIG, DATE_FORMATS } from './constants';
import { ReminderSidebarView } from "./view";
import { ReminderDataManager } from "./managers/reminderDataManager";
import { NotificationService } from "./managers/notificationService";
import { Scheduler } from "./managers/scheduler";
import { format, addHours } from 'date-fns';

/**
 * Main plugin class that extends Obsidian's Plugin base class.
 * This is the entry point for the Reminders plugin and coordinates all functionality.
 *
 * Key responsibilities:
 * - Initialize and manage all service instances
 * - Register UI components (ribbon icons, commands, context menus)
 * - Handle plugin lifecycle (loading/unloading)
 * - Coordinate between different parts of the plugin
 */
export default class ReminderPlugin extends Plugin {
	// Core service instances - these manage different aspects of the plugin
	dataManager!: ReminderDataManager;        // Handles reminder data storage and retrieval
	notificationService!: NotificationService; // Manages displaying notifications to users
	scheduler!: Scheduler;                     // Handles timing and scheduling of reminders
	sidebarView?: ReminderSidebarView;        // Optional sidebar UI component (may not always be open)
	settings: RemindersSettings;              // Plugin configuration settings

	/**
	 * Plugin initialization method called when Obsidian loads the plugin.
	 * This method sets up all the plugin's functionality and services.
	 * It's async because some initialization steps (like loading settings) require async operations.
	 */
	async onload() {
		// Load user settings from Obsidian's data storage
		// This must happen first as other services may depend on these settings
		await this.loadSettings();

		// Add our settings tab to Obsidian's settings panel
		// This allows users to configure the plugin through the UI
		this.addSettingTab(new RemindersSettingTab(this.app, this));

		// Initialize the data manager - this handles all reminder storage operations
		// Pass 'this' (the plugin instance) so the manager can access plugin methods
		this.dataManager = new ReminderDataManager(this);

		// Initialize notification service for showing reminders to users
		this.notificationService = new NotificationService(this);
		// Initialize scheduler with dependencies - it needs the plugin, data manager, and notification service
		// The scheduler coordinates when reminders should be triggered
		this.scheduler = new Scheduler(this, this.dataManager, this.notificationService);

		// Register our custom view type with Obsidian's workspace
		// This creates the sidebar panel where users can see their reminders
		this.registerView('reminder-sidebar', (leaf) => {
			// Create a new instance of our sidebar view and store reference for later use
			this.sidebarView = new ReminderSidebarView(leaf, this);
			return this.sidebarView;
		});

		// Add the bell icon to Obsidian's ribbon (left sidebar)
		// When clicked, it opens the reminder sidebar
		this.addRibbonIcon(ICONS.BELL, 'Reminders', () => { this.openReminderSidebar() });

		// Register keyboard commands that users can trigger
		// Each command has an ID, display name, callback function, and optional hotkeys

		// Command to create a new reminder from scratch
		// Hotkey: Cmd/Ctrl + Shift + R
		this.addCommand({ id: 'create-reminder', name: 'Create new reminder', callback: () => this.openReminderModal(), hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'r' }] });

		// Command to create a reminder using selected text as the message
		// This only works when text is selected in the editor
		// Hotkey: Cmd/Ctrl + Alt + R
		this.addCommand({ id: 'create-reminder-from-selection', name: 'Create reminder from selection', editorCallback: (editor) => this.createReminderFromSelection(editor), hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'r' }] });

		// Command to show/focus the reminder sidebar
		this.addCommand({ id: 'show-reminder-sidebar', name: 'Show reminder sidebar', callback: () => this.openReminderSidebar() });

		// Register event handlers to add context menu options

		// Add reminder options to the right-click menu when editing text
		// This fires whenever a user right-clicks in an editor
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				if (view instanceof MarkdownView) {
					this.addEditorContextMenu(menu, editor, view);
				}
			})
		);

		// Add reminder options to the right-click menu on files in the file explorer
		// This only applies to markdown files (.md extension)
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') this.addFileContextMenu(menu, file);
			})
		);

		// Start the scheduler to begin checking for due reminders
		// This must be called after all other initialization is complete
		await this.scheduler.start();
	}

	/**
	 * Plugin cleanup method called when Obsidian unloads the plugin.
	 * This ensures proper cleanup of resources and prevents memory leaks.
	 */
	async onunload() {
		// Stop the scheduler to prevent it from continuing to check for reminders
		// Obsidian will automatically clear any intervals, but we call stop() for good practice
		this.scheduler.stop();
	}

	/**
	 * Adds reminder-related options to the right-click context menu in the editor.
	 * This method is called whenever a user right-clicks while editing text.
	 *
	 * @param menu - The context menu that Obsidian is about to show
	 * @param editor - The editor instance where the right-click occurred
	 * @param view - The markdown view containing the editor
	 */
	private addEditorContextMenu(menu: Menu, editor: Editor, view: MarkdownView) {
		// Check if the user has selected any text
		const selection = editor.getSelection();

		// Only add the "Create reminder from selection" option if text is selected
		if (selection) {
			menu.addItem((item) => {
				item.setTitle('Create reminder from selection')
					.setIcon(ICONS.BELL)  // Use bell icon to match our plugin theme
					.onClick(() => {
						// Create a reminder using the selected text as the message
						this.createReminderFromSelection(editor);
					});
			});
		}

		// Always add option to create a reminder at the current cursor position
		// This is useful for creating location-based reminders
		menu.addItem((item) => {
			item.setTitle('Create reminder here')
				.setIcon(ICONS.BELL)
				.onClick(() => {
					// Get the current cursor position to link the reminder to this location
					const cursor = editor.getCursor();
					this.openReminderModal({
						sourceNote: view.file?.path,  // Link to the current file
						sourceLine: cursor.line       // Link to the current line number
					});
				});
		});
	}

	/**
	 * Adds reminder-related options to the right-click context menu on files.
	 * This method is called when a user right-clicks on a markdown file in the file explorer.
	 *
	 * @param menu - The context menu that Obsidian is about to show
	 * @param file - The file that was right-clicked
	 */
	private addFileContextMenu(menu: Menu, file: TFile) {
		// Get all existing reminders associated with this file
		// This allows us to show context-aware menu options
		const reminders = this.dataManager.getRemindersByNote(file.path);

		// Always add option to create a new reminder for this file
		menu.addItem((item) => {
			item.setTitle('Create reminder for this note')
				.setIcon(ICONS.BELL)
				.onClick(() => {
					this.openReminderModal({
						sourceNote: file.path  // Pre-link the reminder to this file
					});
				});
		});

		// If this file already has reminders, add option to view them
		// The count in parentheses helps users understand how many reminders exist
		if (reminders.length > 0) {
			menu.addItem((item) => {
				item.setTitle(`View reminders (${reminders.length})`)
					.setIcon('list')  // Use list icon to indicate viewing multiple items
					.onClick(() => {
						// Open the sidebar to show all reminders (not just for this file)
						this.openReminderSidebar();
					});
			});
		}
	}

	/**
	 * Opens the reminder creation/editing modal.
	 * This is the main way users interact with creating and editing reminders.
	 *
	 * @param context - Optional pre-filled data for the reminder (e.g., linked file, message)
	 */
	async openReminderModal(context?: Partial<Reminder>) {
		// Create a new modal instance with all necessary dependencies
		const modal = new ReminderModal(
			this.app,                                                          // Obsidian app instance
			this,                                                             // Plugin instance for access to our methods
			(reminder, isEdit) => this.handleReminderSubmission(reminder, isEdit),  // Callback for when user submits the form
			context                                                           // Any pre-filled data
		);
		// Display the modal to the user
		modal.open();
	}

	/**
	 * Opens or focuses the reminder sidebar panel.
	 * This method handles creating the sidebar if it doesn't exist, or bringing it to focus if it does.
	 */
	async openReminderSidebar() {
		// Get reference to Obsidian's workspace for managing UI panels
		const { workspace } = this.app;

		// Check if our reminder sidebar is already open somewhere
		let leaf = workspace.getLeavesOfType('reminder-sidebar')[0];

		if (!leaf) {
			// Sidebar doesn't exist, so create it
			// Get a leaf (panel) on the right side of the interface
			leaf = workspace.getRightLeaf(false)!;
			// Set this leaf to display our reminder sidebar view
			await leaf.setViewState({ type: 'reminder-sidebar' });
		}

		// Bring the sidebar into focus/make it visible
		workspace.revealLeaf(leaf);
	}

	/**
	 * Creates a reminder using the currently selected text as the message.
	 * This is called when user uses the "Create reminder from selection" command or context menu.
	 *
	 * @param editor - The editor instance containing the selected text
	 */
	private async createReminderFromSelection(editor: Editor) {
		// Get the currently selected text
		const selection = editor.getSelection();

		// If no text is selected, show an error and exit early
		if (!selection) {
			new Notice('No text selected');
			return;
		}

		// Get the current markdown view to access file information
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		// Get cursor position for linking the reminder to a specific location
		const cursor = editor.getCursor();

		// Open the reminder modal with pre-filled information
		this.openReminderModal({
			message: `Reminder: ${selection}`,                               // Use selected text as the message
			sourceNote: view?.file?.path,                                   // Link to current file
			sourceLine: cursor.line,                                        // Link to current line
			datetime: format(addHours(new Date(), UI_CONFIG.DEFAULT_HOURS_AHEAD), DATE_FORMATS.DATETIME_LOCAL)  // Default to 1 hour from now
		});
	}

	/**
	 * Handles the submission of reminder data from the modal.
	 * This method processes both creating new reminders and editing existing ones.
	 *
	 * @param reminderData - The reminder data submitted by the user
	 * @param isEdit - True if editing existing reminder, false if creating new one
	 */
	private async handleReminderSubmission(reminderData: Reminder, isEdit: boolean) {
		try {
			let reminder: Reminder;

			if (isEdit) {
				// Update an existing reminder
				const updatedReminder = await this.dataManager.updateReminder(reminderData.id, reminderData);
				if (!updatedReminder) {
					// Handle case where reminder was deleted by another process
					new Notice('Failed to update reminder - reminder not found');
					return;
				}
				reminder = updatedReminder;
				new Notice(`Reminder updated: ${reminder.message}`);
			} else {
				// Create a brand new reminder
				reminder = await this.dataManager.createReminder(reminderData);
				new Notice(`Reminder created: ${reminder.message}`);
			}

			// Refresh the sidebar view if it's currently open
			// This ensures the UI stays in sync with the data
			if (this.sidebarView) {
				if (isEdit) {
					// For edits, just refresh without changing tabs
					this.sidebarView.refresh();
				} else {
					// For new reminders, switch to upcoming tab to show the new reminder
					this.sidebarView.setFilter('upcoming');
				}
			}

			// Tell the scheduler to immediately re-evaluate all reminders
			// This ensures new/updated reminders are scheduled correctly
			this.scheduler.scheduleImmediate();

		} catch (error) {
			// Log the full error for debugging purposes
			console.error('Failed to save reminder:', error);
			// Show user-friendly error message
			new Notice(`Failed to ${isEdit ? 'update' : 'create'} reminder`);
		}
	}

	/**
	 * Loads plugin settings from Obsidian's data storage.
	 * This merges user settings with default values to ensure all required settings exist.
	 */
	async loadSettings() {
		// Object.assign merges default settings with saved settings
		// This ensures that if new settings are added, they get default values
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * Saves current plugin settings to Obsidian's data storage.
	 * This persists user preferences across Obsidian restarts.
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
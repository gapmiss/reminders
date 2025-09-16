import { Plugin, Notice, Menu, TFile, MarkdownView, Editor } from 'obsidian';
import { RemindersSettings, DEFAULT_SETTINGS, RemindersSettingTab } from "./settings";
import { ReminderModal, type Reminder } from "./modals/reminderModal";
import { ReminderSidebarView } from "./view";
import { ReminderDataManager } from "./managers/reminderDataManager";
import { NotificationService } from "./managers/notificationService";
import { Scheduler } from "./managers/scheduler";

export default class ReminderPlugin extends Plugin {
	dataManager!: ReminderDataManager;
	notificationService!: NotificationService;
	scheduler!: Scheduler;
	sidebarView?: ReminderSidebarView;
	settings: RemindersSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new RemindersSettingTab(this.app, this));

		this.dataManager = new ReminderDataManager(this);

		this.notificationService = new NotificationService(this);
		this.scheduler = new Scheduler(this, this.dataManager, this.notificationService);

		// Register view
		this.registerView('reminder-sidebar', (leaf) => {
			this.sidebarView = new ReminderSidebarView(leaf, this);
			return this.sidebarView;
		});

		// Add ribbon icon
		this.addRibbonIcon('concierge-bell', 'Reminders', () => { this.openReminderSidebar() });

		// Register commands
		this.addCommand({ id: 'create-reminder', name: 'Create new reminder', callback: () => this.openReminderModal(), hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'r' }] });
		this.addCommand({ id: 'create-reminder-from-selection', name: 'Create reminder from selection', editorCallback: (editor) => this.createReminderFromSelection(editor), hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'r' }] });
		this.addCommand({ id: 'show-reminder-sidebar', name: 'Show reminder sidebar', callback: () => this.openReminderSidebar() });

		// Register event handlers
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				this.addEditorContextMenu(menu, editor, view as MarkdownView);
			})
		);

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') this.addFileContextMenu(menu, file);
			})
		);

		// Start scheduler
		await this.scheduler.start();
	}

	async onunload() {
		// Stop scheduler (intervals will be automatically cleared by Obsidian)
		this.scheduler.stop();
	}

	private addEditorContextMenu(menu: Menu, editor: Editor, view: MarkdownView) {
		const selection = editor.getSelection();

		if (selection) {
			menu.addItem((item) => {
				item.setTitle('Create reminder from selection')
					.setIcon('concierge-bell')
					.onClick(() => {
						this.createReminderFromSelection(editor);
					});
			});
		}

		menu.addItem((item) => {
			item.setTitle('Create reminder here')
				.setIcon('concierge-bell')
				.onClick(() => {
					const cursor = editor.getCursor();
					this.openReminderModal({
						sourceNote: view.file?.path,
						sourceLine: cursor.line
					});
				});
		});
	}

	private addFileContextMenu(menu: Menu, file: TFile) {
		const reminders = this.dataManager.getRemindersByNote(file.path);

		menu.addItem((item) => {
			item.setTitle('Create reminder for this note')
				.setIcon('concierge-bell')
				.onClick(() => {
					this.openReminderModal({
						sourceNote: file.path
					});
				});
		});

		if (reminders.length > 0) {
			menu.addItem((item) => {
				item.setTitle(`View reminders (${reminders.length})`)
					.setIcon('list')
					.onClick(() => {
						this.openReminderSidebar();
					});
			});
		}
	}

	async openReminderModal(context?: Partial<Reminder>) {
		const modal = new ReminderModal(
			this.app,
			this,
			(reminder, isEdit) => this.handleReminderSubmission(reminder, isEdit),
			context
		);
		modal.open();
	}

	async openReminderSidebar() {
		const { workspace } = this.app;

		let leaf = workspace.getLeavesOfType('reminder-sidebar')[0];
		if (!leaf) {
			leaf = workspace.getRightLeaf(false)!;
			await leaf.setViewState({ type: 'reminder-sidebar' });
		}

		workspace.revealLeaf(leaf);
	}

	private async createReminderFromSelection(editor: Editor) {
		const selection = editor.getSelection();
		if (!selection) {
			new Notice('No text selected');
			return;
		}

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const cursor = editor.getCursor();

		this.openReminderModal({
			message: `Reminder: ${selection}`,
			sourceNote: view?.file?.path,
			sourceLine: cursor.line,
			datetime: window.moment().add(1, 'hour').format('YYYY-MM-DDTHH:mm')
		});
	}

	private async handleReminderSubmission(reminderData: Reminder, isEdit: boolean) {
		try {
			let reminder: Reminder;

			if (isEdit) {
				// Update existing reminder
				const updatedReminder = await this.dataManager.updateReminder(reminderData.id, reminderData);
				if (!updatedReminder) {
					new Notice('Failed to update reminder - reminder not found');
					return;
				}
				reminder = updatedReminder;
				new Notice(`Reminder updated: ${reminder.message}`);
			} else {
				// Create new reminder
				reminder = await this.dataManager.createReminder(reminderData);
				new Notice(`Reminder created: ${reminder.message}`);
			}

			if (this.sidebarView) {
				this.sidebarView.refresh();
			}

			this.scheduler.scheduleImmediate();

		} catch (error) {
			console.error('Failed to save reminder:', error);
			new Notice(`Failed to ${isEdit ? 'update' : 'create'} reminder`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
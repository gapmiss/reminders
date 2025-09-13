// main.ts - Complete MVP Reminder Plugin for Obsidian
import {
	type App,
	Plugin,
	Modal,
	Setting,
	Notice,
	WorkspaceLeaf,
	ItemView,
	Menu,
	TFile,
	MarkdownView,
	Editor,
	setIcon
} from 'obsidian';

// ================== INTERFACES ==================

interface Reminder {
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

interface PluginData {
	reminders: Reminder[];
	settings: ReminderSettings;
}

interface ReminderSettings {
	scanInterval: number; // milliseconds
	showSystemNotification: boolean;
	showObsidianNotice: boolean;
	notificationSound: boolean;
	defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
}

const SNOOZE_TIME = 2;

// ================== DATA MANAGER ==================

class ReminderDataManager {
	private plugin: ReminderPlugin;
	private data: PluginData;
	private saveTimeout?: NodeJS.Timeout;

	constructor(plugin: ReminderPlugin) {
		this.plugin = plugin;
	}

	async loadData(): Promise<void> {
		const defaultData: PluginData = {
			reminders: [],
			settings: {
				scanInterval: 15000,
				showSystemNotification: true,
				showObsidianNotice: true,
				notificationSound: false,
				defaultPriority: 'normal'
			}
		};

		this.data = Object.assign(defaultData, await this.plugin.loadData());
	}

	async saveData(immediate = false): Promise<void> {
		if (immediate) {
			if (this.saveTimeout) {
				clearTimeout(this.saveTimeout);
				this.saveTimeout = undefined;
			}
			await this.plugin.saveData(this.data);
		} else {
			if (this.saveTimeout) {
				clearTimeout(this.saveTimeout);
			}

			this.saveTimeout = setTimeout(async () => {
				await this.plugin.saveData(this.data);
				this.saveTimeout = undefined;
			}, 1000);
		}
	}

	async createReminder(reminderData: Partial<Reminder>): Promise<Reminder> {
		const reminder: Reminder = {
			id: this.generateId(),
			message: reminderData.message || '',
			datetime: reminderData.datetime || window.moment().add(1, 'hour').toISOString(),
			priority: reminderData.priority || this.data.settings.defaultPriority,
			category: reminderData.category || '',
			sourceNote: reminderData.sourceNote,
			sourceLine: reminderData.sourceLine,
			completed: false,
			snoozeCount: 0,
			created: window.moment().toISOString(),
			updated: window.moment().toISOString()
		};

		this.data.reminders.push(reminder);
		await this.saveData();
		return reminder;
	}

	async updateReminder(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
		const index = this.data.reminders.findIndex(r => r.id === id);
		if (index === -1) return null;

		const reminder = this.data.reminders[index];
		Object.assign(reminder, updates, {
			updated: window.moment().toISOString()
		});

		await this.saveData();
		return reminder;
	}

	async deleteReminder(id: string): Promise<boolean> {
		const index = this.data.reminders.findIndex(r => r.id === id);
		if (index === -1) return false;

		this.data.reminders.splice(index, 1);
		await this.saveData();
		return true;
	}

	async completeReminder(id: string): Promise<Reminder | null> {
		return await this.updateReminder(id, {
			completed: true,
			completedAt: window.moment().toISOString()
		});
		// this.sidebarView.refresh();
	}

	async snoozeReminder(id: string, snoozeUntil: string): Promise<Reminder | null> {
		const reminder = this.findReminder(id);
		console.log('reminder');
		console.log(reminder);
		if (!reminder) return null;

		return await this.updateReminder(id, {
			snoozedUntil: snoozeUntil,
			snoozeCount: reminder.snoozeCount + 1
		});
	}

	findReminder(id: string): Reminder | undefined {
		return this.data.reminders.find(r => r.id === id);
	}

	getPendingReminders(): Reminder[] {
		const now = window.moment();
		return this.data.reminders
			.filter(r =>
				!r.completed &&
				window.moment(r.datetime).isBefore(now) &&
				(!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
			)
			.sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
	}

	getSnoozedReminders(): Reminder[] {
		const now = window.moment();
		return this.data.reminders
			.filter(r =>
				!r.completed &&
				r.snoozedUntil &&
				window.moment(r.snoozedUntil).isAfter(now)
			)
			.sort((a, b) => window.moment(a.snoozedUntil!).diff(window.moment(b.snoozedUntil!)));
	}

	getUpcomingReminders(limit = 10): Reminder[] {
		const now = window.moment();
		return this.data.reminders
			.filter(r =>
				!r.completed &&
				window.moment(r.datetime).isAfter(now) &&
				(!r.snoozedUntil || window.moment(r.snoozedUntil).isBefore(now))
			)
			.sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)))
			.slice(0, limit);
	}

	getRemindersByNote(notePath: string): Reminder[] {
		return this.data.reminders
			.filter(r => r.sourceNote === notePath)
			.sort((a, b) => window.moment(a.datetime).diff(window.moment(b.datetime)));
	}

	private generateId(): string {
		return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	get reminders(): Reminder[] {
		return this.data.reminders;
	}

	get settings(): ReminderSettings {
		return this.data.settings;
	}

	async updateSettings(newSettings: Partial<ReminderSettings>): Promise<void> {
		Object.assign(this.data.settings, newSettings);
		await this.saveData();
	}

	getStatistics() {
		const now = window.moment();
		const reminders = this.data.reminders;

		return {
			total: reminders.length,
			completed: reminders.filter(r => r.completed).length,
			pending: reminders.filter(r => !r.completed).length,
			snoozed: reminders.filter(r =>
				!r.completed && r.snoozedUntil && window.moment(r.snoozedUntil).isAfter(now)
			).length,
			overdue: reminders.filter(r =>
				!r.completed && window.moment(r.datetime).isBefore(now)
			).length,
			upcoming24h: reminders.filter(r =>
				!r.completed &&
				window.moment(r.datetime).isAfter(now) &&
				window.moment(r.datetime).isBefore(now.clone().add(24, 'hours'))
			).length
		};
	}
}

// ================== MODAL ==================

class ReminderModal extends Modal {
	private reminder: Partial<Reminder>;
	private onSubmit: (reminder: Reminder, isEdit: boolean) => void;
	private isEdit: boolean;

	constructor(
		app: App,
		// onSubmit: (reminder: Reminder) => void,
		onSubmit: (reminder: Reminder, isEdit: boolean) => void,
		existingReminder?: Partial<Reminder>
	) {
		super(app);
		this.onSubmit = onSubmit;
		// console.log('existingReminder');
		// console.log(existingReminder);
		this.isEdit = !!existingReminder?.id;
		// console.log('this.isEdit');
		// console.log(this.isEdit);

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

		if (window.moment(this.reminder.datetime).isBefore(window.moment())) {
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

// ADD THIS NEW CLASS:
class ConfirmDeleteModal extends Modal {
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

		const timeStr = window.moment(this.reminder.datetime).format('MMM D, YYYY at h:mm A');
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

// ================== SIDEBAR VIEW ==================

class ReminderSidebarView extends ItemView {
	private plugin: ReminderPlugin;
	private currentFilter: 'pending' | 'snoozed' | 'upcoming' | 'all' | 'completed' = 'pending';

	constructor(leaf: WorkspaceLeaf, plugin: ReminderPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return 'reminder-sidebar';
	}

	getDisplayText(): string {
		return 'Reminders';
	}

	getIcon(): string {
		return 'concierge-bell';
	}

	async onOpen() {
		this.render();
	}

	render() {
		this.contentEl.empty();
		this.contentEl.addClass('reminder-sidebar');

		this.createHeader();
		this.createFilterTabs();
		this.createStats();
		this.createReminderList();
	}

	private createHeader() {
		const headerEl = this.contentEl.createDiv({ cls: 'reminder-sidebar-header' });

		headerEl.createEl('h3', { text: 'Reminders' });

		const actionsEl = headerEl.createDiv({ cls: 'reminder-actions' });

		const newBtn = actionsEl.createEl('button', {
			text: '+ New',
			cls: 'mod-cta'
		});
		newBtn.addEventListener('click', () => {
			this.plugin.openReminderModal();
		});

		const refreshBtn = actionsEl.createEl('button', { text: '↻' });
		setIcon(refreshBtn, 'rotate-ccw');
		refreshBtn.addEventListener('click', () => {
			this.render();
		});
	}

	private createFilterTabs() {
		const tabsEl = this.contentEl.createDiv({ cls: 'reminder-filter-tabs' });

		const filters = [
			{ key: 'pending', label: 'Pending' },
			{ key: 'snoozed', label: 'Snoozed' },
			{ key: 'upcoming', label: 'Upcoming' },
			{ key: 'all', label: 'All' },
			{ key: 'completed', label: 'Done' }
		];

		filters.forEach(filter => {
			const tab = tabsEl.createEl('button', {
				cls: `filter-tab ${this.currentFilter === filter.key ? 'active' : ''}`
			});
			// let iconSpan = tab.createSpan();
			switch (filter.label) {
				case 'Done':
					// setIcon(iconSpan, 'alarm-clock-check');
					break;
			
				case 'All':
					// setIcon(iconSpan, 'copy-check');
					break;
			
				default:
					break;
			}
			
			tab.createSpan({text: filter.label});
			tab.addEventListener('click', () => {
				this.currentFilter = filter.key as any;
				this.render();
			});
		});
	}

	private createStats() {
		const stats = this.plugin.dataManager.getStatistics();
		const statsEl = this.contentEl.createDiv({ cls: 'reminder-stats' });

		const statItems = [
			{ label: 'Overdue', value: stats.overdue, cls: 'overdue' },
			{ label: 'Snoozed', value: stats.snoozed, cls: 'snoozed' },
			{ label: 'Today', value: stats.upcoming24h, cls: 'today' },
			{ label: 'Total', value: stats.total, cls: 'total' }
		];

		statItems.forEach(item => {
			const statEl = statsEl.createDiv({ cls: `reminder-stat ${item.cls}` });
			statEl.createDiv({ text: item.value.toString(), cls: 'stat-value' });
			statEl.createDiv({ text: item.label, cls: 'stat-label' });
		});
	}

	private createReminderList() {
		const listEl = this.contentEl.createDiv({ cls: 'reminder-list' });

		let reminders = this.getFilteredReminders();

		if (reminders.length === 0) {
			listEl.createDiv({
				text: 'No reminders found',
				cls: 'reminder-empty-state'
			});
			return;
		}

		reminders.forEach(reminder => {
			this.createReminderItem(listEl, reminder);
		});
	}

	private createReminderItem(container: HTMLElement, reminder: Reminder) {
		const itemEl = container.createDiv({
			cls: `reminder-item priority-${reminder.priority} ${reminder.completed ? 'completed' : ''} ${reminder.snoozedUntil ? 'snoozed' : ''}`
		});

		// Checkbox
		const checkboxEl = itemEl.createEl('input', { type: 'checkbox' });
		checkboxEl.checked = reminder.completed;
		checkboxEl.addEventListener('change', async () => {
			if (checkboxEl.checked) {
				await this.plugin.dataManager.completeReminder(reminder.id);
				new Notice('✅ Reminder completed');
			} else {
				await this.plugin.dataManager.updateReminder(reminder.id, {
					completed: false,
					completedAt: undefined
				});
			}
			this.render();
		});

		// Content
		const contentEl = itemEl.createDiv({ cls: 'reminder-content' });

		const messageEl = contentEl.createDiv({
			text: reminder.message,
			cls: 'reminder-message'
		});

		const metaEl = contentEl.createDiv({ cls: 'reminder-meta' });

		const timeStr = window.moment(reminder.datetime).format('MMM D, h:mm A');
		const relativeTime = window.moment(reminder.datetime).fromNow();
		metaEl.createSpan({ text: `${timeStr} (${relativeTime})` });

		if (reminder.snoozedUntil) {
			const snoozeRelativeTime = window.moment(reminder.snoozedUntil).fromNow();
			const snoozeEl = metaEl.createSpan({
				text: `⏰ Snoozed until ${window.moment(reminder.snoozedUntil).format('MMM D, h:mm A')} (${snoozeRelativeTime})`,
				cls: 'reminder-snoozed'
			});
		}

		if (reminder.category) {
			metaEl.createSpan({
				text: reminder.category,
				cls: 'reminder-category'
			});
		}

		if (reminder.sourceNote) {
			const noteLink = metaEl.createEl('a', {
				text: '📄 ' + reminder.sourceNote.split('/').pop(),
				cls: 'reminder-note-link'
			});
			noteLink.addEventListener('click', () => {
				this.app.workspace.openLinkText(reminder.sourceNote!, '');
			});
		}

		// Actions
		const actionsEl = itemEl.createDiv({ cls: 'reminder-item-actions' });

		if (!reminder.completed) {
			const snoozeBtn = actionsEl.createEl('button', {
				cls: 'clickable-icon',
				attr: { 'aria-label': `Snooze ${SNOOZE_TIME} mins` }
			});
			setIcon(snoozeBtn, 'alarm-clock-plus');
			snoozeBtn.addEventListener('click', async () => {
				const snoozeUntil = window.moment().add(SNOOZE_TIME, 'minutes').toISOString();
				console.log('snoozeUntil');
				console.log(snoozeUntil);
				await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);
				new Notice(`⏰ Reminder snoozed for ${SNOOZE_TIME} minutes`);
				this.render();
			});
		}

		const editBtn = actionsEl.createEl('button', {
			cls: 'clickable-icon',
			attr: { 'aria-label': 'Edit' }
		});
		editBtn.addEventListener('click', () => {
			this.plugin.openReminderModal(reminder);
		});
		setIcon(editBtn, 'pencil');
		const deleteBtn = actionsEl.createEl('button', {
			cls: 'clickable-icon',
			attr: { 'aria-label': 'Delete' }
		});
		setIcon(deleteBtn, 'trash');

		deleteBtn.addEventListener('click', () => {
			const confirmModal = new ConfirmDeleteModal(
				this.app,
				reminder,
				async () => {
					await this.plugin.dataManager.deleteReminder(reminder.id);
					new Notice('Reminder deleted');
					this.render();
				}
			);
			confirmModal.open();
		});
	}

	private getFilteredReminders(): Reminder[] {
		let reminders = this.plugin.dataManager.reminders;

		switch (this.currentFilter) {
			case 'pending':
				reminders = this.plugin.dataManager.getPendingReminders();
				break;
			case 'snoozed':
				reminders = this.plugin.dataManager.getSnoozedReminders();
				break;
			case 'upcoming':
				reminders = this.plugin.dataManager.getUpcomingReminders(50);
				break;
			case 'completed':
				reminders = reminders.filter(r => r.completed);
				break;
		}

		return reminders;
	}

	refresh() {
		this.render();
	}
}

// ================== NOTIFICATION SERVICE ==================

class NotificationService {
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

		const snoozeBtn = actionsEl.createEl('button', { text: `Snooze ${SNOOZE_TIME} min` });
		snoozeBtn.addEventListener('click', async () => {
			const snoozeUntil = window.moment().add(SNOOZE_TIME, 'minutes').toISOString();
			await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);
			notice.hide();
			new Notice(`⏰ Reminder snoozed for ${SNOOZE_TIME} minutes`);
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

class Scheduler {
	private plugin: ReminderPlugin;
	private dataManager: ReminderDataManager;
	private notificationService: NotificationService;
	private isRunning = false;
	private processedReminders = new Set<string>();
	private checkCount = 0;
	private readonly FAST_CHECK_INTERVAL = 5000; // 1 second
	private readonly SLOW_CHECK_INTERVAL = 30000; // 15 seconds

	constructor(
		plugin: ReminderPlugin,
		dataManager: ReminderDataManager,
		notificationService: NotificationService
	) {
		this.plugin = plugin;
		this.dataManager = dataManager;
		this.notificationService = notificationService;
	}

	async start(): Promise<void> {
		if (this.isRunning) return;

		console.log('Starting high-frequency reminder scheduler');
		this.isRunning = true;
		this.checkCount = 0;

		this.scheduleCheck();
	}

	stop(): void {
		if (!this.isRunning) return;

		console.log('Stopping high-frequency scheduler');
		this.isRunning = false;
		this.processedReminders.clear();
	}

	private scheduleCheck(): void {
		if (!this.isRunning) return;

		// Use fast checking (every second) when reminders are due soon
		// Use slow checking (every 15 seconds) when no immediate reminders
		const interval = this.hasUpcomingReminders() ? 
			this.FAST_CHECK_INTERVAL : 
			this.SLOW_CHECK_INTERVAL;

		setTimeout(async () => {
			if (this.isRunning) {
				await this.checkReminders();
				this.scheduleCheck();
			}
		}, interval);
	}

	private hasUpcomingReminders(): boolean {
		const now = window.moment();
		const fiveMinutesFromNow = now.clone().add(5, 'minutes');

		return this.dataManager.reminders.some(reminder => {
			if (reminder.completed) return false;
			if (reminder.snoozedUntil && window.moment(reminder.snoozedUntil).isAfter(now)) return false;
			
			const reminderTime = window.moment(reminder.datetime);
			return reminderTime.isBetween(now, fiveMinutesFromNow);
		});
	}

	private async checkReminders(): Promise<void> {
		this.checkCount++;
		const isDetailedCheck = this.checkCount % 15 === 0; // Every 15th check is detailed
		
		console.log(`High-frequency check #${this.checkCount} at ${new Date().toISOString()}`);

		try {
			const now = window.moment();
			const allReminders = this.dataManager.reminders;

			// Find reminders that should trigger now
			const dueReminders = allReminders.filter(reminder => {
				if (reminder.completed) return false;

				if (reminder.snoozedUntil) {
					const snoozeExpired = window.moment(reminder.snoozedUntil).isBefore(now);
					if (snoozeExpired && isDetailedCheck) {
					// if (snoozeExpired) {
						this.dataManager.updateReminder(reminder.id, { snoozedUntil: undefined });
						this.processedReminders.delete(reminder.id);
						return true;
					}
					return false;
				}

				// More precise timing check
				const reminderTime = window.moment(reminder.datetime);
				const secondsDiff = reminderTime.diff(now, 'seconds');
				
				// Trigger if time has passed or within next 30 seconds
				return secondsDiff <= 30;
			});

			for (const reminder of dueReminders) {
				if (!this.processedReminders.has(reminder.id)) {
					// Double-check timing before triggering
					const exactTime = window.moment(reminder.datetime);
					const exactDiff = exactTime.diff(now, 'seconds');
					
					if (exactDiff <= 0) { // Only trigger if actually due
						await this.notificationService.showReminder(reminder);
						this.processedReminders.add(reminder.id);
						console.log(`Precisely triggered reminder: ${reminder.message}`);
					}
				}
			}

		} catch (error) {
			console.error('Error in high-frequency check:', error);
		}
	}

	async scheduleImmediate(): Promise<void> {
		await this.checkReminders();
	}
}

// ================== MAIN PLUGIN ==================

export default class ReminderPlugin extends Plugin {
	dataManager!: ReminderDataManager;
	notificationService!: NotificationService;
	scheduler!: Scheduler;
	sidebarView?: ReminderSidebarView;

	async onload() {
		// console.log('Loading Reminder Plugin');

		// Initialize components
		this.dataManager = new ReminderDataManager(this);
		await this.dataManager.loadData();

		this.notificationService = new NotificationService(this);
		this.scheduler = new Scheduler(this, this.dataManager, this.notificationService);

		// Register sidebar view
		this.registerView('reminder-sidebar', (leaf) => {
			this.sidebarView = new ReminderSidebarView(leaf, this);
			return this.sidebarView;
		});

		// Add ribbon icon
		this.addRibbonIcon('concierge-bell', 'Reminders', () => {
			this.openReminderSidebar();
		});

		// Register commands
		this.addCommand({
			id: 'create-reminder',
			name: 'Create new reminder',
			callback: () => this.openReminderModal(),
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'r' }]
		});

		this.addCommand({
			id: 'create-reminder-from-selection',
			name: 'Create reminder from selection',
			editorCallback: (editor) => this.createReminderFromSelection(editor),
			hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'r' }]
		});

		this.addCommand({
			id: 'show-reminder-sidebar',
			name: 'Show reminder sidebar',
			callback: () => this.openReminderSidebar()
		});

		// Register event handlers
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				this.addEditorContextMenu(menu, editor, view as MarkdownView);
			})
		);

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.addFileContextMenu(menu, file);
				}
			})
		);

		// Start scheduler
		await this.scheduler.start();

		console.log('Reminder Plugin loaded successfully');
	}

	async onunload() {
		// Stop scheduler (intervals will be automatically cleared by Obsidian)
		this.scheduler.stop();
		await this.dataManager.saveData(true);
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

}
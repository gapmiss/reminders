import {ItemView, WorkspaceLeaf, Notice, setIcon } from "obsidian";
import ReminderPlugin from "./main";
import { Reminder } from "./modals/reminderModal";
import { SnoozeSuggestModal } from "./modals/snoozeSuggestModal";
import { ConfirmDeleteModal } from "./modals/confirmDeleteModal";

export class ReminderSidebarView extends ItemView {
    private plugin: ReminderPlugin;
    private currentFilter: 'pending' | 'snoozed' | 'upcoming' | 'all' | 'completed' = 'pending';
    private refreshInterval?: NodeJS.Timeout;

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
        this.startAutoRefresh();
    }

    async onClose() {
        this.stopAutoRefresh();
    }

    private startAutoRefresh() {
        // Refresh every 30 seconds to update times
        this.refreshInterval = setInterval(() => {
            this.render();
        }, 30000);
    }

    private stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = undefined;
        }
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

            tab.createSpan({ text: filter.label });
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
            metaEl.createSpan({
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
                text: reminder.sourceNote.split('/').pop(),
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
                attr: { 'aria-label': 'Snooze' }
            });
            setIcon(snoozeBtn, 'alarm-clock-plus');
            snoozeBtn.addEventListener('click', () => {
                const modal = new SnoozeSuggestModal(
                    this.app,
                    reminder,
                    this.plugin,
                    async (minutes: number) => {
                        const snoozeUntil = window.moment().add(minutes, 'minutes').toISOString();
                        await this.plugin.dataManager.snoozeReminder(reminder.id, snoozeUntil);
                        const timeLabel = minutes === 1 ? '1 minute' : `${minutes} minutes`;
                        new Notice(`⏰ Reminder snoozed for ${timeLabel}`);
                        this.render();
                    }
                );
                modal.open();
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
                reminders = reminders.filter(r => r.completed)
                    .sort((a, b) => window.moment(b.completedAt || b.datetime).diff(window.moment(a.completedAt || a.datetime)));
                break;
            case 'all':
                // Sort all reminders: incomplete first (by datetime), then completed at bottom (newest completed first)
                reminders = reminders.slice().sort((a, b) => {
                    // If one is completed and one isn't, incomplete comes first
                    if (a.completed && !b.completed) return 1;
                    if (!a.completed && b.completed) return -1;

                    // If both have same completion status, sort by appropriate date
                    if (a.completed && b.completed) {
                        // Both completed: newest completion first
                        return window.moment(b.completedAt || b.datetime).diff(window.moment(a.completedAt || a.datetime));
                    } else {
                        // Both incomplete: soonest datetime first
                        return window.moment(a.datetime).diff(window.moment(b.datetime));
                    }
                });
                break;
        }
        return reminders;
    }

    refresh() {
        this.render();
    }
}
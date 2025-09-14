import { type App, SuggestModal } from "obsidian";
import ReminderPlugin from "../main";

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

interface SnoozeOption {
    label: string;
    minutes: number;
}

export class SnoozeSuggestModal extends SuggestModal<SnoozeOption> {
    private reminder: Reminder;
    private plugin: ReminderPlugin;
    private onSnooze: (minutes: number) => void;

    private presetOptions: SnoozeOption[] = [
        { label: '1 minute', minutes: 1 },
        { label: '5 minutes', minutes: 5 },
        { label: '15 minutes', minutes: 15 },
        { label: '30 minutes', minutes: 30 },
        { label: '1 hour', minutes: 60 },
        { label: '24 hours', minutes: 24 * 60 }
    ];

    constructor(app: App, reminder: Reminder, plugin: ReminderPlugin, onSnooze: (minutes: number) => void) {
        super(app);
        this.reminder = reminder;
        this.plugin = plugin;
        this.onSnooze = onSnooze;

        this.setPlaceholder('Enter minutes or select preset...');
        this.setInstructions([
            { command: '↑↓', purpose: 'Navigate presets' },
            { command: '↵', purpose: 'Select' },
            { command: 'type number', purpose: 'Custom minutes' },
            { command: 'esc', purpose: 'Cancel' }
        ]);
    }

    getSuggestions(query: string): SnoozeOption[] {
        const suggestions: SnoozeOption[] = [];

        // If query is a number, add it as the first option
        const numQuery = parseInt(query);
        if (!isNaN(numQuery) && numQuery > 0) {
            const customLabel = numQuery === 1 ? '1 minute' : `${numQuery} minutes`;
            suggestions.push({ label: `Custom: ${customLabel}`, minutes: numQuery });
        }

        // Add preset options that match the query
        const filteredPresets = this.presetOptions.filter(option =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );
        suggestions.push(...filteredPresets);

        return suggestions;
    }

    renderSuggestion(option: SnoozeOption, el: HTMLElement) {
        el.createDiv({ text: option.label });
    }

    onChooseSuggestion(option: SnoozeOption) {
        this.onSnooze(option.minutes);
    }
}

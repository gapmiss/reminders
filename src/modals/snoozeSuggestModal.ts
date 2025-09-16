import { type App, SuggestModal } from "obsidian";
import ReminderPlugin from "../main";

/**
 * Local interface for reminder data.
 * This duplicates the main Reminder interface to avoid circular imports.
 * In a larger project, this would likely be moved to a shared types file.
 */
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

/**
 * Interface for snooze duration options.
 * Used both for preset options and custom user input.
 */
interface SnoozeOption {
    label: string;    // Display text shown to user
    minutes: number;  // Duration in minutes
}

/**
 * Modal for selecting how long to snooze a reminder.
 * Extends Obsidian's SuggestModal to provide both preset options and custom input.
 *
 * Key features:
 * - Preset snooze durations for common use cases
 * - Custom duration input (user types number of minutes)
 * - Real-time filtering of preset options
 * - Clear keyboard navigation instructions
 * - Intelligent labeling ("1 minute" vs "5 minutes")
 */
export class SnoozeSuggestModal extends SuggestModal<SnoozeOption> {
    private reminder: Reminder;                   // The reminder being snoozed (for context if needed)
    private plugin: ReminderPlugin;              // Plugin instance (currently unused but available)
    private onSnooze: (minutes: number) => void; // Callback to execute when user selects a duration

    // Predefined snooze duration options
    // These cover common use cases from quick (1 min) to long-term (24 hours)
    private presetOptions: SnoozeOption[] = [
        { label: '1 minute', minutes: 1 },           // For quick testing or very short delays
        { label: '5 minutes', minutes: 5 },          // Short break
        { label: '15 minutes', minutes: 15 },        // Standard short snooze
        { label: '30 minutes', minutes: 30 },        // Half hour delay
        { label: '1 hour', minutes: 60 },           // One hour delay
        { label: '24 hours', minutes: 24 * 60 }     // Next day (1440 minutes)
    ];

    /**
     * Constructor for the snooze suggestion modal.
     *
     * @param app - Obsidian app instance
     * @param reminder - The reminder being snoozed
     * @param plugin - Plugin instance for potential future use
     * @param onSnooze - Callback function that receives the selected duration in minutes
     */
    constructor(app: App, reminder: Reminder, plugin: ReminderPlugin, onSnooze: (minutes: number) => void) {
        super(app);
        this.reminder = reminder;
        this.plugin = plugin;
        this.onSnooze = onSnooze;

        // Set placeholder text shown in the input field
        this.setPlaceholder('Enter minutes or select preset...');

        // Set keyboard instructions shown to the user
        this.setInstructions([
            { command: '↑↓', purpose: 'Navigate presets' },      // Up/down arrows
            { command: '↵', purpose: 'Select' },                    // Enter key
            { command: 'type number', purpose: 'Custom minutes' },  // Typing numbers
            { command: 'esc', purpose: 'Cancel' }                   // Escape key
        ]);
    }

    /**
     * Generates suggestions based on user input.
     * Called by Obsidian whenever the user types in the modal.
     *
     * @param query - The current user input
     * @returns Array of snooze options to display
     */
    getSuggestions(query: string): SnoozeOption[] {
        const suggestions: SnoozeOption[] = [];

        // If user typed a number, create a custom option for that duration
        const numQuery = parseInt(query);
        if (!isNaN(numQuery) && numQuery > 0) {
            // Use proper singular/plural form
            const customLabel = numQuery === 1 ? '1 minute' : `${numQuery} minutes`;
            // Add as "Custom:" to distinguish from presets
            suggestions.push({ label: `Custom: ${customLabel}`, minutes: numQuery });
        }

        // Add preset options that match the user's text input
        // This allows users to type "hour" and see the "1 hour" option
        const filteredPresets = this.presetOptions.filter(option =>
            option.label.toLowerCase().includes(query.toLowerCase())
        );
        suggestions.push(...filteredPresets);

        return suggestions;
    }

    /**
     * Renders a single suggestion option in the dropdown.
     * Called by Obsidian for each suggestion to display.
     *
     * @param option - The snooze option to render
     * @param el - The HTML element to populate with the option display
     */
    renderSuggestion(option: SnoozeOption, el: HTMLElement) {
        // Simple rendering - just show the label text
        // Could be enhanced with icons, time calculations, etc.
        el.createDiv({ text: option.label });
    }

    /**
     * Called when user selects a suggestion (by clicking or pressing Enter).
     * Executes the snooze action with the selected duration.
     *
     * @param option - The selected snooze option
     */
    onChooseSuggestion(option: SnoozeOption) {
        // Execute the callback with the selected duration in minutes
        this.onSnooze(option.minutes);
    }
}

import { App, PluginSettingTab, Setting } from "obsidian";
import type { RemindersSettings, ReminderPriority } from '../types';
import { SCHEDULER_CONFIG, PRIORITY_CONFIG } from '../constants';

// Re-export for backward compatibility
export type { RemindersSettings } from '../types';

/**
 * Default configuration values for the plugin.
 * These are used when the plugin is first installed or when settings are reset.
 * All timing values are in milliseconds.
 */
export const DEFAULT_SETTINGS: RemindersSettings = {
    reminders: [],                                        // Start with no reminders
    fastCheckInterval: SCHEDULER_CONFIG.FAST_CHECK_INTERVAL,     // Check every 5 seconds when reminders are due soon
    slowCheckInterval: SCHEDULER_CONFIG.SLOW_CHECK_INTERVAL,     // Check every 30 seconds when no urgent reminders
    showDebugLog: false,                                 // Don't show debug info by default (performance)
    showSystemNotification: true,                        // Enable OS notifications by default
    showObsidianNotice: true,                           // Enable Obsidian notices by default
    defaultPriority: 'normal'                           // Most reminders are normal priority
};

/**
 * Settings tab component that appears in Obsidian's settings panel.
 * This creates the user interface for configuring the Reminders plugin.
 * Extends Obsidian's PluginSettingTab base class.
 */
export class RemindersSettingTab extends PluginSettingTab {
    plugin: any;  // Reference to the main plugin instance

    /**
     * Constructor for the settings tab.
     *
     * @param app - The Obsidian App instance
     * @param plugin - The main plugin instance (provides access to settings and save methods)
     */
    constructor(app: App, plugin: any) {
        // Initialize the parent PluginSettingTab
        super(app, plugin);
        // Store plugin reference for accessing settings
        this.plugin = plugin;
    }

    /**
     * Renders the settings interface.
     * This method is called by Obsidian when the user opens the plugin settings.
     * It creates all the UI controls for modifying plugin configuration.
     */
    display(): void {
        // Get the container element where we'll add our settings controls
        const { containerEl } = this;
        // Clear any existing content
        containerEl.empty();

        // Commented out interval settings - these are typically not needed for end users
        // The scheduler automatically adjusts check intervals based on upcoming reminders
        // Exposing these could confuse users or cause performance issues if set incorrectly

        // Fast check interval setting (currently disabled)
        // This would control how often the plugin checks for due reminders when some are coming up soon
        // Default: 5000ms (5 seconds)

        // Slow check interval setting (currently disabled)
        // This would control how often the plugin checks when no reminders are due soon
        // Default: 30000ms (30 seconds)

        // System notifications setting
        // This controls whether reminders trigger OS-level notifications (the kind that appear
        // in the system notification center/area)
        new Setting(containerEl)
            .setName("System notifications")
            .setDesc("Show system notifications when reminders are triggered.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showSystemNotification) // Set current value
                    .onChange(async (value) => {
                        // Update the setting when user toggles
                        this.plugin.settings.showSystemNotification = value;
                        // Persist the change to disk
                        await this.plugin.saveSettings();
                    })
            );

        // Obsidian notices setting
        // This controls whether reminders show as Obsidian's built-in Notice popups
        // (the temporary messages that appear at the top of the Obsidian window)
        new Setting(containerEl)
            .setName("Obsidian notices")
            .setDesc("Show Obsidian notices when reminders are triggered.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showObsidianNotice) // Set current value
                    .onChange(async (value) => {
                        // Update the setting when user toggles
                        this.plugin.settings.showObsidianNotice = value;
                        // Persist the change to disk
                        await this.plugin.saveSettings();
                    })
            );

        // Default priority setting
        // This sets what priority level is pre-selected when creating new reminders
        // Helps users avoid having to set priority every time
        new Setting(containerEl)
            .setName("Default priority")
            .setDesc("Default priority level for new reminders.")
            .addDropdown((dropdown) =>
                dropdown
                    // Add all available priority options using constants
                    .addOption("low", PRIORITY_CONFIG.low.label)        // Least urgent
                    .addOption("normal", PRIORITY_CONFIG.normal.label)  // Standard priority (most common)
                    .addOption("high", PRIORITY_CONFIG.high.label)      // Important but not critical
                    .addOption("urgent", PRIORITY_CONFIG.urgent.label)  // Needs immediate attention
                    .setValue(this.plugin.settings.defaultPriority) // Set current selection
                    .onChange(async (value) => {
                        // Update setting when user changes selection
                        // Cast to the specific type to ensure type safety
                        this.plugin.settings.defaultPriority = value as 'low' | 'normal' | 'high' | 'urgent';
                        // Persist the change to disk
                        await this.plugin.saveSettings();
                    })
            );

        // Debug logging setting
        // This enables detailed logging to the browser's developer console
        // Useful for troubleshooting but can impact performance if left on
        new Setting(containerEl)
            .setName("Debug")
            .setDesc("Show debug logs in the developer console.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showDebugLog) // Set current value
                    .onChange(async (value) => {
                        // Update the setting when user toggles
                        this.plugin.settings.showDebugLog = value;
                        // Persist the change to disk
                        await this.plugin.saveSettings();
                    })
            );

    }
}

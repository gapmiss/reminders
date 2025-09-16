import { App, PluginSettingTab, Setting } from "obsidian";
import { Reminder } from "../modals/reminderModal";

export interface RemindersSettings {
    reminders: Reminder[];
    fastCheckInterval: number;
    slowCheckInterval: number;
    showDebugLog: boolean;
    showSystemNotification: boolean;
    showObsidianNotice: boolean;
    defaultPriority: 'low' | 'normal' | 'high' | 'urgent';
}

export const DEFAULT_SETTINGS: RemindersSettings = {
    reminders: [],
    fastCheckInterval: 5000,
    slowCheckInterval: 30000,
    showDebugLog: false,
    showSystemNotification: true,
    showObsidianNotice: true,
    defaultPriority: 'normal'
};

export class RemindersSettingTab extends PluginSettingTab {
    plugin: any;

    constructor(app: App, plugin: any) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // new Setting(containerEl)
        //     .setName("Fast check interval")
        //     .setDesc("How long (in milliseconds) to …")
        //     .addText((text) =>
        //         text
        //             .setPlaceholder("5000")
        //             .setValue(this.plugin.settings.fastCheckInterval.toString())
        //             .onChange(async (value) => {
        //                 const num = parseInt(value, 10);
        //                 if (!isNaN(num) && num > 0) {
        //                     this.plugin.settings.fastCheckInterval = num;
        //                     await this.plugin.saveSettings();
        //                 }
        //             })
        //     );

        // new Setting(containerEl)
        //     .setName("Slow check interval")
        //     .setDesc("How long (in milliseconds) to …")
        //     .addText((text) =>
        //         text
        //             .setPlaceholder("30000")
        //             .setValue(this.plugin.settings.slowCheckInterval.toString())
        //             .onChange(async (value) => {
        //                 const num = parseInt(value, 10);
        //                 if (!isNaN(num) && num > 0) {
        //                     this.plugin.settings.slowCheckInterval = num;
        //                     await this.plugin.saveSettings();
        //                 }
        //             })
        //     );

        new Setting(containerEl)
            .setName("System notifications")
            .setDesc("Show system notifications when reminders are triggered.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showSystemNotification)
                    .onChange(async (value) => {
                        this.plugin.settings.showSystemNotification = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Obsidian notices")
            .setDesc("Show Obsidian notices when reminders are triggered.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showObsidianNotice)
                    .onChange(async (value) => {
                        this.plugin.settings.showObsidianNotice = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Default priority")
            .setDesc("Default priority level for new reminders.")
            .addDropdown((dropdown) =>
                dropdown
                    .addOption("low", "Low")
                    .addOption("normal", "Normal")
                    .addOption("high", "High")
                    .addOption("urgent", "Urgent")
                    .setValue(this.plugin.settings.defaultPriority)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultPriority = value as 'low' | 'normal' | 'high' | 'urgent';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Debug")
            .setDesc("Show debug logs in the developer console.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showDebugLog)
                    .onChange(async (value) => {
                        this.plugin.settings.showDebugLog = value;
                        await this.plugin.saveSettings();
                    })
            );

    }
}

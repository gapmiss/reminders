/**
 * Error recovery utilities for the Reminders plugin.
 * Provides user-friendly recovery actions and automated retry mechanisms.
 */

import { Notice, Modal, Setting } from 'obsidian';
import type { RemindersPlugin } from '../main';
import type { PluginError } from './errorHandling';

/**
 * Recovery action types that can be offered to users
 */
export enum RecoveryAction {
    RETRY = 'retry',
    REFRESH_SIDEBAR = 'refresh_sidebar',
    RESTART_SCHEDULER = 'restart_scheduler',
    RELOAD_DATA = 'reload_data',
    OPEN_SETTINGS = 'open_settings',
    CONTACT_SUPPORT = 'contact_support'
}

/**
 * Recovery options configuration
 */
export interface RecoveryOption {
    action: RecoveryAction;
    label: string;
    description: string;
    isPrimary?: boolean;
}

/**
 * Error recovery modal that provides users with actionable recovery options
 */
export class ErrorRecoveryModal extends Modal {
    private plugin: RemindersPlugin;
    private error: PluginError;
    private recoveryOptions: RecoveryOption[];

    constructor(plugin: RemindersPlugin, error: PluginError, recoveryOptions: RecoveryOption[]) {
        super(plugin.app);
        this.plugin = plugin;
        this.error = error;
        this.recoveryOptions = recoveryOptions;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('error-recovery-modal');

        // Title
        contentEl.createEl('h2', {
            text: 'Reminders Error Recovery',
            cls: 'error-recovery-title'
        });

        // Error summary
        const errorSection = contentEl.createDiv({ cls: 'error-summary' });
        errorSection.createEl('p', {
            text: this.error.userMessage,
            cls: 'error-message'
        });

        if (this.error.context?.reminderId) {
            errorSection.createEl('p', {
                text: `Reminder ID: ${this.error.context.reminderId}`,
                cls: 'error-context'
            });
        }

        // Recovery options
        const actionsSection = contentEl.createDiv({ cls: 'recovery-actions' });
        actionsSection.createEl('h3', { text: 'Recovery Options' });

        this.recoveryOptions.forEach((option, index) => {
            const actionDiv = actionsSection.createDiv({ cls: 'recovery-option' });

            const button = actionDiv.createEl('button', {
                text: option.label,
                cls: option.isPrimary ? 'mod-cta' : ''
            });

            button.addEventListener('click', async () => {
                await this.executeRecoveryAction(option.action);
            });

            if (option.description) {
                actionDiv.createEl('p', {
                    text: option.description,
                    cls: 'recovery-description'
                });
            }

            // Auto-focus first option
            if (index === 0) {
                setTimeout(() => button.focus(), 100);
            }
        });

        // Technical details (expandable)
        if (this.plugin.settings.showDebugLog) {
            const detailsSection = contentEl.createDiv({ cls: 'error-details' });
            const detailsToggle = detailsSection.createEl('details');
            detailsToggle.createEl('summary', { text: 'Technical Details' });

            const detailsContent = detailsToggle.createDiv({ cls: 'error-details-content' });
            detailsContent.createEl('pre', {
                text: JSON.stringify({
                    category: this.error.category,
                    severity: this.error.severity,
                    message: this.error.message,
                    timestamp: this.error.timestamp,
                    context: this.error.context,
                    stack: this.error.originalError?.stack
                }, null, 2)
            });
        }

        // Close button
        const closeDiv = contentEl.createDiv({ cls: 'error-recovery-close' });
        const closeBtn = closeDiv.createEl('button', { text: 'Close' });
        closeBtn.addEventListener('click', () => this.close());
    }

    private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
        try {
            switch (action) {
                case RecoveryAction.RETRY:
                    if (this.error.recoveryAction) {
                        await this.error.recoveryAction();
                        new Notice('✅ Retry successful');
                    }
                    break;

                case RecoveryAction.REFRESH_SIDEBAR:
                    if (this.plugin.sidebarView) {
                        this.plugin.sidebarView.refresh();
                        new Notice('✅ Sidebar refreshed');
                    }
                    break;

                case RecoveryAction.RESTART_SCHEDULER:
                    this.plugin.scheduler.stop();
                    await this.plugin.scheduler.start();
                    new Notice('✅ Scheduler restarted');
                    break;

                case RecoveryAction.RELOAD_DATA:
                    await this.plugin.loadSettings();
                    if (this.plugin.sidebarView) {
                        this.plugin.sidebarView.refresh();
                    }
                    new Notice('✅ Data reloaded');
                    break;

                case RecoveryAction.OPEN_SETTINGS:
                    // Open Obsidian's settings - type assertion for Obsidian API
                    const app = this.app as any;
                    if (app.setting) {
                        app.setting.open();
                        app.setting.openTabById('reminders');
                    } else {
                        new Notice('Please check plugin settings manually');
                    }
                    break;

                case RecoveryAction.CONTACT_SUPPORT:
                    // Could open a GitHub issue template or support form
                    new Notice('Please report this issue on GitHub');
                    break;
            }

            this.close();
        } catch (recoveryError) {
            console.error('Recovery action failed:', recoveryError);
            new Notice('❌ Recovery action failed');
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Factory function to create appropriate recovery options based on error type
 */
export function createRecoveryOptions(error: PluginError): RecoveryOption[] {
    const options: RecoveryOption[] = [];

    // Add retry option if the error is retryable
    if (error.canRetry) {
        options.push({
            action: RecoveryAction.RETRY,
            label: 'Try Again',
            description: 'Attempt the operation again',
            isPrimary: true
        });
    }

    // Category-specific recovery options
    switch (error.category) {
        case 'data_access':
            options.push({
                action: RecoveryAction.RELOAD_DATA,
                label: 'Reload Data',
                description: 'Refresh reminder data from storage'
            });
            options.push({
                action: RecoveryAction.REFRESH_SIDEBAR,
                label: 'Refresh Sidebar',
                description: 'Update the reminders display'
            });
            break;

        case 'scheduler':
            options.push({
                action: RecoveryAction.RESTART_SCHEDULER,
                label: 'Restart Scheduler',
                description: 'Reset the reminder timing system'
            });
            break;

        case 'notification':
            options.push({
                action: RecoveryAction.OPEN_SETTINGS,
                label: 'Check Settings',
                description: 'Review notification preferences'
            });
            break;

        case 'validation':
            // For validation errors, usually just closing the modal is enough
            break;

        case 'file_system':
            options.push({
                action: RecoveryAction.REFRESH_SIDEBAR,
                label: 'Refresh View',
                description: 'Update file references'
            });
            break;
    }

    // Always add support option for critical/high severity errors
    if (error.severity === 'critical' || error.severity === 'high') {
        options.push({
            action: RecoveryAction.CONTACT_SUPPORT,
            label: 'Report Issue',
            description: 'Get help with this problem'
        });
    }

    return options;
}

/**
 * Automatic retry mechanism with exponential backoff
 */
export class AutoRetryManager {
    private static retryAttempts = new Map<string, number>();
    private static readonly MAX_RETRIES = 3;
    private static readonly BASE_DELAY = 1000; // 1 second

    /**
     * Automatically retry a failed operation with exponential backoff
     */
    static async autoRetry<T>(
        operation: () => Promise<T>,
        errorKey: string,
        onRetrySuccess?: (result: T) => void,
        onRetryFailed?: (finalError: Error) => void
    ): Promise<T | null> {
        const currentAttempts = this.retryAttempts.get(errorKey) || 0;

        if (currentAttempts >= this.MAX_RETRIES) {
            this.retryAttempts.delete(errorKey);
            return null;
        }

        try {
            const result = await operation();
            // Success - clear retry count
            this.retryAttempts.delete(errorKey);
            if (onRetrySuccess) {
                onRetrySuccess(result);
            }
            return result;
        } catch (error) {
            const newAttempts = currentAttempts + 1;
            this.retryAttempts.set(errorKey, newAttempts);

            if (newAttempts < this.MAX_RETRIES) {
                // Calculate delay with exponential backoff
                const delay = this.BASE_DELAY * Math.pow(2, newAttempts - 1);

                // Schedule retry
                setTimeout(async () => {
                    await this.autoRetry(operation, errorKey, onRetrySuccess, onRetryFailed);
                }, delay);

                new Notice(`⏳ Retrying in ${delay / 1000} seconds... (${newAttempts}/${this.MAX_RETRIES})`);
            } else {
                // Max retries reached
                this.retryAttempts.delete(errorKey);
                if (onRetryFailed) {
                    onRetryFailed(error instanceof Error ? error : new Error(String(error)));
                }
            }

            return null;
        }
    }

    /**
     * Clear retry attempts for a specific operation
     */
    static clearRetries(errorKey: string): void {
        this.retryAttempts.delete(errorKey);
    }

    /**
     * Clear all retry attempts
     */
    static clearAllRetries(): void {
        this.retryAttempts.clear();
    }
}

/**
 * Quick recovery actions that can be executed immediately
 */
export class QuickRecovery {
    /**
     * Attempt to recover from a data access error
     */
    static async recoverDataAccess(plugin: RemindersPlugin): Promise<boolean> {
        try {
            await plugin.loadSettings();
            if (plugin.sidebarView) {
                plugin.sidebarView.refresh();
            }
            new Notice('✅ Data access recovered');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Attempt to recover from a scheduler error
     */
    static async recoverScheduler(plugin: RemindersPlugin): Promise<boolean> {
        try {
            plugin.scheduler.stop();
            await plugin.scheduler.start();
            new Notice('✅ Scheduler recovered');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Attempt to recover from a notification error
     */
    static async recoverNotification(plugin: RemindersPlugin): Promise<boolean> {
        try {
            // Reset notification permissions if possible
            if ('Notification' in window && Notification.permission === 'default') {
                await Notification.requestPermission();
            }
            new Notice('✅ Notification system checked');
            return true;
        } catch (error) {
            return false;
        }
    }
}
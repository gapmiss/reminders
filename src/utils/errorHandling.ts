/**
 * Centralized error handling system for the Reminders plugin.
 * Provides consistent error types, logging, user feedback, and recovery mechanisms.
 */

import { Notice } from 'obsidian';
import type { RemindersPlugin } from '../main';
import { ErrorRecoveryModal, createRecoveryOptions, AutoRetryManager } from './errorRecovery';

/**
 * Standard error categories for the plugin
 */
export enum ErrorCategory {
    VALIDATION = 'validation',
    DATA_ACCESS = 'data_access',
    SCHEDULER = 'scheduler',
    NOTIFICATION = 'notification',
    FILE_SYSTEM = 'file_system',
    USER_INPUT = 'user_input',
    UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',       // Minor issues, functionality continues
    MEDIUM = 'medium', // Some functionality affected
    HIGH = 'high',     // Major functionality broken
    CRITICAL = 'critical' // Plugin unusable
}

/**
 * Standard error interface for the plugin
 */
export interface PluginError {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    context?: Record<string, any>;
    originalError?: Error;
    timestamp: string;
    canRetry: boolean;
    recoveryAction?: () => void;
}

/**
 * Configuration for error handling behavior
 */
export interface ErrorHandlingConfig {
    showUserNotifications: boolean;
    logToConsole: boolean;
    logDebugInfo: boolean;
    autoRetryOnFailure: boolean;
    maxRetryAttempts: number;
}

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
    showUserNotifications: true,
    logToConsole: true,
    logDebugInfo: false,
    autoRetryOnFailure: false,
    maxRetryAttempts: 3
};

/**
 * Centralized error handler class
 */
export class ErrorHandler {
    private plugin: RemindersPlugin;
    private config: ErrorHandlingConfig;
    private errorHistory: PluginError[] = [];
    private readonly MAX_ERROR_HISTORY = 50;

    constructor(plugin: RemindersPlugin, config: Partial<ErrorHandlingConfig> = {}) {
        this.plugin = plugin;
        this.config = { ...DEFAULT_ERROR_CONFIG, ...config };
    }

    /**
     * Handle an error with full context and user feedback
     */
    handleError(error: Partial<PluginError> | Error | string): PluginError {
        const pluginError = this.normalizeError(error);

        // Add to error history
        this.addToHistory(pluginError);

        // Log error based on configuration
        if (this.config.logToConsole) {
            this.logError(pluginError);
        }

        // Show user notification based on severity and configuration
        if (this.config.showUserNotifications && this.shouldShowUserNotification(pluginError)) {
            this.showUserNotification(pluginError);
        }

        return pluginError;
    }

    /**
     * Handle validation errors (usually from user input)
     */
    handleValidationError(message: string, userMessage?: string, context?: Record<string, any>): PluginError {
        return this.handleError({
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.LOW,
            message,
            userMessage: userMessage || message,
            context,
            canRetry: false
        });
    }

    /**
     * Handle data access errors (reminder CRUD operations)
     */
    handleDataError(message: string, originalError?: Error, context?: Record<string, any>): PluginError {
        return this.handleError({
            category: ErrorCategory.DATA_ACCESS,
            severity: ErrorSeverity.MEDIUM,
            message,
            userMessage: 'Failed to save or load reminder data',
            originalError,
            context,
            canRetry: true
        });
    }

    /**
     * Handle scheduler errors (notification timing issues)
     */
    handleSchedulerError(message: string, originalError?: Error, context?: Record<string, any>): PluginError {
        return this.handleError({
            category: ErrorCategory.SCHEDULER,
            severity: ErrorSeverity.MEDIUM,
            message,
            userMessage: 'Reminder scheduling encountered an issue',
            originalError,
            context,
            canRetry: true
        });
    }

    /**
     * Handle notification errors (display issues)
     */
    handleNotificationError(message: string, originalError?: Error, context?: Record<string, any>): PluginError {
        return this.handleError({
            category: ErrorCategory.NOTIFICATION,
            severity: ErrorSeverity.LOW,
            message,
            userMessage: 'Failed to display notification',
            originalError,
            context,
            canRetry: true
        });
    }

    /**
     * Handle file system errors (note linking, file access)
     */
    handleFileSystemError(message: string, originalError?: Error, context?: Record<string, any>): PluginError {
        return this.handleError({
            category: ErrorCategory.FILE_SYSTEM,
            severity: ErrorSeverity.LOW,
            message,
            userMessage: 'File access issue',
            originalError,
            context,
            canRetry: false
        });
    }

    /**
     * Safe async operation wrapper with error handling
     */
    async safeAsync<T>(
        operation: () => Promise<T>,
        errorMessage: string,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        context?: Record<string, any>
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            this.handleError({
                category,
                severity: ErrorSeverity.MEDIUM,
                message: errorMessage,
                userMessage: errorMessage,
                originalError: error instanceof Error ? error : new Error(String(error)),
                context,
                canRetry: true
            });
            return null;
        }
    }

    /**
     * Safe sync operation wrapper with error handling
     */
    safeSync<T>(
        operation: () => T,
        errorMessage: string,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        context?: Record<string, any>
    ): T | null {
        try {
            return operation();
        } catch (error) {
            this.handleError({
                category,
                severity: ErrorSeverity.MEDIUM,
                message: errorMessage,
                userMessage: errorMessage,
                originalError: error instanceof Error ? error : new Error(String(error)),
                context,
                canRetry: true
            });
            return null;
        }
    }

    /**
     * Get recent error history for debugging
     */
    getErrorHistory(): PluginError[] {
        return [...this.errorHistory];
    }

    /**
     * Clear error history
     */
    clearErrorHistory(): void {
        this.errorHistory = [];
    }

    /**
     * Update error handling configuration
     */
    updateConfig(newConfig: Partial<ErrorHandlingConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Private: Normalize various error inputs into PluginError
     */
    private normalizeError(error: Partial<PluginError> | Error | string): PluginError {
        const timestamp = new Date().toISOString();

        // If it's already a PluginError (partial), fill in defaults
        if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
            return {
                category: ErrorCategory.UNKNOWN,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: error.message,
                context: {},
                timestamp,
                canRetry: false,
                ...error
            };
        }

        // If it's an Error object
        if (error instanceof Error) {
            return {
                category: ErrorCategory.UNKNOWN,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'An unexpected error occurred',
                originalError: error,
                context: { stack: error.stack },
                timestamp,
                canRetry: false
            };
        }

        // If it's a string
        return {
            category: ErrorCategory.UNKNOWN,
            severity: ErrorSeverity.MEDIUM,
            message: String(error),
            userMessage: String(error),
            context: {},
            timestamp,
            canRetry: false
        };
    }

    /**
     * Private: Add error to history with size limit
     */
    private addToHistory(error: PluginError): void {
        this.errorHistory.unshift(error);
        if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
            this.errorHistory = this.errorHistory.slice(0, this.MAX_ERROR_HISTORY);
        }
    }

    /**
     * Private: Log error to console with appropriate level
     */
    private logError(error: PluginError): void {
        const logPrefix = `[Reminders Plugin] ${error.category.toUpperCase()}`;
        const logMessage = `${error.message}${error.context ? ` | Context: ${JSON.stringify(error.context)}` : ''}`;

        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
            case ErrorSeverity.HIGH:
                console.error(`${logPrefix}: ${logMessage}`, error.originalError);
                break;
            case ErrorSeverity.MEDIUM:
                console.warn(`${logPrefix}: ${logMessage}`, error.originalError);
                break;
            case ErrorSeverity.LOW:
                if (this.config.logDebugInfo) {
                    console.log(`${logPrefix}: ${logMessage}`, error.originalError);
                }
                break;
        }
    }

    /**
     * Private: Determine if user should see notification based on severity
     */
    private shouldShowUserNotification(error: PluginError): boolean {
        // Always show critical and high severity errors
        if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
            return true;
        }

        // Show medium severity errors unless they're validation errors
        if (error.severity === ErrorSeverity.MEDIUM) {
            return error.category !== ErrorCategory.VALIDATION;
        }

        // Only show low severity errors if they're validation errors
        return error.category === ErrorCategory.VALIDATION;
    }

    /**
     * Private: Show user notification through Obsidian Notice
     */
    private showUserNotification(error: PluginError): void {
        const noticeTimeout = this.getNoticeTimeout(error.severity);

        // For critical/high errors or retryable errors, show recovery modal
        if (error.severity === ErrorSeverity.CRITICAL ||
            error.severity === ErrorSeverity.HIGH ||
            (error.canRetry && error.severity === ErrorSeverity.MEDIUM)) {

            const recoveryOptions = createRecoveryOptions(error);
            if (recoveryOptions.length > 0) {
                // Show enhanced recovery modal for serious errors
                const recoveryModal = new ErrorRecoveryModal(this.plugin, error, recoveryOptions);
                recoveryModal.open();
                return;
            }
        }

        // For other errors, show standard notice
        const notice = new Notice(error.userMessage, noticeTimeout);
    }

    /**
     * Private: Get appropriate notice timeout based on severity
     */
    private getNoticeTimeout(severity: ErrorSeverity): number {
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                return 0; // No auto-dismiss
            case ErrorSeverity.HIGH:
                return 10000; // 10 seconds
            case ErrorSeverity.MEDIUM:
                return 5000; // 5 seconds
            case ErrorSeverity.LOW:
                return 3000; // 3 seconds
            default:
                return 5000;
        }
    }
}

/**
 * Convenience function to create error handler with debug logging from settings
 */
export function createErrorHandler(plugin: RemindersPlugin): ErrorHandler {
    return new ErrorHandler(plugin, {
        logDebugInfo: plugin.settings.showDebugLog,
        showUserNotifications: true,
        logToConsole: true
    });
}

/**
 * Type guard to check if an error is a PluginError
 */
export function isPluginError(error: any): error is PluginError {
    return error &&
           typeof error === 'object' &&
           'category' in error &&
           'severity' in error &&
           'message' in error &&
           'userMessage' in error;
}
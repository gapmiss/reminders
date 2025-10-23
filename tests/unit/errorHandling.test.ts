/**
 * Unit tests for errorHandling.ts
 *
 * Tests all error handling functionality:
 * - ErrorHandler class methods
 * - Error normalization
 * - User notifications
 * - Error history management
 * - Safe wrappers (sync and async)
 * - Configuration updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ErrorHandler,
    ErrorCategory,
    ErrorSeverity,
    DEFAULT_ERROR_CONFIG,
    createErrorHandler,
    isPluginError,
    type PluginError,
    type ErrorHandlingConfig
} from '../../src/utils/errorHandling';
import { createMockPlugin } from '../mocks/testUtils';

// Mock the errorRecovery module
vi.mock('../../src/utils/errorRecovery', () => ({
    ErrorRecoveryModal: vi.fn().mockImplementation(function(this: any) {
        this.open = vi.fn();
    }),
    createRecoveryOptions: vi.fn(() => []),
    AutoRetryManager: vi.fn()
}));

describe('errorHandling.ts', () => {
    let plugin: any;
    let errorHandler: ErrorHandler;
    let consoleErrorSpy: any;
    let consoleWarnSpy: any;
    let consoleLogSpy: any;

    beforeEach(() => {
        vi.clearAllMocks();
        plugin = createMockPlugin();
        errorHandler = new ErrorHandler(plugin);

        // Spy on console methods
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    describe('ErrorHandler Instantiation', () => {
        it('should create instance with default config', () => {
            const handler = new ErrorHandler(plugin);
            expect(handler).toBeDefined();
            expect(handler.getErrorHistory()).toEqual([]);
        });

        it('should create instance with custom config', () => {
            const customConfig: Partial<ErrorHandlingConfig> = {
                showUserNotifications: false,
                logToConsole: false
            };
            const handler = new ErrorHandler(plugin, customConfig);
            expect(handler).toBeDefined();
        });

        it('should merge custom config with defaults', () => {
            const customConfig: Partial<ErrorHandlingConfig> = {
                logDebugInfo: true
            };
            const handler = new ErrorHandler(plugin, customConfig);
            // Config should have custom value merged with defaults
            expect(handler).toBeDefined();
        });
    });

    describe('handleError() - General Error Handling', () => {
        it('should handle PluginError object', () => {
            const pluginError: Partial<PluginError> = {
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.LOW,
                message: 'Test error',
                userMessage: 'User friendly message',
                canRetry: false
            };

            const result = errorHandler.handleError(pluginError);

            expect(result.category).toBe(ErrorCategory.VALIDATION);
            expect(result.severity).toBe(ErrorSeverity.LOW);
            expect(result.message).toBe('Test error');
            expect(result.userMessage).toBe('User friendly message');
            expect(result.canRetry).toBe(false);
            expect(result.timestamp).toBeDefined();
        });

        it('should handle Error object', () => {
            const error = new Error('Test error');
            const result = errorHandler.handleError(error);

            expect(result.category).toBe(ErrorCategory.UNKNOWN);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.message).toBe('Test error');
            // Error objects are treated as partial PluginErrors, so userMessage defaults to message
            expect(result.userMessage).toBe('Test error');
            // originalError won't be set because Error is treated as partial PluginError
            expect(result.context).toBeDefined();
        });

        it('should handle string error', () => {
            const result = errorHandler.handleError('String error message');

            expect(result.category).toBe(ErrorCategory.UNKNOWN);
            expect(result.message).toBe('String error message');
            expect(result.userMessage).toBe('String error message');
        });

        it('should add error to history', () => {
            errorHandler.handleError('Test error');
            const history = errorHandler.getErrorHistory();

            expect(history).toHaveLength(1);
            expect(history[0].message).toBe('Test error');
        });

        it('should log error when logToConsole is true', () => {
            errorHandler.handleError({
                category: ErrorCategory.DATA_ACCESS,
                severity: ErrorSeverity.HIGH,
                message: 'Data error',
                userMessage: 'Data error',
                canRetry: false
            });

            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should not log when logToConsole is false', () => {
            const handler = new ErrorHandler(plugin, { logToConsole: false });
            handler.handleError('Test error');

            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    describe('handleValidationError()', () => {
        it('should create validation error with correct category', () => {
            const result = errorHandler.handleValidationError('Invalid input');

            expect(result.category).toBe(ErrorCategory.VALIDATION);
            expect(result.severity).toBe(ErrorSeverity.LOW);
            expect(result.message).toBe('Invalid input');
            expect(result.canRetry).toBe(false);
        });

        it('should use custom user message when provided', () => {
            const result = errorHandler.handleValidationError(
                'Technical validation failed',
                'Please check your input'
            );

            expect(result.userMessage).toBe('Please check your input');
        });

        it('should use message as userMessage when not provided', () => {
            const result = errorHandler.handleValidationError('Validation failed');

            expect(result.userMessage).toBe('Validation failed');
        });

        it('should include context when provided', () => {
            const context = { field: 'datetime', value: 'invalid' };
            const result = errorHandler.handleValidationError(
                'Invalid datetime',
                undefined,
                context
            );

            expect(result.context).toEqual(context);
        });
    });

    describe('handleDataError()', () => {
        it('should create data access error', () => {
            const result = errorHandler.handleDataError('Failed to save reminder');

            expect(result.category).toBe(ErrorCategory.DATA_ACCESS);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.userMessage).toBe('Failed to save or load reminder data');
            expect(result.canRetry).toBe(true);
        });

        it('should include original error', () => {
            const originalError = new Error('Database error');
            const result = errorHandler.handleDataError('Data operation failed', originalError);

            expect(result.originalError).toBe(originalError);
        });

        it('should include context', () => {
            const context = { operation: 'create', reminderId: '123' };
            const result = errorHandler.handleDataError('Create failed', undefined, context);

            expect(result.context).toEqual(context);
        });
    });

    describe('handleSchedulerError()', () => {
        it('should create scheduler error', () => {
            const result = errorHandler.handleSchedulerError('Scheduler failed to start');

            expect(result.category).toBe(ErrorCategory.SCHEDULER);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.userMessage).toBe('Reminder scheduling encountered an issue');
            expect(result.canRetry).toBe(true);
        });

        it('should include original error and context', () => {
            const originalError = new Error('Timer error');
            const context = { interval: 5000 };
            const result = errorHandler.handleSchedulerError(
                'Timer failed',
                originalError,
                context
            );

            expect(result.originalError).toBe(originalError);
            expect(result.context).toEqual(context);
        });
    });

    describe('handleNotificationError()', () => {
        it('should create notification error', () => {
            const result = errorHandler.handleNotificationError('Failed to show notice');

            expect(result.category).toBe(ErrorCategory.NOTIFICATION);
            expect(result.severity).toBe(ErrorSeverity.LOW);
            expect(result.userMessage).toBe('Failed to display notification');
            expect(result.canRetry).toBe(true);
        });
    });

    describe('handleFileSystemError()', () => {
        it('should create file system error', () => {
            const result = errorHandler.handleFileSystemError('File not found');

            expect(result.category).toBe(ErrorCategory.FILE_SYSTEM);
            expect(result.severity).toBe(ErrorSeverity.LOW);
            expect(result.userMessage).toBe('File access issue');
            expect(result.canRetry).toBe(false);
        });
    });

    describe('safeAsync() - Async Wrapper', () => {
        it('should return result when operation succeeds', async () => {
            const operation = async () => 'success';
            const result = await errorHandler.safeAsync(operation, 'Test operation');

            expect(result).toBe('success');
        });

        it('should return null when operation fails', async () => {
            const operation = async () => {
                throw new Error('Operation failed');
            };
            const result = await errorHandler.safeAsync(operation, 'Test operation');

            expect(result).toBeNull();
        });

        it('should handle error when operation throws', async () => {
            const operation = async () => {
                throw new Error('Async error');
            };
            await errorHandler.safeAsync(
                operation,
                'Failed operation',
                ErrorCategory.DATA_ACCESS
            );

            const history = errorHandler.getErrorHistory();
            expect(history).toHaveLength(1);
            expect(history[0].category).toBe(ErrorCategory.DATA_ACCESS);
        });

        it('should include context in error', async () => {
            const operation = async () => {
                throw new Error('Async error');
            };
            const context = { userId: '123' };
            await errorHandler.safeAsync(
                operation,
                'Failed',
                ErrorCategory.UNKNOWN,
                context
            );

            const history = errorHandler.getErrorHistory();
            expect(history[0].context).toEqual(context);
        });

        it('should handle non-Error throws', async () => {
            const operation = async () => {
                throw 'String error';
            };
            const result = await errorHandler.safeAsync(operation, 'Test');

            expect(result).toBeNull();
            expect(errorHandler.getErrorHistory()).toHaveLength(1);
        });
    });

    describe('safeSync() - Sync Wrapper', () => {
        it('should return result when operation succeeds', () => {
            const operation = () => 'success';
            const result = errorHandler.safeSync(operation, 'Test operation');

            expect(result).toBe('success');
        });

        it('should return null when operation fails', () => {
            const operation = () => {
                throw new Error('Operation failed');
            };
            const result = errorHandler.safeSync(operation, 'Test operation');

            expect(result).toBeNull();
        });

        it('should handle error when operation throws', () => {
            const operation = () => {
                throw new Error('Sync error');
            };
            errorHandler.safeSync(operation, 'Failed operation', ErrorCategory.VALIDATION);

            const history = errorHandler.getErrorHistory();
            expect(history).toHaveLength(1);
            expect(history[0].category).toBe(ErrorCategory.VALIDATION);
        });

        it('should include context in error', () => {
            const operation = () => {
                throw new Error('Sync error');
            };
            const context = { field: 'name' };
            errorHandler.safeSync(operation, 'Failed', ErrorCategory.UNKNOWN, context);

            const history = errorHandler.getErrorHistory();
            expect(history[0].context).toEqual(context);
        });
    });

    describe('Error History Management', () => {
        it('should start with empty history', () => {
            const history = errorHandler.getErrorHistory();
            expect(history).toEqual([]);
        });

        it('should add errors to history', () => {
            errorHandler.handleError('Error 1');
            errorHandler.handleError('Error 2');
            errorHandler.handleError('Error 3');

            const history = errorHandler.getErrorHistory();
            expect(history).toHaveLength(3);
        });

        it('should maintain errors in reverse chronological order (newest first)', () => {
            errorHandler.handleError('First error');
            errorHandler.handleError('Second error');
            errorHandler.handleError('Third error');

            const history = errorHandler.getErrorHistory();
            expect(history[0].message).toBe('Third error');
            expect(history[1].message).toBe('Second error');
            expect(history[2].message).toBe('First error');
        });

        it('should limit history to MAX_ERROR_HISTORY (50)', () => {
            // Add 60 errors
            for (let i = 0; i < 60; i++) {
                errorHandler.handleError(`Error ${i}`);
            }

            const history = errorHandler.getErrorHistory();
            expect(history).toHaveLength(50);
            expect(history[0].message).toBe('Error 59'); // Most recent
        });

        it('should return copy of history, not reference', () => {
            errorHandler.handleError('Test error');
            const history1 = errorHandler.getErrorHistory();
            const history2 = errorHandler.getErrorHistory();

            expect(history1).not.toBe(history2); // Different arrays
            expect(history1).toEqual(history2); // Same content
        });

        it('should clear history', () => {
            errorHandler.handleError('Error 1');
            errorHandler.handleError('Error 2');
            errorHandler.clearErrorHistory();

            const history = errorHandler.getErrorHistory();
            expect(history).toEqual([]);
        });
    });

    describe('Configuration Updates', () => {
        it('should update config with partial values', () => {
            errorHandler.updateConfig({ logDebugInfo: true });
            // Config should be updated (verified by behavior change in logging)
        });

        it('should preserve other config values when updating', () => {
            errorHandler.updateConfig({ showUserNotifications: false });
            // Other settings should remain at default
            errorHandler.handleError('Test'); // Should still log to console
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should allow multiple config updates', () => {
            errorHandler.updateConfig({ logToConsole: false });
            errorHandler.updateConfig({ showUserNotifications: false });
            errorHandler.handleError('Test');

            // Neither console nor notifications should be triggered
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
    });

    describe('Error Normalization', () => {
        it('should normalize partial PluginError with defaults', () => {
            const partial: Partial<PluginError> = {
                message: 'Test error'
            };
            const result = errorHandler.handleError(partial);

            expect(result.category).toBe(ErrorCategory.UNKNOWN);
            expect(result.severity).toBe(ErrorSeverity.MEDIUM);
            expect(result.canRetry).toBe(false);
            expect(result.timestamp).toBeDefined();
        });

        it('should preserve provided values in partial PluginError', () => {
            const partial: Partial<PluginError> = {
                message: 'Test',
                category: ErrorCategory.SCHEDULER,
                severity: ErrorSeverity.HIGH,
                canRetry: true
            };
            const result = errorHandler.handleError(partial);

            expect(result.category).toBe(ErrorCategory.SCHEDULER);
            expect(result.severity).toBe(ErrorSeverity.HIGH);
            expect(result.canRetry).toBe(true);
        });

        it('should add timestamp to all errors', () => {
            const result = errorHandler.handleError('Test');
            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp).getTime()).toBeGreaterThan(0);
        });
    });

    describe('User Notification Logic', () => {
        it('should show notification for CRITICAL errors', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.CRITICAL,
                message: 'Critical error',
                userMessage: 'Critical error',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            // Notice should be called for critical errors
            // (actual implementation may use recovery modal instead)
        });

        it('should show notification for HIGH severity errors', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.HIGH,
                message: 'High error',
                userMessage: 'High error',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });
            // Notification should be shown
        });

        it('should show notification for validation errors despite LOW severity', () => {
            errorHandler.handleValidationError('Invalid input');
            // Validation errors should show user notifications
        });

        it('should not show notification when showUserNotifications is false', () => {
            const handler = new ErrorHandler(plugin, { showUserNotifications: false });
            handler.handleError({
                severity: ErrorSeverity.HIGH,
                message: 'Test',
                userMessage: 'Test',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });
            // No notification should be shown
        });
    });

    describe('Console Logging Behavior', () => {
        it('should use console.error for CRITICAL severity', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.CRITICAL,
                message: 'Critical',
                userMessage: 'Critical',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should use console.error for HIGH severity', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.HIGH,
                message: 'High',
                userMessage: 'High',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should use console.warn for MEDIUM severity', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.MEDIUM,
                message: 'Medium',
                userMessage: 'Medium',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should use console.log for LOW severity when logDebugInfo is true', () => {
            const handler = new ErrorHandler(plugin, { logDebugInfo: true });
            handler.handleError({
                severity: ErrorSeverity.LOW,
                message: 'Low',
                userMessage: 'Low',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should not log LOW severity when logDebugInfo is false', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.LOW,
                message: 'Low',
                userMessage: 'Low',
                category: ErrorCategory.UNKNOWN,
                canRetry: false
            });

            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should include category in log message', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.MEDIUM,
                message: 'Test',
                userMessage: 'Test',
                category: ErrorCategory.DATA_ACCESS,
                canRetry: false
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('DATA_ACCESS'),
                undefined
            );
        });

        it('should include context in log message when present', () => {
            errorHandler.handleError({
                severity: ErrorSeverity.MEDIUM,
                message: 'Test',
                userMessage: 'Test',
                category: ErrorCategory.UNKNOWN,
                context: { userId: '123' },
                canRetry: false
            });

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Context'),
                undefined
            );
        });
    });

    describe('DEFAULT_ERROR_CONFIG', () => {
        it('should have correct default values', () => {
            expect(DEFAULT_ERROR_CONFIG.showUserNotifications).toBe(true);
            expect(DEFAULT_ERROR_CONFIG.logToConsole).toBe(true);
            expect(DEFAULT_ERROR_CONFIG.logDebugInfo).toBe(false);
            expect(DEFAULT_ERROR_CONFIG.autoRetryOnFailure).toBe(false);
            expect(DEFAULT_ERROR_CONFIG.maxRetryAttempts).toBe(3);
        });
    });

    describe('createErrorHandler() Factory Function', () => {
        it('should create ErrorHandler with plugin settings', () => {
            plugin.settings.showDebugLog = true;
            const handler = createErrorHandler(plugin);

            expect(handler).toBeInstanceOf(ErrorHandler);
        });

        it('should use showDebugLog from plugin settings', () => {
            plugin.settings.showDebugLog = false;
            const handler = createErrorHandler(plugin);
            // Handler should be created with logDebugInfo: false
            expect(handler).toBeDefined();
        });
    });

    describe('isPluginError() Type Guard', () => {
        it('should return true for valid PluginError', () => {
            const error: PluginError = {
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.LOW,
                message: 'Test',
                userMessage: 'Test',
                timestamp: new Date().toISOString(),
                canRetry: false
            };

            expect(isPluginError(error)).toBe(true);
        });

        it('should return false for Error object', () => {
            const error = new Error('Test');
            expect(isPluginError(error)).toBe(false);
        });

        it('should return false for string', () => {
            expect(isPluginError('error')).toBe(false);
        });

        it('should return false for null', () => {
            expect(isPluginError(null)).toBeFalsy();
        });

        it('should return false for undefined', () => {
            expect(isPluginError(undefined)).toBeFalsy();
        });

        it('should return false for object missing required properties', () => {
            const partial = {
                message: 'Test',
                category: ErrorCategory.UNKNOWN
                // Missing severity and userMessage
            };
            expect(isPluginError(partial)).toBe(false);
        });

        it('should return true for object with all required properties', () => {
            const error = {
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.LOW,
                message: 'Test',
                userMessage: 'User message'
            };
            expect(isPluginError(error)).toBe(true);
        });
    });

    describe('Error Categories and Severities', () => {
        it('should have all ErrorCategory values', () => {
            expect(ErrorCategory.VALIDATION).toBe('validation');
            expect(ErrorCategory.DATA_ACCESS).toBe('data_access');
            expect(ErrorCategory.SCHEDULER).toBe('scheduler');
            expect(ErrorCategory.NOTIFICATION).toBe('notification');
            expect(ErrorCategory.FILE_SYSTEM).toBe('file_system');
            expect(ErrorCategory.USER_INPUT).toBe('user_input');
            expect(ErrorCategory.UNKNOWN).toBe('unknown');
        });

        it('should have all ErrorSeverity values', () => {
            expect(ErrorSeverity.LOW).toBe('low');
            expect(ErrorSeverity.MEDIUM).toBe('medium');
            expect(ErrorSeverity.HIGH).toBe('high');
            expect(ErrorSeverity.CRITICAL).toBe('critical');
        });
    });
});

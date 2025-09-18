/**
 * Shared type definitions for the Obsidian Reminders Plugin
 *
 * This file centralizes all type definitions to prevent duplication
 * and ensure consistency across the codebase.
 */

/**
 * Priority levels for reminders, ordered from lowest to highest urgency.
 */
export type ReminderPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Filter types for viewing different subsets of reminders in the sidebar.
 */
export type FilterType = 'pending' | 'upcoming' | 'snoozed' | 'completed' | 'all';

/**
 * Main interface defining the structure of a reminder.
 * This is the core data type used throughout the plugin.
 */
export interface Reminder {
    id: string;                    // Unique identifier for the reminder
    message: string;               // The reminder text shown to the user
    datetime: string;              // When to trigger (ISO string format)
    priority: ReminderPriority;    // Importance level
    category: string;              // Optional organization category
    sourceNote?: string;           // Optional link to source note file path
    sourceLine?: number;           // Optional link to specific line in note
    completed: boolean;            // Whether the reminder has been finished
    completedAt?: string;          // When it was completed (ISO string)
    snoozedUntil?: string;        // When snoozed reminder should reappear (ISO string)
    snoozeCount: number;          // How many times this reminder has been snoozed
    notifiedAt?: string;          // When user was first notified about this overdue reminder (ISO string)
    created: string;              // When reminder was created (ISO string)
    updated: string;              // When reminder was last modified (ISO string)
}

/**
 * Plugin settings interface for configuring reminder behavior.
 */
/**
 * Re-notification interval options for overdue reminders
 */
export type RenotificationInterval = 'never' | '1hour' | '4hours' | '24hours';

export interface RemindersSettings {
    reminders: Reminder[];                    // Array of all reminder data
    fastCheckInterval: number;                // Milliseconds between checks when reminders are due soon
    slowCheckInterval: number;                // Milliseconds between checks when no reminders are due soon
    showDebugLog: boolean;                   // Whether to output debug information to console
    showSystemNotification: boolean;          // Whether to show OS-level notifications
    showObsidianNotice: boolean;             // Whether to show Obsidian's in-app notice popup
    defaultPriority: ReminderPriority;       // Priority level assigned to new reminders by default
    renotificationInterval: RenotificationInterval; // How often to re-notify for unactioned overdue reminders
}

/**
 * Interface for snooze duration options.
 * Used both for preset options and custom user input.
 */
export interface SnoozeOption {
    label: string;    // Display text shown to user
    minutes: number;  // Duration in minutes
}

/**
 * Statistics about reminders for display in the sidebar.
 */
export interface ReminderStatistics {
    total: number;        // Total number of reminders
    completed: number;    // Number of completed reminders
    pending: number;      // Number of pending (incomplete) reminders
    snoozed: number;      // Number of currently snoozed reminders
    overdue: number;      // Number of overdue reminders
    upcoming24h: number;  // Number of reminders due in the next 24 hours
}

/**
 * Interface for tracking reminders in the time updater.
 */
export interface TrackedReminder {
    id: string;
    datetime: string;
    snoozedUntil?: string;
}

/**
 * Interface for time display elements in the UI.
 */
export interface TimeDisplayElement {
    element: HTMLSpanElement;
    isSnoozed: boolean;
}

/**
 * Type guard functions for runtime type safety
 */

/**
 * Checks if a value is a valid ReminderPriority
 */
export function isValidPriority(value: any): value is ReminderPriority {
    return typeof value === 'string' && ['low', 'normal', 'high', 'urgent'].includes(value);
}

/**
 * Checks if a value is a valid FilterType
 */
export function isValidFilterType(value: any): value is FilterType {
    return typeof value === 'string' && ['pending', 'upcoming', 'snoozed', 'completed', 'all'].includes(value);
}

/**
 * Checks if a string is a valid ISO date string
 */
export function isValidISODate(value: string): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
}

/**
 * Checks if an object has the required properties to be a valid Reminder
 */
export function isValidReminder(obj: any): obj is Reminder {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.message === 'string' &&
        typeof obj.datetime === 'string' &&
        isValidISODate(obj.datetime) &&
        isValidPriority(obj.priority) &&
        typeof obj.category === 'string' &&
        typeof obj.completed === 'boolean' &&
        typeof obj.snoozeCount === 'number' &&
        typeof obj.created === 'string' &&
        isValidISODate(obj.created) &&
        typeof obj.updated === 'string' &&
        isValidISODate(obj.updated) &&
        (obj.sourceNote === undefined || typeof obj.sourceNote === 'string') &&
        (obj.sourceLine === undefined || typeof obj.sourceLine === 'number') &&
        (obj.completedAt === undefined || (typeof obj.completedAt === 'string' && isValidISODate(obj.completedAt))) &&
        (obj.snoozedUntil === undefined || (typeof obj.snoozedUntil === 'string' && isValidISODate(obj.snoozedUntil))) &&
        (obj.notifiedAt === undefined || (typeof obj.notifiedAt === 'string' && isValidISODate(obj.notifiedAt)))
    );
}
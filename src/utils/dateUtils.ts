import { format, formatDistanceToNow, addMinutes, addHours, addDays, setHours, setMinutes, isBefore, isAfter, differenceInMilliseconds } from 'date-fns';
import { DATE_FORMATS } from '../constants';

/**
 * Centralized date utilities for consistent date handling throughout the plugin.
 * Provides standardized formatting, validation, and manipulation functions.
 */

/**
 * Gets the current date and time as a Date object.
 * Centralized for easier testing and consistency.
 */
export function getNow(): Date {
    return new Date();
}

/**
 * Gets the current date and time as an ISO string.
 * Used for timestamps in reminder data.
 */
export function getNowISO(): string {
    return getNow().toISOString();
}

/**
 * Safely parses a date string or Date object.
 * Returns null if the date is invalid.
 */
export function parseDate(dateInput: string | Date | undefined | null): Date | null {
    if (!dateInput) return null;

    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Checks if a date string or Date object is valid.
 */
export function isValidDate(dateInput: string | Date | undefined | null): boolean {
    return parseDate(dateInput) !== null;
}

/**
 * Formats a date for display in the UI.
 * Returns fallback text if date is invalid.
 */
export function formatDateDisplay(dateInput: string | Date | undefined | null, fallback = 'Invalid date'): string {
    const date = parseDate(dateInput);
    if (!date) return fallback;

    return format(date, DATE_FORMATS.TIME_SHORT);
}

/**
 * Formats a date for display with full year (used in modals).
 * Returns fallback text if date is invalid.
 */
export function formatDateDisplayLong(dateInput: string | Date | undefined | null, fallback = 'Invalid date'): string {
    const date = parseDate(dateInput);
    if (!date) return fallback;

    return format(date, DATE_FORMATS.TIME_LONG);
}

/**
 * Formats relative time distance (e.g., "5 minutes ago", "in 2 hours").
 * Standardizes the format used throughout the app.
 */
export function formatRelativeTime(dateInput: string | Date | undefined | null, fallback = 'Invalid time'): string {
    const date = parseDate(dateInput);
    if (!date) return fallback;

    return formatDistanceToNow(date, {
        addSuffix: true,
        includeSeconds: true
    }).replace(/^about /, '~');
}

/**
 * Combines absolute and relative time for comprehensive display.
 * Format: "Jan 15, 2:30 pm (~5 minutes ago)"
 */
export function formatTimeWithRelative(dateInput: string | Date | undefined | null, fallback = 'Invalid time'): string {
    const date = parseDate(dateInput);
    if (!date) return fallback;

    const timeStr = formatDateDisplay(date);
    const relativeTime = formatRelativeTime(date);
    return `${timeStr} (${relativeTime})`;
}

/**
 * Formats snooze time with emoji and relative time.
 * Format: "⏰ Snoozed until Jan 15, 2:30 pm (~in 5 minutes)"
 */
export function formatSnoozeTime(dateInput: string | Date | undefined | null, fallback = '⏰ Invalid snooze time'): string {
    const date = parseDate(dateInput);
    if (!date) return fallback;

    const timeStr = formatDateDisplay(date);
    const relativeTime = formatRelativeTime(date);
    return `⏰ Snoozed until ${timeStr} (${relativeTime})`;
}

/**
 * Formats a date for datetime-local input fields.
 * Returns empty string if date is invalid.
 */
export function formatForInput(dateInput: string | Date | undefined | null): string {
    const date = parseDate(dateInput);
    if (!date) return '';

    return format(date, DATE_FORMATS.DATETIME_LOCAL);
}

/**
 * Creates a date that is X minutes from now.
 */
export function createDateMinutesFromNow(minutes: number): Date {
    return addMinutes(getNow(), minutes);
}

/**
 * Creates a date that is X hours from now.
 */
export function createDateHoursFromNow(hours: number): Date {
    return addHours(getNow(), hours);
}

/**
 * Creates a date for tomorrow at 9 AM.
 */
export function createTomorrow9AM(): Date {
    return setMinutes(setHours(addDays(getNow(), 1), 9), 0);
}

/**
 * Creates an ISO string for a date that is X minutes from now.
 * Used for snooze functionality.
 */
export function createSnoozeTime(minutes: number): string {
    return createDateMinutesFromNow(minutes).toISOString();
}

/**
 * Checks if a date is in the past.
 */
export function isInPast(dateInput: string | Date | undefined | null): boolean {
    const date = parseDate(dateInput);
    if (!date) return false;

    return isBefore(date, getNow());
}

/**
 * Checks if a date is in the future.
 */
export function isInFuture(dateInput: string | Date | undefined | null): boolean {
    const date = parseDate(dateInput);
    if (!date) return false;

    return isAfter(date, getNow());
}

/**
 * Calculates the difference in milliseconds between two dates.
 * Used for sorting reminders.
 */
export function getTimeDifference(date1: string | Date, date2: string | Date): number {
    const d1 = parseDate(date1);
    const d2 = parseDate(date2);

    if (!d1 || !d2) return 0;

    return differenceInMilliseconds(d1, d2);
}

/**
 * Sorts reminders by datetime (oldest first).
 * Helper function for consistent sorting logic.
 */
export function sortByDatetimeAsc(a: { datetime: string }, b: { datetime: string }): number {
    return getTimeDifference(a.datetime, b.datetime);
}

/**
 * Sorts reminders by datetime (newest first).
 * Helper function for consistent sorting logic.
 */
export function sortByDatetimeDesc(a: { datetime: string }, b: { datetime: string }): number {
    return getTimeDifference(b.datetime, a.datetime);
}

/**
 * Sorts reminders by completion time (newest completion first).
 * Falls back to datetime if completion time is not available.
 */
export function sortByCompletionTime(a: { datetime: string; completedAt?: string }, b: { datetime: string; completedAt?: string }): number {
    const aTime = a.completedAt || a.datetime;
    const bTime = b.completedAt || b.datetime;
    return getTimeDifference(bTime, aTime);
}
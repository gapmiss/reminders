/**
 * Shared constants for the Obsidian Reminders Plugin
 *
 * This file centralizes all magic numbers, timing values, CSS classes,
 * and other constants to improve maintainability and prevent duplication.
 */

/**
 * Scheduler timing configuration constants
 */
export const SCHEDULER_CONFIG = {
    /** Fast check interval when reminders are due soon (milliseconds) */
    FAST_CHECK_INTERVAL: 5000,
    /** Slow check interval when no urgent reminders (milliseconds) */
    SLOW_CHECK_INTERVAL: 30000,
    /** Minutes ahead to consider a reminder "upcoming" */
    UPCOMING_THRESHOLD_MINUTES: 5,
    /** Seconds before due time to trigger notification */
    TRIGGER_THRESHOLD_SECONDS: 30
} as const;

/**
 * UI timing and animation constants
 */
export const UI_CONFIG = {
    /** Delay for spinner animation (milliseconds) */
    SPINNER_DELAY: 600,
    /** Delay before focusing elements (milliseconds) */
    FOCUS_DELAY: 100,
    /** Default hours ahead for new reminders */
    DEFAULT_HOURS_AHEAD: 1,
    /** Time update interval for relative time displays (milliseconds) */
    TIME_UPDATE_INTERVAL: 5000,
    /** Minutes in 24 hours (for snooze calculations) */
    MINUTES_IN_DAY: 24 * 60,
    /** Debounce delay for rendering operations (milliseconds) */
    RENDER_DEBOUNCE_DELAY: 100,
    /** Maximum debounce delay before forcing render (milliseconds) */
    MAX_RENDER_DELAY: 500
} as const;

/**
 * Icon names used throughout the plugin
 */
export const ICONS = {
    /** Main plugin bell icon */
    BELL: 'concierge-bell',
    /** Bell off icon for snoozed items */
    BELL_OFF: 'bell-off',
    /** Check circle for completed items */
    CHECK_CIRCLE: 'check-circle',
    /** Hourglass for pending items */
    HOURGLASS: 'hourglass',
    /** Arrow up right for upcoming items */
    ARROW_UP_RIGHT: 'arrow-up-right',
    /** Filter icon for all items */
    FILTER: 'filter',
    /** List icon for viewing reminders */
    LIST: 'list',
    /** Pencil icon for editing */
    PENCIL: 'pencil',
    /** Trash icon for deleting */
    TRASH: 'trash',
    /** Clock plus icon for snoozing */
    ALARM_CLOCK_PLUS: 'alarm-clock-plus',
    /** Refresh icon */
    REFRESH: 'refresh-cw'
} as const;

/**
 * CSS class names for consistent styling
 */
export const CSS_CLASSES = {
    /** Main sidebar container */
    SIDEBAR: 'reminder-sidebar',
    /** Sidebar header */
    SIDEBAR_HEADER: 'reminder-sidebar-header',
    /** Header icon */
    HEADER_ICON: 'header-icon',
    /** Header heading */
    HEADER_HEADING: 'header-heading',
    /** Actions container */
    ACTIONS: 'reminder-actions',
    /** Refresh button */
    REFRESH_BUTTON: 'refresh-button',
    /** Refresh spinner overlay */
    REFRESH_SPINNER: 'refresh-spinner',
    /** Filter tabs container */
    FILTER_TABS: 'reminder-filter-tabs',
    /** Individual filter tab */
    FILTER_TAB: 'filter-tab',
    /** Filter icon */
    FILTER_ICON: 'filter-icon',
    /** Filter label */
    FILTER_LABEL: 'filter-label',
    /** Statistics container */
    STATS: 'reminder-stats',
    /** Reminder list container */
    REMINDER_LIST: 'reminder-list',
    /** Individual reminder item */
    REMINDER_ITEM: 'reminder-item',
    /** Reminder content */
    REMINDER_CONTENT: 'reminder-content',
    /** Reminder metadata */
    REMINDER_META: 'reminder-meta',
    /** Reminder message */
    REMINDER_MESSAGE: 'reminder-message',
    /** Time span element */
    TIME_SPAN: 'time-span',
    /** Snoozed reminder styling */
    REMINDER_SNOOZED: 'reminder-snoozed',
    /** Empty state message */
    EMPTY_STATE: 'reminder-empty-state',
    /** Modal container */
    MODAL: 'reminder-modal',
    /** Modal buttons container */
    MODAL_BUTTONS: 'reminder-modal-buttons',
    /** Textarea styling */
    TEXTAREA: 'reminder-textarea',
    /** Quick time buttons */
    QUICK_TIME_BUTTONS: 'quick-time-buttons',
    /** Spinner icon */
    SPINNER_ICON: 'spinner-icon'
} as const;

/**
 * Filter configuration for sidebar tabs
 */
export const FILTER_CONFIG = [
    { key: 'pending', label: 'Pending', icon: ICONS.HOURGLASS },
    { key: 'upcoming', label: 'Upcoming', icon: ICONS.ARROW_UP_RIGHT },
    { key: 'snoozed', label: 'Snoozed', icon: ICONS.BELL_OFF },
    { key: 'completed', label: 'Done', icon: ICONS.CHECK_CIRCLE },
    { key: 'all', label: 'All', icon: ICONS.FILTER }
] as const;

/**
 * Statistics configuration for sidebar display
 */
export const STATS_CONFIG = [
    {
        label: 'Overdue',
        key: 'overdue',
        getClass: (stats: any) => `overdue${stats.overdue > 0 ? ' warning' : ''}`
    },
    {
        label: 'Snoozed',
        key: 'snoozed',
        getClass: () => 'snoozed'
    },
    {
        label: 'Today',
        key: 'upcoming24h',
        getClass: () => 'today'
    },
    {
        label: 'Total',
        key: 'total',
        getClass: () => 'total'
    }
] as const;

/**
 * Default snooze preset options
 */
export const DEFAULT_SNOOZE_PRESETS = [
    { label: '1 minute', minutes: 1 },
    { label: '5 minutes', minutes: 5 },
    { label: '10 minutes', minutes: 10 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '2 hours', minutes: 2 * 60 },
    { label: '4 hours', minutes: 4 * 60 },
    { label: '8 hours', minutes: 8 * 60 },
    { label: '24 hours', minutes: UI_CONFIG.MINUTES_IN_DAY }
] as const;

/**
 * Quick time presets for reminder creation
 * All presets use minutes for consistency
 */
export const QUICK_TIME_PRESETS = [
    { label: '15 mins', minutes: 15 },
    { label: '30 mins', minutes: 30 },
    { label: '1 hr', minutes: 60 },
    { label: '4 hrs', minutes: 4 * 60 }
] as const;

/**
 * Date format strings
 */
export const DATE_FORMATS = {
    /** Format for datetime-local inputs */
    DATETIME_LOCAL: 'yyyy-MM-dd\'T\'HH:mm',
    /** Short format for time display */
    TIME_SHORT: 'MMM d, h:mm a',
    /** Long format with year */
    TIME_LONG: 'MMM d, yyyy h:mm a'
} as const;

/**
 * SVG constants for spinner animation
 */
export const SVG_CONFIG = {
    /** SVG namespace URL */
    NAMESPACE: 'http://www.w3.org/2000/svg',
    /** Spinner circle radius */
    CIRCLE_RADIUS: '10',
    /** Spinner stroke width */
    STROKE_WIDTH: '4',
    /** Spinner dash array for animation */
    DASH_ARRAY: '31.416',
    /** Spinner dash offset for animation */
    DASH_OFFSET: '31.416'
} as const;

/**
 * Priority icons and colors
 */
export const PRIORITY_CONFIG = {
    low: { icon: '🔵', label: 'Low' },
    normal: { icon: '⚪', label: 'Normal' },
    high: { icon: '🟡', label: 'High' },
    urgent: { icon: '🔴', label: 'Urgent' }
} as const;
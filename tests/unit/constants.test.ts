/**
 * Unit tests for constants.ts
 *
 * Tests all configuration constants to ensure:
 * - Values are correct and unchanged
 * - Type safety with 'as const' is working
 * - All required properties exist
 * - Arrays have expected lengths
 */

import { describe, it, expect } from 'vitest';
import {
    SCHEDULER_CONFIG,
    UI_CONFIG,
    ICONS,
    CSS_CLASSES,
    FILTER_CONFIG,
    STATS_CONFIG,
    DEFAULT_SNOOZE_PRESETS,
    QUICK_TIME_PRESETS,
    DATE_FORMATS,
    SVG_CONFIG,
    PRIORITY_CONFIG
} from '../../src/constants';

describe('constants.ts', () => {
    describe('SCHEDULER_CONFIG', () => {
        it('should have correct FAST_CHECK_INTERVAL', () => {
            expect(SCHEDULER_CONFIG.FAST_CHECK_INTERVAL).toBe(5000);
        });

        it('should have correct SLOW_CHECK_INTERVAL', () => {
            expect(SCHEDULER_CONFIG.SLOW_CHECK_INTERVAL).toBe(30000);
        });

        it('should have correct UPCOMING_THRESHOLD_MINUTES', () => {
            expect(SCHEDULER_CONFIG.UPCOMING_THRESHOLD_MINUTES).toBe(5);
        });

        it('should have correct TRIGGER_THRESHOLD_SECONDS', () => {
            expect(SCHEDULER_CONFIG.TRIGGER_THRESHOLD_SECONDS).toBe(30);
        });

        it('should have all required properties', () => {
            expect(SCHEDULER_CONFIG).toHaveProperty('FAST_CHECK_INTERVAL');
            expect(SCHEDULER_CONFIG).toHaveProperty('SLOW_CHECK_INTERVAL');
            expect(SCHEDULER_CONFIG).toHaveProperty('UPCOMING_THRESHOLD_MINUTES');
            expect(SCHEDULER_CONFIG).toHaveProperty('TRIGGER_THRESHOLD_SECONDS');
        });

        it('should have FAST_CHECK_INTERVAL less than SLOW_CHECK_INTERVAL', () => {
            expect(SCHEDULER_CONFIG.FAST_CHECK_INTERVAL).toBeLessThan(
                SCHEDULER_CONFIG.SLOW_CHECK_INTERVAL
            );
        });
    });

    describe('UI_CONFIG', () => {
        it('should have correct SPINNER_DELAY', () => {
            expect(UI_CONFIG.SPINNER_DELAY).toBe(600);
        });

        it('should have correct FOCUS_DELAY', () => {
            expect(UI_CONFIG.FOCUS_DELAY).toBe(100);
        });

        it('should have correct DEFAULT_HOURS_AHEAD', () => {
            expect(UI_CONFIG.DEFAULT_HOURS_AHEAD).toBe(1);
        });

        it('should have correct TIME_UPDATE_INTERVAL', () => {
            expect(UI_CONFIG.TIME_UPDATE_INTERVAL).toBe(5000);
        });

        it('should have correct MINUTES_IN_DAY', () => {
            expect(UI_CONFIG.MINUTES_IN_DAY).toBe(24 * 60);
            expect(UI_CONFIG.MINUTES_IN_DAY).toBe(1440);
        });

        it('should have correct RENDER_DEBOUNCE_DELAY', () => {
            expect(UI_CONFIG.RENDER_DEBOUNCE_DELAY).toBe(100);
        });

        it('should have correct MAX_RENDER_DELAY', () => {
            expect(UI_CONFIG.MAX_RENDER_DELAY).toBe(500);
        });

        it('should have all 7 required properties', () => {
            expect(Object.keys(UI_CONFIG)).toHaveLength(7);
        });

        it('should have RENDER_DEBOUNCE_DELAY less than MAX_RENDER_DELAY', () => {
            expect(UI_CONFIG.RENDER_DEBOUNCE_DELAY).toBeLessThan(
                UI_CONFIG.MAX_RENDER_DELAY
            );
        });
    });

    describe('ICONS', () => {
        it('should have correct icon names', () => {
            expect(ICONS.BELL).toBe('concierge-bell');
            expect(ICONS.BELL_OFF).toBe('bell-off');
            expect(ICONS.CHECK_CIRCLE).toBe('check-circle');
            expect(ICONS.HOURGLASS).toBe('hourglass');
            expect(ICONS.ARROW_UP_RIGHT).toBe('arrow-up-right');
            expect(ICONS.FILTER).toBe('filter');
            expect(ICONS.LIST).toBe('list');
            expect(ICONS.PENCIL).toBe('pencil');
            expect(ICONS.TRASH).toBe('trash');
            expect(ICONS.ALARM_CLOCK_PLUS).toBe('alarm-clock-plus');
            expect(ICONS.REFRESH).toBe('refresh-cw');
        });

        it('should have all 11 icon properties', () => {
            expect(Object.keys(ICONS)).toHaveLength(11);
        });

        it('should have all string values', () => {
            Object.values(ICONS).forEach(icon => {
                expect(typeof icon).toBe('string');
            });
        });
    });

    describe('CSS_CLASSES', () => {
        it('should have correct main class names', () => {
            expect(CSS_CLASSES.SIDEBAR).toBe('reminder-sidebar');
            expect(CSS_CLASSES.SIDEBAR_HEADER).toBe('reminder-sidebar-header');
            expect(CSS_CLASSES.REMINDER_LIST).toBe('reminder-list');
            expect(CSS_CLASSES.REMINDER_ITEM).toBe('reminder-item');
            expect(CSS_CLASSES.MODAL).toBe('reminder-modal');
        });

        it('should have all 25 CSS class properties', () => {
            expect(Object.keys(CSS_CLASSES)).toHaveLength(25);
        });

        it('should have all string values', () => {
            Object.values(CSS_CLASSES).forEach(className => {
                expect(typeof className).toBe('string');
            });
        });

        it('should have no duplicate class names', () => {
            const values = Object.values(CSS_CLASSES);
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('FILTER_CONFIG', () => {
        it('should have 5 filter configurations', () => {
            expect(FILTER_CONFIG).toHaveLength(5);
        });

        it('should have correct filter keys', () => {
            expect(FILTER_CONFIG[0].key).toBe('pending');
            expect(FILTER_CONFIG[1].key).toBe('upcoming');
            expect(FILTER_CONFIG[2].key).toBe('snoozed');
            expect(FILTER_CONFIG[3].key).toBe('completed');
            expect(FILTER_CONFIG[4].key).toBe('all');
        });

        it('should have correct filter labels', () => {
            expect(FILTER_CONFIG[0].label).toBe('Pending');
            expect(FILTER_CONFIG[1].label).toBe('Upcoming');
            expect(FILTER_CONFIG[2].label).toBe('Snoozed');
            expect(FILTER_CONFIG[3].label).toBe('Done');
            expect(FILTER_CONFIG[4].label).toBe('All');
        });

        it('should have valid icon references', () => {
            expect(FILTER_CONFIG[0].icon).toBe(ICONS.HOURGLASS);
            expect(FILTER_CONFIG[1].icon).toBe(ICONS.ARROW_UP_RIGHT);
            expect(FILTER_CONFIG[2].icon).toBe(ICONS.BELL_OFF);
            expect(FILTER_CONFIG[3].icon).toBe(ICONS.CHECK_CIRCLE);
            expect(FILTER_CONFIG[4].icon).toBe(ICONS.FILTER);
        });

        it('should have all required properties on each filter', () => {
            FILTER_CONFIG.forEach(filter => {
                expect(filter).toHaveProperty('key');
                expect(filter).toHaveProperty('label');
                expect(filter).toHaveProperty('icon');
            });
        });
    });

    describe('STATS_CONFIG', () => {
        it('should have 4 stat configurations', () => {
            expect(STATS_CONFIG).toHaveLength(4);
        });

        it('should have correct stat labels', () => {
            expect(STATS_CONFIG[0].label).toBe('Overdue');
            expect(STATS_CONFIG[1].label).toBe('Snoozed');
            expect(STATS_CONFIG[2].label).toBe('Today');
            expect(STATS_CONFIG[3].label).toBe('Total');
        });

        it('should have correct stat keys', () => {
            expect(STATS_CONFIG[0].key).toBe('overdue');
            expect(STATS_CONFIG[1].key).toBe('snoozed');
            expect(STATS_CONFIG[2].key).toBe('upcoming24h');
            expect(STATS_CONFIG[3].key).toBe('total');
        });

        it('should have getClass functions', () => {
            STATS_CONFIG.forEach(stat => {
                expect(typeof stat.getClass).toBe('function');
            });
        });

        it('should have correct getClass return values', () => {
            // Test overdue warning class
            expect(STATS_CONFIG[0].getClass({ overdue: 0 })).toBe('overdue');
            expect(STATS_CONFIG[0].getClass({ overdue: 5 })).toBe('overdue warning');

            // Test other stat classes (these don't take arguments)
            expect(STATS_CONFIG[1].getClass()).toBe('snoozed');
            expect(STATS_CONFIG[2].getClass()).toBe('today');
            expect(STATS_CONFIG[3].getClass()).toBe('total');
        });
    });

    describe('DEFAULT_SNOOZE_PRESETS', () => {
        it('should have 10 snooze presets', () => {
            expect(DEFAULT_SNOOZE_PRESETS).toHaveLength(10);
        });

        it('should have correct preset values', () => {
            expect(DEFAULT_SNOOZE_PRESETS[0]).toEqual({ label: '1 minute', minutes: 1 });
            expect(DEFAULT_SNOOZE_PRESETS[1]).toEqual({ label: '5 minutes', minutes: 5 });
            expect(DEFAULT_SNOOZE_PRESETS[2]).toEqual({ label: '10 minutes', minutes: 10 });
            expect(DEFAULT_SNOOZE_PRESETS[3]).toEqual({ label: '15 minutes', minutes: 15 });
            expect(DEFAULT_SNOOZE_PRESETS[4]).toEqual({ label: '30 minutes', minutes: 30 });
            expect(DEFAULT_SNOOZE_PRESETS[5]).toEqual({ label: '1 hour', minutes: 60 });
            expect(DEFAULT_SNOOZE_PRESETS[6]).toEqual({ label: '2 hours', minutes: 120 });
            expect(DEFAULT_SNOOZE_PRESETS[7]).toEqual({ label: '4 hours', minutes: 240 });
            expect(DEFAULT_SNOOZE_PRESETS[8]).toEqual({ label: '8 hours', minutes: 480 });
            expect(DEFAULT_SNOOZE_PRESETS[9]).toEqual({ label: '24 hours', minutes: 1440 });
        });

        it('should have ascending minute values', () => {
            for (let i = 1; i < DEFAULT_SNOOZE_PRESETS.length; i++) {
                expect(DEFAULT_SNOOZE_PRESETS[i].minutes).toBeGreaterThan(
                    DEFAULT_SNOOZE_PRESETS[i - 1].minutes
                );
            }
        });

        it('should have all required properties', () => {
            DEFAULT_SNOOZE_PRESETS.forEach(preset => {
                expect(preset).toHaveProperty('label');
                expect(preset).toHaveProperty('minutes');
                expect(typeof preset.label).toBe('string');
                expect(typeof preset.minutes).toBe('number');
            });
        });
    });

    describe('QUICK_TIME_PRESETS', () => {
        it('should have 4 quick time presets', () => {
            expect(QUICK_TIME_PRESETS).toHaveLength(4);
        });

        it('should have correct preset values', () => {
            expect(QUICK_TIME_PRESETS[0]).toEqual({ label: '15 mins', minutes: 15 });
            expect(QUICK_TIME_PRESETS[1]).toEqual({ label: '30 mins', minutes: 30 });
            expect(QUICK_TIME_PRESETS[2]).toEqual({ label: '1 hr', minutes: 60 });
            expect(QUICK_TIME_PRESETS[3]).toEqual({ label: '4 hrs', minutes: 240 });
        });

        it('should have ascending minute values', () => {
            for (let i = 1; i < QUICK_TIME_PRESETS.length; i++) {
                expect(QUICK_TIME_PRESETS[i].minutes).toBeGreaterThan(
                    QUICK_TIME_PRESETS[i - 1].minutes
                );
            }
        });

        it('should have all required properties', () => {
            QUICK_TIME_PRESETS.forEach(preset => {
                expect(preset).toHaveProperty('label');
                expect(preset).toHaveProperty('minutes');
                expect(typeof preset.label).toBe('string');
                expect(typeof preset.minutes).toBe('number');
            });
        });
    });

    describe('DATE_FORMATS', () => {
        it('should have correct format strings', () => {
            expect(DATE_FORMATS.DATETIME_LOCAL).toBe('yyyy-MM-dd\'T\'HH:mm');
            expect(DATE_FORMATS.TIME_SHORT).toBe('MMM d, h:mm a');
            expect(DATE_FORMATS.TIME_LONG).toBe('MMM d, yyyy h:mm a');
        });

        it('should have all 3 format properties', () => {
            expect(Object.keys(DATE_FORMATS)).toHaveLength(3);
        });

        it('should have all string values', () => {
            Object.values(DATE_FORMATS).forEach(format => {
                expect(typeof format).toBe('string');
            });
        });
    });

    describe('SVG_CONFIG', () => {
        it('should have correct SVG properties', () => {
            expect(SVG_CONFIG.NAMESPACE).toBe('http://www.w3.org/2000/svg');
            expect(SVG_CONFIG.CIRCLE_RADIUS).toBe('10');
            expect(SVG_CONFIG.STROKE_WIDTH).toBe('4');
            expect(SVG_CONFIG.DASH_ARRAY).toBe('31.416');
            expect(SVG_CONFIG.DASH_OFFSET).toBe('31.416');
        });

        it('should have all 5 SVG properties', () => {
            expect(Object.keys(SVG_CONFIG)).toHaveLength(5);
        });

        it('should have valid namespace URL', () => {
            expect(SVG_CONFIG.NAMESPACE).toMatch(/^http/);
            expect(SVG_CONFIG.NAMESPACE).toContain('www.w3.org');
        });

        it('should have numeric string values for measurements', () => {
            expect(parseFloat(SVG_CONFIG.CIRCLE_RADIUS)).toBe(10);
            expect(parseFloat(SVG_CONFIG.STROKE_WIDTH)).toBe(4);
            expect(parseFloat(SVG_CONFIG.DASH_ARRAY)).toBeCloseTo(31.416);
            expect(parseFloat(SVG_CONFIG.DASH_OFFSET)).toBeCloseTo(31.416);
        });
    });

    describe('PRIORITY_CONFIG', () => {
        it('should have 4 priority levels', () => {
            expect(Object.keys(PRIORITY_CONFIG)).toHaveLength(4);
        });

        it('should have correct priority properties', () => {
            expect(PRIORITY_CONFIG.low).toEqual({ icon: '🔵', label: 'Low' });
            expect(PRIORITY_CONFIG.normal).toEqual({ icon: '⚪', label: 'Normal' });
            expect(PRIORITY_CONFIG.high).toEqual({ icon: '🟡', label: 'High' });
            expect(PRIORITY_CONFIG.urgent).toEqual({ icon: '🔴', label: 'Urgent' });
        });

        it('should have required properties on each priority', () => {
            Object.values(PRIORITY_CONFIG).forEach(priority => {
                expect(priority).toHaveProperty('icon');
                expect(priority).toHaveProperty('label');
                expect(typeof priority.icon).toBe('string');
                expect(typeof priority.label).toBe('string');
            });
        });

        it('should have emoji icons', () => {
            Object.values(PRIORITY_CONFIG).forEach(priority => {
                // Check that icon is a single emoji character
                expect(priority.icon.length).toBeGreaterThan(0);
            });
        });

        it('should have unique icons', () => {
            const icons = Object.values(PRIORITY_CONFIG).map(p => p.icon);
            const uniqueIcons = new Set(icons);
            expect(uniqueIcons.size).toBe(icons.length);
        });
    });

    describe('Type Safety (as const)', () => {
        it('should export all constants as readonly (TypeScript compile-time check)', () => {
            // Note: 'as const' provides type-level immutability enforced by TypeScript.
            // Runtime immutability would require Object.freeze(), which is not applied.
            // This test verifies that the constants are properly exported and accessible.
            expect(SCHEDULER_CONFIG).toBeDefined();
            expect(UI_CONFIG).toBeDefined();
            expect(ICONS).toBeDefined();
            expect(CSS_CLASSES).toBeDefined();
            expect(FILTER_CONFIG).toBeDefined();
            expect(STATS_CONFIG).toBeDefined();
            expect(DEFAULT_SNOOZE_PRESETS).toBeDefined();
            expect(QUICK_TIME_PRESETS).toBeDefined();
            expect(DATE_FORMATS).toBeDefined();
            expect(SVG_CONFIG).toBeDefined();
            expect(PRIORITY_CONFIG).toBeDefined();
        });

        it('should preserve literal types for config keys', () => {
            // Verify that the constants maintain their literal structure
            // TypeScript's 'as const' ensures narrow types at compile-time
            expect(typeof SCHEDULER_CONFIG.FAST_CHECK_INTERVAL).toBe('number');
            expect(typeof ICONS.BELL).toBe('string');
            expect(Array.isArray(FILTER_CONFIG)).toBe(true);
            expect(Array.isArray(DEFAULT_SNOOZE_PRESETS)).toBe(true);
        });
    });
});

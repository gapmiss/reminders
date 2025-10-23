/**
 * Unit tests for dateUtils.ts
 * These are critical tests since date parsing bugs cause the most issues
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  getNow,
  getNowISO,
  parseDate,
  isValidDate,
  formatDateDisplay,
  formatDateDisplayLong,
  formatRelativeTime,
  formatTimeWithRelative,
  formatSnoozeTime,
  formatForInput,
  createDateMinutesFromNow,
  createDateHoursFromNow,
  createTomorrow9AM,
  createSnoozeTime,
  isInPast,
  isInFuture,
  getTimeDifference,
  sortByDatetimeAsc,
  sortByDatetimeDesc,
  sortByCompletionTime,
} from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('getNow and getNowISO', () => {
    test('getNow returns a Date object', () => {
      const now = getNow();
      expect(now).toBeInstanceOf(Date);
      expect(isNaN(now.getTime())).toBe(false);
    });

    test('getNowISO returns an ISO string', () => {
      const nowISO = getNowISO();
      expect(typeof nowISO).toBe('string');
      expect(nowISO).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(nowISO).toISOString()).toBe(nowISO);
    });
  });

  describe('parseDate', () => {
    test('parses valid ISO date string', () => {
      const isoDate = '2025-10-23T12:00:00.000Z';
      const parsed = parseDate(isoDate);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe(isoDate);
    });

    test('parses Date object', () => {
      const date = new Date('2025-10-23T12:00:00.000Z');
      const parsed = parseDate(date);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getTime()).toBe(date.getTime());
    });

    test('returns null for invalid inputs', () => {
      expect(parseDate(null)).toBe(null);
      expect(parseDate(undefined)).toBe(null);
      expect(parseDate('invalid-date')).toBe(null);
      expect(parseDate('not a date')).toBe(null);
      expect(parseDate('')).toBe(null);
    });

    test('handles edge case dates', () => {
      // Very old date
      const oldDate = '1900-01-01T00:00:00.000Z';
      expect(parseDate(oldDate)).toBeInstanceOf(Date);

      // Far future date
      const futureDate = '2099-12-31T23:59:59.999Z';
      expect(parseDate(futureDate)).toBeInstanceOf(Date);
    });
  });

  describe('isValidDate', () => {
    test('returns true for valid dates', () => {
      expect(isValidDate('2025-10-23T12:00:00.000Z')).toBe(true);
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2025-01-01'))).toBe(true);
    });

    test('returns false for invalid dates', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
    });
  });

  describe('formatDateDisplay', () => {
    test('formats valid date correctly', () => {
      const date = '2025-10-23T14:30:00.000Z';
      const formatted = formatDateDisplay(date);
      expect(typeof formatted).toBe('string');
      expect(formatted).not.toBe('Invalid date');
      // Should contain date components (exact format may vary by locale)
      expect(formatted.length).toBeGreaterThan(0);
    });

    test('returns fallback for invalid dates', () => {
      expect(formatDateDisplay(null)).toBe('Invalid date');
      expect(formatDateDisplay(undefined)).toBe('Invalid date');
      expect(formatDateDisplay('invalid')).toBe('Invalid date');
    });

    test('accepts custom fallback text', () => {
      expect(formatDateDisplay(null, 'No date')).toBe('No date');
      expect(formatDateDisplay(undefined, 'N/A')).toBe('N/A');
    });
  });

  describe('formatDateDisplayLong', () => {
    test('formats valid date with year', () => {
      const date = '2025-10-23T14:30:00.000Z';
      const formatted = formatDateDisplayLong(date);
      expect(typeof formatted).toBe('string');
      expect(formatted).not.toBe('Invalid date');
      // Should contain year
      expect(formatted).toContain('2025');
    });

    test('returns fallback for invalid dates', () => {
      expect(formatDateDisplayLong(null)).toBe('Invalid date');
      expect(formatDateDisplayLong('invalid', 'Bad date')).toBe('Bad date');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current time for consistent testing
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('formats past dates correctly', () => {
      const fiveMinutesAgo = new Date('2025-10-23T11:55:00.000Z').toISOString();
      const formatted = formatRelativeTime(fiveMinutesAgo);
      expect(formatted).toContain('ago');
      expect(formatted).toContain('5 minutes');
    });

    test('formats future dates correctly', () => {
      const inOneHour = new Date('2025-10-23T13:00:00.000Z').toISOString();
      const formatted = formatRelativeTime(inOneHour);
      expect(formatted).toContain('in');
      expect(formatted).toContain('hour');
    });

    test('includes suffix and formats time correctly', () => {
      const date = new Date('2025-10-23T11:30:00.000Z').toISOString();
      const formatted = formatRelativeTime(date);
      // Should include "ago" for past dates
      expect(formatted).toContain('ago');
      // Should have replaced "about" with "~" if it was present
      expect(formatted).not.toContain('about');
      // Should contain time information
      expect(formatted).toContain('minutes');
    });

    test('returns fallback for invalid dates', () => {
      expect(formatRelativeTime(null)).toBe('Invalid time');
      expect(formatRelativeTime(undefined, 'Bad time')).toBe('Bad time');
    });
  });

  describe('formatTimeWithRelative', () => {
    test('combines absolute and relative time', () => {
      const date = new Date().toISOString();
      const formatted = formatTimeWithRelative(date);
      expect(formatted).toContain('(');
      expect(formatted).toContain(')');
      // Should contain both absolute and relative parts
      expect(formatted.split('(').length).toBe(2);
    });

    test('returns fallback for invalid dates', () => {
      expect(formatTimeWithRelative(null)).toBe('Invalid time');
    });
  });

  describe('formatSnoozeTime', () => {
    test('formats snooze time with emoji', () => {
      const date = new Date().toISOString();
      const formatted = formatSnoozeTime(date);
      expect(formatted).toContain('⏰');
      expect(formatted).toContain('Snoozed until');
      expect(formatted).toContain('(');
      expect(formatted).toContain(')');
    });

    test('returns fallback for invalid dates', () => {
      expect(formatSnoozeTime(null)).toBe('⏰ Invalid snooze time');
    });
  });

  describe('formatForInput', () => {
    test('formats date for datetime-local input', () => {
      const date = '2025-10-23T14:30:00.000Z';
      const formatted = formatForInput(date);
      expect(typeof formatted).toBe('string');
      // Should be in format: YYYY-MM-DDTHH:MM
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });

    test('returns empty string for invalid dates', () => {
      expect(formatForInput(null)).toBe('');
      expect(formatForInput(undefined)).toBe('');
      expect(formatForInput('invalid')).toBe('');
    });
  });

  describe('createDateMinutesFromNow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('creates date X minutes from now', () => {
      const result = createDateMinutesFromNow(15);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-23T12:15:00.000Z');
    });

    test('handles negative minutes (past dates)', () => {
      const result = createDateMinutesFromNow(-30);
      expect(result.toISOString()).toBe('2025-10-23T11:30:00.000Z');
    });
  });

  describe('createDateHoursFromNow', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('creates date X hours from now', () => {
      const result = createDateHoursFromNow(4);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2025-10-23T16:00:00.000Z');
    });
  });

  describe('createTomorrow9AM', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T15:30:00.000Z'));
    });

    test('creates tomorrow at 9 AM', () => {
      const result = createTomorrow9AM();
      expect(result).toBeInstanceOf(Date);
      expect(result.getHours()).toBe(9);
      expect(result.getMinutes()).toBe(0);
      expect(result.getDate()).toBe(24); // Tomorrow (23 + 1)
    });
  });

  describe('createSnoozeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('creates ISO string for snooze duration', () => {
      const result = createSnoozeTime(30);
      expect(typeof result).toBe('string');
      expect(result).toBe('2025-10-23T12:30:00.000Z');
    });
  });

  describe('isInPast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('returns true for past dates', () => {
      expect(isInPast('2025-10-23T11:00:00.000Z')).toBe(true);
      expect(isInPast('2020-01-01T00:00:00.000Z')).toBe(true);
    });

    test('returns false for future dates', () => {
      expect(isInPast('2025-10-23T13:00:00.000Z')).toBe(false);
      expect(isInPast('2099-12-31T23:59:59.999Z')).toBe(false);
    });

    test('returns false for invalid dates', () => {
      expect(isInPast(null)).toBe(false);
      expect(isInPast(undefined)).toBe(false);
      expect(isInPast('invalid')).toBe(false);
    });
  });

  describe('isInFuture', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('returns true for future dates', () => {
      expect(isInFuture('2025-10-23T13:00:00.000Z')).toBe(true);
      expect(isInFuture('2099-12-31T23:59:59.999Z')).toBe(true);
    });

    test('returns false for past dates', () => {
      expect(isInFuture('2025-10-23T11:00:00.000Z')).toBe(false);
      expect(isInFuture('2020-01-01T00:00:00.000Z')).toBe(false);
    });

    test('returns false for invalid dates', () => {
      expect(isInFuture(null)).toBe(false);
      expect(isInFuture(undefined)).toBe(false);
    });
  });

  describe('getTimeDifference', () => {
    test('calculates difference in milliseconds', () => {
      const date1 = '2025-10-23T12:00:00.000Z';
      const date2 = '2025-10-23T11:00:00.000Z';
      const diff = getTimeDifference(date1, date2);
      expect(diff).toBe(3600000); // 1 hour in ms
    });

    test('handles negative differences', () => {
      const date1 = '2025-10-23T11:00:00.000Z';
      const date2 = '2025-10-23T12:00:00.000Z';
      const diff = getTimeDifference(date1, date2);
      expect(diff).toBe(-3600000);
    });

    test('returns 0 for invalid dates', () => {
      expect(getTimeDifference('invalid', '2025-10-23T12:00:00.000Z')).toBe(0);
      expect(getTimeDifference('2025-10-23T12:00:00.000Z', 'invalid')).toBe(0);
    });
  });

  describe('sorting functions', () => {
    const reminders = [
      { datetime: '2025-10-23T14:00:00.000Z', completedAt: '2025-10-23T14:30:00.000Z' },
      { datetime: '2025-10-23T12:00:00.000Z', completedAt: '2025-10-23T12:30:00.000Z' },
      { datetime: '2025-10-23T13:00:00.000Z', completedAt: '2025-10-23T13:30:00.000Z' },
    ];

    describe('sortByDatetimeAsc', () => {
      test('sorts reminders by datetime ascending (oldest first)', () => {
        const sorted = [...reminders].sort(sortByDatetimeAsc);
        expect(sorted[0].datetime).toBe('2025-10-23T12:00:00.000Z');
        expect(sorted[1].datetime).toBe('2025-10-23T13:00:00.000Z');
        expect(sorted[2].datetime).toBe('2025-10-23T14:00:00.000Z');
      });
    });

    describe('sortByDatetimeDesc', () => {
      test('sorts reminders by datetime descending (newest first)', () => {
        const sorted = [...reminders].sort(sortByDatetimeDesc);
        expect(sorted[0].datetime).toBe('2025-10-23T14:00:00.000Z');
        expect(sorted[1].datetime).toBe('2025-10-23T13:00:00.000Z');
        expect(sorted[2].datetime).toBe('2025-10-23T12:00:00.000Z');
      });
    });

    describe('sortByCompletionTime', () => {
      test('sorts by completion time when available', () => {
        const sorted = [...reminders].sort(sortByCompletionTime);
        expect(sorted[0].completedAt).toBe('2025-10-23T14:30:00.000Z');
        expect(sorted[1].completedAt).toBe('2025-10-23T13:30:00.000Z');
        expect(sorted[2].completedAt).toBe('2025-10-23T12:30:00.000Z');
      });

      test('falls back to datetime when completedAt missing', () => {
        const mixed = [
          { datetime: '2025-10-23T14:00:00.000Z' },
          { datetime: '2025-10-23T12:00:00.000Z', completedAt: '2025-10-23T15:00:00.000Z' },
        ];
        const sorted = [...mixed].sort(sortByCompletionTime);
        expect(sorted[0].completedAt || sorted[0].datetime).toBe('2025-10-23T15:00:00.000Z');
        expect(sorted[1].completedAt || sorted[1].datetime).toBe('2025-10-23T14:00:00.000Z');
      });
    });
  });
});

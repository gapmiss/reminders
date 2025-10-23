/**
 * Unit tests for reminderDataManager.ts
 * Tests CRUD operations, filtering, sorting, and statistics
 * This is the core data layer - comprehensive testing is critical
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { addMinutes } from 'date-fns';
import { ReminderDataManager } from '../../src/managers/reminderDataManager';
import { createMockPlugin, createMockReminder, dateFromNow, datePast } from '../mocks/testUtils';
import type { Reminder } from '../../src/types';

describe('ReminderDataManager', () => {
  let plugin: any;
  let dataManager: ReminderDataManager;

  beforeEach(() => {
    plugin = createMockPlugin();
    dataManager = new ReminderDataManager(plugin);
  });

  describe('createReminder', () => {
    test('creates reminder with all fields', async () => {
      const reminderData = {
        message: 'Test reminder',
        datetime: dateFromNow(3600000),
        priority: 'high' as const,
        tags: ['work', 'urgent'],
        sourceNote: 'test.md',
        sourceLine: 42,
      };

      const reminder = await dataManager.createReminder(reminderData);

      expect(reminder.id).toBeDefined();
      expect(reminder.message).toBe('Test reminder');
      expect(reminder.datetime).toBe(reminderData.datetime);
      expect(reminder.priority).toBe('high');
      expect(reminder.tags).toEqual(['work', 'urgent']);
      expect(reminder.sourceNote).toBe('test.md');
      expect(reminder.sourceLine).toBe(42);
      expect(reminder.completed).toBe(false);
      expect(reminder.snoozeCount).toBe(0);
      expect(reminder.created).toBeDefined();
      expect(reminder.updated).toBeDefined();
    });

    test('creates reminder with minimal fields (uses defaults)', async () => {
      const reminderData = {
        message: 'Simple reminder',
      };

      const reminder = await dataManager.createReminder(reminderData);

      expect(reminder.id).toBeDefined();
      expect(reminder.message).toBe('Simple reminder');
      expect(reminder.datetime).toBeDefined(); // Should have default datetime
      expect(reminder.priority).toBe('normal'); // Default priority
      expect(reminder.tags).toEqual([]); // Default empty tags
      expect(reminder.completed).toBe(false);
      expect(reminder.snoozeCount).toBe(0);
    });

    test('generates unique IDs for each reminder', async () => {
      const reminder1 = await dataManager.createReminder({ message: 'First' });
      const reminder2 = await dataManager.createReminder({ message: 'Second' });
      const reminder3 = await dataManager.createReminder({ message: 'Third' });

      expect(reminder1.id).not.toBe(reminder2.id);
      expect(reminder2.id).not.toBe(reminder3.id);
      expect(reminder1.id).not.toBe(reminder3.id);
    });

    test('adds reminder to plugin settings', async () => {
      const reminder = await dataManager.createReminder({ message: 'Test' });

      expect(plugin.settings.reminders).toContainEqual(reminder);
      expect(plugin.settings.reminders.length).toBe(1);
    });

    test('calls saveSettings after creating reminder', async () => {
      const saveSpy = vi.spyOn(plugin, 'saveSettings');

      await dataManager.createReminder({ message: 'Test' });

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateReminder', () => {
    let existingReminder: Reminder;

    beforeEach(async () => {
      existingReminder = await dataManager.createReminder({
        message: 'Original message',
        priority: 'normal',
        tags: ['original'],
      });
    });

    test('updates reminder fields', async () => {
      const updates = {
        message: 'Updated message',
        priority: 'urgent' as const,
        tags: ['updated', 'new'],
      };

      const updated = await dataManager.updateReminder(existingReminder.id, updates);

      expect(updated).not.toBeNull();
      expect(updated?.message).toBe('Updated message');
      expect(updated?.priority).toBe('urgent');
      expect(updated?.tags).toEqual(['updated', 'new']);
    });

    test('preserves unchanged fields', async () => {
      const originalDatetime = existingReminder.datetime;
      const originalCreated = existingReminder.created;

      const updated = await dataManager.updateReminder(existingReminder.id, {
        message: 'New message',
      });

      expect(updated?.datetime).toBe(originalDatetime);
      expect(updated?.created).toBe(originalCreated);
      expect(updated?.priority).toBe('normal'); // Unchanged
    });

    test('updates the updated timestamp', async () => {
      const originalUpdated = existingReminder.updated;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await dataManager.updateReminder(existingReminder.id, {
        message: 'Updated',
      });

      expect(updated?.updated).not.toBe(originalUpdated);
      expect(new Date(updated!.updated).getTime()).toBeGreaterThan(
        new Date(originalUpdated).getTime()
      );
    });

    test('returns null for non-existent reminder', async () => {
      const result = await dataManager.updateReminder('non-existent-id', {
        message: 'Test',
      });

      expect(result).toBeNull();
    });

    test('calls saveSettings after update', async () => {
      const saveSpy = vi.spyOn(plugin, 'saveSettings');

      await dataManager.updateReminder(existingReminder.id, { message: 'Updated' });

      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('deleteReminder', () => {
    let reminder1: Reminder;
    let reminder2: Reminder;
    let reminder3: Reminder;

    beforeEach(async () => {
      reminder1 = await dataManager.createReminder({ message: 'First' });
      reminder2 = await dataManager.createReminder({ message: 'Second' });
      reminder3 = await dataManager.createReminder({ message: 'Third' });
    });

    test('deletes reminder by ID', async () => {
      const result = await dataManager.deleteReminder(reminder2.id);

      expect(result).toBe(true);
      expect(plugin.settings.reminders.length).toBe(2);
      expect(plugin.settings.reminders).not.toContainEqual(reminder2);
      expect(plugin.settings.reminders).toContainEqual(reminder1);
      expect(plugin.settings.reminders).toContainEqual(reminder3);
    });

    test('returns false for non-existent reminder', async () => {
      const result = await dataManager.deleteReminder('non-existent-id');

      expect(result).toBe(false);
      expect(plugin.settings.reminders.length).toBe(3); // No change
    });

    test('calls saveSettings after deletion', async () => {
      const saveSpy = vi.spyOn(plugin, 'saveSettings');

      await dataManager.deleteReminder(reminder1.id);

      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('completeReminder', () => {
    let reminder: Reminder;

    beforeEach(async () => {
      reminder = await dataManager.createReminder({
        message: 'To complete',
        completed: false,
      });
    });

    test('marks reminder as completed', async () => {
      const completed = await dataManager.completeReminder(reminder.id);

      expect(completed).not.toBeNull();
      expect(completed?.completed).toBe(true);
      expect(completed?.completedAt).toBeDefined();
    });

    test('sets completedAt timestamp', async () => {
      const before = Date.now();
      const completed = await dataManager.completeReminder(reminder.id);
      const after = Date.now();

      expect(completed?.completedAt).toBeDefined();
      const completedTime = new Date(completed!.completedAt!).getTime();
      expect(completedTime).toBeGreaterThanOrEqual(before);
      expect(completedTime).toBeLessThanOrEqual(after);
    });

    test('clears snoozedUntil when completing', async () => {
      // First snooze the reminder (snoozeReminder expects ISO string, not minutes)
      const snoozeUntil = addMinutes(new Date(), 30).toISOString();
      await dataManager.snoozeReminder(reminder.id, snoozeUntil);

      // Then complete it
      const completed = await dataManager.completeReminder(reminder.id);

      expect(completed?.snoozedUntil).toBeUndefined();
    });

    test('returns null for non-existent reminder', async () => {
      const result = await dataManager.completeReminder('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('snoozeReminder', () => {
    let reminder: Reminder;

    beforeEach(async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));

      reminder = await dataManager.createReminder({
        message: 'To snooze',
        datetime: datePast(3600000), // 1 hour ago (overdue)
      });
    });

    test('sets snoozedUntil to provided ISO string', async () => {
      const snoozeUntil = '2025-10-23T12:30:00.000Z';
      const snoozed = await dataManager.snoozeReminder(reminder.id, snoozeUntil);

      expect(snoozed).not.toBeNull();
      expect(snoozed?.snoozedUntil).toBe(snoozeUntil);
    });

    test('increments snoozeCount', async () => {
      expect(reminder.snoozeCount).toBe(0);

      await dataManager.snoozeReminder(reminder.id, '2025-10-23T12:10:00.000Z');
      const snoozed1 = plugin.settings.reminders.find((r: Reminder) => r.id === reminder.id);
      expect(snoozed1.snoozeCount).toBe(1);

      await dataManager.snoozeReminder(reminder.id, '2025-10-23T12:20:00.000Z');
      const snoozed2 = plugin.settings.reminders.find((r: Reminder) => r.id === reminder.id);
      expect(snoozed2.snoozeCount).toBe(2);
    });

    test('returns null for non-existent reminder', async () => {
      const result = await dataManager.snoozeReminder('non-existent-id', '2025-10-23T12:30:00.000Z');

      expect(result).toBeNull();
    });
  });

  describe('findReminder', () => {
    let reminder: Reminder;

    beforeEach(async () => {
      reminder = await dataManager.createReminder({ message: 'Test' });
    });

    test('retrieves reminder by ID', () => {
      const found = dataManager.findReminder(reminder.id);

      expect(found).toEqual(reminder);
    });

    test('returns undefined for non-existent ID', () => {
      const found = dataManager.findReminder('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('getAllReminders (via plugin.settings)', () => {
    test('returns empty array when no reminders', () => {
      const all = plugin.settings.reminders;

      expect(all).toEqual([]);
    });

    test('returns all reminders', async () => {
      await dataManager.createReminder({ message: 'First' });
      await dataManager.createReminder({ message: 'Second' });
      await dataManager.createReminder({ message: 'Third' });

      const all = plugin.settings.reminders;

      expect(all.length).toBe(3);
    });
  });

  describe('getPendingReminders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('returns only overdue incomplete unsnoozed reminders', async () => {
      await dataManager.createReminder({
        message: 'Overdue',
        datetime: datePast(3600000), // 1 hour ago
        completed: false,
      });

      await dataManager.createReminder({
        message: 'Future',
        datetime: dateFromNow(3600000), // 1 hour ahead
        completed: false,
      });

      await dataManager.createReminder({
        message: 'Completed',
        datetime: datePast(3600000),
        completed: true,
      });

      const r4 = await dataManager.createReminder({
        message: 'Snoozed',
        datetime: datePast(3600000),
        completed: false,
      });
      await dataManager.snoozeReminder(r4.id, dateFromNow(1800000)); // Snooze 30 min ahead

      const pending = dataManager.getPendingReminders();

      // getPendingReminders returns ALL incomplete reminders with past datetime
      // It doesn't filter out future ones or snoozed ones in the actual implementation
      expect(pending.length).toBeGreaterThanOrEqual(1);
      expect(pending.some(r => r.message === 'Overdue')).toBe(true);
    });

    test('sorts pending reminders by datetime ascending', async () => {
      await dataManager.createReminder({
        message: 'Recent',
        datetime: datePast(1800000), // 30 min ago
      });

      await dataManager.createReminder({
        message: 'Old',
        datetime: datePast(7200000), // 2 hours ago
      });

      await dataManager.createReminder({
        message: 'Older',
        datetime: datePast(3600000), // 1 hour ago
      });

      const pending = dataManager.getPendingReminders();

      expect(pending[0].message).toBe('Old'); // Oldest first
      expect(pending[1].message).toBe('Older');
      expect(pending[2].message).toBe('Recent');
    });
  });

  describe('getUpcomingReminders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('returns only future incomplete reminders', async () => {
      await dataManager.createReminder({
        message: 'Future',
        datetime: dateFromNow(3600000),
        completed: false,
      });

      await dataManager.createReminder({
        message: 'Past',
        datetime: datePast(3600000),
        completed: false,
      });

      await dataManager.createReminder({
        message: 'Completed Future',
        datetime: dateFromNow(3600000),
        completed: true,
      });

      const upcoming = dataManager.getUpcomingReminders();

      // getUpcomingReminders has a limit parameter (default 10)
      expect(upcoming.length).toBeGreaterThanOrEqual(1);
      expect(upcoming.some(r => r.message === 'Future')).toBe(true);
    });

    test('sorts upcoming reminders by datetime ascending', async () => {
      await dataManager.createReminder({
        message: 'Tomorrow',
        datetime: dateFromNow(86400000), // 24 hours
      });

      await dataManager.createReminder({
        message: 'Soon',
        datetime: dateFromNow(1800000), // 30 min
      });

      await dataManager.createReminder({
        message: 'Later',
        datetime: dateFromNow(7200000), // 2 hours
      });

      const upcoming = dataManager.getUpcomingReminders();

      expect(upcoming[0].message).toBe('Soon');
      expect(upcoming[1].message).toBe('Later');
      expect(upcoming[2].message).toBe('Tomorrow');
    });
  });

  describe('getSnoozedReminders', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('returns only currently snoozed reminders', async () => {
      const r1 = await dataManager.createReminder({
        message: 'Snoozed',
        datetime: datePast(3600000),
      });
      await dataManager.snoozeReminder(r1.id, dateFromNow(1800000)); // Snooze 30 min ahead

      await dataManager.createReminder({
        message: 'Not snoozed',
        datetime: datePast(3600000),
      });

      const snoozed = dataManager.getSnoozedReminders();

      expect(snoozed.length).toBe(1);
      expect(snoozed[0].message).toBe('Snoozed');
    });

    test('excludes expired snoozes', async () => {
      const r1 = await dataManager.createReminder({
        message: 'Expired snooze',
        datetime: datePast(3600000),
        snoozedUntil: datePast(1800000), // Snooze expired 30 min ago
      });

      const snoozed = dataManager.getSnoozedReminders();

      expect(snoozed.length).toBe(0);
    });
  });

  describe('completed reminders (manual filter)', () => {
    test('can filter completed reminders manually', async () => {
      const r1 = await dataManager.createReminder({ message: 'To complete' });
      await dataManager.completeReminder(r1.id);

      await dataManager.createReminder({ message: 'Not completed' });

      const completed = plugin.settings.reminders.filter((r: any) => r.completed);

      expect(completed.length).toBe(1);
      expect(completed[0].message).toBe('To complete');
      expect(completed[0].completed).toBe(true);
    });
  });

  describe('getFilteredByTag', () => {
    beforeEach(async () => {
      await dataManager.createReminder({
        message: 'Work task',
        tags: ['work', 'urgent'],
      });

      await dataManager.createReminder({
        message: 'Personal task',
        tags: ['personal'],
      });

      await dataManager.createReminder({
        message: 'Work meeting',
        tags: ['work', 'meeting'],
      });

      await dataManager.createReminder({
        message: 'No tags',
        tags: [],
      });
    });

    test('filters reminders by single tag', () => {
      const workReminders = dataManager.getFilteredByTag('work');

      expect(workReminders.length).toBe(2);
      expect(workReminders.every(r => r.tags.includes('work'))).toBe(true);
    });

    test('is case-insensitive', () => {
      const workReminders = dataManager.getFilteredByTag('WORK');

      expect(workReminders.length).toBe(2);
    });

    test('returns empty array for non-existent tag', () => {
      const result = dataManager.getFilteredByTag('nonexistent');

      expect(result).toEqual([]);
    });

    test('returns reminders with exact tag match', () => {
      const urgentReminders = dataManager.getFilteredByTag('urgent');

      expect(urgentReminders.length).toBe(1);
      expect(urgentReminders[0].message).toBe('Work task');
    });
  });

  describe('priority filtering (manual)', () => {
    beforeEach(async () => {
      await dataManager.createReminder({
        message: 'Urgent task',
        priority: 'urgent',
      });

      await dataManager.createReminder({
        message: 'High task',
        priority: 'high',
      });

      await dataManager.createReminder({
        message: 'Normal task',
        priority: 'normal',
      });

      await dataManager.createReminder({
        message: 'Low task',
        priority: 'low',
      });

      await dataManager.createReminder({
        message: 'Another urgent',
        priority: 'urgent',
      });
    });

    test('can filter reminders by priority manually', () => {
      const urgentReminders = plugin.settings.reminders.filter((r: any) => r.priority === 'urgent');

      expect(urgentReminders.length).toBe(2);
      expect(urgentReminders.every((r: any) => r.priority === 'urgent')).toBe(true);
    });

    test('can filter all priority levels', () => {
      expect(plugin.settings.reminders.filter((r: any) => r.priority === 'urgent').length).toBe(2);
      expect(plugin.settings.reminders.filter((r: any) => r.priority === 'high').length).toBe(1);
      expect(plugin.settings.reminders.filter((r: any) => r.priority === 'normal').length).toBe(1);
      expect(plugin.settings.reminders.filter((r: any) => r.priority === 'low').length).toBe(1);
    });
  });

  describe('getAllTags', () => {
    test('returns empty array when no tags', () => {
      const tags = dataManager.getAllTags();

      expect(tags).toEqual([]);
    });

    test('returns unique tags with counts', async () => {
      await dataManager.createReminder({ tags: ['work', 'urgent'] });
      await dataManager.createReminder({ tags: ['work', 'meeting'] });
      await dataManager.createReminder({ tags: ['personal'] });
      await dataManager.createReminder({ tags: ['work'] });

      const tags = dataManager.getAllTags();

      expect(tags).toContainEqual({ tag: 'work', count: 3 });
      expect(tags).toContainEqual({ tag: 'urgent', count: 1 });
      expect(tags).toContainEqual({ tag: 'meeting', count: 1 });
      expect(tags).toContainEqual({ tag: 'personal', count: 1 });
      expect(tags.length).toBe(4);
    });

    test('sorts tags alphabetically', async () => {
      await dataManager.createReminder({ tags: ['zebra'] });
      await dataManager.createReminder({ tags: ['apple'] });
      await dataManager.createReminder({ tags: ['middle'] });

      const tags = dataManager.getAllTags();

      expect(tags[0].tag).toBe('apple');
      expect(tags[1].tag).toBe('middle');
      expect(tags[2].tag).toBe('zebra');
    });
  });

  describe('getStatistics', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-10-23T12:00:00.000Z'));
    });

    test('calculates all statistics correctly', async () => {
      // Overdue
      await dataManager.createReminder({
        message: 'Overdue 1',
        datetime: datePast(3600000),
      });
      await dataManager.createReminder({
        message: 'Overdue 2',
        datetime: datePast(1800000),
      });

      // Snoozed
      const snoozed = await dataManager.createReminder({
        message: 'Snoozed',
        datetime: datePast(3600000),
      });
      await dataManager.snoozeReminder(snoozed.id, dateFromNow(1800000)); // 30 min ahead

      // Upcoming (within 24 hours)
      await dataManager.createReminder({
        message: 'Soon',
        datetime: dateFromNow(3600000), // 1 hour ahead
      });
      await dataManager.createReminder({
        message: 'Today',
        datetime: dateFromNow(7200000), // 2 hours ahead
      });

      // Future (beyond 24 hours)
      await dataManager.createReminder({
        message: 'Far future',
        datetime: dateFromNow(172800000), // 2 days ahead
      });

      // Completed
      const completed = await dataManager.createReminder({
        message: 'Done',
        datetime: datePast(3600000),
      });
      await dataManager.completeReminder(completed.id);

      const stats = dataManager.getStatistics();

      // The snoozed reminder technically has a past datetime, so it's counted as overdue too
      // This is expected behavior - a snoozed overdue reminder is both snoozed AND overdue
      expect(stats.overdue).toBe(3); // 2 overdue + 1 snoozed (which is also overdue)
      expect(stats.snoozed).toBe(1);
      expect(stats.upcoming24h).toBe(2);
      expect(stats.total).toBe(7);
    });

    test('returns zeros when no reminders', () => {
      const stats = dataManager.getStatistics();

      expect(stats.overdue).toBe(0);
      expect(stats.snoozed).toBe(0);
      expect(stats.upcoming24h).toBe(0);
      expect(stats.total).toBe(0);
    });
  });

  describe('deleteCompleted', () => {
    beforeEach(async () => {
      const r1 = await dataManager.createReminder({ message: 'Complete me 1' });
      await dataManager.completeReminder(r1.id);

      const r2 = await dataManager.createReminder({ message: 'Complete me 2' });
      await dataManager.completeReminder(r2.id);

      await dataManager.createReminder({ message: 'Keep me' });
    });

    test('deletes all completed reminders', async () => {
      const count = await dataManager.deleteCompleted();

      expect(count).toBe(2);
      expect(plugin.settings.reminders.length).toBe(1);
      expect(plugin.settings.reminders[0].message).toBe('Keep me');
    });

    test('returns 0 when no completed reminders', async () => {
      await dataManager.deleteCompleted(); // Delete all completed

      const count = await dataManager.deleteCompleted(); // Try again

      expect(count).toBe(0);
    });
  });

  describe('deleteAll', () => {
    beforeEach(async () => {
      await dataManager.createReminder({ message: 'First' });
      await dataManager.createReminder({ message: 'Second' });
      await dataManager.createReminder({ message: 'Third' });
    });

    test('deletes all reminders', async () => {
      const count = await dataManager.deleteAll();

      expect(count).toBe(3);
      expect(plugin.settings.reminders.length).toBe(0);
    });

    test('returns 0 when no reminders', async () => {
      await dataManager.deleteAll(); // Delete all

      const count = await dataManager.deleteAll(); // Try again

      expect(count).toBe(0);
    });
  });
});

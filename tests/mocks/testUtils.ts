/**
 * Test utilities and helper functions
 */

import type { Reminder, ReminderPriority } from '../../src/types';

/**
 * Creates a mock reminder with default values for testing
 */
export function createMockReminder(overrides: Partial<Reminder> = {}): Reminder {
  const now = new Date().toISOString();

  return {
    id: `test-${Date.now()}-${Math.random()}`,
    message: 'Test reminder',
    datetime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    priority: 'normal' as ReminderPriority,
    tags: [],
    completed: false,
    snoozeCount: 0,
    created: now,
    updated: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock reminders for testing
 */
export function createMockReminders(count: number, overrides: Partial<Reminder> = {}): Reminder[] {
  return Array.from({ length: count }, (_, i) =>
    createMockReminder({
      ...overrides,
      id: `test-${i}`,
      message: `Test reminder ${i + 1}`,
    })
  );
}

/**
 * Creates a mock plugin instance for testing
 */
export function createMockPlugin() {
  return {
    settings: {
      reminders: [],
      fastCheckInterval: 5000,
      slowCheckInterval: 30000,
      showDebugLog: false,
      showSystemNotification: true,
      showObsidianNotice: true,
      defaultPriority: 'normal' as ReminderPriority,
      renotificationInterval: 'never' as const,
    },
    async saveSettings() {
      // Mock save
    },
    async loadSettings() {
      // Mock load
    },
  };
}

/**
 * Waits for a promise to resolve or reject
 */
export async function waitFor(condition: () => boolean, timeout = 1000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Creates a date string relative to now
 */
export function dateFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Creates a past date string
 */
export function datePast(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

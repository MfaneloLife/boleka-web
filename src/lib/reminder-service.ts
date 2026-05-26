import { UserNotificationPreferences, ReminderSchedule } from '../types/reminder';

// Stub ReminderService for development purposes
// Replace with actual implementation when ready
export const ReminderService = {
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    // TODO: Implement actual user preferences fetching
    console.warn('[ReminderService] getUserPreferences not fully implemented', userId);
    return null;
  },

  async updateUserPreferences(userId: string, _preferences: Record<string, any>): Promise<void> {
    // TODO: Implement actual user preferences update
    console.warn('[ReminderService] updateUserPreferences not fully implemented', userId);
  },

  async getPendingReminders(_limit?: number): Promise<ReminderSchedule[]> {
    // TODO: Implement actual pending reminders fetching
    console.warn('[ReminderService] getPendingReminders not fully implemented');
    return [];
  },

  async getUserReminders(_userId: string): Promise<ReminderSchedule[]> {
    // TODO: Implement actual user reminders fetching
    console.warn('[ReminderService] getUserReminders not fully implemented');
    return [];
  },

  async scheduleReturnReminders(_agreement: any): Promise<string[]> {
    // TODO: Implement actual return reminders scheduling
    console.warn('[ReminderService] scheduleReturnReminders not fully implemented');
    return [];
  },

  async schedulePickupReminder(_agreement: any): Promise<string | null> {
    // TODO: Implement actual pickup reminder scheduling
    console.warn('[ReminderService] schedulePickupReminder not fully implemented');
    return null;
  },

  async scheduleLateNotice(_agreementId: string): Promise<string | null> {
    // TODO: Implement actual late notice scheduling
    console.warn('[ReminderService] scheduleLateNotice not fully implemented');
    return null;
  },

  async cancelAgreementReminders(_agreementId: string): Promise<void> {
    // TODO: Implement actual reminder cancellation
    console.warn('[ReminderService] cancelAgreementReminders not fully implemented');
  },

  async updateReminderStatus(
    _reminderId: string,
    _status: string,
    _metadata?: any
  ): Promise<void> {
    // TODO: Implement actual reminder status update
    console.warn('[ReminderService] updateReminderStatus not fully implemented');
  },
};

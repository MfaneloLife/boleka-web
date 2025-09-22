import { Timestamp } from 'firebase/firestore';

export interface ReminderSchedule {
  id: string;
  agreementId: string;
  orderId: string;
  userId: string; // The user to be reminded (renter)
  ownerId: string; // The owner of the item
  
  // Reminder Details
  type: 'return_reminder' | 'pickup_reminder' | 'late_notice' | 'inspection_reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Timing
  scheduledFor: Timestamp;
  daysBeforeReturn: number; // 3, 1, 0, or negative for overdue
  
  // Content
  title: string;
  message: string;
  actionRequired?: string;
  
  // Item Details
  itemTitle: string;
  returnDate: Timestamp;
  returnLocation: string;
  returnTime?: string;
  
  // Status
  status: 'scheduled' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  
  // Channels
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  
  // User preferences
  userTimezone: string;
  preferredTime: string; // "09:00" format
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationTemplate {
  id: string;
  type: ReminderSchedule['type'];
  name: string;
  description: string;
  
  // Template content
  emailSubject: string;
  emailBody: string;
  smsMessage: string;
  pushTitle: string;
  pushBody: string;
  inAppTitle: string;
  inAppMessage: string;
  
  // Variables available in templates
  variables: {
    userName: string;
    ownerName: string;
    itemTitle: string;
    returnDate: string;
    returnTime: string;
    returnLocation: string;
    daysRemaining: number;
    agreementNumber: string;
    contactInfo: string;
  };
  
  // Styling
  category: 'reminder' | 'warning' | 'urgent' | 'info';
  color: string;
  icon: string;
  
  // Status
  isActive: boolean;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserNotificationPreferences {
  userId: string;
  
  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  
  // Timing preferences
  timezone: string;
  preferredTimes: {
    morning: string; // "09:00"
    afternoon: string; // "14:00"
    evening: string; // "18:00"
  };
  
  // Reminder preferences
  enableReturnReminders: boolean;
  enablePickupReminders: boolean;
  enableLateNotices: boolean;
  enableInspectionReminders: boolean;
  
  // Frequency settings
  reminderDays: number[]; // [3, 1, 0] - days before return
  maxRemindersPerDay: number;
  quietHours: {
    start: string; // "22:00"
    end: string; // "08:00"
  };
  
  // Do not disturb
  dndEnabled: boolean;
  dndDays: string[]; // ["saturday", "sunday"]
  dndDateRanges: {
    start: Timestamp;
    end: Timestamp;
    reason?: string;
  }[];
  
  // Language and localization
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationDelivery {
  id: string;
  reminderId: string;
  userId: string;
  
  // Delivery details
  channel: 'email' | 'sms' | 'push' | 'in_app';
  recipientAddress: string; // email, phone, device token, or user ID
  
  // Content
  subject?: string;
  message: string;
  data?: Record<string, any>;
  
  // Status tracking
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'clicked' | 'opened';
  sentAt?: Timestamp;
  deliveredAt?: Timestamp;
  openedAt?: Timestamp;
  clickedAt?: Timestamp;
  
  // Error handling
  errorCode?: string;
  errorMessage?: string;
  retryAttempt: number;
  nextRetryAt?: Timestamp;
  
  // Provider details
  providerMessageId?: string;
  providerResponse?: Record<string, any>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Helper functions for reminder scheduling
export function calculateReminderDates(returnDate: Date, reminderDays: number[]): Date[] {
  return reminderDays.map(days => {
    const reminderDate = new Date(returnDate);
    reminderDate.setDate(reminderDate.getDate() - days);
    return reminderDate;
  });
}

export function formatReminderMessage(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() || match;
  });
}

export function isInQuietHours(
  time: Date,
  quietStart: string,
  quietEnd: string,
  timezone: string
): boolean {
  // Convert time to user's timezone
  const userTime = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).format(time);
  
  const [currentHour, currentMinute] = userTime.split(':').map(Number);
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  
  const [startHour, startMinute] = quietStart.split(':').map(Number);
  const startMinutes = startHour * 60 + startMinute;
  
  const [endHour, endMinute] = quietEnd.split(':').map(Number);
  const endMinutes = endHour * 60 + endMinute;
  
  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startMinutes > endMinutes) {
    return currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes;
  }
  
  return currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes;
}

export function getDaysUntilReturn(returnDate: Date): number {
  const now = new Date();
  const diffTime = returnDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getReminderPriority(daysUntilReturn: number): ReminderSchedule['priority'] {
  if (daysUntilReturn < 0) return 'urgent'; // Overdue
  if (daysUntilReturn === 0) return 'high'; // Due today
  if (daysUntilReturn === 1) return 'medium'; // Due tomorrow
  return 'low'; // 2+ days
}

export function shouldSendReminder(
  preferences: UserNotificationPreferences,
  reminderType: ReminderSchedule['type'],
  scheduledTime: Date
): boolean {
  // Check if reminder type is enabled
  const typeEnabled = {
    'return_reminder': preferences.enableReturnReminders,
    'pickup_reminder': preferences.enablePickupReminders,
    'late_notice': preferences.enableLateNotices,
    'inspection_reminder': preferences.enableInspectionReminders
  };
  
  if (!typeEnabled[reminderType]) return false;
  
  // Check if in quiet hours
  if (isInQuietHours(
    scheduledTime,
    preferences.quietHours.start,
    preferences.quietHours.end,
    preferences.timezone
  )) return false;
  
  // Check do not disturb
  if (preferences.dndEnabled) {
    const dayOfWeek = scheduledTime.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: preferences.timezone 
    }).toLowerCase();
    if (preferences.dndDays.includes(dayOfWeek)) return false;
    
    // Check date ranges
    const isInDndRange = preferences.dndDateRanges.some(range => {
      const start = range.start.toDate();
      const end = range.end.toDate();
      return scheduledTime >= start && scheduledTime <= end;
    });
    if (isInDndRange) return false;
  }
  
  return true;
}
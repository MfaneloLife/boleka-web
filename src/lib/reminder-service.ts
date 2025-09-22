import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ReminderSchedule, 
  NotificationTemplate, 
  UserNotificationPreferences,
  NotificationDelivery,
  calculateReminderDates,
  formatReminderMessage,
  shouldSendReminder,
  getReminderPriority,
  getDaysUntilReturn
} from '@/src/types/reminder';
import { RentalAgreement } from '@/src/types/rental-agreement';

export class ReminderService {
  private static readonly REMINDERS_COLLECTION = 'reminders';
  private static readonly TEMPLATES_COLLECTION = 'notification_templates';
  private static readonly PREFERENCES_COLLECTION = 'notification_preferences';
  private static readonly DELIVERIES_COLLECTION = 'notification_deliveries';

  // Reminder Management
  static async scheduleReturnReminders(agreement: RentalAgreement): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const reminderIds: string[] = [];
      
      // Get user preferences or use defaults
      const renterPrefs = await this.getUserPreferences(agreement.renter.id);
      const reminderDays = renterPrefs?.reminderDays || [3, 1, 0];
      
      const returnDate = agreement.rentalPeriod.endDate.toDate();
      const reminderDates = calculateReminderDates(returnDate, reminderDays);
      
      for (let i = 0; i < reminderDates.length; i++) {
        const reminderDate = reminderDates[i];
        const daysBeforeReturn = reminderDays[i];
        
        // Skip if reminder date is in the past
        if (reminderDate < new Date()) continue;
        
        // Adjust time based on user preferences
        const scheduledTime = this.adjustReminderTime(reminderDate, renterPrefs);
        
        const reminder: Omit<ReminderSchedule, 'id'> = {
          agreementId: agreement.id,
          orderId: agreement.orderId,
          userId: agreement.renter.id,
          ownerId: agreement.owner.id,
          type: 'return_reminder',
          priority: getReminderPriority(daysBeforeReturn),
          scheduledFor: Timestamp.fromDate(scheduledTime),
          daysBeforeReturn,
          title: this.generateReminderTitle('return_reminder', daysBeforeReturn),
          message: await this.generateReminderMessage(agreement, 'return_reminder', daysBeforeReturn),
          actionRequired: daysBeforeReturn === 0 ? 'Return item today' : undefined,
          itemTitle: agreement.property.title,
          returnDate: agreement.rentalPeriod.endDate,
          returnLocation: agreement.rentalPeriod.returnLocation,
          returnTime: agreement.rentalPeriod.returnTime,
          status: 'scheduled',
          retryCount: 0,
          maxRetries: 3,
          channels: renterPrefs ? {
            email: renterPrefs.emailEnabled,
            sms: renterPrefs.smsEnabled,
            push: renterPrefs.pushEnabled,
            inApp: renterPrefs.inAppEnabled
          } : {
            email: true,
            sms: false,
            push: true,
            inApp: true
          },
          userTimezone: renterPrefs?.timezone || 'UTC',
          preferredTime: renterPrefs?.preferredTimes.morning || '09:00',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        const reminderRef = doc(collection(db, this.REMINDERS_COLLECTION));
        batch.set(reminderRef, reminder);
        reminderIds.push(reminderRef.id);
      }
      
      await batch.commit();
      return reminderIds;
      
    } catch (error) {
      console.error('Error scheduling return reminders:', error);
      throw error;
    }
  }

  static async schedulePickupReminder(agreement: RentalAgreement): Promise<string> {
    try {
      const renterPrefs = await this.getUserPreferences(agreement.renter.id);
      const pickupDate = agreement.rentalPeriod.startDate.toDate();
      
      // Schedule reminder 1 day before pickup
      const reminderDate = new Date(pickupDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      
      // Skip if reminder date is in the past
      if (reminderDate < new Date()) {
        throw new Error('Pickup date is too soon for reminder');
      }
      
      const scheduledTime = this.adjustReminderTime(reminderDate, renterPrefs);
      
      const reminder: Omit<ReminderSchedule, 'id'> = {
        agreementId: agreement.id,
        orderId: agreement.orderId,
        userId: agreement.renter.id,
        ownerId: agreement.owner.id,
        type: 'pickup_reminder',
        priority: 'medium',
        scheduledFor: Timestamp.fromDate(scheduledTime),
        daysBeforeReturn: -1, // Not applicable for pickup
        title: 'Pickup Reminder',
        message: await this.generateReminderMessage(agreement, 'pickup_reminder', 1),
        actionRequired: 'Pick up item tomorrow',
        itemTitle: agreement.property.title,
        returnDate: agreement.rentalPeriod.endDate,
        returnLocation: agreement.rentalPeriod.pickupLocation,
        returnTime: agreement.rentalPeriod.pickupTime,
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 3,
        channels: renterPrefs ? {
          email: renterPrefs.emailEnabled,
          sms: renterPrefs.smsEnabled,
          push: renterPrefs.pushEnabled,
          inApp: renterPrefs.inAppEnabled
        } : {
          email: true,
          sms: false,
          push: true,
          inApp: true
        },
        userTimezone: renterPrefs?.timezone || 'UTC',
        preferredTime: renterPrefs?.preferredTimes.morning || '09:00',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.REMINDERS_COLLECTION), reminder);
      return docRef.id;
      
    } catch (error) {
      console.error('Error scheduling pickup reminder:', error);
      throw error;
    }
  }

  static async scheduleLateNotice(agreementId: string): Promise<string> {
    try {
      // Get agreement details
      const agreementDoc = await getDoc(doc(db, 'rental_agreements', agreementId));
      if (!agreementDoc.exists()) {
        throw new Error('Agreement not found');
      }
      
      const agreement = { id: agreementDoc.id, ...agreementDoc.data() } as RentalAgreement;
      const renterPrefs = await this.getUserPreferences(agreement.renter.id);
      
      // Schedule immediate notification
      const scheduledTime = new Date();
      
      const daysOverdue = Math.abs(getDaysUntilReturn(agreement.rentalPeriod.endDate.toDate()));
      
      const reminder: Omit<ReminderSchedule, 'id'> = {
        agreementId: agreement.id,
        orderId: agreement.orderId,
        userId: agreement.renter.id,
        ownerId: agreement.owner.id,
        type: 'late_notice',
        priority: 'urgent',
        scheduledFor: Timestamp.fromDate(scheduledTime),
        daysBeforeReturn: -daysOverdue,
        title: 'Overdue Item Notice',
        message: await this.generateReminderMessage(agreement, 'late_notice', daysOverdue),
        actionRequired: 'Return item immediately to avoid additional fees',
        itemTitle: agreement.property.title,
        returnDate: agreement.rentalPeriod.endDate,
        returnLocation: agreement.rentalPeriod.returnLocation,
        returnTime: agreement.rentalPeriod.returnTime,
        status: 'scheduled',
        retryCount: 0,
        maxRetries: 5, // More retries for urgent notices
        channels: {
          email: true,
          sms: true, // Force SMS for late notices
          push: true,
          inApp: true
        },
        userTimezone: renterPrefs?.timezone || 'UTC',
        preferredTime: 'immediate',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.REMINDERS_COLLECTION), reminder);
      return docRef.id;
      
    } catch (error) {
      console.error('Error scheduling late notice:', error);
      throw error;
    }
  }

  static async getPendingReminders(maxResults?: number): Promise<ReminderSchedule[]> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.REMINDERS_COLLECTION),
        where('status', '==', 'scheduled'),
        where('scheduledFor', '<=', now),
        orderBy('scheduledFor', 'asc'),
        ...(maxResults ? [limit(maxResults)] : [])
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReminderSchedule[];
      
    } catch (error) {
      console.error('Error getting pending reminders:', error);
      throw error;
    }
  }

  static async getUserReminders(userId: string): Promise<ReminderSchedule[]> {
    try {
      const q = query(
        collection(db, this.REMINDERS_COLLECTION),
        where('userId', '==', userId),
        orderBy('scheduledFor', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReminderSchedule[];
      
    } catch (error) {
      console.error('Error getting user reminders:', error);
      throw error;
    }
  }

  static async updateReminderStatus(
    reminderId: string, 
    status: ReminderSchedule['status'],
    metadata?: Partial<ReminderSchedule>
  ): Promise<void> {
    try {
      const updateData: Partial<ReminderSchedule> = {
        status,
        updatedAt: Timestamp.now(),
        ...metadata
      };
      
      if (status === 'sent') {
        updateData.sentAt = Timestamp.now();
      }
      
      await updateDoc(doc(db, this.REMINDERS_COLLECTION, reminderId), updateData);
      
    } catch (error) {
      console.error('Error updating reminder status:', error);
      throw error;
    }
  }

  static async cancelAgreementReminders(agreementId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.REMINDERS_COLLECTION),
        where('agreementId', '==', agreementId),
        where('status', '==', 'scheduled')
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        });
      });
      
      await batch.commit();
      
    } catch (error) {
      console.error('Error cancelling agreement reminders:', error);
      throw error;
    }
  }

  // User Preferences
  static async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { userId, ...docSnap.data() } as UserNotificationPreferences;
      }
      
      return null;
      
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw error;
    }
  }

  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    try {
      const docRef = doc(db, this.PREFERENCES_COLLECTION, userId);
      const updateData = {
        ...preferences,
        updatedAt: Timestamp.now()
      };
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        // Create with defaults
        const defaultPrefs: UserNotificationPreferences = {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          inAppEnabled: true,
          timezone: 'UTC',
          preferredTimes: {
            morning: '09:00',
            afternoon: '14:00',
            evening: '18:00'
          },
          enableReturnReminders: true,
          enablePickupReminders: true,
          enableLateNotices: true,
          enableInspectionReminders: true,
          reminderDays: [3, 1, 0],
          maxRemindersPerDay: 5,
          quietHours: {
            start: '22:00',
            end: '08:00'
          },
          dndEnabled: false,
          dndDays: [],
          dndDateRanges: [],
          language: 'en',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await updateDoc(docRef, { ...defaultPrefs, ...updateData });
      } else {
        await updateDoc(docRef, updateData);
      }
      
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Helper Methods
  private static adjustReminderTime(
    baseDate: Date, 
    preferences: UserNotificationPreferences | null
  ): Date {
    const adjustedDate = new Date(baseDate);
    
    if (preferences?.preferredTimes.morning) {
      const [hours, minutes] = preferences.preferredTimes.morning.split(':').map(Number);
      adjustedDate.setHours(hours, minutes, 0, 0);
    } else {
      adjustedDate.setHours(9, 0, 0, 0); // Default to 9 AM
    }
    
    return adjustedDate;
  }

  private static generateReminderTitle(
    type: ReminderSchedule['type'], 
    daysBeforeReturn: number
  ): string {
    switch (type) {
      case 'return_reminder':
        if (daysBeforeReturn === 0) return 'Return Item Today';
        if (daysBeforeReturn === 1) return 'Return Item Tomorrow';
        return `Return Item in ${daysBeforeReturn} Days`;
      case 'pickup_reminder':
        return 'Pickup Reminder';
      case 'late_notice':
        return 'Overdue Item Notice';
      case 'inspection_reminder':
        return 'Item Inspection Required';
      default:
        return 'Rental Reminder';
    }
  }

  private static async generateReminderMessage(
    agreement: RentalAgreement,
    type: ReminderSchedule['type'],
    daysBeforeReturn: number
  ): Promise<string> {
    const variables = {
      userName: agreement.renter.name,
      ownerName: agreement.owner.name,
      itemTitle: agreement.property.title,
      returnDate: agreement.rentalPeriod.endDate.toDate().toLocaleDateString(),
      returnTime: agreement.rentalPeriod.returnTime || 'Not specified',
      returnLocation: agreement.rentalPeriod.returnLocation,
      daysRemaining: daysBeforeReturn,
      agreementNumber: agreement.agreementNumber,
      contactInfo: agreement.owner.email
    };

    // Try to get custom template
    const template = await this.getNotificationTemplate(type);
    if (template) {
      return formatReminderMessage(template.emailBody, variables);
    }

    // Default messages
    switch (type) {
      case 'return_reminder':
        if (daysBeforeReturn === 0) {
          return `Hi ${variables.userName}, your rental of "${variables.itemTitle}" is due for return today by ${variables.returnTime}. Please return it to: ${variables.returnLocation}. Contact ${variables.ownerName} at ${variables.contactInfo} if you have any questions.`;
        } else if (daysBeforeReturn === 1) {
          return `Hi ${variables.userName}, friendly reminder that your rental of "${variables.itemTitle}" is due for return tomorrow (${variables.returnDate}) by ${variables.returnTime}. Return location: ${variables.returnLocation}.`;
        } else {
          return `Hi ${variables.userName}, your rental of "${variables.itemTitle}" is due for return in ${daysBeforeReturn} days (${variables.returnDate}). Please ensure timely return to maintain a good rental record.`;
        }
      case 'pickup_reminder':
        return `Hi ${variables.userName}, reminder to pick up your rental "${variables.itemTitle}" tomorrow. Contact ${variables.ownerName} at ${variables.contactInfo} to coordinate pickup at ${variables.returnLocation}.`;
      case 'late_notice':
        return `URGENT: Hi ${variables.userName}, your rental of "${variables.itemTitle}" was due on ${variables.returnDate} and is now overdue. Please return it immediately to avoid additional late fees. Contact ${variables.ownerName} at ${variables.contactInfo}.`;
      case 'inspection_reminder':
        return `Hi ${variables.userName}, please schedule an inspection for your rental "${variables.itemTitle}" before the return date (${variables.returnDate}).`;
      default:
        return `Reminder about your rental "${variables.itemTitle}".`;
    }
  }

  private static async getNotificationTemplate(type: ReminderSchedule['type']): Promise<NotificationTemplate | null> {
    try {
      const q = query(
        collection(db, this.TEMPLATES_COLLECTION),
        where('type', '==', type),
        where('isActive', '==', true),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as NotificationTemplate;
      
    } catch (error) {
      console.error('Error getting notification template:', error);
      return null;
    }
  }
}
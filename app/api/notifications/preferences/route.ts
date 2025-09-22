import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ReminderService } from '@/src/lib/reminder-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences = await ReminderService.getUserPreferences(session.user.id);

    if (!preferences) {
      // Return default preferences
      return NextResponse.json({
        preferences: {
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
          timeFormat: '12h'
        }
      });
    }

    return NextResponse.json({
      preferences
    });

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the preferences data
    const allowedFields = [
      'emailEnabled',
      'smsEnabled', 
      'pushEnabled',
      'inAppEnabled',
      'timezone',
      'preferredTimes',
      'enableReturnReminders',
      'enablePickupReminders', 
      'enableLateNotices',
      'enableInspectionReminders',
      'reminderDays',
      'maxRemindersPerDay',
      'quietHours',
      'dndEnabled',
      'dndDays',
      'dndDateRanges',
      'language',
      'dateFormat',
      'timeFormat'
    ];

    const preferences: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        preferences[field] = body[field];
      }
    }

    // Validate specific fields
    if (preferences.reminderDays && !Array.isArray(preferences.reminderDays)) {
      return NextResponse.json(
        { error: 'reminderDays must be an array' },
        { status: 400 }
      );
    }

    if (preferences.maxRemindersPerDay && (
      typeof preferences.maxRemindersPerDay !== 'number' ||
      preferences.maxRemindersPerDay < 1 ||
      preferences.maxRemindersPerDay > 20
    )) {
      return NextResponse.json(
        { error: 'maxRemindersPerDay must be a number between 1 and 20' },
        { status: 400 }
      );
    }

    if (preferences.timezone && typeof preferences.timezone !== 'string') {
      return NextResponse.json(
        { error: 'timezone must be a string' },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (preferences.preferredTimes) {
      const times = preferences.preferredTimes;
      if (times.morning && !timeRegex.test(times.morning)) {
        return NextResponse.json(
          { error: 'Invalid morning time format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (times.afternoon && !timeRegex.test(times.afternoon)) {
        return NextResponse.json(
          { error: 'Invalid afternoon time format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (times.evening && !timeRegex.test(times.evening)) {
        return NextResponse.json(
          { error: 'Invalid evening time format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    if (preferences.quietHours) {
      const { start, end } = preferences.quietHours;
      if (start && !timeRegex.test(start)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours start time format. Use HH:MM' },
          { status: 400 }
        );
      }
      if (end && !timeRegex.test(end)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours end time format. Use HH:MM' },
          { status: 400 }
        );
      }
    }

    await ReminderService.updateUserPreferences(session.user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
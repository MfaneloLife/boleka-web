import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  ClockIcon, 
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  MoonIcon,
  SunIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { UserNotificationPreferences } from '@/src/types/reminder';

interface NotificationPreferencesProps {
  userId: string;
  onSave?: (preferences: Partial<UserNotificationPreferences>) => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  userId,
  onSave
}) => {
  const [preferences, setPreferences] = useState<Partial<UserNotificationPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      
      const data = await response.json();
      setPreferences(data.preferences || {});
    } catch (err) {
      setError('Failed to load notification preferences');
      console.error('Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save preferences');
      }

      setSuccess('Preferences saved successfully!');
      onSave?.(preferences);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof UserNotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedPreference = (
    parentKey: keyof UserNotificationPreferences,
    childKey: string,
    value: any
  ) => {
    setPreferences(prev => ({
      ...prev,
      [parentKey]: {
        ...((prev[parentKey] as any) || {}),
        [childKey]: value
      }
    }));
  };

  const addReminderDay = () => {
    const newDay = prompt('Enter number of days before return (e.g., 3, 1, 0):');
    if (newDay !== null && !isNaN(Number(newDay))) {
      const days = preferences.reminderDays || [3, 1, 0];
      const dayNum = Number(newDay);
      if (!days.includes(dayNum)) {
        updatePreference('reminderDays', [...days, dayNum].sort((a, b) => b - a));
      }
    }
  };

  const removeReminderDay = (dayToRemove: number) => {
    const days = preferences.reminderDays || [];
    updatePreference('reminderDays', days.filter(day => day !== dayToRemove));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <BellIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        </div>

        {error && (
          <div className="mb-4 p-4 border border-red-300 rounded-md bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 border border-green-300 rounded-md bg-green-50">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Notification Channels */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.emailEnabled || false}
                  onChange={(e) => updatePreference('emailEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <EnvelopeIcon className="h-5 w-5 ml-3 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.smsEnabled || false}
                  onChange={(e) => updatePreference('smsEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <DevicePhoneMobileIcon className="h-5 w-5 ml-3 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">SMS Notifications</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.pushEnabled || false}
                  onChange={(e) => updatePreference('pushEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <BellIcon className="h-5 w-5 ml-3 mr-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Push Notifications</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled || false}
                  onChange={(e) => updatePreference('inAppEnabled', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700 ml-8">In-App Notifications</span>
              </label>
            </div>
          </div>

          {/* Reminder Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reminder Types</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.enableReturnReminders !== false}
                  onChange={(e) => updatePreference('enableReturnReminders', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Return Reminders</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.enablePickupReminders !== false}
                  onChange={(e) => updatePreference('enablePickupReminders', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Pickup Reminders</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.enableLateNotices !== false}
                  onChange={(e) => updatePreference('enableLateNotices', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Late Return Notices</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.enableInspectionReminders !== false}
                  onChange={(e) => updatePreference('enableInspectionReminders', e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">Inspection Reminders</span>
              </label>
            </div>
          </div>

          {/* Reminder Schedule */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reminder Schedule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remind me (days before return):
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(preferences.reminderDays || [3, 1, 0]).map(day => (
                    <span
                      key={day}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                    >
                      {day === 0 ? 'On return day' : `${day} day${day !== 1 ? 's' : ''} before`}
                      <button
                        onClick={() => removeReminderDay(day)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  onClick={addReminderDay}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  + Add reminder day
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={preferences.timezone || 'UTC'}
                    onChange={(e) => updatePreference('timezone', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    title="Select your timezone"
                    aria-label="Timezone selection"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max reminders per day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.maxRemindersPerDay || 5}
                    onChange={(e) => updatePreference('maxRemindersPerDay', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    aria-label="Maximum reminders per day"
                    title="Set the maximum number of reminders you want to receive per day"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferred Times */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Preferred Times
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <SunIcon className="h-4 w-4 inline mr-1" />
                  Morning
                </label>
                <input
                  type="time"
                  value={preferences.preferredTimes?.morning || '09:00'}
                  onChange={(e) => updateNestedPreference('preferredTimes', 'morning', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  aria-label="Morning notification time"
                  title="Set your preferred morning notification time"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Afternoon
                </label>
                <input
                  type="time"
                  value={preferences.preferredTimes?.afternoon || '14:00'}
                  onChange={(e) => updateNestedPreference('preferredTimes', 'afternoon', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Select afternoon notification time"
                  aria-label="Afternoon notification time"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MoonIcon className="h-4 w-4 inline mr-1" />
                  Evening
                </label>
                <input
                  type="time"
                  value={preferences.preferredTimes?.evening || '18:00'}
                  onChange={(e) => updateNestedPreference('preferredTimes', 'evening', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Select evening notification time"
                  aria-label="Evening notification time"
                />
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quiet Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours?.start || '22:00'}
                  onChange={(e) => updateNestedPreference('quietHours', 'start', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Select quiet hours start time"
                  aria-label="Quiet hours start time"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End time
                </label>
                <input
                  type="time"
                  value={preferences.quietHours?.end || '08:00'}
                  onChange={(e) => updateNestedPreference('quietHours', 'end', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  title="Select quiet hours end time"
                  aria-label="Quiet hours end time"
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              No notifications will be sent during these hours.
            </p>
          </div>

          {/* Do Not Disturb */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={preferences.dndEnabled || false}
                onChange={(e) => updatePreference('dndEnabled', e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-700">Do Not Disturb Mode</span>
                <p className="text-sm text-gray-500">
                  Reduces notifications to only urgent matters
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch notifications
  const fetchNotifications = async (filter: 'all' | 'unread' = 'all') => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      const url = filter === 'unread' ? '/api/notifications?unreadOnly=true' : '/api/notifications';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session?.user) {
      fetchNotifications(activeFilter);
    }
  }, [session, activeFilter]);

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId }),
      });

      // Update local state
      setNotifications(
        notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      // Update local state
      setNotifications(
        notifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get link for notification type
  const getNotificationLink = (notification: Notification) => {
    const { type, relatedId } = notification;
    
    switch(type) {
      case 'REQUEST_CREATED':
      case 'REQUEST_ACCEPTED':
      case 'REQUEST_REJECTED':
        return `/dashboard/requests/${relatedId}`;
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_FAILED':
        return `/dashboard/payments/${relatedId}`;
      case 'MESSAGE_RECEIVED':
        return `/messages/${relatedId}`;
      case 'REVIEW_RECEIVED':
        return `/dashboard/reviews/${relatedId}`;
      default:
        return '#';
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'REQUEST_CREATED':
        return (
          <div className="bg-blue-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'PAYMENT_RECEIVED':
        return (
          <div className="bg-green-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'MESSAGE_RECEIVED':
        return (
          <div className="bg-purple-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-orange-100 p-3 rounded-full">
            <svg className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">Notifications</h1>
            
            <div className="flex items-center space-x-4">
              {/* Filter tabs */}
              <div className="flex bg-gray-100 p-1 rounded-md">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    activeFilter === 'all'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    activeFilter === 'unread'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Unread
                </button>
              </div>
              
              {/* Mark all as read */}
              <button
                onClick={markAllAsRead}
                className="text-sm text-orange-600 hover:text-orange-800"
                disabled={notifications.every(n => n.isRead)}
              >
                Mark all as read
              </button>
            </div>
          </div>
        </div>
        
        {/* Notification list */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg
                className="animate-spin h-8 w-8 mx-auto mb-4 text-orange-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-lg font-medium">No notifications yet</p>
              <p className="mt-1">We'll notify you when something happens</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Link 
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                className={`block px-6 py-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-orange-50' : ''
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 sm:mt-0">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

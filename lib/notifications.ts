import { prisma } from '@/lib/prisma';

export type NotificationType = 
  | 'REQUEST_CREATED'
  | 'REQUEST_ACCEPTED' 
  | 'REQUEST_REJECTED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'MESSAGE_RECEIVED'
  | 'ITEM_LIKED'
  | 'REVIEW_RECEIVED';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  relatedId,
}: CreateNotificationParams) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
    },
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 20) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  return await prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(userId: string) {
  return await prisma.notification.deleteMany({
    where: { userId },
  });
}

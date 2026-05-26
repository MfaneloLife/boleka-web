import { prisma } from '@/lib/prisma';
import {
  createPaymentRecord,
  getRequestById as getRequestByIdNeon,
  getUserByEmail as getUserByEmailNeon,
  getWalletTransactions,
  getPaymentsForMerchant,
  updatePayment,
  markRequestPaid,
} from '@/lib/neon-db';

export const FirebaseDbService = {
  getUserByEmail: async (email: string) => {
    const user = await getUserByEmailNeon(email);
    return user ? { success: true, user } : { success: false };
  },

  getUserByFirebaseUid: async (uid: string) => {
    if (!uid) return { success: false };
    const user = await prisma.user.findUnique({ where: { id: uid } });
    return user ? { success: true, user } : { success: false };
  },

  getRequestById: async (requestId: string) => {
    const request = await getRequestByIdNeon(requestId);
    return request ? { success: true, request } : { success: false };
  },

  createPayment: async (data: { requestId: string; amount: number; payerId: string; paymentMethod: string }) => {
    const payment = await createPaymentRecord({
      requestId: data.requestId,
      amount: data.amount,
      payerId: data.payerId,
      method: data.paymentMethod,
    });
    return { success: true, id: payment.id, payment };
  },

  updatePayment: async (id: string, data: { status?: string; amount?: number }) => {
    const payment = await updatePayment({ id, status: data.status, amount: data.amount });
    return { success: true, payment };
  },

  getPaymentsByMerchant: async (userId: string) => {
    const payments = await getPaymentsForMerchant(userId);
    return { success: true, payments };
  },

  listWalletTransactions: async (userId: string, limit: number) => {
    const transactions = await getWalletTransactions(userId, limit);
    return { success: true, transactions };
  },

  updateUser: async (id: string, data: Partial<{ firebaseUid: string }>) => {
    const user = await prisma.user.update({ where: { id }, data: { ...data } });
    return { success: true, user };
  },

  getBusinessProfileByUserId: async () => ({ success: true, profile: null }),

  getPaymentByOrderId: async (orderId: string) => {
    const payment = await prisma.payment.findFirst({ where: { requestId: orderId } });
    return payment ? { success: true, payment } : { success: false };
  },

  updateRequest: async (requestId: string, values: Record<string, unknown>) => {
    const data: Record<string, unknown> = {};
    if ('paymentStatus' in values) {
      data.status = values.paymentStatus as string;
    }
    const request = await prisma.request.update({
      where: { id: requestId },
      data,
    });
    return { success: true, request };
  },
};

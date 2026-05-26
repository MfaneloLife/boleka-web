import { prisma } from './prisma';

export async function getUserByEmail(email: string) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function upsertUserProfile({
  email,
  name,
  image,
}: {
  email: string;
  name?: string;
  image?: string;
}) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name: name || undefined,
      image: image || undefined,
      updatedAt: new Date(),
    },
    create: {
      email,
      name: name || email.split('@')[0],
      image: image || undefined,
      profileCompleted: true,
      hasBusinessProfile: false,
    },
  });
}

export async function createUser({
  email,
  name,
}: {
  email: string;
  name?: string;
}) {
  return prisma.user.create({
    data: {
      email,
      name: name || email.split('@')[0],
      profileCompleted: false,
      hasBusinessProfile: false,
    },
  });
}

export async function getRequestById(requestId: string) {
  return prisma.request.findUnique({
    where: { id: requestId },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createPaymentRecord({
  requestId,
  amount,
  payerId,
  method,
}: {
  requestId: string;
  amount: number;
  payerId: string;
  method: string;
}) {
  return prisma.payment.create({
    data: {
      requestId,
      payerId,
      amount,
      status: 'PENDING',
      method,
    },
  });
}

export async function getPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      request: {
        select: {
          ownerId: true,
        },
      },
    },
  });
}

export async function updatePayment({
  id,
  status,
  amount,
  method,
}: {
  id: string;
  status?: string;
  amount?: number;
  method?: string;
}) {
  return prisma.payment.update({
    where: { id },
    data: {
      status: status || undefined,
      amount: amount ?? undefined,
      method: method || undefined,
    },
  });
}

export async function getPaymentsForMerchant(userId: string) {
  return prisma.payment.findMany({
    where: {
      request: {
        ownerId: userId,
      },
    },
    include: {
      request: {
        select: {
          id: true,
          ownerId: true,
          requesterId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getWalletTransactions(userId: string, limit = 50) {
  return prisma.payment.findMany({
    where: {
      OR: [
        { payerId: userId },
        {
          request: {
            ownerId: userId,
          },
        },
      ],
    },
    include: {
      request: {
        select: {
          id: true,
          ownerId: true,
          requesterId: true,
          item: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 200),
  });
}

export async function markRequestPaid(requestId: string) {
  return prisma.request.update({
    where: { id: requestId },
    data: { status: 'PAID' },
  });
}

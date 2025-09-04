import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserConversations } from '@/lib/firebaseUtils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get requests where the user is either the requester or the owner
    // First, try to get conversations from Firebase
    try {
      const firebaseConversations = await getUserConversations(user.id);
      if (firebaseConversations && firebaseConversations.length > 0) {
        return NextResponse.json(firebaseConversations);
      }
    } catch (firebaseError) {
      console.error('FIREBASE_CONVERSATIONS_ERROR', firebaseError);
      // Fall back to Prisma if Firebase fails
    }

    // Fallback: Get from Prisma
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { requesterId: user.id },
          { ownerId: user.id },
        ],
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            imageUrls: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('GET_CONVERSATIONS_ERROR', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

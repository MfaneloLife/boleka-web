import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all requests where the user is either the requester or the item owner
    const requests = await prisma.request.findMany({
      where: {
        OR: [
          { userId: userId },
          { 
            item: {
              user: {
                id: userId
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        item: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
        }
      },
      orderBy: {
        messages: {
          createdAt: 'desc'
        }
      }
    });

    // Transform the data to match our ConversationList component
    const conversations = requests.map(request => {
      const isRequester = request.userId === userId;
      const otherUser = isRequester ? request.item.user : request.user;
      const lastMessage = request.messages[0];
      
      return {
        id: request.id,
        requestId: request.id,
        recipientId: otherUser.id,
        recipientName: otherUser.name || 'Unknown User',
        itemTitle: request.item.title,
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageTime: lastMessage?.createdAt.toISOString() || request.createdAt.toISOString(),
        // Count unread messages where the recipient is the current user
        unreadCount: 0, // This would be implemented in a real app
      };
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

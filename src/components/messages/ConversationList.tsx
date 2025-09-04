'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Conversation {
  id: string;
  requestId: string;
  recipientId: string;
  recipientName: string;
  itemTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // const response = await fetch('/api/messages/conversations');
        // const data = await response.json();
        
        // For now, we'll use mock data
        const mockConversations: Conversation[] = [
          {
            id: '1',
            requestId: 'req1',
            recipientId: 'user2',
            recipientName: 'John Doe',
            itemTitle: 'Power Drill',
            lastMessage: 'Yes, it\'s available. When would you like to pick it up?',
            lastMessageTime: new Date(Date.now() - 1800000).toISOString(),
            unreadCount: 1
          },
          {
            id: '2',
            requestId: 'req2',
            recipientId: 'user3',
            recipientName: 'Jane Smith',
            itemTitle: 'Mountain Bike',
            lastMessage: 'Thanks, I\'ll see you tomorrow!',
            lastMessageTime: new Date(Date.now() - 86400000).toISOString(),
            unreadCount: 0
          },
          {
            id: '3',
            requestId: 'req3',
            recipientId: 'user4',
            recipientName: 'Bob Johnson',
            itemTitle: 'Camping Tent',
            lastMessage: 'Is the tent waterproof?',
            lastMessageTime: new Date(Date.now() - 172800000).toISOString(),
            unreadCount: 2
          }
        ];
        
        setConversations(mockConversations);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // If less than 24 hours ago, show time
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If less than a week ago, show day name
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const isActive = (id: string) => {
    return pathname.includes(`/messages/${id}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-indigo-600 text-white">
        <h3 className="text-lg font-medium">Messages</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet.
          </div>
        ) : (
          conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.requestId}`}
              className={`block hover:bg-gray-50 ${isActive(conversation.requestId) ? 'bg-indigo-50' : ''}`}
            >
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        {conversation.recipientName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        RE: {conversation.itemTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-xs text-gray-500">
                      {formatTime(conversation.lastMessageTime)}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full mt-1">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

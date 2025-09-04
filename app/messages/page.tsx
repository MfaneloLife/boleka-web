'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Conversation {
  id: string;
  item: {
    id: string;
    title: string;
    imageUrls: string[];
  };
  requester: {
    id: string;
    name: string;
    image: string | null;
  };
  owner: {
    id: string;
    name: string;
    image: string | null;
  };
  status: string;
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    messages: number;
  };
  updatedAt: string;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchConversations();
    }
  }, [status, router]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load your conversations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOtherParty = (conversation: Conversation) => {
    if (!session?.user?.email) return null;
    
    // Determine if the current user is the requester or the owner
    const userIsRequester = conversation.requester.id === session.user.email;
    
    // Return the other party's information
    return userIsRequester ? conversation.owner : conversation.requester;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Conversations with item owners and requesters
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {conversations.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {conversations.map((conversation) => {
              const otherParty = getOtherParty(conversation);
              const lastMessage = conversation.messages[0];
              
              return (
                <li key={conversation.id}>
                  <Link 
                    href={`/messages/${conversation.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {otherParty?.image ? (
                              <Image
                                src={otherParty.image}
                                alt={otherParty.name || 'User'}
                                className="rounded-full"
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                {otherParty?.name ? otherParty.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-indigo-600">
                              {conversation.item.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {otherParty?.name || 'User'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500">
                            {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(conversation.updatedAt)}
                          </span>
                          <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {conversation._count.messages} messages
                          </span>
                        </div>
                      </div>
                      {lastMessage && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 truncate">
                            <span className="font-medium">{lastMessage.sender.name}: </span>
                            {lastMessage.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-4 py-6 text-center">
            <p className="text-gray-500">You don't have any conversations yet.</p>
            <p className="mt-1 text-sm text-gray-500">
              Start by browsing items and sending requests.
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard/client/search"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse Items
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

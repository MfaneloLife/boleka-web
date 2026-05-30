"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { MessageSquare, Loader2, ArrowRight } from 'lucide-react';

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
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      window.location.href = '/auth/login';
      return;
    }

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

    fetchConversations();
  }, [isLoaded, isSignedIn]);

  const getOtherParty = (conversation: Conversation) => {
    if (!user) return null;
    const userIsRequester = conversation.requester.id === user.id;
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

  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 text-sm mt-1">Chat with renters and owners about your items</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-orange-800">All conversations are secure and private</p>
            <p className="text-xs text-orange-600 mt-0.5">Connect with users to discuss item details, arrange pickup/delivery, and coordinate your experience.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {conversations.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {conversations.map((conversation) => {
              const otherParty = getOtherParty(conversation);
              const lastMessage = conversation.messages[0];
              
              return (
                <li key={conversation.id}>
                  <Link 
                    href={`/messages/${conversation.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1 gap-3">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {otherParty?.image ? (
                              <Image
                                src={otherParty.image}
                                alt={otherParty.name || 'User'}
                                className="rounded-full object-cover"
                                width={40}
                                height={40}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-orange-600">
                                  {otherParty?.name ? otherParty.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {conversation.item.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {otherParty?.name || 'User'}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0 ml-2">
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {lastMessage ? formatDate(lastMessage.createdAt) : formatDate(conversation.updatedAt)}
                          </span>
                          <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600">
                            {conversation._count.messages}
                          </span>
                        </div>
                      </div>
                      {lastMessage && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 truncate">
                            <span className="font-medium text-gray-700">{lastMessage.sender.name}: </span>
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
          <div className="px-4 py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No conversations yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Start connecting with other Boleka users by browsing items and sending requests.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition shadow-sm"
              >
                Browse Items
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
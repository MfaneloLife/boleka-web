"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MessageBubble from '@/src/components/MessageBubble';
import MessageInput from '@/src/components/MessageInput';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  imageUrl?: string | null;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface Request {
  id: string;
  item: {
    id: string;
    title: string;
    imageUrls: string[];
    price: number;
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
  updatedAt: string;
}

export default function ConversationPage({ params }: { params: { requestId: string } }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/messages/${params.requestId}`);

      if (!response.ok) {
        if (response.status === 401) throw new Error('Please log in to view this conversation.');
        if (response.status === 403) throw new Error('You do not have access to this conversation.');
        if (response.status === 404) throw new Error('This conversation was not found.');
        // Try to get error message from response body
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || 'Failed to load conversation');
          } catch {
            throw new Error('Failed to load conversation. Please try again.');
          }
        }
        throw new Error('Failed to load conversation. Please try again.');
      }

      const text = await response.text();
      if (!text) throw new Error('Received empty response from server.');

      const data = JSON.parse(text);
      setMessages(data.messages || []);
      setRequest(data.request || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      window.location.href = '/auth/login';
      return;
    }
    fetchConversation();
  }, [isLoaded, isSignedIn, params.requestId]);

  const handleSendMessage = async (content: string, file?: File) => {
    if ((!content.trim() && !file) || !user) return;
    setError(null);

    try {
      const payload: { content: string; imageBase64?: string; imageType?: string } = {
        content: content.trim()
      };

      if (file) {
        const base64 = await fileToBase64(file);
        payload.imageBase64 = base64;
        payload.imageType = file.type;
      }

      const response = await fetch(`/api/messages/${params.requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            throw new Error(json.error || 'Failed to send message');
          } catch {
            throw new Error('Failed to send message');
          }
        }
        throw new Error('Failed to send message');
      }

      const text = await response.text();
      if (text) {
        const newMessage = JSON.parse(text);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        scrollToBottom();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getOtherParty = () => {
    if (!user || !request) return null;
    const userIsRequester = request.requester.id === user.id;
    return userIsRequester ? request.owner : request.requester;
  };

  const otherParty = getOtherParty();

  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isSignedIn) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
      {error && (
        <div className="m-4 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {request && (
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
          <Link href="/messages" className="text-gray-500 hover:text-gray-700 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
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
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {otherParty?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {request.item.title}
            </div>
          </div>
          <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0 border border-orange-200">
            {request.status}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {request && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-lg bg-gray-50">
                  {request.item.imageUrls && request.item.imageUrls.length > 0 ? (
                    <Image
                      src={request.item.imageUrls[0]}
                      alt={request.item.title}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">{request.item.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">R{request.item.price?.toFixed(2)}/day</p>
                </div>
                <Link
                  href={`/items/${request.item.id}`}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium shrink-0 transition-colors"
                >
                  View Item
                </Link>
              </div>
            </div>
          )}

          {messages.length > 0 ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isCurrentUser={message.senderId === user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold">No messages yet</p>
              <p className="text-sm text-gray-500 mt-1">Start the conversation by sending a message.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-100 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
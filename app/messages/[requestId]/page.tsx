'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MessageBubble from '@/components/MessageBubble';
import MessageInput from '@/components/MessageInput';

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
  createdAt: string;
}

export default function ConversationPage({ params }: { params: { requestId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchConversation();
    }
  }, [status, router, params.requestId]);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/${params.requestId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      const data = await response.json();
      setRequest(data.request);
      setMessages(data.messages);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load the conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if ((!content.trim() && !file) || !session?.user?.email) return;
    
    try {
      // Prepare the payload
      const payload: { content: string; imageBase64?: string; imageType?: string } = {
        content: content.trim()
      };
      
      // If there's a file, convert it to base64
      if (file) {
        const base64 = await fileToBase64(file);
        payload.imageBase64 = base64;
        payload.imageType = file.type;
      }
      
      const response = await fetch(`/api/messages/${params.requestId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const newMessage = await response.json();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      
      // Scroll to bottom after sending message
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send your message. Please try again.');
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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
    if (!session?.user?.email || !request) return null;
    
    // Determine if the current user is the requester or the owner
    const userIsRequester = request.requester.id === session.user.email;
    
    // Return the other party's information
    return userIsRequester ? request.owner : request.requester;
  };

  const otherParty = getOtherParty();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {request && (
        <div className="bg-white shadow px-4 py-3 flex items-center">
          <Link href="/messages" className="mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          
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
          
          <div className="ml-3 flex-1">
            <div className="text-sm font-medium text-gray-900">
              {otherParty?.name || 'User'}
            </div>
            <div className="text-sm text-gray-500">
              {request.item.title}
            </div>
          </div>
          
          <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
            Status: <span className="font-medium capitalize">{request.status}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {request && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-md">
                  {request.item.imageUrls && request.item.imageUrls.length > 0 ? (
                    <Image
                      src={request.item.imageUrls[0]}
                      alt={request.item.title}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{request.item.title}</h3>
                  <p className="text-sm text-gray-500">Price: R{request.item.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Request created: {formatDate(request.createdAt)}</p>
                </div>
                
                <Link
                  href={`/dashboard/client/items/${request.item.id}`}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
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
                  isCurrentUser={message.senderId === session?.user?.email}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet.</p>
              <p className="text-sm text-gray-500">Start the conversation by sending a message.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto">
          <MessageInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

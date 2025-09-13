'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/src/components/ui/Button';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  isCurrentUser?: boolean;
}

interface ChatProps {
  requestId: string;
  recipientId: string;
  recipientName: string;
  itemTitle: string;
}

export default function Chat({ requestId, recipientId, recipientName, itemTitle }: ChatProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        // In a real app, this would be an API call
        // const response = await fetch(`/api/messages/${requestId}`);
        // const data = await response.json();
        
        // For now, we'll use mock data
        const mockMessages: Message[] = [
          {
            id: '1',
            content: `Hi, I'm interested in your ${itemTitle}. Is it still available?`,
            senderId: session?.user?.id || 'user1',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            sender: {
              id: session?.user?.id || 'user1',
              name: session?.user?.name || 'You',
              image: null
            },
            isCurrentUser: true
          },
          {
            id: '2',
            content: `Yes, it's available. When would you like to pick it up?`,
            senderId: recipientId,
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            sender: {
              id: recipientId,
              name: recipientName,
              image: null
            },
            isCurrentUser: false
          }
        ];

        setMessages(mockMessages);
        setIsLoading(false);

        // Scroll to the bottom after messages are loaded
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setIsLoading(false);
      }
    };

    fetchMessages();

    // In a real app, set up a polling mechanism or WebSocket connection to get real-time messages
    const interval = setInterval(fetchMessages, 10000);
    
    return () => clearInterval(interval);
  }, [requestId, recipientId, recipientName, session, itemTitle]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !session?.user) return;
    
    try {
      // In a real app, this would be an API call
      // await fetch('/api/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     content: newMessage,
      //     requestId,
      //     recipientId
      //   })
      // });
      
      // For now, we'll just add the message to the state
      const newMsg: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage,
        senderId: session.user.id || 'user1',
        createdAt: new Date().toISOString(),
        sender: {
          id: session.user.id || 'user1',
          name: session.user.name || 'You',
          image: session.user.image || null
        },
        isCurrentUser: true
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  return (
    <div className="flex flex-col h-full max-h-[70vh] bg-white rounded-lg shadow overflow-hidden">
      {/* Chat header */}
      <div className="px-4 py-3 bg-indigo-600 text-white">
        <h3 className="text-lg font-medium">{recipientName}</h3>
        <p className="text-sm text-indigo-100">Regarding: {itemTitle}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  message.senderId === session?.user?.id
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.senderId === session?.user?.id ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

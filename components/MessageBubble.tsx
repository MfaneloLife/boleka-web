'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MessageProps {
  message: {
    id: string;
    content: string;
    createdAt: string;
    imageUrl?: string | null;
    sender: {
      id: string;
      name: string;
      image: string | null;
    };
  };
  isCurrentUser: boolean;
}

export default function MessageBubble({ message, isCurrentUser }: MessageProps) {
  const [imageError, setImageError] = useState(false);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-3">
          {message.sender.image ? (
            <Image
              src={message.sender.image}
              alt={message.sender.name || 'User'}
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
              {message.sender.name ? message.sender.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
      )}
      
      <div 
        className={`relative max-w-xl px-4 py-2 rounded-lg shadow ${
          isCurrentUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-gray-700'
        }`}
      >
        {message.content && (
          <span className="block">
            {message.content}
          </span>
        )}
        
        {message.imageUrl && !imageError && (
          <div className="mt-2 rounded-md overflow-hidden">
            <Image
              src={message.imageUrl}
              alt="Message attachment"
              width={300}
              height={200}
              className="max-w-full h-auto object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        )}
        
        <span 
          className={`block text-xs mt-1 ${isCurrentUser ? 'text-indigo-200' : 'text-gray-500'}`}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
      
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-3">
          {message.sender.image ? (
            <Image
              src={message.sender.image}
              alt={message.sender.name || 'You'}
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
              {message.sender.name ? message.sender.name.charAt(0).toUpperCase() : 'Y'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

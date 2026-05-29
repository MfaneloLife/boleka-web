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
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-orange-600">
                {message.sender.name ? message.sender.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>
      )}

      <div
        className={`relative max-w-xl px-4 py-2.5 rounded-2xl ${
          isCurrentUser
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-lg'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-lg shadow-sm'
        }`}
      >
        {message.content && (
          <span className="block text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </span>
        )}

        {message.imageUrl && !imageError && (
          <div className="mt-2 rounded-lg overflow-hidden">
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
          className={`block text-xs mt-1.5 ${
            isCurrentUser ? 'text-orange-100' : 'text-gray-400'
          }`}
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
              className="h-8 w-8 rounded-full object-cover"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {message.sender.name ? message.sender.name.charAt(0).toUpperCase() : 'Y'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
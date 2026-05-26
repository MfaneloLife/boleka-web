"use client";

import Image from 'next/image';

interface MessageBubbleProps {
  message: {
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
  };
  isCurrentUser: boolean;
}

export default function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isCurrentUser
            ? 'bg-orange-500 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
        }`}
      >
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-gray-300 overflow-hidden relative flex-shrink-0">
              {message.sender.image ? (
                <Image src={message.sender.image} alt={message.sender.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {message.sender.name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <span className={`text-xs font-medium ${isCurrentUser ? 'text-orange-100' : 'text-gray-500'}`}>
              {message.sender.name}
            </span>
          </div>
        )}
        {message.imageUrl && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <Image src={message.imageUrl} alt="Shared image" width={200} height={200} className="w-full object-cover" />
          </div>
        )}
        {message.content && <p className="text-sm leading-relaxed">{message.content}</p>}
        <p className={`text-xs mt-1 ${isCurrentUser ? 'text-orange-200' : 'text-gray-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

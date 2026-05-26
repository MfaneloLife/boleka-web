"use client";

import { useState, useRef } from 'react';
import { PaperAirplaneIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      await onSendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 relative">
        {selectedFile && (
          <div className="mb-2 text-xs text-gray-500 flex items-center gap-2">
            <span className="bg-gray-100 px-2 py-1 rounded">📎 {selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
          aria-label="Attach image"
        >
          <PhotoIcon className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={(!message.trim() && !selectedFile) || sending}
          className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </form>
  );
}

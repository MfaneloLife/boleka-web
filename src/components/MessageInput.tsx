'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => void;
}

export default function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {selectedFile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-xl">
          <Paperclip className="w-4 h-4 text-orange-500 shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-0.5 text-gray-400 hover:text-red-500 transition-colors shrink-0"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none transition-colors"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
        />

        <label className="cursor-pointer shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isSubmitting}
            aria-label="Upload image"
          />
          <span className="inline-flex items-center justify-center p-2.5 border border-gray-300 rounded-xl text-gray-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors">
            <Paperclip className="w-5 h-5" />
          </span>
        </label>

        <button
          type="submit"
          disabled={(!message.trim() && !selectedFile) || isSubmitting}
          className="flex items-center gap-1.5 shrink-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:from-orange-600 hover:to-amber-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send</span>
        </button>
      </div>
    </form>
  );
}
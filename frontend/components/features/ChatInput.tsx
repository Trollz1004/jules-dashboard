'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from '@/hooks/useDebounce';

interface ChatInputProps {
  onSend: (message: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onImageUpload?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  onTypingStart,
  onTypingStop,
  onImageUpload,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedTypingStop = useDebouncedCallback(() => {
    onTypingStop?.();
  }, 1000);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }

    // Handle typing indicators
    if (value.length > 0) {
      onTypingStart?.();
      debouncedTypingStop();
    } else {
      onTypingStop?.();
    }
  };

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSend(trimmedMessage);
      setMessage('');
      onTypingStop?.();

      // Reset textarea height
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  }, [message, disabled, onSend, onTypingStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2 p-4 bg-white border-t border-dark-100',
        className
      )}
    >
      {/* Image upload button */}
      {onImageUpload && (
        <>
          <button
            onClick={handleImageClick}
            disabled={disabled}
            className="p-2 rounded-full text-dark-400 hover:text-primary-500 hover:bg-dark-50 transition-colors disabled:opacity-50"
            aria-label="Upload image"
          >
            <ImageIcon className="w-6 h-6" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      {/* Message input */}
      <div
        className={cn(
          'flex-1 relative bg-dark-50 rounded-2xl transition-all duration-200',
          isFocused && 'ring-2 ring-primary-500/20 bg-white'
        )}
      >
        <textarea
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            'w-full px-4 py-3 bg-transparent text-dark-900 placeholder:text-dark-400',
            'resize-none focus:outline-none disabled:opacity-50',
            'max-h-[120px]'
          )}
        />
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className={cn(
          'p-3 rounded-full transition-all duration-200',
          message.trim()
            ? 'bg-love-gradient text-white shadow-glow hover:shadow-glow-lg hover:scale-105'
            : 'bg-dark-100 text-dark-400'
        )}
        aria-label="Send message"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}

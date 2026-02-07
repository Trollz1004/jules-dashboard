'use client';

import Image from 'next/image';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/api';

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  className?: string;
}

export function ChatBubble({
  message,
  isOwn,
  showTimestamp = false,
  className,
}: ChatBubbleProps) {
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="relative w-48 h-48 rounded-xl overflow-hidden">
            <Image
              src={message.content}
              alt="Shared image"
              fill
              className="object-cover"
            />
          </div>
        );
      case 'gif':
        return (
          <div className="relative w-48 h-auto rounded-xl overflow-hidden">
            <Image
              src={message.content}
              alt="GIF"
              width={192}
              height={192}
              className="w-full h-auto"
              unoptimized
            />
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div
      className={cn(
        'flex',
        isOwn ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 rounded-2xl',
          isOwn
            ? 'bg-love-gradient text-white rounded-br-md'
            : 'bg-dark-100 text-dark-900 rounded-bl-md',
          message.type !== 'text' && 'p-1'
        )}
      >
        {renderContent()}

        {/* Timestamp and read status */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={cn(
              'text-xs',
              isOwn ? 'text-white/70' : 'text-dark-400'
            )}
          >
            {timestamp}
          </span>
          {isOwn && (
            message.readAt ? (
              <CheckCheck className="w-3.5 h-3.5 text-white/70" />
            ) : (
              <Check className="w-3.5 h-3.5 text-white/70" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div className="bg-dark-100 text-dark-900 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="typing-indicator text-dark-400">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

interface DateDividerProps {
  date: string;
  className?: string;
}

export function DateDivider({ date, className }: DateDividerProps) {
  return (
    <div className={cn('flex items-center justify-center my-4', className)}>
      <div className="px-4 py-1 rounded-full bg-dark-100 text-dark-500 text-xs font-medium">
        {date}
      </div>
    </div>
  );
}

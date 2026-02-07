'use client';

import { useRouter } from 'next/navigation';
import { Avatar, Badge } from '@/components/ui';
import { Match } from '@/lib/api';
import { formatLastActive, formatMessageTime, truncateText } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  isOnline?: boolean;
  currentUserId?: string;
  className?: string;
}

export function MatchCard({ match, isOnline, currentUserId, className }: MatchCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/${match.id}`);
  };

  const isOwnMessage = match.lastMessage?.senderId === currentUserId;
  const messagePreview = match.lastMessage
    ? truncateText(match.lastMessage.content, 40)
    : 'Start a conversation!';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200',
        'hover:bg-dark-50 active:bg-dark-100',
        className
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <Avatar
          src={match.user.photos[0]?.url}
          name={match.user.name}
          size="lg"
          isOnline={isOnline}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-dark-900 truncate">
            {match.user.name}
          </h3>
          {match.lastMessage && (
            <span className="text-xs text-dark-400 shrink-0">
              {formatMessageTime(match.lastMessage.createdAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              'text-sm truncate',
              match.unreadCount > 0
                ? 'text-dark-900 font-medium'
                : 'text-dark-500'
            )}
          >
            {isOwnMessage && <span className="text-dark-400">You: </span>}
            {messagePreview}
          </p>

          {match.unreadCount > 0 && (
            <Badge variant="primary" size="sm" className="shrink-0">
              {match.unreadCount > 99 ? '99+' : match.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

interface NewMatchCardProps {
  match: Match;
  onClick?: () => void;
  className?: string;
}

export function NewMatchCard({ match, onClick, className }: NewMatchCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-2',
        className
      )}
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary-500 p-0.5">
          <Avatar
            src={match.user.photos[0]?.url}
            name={match.user.name}
            size="lg"
            className="w-full h-full"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-love-gradient rounded-full flex items-center justify-center">
          <span className="text-white text-xs">NEW</span>
        </div>
      </div>
      <span className="text-sm font-medium text-dark-900 truncate max-w-[80px]">
        {match.user.name}
      </span>
    </button>
  );
}

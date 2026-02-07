'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MoreVertical, Phone, Video, Shield, Flag, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Modal, Button, SkeletonMessage } from '@/components/ui';
import { ChatBubble, ChatInput, TypingIndicator, DateDivider } from '@/components/features';
import { useChatStore } from '@/stores/chatStore';
import { useMatchesStore } from '@/stores/matchesStore';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { formatLastActive } from '@/lib/utils';
import { useState } from 'react';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const { user } = useAuthStore();
  const { matches, onlineUsers, markAsRead, unmatch } = useMatchesStore();
  const {
    messages,
    currentMatch,
    isLoading,
    typingUsers,
    loadMessages,
    sendMessage,
    setCurrentMatch,
    startTyping,
    stopTyping,
    initializeSocketListeners,
    clearChat,
  } = useChatStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUnmatchModal, setShowUnmatchModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Find match from store
  const match = matches.find((m) => m.id === matchId);
  const isOnline = match ? onlineUsers.has(match.user.id) : false;
  const isTyping = match ? typingUsers.has(match.user.id) : false;

  useEffect(() => {
    if (match) {
      setCurrentMatch(match);
      loadMessages(matchId);
      markAsRead(matchId);

      const cleanup = initializeSocketListeners();
      return () => {
        cleanup();
        clearChat();
      };
    }
  }, [match, matchId, setCurrentMatch, loadMessages, markAsRead, initializeSocketListeners, clearChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      await sendMessage(content);
    },
    [sendMessage]
  );

  const handleUnmatch = async () => {
    try {
      await unmatch(matchId);
      toast.success('Unmatched successfully');
      router.push('/matches');
    } catch {
      toast.error('Failed to unmatch');
    }
  };

  const handleReport = async (reason: string) => {
    if (!match) return;
    try {
      await api.reportUser(match.user.id, reason);
      toast.success('Report submitted. Thank you for keeping Spark safe.');
      setShowReportModal(false);
    } catch {
      toast.error('Failed to submit report');
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-dark-500 mb-4">Match not found</p>
          <Link href="/matches" className="btn-primary btn-md">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-dark-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/matches')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-100 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-dark-700" />
            </button>

            <Link href={`/profile/${match.user.id}`} className="flex items-center gap-3">
              <Avatar
                src={match.user.photos[0]?.url}
                name={match.user.name}
                size="md"
                isOnline={isOnline}
              />
              <div>
                <h1 className="font-semibold text-dark-900">{match.user.name}</h1>
                <p className="text-sm text-dark-500">
                  {isTyping
                    ? 'Typing...'
                    : isOnline
                    ? 'Online'
                    : `Active ${formatLastActive(match.user.lastActive)}`}
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-dark-100 transition-colors">
              <Phone className="w-5 h-5 text-dark-500" />
            </button>
            <button className="p-2 rounded-full hover:bg-dark-100 transition-colors">
              <Video className="w-5 h-5 text-dark-500" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full hover:bg-dark-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-dark-500" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-dark-100 py-2 z-20">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowReportModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-dark-700 hover:bg-dark-50"
                    >
                      <Flag className="w-5 h-5" />
                      Report
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowUnmatchModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <UserX className="w-5 h-5" />
                      Unmatch
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Safety notice */}
        <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-2xl mb-6">
          <Shield className="w-5 h-5 text-primary-600 mt-0.5" />
          <div>
            <p className="text-sm text-primary-900">
              Stay safe! Never share personal information like your address or financial details.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonMessage key={i} isOwn={i % 2 === 0} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Avatar
              src={match.user.photos[0]?.url}
              name={match.user.name}
              size="xl"
              className="mx-auto mb-4"
            />
            <h3 className="text-xl font-semibold text-dark-900 mb-2">
              You matched with {match.user.name}!
            </h3>
            <p className="text-dark-500">
              Say hi and start the conversation
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date}>
              <DateDivider date={date} />
              <div className="space-y-2">
                {dayMessages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onTypingStart={startTyping}
        onTypingStop={stopTyping}
        placeholder={`Message ${match.user.name}...`}
      />

      {/* Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Report User"
        description="Why are you reporting this user?"
      >
        <div className="space-y-2 mt-4">
          {[
            { value: 'inappropriate_photos', label: 'Inappropriate photos' },
            { value: 'inappropriate_messages', label: 'Inappropriate messages' },
            { value: 'fake_profile', label: 'Fake profile' },
            { value: 'spam', label: 'Spam or scam' },
            { value: 'other', label: 'Other' },
          ].map((reason) => (
            <button
              key={reason.value}
              onClick={() => handleReport(reason.value)}
              className="w-full p-4 text-left rounded-xl border border-dark-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              {reason.label}
            </button>
          ))}
        </div>
      </Modal>

      {/* Unmatch Modal */}
      <Modal
        isOpen={showUnmatchModal}
        onClose={() => setShowUnmatchModal(false)}
        title="Unmatch"
        description={`Are you sure you want to unmatch with ${match.user.name}? This cannot be undone.`}
      >
        <div className="flex gap-4 mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowUnmatchModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleUnmatch}
          >
            Unmatch
          </Button>
        </div>
      </Modal>
    </div>
  );
}

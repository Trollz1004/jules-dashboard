'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { Match } from '@/lib/api';
import { cn } from '@/lib/utils';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  currentUserPhoto?: string;
}

export function MatchModal({
  isOpen,
  onClose,
  match,
  currentUserPhoto,
}: MatchModalProps) {
  const router = useRouter();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay content animation
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (match) {
      router.push(`/chat/${match.id}`);
      onClose();
    }
  };

  if (!match) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="lg">
      <div className="text-center py-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-dark-100 transition-colors"
        >
          <X className="w-6 h-6 text-dark-500" />
        </button>

        {/* Hearts animation */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="mb-6"
            >
              <div className="relative inline-flex items-center justify-center">
                {/* Floating hearts */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [-20, -80],
                      scale: [0.5, 1],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="absolute text-primary-500"
                    style={{
                      left: `${50 + (i - 2.5) * 20}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <Heart className="w-6 h-6 fill-current" />
                  </motion.div>
                ))}

                {/* Profile photos */}
                <div className="flex items-center justify-center">
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Avatar
                      src={currentUserPhoto}
                      name="You"
                      size="xl"
                      className="border-4 border-white shadow-lg"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="relative z-10 -mx-4 w-16 h-16 bg-love-gradient rounded-full flex items-center justify-center shadow-glow"
                  >
                    <Heart className="w-8 h-8 text-white fill-current animate-heart-beat" />
                  </motion.div>

                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Avatar
                      src={match.user.photos[0]?.url}
                      name={match.user.name}
                      size="xl"
                      className="border-4 border-white shadow-lg"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-3xl font-bold gradient-text mb-2">
            It's a Match!
          </h2>
          <p className="text-dark-500">
            You and {match.user.name} have liked each other
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<MessageCircle className="w-5 h-5" />}
            onClick={handleSendMessage}
          >
            Send Message
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            Keep Swiping
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
}

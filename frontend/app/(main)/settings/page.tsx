'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  User,
  Bell,
  Shield,
  Eye,
  CreditCard,
  HelpCircle,
  FileText,
  Mail,
  Trash2,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Toggle } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notifications, setNotifications] = useState({
    matches: user?.settings?.notifications?.matches ?? true,
    messages: user?.settings?.notifications?.messages ?? true,
    likes: user?.settings?.notifications?.likes ?? true,
  });

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));

    try {
      await api.updateSettings({
        ...user?.settings!,
        notifications: {
          ...notifications,
          [key]: value,
        },
      });
    } catch {
      // Revert on error
      setNotifications((prev) => ({ ...prev, [key]: !value }));
      toast.error('Failed to update settings');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      toast.success('Account deleted');
      router.push('/');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Account Settings',
          description: 'Email, phone number, password',
          href: '/settings/account',
        },
        {
          icon: CreditCard,
          label: 'Subscription',
          description: user?.isPremium ? 'Premium Member' : 'Free',
          href: '/settings/subscription',
        },
      ],
    },
    {
      title: 'Discovery',
      items: [
        {
          icon: Eye,
          label: 'Discovery Preferences',
          description: 'Age, distance, who you see',
          href: '/settings/preferences',
        },
      ],
    },
    {
      title: 'Privacy & Safety',
      items: [
        {
          icon: Shield,
          label: 'Privacy',
          description: 'Visibility, data, blocked users',
          href: '/settings/privacy',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          description: 'FAQ, contact us',
          href: '/settings/help',
        },
        {
          icon: FileText,
          label: 'Legal',
          description: 'Terms, privacy policy',
          href: '/settings/legal',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-dark-100 safe-top">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-dark-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-dark-700" />
          </button>
          <h1 className="text-xl font-semibold text-dark-900">Settings</h1>
        </div>
      </header>

      <main className="pb-8">
        {/* Notifications Section */}
        <section className="bg-white mt-4">
          <div className="px-4 py-3 border-b border-dark-100">
            <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
              Notifications
            </h2>
          </div>
          <div className="divide-y divide-dark-100">
            <div className="px-4 py-4">
              <Toggle
                label="New Matches"
                description="Get notified when you have a new match"
                checked={notifications.matches}
                onChange={(value) => handleNotificationChange('matches', value)}
              />
            </div>
            <div className="px-4 py-4">
              <Toggle
                label="Messages"
                description="Get notified when you receive a message"
                checked={notifications.messages}
                onChange={(value) => handleNotificationChange('messages', value)}
              />
            </div>
            <div className="px-4 py-4">
              <Toggle
                label="Likes"
                description="Get notified when someone likes you"
                checked={notifications.likes}
                onChange={(value) => handleNotificationChange('likes', value)}
              />
            </div>
          </div>
        </section>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <section key={section.title} className="bg-white mt-4">
            <div className="px-4 py-3 border-b border-dark-100">
              <h2 className="text-sm font-semibold text-dark-500 uppercase tracking-wider">
                {section.title}
              </h2>
            </div>
            <div className="divide-y divide-dark-100">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-dark-600" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-900">{item.label}</p>
                      <p className="text-sm text-dark-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-dark-400" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Actions */}
        <section className="mt-8 px-4 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dark-200 text-dark-600 hover:bg-dark-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </section>

        {/* App Version */}
        <p className="text-center text-dark-400 text-sm mt-8">
          Spark v1.0.0
        </p>
      </main>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        description="This action cannot be undone. All your data, matches, and messages will be permanently deleted."
      >
        <div className="flex gap-4 mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Edit3,
  ChevronRight,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Camera,
  Shield,
  Star,
  LogOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar, Badge, Button, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { formatAge } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  if (!user) return null;

  const photos = user.photos || [];
  const age = user.birthday ? formatAge(user.birthday) : null;

  return (
    <div className="min-h-screen bg-dark-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-dark-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-2xl font-bold text-dark-900">Profile</h1>
          <Link
            href="/settings"
            className="p-2 rounded-full hover:bg-dark-100 transition-colors"
          >
            <Settings className="w-6 h-6 text-dark-700" />
          </Link>
        </div>
      </header>

      <main className="pb-8">
        {/* Profile Card */}
        <div className="bg-white">
          {/* Photos */}
          <div className="relative aspect-square max-h-[400px]">
            {photos.length > 0 ? (
              <>
                <Image
                  src={photos[currentPhotoIndex].url}
                  alt={user.name}
                  fill
                  className="object-cover"
                />

                {/* Photo indicators */}
                {photos.length > 1 && (
                  <div className="absolute top-4 left-4 right-4 flex gap-1">
                    {photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={`flex-1 h-1 rounded-full transition-all ${
                          index === currentPhotoIndex
                            ? 'bg-white'
                            : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Edit button */}
                <Link
                  href="/profile/edit"
                  className="absolute bottom-4 right-4 p-3 rounded-full bg-white shadow-lg hover:bg-dark-50 transition-colors"
                >
                  <Edit3 className="w-5 h-5 text-dark-700" />
                </Link>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-400 to-secondary-500 flex flex-col items-center justify-center text-white">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <Link href="/profile/edit" className="btn-secondary btn-md">
                  Add Photos
                </Link>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark-900">
                  {user.name}
                  {age && <span className="font-normal">, {age}</span>}
                </h2>

                {user.location?.city && (
                  <div className="flex items-center gap-1 mt-1 text-dark-500">
                    <MapPin className="w-4 h-4" />
                    <span>{user.location.city}</span>
                  </div>
                )}
              </div>

              {user.isPremium && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Premium
                </Badge>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-4 text-dark-600">{user.bio}</p>
            )}

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {user.interests.map((interest, index) => (
                  <Badge key={index} variant="primary" size="md">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 bg-white">
          <Link
            href="/profile/edit"
            className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-dark-900">Edit Profile</p>
                <p className="text-sm text-dark-500">Update your photos and info</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-dark-400" />
          </Link>

          <Link
            href="/settings/preferences"
            className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors border-t border-dark-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-secondary-600" />
              </div>
              <div>
                <p className="font-medium text-dark-900">Discovery Preferences</p>
                <p className="text-sm text-dark-500">Age, distance, and more</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-dark-400" />
          </Link>

          <Link
            href="/settings"
            className="flex items-center justify-between p-4 hover:bg-dark-50 transition-colors border-t border-dark-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center">
                <Settings className="w-5 h-5 text-dark-600" />
              </div>
              <div>
                <p className="font-medium text-dark-900">Settings</p>
                <p className="text-sm text-dark-500">Account, notifications, privacy</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-dark-400" />
          </Link>
        </div>

        {/* Premium Banner */}
        {!user.isPremium && (
          <div className="mt-4 mx-4 bg-love-gradient rounded-2xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Upgrade to Premium</h3>
                <p className="text-white/80 text-sm mt-1">
                  See who likes you, get unlimited swipes, and more!
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4 bg-white text-primary-600 hover:bg-white/90"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="mt-4 px-4">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dark-200 text-dark-600 hover:bg-dark-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </main>

      {/* Logout Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
        description="Are you sure you want to log out?"
      >
        <div className="flex gap-4 mt-6">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </Modal>
    </div>
  );
}

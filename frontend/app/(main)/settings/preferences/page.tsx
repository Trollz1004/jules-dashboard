'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Slider, Toggle } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { SHOW_ME } from '@/lib/utils';

export default function PreferencesPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [preferences, setPreferences] = useState({
    showMe: user?.settings?.showMe || 'everyone',
    ageRange: user?.settings?.ageRange || { min: 18, max: 50 },
    maxDistance: user?.settings?.maxDistance || 50,
    showDistance: user?.settings?.showDistance ?? true,
    showAge: user?.settings?.showAge ?? true,
  });

  const handleChange = <K extends keyof typeof preferences>(
    key: K,
    value: typeof preferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await api.updateSettings({
        showMe: preferences.showMe as 'men' | 'women' | 'everyone',
        ageRange: preferences.ageRange,
        maxDistance: preferences.maxDistance,
        showDistance: preferences.showDistance,
        showAge: preferences.showAge,
        notifications: user?.settings?.notifications || {
          matches: true,
          messages: true,
          likes: true,
        },
      });
      updateUser(updatedUser);
      toast.success('Preferences saved!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-dark-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-dark-100 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-dark-700" />
          </button>
          <h1 className="text-lg font-semibold text-dark-900">Discovery Preferences</h1>
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="p-2 -mr-2 rounded-full text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Check className="w-6 h-6" />
              )}
            </button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-8">
        {/* Show Me */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Show Me</h2>
          <div className="space-y-2">
            {SHOW_ME.map((option) => {
              const value = option.toLowerCase() as 'men' | 'women' | 'everyone';
              return (
                <button
                  key={option}
                  onClick={() => handleChange('showMe', value)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    preferences.showMe === value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dark-200 hover:border-dark-300'
                  }`}
                >
                  <span className={preferences.showMe === value ? 'text-primary-700' : 'text-dark-700'}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Age Range */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Age Range</h2>
          <Slider
            min={18}
            max={100}
            value={[preferences.ageRange.min, preferences.ageRange.max]}
            onChange={(value) => {
              if (Array.isArray(value)) {
                handleChange('ageRange', { min: value[0], max: value[1] });
              }
            }}
            formatValue={(v) => `${v} years`}
          />
          <p className="text-sm text-dark-500 mt-4">
            You'll see people between {preferences.ageRange.min} and {preferences.ageRange.max} years old
          </p>
        </section>

        {/* Distance */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Maximum Distance</h2>
          <Slider
            min={1}
            max={500}
            value={preferences.maxDistance}
            onChange={(value) => {
              if (typeof value === 'number') {
                handleChange('maxDistance', value);
              }
            }}
            formatValue={(v) => `${v} km`}
          />
          <p className="text-sm text-dark-500 mt-4">
            You'll see people within {preferences.maxDistance} km of your location
          </p>
        </section>

        {/* Privacy Options */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Show on Profile</h2>
          <div className="space-y-4">
            <Toggle
              label="Show my distance"
              description="Others will see how far away you are"
              checked={preferences.showDistance}
              onChange={(value) => handleChange('showDistance', value)}
            />
            <Toggle
              label="Show my age"
              description="Others will see your age on your profile"
              checked={preferences.showAge}
              onChange={(value) => handleChange('showAge', value)}
            />
          </div>
        </section>

        {/* Save Button (for mobile) */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full btn-primary btn-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        )}
      </main>
    </div>
  );
}

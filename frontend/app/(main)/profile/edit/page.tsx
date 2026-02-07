'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { PhotoUpload, InterestPicker } from '@/components/features';
import { useAuthStore } from '@/stores/authStore';
import api, { Photo } from '@/lib/api';
import { profileSchema, ProfileInput } from '@/lib/validations';
import { GENDERS, RELATIONSHIP_GOALS } from '@/lib/utils';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [photos, setPhotos] = useState<Photo[]>(user?.photos || []);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      birthday: user?.birthday || '',
      gender: (user?.gender as ProfileInput['gender']) || undefined,
      bio: user?.bio || '',
      interests: user?.interests || [],
      jobTitle: (user as { jobTitle?: string })?.jobTitle || '',
      company: (user as { company?: string })?.company || '',
      school: (user as { school?: string })?.school || '',
      relationshipGoal: (user as { relationshipGoal?: string })?.relationshipGoal as ProfileInput['relationshipGoal'] || undefined,
    },
  });

  const selectedInterests = watch('interests');

  const handlePhotoUpload = async (file: File, position: number) => {
    try {
      const result = await api.uploadPhoto(file, position);
      const newPhoto = { id: result.url, url: result.url, position };
      setPhotos((prev) => [...prev, newPhoto]);
    } catch {
      toast.error('Failed to upload photo');
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      await api.deletePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch {
      toast.error('Failed to delete photo');
    }
  };

  const onSubmit = async (data: ProfileInput) => {
    setIsLoading(true);
    try {
      const updatedUser = await api.updateProfile(data);
      updateUser(updatedUser);
      toast.success('Profile updated!');
      router.push('/profile');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

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
          <h1 className="text-lg font-semibold text-dark-900">Edit Profile</h1>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="p-2 -mr-2 rounded-full text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Check className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      <main className="p-4 space-y-8 pb-8">
        {/* Photos */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Photos</h2>
          <PhotoUpload
            photos={photos}
            onUpload={handlePhotoUpload}
            onDelete={handlePhotoDelete}
          />
        </section>

        {/* Basic Info */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">About Me</h2>
          <div className="space-y-4">
            <Input
              label="Name"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Birthday"
              type="date"
              error={errors.birthday?.message}
              {...register('birthday')}
            />

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setValue('gender', gender as ProfileInput['gender'], { shouldDirty: true })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      watch('gender') === gender
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-dark-200 text-dark-700 hover:border-dark-300'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Bio
              </label>
              <textarea
                {...register('bio')}
                placeholder="Write something about yourself..."
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-3 text-dark-900 placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
              <p className="text-sm text-dark-400 mt-1 text-right">
                {(watch('bio') || '').length}/500
              </p>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Interests</h2>
          <InterestPicker
            selected={selectedInterests || []}
            onChange={(interests) => setValue('interests', interests, { shouldDirty: true })}
          />
        </section>

        {/* Looking For */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Looking For</h2>
          <div className="space-y-2">
            {RELATIONSHIP_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setValue('relationshipGoal', goal as ProfileInput['relationshipGoal'], { shouldDirty: true })}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  watch('relationshipGoal') === goal
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-dark-200 hover:border-dark-300'
                }`}
              >
                <span className={watch('relationshipGoal') === goal ? 'text-primary-700' : 'text-dark-700'}>
                  {goal}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Work & Education */}
        <section>
          <h2 className="text-lg font-semibold text-dark-900 mb-4">Work & Education</h2>
          <div className="space-y-4">
            <Input
              label="Job Title"
              placeholder="Software Engineer"
              {...register('jobTitle')}
            />

            <Input
              label="Company"
              placeholder="Google"
              {...register('company')}
            />

            <Input
              label="School"
              placeholder="Stanford University"
              {...register('school')}
            />
          </div>
        </section>

        {/* Save Button */}
        <Button
          type="button"
          fullWidth
          size="lg"
          isLoading={isLoading}
          onClick={handleSubmit(onSubmit)}
        >
          Save Changes
        </Button>
      </main>
    </div>
  );
}

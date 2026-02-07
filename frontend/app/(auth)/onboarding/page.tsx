'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Camera, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { PhotoUpload, InterestPicker } from '@/components/features';
import { useAuthStore } from '@/stores/authStore';
import api, { Photo } from '@/lib/api';
import { GENDERS, RELATIONSHIP_GOALS } from '@/lib/utils';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    photos: [] as Photo[],
    gender: '',
    bio: '',
    interests: [] as string[],
    jobTitle: '',
    company: '',
    school: '',
    relationshipGoal: '',
  });

  const totalSteps = 5;

  const handlePhotoUpload = async (file: File, position: number) => {
    try {
      const result = await api.uploadPhoto(file, position);
      setFormData((prev) => ({
        ...prev,
        photos: [
          ...prev.photos,
          { id: result.url, url: result.url, position },
        ],
      }));
    } catch (err) {
      toast.error('Failed to upload photo');
    }
  };

  const handlePhotoDelete = async (photoId: string) => {
    try {
      await api.deletePhoto(photoId);
      setFormData((prev) => ({
        ...prev,
        photos: prev.photos.filter((p) => p.id !== photoId),
      }));
    } catch (err) {
      toast.error('Failed to delete photo');
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const updatedUser = await api.updateProfile({
        gender: formData.gender,
        bio: formData.bio,
        interests: formData.interests,
        jobTitle: formData.jobTitle,
        company: formData.company,
        school: formData.school,
        relationshipGoal: formData.relationshipGoal,
      });
      updateUser(updatedUser);
      toast.success('Profile created! Start discovering matches.');
      router.push('/discover');
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.photos.length >= 1;
      case 2:
        return formData.gender !== '';
      case 3:
        return formData.interests.length >= 3;
      case 4:
        return true; // Bio is optional
      case 5:
        return true; // Work/education is optional
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary-500 fill-current" />
          <span className="text-2xl font-bold gradient-text">Spark</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-1 rounded-full transition-colors ${
                i < step ? 'bg-primary-500' : 'bg-dark-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Photos */}
          {step === 1 && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-dark-900">Add your photos</h1>
                <p className="text-dark-500 mt-2">
                  Add at least 1 photo to get started
                </p>
              </div>

              <PhotoUpload
                photos={formData.photos}
                onUpload={handlePhotoUpload}
                onDelete={handlePhotoDelete}
              />
            </motion.div>
          )}

          {/* Step 2: Gender */}
          {step === 2 && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark-900">I am a...</h1>
                <p className="text-dark-500 mt-2">
                  Select the option that best describes you
                </p>
              </div>

              <div className="space-y-3 max-w-md mx-auto">
                {GENDERS.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setFormData({ ...formData, gender })}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.gender === gender
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dark-200 hover:border-dark-300'
                    }`}
                  >
                    <span className={`font-medium ${
                      formData.gender === gender ? 'text-primary-700' : 'text-dark-900'
                    }`}>
                      {gender}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark-900">Your interests</h1>
                <p className="text-dark-500 mt-2">
                  Pick at least 3 things you love
                </p>
              </div>

              <InterestPicker
                selected={formData.interests}
                onChange={(interests) => setFormData({ ...formData, interests })}
              />
            </motion.div>
          )}

          {/* Step 4: Bio */}
          {step === 4 && (
            <motion.div
              key="bio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark-900">About you</h1>
                <p className="text-dark-500 mt-2">
                  Write a short bio to let others know who you are
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="I love hiking, cooking, and spontaneous adventures..."
                  maxLength={500}
                  rows={6}
                  className="w-full rounded-xl border-2 border-dark-200 bg-white px-4 py-3 text-dark-900 placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
                <p className="text-sm text-dark-400 mt-2 text-right">
                  {formData.bio.length}/500
                </p>

                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-dark-700">Looking for:</p>
                  {RELATIONSHIP_GOALS.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setFormData({ ...formData, relationshipGoal: goal })}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        formData.relationshipGoal === goal
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-dark-200 hover:border-dark-300'
                      }`}
                    >
                      <span className={`text-sm ${
                        formData.relationshipGoal === goal ? 'text-primary-700' : 'text-dark-700'
                      }`}>
                        {goal}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Work & Education */}
          {step === 5 && (
            <motion.div
              key="work"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-dark-900">Work & Education</h1>
                <p className="text-dark-500 mt-2">
                  Optional, but helps others know more about you
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <Input
                  label="Job Title"
                  placeholder="Software Engineer"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                />

                <Input
                  label="Company"
                  placeholder="Google"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />

                <Input
                  label="School"
                  placeholder="Stanford University"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-4 mt-8 pt-4 border-t border-dark-100">
          {step > 1 && (
            <Button variant="secondary" size="lg" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              fullWidth
              size="lg"
              onClick={handleNext}
              disabled={!canProceed()}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Continue
            </Button>
          ) : (
            <Button
              fullWidth
              size="lg"
              onClick={handleComplete}
              isLoading={isLoading}
              rightIcon={!isLoading && <Check className="w-5 h-5" />}
            >
              Complete Profile
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

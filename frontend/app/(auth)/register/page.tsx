'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Mail, Lock, User, Calendar, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { registerSchema, RegisterInput } from '@/lib/validations';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password?.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password || '') },
    { label: 'One lowercase letter', met: /[a-z]/.test(password || '') },
    { label: 'One number', met: /[0-9]/.test(password || '') },
  ];

  const handleNextStep = async () => {
    let valid = false;
    if (step === 1) {
      valid = await trigger(['name', 'birthday']);
    } else if (step === 2) {
      valid = await trigger(['email']);
    }
    if (valid) setStep(step + 1);
  };

  const onSubmit = async (data: RegisterInput) => {
    try {
      clearError();
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        birthday: data.birthday,
      });
      toast.success('Account created! Let\'s set up your profile.');
      router.push('/onboarding');
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary-500 fill-current" />
          <span className="text-2xl font-bold gradient-text">Spark</span>
        </Link>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary-500' : 'bg-dark-200'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-dark-900">What's your name?</h1>
                  <p className="text-dark-500 mt-2">
                    This is how you'll appear on Spark
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Name"
                    placeholder="Enter your first name"
                    leftIcon={<User className="w-5 h-5" />}
                    error={errors.name?.message}
                    {...register('name')}
                  />

                  <Input
                    label="Birthday"
                    type="date"
                    leftIcon={<Calendar className="w-5 h-5" />}
                    error={errors.birthday?.message}
                    hint="You must be at least 18 years old"
                    {...register('birthday')}
                  />
                </div>

                <Button
                  type="button"
                  fullWidth
                  size="lg"
                  className="mt-8"
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Email */}
            {step === 2 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-dark-900">Your email</h1>
                  <p className="text-dark-500 mt-2">
                    You'll use this to sign in to your account
                  </p>
                </div>

                <Input
                  label="Email"
                  type="email"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="flex gap-4 mt-8">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    size="lg"
                    onClick={handleNextStep}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {step === 3 && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-dark-900">Create a password</h1>
                  <p className="text-dark-500 mt-2">
                    Make sure it's secure and memorable
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.password?.message}
                    {...register('password')}
                  />

                  {/* Password requirements */}
                  <div className="grid grid-cols-2 gap-2">
                    {passwordRequirements.map((req, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 text-sm ${
                          req.met ? 'text-green-600' : 'text-dark-400'
                        }`}
                      >
                        <Check className={`w-4 h-4 ${req.met ? 'opacity-100' : 'opacity-30'}`} />
                        {req.label}
                      </div>
                    ))}
                  </div>

                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-3 p-4 bg-dark-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 mt-0.5 rounded border-dark-300 text-primary-500 focus:ring-primary-500"
                      {...register('agreeToTerms')}
                    />
                    <span className="text-sm text-dark-600">
                      I agree to Spark's{' '}
                      <Link href="/terms" className="text-primary-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-primary-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
                  )}
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm mt-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    isLoading={isSubmitting || isLoading}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Sign in link */}
          <p className="text-center mt-8 text-dark-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

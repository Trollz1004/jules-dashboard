'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Mail, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import api from '@/lib/api';
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validations';

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await api.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to send reset email');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="p-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary-500 fill-current" />
            <span className="text-2xl font-bold gradient-text">Spark</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-dark-900">Check your email</h1>
            <p className="text-dark-500 mt-4">
              We've sent a password reset link to{' '}
              <span className="font-semibold text-dark-900">{submittedEmail}</span>
            </p>

            <p className="text-dark-400 text-sm mt-6">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-primary-600 hover:underline font-medium"
              >
                try again
              </button>
            </p>

            <Link href="/login">
              <Button variant="secondary" size="lg" className="mt-8">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to login
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary-500 fill-current" />
          <span className="text-2xl font-bold gradient-text">Spark</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-dark-600 hover:text-dark-900 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to login
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-dark-900">Forgot password?</h1>
            <p className="text-dark-500 mt-2">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              Reset password
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

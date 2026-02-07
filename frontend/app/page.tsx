'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Shield, Sparkles, ArrowRight, Star, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/discover');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-16 h-16 text-primary-500 animate-heart-beat" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-primary-500 fill-current" />
              <span className="text-2xl font-bold gradient-text">Spark</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-dark-600 hover:text-dark-900 font-medium hidden sm:block"
              >
                Log in
              </Link>
              <Link href="/register">
                <Button size="sm">Create account</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-200 rounded-full blur-3xl opacity-30 -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-dark-900 leading-tight">
                Find your
                <span className="gradient-text block">perfect match</span>
              </h1>
              <p className="mt-6 text-xl text-dark-600 max-w-lg">
                Join millions of people discovering meaningful connections every day.
                Your next great story starts here.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="xl">
                    I have an account
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-8">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 border-2 border-white"
                    />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-dark-500">Loved by 2M+ users</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-80 h-[500px] mx-auto">
                {/* Phone mockup */}
                <div className="absolute inset-0 bg-dark-900 rounded-[3rem] shadow-2xl overflow-hidden">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-dark-800 rounded-full" />
                  <div className="absolute inset-4 top-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-[2rem]">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold">Sarah, 26</h3>
                      <p className="text-white/80">2 km away</p>
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <Heart className="w-8 h-8 text-primary-500 fill-current" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-900">Why choose Spark?</h2>
            <p className="mt-4 text-xl text-dark-600">
              We're not just another dating app. We're your path to meaningful connections.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: 'Safe & Verified',
                description: 'Every profile is verified. Chat with confidence knowing you\'re talking to real people.',
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: 'Smart Matching',
                description: 'Our AI-powered algorithm learns your preferences to show you the best matches.',
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: 'Real Conversations',
                description: 'Break the ice with our conversation starters and build genuine connections.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-card"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-dark-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-love-gradient text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10M+', label: 'Downloads' },
              { value: '500K+', label: 'Matches Daily' },
              { value: '150+', label: 'Countries' },
              { value: '4.8', label: 'App Store Rating' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-4xl md:text-5xl font-bold">{stat.value}</div>
                <div className="text-white/80 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-900">Success Stories</h2>
            <p className="mt-4 text-xl text-dark-600">
              Real couples who found love on Spark
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'I never thought I would find someone so perfect for me. Spark changed my life!',
                name: 'Emma & James',
                info: 'Together for 2 years',
              },
              {
                quote: 'We matched on our first day and knew instantly. Now we are engaged!',
                name: 'Michael & Sarah',
                info: 'Engaged',
              },
              {
                quote: 'From the first message to our wedding day, Spark made it all possible.',
                name: 'David & Lisa',
                info: 'Married',
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 shadow-card border border-dark-100"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-dark-700 text-lg mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 border-2 border-white" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 border-2 border-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-900">{testimonial.name}</p>
                    <p className="text-sm text-dark-500">{testimonial.info}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-dark-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to find your spark?
          </h2>
          <p className="text-xl text-dark-300 mb-8">
            Join millions of people who have already found their perfect match.
            Your story is waiting to be written.
          </p>
          <Link href="/register">
            <Button size="xl" rightIcon={<ArrowRight className="w-5 h-5" />}>
              Start for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-dark-950 text-dark-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary-500 fill-current" />
              <span className="text-xl font-bold text-white">Spark</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/about" className="hover:text-white transition-colors">About</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/legal" className="hover:text-white transition-colors">Legal</Link>
              <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>

            <p className="text-sm">
              © {new Date().getFullYear()} Spark. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

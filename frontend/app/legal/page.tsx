import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal Notice & Disclaimer - YouAndINotAI',
  description: 'Legal notice and disclaimer for YouAndINotAI.com',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-primary-500 fill-current" />
              <span className="text-2xl font-bold gradient-text">Spark</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-2 text-dark-600 hover:text-dark-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-900 mb-12">
            Legal Notice & Disclaimer
          </h1>

          <div className="space-y-10">
            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-dark-900 mb-4">
                Limitation of Liability
              </h2>
              <p className="text-dark-600 text-lg leading-relaxed">
                The information provided on this site is for informational purposes only and does not constitute legal, financial, or professional advice. We assume no liability for the accuracy, completeness, or consequences of using the site.
              </p>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-semibold text-dark-900 mb-4">
                User Responsibilities
              </h2>
              <p className="text-dark-600 text-lg leading-relaxed">
                Users are solely responsible for their content, communications, and compliance with applicable laws and platform rules.
              </p>
            </section>

            {/* Illustrative Purposes */}
            <section>
              <h2 className="text-2xl font-semibold text-dark-900 mb-4">
                Illustrative Purposes
              </h2>
              <p className="text-dark-600 text-lg leading-relaxed">
                Any examples, pricing, or statistics shown are for illustrative purposes only.
              </p>
            </section>
          </div>

          {/* Copyright */}
          <div className="mt-16 pt-8 border-t border-dark-200">
            <p className="text-dark-500 text-center">
              &copy; 2026 YouAndINotAI.com. All rights reserved.
            </p>
          </div>
        </div>
      </main>

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
              &copy; {new Date().getFullYear()} YouAndINotAI.com. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

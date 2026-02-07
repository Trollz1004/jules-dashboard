import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spark - Find Your Match',
  description: 'Connect with amazing people near you. Find love, friendship, and meaningful connections.',
  keywords: ['dating', 'love', 'relationships', 'singles', 'match', 'connections'],
  authors: [{ name: 'Spark Team' }],
  openGraph: {
    title: 'Spark - Find Your Match',
    description: 'Connect with amazing people near you.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Spark',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spark - Find Your Match',
    description: 'Connect with amazing people near you.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ec4899',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-white antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '1rem',
              padding: '1rem',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

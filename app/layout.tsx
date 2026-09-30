import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import QueryProvider from '@/components/providers/QueryProvider';
import PWARegister from '@/components/providers/PWARegister';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Nusa Media - Media Crew 2026 Work Tracker',
  description: 'Production Work Status & Media Task Tracking System for Chairman, Conveners & Members.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/media.ico', type: 'image/x-icon' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/media.ico',
    apple: '/media.ico',
  },
  appleWebApp: {
    capable: true,
    title: 'Nusa Media',
    statusBarStyle: 'black-translucent',
  },
  applicationName: 'Nusa Media',
};

export const viewport: Viewport = {
  themeColor: '#2511F7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <PWARegister />
        <AuthProvider>
          <QueryProvider>
            <AppShell>{children}</AppShell>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

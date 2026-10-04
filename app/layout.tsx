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
      { url: '/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicons/favicon-24x24.png', sizes: '24x24', type: 'image/png' },
      { url: '/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicons/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicons/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/favicons/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicons/favicon-310x310.png', sizes: '310x310', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicons/favicon-32x32.png',
    apple: [
      { url: '/favicons/favicon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicons/favicon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/favicons/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/favicons/favicon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/favicons/favicon-114x114.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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

/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Kanban,
  CheckSquare,
  Users,
  User,
  LogOut,
  Moon,
  Sun,
  Settings,
  Bell,
  Menu,
  X,
  Sparkles,
  Gamepad2,
} from 'lucide-react';
import { isAdminRole } from '@/lib/auth-utils';
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const userRole = session?.user?.role;
  const isAdmin = isAdminRole(userRole);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Team Board', href: '/works' },
    { name: 'My Works', href: '/my-works' },
    ...(isAdmin ? [{ name: 'Members', href: '/members' }] : []),
    { name: 'Profile', href: '/profile' },
    { name: 'Relax Zone', href: '/game' },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  // Don't render shell on /login or root landing page
  if (pathname === '/login' || pathname === '/') {
    return (
      <>
        <PWAInstallPrompt />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5FA] dark:bg-[#07022E] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative">
      <PWAInstallPrompt />
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-100/80 dark:bg-[#07022E]/60 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Tagline */}
          <Link href="/dashboard" className="flex items-center gap-3 group flex-shrink-0">
            <img
              src="/media-logo.jfif"
              alt="Nusa Media Logo"
              className="h-10 w-10 rounded-2xl object-cover shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform border border-blue-400/30 bg-white"
            />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0D0647] dark:text-white block">
                Nusa Media
              </span>
              <span className="text-[10px] text-[#2511F7] dark:text-[#FFE600] font-extrabold tracking-wider uppercase block">
                Media Crew 2026
              </span>
            </div>
          </Link>

          {/* Center Navigation Pill Bar (Desktop) */}
          <nav className="hidden lg:flex items-center h-11 gap-1 bg-white dark:bg-[#0D0647] p-1 rounded-full border border-slate-100 dark:border-blue-900/40 shadow-sm shadow-blue-500/5">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`h-full flex items-center px-5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2511F7] text-white shadow-sm font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:text-[#2511F7] dark:hover:text-[#FFE600] hover:bg-blue-50 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all duration-200 shadow-sm"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            {/* Notification Bell */}
            <button
              className="relative p-2 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0D0647] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#150B6E] transition-colors shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#2511F7] text-[#FFE600] text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0D0647]">
                3
              </span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0D0647] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#150B6E] transition-colors shadow-sm"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-[#FFE600]" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Avatar */}
            <div className="relative group">
              <Link href="/profile" className="block">
                {session?.user?.avatarUrl ? (
                  <img
                    src={session.user.avatarUrl}
                    alt={session.user.name || 'User'}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-[#2511F7]/60 shadow-sm"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-[#2511F7] text-[#FFE600] flex items-center justify-center font-black text-sm shadow-sm border border-blue-400/40">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-blue-900/40 bg-white dark:bg-[#0D0647] text-slate-700 dark:text-slate-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 dark:border-blue-900/40 space-y-1 pb-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-xl text-sm font-semibold ${
                  pathname === item.href
                    ? 'bg-[#2511F7] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/40'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200 dark:border-blue-900/40 flex justify-between items-center px-2">
              <span className="text-xs text-slate-500">{session?.user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}


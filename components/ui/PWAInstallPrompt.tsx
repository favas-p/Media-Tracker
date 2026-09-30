'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Sparkles, Smartphone, Share, Laptop, Monitor } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstalledToast, setShowInstalledToast] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showDesktopTip, setShowDesktopTip] = useState(false);

  useEffect(() => {
    // Detect if running in standalone mode (already installed & opened as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const mobile = /android|iphone|ipad|ipod|windows phone|mobile/.test(userAgent);
    
    setIsIOS(ios);
    setIsDesktop(!mobile);

    if (ios && !isStandalone) {
      const dismissed = sessionStorage.getItem('nusa_pwa_ios_dismissed');
      if (!dismissed) {
        setShowIOSTip(true);
      }
    }

    // Listen for native beforeinstallprompt event (Android / Chrome / Edge Desktop / Laptop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      const dismissed = sessionStorage.getItem('nusa_pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setShowIOSTip(false);
      setShowDesktopTip(false);
      setDeferredPrompt(null);
      setShowInstalledToast(true);

      setTimeout(() => {
        setShowInstalledToast(false);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback timer for desktop/laptop browsers if event is delayed or user visits homepage
    const fallbackTimer = setTimeout(() => {
      if (!isStandalone && !ios) {
        const dismissed = sessionStorage.getItem('nusa_pwa_prompt_dismissed');
        if (!dismissed) {
          setShowPrompt(true);
        }
      }
    }, 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isDesktop) {
      // Show desktop instructions for Chrome / Edge address bar install button
      setShowDesktopTip(true);
    }
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    sessionStorage.setItem('nusa_pwa_prompt_dismissed', 'true');
  };

  const handleDismissIOS = () => {
    setShowIOSTip(false);
    sessionStorage.setItem('nusa_pwa_ios_dismissed', 'true');
  };

  const handleDismissDesktopTip = () => {
    setShowDesktopTip(false);
  };

  if (isInstalled && !showInstalledToast) return null;

  return (
    <div className="fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 pointer-events-none font-sans">
      <AnimatePresence>
        {/* 1. Installed Success Notification Toast */}
        {showInstalledToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto bg-[#0D0647] border border-[#2511F7] text-white p-4 rounded-3xl shadow-2xl flex items-center gap-3.5"
          >
            <div className="h-10 w-10 rounded-2xl bg-[#FFE600] text-[#0A043D] flex items-center justify-center font-bold flex-shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">App Installed Successfully!</h4>
              <p className="text-xs text-slate-300">
                Nusa Media is now installed on your device.
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. PWA Installation Notification Banner (Laptop & Mobile) */}
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            className="pointer-events-auto bg-gradient-to-r from-[#0D0647] to-[#160B6E] border border-blue-500/50 text-white p-4 sm:p-5 rounded-[28px] shadow-2xl space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/media-logo.jfif"
                  alt="Nusa Media Logo"
                  className="h-11 w-11 rounded-2xl object-cover border border-blue-400/40 shadow-md flex-shrink-0 bg-white"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    Install Nusa Media App <Sparkles className="w-4 h-4 text-[#FFE600]" />
                  </h4>
                  <p className="text-xs text-slate-300 font-medium">
                    {isDesktop ? 'Install on your laptop for desktop app access & offline mode.' : 'Install on your device for instant access and work tracking.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissPrompt}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#FFE600] hover:bg-[#ebd500] text-[#0A043D] font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{deferredPrompt ? 'Install App Now' : 'Install Desktop App'}</span>
              </button>
              <button
                onClick={handleDismissPrompt}
                className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs transition-colors"
              >
                Not Now
              </button>
            </div>
          </motion.div>
        )}

        {/* 3. Laptop / Desktop Address Bar Install Instruction Tip */}
        {showDesktopTip && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            className="pointer-events-auto bg-[#0D0647] border border-[#2511F7] text-white p-5 rounded-[28px] shadow-2xl space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#2511F7] text-[#FFE600] flex items-center justify-center font-bold flex-shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">How to Install on Laptop / PC</h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Click the <span className="font-bold text-[#FFE600]">Install Icon ⊕</span> in your browser's top address bar (URL bar), or open Chrome Menu ➔ <span className="font-bold text-white">Save and share ➔ Install Nusa Media</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissDesktopTip}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleDismissDesktopTip}
                className="px-4 py-1.5 rounded-full bg-[#2511F7] text-white text-xs font-bold"
              >
                Got It
              </button>
            </div>
          </motion.div>
        )}

        {/* 4. iOS Installation Tip Notification */}
        {showIOSTip && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            className="pointer-events-auto bg-[#0D0647] border border-blue-500/40 text-white p-4 rounded-[28px] shadow-2xl space-y-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#2511F7] text-[#FFE600] flex items-center justify-center font-bold flex-shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Install on iPhone / iPad</h4>
                  <p className="text-[11px] text-slate-300">
                    Tap <Share className="w-3 h-3 inline text-[#FFE600]" /> <span className="font-bold text-white">Share</span> then select <span className="font-bold text-[#FFE600]">'Add to Home Screen'</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissIOS}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

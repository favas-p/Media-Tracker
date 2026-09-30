'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('Nusa Media PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('Nusa Media PWA Service Worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}

import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.ts';

export const PushNotificationPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const dismissed = localStorage.getItem('badshah_push_dismissed');
    if (dismissed) return;

    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubscribe = async () => {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const dummyEndpoint = `https://fcm.googleapis.com/fcm/send/${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await api.subscribePushNotification({
          endpoint: dummyEndpoint,
          keys: { auth: 'local-auth-key', p256dh: 'local-p256dh-key' },
        });

        // Show test welcome notification
        try {
          new Notification('বাদশাহ প্রিমিয়াম পারফিউম', {
            body: 'স্বাগতম! আপনি সফলভাবে পুশ নোটিফিকেশনে যুক্ত হয়েছেন।',
            icon: '/favicon.ico',
          });
        } catch {
          // ignore
        }

        setSubscribed(true);
        setTimeout(() => setShowPrompt(false), 2500);
      } else {
        localStorage.setItem('badshah_push_dismissed', 'true');
        setShowPrompt(false);
      }
    } catch (err) {
      console.warn('Push subscription failed or denied', err);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('badshah_push_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-5 left-5 z-40 max-w-sm w-[calc(100%-2.5rem)] sm:w-auto p-4 rounded-2xl bg-[#0f0f15]/95 border border-emerald-500/40 backdrop-blur-xl shadow-2xl text-white animate-slideUp">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>

        <div className="space-y-1.5 flex-1 pr-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            রয়্যাল অফার ও নতুন আপডেট
          </h4>
          <p className="text-[11px] text-[#9ca3af] leading-relaxed">
            সীমিত সংস্করণের নতুন আতর এবং স্পেশাল ডিসকাউন্ট অ্যালার্ট পেতে নোটিফিকেশন অন রাখুন।
          </p>

          {subscribed ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>নোটিফিকেশন সফলভাবে চালু হয়েছে!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1.5">
              <button
                onClick={handleSubscribe}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-md"
              >
                অন করুন
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#71717a] hover:text-white transition-colors"
              >
                পরে
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-[#71717a] hover:text-white p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

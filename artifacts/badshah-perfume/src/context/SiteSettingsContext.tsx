import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DEFAULT_PERFUME_BOTTLE_IMAGE_URL,
  SiteSettings,
  WHOLESALE_MIN_ML,
} from '../types/index.ts';
import { api } from '../services/api.ts';

const FALLBACK_SETTINGS: SiteSettings = {
  // BRANDING
  siteName: 'Badshah Premium Perfume',
  tagline: 'Artisanal Extrait de Parfum & Concentrated Attar',
  logoUrl: '',
  brandLogoUrl: '',
  faviconUrl: '',

  // THEME COLORS
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  backgroundColor: '#000000',
  textColor: '#ffffff',
  accentColor: '#34d399',
  randomizeWordColors: true,

  // HERO & BANNERS
  heroTitle: 'Crafted for Kings & Royalty',
  heroSubtitle: 'Immerse yourself in authentic artisanal perfumes and concentrated attars. Uncompromising longevity, pure concentrated oils, and royal Arabian heritage.',
  heroCtaText: 'Our Popular Collections',
  heroImageUrl: '/src/assets/images/hero_badshah_perfume_1790701561080.jpg',
  announcementBarText: '',
  announcementBarEnabled: false,

  // CONTACT & SOCIALS
  whatsappNumber: '+8801700000000',
  contactPhone: '+880 1700-000000',
  contactEmail: 'contact@badshahperfume.com',
  storeAddress: 'Banani, Dhaka - 1213, Bangladesh',
  facebookUrl: 'https://facebook.com/badshahperfume',
  instagramUrl: 'https://instagram.com/badshahperfume',

  // POLICIES & RATES
  deliveryFeeInsideDhaka: 80,
  deliveryFeeOutsideDhaka: 130,
  footerCopyrightText: '© 2026 Badshah Premium Perfume. All rights reserved. Handcrafted with royal Arabian precision.',

  // CHECKOUT & CUSTOMER AUTH
  requireCustomerLogin: false,

  // MARKETING PIXELS & ANALYTICS
  metaPixelId: '',
  googleAnalyticsId: '',
  tiktokPixelId: '',

  // DEEP DYNAMIC SECTION COPY
  featureBadge1: 'Extrait de Parfum',
  featureBadge2: '10-14+ Hours Longevity',
  featureBadge3: '64 Districts Delivery',
  collectionsTitle: 'আমাদের কালেকশন সমূহ',
  collectionsSubtitle: 'Select from our crown artisanal compositions. Available in precision sizes from 3ml to 100ml flacons with independent pricing.',
  aboutSectionTitle: 'The Heritage of Badshah',
  aboutSectionContent: 'Badshah Premium Perfume was founded on a singular conviction: luxury fragrance should command presence without compromise. We curate the finest artisanal oils, rare Cambodian oud, warm ambergris, and exquisite Turkish damask roses. Each bottle is poured with precision, bringing the timeless elegance of royal Arabian perfumery directly to your daily ritual.',
  aboutSectionHighlight: 'Handcrafted in limited batches for discerning fragrance connoisseurs.',
  trustSectionTitle: 'Why Discerning Customers Choose Us',
  trustSectionSubtitle: 'The Badshah Standard',
  reviewsSectionTitle: 'Royal Connoisseur Testimonials',
  reviewsSectionSubtitle: 'Unfiltered reviews from fragrance connoisseurs across Bangladesh',

  // SEARCH & CUSTOM REQUEST (BANGLA)
  searchHeadingBangla: 'আপনার পছন্দের পারফিউম সার্চ দিন',
  searchPlaceholderBangla: 'পারফিউমের নাম দিয়ে খুঁজুন',
  searchNoResultsMessageBangla:
    'এটি আমাদের স্টকে আপাতত শেষ হয়ে গেছে। আপনি এই ফরমটি ফিল আপ করলে খুব দ্রুত পারফিউমটি আমাদের স্টকে চলে আসবে।',
  collectionsViewAllText: 'আমাদের সকল কালেকশন',
  collectionsShowLessText: 'কম দেখুন',
  customerReviewsCtaText: 'আমাদের কাস্টমার রিভিউ গুলো দেখুন',
  wholesaleCtaText: 'পাইকারি কিনতে',
  customRequestNoticeBangla: '৩০ মিলি এর কম অর্ডারের ক্ষেত্রে অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।',

  // 24/7 CUSTOMER SERVICE
  customerServiceBadgeText: '২৪/৭ কাস্টমার সার্ভিস',
  customerServiceBadgeEnabled: true,

  // WHOLESALE / PAIKARI PORTAL
  wholesaleNoticeBangla: 'মিনিমাম ৫০ মিলি নিতে হবে',
  wholesaleMinQty: WHOLESALE_MIN_ML,
  wholesaleDiscountPercent: 25,

  // SOCIALS & CONTACT
  telegramUrl: 'https://t.me/badshahperfume',

  // MEDIA CMS & AUTH BACKGROUND & MASTER BOTTLE
  homepageVideoUrl: '',
  homepageBannerImageUrl: '',
  authBackgroundImageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=1200',
  defaultBottleImageUrl: DEFAULT_PERFUME_BOTTLE_IMAGE_URL,
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<SiteSettings>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'badshah_site_settings_cache';

function getInitialSettings(): SiteSettings {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...FALLBACK_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to parse cached settings:', e);
    }
  }
  return FALLBACK_SETTINGS;
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(getInitialSettings);
  const [isLoading, setIsLoading] = useState(true);

  const injectMarketingPixels = (s: SiteSettings) => {
    // 1. Meta Pixel
    if (s.metaPixelId && !document.getElementById('meta-pixel-script')) {
      const script = document.createElement('script');
      script.id = 'meta-pixel-script';
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${s.metaPixelId.trim()}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    // 2. Google Analytics 4 (GA4)
    if (s.googleAnalyticsId && !document.getElementById('ga-script')) {
      const gaScript = document.createElement('script');
      gaScript.id = 'ga-script';
      gaScript.async = true;
      gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${s.googleAnalyticsId.trim()}`;
      document.head.appendChild(gaScript);

      const inlineScript = document.createElement('script');
      inlineScript.id = 'ga-inline-script';
      inlineScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${s.googleAnalyticsId.trim()}');
      `;
      document.head.appendChild(inlineScript);
    }

    // 3. TikTok Pixel
    if (s.tiktokPixelId && !document.getElementById('tiktok-pixel-script')) {
      const ttScript = document.createElement('script');
      ttScript.id = 'tiktok-pixel-script';
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${s.tiktokPixelId.trim()}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
    }
  };

  const applyThemeVariables = (s: SiteSettings) => {
    const root = document.documentElement;
    if (s.primaryColor) {
      root.style.setProperty('--color-primary', s.primaryColor);
      root.style.setProperty('--color-primary-rgb', hexToRgb(s.primaryColor));
    }
    if (s.secondaryColor) {
      root.style.setProperty('--color-primary-hover', s.secondaryColor);
    }
    if (s.accentColor) {
      root.style.setProperty('--color-accent', s.accentColor);
    }
    if (s.backgroundColor) {
      root.style.setProperty('--color-bg', s.backgroundColor);
    }
    if (s.textColor) {
      root.style.setProperty('--color-text-main', s.textColor);
    }

    if (s.siteName) {
      document.title = `${s.siteName} | ${s.tagline || 'Artisanal Perfumes'}`;
    }

    if (s.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = s.faviconUrl;
      }
    }

    injectMarketingPixels(s);
  };

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      applyThemeVariables(data);
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        // storage quota ignore
      }
    } catch (err) {
      console.warn('Network call failed, using localStorage cache / fallback settings:', err);
      const cached = getInitialSettings();
      setSettings(cached);
      applyThemeVariables(cached);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<SiteSettings> => {
    const updated = await api.adminUpdateSettings(newSettings);
    setSettings(updated);
    applyThemeVariables(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // The server save is authoritative; cache failures do not undo it.
    }
    return updated;
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        isLoading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '212, 175, 55';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

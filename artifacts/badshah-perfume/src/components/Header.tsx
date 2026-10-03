import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Crown, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';

interface HeaderProps {
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { itemCount, setIsCartOpen } = useCart();
  const { settings } = useSiteSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page: string, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(page);
    if (sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const brandLogo = settings.brandLogoUrl || settings.logoUrl;

  return (
    <header className="sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md border-b border-[#1c1c24] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
        {/* Dynamic Brand Logo & Wordmark with Tagline */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 sm:gap-3.5 text-left group focus:outline-none min-w-0"
        >
          {brandLogo ? (
            <img
              src={brandLogo}
              alt={settings.siteName || 'BADSHAH'}
              className="h-10 sm:h-12 w-auto object-contain shrink-0 max-w-[50px] sm:max-w-[70px] rounded"
            />
          ) : (
            <div
              style={{
                borderColor: `${settings.primaryColor || '#10b981'}66`,
                color: settings.primaryColor || '#10b981',
              }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border bg-[#121217] flex items-center justify-center shadow-inner transition-transform group-hover:scale-105 shrink-0"
            >
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
          <div className="min-w-0">
            <span className="font-serif text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-wider text-emerald-400 block truncate uppercase leading-tight">
              {settings.siteName || 'BADSHAH PREMIUM PERFUME'}
            </span>
            <span className="text-[10px] tracking-widest text-[#a1a1aa] block uppercase truncate">
              {settings.tagline || 'ARTISANAL EXTRAIT DE PARFUM & CONCENTRATED ATTAR'}
            </span>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs sm:text-sm font-medium text-[#d1d5db]">
          <button
            onClick={() => handleNav('home', 'collections')}
            className="hover:text-emerald-400 transition-colors focus:outline-none"
          >
            কালেকশন
          </button>
          <button
            onClick={() => handleNav('wholesale')}
            className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-all focus:outline-none"
          >
            পাইকারি / Wholesale
          </button>
          <button
            onClick={() => handleNav('track-order')}
            className="hover:text-emerald-400 transition-colors focus:outline-none"
          >
            ট্র্যাক অর্ডার
          </button>
          <button
            onClick={() => handleNav('home', 'about')}
            className="hover:text-emerald-400 transition-colors focus:outline-none"
          >
            About Us
          </button>
          <button
            onClick={() => handleNav('home', 'delivery')}
            className="hover:text-emerald-400 transition-colors focus:outline-none"
          >
            ডেলিভারি & COD
          </button>
          {settings.customerServiceBadgeEnabled && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[11px] font-semibold">
              ২৪/৭ সাপোর্ট
            </span>
          )}
        </nav>

        {/* Actions (Cart & Mobile Menu Toggle) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => handleNav('admin')}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl border border-emerald-700/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-colors text-xs font-bold"
            aria-label="অ্যাডমিন প্যানেলে প্রবেশ"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">অ্যাডমিন</span>
          </button>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl border border-[#27272a] bg-[#121217] text-[#f3f4f6] hover:text-emerald-400 hover:border-emerald-500/50 transition-colors focus:outline-none"
            aria-label="View Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span
                style={{ backgroundColor: settings.primaryColor || '#10b981' }}
                className="absolute -top-1.5 -right-1.5 text-[#000000] text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
              >
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl border border-[#27272a] bg-[#121217] text-[#d1d5db] hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0d0d10] border-b border-[#242429] px-5 py-4 space-y-3 animate-in slide-in-from-top duration-150 shadow-2xl">
          <button
            onClick={() => handleNav('home', 'collections')}
            className="block w-full text-left py-2.5 text-sm font-semibold text-[#e5e7eb] hover:text-emerald-400 border-b border-[#181820]"
          >
            কালেকশন / Collections
          </button>
          <button
            onClick={() => handleNav('wholesale')}
            className="block w-full text-left py-2.5 text-sm font-bold text-emerald-400 border-b border-[#181820]"
          >
            পাইকারি / Wholesale Portal
          </button>
          <button
            onClick={() => handleNav('track-order')}
            className="block w-full text-left py-2.5 text-sm font-semibold text-[#e5e7eb] hover:text-emerald-400 border-b border-[#181820]"
          >
            ট্র্যাক অর্ডার / Track Order
          </button>
          <button
            onClick={() => handleNav('home', 'about')}
            className="block w-full text-left py-2.5 text-sm font-semibold text-[#e5e7eb] hover:text-emerald-400 border-b border-[#181820]"
          >
            About Us
          </button>
          <button
            onClick={() => handleNav('home', 'delivery')}
            className="block w-full text-left py-2.5 text-sm font-semibold text-[#e5e7eb] hover:text-emerald-400"
          >
            ডেলিভারি & ক্যাশ অন ডেলিভারি
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="block w-full text-left py-2.5 text-sm font-bold text-emerald-300"
          >
            অ্যাডমিন প্যানেল
          </button>
        </div>
      )}
    </header>
  );
};

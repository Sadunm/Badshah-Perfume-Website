import React from 'react';
import { Crown, MessageCircle, Send, MapPin, Truck, ShieldCheck } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { settings } = useSiteSettings();

  const whatsappNumber = settings.whatsappNumber || '+8801700000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '').replace('+', '');
  const messengerUrl = settings.facebookUrl || 'https://m.me/badshahperfume';

  return (
    <footer className="bg-[#08080a] border-t border-[#1f1f24] text-[#9ca3af] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#1c1c22]">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className="h-9 w-auto object-contain max-w-[120px]"
                />
              ) : (
                <div
                  style={{ borderColor: `${settings.primaryColor || '#10b981'}66`, color: settings.primaryColor || '#10b981' }}
                  className="w-9 h-9 rounded-full border bg-[#121215] flex items-center justify-center text-emerald-400"
                >
                  <Crown className="w-4 h-4" />
                </div>
              )}
              <span className="font-serif text-xl font-bold tracking-wider text-emerald-400">
                {settings.siteName || 'BADSHAH'}
              </span>
            </div>
            <p className="text-xs text-[#80808a] leading-relaxed">
              {settings.tagline || 'Artisanal Extrait de Parfum & Concentrated Attar.'} Crafted for kings and connoisseurs with rare agarwood, amber, and exotic florals.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <a
                href={`https://wa.me/${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16161a] border border-[#27272a] hover:border-[#25D366] text-xs text-white transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16161a] border border-[#27272a] hover:border-[#0084FF] text-xs text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-[#0084FF]" />
                <span>Messenger</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#e5e7eb]">
              Store Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#collections" className="hover:text-emerald-400 transition-colors">
                  Our Popular Collections
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-emerald-400 transition-colors">
                  Brand Heritage
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-emerald-400 transition-colors">
                  Customer Testimonials
                </a>
              </li>
              <li>
                <a href="#delivery" className="hover:text-emerald-400 transition-colors">
                  Delivery Rates & COD
                </a>
              </li>
            </ul>
          </div>

          {/* Nationwide Delivery Policy */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#e5e7eb] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Nationwide Delivery</span>
            </h4>
            <div className="text-xs space-y-2 text-[#9ca3af]">
              <div className="bg-[#101014] p-2.5 rounded border border-[#1f1f26]">
                <span className="text-[#e5e7eb] font-medium block">
                  Inside Dhaka: ৳{settings.deliveryFeeInsideDhaka ?? 80}
                </span>
                <span className="text-[11px] text-[#71717a]">Estimated 24-48 hours</span>
              </div>
              <div className="bg-[#101014] p-2.5 rounded border border-[#1f1f26]">
                <span className="text-[#e5e7eb] font-medium block">
                  Outside Dhaka: ৳{settings.deliveryFeeOutsideDhaka ?? 130}
                </span>
                <span className="text-[11px] text-[#71717a]">Estimated 48-72 hours via Courier</span>
              </div>
              <p className="text-[11px] text-[#a1a1aa] pt-1">
                ✓ 100% Cash on Delivery across all 64 districts in Bangladesh.
              </p>
            </div>
          </div>

          {/* Contact Direct */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[#e5e7eb] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Contact & Store</span>
            </h4>
            <div className="text-xs space-y-2 text-[#9ca3af]">
              <p>
                <strong className="text-[#d1d5db]">WhatsApp Support:</strong>
                <br />
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline font-mono"
                >
                  {settings.whatsappNumber}
                </a>
              </p>
              {settings.contactPhone && (
                <p>
                  <strong className="text-[#d1d5db]">Hotline:</strong>
                  <br />
                  <a href={`tel:${settings.contactPhone}`} className="text-white hover:underline">
                    {settings.contactPhone}
                  </a>
                </p>
              )}
              {settings.storeAddress && (
                <p>
                  <strong className="text-[#d1d5db]">Address:</strong>
                  <br />
                  <span className="text-[#71717a]">{settings.storeAddress}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#6b7280] gap-4">
          <p>{settings.footerCopyrightText || `© ${new Date().getFullYear()} Badshah Premium Perfume. All rights reserved.`}</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Authentic Extrait de Parfum</span>
            <span>·</span>
            <span>Cash on Delivery</span>
            <span>·</span>
            <span>Nationwide Bangladesh</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

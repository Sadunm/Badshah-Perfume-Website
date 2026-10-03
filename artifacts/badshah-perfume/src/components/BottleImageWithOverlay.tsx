import React, { useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { Crown } from 'lucide-react';

interface BottleImageWithOverlayProps {
  image?: string;
  name: string;
  className?: string;
  aspectRatio?: string;
  showNameSticker?: boolean;
}

export const BottleImageWithOverlay: React.FC<BottleImageWithOverlayProps> = ({
  image,
  name,
  className = 'w-full h-full object-cover object-center',
  aspectRatio = 'aspect-[4/3]',
  showNameSticker = false,
}) => {
  const { settings } = useSiteSettings();
  const [imgError, setImgError] = useState(false);

  const defaultMasterBottle =
    settings.defaultBottleImageUrl ||
    'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1000';

  // Determine if product has unique custom image or needs default bottle with label overlay
  const hasCustomImage = Boolean(
    image &&
      image.trim() !== '' &&
      image.trim() !== defaultMasterBottle.trim() &&
      !imgError
  );

  const displayImage = hasCustomImage ? image : defaultMasterBottle;

  // Dynamic font sizing calculation for perfume name to prevent any overflow
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 32) return 'text-[9px] sm:text-[10px] tracking-wide leading-tight';
    if (len > 24) return 'text-[10px] sm:text-[11px] tracking-wider leading-tight';
    if (len > 15) return 'text-[11px] sm:text-xs tracking-widest leading-snug';
    if (len > 8) return 'text-xs sm:text-sm tracking-widest leading-snug';
    return 'text-sm sm:text-base tracking-[0.2em] leading-snug';
  };

  const getStickerFontSizeClass = (text: string) => {
    const len = text.length;
    if (len > 28) return 'text-[7px] sm:text-[8px] tracking-tight leading-tight';
    if (len > 20) return 'text-[8px] sm:text-[9px] tracking-tight leading-tight';
    if (len > 12) return 'text-[9px] sm:text-[10px] tracking-wide leading-tight';
    return 'text-[10px] sm:text-[11px] tracking-wide leading-tight';
  };

  return (
    <div className={`relative ${aspectRatio} w-full overflow-hidden bg-[#121217]`}>
      <img
        src={displayImage}
        alt={name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgError(true)}
        className={`${className} transition-transform duration-300`}
      />

      {showNameSticker && (
        <div className="absolute left-1/2 top-[61%] z-10 flex h-[11%] min-h-[25px] max-h-[38px] w-[31%] min-w-[60px] max-w-[142px] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-[2px] border border-[#d9cfb7] bg-[#fffdf5]/95 px-1.5 py-0.5 shadow-[0_2px_7px_rgba(0,0,0,0.38)]">
          <span
            className={`line-clamp-2 w-full select-none text-center font-serif font-semibold uppercase text-[#352d20] ${getStickerFontSizeClass(
              name
            )}`}
          >
            {name}
          </span>
        </div>
      )}

      {/* Render dynamic luxury CSS label overlay ONLY if product uses default master bottle */}
      {!showNameSticker && !hasCustomImage && (
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          {/* Label Container positioned right on the bottle's center label area */}
          <div className="w-[62%] max-w-[210px] py-2.5 px-3 bg-gradient-to-b from-[#0e0e12]/95 via-[#08080b]/98 to-[#0a0a0d]/95 backdrop-blur-md rounded-[3px] border border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-2xl shadow-black/90 flex flex-col items-center justify-center text-center">
            {/* Top Royal Filigree Crown Motif */}
            <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
              <span className="w-3 sm:w-4 h-[0.5px] bg-emerald-500/60" />
              <Crown className="w-3 h-3 text-emerald-400" />
              <span className="w-3 sm:w-4 h-[0.5px] bg-emerald-500/60" />
            </div>

            {/* CRITICAL RULE: Render ONLY the Perfume Name on the label. No volume or concentration. */}
            <span
              className={`font-serif font-bold uppercase text-white drop-shadow-md line-clamp-3 select-none ${getFontSizeClass(
                name
              )}`}
              style={{
                fontFamily: "'Playfair Display', 'Cinzel', serif",
                textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(16,185,129,0.25)',
              }}
            >
              {name}
            </span>

            {/* Bottom Subtle Divider */}
            <div className="mt-1.5 flex items-center gap-1">
              <span className="w-2.5 h-[0.5px] bg-emerald-500/50" />
              <span className="w-1 h-1 rounded-full bg-emerald-500/80" />
              <span className="w-2.5 h-[0.5px] bg-emerald-500/50" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

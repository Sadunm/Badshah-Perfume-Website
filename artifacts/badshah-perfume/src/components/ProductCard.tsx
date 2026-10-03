import React from 'react';
import { Product } from '../types/index.ts';
import { ArrowRight } from 'lucide-react';
import { BottleImageWithOverlay } from './BottleImageWithOverlay.tsx';
import commonBottleImage from '../assets/badshah-common-bottle.png';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(product.id)}
      className="group cursor-pointer rounded-2xl bg-[#0f0f14] border border-[#20202a] hover:border-emerald-500/60 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      {/* Product Image Area with Dynamic Luxury Label Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#16161c]">
        <BottleImageWithOverlay
          image={commonBottleImage}
          name={product.name}
          className="w-full h-full object-cover object-center"
          aspectRatio="aspect-[4/3]"
          showNameSticker
        />
      </div>

      {/* Info Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-serif text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
            {product.name}
          </h3>

          {product.fragranceNotes.trim() && (
            <p className="text-xs text-[#a1a1aa] mt-2 leading-relaxed">
              {product.fragranceNotes}
            </p>
          )}
        </div>

        {/* Details action */}
        <div className="pt-3 border-t border-[#1c1c24] flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product.id);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#171720] border border-[#272736] text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-500 transition-all shadow-sm"
          >
            <span>ডিটেইলস</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

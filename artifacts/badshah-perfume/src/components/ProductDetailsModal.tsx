import React, { useState, useEffect } from 'react';
import { Product, ProductSize } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { BottleImageWithOverlay } from './BottleImageWithOverlay.tsx';
import {
  X,
  Sparkles,
  Clock,
  Crown,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDirectOrder: (product: Product, size: ProductSize, quantity: number) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onDirectOrder,
}) => {
  const { addItem } = useCart();
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSizeIndex(0);
    setQuantity(1);
    setAddedMessage(null);
  }, [product]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stockStatus === 'Out of Stock';

  // Build 15ml, 30ml, 50ml options
  const defaultStarting = product.startingPrice || 1200;
  const standardSizes: ProductSize[] =
    product.sizes && product.sizes.length >= 2
      ? product.sizes
      : [
          {
            id: `size-15-${product.id}`,
            productId: product.id,
            sizeLabel: '15 ml Pocket Flacon',
            price: Math.round(defaultStarting * 0.6),
            isAvailable: true,
          },
          {
            id: `size-30-${product.id}`,
            productId: product.id,
            sizeLabel: '30 ml Royal Flacon',
            price: defaultStarting,
            isAvailable: true,
          },
          {
            id: `size-50-${product.id}`,
            productId: product.id,
            sizeLabel: '50 ml Master Flacon',
            price: Math.round(defaultStarting * 1.55),
            isAvailable: true,
          },
        ];

  const currentSize = standardSizes[selectedSizeIndex] || standardSizes[0];
  const totalPrice = (currentSize?.price || defaultStarting) * quantity;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const ok = addItem(product, currentSize, quantity);
    if (ok) {
      setAddedMessage(`কার্টে যোগ করা হয়েছে: ${quantity}টি (${currentSize.sizeLabel})`);
      setTimeout(() => setAddedMessage(null), 3000);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addItem(product, currentSize, quantity);
    onDirectOrder(product, currentSize, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0e0e13] border border-[#2b2b38] rounded-2xl shadow-2xl p-5 sm:p-7 text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#71717a] hover:text-white rounded-xl hover:bg-[#1a1a24] transition-colors z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
          {/* Product Image */}
          <div className="sm:col-span-5">
            <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#16161c] border border-[#242432] shadow-xl">
              <BottleImageWithOverlay
                image={product.image}
                name={product.name}
                className="w-full h-full object-contain object-center"
                aspectRatio="aspect-[4/3]"
                showNameSticker
              />
              {isOutOfStock && (
                <div className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-950/90 text-red-300 border border-red-800 rounded">
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          {/* Details & Selection Controls */}
          <div className="sm:col-span-7 space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-semibold mb-1">
                <Crown className="w-3.5 h-3.5" />
                <span>{product.fragranceType || 'Extrait de Parfum'}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-[#9ca3af] mt-1 line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Performance tags */}
            <div className="flex flex-wrap gap-2 text-[11px] text-[#d1d5db]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141a] border border-[#23232e]">
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>স্থায়িত্ব: {product.longevity || '১০-১৪+ ঘণ্টা'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#14141a] border border-[#23232e]">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>১০০% পিওর অয়েল</span>
              </span>
            </div>

            {(product.fragranceNotes || product.topNotes || product.middleNotes || product.baseNotes) && (
              <div className="rounded-xl bg-[#121217] border border-[#22222b] px-3.5 py-3 space-y-1.5">
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider block">
                  Fragrance Notes
                </span>
                {product.topNotes || product.middleNotes || product.baseNotes ? (
                  <div className="space-y-1 text-xs text-[#d1d5db] leading-relaxed">
                    {product.topNotes && <p><strong>Top:</strong> {product.topNotes}</p>}
                    {product.middleNotes && <p><strong>Heart:</strong> {product.middleNotes}</p>}
                    {product.baseNotes && <p><strong>Base:</strong> {product.baseNotes}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-[#d1d5db] leading-relaxed">{product.fragranceNotes}</p>
                )}
              </div>
            )}

            {/* Volume Selection (15ml, 30ml, 50ml) */}
            <div className="space-y-2 pt-1 border-t border-[#1f1f28]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#a1a1aa]">
                <span>সাইজ ও ভলিউম সিলেক্ট করুন:</span>
                <span className="text-emerald-400 text-[11px]">নিশ্চিত প্রিমিয়াম কাঁচের ফ্লাকন</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {standardSizes.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => setSelectedSizeIndex(idx)}
                    className={`py-2.5 px-2 rounded-xl text-center border transition-all ${
                      selectedSizeIndex === idx
                        ? 'bg-emerald-500/15 border-emerald-500 text-white ring-1 ring-emerald-500/50 shadow-md'
                        : 'bg-[#13131a] border-[#252535] text-[#a1a1aa] hover:border-[#38384d]'
                    }`}
                  >
                    <div className="text-xs font-bold text-white truncate">{s.sizeLabel.split(' ')[0]} {s.sizeLabel.split(' ')[1] || 'ml'}</div>
                    <div className="text-xs font-extrabold text-emerald-400 tabular-nums mt-0.5">
                      ৳{s.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector & Price Summary */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#a1a1aa]">পরিমাণ:</span>
                <div className="flex items-center rounded-xl bg-[#14141c] border border-[#262635] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1 rounded text-[#a1a1aa] hover:text-white disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1 rounded text-[#a1a1aa] hover:text-white"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Exact Total Price */}
              <div className="text-right">
                <span className="text-[11px] text-[#71717a] block uppercase font-medium">সর্বমোট মূল্য</span>
                <span className="font-serif text-2xl font-bold text-white tabular-nums">
                  ৳{totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {addedMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{addedMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="py-3 px-4 rounded-xl text-xs font-bold border border-emerald-500/60 text-emerald-400 bg-[#14141d] hover:bg-emerald-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>কার্টে যোগ করুন</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="py-3 px-4 rounded-xl text-xs font-extrabold bg-emerald-500 text-black hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-40"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>সরাসরি অর্ডার করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

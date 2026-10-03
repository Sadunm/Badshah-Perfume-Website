import React, { useState } from 'react';
import { Product, ProductSize } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { BottleImageWithOverlay } from '../components/BottleImageWithOverlay.tsx';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Zap,
} from 'lucide-react';

interface ProductDetailsPageProps {
  product: Product;
  onBack: () => void;
  onNavigateToCheckout: () => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  onBack,
  onNavigateToCheckout,
}) => {
  const { addItem } = useCart();
  const isOutOfStock = product.stockStatus === 'Out of Stock';

  // Find initial available size
  const fallbackSize: ProductSize = {
    id: `size-default-${product.id}`,
    productId: product.id,
    sizeLabel: 'Standard Flacon',
    price: product.startingPrice || 0,
    isAvailable: true,
  };
  const initialSize = product.sizes?.find((s) => s.isAvailable) || product.sizes?.[0] || fallbackSize;
  const [selectedSize, setSelectedSize] = useState<ProductSize>(initialSize);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync when product changes
  React.useEffect(() => {
    const nextSize = product.sizes?.find((s) => s.isAvailable) || product.sizes?.[0] || fallbackSize;
    setSelectedSize(nextSize);
  }, [product]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const ok = addItem(product, selectedSize, quantity);
    if (ok) {
      setFeedback(`Added ${quantity} × ${selectedSize.sizeLabel} to your cart`);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleOrderNow = () => {
    if (isOutOfStock) return;
    addItem(product, selectedSize, quantity);
    onNavigateToCheckout();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#a1a1aa] hover:text-[#10b981] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Our Popular Collections</span>
      </button>

      {/* Two-Column Desktop / Single-Column Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* ================= LEFT SIDE ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Product Image */}
          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#15151c] border border-[#23232c] shadow-2xl">
            <BottleImageWithOverlay
              image={product.image}
              name={product.name}
              className="w-full h-full object-contain object-center"
              aspectRatio="aspect-[4/3]"
              showNameSticker
            />
            {isOutOfStock && (
              <div className="absolute top-4 right-4 z-10 bg-red-950/90 text-red-200 border border-red-700/50 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                Out of Stock
              </div>
            )}
          </div>

          {/* Product Header & Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-[#10b981] font-semibold tracking-wider uppercase">
              <Crown className="w-4 h-4" />
              <span>{product.fragranceType}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
              {product.name}
            </h1>

            {/* Performance Tags */}
            <div className="flex flex-wrap gap-3 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141419] border border-[#22222a] text-xs text-[#e5e7eb]">
                <Clock className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Longevity: {product.longevity}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141419] border border-[#22222a] text-xs text-[#e5e7eb]">
                <Sparkles className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Extrait de Parfum</span>
              </div>
            </div>

            {/* Olfactory Notes */}
            {(product.fragranceNotes || product.topNotes || product.middleNotes || product.baseNotes) && (
              <div className="p-4 rounded-xl bg-[#121217] border border-[#22222b] space-y-1.5">
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                  Olfactory Notes Architecture
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

            {/* Full Product Description */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a1a1aa]">
                Description & Artisanal Heritage
              </h3>
              <p className="text-sm text-[#9ca3af] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="lg:col-span-5 sticky top-28 space-y-6">
          <div className="rounded-2xl bg-[#0f0f14] border border-[#24242e] p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Header: Selected price and stock */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1f1f26]">
              <div>
                <span className="text-xs text-[#80808a] uppercase tracking-wider block">
                  Selected Flacon Size
                </span>
                <div className="font-serif text-3xl font-extrabold text-white mt-1 tabular-nums">
                  ৳{selectedSize ? selectedSize.price.toLocaleString() : 0}
                </div>
              </div>

              <div>
                {isOutOfStock ? (
                  <span className="px-3 py-1 text-xs font-semibold rounded bg-red-950/60 text-red-400 border border-red-800/40">
                    Out of Stock
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            {/* All 7 Available Sizes Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#d1d5db]">
                  Available Sizes & Independent Pricing
                </label>
                <span className="text-[11px] text-[#80808a]">Select preferred volume</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  const disabled = isOutOfStock || !size.isAvailable;

                  return (
                    <button
                      key={size.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSize(size)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-[#10b981] bg-[#10b981]/15 shadow-sm shadow-[#10b981]/20 text-white'
                          : 'border-[#22222a] bg-[#141419] text-[#9ca3af] hover:border-[#353542] hover:text-white'
                      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="font-semibold text-xs tracking-wide">
                        {size.sizeLabel}
                      </span>
                      <span className="font-bold text-xs tabular-nums text-[#10b981]">
                        ৳{size.price.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d1d5db] block">
                Select Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#2b2b36] rounded-xl bg-[#14141a] p-1">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#202028] disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-white tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-white hover:bg-[#202028] disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-[#80808a]">
                  Total: <strong className="text-white tabular-nums">৳{(selectedSize ? selectedSize.price * quantity : 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Feedback alert */}
            {feedback && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Order Buttons */}
            <div className="space-y-3 pt-2">
              {/* Order Now (Direct Checkout) */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleOrderNow}
                className="w-full py-4 px-6 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#10b981]/15"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Order Now</span>
              </button>

              {/* Add to Cart */}
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="w-full py-3.5 px-6 rounded-xl border border-[#2e2e38] bg-[#141419] hover:bg-[#1a1a22] hover:border-[#10b981]/40 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-[#10b981]" />
                <span>Add to Cart</span>
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-[#1f1f26] space-y-2 text-xs text-[#9ca3af]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span>100% Cash on Delivery across Bangladesh</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                <span>Tamper-proof safety flacon packaging</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

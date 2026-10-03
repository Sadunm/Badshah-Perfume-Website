import React, { useEffect, useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { WHOLESALE_MIN_ML } from '../types/index.ts';

const WholesaleMlInput: React.FC<{
  value: number;
  minimum: number;
  onCommit: (quantity: number) => void;
}> = ({ value, minimum, onCommit }) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const next = Math.max(minimum, Math.floor(Number(draft) || minimum));
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <label className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
      <span>পরিমাণ (মিলি, মিনিমাম {minimum})</span>
      <input
        type="number"
        min={minimum}
        step={1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
        className="w-24 px-2 py-1 rounded bg-[#0f0f13] border border-[#343440] text-white text-xs tabular-nums focus:outline-none focus:border-emerald-500"
      />
    </label>
  );
};

interface CartDrawerProps {
  onCheckout: () => void;
  onExplore: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onCheckout, onExplore }) => {
  const { settings } = useSiteSettings();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    removeItem,
    updateQuantity,
    setQuantity,
    subtotal,
    deliveryLocation,
    setDeliveryLocation,
    deliveryCharge,
    grandTotal,
  } = useCart();
  const wholesaleMinimumMl = Math.max(
    WHOLESALE_MIN_ML,
    Math.floor(Number(settings.wholesaleMinQty) || WHOLESALE_MIN_ML)
  );

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0e0e12] border-l border-[#242429] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[#1f1f26] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="font-serif text-lg font-bold text-white tracking-wide">
                Your Shopping Bag
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-md text-[#9ca3af] hover:text-white hover:bg-[#1a1a20]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#16161c] border border-[#272730] flex items-center justify-center mx-auto text-[#71717a]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-semibold text-white">Your bag is empty</h3>
                <p className="text-xs text-[#80808a] max-w-xs mx-auto">
                  Explore our royal collections of authentic artisanal perfumes and select your preferred bottle size.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onExplore();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded bg-emerald-500 text-black hover:bg-emerald-400 transition-colors"
                >
                  Explore Our Collections
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.sizeLabel}`}
                  className="flex gap-4 p-3.5 rounded-lg bg-[#141419] border border-[#202028]"
                >
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded object-cover object-center bg-[#1d1d26] shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-white truncate">
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeItem(item.productId, item.sizeLabel)}
                          className="text-[#71717a] hover:text-red-400 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-emerald-400">
                        <span className="font-semibold">{item.sizeLabel}</span>
                        <span className="text-[#52525b]">·</span>
                        <span className="text-[#a1a1aa] tabular-nums">
                          {item.isWholesale
                            ? `৳${item.unitPrice.toLocaleString('en-BD', { maximumFractionDigits: 2 })} / ml`
                            : `৳${item.unitPrice} each`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1e1e26]">
                      {item.isWholesale ? (
                        <WholesaleMlInput
                          value={item.quantity}
                          minimum={wholesaleMinimumMl}
                          onCommit={(quantity) => setQuantity(item.productId, item.sizeLabel, quantity)}
                        />
                      ) : (
                        <div className="flex items-center border border-[#272730] rounded bg-[#0f0f13]">
                          <button
                            onClick={() => updateQuantity(item.productId, item.sizeLabel, -1)}
                            className="p-1 text-[#a1a1aa] hover:text-white"
                            title="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-white tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.sizeLabel, 1)}
                            className="p-1 text-[#a1a1aa] hover:text-white"
                            title="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <span className="text-sm font-semibold text-white tabular-nums">
                        ৳{(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer calculation */}
          {items.length > 0 && (
            <div className="p-5 bg-[#0a0a0c] border-t border-[#1f1f26] space-y-4">
              {/* Delivery Zone Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa] block mb-2">
                  Delivery Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryLocation('inside_dhaka')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                      deliveryLocation === 'inside_dhaka'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                        : 'border-[#272730] bg-[#121216] text-[#9ca3af] hover:text-white'
                    }`}
                  >
                    <span className="block font-semibold">Inside Dhaka</span>
                    <span className="text-[11px] text-emerald-400 tabular-nums">
                      ৳{settings.deliveryFeeInsideDhaka ?? 80}
                    </span>
                  </button>

                  <button
                    onClick={() => setDeliveryLocation('outside_dhaka')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                      deliveryLocation === 'outside_dhaka'
                        ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm'
                        : 'border-[#272730] bg-[#121216] text-[#9ca3af] hover:text-white'
                    }`}
                  >
                    <span className="block font-semibold">Outside Dhaka</span>
                    <span className="text-[11px] text-emerald-400 tabular-nums">
                      ৳{settings.deliveryFeeOutsideDhaka ?? 130}
                    </span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-[#a1a1aa] pt-1">
                <div className="flex justify-between">
                  <span>Product Subtotal</span>
                  <span className="text-white font-medium tabular-nums">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Delivery Charge ({deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span className="text-white font-medium tabular-nums">৳{deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#1f1f26]">
                  <span className="text-emerald-400">Grand Total</span>
                  <span className="tabular-nums">৳{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 p-2 rounded">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Cash on Delivery available nationwide. Pay upon receipt.</span>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onCheckout();
                }}
                className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

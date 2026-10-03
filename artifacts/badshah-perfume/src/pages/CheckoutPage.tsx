import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext.tsx';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import { DeliveryLocation, Order } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Clock,
  Sparkles,
  Ticket,
  User,
  LogIn,
  X,
} from 'lucide-react';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
}

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Gazipur',
  'Narayanganj',
  'Chittagong',
  'Cox\'s Bazar',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Comilla',
  'Bogra',
  'Jessore',
  'Noakhali',
  'Mymensingh',
  'Rangpur',
  'Dinajpur',
  'Tangail',
  'Faridpur',
  'Kushtia',
  'Pabna',
  'Brahmanbaria',
  'Other District',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess }) => {
  const { items, clearCart, deliveryLocation, setDeliveryLocation, deliveryCharge } = useCart();
  const { settings } = useSiteSettings();
  const { customer, setIsAuthModalOpen } = useCustomerAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [district, setDistrict] = useState(deliveryLocation === 'inside_dhaka' ? 'Dhaka' : 'Chittagong');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showInvoiceReview, setShowInvoiceReview] = useState(false);

  // Pre-fill fields if customer is logged in
  useEffect(() => {
    if (customer) {
      if (!customerName && customer.name) setCustomerName(customer.name);
      if (!customerPhone && customer.phone) setCustomerPhone(customer.phone);
      if (!customerAddress && customer.address) setCustomerAddress(customer.address);
      if (customer.district) setDistrict(customer.district);
    }
  }, [customer]);

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const hasWholesaleItems = items.some((item) => item.isWholesale);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryCharge;

  const submitOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        district: district.trim(),
        deliveryArea: deliveryArea.trim(),
        deliveryLocation,
        notes: notes.trim(),
        couponCode: appliedCoupon?.code,
        customerId: customer?.id,
        orderType: hasWholesaleItems ? 'WHOLESALE' as const : 'RETAIL' as const,
        isWholesale: hasWholesaleItems,
        items: items.map((item) => ({
          productId: item.productId,
          sizeId: item.sizeId,
          sizeLabel: item.sizeLabel,
          quantity: item.quantity,
          isWholesale: item.isWholesale,
        })),
      };

      const res = await api.createOrder(payload);
      clearCart();
      setShowInvoiceReview(false);
      onOrderSuccess(res.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please review your details and try again.');
      setShowInvoiceReview(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (loc: DeliveryLocation) => {
    setDeliveryLocation(loc);
    if (loc === 'inside_dhaka' && district !== 'Dhaka') {
      setDistrict('Dhaka');
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponValidating(true);
    setCouponError(null);

    try {
      const res = await api.validateCoupon(couponInput.trim(), subtotal);
      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon?.code || couponInput.trim().toUpperCase(),
          discountAmount: res.discountAmount,
        });
        setCouponInput('');
      } else {
        setCouponError('Invalid coupon code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or expired coupon code.');
    } finally {
      setCouponValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Enforce Checkout Authentication Mode if configured by Admin
    if (settings.requireCustomerLogin && !customer) {
      setErrorMessage('A registered customer account is required to complete this order. Please sign in or register below.');
      setIsAuthModalOpen(true);
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setErrorMessage('Please enter a valid active phone number for courier delivery verification.');
      return;
    }

    if (!customerAddress.trim()) {
      setErrorMessage('Please enter your complete delivery street address.');
      return;
    }

    if (!district.trim()) {
      setErrorMessage('Please select your delivery district.');
      return;
    }

    if (hasWholesaleItems) {
      setShowInvoiceReview(true);
      return;
    }

    await submitOrder();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#a1a1aa] hover:text-[#10b981] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Selection</span>
      </button>

      {/* Customer Auth Mode Notice */}
      {settings.requireCustomerLogin && !customer && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Customer Authentication Required</strong>: Please sign in or register to finalize your order.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#10b981] text-black font-bold text-xs uppercase hover:bg-[#059669] shrink-0"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {customer && (
        <div className="mb-6 p-3 rounded-xl bg-[#14141d] border border-[#232332] text-xs flex items-center justify-between text-[#d1d5db]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#10b981]" />
            <span>
              Logged in as <strong className="text-white">{customer.name}</strong> ({customer.phone})
            </span>
          </div>
          <span className="text-[11px] text-[#22c55e] font-semibold">✓ Verified Customer</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT: Checkout Form ================= */}
        <div className="lg:col-span-7 bg-[#0f0f14] border border-[#22222b] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#10b981]">
              Express Cash on Delivery Checkout
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Delivery Details
            </h1>
            <p className="text-xs text-[#80808a] mt-1">
              Pay in cash only upon arrival and full physical inspection of your package.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Delivery Destination Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db]">
                1. Delivery Location Zone *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleLocationChange('inside_dhaka')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    deliveryLocation === 'inside_dhaka'
                      ? 'border-[#10b981] bg-[#1a1811] text-white shadow-sm'
                      : 'border-[#22222c] bg-[#141419] text-[#9ca3af] hover:border-[#333344]'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold text-white">Inside Dhaka</span>
                    <span className="text-[11px] text-[#71717a]">Express Delivery (24-48h)</span>
                  </div>
                  <span className="text-sm font-bold text-[#10b981] tabular-nums">
                    ৳{settings.deliveryFeeInsideDhaka ?? 80}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLocationChange('outside_dhaka')}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    deliveryLocation === 'outside_dhaka'
                      ? 'border-[#10b981] bg-[#1a1811] text-white shadow-sm'
                      : 'border-[#22222c] bg-[#141419] text-[#9ca3af] hover:border-[#333344]'
                  }`}
                >
                  <div>
                    <span className="block text-xs font-bold text-white">Outside Dhaka</span>
                    <span className="text-[11px] text-[#71717a]">Courier Delivery (48-72h)</span>
                  </div>
                  <span className="text-sm font-bold text-[#10b981] tabular-nums">
                    ৳{settings.deliveryFeeOutsideDhaka ?? 130}
                  </span>
                </button>
              </div>
            </div>

            {/* Customer Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                2. Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mahfuzur Rahman"
                className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Active Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                3. Active Phone Number (For Courier Call) *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 017XXXXXXXX or 018XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
              />
              <span className="text-[11px] text-[#71717a] mt-1 block">
                The courier delivery rider will call this number prior to arrival.
              </span>
            </div>

            {/* District & Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                  4. District *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
                >
                  {BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                  5. Thana / Delivery Area
                </label>
                <input
                  type="text"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  placeholder="e.g. Dhanmondi / Mirpur / Nasirabad"
                  className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            {/* Full Street Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                6. Complete Delivery Street Address *
              </label>
              <textarea
                required
                rows={3}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="House / Flat / Road / Sector / Landmark details..."
                className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Optional Special Instructions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#d1d5db] mb-1.5">
                Special Delivery Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Call before coming, leave with building reception..."
                className="w-full px-4 py-3 rounded-xl bg-[#14141a] border border-[#24242f] text-sm text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {/* Payment Method Badge */}
            <div className="p-4 rounded-xl bg-[#121217] border border-[#22222d] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1f1a10] border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Cash on Delivery (COD)
                  </div>
                  <div className="text-[11px] text-[#71717a]">
                    Pay cash to courier upon physical arrival and inspection
                  </div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: settings.primaryColor || '#10b981' }}
              className="w-full py-4 rounded-xl text-[#0a0a0a] font-bold text-sm uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#10b981]/20"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading
                  ? 'Processing Order...'
                  : settings.requireCustomerLogin && !customer
                  ? 'Sign In to Place Order'
                  : hasWholesaleItems
                  ? `বিল দেখে নিশ্চিত করুন (৳${grandTotal.toLocaleString()})`
                  : `Place Order (৳${grandTotal.toLocaleString()})`}
              </span>
            </button>
          </form>
        </div>

        {/* ================= RIGHT: Order Summary & Coupon Engine ================= */}
        <div className="lg:col-span-5 bg-[#0f0f14] border border-[#22222b] rounded-2xl p-6 sm:p-8 space-y-6 sticky top-28">
          <div className="border-b border-[#1f1f26] pb-4">
            <h2 className="font-serif text-lg font-bold text-white">Order Summary</h2>
            <p className="text-xs text-[#80808a]">{items.length} unique item(s) selected</p>
          </div>

          {/* Items itemized list */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.sizeLabel}`}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#141419] border border-[#1f1f26]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded object-cover bg-[#1c1c24] shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.productName}
                    </h4>
                    <span className="text-[11px] text-[#10b981] font-semibold block">
                      {item.isWholesale
                        ? `${item.quantity} মিলি পাইকারি`
                        : `${item.sizeLabel} × ${item.quantity}`}
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-white tabular-nums shrink-0">
                  ৳{(item.unitPrice * item.quantity).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Promo / Coupon Engine Box */}
          <div className="p-3.5 rounded-xl bg-[#141419] border border-[#202028] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#10b981]">
              <Ticket className="w-3.5 h-3.5" />
              <span>Promo / Coupon Code</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono font-bold">{appliedCoupon.code}</span>
                  <span>(Saved ৳{appliedCoupon.discountAmount.toLocaleString()})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-zinc-400 hover:text-white p-1"
                  title="Remove coupon"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ROYAL10"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0d0d12] border border-[#252535] text-xs text-white font-mono uppercase focus:outline-none focus:border-[#10b981]"
                />
                <button
                  type="submit"
                  disabled={couponValidating || !couponInput.trim()}
                  className="px-4 py-2 rounded-lg bg-[#1e1e2b] border border-[#2d2d3e] text-xs font-bold text-white hover:text-[#10b981] disabled:opacity-50 transition-colors"
                >
                  {couponValidating ? '...' : 'Apply'}
                </button>
              </form>
            )}

            {couponError && (
              <span className="text-[11px] text-red-400 block">{couponError}</span>
            )}
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 pt-4 border-t border-[#1f1f26] text-xs text-[#a1a1aa]">
            <div className="flex justify-between">
              <span>Products Subtotal</span>
              <span className="text-white font-medium tabular-nums">৳{subtotal.toLocaleString()}</span>
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span className="tabular-nums font-bold">-৳{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>
                Delivery Fee ({deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
              </span>
              <span className="text-white font-medium tabular-nums">৳{deliveryCharge}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-white pt-3 border-t border-[#1f1f26]">
              <span className="text-gold-gradient">Grand Total</span>
              <span className="tabular-nums">৳{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2 text-[11px] text-[#80808a] bg-[#121217] p-3 rounded-xl border border-[#202028]">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Tamper-Proof Luxury Flacon Boxing</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>Open Package & Check Before Payment</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              <span>100% Authentic Artisanal Concentrated Oils</span>
            </div>
          </div>
        </div>
      </div>

      {showInvoiceReview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="wholesale-invoice-title"
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-emerald-700/50 bg-[#0e0e13] p-5 sm:p-7 text-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#262630] pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  অর্ডার নিশ্চিত করার আগে
                </span>
                <h2 id="wholesale-invoice-title" className="mt-1 text-xl sm:text-2xl font-bold">
                  আপনার অর্ডার বিল
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceReview(false)}
                disabled={loading}
                aria-label="বিল বন্ধ করুন"
                className="rounded-lg px-3 py-1 text-xl text-[#a1a1aa] hover:bg-[#20202a] hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
              <div className="rounded-xl border border-[#24242e] bg-[#141419] p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-400">ক্রেতার তথ্য</h3>
                <p className="font-semibold">{customerName}</p>
                <p className="text-[#b7b7c0]">{customerPhone}</p>
              </div>
              <div className="rounded-xl border border-[#24242e] bg-[#141419] p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-400">ডেলিভারি</h3>
                <p>{district}{deliveryArea.trim() ? `, ${deliveryArea.trim()}` : ''}</p>
                <p className="text-[#b7b7c0]">{customerAddress}</p>
                <p className="mt-1 text-xs text-[#8f8f99]">
                  {deliveryLocation === 'inside_dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}
                </p>
              </div>
            </div>

            {notes.trim() && (
              <div className="mt-4 rounded-xl border border-[#24242e] bg-[#141419] p-4 text-sm">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-400">বিশেষ নির্দেশনা</h3>
                <p className="text-[#d1d1d8]">{notes.trim()}</p>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-xl border border-[#24242e]">
              <div className="bg-[#17171e] px-4 py-3 text-xs font-bold uppercase tracking-wide text-emerald-400">
                পণ্যের বিল
              </div>
              <div className="divide-y divide-[#24242e]">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.sizeLabel}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-[#a1a1aa]">
                        {item.isWholesale
                          ? `${item.quantity} মিলি × ${item.unitPrice.toLocaleString('en-BD', { maximumFractionDigits: 2 })} টাকা/মিলি`
                          : `${item.sizeLabel} × ${item.quantity}`}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold tabular-nums">
                      ৳{(item.unitPrice * item.quantity).toLocaleString('en-BD', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-[#24242e] bg-[#141419] p-4 text-sm">
              <div className="flex justify-between gap-4 text-[#b7b7c0]">
                <span>পণ্যের মোট</span>
                <span>৳{subtotal.toLocaleString('en-BD', { maximumFractionDigits: 2 })}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between gap-4 text-emerald-400">
                  <span>কুপন ছাড় ({appliedCoupon.code})</span>
                  <span>-৳{discountAmount.toLocaleString('en-BD', { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 text-[#b7b7c0]">
                <span>ডেলিভারি চার্জ</span>
                <span>৳{deliveryCharge.toLocaleString('en-BD')}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#30303a] pt-3 text-base font-bold">
                <span>সর্বমোট (ক্যাশ অন ডেলিভারি)</span>
                <span className="text-emerald-400">৳{grandTotal.toLocaleString('en-BD', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowInvoiceReview(false)}
                disabled={loading}
                className="rounded-xl border border-[#343440] bg-[#17171e] px-4 py-3 text-sm font-semibold text-[#d1d1d8] hover:bg-[#20202a] disabled:opacity-50"
              >
                তথ্য সম্পাদনা করুন
              </button>
              <button
                type="button"
                onClick={submitOrder}
                disabled={loading}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
              >
                {loading ? 'অর্ডার পাঠানো হচ্ছে…' : 'সব তথ্য ঠিক আছে — অর্ডার নিশ্চিত করুন'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import {
  Search,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  Phone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const STATUS_STEPS: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

export const OrderTrackingPage: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  const { settings } = useSiteSettings();

  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please provide both Order Number and Phone Number.');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      const order = await api.trackOrder(orderNumber.trim(), phone.trim());
      setTrackedOrder(order);
    } catch (err: any) {
      setError(
        err.message ||
          'No matching order was found. Please check your order confirmation SMS or WhatsApp receipt.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStepState = (step: OrderStatus, current: OrderStatus) => {
    if (current === 'Cancelled') {
      return 'cancelled';
    }
    const stepIdx = STATUS_STEPS.indexOf(step);
    const currIdx = STATUS_STEPS.indexOf(current);
    if (stepIdx < currIdx) return 'completed';
    if (stepIdx === currIdx) return 'current';
    return 'upcoming';
  };

  const cleanSupportPhone = (settings.whatsappNumber || '+8801700000000').replace(/[^0-9]/g, '');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div
          style={{ color: settings.primaryColor || '#10b981' }}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <Truck className="w-4 h-4" />
          <span>Real-Time Dispatch Tracker</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
          Track Your Royal Order
        </h1>
        <p className="text-xs sm:text-sm text-[#80808a] leading-relaxed">
          Monitor your artisanal flacons from packaging at our blending atelier to nationwide courier dispatch.
        </p>
      </div>

      {/* Tracking Input Card */}
      <div className="rounded-2xl bg-[#0f0f14] border border-[#202028] p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Order Number *
              </label>
              <div className="relative">
                <Package className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a]" />
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. BPP-2026-001..."
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Billing Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a]" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: settings.primaryColor || '#10b981' }}
            className="w-full py-3 rounded-xl text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Locating Order...' : 'Track Order Status'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {trackedOrder && (
        <div className="rounded-2xl bg-[#0f0f14] border border-[#24242e] p-6 sm:p-8 space-y-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1f1f26] gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#10b981]">
                Order Confirmed
              </span>
              <h2 className="font-serif text-2xl font-bold text-white mt-0.5">
                {trackedOrder.orderNumber}
              </h2>
              <span className="text-xs text-[#71717a] block mt-1">
                Placed on {new Date(trackedOrder.createdAt).toLocaleDateString()} at{' '}
                {new Date(trackedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  trackedOrder.status === 'Delivered'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                    : trackedOrder.status === 'Cancelled'
                    ? 'bg-red-950/80 text-red-400 border-red-800'
                    : 'bg-[#181822] text-[#10b981] border-[#10b981]/40'
                }`}
              >
                Status: {trackedOrder.status}
              </span>
            </div>
          </div>

          {/* Interactive Live Timeline */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] block">
              Fulfillment Journey
            </span>

            {trackedOrder.status === 'Cancelled' ? (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
                This order was cancelled. If you believe this is an error, please reach out to our concierge.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {STATUS_STEPS.map((step, idx) => {
                  const state = getStepState(step, trackedOrder.status);
                  return (
                    <div
                      key={step}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-1.5 transition-all ${
                        state === 'current'
                          ? 'bg-[#161622] border-[#10b981] text-white shadow-md'
                          : state === 'completed'
                          ? 'bg-[#121217] border-emerald-800/60 text-emerald-400'
                          : 'bg-[#0d0d11] border-[#1d1d24] text-[#52525b]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          state === 'current'
                            ? 'bg-[#10b981] text-black'
                            : state === 'completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {state === 'completed' ? '✓' : idx + 1}
                      </div>
                      <span className="text-xs font-bold">{step}</span>
                      <span className="text-[10px] opacity-80">
                        {state === 'completed'
                          ? 'Finished'
                          : state === 'current'
                          ? 'In Progress'
                          : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping & Payment Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#14141a] border border-[#202028] space-y-2">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                Delivery Destination
              </span>
              <div className="text-white font-bold">{trackedOrder.customerName}</div>
              <div className="text-[#a1a1aa] leading-relaxed">
                {trackedOrder.customerAddress}
                {trackedOrder.deliveryArea ? `, Area: ${trackedOrder.deliveryArea}` : ''}
                <br />
                <span className="text-white font-medium">
                  {trackedOrder.district} (
                  {trackedOrder.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#14141a] border border-[#202028] space-y-2">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                Payment Summary (Cash on Delivery)
              </span>
              <div className="space-y-1 text-[#a1a1aa]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white tabular-nums">৳{trackedOrder.subtotal.toLocaleString()}</span>
                </div>
                {trackedOrder.discountAmount && trackedOrder.discountAmount > 0 ? (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({trackedOrder.couponCode})</span>
                    <span className="tabular-nums">-৳{trackedOrder.discountAmount.toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-white tabular-nums">৳{trackedOrder.deliveryCharge}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-[#22222d]">
                  <span className="text-[#10b981]">Total Amount Payable</span>
                  <span className="tabular-nums">৳{trackedOrder.grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a1a1aa] block">
              Items in Package ({trackedOrder.items.length})
            </span>
            <div className="space-y-2">
              {trackedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#14141a] border border-[#202028] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 rounded object-cover bg-[#1c1c24]"
                    />
                    <div>
                      <div className="font-bold text-white">{item.productName}</div>
                      <div className="text-[11px] text-[#10b981]">
                        Size: {item.sizeLabel} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold tabular-nums">৳{item.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Assistance? */}
          <div className="pt-4 border-t border-[#1f1f26] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span className="text-[#80808a]">Questions regarding your delivery schedule?</span>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${cleanSupportPhone}?text=${encodeURIComponent(
                  `Inquiry about order ${trackedOrder.orderNumber}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold flex items-center gap-1.5 hover:bg-[#25D366]/30 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Courier Help</span>
              </a>
              <button
                onClick={onExplore}
                className="px-3.5 py-2 rounded-xl bg-[#181822] text-[#10b981] border border-[#2b2b3b] font-bold hover:bg-[#20202d] transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

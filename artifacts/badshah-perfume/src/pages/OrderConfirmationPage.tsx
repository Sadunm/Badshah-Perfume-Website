import React from 'react';
import { Order, AppConfig } from '../types/index.ts';
import { BottleImageWithOverlay } from '../components/BottleImageWithOverlay.tsx';
import {
  CheckCircle2,
  Crown,
  Truck,
  MessageCircle,
  Package,
  Calendar,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order;
  config: AppConfig | null;
  onContinueShopping: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order,
  config,
  onContinueShopping,
}) => {
  const whatsappNumber = config?.whatsappNumber || '+8801700000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');

  const whatsappMessage = encodeURIComponent(
    `Hello Badshah Perfume, I have placed Order #${order.orderNumber}. Name: ${order.customerName}, Phone: ${order.customerPhone}, Total: ৳${order.grandTotal}. Please confirm my shipment.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      {/* Success Banner */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center mx-auto text-[#10b981] shadow-xl shadow-[#10b981]/10">
          <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#10b981]">
            Order Confirmed & Received
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
            Thank You, {order.customerName}
          </h1>
          <p className="text-xs sm:text-sm text-[#9ca3af] max-w-lg mx-auto">
            Your royal order has been recorded in our system. Our dispatch team is packaging your perfumes with utmost care.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#181820] border border-[#272733] text-xs font-mono text-[#e5e7eb]">
          <span>Order Number:</span>
          <strong className="text-[#10b981]">{order.orderNumber}</strong>
        </div>
      </div>

      {/* Main Order Details Card */}
      <div className="rounded-2xl bg-[#0f0f14] border border-[#22222b] overflow-hidden shadow-2xl">
        {/* Meta Bar */}
        <div className="p-6 bg-[#13131a] border-b border-[#202029] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-[#9ca3af]">
            <Calendar className="w-4 h-4 text-[#10b981]" />
            <div>
              <span className="block text-[11px] text-[#71717a]">Order Date</span>
              <strong className="text-white">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[#9ca3af]">
            <Truck className="w-4 h-4 text-[#10b981]" />
            <div>
              <span className="block text-[11px] text-[#71717a]">Payment Method</span>
              <strong className="text-white">Cash on Delivery (COD)</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-[#9ca3af]">
            <Package className="w-4 h-4 text-[#10b981]" />
            <div>
              <span className="block text-[11px] text-[#71717a]">Order Status</span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                {order.status}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Customer & Shipping Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-[#14141a] border border-[#1f1f28] text-xs">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                Recipient Details
              </span>
              <div className="text-white font-medium">{order.customerName}</div>
              <div className="text-[#a1a1aa]">{order.customerPhone}</div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                Delivery Location
              </span>
              <div className="text-white font-medium">
                {order.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'} ({order.district})
              </div>
              <div className="text-[#a1a1aa] leading-relaxed">
                {order.customerAddress}
                {order.deliveryArea ? `, ${order.deliveryArea}` : ''}
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#d1d5db]">
              Ordered Fragrances ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-[#141419] border border-[#1e1e26] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 shrink-0 overflow-hidden rounded bg-[#1c1c24]">
                      <BottleImageWithOverlay
                        image={item.productImage}
                        name={item.productName}
                        className="h-full w-full object-contain object-center"
                        aspectRatio="aspect-square"
                        showNameSticker
                        compact
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{item.productName}</h4>
                      <span className="text-[11px] text-[#10b981] font-medium">
                        Size: {item.sizeLabel} × {item.quantity} flacon(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#71717a] block tabular-nums">
                      ৳{item.unitPrice} each
                    </span>
                    <strong className="text-sm text-white tabular-nums">
                      ৳{item.totalPrice.toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 rounded-xl bg-[#141419] border border-[#1e1e26] space-y-2 text-xs text-[#a1a1aa]">
            <div className="flex justify-between">
              <span>Product Subtotal</span>
              <span className="text-white font-medium tabular-nums">৳{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>
                Delivery Fee ({order.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
              </span>
              <span className="text-white font-medium tabular-nums">৳{order.deliveryCharge}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#22222b]">
              <span className="text-gold-gradient">Grand Total to Pay (COD)</span>
              <span className="tabular-nums">৳{order.grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Instructions and WhatsApp CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#1f1f26]">
            <a
              href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#25D366] hover:bg-[#20b857] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>Track on WhatsApp</span>
            </a>

            <button
              onClick={onContinueShopping}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>Explore More Fragrances</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

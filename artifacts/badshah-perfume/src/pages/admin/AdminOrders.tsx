import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { subscribeToRealtimeTable } from '../../services/supabase.ts';
import {
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Package,
  Phone,
  Calendar,
  X,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetOrders();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const unsubscribe = subscribeToRealtimeTable<Order>('orders', (payload) => {
      if (payload.eventType === 'INSERT') {
        setOrders((prev) => [payload.new, ...prev.filter((o) => o.id !== payload.new.id)]);
      } else if (payload.eventType === 'UPDATE') {
        setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
      } else if (payload.eventType === 'DELETE') {
        setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    setError(null);

    // Optimistic UI update across both list and active modal
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    try {
      const updated = await api.adminUpdateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated);
      }
      setMessage(`Order status updated to "${newStatus}"`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // Revert if API fails
      setOrders(previousOrders);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = selectedStatus === 'All' || o.status === selectedStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.district.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
            Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/60 text-blue-300 border border-blue-800/40">
            Confirmed
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/40">
            Processing
          </span>
        );
      case 'Shipped':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
            Shipped
          </span>
        );
      case 'Delivered':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950/60 text-red-300 border border-red-800/40">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
          Order Fulfillment Management
        </h1>
        <p className="text-xs text-[#80808a] mt-1">
          Historical order records preserve historical prices at the exact time of order.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === 'All'
                ? 'bg-[#10b981] text-[#0a0a0a]'
                : 'bg-[#141419] text-[#a1a1aa] hover:text-white'
            }`}
          >
            All Orders ({orders.length})
          </button>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-[#10b981] text-[#0a0a0a]'
                  : 'bg-[#141419] text-[#a1a1aa] hover:text-white'
              }`}
            >
              {st} ({orders.filter((o) => o.status === st).length})
            </button>
          ))}
        </div>

        {/* Search field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, phone, name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14141a] border border-[#24242e] text-xs text-white focus:outline-none focus:border-[#10b981]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#0f0f14] border border-[#202028] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14141a] text-[#a1a1aa] uppercase font-bold tracking-wider border-b border-[#1f1f26]">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181820]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a]">
                    Loading orders from database...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#71717a]">
                    <div className="space-y-1">
                      <ShoppingBag className="w-8 h-8 text-[#10b981] mx-auto opacity-40" />
                      <p className="font-semibold text-white">No orders found</p>
                      <p className="text-[11px] text-[#71717a]">
                        {searchQuery
                          ? 'No orders match your search term.'
                          : 'No orders exist in the selected status filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#121217] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#10b981]">
                      <div>{order.orderNumber}</div>
                      {(order.isWholesale || order.orderType === 'WHOLESALE') && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-950/90 text-purple-300 border border-purple-700/70 shadow-sm">
                          📦 পাইকারি / WHOLESALE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#a1a1aa]">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{order.customerName}</div>
                      <div className="text-[11px] text-[#71717a]">{order.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-white">{order.district}</span>
                      <span className="text-[11px] text-[#71717a] block">
                        {order.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#9ca3af]">
                      {order.items.length} item(s)
                    </td>
                    <td className="py-3 px-4 font-bold text-white tabular-nums">
                      ৳{order.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#272733] text-[#10b981] hover:bg-[#1a1a22] transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#101015] border border-[#24242e] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-xl font-bold text-white">
                    Order Details: {selectedOrder.orderNumber}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                  {(selectedOrder.isWholesale || selectedOrder.orderType === 'WHOLESALE') && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-950 text-purple-300 border border-purple-700">
                      📦 WHOLESALE
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#71717a]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#71717a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Updater */}
            <div className="p-4 rounded-xl bg-[#14141b] border border-[#232330] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#10b981] block">
                  Update Fulfillment Status
                </span>
                <span className="text-[11px] text-[#80808a]">
                  Instantly syncs with database pipeline
                </span>
              </div>

              <select
                disabled={updatingStatus}
                value={selectedOrder.status}
                onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                className="px-3 py-2 rounded-lg bg-[#181822] border border-[#2d2d3d] text-xs font-bold text-white focus:outline-none focus:border-[#10b981]"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#141419] border border-[#1f1f28] text-xs">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                  Customer Information
                </span>
                <div className="text-white font-bold text-sm">{selectedOrder.customerName}</div>
                <div className="flex items-center gap-2 text-[#a1a1aa]">
                  <Phone className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>{selectedOrder.customerPhone}</span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <a
                    href={`tel:${selectedOrder.customerPhone}`}
                    className="px-2.5 py-1 rounded bg-[#1c1c24] text-[#10b981] font-semibold text-[11px] hover:bg-[#252530]"
                  >
                    Call Customer
                  </a>
                  <a
                    href={`https://wa.me/${selectedOrder.customerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[#25D366]/20 text-[#25D366] font-semibold text-[11px] hover:bg-[#25D366]/30"
                  >
                    WhatsApp Chat
                  </a>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#10b981] uppercase tracking-wider block">
                  Delivery Address & Destination
                </span>
                <div className="text-white font-semibold">
                  {selectedOrder.district} (
                  {selectedOrder.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                </div>
                <div className="text-[#a1a1aa] leading-relaxed">
                  {selectedOrder.customerAddress}
                  {selectedOrder.deliveryArea ? `, Area: ${selectedOrder.deliveryArea}` : ''}
                </div>
                {selectedOrder.notes && (
                  <div className="text-[11px] text-amber-300/90 italic pt-1">
                    Note: "{selectedOrder.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Historical Order Items List */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#d1d5db] block">
                Ordered Perfumes (Preserved Historical Snapshot)
              </span>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#141419] border border-[#202028] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded object-cover bg-[#1c1c24]"
                      />
                      <div>
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[11px] text-[#10b981]">
                          Volume: {item.sizeLabel} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[#71717a] text-[11px] tabular-nums">৳{item.unitPrice} each</div>
                      <div className="text-white font-bold tabular-nums">৳{item.totalPrice.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-[#141419] border border-[#1f1f28] space-y-1.5 text-xs text-[#a1a1aa]">
              <div className="flex justify-between">
                <span>Products Subtotal</span>
                <span className="text-white font-medium tabular-nums">৳{selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Delivery Charge ({selectedOrder.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})
                </span>
                <span className="text-white font-medium tabular-nums">৳{selectedOrder.deliveryCharge}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-[#22222b]">
                <span className="text-gold-gradient">Grand Total (Cash on Delivery)</span>
                <span className="tabular-nums">৳{selectedOrder.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#242430] hover:bg-[#303040] text-xs font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

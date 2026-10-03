import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Clock,
  Truck,
  Check,
  XCircle,
  Banknote,
  Star,
  ArrowRight,
} from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  inStockProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  statusCounts: {
    Pending: number;
    Confirmed: number;
    Processing: number;
    Shipped: number;
    Delivered: number;
    Cancelled: number;
  };
  totalRevenue: number;
  pendingReviews: number;
  pendingCustomRequests?: number;
  wholesaleOrdersCount?: number;
  totalPushSubscribers?: number;
}

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.adminGetDashboard();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#a1a1aa]">
        Loading real database metrics...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
        {error || 'Error loading dashboard'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Executive Performance Dashboard
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Real-time verified metrics from Badshah PostgreSQL/SQLite database engine.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#141419] border border-[#24242e] text-xs text-[#10b981] hover:bg-[#1a1a22] transition-colors"
        >
          Refresh Live Data
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#80808a]">
            <span>Gross Sales Volume</span>
            <Banknote className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            ৳{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#22c55e]">Active Orders Total (Excl. Cancelled)</div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#80808a]">
            <span>Total Orders Placed</span>
            <ShoppingBag className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {stats.totalOrders}
          </div>
          <div className="text-[11px] text-[#a1a1aa]">Across 64 Bangladesh districts</div>
        </div>

        {/* Products In Stock */}
        <div className="p-5 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#80808a]">
            <span>Products In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {stats.inStockProducts} <span className="text-xs text-[#71717a] font-normal">/ {stats.totalProducts}</span>
          </div>
          <div className="text-[11px] text-emerald-400">Available in active collections</div>
        </div>

        {/* Out of Stock */}
        <div className="p-5 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#80808a]">
            <span>Out of Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {stats.outOfStockProducts}
          </div>
          <div className="text-[11px] text-[#71717a]">Needs replenishment</div>
        </div>
      </div>

      {/* Orders Breakdown by Status */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#d1d5db]">
          Order Fulfillment Pipeline Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Pending */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Pending}
            </div>
            <span className="text-[10px] text-[#71717a]">Awaiting dispatch review</span>
          </div>

          {/* Confirmed */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Confirmed</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Confirmed}
            </div>
            <span className="text-[10px] text-[#71717a]">Verified with buyer</span>
          </div>

          {/* Processing */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold">
              <Package className="w-3.5 h-3.5" />
              <span>Processing</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Processing}
            </div>
            <span className="text-[10px] text-[#71717a]">Boxing luxury flacons</span>
          </div>

          {/* Shipped */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
              <Truck className="w-3.5 h-3.5" />
              <span>Shipped</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Shipped}
            </div>
            <span className="text-[10px] text-[#71717a]">In courier transit</span>
          </div>

          {/* Delivered */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Delivered}
            </div>
            <span className="text-[10px] text-[#71717a]">Successfully completed</span>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="p-4 rounded-xl bg-[#141419] border border-[#22222b] hover:border-[#10b981]/40 cursor-pointer transition-all space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">
              {stats.statusCounts.Cancelled}
            </div>
            <span className="text-[10px] text-[#71717a]">Voided or returned</span>
          </div>
        </div>
      </div>

      {/* Custom Requests & Wholesale Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Custom Requests Card */}
        <div className="p-5 rounded-2xl bg-[#14141c] border border-[#272738] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {stats.pendingCustomRequests ?? 0} Pending Custom Perfume Request(s)
              </h4>
              <p className="text-[11px] text-[#9ca3af]">
                Customer bespoke formula and out-of-stock perfume inquiries.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('custom-requests')}
            className="px-3.5 py-2 rounded-lg bg-[#10b981] text-black font-bold text-xs flex items-center gap-1.5 shrink-0 hover:bg-[#059669] transition-colors"
          >
            <span>View Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wholesale Orders Card */}
        <div className="p-5 rounded-2xl bg-[#14141c] border border-purple-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-700/50 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {stats.wholesaleOrdersCount ?? 0} Wholesale (পাইকারি) Order(s)
              </h4>
              <p className="text-[11px] text-[#9ca3af]">
                High-volume bulk orders flagged with wholesale discounts.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span>Orders Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Moderation Alert Card */}
      {stats.pendingReviews > 0 && (
        <div className="p-5 rounded-2xl bg-[#14141c] border border-amber-800/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-700/50 flex items-center justify-center text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {stats.pendingReviews} New Review(s) Awaiting Moderation
              </h4>
              <p className="text-[11px] text-[#9ca3af]">
                Customer testimonials are pending your review before appearing publicly on the storefront.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('reviews')}
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shrink-0"
          >
            <span>Moderate Reviews</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

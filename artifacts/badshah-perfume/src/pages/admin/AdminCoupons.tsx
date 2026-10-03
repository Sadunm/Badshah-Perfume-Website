import React, { useState, useEffect } from 'react';
import { Coupon } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Ticket,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Percent,
  DollarSign,
  Calendar,
} from 'lucide-react';

export const AdminCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // In-app delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetCoupons();
      setCoupons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load coupon codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(10);
    setMinOrderAmount(0);
    setExpiresAt('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cpn: Coupon) => {
    setEditingCoupon(cpn);
    setCode(cpn.code);
    setDiscountType(cpn.discountType);
    setDiscountValue(cpn.discountValue);
    setMinOrderAmount(cpn.minOrderAmount || 0);
    setExpiresAt(cpn.expiresAt ? cpn.expiresAt.split('T')[0] : '');
    setIsActive(cpn.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) > 0 ? Number(minOrderAmount) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isActive,
    };

    try {
      if (editingCoupon) {
        const updated = await api.adminUpdateCoupon(editingCoupon.id, payload);
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setMessage(`Coupon "${payload.code}" updated successfully.`);
      } else {
        const created = await api.adminCreateCoupon(payload);
        setCoupons((prev) => [created, ...prev]);
        setMessage(`Coupon "${payload.code}" created and active.`);
      }
      setIsModalOpen(false);
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cpn: Coupon) => {
    const next = !cpn.isActive;
    // Optimistic UI update
    setCoupons((prev) => prev.map((c) => (c.id === cpn.id ? { ...c, isActive: next } : c)));

    try {
      await api.adminUpdateCoupon(cpn.id, { isActive: next });
      setMessage(`Coupon "${cpn.code}" ${next ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      setCoupons((prev) => prev.map((c) => (c.id === cpn.id ? { ...c, isActive: cpn.isActive } : c)));
      setError(err.message || 'Failed to toggle status');
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const target = coupons.find((c) => c.id === id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);

    try {
      await api.adminDeleteCoupon(id);
      setMessage(`Coupon "${target?.code || ''}" removed.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      if (target) setCoupons((prev) => [...prev, target]);
      setError(err.message || 'Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Promo & Coupon Code Engine
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Create percentage or flat discount codes. Customers validate these during checkout for instant savings.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#10b981]/15 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
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

      {/* Coupons Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#71717a]">
          Loading coupon codes...
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-3">
          <Ticket className="w-10 h-10 text-[#10b981] mx-auto opacity-40" />
          <h3 className="font-serif text-base font-bold text-white">No Coupons Configured</h3>
          <p className="text-xs text-[#80808a] max-w-sm mx-auto">
            Click "Create Coupon Code" to set up promotions (e.g. "ROYAL10" for 10% off or "EID100" for ৳100 discount).
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-[#10b981] text-black font-bold text-xs hover:bg-[#059669]"
          >
            Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((cpn) => (
            <div
              key={cpn.id}
              className={`p-5 rounded-2xl bg-[#0f0f14] border transition-all space-y-3 flex flex-col justify-between ${
                cpn.isActive ? 'border-[#2d2d3d] shadow-sm' : 'border-[#1e1e24] opacity-75'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16161f] border border-[#262635] text-xs font-mono font-bold text-[#10b981]">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>{cpn.code}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(cpn)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      cpn.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {cpn.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-zinc-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1">
                  <div className="font-serif text-xl font-bold text-white">
                    {cpn.discountType === 'PERCENTAGE'
                      ? `${cpn.discountValue}% OFF`
                      : `৳${cpn.discountValue} FLAT DISCOUNT`}
                  </div>
                  <div className="text-xs text-[#80808a] mt-0.5 space-y-0.5">
                    {cpn.minOrderAmount ? (
                      <div>Min order: ৳{cpn.minOrderAmount}</div>
                    ) : (
                      <div>No minimum order required</div>
                    )}
                    {cpn.expiresAt ? (
                      <div>Expires: {new Date(cpn.expiresAt).toLocaleDateString()}</div>
                    ) : (
                      <div>Never expires</div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#71717a]">
                  Redeemed: <strong className="text-white font-mono">{cpn.usageCount || 0}</strong> time(s)
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-[#1c1c22] flex items-center justify-between">
                <span className="text-[11px] text-[#52525b]">
                  {new Date(cpn.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {deletingId === cpn.id ? (
                    <div className="flex items-center gap-1 bg-red-950/60 border border-red-800 p-1 rounded-lg">
                      <span className="text-[11px] text-red-200 font-semibold px-1">Delete?</span>
                      <button
                        onClick={() => handleConfirmDelete(cpn.id)}
                        className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[11px]"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(cpn)}
                        className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-[#10b981]"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(cpn.id)}
                        className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-red-400"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101015] border border-[#24242e] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
              <h3 className="font-serif text-lg font-bold text-white">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Coupon'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#71717a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Coupon Promo Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ROYAL10"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white font-mono font-bold focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat BDT (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981] tabular-nums"
                    />
                    <span className="absolute right-3 top-2.5 text-[#71717a] font-bold">
                      {discountType === 'PERCENTAGE' ? '%' : '৳'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Minimum Order Subtotal
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#14141a] border border-[#22222e]">
                <input
                  type="checkbox"
                  id="cpnActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#10b981]"
                />
                <label htmlFor="cpnActive" className="text-white font-medium cursor-pointer">
                  Activate this coupon immediately
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#272733] text-[#a1a1aa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#10b981] text-black font-bold hover:bg-[#059669] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

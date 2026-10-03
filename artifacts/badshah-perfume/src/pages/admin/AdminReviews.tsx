import React, { useState, useEffect } from 'react';
import { Review, ReviewStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Star, CheckCircle2, XCircle, Trash2, AlertCircle, MessageSquare } from 'lucide-react';

export const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | ReviewStatus>('All');

  // In-app delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetReviews();
      setReviews(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: ReviewStatus) => {
    const target = reviews.find((r) => r.id === id);
    if (!target) return;

    // Optimistically update review status in local state immediately
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );

    try {
      await api.adminUpdateReviewStatus(id, newStatus);
      setMessage(`Review by "${target.customerName}" marked as ${newStatus}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // Revert if API failed
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: target.status } : r))
      );
      setError(err.message || 'Failed to update review status');
    }
  };

  const handleConfirmDelete = async (id: string) => {
    const target = reviews.find((r) => r.id === id);
    // Optimistically remove from state
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);

    try {
      await api.adminDeleteReview(id);
      setMessage(`Review by "${target?.customerName || ''}" deleted.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      if (target) {
        setReviews((prev) => [...prev, target]);
      }
      setError(err.message || 'Failed to delete review');
    }
  };

  const filtered = reviews.filter((r) => filter === 'All' || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Customer Testimonials Moderation
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Customer reviews require administrative approval before appearing publicly on the website.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141419] border border-[#22222d] text-xs">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === st
                  ? 'bg-[#d4af37] text-[#0a0a0a] font-bold'
                  : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              {st} {st !== 'All' ? `(${reviews.filter((r) => r.status === st).length})` : `(${reviews.length})`}
            </button>
          ))}
        </div>
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

      {loading ? (
        <div className="py-16 text-center text-xs text-[#71717a]">
          Loading customer reviews...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-3">
          <MessageSquare className="w-10 h-10 text-[#d4af37] mx-auto opacity-40" />
          <h3 className="font-serif text-base font-bold text-white">No Reviews in this Category</h3>
          <p className="text-xs text-[#80808a]">
            {filter === 'Pending'
              ? 'All customer testimonials have been moderated.'
              : `No ${filter.toLowerCase()} reviews currently exist in the database.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[#d4af37]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-[#d4af37]' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div>
                    {rev.status === 'Approved' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        Approved (Live)
                      </span>
                    )}
                    {rev.status === 'Pending' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                        Pending Moderation
                      </span>
                    )}
                    {rev.status === 'Rejected' && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950/60 text-red-400 border border-red-800/40">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#d1d5db] leading-relaxed italic">
                  "{rev.comment}"
                </p>

                <div className="pt-2 text-[11px] text-[#71717a]">
                  <strong className="text-white">{rev.customerName}</strong>
                  {rev.city && <span> · {rev.city}</span>}
                  {rev.productName && <span className="text-[#d4af37]"> · {rev.productName}</span>}
                  <span> · {new Date(rev.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#1c1c22] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rev.status !== 'Approved' && (
                    <button
                      onClick={() => handleStatusUpdate(rev.id, 'Approved')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {rev.status !== 'Rejected' && (
                    <button
                      onClick={() => handleStatusUpdate(rev.id, 'Rejected')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 text-amber-300 text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                <div>
                  {deletingId === rev.id ? (
                    <div className="flex items-center gap-1 bg-red-950/60 border border-red-800 p-1 rounded-lg">
                      <span className="text-[11px] text-red-200 font-semibold px-1">Delete?</span>
                      <button
                        onClick={() => handleConfirmDelete(rev.id)}
                        className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px]"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingId(rev.id)}
                      className="p-1.5 rounded-lg border border-[#272733] text-[#71717a] hover:text-red-400 hover:border-red-800/40 transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

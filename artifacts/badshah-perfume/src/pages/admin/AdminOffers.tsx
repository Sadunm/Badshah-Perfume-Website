import React, { useState, useEffect } from 'react';
import { Offer } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  ToggleLeft,
  ToggleRight,
  Upload,
} from 'lucide-react';

export const AdminOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // In-app delete confirmation state (avoids blocked window.confirm in iframe)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetOffers();
      setOffers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openAddModal = () => {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    setImage('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (off: Offer) => {
    setEditingOffer(off);
    setTitle(off.title);
    setDescription(off.description);
    setImage(off.image || '');
    setIsActive(off.isActive);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await api.adminUploadImage(file);
      setImage(res.url);
      setMessage('Offer image uploaded successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingOffer) {
        const updated = await api.adminUpdateOffer(editingOffer.id, {
          title: title.trim(),
          description: description.trim(),
          image: image.trim() || undefined,
          isActive,
        });
        // Immediately update state without needing page refresh
        setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setMessage('Offer updated successfully');
      } else {
        const created = await api.adminCreateOffer({
          title: title.trim(),
          description: description.trim(),
          image: image.trim() || undefined,
          isActive,
        });
        // Immediately prepend newly created offer
        setOffers((prev) => [created, ...prev]);
        setMessage('Offer created successfully and saved to database');
      }
      setIsModalOpen(false);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save offer');
    } finally {
      setSubmitting(false);
    }
  };

  // Immediate toggle of Active / Inactive state
  const handleToggleActive = async (offer: Offer) => {
    const nextStatus = !offer.isActive;
    // Optimistic UI update
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, isActive: nextStatus } : o))
    );

    try {
      await api.adminUpdateOffer(offer.id, { isActive: nextStatus });
      setMessage(`Offer "${offer.title}" marked as ${nextStatus ? 'Active' : 'Inactive'}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // Revert if request failed
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, isActive: offer.isActive } : o))
      );
      setError(err.message || 'Failed to update offer status');
    }
  };

  // Immediate delete with in-app confirmation (no native browser confirm popup)
  const handleConfirmDelete = async (id: string) => {
    const target = offers.find((o) => o.id === id);
    // Optimistically remove from state
    setOffers((prev) => prev.filter((o) => o.id !== id));
    setDeletingId(null);

    try {
      await api.adminDeleteOffer(id);
      setMessage(`Offer "${target?.title || ''}" deleted successfully.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // Revert if server call failed
      if (target) {
        setOffers((prev) => [...prev, target]);
      }
      setError(err.message || 'Failed to delete offer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Promotional Offers Management
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Create, edit, toggle active visibility, and delete offers with instantaneous database synchronization.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#10b981]/15"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Offer</span>
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

      {loading ? (
        <div className="py-16 text-center text-xs text-[#71717a]">
          Loading promotional offers from database...
        </div>
      ) : offers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-3">
          <Tag className="w-10 h-10 text-[#10b981] mx-auto opacity-40" />
          <h3 className="font-serif text-base font-bold text-white">No Offers Currently Configured</h3>
          <p className="text-xs text-[#80808a] max-w-sm mx-auto">
            Click "Create New Offer" to set up limited-time deals, discount notices, or gift packaging promotions.
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg bg-[#10b981] text-[#0a0a0a] font-bold text-xs hover:bg-[#059669]"
          >
            Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`p-5 rounded-2xl bg-[#0f0f14] border transition-all space-y-4 flex flex-col justify-between ${
                offer.isActive ? 'border-[#10b981]/40 shadow-sm' : 'border-[#202028] opacity-75'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#10b981] font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Promotional Offer</span>
                  </div>

                  {/* Active / Inactive Status Indicator & Quick Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(offer)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                      offer.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                    }`}
                    title="Click to toggle visibility on storefront"
                  >
                    {offer.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active (Public)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-zinc-400" />
                        <span>Inactive (Hidden)</span>
                      </>
                    )}
                  </button>
                </div>

                {offer.image && (
                  <img
                    src={offer.image}
                    alt={offer.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-32 rounded-xl object-cover border border-[#202028]"
                  />
                )}

                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-[#9ca3af] mt-1 leading-relaxed">
                    {offer.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons with In-App Confirmation to prevent blocked window.confirm */}
              <div className="pt-3 border-t border-[#1c1c22] flex items-center justify-between">
                <span className="text-[11px] text-[#71717a]">
                  Updated: {new Date(offer.updatedAt || offer.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  {deletingId === offer.id ? (
                    <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-800 p-1 rounded-lg">
                      <span className="text-[11px] text-red-200 font-semibold px-1">Delete?</span>
                      <button
                        onClick={() => handleConfirmDelete(offer.id)}
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
                    <>
                      <button
                        onClick={() => openEditModal(offer)}
                        className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-[#10b981] hover:border-[#10b981]/40 transition-colors"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(offer.id)}
                        className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-red-400 hover:border-red-800/40 transition-colors"
                        title="Delete Offer"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101015] border border-[#24242e] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
              <h3 className="font-serif text-lg font-bold text-white">
                {editingOffer ? 'Edit Promotional Offer' : 'Create New Offer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#71717a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Gift Box Special"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Offer Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of the promotion, qualifying terms, or free gift info..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Optional Offer Image */}
              <div className="space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Offer Banner Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Image URL or upload file"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  />
                  <label className="px-3 py-2.5 rounded-xl bg-[#1c1c26] border border-[#2c2c3d] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#14141a] border border-[#22222e]">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#10b981]"
                />
                <label htmlFor="isActive" className="text-white font-medium cursor-pointer">
                  Display this offer on customer storefront homepage
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
                  className="px-5 py-2 rounded-xl bg-[#10b981] text-[#0a0a0a] font-bold hover:bg-[#059669] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

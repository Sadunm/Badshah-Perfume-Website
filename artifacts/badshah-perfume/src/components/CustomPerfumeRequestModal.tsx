import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { Sparkles, X, CheckCircle2, AlertCircle, Send, Info } from 'lucide-react';

interface CustomPerfumeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPerfumeName?: string;
}

export const CustomPerfumeRequestModal: React.FC<CustomPerfumeRequestModalProps> = ({
  isOpen,
  onClose,
  initialPerfumeName = '',
}) => {
  const { settings } = useSiteSettings();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [perfumeName, setPerfumeName] = useState(initialPerfumeName);
  const [volumeMl, setVolumeMl] = useState(30);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync initial name if passed
  React.useEffect(() => {
    if (initialPerfumeName) {
      setPerfumeName(initialPerfumeName);
    }
  }, [initialPerfumeName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !perfumeName.trim()) {
      setError('অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং পারফিউমের নাম প্রদান করুন।');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await api.submitCustomRequest({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        perfumeName: perfumeName.trim(),
        volumeMl: Number(volumeMl) || 30,
        notes: notes.trim(),
      });

      setSuccessMessage(
        res.message || 'আপনার কাস্টম পারফিউম রিকোয়েস্ট সফলভাবে জমা হয়েছে। আমাদের টিম খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।'
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setPerfumeName('');
        setVolumeMl(30);
        setNotes('');
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'রিকোয়েস্ট পাঠাতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e0e13] border border-[#2b2b36] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#71717a] hover:text-white rounded-lg hover:bg-[#1a1a24] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>কাস্টম পারফিউম অর্ডার / Custom Request</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
            আপনার পছন্দের পারফিউম রিকোয়েস্ট করুন
          </h2>
          <p className="text-xs sm:text-sm text-[#9ca3af]">
            আমাদের কালেকশনে না থাকলে নাম ও ভলিউম লিখে পাঠান, আমাদের মাস্টার ব্লেন্ডার স্পেশালি আপনার জন্য তৈরি করে দিবে।
          </p>
        </div>

        {/* Prominent Bangla Notice */}
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm font-semibold leading-relaxed">
            {settings.customRequestNoticeBangla ||
              '৩০ মিলি এর কম অর্ডারের ক্ষেত্রে অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs sm:text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="p-6 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-base">{successMessage}</h3>
            <p className="text-xs text-emerald-300/80">ধন্যবাদ বাদশাহ প্রিমিয়াম পারফিউমের সাথে থাকার জন্য।</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                আপনার পুরো নাম <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                className="w-full px-4 py-2.5 rounded-lg bg-[#14141b] border border-[#262630] text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                মোবাইল নম্বর <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="যেমন: 01700-000000"
                className="w-full px-4 py-2.5 rounded-lg bg-[#14141b] border border-[#262630] text-white text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  কাঙ্ক্ষিত পারফিউমের নাম <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={perfumeName}
                  onChange={(e) => setPerfumeName(e.target.value)}
                  placeholder="যেমন: Creed Aventus / Baccarat Rouge"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#14141b] border border-[#262630] text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                  ভলিউম / Volume (ML) <span className="text-red-400">*</span>
                </label>
                <select
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#14141b] border border-[#262630] text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value={15}>15 ml (অতিরিক্ত চার্জ প্রযোজ্য)</option>
                  <option value={30}>30 ml (রেগুলার)</option>
                  <option value={50}>50 ml (জনপ্রিয়)</option>
                  <option value={100}>100 ml (রয়্যাল সাইজ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
                অতিরিক্ত বিবরণ বা নোট (ঐচ্ছিক)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="পারফিউম সম্পর্কে কোনো বিশেষ চাহিদা থাকলে লিখুন..."
                className="w-full px-4 py-2.5 rounded-lg bg-[#14141b] border border-[#262630] text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-6 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'জমা হচ্ছে...' : 'রিকোয়েস্ট সাবমিট করুন'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

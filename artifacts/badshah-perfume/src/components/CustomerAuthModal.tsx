import React, { useState } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { X, User, Phone, Lock, AlertCircle, CheckCircle2, Crown, Mail } from 'lucide-react';

export const CustomerAuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register } = useCustomerAuth();
  const { settings } = useSiteSettings();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(identifier, password);
        setSuccess('সফলভাবে লগইন হয়েছে!');
      } else {
        await register({
          name,
          phone,
          email: email.trim() || undefined,
          password,
        });
        setSuccess('অ্যাকাউন্ট তৈরি এবং লগইন সফল হয়েছে!');
      }
      setTimeout(() => {
        setIsAuthModalOpen(false);
      }, 800);
    } catch (err: any) {
      setError(err.message || 'অথেন্টিকেশন ব্যর্থ হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const bgImage =
    settings.authBackgroundImageUrl ||
    'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=1200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background Image Layer from Settings CMS */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none scale-105 filter blur-[2px]"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-[#08080a]/80 to-black/80 pointer-events-none" />

      {/* Main Card */}
      <div className="bg-[#0e0e14]/95 border border-[#2b2b38] rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 text-white backdrop-blur-xl">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-[#71717a] hover:text-white p-1 rounded-lg hover:bg-[#1f1f2a]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <div
            style={{ color: settings.primaryColor || '#10b981' }}
            className="w-12 h-12 rounded-full border border-current mx-auto flex items-center justify-center mb-2 bg-[#14141d] shadow-lg"
          >
            <Crown className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-white">
            {mode === 'login' ? 'কাস্টমার লগইন / Sign In' : 'নতুন অ্যাকাউন্ট তৈরি / Sign Up'}
          </h3>
          <p className="text-xs text-[#9ca3af]">
            {mode === 'login'
              ? 'আপনার সংরক্ষিত অর্ডার ট্র্যাকিং ও দ্রুত চেকআউট করুন'
              : 'বাদশাহ ভিআইপি মেম্বার হিসেবে যুক্ত হয়ে এক্সক্লুসিভ অফার পান'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Simplified Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">
                  পুরো নাম (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">
                  মোবাইল নম্বর (Phone Number) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01700000000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">
                  ইমেইল অ্যাড্রেস (Email Address - ঐচ্ছিক / Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com (ঐচ্ছিক)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-[#a1a1aa] font-semibold mb-1">
                মোবাইল নম্বর বা ইমেইল *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="017... অথবা ইমেইল"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#a1a1aa] font-semibold mb-1">
              পাসওয়ার্ড (Password) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: settings.primaryColor || '#10b981' }}
            className="w-full py-3 rounded-xl text-black font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all mt-2 shadow-lg"
          >
            {loading ? 'প্রসেসিং...' : mode === 'login' ? 'অ্যাকাউন্টে লগইন করুন' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#1f1f29] text-xs text-[#80808a]">
          {mode === 'login' ? (
            <p>
              নতুন কাস্টমার?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                এখনই অ্যাকাউন্ট খুলুন
              </button>
            </p>
          ) : (
            <p>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-emerald-400 font-semibold hover:underline"
              >
                এখানে লগইন করুন
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

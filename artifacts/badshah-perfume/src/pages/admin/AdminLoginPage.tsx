import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import { Crown, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onBackToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToStore }) => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Unauthorized email or incorrect password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col items-center">
      <div className="bg-red-600 text-white font-bold p-4 text-center w-full">⚠️ শুধুমাত্র এডমিনদের জন্য, সাধারণ ব্যবহারকারীদের জন্য প্রবেশ নিষিদ্ধ।</div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 w-full max-w-md">
        <div className="w-full bg-[#0f0f14] border border-[#23232c] rounded-2xl p-8 space-y-6 shadow-2xl relative">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Storefront</span>
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full border border-emerald-500/40 bg-[#141419] flex items-center justify-center mx-auto text-emerald-400">
              <Crown className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
              Admin Management Portal
            </h2>
            <p className="text-xs text-[#80808a]">
              Badshah Premium Perfume — Secure Administration
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  name="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#14141a] border border-[#262633] text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#71717a]" />
                <input
                  type="password"
                  required
                  autoComplete="off"
                  name="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#14141a] border border-[#262633] text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

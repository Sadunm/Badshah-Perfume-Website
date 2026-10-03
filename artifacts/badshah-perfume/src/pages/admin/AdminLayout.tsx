import React from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Home,
  Tag,
  Star,
  LogOut,
  ExternalLink,
  Crown,
  Sliders,
  Ticket,
  Sparkles,
  Bell,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onViewStorefront: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onViewStorefront,
  children,
}) => {
  const { admin, logout } = useAdminAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'custom-requests', label: 'Custom Requests', icon: Sparkles },
    { id: 'coupons', label: 'Coupons & Promos', icon: Ticket },
    { id: 'notifications', label: 'Push & Broadcast', icon: Bell },
    { id: 'offers', label: 'Offers', icon: Tag },
    { id: 'reviews', label: 'Reviews Moderation', icon: Star },
    { id: 'homepage', label: 'Homepage Management', icon: Home },
    { id: 'settings', label: 'Site Settings / Theme', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col">
      <div className="bg-red-600 text-white font-bold p-4 text-center w-full">⚠️ শুধুমাত্র এডমিনদের জন্য, সাধারণ ব্যবহারকারীদের জন্য প্রবেশ নিষিদ্ধ।</div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-[#0d0d10] border-r border-[#1e1e24] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-[#1e1e24] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-emerald-500/40 bg-[#141419] flex items-center justify-center text-emerald-400">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-serif text-sm font-bold tracking-wider text-emerald-400 block">
                  BADSHAH
                </span>
                <span className="text-[10px] text-[#71717a] uppercase tracking-wider block">
                  Admin Panel
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                      : 'text-[#9ca3af] hover:text-white hover:bg-[#15151c]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="p-4 border-t border-[#1e1e24] space-y-3">
          <div className="text-[11px] text-[#71717a]">
            Signed in as:
            <span className="text-white block font-medium truncate mt-0.5">
              {admin?.email}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <button
              onClick={onViewStorefront}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#24242f] text-xs font-semibold text-[#a1a1aa] hover:text-white hover:bg-[#15151c] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/30 border border-red-900/40 text-xs font-semibold text-red-300 hover:bg-red-950/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
      </div>
    </div>
  );
};

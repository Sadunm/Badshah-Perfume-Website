import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext.tsx';
import { api } from '../../services/api.ts';
import { subscribeToRealtimeTable } from '../../services/supabase.ts';
import {
  Palette,
  Layout,
  Phone,
  Truck,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
  ShieldAlert,
  BarChart,
  UserCheck,
  FileText,
  Video,
  Image as ImageIcon,
  Globe,
  Package,
} from 'lucide-react';

const PRESET_GOLD_PALETTES = [
  { name: 'Royal Gold (Default)', primary: '#10b981', secondary: '#059669', accent: '#f59e0b' },
  { name: 'Emirates Rose Gold', primary: '#b76e79', secondary: '#9c5b65', accent: '#e0a96d' },
  { name: 'Sultan Amber', primary: '#d97706', secondary: '#b45309', accent: '#fbbf24' },
  { name: 'Imperial Emerald', primary: '#059669', secondary: '#047857', accent: '#10b981' },
  { name: 'Midnight Platinum', primary: '#cbd5e1', secondary: '#94a3b8', accent: '#f1f5f9' },
];

export const AdminSiteSettings: React.FC = () => {
  const { settings, updateSettings, refreshSettings } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<
    'branding' | 'hero' | 'sections' | 'contact' | 'delivery' | 'pixels' | 'bangla' | 'media' | 'danger'
  >('branding');

  // Form State initialized from settings
  const [formData, setFormData] = useState({ ...settings });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAuthBg, setUploadingAuthBg] = useState(false);
  const [uploadingBottle, setUploadingBottle] = useState(false);

  // Sync when settings change from outside
  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  // Realtime subscription to site_settings table
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeTable('site_settings', () => {
      refreshSettings();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshSettings]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (preset: (typeof PRESET_GOLD_PALETTES)[0]) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
    setMessage(`Applied "${preset.name}" palette preview. Click "Save All Settings" to apply live.`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleUploadImage = async (
    file: File,
    target: 'logo' | 'brandLogo' | 'hero' | 'banner' | 'authBg' | 'bottle'
  ) => {
    try {
      if (target === 'logo') setUploadingLogo(true);
      else if (target === 'brandLogo') setUploadingBrandLogo(true);
      else if (target === 'hero') setUploadingHero(true);
      else if (target === 'banner') setUploadingBanner(true);
      else if (target === 'authBg') setUploadingAuthBg(true);
      else if (target === 'bottle') setUploadingBottle(true);

      const res = await api.adminUploadImage(file);
      if (target === 'logo') {
        handleChange('logoUrl', res.url);
      } else if (target === 'brandLogo') {
        handleChange('brandLogoUrl', res.url);
      } else if (target === 'hero') {
        handleChange('heroImageUrl', res.url);
      } else if (target === 'banner') {
        handleChange('homepageBannerImageUrl', res.url);
      } else if (target === 'authBg') {
        handleChange('authBackgroundImageUrl', res.url);
      } else if (target === 'bottle') {
        handleChange('defaultBottleImageUrl', res.url);
      }
      setMessage('Image uploaded successfully. Remember to click "Save All Settings".');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadingLogo(false);
      setUploadingBrandLogo(false);
      setUploadingHero(false);
      setUploadingBanner(false);
      setUploadingAuthBg(false);
      setUploadingBottle(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateSettings(formData);
      setMessage('All site settings, theme tokens, and dynamic section copy successfully saved!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const [confirmingPurge, setConfirmingPurge] = useState(false);
  const [purging, setPurging] = useState(false);

  const handleZeroStateReset = async () => {
    setPurging(true);
    setError(null);
    try {
      await api.adminResetZeroState();
      setMessage(
        'Database successfully purged to clean zero-state (0 products, 0 orders, 0 reviews, 0 offers, 0 coupons, 0 customers).'
      );
      setConfirmingPurge(false);
      await refreshSettings();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset database');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Site Configuration & Theme Engine
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Customize branding, theme tokens, customer checkout mode, marketing pixels, and deep section copy.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#10b981]/15 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Live...' : 'Save All Settings'}</span>
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

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#202028] pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'branding'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Branding & Colors</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'hero'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Hero & Announcement</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'sections'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Section Headings & Badges</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'delivery'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Checkout Mode & Rates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'contact'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>WhatsApp & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pixels')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'pixels'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <BarChart className="w-4 h-4" />
          <span>Pixels & Tracking</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bangla')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'bangla'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Bangla & Wholesale</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-[#181822] text-[#10b981] border border-[#10b981]/30'
              : 'text-[#80808a] hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Media & Bottle CMS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('danger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'danger'
              ? 'bg-red-950/40 text-red-400 border border-red-800/40'
              : 'text-[#80808a] hover:text-red-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Zero-State Purge</span>
        </button>
      </div>

      {/* Tab 1: Branding & Theme Colors */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Brand Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Storefront Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.siteName}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-[#1a1a22]">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Brand Logo (Header Wordmark Icon)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.brandLogoUrl || ''}
                    onChange={(e) => handleChange('brandLogoUrl', e.target.value)}
                    placeholder="https://... or upload"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2c2c3d] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingBrandLogo ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'brandLogo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Full Logo URL (Alternative)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.logoUrl}
                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                    placeholder="https://... or upload"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  />
                  <label className="px-3.5 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2c2c3d] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'logo')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Favicon URL
                </label>
                <input
                  type="text"
                  value={formData.faviconUrl}
                  onChange={(e) => handleChange('faviconUrl', e.target.value)}
                  placeholder="https://.../favicon.png"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                  Theme Color Tokens
                </h2>
                <p className="text-[11px] text-[#80808a] mt-0.5">
                  Real-time CSS variable injection applies these color codes across storefront buttons, badges, and accents.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-[#10b981]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live CSS Injection</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                One-Click Luxury Presets
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_GOLD_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141419] border border-[#232330] hover:border-[#10b981] text-xs text-white transition-all"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/40"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-3 border-t border-[#1a1a22]">
              <div className="p-3.5 rounded-xl bg-[#14141a] border border-[#22222d] space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor || '#10b981'}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#333344] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0d0d12] border border-[#262635] text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141a] border border-[#22222d] space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Hover / Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor || '#059669'}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#333344] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0d0d12] border border-[#262635] text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#14141a] border border-[#22222d] space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Accent Highlight Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor || '#f59e0b'}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="w-9 h-9 rounded-lg border border-[#333344] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#0d0d12] border border-[#262635] text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Hero & Announcement */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                  Top Announcement Ticker Bar
                </h2>
                <p className="text-[11px] text-[#80808a] mt-0.5">
                  Appears at the very top of every storefront page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementBarEnabled"
                  checked={formData.announcementBarEnabled}
                  onChange={(e) => handleChange('announcementBarEnabled', e.target.checked)}
                  className="w-4 h-4 accent-[#10b981]"
                />
                <label htmlFor="announcementBarEnabled" className="text-xs text-white font-semibold cursor-pointer">
                  {formData.announcementBarEnabled ? 'Bar Enabled' : 'Bar Disabled'}
                </label>
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Announcement Text Message
              </label>
              <input
                type="text"
                value={formData.announcementBarText}
                onChange={(e) => handleChange('announcementBarText', e.target.value)}
                placeholder="e.g. Free gift velvet pouch with qualifying orders · Nationwide Cash on Delivery"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Storefront Hero Section
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Hero Headline *
                </label>
                <input
                  type="text"
                  required
                  value={formData.heroTitle}
                  onChange={(e) => handleChange('heroTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Hero Subtitle Copy *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.heroSubtitle}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.heroCtaText}
                    onChange={(e) => handleChange('heroCtaText', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                    Hero Banner Image
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.heroImageUrl}
                      onChange={(e) => handleChange('heroImageUrl', e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                    />
                    <label className="px-3.5 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2c2c3d] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingHero ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'hero')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Section Headings & Badges */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Hero Feature Badges (3 Pillars)
            </h2>
            <p className="text-[11px] text-[#80808a]">
              The 3 green-check trust badges displayed directly below the hero CTA button.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Feature Badge 1
                </label>
                <input
                  type="text"
                  value={formData.featureBadge1}
                  onChange={(e) => handleChange('featureBadge1', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Feature Badge 2
                </label>
                <input
                  type="text"
                  value={formData.featureBadge2}
                  onChange={(e) => handleChange('featureBadge2', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Feature Badge 3
                </label>
                <input
                  type="text"
                  value={formData.featureBadge3}
                  onChange={(e) => handleChange('featureBadge3', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Collections & Reviews Headings
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Collections Title
                </label>
                <input
                  type="text"
                  value={formData.collectionsTitle}
                  onChange={(e) => handleChange('collectionsTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Collections Subtitle
                </label>
                <input
                  type="text"
                  value={formData.collectionsSubtitle}
                  onChange={(e) => handleChange('collectionsSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Reviews Section Title
                </label>
                <input
                  type="text"
                  value={formData.reviewsSectionTitle}
                  onChange={(e) => handleChange('reviewsSectionTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Reviews Section Subtitle
                </label>
                <input
                  type="text"
                  value={formData.reviewsSectionSubtitle}
                  onChange={(e) => handleChange('reviewsSectionSubtitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Brand Heritage & About Us Copy
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  About Section Title
                </label>
                <input
                  type="text"
                  value={formData.aboutSectionTitle}
                  onChange={(e) => handleChange('aboutSectionTitle', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  About Content Description
                </label>
                <textarea
                  rows={4}
                  value={formData.aboutSectionContent}
                  onChange={(e) => handleChange('aboutSectionContent', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  About Highlight Quote / Callout
                </label>
                <input
                  type="text"
                  value={formData.aboutSectionHighlight}
                  onChange={(e) => handleChange('aboutSectionHighlight', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Checkout Mode & Rates */}
      {activeTab === 'delivery' && (
        <div className="space-y-6">
          {/* Checkout Auth Mode Toggle */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                  Checkout Authentication Policy
                </h2>
                <p className="text-[11px] text-[#80808a] mt-0.5">
                  Control whether customers can check out as guests or must log in before finalizing an order.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requireCustomerLogin"
                  checked={formData.requireCustomerLogin}
                  onChange={(e) => handleChange('requireCustomerLogin', e.target.checked)}
                  className="w-4 h-4 accent-[#10b981]"
                />
                <label
                  htmlFor="requireCustomerLogin"
                  className="text-xs text-white font-bold cursor-pointer"
                >
                  {formData.requireCustomerLogin ? 'Login Required' : 'Guest Checkout Allowed'}
                </label>
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                formData.requireCustomerLogin
                  ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
              }`}
            >
              {formData.requireCustomerLogin ? (
                <span>
                  🔒 <strong>Customer Account Mandatory</strong>: Customers attempting to proceed to checkout will be prompted to register or log in before submitting their order.
                </span>
              ) : (
                <span>
                  ⚡ <strong>Fast Frictionless Guest Checkout Enabled</strong>: Customers only enter their delivery name, phone number, and shipping address without needing an account.
                </span>
              )}
            </div>
          </div>

          {/* Delivery Rates */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Delivery Rates (Authoritative BDT)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#14141a] border border-[#22222d] space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Inside Dhaka Shipping Charge (BDT) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#10b981] font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.deliveryFeeInsideDhaka}
                    onChange={(e) => handleChange('deliveryFeeInsideDhaka', Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0d0d12] border border-[#262635] text-white font-bold text-sm tabular-nums"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#14141a] border border-[#22222d] space-y-2">
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
                  Outside Dhaka Shipping Charge (BDT) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#10b981] font-bold">৳</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.deliveryFeeOutsideDhaka}
                    onChange={(e) => handleChange('deliveryFeeOutsideDhaka', Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0d0d12] border border-[#262635] text-white font-bold text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs pt-3 border-t border-[#1a1a22]">
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Footer Copyright Text
              </label>
              <input
                type="text"
                value={formData.footerCopyrightText}
                onChange={(e) => handleChange('footerCopyrightText', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Contact & WhatsApp */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Contact Channels & WhatsApp Widget
            </h2>
            <p className="text-[11px] text-[#80808a] mt-0.5">
              These details configure the floating WhatsApp button, order tracker links, and header/footer hotlines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                WhatsApp Hotline Number *
              </label>
              <input
                type="text"
                required
                value={formData.whatsappNumber}
                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                placeholder="+8801700000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
              <span className="text-[10px] text-[#71717a] mt-0.5 block">
                Include country code (e.g. +8801712345678)
              </span>
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Display Phone Hotline
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Contact Email Address
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="contact@badshahperfume.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Physical Store / Office Address
              </label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => handleChange('storeAddress', e.target.value)}
                placeholder="Banani, Dhaka - 1213, Bangladesh"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Facebook Page / Messenger URL
              </label>
              <input
                type="text"
                value={formData.facebookUrl}
                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                placeholder="https://m.me/badshahperfume"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Instagram Profile URL
              </label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(e) => handleChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/badshahperfume"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Marketing Pixels & Analytics */}
      {activeTab === 'pixels' && (
        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-5">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Ad Tracking Pixels & Web Analytics
            </h2>
            <p className="text-[11px] text-[#80808a] mt-0.5">
              These script tags will be injected automatically across storefront sessions for conversion tracking.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Meta (Facebook) Pixel ID
              </label>
              <input
                type="text"
                value={formData.metaPixelId}
                onChange={(e) => handleChange('metaPixelId', e.target.value)}
                placeholder="e.g. 123456789012345"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
              <span className="text-[11px] text-[#71717a] mt-1 block">
                Automatically activates standard PageView and conversion events.
              </span>
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Google Analytics 4 (GA4) Measurement ID
              </label>
              <input
                type="text"
                value={formData.googleAnalyticsId}
                onChange={(e) => handleChange('googleAnalyticsId', e.target.value)}
                placeholder="e.g. G-ABC123XYZ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                TikTok Pixel ID
              </label>
              <input
                type="text"
                value={formData.tiktokPixelId}
                onChange={(e) => handleChange('tiktokPixelId', e.target.value)}
                placeholder="e.g. C1234567890ABCDEF"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bangla Localization & Wholesale Portal */}
      {activeTab === 'bangla' && (
        <div className="space-y-6">
          {/* Bangla Search & Custom Request */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Bangla Search Bar & Custom Request Copy
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Search Heading (Bangla)
                </label>
                <input
                  type="text"
                  value={formData.searchHeadingBangla}
                  onChange={(e) => handleChange('searchHeadingBangla', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Customer Review Button (Bangla)
                </label>
                <input
                  type="text"
                  value={formData.customerReviewsCtaText}
                  onChange={(e) => handleChange('customerReviewsCtaText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  View All Collections Button (Bangla)
                </label>
                <input
                  type="text"
                  value={formData.collectionsViewAllText}
                  onChange={(e) => handleChange('collectionsViewAllText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Collapse Collections Button (Bangla)
                </label>
                <input
                  type="text"
                  value={formData.collectionsShowLessText}
                  onChange={(e) => handleChange('collectionsShowLessText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Wholesale Button (Bangla)
                </label>
                <input
                  type="text"
                  value={formData.wholesaleCtaText}
                  onChange={(e) => handleChange('wholesaleCtaText', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Storefront Search Bar Placeholder (Bangla)
              </label>
              <input
                type="text"
                value={formData.searchPlaceholderBangla}
                onChange={(e) => handleChange('searchPlaceholderBangla', e.target.value)}
                placeholder="যেমন: আপনার কাঙ্ক্ষিত পারফিউম সার্চ দিন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                No Search Results Message (Bangla)
              </label>
              <textarea
                rows={3}
                value={formData.searchNoResultsMessageBangla}
                onChange={(e) => handleChange('searchNoResultsMessageBangla', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Custom Perfume Request Notice (Bangla)
              </label>
              <textarea
                rows={2}
                value={formData.customRequestNoticeBangla}
                onChange={(e) => handleChange('customRequestNoticeBangla', e.target.value)}
                placeholder="যেমন: ৩০ মিলি এর কম অর্ডারের ক্ষেত্রে অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981] resize-none"
              />
            </div>
          </div>

          {/* 24/7 Customer Service Badge */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
                  24/7 Customer Service Badge
                </h2>
                <p className="text-xs text-[#80808a]">
                  Prominently displays the live service indicator in Header and Features strip.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.customerServiceBadgeEnabled !== false}
                  onChange={(e) => handleChange('customerServiceBadgeEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10b981]"></div>
              </label>
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Badge Text (Bangla)
              </label>
              <input
                type="text"
                value={formData.customerServiceBadgeText}
                onChange={(e) => handleChange('customerServiceBadgeText', e.target.value)}
                placeholder="যেমন: ২৪/৭ কাস্টমার সার্ভিস"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Wholesale (Paikari) Portal Engine */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Wholesale (পাইকারি) Portal Policy & Rates
            </h2>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Wholesale Banner Notice (Bangla)
              </label>
              <textarea
                rows={2}
                value={formData.wholesaleNoticeBangla}
                onChange={(e) => handleChange('wholesaleNoticeBangla', e.target.value)}
                placeholder="পাইকারি মূল্য তালিকার দর প্রতি মিলি হিসেবে; ৫০ মিলি বোতল ও ন্যূনতম অর্ডার পরিমাণ অনুযায়ী মোট হিসাব হবে। বিস্তারিত জানতে ইনবক্স করুন।"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Minimum Wholesale Quantity (Flacons)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.wholesaleMinQty}
                  onChange={(e) => handleChange('wholesaleMinQty', Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Telegram Channel / Direct Link
                </label>
                <input
                  type="text"
                  value={formData.telegramUrl}
                  onChange={(e) => handleChange('telegramUrl', e.target.value)}
                  placeholder="https://t.me/badshahperfume"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Media CMS & Luxury Bottle System */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Promotional Video CMS */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Homepage Promotional Video Player CMS
            </h2>
            <p className="text-xs text-[#80808a]">
              Insert YouTube Embed URL (e.g. https://www.youtube.com/embed/...) or a direct MP4 URL to render a luxury video showcase on the storefront.
            </p>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Video Embed / Direct MP4 URL
              </label>
              <input
                type="text"
                value={formData.homepageVideoUrl}
                onChange={(e) => handleChange('homepageVideoUrl', e.target.value)}
                placeholder="e.g. https://www.youtube.com/embed/dQw4w9WgXcQ"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>

            {formData.homepageVideoUrl && (
              <div className="aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-[#2a2a38] bg-black">
                {formData.homepageVideoUrl.includes('youtube.com') ||
                formData.homepageVideoUrl.includes('youtu.be') ? (
                  <iframe
                    src={formData.homepageVideoUrl}
                    title="Video Preview"
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={formData.homepageVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}
          </div>

          {/* Promotional Banner Image CMS */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Homepage Promotional Banner Image
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={formData.homepageBannerImageUrl}
                  onChange={(e) => handleChange('homepageBannerImageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />

                <div className="mt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141a] border border-[#262635] text-xs font-semibold text-[#10b981] hover:bg-[#1a1a24]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'banner');
                      }}
                    />
                  </label>
                </div>
              </div>

              {formData.homepageBannerImageUrl && (
                <div className="h-32 rounded-xl overflow-hidden border border-[#2a2a38] bg-[#121217]">
                  <img
                    src={formData.homepageBannerImageUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Customer Auth Page Background CMS */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Customer Auth (Sign In / Sign Up) Background Image CMS
            </h2>
            <p className="text-xs text-[#80808a]">
              Displays behind the customer login and registration modal for a VIP luxury ambience.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Auth Background Image URL
                </label>
                <input
                  type="text"
                  value={formData.authBackgroundImageUrl}
                  onChange={(e) => handleChange('authBackgroundImageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />

                <div className="mt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141a] border border-[#262635] text-xs font-semibold text-[#10b981] hover:bg-[#1a1a24]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingAuthBg ? 'Uploading...' : 'Upload Background Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'authBg');
                      }}
                    />
                  </label>
                </div>
              </div>

              {formData.authBackgroundImageUrl && (
                <div className="h-32 rounded-xl overflow-hidden border border-[#2a2a38] bg-[#121217]">
                  <img
                    src={formData.authBackgroundImageUrl}
                    alt="Auth Background Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Master Empty Luxury Perfume Bottle Image (Module 10) */}
          <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Master Empty Luxury Perfume Bottle (Label Overlay System)
            </h2>
            <p className="text-xs text-[#80808a]">
              When any product lacks a unique custom product photo, this master luxury bottle image is used as the canvas with a dynamic gold-foiled label displaying the perfume name.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Master Bottle Image URL
                </label>
                <input
                  type="text"
                  value={formData.defaultBottleImageUrl}
                  onChange={(e) => handleChange('defaultBottleImageUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
                />

                <div className="mt-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#14141a] border border-[#262635] text-xs font-semibold text-[#10b981] hover:bg-[#1a1a24]">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingBottle ? 'Uploading...' : 'Upload Master Bottle Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'bottle');
                      }}
                    />
                  </label>
                </div>
              </div>

              {formData.defaultBottleImageUrl && (
                <div className="h-44 w-36 rounded-xl overflow-hidden border border-[#2a2a38] bg-[#121217] mx-auto sm:mx-0">
                  <img
                    src={formData.defaultBottleImageUrl}
                    alt="Master Bottle Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Danger Zone Zero-State Purge */}
      {activeTab === 'danger' && (
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
          <div className="flex items-center gap-2 text-red-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Emergency Zero-State Database Purge
            </h2>
          </div>

          <p className="text-xs text-[#a1a1aa] leading-relaxed">
            This operation will instantly wipe all products, orders, customer accounts, coupons, reviews, and promotional offers from the database, resetting them to an absolute clean zero state (`[]`).
            <br />
            <strong>Your configured owner-admin access and site settings will remain intact.</strong>
          </p>

          <div className="pt-2">
            {confirmingPurge ? (
              <div className="p-4 rounded-xl bg-red-950/80 border border-red-700 space-y-3">
                <span className="text-xs text-red-200 font-bold block">
                  Are you absolutely certain? This will delete all catalog items, coupons, and orders permanently.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={purging}
                    onClick={handleZeroStateReset}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase"
                  >
                    {purging ? 'Purging...' : 'Yes, Purge Database Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingPurge(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingPurge(true)}
                className="px-4 py-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900/60 text-xs font-bold transition-colors"
              >
                Reset Database to Clean Zero-State
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom Save Action Button */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#10b981]/15"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing Live...' : 'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { HomepageContent, Product } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useSiteSettings } from '../../context/SiteSettingsContext.tsx';
import { Upload, CheckCircle2, AlertCircle, Save, ChevronUp, ChevronDown } from 'lucide-react';

export const AdminHomepage: React.FC = () => {
  const { refreshSettings } = useSiteSettings();
  const [content, setContent] = useState<HomepageContent | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [data, settings, productList] = await Promise.all([
          api.getHomepage(),
          api.getSettings(),
          api.getProducts(),
        ]);
        setContent({
          ...data,
          heroImage: settings.heroImageUrl || data.heroImage,
          heroHeading: settings.heroTitle || data.heroHeading,
          heroSubtitle: settings.heroSubtitle || data.heroSubtitle,
          heroButtonText: settings.heroCtaText || data.heroButtonText,
        });
        setProducts(productList);
      } catch (err: any) {
        setError(err.message || 'Failed to load homepage content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;
    setUploading(true);
    try {
      const res = await api.adminUploadImage(file);
      setContent({ ...content, heroImage: res.url });
      setMessage('Hero image uploaded. Remember to click "Save Changes".');
      setTimeout(() => setMessage(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const moveFeaturedProduct = (fromIndex: number, direction: -1 | 1) => {
    if (!content) return;
    const featuredProductIds = [...(content.featuredProductIds || [])];
    const targetIndex = fromIndex + direction;
    if (targetIndex < 0 || targetIndex >= featuredProductIds.length) return;
    [featuredProductIds[fromIndex], featuredProductIds[targetIndex]] = [
      featuredProductIds[targetIndex],
      featuredProductIds[fromIndex],
    ];
    setContent({ ...content, featuredProductIds });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.adminUpdateHomepage(content);
      setContent(updated);
      await refreshSettings();
      setMessage('Homepage content saved and live on storefront!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save homepage content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-xs text-[#a1a1aa]">Loading homepage content...</div>;
  }

  if (!content) return null;
  const selectedIds = content.featuredProductIds || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Homepage Content Management
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Update marketing banners, hero text, and trust assurances directly without touching code.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#10b981]/15"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 1. Hero / Banner Section */}
        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
            1. Hero Banner Settings
          </h2>

          <div className="space-y-2 text-xs">
            <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider">
              Hero Banner Image
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={content.heroImage}
                onChange={(e) => setContent({ ...content, heroImage: e.target.value })}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white text-xs focus:outline-none focus:border-[#10b981]"
              />
              <label className="px-4 py-2.5 rounded-xl bg-[#1c1c26] border border-[#2b2b3b] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeroImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            {content.heroImage && (
              <img
                src={content.heroImage}
                alt="Hero Preview"
                className="h-28 w-full object-cover rounded-xl border border-[#242430] mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Hero Heading Title
              </label>
              <input
                type="text"
                value={content.heroHeading}
                onChange={(e) => setContent({ ...content, heroHeading: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white text-sm font-serif focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Hero Subtitle
              </label>
              <textarea
                rows={2}
                value={content.heroSubtitle}
                onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white text-xs leading-relaxed focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={content.heroButtonText}
                  onChange={(e) => setContent({ ...content, heroButtonText: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white text-xs focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                  Primary Button Destination URL / Anchor
                </label>
                <input
                  type="text"
                  value={content.heroButtonDestination}
                  onChange={(e) => setContent({ ...content, heroButtonDestination: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white text-xs focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Trust & Quality Section */}
        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
            2. Trust & Quality Assurances (5 Points)
          </h2>
          <div className="space-y-4">
            {content.trustItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#14141a] border border-[#22222d] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
              >
                <div>
                  <label className="block text-[#71717a] font-semibold mb-1">
                    Point {idx + 1} Title
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const copy = [...content.trustItems];
                      copy[idx].title = e.target.value;
                      setContent({ ...content, trustItems: copy });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e0e13] border border-[#272735] text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[#71717a] font-semibold mb-1">
                    Point {idx + 1} Description
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const copy = [...content.trustItems];
                      copy[idx].description = e.target.value;
                      setContent({ ...content, trustItems: copy });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0e0e13] border border-[#272735] text-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
              Featured Collection Products
            </h2>
            <p className="text-xs text-[#80808a] mt-1">
              Choose up to six products and set their display order. Leave all unchecked to use the first six active products.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-[#262635] bg-[#0b0b10] p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
              Display order — first card appears first
            </p>
            {selectedIds.length > 0 ? (
              <div className="space-y-1.5">
                {selectedIds.map((id, index) => {
                  const product = products.find((item) => item.id === id);
                  if (!product) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 rounded-lg bg-[#14141a] px-3 py-2"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10b981]/15 text-[11px] font-bold text-emerald-300">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">
                        {product.name}
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${product.name} up`}
                        disabled={index === 0}
                        onClick={() => moveFeaturedProduct(index, -1)}
                        className="rounded p-1 text-[#a1a1aa] hover:bg-[#252530] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${product.name} down`}
                        disabled={index === selectedIds.length - 1}
                        onClick={() => moveFeaturedProduct(index, 1)}
                        className="rounded p-1 text-[#a1a1aa] hover:bg-[#252530] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#73737e]">
                No custom order yet. The first six products in the catalog will be shown.
              </p>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto rounded-xl border border-[#262635] divide-y divide-[#22222d]">
            {products.map((product) => {
              const selected = selectedIds.includes(product.id);
              const selectedIndex = selectedIds.indexOf(product.id);
              return (
                <label
                  key={product.id}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#15151e] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const nextSelected = e.target.checked
                        ? [...selectedIds, product.id]
                        : selectedIds.filter((id) => id !== product.id);
                      if (nextSelected.length > 6) {
                        setError('Select no more than six featured products.');
                        return;
                      }
                      setError(null);
                      setContent({ ...content, featuredProductIds: nextSelected });
                    }}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  {selectedIndex >= 0 && (
                    <span className="rounded bg-[#10b981]/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      #{selectedIndex + 1}
                    </span>
                  )}
                  <span className="text-xs text-[#80808a]">{product.fragranceType}</span>
                </label>
              );
            })}
            {products.length === 0 && (
              <p className="px-4 py-6 text-sm text-[#80808a]">No active products are available.</p>
            )}
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Selected: {(content.featuredProductIds || []).length} / 6
          </p>
        </div>

        {/* 3. About Us Section */}
        <div className="p-6 rounded-2xl bg-[#0f0f14] border border-[#202028] space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#10b981]">
            3. About Us / Brand Heritage
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Section Heading
              </label>
              <input
                type="text"
                value={content.aboutTitle}
                onChange={(e) => setContent({ ...content, aboutTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white font-serif text-sm focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Brand Story Content
              </label>
              <textarea
                rows={4}
                value={content.aboutContent}
                onChange={(e) => setContent({ ...content, aboutContent: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white leading-relaxed focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label className="block text-[#a1a1aa] font-bold uppercase tracking-wider mb-1">
                Highlighted Tagline / Quote
              </label>
              <input
                type="text"
                value={content.aboutHighlight}
                onChange={(e) => setContent({ ...content, aboutHighlight: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#262635] text-white focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

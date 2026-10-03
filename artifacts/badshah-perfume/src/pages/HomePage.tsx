import React, { useState } from 'react';
import { Product, HomepageContent, Offer, Review, AppConfig } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductDetailsModal } from '../components/ProductDetailsModal.tsx';
import { CustomPerfumeRequestModal } from '../components/CustomPerfumeRequestModal.tsx';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Clock,
  Banknote,
  Star,
  MessageCircle,
  Send,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Crown,
  Quote,
  Search,
  X,
  Play,
  Video,
  Info,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';

interface HomePageProps {
  homepage: HomepageContent | null;
  products: Product[];
  offers: Offer[];
  reviews: Review[];
  config: AppConfig | null;
  onSelectProduct: (id: string) => void;
  onRefreshReviews: () => void;
  onNavigate?: (page: string, sectionId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  homepage,
  products,
  offers,
  reviews,
  config,
  onSelectProduct,
  onRefreshReviews,
  onNavigate,
}) => {
  const { settings } = useSiteSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Inline Custom Request Form State for zero-result search
  const [inlinePerfumeName, setInlinePerfumeName] = useState('');
  const [inlineVolumeMl, setInlineVolumeMl] = useState(30);
  const [inlinePhone, setInlinePhone] = useState('');
  const [inlineCustomerName, setInlineCustomerName] = useState('');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [customRequestModalOpen, setCustomRequestModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewCity, setReviewCity] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewProduct, setReviewProduct] = useState(products[0]?.name || '');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setInlinePerfumeName(searchQuery.trim());
      setInlineSuccess(null);
      setInlineError(null);
    }
  }, [searchQuery]);

  const handleInlineCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePerfumeName.trim() || !inlinePhone.trim()) {
      setInlineError('অনুগ্রহ করে পারফিউমের নাম এবং মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    setInlineSubmitting(true);
    setInlineError(null);
    try {
      const res = await api.submitCustomRequest({
        customerName: inlineCustomerName.trim() || 'Storefront Visitor',
        customerPhone: inlinePhone.trim(),
        perfumeName: inlinePerfumeName.trim(),
        volumeMl: Number(inlineVolumeMl) || 30,
        notes: `Searched for "${searchQuery}" and requested custom formulation`,
      });
      setInlineSuccess(res.message || 'আপনার কাস্টম পারফিউম রিকোয়েস্ট সফলভাবে জমা হয়েছে।');
      setInlinePhone('');
      setInlineCustomerName('');
    } catch (err: any) {
      setInlineError(err.message || 'রিকোয়েস্ট জমা দিতে ব্যর্থ হয়েছে।');
    } finally {
      setInlineSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (products.length > 0 && !reviewProduct) {
      setReviewProduct(products[0].name);
    }
  }, [products, reviewProduct]);

  const whatsappNumber = settings.whatsappNumber || config?.whatsappNumber || '+8801700000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '').replace('+', '');
  const messengerUrl = settings.facebookUrl || config?.messengerUrl || 'https://m.me/badshahperfume';

  // Live filter products by name, notes, category, and fragrance profile
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.fragranceType && p.fragranceType.toLowerCase().includes(q)) ||
      (p.fragranceNotes && p.fragranceNotes.toLowerCase().includes(q)) ||
      (p.topNotes && p.topNotes.toLowerCase().includes(q)) ||
      (p.middleNotes && p.middleNotes.toLowerCase().includes(q)) ||
      (p.baseNotes && p.baseNotes.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });
  const selectedFeaturedProducts = (homepage?.featuredProductIds || [])
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));
  const collectionProducts = selectedFeaturedProducts.length > 0
    ? selectedFeaturedProducts
    : products;
  const displayedProducts = searchQuery.trim()
    ? filteredProducts
    : showAllCollections
      ? products
      : collectionProducts.slice(0, 6);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewSubmitting(true);
    setReviewError(null);
    setReviewMessage(null);

    try {
      const res = await api.submitReview({
        customerName: reviewName,
        city: reviewCity,
        rating: reviewRating,
        productName: reviewProduct,
        comment: reviewComment,
      });
      setReviewMessage(res.message);
      setReviewName('');
      setReviewCity('');
      setReviewComment('');
      onRefreshReviews();
      setTimeout(() => {
        setReviewModalOpen(false);
        setReviewMessage(null);
      }, 3000);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getTrustIcon = (index: number) => {
    switch (index % 5) {
      case 0:
        return <Sparkles className="w-5 h-5 text-[#10b981]" />;
      case 1:
        return <Clock className="w-5 h-5 text-[#10b981]" />;
      case 2:
        return <Banknote className="w-5 h-5 text-[#10b981]" />;
      case 3:
        return <Truck className="w-5 h-5 text-[#10b981]" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-[#10b981]" />;
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden border-b border-[#1f1f26]">
        {/* Background Image with Dark & Gold Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={settings.heroImageUrl || homepage?.heroImage || '/src/assets/images/hero_badshah_perfume_1790701561080.jpg'}
            alt={settings.siteName || "Badshah Premium Perfume"}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center brightness-75 scale-100 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-transparent to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {settings.heroTitle || homepage?.heroHeading || 'Crafted for Kings & Royalty'}
            </h1>

            <p className="text-base sm:text-lg text-[#d1d5db] leading-relaxed font-normal">
              {settings.heroSubtitle ||
                homepage?.heroSubtitle ||
                'Immerse yourself in authentic artisanal perfumes and concentrated attars. Uncompromising longevity, pure concentrated oils, and royal Arabian heritage.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href={homepage?.heroButtonDestination || '#collections'}
                style={{ backgroundColor: settings.primaryColor || '#10b981' }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-black font-bold text-sm transition-all shadow-xl shadow-emerald-500/20 hover:opacity-90"
              >
                <span>{settings.heroCtaText || homepage?.heroButtonText || 'Our Popular Collections'}</span>
                <ChevronRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => onNavigate?.('wholesale')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-emerald-500/70 bg-emerald-950/80 hover:bg-emerald-500/20 text-emerald-400 font-bold text-sm transition-all shadow-lg hover:border-emerald-400"
              >
                <span>{settings.wholesaleCtaText || 'পাইকারি কিনতে'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Quick highlight points - Enlarged typography */}
            <div className="pt-4 flex flex-wrap items-center gap-6 md:gap-8">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <span className="text-xl md:text-2xl font-bold text-emerald-500">{settings.featureBadge1 || 'Extrait de Parfum'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <span className="text-xl md:text-2xl font-bold text-emerald-500">{settings.featureBadge2 || '10-14+ Hours Longevity'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                <span className="text-xl md:text-2xl font-bold text-emerald-500">{settings.featureBadge3 || '64 Districts Delivery'}</span>
              </div>
            </div>

            {/* Customer reviews trigger button directly below the 3 points */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('reviews-section') || document.getElementById('reviews');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-emerald-500 text-black px-8 py-3.5 text-base sm:text-lg font-extrabold rounded-md hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                {settings.customerReviewsCtaText || 'আমাদের কাস্টমার রিভিউ গুলো দেখুন'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Active Special Offers (If active offers exist) */}
      {offers && offers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-[#18181f] via-[#1f1911] to-[#18181f] border border-[#10b981]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-widest text-[#10b981]">
                Exclusive Royal Offer
              </span>
              <h3 className="font-serif text-2xl font-bold text-white">
                {offers[0].title}
              </h3>
              <p className="text-sm text-[#d1d5db]">
                {offers[0].description}
              </p>
            </div>
            <a
              href="#collections"
              className="shrink-0 px-6 py-3 rounded-lg bg-[#10b981] text-[#0a0a0a] font-bold text-xs hover:bg-[#059669] transition-colors"
            >
              Claim Special Offer
            </a>
          </div>
        </section>
      )}

      {/* Promotional Custom Banner Image (Media CMS) */}
      {settings.homepageBannerImageUrl && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl overflow-hidden border border-[#10b981]/30 shadow-2xl relative aspect-[21/9] sm:aspect-[24/7] max-h-[280px] bg-[#121218]">
            <img
              src={settings.homepageBannerImageUrl}
              alt="Promotional Banner"
              className="w-full h-full object-cover"
            />
          </div>
        </section>
      )}

      {/* 3. Popular Perfumes / Our Popular Collections */}
      <section id="collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        {/* Dynamic Search Bar (Clean, prominent, NO initial custom order button) */}
        <div className="w-full max-w-4xl mx-auto mb-12 space-y-4">
          <label
            htmlFor="perfume-search"
            className="block text-center text-2xl sm:text-3xl font-extrabold text-white"
          >
            {settings.searchHeadingBangla || 'আপনার পছন্দের পারফিউম সার্চ দিন'}
          </label>
          <div className="relative flex items-center shadow-2xl">
            <Search className="w-5 h-5 absolute left-4 text-[#10b981]" />
            <input
              id="perfume-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={settings.searchPlaceholderBangla || 'পারফিউমের নাম দিয়ে খুঁজুন'}
              className="w-full pl-12 pr-12 py-5 rounded-2xl bg-[#121218] border border-[#272735] text-white placeholder-[#71717a] text-base sm:text-lg focus:border-[#10b981] focus:outline-none shadow-xl transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 p-1.5 text-[#71717a] hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center justify-between text-xs text-[#a1a1aa] px-2">
              <span>
                "<strong>{searchQuery}</strong>" দিয়ে সার্চে {filteredProducts.length}টি পারফিউম পাওয়া গেছে
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#10b981] hover:underline"
              >
                ফিল্টার রিসেট
              </button>
            </div>
          )}
        </div>

        {/* Section Header with "See All Collections" bold clickable link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10b981] mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Master Perfumer Blends</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white">
              {settings.collectionsTitle || 'আমাদের কালেকশন সমূহ'}
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
              {settings.collectionsSubtitle ||
                'Select from our crown artisanal compositions.'}
            </p>
          </div>

          {!searchQuery.trim() && products.length > 6 && (
            <button
              onClick={() => setShowAllCollections(!showAllCollections)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#15151e] border border-[#262635] hover:border-emerald-500/60 text-base sm:text-lg font-extrabold text-emerald-400 hover:underline transition-all shrink-0 shadow-sm"
            >
              <span>
                {showAllCollections
                  ? (settings.collectionsShowLessText || 'কম দেখুন')
                  : (settings.collectionsViewAllText || 'আমাদের সকল কালেকশন')}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Product Grid & Conditional Custom Order Engine */}
        {filteredProducts.length === 0 ? (
          searchQuery.trim() ? (
            /* Dedicated Custom Request Card ONLY IF search returns 0 matching products */
            <div className="text-left py-8 px-6 sm:px-8 rounded-2xl bg-[#0f0f15] border border-[#10b981]/50 w-full max-w-3xl mx-auto space-y-5 shadow-2xl animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981] shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white">
                    কাস্টম পারফিউম রিকোয়েস্ট
                  </h3>
                  <span className="text-[11px] text-[#a1a1aa]">"{searchQuery}" কালেকশনে পাওয়া যায়নি</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161622] border border-[#2b2b3d] text-[#e5e7eb] text-base sm:text-lg leading-relaxed">
                {settings.searchNoResultsMessageBangla ||
                  'এটি আমাদের স্টকে আপাতত শেষ হয়ে গেছে। আপনি এই ফরমটি ফিল আপ করলে খুব দ্রুত পারফিউমটি আমাদের স্টকে চলে আসবে।'}
              </div>

              {inlineSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{inlineSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleInlineCustomSubmit} className="space-y-3.5 text-xs">
                  {inlineError && (
                    <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{inlineError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[#a1a1aa] font-semibold mb-1">
                      পারফিউমের নাম <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={inlinePerfumeName}
                      onChange={(e) => setInlinePerfumeName(e.target.value)}
                      placeholder="কাঙ্ক্ষিত পারফিউমের নাম"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-[#272738] text-white focus:outline-none focus:border-[#10b981] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#a1a1aa] font-semibold mb-1">
                        প্রয়োজনীয় সাইজ (ML) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={15}
                        required
                        value={inlineVolumeMl}
                        onChange={(e) => setInlineVolumeMl(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-[#272738] text-white focus:outline-none focus:border-[#10b981] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-[#a1a1aa] font-semibold mb-1">
                        মোবাইল নম্বর <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={inlinePhone}
                        onChange={(e) => setInlinePhone(e.target.value)}
                        placeholder="01700-000000"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-[#272738] text-white focus:outline-none focus:border-[#10b981] text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#a1a1aa] font-semibold mb-1">আপনার নাম (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={inlineCustomerName}
                      onChange={(e) => setInlineCustomerName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141c] border border-[#272738] text-white focus:outline-none focus:border-[#10b981] text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inlineSubmitting}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#10b981] to-[#059669] text-black hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{inlineSubmitting ? 'জমা হচ্ছে...' : 'কাস্টম পারফিউম অর্ডার জমা দিন'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-16 p-8 rounded-2xl bg-[#0f0f14] border border-[#202028] max-w-md mx-auto space-y-3">
              <Crown className="w-10 h-10 text-[#10b981] mx-auto opacity-50" />
              <h3 className="font-serif text-base font-bold text-white">Our Collections Are Being Updated</h3>
              <p className="text-xs text-[#80808a] leading-relaxed">
                New artisanal batches are currently in blending and bottling. Inquire directly on WhatsApp for custom fragrance reserves.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {displayedProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={(id) => {
                    const p = products.find((x) => x.id === id);
                    if (p) setModalProduct(p);
                    else onSelectProduct(id);
                  }}
                />
              )
            )}
          </div>
        )}
      </section>

      {/* Product Details Modal (Opens on Product Card or Details click) */}
      <ProductDetailsModal
        product={modalProduct}
        isOpen={Boolean(modalProduct)}
        onClose={() => setModalProduct(null)}
        onDirectOrder={(_prod, _size, _qty) => {
          setModalProduct(null);
          if (onNavigate) {
            onNavigate('checkout');
          }
        }}
      />

      {/* 4. Trust / Quality Section */}
      <section className="bg-[#0e0e12] border-y border-[#1c1c22] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#10b981]">
              {settings.trustSectionSubtitle || 'The Badshah Standard'}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {settings.trustSectionTitle || 'Why Discerning Customers Choose Us'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {homepage?.trustItems?.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#141419] border border-[#1f1f26] space-y-3 hover:border-[#10b981]/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#1c1c24] flex items-center justify-center">
                  {getTrustIcon(idx)}
                </div>
                <h3 className="text-sm font-bold text-white">{item.title}</h3>
                <p className="text-xs text-[#80808a] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Delivery & Cash on Delivery Details */}
      <section id="delivery" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-2xl bg-[#0f0f14] border border-[#202028] p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#10b981]">
                  Guaranteed Doorstep Delivery
                </span>
                <h2 className="font-serif text-3xl font-bold text-white mt-1">
                  Cash on Delivery Across Bangladesh
                </h2>
              </div>
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                We believe in complete trust and peace of mind. You only pay when your parcel safely reaches your doorstep. Every shipment is sealed in tamper-evident cushioning to preserve the flacon in pristine condition.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#15151c] border border-[#24242e] space-y-1">
                  <div className="text-xs text-[#71717a] uppercase font-semibold">Inside Dhaka</div>
                  <div className="text-2xl font-bold text-white tabular-nums">৳{settings.deliveryFeeInsideDhaka ?? 80}</div>
                  <div className="text-xs text-[#10b981]">Express Delivery (24-48 Hours)</div>
                </div>

                <div className="p-4 rounded-xl bg-[#15151c] border border-[#24242e] space-y-1">
                  <div className="text-xs text-[#71717a] uppercase font-semibold">Outside Dhaka</div>
                  <div className="text-2xl font-bold text-white tabular-nums">৳{settings.deliveryFeeOutsideDhaka ?? 130}</div>
                  <div className="text-xs text-[#10b981]">Courier Service (48-72 Hours)</div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#a1a1aa]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span>No advance payment needed for standard orders.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                  <span>Inspect package integrity with courier upon delivery.</span>
                </div>
              </div>
            </div>

            {/* Visual Callout Box */}
            <div className="p-8 rounded-xl bg-gradient-to-b from-[#16161f] to-[#121217] border border-[#252530] text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center mx-auto text-[#10b981]">
                <Truck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-white">
                  Fast Nationwide Coverage
                </h3>
                <p className="text-xs text-[#9ca3af] max-w-sm mx-auto">
                  From Dhaka, Chittagong, Sylhet, and Rajshahi to every upazila in Bangladesh, Badshah delivers royalty right to you.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="#collections"
                  className="inline-block w-full py-3 px-6 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Order Cash on Delivery Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Customer Reviews */}
      <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div id="reviews-section" className="-mt-24 pt-24"></div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#10b981]">
              {settings.reviewsSectionSubtitle || 'Customer Experiences'}
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              {settings.reviewsSectionTitle || 'Loved by Fragrance Enthusiasts'}
            </h2>
            <p className="text-xs text-[#80808a]">
              Authentic reviews from verified buyers across Bangladesh.
            </p>
          </div>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="self-start md:self-auto px-4 py-2 text-xs font-semibold rounded-lg bg-[#18181f] border border-[#272730] text-[#10b981] hover:bg-[#20202a] transition-colors"
          >
            Write a Review
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.length === 0 ? (
            <div className="col-span-3 text-center py-12 text-sm text-[#71717a]">
              No reviews yet. Be the first to share your experience!
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-xl bg-[#0f0f13] border border-[#1f1f26] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#10b981]">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-[#10b981]' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    {rev.city && (
                      <span className="text-[11px] text-[#71717a]">{rev.city}</span>
                    )}
                  </div>

                  <p className="text-xs text-[#d1d5db] leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1a1a20] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{rev.customerName}</h4>
                    {rev.productName && (
                      <span className="text-[11px] text-[#10b981] block">
                        {rev.productName}
                      </span>
                    )}
                  </div>
                  <Quote className="w-5 h-5 text-[#252530]" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 7. About Us */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-2xl bg-[#0e0e12] border border-[#1f1f26] p-8 lg:p-16">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs font-bold tracking-widest uppercase text-[#10b981]">
              Our Royal Heritage
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
              {homepage?.aboutTitle || 'The Heritage of Badshah'}
            </h2>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              {homepage?.aboutContent ||
                'Badshah Premium Perfume was founded on a singular conviction: luxury fragrance should command presence without compromise. We curate the finest artisanal oils, rare Cambodian oud, warm ambergris, and exquisite floral absolutes.'}
            </p>
            <div className="p-4 rounded-xl bg-[#141419] border-l-4 border-[#10b981] text-xs text-[#e5e7eb] italic">
              "{homepage?.aboutHighlight || 'Handcrafted in limited batches for discerning fragrance connoisseurs.'}"
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Video Showcase (Media CMS) */}
      {settings.homepageVideoUrl && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-[#0e0e14] border border-[#242432] p-6 sm:p-10 space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10b981]">
                <Video className="w-4 h-4" />
                <span>The Royal Craft & Bottling</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Experience Badshah Artistry in Motion
              </h2>
              <p className="text-xs text-[#80808a]">
                Witness the precision craftsmanship behind our aged agarwood and concentrated perfume oils.
              </p>
            </div>

            <div className="aspect-video w-full max-w-4xl mx-auto rounded-xl overflow-hidden border border-[#2a2a38] shadow-2xl bg-black">
              {settings.homepageVideoUrl.includes('youtube.com') ||
              settings.homepageVideoUrl.includes('youtu.be') ? (
                <iframe
                  src={settings.homepageVideoUrl}
                  title="Badshah Perfume Video Showcase"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={settings.homepageVideoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* 8. Contact Us Section (WhatsApp & Facebook Messenger) */}
      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="rounded-2xl bg-gradient-to-br from-[#121217] via-[#0f0f13] to-[#16161f] border border-[#24242e] p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold tracking-widest uppercase text-[#10b981]">
              Direct Inquiries & Order Assistance
            </span>
            <h2 className="font-serif text-3xl font-bold text-white">
              Need Help Choosing Your Fragrance?
            </h2>
            <p className="text-xs sm:text-sm text-[#9ca3af]">
              Our scent advisors are ready to assist you on WhatsApp and Facebook Messenger for recommendations, custom bottle requests, and delivery inquiries.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {/* WhatsApp Button */}
            <a
              href={`https://wa.me/${cleanPhone.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#25D366] hover:bg-[#1fb855] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>WhatsApp: {whatsappNumber}</span>
            </a>

            {/* Messenger Button */}
            <a
              href={messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#0084FF] hover:bg-[#0070db] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#0084FF]/20"
            >
              <Send className="w-4 h-4" />
              <span>Chat on Messenger</span>
            </a>
          </div>
        </div>
      </section>

      {/* Write a Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121216] border border-[#272730] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
              <h3 className="font-serif text-lg font-bold text-white">
                Share Your Badshah Experience
              </h3>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-[#71717a] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {reviewMessage ? (
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p>{reviewMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                {reviewError && (
                  <div className="p-3 rounded bg-red-950/50 border border-red-800 text-red-300">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#a1a1aa] mb-1 font-semibold">City / Area</label>
                    <input
                      type="text"
                      value={reviewCity}
                      onChange={(e) => setReviewCity(e.target.value)}
                      placeholder="e.g. Dhanmondi, Dhaka"
                      className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#a1a1aa] mb-1 font-semibold">Rating</label>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                    >
                      <option value="5">★★★★★ (5 Stars - Royal)</option>
                      <option value="4">★★★★☆ (4 Stars - Very Good)</option>
                      <option value="3">★★★☆☆ (3 Stars - Good)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Perfume Purchased</label>
                  {products.length > 0 ? (
                    <select
                      value={reviewProduct}
                      onChange={(e) => setReviewProduct(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={reviewProduct}
                      onChange={(e) => setReviewProduct(e.target.value)}
                      placeholder="e.g. Fragrance name or order item"
                      className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[#a1a1aa] mb-1 font-semibold">Your Honest Review *</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the scent notes, longevity, compliments, or delivery experience..."
                    className="w-full px-3 py-2 rounded-lg bg-[#181820] border border-[#272732] text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#272732] text-[#a1a1aa] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2 rounded-lg bg-[#10b981] text-[#0a0a0a] font-bold hover:bg-[#059669] disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Custom Perfume Request Modal */}
      <CustomPerfumeRequestModal
        isOpen={customRequestModalOpen}
        onClose={() => setCustomRequestModalOpen(false)}
        initialPerfumeName={searchQuery}
      />
    </div>
  );
};

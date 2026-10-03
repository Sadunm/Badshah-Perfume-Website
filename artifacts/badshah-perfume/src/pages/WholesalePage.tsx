import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductSize, WHOLESALE_MIN_ML } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import {
  Package,
  MessageCircle,
  ShieldCheck,
  Search,
  Plus,
} from 'lucide-react';

interface WholesalePageProps {
  onBackToHome: () => void;
}

export const WholesalePage: React.FC<WholesalePageProps> = ({
  onBackToHome,
}) => {
  const { settings } = useSiteSettings();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const data = await api.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load wholesale products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();

    const handleProductsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };
    window.addEventListener('badshah:products_updated', handleProductsUpdated);
    return () => window.removeEventListener('badshah:products_updated', handleProductsUpdated);
  }, []);

  // Filtered text-based products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) => {
        const hasWholesaleRate = Number(p.wholesalePricePerMl) > 0;
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.fragranceType && p.fragranceType.toLowerCase().includes(q));
        return hasWholesaleRate && matchesSearch;
      }
    );
  }, [products, searchQuery]);

  const getWholesalePricePerMl = (p: Product): number =>
    Number(p.wholesalePricePerMl) > 0 ? Number(p.wholesalePricePerMl) : 0;

  const getWholesalePrice50ml = (p: Product): number => {
    return Math.round(getWholesalePricePerMl(p) * 50 * 100) / 100;
  };

  const formatTaka = (value: number): string =>
    `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const minimumWholesaleMl = Math.max(
    WHOLESALE_MIN_ML,
    Math.floor(Number(settings.wholesaleMinQty) || WHOLESALE_MIN_ML)
  );

  const handleAddToCart = (product: Product) => {
    const size: ProductSize = {
      id: `wholesale-per-ml-${product.id}`,
      productId: product.id,
      sizeLabel: 'পাইকারি (প্রতি মিলি)',
      price: getWholesalePricePerMl(product),
      isAvailable: product.stockStatus !== 'Out of Stock',
    };
    addItem(product, size, minimumWholesaleMl, true);
  };

  const whatsappDirectUrl = `https://wa.me/${(settings.whatsappNumber || '+8801700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'আসসালামু আলাইকুম, আমি বাদশাহ প্রিমিয়াম পারফিউমের পাইকারি (Wholesale) মূল্য ও উপাদান সম্পর্কে জানতে ইনবক্স করছি।'
  )}`;

  const messengerDirectUrl = settings.facebookUrl || 'https://m.me/badshahperfume';

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Header Banner */}
      <div className="relative py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#08120c] via-[#040806] to-[#000000] border-b border-[#1c1c24]">
        <div className="max-w-7xl mx-auto space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Package className="w-4 h-4 text-emerald-400" />
            <span>অফিসিয়াল পাইকারি পোর্টাল / Wholesale Portal</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            বাদশাহ প্রিমিয়াম পাইকারি ক্যাটালগ
          </h1>

          {/* Quick Direct Inquiries Bar: ONLY WhatsApp and Messenger (Telegram completely removed) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <a
              href={whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#25D366] text-black hover:brightness-110 transition-all shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4.5 h-4.5 fill-current" />
              <span>WhatsApp ইনবক্স</span>
            </a>

            <a
              href={messengerDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#0084FF] text-white hover:brightness-110 transition-all shadow-lg shadow-[#0084FF]/20"
            >
              <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.43 3.12 7.14v3.52c0 .48.51.78.92.54l3.52-2.02c.79.22 1.63.34 2.44.34 5.64 0 10-4.13 10-9.52C22 6.13 17.64 2 12 2zm1.09 12.87l-2.61-2.79-5.1 2.79 5.61-5.96 2.67 2.79 5.04-2.79-5.61 5.96z" />
              </svg>
              <span>Messenger ইনবক্স</span>
            </a>

            <button
              onClick={onBackToHome}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-[#121217] text-[#a1a1aa] hover:text-white border border-[#2b2b38] transition-all"
            >
              রিটেইল শপে ফিরে যান
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog View (Strictly Text-Only: Zero images) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Minimum wholesale volume */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#09150f] border border-emerald-500/50 text-emerald-300 font-bold text-sm sm:text-base text-center shadow-lg shadow-emerald-950/40">
          {settings.wholesaleNoticeBangla ||
            'মিনিমাম ৫০ মিলি নিতে হবে'}
        </div>

        {/* Search & Header Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0d] p-4 rounded-xl border border-[#1e1e26]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="পারফিউমের নাম দিয়ে সার্চ করুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#121217] border border-[#252530] text-sm text-white placeholder-[#71717a] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#a1a1aa]">
            <span className="text-emerald-400 font-bold">{filteredProducts.length}</span> টি পারফিউম তালিকাভুক্ত
            <span className="hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              ১০০% পিওর অয়েল
            </span>
          </div>
        </div>

        {/* Text-Only Table of Names & Prices (No <img> tags) */}
        {loading ? (
          <div className="p-12 text-center text-sm text-emerald-400 animate-pulse bg-[#0a0a0e] rounded-xl border border-[#1f1f28]">
            পাইকারি ক্যাটালগ লোড হচ্ছে...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-xl bg-[#0c0c10] border border-[#1f1f28] space-y-2">
            <Package className="w-10 h-10 text-emerald-500 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-white">কোনো পারফিউম পাওয়া যায়নি</h3>
            <p className="text-xs text-[#71717a]">ভিন্ন নামে সার্চ করুন অথবা সরাসরি WhatsApp-এ যোগাযোগ করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1e1e26] bg-[#0a0a0e] shadow-xl">
            <table className="w-full text-left text-xs sm:text-sm text-[#e5e7eb]">
              <thead className="bg-[#121218] border-b border-[#20202c] text-[11px] sm:text-xs uppercase tracking-wider text-emerald-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">পারফিউমের নাম (Perfume Name)</th>
                  <th className="py-3.5 px-3 text-center">প্রতি মিলির দর</th>
                  <th className="py-3.5 px-4 text-center">৫০ মিলি পাইকারি</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171720]">
                {filteredProducts.map((p, idx) => {
                  const pricePerMl = getWholesalePricePerMl(p);
                  const wholesale50 = getWholesalePrice50ml(p);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-emerald-950/20 transition-colors group"
                    >
                      <td className="py-3 px-4 text-[#71717a] font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-white group-hover:text-emerald-300 transition-colors">
                        <div className="font-medium text-sm text-white">{p.name}</div>
                        <div className="text-[11px] text-[#71717a]">{p.fragranceType || 'Extrait de Parfum'}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-[#d1d5db] font-mono whitespace-nowrap">
                        {formatTaka(pricePerMl)} / ml
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400 font-mono whitespace-nowrap">
                        {formatTaka(wholesale50)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAddToCart(p)}
                            disabled={p.stockStatus === 'Out of Stock'}
                            aria-label={`${p.name} কার্টে যোগ করুন`}
                            title="কার্টে যোগ করুন"
                            className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/${(settings.whatsappNumber || '+8801700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `আসসালামু আলাইকুম, আমি "${p.name}" পারফিউমের পাইকারি রেট ও স্টক সম্পর্কে জানতে চাই।`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/30 text-[#25D366] transition-colors"
                            title="WhatsApp-এ জানুন"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

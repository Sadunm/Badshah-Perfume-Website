import React, { useState, useEffect, useMemo } from 'react';
import { Product, DeliveryLocation } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useSiteSettings } from '../context/SiteSettingsContext.tsx';
import {
  Package,
  MessageCircle,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

interface WholesalePageProps {
  onBackToHome: () => void;
  onNavigateToOrderConfirmation: (orderNumber: string) => void;
}

export const WholesalePage: React.FC<WholesalePageProps> = ({
  onBackToHome,
  onNavigateToOrderConfirmation,
}) => {
  const { settings } = useSiteSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Wholesale Checkout State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(settings.wholesaleMinQty || 5);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>('inside_dhaka');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null);

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

  const handleOpenWholesaleOrder = (p: Product) => {
    setSelectedProduct(p);
    setQuantity(settings.wholesaleMinQty || 5);
    setError(null);
  };

  const handlePlaceWholesaleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setError('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং সম্পূর্ণ ডেলিভারি ঠিকানা প্রদান করুন।');
      return;
    }

    if (quantity < (settings.wholesaleMinQty || 5)) {
      setError(`পাইকারি অর্ডারের জন্য সর্বনিম্ন ${settings.wholesaleMinQty || 5} বোতল অর্ডার করতে হবে।`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        district: district.trim(),
        deliveryArea: district,
        deliveryLocation,
        notes: `[WHOLESALE ORDER] ${notes}`.trim(),
        orderType: 'WHOLESALE',
        isWholesale: true,
        items: [
          {
            productId: selectedProduct.id,
            sizeLabel: '50 ml (Wholesale Flacon)',
            quantity,
          },
        ],
      });

      setSuccessOrderNumber(res.order.orderNumber);
      setTimeout(() => {
        onNavigateToOrderConfirmation(res.order.orderNumber);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'অর্ডার করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
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
        {/* MANDATORY TOP BANGLA NOTICE - Exactly as specified */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#09150f] border border-emerald-500/50 text-emerald-300 font-bold text-sm sm:text-base text-center shadow-lg shadow-emerald-950/40">
          {settings.wholesaleNoticeBangla ||
            'পাইকারি মূল্যে পারফিউমের বোতল, প্রিমিক্স, অয়েল এবং সকল উপাদান পাওয়া যায়। বিস্তারিত জানতে ইনবক্স করুন।'}
        </div>
        <p className="text-center text-[11px] sm:text-xs text-[#8b9290]">
          PDF তালিকার দর ৳/মিলি হিসেবে দেওয়া হয়েছে; ৫০ মিলি বোতলের দাম = মিলি-প্রতি দর × ৫০।
          <span className="block mt-1">মূল তালিকার নোট: “Original price + 4.00 Tk”</span>
        </p>

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
                            onClick={() => handleOpenWholesaleOrder(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-sm"
                          >
                            অর্ডার
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

      {/* Wholesale Order Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#0a0a0f] border border-[#232330] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                  পাইকারি অর্ডার বুকিং
                </span>
                <h2 className="text-xl font-serif font-bold text-white mt-0.5">
                  {selectedProduct.name} (৫০ মিলি)
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-[#71717a] hover:text-white rounded-lg hover:bg-[#1a1a24]"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successOrderNumber ? (
              <div className="p-6 bg-emerald-950/80 border border-emerald-700 text-emerald-200 rounded-xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-base">পাইকারি অর্ডার সম্পন্ন হয়েছে!</h3>
                <p className="text-xs text-emerald-300">অর্ডার নম্বর: #{successOrderNumber}</p>
              </div>
            ) : (
              <form onSubmit={handlePlaceWholesaleOrder} className="space-y-4">
                <div className="p-3 rounded-lg bg-[#14141c] border border-[#232330] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#a1a1aa]">৫০ মিলি বোতলের দাম:</span>
                    <span className="font-bold text-white ml-1">
                      {getWholesalePrice50ml(selectedProduct) > 0
                        ? formatTaka(getWholesalePrice50ml(selectedProduct))
                        : 'ইনবক্সে নির্ধারিত'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#a1a1aa]">সর্বমোট:</span>
                    <span className="font-bold text-emerald-400 ml-1 text-sm">
                      {formatTaka(getWholesalePrice50ml(selectedProduct) * quantity)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    বোতল সংখ্যা (সর্বনিম্ন {settings.wholesaleMinQty || 5} টি):
                  </label>
                  <input
                    type="number"
                    min={settings.wholesaleMinQty || 5}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    আপনার নাম:
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="উদা: মোঃ আরিফুল ইসলাম"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    মোবাইল নম্বর:
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    জেলা:
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="উদা: ঢাকা, চট্টগ্রাম, রাজশাহী..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    সম্পূর্ণ ডেলিভারি ঠিকানা:
                  </label>
                  <textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="দোকান বা বাসার সম্পূর্ণ ঠিকানা..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141d] border border-[#262635] text-white focus:outline-none focus:border-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                    ডেলিভারি এলাকা:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryLocation('inside_dhaka')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        deliveryLocation === 'inside_dhaka'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#14141d] border-[#262635] text-[#a1a1aa]'
                      }`}
                    >
                      ঢাকার ভিতরে
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryLocation('outside_dhaka')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        deliveryLocation === 'outside_dhaka'
                          ? 'bg-emerald-500/20 border-emerald-500 text-white'
                          : 'bg-[#14141d] border-[#262635] text-[#a1a1aa]'
                      }`}
                    >
                      ঢাকার বাইরে
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2"
                >
                  {submitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'পাইকারি অর্ডার কনফার্ম করুন'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

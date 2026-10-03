import React, { useState, useEffect } from 'react';
import { Product, ProductSize, StockStatus } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { importCsvPrices, CsvImportResult } from '../../utils/importCsvPrices.ts';
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Check,
  Ban,
  FileSpreadsheet,
} from 'lucide-react';

const STANDARD_SIZES = ['3 ml', '6 ml', '10 ml', '15 ml', '30 ml', '50 ml', '100 ml'];

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // In-app delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [fragranceType, setFragranceType] = useState('');
  const [longevity, setLongevity] = useState('12+ Hours Longevity');
  const [fragranceNotes, setFragranceNotes] = useState('');
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');
  const [description, setDescription] = useState('');
  const [stockStatus, setStockStatus] = useState<StockStatus>('In Stock');
  const [wholesalePricePerMl, setWholesalePricePerMl] = useState('0.00');
  const [sizePrices, setSizePrices] = useState<Record<string, number>>({
    '3 ml': 0,
    '6 ml': 0,
    '10 ml': 0,
    '15 ml': 0,
    '30 ml': 0,
    '50 ml': 0,
    '100 ml': 0,
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  // CSV Price Import State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setImage('');
    setFragranceType('');
    setLongevity('10-14+ Hours Longevity');
    setFragranceNotes('');
    setTopNotes('');
    setMiddleNotes('');
    setBaseNotes('');
    setDescription('');
    setStockStatus('In Stock');
    setWholesalePricePerMl('0.00');
    setSizePrices({
      '3 ml': 0,
      '6 ml': 0,
      '10 ml': 0,
      '15 ml': 0,
      '30 ml': 0,
      '50 ml': 0,
      '100 ml': 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setImage(prod.image);
    setFragranceType(prod.fragranceType);
    setLongevity(prod.longevity);
    setFragranceNotes(prod.fragranceNotes);
    setTopNotes(prod.topNotes || '');
    setMiddleNotes(prod.middleNotes || '');
    setBaseNotes(prod.baseNotes || '');
    setDescription(prod.description);
    setStockStatus(prod.stockStatus);
    setWholesalePricePerMl(Number(prod.wholesalePricePerMl ?? 0).toFixed(2));

    const priceMap: Record<string, number> = {};
    STANDARD_SIZES.forEach((s) => {
      const matched = prod.sizes.find((ps) => ps.sizeLabel.toLowerCase() === s.toLowerCase());
      priceMap[s] = matched ? matched.price : 0;
    });
    setSizePrices(priceMap);
    setIsModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await api.adminUploadImage(file);
      setImage(res.url);
      setSuccessMessage('Product image uploaded successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const builtSizes: ProductSize[] = STANDARD_SIZES.map((sizeLabel, idx) => ({
        id: editingProduct
          ? editingProduct.sizes.find((s) => s.sizeLabel === sizeLabel)?.id || `size-${idx + 1}`
          : `size-${Date.now()}-${idx}`,
        productId: editingProduct?.id || '',
        sizeLabel,
        price: Number(sizePrices[sizeLabel]) || 0,
        isAvailable: Number(sizePrices[sizeLabel]) > 0,
      }));

      const payload = {
        name: name.trim(),
        image: image.trim(),
        fragranceType: fragranceType.trim(),
        longevity: longevity.trim(),
        fragranceNotes: fragranceNotes.trim(),
        topNotes: topNotes.trim(),
        middleNotes: middleNotes.trim(),
        baseNotes: baseNotes.trim(),
        description: description.trim(),
        stockStatus,
        wholesalePricePerMl: Number(wholesalePricePerMl) || 0,
        sizes: builtSizes,
      };

      if (editingProduct) {
        const updated = await api.adminUpdateProduct(editingProduct.id, payload);
        // Instant state update
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setSuccessMessage(`Product "${name}" updated successfully`);
      } else {
        const created = await api.adminCreateProduct(payload);
        // Instant prepend
        setProducts((prev) => [created, ...prev]);
        setSuccessMessage(`Product "${name}" added to catalog`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant 1-Click Stock Status Toggle
  const handleToggleStock = async (product: Product) => {
    const nextStatus: StockStatus = product.stockStatus === 'In Stock' ? 'Out of Stock' : 'In Stock';
    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stockStatus: nextStatus } : p))
    );

    try {
      await api.adminUpdateProduct(product.id, { stockStatus: nextStatus });
      setSuccessMessage(`"${product.name}" stock updated to ${nextStatus}`);
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stockStatus: product.stockStatus } : p))
      );
      setError(err.message || 'Failed to update stock status');
    }
  };

  // In-App Confirm Delete (No blocked confirm dialogs)
  const handleConfirmDelete = async (id: string) => {
    const target = products.find((p) => p.id === id);
    // Optimistic remove
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);

    try {
      await api.adminDeleteProduct(id);
      setSuccessMessage(`Product "${target?.name || ''}" safely removed or archived.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      if (target) {
        setProducts((prev) => [...prev, target]);
      }
      setError(err.message || 'Failed to delete product');
    }
  };

  const handleCsvImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setCsvImporting(true);
    setCsvResult(null);

    try {
      const res = await importCsvPrices(csvText);
      setCsvResult(res);
      if (res.success) {
        setSuccessMessage(`সফলভাবে ${res.updatedCount}টি পারফিউমের প্রাইস আপডেট করা হয়েছে!`);
        await fetchProducts();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'CSV Import failed');
    } finally {
      setCsvImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Fragrance Catalog Management
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Configure luxury perfumes, independent volume pricing (3ml to 50ml), and real-time stock states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsCsvModalOpen(true);
              setCsvResult(null);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#10b981]/60 bg-[#16140d] hover:bg-[#10b981]/20 text-[#10b981] font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#10b981]" />
            <span>CSV Price Import</span>
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0a0a0a] font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#10b981]/15"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Perfume</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-2xl bg-[#0f0f14] border border-[#202028] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14141a] text-[#a1a1aa] uppercase font-bold tracking-wider border-b border-[#1f1f26]">
              <tr>
                <th className="py-3.5 px-4">Fragrance</th>
                <th className="py-3.5 px-4">Fragrance Type</th>
                <th className="py-3.5 px-4">Stock Status (Click to Toggle)</th>
                <th className="py-3.5 px-4">Starting Price</th>
                <th className="py-3.5 px-4">Volume Sizes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181820]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717a]">
                    Loading products from database...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717a]">
                    No products found in catalog. Click "Add New Perfume" to create your first item.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#121217] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-lg object-cover bg-[#1c1c24] shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{p.name}</div>
                          <div className="text-[11px] text-[#71717a] line-clamp-1">{p.longevity}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#d1d5db] font-medium">{p.fragranceType}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                          p.stockStatus === 'In Stock'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/60'
                            : 'bg-red-950/80 text-red-400 border border-red-800/50 hover:bg-red-900/60'
                        }`}
                        title="Click to toggle stock state"
                      >
                        {p.stockStatus === 'In Stock' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 text-red-400" />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-bold text-white tabular-nums">
                      ৳{p.startingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-[#9ca3af]">
                      {p.sizes.filter((s) => s.isAvailable && s.price > 0).length} active size(s)
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deletingId === p.id ? (
                          <div className="flex items-center gap-1 bg-red-950/60 border border-red-800 p-1 rounded-lg">
                            <span className="text-[11px] text-red-200 font-semibold px-1">Delete?</span>
                            <button
                              onClick={() => handleConfirmDelete(p.id)}
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
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-[#10b981] hover:border-[#10b981]/40 transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(p.id)}
                              className="p-1.5 rounded-lg border border-[#272733] text-[#a1a1aa] hover:text-red-400 hover:border-red-800/40 transition-colors"
                              title="Delete / Archive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#101015] border border-[#24242e] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-4">
              <h3 className="font-serif text-xl font-bold text-white">
                {editingProduct ? `Edit Perfume: ${editingProduct.name}` : 'Add New Luxury Fragrance'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#71717a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Badshah Royal Attar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider">
                  Product Image *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="Enter image URL or choose a file to upload"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-[#1a1a24] border border-[#2b2b3b] text-white hover:text-[#10b981] cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {image && (
                  <div className="flex items-center gap-3 p-2 rounded bg-[#16161f] border border-[#22222d]">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-12 h-12 rounded object-cover"
                    />
                    <span className="text-[11px] text-[#71717a] truncate">{image}</span>
                  </div>
                )}
              </div>

              {/* Fragrance Type & Longevity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                    Fragrance Family / Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={fragranceType}
                    onChange={(e) => setFragranceType(e.target.value)}
                    placeholder="e.g. Amber Floral & Oud"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>

                <div>
                  <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                    Longevity Claim *
                  </label>
                  <input
                    type="text"
                    required
                    value={longevity}
                    onChange={(e) => setLongevity(e.target.value)}
                    placeholder="e.g. 12+ Hours Longevity"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              {/* Fragrance Notes */}
              <div>
                <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                  Olfactory Notes Architecture
                </label>
                <input
                  type="text"
                  value={fragranceNotes}
                  onChange={(e) => setFragranceNotes(e.target.value)}
                  placeholder="e.g. Top: Bergamot; Heart: Rose, Saffron; Base: Amber, Musk"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Top Notes', value: topNotes, setValue: setTopNotes },
                  { label: 'Middle / Heart Notes', value: middleNotes, setValue: setMiddleNotes },
                  { label: 'Base Notes', value: baseNotes, setValue: setBaseNotes },
                ].map((note) => (
                  <div key={note.label}>
                    <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                      {note.label}
                    </label>
                    <input
                      type="text"
                      value={note.value}
                      onChange={(e) => note.setValue(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                    />
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                  Product Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the artisan formulation, scent profile, and craftsmanship..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-[#a1a1aa] uppercase font-bold tracking-wider mb-1">
                  Stock Status *
                </label>
                <select
                  value={stockStatus}
                  onChange={(e) => setStockStatus(e.target.value as StockStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                >
                  <option value="In Stock">In Stock (Available for ordering)</option>
                  <option value="Out of Stock">Out of Stock (Shows badge, purchase disabled)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#1f1f26]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#10b981] mb-1">
                  Wholesale Rate (৳ / ml)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={wholesalePricePerMl}
                  onChange={(e) => setWholesalePricePerMl(e.target.value)}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#252533] text-sm text-white focus:outline-none focus:border-[#10b981]"
                />
                <p className="mt-1 text-[11px] text-[#80808a]">
                  Retail size prices stay separate. Set 0 to hide this item from the wholesale rate list.
                </p>
              </div>

              {/* Size Pricing Grid */}
              <div className="pt-2 border-t border-[#1f1f26]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#10b981] mb-2">
                  Independent Volume Pricing (in BDT) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STANDARD_SIZES.map((sizeLabel) => (
                    <div key={sizeLabel} className="p-2.5 rounded-xl bg-[#141419] border border-[#22222d]">
                      <span className="text-[11px] font-bold text-white block mb-1">
                        {sizeLabel}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#71717a]">৳</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={sizePrices[sizeLabel] ?? 0}
                          onChange={(e) =>
                            setSizePrices((prev) => ({
                              ...prev,
                              [sizeLabel]: Number(e.target.value),
                            }))
                          }
                          className="w-full px-2 py-1 rounded bg-[#0d0d12] border border-[#262635] text-xs text-white tabular-nums focus:outline-none focus:border-[#10b981]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#1f1f26]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#272733] text-[#a1a1aa] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#10b981] text-[#0a0a0a] font-bold hover:bg-[#059669] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Price Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121217] border border-[#272733] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1f1f26] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-[#10b981]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    CSV Price Ingestion & Bulk Pricing
                  </h3>
                  <span className="text-[11px] text-[#80808a]">Format: Perfume Name, 3ml, 6ml, 12ml, 50ml</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="text-[#71717a] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181822] border border-[#2c2c3d] text-xs text-[#d1d5db] space-y-2">
              <p className="font-semibold text-[#fde047]">
                📌 CSV ডাটা ফরম্যাট নির্দেশিকা:
              </p>
              <pre className="p-2.5 rounded-lg bg-[#0e0e13] font-mono text-[11px] text-[#e5e7eb] overflow-x-auto">
Perfume Name, 3ml, 6ml, 12ml, 50ml{"\n"}
9PM Afnan, 250, 480, 900, 2400{"\n"}
Baccarat Rouge, 350, 650, 1200, 3200{"\n"}
Creed Aventus, 350, 650, 1250, 3200
              </pre>
              <p className="text-[11px] text-[#9ca3af]">
                আপনি সরাসরি ফাইল আপলোড করতে পারেন অথবা নিচের টেক্সটবক্সে পেস্ট করে "আপডেট করুন" বাটনে ক্লিক করতে পারেন।
              </p>
            </div>

            <form onSubmit={handleCsvImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">
                  CSV ফাইল সিলেক্ট করুন
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) setCsvText(content);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="w-full text-xs text-[#a1a1aa] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#1f1f2a] file:text-white file:text-xs file:font-semibold hover:file:bg-[#2b2b3a] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[#a1a1aa] font-semibold mb-1">
                  অথবা CSV ডাটা পেস্ট করুন
                </label>
                <textarea
                  rows={8}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="Perfume Name, 3ml, 6ml, 12ml, 50ml..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141a] border border-[#272738] font-mono text-xs text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              {csvResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    csvResult.success
                      ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/70 border-red-800 text-red-300'
                  }`}
                >
                  <p className="font-bold">
                    {csvResult.success
                      ? `✓ সফলভাবে ${csvResult.updatedCount}টি পারফিউমের মূল্য আপডেট সম্পন্ন হয়েছে!`
                      : `✗ ${csvResult.error}`}
                  </p>
                  {csvResult.notFound && csvResult.notFound.length > 0 && (
                    <p className="text-[11px] text-[#fcd34d] mt-1">
                      কালেকশনে মেলেনি ({csvResult.notFound.length}টি): {csvResult.notFound.slice(0, 5).join(', ')}
                      {csvResult.notFound.length > 5 ? '...' : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-[#1f1f26]">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#272733] text-[#a1a1aa] hover:text-white"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  disabled={csvImporting || !csvText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#10b981] text-[#0a0a0a] font-bold hover:bg-[#059669] disabled:opacity-50"
                >
                  {csvImporting ? 'আপডেট হচ্ছে...' : 'CSV প্রাইজ আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

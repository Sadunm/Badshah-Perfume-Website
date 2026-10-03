import { Product, ProductSize } from '../types/index.ts';
import { PRODUCTS_CACHE_KEY, getCachedProducts, setCachedProducts } from '../services/api.ts';

export interface CsvImportResult {
  success: boolean;
  totalProcessed: number;
  updatedCount: number;
  notFound: string[];
  error?: string;
}

/**
 * Parses CSV content with columns: [Perfume Name, 3ml, 6ml, 12ml, 50ml]
 * and updates product prices across LocalStorage (and Supabase if configured).
 * 
 * Example CSV:
 * Perfume Name, 3ml, 6ml, 12ml, 50ml
 * 9PM Afnan, 250, 480, 900, 2400
 * Baccarat Rouge, 350, 650, 1200, 3200
 */
export async function importCsvPrices(csvText: string): Promise<CsvImportResult> {
  if (!csvText || !csvText.trim()) {
    return {
      success: false,
      totalProcessed: 0,
      updatedCount: 0,
      notFound: [],
      error: 'CSV content is empty.',
    };
  }

  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      success: false,
      totalProcessed: 0,
      updatedCount: 0,
      notFound: [],
      error: 'No valid lines found in CSV.',
    };
  }

  // Detect header row
  let startIndex = 0;
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes('perfume') || firstLine.includes('name') || firstLine.includes('3ml')) {
    startIndex = 1;
  }

  const currentProducts = getCachedProducts();
  const notFound: string[] = [];
  let updatedCount = 0;

  // Normalized product lookup map
  const productMap = new Map<string, Product>();
  for (const prod of currentProducts) {
    productMap.set(normalizeName(prod.name), prod);
  }

  const updatedProducts = [...currentProducts];

  for (let i = startIndex; i < lines.length; i++) {
    const row = parseCsvRow(lines[i]);
    if (row.length < 2) continue;

    const rawName = row[0];
    const norm = normalizeName(rawName);
    const existing = productMap.get(norm);

    if (!existing) {
      notFound.push(rawName);
      continue;
    }

    const price3ml = parsePrice(row[1]);
    const price6ml = parsePrice(row[2]);
    const price12ml = parsePrice(row[3]);
    const price50ml = parsePrice(row[4]);

    const targetIdx = updatedProducts.findIndex((p) => p.id === existing.id);
    if (targetIdx === -1) continue;

    const currentSizes = updatedProducts[targetIdx].sizes || [];
    const newSizes: ProductSize[] = [
      updateOrCreateSize(currentSizes, existing.id, '3 ml', price3ml),
      updateOrCreateSize(currentSizes, existing.id, '6 ml', price6ml),
      updateOrCreateSize(currentSizes, existing.id, '12 ml', price12ml),
      updateOrCreateSize(currentSizes, existing.id, '50 ml', price50ml),
    ];

    const nonZeroPrices = newSizes.map((s) => s.price).filter((p) => p > 0);
    const startingPrice = nonZeroPrices.length > 0 ? Math.min(...nonZeroPrices) : 0;
    const wholesale50 = price50ml > 0 ? Math.round(price50ml * 0.75) : 0;

    updatedProducts[targetIdx] = {
      ...updatedProducts[targetIdx],
      sizes: newSizes,
      startingPrice,
      wholesalePrice50ml: wholesale50,
      updatedAt: new Date().toISOString(),
    };

    updatedCount++;
  }

  // Save back to LocalStorage unified cache and broadcast to all storefront views
  setCachedProducts(updatedProducts);

  // If Supabase is configured or backend API is accessible, sync to backend
  try {
    await fetch('/api/admin/products/batch-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('badshah_admin_token')
          ? { Authorization: `Bearer ${localStorage.getItem('badshah_admin_token')}` }
          : {}),
      },
      body: JSON.stringify({ products: updatedProducts }),
    }).catch(() => null);
  } catch {
    // Graceful offline fallback
  }

  return {
    success: true,
    totalProcessed: lines.length - startIndex,
    updatedCount,
    notFound,
  };
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parsePrice(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function updateOrCreateSize(
  existingSizes: ProductSize[],
  productId: string,
  label: string,
  price: number
): ProductSize {
  const found = existingSizes.find(
    (s) => s.sizeLabel.toLowerCase().replace(/\s+/g, '') === label.toLowerCase().replace(/\s+/g, '')
  );

  if (found) {
    return {
      ...found,
      price: price > 0 ? price : found.price,
      isAvailable: true,
    };
  }

  return {
    id: `${productId}-${label.replace(/\s+/g, '').toLowerCase()}`,
    productId,
    sizeLabel: label,
    price,
    isAvailable: true,
  };
}

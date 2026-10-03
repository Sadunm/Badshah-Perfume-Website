import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  Product,
  ProductSize,
  Order,
  OrderItem,
  Review,
  Offer,
  HomepageContent,
  StockStatus,
  OrderStatus,
  ReviewStatus,
  DeliveryLocation,
  SiteSettings,
  CustomerUser,
  Coupon,
  CustomRequest,
  BroadcastNotification,
  WHOLESALE_MIN_ML,
} from '../types/index.ts';
import { INITIAL_PRODUCTS } from '../data/initialProducts.ts';
import { PDF_WHOLESALE_RATES, normalizeWholesaleProductName } from '../data/wholesalePrices.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PDF_WHOLESALE_RATE_BY_NAME = new Map(
  PDF_WHOLESALE_RATES.map(({ name, pricePerMl }) => [
    normalizeWholesaleProductName(name),
    pricePerMl,
  ])
);

const applyPdfWholesaleRates = (products: Product[]): Product[] =>
  products.map((product) => {
    if (typeof product.wholesalePricePerMl === 'number' && Number.isFinite(product.wholesalePricePerMl)) {
      return product;
    }
    const pdfRate = PDF_WHOLESALE_RATE_BY_NAME.get(normalizeWholesaleProductName(product.name));
    return pdfRate === undefined ? product : { ...product, wholesalePricePerMl: pdfRate };
  });

export interface StoredAdmin {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'admin';
  createdAt: string;
}

export interface StoredCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  passwordHash: string;
  address?: string;
  district?: string;
  createdAt: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  // BRANDING
  siteName: 'Badshah Premium Perfume',
  tagline: 'Artisanal Extrait de Parfum & Concentrated Attar',
  logoUrl: '',
  brandLogoUrl: '',
  faviconUrl: '',

  // THEME COLORS
  primaryColor: '#10b981',
  secondaryColor: '#059669',
  backgroundColor: '#000000',
  textColor: '#ffffff',
  accentColor: '#34d399',

  // HERO & BANNERS
  heroTitle: 'Crafted for Kings & Royalty',
  heroSubtitle: 'Immerse yourself in authentic artisanal perfumes and concentrated attars. Uncompromising longevity, pure concentrated oils, and royal Arabian heritage.',
  heroCtaText: 'Our Popular Collections',
  heroImageUrl: '/src/assets/images/hero_badshah_perfume_1790701561080.jpg',
  announcementBarText: '',
  announcementBarEnabled: false,

  // CONTACT & SOCIALS
  whatsappNumber: '+8801700000000',
  contactPhone: '+880 1700-000000',
  contactEmail: 'contact@badshahperfume.com',
  storeAddress: 'Banani, Dhaka - 1213, Bangladesh',
  facebookUrl: 'https://facebook.com/badshahperfume',
  instagramUrl: 'https://instagram.com/badshahperfume',

  // POLICIES & RATES
  deliveryFeeInsideDhaka: 80,
  deliveryFeeOutsideDhaka: 130,
  footerCopyrightText: '© 2026 Badshah Premium Perfume. All rights reserved. Handcrafted with royal Arabian precision.',

  // CHECKOUT & CUSTOMER AUTH
  requireCustomerLogin: false,

  // MARKETING PIXELS & ANALYTICS
  metaPixelId: '',
  googleAnalyticsId: '',
  tiktokPixelId: '',

  // DEEP DYNAMIC SECTION COPY
  featureBadge1: 'Extrait de Parfum',
  featureBadge2: '10-14+ Hours Longevity',
  featureBadge3: '64 Districts Delivery',
  collectionsTitle: 'আমাদের কালেকশন সমূহ',
  collectionsSubtitle: 'Select from our crown artisanal compositions. Available in precision sizes from 3ml to 100ml flacons with independent pricing.',
  aboutSectionTitle: 'The Heritage of Badshah',
  aboutSectionContent: 'Badshah Premium Perfume was founded on a singular conviction: luxury fragrance should command presence without compromise. We curate the finest artisanal oils, rare Cambodian oud, warm ambergris, and exquisite Turkish damask roses. Each bottle is poured with precision, bringing the timeless elegance of royal Arabian perfumery directly to your daily ritual.',
  aboutSectionHighlight: 'Handcrafted in limited batches for discerning fragrance connoisseurs.',
  trustSectionTitle: 'Why Discerning Customers Choose Us',
  trustSectionSubtitle: 'The Badshah Standard',
  reviewsSectionTitle: 'Royal Connoisseur Testimonials',
  reviewsSectionSubtitle: 'Unfiltered reviews from fragrance connoisseurs across Bangladesh',

  // SEARCH & CUSTOM REQUEST (BANGLA)
  searchHeadingBangla: 'আপনার পছন্দের পারফিউম সার্চ দিন',
  searchPlaceholderBangla: 'পারফিউমের নাম দিয়ে খুঁজুন',
  searchNoResultsMessageBangla:
    'এটি আমাদের স্টকে আপাতত শেষ হয়ে গেছে। আপনি এই ফরমটি ফিল আপ করলে খুব দ্রুত পারফিউমটি আমাদের স্টকে চলে আসবে।',
  collectionsViewAllText: 'আমাদের সকল কালেকশন',
  collectionsShowLessText: 'কম দেখুন',
  customerReviewsCtaText: 'আমাদের কাস্টমার রিভিউ গুলো দেখুন',
  wholesaleCtaText: 'পাইকারি কিনতে',
  customRequestNoticeBangla: '৩০ মিলি এর কম অর্ডারের ক্ষেত্রে অতিরিক্ত চার্জ প্রযোজ্য হতে পারে।',

  // 24/7 CUSTOMER SERVICE
  customerServiceBadgeText: '২৪/৭ কাস্টমার সার্ভিস',
  customerServiceBadgeEnabled: true,

  // WHOLESALE / PAIKARI PORTAL
  wholesaleNoticeBangla: 'মিনিমাম ৫০ মিলি নিতে হবে',
  wholesaleMinQty: WHOLESALE_MIN_ML,
  wholesaleDiscountPercent: 25,

  // SOCIALS & CONTACT
  telegramUrl: 'https://t.me/badshahperfume',

  // MEDIA CMS & AUTH BACKGROUND & MASTER BOTTLE
  homepageVideoUrl: '',
  homepageBannerImageUrl: '',
  authBackgroundImageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=80&w=1200',
  defaultBottleImageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=1000',
};

const DEFAULT_HOMEPAGE: HomepageContent = {
  heroImage: '/src/assets/images/hero_badshah_perfume_1790701561080.jpg',
  heroHeading: 'Crafted for Kings & Royalty',
  heroSubtitle: 'Immerse yourself in authentic artisanal perfumes and concentrated attars. Uncompromising longevity, pure concentrated oils, and royal Arabian heritage.',
  heroButtonText: 'Our Popular Collections',
  heroButtonDestination: '#collections',
  featuredProductIds: [],
  trustItems: [
    {
      title: 'Royal Fragrance Oils',
      description: 'Extracted from pure natural botanicals, aged agarwood, and Turkish damask roses.',
    },
    {
      title: 'Long-Lasting Performance',
      description: 'Extrait de Parfum concentration guaranteed to project for 10 to 14+ hours.',
    },
    {
      title: 'Affordable Luxury',
      description: 'Master perfumer blends at accessible pricing without compromising on essence.',
    },
    {
      title: 'Nationwide Delivery',
      description: 'Express shipping covering all 64 districts with tamper-proof packaging.',
    },
    {
      title: 'Cash on Delivery',
      description: 'Pay securely at your doorstep after inspecting your luxury package.',
    },
  ],
  aboutTitle: 'The Heritage of Badshah',
  aboutContent: 'Badshah Premium Perfume was founded on a singular conviction: luxury fragrance should command presence without compromise. We curate the finest artisanal oils, rare Cambodian oud, warm ambergris, and exquisite floral absolutes. Each bottle is poured with precision, bringing the timeless elegance of royal Arabian perfumery directly to your daily ritual.',
  aboutHighlight: 'Handcrafted in limited batches for discerning fragrance connoisseurs.',
};

interface DatabaseSchema {
  admins: StoredAdmin[];
  customers: StoredCustomer[];
  coupons: Coupon[];
  customRequests: CustomRequest[];
  pushSubscriptions: Array<{ id: string; endpoint: string; keys?: any; subscribedAt: string }>;
  broadcasts: BroadcastNotification[];
  products: Product[];
  orders: Order[];
  reviews: Review[];
  offers: Offer[];
  homepage: HomepageContent;
  settings: SiteSettings;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
        const loaded: DatabaseSchema = {
          admins: parsed.admins || [],
          customers: parsed.customers || [],
          coupons: parsed.coupons || [],
          customRequests: parsed.customRequests || [],
          pushSubscriptions: parsed.pushSubscriptions || [],
          broadcasts: parsed.broadcasts || [],
          products: applyPdfWholesaleRates(
            (parsed.products && parsed.products.length > 0) ? parsed.products : INITIAL_PRODUCTS
          ),
          orders: parsed.orders || [],
          reviews: parsed.reviews || [],
          offers: parsed.offers || [],
          homepage: { ...DEFAULT_HOMEPAGE, ...(parsed.homepage || {}) },
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
        if (loaded.settings.collectionsTitle === 'Our Popular Collections') {
          loaded.settings.collectionsTitle = DEFAULT_SETTINGS.collectionsTitle;
        }
        if (loaded.settings.searchPlaceholderBangla === 'আপনার কাঙ্ক্ষিত পারফিউম সার্চ দিন') {
          loaded.settings.searchPlaceholderBangla = DEFAULT_SETTINGS.searchPlaceholderBangla;
        }
        if (
          loaded.settings.wholesaleNoticeBangla ===
          'পাইকারি অর্ডারের জন্য সর্বনিম্ন ৫০ মিলি ভলিউম প্রয়োজন। বিশেষ ডিসকাউন্টে সরাসরি স্টক অর্ডার করুন।'
        ) {
          loaded.settings.wholesaleNoticeBangla = DEFAULT_SETTINGS.wholesaleNoticeBangla;
        }
        this.saveData(loaded);
        return loaded;
      } catch (err) {
        console.error('Error reading database file, initializing clean zero-state', err);
      }
    }

    const initialData: DatabaseSchema = {
      admins: [],
      customers: [],
      coupons: [],
      customRequests: [],
      pushSubscriptions: [],
      broadcasts: [],
      products: applyPdfWholesaleRates(INITIAL_PRODUCTS),
      orders: [],
      reviews: [],
      offers: [],
      homepage: DEFAULT_HOMEPAGE,
      settings: DEFAULT_SETTINGS,
    };

    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  private persist(): void {
    this.saveData(this.data);
  }

  // --- Admin Auth ---
  public getAdminByEmail(email: string): StoredAdmin | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminById(id: string): StoredAdmin | undefined {
    return this.data.admins.find((a) => a.id === id);
  }

  // --- Customer Auth ---
  public getAllCustomers(): CustomerUser[] {
    return (this.data.customers || []).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      district: c.district,
      createdAt: c.createdAt,
    }));
  }

  public getCustomerById(id: string): CustomerUser | undefined {
    const c = (this.data.customers || []).find((cust) => cust.id === id);
    if (!c) return undefined;
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      district: c.district,
      createdAt: c.createdAt,
    };
  }

  public getCustomerByPhoneOrEmail(identifier: string): StoredCustomer | undefined {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPhone = cleanId.replace(/[^0-9]/g, '');
    return (this.data.customers || []).find(
      (c) =>
        (c.email && c.email.toLowerCase() === cleanId) ||
        (cleanPhone.length >= 7 && c.phone.replace(/[^0-9]/g, '').includes(cleanPhone))
    );
  }

  public createCustomer(input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
    district?: string;
  }): { success: boolean; customer?: CustomerUser; error?: string } {
    if (!input.name || !input.phone || !input.password) {
      return { success: false, error: 'Name, phone number, and password are required.' };
    }

    const existing = this.getCustomerByPhoneOrEmail(input.phone);
    if (existing) {
      return { success: false, error: 'An account with this phone number already exists.' };
    }

    if (input.email) {
      const existingEmail = this.getCustomerByPhoneOrEmail(input.email);
      if (existingEmail) {
        return { success: false, error: 'An account with this email address already exists.' };
      }
    }

    const id = `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(input.password, salt);
    const now = new Date().toISOString();

    const stored: StoredCustomer = {
      id,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim().toLowerCase() || undefined,
      passwordHash,
      address: input.address?.trim() || undefined,
      district: input.district?.trim() || undefined,
      createdAt: now,
    };

    if (!this.data.customers) this.data.customers = [];
    this.data.customers.push(stored);
    this.persist();

    return {
      success: true,
      customer: {
        id: stored.id,
        name: stored.name,
        phone: stored.phone,
        email: stored.email,
        address: stored.address,
        district: stored.district,
        createdAt: stored.createdAt,
      },
    };
  }

  // --- Coupons Engine ---
  public getAllCoupons(): Coupon[] {
    return this.data.coupons || [];
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return (this.data.coupons || []).find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  public createCoupon(couponData: Omit<Coupon, 'id' | 'createdAt' | 'usageCount'>): Coupon {
    const id = `cpn-${Date.now()}`;
    const newCoupon: Coupon = {
      ...couponData,
      id,
      code: couponData.code.trim().toUpperCase(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.coupons) this.data.coupons = [];
    this.data.coupons.unshift(newCoupon);
    this.persist();
    return newCoupon;
  }

  public updateCoupon(id: string, updates: Partial<Coupon>): Coupon | null {
    const idx = (this.data.coupons || []).findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.coupons[idx] = {
      ...this.data.coupons[idx],
      ...updates,
      code: updates.code ? updates.code.trim().toUpperCase() : this.data.coupons[idx].code,
    };
    this.persist();
    return this.data.coupons[idx];
  }

  public deleteCoupon(id: string): boolean {
    const idx = (this.data.coupons || []).findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.coupons.splice(idx, 1);
    this.persist();
    return true;
  }

  public validateCoupon(code: string, subtotal: number): {
    valid: boolean;
    discountAmount: number;
    error?: string;
    coupon?: Coupon;
  } {
    const coupon = this.getCouponByCode(code);
    if (!coupon) {
      return { valid: false, discountAmount: 0, error: 'Invalid coupon code.' };
    }

    if (!coupon.isActive) {
      return { valid: false, discountAmount: 0, error: 'This coupon code is currently inactive.' };
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, discountAmount: 0, error: 'This coupon code has expired.' };
    }

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discountAmount: 0,
        error: `Minimum order subtotal of ৳${coupon.minOrderAmount} required for this coupon.`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }

    return { valid: true, discountAmount, coupon };
  }

  // --- Site Settings Customizer Engine ---
  public getSettings(): SiteSettings {
    return { ...DEFAULT_SETTINGS, ...(this.data.settings || {}) };
  }

  public updateSettings(settings: Partial<SiteSettings>): SiteSettings {
    this.data.settings = {
      ...DEFAULT_SETTINGS,
      ...(this.data.settings || {}),
      ...settings,
    };
    this.data.homepage = {
      ...DEFAULT_HOMEPAGE,
      ...(this.data.homepage || {}),
      ...(settings.heroTitle !== undefined ? { heroHeading: settings.heroTitle } : {}),
      ...(settings.heroSubtitle !== undefined ? { heroSubtitle: settings.heroSubtitle } : {}),
      ...(settings.heroCtaText !== undefined ? { heroButtonText: settings.heroCtaText } : {}),
      ...(settings.heroImageUrl !== undefined ? { heroImage: settings.heroImageUrl } : {}),
    };
    this.persist();
    return this.data.settings;
  }

  // --- Products ---
  public getAllProducts(includeArchived = false): Product[] {
    if (includeArchived) return this.data.products;
    return (this.data.products || []).filter((p) => !p.isArchived);
  }

  public getProductById(id: string): Product | undefined {
    return (this.data.products || []).find((p) => p.id === id && !p.isArchived);
  }

  public createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'startingPrice'>): Product {
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const sizesWithProduct = productData.sizes.map((s, idx) => ({
      ...s,
      id: s.id || `${id}-size-${idx + 1}`,
      productId: id,
    }));

    const availablePrices = sizesWithProduct.filter((s) => s.isAvailable && s.price > 0).map((s) => s.price);
    const startingPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : 0;

    const newProduct: Product = {
      ...productData,
      id,
      sizes: sizesWithProduct,
      startingPrice,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.products) this.data.products = [];
    this.data.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = (this.data.products || []).findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const current = this.data.products[idx];
    let updatedSizes = updates.sizes || current.sizes;

    if (updates.sizes) {
      updatedSizes = updates.sizes.map((s, sIdx) => ({
        ...s,
        id: s.id || `${id}-size-${sIdx + 1}`,
        productId: id,
      }));
    }

    const availablePrices = updatedSizes.filter((s) => s.isAvailable && s.price > 0).map((s) => s.price);
    const startingPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : current.startingPrice;

    this.data.products[idx] = {
      ...current,
      ...updates,
      sizes: updatedSizes,
      startingPrice,
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = (this.data.products || []).findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.products[idx].isArchived = true;
    this.data.products[idx].updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  public batchSyncProducts(products: Product[]): void {
    const existingRatesById = new Map(
      (this.data.products || []).map((product) => [product.id, product.wholesalePricePerMl])
    );
    const existingRatesByName = new Map(
      (this.data.products || [])
        .filter((product) => typeof product.wholesalePricePerMl === 'number')
        .map((product) => [
          normalizeWholesaleProductName(product.name),
          product.wholesalePricePerMl,
        ])
    );
    this.data.products = applyPdfWholesaleRates(
      products.map((product) => ({
        ...product,
        wholesalePricePerMl:
          product.wholesalePricePerMl ??
          existingRatesById.get(product.id) ??
          existingRatesByName.get(normalizeWholesaleProductName(product.name)),
      }))
    );
    this.persist();
  }

  // --- Orders ---
  public getAllOrders(): Order[] {
    return [...(this.data.orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(idOrNumber: string): Order | undefined {
    return (this.data.orders || []).find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
  }

  public trackOrder(orderNumber: string, phone: string): Order | null {
    const cleanNum = orderNumber.trim().toLowerCase();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const found = (this.data.orders || []).find((o) => {
      const matchNum = o.orderNumber.toLowerCase() === cleanNum || o.id.toLowerCase() === cleanNum;
      const oPhone = o.customerPhone.replace(/[^0-9]/g, '');
      const matchPhone = oPhone === cleanPhone || oPhone.endsWith(cleanPhone) || cleanPhone.endsWith(oPhone);
      return matchNum && matchPhone;
    });

    return found || null;
  }

  public createOrder(orderInput: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    district: string;
    deliveryArea?: string;
    deliveryLocation: DeliveryLocation;
    notes?: string;
    couponCode?: string;
    customerId?: string;
    orderType?: 'RETAIL' | 'WHOLESALE';
    isWholesale?: boolean;
    items: Array<{ productId: string; sizeLabel: string; quantity: number; isWholesale?: boolean }>;
  }): { success: boolean; order?: Order; error?: string } {
    if (!orderInput.customerName || !orderInput.customerPhone || !orderInput.customerAddress || !orderInput.district) {
      return { success: false, error: 'Full customer details are required.' };
    }

    if (!orderInput.items || orderInput.items.length === 0) {
      return { success: false, error: 'Cannot create order with an empty bag.' };
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const isWholesaleOrder =
      orderInput.isWholesale === true ||
      orderInput.orderType === 'WHOLESALE' ||
      orderInput.items.some((item) => item.isWholesale === true);
    const minimumWholesaleMl = Math.max(
      WHOLESALE_MIN_ML,
      Math.floor(Number(this.getSettings().wholesaleMinQty) || WHOLESALE_MIN_ML)
    );
    if (orderInput.items.some((item) => item.isWholesale === true && Number(item.quantity) < minimumWholesaleMl)) {
      return {
        success: false,
        error: `প্রতিটি পাইকারি পারফিউমের জন্য কমপক্ষে ${minimumWholesaleMl} মিলি নিতে হবে।`,
      };
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const itemInput of orderInput.items) {
      const product = this.getProductById(itemInput.productId);
      if (!product) {
        return { success: false, error: `Product "${itemInput.productId}" not found.` };
      }
      if (product.stockStatus === 'Out of Stock') {
        return { success: false, error: `Product "${product.name}" is currently Out of Stock.` };
      }

      let sizeLabel = itemInput.sizeLabel;
      let unitPrice: number;
      let quantity = Math.max(1, Math.floor(Number(itemInput.quantity) || 0));
      if (itemInput.isWholesale === true) {
        if (quantity < minimumWholesaleMl) {
          return { success: false, error: `পাইকারি অর্ডারের জন্য কমপক্ষে ${minimumWholesaleMl} মিলি নিতে হবে।` };
        }
        const pricePerMl = Number(product.wholesalePricePerMl);
        if (!Number.isFinite(pricePerMl) || pricePerMl <= 0) {
          return { success: false, error: `No wholesale rate is available for "${product.name}".` };
        }
        sizeLabel = `${quantity} ml (পাইকারি)`;
        unitPrice = Math.round(pricePerMl * quantity * 100) / 100;
        quantity = 1;
      } else {
        const size = product.sizes.find(
          (s) => s.sizeLabel.toLowerCase() === itemInput.sizeLabel.toLowerCase()
        );
        if (!size || !size.isAvailable) {
          return { success: false, error: `Selected size "${itemInput.sizeLabel}" is unavailable.` };
        }
        sizeLabel = size.sizeLabel;
        unitPrice = size.price;
      }

      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      orderItems.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        orderId,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        sizeLabel,
        unitPrice,
        quantity,
        totalPrice,
      });
    }

    // Dynamic delivery fee from current site settings
    const currentSettings = this.getSettings();
    const deliveryCharge =
      orderInput.deliveryLocation === 'inside_dhaka'
        ? (currentSettings.deliveryFeeInsideDhaka ?? 80)
        : (currentSettings.deliveryFeeOutsideDhaka ?? 130);

    // Apply Coupon if supplied
    let discountAmount = 0;
    let validatedCoupon: Coupon | undefined = undefined;

    if (orderInput.couponCode) {
      const cRes = this.validateCoupon(orderInput.couponCode, subtotal);
      if (cRes.valid && cRes.coupon) {
        discountAmount = cRes.discountAmount;
        validatedCoupon = cRes.coupon;
        // increment usage count
        validatedCoupon.usageCount = (validatedCoupon.usageCount || 0) + 1;
      }
    }

    const grandTotal = Math.max(0, subtotal - discountAmount) + deliveryCharge;

    const count = (this.data.orders || []).length + 1;
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BPP-${year}-${String(count).padStart(3, '0')}${randomSuffix}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: orderInput.customerName.trim(),
      customerPhone: orderInput.customerPhone.trim(),
      customerAddress: orderInput.customerAddress.trim(),
      district: orderInput.district.trim(),
      deliveryArea: (orderInput.deliveryArea || '').trim(),
      deliveryLocation: orderInput.deliveryLocation,
      subtotal,
      deliveryCharge,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: validatedCoupon ? validatedCoupon.code : undefined,
      grandTotal,
      paymentMethod: 'Cash on Delivery',
      status: 'Pending',
      notes: (orderInput.notes || '').trim(),
      customerId: orderInput.customerId,
      orderType: isWholesaleOrder ? 'WHOLESALE' : 'RETAIL',
      isWholesale: isWholesaleOrder,
      createdAt: now,
      updatedAt: now,
      items: orderItems,
    };

    if (!this.data.orders) this.data.orders = [];
    this.data.orders.unshift(newOrder);
    this.persist();

    return { success: true, order: newOrder };
  }

  public updateOrderStatus(id: string, status: OrderStatus): Order | null {
    const order = (this.data.orders || []).find((o) => o.id === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    this.persist();
    return order;
  }

  // --- Homepage ---
  public getHomepage(): HomepageContent {
    return this.data.homepage || DEFAULT_HOMEPAGE;
  }

  public updateHomepage(content: Partial<HomepageContent>): HomepageContent {
    const featuredProductIds = Array.isArray(content.featuredProductIds)
      ? [...new Set(content.featuredProductIds)]
          .filter((id) => this.data.products.some((product) => product.id === id && !product.isArchived))
          .slice(0, 6)
      : this.data.homepage?.featuredProductIds || [];
    this.data.homepage = {
      ...DEFAULT_HOMEPAGE,
      ...(this.data.homepage || {}),
      ...content,
      featuredProductIds,
    };
    this.data.settings = {
      ...DEFAULT_SETTINGS,
      ...(this.data.settings || {}),
      ...(content.heroHeading !== undefined ? { heroTitle: content.heroHeading } : {}),
      ...(content.heroSubtitle !== undefined ? { heroSubtitle: content.heroSubtitle } : {}),
      ...(content.heroButtonText !== undefined ? { heroCtaText: content.heroButtonText } : {}),
      ...(content.heroImage !== undefined ? { heroImageUrl: content.heroImage } : {}),
    };
    this.persist();
    return this.data.homepage;
  }

  // --- Offers ---
  public getAllOffers(): Offer[] {
    return this.data.offers || [];
  }

  public getActiveOffers(): Offer[] {
    return (this.data.offers || []).filter((o) => o.isActive);
  }

  public createOffer(offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Offer {
    const id = `offer-${Date.now()}`;
    const now = new Date().toISOString();
    const newOffer: Offer = {
      ...offerData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    if (!this.data.offers) this.data.offers = [];
    this.data.offers.unshift(newOffer);
    this.persist();
    return newOffer;
  }

  public updateOffer(id: string, updates: Partial<Offer>): Offer | null {
    const idx = (this.data.offers || []).findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.data.offers[idx] = {
      ...this.data.offers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.data.offers[idx];
  }

  public deleteOffer(id: string): boolean {
    const idx = (this.data.offers || []).findIndex((o) => o.id === id);
    if (idx === -1) return false;
    this.data.offers.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Reviews ---
  public getAllReviews(): Review[] {
    return [...(this.data.reviews || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getApprovedReviews(): Review[] {
    return (this.data.reviews || []).filter((r) => r.status === 'Approved');
  }

  public createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>): Review {
    const id = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newReview: Review = {
      ...reviewData,
      id,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    if (!this.data.reviews) this.data.reviews = [];
    this.data.reviews.unshift(newReview);
    this.persist();
    return newReview;
  }

  public updateReviewStatus(id: string, status: ReviewStatus): Review | null {
    const rev = (this.data.reviews || []).find((r) => r.id === id);
    if (!rev) return null;
    rev.status = status;
    this.persist();
    return rev;
  }

  public deleteReview(id: string): boolean {
    const idx = (this.data.reviews || []).findIndex((r) => r.id === id);
    if (idx === -1) return false;
    this.data.reviews.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Custom Perfume Requests Engine ---
  public getAllCustomRequests(): CustomRequest[] {
    return [...(this.data.customRequests || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getCustomRequestById(id: string): CustomRequest | undefined {
    return (this.data.customRequests || []).find((c) => c.id === id);
  }

  public createCustomRequest(data: {
    customerName: string;
    customerPhone: string;
    perfumeName: string;
    volumeMl: number;
    notes?: string;
  }): CustomRequest {
    const id = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newRequest: CustomRequest = {
      id,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim(),
      perfumeName: data.perfumeName.trim(),
      volumeMl: Math.max(1, Math.floor(Number(data.volumeMl) || 30)),
      notes: (data.notes || '').trim(),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    if (!this.data.customRequests) this.data.customRequests = [];
    this.data.customRequests.unshift(newRequest);
    this.persist();
    return newRequest;
  }

  public updateCustomRequestStatus(
    id: string,
    status: 'Pending' | 'Contacted' | 'Fulfilled' | 'Cancelled'
  ): CustomRequest | null {
    const req = (this.data.customRequests || []).find((c) => c.id === id);
    if (!req) return null;
    req.status = status;
    req.updatedAt = new Date().toISOString();
    this.persist();
    return req;
  }

  public deleteCustomRequest(id: string): boolean {
    const idx = (this.data.customRequests || []).findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.customRequests.splice(idx, 1);
    this.persist();
    return true;
  }

  // --- Push Subscriptions & Broadcast System ---
  public addPushSubscription(sub: { endpoint: string; keys?: any }): { success: boolean; count: number } {
    if (!this.data.pushSubscriptions) this.data.pushSubscriptions = [];
    const exists = this.data.pushSubscriptions.find((s) => s.endpoint === sub.endpoint);
    if (!exists) {
      this.data.pushSubscriptions.push({
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        endpoint: sub.endpoint,
        keys: sub.keys,
        subscribedAt: new Date().toISOString(),
      });
      this.persist();
    }
    return { success: true, count: this.data.pushSubscriptions.length };
  }

  public getAllPushSubscriptions() {
    return this.data.pushSubscriptions || [];
  }

  public getAllBroadcasts(): BroadcastNotification[] {
    return [...(this.data.broadcasts || [])].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  public createBroadcast(data: {
    title: string;
    body: string;
    link?: string;
    type: 'PUSH' | 'EMAIL' | 'BOTH';
    recipientCount: number;
  }): BroadcastNotification {
    const id = `bc-${Date.now()}`;
    const newBroadcast: BroadcastNotification = {
      id,
      title: data.title.trim(),
      body: data.body.trim(),
      link: data.link ? data.link.trim() : undefined,
      type: data.type,
      recipientCount: data.recipientCount,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };
    if (!this.data.broadcasts) this.data.broadcasts = [];
    this.data.broadcasts.unshift(newBroadcast);
    this.persist();
    return newBroadcast;
  }

  // --- Complete Zero-State Purge ---
  public resetToZeroState(): void {
    this.data.products = [];
    this.data.orders = [];
    this.data.reviews = [];
    this.data.offers = [];
    this.data.coupons = [];
    this.data.customers = [];
    this.data.customRequests = [];
    this.data.broadcasts = [];
    this.persist();
  }

  // --- Dynamic Dashboard Metrics ---
  public getDashboardStats() {
    const products = this.getAllProducts(false);
    const orders = this.getAllOrders();
    const reviews = this.getAllReviews();
    const coupons = this.getAllCoupons();
    const customers = this.getAllCustomers();
    const customRequests = this.getAllCustomRequests();
    const pushSubs = this.getAllPushSubscriptions();

    const inStockProducts = products.filter((p) => p.stockStatus === 'In Stock').length;
    const outOfStockProducts = products.filter((p) => p.stockStatus === 'Out of Stock').length;

    const statusCounts: Record<OrderStatus, number> = {
      Pending: 0,
      Confirmed: 0,
      Processing: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    let totalRevenue = 0;
    let wholesaleOrdersCount = 0;

    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
      if (o.status !== 'Cancelled') {
        totalRevenue += o.grandTotal;
      }
      if (o.isWholesale || o.orderType === 'WHOLESALE') {
        wholesaleOrdersCount++;
      }
    });

    const pendingReviews = reviews.filter((r) => r.status === 'Pending').length;
    const pendingCustomRequests = customRequests.filter((c) => c.status === 'Pending').length;

    return {
      totalProducts: products.length,
      inStockProducts,
      outOfStockProducts,
      totalOrders: orders.length,
      statusCounts,
      totalRevenue,
      pendingReviews,
      totalCoupons: coupons.length,
      totalCustomers: customers.length,
      pendingCustomRequests,
      wholesaleOrdersCount,
      totalPushSubscribers: pushSubs.length,
    };
  }
}

export const db = new Database();

export type StockStatus = 'In Stock' | 'Out of Stock';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type DeliveryLocation = 'inside_dhaka' | 'outside_dhaka';

export type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

export const WHOLESALE_MIN_ML = 50;
export const DEFAULT_PERFUME_BOTTLE_IMAGE_URL = '/images/perfume-bottle-template.png';

export interface ProductSize {
  id: string;
  productId: string;
  sizeLabel: string; // '3 ml', '6 ml', '10 ml', '15 ml', '30 ml', '50 ml', '100 ml'
  price: number; // in BDT
  isAvailable: boolean;
}

export interface Product {
  id: string;
  name: string;
  image: string;
  additionalImages?: string[];
  fragranceType: string;
  longevity: string;
  fragranceNotes: string;
  topNotes?: string;
  middleNotes?: string;
  baseNotes?: string;
  description: string;
  stockStatus: StockStatus;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  sizes: ProductSize[];
  startingPrice: number;
  wholesalePrice50ml?: number;
  wholesalePricePerMl?: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  sizeId: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  isWholesale?: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  district: string;
  deliveryArea: string;
  deliveryLocation: DeliveryLocation;
  subtotal: number;
  deliveryCharge: number;
  discountAmount?: number;
  couponCode?: string;
  grandTotal: number;
  paymentMethod: 'Cash on Delivery';
  status: OrderStatus;
  notes?: string;
  customerId?: string;
  orderType?: 'RETAIL' | 'WHOLESALE';
  isWholesale?: boolean;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CustomRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  perfumeName: string;
  volumeMl: number;
  notes?: string;
  status: 'Pending' | 'Contacted' | 'Fulfilled' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  body: string;
  link?: string;
  type: 'PUSH' | 'EMAIL' | 'BOTH';
  sentAt: string;
  recipientCount: number;
  status: 'Sent' | 'Failed';
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  district?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderAmount?: number;
  expiresAt?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number; // 1 to 5
  comment: string;
  productName?: string;
  city?: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrustItem {
  title: string;
  description: string;
}

export interface HomepageContent {
  heroImage: string;
  heroHeading: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonDestination: string;
  featuredProductIds?: string[];
  trustItems: TrustItem[];
  aboutTitle: string;
  aboutContent: string;
  aboutHighlight: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
}

export interface AppConfig {
  brandName: string;
  whatsappNumber: string;
  messengerUrl: string;
  deliveryCharges: {
    insideDhaka: number;
    outsideDhaka: number;
  };
}

export interface SiteSettings {
  // BRANDING
  siteName: string;
  tagline: string;
  logoUrl: string;
  brandLogoUrl?: string;
  faviconUrl: string;

  // THEME COLORS
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;

  // HERO & BANNERS
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImageUrl: string;
  announcementBarText: string;
  announcementBarEnabled: boolean;

  // CONTACT & SOCIALS
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  storeAddress: string;
  facebookUrl: string;
  instagramUrl: string;

  // POLICIES & RATES
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  footerCopyrightText: string;

  // CHECKOUT & CUSTOMER AUTH
  requireCustomerLogin: boolean;

  // MARKETING PIXELS & ANALYTICS
  metaPixelId: string;
  googleAnalyticsId: string;
  tiktokPixelId: string;

  // DEEP DYNAMIC SECTION COPY
  featureBadge1: string;
  featureBadge2: string;
  featureBadge3: string;
  collectionsTitle: string;
  collectionsSubtitle: string;
  aboutSectionTitle: string;
  aboutSectionContent: string;
  aboutSectionHighlight: string;
  trustSectionTitle: string;
  trustSectionSubtitle: string;
  reviewsSectionTitle: string;
  reviewsSectionSubtitle: string;

  // SEARCH & CUSTOM REQUEST (BANGLA)
  searchHeadingBangla: string;
  searchPlaceholderBangla: string;
  searchNoResultsMessageBangla: string;
  collectionsViewAllText: string;
  collectionsShowLessText: string;
  customerReviewsCtaText: string;
  wholesaleCtaText: string;
  customRequestNoticeBangla: string;

  // 24/7 CUSTOMER SERVICE
  customerServiceBadgeText: string;
  customerServiceBadgeEnabled: boolean;

  // WHOLESALE / PAIKARI PORTAL
  wholesaleNoticeBangla: string;
  wholesaleMinQty: number;
  wholesaleDiscountPercent: number;

  // SOCIALS & CONTACT
  telegramUrl: string;

  // MEDIA CMS & AUTH BACKGROUND & MASTER BOTTLE
  homepageVideoUrl: string;
  homepageBannerImageUrl: string;
  authBackgroundImageUrl: string;
  defaultBottleImageUrl: string;
}

import {
  Product,
  Order,
  Review,
  Offer,
  HomepageContent,
  AppConfig,
  DeliveryLocation,
  OrderStatus,
  ReviewStatus,
  SiteSettings,
  CustomerUser,
  Coupon,
  CustomRequest,
  BroadcastNotification,
} from '../types/index.ts';
import { INITIAL_PRODUCTS } from '../data/initialProducts.ts';

export const PRODUCTS_CACHE_KEY = 'badshah_products_cache';

export function getCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading products cache', e);
  }
  return INITIAL_PRODUCTS;
}

export function setCachedProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('badshah:products_updated', { detail: products }));
  } catch (e) {
    console.warn('Error setting products cache', e);
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('badshah_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function safeJson<T>(res: Response, defaultError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    console.error(`Received non-JSON response (${res.status}):`, text.substring(0, 120));
    throw new Error(defaultError);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || defaultError);
  }
  return json as T;
}

export const api = {
  // Public APIs
  async getConfig(): Promise<AppConfig> {
    const res = await fetch('/api/config');
    return safeJson<AppConfig>(res, 'Failed to load configuration');
  },

  async getHomepage(): Promise<HomepageContent> {
    const res = await fetch('/api/homepage');
    return safeJson<HomepageContent>(res, 'Failed to load homepage content');
  },

  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch('/api/products');
      const data = await safeJson<Product[]>(res, 'Failed to load products');
      if (Array.isArray(data)) {
        setCachedProducts(data);
        return data;
      }
    } catch (err) {
      console.warn('Network issue fetching products, falling back to cache:', err);
    }
    return getCachedProducts();
  },

  async getProductById(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    return safeJson<Product>(res, 'Product not found');
  },

  async getOffers(): Promise<Offer[]> {
    const res = await fetch('/api/offers');
    return safeJson<Offer[]>(res, 'Failed to load offers');
  },

  async getReviews(): Promise<Review[]> {
    const res = await fetch('/api/reviews');
    return safeJson<Review[]>(res, 'Failed to load reviews');
  },

  async submitReview(data: {
    customerName: string;
    rating: number;
    comment: string;
    productName?: string;
    city?: string;
  }): Promise<{ message: string; review: Review }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit review');
    return json;
  },

  async createOrder(data: {
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
    items: Array<{
      productId: string;
      sizeId?: string;
      sizeLabel: string;
      quantity: number;
    }>;
  }): Promise<{ message: string; order: Order }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to place order');
    return json;
  },

  async getOrder(orderNumber: string): Promise<Order> {
    const res = await fetch(`/api/orders/${orderNumber}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Order not found');
    return json;
  },

  // Admin APIs
  async adminLogin(email: string, password: string): Promise<{ token: string; admin: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async adminVerify(): Promise<any> {
    const res = await fetch('/api/admin/verify', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  async adminGetDashboard(): Promise<any> {
    const res = await fetch('/api/admin/dashboard', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load dashboard');
    return json;
  },

  async adminGetProducts(): Promise<Product[]> {
    const res = await fetch('/api/admin/products', {
      headers: getAuthHeaders(),
    });
    const products = await safeJson<Product[]>(res, 'Failed to load products');
    if (!Array.isArray(products)) throw new Error('The products response was invalid');
    setCachedProducts(products);
    return products;
  },

  async adminCreateProduct(data: any): Promise<Product> {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create product');
    
    // Immediate cache update & sync
    const current = getCachedProducts();
    const updated = [json, ...current.filter((p) => p.id !== json.id)];
    setCachedProducts(updated);
    return json;
  },

  async adminUpdateProduct(id: string, data: any): Promise<Product> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update product');

    // Immediate cache update & sync
    const current = getCachedProducts();
    const updated = current.map((p) => (p.id === id ? { ...p, ...json } : p));
    setCachedProducts(updated);
    return json;
  },

  async adminDeleteProduct(id: string): Promise<void> {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete product');

    // Immediate cache update & sync
    const current = getCachedProducts();
    const updated = current.filter((p) => p.id !== id);
    setCachedProducts(updated);
  },

  async adminGetOrders(): Promise<Order[]> {
    const res = await fetch('/api/admin/orders', {
      headers: getAuthHeaders(),
    });
    const orders = await safeJson<Order[]>(res, 'Failed to load orders');
    if (!Array.isArray(orders)) throw new Error('The orders response was invalid');
    try {
      localStorage.setItem('badshah_orders_cache', JSON.stringify(orders));
    } catch {}
    return orders;
  },

  async adminGetOrderById(id: string): Promise<Order> {
    const res = await fetch(`/api/admin/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load order');
    return json;
  },

  async adminUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update order status');
    return json;
  },

  async adminUpdateHomepage(data: Partial<HomepageContent>): Promise<HomepageContent> {
    const res = await fetch('/api/admin/homepage', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update homepage');
    return json;
  },

  async adminGetOffers(): Promise<Offer[]> {
    const res = await fetch('/api/admin/offers', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load offers');
    return json;
  },

  async adminCreateOffer(data: any): Promise<Offer> {
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create offer');
    return json;
  },

  async adminUpdateOffer(id: string, data: any): Promise<Offer> {
    const res = await fetch(`/api/admin/offers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update offer');
    return json;
  },

  async adminDeleteOffer(id: string): Promise<void> {
    const res = await fetch(`/api/admin/offers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete offer');
  },

  async adminGetReviews(): Promise<Review[]> {
    const res = await fetch('/api/admin/reviews', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load reviews');
    return json;
  },

  async adminUpdateReviewStatus(id: string, status: ReviewStatus): Promise<Review> {
    const res = await fetch(`/api/admin/reviews/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update review status');
    return json;
  },

  async adminDeleteReview(id: string): Promise<void> {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete review');
  },

  async adminUploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('badshah_admin_token');

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Image upload failed');
    return json;
  },

  // Site Settings & Theme Engine
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch('/api/settings');
    return safeJson<SiteSettings>(res, 'Failed to load site settings');
  },

  async adminUpdateSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return safeJson<SiteSettings>(res, 'Failed to update site settings');
  },

  async adminResetZeroState(): Promise<{ message: string }> {
    const res = await fetch('/api/admin/reset-zero-state', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return safeJson<{ message: string }>(res, 'Failed to reset database');
  },

  // Customer Auth
  async registerCustomer(data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
    district?: string;
  }): Promise<{ token: string; customer: CustomerUser }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Registration failed');
    return json;
  },

  async loginCustomer(data: {
    identifier: string;
    password: string;
  }): Promise<{ token: string; customer: CustomerUser }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  },

  async getCustomerProfile(token: string): Promise<CustomerUser> {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load profile');
    return json;
  },

  // Customer Live Order Tracking
  async trackOrder(orderNumber: string, phone: string): Promise<Order> {
    const res = await fetch('/api/orders/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, phone }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Order tracking not found');
    return json;
  },

  // Coupon Engine
  async validateCoupon(code: string, subtotal: number): Promise<{
    valid: boolean;
    discountAmount: number;
    coupon?: { code: string; discountType: 'PERCENTAGE' | 'FLAT'; discountValue: number };
  }> {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Invalid coupon');
    return json;
  },

  async adminGetCoupons(): Promise<Coupon[]> {
    const res = await fetch('/api/admin/coupons', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load coupons');
    return json;
  },

  async adminCreateCoupon(data: {
    code: string;
    discountType: 'PERCENTAGE' | 'FLAT';
    discountValue: number;
    minOrderAmount?: number;
    expiresAt?: string;
    isActive?: boolean;
  }): Promise<Coupon> {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create coupon');
    return json;
  },

  async adminUpdateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update coupon');
    return json;
  },

  async adminDeleteCoupon(id: string): Promise<void> {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete coupon');
  },

  // Custom Perfume Requests
  async submitCustomRequest(data: {
    customerName: string;
    customerPhone: string;
    perfumeName: string;
    volumeMl: number;
    notes?: string;
  }): Promise<{ message: string; request: CustomRequest }> {
    const res = await fetch('/api/custom-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit custom request');
    return json;
  },

  async adminGetCustomRequests(): Promise<CustomRequest[]> {
    const res = await fetch('/api/admin/custom-requests', {
      headers: getAuthHeaders(),
    });
    const requests = await safeJson<CustomRequest[]>(res, 'Failed to load custom requests');
    if (!Array.isArray(requests)) throw new Error('The custom requests response was invalid');
    try {
      localStorage.setItem('badshah_requests_cache', JSON.stringify(requests));
    } catch {}
    return requests;
  },

  async adminUpdateCustomRequestStatus(
    id: string,
    status: 'Pending' | 'Contacted' | 'Fulfilled' | 'Cancelled'
  ): Promise<CustomRequest> {
    const res = await fetch(`/api/admin/custom-requests/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update custom request status');
    return json;
  },

  async adminDeleteCustomRequest(id: string): Promise<void> {
    const res = await fetch(`/api/admin/custom-requests/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete custom request');
  },

  // Push Notifications & Broadcasts
  async subscribePushNotification(sub: { endpoint: string; keys?: any }): Promise<{ success: boolean; count: number }> {
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to subscribe to notifications');
    return json;
  },

  async adminSendBroadcast(data: {
    title: string;
    body: string;
    link?: string;
    type: 'PUSH' | 'EMAIL' | 'BOTH';
  }): Promise<{ message: string; broadcast: BroadcastNotification }> {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to send broadcast');
    return json;
  },

  async adminGetBroadcasts(): Promise<BroadcastNotification[]> {
    const res = await fetch('/api/admin/broadcasts', {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load broadcasts');
    return json;
  },
};

import React, { useState, useEffect } from 'react';
import { SiteSettingsProvider, useSiteSettings } from './context/SiteSettingsContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext.tsx';
import { CustomerAuthProvider } from './context/CustomerAuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CustomerAuthModal } from './components/CustomerAuthModal.tsx';
import { PushNotificationPrompt } from './components/PushNotificationPrompt.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ProductDetailsPage } from './pages/ProductDetailsPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.tsx';
import { WholesalePage } from './pages/WholesalePage.tsx';
import { OrderTrackingPage } from './pages/OrderTrackingPage.tsx';
import { AdminLoginPage } from './pages/admin/AdminLoginPage.tsx';
import { AdminLayout } from './pages/admin/AdminLayout.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { AdminProducts } from './pages/admin/AdminProducts.tsx';
import { AdminOrders } from './pages/admin/AdminOrders.tsx';
import { AdminCoupons } from './pages/admin/AdminCoupons.tsx';
import { AdminCustomRequests } from './pages/admin/AdminCustomRequests.tsx';
import { AdminNotifications } from './pages/admin/AdminNotifications.tsx';
import { AdminHomepage } from './pages/admin/AdminHomepage.tsx';
import { AdminOffers } from './pages/admin/AdminOffers.tsx';
import { AdminReviews } from './pages/admin/AdminReviews.tsx';
import { AdminSiteSettings } from './pages/admin/AdminSiteSettings.tsx';
import { Product, HomepageContent, Offer, Review, Order, AppConfig } from './types/index.ts';
import { api } from './services/api.ts';
import { MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';

const isSecretAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path === '/badshah-secure-portal' ||
    path === '/badshah-secure-portal/' ||
    hash === '#badshah-secure-portal'
  );
};

const AppContent: React.FC = () => {
  const { admin, isLoading: isAuthLoading } = useAdminAuth();
  const { setIsCartOpen } = useCart();
  const { settings, refreshSettings } = useSiteSettings();

  // Navigation State (Secret Admin route check on initial load)
  const [currentPage, setCurrentPage] = useState<
    'home' | 'product-details' | 'checkout' | 'confirmation' | 'wholesale' | 'track-order' | 'admin'
  >(() => (isSecretAdminRoute() ? 'admin' : 'home'));
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [adminTab, setAdminTab] = useState<string>('dashboard');

  // Database Data States
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadAllData = async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const [cfg, prods, home, offs, revs] = await Promise.all([
        api.getConfig().catch(() => null),
        api.getProducts().catch(() => []),
        api.getHomepage().catch(() => null),
        api.getOffers().catch(() => []),
        api.getReviews().catch(() => []),
      ]);

      if (cfg) setConfig(cfg);
      setProducts(prods);
      if (home) setHomepage(home);
      setOffers(offs);
      setReviews(revs);
    } catch (err: any) {
      console.error('Initial load error:', err);
      setFetchError('Failed to synchronize with perfume database. Please check connection.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Listen for secret admin route navigation via browser bar or history
    const handleRouteSync = () => {
      if (isSecretAdminRoute()) {
        setCurrentPage('admin');
      } else if (currentPage === 'admin' && !isSecretAdminRoute()) {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);

    // Real-time synchronization when admin adds/edits/deletes products
    const handleProductsUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };
    window.addEventListener('badshah:products_updated', handleProductsUpdated);

    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
      window.removeEventListener('badshah:products_updated', handleProductsUpdated);
    };
  }, []);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setCurrentPage('product-details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (page: string, sectionId?: string) => {
    if (page === 'admin') {
      window.history.pushState(null, '', '/badshah-secure-portal');
      setCurrentPage('admin');
    } else if (page === 'wholesale') {
      setCurrentPage('wholesale');
    } else if (page === 'track-order') {
      setCurrentPage('track-order');
    } else if (page === 'home' && sectionId) {
      setCurrentPage('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      setCurrentPage('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitAdmin = () => {
    window.history.pushState(null, '', '/');
    loadAllData();
    refreshSettings();
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentPage('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappNumber = settings.whatsappNumber || config?.whatsappNumber || '+8801700000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '').replace('+', '');

  // Render Admin View
  if (currentPage === 'admin') {
    if (isAuthLoading) {
      return (
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#a1a1aa]">
          Verifying administrator credentials...
        </div>
      );
    }

    if (!admin) {
      return (
        <AdminLoginPage
          onBackToStore={handleExitAdmin}
        />
      );
    }

    return (
      <AdminLayout
        currentTab={adminTab}
        onSelectTab={setAdminTab}
        onViewStorefront={handleExitAdmin}
      >
        {adminTab === 'dashboard' && <AdminDashboard onNavigateTab={setAdminTab} />}
        {adminTab === 'products' && <AdminProducts />}
        {adminTab === 'orders' && <AdminOrders />}
        {adminTab === 'coupons' && <AdminCoupons />}
        {adminTab === 'custom-requests' && <AdminCustomRequests />}
        {adminTab === 'notifications' && <AdminNotifications />}
        {adminTab === 'offers' && <AdminOffers />}
        {adminTab === 'reviews' && <AdminReviews />}
        {adminTab === 'homepage' && <AdminHomepage />}
        {adminTab === 'settings' && <AdminSiteSettings />}
      </AdminLayout>
    );
  }

  // Selected product object
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] flex flex-col font-sans">
      {/* Header */}
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      {/* Main Content Area */}
      <main className="flex-1">
        {fetchError && (
          <div className="max-w-7xl mx-auto px-4 pt-6">
            <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{fetchError}</span>
              </div>
              <button
                onClick={loadAllData}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/50 hover:bg-red-800/60 text-white font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {loadingData ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs uppercase tracking-widest text-[#a1a1aa]">
              Loading royal collections...
            </span>
          </div>
        ) : (
          <>
            {currentPage === 'home' && (
              <HomePage
                homepage={homepage}
                products={products}
                offers={offers}
                reviews={reviews}
                config={config}
                onSelectProduct={handleSelectProduct}
                onRefreshReviews={loadAllData}
                onNavigate={handleNavigate}
              />
            )}

            {currentPage === 'wholesale' && (
              <WholesalePage
                onBackToHome={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToOrderConfirmation={(orderNum) => {
                  api.getOrder(orderNum).then((ord) => {
                    handleOrderSuccess(ord);
                  }).catch(() => {
                    setCurrentPage('home');
                  });
                }}
              />
            )}

            {currentPage === 'track-order' && (
              <OrderTrackingPage
                onExplore={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {currentPage === 'product-details' && (
              selectedProduct ? (
                <ProductDetailsPage
                  product={selectedProduct}
                  onBack={() => {
                    setCurrentPage('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onNavigateToCheckout={() => {
                    setCurrentPage('checkout');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : (
                <div className="max-w-md mx-auto py-24 text-center space-y-4">
                  <h3 className="font-serif text-xl font-bold text-white">No Product Selected</h3>
                  <p className="text-xs text-[#80808a]">The selected fragrance is currently unavailable.</p>
                  <button
                    onClick={() => setCurrentPage('home')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
                  >
                    Return to Collections
                  </button>
                </div>
              )
            )}

            {currentPage === 'checkout' && (
              <CheckoutPage
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOrderSuccess={handleOrderSuccess}
              />
            )}

            {currentPage === 'confirmation' && confirmedOrder && (
              <OrderConfirmationPage
                order={confirmedOrder}
                config={config}
                onContinueShopping={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        onCheckout={() => {
          setCurrentPage('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onExplore={() => {
          setCurrentPage('home');
          setTimeout(() => {
            const el = document.getElementById('collections');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Customer VIP Auth Modal */}
      <CustomerAuthModal />

      {/* Push Notification Opt-in Prompt */}
      <PushNotificationPrompt />

      {/* Floating WhatsApp Action Button */}
      <a
        href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
          `Hello ${settings.siteName || 'Badshah Premium Perfume'}, I have an inquiry about your royal collections.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Direct WhatsApp Chat"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20b857] text-black shadow-2xl shadow-[#25D366]/30 flex items-center justify-center transition-transform hover:scale-105"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-black" />
      </a>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <SiteSettingsProvider>
      <AdminAuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </CustomerAuthProvider>
      </AdminAuthProvider>
    </SiteSettingsProvider>
  );
}

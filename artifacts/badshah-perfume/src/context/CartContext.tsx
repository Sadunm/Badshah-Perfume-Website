import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductSize, DeliveryLocation } from '../types/index.ts';
import { useSiteSettings } from './SiteSettingsContext.tsx';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, size: ProductSize, quantity?: number) => boolean;
  removeItem: (productId: string, sizeLabel: string) => void;
  updateQuantity: (productId: string, sizeLabel: string, delta: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  deliveryLocation: DeliveryLocation;
  setDeliveryLocation: (loc: DeliveryLocation) => void;
  deliveryCharge: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'badshah_cart_session_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocation>('inside_dhaka');

  useEffect(() => {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart state:', e);
    }
  }, [items]);

  const addItem = (product: Product, size: ProductSize, quantity = 1): boolean => {
    if (product.stockStatus === 'Out of Stock' || !size.isAvailable) {
      return false;
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.sizeLabel.toLowerCase() === size.sizeLabel.toLowerCase()
      );

      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }

      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        sizeId: size.id,
        sizeLabel: size.sizeLabel,
        unitPrice: size.price,
        quantity,
      };

      return [...prev, newItem];
    });

    setIsCartOpen(true);
    return true;
  };

  const removeItem = (productId: string, sizeLabel: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.sizeLabel.toLowerCase() === sizeLabel.toLowerCase()))
    );
  };

  const updateQuantity = (productId: string, sizeLabel: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((i) => {
          if (i.productId === productId && i.sizeLabel.toLowerCase() === sizeLabel.toLowerCase()) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setItems([]);
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  const { settings } = useSiteSettings();
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryCharge =
    deliveryLocation === 'inside_dhaka'
      ? (settings.deliveryFeeInsideDhaka ?? 80)
      : (settings.deliveryFeeOutsideDhaka ?? 130);
  const grandTotal = subtotal + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        itemCount,
        isCartOpen,
        setIsCartOpen,
        deliveryLocation,
        setDeliveryLocation,
        deliveryCharge,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

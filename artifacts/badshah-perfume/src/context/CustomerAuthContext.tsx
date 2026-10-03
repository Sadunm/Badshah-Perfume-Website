import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomerUser } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
    district?: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('badshah_customer_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const user = await api.getCustomerProfile(token);
        setCustomer(user);
      } catch (err) {
        console.warn('Customer session expired');
        localStorage.removeItem('badshah_customer_token');
        setToken(null);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    const res = await api.loginCustomer({ identifier, password: pass });
    localStorage.setItem('badshah_customer_token', res.token);
    setToken(res.token);
    setCustomer(res.customer);
    setIsAuthModalOpen(false);
  };

  const register = async (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
    district?: string;
  }) => {
    const res = await api.registerCustomer(data);
    localStorage.setItem('badshah_customer_token', res.token);
    setToken(res.token);
    setCustomer(res.customer);
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('badshah_customer_token');
    setToken(null);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
};

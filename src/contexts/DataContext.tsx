import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  phone: string;
  floor: string;
  subscriptionType: 'fixed' | 'counter';
  fixedAmberValue?: number;
  discount?: number;
  boxNumber?: string;
  wireNumber?: string;
  subscriptionFee?: number;
  createdAt: string;
}

export interface MonthlyRecord {
  customerId: string;
  month: string; // YYYY-MM
  usage: number;
  price: number;
  discount: number;
  finalPrice: number;
  paid: boolean;
  paidAt?: string;
  prorated?: boolean;
  proratedDays?: number;
  totalDays?: number;
}

interface Settings {
  amberPricePerUnit: number;
  kwhPrice: number;
  currency: string;
}

interface DataContextType {
  customers: Customer[];
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  records: MonthlyRecord[];
  setUsage: (customerId: string, month: string, usage: number) => void;
  setRecordDiscount: (customerId: string, month: string, discount: number) => void;
  togglePaid: (customerId: string, month: string) => void;
  getRecord: (customerId: string, month: string) => MonthlyRecord | undefined;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  calculatePrice: (customer: Customer, usage: number, month?: string) => number;
  calculateProratedPrice: (customer: Customer, usage: number, month: string) => { price: number; prorated: boolean; proratedDays: number; totalDays: number };
  isFirstMonth: (customer: Customer, month: string) => boolean;
  formatCurrency: (amount: number) => string;
  currentMonth: string;
  setCurrentMonth: (m: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getDaysInMonth = (month: string): number => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

const getRemainingDays = (createdAt: string, month: string): number => {
  const created = new Date(createdAt);
  const [y, m] = month.split('-').map(Number);
  const createdMonth = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
  
  if (createdMonth !== month) return getDaysInMonth(month);
  
  const totalDays = getDaysInMonth(month);
  const dayOfMonth = created.getDate();
  return totalDays - dayOfMonth + 1;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('amber_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [records, setRecords] = useState<MonthlyRecord[]>(() => {
    const saved = localStorage.getItem('amber_records');
    if (!saved) return [];
    // Migrate old records without discount/finalPrice
    return JSON.parse(saved).map((r: any) => ({
      ...r,
      discount: r.discount ?? 0,
      finalPrice: r.finalPrice ?? r.price,
    }));
  });

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('amber_settings');
    if (!saved) return { amberPricePerUnit: 500, kwhPrice: 0.10, currency: 'USD' };
    const parsed = JSON.parse(saved);
    return { amberPricePerUnit: parsed.amberPricePerUnit ?? 500, kwhPrice: parsed.kwhPrice ?? 0.10, currency: 'USD' };
  });

  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth());

  useEffect(() => { localStorage.setItem('amber_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('amber_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('amber_settings', JSON.stringify(settings)); }, [settings]);

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isFirstMonth = (customer: Customer, month: string): boolean => {
    const created = new Date(customer.createdAt);
    const createdMonth = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    return createdMonth === month;
  };

  const getUnitPrice = (customer: Customer): number => {
    return customer.subscriptionType === 'counter' ? settings.kwhPrice : settings.amberPricePerUnit;
  };

  const calculatePrice = (customer: Customer, usage: number, month?: string): number => {
    const unitPrice = getUnitPrice(customer);
    const basePrice = usage * unitPrice;
    const subFee = (customer.subscriptionType === 'counter' && customer.subscriptionFee) ? customer.subscriptionFee : 0;
    if (!month) return basePrice + subFee;

    if (isFirstMonth(customer, month)) {
      const totalDays = getDaysInMonth(month);
      const remaining = getRemainingDays(customer.createdAt, month);
      return Math.round((basePrice / totalDays) * remaining * 100) / 100 + subFee;
    }
    return basePrice + subFee;
  };

  const calculateProratedPrice = (customer: Customer, usage: number, month: string) => {
    const totalDays = getDaysInMonth(month);
    const remaining = getRemainingDays(customer.createdAt, month);
    const prorated = customer.subscriptionType !== 'fixed' && isFirstMonth(customer, month) && remaining < totalDays;
    const unitPrice = getUnitPrice(customer);
    const basePrice = usage * unitPrice;
    const subFee = (customer.subscriptionType === 'counter' && customer.subscriptionFee) ? customer.subscriptionFee : 0;
    const price = prorated
      ? Math.round((basePrice / totalDays) * remaining * 100) / 100 + subFee
      : basePrice + subFee;

    return { price, prorated, proratedDays: remaining, totalDays };
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...c,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: string, c: Partial<Customer>) => {
    setCustomers(prev => prev.map(cust => cust.id === id ? { ...cust, ...c } : cust));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setRecords(prev => prev.filter(r => r.customerId !== id));
  };

  const setUsage = (customerId: string, month: string, usage: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    const { price, prorated, proratedDays, totalDays } = calculateProratedPrice(customer, usage, month);
    const existingRecord = records.find(r => r.customerId === customerId && r.month === month);
    const discount = existingRecord?.discount || 0;
    const finalPrice = Math.max(0, price - discount);

    setRecords(prev => {
      const existing = prev.findIndex(r => r.customerId === customerId && r.month === month);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], usage, price, discount, finalPrice, prorated, proratedDays, totalDays };
        return updated;
      }
      return [...prev, { customerId, month, usage, price, discount, finalPrice, paid: false, prorated, proratedDays, totalDays }];
    });
  };

  const setRecordDiscount = (customerId: string, month: string, discount: number) => {
    setRecords(prev => {
      const existing = prev.findIndex(r => r.customerId === customerId && r.month === month);
      if (existing >= 0) {
        const updated = [...prev];
        const r = updated[existing];
        const finalPrice = Math.max(0, r.price - discount);
        updated[existing] = { ...r, discount, finalPrice };
        return updated;
      }
      // If no record yet, create one with the customer's usage
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return prev;
      const usage = customer.subscriptionType === 'fixed' ? (customer.fixedAmberValue || 0) : 0;
      const { price, prorated, proratedDays, totalDays } = calculateProratedPrice(customer, usage, month);
      const finalPrice = Math.max(0, price - discount);
      return [...prev, { customerId, month, usage, price, discount, finalPrice, paid: false, prorated, proratedDays, totalDays }];
    });
  };

  const togglePaid = (customerId: string, month: string) => {
    setRecords(prev => prev.map(r =>
      r.customerId === customerId && r.month === month
        ? { ...r, paid: !r.paid, paidAt: !r.paid ? new Date().toISOString() : undefined }
        : r
    ));
  };

  const getRecord = (customerId: string, month: string) => {
    return records.find(r => r.customerId === customerId && r.month === month);
  };

  const updateSettings = (s: Partial<Settings>) => {
    const newSettings = { ...settings, ...s };
    setSettings(newSettings);

    // Recalculate all records with new prices
    setRecords(prev => prev.map(r => {
      const customer = customers.find(c => c.id === r.customerId);
      if (!customer) return r;
      const unitPrice = customer.subscriptionType === 'counter' ? newSettings.kwhPrice : newSettings.amberPricePerUnit;
      const basePrice = r.usage * unitPrice;
      let price = basePrice;
      if (isFirstMonth(customer, r.month)) {
        const totalDays = getDaysInMonth(r.month);
        const remaining = getRemainingDays(customer.createdAt, r.month);
        if (remaining < totalDays) {
          price = Math.round((basePrice / totalDays) * remaining * 100) / 100;
        }
      }
      const finalPrice = Math.max(0, price - (r.discount || 0));
      return { ...r, price, finalPrice };
    }));
  };

  return (
    <DataContext.Provider value={{
      customers, addCustomer, updateCustomer, deleteCustomer,
      records, setUsage, setRecordDiscount, togglePaid, getRecord,
      settings, updateSettings, calculatePrice, calculateProratedPrice,
      isFirstMonth, formatCurrency,
      currentMonth, setCurrentMonth,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

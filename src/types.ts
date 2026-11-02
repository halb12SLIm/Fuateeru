export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'canceled';
export type Currency = 'SAR' | 'USD' | 'EUR' | 'TRY';

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export const SHIPPING_COMPANIES = [
  'Yurtiçi Kargo',
  'Aras Kargo',
  'PTT Kargo',
  'MNG Kargo',
  'Sürat Kargo',
  'DPD',
  'DHL Express',
  'UPS',
  'FedEx',
  'توصيل خاص / مندوب',
] as const;

export type ShippingCompany = (typeof SHIPPING_COMPANIES)[number];

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: number;
  tax: number;
  discount: number;
  shippingFee?: number;
  shippingCompany?: string;
  items?: InvoiceItem[];
  total: number;
  currency: Currency;
  date: string;
  status: InvoiceStatus;
  description: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  type: 'invoice' | 'payment' | 'old_debt';
  amount: number;
  currency: Currency;
  date: string;
  description: string;
  referenceId?: string;
}

export interface Metric {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
}

export interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

export interface LogoData {
  brandName: string;
  productName: string;
  details: string;
  weightOrVolume?: string;
  price?: number;
  currency?: string;
}

export interface Shipment {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  fullAddress: string;
  cargoCompany: string;
  trackingNumber: string;
  packageWeightKg: number;
  status: string;
  createdAt: string;
}


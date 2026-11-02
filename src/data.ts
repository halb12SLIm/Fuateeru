import { Client, Invoice } from './types';

export const initialClients: Client[] = [
  { id: 'C-001', name: 'شركة التقنية الحديثة', phone: '0501234567', email: 'info@tech-modern.com', address: 'الرياض، العليا' },
  { id: 'C-002', name: 'مؤسسة الأفق', phone: '0559876543', email: 'contact@horizon.sa', address: 'جدة، التحلية' },
  { id: 'C-003', name: 'مجموعة الرواد', phone: '0541112233', email: 'sales@pioneers.com', address: 'الدمام، الخليج' },
  { id: 'C-004', name: 'شركة الإعمار', phone: '0569998887', email: 'finance@emaar-sa.com', address: 'مكة المكرمة' },
];

export const initialInvoices: Invoice[] = [
  { id: 'INV-2026-001', clientId: 'C-001', clientName: 'شركة التقنية الحديثة', amount: 15000, tax: 15, discount: 0, total: 17250, currency: 'SAR', date: '2026-09-15', status: 'paid', description: 'تطوير تطبيق جوال' },
  { id: 'INV-2026-002', clientId: 'C-002', clientName: 'مؤسسة الأفق', amount: 8000, tax: 15, discount: 500, total: 8700, currency: 'SAR', date: '2026-09-16', status: 'pending', description: 'حملة تسويق إلكتروني' },
  { id: 'INV-2026-003', clientId: 'C-003', clientName: 'مجموعة الرواد', amount: 3500, tax: 15, discount: 0, total: 4025, currency: 'SAR', date: '2026-09-10', status: 'overdue', description: 'استشارات إدارية' },
  { id: 'INV-2026-004', clientId: 'C-004', clientName: 'شركة الإعمار', amount: 5000, tax: 0, discount: 0, total: 5000, currency: 'USD', date: '2026-09-17', status: 'pending', description: 'تصميم هوية بصرية' },
  { id: 'INV-2026-005', clientId: 'C-001', clientName: 'شركة التقنية الحديثة', amount: 1200, tax: 15, discount: 0, total: 1380, currency: 'EUR', date: '2026-09-01', status: 'canceled', description: 'استضافة مواقع' },
];

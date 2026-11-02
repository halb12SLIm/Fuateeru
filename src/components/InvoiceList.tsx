import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Plus, Printer, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Invoice, InvoiceStatus, Client, Currency } from '../types';
import { Modal } from './Modal';
import { CreateInvoice } from './CreateInvoice';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceListProps {
  invoices: Invoice[];
  clients: Client[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
}

const statusStyles: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  canceled: 'bg-stone-100 text-stone-600 border-stone-200',
};

const statusLabels: Record<InvoiceStatus, string> = {
  paid: 'مدفوعة',
  pending: 'معلقة',
  overdue: 'متأخرة',
  canceled: 'ملغاة',
};

const currencySymbols: Record<Currency, string> = {
  SAR: 'ر.س',
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

export function InvoiceList({ invoices, clients, setInvoices }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (newInvoice: Partial<Invoice>) => {
    // Determine a random client ID if not tied explicitly to existing mock, or match name
    let clientId = clients.find(c => c.name === newInvoice.clientName)?.id;
    if (!clientId) {
      clientId = `C-${Date.now()}`;
    }

    const invoice: Invoice = {
      ...newInvoice as Invoice,
      id: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      clientId,
      description: newInvoice.items && newInvoice.items.length > 0 ? newInvoice.items[0].name : 'فاتورة جديدة',
    };
    
    setInvoices(prev => [invoice, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">الفواتير</h2>
          <p className="text-xs text-stone-500 mt-1">إدارة وتتبع فواتير العملاء بكل سهولة.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 me-2" />
          إنشاء فاتورة
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-row gap-2 justify-between items-center bg-stone-50/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 right-0 pe-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة أو اسم العميل..."
              className="block w-full rounded-md border border-stone-200 bg-white ps-9 pe-3 py-1.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center px-3 py-1.5 border border-stone-200 bg-white rounded-md text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors shrink-0">
            <Filter className="w-3.5 h-3.5 me-1.5" />
            تصفية
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-stone-50 text-stone-600 font-medium border-b border-stone-200 text-xs">
              <tr>
                <th scope="col" className="px-5 py-3">رقم الفاتورة</th>
                <th scope="col" className="px-5 py-3">العميل</th>
                <th scope="col" className="px-5 py-3">التاريخ</th>
                <th scope="col" className="px-5 py-3">الإجمالي</th>
                <th scope="col" className="px-5 py-3">الحالة</th>
                <th scope="col" className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3 font-semibold text-stone-800">{invoice.id}</td>
                  <td className="px-5 py-3 text-stone-700">{invoice.clientName}</td>
                  <td className="px-5 py-3 text-stone-500 text-xs">{invoice.date}</td>
                  <td className="px-5 py-3 font-bold text-stone-900" dir="ltr">
                    {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbols[invoice.currency]}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border",
                      statusStyles[invoice.status]
                    )}>
                      {statusLabels[invoice.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-left">
                    <div className="flex items-center justify-end gap-1 text-stone-400">
                      <button 
                        onClick={() => setPreviewInvoice(invoice)} 
                        className="p-1.5 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" 
                        title="عرض / طباعة الفاتورة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="خيارات">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-sm">
              لم يتم العثور على فواتير مطابقة لبحثك.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} bare>
        <CreateInvoice onSave={handleCreate} onClose={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!previewInvoice} onClose={() => setPreviewInvoice(null)} bare>
        {previewInvoice && (
          <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
        )}
      </Modal>
    </div>
  );
}

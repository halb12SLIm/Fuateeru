import React, { useState } from 'react';
import type { Invoice, Client, Currency } from '../types';
import { FileText, Eye, Trash2, Truck, Edit } from 'lucide-react';
import { InvoicePreview } from './InvoicePreview';
import { ShippingLabelModal } from './ShippingLabelModal';
import { EditInvoiceModal } from './EditInvoiceModal';

const currencySymbols: Record<Currency, string> = {
  SAR: 'ر.س',
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

interface InvoicesTabProps {
  invoices: Invoice[];
  clients: Client[];
  onDeleteInvoice?: (id: string) => Promise<void> | void;
  onUpdateInvoice?: (invoice: Invoice) => Promise<void> | void;
}

export function InvoicesTab({ invoices, clients, onDeleteInvoice, onUpdateInvoice }: InvoicesTabProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [shippingInvoice, setShippingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const formatCurr = (amount: number) => {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-60">
        <FileText className="w-12 h-12 text-[#64748b] mb-4" />
        <p className="text-[0.8rem] font-bold text-[#64748b]">لا يوجد فواتير سابقة</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {invoices.map(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return (
          <div key={invoice.id} className="bg-white p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e2e8f0] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-[0.85rem] text-[#1e293b]">
                  {client ? client.name : 'عميل غير معروف'}
                </span>
                <span className="text-[0.55rem] font-bold bg-[#f1f5f9] text-[#64748b] px-1.5 py-0.5 rounded">
                  {invoice.id}
                </span>
              </div>
              <div className="text-[0.7rem] text-[#64748b] font-medium flex items-center gap-2">
                <span>{invoice.date}</span>
                <span className="w-1 h-1 bg-[#cbd5e1] rounded-full"></span>
                <span className="font-bold text-[#15803d]" dir="ltr">
                  {formatCurr(invoice.total)} {currencySymbols[invoice.currency]}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShippingInvoice(invoice)}
                title="إنشاء ملصق شحن وبوليصة كارجو (10×10 سم)"
                className="bg-[#fefce8] text-[#854d0e] hover:bg-[#fef9c3] p-2 rounded-lg transition-colors border border-[#fef08a] cursor-pointer flex flex-col items-center gap-1"
              >
                <Truck className="w-4 h-4" />
                <span className="text-[0.55rem] font-bold">ملصق</span>
              </button>

              <button 
                onClick={() => setEditingInvoice(invoice)}
                title="تعديل وتصحيح الفاتورة"
                className="bg-[#f0fdf4] text-[#15803d] hover:bg-[#dcfce7] p-2 rounded-lg transition-colors border border-[#bbf7d0] cursor-pointer flex flex-col items-center gap-1"
              >
                <Edit className="w-4 h-4" />
                <span className="text-[0.55rem] font-bold">تعديل</span>
              </button>

              <button 
                onClick={() => setSelectedInvoice(invoice)}
                className="bg-[#f8fafc] text-[#0284c7] hover:bg-[#e0f2fe] p-2 rounded-lg transition-colors border border-[#e0f2fe] cursor-pointer flex flex-col items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                <span className="text-[0.55rem] font-bold">عرض</span>
              </button>

              {onDeleteInvoice && (
                <button 
                  onClick={() => setInvoiceToDelete(invoice)}
                  title="حذف الفاتورة"
                  className="bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] p-2 rounded-lg transition-colors border border-[#fecaca] cursor-pointer flex flex-col items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[0.55rem] font-bold">حذف</span>
                </button>
              )}
            </div>
          </div>
        );
      })}

      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSave={(updated) => {
            if (onUpdateInvoice) {
              onUpdateInvoice(updated);
            }
            setEditingInvoice(null);
          }}
        />
      )}

      {selectedInvoice && (
        <InvoicePreview 
          invoice={selectedInvoice} 
          onClose={() => setSelectedInvoice(null)} 
        />
      )}

      {shippingInvoice && (
        <ShippingLabelModal
          invoice={shippingInvoice}
          client={clients.find(c => c.id === shippingInvoice.clientId)}
          clients={clients}
          onClose={() => setShippingInvoice(null)}
        />
      )}

      {/* نافذة تأكيد الحذف */}
      {invoiceToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الفاتورة رقم <span className="font-bold text-slate-900" dir="ltr">({invoiceToDelete.id})</span>؟
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (onDeleteInvoice) {
                    await onDeleteInvoice(invoiceToDelete.id);
                  }
                  setInvoiceToDelete(null);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700 transition cursor-pointer"
              >
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

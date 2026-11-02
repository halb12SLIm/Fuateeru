import React, { useState } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import type { Invoice, InvoiceItem } from '../types';

interface EditInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (updatedInvoice: Invoice) => void;
}

export function EditInvoiceModal({ invoice, onClose, onSave }: EditInvoiceModalProps) {
  const [clientName, setClientName] = useState(invoice.clientName || '');
  const [clientPhone, setClientPhone] = useState(invoice.clientPhone || '');
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || '');
  const [items, setItems] = useState<InvoiceItem[]>(
    (invoice.items && invoice.items.length > 0)
      ? invoice.items.map(i => ({ ...i }))
      : [{ id: `item-${Date.now()}`, name: invoice.description || 'منتج عسل', price: invoice.amount || 0, qty: 1 }]
  );
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemPrice) return;
    const item: InvoiceItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: Number(newItemPrice),
      qty: Number(newItemQty) || 1
    };
    setItems([...items, item]);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQty('1');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleSave = () => {
    if (items.length === 0) return;
    const totalAmount = calculateTotal();
    const updated: Invoice = {
      ...invoice,
      clientName: clientName.trim() || invoice.clientName,
      clientPhone: clientPhone.trim(),
      clientAddress: clientAddress.trim(),
      items: items,
      amount: totalAmount,
      total: totalAmount,
      description: items.map(i => `${i.name} (×${i.qty})`).join(' ، ')
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-right">
        {/* Header */}
        <div className="bg-[#15803d] text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold m-0">تعديل وتصحيح الفاتورة #{invoice.id}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white border-none bg-transparent cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم العميل بالفاتورة *</label>
            <input 
              type="text" 
              value={clientName} 
              onChange={e => setClientName(e.target.value)} 
              className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input 
                type="tel" 
                value={clientPhone} 
                onChange={e => setClientPhone(e.target.value)} 
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
                dir="ltr"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان الشحن</label>
              <input 
                type="text" 
                value={clientAddress} 
                onChange={e => setClientAddress(e.target.value)} 
                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
              />
            </div>
          </div>

          <hr className="border-slate-100 my-1" />

          {/* Items Section */}
          <div>
            <span className="block font-bold text-slate-800 mb-2">أصناف الفاتورة:</span>
            
            <div className="flex flex-col gap-1.5 mb-3">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <div className="text-slate-500 text-[11px]">
                      الكمية: {item.qty} × السعر: {item.price} {invoice.currency === 'TRY' ? '₺' : invoice.currency}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">{(item.qty * item.price).toLocaleString()}</span>
                    <button 
                      onClick={() => handleRemoveItem(item.id)} 
                      className="text-red-500 hover:text-red-700 p-1 border-none bg-transparent cursor-pointer"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new item inputs */}
            <div className="bg-emerald-50/60 border border-emerald-100 p-2.5 rounded-xl flex flex-col gap-2">
              <span className="font-bold text-emerald-800 text-[11px]">إضافة مادة جديدة للفاتورة:</span>
              <div className="flex items-center gap-1.5">
                <input 
                  type="text" 
                  placeholder="اسم المادة" 
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                  className="flex-2 h-8 border border-slate-300 rounded-md px-2 text-[11px] outline-none bg-white" 
                />
                <input 
                  type="number" 
                  placeholder="الكمية" 
                  value={newItemQty} 
                  onChange={e => setNewItemQty(e.target.value)} 
                  className="w-14 h-8 border border-slate-300 rounded-md px-1 text-center text-[11px] outline-none bg-white" 
                />
                <input 
                  type="number" 
                  placeholder="السعر" 
                  value={newItemPrice} 
                  onChange={e => setNewItemPrice(e.target.value)} 
                  className="w-16 h-8 border border-slate-300 rounded-md px-1 text-center text-[11px] outline-none bg-white" 
                />
                <button 
                  onClick={handleAddItem} 
                  className="h-8 px-2.5 bg-[#15803d] text-white rounded-md font-bold text-[11px] flex items-center justify-center border-none cursor-pointer hover:bg-green-800 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between mt-2">
            <span className="font-bold text-amber-900">الإجمالي الجديد:</span>
            <span className="text-base font-extrabold text-[#15803d]" dir="ltr">
              {calculateTotal().toLocaleString()} {invoice.currency === 'TRY' ? '₺' : invoice.currency}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 py-2 rounded-lg bg-[#15803d] text-white font-bold text-xs hover:bg-green-800 transition cursor-pointer"
          >
            حفظ وتثبيت التعديل
          </button>
        </div>
      </div>
    </div>
  );
}

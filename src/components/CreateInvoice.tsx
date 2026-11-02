import React, { useState } from 'react';
import { Receipt, User, Package, Trash2, Plus, Calculator, Check, X } from 'lucide-react';
import { Invoice, InvoiceItem, Currency } from '../types';

interface CreateInvoiceProps {
  onSave: (invoice: Partial<Invoice>) => void;
  onClose: () => void;
}

export function CreateInvoice({ onSave, onClose }: CreateInvoiceProps) {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: '', price: 0, qty: 1 }]);
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [shippingFee, setShippingFee] = useState<number>(0);

  const currencySymbols: Record<Currency, string> = {
    SAR: 'ر.س',
    USD: '$',
    EUR: '€',
    TRY: '₺'
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: 0, qty: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      alert('يجب أن تحتوي الفاتورة على صنف واحد على الأقل.');
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const total = subtotal + (Number(shippingFee) || 0);

  const handleSave = () => {
    if (!clientName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }

    onSave({
      clientName,
      clientPhone,
      clientAddress,
      amount: subtotal,
      shippingFee,
      total,
      currency,
      items,
      tax: 0,
      discount: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
    });
  };

  return (
    <div 
      className="w-full max-w-[440px] bg-slate-50 rounded-[28px] overflow-hidden flex flex-col mx-auto max-h-[90vh] shadow-[0_10px_30px_rgba(0,0,0,0.08)] relative"
      style={{ fontFamily: "'Tajawal', sans-serif" }}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="px-5 py-4 pt-5 text-center bg-white border-b border-slate-200 flex items-center justify-between">
        <h1 className="text-[1.15rem] font-bold text-blue-900 flex items-center gap-2 m-0">
          <Receipt className="w-5 h-5 text-blue-900" />
          إنشاء فاتورة جديدة
        </h1>
        <span className="text-[0.8rem] text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full font-medium">
          فواتير سليم
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3.5 flex-1 overflow-y-auto">
        {/* Client Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="text-[0.95rem] font-bold text-blue-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" /> بيانات العميل
          </div>
          <div className="mb-2.5">
            <label className="block text-[0.8rem] font-semibold text-slate-600 mb-1.5">اسم المشتري</label>
            <input 
              type="text" 
              className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
              placeholder="أدخل اسم المشتري الكامل"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div className="mb-2.5">
            <label className="block text-[0.8rem] font-semibold text-slate-600 mb-1.5">رقم الهاتف</label>
            <input 
              type="tel" 
              className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
              placeholder="مثال: 905xxxxxxxxx+"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[0.8rem] font-semibold text-slate-600 mb-1.5">العنوان</label>
            <input 
              type="text" 
              className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
              placeholder="المدينة، المنطقة، اسم الشارع"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="text-[0.95rem] font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> تفاصيل الأصناف
          </div>
          
          <div>
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-center mb-2.5">
                <input 
                  type="text" 
                  className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
                  placeholder="اسم المنتج"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                />
                <input 
                  type="number" 
                  className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
                  placeholder="السعر"
                  value={item.price || ''}
                  onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                />
                <input 
                  type="number" 
                  className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
                  placeholder="الكمية"
                  value={item.qty || ''}
                  onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 p-1.5 hover:bg-red-50 rounded bg-transparent border-none cursor-pointer"
                >
                  <Trash2 className="w-[18px] h-[18px]" />
                </button>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAddItem}
            className="w-full p-2 bg-blue-50 text-blue-600 border border-dashed border-blue-200 rounded-[10px] text-[0.85rem] font-semibold flex items-center justify-center gap-1.5 mt-1.5 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة صنف آخر
          </button>

          {/* Shipping and Currency */}
          <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[0.8rem] font-semibold text-slate-600 mb-1.5">العملة</label>
              <select 
                className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white appearance-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23cbd5e1%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'left 12px center', backgroundSize: '10px auto' }}
              >
                <option value="TRY">تركي (₺)</option>
                <option value="USD">دولار ($)</option>
                <option value="EUR">يورو (€)</option>
                <option value="SAR">ريال (ر.س)</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.8rem] font-semibold text-slate-600 mb-1.5">رسوم الشحن (إن وجدت)</label>
              <input 
                type="number" 
                className="w-full h-[42px] border border-slate-300 rounded-[10px] px-3 text-[0.85rem] text-slate-800 outline-none transition-all focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 bg-white" 
                placeholder="0.00"
                value={shippingFee || ''}
                onChange={(e) => setShippingFee(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_6px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="text-[0.95rem] font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4" /> ملخص الفاتورة
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
            <div className="flex justify-between items-center text-[0.85rem] text-slate-500 mb-1.5">
              <span>المجموع الفرعي:</span>
              <span dir="ltr">{subtotal.toFixed(2)} {currencySymbols[currency]}</span>
            </div>
            <div className="flex justify-between items-center text-[0.85rem] text-slate-500 mb-1.5">
              <span>رسوم الشحن:</span>
              <span dir="ltr">{(Number(shippingFee) || 0).toFixed(2)} {currencySymbols[currency]}</span>
            </div>
            <div className="flex justify-between items-center text-[1.05rem] font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2 mb-0">
              <span>المبلغ الإجمالي:</span>
              <span dir="ltr">{total.toFixed(2)} {currencySymbols[currency]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200">
        <button 
          type="button" 
          onClick={handleSave}
          className="w-full h-[46px] bg-blue-600 text-white border-none rounded-xl text-[0.95rem] font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" /> حفظ وإصدار الفاتورة
        </button>
      </div>
    </div>
  );
}

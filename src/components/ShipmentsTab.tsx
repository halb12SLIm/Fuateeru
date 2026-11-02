import React, { useState } from 'react';
import { Truck, CheckCircle2, Search, QrCode, ExternalLink, Send, PackageCheck, Camera } from 'lucide-react';
import type { Invoice, Client, Shipment } from '../types';
import { generateDeliveryMessage, openWhatsAppWithMessage } from '../services/WhatsAppMessaging';

interface ShipmentsTabProps {
  invoices: Invoice[];
  clients: Client[];
}

export function ShipmentsTab({ invoices, clients }: ShipmentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [shipmentsList, setShipmentsList] = useState<Shipment[]>([
    {
      id: 'SHP-101',
      invoiceId: '1042',
      customerId: 'CUST-1',
      customerName: 'محمد العلي',
      customerPhone: '05551234567',
      fullAddress: 'إسطنبول - الفاتح - بناء 12',
      cargoCompany: 'Yurtiçi Kargo',
      trackingNumber: '9284719302',
      packageWeightKg: 4.5,
      status: 'تم الشحن',
      createdAt: new Date().toISOString()
    },
    {
      id: 'SHP-102',
      invoiceId: '1043',
      customerId: 'CUST-2',
      customerName: 'أحمد محمود',
      customerPhone: '05339876543',
      fullAddress: 'أنطاليا - كونيالتي - حي ليمان',
      cargoCompany: 'Yurtiçi Kargo',
      trackingNumber: '4839201948',
      packageWeightKg: 2.0,
      status: 'تم التسليم',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkDelivered = (shipmentId: string) => {
    setShipmentsList(prev => prev.map(s => {
      if (s.id === shipmentId) {
        const updated = { ...s, status: 'تم التسليم' };
        // إرسال الرسالة تلقائياً للزبون
        const text = generateDeliveryMessage({
          customerName: updated.customerName,
          invoiceId: updated.invoiceId,
          trackingNumber: updated.trackingNumber
        });
        openWhatsAppWithMessage(updated.customerPhone, text);
        return updated;
      }
      return s;
    }));
    showToast('تم تعديل حالة الشحنة إلى "تم التسليم" وفتح نافذة الواتساب للإرسال 🚀');
  };

  const handleOpenYurtici = (trackingNo: string) => {
    window.open(`https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${trackingNo}`, '_blank');
  };

  const filteredShipments = shipmentsList.filter(s => {
    const q = searchTerm.toLowerCase();
    return s.invoiceId.toLowerCase().includes(q) ||
           s.trackingNumber.toLowerCase().includes(q) ||
           s.customerName.toLowerCase().includes(q) ||
           s.customerPhone.includes(q);
  });

  const inTransitCount = shipmentsList.filter(s => s.status === 'تم الشحن').length;
  const deliveredCount = shipmentsList.filter(s => s.status === 'تم التسليم').length;

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-200">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 gap-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80">
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-semibold">قيد التوصيل</span>
            <strong className="text-sm text-slate-800 font-bold">{inTransitCount} طرد</strong>
          </div>
        </div>

        <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2.5 shadow-2xs">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-500 font-semibold">تم التسليم</span>
            <strong className="text-sm text-slate-800 font-bold">{deliveredCount} طرد</strong>
          </div>
        </div>
      </div>

      {/* 2. Instant Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        <input 
          type="text" 
          placeholder="ابحث برقم الفاتورة، رقم التتبع، أو الزبون..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="w-full h-9 bg-white border border-slate-300 rounded-xl pr-9 pl-8 text-xs outline-none focus:border-[#15803d]" 
        />
        <button 
          onClick={() => {
            const randomCode = '92847' + Math.floor(10005 + Math.random() * 89999);
            setSearchTerm(randomCode);
            showToast(`تم مسح الباركود بالكاميرا: ${randomCode}`);
          }}
          className="absolute left-2 top-1.5 p-1 text-[#8B5A2B] hover:text-[#15803d] border-none bg-transparent cursor-pointer"
          title="مسح الباركود بالكاميرا"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Shipments List */}
      <div className="flex flex-col gap-2">
        {filteredShipments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            لا توجد شحنات مطابقة للبحث.
          </div>
        ) : (
          filteredShipments.map(s => {
            const isDelivered = s.status === 'تم التسليم';
            return (
              <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-50 text-[#15803d] font-bold text-[11px] px-2 py-0.5 rounded-md border border-emerald-100">
                    {s.cargoCompany}
                  </span>
                  <span className="font-extrabold text-xs text-slate-800">
                    فاتورة #{s.invoiceId}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isDelivered ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700'}`}>
                    {s.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-500">التتبع:</span>
                    <span className="font-mono font-bold text-blue-600 select-all" dir="ltr">{s.trackingNumber}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">الوزن: {s.packageWeightKg} كغ</span>
                </div>

                <div className="text-xs text-slate-700">
                  <div className="font-bold">{s.customerName} ({s.customerPhone})</div>
                  <div className="text-[11px] text-slate-500 truncate">{s.fullAddress}</div>
                </div>

                <hr className="border-slate-100 my-0.5" />

                <div className="flex items-center justify-between gap-2">
                  <button 
                    onClick={() => handleOpenYurtici(s.trackingNumber)} 
                    className="h-7 px-2.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>تتبع Yurtiçi</span>
                  </button>

                  <button 
                    onClick={() => handleMarkDelivered(s.id)} 
                    className="h-7 px-3 rounded-lg bg-[#15803d] text-white hover:bg-green-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors border-none shadow-2xs"
                  >
                    <Send className="w-3 h-3" />
                    <span>واتساب التسليم</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[500] max-w-[90%] bg-emerald-800 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

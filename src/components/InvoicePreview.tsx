import React, { useRef, useState } from 'react';
import { Hexagon, Printer, X, FileText, MessageCircle, Truck } from 'lucide-react';
import type { Invoice, Currency } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { ShippingLabelModal } from './ShippingLabelModal';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

const currencySymbols: Record<Currency, string> = {
  SAR: 'ر.س',
  USD: '$',
  EUR: '€',
  TRY: '₺'
};

export function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [showShippingLabel, setShowShippingLabel] = useState(false);

  const executeNativePrint = () => {
    const element = document.getElementById('invoiceArea');
    if (!element) return;
    const invoiceHTML = element.innerHTML;
    
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة وتصدير PDF');
      return;
    }

    // Capture styles to ensure Tailwind rules are applied
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
      <head>
        <title>فاتورة - شركة سليم</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@500;700;800&display=swap" rel="stylesheet">
        ${styles}
        <style>
          * { box-sizing: border-box; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { padding: 15px; margin: 0; background: #fff; font-family: 'Cairo', sans-serif; }
          #invoiceArea { 
             position: relative !important; 
             left: 0 !important; 
             top: 0 !important; 
             box-shadow: none !important;
             border: none !important;
             width: 100% !important;
             max-width: 100% !important;
          }
          [data-html2canvas-ignore] { display: none !important; }
          @page { size: portrait; margin: 8mm; }
        </style>
      </head>
      <body>
        <div id="invoiceArea" class="text-[#1e293b]">${invoiceHTML}</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function(){ window.close(); }, 500);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareWhatsApp = () => {
    const phone = (invoice.clientPhone || '').replace(/[^0-9]/g, '');
    const currencySymbol = currencySymbols[invoice.currency];
    const text = encodeURIComponent(`مرحباً ${invoice.clientName}،\nفاتورتك من شركة سليم لإنتاج العسل الطبيعي جاهزة:\nرقم الفاتورة: ${invoice.id}\nالمبلغ الإجمالي: ${invoice.total.toFixed(2)} ${currencySymbol}\nشكراً لتعاملكم معنا!`);
    
    if (!phone) {
      alert("لا يوجد رقم هاتف للعميل لإرسال رسالة واتساب.");
      return;
    }

    const whatsappAppUrl = `whatsapp://send?phone=${phone}&text=${text}`;
    window.location.href = whatsappAppUrl;

    setTimeout(function() {
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
    }, 700);
  };

  const currencySymbol = currencySymbols[invoice.currency];
  
  const items = invoice.items && invoice.items.length > 0 
    ? invoice.items 
    : [{ id: '1', name: invoice.description || 'عسل طبيعي (1 كغ)', price: invoice.amount, qty: 1 }];

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto text-[#1e293b]" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
      
      {/* شريط الإجراءات */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5 print:hidden">
        <button 
          onClick={executeNativePrint} 
          className="h-[36px] rounded-lg text-[0.74rem] font-bold flex items-center justify-center gap-1 bg-green-600 text-white hover:bg-green-700 transition-colors border-none cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" /> طباعة فورية
        </button>
        <button 
          onClick={executeNativePrint} 
          className="h-[36px] rounded-lg text-[0.74rem] font-bold flex items-center justify-center gap-1 bg-sky-600 text-white hover:bg-sky-700 transition-colors border-none cursor-pointer shadow-xs"
        >
          <FileText className="w-3.5 h-3.5" /> حفظ PDF
        </button>
        <button 
          onClick={() => setShowShippingLabel(true)}
          className="h-[36px] rounded-lg text-[0.74rem] font-bold flex items-center justify-center gap-1 bg-amber-600 text-white hover:bg-amber-700 transition-colors border-none cursor-pointer shadow-xs"
        >
          <Truck className="w-3.5 h-3.5" /> ملصق شحن
        </button>
        <button 
          onClick={shareWhatsApp} 
          className="h-[36px] rounded-lg text-[0.74rem] font-bold flex items-center justify-center gap-1 bg-[#25d366] text-white hover:bg-[#1eb954] transition-colors border-none cursor-pointer shadow-xs"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> واتساب
        </button>
      </div>

      {/* جسم الفاتورة المصغر والملائم للشاشة */}
      <div 
        ref={invoiceRef} 
        id="invoiceArea"
        className="invoice-wrapper w-full bg-[#ffffff] rounded-[14px] border border-[#e2e8f0] shadow-[0_4px_15px_rgba(0,0,0,0.04)] p-3 relative print:border-none print:shadow-none print:w-full print:max-w-full print:p-0 print:absolute print:left-0 print:top-0 text-[#1e293b]"
      >
        <button 
          onClick={onClose}
          data-html2canvas-ignore
          className="absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] rounded-full transition-colors print:hidden cursor-pointer border-none"
        >
          <X className="w-3 h-3" />
        </button>

        {/* الرأس */}
        <div className="flex justify-between items-center border-b-[1.5px] border-dashed border-[#cbd5e1] pb-2 mb-2 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-[38px] h-[38px] bg-[#fef08a] border-[1.5px] border-[#eab308] rounded-lg flex items-center justify-center text-[#a16207]">
              <Hexagon className="w-[18px] h-[18px] fill-[#fef08a]" />
            </div>
            <div>
              <h2 className="text-[0.95rem] font-extrabold text-[#166534] leading-[1.1] m-0">شركة سليم</h2>
              <p className="text-[0.65rem] text-[#64748b] font-semibold m-0">لإنتاج العسل الطبيعي</p>
            </div>
          </div>
          <div className="text-left">
            <h3 className="text-[0.82rem] font-extrabold text-[#16a34a] m-0 mb-0.5">فاتورة مبيعات</h3>
            <p className="text-[0.65rem] text-[#64748b] m-0 mb-0.5"><strong>رقم الفاتورة:</strong> <span dir="ltr">{invoice.id}</span></p>
            <p className="text-[0.65rem] text-[#64748b] m-0"><strong>التاريخ:</strong> {invoice.date}</p>
          </div>
        </div>

        {/* العميل */}
        <div className="bg-[#f8fafc] border border-[#bbf7d0] rounded-lg p-1.5 px-2.5 mb-2">
          <div className="flex justify-between text-[0.72rem] py-0.5 border-b border-[#f1f5f9]">
            <span className="text-[#64748b] font-semibold">المشتري:</span>
            <span className="font-bold text-[#0f172a]">{invoice.clientName}</span>
          </div>
          <div className="flex justify-between text-[0.72rem] py-0.5 border-b border-[#f1f5f9]">
            <span className="text-[#64748b] font-semibold">الهاتف:</span>
            <span className="font-bold text-[#0f172a]" dir="ltr">{invoice.clientPhone || 'غير متوفر'}</span>
          </div>
          <div className="flex justify-between text-[0.72rem] py-0.5">
            <span className="text-[#64748b] font-semibold">العنوان:</span>
            <span className="font-bold text-[#0f172a]">{invoice.clientAddress || 'غير متوفر'}</span>
          </div>
        </div>

        {/* جدول المنتجات المصغر والمنضبط */}
        <div className="w-full rounded-lg overflow-hidden border border-[#e2e8f0] mb-2">
          <table className="w-full border-collapse table-fixed text-center text-[0.68rem]">
            <thead className="bg-[#16a34a] text-[#ffffff]">
              <tr>
                <th className="w-[45%] py-1.5 px-1 font-bold text-right pr-2">المنتج</th>
                <th className="w-[15%] py-1.5 px-1 font-bold">الكمية</th>
                <th className="w-[20%] py-1.5 px-1 font-bold">السعر</th>
                <th className="w-[20%] py-1.5 px-1 font-bold">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-[#f1f5f9] last:border-0 bg-[#ffffff]">
                  <td className="py-1.5 px-1 text-right font-bold text-[#0f172a] pr-2 break-words">{item.name}</td>
                  <td className="py-1.5 px-1 text-[#334155] break-words">{item.qty}</td>
                  <td className="py-1.5 px-1 text-[#334155] break-words" dir="ltr">{Number(item.price).toFixed(2)} {currencySymbol}</td>
                  <td className="py-1.5 px-1 text-[#334155] break-words" dir="ltr">{(Number(item.price) * Number(item.qty)).toFixed(2)} {currencySymbol}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* الملخص بدون ضريبة */}
        <div className="bg-[#fefce8] border border-[#fde047] rounded-lg p-1.5 px-2.5 mb-2">
          <div className="flex justify-between text-[0.72rem] text-[#713f12] font-semibold py-0.5">
            <span>المجموع الفرعي:</span>
            <span dir="ltr">{invoice.amount.toFixed(2)} {currencySymbol}</span>
          </div>
          
          {invoice.discount > 0 && (
            <div className="flex justify-between text-[0.72rem] text-[#b91c1c] font-semibold py-0.5">
              <span>الخصم:</span>
              <span dir="ltr">- {invoice.discount.toFixed(2)} {currencySymbol}</span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between text-[0.72rem] text-[#713f12] font-semibold py-0.5">
              <span>الضريبة ({invoice.tax}%):</span>
              <span dir="ltr">+ {((invoice.amount - invoice.discount) * (invoice.tax / 100)).toFixed(2)} {currencySymbol}</span>
            </div>
          )}
          
          {invoice.shippingFee ? (
            <div className="flex justify-between text-[0.72rem] text-[#713f12] font-semibold py-0.5">
              <span>رسوم الشحن {invoice.shippingCompany ? `(${invoice.shippingCompany})` : ''}:</span>
              <span dir="ltr">{(invoice.shippingFee || 0).toFixed(2)} {currencySymbol}</span>
            </div>
          ) : null}
          
          <div className="flex justify-between text-[0.84rem] font-extrabold text-[#15803d] border-t border-dashed border-[#eab308] mt-1 pt-1">
            <span>الإجمالي الكلي:</span>
            <span dir="ltr">{invoice.total.toFixed(2)} {currencySymbol}</span>
          </div>
        </div>

        {/* التذييل */}
        <div className="flex justify-between items-center border-t border-[#e2e8f0] pt-1.5">
          <div className="text-[0.62rem] text-[#64748b] leading-[1.25] max-w-[70%]">
            <strong className="text-[#166534] block mb-[1px]">ضمان الجودة:</strong>
            نضمن أصالة ونقاء العسل الطبيعي 100%. نشكر تعاملكم مع شركة سليم.
          </div>
          <div className="text-center">
            <div id="qrcode" className="bg-white p-0.5 rounded border border-[#cbd5e1] inline-flex mx-auto qr-area">
              <QRCodeSVG value={`${invoice.id}-SALEEM`} size={40} fgColor="#15803d" />
            </div>
            <span className="block text-[0.55rem] text-[#64748b] mt-[1px]">تحقق</span>
          </div>
        </div>

        {/* تذييل معلومات الشركة التلقائي للطباعة و PDF */}
        <div className="company-info-footer hidden print:flex">
          <span className="font-bold text-emerald-800">شركة سليم لإنتاج العسل الطبيعي 🍯</span>
          <span>هاتف: 05551234567 • إسطنبول - الفاتح</span>
          <span>خدمة العملاء: info@saleemhoney.com</span>
        </div>

      </div>

      {/* نافذة ملصق الشحن القياسي 10x10 سم */}
      {showShippingLabel && (
        <ShippingLabelModal
          invoice={invoice}
          onClose={() => setShowShippingLabel(false)}
        />
      )}
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { FileText, Plus, X, Printer, FileDown, Hexagon, Truck, Camera, Upload, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { SHIPPING_COMPANIES, type Client, type Invoice, type InvoiceItem, type Currency } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { ShippingLabelModal } from './ShippingLabelModal';

interface Props {
  clients: Client[];
  onSave: (invoice: Invoice) => void;
}

export function CreateInvoiceTab({ clients, onSave }: Props) {
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [shippingCompany, setShippingCompany] = useState<string>('Yurtiçi Kargo');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: 'عسل نحل طبيعي (1 كغ)', price: 100, qty: 10 }]);
  const [showShippingLabel, setShowShippingLabel] = useState(false);
  
  // Image Picker & Gemini AI OCR States
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

  const handleImagePicked = async (file: File) => {
    if (!file) return;
    setIsScanning(true);
    setScanMessage('جاري تحليل المستند بواسطة الذكاء الاصطناعي (Gemini 3.8 Flash)...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/scan-invoice-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg',
            }),
          });

          const data = await res.json();
          if (data?.success && data?.data) {
            const extracted = data.data;
            if (extracted.clientName) setClientName(extracted.clientName);
            if (extracted.clientPhone) setClientPhone(extracted.clientPhone);
            if (extracted.clientAddress) setClientAddress(extracted.clientAddress);
            if (extracted.shippingCompany && SHIPPING_COMPANIES.includes(extracted.shippingCompany)) {
              setShippingCompany(extracted.shippingCompany);
            }
            if (extracted.currency && ['TRY', 'USD', 'EUR'].includes(extracted.currency)) {
              setCurrency(extracted.currency as Currency);
            }
            if (extracted.shippingFee && typeof extracted.shippingFee === 'number') {
              setShippingCost(extracted.shippingFee);
            }
            if (Array.isArray(extracted.items) && extracted.items.length > 0) {
              setItems(extracted.items.map((it: any, idx: number) => ({
                id: (Date.now() + idx).toString(),
                name: it.name || 'عسل طبيعي',
                price: Number(it.price) || 100,
                qty: Number(it.qty) || 1,
              })));
            }

            setScanMessage('✅ تم قراءة الفاتورة وتعبئة الحقول بنجاح بواسطة Gemini!');
            setTimeout(() => setScanMessage(null), 5000);
          } else {
            setScanMessage('⚠️ لم يتم التعرف على تفاصيل كافية من الصورة. يرجى تجربة صورة أوضح.');
            setTimeout(() => setScanMessage(null), 5000);
          }
        } catch (err) {
          console.error(err);
          setScanMessage('❌ تعذر الاتصال بخدمة الذكاء الاصطناعي.');
          setTimeout(() => setScanMessage(null), 4000);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
      setScanMessage('❌ خطأ في معالجة ملف الصورة.');
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setClientId(id);
    if (id) {
      const client = clients.find(c => c.id === id);
      if (client) {
        setClientName(client.name);
        setClientPhone(client.phone);
        setClientAddress(client.address || '');
      }
    } else {
      setClientName('');
      setClientPhone('');
      setClientAddress('');
    }
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
    const total = subtotal + shippingCost;
    
    const invoice: Invoice = {
      id: invoiceNumber,
      clientId: clientId || `C-${Date.now()}`,
      clientName,
      clientPhone,
      clientAddress,
      amount: subtotal,
      tax: 0,
      discount: 0,
      shippingFee: shippingCost,
      shippingCompany,
      total,
      currency,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      description: items[0]?.name || 'فاتورة جديدة',
      items
    };

    onSave(invoice);
    alert('تم حفظ الفاتورة بنجاح!');
  };

  const executeNativePrint = () => {
    const element = document.getElementById('printableInvoice');
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
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@500;700;800&display=swap" rel="stylesheet">
        ${styles}
        <style>
          * { box-sizing: border-box; font-family: 'Tajawal', sans-serif; }
          body { padding: 15px; margin: 0; background: #fff; }
          #printableInvoice { 
             position: relative !important; 
             left: 0 !important; 
             top: 0 !important; 
             box-shadow: none !important;
             border: none !important;
             width: 100% !important;
             max-width: 100% !important;
          }
          @page { size: portrait; margin: 8mm; }
        </style>
      </head>
      <body>
        <div id="printableInvoice" class="text-[#1e293b]">${invoiceHTML}</div>
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

  const handleWhatsApp = () => {
    const phone = clientPhone.replace(/[^0-9]/g, '');
    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
    const grandTotal = subtotal + shippingCost;
    const sym = { TRY: '₺', USD: '$', EUR: '€' }[currency] || '';
    const text = encodeURIComponent(`مرحباً ${clientName}،\nفاتورتك من شركة سليم لإنتاج العسل الطبيعي جاهزة بقيمة: ${grandTotal} ${sym}.\nشكراً لتعاملكم معنا!`);
    
    if (!phone) {
      alert('يرجى التأكد من كتابة رقم هاتف العميل بالرمز الدولي');
      return;
    }

    const whatsappAppUrl = `whatsapp://send?phone=${phone}&text=${text}`;
    window.location.href = whatsappAppUrl;

    setTimeout(function() {
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${text}`, '_blank');
    }, 700);
  };

  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
  const grandTotal = subtotal + shippingCost;
  const currSym = { TRY: '₺', USD: '$', EUR: '€' }[currency] || '';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 print-hidden pb-4">
      
      {/* Invoice Form Card */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-[#f1f5f9]">
        <div className="text-[0.82rem] font-bold text-[#15803d] mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> إنشاء فاتورة مبيعات</span>
          <span className="text-[0.68rem] text-[#78350f]">{invoiceNumber}</span>
        </div>

        {/* AI Camera / Image Picker Toolbar */}
        <div className="mb-3 p-2 rounded-lg bg-gradient-to-r from-amber-50/70 to-emerald-50/70 border border-amber-200/60">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              <span className="text-[0.72rem] font-bold text-stone-700">مسح الفاتورة أو البوليصة الذكي (AI OCR)</span>
            </div>
            <span className="text-[0.6rem] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">Gemini 3.8 Flash</span>
          </div>

          <div className="flex gap-2">
            {/* Camera Picker */}
            <button
              type="button"
              disabled={isScanning}
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-700 text-white rounded-lg text-[0.72rem] font-bold hover:bg-emerald-800 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              <span>تصوير بالكاميرا</span>
            </button>
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImagePicked(e.target.files[0]);
                e.target.value = '';
              }}
            />

            {/* Gallery Picker */}
            <button
              type="button"
              disabled={isScanning}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white text-stone-700 border border-stone-300 rounded-lg text-[0.72rem] font-bold hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-amber-600" />}
              <span>اختيار من المعرض</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleImagePicked(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>

          {scanMessage && (
            <div className="mt-2 text-[0.68rem] font-medium text-stone-700 bg-white/80 p-1.5 rounded border border-amber-200 flex items-center gap-1.5">
              {isScanning ? <Loader2 className="w-3 h-3 text-amber-600 animate-spin shrink-0" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
              <span>{scanMessage}</span>
            </div>
          )}
        </div>

        <div className="mb-2">
          <label className="block text-[0.7rem] font-semibold text-slate-500 mb-[3px]">اختر العميل (تعبئة فورية):</label>
          <select 
            className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white appearance-none" 
            value={clientId} 
            onChange={handleClientChange}
          >
            <option value="">-- عميل نقدي مباشر --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <input type="text" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="اسم المشتري" value={clientName} onChange={e => setClientName(e.target.value)} />
        </div>
        <div className="mb-2">
          <input type="tel" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="رقم الهاتف" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
        </div>
        <div>
          <input type="text" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="العنوان / المدينة" value={clientAddress} onChange={e => setClientAddress(e.target.value)} />
        </div>
      </div>

      {/* Currency & Shipping */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-[#f1f5f9]">
        <label className="block text-[0.7rem] font-semibold text-slate-500 mb-[3px]">عملة الفاتورة:</label>
        <div className="flex gap-1.5 mt-1">
          {(['TRY', 'USD', 'EUR'] as Currency[]).map(curr => (
            <button 
              key={curr}
              type="button" 
              onClick={() => setCurrency(curr)}
              className={`flex-1 h-[30px] border rounded-md text-[0.72rem] font-bold cursor-pointer transition-colors ${currency === curr ? 'bg-[#fef3c7] border-[#f59e0b] text-[#78350f]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {curr === 'TRY' ? 'تركي (₺)' : curr === 'USD' ? 'دولار ($)' : 'يورو (€)'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-[0.7rem] font-semibold text-slate-500 mb-[3px]">أجور الشحن (إن وجدت):</label>
            <input type="number" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="0.00" value={shippingCost === 0 ? '' : shippingCost} onChange={e => setShippingCost(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-[0.7rem] font-semibold text-slate-500 mb-[3px]">شركة الشحن (الكارجو):</label>
            <select
              value={shippingCompany}
              onChange={e => setShippingCompany(e.target.value)}
              className="w-full h-[34px] border border-slate-200 rounded-lg px-2 text-[0.75rem] font-bold outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white"
            >
              {SHIPPING_COMPANIES.map(comp => (
                <option key={comp} value={comp}>{comp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-[#f1f5f9]">
        <div className="text-[0.82rem] font-bold text-[#15803d] mb-2 flex items-center justify-between">
          <span>أصناف العسل</span>
          <button 
            type="button" 
            onClick={() => setItems([...items, { id: Date.now().toString(), name: '', price: 0, qty: 1 }])}
            className="bg-transparent border-none text-[#15803d] text-[0.75rem] font-bold cursor-pointer hover:text-green-800"
          >
            + صنف
          </button>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {items.map(item => (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-1.5 items-center">
              <input type="text" className="h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white w-full" placeholder="اسم المنتج" value={item.name} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, name: e.target.value} : i))} />
              <input type="number" className="h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white w-full" placeholder="السعر" value={item.price || ''} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, price: Number(e.target.value)} : i))} />
              <input type="number" className="h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white w-full" placeholder="الكمية" value={item.qty || ''} onChange={e => setItems(items.map(i => i.id === item.id ? {...i, qty: Number(e.target.value)} : i))} />
              <button type="button" onClick={() => items.length > 1 && setItems(items.filter(i => i.id !== item.id))} className="text-red-500 bg-transparent border-none p-1 cursor-pointer hover:bg-red-50 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave}
          className="w-full h-[38px] bg-[#15803d] text-white rounded-lg text-[0.82rem] font-bold flex items-center justify-center gap-1.5 mt-1.5 cursor-pointer border-none"
        >
          حفظ وترحيل للديون
        </button>
      </div>

      {/* Print Toolbars */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
        <button onClick={executeNativePrint} className="h-[32px] border-none rounded-md text-[0.7rem] font-bold text-white bg-[#16a34a] flex items-center justify-center gap-1 cursor-pointer">
          <Printer className="w-3.5 h-3.5" /> طباعة فورية
        </button>
        <button onClick={executeNativePrint} className="h-[32px] border-none rounded-md text-[0.7rem] font-bold text-white bg-[#0284c7] flex items-center justify-center gap-1 cursor-pointer">
          <FileDown className="w-3.5 h-3.5" /> حفظ PDF
        </button>
        <button onClick={() => setShowShippingLabel(true)} className="h-[32px] border-none rounded-md text-[0.7rem] font-bold text-white bg-[#d97706] hover:bg-[#b45309] flex items-center justify-center gap-1 cursor-pointer">
          <Truck className="w-3.5 h-3.5" /> ملصق شحن
        </button>
        <button onClick={handleWhatsApp} className="h-[32px] border-none rounded-md text-[0.7rem] font-bold text-white bg-[#25d366] flex items-center justify-center gap-1 cursor-pointer">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> واتساب
        </button>
      </div>

      {/* Live Print Preview */}
      <div id="printableInvoice" className="bg-[#ffffff] border border-[#e2e8f0] rounded-xl p-3 relative text-[#1e293b]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-dashed border-[#cbd5e1] pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-[#fef08a] rounded-md flex items-center justify-center text-[#854d0e]">
              <Hexagon className="w-5 h-5 fill-current" />
            </div>
            <div>
              <strong className="text-[#15803d] text-[0.85rem] block leading-tight">شركة سليم</strong>
              <span className="text-[0.6rem] text-[#64748b]">لإنتاج العسل الطبيعي</span>
            </div>
          </div>
          <div className="text-left text-[0.65rem] text-[#64748b]">
            <div className="font-bold text-[#15803d]">{invoiceNumber}</div>
            <div>{dateStr}</div>
          </div>
        </div>

        {/* Client details */}
        <div className="bg-[#f8fafc] border border-[#bbf7d0] rounded-md p-1.5 text-[0.68rem] mb-1.5">
          <div><strong>العميل:</strong> {clientName || 'عميل نقدي مباشر'} | <span dir="ltr">{clientPhone || '-'}</span></div>
          <div><strong>العنوان:</strong> {clientAddress || '-'}</div>
        </div>

        {/* Table */}
        <div className="w-full rounded-md overflow-hidden border border-[#e2e8f0] my-2">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-[#15803d] text-[#ffffff]">
              <tr>
                <th className="p-1 text-[0.65rem] font-bold text-right pr-1.5 w-[45%]">المنتج</th>
                <th className="p-1 text-[0.65rem] font-bold text-center">الكمية</th>
                <th className="p-1 text-[0.65rem] font-bold text-center">السعر</th>
                <th className="p-1 text-[0.65rem] font-bold text-center">المجموع</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="border-b border-[#f1f5f9] last:border-none">
                  <td className="p-1 text-[0.65rem] font-bold text-right pr-1.5 truncate">{item.name || '-'}</td>
                  <td className="p-1 text-[0.65rem] text-center">{item.qty || 0}</td>
                  <td className="p-1 text-[0.65rem] text-center">{item.price || 0} {currSym}</td>
                  <td className="p-1 text-[0.65rem] text-center">{(item.price || 0) * (item.qty || 0)} {currSym}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="bg-[#fefce8] border border-[#fde047] rounded-md py-1.5 px-2 mb-2">
          <div className="flex justify-between text-[0.7rem] text-[#713f12] py-[1px]">
            <span>المجموع الفرعي:</span>
            <span>{subtotal} {currSym}</span>
          </div>
          <div className="flex justify-between text-[0.7rem] text-[#713f12] py-[1px]">
            <span>أجور الشحن:</span>
            <span>{shippingCost || 0} {currSym}</span>
          </div>
          <div className="flex justify-between text-[0.78rem] text-[#15803d] font-extrabold border-t border-dashed border-[#eab308] mt-[3px] pt-[3px]">
            <span>المبلغ الإجمالي:</span>
            <span>{grandTotal} {currSym}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-1">
          <div className="text-[0.6rem] text-[#64748b] max-w-[70%]">
            <strong className="text-[#15803d]">ضمان الجودة:</strong> عسل طبيعي ومضمون 100%. شكراً لثقتكم.
          </div>
          <div id="qrcode" className="bg-white p-0.5 rounded border border-[#cbd5e1] inline-flex">
            <QRCodeSVG value={`SALEEM-HONEY-INV-${invoiceNumber}-TOTAL:${grandTotal}`} size={40} fgColor="#15803d" />
          </div>
        </div>
      </div>

      {/* نافذة ملصق الشحن القياسي 10×10 سم */}
      {showShippingLabel && (
        <ShippingLabelModal
          initialData={{
            shippingCompany,
            customerName: clientName,
            customerPhone: clientPhone,
            customerAddress: clientAddress,
            packageWeight: `${items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0)} KG`,
            orderRef: invoiceNumber,
            trackingNo: `TRK-${invoiceNumber.replace(/[^A-Za-z0-9]/g, '')}`,
          }}
          clients={clients}
          onClose={() => setShowShippingLabel(false)}
        />
      )}
    </div>
  );
}

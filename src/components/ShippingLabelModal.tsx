import React, { useState, useRef } from 'react';
import { X, Printer, Download, Share2, RefreshCw, Package, Truck, Copy, Check, MessageCircle, Sparkles, Image as ImageIcon, Upload, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Barcode128 } from './Barcode128';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { SHIPPING_COMPANIES, type Client, type Invoice } from '../types';

export interface ShippingLabelData {
  trackingNo: string;
  shippingCompany?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  packageWeight: string; // e.g., '25 KG'
  packagePieces: string; // e.g., '1 Koli'
  senderName: string;
  orderRef?: string;
  brandName?: string;
}

interface ShippingLabelModalProps {
  initialData?: Partial<ShippingLabelData>;
  receiverName?: string;
  address?: string;
  city?: string;
  trackingNumber?: string;
  carrier?: string;
  weightDesi?: string;
  senderName?: string;
  client?: Client | null;
  invoice?: Invoice | null;
  clients?: Client[];
  onClose: () => void;
}

export function ShippingLabelModal({
  initialData,
  receiverName,
  address,
  city,
  trackingNumber,
  carrier,
  weightDesi,
  senderName: initialSenderName,
  client,
  invoice,
  clients = [],
  onClose,
}: ShippingLabelModalProps) {
  const generateRandomTracking = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = 'TRK-';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const defaultTracking = trackingNumber || initialData?.trackingNo || (invoice ? `TRK-${invoice.id.replace(/[^A-Za-z0-9]/g, '')}` : generateRandomTracking());

  const [trackingNo, setTrackingNo] = useState(defaultTracking);
  const [shippingCompany, setShippingCompany] = useState<string>(
    carrier || initialData?.shippingCompany || invoice?.shippingCompany || 'Yurtiçi Kargo'
  );
  const [brandName, setBrandName] = useState(initialData?.brandName || 'منحلة سليم / Seleem Honey');
  const [senderName, setSenderName] = useState(initialSenderName || initialData?.senderName || 'منحلة سليم للأعسال الطبيعية');
  const [customerName, setCustomerName] = useState(receiverName || initialData?.customerName || client?.name || invoice?.clientName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || client?.phone || invoice?.clientPhone || '');

  const computedInitialAddress = address 
    ? (city ? `${address} - ${city}` : address)
    : (initialData?.customerAddress || client?.address || invoice?.clientAddress || '');

  const [customerAddress, setCustomerAddress] = useState(computedInitialAddress);
  const [packageWeight, setPackageWeight] = useState(weightDesi ? `${weightDesi} KG` : (initialData?.packageWeight || '3.5 KG'));
  const [packagePieces, setPackagePieces] = useState(initialData?.packagePieces || '1 طرد (Koli)');
  const [labelDesign, setLabelDesign] = useState<'honey' | 'classic'>('honey');
  const [barcodeLayout, setBarcodeLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [logoImage, setLogoImage] = useState<string>('/assets/images/logo.png');
  const [showLogo, setShowLogo] = useState<boolean>(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedMessage, setIsCopiedMessage] = useState(false);

  // Gemini OCR Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const labelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleScanImage = async (file: File) => {
    setIsScanning(true);
    setScanStatus('جاري معالجة الصورة عبر Gemini AI...');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await fetch('/api/scan-shipping-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: file.type || 'image/jpeg',
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        const errorMsg = result?.error || 'فشل فحص البوليصة عبر الخادم';
        throw new Error(errorMsg);
      }

      if (result.data) {
        const d = result.data;
        if (d.tracking_number) setTrackingNo(d.tracking_number);
        if (d.carrier) {
          const matchCompany = SHIPPING_COMPANIES.find(c =>
            c.toLowerCase().includes(d.carrier.toLowerCase()) || d.carrier.toLowerCase().includes(c.toLowerCase())
          );
          if (matchCompany) setShippingCompany(matchCompany);
          else setShippingCompany(d.carrier);
        }
        if (d.receiver_name) setCustomerName(d.receiver_name);
        if (d.receiver_address) {
          const fullAddress = d.receiver_city 
            ? `${d.receiver_address} - ${d.receiver_city}` 
            : d.receiver_address;
          setCustomerAddress(fullAddress);
        }
        if (d.sender_name) setSenderName(d.sender_name);
        if (d.weight_desi) setPackageWeight(`${d.weight_desi} KG/Desi`);

        setScanStatus('تم استخراج بيانات البوليصة بنجاح!');
        setTimeout(() => setScanStatus(null), 4000);
      } else {
        throw new Error('لم يتم العثور على بيانات واضحة');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      const userMessage = err?.message && err.message !== 'فشل فحص البوليصة عبر الخادم'
        ? `تنبيه: ${err.message}`
        : 'تعذر استخراج البيانات بدقة، يرجى التأكد من وضوح الصورة وتجربة صورة أخرى';
      setScanStatus(userMessage);
      setTimeout(() => setScanStatus(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectClient = (selectedId: string) => {
    const found = clients.find(c => c.id === selectedId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
      setCustomerAddress(found.address || '');
    }
  };

  const handlePrint = () => {
    const element = labelRef.current;
    if (!element) return;

    const printWindow = window.open('', '_blank', 'width=500,height=550');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="tr" dir="ltr">
      <head>
        <meta charset="utf-8" />
        <title>Kargo Etiketi - ${trackingNo}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@500;700;800&family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet">
        ${styles}
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            background: #ffffff; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-family: 'Cairo', 'Inter', 'Tajawal', sans-serif;
            width: 100mm;
            height: 100mm;
          }
          @page {
            size: 100mm 100mm;
            margin: 0;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              width: 100mm; 
              height: 100mm; 
            }
            .shipping-label-root {
              width: 100mm !important;
              height: 100mm !important;
              border-width: 1.5px !important;
            }
          }
        </style>
      </head>
      <body>
        <div style="padding: 4mm; width: 100mm; height: 100mm;">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = labelRef.current;
    if (!element) return;

    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 100],
      });

      // 100x100 mm with 5mm margin
      pdf.addImage(imgData, 'PNG', 4, 4, 92, 92);
      pdf.save(`kargo_${trackingNo}.pdf`);
    } catch (err) {
      console.error('Error creating PDF:', err);
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى');
    } finally {
      setIsExporting(false);
    }
  };

  const getWhatsAppMessage = () => {
    return `مرحباً أخي الكريم، تم تجهيز طلبيتك بنجاح 📦\n` +
      `شركة الشحن: ${shippingCompany}\n` +
      `رقم التتبع: ${trackingNo}\n` +
      `مرفق لكم ملصق الشحنة الرسمي، شكراً لتعاملكم معنا!`;
  };

  const handleShareWhatsApp = () => {
    const phone = customerPhone.replace(/[^0-9]/g, '');
    const message = getWhatsAppMessage();

    const encoded = encodeURIComponent(message);
    if (phone) {
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    }
  };

  const handleCopyWhatsAppMessage = () => {
    const text = getWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setIsCopiedMessage(true);
    setTimeout(() => setIsCopiedMessage(false), 2000);
  };

  const handleCopyDetails = () => {
    const text = getWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 font-['Tajawal'] overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-[460px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-[0.95rem] font-extrabold leading-tight">ملصق شحن قياسي (10×10 سم)</h2>
              <p className="text-[0.68rem] text-emerald-200 font-medium">Kargo Etiketi - مقاس 100mm × 100mm لطابعات الباركود</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">

          {/* AI Shipping Label Scanner (ShippingLabelScanner) */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 rounded-xl p-3 border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded bg-emerald-600 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="text-[0.78rem] font-extrabold text-slate-800 leading-tight">
                    المسح الذكي لبوليصة الشحن (AI Scanner)
                  </h4>
                  <p className="text-[0.62rem] text-slate-500">
                    استخراج جهة الشحن، رقم التتبع، المستلم، والعنوان تلقائياً بالذكاء الاصطناعي
                  </p>
                </div>
              </div>

              {/* Status pill */}
              {isScanning && (
                <div className="flex items-center gap-1 text-[0.65rem] font-bold text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-300 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                  جاري الفحص...
                </div>
              )}
            </div>

            {/* Hidden Inputs for Camera and File Picker */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleScanImage(e.target.files[0]);
                }
              }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleScanImage(e.target.files[0]);
                }
              }}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 active:scale-98 disabled:opacity-50 text-white rounded-lg text-[0.72rem] font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                تصوير البوليصة (الكاميرا)
              </button>

              <button
                type="button"
                disabled={isScanning}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-50 active:scale-98 disabled:opacity-50 text-slate-700 border border-slate-300 rounded-lg text-[0.72rem] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                اختيار من المعرض
              </button>
            </div>

            {/* Scan Feedback Message */}
            {scanStatus && (
              <div className="mt-2 text-[0.68rem] font-bold flex items-center gap-1.5 text-emerald-800 bg-white/90 p-1.5 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{scanStatus}</span>
              </div>
            )}
          </div>

          {/* Quick client select if available */}
          {clients.length > 0 && (
            <div>
              <label className="block text-[0.72rem] font-bold text-slate-600 mb-1">اختيار عميل مسجل لتعبئة البيانات:</label>
              <select
                onChange={(e) => handleSelectClient(e.target.value)}
                defaultValue=""
                className="w-full h-8 text-[0.78rem] bg-slate-50 border border-slate-300 rounded-lg px-2 outline-none focus:border-green-600"
              >
                <option value="" disabled>-- اختر من قائمة العملاء --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Edit Form */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            {/* Shipping Company Selection */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[0.68rem] font-bold text-slate-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>شركة الشحن (Kargo Firması):</span>
                </label>
                <span className="text-[0.65rem] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {shippingCompany}
                </span>
              </div>
              <select
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                className="w-full h-8 text-[0.78rem] font-bold bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600 mb-1.5"
              >
                {SHIPPING_COMPANIES.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-1">
                {SHIPPING_COMPANIES.map(comp => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setShippingCompany(comp)}
                    className={`px-2 py-0.5 rounded text-[0.65rem] font-bold border transition-colors cursor-pointer ${
                      shippingCompany === comp
                        ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[0.68rem] font-bold text-slate-700">رقم التتبع (Takip No):</label>
                  <button 
                    type="button" 
                    onClick={() => setTrackingNo(generateRandomTracking())}
                    className="text-[0.62rem] text-green-700 hover:text-green-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> توليد
                  </button>
                </div>
                <input
                  type="text"
                  value={trackingNo}
                  onChange={(e) => setTrackingNo(e.target.value.toUpperCase())}
                  className="w-full h-8 text-[0.78rem] font-mono font-bold bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[0.68rem] font-bold text-amber-800 mb-0.5 flex items-center justify-between">
                  <span className="flex items-center gap-1"><span>🍯</span> اسم الماركة / المنحلة:</span>
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="منحلة سليم / Seleem Honey"
                  className="w-full h-8 text-[0.78rem] font-bold bg-white border border-amber-300 rounded-lg px-2 text-slate-800 outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">اسم المرسل (GÖNDERİCİ):</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full h-8 text-[0.78rem] bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                />
              </div>
            </div>

            {/* إعدادات الشعار واللوجو (logoImage: assets/images/logo.png / 26x26) */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-white border border-amber-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {logoImage ? (
                    <img src={logoImage} alt="شعار المتجر" className="w-[26px] h-[26px] object-contain" />
                  ) : (
                    <span className="text-sm">🐝</span>
                  )}
                </div>
                <div>
                  <div className="text-[0.72rem] font-bold text-amber-900 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-amber-600" />
                    شعار الماركة (Logo 26×26px)
                  </div>
                  <div className="text-[0.62rem] text-amber-700/80">
                    assets/images/logo.png داخل ترويسة الملصق
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded text-[0.68rem] font-bold transition-colors">
                  <Upload className="w-2.8 h-2.8 text-amber-700" />
                  تغيير
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setLogoImage(event.target.result as string);
                            setShowLogo(true);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowLogo(!showLogo)}
                  className={`px-2 py-1 rounded text-[0.68rem] font-bold border transition-colors ${
                    showLogo
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-slate-600 border-slate-300'
                  }`}
                  title={showLogo ? 'إخفاء الشعار واستخدام رمز النحل' : 'إظهار شعار الصورة'}
                >
                  {showLogo ? 'مُفعّل' : 'رمز فقط'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">اسم المستلم (ALICI):</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="اسم العميل"
                  className="w-full h-8 text-[0.78rem] font-bold bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">الهاتف (Telefon):</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05xxxxxxxxx"
                  className="w-full h-8 text-[0.78rem] bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">عنوان التوصيل الكامل (Adres):</label>
              <textarea
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="المدينة، الحي، الشارع، رقم البناء..."
                className="w-full text-[0.78rem] bg-white border border-slate-300 rounded-lg p-2 text-slate-800 outline-none focus:border-green-600 resize-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">وزن الطرد (Ağırlık):</label>
                <input
                  type="text"
                  value={packageWeight}
                  onChange={(e) => setPackageWeight(e.target.value)}
                  placeholder="مثال: 3.5 KG"
                  className="w-full h-8 text-[0.78rem] bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">عدد الطرود (Koli):</label>
                <input
                  type="text"
                  value={packagePieces}
                  onChange={(e) => setPackagePieces(e.target.value)}
                  placeholder="1 Koli"
                  className="w-full h-8 text-[0.78rem] bg-white border border-slate-300 rounded-lg px-2 text-slate-800 outline-none focus:border-green-600"
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">نمط التصميم:</label>
                <select
                  value={labelDesign}
                  onChange={(e) => setLabelDesign(e.target.value as 'honey' | 'classic')}
                  className="w-full h-8 text-[0.72rem] font-bold bg-white border border-amber-300 rounded-lg px-1 text-amber-900 outline-none focus:border-amber-600"
                >
                  <option value="honey">🍯 ملصق العسل الفخم (Honey Branded)</option>
                  <option value="classic">📦 كارجو كلاسيكي (Standard)</option>
                </select>
              </div>
            </div>

            {labelDesign === 'classic' && (
              <div className="pt-1">
                <label className="block text-[0.68rem] font-bold text-slate-700 mb-0.5">تخطيط الباركود الكلاسيكي:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBarcodeLayout('vertical')}
                    className={`flex-1 py-1 text-[0.7rem] font-bold rounded-lg border transition-colors cursor-pointer ${
                      barcodeLayout === 'vertical' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    جانبي (عمودي)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeLayout('horizontal')}
                    className={`flex-1 py-1 text-[0.7rem] font-bold rounded-lg border transition-colors cursor-pointer ${
                      barcodeLayout === 'horizontal' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-300 text-slate-700'
                    }`}
                  >
                    أفقي بالأسفل
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Header */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[0.78rem] font-extrabold text-slate-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-700" />
                معاينة الملصق (10×10 سم - 100×100 mm):
              </span>
              <span className="text-[0.65rem] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-200">
                {labelDesign === 'honey' ? '🍯 نموذج العسل الملكي' : '📦 نموذج الشحن العام'}
              </span>
            </div>
            <button
              onClick={handleCopyDetails}
              className="text-[0.68rem] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
            >
              {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              {isCopied ? 'تم النسخ!' : 'نسخ النص'}
            </button>
          </div>

          {/* The 10x10 cm Label Layout (Exact Flutter match + high precision CSS) */}
          <div className="flex justify-center bg-slate-200/70 p-3 rounded-xl overflow-x-auto">
            <div
              ref={labelRef}
              id="shippingLabelArea"
              className="shipping-label-root bg-white text-black font-sans shadow-md"
              style={{
                width: '340px',
                height: '340px',
                border: labelDesign === 'honey' ? '2px solid #222222' : '2px solid #000000',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                direction: 'ltr', // standard cargo format
                position: 'relative',
                backgroundColor: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {labelDesign === 'honey' ? (
                /* Honey Branded Label (Exact Flutter generateHoneyBrandedLabel representation) */
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
                  
                  {/* 1. الترويسة الذهبية الفخمة مع شعار النحل (honeyGold = #D49B00) */}
                  <div style={{
                    backgroundColor: '#D49B00',
                    padding: '5px 8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid #222222',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {showLogo && logoImage ? (
                        <div style={{
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          backgroundColor: '#ffffff',
                          padding: '1.5px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {/* pw.Image(logoImage, width: 26, height: 26) */}
                          <img
                            src={logoImage}
                            alt="Logo"
                            style={{
                              width: '26px',
                              height: '26px',
                              objectFit: 'contain',
                              display: 'block',
                            }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: '15px', lineHeight: 1 }}>🐝</span>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '11px',
                          letterSpacing: '0.2px',
                          lineHeight: 1.15,
                          fontFamily: 'Tajawal, sans-serif'
                        }}>
                          {brandName}
                        </span>
                        <span style={{
                          color: '#fffbeb',
                          fontSize: '7.5px',
                          fontWeight: 600,
                          letterSpacing: '0.2px',
                          fontFamily: 'Tajawal, sans-serif'
                        }}>
                          عسل طبيعي بلدي • Doğal Bal
                        </span>
                      </div>
                    </div>

                    {/* جهة الشحن المختارة (Badge) */}
                    <div style={{
                      backgroundColor: '#ffffff',
                      color: '#222222',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '9px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      whiteSpace: 'nowrap',
                    }}>
                      {shippingCompany}
                    </div>
                  </div>

                  {/* 2. باركود التتبع */}
                  <div style={{
                    padding: '4px 6px 3px 6px',
                    borderBottom: '1.5px solid #222222',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                  }}>
                    <Barcode128 
                      value={trackingNo} 
                      width={1.4} 
                      height={32} 
                      fontSize={8} 
                    />
                    <div style={{
                      fontWeight: 800,
                      fontSize: '8.5px',
                      color: '#222222',
                      marginTop: '2px',
                      letterSpacing: '0.4px',
                      fontFamily: 'monospace'
                    }}>
                      TAKİP / كود الشحنة: {trackingNo}
                    </div>
                  </div>

                  {/* 3. بيانات المستلم وعنوان التوصيل (في صندوق عسلي فاتح ومميز #FFF9E6) */}
                  <div style={{
                    backgroundColor: '#FFF9E6',
                    padding: '5px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: 'Tajawal, sans-serif',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1px' }}>
                        <span style={{
                          backgroundColor: '#222222',
                          color: '#ffffff',
                          fontSize: '7.5px',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          letterSpacing: '0.3px',
                        }}>
                          المستلم / ALICI
                        </span>
                        <span style={{ fontSize: '7.5px', color: '#6b7280', fontWeight: 600 }}>
                          (تسليم يدوي مباشر)
                        </span>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        color: '#111827',
                        lineHeight: 1.15,
                        textTransform: 'uppercase',
                      }}>
                        {customerName || 'اسم العميل'}
                      </div>

                      <div style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#1f2937',
                        direction: 'ltr',
                        textAlign: 'left',
                        fontFamily: 'monospace'
                      }}>
                        {customerPhone || '05xx xxx xx xx'}
                      </div>

                      <div style={{
                        fontSize: '8.5px',
                        color: '#374151',
                        lineHeight: 1.25,
                        marginTop: '1px',
                        wordBreak: 'break-word',
                        maxHeight: '36px',
                        overflow: 'hidden',
                      }}>
                        {customerAddress || 'عنوان العميل غير مسجل بعد...'}
                      </div>
                    </div>
                  </div>

                  {/* الجزء الأوسط: بطاقة المحتويات مع العلامة المائية وختم الجودة والتنبيه */}
                  <div className="label-middle-body" style={{
                    position: 'relative',
                    minHeight: '82px',
                    margin: '3px 6px',
                    border: '1px dashed #d4af37',
                    borderRadius: '7px',
                    padding: '6px 8px',
                    backgroundColor: '#fffdf7',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                  }}>
                    {/* الشعار المائي بالخلفية (Watermark) */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: 0.08,
                      pointerEvents: 'none',
                      zIndex: 1,
                    }}>
                      <img
                        src="https://api.iconify.design/noto:honey-pot.svg"
                        style={{ width: '80px', height: '80px', filter: 'grayscale(100%)' }}
                        alt="Logo Watermark"
                      />
                    </div>

                    {/* تفاصيل المحتويات وختم الجودة */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#85581A', display: 'block', lineHeight: 1.1 }}>محتوى الشحنة / İçerik:</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#222', lineHeight: 1.2 }}>عسل سليم طبيعي (Seleem Honey) 🍯</span>
                      </div>
                      
                      {/* ختم الضمان والجودة */}
                      <div style={{
                        border: '1.5px solid #d4af37',
                        borderRadius: '50%',
                        width: '38px',
                        height: '38px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        boxShadow: '0 1px 2px rgba(212,175,55,0.2)',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#b38728', lineHeight: 1 }}>100%</span>
                        <span style={{ fontSize: '6.5px', color: '#666', fontWeight: 'bold' }}>DOĞAL</span>
                      </div>
                    </div>

                    {/* شريط تنبيه الكسر والتعامل برفق */}
                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      marginTop: '3px',
                      padding: '2px 5px',
                      background: '#fff3cd',
                      borderLeft: '3px solid #ffc107',
                      fontSize: '8.5px',
                      color: '#856404',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      borderRadius: '2px',
                    }}>
                      <span>⚠️</span>
                      <span><strong>DİKKAT:</strong> Cam Kavanoz / زجاج قابل للكسر - يرجى عدم الرمي</span>
                    </div>
                  </div>

                  {/* 4. أسفل الملصق: الأوزان والقطع + اسم المرسل */}
                  <div style={{
                    padding: '3px 8px',
                    borderTop: '1.5px solid #222222',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    fontSize: '8.5px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#222222' }}>GÖN:</span>
                      <span style={{ color: '#4b5563', fontWeight: 600, fontSize: '8px' }}>{senderName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, color: '#374151', fontSize: '8px' }}>{packagePieces}</span>
                      <span style={{
                        fontWeight: 900,
                        backgroundColor: '#FFF9E6',
                        border: '1px solid #D49B00',
                        color: '#92400e',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '8px',
                      }}>
                        AĞIRLIK: {packageWeight}
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                /* Classic Cargo Mode */
                barcodeLayout === 'vertical' ? (
                  /* Vertical Barcode Mode */
                  <div style={{ display: 'flex', width: '100%', height: '100%' }}>
                    
                    {/* Left Column (flex: 3): Main details */}
                    <div style={{ flex: 3.2, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                      
                      {/* Header */}
                      <div style={{ 
                        backgroundColor: '#e5e7eb', 
                        padding: '4px 6px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '1px solid #000'
                      }}>
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '9px', 
                          color: '#000', 
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap' 
                        }}>
                          Kargo Firması: {shippingCompany}
                        </span>
                        <span style={{ 
                          fontSize: '8px', 
                          fontWeight: 600, 
                          fontFamily: 'monospace', 
                          letterSpacing: '0.3px',
                          color: '#000',
                          whiteSpace: 'nowrap'
                        }}>
                          Takip No: {trackingNo}
                        </span>
                      </div>

                      {/* Sender Info (GÖN) */}
                      <div style={{ 
                        padding: '3px 6px', 
                        borderBottom: '1px solid #000',
                        fontSize: '8.5px',
                        color: '#111',
                        fontFamily: 'Tajawal, sans-serif',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span><strong>GÖN:</strong> {senderName}</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>{shippingCompany}</span>
                      </div>

                      {/* Receiver Info (ALICI) */}
                      <div style={{ 
                        padding: '6px', 
                        flex: 1, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px',
                        overflow: 'hidden',
                        fontFamily: 'Tajawal, sans-serif'
                      }}>
                        <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5px', color: '#333' }}>
                          ALICI:
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#000', lineHeight: 1.2 }}>
                          {customerName || 'اسم العميل'}
                        </div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#111', direction: 'ltr', textAlign: 'left' }}>
                          {customerPhone || '05xx xxx xx xx'}
                        </div>
                        <div style={{ 
                          fontSize: '9px', 
                          color: '#222', 
                          lineHeight: 1.25, 
                          marginTop: '3px',
                          wordBreak: 'break-word',
                          maxHeight: '65px',
                          overflow: 'hidden'
                        }}>
                          {customerAddress || 'عنوان العميل غير مسجل بعد...'}
                        </div>
                      </div>

                      {/* Parcel Details Footer */}
                      <div style={{ 
                        padding: '4px 6px', 
                        borderTop: '1px solid #000', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        fontSize: '9.5px',
                        backgroundColor: '#f9fafb'
                      }}>
                        <span style={{ fontWeight: 600 }}>{packagePieces}</span>
                        <span style={{ fontWeight: 800, letterSpacing: '0.3px' }}>
                          AĞIRLIK: {packageWeight}
                        </span>
                      </div>

                    </div>

                    {/* Vertical Divider Line */}
                    <div style={{ width: '1.5px', backgroundColor: '#000000', height: '100%' }} />

                    {/* Right Column (flex: 1): Code 128 Lateral Barcode */}
                    <div style={{ 
                      flex: 1.1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '100%',
                      padding: '2px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Barcode128 
                        value={trackingNo} 
                        width={1.2} 
                        height={50} 
                        fontSize={8} 
                        rotated={true} 
                      />
                    </div>

                  </div>
                ) : (
                  /* Horizontal Barcode Mode */
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                    
                    {/* Header */}
                    <div style={{ 
                      backgroundColor: '#e5e7eb', 
                      padding: '4px 8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderBottom: '1px solid #000'
                    }}>
                      <span style={{ 
                        fontWeight: 700, 
                        fontSize: '9px', 
                        color: '#000', 
                        fontFamily: 'Inter, sans-serif' 
                      }}>
                        Kargo Firması: {shippingCompany}
                      </span>
                      <span style={{ 
                        fontSize: '8px', 
                        fontWeight: 600, 
                        fontFamily: 'monospace',
                        color: '#000'
                      }}>
                        Takip No: {trackingNo}
                      </span>
                    </div>

                    {/* Sender Info */}
                    <div style={{ padding: '3px 8px', borderBottom: '1px solid #000', fontSize: '8.5px', fontFamily: 'Tajawal, sans-serif', display: 'flex', justifyItems: 'space-between', alignItems: 'center' }}>
                      <span><strong>GÖN:</strong> {senderName}</span>
                      <span style={{ fontWeight: 700, color: '#374151' }}>{shippingCompany}</span>
                    </div>

                    {/* Receiver Info */}
                    <div style={{ padding: '6px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'Tajawal, sans-serif' }}>
                      <div style={{ fontSize: '8px', fontWeight: 800 }}>ALICI:</div>
                      <div style={{ fontSize: '13px', fontWeight: 800 }}>{customerName || 'اسم العميل'}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600 }}>{customerPhone || '05xx xxx xx xx'}</div>
                      <div style={{ fontSize: '9px', color: '#333', lineHeight: 1.25 }}>{customerAddress || 'عنوان العميل'}</div>
                    </div>

                    {/* Weight bar */}
                    <div style={{ 
                      padding: '3px 8px', 
                      borderTop: '1px solid #000', 
                      borderBottom: '1px solid #000', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '9px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <span>{packagePieces}</span>
                      <strong style={{ fontWeight: 800 }}>AĞIRLIK: {packageWeight}</strong>
                    </div>

                    {/* Bottom Barcode */}
                    <div style={{ padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Barcode128 value={trackingNo} width={1.4} height={42} fontSize={8} />
                    </div>

                  </div>
                )
              )}
            </div>
          </div>

          {/* رسالة إشعار الواتساب للعميل */}
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 text-[0.78rem]">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[0.75rem]">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>رسالة إشعار العميل (واتساب):</span>
              </div>
              <button
                type="button"
                onClick={handleCopyWhatsAppMessage}
                className="text-[0.68rem] font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-200 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                {isCopiedMessage ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopiedMessage ? 'تم النسخ!' : 'نسخ نص الرسالة'}
              </button>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-slate-800 text-[0.76rem] leading-relaxed font-medium whitespace-pre-line shadow-2xs select-all">
              {getWhatsAppMessage()}
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-[0.82rem] shadow-sm"
          >
            <Printer className="w-4 h-4" />
            طباعة حرارية (10×10 سم)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="flex-1 bg-sky-700 hover:bg-sky-800 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-[0.82rem] disabled:opacity-50 shadow-sm"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'جاري التحميل...' : 'تحميل PDF (10×10)'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="bg-[#25d366] hover:bg-[#1eb954] text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[0.82rem] shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            واتساب
          </button>
        </div>

      </div>
    </div>
  );
}

export const ShippingLabelScreen = ShippingLabelModal;

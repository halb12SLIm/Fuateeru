import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2, X, Check, Copy, Sparkles, ArrowRight, Trash2, Printer, FileText } from 'lucide-react';
import { LogoData } from '../types';
import { PdfInvoiceService } from '../services/PdfInvoiceService';

interface EditFormScreenProps {
  onClose: () => void;
  initialData?: LogoData | null;
  onSave?: (data: { brandName: string; productName: string; weightOrVolume: string; details: string; price?: number; currency?: string }) => void;
}

export const EditFormScreen: React.FC<EditFormScreenProps> = ({ onClose, initialData, onSave }) => {
  // وحدات التحكم بالحقول (Controllers)
  const [brandName, setBrandName] = useState<string>(initialData?.brandName || '');
  const [productName, setProductName] = useState<string>(initialData?.productName || '');
  const [weightOrVolume, setWeightOrVolume] = useState<string>(initialData?.weightOrVolume || '');
  const [details, setDetails] = useState<string>(initialData?.details || '');
  const [price, setPrice] = useState<string>(initialData?.price !== undefined ? String(initialData.price) : '');
  const [currency, setCurrency] = useState<string>(initialData?.currency || 'SAR');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputCameraRef = useRef<HTMLInputElement>(null);
  const fileInputGalleryRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // دالة مسح الشعار وملء الحقول تلقائياً (_scanAndAutoFill)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result as string;

      // ضغط الصورة بجودة 85% لتسريع الرفع والمعالجة (imageQuality: 85)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
          }
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressedDataUrl);

          const cleanBase64 = compressedDataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

          // استدعاء التحليل واستلام البيانات المنظمة عبر الخادم
          const response = await fetch('/api/analyze-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: cleanBase64,
              mimeType: 'image/jpeg',
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'فشل في استخراج البيانات من الشعار');
          }

          const parsedData = data.data as {
            brand_name?: string;
            product_name?: string;
            details?: string;
            weight_or_volume?: string;
            price?: number;
            currency?: string;
          };

          // تعبئة الحقول تلقائياً (Auto-fill)
          setBrandName(parsedData.brand_name || '');
          setProductName(parsedData.product_name || '');
          setDetails(parsedData.details || data.text || '');
          setWeightOrVolume(parsedData.weight_or_volume || '');
          if (parsedData.price !== undefined && parsedData.price !== null) {
            setPrice(String(parsedData.price));
          }
          if (parsedData.currency) {
            setCurrency(parsedData.currency);
          }

          showToast('تم استخراج البيانات وملء الحقول بنجاح!');
          setIsLoading(false);
        };

        img.onerror = () => {
          throw new Error('تعذر تحميل الصورة لمعالجتها');
        };

        img.src = rawDataUrl;
      } catch (err: any) {
        setErrorMessage(err.message || 'حدث خطأ أثناء فحص الشعار');
        showToast('خطأ: ' + (err.message || 'تعذر معالجة الصورة'));
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('تعذر قراءة ملف الصورة');
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCopyAll = () => {
    const formatted = `العلامة التجارية: ${brandName || '-'}\nالمنتج: ${productName || '-'}\nالوزن/الحجم: ${weightOrVolume || '-'}\nالتفاصيل: ${details || '-'}`;
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('تم نسخ البيانات إلى الحافظة');
  };

  const handleClear = () => {
    setBrandName('');
    setProductName('');
    setWeightOrVolume('');
    setDetails('');
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* AppBar (شريط التطبيق العلوي) */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
            <div>
              <h3 className="font-extrabold text-base leading-tight">إدخال البيانات</h3>
              <p className="text-[11px] text-blue-100">تعبئة نموذج المنتج والملصق تلقائياً بالذكاء الاصطناعي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* جسم الشاشة (Body) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* شريط التحميل (CircularProgressIndicator) */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center animate-spin">
                <Loader2 className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-slate-800">جاري قراءة الشعار وتحليل البيانات بالذكاء الاصطناعي...</p>
              <span className="text-xs text-slate-500">Gemini 3.8 Flash • Structured Outputs</span>
            </div>
          ) : (
            <>
              {/* زر مسح الشعار وملء الحقول تلقائياً (ElevatedButton.icon) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputCameraRef.current?.click()}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
                >
                  <Camera className="w-5 h-5 text-amber-300" />
                  <span>مسح الشعار وملء الحقول تلقائياً</span>
                </button>

                {/* خيار إضافي للمعرض وعينة تجريبية */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fileInputGalleryRef.current?.click()}
                    className="text-slate-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>اختيار من المعرض</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBrandName('شركة سليم');
                      setProductName('عسل سدر جبلي ملكي');
                      setWeightOrVolume('1 كغ');
                      setDetails('عسل سدر طبيعي 100% مستخلص من زهور السدر البرية - غير مبستر ومفحوص مخبرياً');
                      setPrice('250');
                      setCurrency('TL');
                      showToast('تم ملء النموذج ببيانات العينة بنجاح!');
                    }}
                    className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                    title="تعبئة بيانات تجريبية فورية"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>تعبئة عينة تجريبية</span>
                  </button>
                  {imagePreview && (
                    <>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>مسح الكل</span>
                      </button>
                    </>
                  )}
                </div>

                {/* مخزن مدخلات الصور */}
                <input
                  ref={fileInputCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={fileInputGalleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* معاينة الصورة المصغرة إن وجدت */}
              {imagePreview && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <img
                    src={imagePreview}
                    alt="Logo preview"
                    className="w-14 h-14 object-cover rounded-xl border border-slate-300 shrink-0"
                  />
                  <div className="text-xs text-slate-600 flex-1 min-w-0">
                    <span className="font-bold text-slate-800 block">الصورة الملتقطة</span>
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> تم تطبيق التحليل الذكي
                    </span>
                  </div>
                </div>
              )}

              {/* رسالة خطأ إن وجدت */}
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs font-semibold">
                  {errorMessage}
                </div>
              )}

              {/* الحقول (TextFields) */}
              <div className="space-y-3.5 pt-1">
                {/* TextField 1: اسم العلامة التجارية / الشعار */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم العلامة التجارية / الشعار
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="مثال: مناحل سليم، عسل البركة..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* TextField 2: اسم المنتج */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    اسم المنتج
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="مثال: عسل سدر ملكي فاخر، عسل حبة البركة..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* TextField 3: الوزن / الحجم */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    الوزن / الحجم
                  </label>
                  <input
                    type="text"
                    value={weightOrVolume}
                    onChange={(e) => setWeightOrVolume(e.target.value)}
                    placeholder="مثال: 1 كغ، 500 غ، 850 مل..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* حقول السعر والعملة (لتوليد فاتورة فورية PdfInvoiceService) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      السعر (اختياري)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      العملة
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="SAR">ريال سعودي (SAR)</option>
                      <option value="USD">دولار أمريكي (USD)</option>
                      <option value="TRY">ليرة تركية (TRY)</option>
                      <option value="EUR">يورو (EUR)</option>
                    </select>
                  </div>
                </div>

                {/* TextField 4: التفاصيل والمواصفات (maxLines: 3) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    التفاصيل والمواصفات
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="بيانات الإنتاج، تاريخ الصلاحية، المكونات، أو أية نصوص مكتوبة على الملصق..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* شريط الإشعار (SnackBar Toast) */}
        {toastMessage && (
          <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-bottom duration-200">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              {toastMessage}
            </span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/60 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* تذييل الشاشة (Footer Actions) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex w-full sm:w-auto items-center gap-2 flex-1">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={!brandName && !productName && !details}
              className="flex-1 py-2.5 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            {/* زر توليد وطباعة فاتورة PDF فورية عبر PdfInvoiceService */}
            <button
              type="button"
              onClick={() => {
                const invoiceNum = Math.floor(100000 + Math.random() * 900000).toString();
                PdfInvoiceService.printInvoice({
                  productData: {
                    brandName: brandName || 'غير محدد',
                    productName: productName || 'منتج عام',
                    details: details || '-',
                    weightOrVolume: weightOrVolume || undefined,
                    price: price ? parseFloat(price) : undefined,
                    currency: currency || 'SAR',
                  },
                  invoiceNumber: invoiceNum,
                  date: new Date(),
                });
                showToast('جاري فتح وطباعة فاتورة PDF...');
              }}
              disabled={!brandName && !productName}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="توليد ومعاينة فاتورة PDF بخط Cairo"
            >
              <FileText className="w-4 h-4" />
              <span>فاتورة PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onSave) {
                onSave({
                  brandName,
                  productName,
                  weightOrVolume,
                  details,
                  price: price ? parseFloat(price) : undefined,
                  currency,
                });
              }
              showToast('تم حفظ البيانات بنجاح!');
              setTimeout(() => onClose(), 800);
            }}
            disabled={!brandName && !productName && !details}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد واستخدام</span>
          </button>
        </div>

      </div>
    </div>
  );
};

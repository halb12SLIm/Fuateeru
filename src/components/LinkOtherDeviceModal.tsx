import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  RefreshCw, 
  ShieldCheck, 
  Share2, 
  ExternalLink,
  QrCode,
  Camera,
  Upload,
  Info
} from 'lucide-react';

interface LinkOtherDeviceProps {
  storeWorkspaceId: string;
  syncSecret?: string;
  onClose: () => void;
  onScanSyncData?: (syncData: { store_id: string; sync_key: string }) => void;
}

export const LinkOtherDeviceModal: React.FC<LinkOtherDeviceProps> = ({
  storeWorkspaceId,
  syncSecret: initialSyncSecret,
  onClose,
  onScanSyncData,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'show_qr' | 'scan_qr'>('show_qr');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Generate or retrieve persistent sync secret
  const [syncSecret] = useState<string>(() => {
    if (initialSyncSecret) return initialSyncSecret;
    const stored = localStorage.getItem(`sync_secret_${storeWorkspaceId}`);
    if (stored) return stored;
    const generated = 'SK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    localStorage.setItem(`sync_secret_${storeWorkspaceId}`, generated);
    return generated;
  });

  // Payload exact match to Flutter LinkOtherDeviceScreen
  const syncPayload = JSON.stringify({
    type: "workspace_full_sync",
    store_id: storeWorkspaceId,
    sync_key: syncSecret,
  });

  // Construct direct link for easy browser opening on another phone
  const shareableUrl = `${window.location.origin}${window.location.pathname}?sync_id=${encodeURIComponent(storeWorkspaceId)}&sync_key=${encodeURIComponent(syncSecret)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(storeWorkspaceId);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(syncPayload);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Image upload scan fallback using server Gemini or BarcodeDetector
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    try {
      // 1. Try native BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const imgBitmap = await createImageBitmap(file);
          const detected = await barcodeDetector.detect(imgBitmap);
          if (detected.length > 0 && detected[0].rawValue) {
            handleParsedBarcode(detected[0].rawValue);
            setIsScanning(false);
            return;
          }
        } catch {
          // Fall back to server AI OCR
        }
      }

      // 2. Fall back to AI server OCR
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

          const res = await fetch('/api/scan-qr-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: cleanBase64 })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.raw) {
              handleParsedBarcode(data.raw);
            } else if (data.store_id) {
              if (onScanSyncData) {
                onScanSyncData({ store_id: data.store_id, sync_key: data.sync_key || '' });
                onClose();
              }
            } else {
              setScanError('لم يتم العثور على باركود صالح في الصورة.');
            }
          } else {
            setScanError('تعذر فحص الصورة، يرجى المحاولة بصورة أوضح أو إدخال الكود يدوياً.');
          }
        } catch (err: any) {
          setScanError('حدث خطأ أثناء فحص الصورة.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setScanError('تعذر معالجة الملف.');
      setIsScanning(false);
    }
  };

  const handleParsedBarcode = (rawValue: string) => {
    try {
      const parsed = JSON.parse(rawValue);
      if (parsed.store_id || parsed.storeWorkspaceId) {
        const storeId = parsed.store_id || parsed.storeWorkspaceId;
        const syncKey = parsed.sync_key || parsed.syncSecret || '';
        if (onScanSyncData) {
          onScanSyncData({ store_id: storeId, sync_key: syncKey });
          onClose();
        }
        return;
      }
    } catch {
      // Raw string might just be the store ID like SLM-XXXXX
      if (rawValue.startsWith('SLM-') || rawValue.length >= 4) {
        if (onScanSyncData) {
          onScanSyncData({ store_id: rawValue.trim(), sync_key: '' });
          onClose();
        }
        return;
      }
    }
    setScanError('الباركود المقروء لا يحتوي على بيانات مزامنة متجر صحيحة.');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 font-['Tajawal'] backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-[420px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* App Bar / Header */}
        <div className="bg-gradient-to-r from-[#15803d] to-[#166534] text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">ربط ومزامنة هاتف آخر</h2>
              <p className="text-[11px] text-green-100 font-medium">مزامنة سحابية لحظية في الوقت الفعلي</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 mx-4 mt-3 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('show_qr')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'show_qr' 
                ? 'bg-white text-[#15803d] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>عرض باركود الربط</span>
          </button>
          <button
            onClick={() => setActiveTab('scan_qr')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'scan_qr' 
                ? 'bg-white text-[#15803d] shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>مسح باركود جهاز آخر</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'show_qr' ? (
            <>
              {/* QR Code Presentation */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">
                  امسح هذا الباركود من الهاتف الثاني
                </h3>
                <p className="text-xs text-slate-500 max-w-[290px] leading-relaxed mb-4">
                  افتح التطبيق على الهاتف الآخر واقرأ هذا الباركود لربط المتجر بالكامل والعمل معاً فورياً.
                </p>

                {/* QR Code Canvas */}
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/20 shadow-md relative group hover:border-emerald-500 transition-colors">
                  <QRCodeSVG
                    value={syncPayload}
                    size={195}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#15803d"
                  />
                  {/* Subtle logo badge in center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 bg-white rounded-full p-1 shadow-md border border-amber-300 flex items-center justify-center">
                      <span className="text-sm">🍯</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-bold mt-2 tracking-wider">
                  WORKSPACE SYNC QR CODE
                </span>
              </div>

              {/* Store & Sync Credentials Card */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">معرف المتجر (Store ID):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#15803d] tracking-wider font-mono text-sm" dir="ltr">
                      {storeWorkspaceId}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                      title="نسخ الكود"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">مفتاح المزامنة (Sync Key):</span>
                  <span className="font-mono text-slate-700 text-[11px]" dir="ltr">
                    {syncSecret}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الرابط'}</span>
                </button>

                <button
                  onClick={handleCopyJson}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'تم نسخ البيانات!' : 'نسخ كود JSON'}</span>
                </button>
              </div>

              {/* Instructions Box */}
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">كيف يعمل الربط؟</p>
                  <p className="text-amber-800 leading-relaxed">
                    عند قراءة الباركود من الهاتف الآخر، سيتم تسجيل الدخول لنفس قاعدة بيانات سليم المشتركة تلقائياً. أي فاتورة أو عميل أو دفعة يتم إضافتها ستظهر على الجهازين فوراً وبشكل متزامن.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Scan QR from another device */
            <div className="py-2 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800 mb-1">
                  مسح باركود الربط
                </h3>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  وجّه الكاميرا إلى باركود الهاتف الآخر أو اختر صورة من المعرض للاتصال به.
                </p>
              </div>

              {scanError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                  {scanError}
                </div>
              )}

              {/* Upload image / Camera capture */}
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-emerald-400 rounded-2xl cursor-pointer bg-emerald-50/40 hover:bg-emerald-50 transition-colors p-4">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-emerald-600 mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-emerald-900 mb-1">
                      {isScanning ? 'جاري قراءة الباركود...' : 'اضغط لاختيار صورة أو التقاط الباركود'}
                    </p>
                    <p className="text-[10px] text-slate-500">يدعم كاميرا الهاتف وملفات الصور</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    disabled={isScanning}
                    onChange={handleFileUpload} 
                  />
                </label>

                <p className="text-[11px] text-slate-400">
                  أو يمكنك إدخال كود المتجر يدوياً من شاشة تسجيل الدخول في أي وقت.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">اتصال مشفر وآمن عبر Firebase</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

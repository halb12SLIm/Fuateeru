import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

interface ScanToSyncDeviceScreenProps {
  onClose: () => void;
  onSuccessSync: (storeId: string, stats?: { invoicesCount: number; clientsCount: number }) => void;
}

export const ScanToSyncDeviceScreen: React.FC<ScanToSyncDeviceScreenProps> = ({
  onClose,
  onSuccessSync,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncSuccessInfo, setSyncSuccessInfo] = useState<{
    storeId: string;
    invoicesCount: number;
    clientsCount: number;
  } | null>(null);

  // Camera video stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        startContinuousScanning();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('لم نتمكن من تشغيل الكاميرا مباشرة. يمكنك استخدام رفع صورة أو إدخال الكود.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.()?.torch) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.error('Torch error', e);
      }
    }
  };

  // Continuous barcode detection via BarcodeDetector if supported
  const startContinuousScanning = () => {
    if (!('BarcodeDetector' in window)) return;
    
    try {
      const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      
      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || isProcessing) return;
        
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            const rawVal = barcodes[0].rawValue;
            clearInterval(scanIntervalRef.current);
            processSyncBarcode(rawVal);
          }
        } catch {
          // Ignore individual frame detection failures
        }
      }, 500);
    } catch (e) {
      console.warn('BarcodeDetector not initialized', e);
    }
  };

  // Manual snapshot scan using backend /api/scan-qr-code
  const captureFrameAndScan = async () => {
    if (!videoRef.current || isProcessing) return;
    
    setIsProcessing(true);
    setStatusMessage('جاري تحليل لقطة الكاميرا عبر الذكاء الاصطناعي...');
    setErrorMessage(null);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas error');
      
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      await sendImageForBarcode(cleanBase64);
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل في قراءة الباركود');
      setIsProcessing(false);
    }
  };

  // Process file upload from gallery
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage('جاري فحص الصورة المرفوعة...');
    setErrorMessage(null);

    try {
      // 1. Try browser BarcodeDetector
      if ('BarcodeDetector' in window) {
        try {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const imgBitmap = await createImageBitmap(file);
          const detected = await barcodeDetector.detect(imgBitmap);
          if (detected.length > 0 && detected[0].rawValue) {
            await processSyncBarcode(detected[0].rawValue);
            return;
          }
        } catch {
          // fallback to server
        }
      }

      // 2. Server OCR fallback
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const cleanBase64 = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
          await sendImageForBarcode(cleanBase64);
        } catch (err: any) {
          setErrorMessage('حدث خطأ أثناء فحص الصورة');
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage('تعذر قراءة الصورة');
      setIsProcessing(false);
    }
  };

  const sendImageForBarcode = async (cleanBase64: string) => {
    try {
      const res = await fetch('/api/scan-qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: cleanBase64 })
      });

      if (!res.ok) {
        throw new Error('فشل قراءة الباركود عبر الخادم');
      }

      const json = await res.json();
      if (json.raw) {
        await processSyncBarcode(json.raw);
      } else if (json.store_id) {
        await executeWorkspaceSync(json.store_id);
      } else {
        setErrorMessage('لم يتم العثور على باركود صالح لمزامنة المتجر في الصورة.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'فشل فحص الباركود');
      setIsProcessing(false);
    }
  };

  // Main logic matching Flutter: _processSyncBarcode
  const processSyncBarcode = async (rawValue: string) => {
    if (isProcessing && statusMessage.includes('تنزيل الفواتير')) return;
    
    setIsProcessing(true);
    setStatusMessage('جاري تحليل باركود الربط والمزامنة...');
    setErrorMessage(null);

    try {
      let storeId = '';

      // Check if raw value is JSON payload
      try {
        const data = JSON.parse(rawValue);
        if (data.type === 'workspace_full_sync' || data.store_id || data.storeWorkspaceId) {
          storeId = data.store_id || data.storeWorkspaceId;
        }
      } catch {
        // May be direct store ID string
        if (rawValue.startsWith('SLM-') || rawValue.trim().length >= 4) {
          storeId = rawValue.trim();
        }
      }

      if (!storeId) {
        throw new Error('الباركود غير صالح أو لا يحتوي على كود متجر سليم.');
      }

      await executeWorkspaceSync(storeId);
    } catch (error: any) {
      setErrorMessage('تنبيه: ' + (error.message || 'فشل الاتصال'));
      setIsProcessing(false);
    }
  };

  // 1. تنزيل الفواتير والعملاء من قاعدة المتجر
  // 2. تفعيل الاستماع والربط اللحظي
  const executeWorkspaceSync = async (storeId: string) => {
    try {
      setStatusMessage('1. جاري جلب الفواتير والبيانات من المتجر الأساسي...');

      // Verify store exists in Firestore
      const accountRef = doc(db, 'accounts', storeId);
      const accountSnap = await getDoc(accountRef);

      if (!accountSnap.exists()) {
        throw new Error(`لم يتم العثور على المتجر "${storeId}" في السحابة.`);
      }

      // Download invoices count
      const invoicesSnap = await getDocs(collection(db, `accounts/${storeId}/invoices`));
      const invoicesCount = invoicesSnap.size;

      // Download clients count
      setStatusMessage('2. جاري مزامنة قائمة العملاء والحسابات...');
      const clientsSnap = await getDocs(collection(db, `accounts/${storeId}/clients`));
      const clientsCount = clientsSnap.size;

      setStatusMessage('3. تفعيل المزامنة اللحظية المشتركة في نفس الثانية!');
      
      setSyncSuccessInfo({
        storeId,
        invoicesCount,
        clientsCount,
      });

      // Stop camera once verified
      stopCamera();

      // Show success screen briefly then trigger callback
      setTimeout(() => {
        onSuccessSync(storeId, { invoicesCount, clientsCount });
      }, 1400);

    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء تنزيل البيانات ومزامنتها.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-3 font-['Tajawal'] backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl w-full max-w-[440px] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* App Bar / Header */}
        <div className="bg-slate-900/95 px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight text-white">مسح باركود مزامنة الهاتف</h2>
              <p className="text-[11px] text-slate-400">وجه الكاميرا نحو باركود الهاتف الأول للربط اللحظي</p>
            </div>
          </div>
          <button 
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="relative flex-1 min-h-[340px] bg-black flex items-center justify-center overflow-hidden">
          {/* Live Video Feed */}
          <video 
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
          />

          {/* Scanner Overlay Box */}
          <div className="relative z-10 w-64 h-64 border-2 border-emerald-400 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.25)]">
            {/* Animated Laser Scanning Bar */}
            <div className="absolute top-2 left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />
            
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

            {!cameraActive && (
              <div className="text-center p-4">
                <Smartphone className="w-12 h-12 text-slate-500 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-slate-400">الكاميرا غير مفعلة، يمكنك رفع صورة الباركود من المعرض</p>
              </div>
            )}
          </div>

          {/* Torch Toggle if available */}
          {cameraActive && (
            <button
              onClick={toggleTorch}
              className={`absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all ${
                torchOn ? 'bg-amber-400 text-slate-900 shadow-md' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{torchOn ? 'إطفاء الفلاش' : 'تشغيل الفلاش'}</span>
            </button>
          )}

          {/* Processing / Loading Modal Overlay (Same as Flutter Stack loading) */}
          {isProcessing && (
            <div className="absolute inset-0 z-30 bg-black/85 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
              {syncSuccessInfo ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500 animate-in zoom-in">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-400">تم الربط والمزامنة بنجاح!</h3>
                  <div className="bg-slate-800/90 rounded-2xl p-3 border border-slate-700 text-xs text-slate-300 space-y-1">
                    <p className="font-bold text-white">متجر: <span className="font-mono text-emerald-400">{syncSuccessInfo.storeId}</span></p>
                    <p>تم تحميل {syncSuccessInfo.invoicesCount} فاتورة و {syncSuccessInfo.clientsCount} عميل</p>
                    <p className="text-emerald-400 text-[11px] font-medium">المزامنة اللحظية مفعلة الآن تلقائياً ✓</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                    <RefreshCw className="w-5 h-5 text-emerald-300 absolute" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-black text-white">جاري الاتصال بقاعدة البيانات...</h4>
                    <p className="text-xs text-emerald-300 max-w-xs">{statusMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="bg-red-950/80 border-y border-red-800/70 p-3 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <p className="leading-snug">{errorMessage}</p>
          </div>
        )}

        {/* Bottom Bar / Action Buttons */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Capture button */}
            <button
              onClick={captureFrameAndScan}
              disabled={isProcessing || !cameraActive}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>التقاط وفحص الآن</span>
            </button>

            {/* Gallery Upload button */}
            <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-95 text-center">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>اختيار من المعرض</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                disabled={isProcessing}
                onChange={handleFileUpload} 
              />
            </label>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              تحديث مشترك في نفس الثانية
            </span>
            <span>بواسطة Firebase Firestore</span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Video,
  SwitchCamera,
  Layers,
  ArrowRight
} from 'lucide-react';

import { LogoData } from '../types';

interface LogoScannerScreenProps {
  onClose: () => void;
  onOpenEditForm?: (data?: LogoData) => void;
}

export const LogoScannerScreen: React.FC<LogoScannerScreenProps> = ({ onClose, onOpenEditForm }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>('');
  const [logoData, setLogoData] = useState<LogoData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [permissionMsg, setPermissionMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Live camera stream state
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // دالة طلب إذن الكاميرا وفتح البث المباشر بأمان
  const handleStartLiveCamera = async () => {
    setErrorMsg(null);
    setPermissionMsg('جاري طلب إذن الوصول إلى الكاميرا من المتصفح...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك لا يدعم فتح الكاميرا المباشرة مباشرة، يرجى استخدام رفع الصورة.');
      }

      // محاولة فتح الكاميرا الخلفية (environment) أولاً
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      }).catch(async (e) => {
        // إذا فشل الخلفي (مثلاً على اللابتوب)، نجرب أي كاميرا متاحة
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });

      setCameraStream(stream);
      setIsLiveCameraOpen(true);
      setPermissionMsg(null);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setPermissionMsg(null);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('تم رفض إذن الكاميرا من المتصفح. يمكنك منح الإذن من إعدادات المتصفح أو اختيار صورة من المعرض.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('لم يتم العثور على كاميرا في هذا الجهاز. يرجى اختيار صورة من المعرض.');
      } else {
        setErrorMsg(err.message || 'تعذر تشغيل الكاميرا.');
      }
      setIsLiveCameraOpen(false);
    }
  };

  const handleStopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsLiveCameraOpen(false);
  };

  // التقاط لقطة من الفيديو المباشر
  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      handleStopLiveCamera();
      analyzeImageDataUrl(dataUrl);
    }
  };

  // دالة إرسال الصورة للتحليل بالذكاء الاصطناعي
  const analyzeImageDataUrl = async (dataUrl: string) => {
    setImagePreview(dataUrl);
    setErrorMsg(null);
    setResultText('');
    setLogoData(null);
    setIsLoading(true);

    try {
      const cleanBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

      const response = await fetch('/api/analyze-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cleanBase64,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل الاتصال بالذكاء الاصطناعي لفحص الشعار.');
      }

      const resJson = await response.json();
      setResultText(resJson.text || 'لم يتم استخراج أي بيانات.');
      if (resJson.data) {
        setLogoData({
          brandName: resJson.data.brand_name || '',
          productName: resJson.data.product_name || '',
          details: resJson.data.details || '',
          weightOrVolume: resJson.data.weight_or_volume || undefined,
          price: resJson.data.price !== undefined && resJson.data.price !== null ? Number(resJson.data.price) : undefined,
          currency: resJson.data.currency || undefined,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء فحص الشعار.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickAndAnalyzeImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        analyzeImageDataUrl(optimizedDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // توليد ملصق تجريبي فوري لاختبار التحليل بالذكاء الاصطناعي بنقرة واحدة
  const handleTestDemoSample = (sampleType: 'sidr' | 'nigella') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // خلفية الملصق الذهبي الفاخر
    ctx.fillStyle = sampleType === 'sidr' ? '#fffbeb' : '#f0fdf4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // إطار مزخرف
    ctx.strokeStyle = sampleType === 'sidr' ? '#d97706' : '#15803d';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

    ctx.strokeStyle = '#8B5A2B';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, canvas.width - 44, canvas.height - 44);

    // رأس الملصق
    ctx.textAlign = 'center';
    ctx.fillStyle = sampleType === 'sidr' ? '#92400e' : '#14532d';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('شركة سليم', canvas.width / 2, 70);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.fillText('لإنتاج وتعبئة العسل الطبيعي 100%', canvas.width / 2, 100);

    // خط فاصل
    ctx.strokeStyle = sampleType === 'sidr' ? '#f59e0b' : '#22c55e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 120);
    ctx.lineTo(canvas.width - 80, 120);
    ctx.stroke();

    // اسم المنتج
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = '#1e293b';
    const prodName = sampleType === 'sidr' ? 'عسل سدر جبلي ملكي' : 'عسل زهور حبة البركة';
    ctx.fillText(prodName, canvas.width / 2, 175);

    // المواصفات
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#475569';
    const details = sampleType === 'sidr' 
      ? 'نقي 100% مستخلص من أزهار السدر البرية - غير مبستر'
      : 'عسل طبيعي غني بمستخلص حبة البركة لتقوية المناعة';
    ctx.fillText(details, canvas.width / 2, 215);

    // بطاقة الوزن والسعر
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(100, 250, canvas.width - 200, 70);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(100, 250, canvas.width - 200, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px sans-serif';
    const weightText = sampleType === 'sidr' ? 'الوزن: 1 كغ (1000g)' : 'الوزن الصافي: 500 غرام';
    ctx.fillText(weightText, 210, 292);

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 20px sans-serif';
    const priceText = sampleType === 'sidr' ? 'السعر: 250 TL' : 'السعر: 140 TL';
    ctx.fillText(priceText, 410, 292);

    // التذييل والباركود الصوري
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('تاريخ التعبئة: 2026/04/10 • صنع في تركيا • رقم الترخيص: TR-42-SLM', canvas.width / 2, 360);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    analyzeImageDataUrl(dataUrl);
  };

  const handleCopyResult = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 font-['Tajawal'] backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-[460px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* App Bar / Header */}
        <div className="bg-gradient-to-r from-[#1B6E39] to-[#14532D] text-white px-5 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">فحص الشعار عبر Google AI</h2>
              <p className="text-[11px] text-emerald-100">تحليل الهوية البصرية، الاسم التجاري، والمواصفات والأسعار</p>
            </div>
          </div>
          <button 
            onClick={() => {
              handleStopLiveCamera();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-5 overflow-y-auto space-y-4">

          {/* Live Camera Viewfinder Overlay */}
          {isLiveCameraOpen ? (
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-500 shadow-xl flex flex-col items-center">
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full max-h-[260px] object-cover"
                onLoadedMetadata={() => videoRef.current?.play()}
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>بث الكاميرا المباشر نشط</span>
              </div>
              <div className="p-3 w-full bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>التقاط صورة الملصق</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopLiveCamera}
                  className="py-2.5 px-4 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-100 shadow-inner bg-slate-50 flex items-center justify-center">
              <img 
                src={imagePreview} 
                alt="Selected Logo" 
                className="w-full max-h-[220px] object-contain p-2 rounded-xl"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-300" />
                  <span className="text-xs font-bold">جاري تحليل بيانات الشعار والأسعار عبر Gemini AI...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 bg-slate-100/90 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-4">
              <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-xs">
                <ImageIcon className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-700">التقط صورة الشعار لبدء الفحص</p>
              <p className="text-xs text-slate-500 mt-0.5">يدعم الملصقات، الأختام، وأسعار عبوات العسل والمنتجات</p>
            </div>
          )}

          {/* Action Buttons: Camera & Gallery */}
          <div className="flex items-center justify-center gap-2.5">
            {/* Live Camera Option */}
            <button 
              type="button"
              onClick={handleStartLiveCamera}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isLoading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-[#0088CC] text-white hover:brightness-110 active:scale-95'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>الكاميرا المباشرة</span>
            </button>

            {/* Gallery / File Picker Option */}
            <label className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
              isLoading 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 active:scale-95'
            }`}>
              <ImageIcon className="w-4 h-4 text-emerald-700" />
              <span>المعرض / ملف</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                disabled={isLoading}
                onChange={handlePickAndAnalyzeImage}
              />
            </label>
          </div>

          {/* Permission / Status Info */}
          {permissionMsg && (
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
              <span>{permissionMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">{errorMsg}</p>
                <p className="text-[11px] text-red-600 mt-1">يمكنك استخدام زر "المعرض" لرفع أي صورة مباشرة دون الحاجة للكاميرا.</p>
              </div>
            </div>
          )}

          {/* Quick Demo Testing Buttons */}
          <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 space-y-2">
            <span className="text-[11px] font-black text-amber-900 block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              تجربة سريعة (فحص ملصق تجريبي بنقرة واحدة):
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTestDemoSample('sidr')}
                disabled={isLoading}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                عسل سدر ملكي (250 TL)
              </button>
              <button
                type="button"
                onClick={() => handleTestDemoSample('nigella')}
                disabled={isLoading}
                className="flex-1 py-1.5 px-2 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                عسل حبة البركة (140 TL)
              </button>
            </div>
          </div>

          {/* Result Presentation Box */}
          {resultText && (
            <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 text-slate-800 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  نتيجة تحليل الشعار والملصق (LogoData):
                </span>
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>

              {/* Structured Badges if logoData is present */}
              {logoData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {logoData.brandName && (
                    <div className="bg-white/95 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">العلامة / الشعار</span>
                      <span className="font-bold text-emerald-950">{logoData.brandName}</span>
                    </div>
                  )}
                  {logoData.productName && (
                    <div className="bg-white/95 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">اسم المنتج</span>
                      <span className="font-bold text-emerald-800">{logoData.productName}</span>
                    </div>
                  )}
                  {logoData.weightOrVolume && (
                    <div className="bg-white/95 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">الوزن / الحجم</span>
                      <span className="font-bold text-amber-900">{logoData.weightOrVolume}</span>
                    </div>
                  )}
                  {logoData.price !== undefined && logoData.price !== null && (
                    <div className="bg-white/95 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-slate-500 font-semibold block">السعر المستخرج</span>
                      <span className="font-bold text-emerald-700">{logoData.price} {logoData.currency || ''}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line select-text font-medium bg-white/70 p-2.5 rounded-xl border border-emerald-100/70">
                {resultText}
              </div>

              {onOpenEditForm && (
                <button
                  type="button"
                  onClick={() => {
                    handleStopLiveCamera();
                    onOpenEditForm(logoData || undefined);
                  }}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>تعبئة في نموذج إدخال البيانات (EditFormScreen)</span>
                </button>
              )}
            </div>
          )}

          {/* Tips / Help */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p>
              يتم إرسال الصورة بشكل آمن إلى نموذج Google AI (Gemini 3.8 Flash) لاستخراج الاسم التجاري، نوع العسل، والوزن والسعر وملء الحقول تلقائياً.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">شركة سليم • Gemini Vision</span>
          <button
            onClick={() => {
              handleStopLiveCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

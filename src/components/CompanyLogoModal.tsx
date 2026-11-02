import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, Check, Trash2 } from 'lucide-react';

interface CompanyLogoModalProps {
  currentLogoUrl: string | null;
  onClose: () => void;
  onSaveLogo: (url: string | null) => void;
}

export function CompanyLogoModal({ currentLogoUrl, onClose, onSaveLogo }: CompanyLogoModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveLogo(previewUrl);
    onClose();
  };

  const handleClear = () => {
    setPreviewUrl(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[380px] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-right">
        {/* Header */}
        <div className="bg-[#15803d] text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold m-0">تحديث وإدارة شعار الشركة الدائم</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white border-none bg-transparent cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          <p className="text-slate-600 leading-relaxed m-0">
            اختر شعار/لوجو شركة سليم من جهازك لطباعته وحفظه تلقائياً في أعلى جميع الفواتير وملصقات الشحن الحرارية.
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 bg-slate-50 relative min-h-[140px]">
            {previewUrl ? (
              <div className="flex flex-col items-center gap-3 w-full">
                <img 
                  src={previewUrl} 
                  alt="شعار الشركة" 
                  className="max-h-24 max-w-[180px] object-contain rounded-lg border border-slate-200 p-1 bg-white shadow-2xs" 
                />
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-700 font-bold">🟢 اللوجو الحالي جاهز للطباعة</span>
                  <button 
                    onClick={handleClear} 
                    className="text-red-500 hover:text-red-700 p-1 border-none bg-transparent cursor-pointer"
                    title="حذف اللوجو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer w-full text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#15803d] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-800 text-xs">اضغط هنا لاختيار الصورة من الاستوديو</span>
                <span className="text-[10px] text-slate-400">صيغ مدعومة: PNG, JPG, WEBP</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 py-2 rounded-lg bg-[#15803d] text-white font-bold text-xs hover:bg-green-800 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>تثبيت الشعار</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Camera, Truck, FileText, Sparkles, Smartphone, SlidersHorizontal, X, LogOut } from 'lucide-react';

interface FeaturesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanAI: () => void;
  onShippingLabel: () => void;
  onDataEntry: () => void;
  onLogoScanner: () => void;
  onLinkDevice: () => void;
  onLogout?: () => void;
  accountCode?: string;
}

export const FeaturesDrawer: React.FC<FeaturesDrawerProps> = ({
  isOpen,
  onClose,
  onScanAI,
  onShippingLabel,
  onDataEntry,
  onLogoScanner,
  onLinkDevice,
  onLogout,
  accountCode,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const features = [
    {
      title: 'مسح AI',
      icon: Camera,
      bgColor: '#0088CC',
      onClick: () => {
        onClose();
        onScanAI();
      },
    },
    {
      title: 'ملصق شحن',
      icon: Truck,
      bgColor: '#F58220',
      onClick: () => {
        onClose();
        onShippingLabel();
      },
    },
    {
      title: 'إدخال البيانات',
      icon: FileText,
      bgColor: '#009EE2',
      onClick: () => {
        onClose();
        onDataEntry();
      },
    },
    {
      title: 'فحص الشعار',
      icon: Sparkles,
      bgColor: '#4A3AFF',
      onClick: () => {
        onClose();
        onLogoScanner();
      },
    },
    {
      title: 'ربط هاتف آخر',
      icon: Smartphone,
      bgColor: '#00A86B',
      onClick: () => {
        onClose();
        onLinkDevice();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container (Right side slide-in matching Flutter endDrawer) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-[320px] bg-[#14532D] text-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="bg-[#0F3E22] px-5 py-5 flex items-center justify-between border-b border-emerald-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-800/60 flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-[16px] font-black leading-tight text-white">قائمة الخدمات السريعة</h2>
                {accountCode && (
                  <p className="text-[11px] text-emerald-300/80 font-mono font-semibold" dir="ltr">{accountCode}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/40 transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feature Cards List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <button
                  key={idx}
                  onClick={f.onClick}
                  style={{ backgroundColor: f.bgColor }}
                  className="w-full h-16 px-4 rounded-2xl flex items-center justify-between text-white font-black text-base shadow-lg shadow-black/20 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="text-[15px] tracking-wide">{f.title}</span>
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer (Logout & Version) */}
          {onLogout && (
            <div className="p-4 bg-[#0F3E22]/60 border-t border-emerald-900/40 flex items-center justify-between">
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-2 text-rose-300 hover:text-rose-100 text-xs font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
              <span className="text-[10px] text-emerald-400/60 font-medium">سليم v2.4</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

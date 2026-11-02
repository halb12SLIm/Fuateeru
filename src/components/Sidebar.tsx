import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings,
  BrainCircuit,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: 'clients', label: 'العملاء', icon: Users },
    { id: 'smart', label: 'المساعد الذكي', icon: BrainCircuit },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-stone-900/50 z-20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div 
        className={cn(
          "bg-white border-e border-stone-200 h-screen flex flex-col fixed rtl:right-0 ltr:left-0 z-30 transition-all duration-300",
          isOpen ? "w-64 translate-x-0" : "w-20 translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-14 flex items-center justify-center border-b border-stone-200 px-4">
          <CreditCard className="w-6 h-6 text-amber-600 shrink-0" />
          {isOpen && (
            <h1 className="text-lg font-bold text-stone-800 ms-3 whitespace-nowrap overflow-hidden">فواتير سليم</h1>
          )}
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                title={!isOpen ? item.label : undefined}
                className={cn(
                  "flex items-center w-full rounded-md py-2.5 transition-colors duration-150",
                  isOpen ? "px-3" : "px-0 justify-center",
                  isActive 
                    ? "bg-amber-50 text-amber-700 font-bold" 
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900 font-medium"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 shrink-0", 
                  isActive ? "text-amber-600" : "text-stone-400",
                  isOpen ? "me-3" : "me-0"
                )} />
                {isOpen && <span className="text-xs whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  bare?: boolean;
}

export function Modal({ isOpen, onClose, title, children, className, bare }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm">
      {bare ? (
        <div className={cn("relative animate-in fade-in zoom-in-95 duration-200", className)}>
          {children}
        </div>
      ) : (
        <div 
          className={cn(
            "bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200",
            className
          )}
        >
          <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
            <h3 className="text-base font-bold text-stone-800">{title}</h3>
            <button 
              onClick={onClose} 
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 overflow-y-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

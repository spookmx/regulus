'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface EvoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  variant?: 'dialog' | 'sheet';
  children: React.ReactNode;
}

export function EvoModal({
  isOpen,
  onClose,
  title,
  subtitle,
  variant = 'dialog',
  children,
}: EvoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (variant === 'sheet') {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative w-full max-w-xl bg-ebay-bg-card border-l border-ebay-border h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          <div className="p-6 border-b border-ebay-border flex items-center justify-between gap-4">
            <div>
              {title && <h3 className="text-xl font-extrabold text-ebay-fg-primary">{title}</h3>}
              {subtitle && <p className="text-xs text-ebay-fg-secondary mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary transition-colors"
              aria-label="Close Context Sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg bg-ebay-bg-card rounded-2xl border border-ebay-border shadow-2xl p-6 z-10 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-ebay-border">
          <div>
            {title && <h3 className="text-lg font-extrabold text-ebay-fg-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-ebay-fg-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

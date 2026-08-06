'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type NoticeType = 'page' | 'section' | 'inline';
export type NoticeVariant = 'info' | 'success' | 'warning' | 'error';

export interface EvoAlertNoticeProps {
  type?: NoticeType;
  variant?: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function EvoAlertNotice({
  type = 'section',
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: EvoAlertNoticeProps) {
  let bgBorderStyles = '';
  let IconComponent = Info;
  let iconColor = '';

  switch (variant) {
    case 'success':
      bgBorderStyles = 'bg-ebay-green-bg border-green-500/30 text-ebay-fg-primary';
      IconComponent = CheckCircle2;
      iconColor = 'text-ebay-green';
      break;
    case 'warning':
      bgBorderStyles = 'bg-ebay-amber-bg border-amber-500/30 text-ebay-fg-primary';
      IconComponent = AlertTriangle;
      iconColor = 'text-ebay-amber';
      break;
    case 'error':
      bgBorderStyles = 'bg-ebay-red-bg border-red-500/30 text-ebay-fg-primary';
      IconComponent = XCircle;
      iconColor = 'text-ebay-red';
      break;
    case 'info':
    default:
      bgBorderStyles = 'bg-ebay-info-bg border-blue-500/30 text-ebay-fg-primary';
      IconComponent = Info;
      iconColor = 'text-ebay-info';
      break;
  }

  if (type === 'inline') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${bgBorderStyles} ${className}`}>
        <IconComponent className={`w-3.5 h-3.5 ${iconColor}`} />
        <span>{children}</span>
      </div>
    );
  }

  const radiusStyle = type === 'page' ? 'rounded-none border-b' : 'rounded-2xl border';
  const paddingStyle = type === 'page' ? 'px-6 py-4' : 'p-4';

  return (
    <div className={`flex items-start justify-between gap-3 ${radiusStyle} ${paddingStyle} ${bgBorderStyles} ${className}`}>
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
        <div>
          {title && <h4 className="text-sm font-extrabold mb-0.5">{title}</h4>}
          <div className="text-xs text-ebay-fg-secondary leading-relaxed">{children}</div>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-ebay-fg-secondary hover:text-ebay-fg-primary p-1 rounded-lg hover:bg-ebay-bg-secondary/40 transition-colors"
          aria-label="Dismiss notice"
        >
          &times;
        </button>
      )}
    </div>
  );
}

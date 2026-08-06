'use client';

import React from 'react';

export type EvoBadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface EvoBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: EvoBadgeStatus;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function EvoBadge({
  status = 'neutral',
  icon,
  className = '',
  children,
  ...props
}: EvoBadgeProps) {
  let statusStyles = '';

  switch (status) {
    case 'success':
      statusStyles = 'bg-ebay-green-bg text-ebay-green border border-green-500/20';
      break;
    case 'warning':
      statusStyles = 'bg-ebay-amber-bg text-ebay-amber border border-amber-500/20';
      break;
    case 'error':
      statusStyles = 'bg-ebay-red-bg text-ebay-red border border-red-500/20';
      break;
    case 'info':
      statusStyles = 'bg-ebay-info-bg text-ebay-info border border-blue-500/20';
      break;
    case 'neutral':
    default:
      statusStyles = 'bg-ebay-bg-secondary text-ebay-fg-secondary border border-ebay-border';
      break;
  }

  return (
    <span className={`evo-badge ${statusStyles} ${className}`} {...props}>
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}

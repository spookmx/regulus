'use client';

import React from 'react';

export type EvoButtonVariant = 'cta' | 'primary' | 'secondary' | 'icon' | 'link' | 'segmented';

export interface EvoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: EvoButtonVariant;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function EvoButton({
  variant = 'primary',
  active = false,
  size = 'md',
  className = '',
  children,
  ...props
}: EvoButtonProps) {
  let baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-ebay-blue';
  
  // Size variations
  let sizeStyles = 'px-4 py-2 text-sm';
  if (size === 'sm') sizeStyles = 'px-3 py-1.5 text-xs';
  if (size === 'lg') sizeStyles = 'px-6 py-3 text-base';

  let variantStyles = '';

  switch (variant) {
    case 'cta':
      variantStyles = 'bg-ebay-blue text-white rounded-full font-bold shadow-md hover:bg-ebay-blue/90 hover:shadow-lg active:scale-95';
      break;
    case 'primary':
      variantStyles = 'bg-ebay-blue text-white rounded-full hover:bg-ebay-blue/90 active:scale-95';
      break;
    case 'secondary':
      variantStyles = 'bg-ebay-bg-card text-ebay-fg-primary border border-ebay-border rounded-full hover:bg-ebay-bg-secondary hover:border-ebay-border-strong active:scale-95';
      break;
    case 'icon':
      sizeStyles = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2';
      variantStyles = 'rounded-full text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-secondary border border-transparent hover:border-ebay-border';
      break;
    case 'link':
      sizeStyles = 'p-0 text-sm';
      variantStyles = 'text-ebay-blue hover:underline bg-transparent border-0';
      break;
    case 'segmented':
      sizeStyles = 'px-3.5 py-1.5 text-xs font-bold';
      variantStyles = active
        ? 'bg-ebay-blue text-white shadow-sm rounded-full'
        : 'text-ebay-fg-secondary hover:text-ebay-fg-primary hover:bg-ebay-bg-card rounded-full';
      break;
  }

  return (
    <button className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
}

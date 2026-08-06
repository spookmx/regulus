'use client';

import React from 'react';

export interface EvoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export function EvoCard({
  hoverable = true,
  padded = true,
  className = '',
  children,
  ...props
}: EvoCardProps) {
  const paddingStyle = padded ? 'p-5 lg:p-6' : '';
  const hoverStyle = hoverable ? 'hover:border-ebay-border-strong hover:shadow-md' : '';

  return (
    <div
      className={`evo-card ${paddingStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

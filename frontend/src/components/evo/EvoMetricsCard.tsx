'use client';

import React from 'react';
import { EvoCard } from './EvoCard';

export interface EvoMetricsCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendPositive?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function EvoMetricsCard({
  label,
  value,
  subtext,
  trend,
  trendPositive = true,
  icon,
}: EvoMetricsCardProps) {
  return (
    <EvoCard className="flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs uppercase font-bold tracking-wider text-ebay-fg-secondary">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-full bg-ebay-blue/10 border border-ebay-blue/20 flex items-center justify-center text-ebay-blue">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-ebay-fg-primary tracking-tight">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              trendPositive
                ? 'bg-ebay-green-bg text-ebay-green border-green-500/20'
                : 'bg-ebay-red-bg text-ebay-red border-red-500/20'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtext && <p className="text-xs text-ebay-fg-secondary leading-snug">{subtext}</p>}
    </EvoCard>
  );
}

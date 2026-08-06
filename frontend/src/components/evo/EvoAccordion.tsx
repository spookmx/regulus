'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface EvoAccordionProps {
  title: React.ReactNode;
  badge?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function EvoAccordion({
  title,
  badge,
  defaultExpanded = false,
  children,
  className = '',
}: EvoAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`evo-card overflow-hidden transition-all ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-ebay-bg-secondary/50 transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sm sm:text-base text-ebay-fg-primary">{title}</span>
          {badge}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-ebay-fg-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-ebay-blue' : ''
          }`}
        />
      </button>
      {isExpanded && (
        <div className="p-4 sm:p-5 border-t border-ebay-border bg-ebay-bg-primary/50 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

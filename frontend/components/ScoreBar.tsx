"use client";

import { cn } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  value: number;
  maxValue?: number;
  className?: string;
}

export function ScoreBar({ label, value, maxValue = 100, className }: ScoreBarProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold text-primary">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

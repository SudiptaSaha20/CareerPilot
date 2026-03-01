"use client";

import { cn } from '@/lib/utils';

interface LoaderSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoaderSkeleton({ className, lines = 3 }: LoaderSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="shimmer h-4 rounded-lg bg-secondary"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card p-6 space-y-4', className)}>
      <div className="shimmer h-6 w-1/3 rounded-lg bg-secondary" />
      <LoaderSkeleton lines={3} />
    </div>
  );
}

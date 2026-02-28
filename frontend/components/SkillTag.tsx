"use client";

import { cn } from '@/lib/utils';

interface SkillTagProps {
  label: string;
  variant?: 'default' | 'gap' | 'strength';
  className?: string;
}

export function SkillTag({ label, variant = 'default', className }: SkillTagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        variant === 'default' && 'bg-primary/10 text-primary border border-primary/20',
        variant === 'gap' && 'bg-destructive/10 text-destructive border border-destructive/20',
        variant === 'strength' && 'bg-success/10 text-success border border-success/20',
        className
      )}
    >
      {label}
    </span>
  );
}

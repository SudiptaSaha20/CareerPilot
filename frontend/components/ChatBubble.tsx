"use client";

import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: string;
  isAI?: boolean;
  className?: string;
}

export function ChatBubble({ message, isAI = false, className }: ChatBubbleProps) {
  return (
    <div className={cn('flex', isAI ? 'justify-start' : 'justify-end', className)}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
          isAI
            ? 'bg-secondary text-secondary-foreground rounded-bl-sm'
            : 'bg-primary text-primary-foreground rounded-br-sm'
        )}
      >
        {message}
      </div>
    </div>
  );
}

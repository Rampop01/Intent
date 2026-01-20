'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function Loader({ size = 'md', className, text }: LoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <div className={cn('relative animate-pulse', sizeClasses[size])}>
        <Image
          src="/loader.jpg"
          alt="Loading..."
          fill
          className="object-contain rounded-full"
          priority
        />
        {/* Animated ring around the image */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Full page loader
export function FullPageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader size="xl" text={text} />
    </div>
  );
}

// Inline loader (for buttons, cards, etc.)
export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="relative w-5 h-5">
        <Image
          src="/loader.jpg"
          alt="Loading..."
          fill
          className="object-contain rounded-full animate-spin"
          priority
        />
      </div>
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

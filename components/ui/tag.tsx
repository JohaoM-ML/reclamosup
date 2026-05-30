import { cn } from '@/lib/cn';

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md bg-up-blue/10 px-2 py-0.5 text-xs font-semibold text-up-navy',
        className
      )}
    >
      {children}
    </span>
  );
}

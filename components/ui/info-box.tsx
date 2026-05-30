import { cn } from '@/lib/cn';

export function InfoBox({
  children,
  variant = 'info',
  className,
}: {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'danger';
  className?: string;
}) {
  const styles = {
    info: 'border-up-blue/25 bg-up-blue/5 text-up-navy',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    danger: 'border-red-200 bg-red-50 text-red-800',
  };
  return (
    <div className={cn('rounded-lg border p-4 text-sm', styles[variant], className)}>
      {children}
    </div>
  );
}

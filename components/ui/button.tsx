import { cn } from '@/lib/cn';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'orange' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

const variants = {
  primary:
    'bg-up-blue text-white hover:bg-up-blue-hover focus-visible:ring-up-blue/40',
  orange:
    'bg-up-orange text-white hover:bg-up-orange-hover focus-visible:ring-up-orange/40',
  ghost: 'text-up-text-secondary hover:bg-up-surface-muted hover:text-up-text',
  outline:
    'border border-up-border bg-up-surface text-up-text hover:bg-up-surface-muted',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[6px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

import { cn } from '@/lib/cn';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  dark?: boolean;
};

export function Input({ label, dark, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'mb-2 block text-xs font-semibold tracking-wider uppercase',
            dark ? 'text-white' : 'text-up-text-secondary'
          )}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-[6px] border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2',
          dark
            ? 'border-white/30 bg-white text-up-text focus:border-up-blue focus:ring-up-blue/30'
            : 'border-up-border bg-up-surface text-up-text focus:border-up-blue focus:ring-up-blue/20',
          className
        )}
        {...props}
      />
    </div>
  );
}

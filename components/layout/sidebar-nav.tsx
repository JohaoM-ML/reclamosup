'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

export function SidebarNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const active =
          pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'block rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-up-blue text-white'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

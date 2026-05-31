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
  const hrefs = links.map((l) => l.href);

  function isActive(href: string) {
    if (pathname === href) return true;
    if (!pathname.startsWith(`${href}/`)) return false;
    return !hrefs.some(
      (h) =>
        h !== href &&
        h.startsWith(`${href}/`) &&
        (pathname === h || pathname.startsWith(`${h}/`))
    );
  }

  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const active = isActive(l.href);
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

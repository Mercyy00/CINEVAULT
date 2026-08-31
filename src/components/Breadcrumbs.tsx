import { useEffect, useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const allItems = useMemo<BreadcrumbItem[]>(
    () => [{ label: 'Home', href: '#home' }, ...items],
    [items]
  );

  useEffect(() => {
    const siteUrl = (import.meta.env?.VITE_SITE_URL || 'https://cinevault.app').replace(/\/$/, '');
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: allItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href ? `${siteUrl}/${item.href.replace(/^#/, '#')}` : undefined,
      })),
    };

    let script = document.getElementById('cv-breadcrumb-schema') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'cv-breadcrumb-schema';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById('cv-breadcrumb-schema');
      if (existing) existing.remove();
    };
  }, [allItems]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-xs sm:text-sm text-muted-foreground mb-4 select-none', className)}
    >
      <ol
        className="flex items-center flex-wrap gap-1.5 sm:gap-2"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5 sm:gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              <meta itemProp="position" content={String(index + 1)} />

              {index > 0 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" aria-hidden="true" />
              )}

              {isLast || !item.href ? (
                <span
                  className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-[320px] md:max-w-[450px]"
                  itemProp="name"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="hover:text-brand transition-colors inline-flex items-center gap-1 hover:underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-brand rounded-sm"
                  itemProp="item"
                >
                  {isFirst && <Home className="w-3.5 h-3.5 mr-0.5" aria-hidden="true" />}
                  <span itemProp="name">{item.label}</span>
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

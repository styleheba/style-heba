'use client';

import Link from 'next/link';
import { cn, CATEGORY_LABELS } from '@/lib/utils';

const CATEGORIES = ['all', 'beauty', 'fashion', 'food', 'health', 'kitchen', 'kids', 'living', 'etc'];

interface CategoryFilterProps {
  currentCategory?: string;
  basePath: string;
}

export default function CategoryFilter({ currentCategory, basePath }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
      {CATEGORIES.map((cat) => {
        const isActive = cat === 'all' ? !currentCategory : currentCategory === cat;
        const href = cat === 'all' ? basePath : `${basePath}?category=${cat}`;
        const label = cat === 'all' ? '전체' : CATEGORY_LABELS[cat] || cat;

        return (
          <Link
            key={cat}
            href={href}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
              isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-brand-300 hover:text-brand-500'
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

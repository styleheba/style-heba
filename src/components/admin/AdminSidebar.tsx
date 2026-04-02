'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  Settings,
  Mail,
  Home,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminUser } from '@/lib/database.types';

const NAV_ITEMS = [
  { href: '/admin', label: '대시보드', icon: LayoutDashboard },
  { href: '/admin/products', label: '상품 관리', icon: Package },
  { href: '/admin/orders', label: '주문 관리', icon: ShoppingCart },
  { href: '/admin/customers', label: '고객 관리', icon: Users },
  { href: '/admin/group-buys', label: '공구 일정', icon: Calendar },
  { href: '/admin/emails', label: '이메일', icon: Mail },
  { href: '/admin/site-settings', label: '홈 편집', icon: Home },
  { href: '/admin/settings', label: '설정', icon: Settings },
];

interface Props {
  admin: AdminUser;
}

export default function AdminSidebar({ admin }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-lg font-bold">
            <span className="text-brand-500">Style</span>
            <span className="text-slate-800"> Heba</span>
          </span>
          <span className="badge bg-slate-100 text-slate-500 text-[10px]">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 truncate">
              {admin.email}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">{admin.role}</p>
          </div>
          <Link
            href="/"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="사이트 보기"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

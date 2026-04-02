import Link from 'next/link';
import { Instagram, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-20">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-lg font-bold mb-3">
              <span className="text-brand-500">Style</span>
              <span className="text-slate-800"> Heba</span>
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              미국 한인 여성을 위한 공동구매 플랫폼.
              <br />
              한국 직배송 뷰티, 패션, 식품을 합리적인 가격에.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">바로가기</h3>
            <div className="flex flex-col gap-2">
              <Link href="/preorder" className="text-sm text-slate-500 hover:text-brand-500 transition-colors">
                프리오더 공구
              </Link>
              <Link href="/shop" className="text-sm text-slate-500 hover:text-brand-500 transition-colors">
                바로구매
              </Link>
              <Link href="/mypage" className="text-sm text-slate-500 hover:text-brand-500 transition-colors">
                마이페이지
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">문의</h3>
            <div className="flex flex-col gap-2">
              <a
                href="mailto:hello@styleheba.com"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@styleheba.com
              </a>
              <a
                href="https://instagram.com/styleheba"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-500 transition-colors"
              >
                <Instagram className="w-4 h-4" />
                @styleheba
              </a>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Mon - Fri 10AM - 6PM EST
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Style Heba. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

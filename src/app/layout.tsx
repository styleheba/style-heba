import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Style Heba | 미국 한인 여성을 위한 공동구매',
    template: '%s | Style Heba',
  },
  description:
    '한국 직배송 뷰티, 패션, 식품 공동구매. 미국 한인 여성을 위한 합리적인 쇼핑, Style Heba.',
  keywords: ['한인 공동구매', '한국 뷰티', '미국 한인 쇼핑', 'Korean group buy', 'Style Heba'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://styleheba.com'),
  openGraph: {
    title: 'Style Heba | 미국 한인 여성을 위한 공동구매',
    description: '한국 직배송 뷰티, 패션, 식품 공동구매',
    url: 'https://styleheba.com',
    siteName: 'Style Heba',
    locale: 'ko_KR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E84C6A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}

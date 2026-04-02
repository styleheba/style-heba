import Link from 'next/link';
import { ArrowRight, Truck, Shield, Clock, Gift } from 'lucide-react';
import { createServerSupabase } from '@/lib/supabase/server';
import ProductCard from '@/components/product/ProductCard';
import GroupBuyBanner from '@/components/home/GroupBuyBanner';
import EmailPopup from '@/components/home/EmailPopup';
import HeroSlideshow from '@/components/home/HeroSlideshow';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerSupabase();

  const { data: featuredProducts } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(8);

  const { data: allProducts } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true })
    .limit(12);

  const { data: activeGroupBuys } = await supabase
    .from('group_buys')
    .select('*')
    .in('status', ['active', 'upcoming'])
    .order('open_at', { ascending: true })
    .limit(2);

  const groupBuyIds = (activeGroupBuys || []).map((gb: any) => gb.id);
  const { data: groupBuyProducts } = groupBuyIds.length > 0
    ? await supabase
        .from('products')
        .select('*')
        .in('group_buy_id', groupBuyIds)
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
    : { data: [] };

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['hero', 'announcement']);

  const hero = settings?.find((s) => s.key === 'hero')?.value as Record<string, string> | undefined;

  return (
    <>
      <HeroSlideshow products={allProducts || []} hero={hero} />

      <section className="bg-white border-y border-slate-100">
        <div className="container-app py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, text: '$150+ 무료배송' },
              { icon: Shield, text: '정품 보장' },
              { icon: Clock, text: '공구 특가' },
              { icon: Gift, text: '첫 주문 5% 할인' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Icon className="w-4 h-4 text-brand-400" />
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {activeGroupBuys && activeGroupBuys.length > 0 && (
        <section className="container-app py-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">진행중인 공구 </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGroupBuys.map((gb) => (
              <GroupBuyBanner
                key={gb.id}
                groupBuy={gb}
                products={(groupBuyProducts || []).filter((p) => p.group_buy_id === gb.id)}
              />
            ))}
          </div>
        </section>
      )}

      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container-app py-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">추천 상품</h3>
            <Link
              href="/preorder"
              className="text-sm text-brand-500 font-medium hover:underline flex items-center gap-1"
            >
              전체보기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <EmailPopup />
    </>
  );
}

import { createServerSupabase } from '@/lib/supabase/server';
import ProductCard from '@/components/product/ProductCard';
import CategoryFilter from '@/components/product/CategoryFilter';

export const revalidate = 60;

export const metadata = {
  title: '바로구매',
  description: '재고 상품 바로 구매 - Style Heba',
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createServerSupabase();

  let query = supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('product_type', 'instock')
    .order('sort_order', { ascending: true });

  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }

  const { data: products } = await query;

  return (
    <div className="container-app py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">바로구매</h1>
        <p className="text-slate-500 mt-2">재고 보유 상품, 바로 주문 가능!</p>
      </div>

      <CategoryFilter currentCategory={searchParams.category} basePath="/shop" />

      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400">현재 판매중인 상품이 없습니다</p>
        </div>
      )}
    </div>
  );
}

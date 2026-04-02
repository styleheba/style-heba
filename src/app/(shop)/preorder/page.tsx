import { createServerSupabase } from '@/lib/supabase/server';
import ProductCard from '@/components/product/ProductCard';
import CategoryFilter from '@/components/product/CategoryFilter';

export const revalidate = 60;

export const metadata = {
  title: '프리오더 공구',
  description: '한국 직배송 공동구매 - 뷰티, 패션, 식품',
};

export default async function PreorderPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = createServerSupabase();

  let query = supabase
    .from('products')
    .select('*')
    .eq('status', 'active')
    .eq('product_type', 'preorder')
    .order('sort_order', { ascending: true });

  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }

  const { data: products } = await query;

  return (
    <div className="container-app py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">프리오더 공구</h1>
        <p className="text-slate-500 mt-2">
          한국 직배송 공동구매. 함께 모여 더 좋은 가격에!
        </p>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        currentCategory={searchParams.category}
        basePath="/preorder"
      />

      {/* Products Grid */}
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400">현재 진행중인 공구가 없습니다</p>
          <p className="text-sm text-slate-300 mt-2">곧 새로운 공구가 오픈됩니다!</p>
        </div>
      )}
    </div>
  );
}

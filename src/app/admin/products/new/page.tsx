import { createServerSupabase } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: '상품 등록' };

export default async function NewProductPage() {
  const supabase = createServerSupabase();

  // Fetch group buys for linking
  const { data: groupBuys } = await supabase
    .from('group_buys')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .order('open_at', { ascending: false });

  return <ProductForm groupBuys={groupBuys || []} />;
}

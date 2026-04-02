import { createServerSupabase } from '@/lib/supabase/server';
import GroupBuyForm from '@/components/admin/GroupBuyForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: '공구 일정 등록' };

export default async function NewGroupBuyPage() {
  const supabase = createServerSupabase();

  // Fetch preorder products that are NOT linked to any group buy
  const { data: availableProducts } = await supabase
    .from('products')
    .select('*')
    .eq('product_type', 'preorder')
    .is('group_buy_id', null)
    .order('created_at', { ascending: false });

  return (
    <GroupBuyForm
      availableProducts={availableProducts || []}
    />
  );
}

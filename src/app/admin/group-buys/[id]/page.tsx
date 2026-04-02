import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import GroupBuyForm from '@/components/admin/GroupBuyForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('group_buys')
    .select('title, title_ko')
    .eq('id', params.id)
    .single();

  return {
    title: data ? `수정: ${(data as any).title_ko || (data as any).title}` : '공구 수정',
  };
}

export default async function EditGroupBuyPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  // Fetch group buy
  const { data: groupBuy } = await supabase
    .from('group_buys')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!groupBuy) notFound();

  // Fetch linked products (products that have this group_buy_id)
  const { data: linkedProducts } = await supabase
    .from('products')
    .select('*')
    .eq('group_buy_id', params.id)
    .order('sort_order', { ascending: true });

  // Fetch available products (preorder, not linked to any group buy OR linked to this one)
  const { data: availableProducts } = await supabase
    .from('products')
    .select('*')
    .eq('product_type', 'preorder')
    .or(`group_buy_id.is.null,group_buy_id.eq.${params.id}`)
    .order('created_at', { ascending: false });

  return (
    <GroupBuyForm
      groupBuy={groupBuy}
      linkedProducts={linkedProducts || []}
      availableProducts={availableProducts || []}
    />
  );
}

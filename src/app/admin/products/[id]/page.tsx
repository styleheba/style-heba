import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const { data: product } = await supabase
    .from('products')
    .select('name, name_ko')
    .eq('id', params.id)
    .single();

  return {
    title: product ? `수정: ${(product as any).name_ko || (product as any).name}` : '상품 수정',
  };
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createServerSupabase();

  // Fetch product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!product) notFound();

  // Fetch group buys for linking
  const { data: groupBuys } = await supabase
    .from('group_buys')
    .select('*')
    .in('status', ['upcoming', 'active', 'closed'])
    .order('open_at', { ascending: false });

  return <ProductForm product={product} groupBuys={groupBuys || []} />;
}

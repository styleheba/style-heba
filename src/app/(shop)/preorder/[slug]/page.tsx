import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabase();
  const { data: product } = await supabase
    .from('products')
    .select('name, name_ko, description')
    .eq('slug', params.slug)
    .single();

  if (!product) return { title: '상품을 찾을 수 없습니다' };

  return {
    title: product.name_ko || product.name,
    description: product.description?.slice(0, 160),
  };
}

export default async function PreorderDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createServerSupabase();

  const { data: product } = await supabase
    .from('products')
    .select('*, group_buys(*)')
    .eq('slug', params.slug)
    .single();

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}

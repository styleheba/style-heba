import { redirect } from 'next/navigation';
import { createServiceSupabase } from '@/lib/supabase/server';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    redirect('/mypage?error=invalid');
  }

  const supabase = createServiceSupabase();

  // Find and validate token
  const { data: magicLink } = await supabase
    .from('magic_links')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .single();

  if (!magicLink) {
    redirect('/mypage?error=expired');
  }

  // Check expiry
  if (new Date(magicLink.expires_at) < new Date()) {
    redirect('/mypage?error=expired');
  }

  // Mark as used
  await supabase
    .from('magic_links')
    .update({ used_at: new Date().toISOString() })
    .eq('id', magicLink.id);

  // Redirect to mypage with email (stored in cookie via client)
  redirect(`/mypage?auth=${encodeURIComponent(magicLink.email)}`);
}

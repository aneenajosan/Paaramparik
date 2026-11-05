import { Suspense } from 'react';
import ContributionForm from '@/components/forms/ContributionForm';
import ConfigNotice from '@/components/ConfigNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/lib/data';
import { redirect } from 'next/navigation';
export const metadata = { title: 'Contribute a listing' };
export const dynamic = 'force-dynamic';
export default async function ContributePage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  if (!isSupabaseConfigured) return <ConfigNotice feature="Contributing" />;
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect('/login?next=/contribute');
  const { edit } = await searchParams;
  const categories = await getCategories();
  return (<div className="container-page section max-w-3xl"><p className="eyebrow">Contribute</p><h1 className="mb-8 mt-1 text-4xl">{edit ? 'Edit your submission' : 'Add a cultural listing'}</h1>
    <Suspense><ContributionForm categories={categories} editId={edit} /></Suspense></div>);
}

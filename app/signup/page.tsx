import { Suspense } from 'react';
import AuthForm from '@/components/forms/AuthForm';
import ConfigNotice from '@/components/ConfigNotice';
import { isSupabaseConfigured } from '@/lib/supabase/config';
export const metadata = { title: 'Sign up' };
export default function Page() {
  if (!isSupabaseConfigured) return <ConfigNotice feature="Accounts" />;
  return <div className="container-page section"><Suspense><AuthForm mode="signup" /></Suspense></div>;
}

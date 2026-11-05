'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/types';
export default function RoleSelect({ id, role, name }: { id: string; role: Role; name: string }) {
  const router = useRouter(); const [err, setErr] = useState<string | null>(null);
  return (<span><label className="sr-only" htmlFor={`r-${id}`}>Role for {name}</label>
    <select id={`r-${id}`} className="input !w-auto !py-1" defaultValue={role} onChange={async (e) => { setErr(null); const { error } = await createClient().from('profiles').update({ role: e.target.value }).eq('id', id); error ? setErr(error.message) : router.refresh(); }}>
      <option value="user">User</option><option value="contributor">Trusted contributor</option><option value="admin">Admin</option></select>
    {err && <span role="alert" className="error-text ml-2">{err}</span>}</span>);
}

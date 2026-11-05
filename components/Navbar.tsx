'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/', label: 'Explore' }, { href: '/directory', label: 'Cultural Directory' },
  { href: '/story', label: 'Story of the Day' }, { href: '/contribute', label: 'Contribute' },
];

export default function Navbar() {
  const pathname = usePathname(), router = useRouter();
  const { user, profile, configured } = useAuth();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const active = (h: string) => (h === '/' ? pathname === '/' || pathname.startsWith('/explore') : pathname.startsWith(h));
  const logout = async () => { await createClient().auth.signOut(); setMenu(false); router.push('/'); router.refresh(); };

  return (
    <header className="sticky top-0 z-40 bg-crimson-950/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={active(l.href) ? 'page' : undefined}
              className={cn('px-3 py-2 text-sm font-semibold hover:text-saffron-500', active(l.href) ? 'text-saffron-500' : 'text-cream')}>{l.label}</Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="relative">
              <button className="btn-ghost" aria-expanded={menu} aria-haspopup="menu" onClick={() => setMenu(!menu)}>
                <UserIcon size={16} /> {profile?.full_name || user.email?.split('@')[0]}
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-52 border border-crimson-800 bg-crimson-950 py-1 shadow-lg">
                  <Link role="menuitem" onClick={() => setMenu(false)} href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-crimson-900"><UserIcon size={14} /> Profile</Link>
                  <Link role="menuitem" onClick={() => setMenu(false)} href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-crimson-900"><LayoutDashboard size={14} /> My submissions</Link>
                  {profile?.role === 'admin' && <Link role="menuitem" onClick={() => setMenu(false)} href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-crimson-900"><ShieldCheck size={14} /> Admin</Link>}
                  <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-crimson-900"><LogOut size={14} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 text-sm font-semibold hover:text-saffron-500">Log in</Link>
              <Link href="/signup" className="btn-saffron">Sign up</Link>
            </>
          )}
        </div>
        <button className="p-2 md:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <nav className="border-t border-crimson-800 bg-crimson-950 px-4 pb-4 md:hidden" aria-label="Mobile">
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold">{l.label}</Link>)}
          {user ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold">Profile</Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold">My submissions</Link>
              {profile?.role === 'admin' && <Link href="/admin" onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold">Admin</Link>}
              <button onClick={() => { setOpen(false); logout(); }} className="block py-3 text-sm font-semibold">Log out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2"><Link href="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1">Log in</Link><Link href="/signup" onClick={() => setOpen(false)} className="btn-saffron flex-1">Sign up</Link></div>
          )}
          {!configured && <p className="mt-3 text-xs text-cream-muted">Accounts are disabled until Supabase is configured.</p>}
        </nav>
      )}
      <div className="kasavu" aria-hidden />
    </header>
  );
}

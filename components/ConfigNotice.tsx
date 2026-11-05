import { Plug } from 'lucide-react';
export default function ConfigNotice({ feature }: { feature: string }) {
  return (
    <div className="container-page section">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <Plug className="mx-auto text-saffron-500" />
        <h1 className="mt-3 text-2xl">{feature} needs Supabase</h1>
        <p className="mt-3 text-sm text-cream-muted">Supabase credentials have not been configured, so this feature is switched off rather than faked. Copy <code>.env.local.example</code> to <code>.env.local</code>, add your project URL and anon key, run the SQL in <code>supabase/migrations</code>, then restart the dev server. See the README.</p>
      </div>
    </div>
  );
}

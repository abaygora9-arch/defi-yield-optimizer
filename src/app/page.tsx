import Dashboard from './DashboardClient';

// Force dynamic rendering — skip SSR prerender
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard />;
}

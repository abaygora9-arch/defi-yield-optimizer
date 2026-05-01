// Server component wrapper — forces dynamic rendering
import Dashboard from './DashboardClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard />;
}

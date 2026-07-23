import { DashboardShell } from '@/components/layout/dashboard-shell';
import { auth } from '@/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <DashboardShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
      }}
    >
      {children}
    </DashboardShell>
  );
}

import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="pt-20 lg:pt-8 px-4 pb-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

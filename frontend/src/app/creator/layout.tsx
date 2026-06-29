import Sidebar from "@/components/creator/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-[#0C0A14] overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

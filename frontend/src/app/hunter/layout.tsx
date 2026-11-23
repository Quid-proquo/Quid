"use client";

import Sidebar from "@/components/hunter/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import RequireWallet from "@/components/auth/RequireWallet";
import RequireRole from "@/components/auth/RequireRole";
import TopNav from "@/components/hunter/TopNav";

export default function HunterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireWallet>
      {/* Issue #331: the wallet gate says who you are, this says which
          dashboard is yours - server role first, local role as the fallback. */}
      <RequireRole role="hunter">
        <div className="flex h-screen min-w-0 overflow-x-hidden bg-background text-foreground brutal-grid-bg">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav />
            <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-0">
              {children}
            </main>
          </div>
          <BottomNav mode="hunter" />
        </div>
      </RequireRole>
    </RequireWallet>
  );
}

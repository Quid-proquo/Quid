"use client";

import Sidebar from "@/components/creator/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import TopNav from "@/components/creator/TopNav";
import RequireWallet from "@/components/auth/RequireWallet";
import RequireRole from "@/components/auth/RequireRole";
import { brutalDashboard } from "@/lib/brutalist-classes";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireWallet>
      <RequireRole role="creator">
        <div className={`${brutalDashboard} min-w-0 overflow-x-hidden`}>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav />
            <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-0">
              {children}
            </main>
          </div>
          <BottomNav mode="creator" />
        </div>
      </RequireRole>
    </RequireWallet>
  );
}

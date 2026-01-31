"use client";

import NavBar from "./NavBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <NavBar />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">{children}</main>
    </div>
  );
}

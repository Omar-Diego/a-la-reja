"use client";

import AdminNavBar from "./AdminNavBar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <AdminNavBar />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">{children}</main>
    </div>
  );
}

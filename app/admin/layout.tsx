"use client";

import { useAuth } from "@/app/context/AuthContext";
import AdminLayout from "@/app/components/layout/AdminLayout";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  // Mientras se carga la sesión, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // El middleware ya maneja la redirección, así que si llegamos aquí
  // y no estamos autenticados o no somos admin, solo mostramos loading
  // mientras el middleware redirige
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}

import DashboardLayout from "@/app/components/layout/DashboardLayout";

export default function PerfilRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

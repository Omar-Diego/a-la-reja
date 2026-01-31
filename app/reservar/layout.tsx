import DashboardLayout from "@/app/components/layout/DashboardLayout";

export default function ReservacionesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

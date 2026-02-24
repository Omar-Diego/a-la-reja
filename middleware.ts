import { auth } from "@/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/reservaciones",
  "/perfil",
  "/reservar",
  "/mis_reservas",
];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Proteger rutas de usuario normal
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Proteger rutas de admin - solo admins pueden acceder
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Si está autenticado pero no es admin, redirigir a dashboard de usuario
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
    }
  }

  // Si está autenticado y va a login/register, redirigir según rol
  if (isAuthRoute && isAuthenticated) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", nextUrl.origin));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: "grid_view" },
  {
    href: "/admin/reservaciones",
    label: "Reservaciones",
    icon: "calendar_month",
  },
  { href: "/admin/usuarios", label: "Usuarios", icon: "group" },
  { href: "/admin/canchas", label: "Canchas", icon: "sports_tennis" },
];

export default function AdminNavBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-20 px-8 md:px-20 lg:px-36 justify-between items-center self-stretch bg-white shadow-sm shadow-primary">
      <div className="flex items-center gap-10 md:gap-16">
        <Link href="/admin" className="flex justify-center items-center gap-4">
          <span className="material-symbols-outlined bg-black rounded-full p-2 text-primary">
            sports_baseball
          </span>
          <span className="text-black text-2xl font-bold leading-normal font-barlow">
            A LA REJA
          </span>
          <span className="bg-secondary text-primary text-xs font-bold px-2 py-1 rounded-full">
            ADMIN
          </span>
        </Link>
        <div>
          <nav className="hidden md:flex gap-6 justify-center items-center text-black text-[1.1rem] font-semibold leading-normal font-barlow">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors ${
                    isActive
                      ? "text-primary bg-secondary"
                      : "hover:text-primary hover:bg-secondary/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* User Menu */}
        <div className="relative">
          <span
            className="material-symbols-outlined text-primary flex items-center justify-center p-2 rounded-full border-2 border-primary bg-secondary hover:border-secondary hover:bg-primary hover:text-secondary transition-colors cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Perfil de usuario"
          >
            person
          </span>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm text-gray-500">Administrador</p>
                <p className="font-semibold text-black truncate">
                  {user?.nombre || "Admin"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  logout
                </span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Button from "../ui/button";

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 flex h-20 px-36 justify-between items-center self-stretch bg-linear-to-r from-[#0F172A] to-[#090F0F]">
      <div className="flex items-center gap-16">
        <Link href="/" className="flex justify-center items-center gap-4">
          <span className="material-symbols-outlined bg-primary rounded-full p-2 text-black">
            sports_baseball
          </span>
          <span className="text-white text-2xl font-bold leading-normal font-barlow">
            A LA REJA
          </span>
        </Link>
        <div>
          <nav className="flex gap-10 justify-center items-center text-white text-[1.25rem] font-semibold leading-normal font-barlow">
            <Link href="/" className="hover:text-primary transition-colors">
              Inicio
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Reservar
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Canchas
            </Link>
          </nav>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {status === "loading" ? (
          <div className="w-24 h-10 bg-white/10 rounded-lg animate-pulse" />
        ) : session ? (
          <div className="flex items-center gap-4">
            <span className="text-white text-sm font-medium">
              Hola, {session.user?.name || session.user?.email?.split("@")[0]}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 text-sm text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all"
            >
              Cerrar Sesion
            </button>
          </div>
        ) : (
          <Link href="/login">
            <Button>Iniciar Sesion</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

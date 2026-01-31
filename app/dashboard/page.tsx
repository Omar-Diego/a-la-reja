"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] flex flex-col px-8 md:px-20 lg:px-36 py-16">
      {/* Hero Section */}
      <div className="flex flex-col gap-7 w-full mb-16">
        {/* Título y texto */}
        <div className="flex flex-col gap-5">
          <h1 className="font-barlow font-bold text-secondary text-[40px] uppercase">
            ¡HOLA, {user?.nombre || "USUARIO"}!
          </h1>
          <p className="font-inter text-[#857fa0] text-[18px]">
            ¿Listo para tu próximo partido?
          </p>
        </div>

        {/* Tarjetas de acción */}
        <div className="flex gap-8 flex-wrap">
          {/* Reservar - Tarjeta destacada */}
          <Link
            href="/reservar"
            className="bg-primary flex items-center justify-center rounded-[15px] h-26.5 flex-1 min-w-75 hover:opacity-90 transition-opacity group"
          >
            <div className="flex flex-col gap-2.5 items-center">
              <span className="material-symbols-outlined text-black text-2xl">
                add
              </span>
              <p className="font-semibold text-sm text-black">Reservar</p>
            </div>
          </Link>

          {/* Mis Reservas */}
          <Link
            href="/mis_reservas"
            className="bg-white border border-[#ededed] flex items-center justify-center rounded-[15px] h-26.5 flex-1 min-w-75 hover:bg-primary transition-colors group"
          >
            <div className="flex flex-col gap-2.5 items-center">
              <span className="material-symbols-outlined text-black text-2xl">
                calendar_month
              </span>
              <p className="font-semibold text-sm text-black">Mis Reservas</p>
            </div>
          </Link>

          {/* Partidos */}
          <Link
            href="/perfil"
            className="bg-white border border-[#ededed] flex items-center justify-center rounded-[15px] h-26.5 flex-1 min-w-75 hover:bg-primary transition-colors group"
          >
            <div className="flex flex-col gap-2.5 items-center">
              <span className="material-symbols-outlined text-black text-2xl">
                person
              </span>
              <p className="font-semibold text-sm text-black">Perfil</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Content Sections */}
      <div>
        <div className="flex flex-col lg:flex-row gap-15">
          {/* Left Column: Próximas Reservas */}
          <div className="flex-1 min-w-3/5">
            {/* Header */}
            <div className="flex justify-between items-center mb-7">
              <h2 className="font-barlow font-bold text-secondary text-xl">
                PRÓXIMAS RESERVAS
              </h2>
              <Link
                href="/mis_reservas"
                className="text-[#586777] text-sm hover:text-secondary transition-colors"
              >
                Ver todos
              </Link>
            </div>

            {/* Reservation Card */}
            <div className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center hover:shadow-md hover:border hover:border-primary transition-shadow">
              <div className="w-18.5 h-18.5 flex items-center justify-center bg-secondary rounded-lg shrink-0">
                <p className="font-barlow font-bold text-primary text-xl">
                  14:00
                </p>
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <p className="font-semibold text-sm text-black">Pista 1</p>
                <p className="text-sm text-[#64748b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    calendar_month
                  </span>
                  lun, 26 ene
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-[#64748b]">2h · €50</p>
              </div>
            </div>
          </div>

          {/* Right Column: Partidos Abiertos & Canchas */}
          <div className="flex-1 min-w-0 flex flex-col gap-7">
            {/* Nuestras Canchas */}
            <div>
              <h2 className="font-barlow font-bold text-secondary text-xl mb-7">
                NUESTRAS CANCHAS
              </h2>
              <div className="flex flex-col gap-4">
                {/* Pista 1 */}
                <div className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center">
                  <div className="w-18.5 h-18.5 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src="/images/Hero.jpg"
                      alt="Pista 1"
                      width={74}
                      height={74}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-sm text-black">Pista 1</p>
                    <p className="font-semibold text-sm text-[#7e7e7e]">
                      $25/hora
                    </p>
                    <div className="bg-[#dcfce7] px-4 py-1 rounded-full inline-block w-fit">
                      <p className="text-[#15803d] text-sm">Disponible</p>
                    </div>
                  </div>
                </div>

                {/* Pista 2 */}
                <div className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center">
                  <div className="w-18.5 h-18.5 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src="/images/Hero.jpg"
                      alt="Pista 2"
                      width={74}
                      height={74}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-sm text-black">Pista 2</p>
                    <p className="font-semibold text-sm text-[#7e7e7e]">
                      $20/hora
                    </p>
                    <div className="bg-[#dcfce7] px-4 py-1 rounded-full inline-block w-fit">
                      <p className="text-[#15803d] text-sm">Disponible</p>
                    </div>
                  </div>
                </div>

                {/* Pista Central */}
                <div className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center">
                  <div className="w-18.5 h-18.5 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                    <Image
                      src="/images/Hero.jpg"
                      alt="Pista Central"
                      width={74}
                      height={74}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <p className="font-semibold text-sm text-black">
                      Pista Central
                    </p>
                    <p className="font-semibold text-sm text-[#7e7e7e]">
                      $30/hora
                    </p>
                    <div className="bg-[#dcfce7] px-4 py-1 rounded-full inline-block w-fit">
                      <p className="text-[#15803d] text-sm">Disponible</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

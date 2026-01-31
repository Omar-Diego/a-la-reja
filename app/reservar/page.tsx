"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

const COURTS = [
  {
    id: 1,
    slug: "pista-1",
    nombre: "Pista 1",
    descripcion: "Cancha central con iluminacion LED profesional",
    precio: 25,
  },
  {
    id: 2,
    slug: "pista-2",
    nombre: "Pista 2",
    descripcion: "Cancha exterior con cesped artificial premium",
    precio: 20,
  },
  {
    id: 3,
    slug: "pista-central",
    nombre: "Pista Central",
    descripcion: "Nuestra cancha estrella para torneos y eventos",
    precio: 30,
  },
];

export default function ReservarPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center justify-center p-2 text-secondary hover:bg-primary rounded-full"
          >
            <span className="material-symbols-outlined">
              keyboard_arrow_left
            </span>
          </Link>
          <div>
            <h1 className="font-barlow font-bold text-secondary text-[32px] uppercase">
              NUEVA RESERVA
            </h1>
            <p className="text-[#64748b] text-sm">Paso 1 de 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-4 mb-12">
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
          <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full"></div>
          <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full"></div>
        </div>
      </div>

      {/* Section Title */}
      <h2 className="font-barlow font-bold text-secondary text-xl uppercase mb-8">
        SELECCIONA UNA CANCHA
      </h2>

      {/* Court Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {COURTS.map((court) => (
          <Link
            key={court.id}
            href={`/reservar/${court.slug}`}
            className="bg-white rounded-[10px] overflow-hidden hover:shadow-lg hover:border hover:border-primary transition-shadow border border-[#ededed]"
          >
            <div className="relative w-full h-50">
              <Image
                src="/images/Hero.jpg"
                alt={court.nombre}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <h3 className="font-barlow font-bold text-secondary text-lg mb-2">
                {court.nombre.toUpperCase()}
              </h3>
              <p className="text-[#64748b] text-sm mb-4">{court.descripcion}</p>
              <div className="flex justify-between items-center">
                <p className="font-bold text-secondary text-xl">
                  ${court.precio}/h
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

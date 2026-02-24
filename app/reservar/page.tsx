"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";

interface Court {
  idCancha: number;
  nombre: string;
  ubicacion: string;
  precio_por_hora: number;
  totalReservaciones: number;
}

// Función para generar slug desde nombre
const generateSlug = (nombre: string): string => {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
};

export default function ReservarPage() {
  const { isLoading } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(true);

  useEffect(() => {
    async function fetchCourts() {
      try {
        const response = await fetch(`${API_URL}/api/canchas`);
        if (!response.ok) throw new Error("Error al cargar canchas");
        const data: Court[] = await response.json();
        setCourts(data);
      } catch {
        setCourts([]);
      } finally {
        setCourtsLoading(false);
      }
    }
    fetchCourts();
  }, []);

  if (isLoading || courtsLoading) {
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
      {courts.length === 0 ? (
        <div className="bg-white border border-[#ededed] rounded-[10px] p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4 block">
            sports_tennis
          </span>
          <p className="text-[#64748b] text-lg mb-2">
            No hay canchas disponibles
          </p>
          <p className="text-[#94a3b8] text-sm">Vuelve más tarde</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <Link
              key={court.idCancha}
              href={`/reservar/${generateSlug(court.nombre)}`}
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
                <p className="text-[#64748b] text-sm mb-4">{court.ubicacion}</p>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-secondary text-xl">
                    ${court.precio_por_hora}/h
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

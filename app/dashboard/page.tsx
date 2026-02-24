"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";
import {
  Reservation,
  formatShortDate,
  isReservationUpcoming,
} from "@/app/lib/types";

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

export default function DashboardPage() {
  const { user, isLoading, getAuthHeader } = useAuth();
  const [upcomingReservations, setUpcomingReservations] = useState<
    Reservation[]
  >([]);
  const [topCourts, setTopCourts] = useState<Court[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [courtsLoading, setCourtsLoading] = useState(true);

  useEffect(() => {
    async function fetchReservations() {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        setReservationsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/reservaciones/usuario`, {
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Error al cargar reservaciones");
        const data: Reservation[] = await response.json();

        const upcoming = data.filter((r) => isReservationUpcoming(r.fecha));
        setUpcomingReservations(upcoming.slice(0, 3)); // Show max 3
      } catch {
        setUpcomingReservations([]);
      } finally {
        setReservationsLoading(false);
      }
    }
    fetchReservations();
  }, [getAuthHeader]);

  useEffect(() => {
    async function fetchTopCourts() {
      try {
        const response = await fetch(`${API_URL}/api/canchas/top`);
        if (!response.ok) throw new Error("Error al cargar canchas");
        const data: Court[] = await response.json();
        setTopCourts(data);
      } catch {
        setTopCourts([]);
      } finally {
        setCourtsLoading(false);
      }
    }
    fetchTopCourts();
  }, []);

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
        {/* Titulo y texto */}
        <div className="flex flex-col gap-5">
          <h1 className="font-barlow font-bold text-secondary text-[40px] uppercase">
            ¡HOLA, {user?.nombre || "USUARIO"}!
          </h1>
          <p className="font-inter text-[#857fa0] text-[18px]">
            ¿Listo para tu proximo partido?
          </p>
        </div>

        {/* Tarjetas de accion */}
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

          {/* Perfil */}
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
          {/* Left Column: Proximas Reservas */}
          <div className="flex-1 min-w-3/5">
            {/* Header */}
            <div className="flex justify-between items-center mb-7">
              <h2 className="font-barlow font-bold text-secondary text-xl">
                PROXIMAS RESERVAS
              </h2>
              <Link
                href="/mis_reservas"
                className="text-[#586777] text-sm hover:text-secondary transition-colors"
              >
                Ver todos
              </Link>
            </div>

            {/* Reservation Cards */}
            {reservationsLoading ? (
              <div className="bg-white border border-[#ededed] rounded-[10px] p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : upcomingReservations.length === 0 ? (
              <div className="bg-white border border-[#ededed] rounded-[10px] p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                  calendar_month
                </span>
                <p className="text-[#64748b] text-sm mb-4">
                  No tienes reservaciones proximas
                </p>
                <Link
                  href="/reservar"
                  className="text-primary font-semibold text-sm hover:underline"
                >
                  Hacer una reserva
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReservations.map((reserva) => (
                  <div
                    key={reserva.idReservacion}
                    className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center hover:shadow-md hover:border hover:border-primary transition-shadow"
                  >
                    <div className="w-18.5 h-18.5 flex items-center justify-center bg-secondary rounded-lg shrink-0">
                      <p className="font-barlow font-bold text-primary text-xl">
                        {reserva.hora_inicio.substring(0, 5)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="font-semibold text-sm text-black">
                        {reserva.cancha}
                      </p>
                      <p className="text-sm text-[#64748b] flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">
                          calendar_month
                        </span>
                        {formatShortDate(reserva.fecha)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-[#64748b]">
                        {reserva.hora_inicio.substring(0, 5)} -{" "}
                        {reserva.hora_fin.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Nuestras Canchas */}
          <div className="flex-1 min-w-0 flex flex-col gap-7">
            {/* Nuestras Canchas */}
            <div>
              <h2 className="font-barlow font-bold text-secondary text-xl mb-7">
                CANCHAS MÁS POPULARES
              </h2>

              {courtsLoading ? (
                <div className="bg-white border border-[#ededed] rounded-[10px] p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : topCourts.length === 0 ? (
                <div className="bg-white border border-[#ededed] rounded-[10px] p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                    sports_tennis
                  </span>
                  <p className="text-[#64748b] text-sm">
                    No hay canchas disponibles
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {topCourts.map((court) => (
                    <Link
                      key={court.idCancha}
                      href={`/reservar/${generateSlug(court.nombre)}`}
                      className="bg-white border border-[#ededed] rounded-[10px] p-3 flex gap-2.5 items-center hover:shadow-md hover:border-primary transition-all"
                    >
                      <div className="w-18.5 h-18.5 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                        <Image
                          src="/images/Hero.jpg"
                          alt={court.nombre}
                          width={74}
                          height={74}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <p className="font-semibold text-sm text-black">
                          {court.nombre}
                        </p>
                        <p className="font-semibold text-sm text-[#7e7e7e]">
                          ${court.precio_por_hora}/hora
                        </p>
                        <div className="bg-[#dcfce7] px-4 py-1 rounded-full inline-block w-fit">
                          <p className="text-[#15803d] text-sm">Disponible</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

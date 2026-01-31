"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Button from "@/app/components/ui/button";

export default function MisReservasPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock data para el historial
  const historialReservas = [
    {
      id: 1,
      cancha: "Pista 1",
      fecha: "lunes, 26 de enero",
      hora: "14:00",
      estado: "confirmada",
    },
    {
      id: 2,
      cancha: "Pista 1",
      fecha: "martes, 27 de enero",
      hora: "13:00",
      estado: "confirmada",
    },
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-barlow font-bold text-secondary text-[32px] uppercase">
          MIS RESERVAS
        </h1>
        <Link href="/reservar" className="flex justify-center">
          <Button variant="primary">
            <span className="material-symbols-outlined">add</span>
            Nueva Reserva
          </Button>
        </Link>
      </div>

      {/* Info Box - Modelo de Pago */}
      <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-5 mb-8">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-[#3b82f6] text-xl">
            credit_card
          </span>
          <div>
            <h3 className="font-semibold text-[#1e40af] mb-1">
              Modelo de Pago
            </h3>
            <p className="text-[#1e40af] text-sm">
              El cobro se realiza automáticamente 24 horas antes del partido. En
              partidos abiertos, cada jugador paga su parte proporcional.
              Cancelaciones con más de 24h reciben 50% de reembolso.
            </p>
          </div>
        </div>
      </div>

      {/* Próximas Reservas */}
      <div className="mb-12">
        <h2 className="font-barlow font-bold text-secondary text-xl mb-6">
          PRÓXIMAS (0)
        </h2>
        <div className="bg-white rounded-[10px] p-12 text-center border border-[#ededed]">
          <span className="material-symbols-outlined text-[#cbd5e1] text-6xl mb-4 inline-block">
            calendar_month
          </span>
          <p className="text-[#64748b] text-sm mb-6">
            No tienes reservas próximas
          </p>
          <Link href="/reservar" className="flex justify-center">
            <Button variant="primary">Hacer una reserva</Button>
          </Link>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="font-barlow font-bold text-[#94a3b8] text-xl mb-6">
          HISTORIAL ({historialReservas.length})
        </h2>
        <div className="space-y-4">
          {historialReservas.map((reserva) => (
            <div
              key={reserva.id}
              className="bg-white rounded-[10px] p-5 border border-[#ededed] flex items-center justify-between hover:shadow-md hover:border hover:border-primary transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f1f5f9] rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#64748b]">
                    location_on
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary mb-1">
                    {reserva.cancha}
                  </h3>
                  <p className="text-[#64748b] text-sm">
                    {reserva.fecha} · {reserva.hora}
                  </p>
                </div>
              </div>
              <div>
                {reserva.estado === "confirmada" ? (
                  <span className="text-[#64748b] text-sm font-medium">
                    Confirmada
                  </span>
                ) : (
                  <div className="flex items-center gap-2 bg-[#fef3c7] px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-[#f59e0b] text-sm">
                      credit_card
                    </span>
                    <span className="text-[#f59e0b] text-sm font-medium">
                      Pendiente de pago
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

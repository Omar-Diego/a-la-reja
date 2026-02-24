"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import Image from "next/image";
import { API_URL } from "@/app/lib/constants";
import { formatDateDisplay, calculateEndTime } from "@/app/lib/types";

interface ReservationData {
  fecha: string;
  hora_inicio: string;
  canchaId: number;
  cancha: string;
  canchaName?: string;
  precioPorHora?: number;
}

interface CourtInfo {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
}

export default function ConfirmarReservaPage() {
  const { isLoading, getAuthHeader } = useAuth();
  const params = useParams();
  const router = useRouter();
  const cancha = params.cancha as string;

  const [duration, setDuration] = useState<string>("1h");
  const [notas, setNotas] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationData, setReservationData] =
    useState<ReservationData | null>(null);
  const [courtInfo, setCourtInfo] = useState<CourtInfo | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("reservationData");
    if (stored) {
      const data = JSON.parse(stored) as ReservationData;
      setReservationData(data);

      // Set court info from reservation data
      setCourtInfo({
        id: data.canchaId,
        nombre: data.canchaName || cancha,
        descripcion: "",
        precio: data.precioPorHora || 25,
      });
    } else {
      router.push(`/reservar/${cancha}`);
    }
  }, [cancha, router]);

  if (isLoading || !reservationData || !courtInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const durationHours = duration === "1h" ? 1 : duration === "1.5h" ? 1.5 : 2;
  const precioTotal = courtInfo.precio * durationHours;

  const horaFin = calculateEndTime(reservationData.hora_inicio, durationHours);

  const handleConfirmar = async () => {
    setError(null);
    setIsSubmitting(true);

    const headers = getAuthHeader();
    if (!headers.Authorization) {
      setError("Debes iniciar sesion para hacer una reservacion");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reservaciones`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: reservationData.fecha,
          hora_inicio: reservationData.hora_inicio,
          hora_fin: horaFin,
          idCancha: courtInfo.id,
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        // Success - clear session storage and redirect
        sessionStorage.removeItem("reservationData");
        router.push("/mis_reservas?success=true");
      } else if (response.status === 409) {
        setError(
          "La cancha ya esta reservada en ese horario. Por favor, selecciona otro horario.",
        );
      } else if (response.status === 400) {
        setError(data.error || "Datos de reservacion invalidos");
      } else if (response.status === 401) {
        setError("Tu sesion ha expirado. Por favor, inicia sesion nuevamente.");
      } else {
        setError(data.error || "Error al crear la reservacion");
      }
    } catch {
      setError("Error de conexion. Por favor, intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/reservar/${cancha}`}
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
            <p className="text-[#64748b] text-sm">Paso 3 de 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-4 mb-12">
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-red-500">
              error
            </span>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Opciones de Reserva */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <h2 className="font-barlow font-bold text-secondary text-lg mb-6">
            OPCIONES DE RESERVA
          </h2>

          {/* Duracion */}
          <div className="mb-8">
            <p className="text-secondary font-semibold mb-4">Duracion</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDuration("1h")}
                disabled={isSubmitting}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "1h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                1h
              </button>
              <button
                onClick={() => setDuration("1.5h")}
                disabled={isSubmitting}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "1.5h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                1.5h
              </button>
              <button
                onClick={() => setDuration("2h")}
                disabled={isSubmitting}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "2h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
                  ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                2h
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <p className="text-secondary font-semibold mb-3">
              Notas (opcional)
            </p>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Anade cualquier informacion adicional..."
              disabled={isSubmitting}
              className="w-full h-24 p-4 border border-[#e2e8f0] rounded-lg text-sm resize-none focus:outline-none focus:border-primary disabled:opacity-50"
            />
          </div>
        </div>

        {/* Resumen de Reserva */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <h2 className="font-barlow font-bold text-secondary text-lg mb-6">
            RESUMEN DE RESERVA
          </h2>

          {/* Cancha Info */}
          <div className="flex gap-4 mb-6 pb-6 border-b border-[#e2e8f0]">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <Image
                src="/images/Hero.jpg"
                alt={courtInfo.nombre}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-barlow font-bold text-secondary text-lg mb-1">
                {courtInfo.nombre}
              </h3>
              <p className="text-[#64748b] text-sm">${courtInfo.precio}/hora</p>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-[#64748b]">
                calendar_month
              </span>
              <p className="text-sm">
                {formatDateDisplay(reservationData.fecha)}
              </p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-[#64748b]">
                schedule
              </span>
              <p className="text-sm">
                {reservationData.hora_inicio} - {horaFin} ({duration})
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-[#e2e8f0]">
            <p className="font-barlow font-bold text-secondary text-lg">
              Total
            </p>
            <p className="font-barlow font-bold text-secondary text-2xl">
              ${precioTotal.toFixed(2)}
            </p>
          </div>

          {/* Info */}
          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-[#3b82f6] text-xl">
                info
              </span>
              <p className="text-[#1e40af] text-sm">
                Puedes cancelar tu reserva hasta 24 horas antes sin costo.
              </p>
            </div>
          </div>

          {/* Confirmar Button */}
          <Button
            onClick={handleConfirmar}
            variant="primary"
            className="w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? (
              "Confirmando..."
            ) : (
              <>
                <span className="material-symbols-outlined">check</span>
                CONFIRMAR RESERVA
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

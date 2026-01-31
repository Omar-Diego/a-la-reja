"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Button from "@/app/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/app/lib/constants";
import { Reservation, formatShortDate, formatDateDisplay } from "@/app/lib/types";

function MisReservasContent() {
  const { isLoading, getAuthHeader } = useAuth();
  const searchParams = useSearchParams();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/mis_reservas");
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

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

        if (!response.ok) {
          throw new Error("Error al cargar reservaciones");
        }

        const data: Reservation[] = await response.json();
        setReservations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setReservationsLoading(false);
      }
    }

    fetchReservations();
  }, [getAuthHeader]);

  const handleCancel = async (idReservacion: number) => {
    if (!confirm("¿Estas seguro de que deseas cancelar esta reservacion?")) {
      return;
    }

    setCancellingId(idReservacion);
    const headers = getAuthHeader();

    try {
      const response = await fetch(
        `${API_URL}/api/reservaciones/${idReservacion}`,
        {
          method: "DELETE",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setReservations((prev) =>
          prev.filter((r) => r.idReservacion !== idReservacion),
        );
      } else {
        const data = await response.json();
        alert(data.error || "Error al cancelar la reservacion");
      }
    } catch {
      alert("Error de conexion al cancelar la reservacion");
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.fecha) >= today,
  );
  const pastReservations = reservations.filter(
    (r) => new Date(r.fecha) < today,
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3 items-center">
            <span className="material-symbols-outlined text-green-500">
              check_circle
            </span>
            <p className="text-green-700 font-medium">
              ¡Reservacion confirmada exitosamente!
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}

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
              El cobro se realiza automaticamente 24 horas antes del partido.
              Cancelaciones con mas de 24h reciben 50% de reembolso.
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center">
          <span className="material-symbols-outlined text-4xl text-red-400 mb-2 block">
            error
          </span>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-red-600 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading State */}
      {reservationsLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {!reservationsLoading && !error && (
        <>
          {/* Proximas Reservas */}
          <div className="mb-12">
            <h2 className="font-barlow font-bold text-secondary text-xl mb-6">
              PROXIMAS ({upcomingReservations.length})
            </h2>

            {upcomingReservations.length === 0 ? (
              <div className="bg-white rounded-[10px] p-12 text-center border border-[#ededed]">
                <span className="material-symbols-outlined text-[#cbd5e1] text-6xl mb-4 inline-block">
                  calendar_month
                </span>
                <p className="text-[#64748b] text-sm mb-6">
                  No tienes reservas proximas
                </p>
                <Link href="/reservar" className="flex justify-center">
                  <Button variant="primary">Hacer una reserva</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingReservations.map((reserva) => (
                  <div
                    key={reserva.idReservacion}
                    className="bg-white rounded-[10px] p-5 border border-[#ededed] flex items-center justify-between hover:shadow-md hover:border hover:border-primary transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                        <p className="font-barlow font-bold text-primary text-lg">
                          {reserva.hora_inicio.substring(0, 5)}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary mb-1">
                          {reserva.cancha}
                        </h3>
                        <p className="text-[#64748b] text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            calendar_month
                          </span>
                          {formatDateDisplay(reserva.fecha)}
                        </p>
                        <p className="text-[#64748b] text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            schedule
                          </span>
                          {reserva.hora_inicio.substring(0, 5)} -{" "}
                          {reserva.hora_fin.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="bg-[#dcfce7] text-[#15803d] text-sm font-medium px-3 py-1.5 rounded-full">
                        Confirmada
                      </span>
                      <button
                        onClick={() => handleCancel(reserva.idReservacion)}
                        disabled={cancellingId === reserva.idReservacion}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                        title="Cancelar reservacion"
                      >
                        {cancellingId === reserva.idReservacion ? (
                          <span className="animate-spin inline-block">
                            <span className="material-symbols-outlined">
                              sync
                            </span>
                          </span>
                        ) : (
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historial */}
          <div>
            <h2 className="font-barlow font-bold text-[#94a3b8] text-xl mb-6">
              HISTORIAL ({pastReservations.length})
            </h2>

            {pastReservations.length === 0 ? (
              <div className="bg-white rounded-[10px] p-8 text-center border border-[#ededed]">
                <p className="text-[#64748b] text-sm">
                  No tienes reservaciones anteriores
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastReservations.map((reserva) => (
                  <div
                    key={reserva.idReservacion}
                    className="bg-white rounded-[10px] p-5 border border-[#ededed] flex items-center justify-between opacity-70"
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
                          {formatShortDate(reserva.fecha)} ·{" "}
                          {reserva.hora_inicio.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#64748b] text-sm font-medium">
                        Completada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function MisReservasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <MisReservasContent />
    </Suspense>
  );
}

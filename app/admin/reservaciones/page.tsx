"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

interface Reservacion {
  idReservacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cancha: string;
  usuario: string;
  precio: number;
}

export default function AdminReservacionesPage() {
  const { getAuthHeader, token } = useAuth();
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState<Reservacion | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      fetchReservaciones();
    }
  }, [token]);

  const fetchReservaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reservaciones`, {
        headers: getAuthHeader(),
      });
      if (!response.ok) throw new Error("Error al cargar reservaciones");
      const data = await response.json();
      setReservaciones(data);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Error al cargar reservaciones" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/admin/reservaciones/${showDeleteModal.idReservacion}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar reservación");
      }

      setMessage({
        type: "success",
        text: "Reservación eliminada exitosamente",
      });
      setShowDeleteModal(null);
      fetchReservaciones();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al eliminar reservación",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredReservaciones = reservaciones.filter((r) => {
    const matchesSearch =
      r.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cancha.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !filterDate || r.fecha === filterDate;
    return matchesSearch && matchesDate;
  });

  const today = new Date().toISOString().split("T")[0];

  // Stats
  const reservacionesHoy = reservaciones.filter(
    (r) => r.fecha === today,
  ).length;
  const reservacionesProximas = reservaciones.filter(
    (r) => r.fecha >= today,
  ).length;
  const ingresosTotales = reservaciones.reduce(
    (acc, r) => acc + (parseFloat(String(r.precio)) || 0),
    0,
  );

  // Auto-hide messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] flex flex-col px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-gray-500 hover:text-secondary transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <h1 className="font-barlow font-bold text-secondary text-[32px] uppercase">
              Reservaciones
            </h1>
          </div>
          <p className="font-inter text-[#857fa0] text-lg">
            Administra todas las reservaciones del sistema
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-blue-500 text-2xl mb-2">
            calendar_month
          </span>
          <p className="text-2xl font-bold text-secondary">
            {reservaciones.length}
          </p>
          <p className="text-sm text-gray-500">Total Reservaciones</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-yellow-500 text-2xl mb-2">
            today
          </span>
          <p className="text-2xl font-bold text-secondary">
            {reservacionesHoy}
          </p>
          <p className="text-sm text-gray-500">Hoy</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-green-500 text-2xl mb-2">
            event_upcoming
          </span>
          <p className="text-2xl font-bold text-secondary">
            {reservacionesProximas}
          </p>
          <p className="text-sm text-gray-500">Próximas</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-purple-500 text-2xl mb-2">
            payments
          </span>
          <p className="text-2xl font-bold text-secondary">
            ${ingresosTotales}
          </p>
          <p className="text-sm text-gray-500">Ingresos Totales</p>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white border border-[#ededed] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Horario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cancha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReservaciones.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm || filterDate
                      ? "No se encontraron reservaciones con ese criterio"
                      : "No hay reservaciones registradas"}
                  </td>
                </tr>
              ) : (
                filteredReservaciones.map((reservacion) => {
                  const isUpcoming = reservacion.fecha >= today;
                  const isToday = reservacion.fecha === today;

                  return (
                    <tr
                      key={reservacion.idReservacion}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400 text-lg">
                            calendar_today
                          </span>
                          <span className="text-secondary">
                            {new Date(reservacion.fecha).toLocaleDateString(
                              "es-MX",
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {reservacion.hora_inicio.substring(0, 5)} -{" "}
                        {reservacion.hora_fin.substring(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-secondary">
                          {reservacion.cancha}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                            <span className="text-primary text-sm font-bold">
                              {reservacion.usuario.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-gray-600">
                            {reservacion.usuario}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-primary">
                          ${reservacion.precio || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isToday
                              ? "bg-yellow-100 text-yellow-800"
                              : isUpcoming
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {isToday
                            ? "Hoy"
                            : isUpcoming
                              ? "Próxima"
                              : "Completada"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setShowDeleteModal(reservacion)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar reservación"
                        >
                          <span className="material-symbols-outlined text-xl">
                            delete
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-red-500 text-3xl">
                warning
              </span>
              <h3 className="text-xl font-bold text-secondary">
                Confirmar Eliminación
              </h3>
            </div>

            <p className="text-gray-600 mb-2">
              ¿Estás seguro de que deseas eliminar esta reservación?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cancha:</span>{" "}
                {showDeleteModal.cancha}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Usuario:</span>{" "}
                {showDeleteModal.usuario}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Fecha:</span>{" "}
                {new Date(showDeleteModal.fecha).toLocaleDateString("es-MX")}
              </p>
            </div>
            <p className="text-sm text-red-600 mb-6">
              Esta acción no se puede deshacer.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

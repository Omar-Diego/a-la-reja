"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";

interface Cancha {
  idCancha: number;
  nombre: string;
  ubicacion: string;
  precio_por_hora: number;
  totalReservaciones: number;
  ingresos: number;
}

export default function AdminCanchasPage() {
  const { getAuthHeader, token } = useAuth();
  const [canchas, setCanchas] = useState<Cancha[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Cancha | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Cancha | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    ubicacion: "",
    precio_por_hora: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      fetchCanchas();
    }
  }, [token]);

  const fetchCanchas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/canchas`, {
        headers: getAuthHeader(),
      });
      if (!response.ok) throw new Error("Error al cargar canchas");
      const data = await response.json();
      setCanchas(data);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Error al cargar canchas" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.nombre || !formData.ubicacion || !formData.precio_por_hora) {
      setMessage({ type: "error", text: "Todos los campos son requeridos" });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/canchas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          ubicacion: formData.ubicacion,
          precio_por_hora: parseFloat(formData.precio_por_hora),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear cancha");
      }

      setMessage({ type: "success", text: "Cancha creada exitosamente" });
      setShowCreateModal(false);
      setFormData({ nombre: "", ubicacion: "", precio_por_hora: "" });
      fetchCanchas();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Error al crear cancha",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!showEditModal) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/canchas/${showEditModal.idCancha}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            ubicacion: formData.ubicacion,
            precio_por_hora: parseFloat(formData.precio_por_hora),
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar cancha");
      }

      setMessage({ type: "success", text: "Cancha actualizada exitosamente" });
      setShowEditModal(null);
      setFormData({ nombre: "", ubicacion: "", precio_por_hora: "" });
      fetchCanchas();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Error al actualizar cancha",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteModal) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/canchas/${showDeleteModal.idCancha}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar cancha");
      }

      setMessage({ type: "success", text: "Cancha eliminada exitosamente" });
      setShowDeleteModal(null);
      fetchCanchas();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Error al eliminar cancha",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (cancha: Cancha) => {
    setShowEditModal(cancha);
    setFormData({
      nombre: cancha.nombre,
      ubicacion: cancha.ubicacion,
      precio_por_hora: cancha.precio_por_hora.toString(),
    });
  };

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
    <div className="bg-[#f8fafc] flex flex-col px-8 md:px-20 lg:px-36 py-16 min-h-screen">
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
              Gestión de Canchas
            </h1>
          </div>
          <p className="font-inter text-[#857fa0] text-lg">
            {canchas.length} canchas configuradas
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({ nombre: "", ubicacion: "", precio_por_hora: "" });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 bg-primary text-black font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva Cancha
        </button>
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

      {/* Courts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canchas.length === 0 ? (
          <div className="col-span-full bg-white border border-[#ededed] rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
              sports_tennis
            </span>
            <p className="text-gray-500">No hay canchas registradas</p>
          </div>
        ) : (
          canchas.map((cancha) => (
            <div
              key={cancha.idCancha}
              className="bg-white border border-[#ededed] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Imagen de cancha */}
              <div className="h-44 relative">
                <Image
                  src="/images/Hero.jpg"
                  alt={cancha.nombre}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent"></div>
                <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-3xl drop-shadow-lg">
                  sports_tennis
                </span>
              </div>

              {/* Contenido */}
              <div className="p-5">
                {/* Header con nombre y precio */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-barlow font-bold text-xl text-secondary">
                      {cancha.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{cancha.ubicacion}</p>
                  </div>
                  <span className="bg-primary text-black text-sm font-bold px-3 py-1 rounded-full">
                    ${cancha.precio_por_hora}/h
                  </span>
                </div>

                {/* Estadísticas */}
                <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Reservaciones</p>
                    <p className="text-lg font-bold text-secondary">
                      {cancha.totalReservaciones}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ingresos</p>
                    <p className="text-lg font-bold text-primary">
                      ${cancha.ingresos}
                    </p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(cancha)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">
                      edit
                    </span>
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(cancha)}
                    className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">
                add_circle
              </span>
              <h3 className="text-xl font-bold text-secondary">Nueva Cancha</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Pista 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción/Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Cancha central con iluminación LED"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por hora ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio_por_hora}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio_por_hora: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: 25"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {actionLoading ? "Creando..." : "Crear Cancha"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-blue-500 text-3xl">
                edit
              </span>
              <h3 className="text-xl font-bold text-secondary">
                Editar Cancha
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción/Ubicación
                </label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio por hora ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.precio_por_hora}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precio_por_hora: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

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
              ¿Estás seguro de que deseas eliminar la cancha{" "}
              <strong>{showDeleteModal.nombre}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Esta acción eliminará también todas las reservaciones asociadas y
              no se puede deshacer.
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

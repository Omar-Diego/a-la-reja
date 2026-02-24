"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string | null;
  totalReservaciones: number;
}

export default function AdminUsuariosPage() {
  const { getAuthHeader, token } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState<Usuario | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (token) {
      fetchUsuarios();
    }
  }, [token]);

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/usuarios`, {
        headers: getAuthHeader(),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[AdminUsuarios] Error response:", errorData);
        throw new Error("Error al cargar usuarios");
      }
      const data = await response.json();
      console.log("[AdminUsuarios] Users fetched successfully:", data.length);
      setUsuarios(data);
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Error al cargar usuarios" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setEditForm({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/usuarios/${editingUser.idUsuario}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify(editForm),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar usuario");
      }

      setMessage({ type: "success", text: "Usuario actualizado exitosamente" });
      setEditingUser(null);
      fetchUsuarios();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Error al actualizar usuario",
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
        `${API_URL}/api/usuarios/${showDeleteModal.idUsuario}`,
        {
          method: "DELETE",
          headers: getAuthHeader(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar usuario");
      }

      setMessage({ type: "success", text: "Usuario eliminado exitosamente" });
      setShowDeleteModal(null);
      fetchUsuarios();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Error al eliminar usuario",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
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
              Gestionar Usuarios
            </h1>
          </div>
          <p className="font-inter text-[#857fa0] text-lg">
            Administra los usuarios registrados en el sistema
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar usuarios..."
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-blue-500 text-2xl mb-2">
            group
          </span>
          <p className="text-2xl font-bold text-secondary">{usuarios.length}</p>
          <p className="text-sm text-gray-500">Total Usuarios</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-green-500 text-2xl mb-2">
            calendar_month
          </span>
          <p className="text-2xl font-bold text-secondary">
            {usuarios.reduce((acc, u) => acc + u.totalReservaciones, 0)}
          </p>
          <p className="text-sm text-gray-500">Total Reservaciones</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-purple-500 text-2xl mb-2">
            trending_up
          </span>
          <p className="text-2xl font-bold text-secondary">
            {usuarios.filter((u) => u.totalReservaciones > 0).length}
          </p>
          <p className="text-sm text-gray-500">Usuarios Activos</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#ededed] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reservaciones
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsuarios.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No se encontraron usuarios con ese criterio"
                      : "No hay usuarios registrados"}
                  </td>
                </tr>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <tr
                    key={usuario.idUsuario}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold">
                            {usuario.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-secondary">
                          {usuario.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{usuario.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {usuario.telefono || (
                        <span className="text-gray-400 italic">
                          No registrado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          usuario.totalReservaciones > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {usuario.totalReservaciones}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar usuario"
                        >
                          <span className="material-symbols-outlined text-xl">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(usuario)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <span className="material-symbols-outlined text-xl">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-secondary mb-4">
              Editar Usuario
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) =>
                    setEditForm({ ...editForm, telefono: e.target.value })
                  }
                  placeholder="Opcional"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={actionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {actionLoading ? "Guardando..." : "Guardar"}
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
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <span className="font-semibold">{showDeleteModal.nombre}</span>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              Esta acción eliminará también todas sus reservaciones y no se
              puede deshacer.
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

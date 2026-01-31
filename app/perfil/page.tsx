"use client";

import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import { useState, useEffect } from "react";
import { API_URL } from "@/app/lib/constants";
import { formatShortDate } from "@/app/lib/types";

interface UserProfile {
  idUsuario: number;
  nombre: string;
  email: string;
  telefono: string | null;
}

interface UserStats {
  total: number;
  completed: number;
  upcoming: number;
}

interface ActivityItem {
  idReservacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cancha: string;
  status: "upcoming" | "completed";
}

export default function PerfilPage() {
  const { user, isLoading, getAuthHeader, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ total: 0, completed: 0, upcoming: 0 });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        setDataLoading(false);
        return;
      }

      try {
        // Fetch profile data
        const profileRes = await fetch(`${API_URL}/api/usuarios/me`, {
          headers: { ...headers, "Content-Type": "application/json" },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setEditNombre(profileData.nombre);
          setEditTelefono(profileData.telefono || "");
        } else {
          const errorData = await profileRes.json().catch(() => ({}));
          console.error("Profile fetch error:", profileRes.status, errorData);
          setFetchError(`Error al cargar perfil: ${errorData.error || profileRes.statusText}`);
        }

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/api/usuarios/me/stats`, {
          headers: { ...headers, "Content-Type": "application/json" },
        });

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          console.error("Stats fetch error:", statsRes.status);
        }

        // Fetch activity
        const activityRes = await fetch(`${API_URL}/api/usuarios/me/activity`, {
          headers: { ...headers, "Content-Type": "application/json" },
        });

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivity(activityData);
        } else {
          console.error("Activity fetch error:", activityRes.status);
        }
      } catch (err) {
        console.error("Profile data fetch error:", err);
        setFetchError("Error de conexion al servidor");
      } finally {
        setDataLoading(false);
      }
    }

    fetchProfileData();
  }, [getAuthHeader]);

  const handleEditClick = () => {
    setEditNombre(profile?.nombre || user?.nombre || "");
    setEditTelefono(profile?.telefono || "");
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSaveProfile = async () => {
    const headers = getAuthHeader();
    if (!headers.Authorization) return;

    setSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`${API_URL}/api/usuarios/me`, {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          telefono: editTelefono.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        updateUser({
          nombre: data.user.nombre,
          telefono: data.user.telefono,
        });
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || "Error al guardar los cambios");
      }
    } catch {
      setSaveError("Error de conexion. Intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayNombre = profile?.nombre || user?.nombre || "Usuario";
  const displayEmail = profile?.email || user?.email || "No especificado";
  const displayTelefono = profile?.telefono;

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <h1 className="font-barlow font-bold text-secondary text-[32px] uppercase mb-8">
        MI PERFIL
      </h1>

      {/* Fetch Error Display */}
      {fetchError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            <span>{fetchError}</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-[10px] border border-[#ededed]">
          {/* Card Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#ededed]">
            <h2 className="font-barlow font-bold text-secondary text-lg">
              INFORMACION PERSONAL
            </h2>
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 text-[#64748b] hover:text-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
                <span className="text-sm font-medium">Editar</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1 text-[#64748b] hover:text-secondary transition-colors text-sm px-3 py-1 rounded-lg border border-[#ededed]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 bg-primary text-secondary text-sm font-medium px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="animate-spin material-symbols-outlined text-sm">
                      sync
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">
                      check
                    </span>
                  )}
                  Guardar
                </button>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Error Message */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
                {saveError}
              </div>
            )}

            {/* Avatar and Name */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-gray-200">
                <Image
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    displayNombre,
                  )}&background=60A5FA&color=fff&size=80`}
                  alt={displayNombre}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-secondary text-xl mb-2">
                  {displayNombre}
                </h3>
                <span className="bg-[#1e293b] text-white text-xs px-3 py-1 rounded-full">
                  Jugador
                </span>
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-6">
              {/* Nombre */}
              <div>
                <div className="flex items-center gap-2 text-[#64748b] mb-2">
                  <span className="material-symbols-outlined text-xl">
                    person
                  </span>
                  <label className="text-sm font-medium">Nombre</label>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    className="ml-8 w-[calc(100%-2rem)] px-3 py-2 border border-[#e2e8f0] rounded-lg text-secondary focus:outline-none focus:border-primary"
                    placeholder="Tu nombre"
                  />
                ) : (
                  <p className="text-secondary font-medium ml-8">
                    {displayNombre}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 text-[#64748b] mb-2">
                  <span className="material-symbols-outlined text-xl">
                    mail
                  </span>
                  <label className="text-sm font-medium">Email</label>
                </div>
                <p className="text-secondary font-medium ml-8">
                  {displayEmail}
                </p>
                <p className="text-[#94a3b8] text-xs ml-8 mt-1">
                  El email no se puede modificar
                </p>
              </div>

              {/* Teléfono */}
              <div>
                <div className="flex items-center gap-2 text-[#64748b] mb-2">
                  <span className="material-symbols-outlined text-xl">
                    call
                  </span>
                  <label className="text-sm font-medium">Telefono</label>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="ml-8 w-[calc(100%-2rem)] px-3 py-2 border border-[#e2e8f0] rounded-lg text-secondary focus:outline-none focus:border-primary"
                    placeholder="+52 123 456 7890"
                  />
                ) : (
                  <p className={`ml-8 ${displayTelefono ? "text-secondary font-medium" : "text-[#94a3b8]"}`}>
                    {displayTelefono || "No especificado"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="flex flex-col gap-6">
          {/* Estadisticas */}
          <div className="bg-white rounded-[10px] border border-[#ededed] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">
                  emoji_events
                </span>
              </span>
              <h2 className="font-barlow font-bold text-secondary text-lg">
                ESTADISTICAS
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Reservas Totales */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">
                  {stats.total}
                </p>
                <p className="text-[#64748b] text-sm">Reservas Totales</p>
              </div>

              {/* Completadas */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">
                  {stats.completed}
                </p>
                <p className="text-[#64748b] text-sm">Completadas</p>
              </div>

              {/* Proximas */}
              <div className="bg-[#dcfce7] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">
                  {stats.upcoming}
                </p>
                <p className="text-[#64748b] text-sm">Proximas</p>
              </div>

              {/* Partidos Jugados */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">
                  {stats.completed}
                </p>
                <p className="text-[#64748b] text-sm">Partidos Jugados</p>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-white rounded-[10px] border border-[#ededed] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-secondary text-2xl">
                calendar_month
              </span>
              <h2 className="font-barlow font-bold text-secondary text-lg">
                ACTIVIDAD RECIENTE
              </h2>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-6">
                <span className="material-symbols-outlined text-4xl text-[#cbd5e1] mb-2 block">
                  event_busy
                </span>
                <p className="text-[#64748b] text-sm">
                  No hay actividad reciente
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div
                    key={item.idReservacion}
                    className="flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-secondary text-sm">
                        {item.cancha}
                      </p>
                      <p className="text-[#64748b] text-xs">
                        {formatShortDate(item.fecha)} · {item.hora_inicio.substring(0, 5)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-md ${
                        item.status === "upcoming"
                          ? "bg-primary text-secondary"
                          : "bg-[#f1f5f9] text-[#64748b]"
                      }`}
                    >
                      {item.status === "upcoming" ? "Confirmada" : "Completada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

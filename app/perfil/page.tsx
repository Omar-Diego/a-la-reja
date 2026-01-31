"use client";

import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";

export default function PerfilPage() {
  const { user, isLoading } = useAuth();

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
      <h1 className="font-barlow font-bold text-secondary text-[32px] uppercase mb-8">
        MI PERFIL
      </h1>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-[10px] border border-[#ededed]">
          {/* Card Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#ededed]">
            <h2 className="font-barlow font-bold text-secondary text-lg">
              INFORMACIÓN PERSONAL
            </h2>
            <button className="flex items-center gap-2 text-[#64748b] hover:text-secondary transition-colors">
              <span className="material-symbols-outlined text-xl">edit</span>
              <span className="text-sm font-medium">Editar</span>
            </button>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 bg-gray-200">
                <Image
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.nombre || "Usuario",
                  )}&background=60A5FA&color=fff&size=80`}
                  alt={user?.nombre || "Usuario"}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-secondary text-xl mb-2">
                  {user?.nombre || "Usuario"}
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
                <p className="text-secondary font-medium ml-8">
                  {user?.nombre || "No especificado"}
                </p>
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
                  {user?.email || "No especificado"}
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
                  <label className="text-sm font-medium">Teléfono</label>
                </div>
                <p className="text-[#94a3b8] ml-8">No especificado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Activity */}
        <div className="flex flex-col gap-6">
          {/* Estadísticas */}
          <div className="bg-white rounded-[10px] border border-[#ededed] p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-secondary rounded-full w-10 h-10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">
                  emoji_events
                </span>
              </span>
              <h2 className="font-barlow font-bold text-secondary text-lg">
                ESTADÍSTICAS
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Reservas Totales */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">5</p>
                <p className="text-[#64748b] text-sm">Reservas Totales</p>
              </div>

              {/* Completadas */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">5</p>
                <p className="text-[#64748b] text-sm">Completadas</p>
              </div>

              {/* Canceladas */}
              <div className="bg-[#f8fafc] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">2</p>
                <p className="text-[#64748b] text-sm">Canceladas</p>
              </div>

              {/* Partidos */}
              <div className="bg-[#dcfce7] rounded-lg p-4 text-center">
                <p className="font-bold text-secondary text-3xl mb-1">5</p>
                <p className="text-[#64748b] text-sm">Partidos</p>
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

            <div className="space-y-4">
              {/* Reserva 1 */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-secondary text-sm">
                    Reserva
                  </p>
                  <p className="text-[#64748b] text-xs">26 ene 2026</p>
                </div>
                <span className="bg-primary text-secondary text-xs font-semibold px-3 py-1 rounded-md">
                  Confirmada
                </span>
              </div>

              {/* Reserva 2 */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-secondary text-sm">
                    Reserva
                  </p>
                  <p className="text-[#64748b] text-xs">30 ene 2026</p>
                </div>
                <span className="bg-white text-secondary border-2 border-primary text-xs font-semibold px-3 py-1 rounded-md">
                  Cancelada
                </span>
              </div>

              {/* Reserva 3 */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-secondary text-sm">
                    Reserva
                  </p>
                  <p className="text-[#64748b] text-xs">29 ene 2026</p>
                </div>
                <span className="bg-white text-secondary border-2 border-primary text-xs font-semibold px-3 py-1 rounded-md">
                  Cancelada
                </span>
              </div>

              {/* Reserva 4 */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-secondary text-sm">
                    Reserva
                  </p>
                  <p className="text-[#64748b] text-xs">27 ene 2026</p>
                </div>
                <span className="bg-primary text-secondary text-xs font-semibold px-3 py-1 rounded-md">
                  Confirmada
                </span>
              </div>

              {/* Reserva 5 */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-secondary text-sm">
                    Reserva
                  </p>
                  <p className="text-[#64748b] text-xs">26 ene 2026</p>
                </div>
                <span className="bg-primary text-secondary text-xs font-semibold px-3 py-1 rounded-md">
                  Confirmada
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

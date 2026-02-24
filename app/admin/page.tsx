"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { API_URL } from "@/app/lib/constants";

interface AdminStats {
  ingresosMes: number;
  reservacionesHoy: number;
  reservacionesSemana: number;
  totalUsuarios: number;
  totalReservaciones: number;
  canchasActivas: number;
}

interface Reservacion {
  idReservacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cancha: string;
  usuario: string;
  precio: number;
  CANCHAS_idCancha?: number;
}

interface ReservacionPorCancha {
  cancha: string;
  total: number;
}

// Colores para las canchas
const CANCHA_COLORS: { [key: string]: string } = {
  "Pista 1": "#3B82F6", // blue
  "Pista 2": "#22C55E", // green
  "Pista Central": "#A855F7", // purple
  "Pista 3": "#F59E0B", // amber
  "Pista 4": "#EF4444", // red
  "Pista 5": "#06B6D4", // cyan
};

const getCanchaColor = (canchaName: string): string => {
  return CANCHA_COLORS[canchaName] || "#6B7280"; // default gray
};

export default function AdminDashboardPage() {
  const { isLoading, getAuthHeader, token } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    ingresosMes: 0,
    reservacionesHoy: 0,
    reservacionesSemana: 0,
    totalUsuarios: 0,
    totalReservaciones: 0,
    canchasActivas: 0,
  });
  const [allReservaciones, setAllReservaciones] = useState<Reservacion[]>([]);
  const [latestReservaciones, setLatestReservaciones] = useState<Reservacion[]>(
    [],
  );
  const [reservacionesPorCancha, setReservacionesPorCancha] = useState<
    ReservacionPorCancha[]
  >([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdminData() {
      if (!token) return; // Wait for token to be available

      try {
        // Fetch all data in parallel
        const authHeaders = getAuthHeader();
        const [usuariosRes, reservacionesRes, canchasRes] = await Promise.all([
          fetch(`${API_URL}/api/usuarios`, { headers: authHeaders }),
          fetch(`${API_URL}/api/reservaciones`, { headers: authHeaders }),
          fetch(`${API_URL}/api/canchas`, { headers: authHeaders }),
        ]);

        const usuarios = await usuariosRes.json();
        const reservacionesData = await reservacionesRes.json();
        const canchasData = await canchasRes.json();

        // Ensure data is in array format
        const reservacionesArray = Array.isArray(reservacionesData)
          ? reservacionesData
          : [];
        const usuariosArray = Array.isArray(usuarios) ? usuarios : [];
        const canchasArray = Array.isArray(canchasData) ? canchasData : [];

        setAllReservaciones(reservacionesArray);

        // Calculate stats
        const today = new Date().toISOString().split("T")[0];
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split("T")[0];

        const monthStart = new Date();
        monthStart.setDate(1);
        const monthStartStr = monthStart.toISOString().split("T")[0];

        const reservacionesHoy = reservacionesArray.filter(
          (r: Reservacion) => r.fecha === today,
        ).length;

        const reservacionesSemana = reservacionesArray.filter(
          (r: Reservacion) => r.fecha >= weekStartStr,
        ).length;

        // Calculate income for current month
        const reservacionesMes = reservacionesArray.filter(
          (r: Reservacion) => r.fecha >= monthStartStr,
        );
        const ingresosMes = reservacionesMes.reduce(
          (acc: number, r: Reservacion) =>
            acc + (parseFloat(String(r.precio)) || 0),
          0,
        );

        // Calculate reservations per court
        const porCancha: { [key: string]: number } = {};
        reservacionesArray.forEach((r: Reservacion) => {
          porCancha[r.cancha] = (porCancha[r.cancha] || 0) + 1;
        });
        const reservacionesPorCanchaArr = Object.entries(porCancha).map(
          ([cancha, total]) => ({ cancha, total }),
        );

        setStats({
          ingresosMes,
          reservacionesHoy,
          reservacionesSemana,
          totalUsuarios: usuariosArray.length,
          totalReservaciones: reservacionesArray.length,
          canchasActivas: canchasArray.length,
        });

        // Get latest reservations with upcoming ones first
        const sortedReservaciones = [...reservacionesArray]
          .sort((a: Reservacion, b: Reservacion) => {
            if (a.fecha > today && b.fecha <= today) return -1;
            if (b.fecha > today && a.fecha <= today) return 1;
            return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
          })
          .slice(0, 5);

        setLatestReservaciones(sortedReservaciones);
        setReservacionesPorCancha(reservacionesPorCanchaArr);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setFetchError(
          "Error al cargar los datos del panel. Intenta recargar la página.",
        );
      } finally {
        setStatsLoading(false);
      }
    }

    fetchAdminData();
  }, [token, getAuthHeader]);

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: {
      day: number;
      isCurrentMonth: boolean;
      reservations: Reservacion[];
      isToday: boolean;
      dateStr: string;
    }[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonth = month === 0 ? 12 : month;
    const prevYear = month === 0 ? year - 1 : year;
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      days.push({
        day: dayNum,
        isCurrentMonth: false,
        reservations: [],
        isToday: false,
        dateStr,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayReservations = allReservaciones.filter(
        (r) => r.fecha === dateStr,
      );
      const isToday =
        today.getDate() === i &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      days.push({
        day: i,
        isCurrentMonth: true,
        reservations: dayReservations,
        isToday,
        dateStr,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    const nextMonth = month === 11 ? 1 : month + 2;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remainingDays; i++) {
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({
        day: i,
        isCurrentMonth: false,
        reservations: [],
        isToday: false,
        dateStr,
      });
    }

    return days;
  }, [currentMonth, allReservaciones]);

  // Get reservations for selected date
  const selectedDateReservations = useMemo(() => {
    if (!selectedDate) return [];
    return allReservaciones
      .filter((r) => r.fecha === selectedDate)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }, [selectedDate, allReservaciones]);

  // Format selected date for display
  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    return date.toLocaleDateString("es-MX", options);
  };

  // Get unique canchas for legend
  const uniqueCanchas = useMemo(() => {
    const canchasSet = new Set(allReservaciones.map((r) => r.cancha));
    return Array.from(canchasSet);
  }, [allReservaciones]);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-full px-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl text-center max-w-md">
          <span className="material-symbols-outlined text-3xl mb-2 block">
            error
          </span>
          <p className="font-semibold mb-1">Error al cargar el panel</p>
          <p className="text-sm">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] flex flex-col px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="font-barlow font-bold text-secondary text-[40px] uppercase">
          ¡HOLA, ADMINISTRADOR!
        </h1>
        <p className="font-inter text-[#857fa0] text-lg">
          Panel de Administración
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/admin/reservaciones"
          className="bg-primary flex items-center justify-center rounded-2xl h-28 hover:opacity-90 transition-opacity group"
        >
          <div className="flex flex-col gap-2 items-center">
            <span className="material-symbols-outlined text-black text-3xl">
              calendar_month
            </span>
            <p className="font-semibold text-sm text-black">
              Ver Reservaciones
            </p>
          </div>
        </Link>

        <Link
          href="/admin/usuarios"
          className="bg-white border border-[#ededed] flex items-center justify-center rounded-2xl h-28 hover:border-primary transition-colors group"
        >
          <div className="flex flex-col gap-2 items-center">
            <span className="material-symbols-outlined text-secondary text-3xl">
              group
            </span>
            <p className="font-semibold text-sm text-black">
              Gestionar Usuarios
            </p>
          </div>
        </Link>

        <Link
          href="/admin/canchas"
          className="bg-white border border-[#ededed] flex items-center justify-center rounded-2xl h-28 hover:border-primary transition-colors group"
        >
          <div className="flex flex-col gap-2 items-center">
            <span className="material-symbols-outlined text-secondary text-3xl">
              sports_tennis
            </span>
            <p className="font-semibold text-sm text-black">
              Gestionar Canchas
            </p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-green-500 text-2xl mb-2">
            payments
          </span>
          <p className="text-2xl font-bold text-secondary">
            ${stats.ingresosMes}
          </p>
          <p className="text-sm text-gray-500">Ingresos del Mes</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-yellow-500 text-2xl mb-2">
            event_available
          </span>
          <p className="text-2xl font-bold text-secondary">
            {stats.reservacionesHoy}
          </p>
          <p className="text-sm text-gray-500">Reservaciones Hoy</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-blue-500 text-2xl mb-2">
            date_range
          </span>
          <p className="text-2xl font-bold text-secondary">
            {stats.reservacionesSemana}
          </p>
          <p className="text-sm text-gray-500">Esta Semana</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-cyan-500 text-2xl mb-2">
            group
          </span>
          <p className="text-2xl font-bold text-secondary">
            {stats.totalUsuarios}
          </p>
          <p className="text-sm text-gray-500">Total Usuarios</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-orange-500 text-2xl mb-2">
            calendar_month
          </span>
          <p className="text-2xl font-bold text-secondary">
            {stats.totalReservaciones}
          </p>
          <p className="text-sm text-gray-500">Total Reservaciones</p>
        </div>

        <div className="bg-white border border-[#ededed] rounded-xl p-4">
          <span className="material-symbols-outlined text-purple-500 text-2xl mb-2">
            sports_tennis
          </span>
          <p className="text-2xl font-bold text-secondary">
            {stats.canchasActivas}
          </p>
          <p className="text-sm text-gray-500">Canchas Activas</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div
          className={`bg-white border border-[#ededed] rounded-xl p-6 ${selectedDate ? "lg:col-span-2" : "lg:col-span-2"}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-barlow font-bold text-secondary text-lg uppercase">
              Calendario de Reservaciones
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">
                  chevron_left
                </span>
              </button>
              <span className="font-medium text-secondary min-w-40 text-center">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">
                  chevron_right
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Calendar Grid */}
            <div className={`${selectedDate ? "flex-1" : "flex-1"}`}>
              <div className="grid grid-cols-7 gap-1">
                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ),
                )}
                {calendarDays.map((dayInfo, index) => {
                  const uniqueCanchasInDay = [
                    ...new Set(dayInfo.reservations.map((r) => r.cancha)),
                  ];
                  const hasReservations = dayInfo.reservations.length > 0;
                  const isSelected = selectedDate === dayInfo.dateStr;

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (dayInfo.isCurrentMonth) {
                          setSelectedDate(isSelected ? null : dayInfo.dateStr);
                        }
                      }}
                      className={`text-center py-3 rounded-lg relative cursor-pointer transition-colors ${
                        dayInfo.isCurrentMonth
                          ? dayInfo.isToday
                            ? "bg-primary/20 border-2 border-primary font-bold"
                            : isSelected
                              ? "bg-primary/10 border-2 border-primary/50"
                              : "hover:bg-gray-50"
                          : "text-gray-300 cursor-default"
                      }`}
                      disabled={!dayInfo.isCurrentMonth}
                    >
                      {dayInfo.day}
                      {hasReservations && dayInfo.isCurrentMonth && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {uniqueCanchasInDay.slice(0, 3).map((cancha, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: getCanchaColor(cancha),
                              }}
                            ></span>
                          ))}
                          {dayInfo.reservations.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                              {dayInfo.reservations.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Canchas:</span>
                {uniqueCanchas.map((cancha) => (
                  <div key={cancha} className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getCanchaColor(cancha) }}
                    ></span>
                    <span className="text-sm text-gray-600">{cancha}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Date Panel */}
            {selectedDate && (
              <div className="w-64 border-l border-gray-100 pl-4">
                <h3 className="font-semibold text-secondary mb-4">
                  {formatSelectedDate(selectedDate)}
                </h3>

                {selectedDateReservations.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No hay reservaciones para este día
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateReservations.map((reservacion) => (
                      <div
                        key={reservacion.idReservacion}
                        className="border-l-4 pl-3 py-1"
                        style={{
                          borderColor: getCanchaColor(reservacion.cancha),
                        }}
                      >
                        <p className="text-sm text-gray-600">
                          {reservacion.hora_inicio.substring(0, 5)} -{" "}
                          {reservacion.hora_fin.substring(0, 5)}
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: getCanchaColor(reservacion.cancha) }}
                        >
                          {reservacion.cancha}
                        </p>
                        <p className="text-sm text-gray-500">
                          {reservacion.usuario}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Latest Transactions */}
          <div className="bg-white border border-[#ededed] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-barlow font-bold text-secondary text-lg uppercase">
                Últimas Transacciones
              </h2>
              <Link
                href="/admin/reservaciones"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Ver todas
              </Link>
            </div>

            <div className="space-y-3">
              {latestReservaciones.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No hay transacciones recientes
                </p>
              ) : (
                latestReservaciones.slice(0, 3).map((reservacion) => {
                  const isUpcoming =
                    reservacion.fecha >= new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={reservacion.idReservacion}
                      className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-secondary text-sm">
                          {reservacion.usuario}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reservacion.cancha}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(reservacion.fecha).toLocaleDateString(
                            "es-MX",
                            {
                              day: "numeric",
                              month: "short",
                            },
                          )}{" "}
                          • {reservacion.hora_inicio.substring(0, 5)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-sm">
                          ${reservacion.precio || 0}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            isUpcoming
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isUpcoming ? "Próxima" : "Completada"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Stats per Court */}
          <div className="bg-white border border-[#ededed] rounded-xl p-6">
            <h2 className="font-barlow font-bold text-secondary text-lg uppercase mb-4">
              Estadísticas
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Reservaciones por cancha
            </p>

            <div className="space-y-3">
              {reservacionesPorCancha.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No hay estadísticas disponibles
                </p>
              ) : (
                reservacionesPorCancha.map((item) => {
                  const maxTotal = Math.max(
                    ...reservacionesPorCancha.map((r) => r.total),
                  );
                  const percentage =
                    maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;

                  return (
                    <div key={item.cancha}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-secondary">
                          {item.cancha}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.total}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

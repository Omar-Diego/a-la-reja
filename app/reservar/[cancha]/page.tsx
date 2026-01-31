"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import { API_URL } from "@/app/lib/constants";
import {
  BookedSlot,
  getCourtIdFromSlug,
  formatDateToISO,
  formatDateDisplay,
  isTimeSlotBooked,
  isDateInPast,
  isTimeInPastForToday,
} from "@/app/lib/types";

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  disabled: boolean;
}

export default function SeleccionarFechaPage() {
  const { isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const cancha = params.cancha as string;
  const canchaId = getCourtIdFromSlug(cancha);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const allTimeSlots = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ];

  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        disabled: true,
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        day,
        isCurrentMonth: true,
        disabled: isDateInPast(date),
      });
    }

    const remainingDays = 42 - days.length; // 6 rows x 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        disabled: true,
      });
    }

    return days;
  }, [currentMonth]);

  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDate) return;

    setSlotsLoading(true);
    try {
      const dateStr = formatDateToISO(selectedDate);
      const response = await fetch(
        `${API_URL}/api/reservaciones?fecha=${dateStr}&canchaId=${canchaId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setBookedSlots(data);
      }
    } catch {
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [selectedDate, canchaId]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  const isSlotAvailable = useCallback(
    (time: string): boolean => {
      if (!selectedDate) return true;

      if (isTimeInPastForToday(time, selectedDate)) return false;

      return !isTimeSlotBooked(time, bookedSlots);
    },
    [selectedDate, bookedSlots],
  );

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    const today = new Date();
    if (
      newMonth.getFullYear() > today.getFullYear() ||
      (newMonth.getFullYear() === today.getFullYear() &&
        newMonth.getMonth() >= today.getMonth())
    ) {
      setCurrentMonth(newMonth);
    }
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    const maxMonth = new Date();
    maxMonth.setMonth(maxMonth.getMonth() + 3);
    if (newMonth <= maxMonth) {
      setCurrentMonth(newMonth);
    }
  };

  const handleDateSelect = (calendarDay: CalendarDay) => {
    if (calendarDay.disabled) return;
    setSelectedDate(calendarDay.date);
    setSelectedTime(null);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;

    sessionStorage.setItem(
      "reservationData",
      JSON.stringify({
        fecha: formatDateToISO(selectedDate),
        hora_inicio: selectedTime,
        canchaId,
        cancha,
      }),
    );

    router.push(`/reservar/${cancha}/confirmar`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const daysOfWeek = ["lu", "ma", "mi", "ju", "vi", "sa", "do"];
  const monthNames = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return (
    <div className="bg-[#f8fafc] min-h-screen px-8 md:px-20 lg:px-36 py-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/reservar"
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
            <p className="text-[#64748b] text-sm">Paso 2 de 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-4 mb-12">
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
          <div className="flex-1 h-2 bg-primary rounded-full"></div>
          <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seleccionar Fecha */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <h2 className="font-barlow font-bold text-secondary text-lg mb-6">
            SELECCIONA FECHA
          </h2>

          {/* Calendar */}
          <div className="mb-6">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={goToPreviousMonth}
                className="flex items-center justify-center material-symbols-outlined text-secondary p-2 hover:bg-primary rounded-full cursor-pointer"
              >
                chevron_left
              </button>
              <p className="font-semibold text-secondary">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </p>
              <button
                onClick={goToNextMonth}
                className="flex items-center justify-center material-symbols-outlined text-secondary p-2 hover:bg-primary rounded-full cursor-pointer"
              >
                chevron_right
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 mb-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="flex items-center justify-center h-10 text-[#64748b] text-sm font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((item, index) => {
                const isSelected =
                  selectedDate &&
                  item.date.toDateString() === selectedDate.toDateString();
                return (
                  <div
                    key={index}
                    className="flex items-center justify-center p-1"
                  >
                    <button
                      onClick={() => handleDateSelect(item)}
                      disabled={item.disabled}
                      className={`
                        h-9 w-9 flex items-center justify-center rounded-lg text-sm transition-colors
                        ${!item.isCurrentMonth ? "text-[#cbd5e1]" : ""}
                        ${item.disabled ? "text-[#cbd5e1] cursor-not-allowed" : "text-secondary hover:bg-primary"}
                        ${isSelected ? "bg-secondary text-white hover:bg-secondary" : ""}
                      `}
                    >
                      {item.day}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Seleccionar Horario */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <div className="mb-6">
            <h2 className="font-barlow font-bold text-secondary text-lg mb-2">
              SELECCIONA HORARIO
            </h2>
            <p className="text-[#64748b] text-sm">
              {selectedDate
                ? formatDateDisplay(formatDateToISO(selectedDate))
                : "Selecciona una fecha primero"}
            </p>
          </div>

          {/* Time Slots Grid */}
          {!selectedDate ? (
            <div className="flex items-center justify-center py-12 text-[#64748b]">
              <span className="material-symbols-outlined mr-2">
                calendar_month
              </span>
              Selecciona una fecha para ver horarios disponibles
            </div>
          ) : slotsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {allTimeSlots.map((time) => {
                  const available = isSlotAvailable(time);
                  return (
                    <button
                      key={time}
                      onClick={() => available && setSelectedTime(time)}
                      disabled={!available}
                      className={`
                        py-3 px-4 rounded-lg text-sm font-medium border transition-all
                        ${
                          !available
                            ? "bg-[#f1f5f9] text-[#cbd5e1] border-[#e2e8f0] cursor-not-allowed"
                            : selectedTime === time
                              ? "bg-primary text-secondary border-primary"
                              : "bg-white text-secondary border-[#e2e8f0] hover:border-primary"
                        }
                      `}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border border-[#e2e8f0] rounded"></div>
                  <span className="text-[#64748b]">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#f1f5f9] border border-[#e2e8f0] rounded"></div>
                  <span className="text-[#64748b]">Ocupado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <span className="text-[#64748b]">Seleccionado</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Continue Button */}
      {selectedDate && selectedTime && (
        <div className="flex justify-end mt-8">
          <Button onClick={handleContinue}>Continuar</Button>
        </div>
      )}
    </div>
  );
}

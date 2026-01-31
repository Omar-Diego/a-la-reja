"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";

export default function SeleccionarFechaPage() {
  const { isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const cancha = params.cancha as string;

  const [selectedDate, setSelectedDate] = useState<number | null>(30);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Horarios disponibles
  const timeSlots = [
    { time: "08:00", available: true },
    { time: "09:00", available: true },
    { time: "10:00", available: false },
    { time: "11:00", available: true },
    { time: "12:00", available: true },
    { time: "13:00", available: false },
    { time: "14:00", available: true },
    { time: "15:00", available: true },
    { time: "16:00", available: true },
    { time: "17:00", available: true },
    { time: "18:00", available: true },
    { time: "19:00", available: true },
    { time: "20:00", available: true },
    { time: "21:00", available: true },
  ];

  // Días del calendario
  const daysOfWeek = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];
  const januaryDays = [
    { day: 29, disabled: true },
    { day: 30, disabled: false },
    { day: 31, disabled: false },
    { day: 1, disabled: true },
    { day: 2, disabled: true },
    { day: 3, disabled: true },
    { day: 4, disabled: true },
    { day: 5, disabled: true },
    { day: 6, disabled: true },
    { day: 7, disabled: true },
    { day: 8, disabled: true },
    { day: 9, disabled: true },
    { day: 10, disabled: true },
    { day: 11, disabled: true },
    { day: 12, disabled: true },
    { day: 13, disabled: true },
    { day: 14, disabled: true },
    { day: 15, disabled: true },
    { day: 16, disabled: true },
    { day: 17, disabled: true },
    { day: 18, disabled: true },
    { day: 19, disabled: true },
    { day: 20, disabled: true },
    { day: 21, disabled: true },
    { day: 22, disabled: true },
    { day: 23, disabled: true },
    { day: 24, disabled: true },
    { day: 25, disabled: true },
    { day: 26, disabled: true },
    { day: 27, disabled: true },
    { day: 28, disabled: true },
    { day: 29, disabled: true },
    { day: 30, disabled: true },
    { day: 31, disabled: true },
    { day: 1, disabled: true },
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
              <span className="flex items-center justify-center material-symbols-outlined text-secondary p-2 hover:bg-primary rounded-full cursor-pointer">
                chevron_left
              </span>
              <p className="font-semibold text-secondary">enero 2026</p>
              <span className="flex items-center justify-center material-symbols-outlined text-secondary p-2 hover:bg-primary rounded-full cursor-pointer">
                chevron_right
              </span>
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
              {januaryDays.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center p-1"
                >
                  <button
                    onClick={() => !item.disabled && setSelectedDate(item.day)}
                    disabled={item.disabled}
                    className={`
                      h-9 w-9 flex items-center justify-center rounded-lg text-sm transition-colors
                      ${item.disabled ? "text-[#cbd5e1] cursor-not-allowed" : "text-secondary hover:bg-primary"}
                      ${selectedDate === item.day && !item.disabled ? "bg-secondary text-white hover:bg-secondary" : ""}
                    `}
                  >
                    {item.day}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Seleccionar Horario */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <div className="mb-6">
            <h2 className="font-barlow font-bold text-secondary text-lg mb-2">
              SELECCIONA HORARIO
            </h2>
            <p className="text-[#64748b] text-sm">viernes, 30 de enero</p>
          </div>

          {/* Time Slots Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {timeSlots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                className={`
                  py-3 px-4 rounded-lg text-sm font-medium border transition-all
                  ${
                    !slot.available
                      ? "bg-[#f1f5f9] text-[#cbd5e1] border-[#e2e8f0] cursor-not-allowed"
                      : selectedTime === slot.time
                        ? "bg-primary text-secondary border-primary"
                        : "bg-white text-secondary border-[#e2e8f0] hover:border-primary"
                  }
                `}
              >
                {slot.time}
              </button>
            ))}
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
        </div>
      </div>

      {/* Continue Button */}
      {selectedDate && selectedTime && (
        <div className="flex justify-end mt-8">
          <Button onClick={() => router.push(`/reservar/${cancha}/confirmar`)}>
            Continuar
          </Button>
        </div>
      )}
    </div>
  );
}

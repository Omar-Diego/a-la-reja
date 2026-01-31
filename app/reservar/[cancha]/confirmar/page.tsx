"use client";

import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/app/components/ui/button";
import Image from "next/image";

export default function ConfirmarReservaPage() {
  const { isLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const cancha = params.cancha as string;

  const [duration, setDuration] = useState<string>("1h");
  const [notas, setNotas] = useState<string>("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canchaInfo = {
    "pista-1": {
      nombre: "Pista 1",
      descripcion: "Cancha central con iluminación LED profesional",
      precio: 25,
    },
    "pista-2": {
      nombre: "Pista 2",
      descripcion: "Cancha exterior con césped artificial premium",
      precio: 29,
    },
    "pista-central": {
      nombre: "Pista Central",
      descripcion: "Nuestra cancha estrella para torneos y eventos",
      precio: 35,
    },
  };

  const info =
    canchaInfo[cancha as keyof typeof canchaInfo] || canchaInfo["pista-1"];
  const precioTotal =
    duration === "1h"
      ? info.precio
      : duration === "1.5h"
        ? info.precio * 1.5
        : info.precio * 2;

  const handleConfirmar = () => {
    // Aquí iría la lógica para confirmar la reserva
    router.push("/dashboard");
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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Opciones de Reserva */}
        <div className="bg-white rounded-[10px] p-8 border border-[#ededed]">
          <h2 className="font-barlow font-bold text-secondary text-lg mb-6">
            OPCIONES DE RESERVA
          </h2>

          {/* Duración */}
          <div className="mb-8">
            <p className="text-secondary font-semibold mb-4">Duración</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDuration("1h")}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "1h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
                `}
              >
                1h
              </button>
              <button
                onClick={() => setDuration("1.5h")}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "1.5h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
                `}
              >
                1.5h
              </button>
              <button
                onClick={() => setDuration("2h")}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-semibold transition-all
                  ${
                    duration === "2h"
                      ? "bg-secondary text-white"
                      : "bg-white text-secondary border border-[#e2e8f0] hover:border-primary"
                  }
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
              placeholder="Añade cualquier información adicional..."
              className="w-full h-24 p-4 border border-[#e2e8f0] rounded-lg text-sm resize-none focus:outline-none focus:border-primary"
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
                alt={info.nombre}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-barlow font-bold text-secondary text-lg mb-1">
                {info.nombre}
              </h3>
              <p className="text-[#64748b] text-sm">{info.descripcion}</p>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-[#64748b]">
                calendar_month
              </span>
              <p className="text-sm">viernes, 30 de enero de 2026</p>
            </div>
            <div className="flex items-center gap-3 text-secondary">
              <span className="material-symbols-outlined text-[#64748b]">
                schedule
              </span>
              <p className="text-sm">08:00 - 9:00 ({duration})</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-[#e2e8f0]">
            <p className="font-barlow font-bold text-secondary text-lg">
              Total
            </p>
            <p className="font-barlow font-bold text-secondary text-2xl">
              €{precioTotal.toFixed(2)}
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
          >
            <span className="material-symbols-outlined">check</span>
            CONFIRMAR RESERVA
          </Button>
        </div>
      </div>
    </div>
  );
}

export interface Court {
  idCancha: number;
  nombre: string;
  ubicacion: string;
  precio_por_hora: number;
}

export interface Reservation {
  idReservacion: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  cancha: string;
  ubicacion?: string;
}

export interface BookedSlot {
  idReservacion: number;
  hora_inicio: string;
  hora_fin: string;
}

export function getCourtIdFromSlug(slug: string): number {
  const mapping: Record<string, number> = {
    "pista-1": 1,
    "pista-2": 2,
    "pista-central": 3,
  };
  return mapping[slug] || 1;
}

export function getSlugFromCourtId(id: number): string {
  const mapping: Record<number, string> = {
    1: "pista-1",
    2: "pista-2",
    3: "pista-central",
  };
  return mapping[id] || "pista-1";
}

export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string | Date): string {
  if (!dateStr) return "";

  if (dateStr instanceof Date) {
    return formatDateToISO(dateStr);
  }

  const str = String(dateStr);

  if (str.includes("T")) {
    return str.split("T")[0];
  }

  if (str.includes(" ")) {
    return str.split(" ")[0];
  }

  return str;
}

export function formatDateDisplay(dateStr: string | Date): string {
  const normalizedDate = parseDateString(dateStr);
  if (!normalizedDate) return "Fecha no disponible";

  try {
    const date = new Date(normalizedDate + "T12:00:00");
    if (isNaN(date.getTime())) return "Fecha invalida";

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  } catch {
    return "Fecha invalida";
  }
}

export function formatShortDate(dateStr: string | Date): string {
  const normalizedDate = parseDateString(dateStr);
  if (!normalizedDate) return "Fecha no disponible";

  try {
    const date = new Date(normalizedDate + "T12:00:00");
    if (isNaN(date.getTime())) return "Fecha invalida";

    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("es-ES", options);
  } catch {
    return "Fecha invalida";
  }
}

export function calculateEndTime(
  startTime: string,
  durationHours: number,
): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationHours * 60;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
}

export function isTimeSlotBooked(
  time: string,
  bookedSlots: BookedSlot[],
): boolean {
  const slotStart = time;
  const slotEnd = calculateEndTime(time, 1);
  return bookedSlots.some((booked) => {
    const bookedStart = booked.hora_inicio.substring(0, 5);
    const bookedEnd = booked.hora_fin.substring(0, 5);
    return slotStart < bookedEnd && slotEnd > bookedStart;
  });
}

export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isReservationUpcoming(fecha: string | Date): boolean {
  const normalizedDate = parseDateString(fecha);
  if (!normalizedDate) return false;

  const reservationDate = new Date(normalizedDate + "T23:59:59");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return reservationDate >= today;
}

export function isTimeInPastForToday(time: string, date: Date): boolean {
  const today = new Date();
  if (formatDateToISO(date) !== formatDateToISO(today)) {
    return false;
  }
  const [hours] = time.split(":").map(Number);
  return hours <= today.getHours();
}

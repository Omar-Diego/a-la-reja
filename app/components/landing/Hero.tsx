import Link from "next/link";
import Badge from "../ui/badge";
import Button from "../ui/button";

export default function Hero() {
  return (
    <section
      className="flex w-full min-h-[calc(100dvh-80px)] px-8 md:px-20 lg:px-35 py-16 items-center"
      style={{
        background: `linear-gradient(100deg, rgba(215, 183, 183, 0.48) 1.52%, rgba(35, 36, 61, 0.49) 12.49%, rgba(8, 0, 47, 0.50) 32.4%, rgba(7, 0, 39, 0.52) 69.39%, rgba(215, 183, 183, 0.52) 91.9%), url('/images/Hero.jpg') lightgray 50% / cover no-repeat`,
      }}
    >
      <div className="flex flex-col justify-center items-start gap-7 max-w-2xl">
        <Badge icon="bolt">Reserva en segundos</Badge>

        <div className="flex flex-col gap-5 w-full">
          <h1 className="font-barlow font-bold text-7xl leading-tight">
            <span className="text-white block">TU CANCHA,</span>
            <span className="text-primary block">TU JUEGO,</span>
            <span className="text-white block">TU MOMENTO</span>
          </h1>
          <p className="text-white text-xl font-roboto">
            La plataforma definitiva para reservar canchas de pádel. Encuentra
            disponibilidad, únete a partidos y gestiona tus reservas sin
            complicaciones.
          </p>
        </div>

        <div className="flex flex-wrap gap-5 items-center">
          <Link href="/login">
            <Button>EMPEZAR AHORA</Button>
          </Link>
          <Link href="#todo-lo-que-necesitas">
            <Button variant="inverted">CONOCE MAS</Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-8 md:gap-25 items-center mt-4">
          <div className="flex flex-col gap-2.5">
            <span className="text-primary text-2xl md:text-3xl font-roboto font-extrabold">
              500 +
            </span>
            <span className="text-white text-sm font-roboto font-extrabold">
              Jugadores Activos
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-primary text-2xl md:text-3xl font-roboto font-extrabold">
              3
            </span>
            <span className="text-white text-sm font-roboto font-extrabold">
              Canchas Premium
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <span className="text-primary text-2xl md:text-3xl font-roboto font-extrabold">
              98%
            </span>
            <span className="text-white text-sm font-roboto font-extrabold">
              Satisfacción
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

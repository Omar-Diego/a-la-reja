import { FeatureCard } from "../ui/cards";

const features = [
  {
    icon: "calendar_month",
    title: "Reserva Instantánea",
    description: "Encuentra disponibilidad y reserva tu cancha en segundos",
  },
  {
    icon: "groups",
    title: "Partidos Abiertos",
    description: "Únete a partidos públicos y conoce nuevos jugadores",
  },
  {
    icon: "sync",
    title: "Gestión Flexible",
    description: "Modifica o cancela tus reservas hasta 24 horas antes",
  },
  {
    icon: "event_busy",
    title: "Sin Doble Reserva",
    description: "Validación inteligente que evita conflictos de horario",
  },
];

export default function TodoLoQueNecesitas() {
  return (
    <section
      id="todo-lo-que-necesitas"
      className="flex py-20 px-36 justify-center items-center gap-7 self-stretch"
    >
      <div className="flex flex-col justify-center items-center gap-7">
        <div className="flex flex-col items-center gap-5 self-stretch">
          <h2 className="font-barlow font-bold text-5xl text-secondary">
            TODO LO QUE NECESITAS
          </h2>
          <p className="font-roboto text-xl text-[#857fa0]">
            Una plataforma completa diseñada para jugadores y clubes
          </p>
        </div>

        <div className="flex justify-center items-center gap-8 shrink-0">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

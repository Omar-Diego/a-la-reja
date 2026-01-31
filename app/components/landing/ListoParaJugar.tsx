import Link from "next/link";
import Button from "../ui/button";

export default function ListoParaJugar() {
  return (
    <section className="bg-secondary flex flex-col gap-7 items-center justify-center px-8 md:px-20 lg:px-35 py-20">
      <div className="flex flex-col gap-7 items-center justify-center max-w-239.5 w-full">
        <div className="flex flex-col gap-5 items-center text-center text-white">
          <h2 className="font-barlow font-bold text-5xl">¿LISTO PARA JUGAR?</h2>
          <p className="font-roboto text-lg md:text-xl">
            Únete a cientos de jugadores que ya disfrutan de la forma más fácil
            de reservar canchas de pádel
          </p>
        </div>

        <Link href="/register">
          <Button>
            CREA CUENTA GRATIS
            <span className="material-symbols-outlined text-xl">
              arrow_forward
            </span>
          </Button>
        </Link>
      </div>
    </section>
  );
}

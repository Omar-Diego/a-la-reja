import Button from "../ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-20 px-36 justify-between items-center self-stretch bg-linear-to-r from-[#0F172A] to-[#090F0F]">
      <div className="flex items-center gap-16">
        <div className="flex justify-center items-center gap-4">
          <span className="material-symbols-outlined bg-primary rounded-full p-2 text-black">
            sports_baseball
          </span>
          <span className="text-white text-2xl font-bold leading-normal font-barlow">
            A LA REJA
          </span>
        </div>
        <div>
          <nav className="flex gap-10 justify-center items-center text-white text-[1.25rem] font-semibold leading-normal font-barlow">
            <a href="#" className="hover:text-primary transition-colors">
              Inicio
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Reservar
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Canchas
            </a>
          </nav>
        </div>
      </div>
      <div>
        <Button>Iniciar Sesion</Button>
      </div>
    </header>
  );
}

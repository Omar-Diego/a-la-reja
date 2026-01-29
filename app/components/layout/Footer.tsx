export default function Footer() {
  return (
    <footer className="bg-secondary flex flex-wrap gap-8 items-center justify-between px-8 md:px-20 lg:px-35 py-5 border-t border-t-primary">
      <div className="flex gap-2.5 items-center">
        <span className="material-symbols-outlined bg-primary rounded-full p-1.5 text-black text-xl">
          sports_baseball
        </span>
        <span className="text-white text-lg font-bold font-barlow">
          A LA REJA
        </span>
      </div>
      <p className="text-white text-sm font-roboto">
        © 2025 A la Reja. Todos los derechos reservados.
      </p>
    </footer>
  );
}

"use client";

export default function MobileBlocker({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Mensaje para móviles */}
      <div className="mobile-blocker">
        <div
          className="flex flex-col items-center justify-center min-h-screen px-6"
          style={{
            background: `linear-gradient(100deg, rgba(215, 183, 183, 0.48) 1.52%, rgba(35, 36, 61, 0.49) 12.49%, rgba(8, 0, 47, 0.50) 32.4%, rgba(7, 0, 39, 0.52) 69.39%, rgba(215, 183, 183, 0.52) 91.9%), url('/images/Hero.jpg') lightgray 50% / cover no-repeat`,
          }}
        >
          <div className="w-full max-w-sm bg-[#EDEDED] rounded-2xl">
            {/* Header azul con logo */}
            <div className="flex justify-center items-center gap-4 bg-secondary py-7 rounded-t-2xl">
              <span className="material-symbols-outlined bg-primary rounded-full p-3 text-black text-3xl">
                sports_baseball
              </span>
              <span className="text-white text-3xl font-bold leading-normal font-barlow">
                A LA REJA
              </span>
            </div>

            {/* Contenido */}
            <div className="px-8 py-8 text-center">
              <span className="material-symbols-outlined text-6xl text-secondary mb-4">
                desktop_windows
              </span>

              <h1 className="text-2xl font-bold text-secondary mb-4 font-barlow">
                Mejor experiencia en PC
              </h1>

              <p className="text-secondary/80 text-sm font-roboto mb-6">
                Para disfrutar de todas las funcionalidades de{" "}
                <span className="font-bold text-secondary">A La Reja</span>, te
                recomendamos acceder desde un computador.
              </p>

              <div className="flex items-center justify-center gap-2 text-secondary/60 text-sm font-roboto bg-white/50 py-3 px-4 rounded-lg">
                <span className="material-symbols-outlined text-lg">
                  computer
                </span>
                <span>Accede desde tu PC o laptop</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido normal para desktop */}
      <div className="desktop-content">{children}</div>
    </>
  );
}

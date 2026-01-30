"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "../components/layout/Footer";
import Button from "../components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Credenciales invalidas. Por favor verifica tu email y contrasena.",
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Error al iniciar sesion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden">
      <div
        className="flex-1 flex w-full px-8 md:px-20 lg:px-35 py-8 items-center justify-center overflow-auto"
        style={{
          background: `linear-gradient(100deg, rgba(23, 30, 46, 0.90) 6%, rgba(23, 30, 46, 0.75) 18%, rgba(23, 30, 46, 0.60) 38%, rgba(16, 22, 36, 0.65) 62%, rgba(10, 14, 28, 0.80) 92%), url('/images/Hero.jpg') center / cover no-repeat`,
        }}
      >
        <div className="w-full max-w-md bg-[#EDEDED] rounded-2xl">
          <div className="flex justify-center items-center gap-4 mb-8 bg-secondary py-7 rounded-t-2xl">
            <span className="material-symbols-outlined bg-primary rounded-full p-3 text-black text-3xl">
              sports_baseball
            </span>
            <span className="text-white text-3xl font-bold leading-normal font-barlow">
              A LA REJA
            </span>
          </div>

          <div className="px-8">
            <h1 className="text-2xl font-bold text-secondary text-center mb-6 font-barlow">
              Iniciar Sesion
            </h1>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-secondary/80 mb-2"
                >
                  Correo electronico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-black/10 rounded-lg text-secondary/70 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-secondary/80 mb-2"
                >
                  Contrasena
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-black/10 rounded-lg text-secondary/70 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Tu contrasena"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                loading={loading}
                className="w-full"
              >
                Iniciar Sesion
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-secondary/70">
                No tienes cuenta?{" "}
                <Link
                  href="/register"
                  className="text-secondary font-semibold hover:text-secondary/70 transition-colors"
                >
                  Registrate aqui
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-5 mb-5">
            <Link
              href="/"
              className="text-secondary/60 hover:text-secondary transition-colors text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

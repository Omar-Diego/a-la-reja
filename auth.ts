import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SignJWT } from "jose";
import crypto from "crypto";

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// URL de la API del backend
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://82-180-163-31.sslip.io";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Credenciales del administrador (leídas en tiempo de ejecución)
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        console.log("[NextAuth] Login attempt for:", credentials.email);
        console.log("[NextAuth] ADMIN_EMAIL is set:", !!ADMIN_EMAIL);
        console.log("[NextAuth] ADMIN_PASSWORD is set:", !!ADMIN_PASSWORD);

        // Verificar si es el administrador
        if (
          ADMIN_EMAIL &&
          ADMIN_PASSWORD &&
          timingSafeStringEqual(String(credentials.email), ADMIN_EMAIL) &&
          timingSafeStringEqual(String(credentials.password), ADMIN_PASSWORD)
        ) {
          console.log("[NextAuth] Admin login successful");
          const secret = new TextEncoder().encode(process.env.JWT_SECRET);
          const adminToken = await new SignJWT({
            idUsuario: "admin",
            nombre: "Administrador",
            email: ADMIN_EMAIL,
            role: "admin",
          })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("1h")
            .sign(secret);
          return {
            id: "admin",
            name: "Administrador",
            email: ADMIN_EMAIL,
            accessToken: adminToken,
            role: "admin" as const,
          };
        }

        try {
          // Llamar al backend de Express para la autenticación
          const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data.token && data.user) {
            return {
              id: String(data.user.id),
              name: data.user.nombre,
              email: data.user.email,
              accessToken: data.token,
              role: "user" as const,
            };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Persistir el token de acceso y la información del usuario del backend
      if (user) {
        token.accessToken = user.accessToken;
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Enviar propiedades al cliente
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as "admin" | "user";
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
});

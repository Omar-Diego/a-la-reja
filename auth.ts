import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

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
      }
      return token;
    },
    async session({ session, token }) {
      // Enviar propiedades al cliente
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
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

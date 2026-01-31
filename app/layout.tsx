import type { Metadata } from "next";
import { Barlow_Condensed, Roboto } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/providers/SessionProvider";
import { AuthProvider } from "./context/AuthContext";
import MobileBlocker from "./components/ui/MobileBlocker";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A La Reja",
  description: "Tu plataforma deportiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${roboto.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            <MobileBlocker>{children}</MobileBlocker>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Agenda Fono — Elis Pinheiro",
  description: "Controle de presença de pacientes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agenda Fono",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E91E8F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="desktop-bg text-gray-900 antialiased">
        <div className="mx-auto w-full max-w-md min-h-dvh bg-rosa-50 relative shadow-2xl shadow-rosa-200/50 md:my-0">
          {children}
        </div>
      </body>
    </html>
  );
}

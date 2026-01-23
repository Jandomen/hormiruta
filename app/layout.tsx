import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { Providers } from "./components/Providers";

export const metadata: Metadata = {
  title: "Hormiruta",
  description: "Sistema avanzado de optimización de rutas para choferes",
};

// BUILD FORCE: 2026-01-22T19:22:00

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

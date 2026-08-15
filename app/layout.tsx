import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

import { Providers } from "./components/Providers";
import DeepLinkHandler from "./components/DeepLinkHandler";
import OfflineScreen from "./components/OfflineScreen";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

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
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 600,
              },
            }}
          />
          <OfflineScreen />
          <DeepLinkHandler />
          <ServiceWorkerRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}

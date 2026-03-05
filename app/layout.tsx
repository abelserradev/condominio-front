import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AdminRedirectGuard } from "./components/admin-redirect-guard";
import { Header } from "./components/header/header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Condominio Residencia Sofia",
  description: "Gestión de recibos y pagos del condominio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <AdminRedirectGuard>
          <main className="min-h-[calc(100vh-4rem)] bg-white">{children}</main>
        </AdminRedirectGuard>
      </body>
    </html>
  );
}

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
  title: "URBIX",
  description: "El sistema operativo de tu comunidad.",
  icons: {
    icon: "/logo_condominio.webp",
  },
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
          <main className="min-h-[calc(100vh-4rem)] bg-background">{children}</main>
        </AdminRedirectGuard>
      </body>
    </html>
  );
}

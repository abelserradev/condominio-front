import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { AdminRedirectGuard } from "./components/admin-redirect-guard";
import { Header } from "./components/header/header";
import { TenantPortalGate } from "./components/platform/tenant-portal-gate";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const esPlataforma = headersList.get("x-platform-mode") === "true";

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TenantPortalGate esPlataforma={esPlataforma}>
          <Header />
          <AdminRedirectGuard>
            <main className="min-h-[calc(100vh-4rem)] bg-background">{children}</main>
          </AdminRedirectGuard>
        </TenantPortalGate>
      </body>
    </html>
  );
}

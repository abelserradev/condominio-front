"use client";

import { createContext, useContext, type ReactNode } from "react";

export type PortalBranding = {
  nombre: string;
  bannerUrl?: string;
};

const PortalBrandingContext = createContext<PortalBranding | null>(null);

export function PortalBrandingProvider({
  value,
  children,
}: {
  value: PortalBranding;
  children: ReactNode;
}) {
  return (
    <PortalBrandingContext.Provider value={value}>
      {children}
    </PortalBrandingContext.Provider>
  );
}

export function usePortalBranding(): PortalBranding | null {
  return useContext(PortalBrandingContext);
}

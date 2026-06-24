"use client";

import { usePortalBranding } from "./portal-branding-provider";
import { BannerPublicitario } from "../home/banner-publicitario";

export function BannerFromBranding() {
  const branding = usePortalBranding();
  return (
    <BannerPublicitario
      bannerUrl={branding?.bannerUrl}
      nombreEdificio={branding?.nombre}
    />
  );
}

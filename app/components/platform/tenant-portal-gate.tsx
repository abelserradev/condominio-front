import { fetchPortalInfo, resolveBannerUrl, resolveBuildingSlugServer } from "@/lib/api";
import { PortalBrandingProvider } from "./portal-branding-provider";
import { PortalSuscripcionBloqueada } from "./portal-suscripcion-bloqueada";

type Props = {
  esPlataforma: boolean;
  children: React.ReactNode;
};

export async function TenantPortalGate({ esPlataforma, children }: Props) {
  if (esPlataforma) {
    return <>{children}</>;
  }

  const slug = await resolveBuildingSlugServer();
  let portal = null;
  try {
    portal = await fetchPortalInfo(slug);
  } catch {
    return <>{children}</>;
  }

  if (!portal) {
    return <>{children}</>;
  }

  if (!portal.portalAccesible) {
    return <PortalSuscripcionBloqueada info={portal} />;
  }

  const bannerUrl = resolveBannerUrl(portal.bannerUrl);

  return (
    <PortalBrandingProvider value={{ nombre: portal.nombre, bannerUrl }}>
      {children}
    </PortalBrandingProvider>
  );
}

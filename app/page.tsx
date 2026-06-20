import { headers } from "next/headers";
import { BuildingHome } from "./components/platform/building-home";
import { PlatformLanding } from "./components/platform/platform-landing";

export default async function Home() {
  const headersList = await headers();
  const esPlataforma = headersList.get("x-platform-mode") === "true";

  if (esPlataforma) {
    return <PlatformLanding />;
  }

  return <BuildingHome />;
}

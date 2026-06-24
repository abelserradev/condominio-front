import Image from "next/image";

type Props = {
  bannerUrl?: string;
  nombreEdificio?: string;
};

/** Hero del portal — imagen por edificio o fallback URBIX */
export function BannerPublicitario({ bannerUrl, nombreEdificio }: Props) {
  const src = bannerUrl ?? "/Comple.png";
  const alt = nombreEdificio
    ? `${nombreEdificio} — portal de residentes`
    : "URBIX — El sistema operativo de tu comunidad";

  return (
    <figure className="overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80">
      <Image
        src={src}
        alt={alt}
        width={670}
        height={469}
        priority
        quality={90}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full"
        unoptimized={src.startsWith("/api/") || src.startsWith("http")}
      />
    </figure>
  );
}

import Image from "next/image";

/** Hero URBIX del portal del edificio — sin enlaces externos */
export function BannerPublicitario() {
  return (
    <figure className="overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80">
      <Image
        src="/Comple.png"
        alt="URBIX — El sistema operativo de tu comunidad"
        width={670}
        height={469}
        priority
        quality={90}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full"
      />
    </figure>
  );
}

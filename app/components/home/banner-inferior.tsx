import Image from "next/image";

export function BannerInferior() {
  return (
    <div className="mt-8 flex justify-center">
      <div className="w-[95vw] max-w-[95vw] min-w-0">
        <a
          href="https://www.linkedin.com/in/abeljserraz"
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="relative aspect-[468/60] w-full overflow-hidden">
            <Image
              src="/publicidad1.png"
              alt="Diseño, innovación y creación - ¿Quieres tu propia web, app o software? Contáctame"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 468px"
            />
          </div>
        </a>
      </div>
    </div>
  );
}
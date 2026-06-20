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
          <Image
            src="/publicidad1.png"
            alt="Diseño, innovación y creación - ¿Quieres tu propia web, app o software? Contáctame"
            width={468}
            height={60}
            className="h-auto w-full"
            sizes="95vw"
            priority
          />
        </a>
      </div>
    </div>
  );
}
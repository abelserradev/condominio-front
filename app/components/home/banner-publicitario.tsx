"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export function BannerPublicitario() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="mb-6 flex justify-center">
      <div className="group relative w-[90vw] max-w-[90vw] min-w-0">
        <a
          href="https://www.linkedin.com/in/abeljserraz"
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl shadow-lg transition-shadow hover:shadow-xl"
        >
          <div className="relative h-16 overflow-hidden sm:h-20 md:h-24">
            <Image
              src="/publicidad1.png"
              alt="BuildForge - Diseño, Creación, Innovación"
              fill
              className="object-cover object-center"
            />
          </div>
        </a>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="absolute right-2 top-2 z-10 rounded-lg bg-white/20 p-2 text-white opacity-0 transition-opacity hover:bg-white/30 group-hover:opacity-100"
          aria-label="Cerrar banner"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
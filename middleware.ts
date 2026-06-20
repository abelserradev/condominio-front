import { NextRequest, NextResponse } from 'next/server';

const DEV_BUILDING_SLUG = process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? 'residencia-sofia';

function hostSinPuerto(req: NextRequest): string {
  return (req.headers.get('host') ?? '').split(':')[0];
}

/** Dominio raíz de la plataforma (sin tenant): tuapp.com o localhost en dev */
function isPlatformRoot(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return true;
  if (host.endsWith('.localhost')) return false;
  const partes = host.split('.');
  if (partes[0] === 'www') return true;
  if (partes.length === 2) return true;
  return false;
}

function extractBuildingSlug(host: string): string {
  if (host === 'localhost' || host === '127.0.0.1') {
    return DEV_BUILDING_SLUG;
  }
  if (host.endsWith('.localhost')) {
    return host.replace('.localhost', '');
  }
  const partes = host.split('.');
  if (partes.length >= 3 && partes[0] !== 'www') {
    return partes[0];
  }
  return DEV_BUILDING_SLUG;
}

export function middleware(req: NextRequest): NextResponse {
  const host = hostSinPuerto(req);
  const esPlataforma = isPlatformRoot(host);
  const response = NextResponse.next();

  if (esPlataforma) {
    response.headers.set('x-platform-mode', 'true');
    response.cookies.set('platform_mode', '1', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.delete('building_slug');
  } else {
    const slug = extractBuildingSlug(host);
    response.headers.set('x-platform-mode', 'false');
    response.headers.set('x-building-slug', slug);
    response.cookies.set('building_slug', slug, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.delete('platform_mode');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
  const url = request.nextUrl;

  // Jika mode maintenance aktif dan user tidak sedang di halaman maintenance
  if (maintenanceMode === "true" && !url.pathname.startsWith("/maintenance")) {
    // Biarkan file static atau aset next.js tetap load (opsional, agar style tidak rusak)
    if (
      url.pathname.startsWith("/_next") ||
      url.pathname.startsWith("/api") ||
      url.pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Redirect semua halaman ke /maintenance
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Jika maintenance dimatikan, tapi user mencoba akses /maintenance, lempar balik ke Home
  if (maintenanceMode !== "true" && url.pathname.startsWith("/maintenance")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import { isStaticAsset } from "./lib/helpers/validations/isStaticAsset";
import { RolesSistema } from "./interfaces/shared/RolesSistema";

export async function middleware(request: NextRequest) {
  const deleteCookies = () => {
    const deletedNombreCookie = serialize("Nombre", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });

    const deletedApellidoCookie = serialize("Apellido", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });

    const deletedRolCookie = serialize("Rol", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });

    const deletedTokenCookie = serialize("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });

    return NextResponse.redirect(new URL("/login", request.url), {
      headers: {
        "Set-Cookie": `${deletedNombreCookie}, ${deletedApellidoCookie}, ${deletedTokenCookie}, ${deletedRolCookie}`,
      },
    });
  };

  try {
    const url = request.nextUrl;
    const pathname = url.pathname;

    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    if (isStaticAsset(request.nextUrl.pathname)) {
      return NextResponse.next();
    }

    const token = request.cookies.get("token");
    const Rol = request.cookies.get("Rol");
    const Nombres = request.cookies.get("Nombres");
    const Apellidos = request.cookies.get("Apellidos");

    if (!token && (pathname === "/login" || pathname.startsWith("/login/"))) {
      return NextResponse.next();
    }

    if (!token || !Rol || !Nombres || !Apellidos) {
      return deleteCookies();
    }

    switch (Rol.value) {
      case RolesSistema.Directivo:
      case RolesSistema.ProfesorPrimaria:
      case RolesSistema.Auxiliar:
      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
      case RolesSistema.Responsable:
      case RolesSistema.PersonalAdministrativo:
        break;
      default:
        throw new Error("ROLE-NOT-VALID");
    }

    if (token && (pathname === "/login" || pathname.startsWith("/login/"))) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return deleteCookies();
  }
}

export const config = {
  matcher: "/:path*",
};

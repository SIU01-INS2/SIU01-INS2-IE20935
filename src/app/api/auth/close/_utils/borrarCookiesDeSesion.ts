import { serialize } from "cookie";

export function borrarCookiesDeSesion() {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    };
  
    return {
      "Set-Cookie": [
        serialize("Nombres", "", { ...options, sameSite: "lax" }),
        serialize("Apellidos", "", { ...options, sameSite: "lax" }),
        serialize("Genero", "", { ...options, sameSite: "lax" }),
        serialize("Rol", "", { ...options, sameSite: "strict" }),
        serialize("token", "", { ...options, sameSite: "strict" }),
        serialize("Google_Drive_Foto_ID", "", { ...options, sameSite: "strict" }),
      ].join(", "),
    };
  }
  
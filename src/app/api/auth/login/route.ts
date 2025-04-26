import { getExpirationSessionForRolInSeg } from "@/constants/expirations";
import { SuccessLoginData } from "@/interfaces/shared/apis/shared/login/types";

import { serialize } from "cookie";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("INICIO DE SESION TIMESTAMP ", new Date().getTime());
  try {
    const bodyString = await readStreamToString(req.body!);

    const jsonData = JSON.parse(bodyString);

    const { Apellidos, Nombres, Rol, token, Google_Drive_Foto_ID, Genero } =
      jsonData as SuccessLoginData;

    if (!Nombres || !Apellidos || !Rol || !token) {
      return new Response(
        JSON.stringify({ message: "Datos inconpletos para iniciar Sesion" }),
        { status: 401 }
      );
    }
    const nombresSerialize = serialize("Nombres", Nombres, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: getExpirationSessionForRolInSeg(Rol),
    });
    const apellidosSerialize = serialize("Apellidos", Apellidos, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: getExpirationSessionForRolInSeg(Rol),
    });

    const generoSerialize = Genero
      ? serialize("Genero", Genero, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: getExpirationSessionForRolInSeg(Rol),
        })
      : undefined;

    const rolSerialize = serialize("Rol", Rol, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: getExpirationSessionForRolInSeg(Rol),
    });

    const Google_Drive_Foto_ID_Serialize = Google_Drive_Foto_ID
      ? serialize("Google_Drive_Foto_ID", Google_Drive_Foto_ID, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: getExpirationSessionForRolInSeg(Rol),
        })
      : null;

    const tokenSerialize = serialize("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: getExpirationSessionForRolInSeg(Rol),
    });

    return new Response(null, {
      status: 201,
      headers: {
        "Set-Cookie": `${nombresSerialize}, ${apellidosSerialize}, ${rolSerialize}, ${tokenSerialize}, ${
          generoSerialize ? generoSerialize + "," : ""
        } ${Google_Drive_Foto_ID_Serialize || ""}`,
      },
    });
  } catch (error) {
    console.log(error);
  }
}

// For Next.js v13 and above, use the TextDecoder API
async function readStreamToString(stream: ReadableStream) {
  const decoder = new TextDecoder();
  let result = "";
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value);
  }
  reader.releaseLock();
  return result;
}

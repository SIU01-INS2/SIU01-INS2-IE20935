import { Genero } from "@/interfaces/shared/Genero";
import { serialize } from "cookie";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const bodyString = await readStreamToString(req.body!);

    const jsonData = JSON.parse(bodyString);

    const { Google_Drive_Foto_ID, Apellidos, Nombres } = jsonData as {
      Google_Drive_Foto_ID?: string;
      Nombres?: string;
      Apellidos?: string;
      Genero?: Genero;
    };

    const cookies: string[] = [];

    // Solo actualizar Google_Drive_Foto_ID si llega en el request
    if (Google_Drive_Foto_ID !== undefined) {
      const Google_Drive_Foto_ID_Serialize = serialize(
        "Google_Drive_Foto_ID",
        Google_Drive_Foto_ID ?? "",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          sameSite: "lax",
          maxAge: Google_Drive_Foto_ID ? 60 * 60 * 5 : 0,
        }
      );
      cookies.push(Google_Drive_Foto_ID_Serialize);
    }

    // Solo actualizar Nombres si llega en el request
    if (Nombres !== undefined) {
      const nombresSerialize = serialize("Nombres", Nombres, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 5,
      });
      cookies.push(nombresSerialize);
    }

    // Solo actualizar Apellidos si llega en el request
    if (Apellidos !== undefined) {
      const apellidosSerialize = serialize("Apellidos", Apellidos, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        sameSite: "lax",
        maxAge: 60 * 60 * 5,
      });
      cookies.push(apellidosSerialize);
    }

    return new Response(null, {
      status: 201,
      headers: {
        "Set-Cookie": cookies.join(", "),
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

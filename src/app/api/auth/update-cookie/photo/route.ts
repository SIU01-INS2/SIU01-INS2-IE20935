import { serialize } from "cookie";
import { NextRequest } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const bodyString = await readStreamToString(req.body!);

    const jsonData = JSON.parse(bodyString);

    const { Google_Drive_Foto_ID } = jsonData as {
      Google_Drive_Foto_ID?: string;
    };

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

    return new Response(null, {
      status: 201,
      headers: {
        "Set-Cookie": `${Google_Drive_Foto_ID_Serialize}`,
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

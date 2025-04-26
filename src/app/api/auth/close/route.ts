import { NextRequest } from "next/server";

import { borrarCookiesDeSesion } from "./_utils/borrarCookiesDeSesion";

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token) return new Response(null, { status: 401 });

  return new Response(null, {
    status: 200,
    headers: borrarCookiesDeSesion(),
  });

  // Si quieres redirigir automáticamente en vez de solo borrar cookies:
  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     ...borrarCookiesDeSesion(),
  //     Location: "/login",
  //   },
  // });
}

import { borrarCookiesDeSesion } from "@/app/api/auth/close/_utils/borrarCookiesDeSesion";
import { ErrorDetailsForLogout, LogoutTypes } from "@/interfaces/LogoutTypes";
import { formatErrorDetailsForUrl } from "@/lib/helpers/parsers/errorDetailsInURL";
import { NextResponse } from "next/server";

// Función para eliminar cookies y redirigir a login
export function redirectToLogin(
  logoutType: LogoutTypes,
  errorDetails?: ErrorDetailsForLogout
) {
  let location = `/login?LOGOUT_TYPE=${logoutType}`;

  if (errorDetails) {
    location += `&ERROR_DETAILS=${formatErrorDetailsForUrl(errorDetails)}`;
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      ...borrarCookiesDeSesion(),
      Location: location,
    },
  });
}

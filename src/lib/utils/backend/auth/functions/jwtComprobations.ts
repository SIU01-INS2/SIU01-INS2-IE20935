// middleware/authMiddleware.ts
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { JWTPayload } from "@/interfaces/shared/JWTPayload";

import { getJwtKeyForRole } from "./getJwtKeyForRoles";
import { redirectToLogin } from "./redirectToLogin";
import { LogoutTypes } from "@/interfaces/LogoutTypes";

/**
 * Middleware para verificar la autenticación en las peticiones a la API
 * @param req - Solicitud de Next.js
 * @param allowedRoles - Roles que tienen permitido acceder al endpoint (opcional)
 * @returns Un objeto con el token decodificado y el rol, o redirige al login en caso de error
 */
export async function verifyAuthToken(
  req: NextRequest,
  allowedRoles?: RolesSistema[]
) {
  try {
    // Obtener cookies
    const token = req.cookies.get("token")?.value;
    const rol = req.cookies.get("Rol")?.value as RolesSistema | undefined;

    // Verificar si existen las cookies necesarias
    if (!token || !rol) {
      return {
        error: redirectToLogin(LogoutTypes.SESION_EXPIRADA, {
          mensaje: "Sesión no encontrada",
          origen: "middleware/authMiddleware",
        }),
      };
    }

    // Verificar si el rol está permitido (si se especificaron roles)
    if (allowedRoles && !allowedRoles.includes(rol)) {
      return {
        error: redirectToLogin(LogoutTypes.PERMISOS_INSUFICIENTES, {
          mensaje: "No tienes permisos para acceder a este recurso",
          origen: "middleware/authMiddleware",
          contexto: `Rol ${rol} no autorizado`,
        }),
      };
    }

    // Seleccionar la clave JWT correcta según el rol
    const jwtKey = getJwtKeyForRole(rol);
    if (!jwtKey) {
      return {
        error: redirectToLogin(LogoutTypes.ERROR_DATOS_CORRUPTOS, {
          mensaje: "Configuración de seguridad inválida",
          origen: "middleware/authMiddleware",
        }),
      };
    }

    // Decodificar el token JWT
    let decodedToken: JWTPayload;
    try {
      decodedToken = jwt.verify(token, jwtKey) as JWTPayload;
    } catch (error) {
      console.error("Error al verificar token:", error);
      return {
        error: redirectToLogin(LogoutTypes.ERROR_DATOS_CORRUPTOS, {
          mensaje: "Token de seguridad inválido",
          origen: "middleware/authMiddleware",
          siasisComponent: "SIU01",
        }),
      };
    }

    // Verificar que el rol en el token coincida con el rol en la cookie
    if (decodedToken.Rol !== rol) {
      return {
        error: redirectToLogin(LogoutTypes.ERROR_DATOS_CORRUPTOS, {
          mensaje: "Datos de sesión inconsistentes",
          origen: "middleware/authMiddleware",
          contexto: "Rol en token no coincide con rol en cookie",
        }),
      };
    }

    // Si todo está correcto, devolver el token decodificado y el rol
    return {
      decodedToken,
      rol,
    };
  } catch (error) {
    console.error("Error general en autenticación:", error);
    return {
      error: redirectToLogin(LogoutTypes.ERROR_SISTEMA, {
        mensaje: "Error inesperado del sistema",
        origen: "middleware/authMiddleware",
      }),
    };
  }
}

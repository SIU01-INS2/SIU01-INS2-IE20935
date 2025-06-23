/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorResponseAPIBase } from "@/interfaces/shared/apis/types";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  DataConflictErrorTypes,
  FileErrorTypes,
  PermissionErrorTypes,
  RequestErrorTypes,
  SystemErrorTypes,
  TokenErrorTypes,
  UserErrorTypes,
  ValidationErrorTypes,
  AuthenticationErrorTypes,
  NetworkErrorTypes,
  SyncErrorTypes,
  CacheErrorTypes,
  StorageErrorTypes,
  AttendanceErrorTypes,
  DataErrorTypes,
} from "@/interfaces/shared/errors";

interface ErrorMessageProps {
  error: ErrorResponseAPIBase;
  className?: string;
  duration?: number; // en milisegundos
  closable?: boolean;
  setError?: Dispatch<SetStateAction<ErrorResponseAPIBase | null>>;
}

const ErrorMessage = ({
  error,
  className = "",
  duration,
  closable = false,
  setError,
}: ErrorMessageProps) => {
  const [visible, setVisible] = useState(true);
  const { message, errorType } = error;

  // Efecto para desaparecer automáticamente si se proporciona duration
  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  if (!visible) return null;

  // Determinar estilo y color según el tipo de error
  const getErrorStyle = () => {
    // Si errorType es undefined, usamos el estilo por defecto (rojo)
    if (!errorType) {
      return {
        containerClass: "bg-[#FFF0F0] border-l-4 border-rojo-oscuro",
        iconBgClass: "bg-rojo-oscuro text-white",
        icon: ErrorIcon,
        title: "Error",
      };
    }

    // Error de validación - Amarillo
    if (Object.values(ValidationErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF8E6] border-l-4 border-naranja-principal",
        iconBgClass: "bg-naranja-principal text-white",
        icon: WarningIcon,
        title: "Validación",
      };
    }

    // Error de conflicto de datos - Naranja
    if (Object.values(DataConflictErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF4E6] border-l-4 border-naranja-principal",
        iconBgClass: "bg-naranja-principal text-white",
        icon: DataIcon,
        title: "Conflicto",
      };
    }

    // Error de permisos - Naranja oscuro
    if (Object.values(PermissionErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF0E6] border-l-4 border-[#FF6B35]",
        iconBgClass: "bg-[#FF6B35] text-white",
        icon: LockIcon,
        title: "Permisos",
      };
    }

    // Error de token/autenticación - Rojo oscuro
    if (Object.values(TokenErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF0E6] border-l-4 border-[#FF6B35]",
        iconBgClass: "bg-[#FF6B35] text-white",
        icon: TokenIcon,
        title: "Token",
      };
    }

    // Error de autenticación - Rojo intenso
    if (Object.values(AuthenticationErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFE6E6] border-l-4 border-[#E53935]",
        iconBgClass: "bg-[#E53935] text-white",
        icon: AuthIcon,
        title: "Autenticación",
      };
    }

    // Error de usuario - Naranja rojizo
    if (Object.values(UserErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF0E6] border-l-4 border-[#FF6B35]",
        iconBgClass: "bg-[#FF6B35] text-white",
        icon: UserIcon,
        title: "Usuario",
      };
    }

    // Error de archivos - Violeta
    if (Object.values(FileErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#F8F0FF] border-l-4 border-violeta-principal",
        iconBgClass: "bg-violeta-principal text-white",
        icon: FileIcon,
        title: "Archivo",
      };
    }

    // Error de solicitud - Azul oscuro
    if (Object.values(RequestErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#F0F7FF] border-l-4 border-azul-principal",
        iconBgClass: "bg-azul-principal text-white",
        icon: RequestIcon,
        title: "Solicitud",
      };
    }

    // Error de sistema - Rojo
    if (Object.values(SystemErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFF0F0] border-l-4 border-rojo-oscuro",
        iconBgClass: "bg-rojo-oscuro text-white",
        icon: ErrorIcon,
        title: "Sistema",
      };
    }

    // 🆕 Error de red/conectividad - Rojo intenso (crítico)
    if (Object.values(NetworkErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#FFE6E6] border-l-4 border-[#D32F2F]",
        iconBgClass: "bg-[#D32F2F] text-white",
        icon: NetworkIcon,
        title: "Conectividad",
      };
    }

    // 🆕 Error de sincronización - Azul
    if (Object.values(SyncErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#E3F2FD] border-l-4 border-[#1976D2]",
        iconBgClass: "bg-[#1976D2] text-white",
        icon: SyncIcon,
        title: "Sincronización",
      };
    }

    // 🆕 Error de cache - Violeta claro
    if (Object.values(CacheErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#F3E5F5] border-l-4 border-[#7B1FA2]",
        iconBgClass: "bg-[#7B1FA2] text-white",
        icon: CacheIcon,
        title: "Cache",
      };
    }

    // 🆕 Error de almacenamiento - Violeta oscuro
    if (Object.values(StorageErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#EDE7F6] border-l-4 border-[#512DA8]",
        iconBgClass: "bg-[#512DA8] text-white",
        icon: StorageIcon,
        title: "Almacenamiento",
      };
    }

    // 🆕 Error de asistencia - Verde oscuro
    if (Object.values(AttendanceErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#E8F5E8] border-l-4 border-[#388E3C]",
        iconBgClass: "bg-[#388E3C] text-white",
        icon: AttendanceIcon,
        title: "Asistencia",
      };
    }

    // 🆕 Error de datos - Azul oscuro
    if (Object.values(DataErrorTypes).includes(errorType as any)) {
      return {
        containerClass: "bg-[#E1F5FE] border-l-4 border-[#0277BD]",
        iconBgClass: "bg-[#0277BD] text-white",
        icon: DatabaseIcon,
        title: "Datos",
      };
    }

    // Por defecto, si no coincide con ninguno específico, usamos el rojo
    return {
      containerClass: "bg-[#FFF0F0] border-l-4 border-rojo-oscuro",
      iconBgClass: "bg-rojo-oscuro text-white",
      icon: ErrorIcon,
      title: "Error",
    };
  };

  const { containerClass, iconBgClass, icon: Icon, title } = getErrorStyle();

  return (
    <div
      className={`w-full max-w-full relative rounded-md overflow-hidden ${containerClass} ${className}`}
      role="alert"
      style={{ maxWidth: "100%", boxSizing: "border-box" }}
    >
      <div className="flex items-start py-2 px-3 sxs-only:px-2 xs-only:px-2">
        <div className="flex-shrink-0 mr-2 sxs-only:mr-1.5 xs-only:mr-1.5 mt-0.5">
          <div
            className={`flex items-center justify-center w-5 h-5 sxs-only:w-4 sxs-only:h-4 xs-only:w-4 xs-only:h-4 rounded-full ${iconBgClass}`}
          >
            <Icon className="w-3 h-3 sxs-only:w-2.5 sxs-only:h-2.5 xs-only:w-2.5 xs-only:h-2.5" />
          </div>
        </div>
        <div className="flex-1 min-w-0 max-w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-0.5">
            <h5 className="font-medium text-xs sxs-only:text-[10px] xs-only:text-[10px] text-gris-oscuro shrink-0">
              {title}
            </h5>
            <span className="hidden md:block text-gris-oscuro text-[10px] mx-1 shrink-0">
              •
            </span>
            <p
              className="text-xs sxs-only:text-[10px] xs-only:text-[10px] text-gris-oscuro overflow-hidden text-ellipsis break-all"
              style={{
                maxWidth: "100%",
                wordBreak: "break-word",
                display: "-webkit-box",
                WebkitLineClamp: "4",
                WebkitBoxOrient: "vertical",
              }}
              title={message} // Para mostrar el mensaje completo al hacer hover
            >
              {message}
            </p>
          </div>
        </div>

        {/* Botón para cerrar si closable es true */}
        {closable && (
          <button
            type="button"
            className="flex-shrink-0 ml-1 p-0.5 rounded-md text-gris-oscuro hover:bg-gris-claro hover:text-gris-oscuro transition-colors self-start"
            onClick={() => {
              setVisible(false);
              setError?.(null);
            }}
            aria-label="Cerrar"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

// ========================================
// 🎨 ICONOS EXISTENTES
// ========================================

const ErrorIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarningIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const LockIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);

const FileIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const TokenIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

const AuthIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const DataIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
    />
  </svg>
);

const RequestIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 6h16M4 12h16m-7 6h7"
    />
  </svg>
);

// ========================================
// 🆕 NUEVOS ICONOS PARA NUEVOS TIPOS DE ERROR
// ========================================

const NetworkIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
    />
  </svg>
);

const SyncIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const CacheIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
    />
  </svg>
);

const StorageIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
    />
  </svg>
);

const AttendanceIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const DatabaseIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export default ErrorMessage;

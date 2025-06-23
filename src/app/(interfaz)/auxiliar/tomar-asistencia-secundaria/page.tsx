"use client";

import { useSS01 } from "@/hooks/useSS01";
import React, { useEffect, useRef, useCallback } from "react";
import { TomaAsistenciaPersonalSIU01Events } from "@/SS01/sockets/events/AsistenciaDePersonal/frontend/TomaAsistenciaPersonalSIU01Events";

const TomarAsistenciaSecundaria = () => {
  const { globalSocket, isConnected, isReady, getDebugInfo } = useSS01();

  // Ref para mantener referencia al handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saludoHandlerRef = useRef<InstanceType<
    typeof TomaAsistenciaPersonalSIU01Events.RESPUESTA_SALUDO_HANDLER
  > | null>(null);

  // Configurar handlers cuando el socket esté REALMENTE listo
  useEffect(() => {
    if (!isReady) {
      return;
    }


    //HANDLERS

    // Configurar handler para respuesta de saludo (estilo original)
    saludoHandlerRef.current =
      new TomaAsistenciaPersonalSIU01Events.RESPUESTA_SALUDO_HANDLER(
        (saludo) => {
          console.log("🎉 ¡Saludo recibido desde el servidor!", saludo);
          // Aquí puedes actualizar el estado del componente, mostrar notificación, etc.
        }
      );

    // Registrar el handler (estilo original)
    // const handlerRegistered = 
    saludoHandlerRef.current.hand();

    // if (handlerRegistered) {
    //   console.log("✅ Handler de saludo registrado correctamente");
    // }

    // Cleanup al desmontar o cambiar de socket (estilo original)
    return () => {
      if (saludoHandlerRef.current) {
        saludoHandlerRef.current.unhand();
        saludoHandlerRef.current = null;
      }
    };
  }, [isReady]); // Solo depende de isReady

  // Función para enviar saludo (estilo original)
  const saludarme = useCallback(() => {
    if (!isReady) {
      console.warn("⚠️ Conexión no está lista");
      alert("Conexión no está lista");
      return;
    }

    // Crear y ejecutar emisor (estilo original)
    const emitter =
      new TomaAsistenciaPersonalSIU01Events.SALUDAME_SOCKET_EMITTER();
    const sent = emitter.execute();

    if (!sent) {
      console.error("❌ Error al enviar saludo");
      alert("Error al enviar saludo");
    }
  }, [isReady]);

  // Debug del estado de conexión
  const debugConnection = useCallback(() => {
    const debugInfo = getDebugInfo();
    console.log("🔍 Debug:", debugInfo);
    alert(`Estado: ${JSON.stringify(debugInfo, null, 2)}`);
  }, [getDebugInfo]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Tomar Asistencia Secundaria</h1>

      {/* Estado de conexión */}
      <div className="mb-4 p-3 border rounded">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected ? "Socket conectado" : "Socket desconectado"}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div
            className={`w-3 h-3 rounded-full ${
              isReady ? "bg-blue-500" : "bg-gray-400"
            }`}
          />
          <span className="text-sm">
            {isReady ? "Sistema listo" : "Preparando sistema..."}
          </span>
        </div>

        {globalSocket?.id && (
          <div className="text-xs text-gray-600 mt-1">
            Socket ID: {globalSocket.id}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        <button
          onClick={saludarme}
          disabled={!isReady}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isReady ? "SALUDARME DESDE EL SS01" : "Esperando conexión..."}
        </button>

        <button
          onClick={debugConnection}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm"
        >
          Debug Conexión
        </button>
      </div>

      {/* Información adicional */}
      <div className="mt-4 text-xs text-gray-600">
        <div>Handler registrado: {saludoHandlerRef.current ? "✅" : "❌"}</div>
        <div>
          Socket asignado:{" "}
          {TomaAsistenciaPersonalSIU01Events.socketConnection ? "✅" : "❌"}
        </div>
        <div>Estado: {isReady ? "✅ Listo" : "⏳ Preparando..."}</div>
      </div>
    </div>
  );
};

export default TomarAsistenciaSecundaria;

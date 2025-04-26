"use client";
import "dotenv/config";
import React, { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

const TomarAsistenciaSecundaria = () => {
  // Usar un state para almacenar la instancia del socket
  const [socket, setSocket] = useState<typeof Socket | null>(null);

  useEffect(() => {
    // Para pruebas, genera un token simulado con los datos necesarios
    // En producción, este token vendría del servidor tras iniciar sesión
    // const mockUserData = {
    //   id: "123",
    //   username: "profesor1",
    //   role: "profesor-primaria"
    // };

    // O puedes usar un token codificado manualmente para pruebas
    const fakeToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsInVzZXJuYW1lIjoicHJvZmVzb3IxIiwicm9sZSI6InByb2Zlc29yLXByaW1hcmlhIiwiaWF0IjoxNzA5NzUwNDAwLCJleHAiOjE3MDk3NTQwMDB9.tu-firma-aqui";

    // Inicializar la conexión al montar el componente
    const socketInstance = io(process.env.NEXT_PUBLIC_SS01_URL_BASE!, {
      auth: {
        token: fakeToken,
      },
    });

    // Evento de conexión exitosa
    socketInstance.on("connect", () => {
      console.log("Conectado al servidor de sockets");
    });

    // Manejar errores de conexión
    socketInstance.on("connect_error", (error: Error) => {
      console.error("Error de conexión:", error.message);
    });

    // Guardar la instancia en el state
    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []); // Ejecutar solo al montar/desmontar

  // Función para registrar asistencia
  const registrarAsistencia = (estudianteId: string, estado: string) => {
    if (socket) {
      socket.emit("REGISTRAR-ASISTENCIA", {
        estudianteId,
        estado, // 'A' (Asistió), 'T' (Tardanza), 'F' (Falta)
        aula: "3B-Secundaria",
        fecha: new Date(),
      });
    }
  };

  // Función para solicitar datos de asistencia
  const solicitarAsistencias = () => {
    if (socket) {
      socket.emit("SOLICITAR-ASISTENCIAS-AULA", {
        aula: "3B-Secundaria",
        fecha: new Date(),
      });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Tomar Asistencia Secundaria</h1>

      <button
        onClick={solicitarAsistencias}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Cargar Lista de Estudiantes
      </button>

      <div>Aquí irían los estudiantes</div>

      {/* Ejemplo de botón para probar la función registrarAsistencia */}
      <button
        onClick={() => registrarAsistencia("est123", "A")}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
      >
        Marcar Presente (Prueba)
      </button>
    </div>
  );
};

export default TomarAsistenciaSecundaria;

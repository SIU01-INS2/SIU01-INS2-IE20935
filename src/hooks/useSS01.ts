/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entornos_BasePaths_SS01 } from "@/Assets/ss01/Entornos";
import { ENTORNO } from "@/constants/ENTORNO";
import {
  setGlobalSocket,
  clearGlobalSocket,
  setConnectionStatus,
  setConnectionError,
} from "@/global/state/others/globalSocket";
import { AppDispatch, RootState } from "@/global/store";
import userStorage from "@/lib/utils/local/db/models/UserStorage";
import { TomaAsistenciaPersonalSIU01Events } from "@/SS01/sockets/events/AsistenciaDePersonal/frontend/TomaAsistenciaPersonalSIU01Events";
import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import io, { Socket } from "socket.io-client";

export const useSS01 = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReallyConnected, setIsReallyConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const socketRef = useRef<typeof Socket | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);

  const globalSocket = useSelector(
    (state: RootState) => state.others.globalSocket.socket
  );

  const isConnected = useSelector(
    (state: RootState) => state.others.globalSocket.isConnected
  );

  const dispatch = useDispatch<AppDispatch>();

  // Obtener token al inicializar
  const getToken = useCallback(async () => {
    try {
      const currentToken = await userStorage.getAuthToken();
      setToken(currentToken);
    } catch (error) {
      console.error("Error al obtener token:", error);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) {
      getToken();
      setIsInitialized(true);
    }
  }, [getToken, isInitialized]);

  // Crear conexión Socket.IO
  const createSocketConnection = useCallback(() => {
    if (!token || connectionAttemptRef.current || globalSocket) {
      return;
    }

    connectionAttemptRef.current = true;
    console.log("🚀 [useSS01] Creando conexión Socket.IO");

    try {
      const socketConnection = io(process.env.NEXT_PUBLIC_SS01_URL_BASE!, {
        path: Entornos_BasePaths_SS01[ENTORNO],
        auth: { token },
        transports: ["websocket", "polling"],
        autoConnect: true,
        forceNew: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Configurar event listeners
      socketConnection.on("connect", () => {
        console.log("✅ [useSS01] Conectado al servidor SS01");

        setTimeout(() => {
          if (socketConnection.connected) {
            setIsReallyConnected(true);
            dispatch(setConnectionStatus({ value: true }));
            // Asignar automáticamente a la clase de eventos
            TomaAsistenciaPersonalSIU01Events.socketConnection =
              socketConnection;
            setIsReady(true);
          }
        }, 200);
      });

      socketConnection.on("disconnect", (reason: any) => {
        console.log("❌ [useSS01] Desconectado:", reason);
        setIsReallyConnected(false);
        setIsReady(false);
        dispatch(setConnectionStatus({ value: false }));
        TomaAsistenciaPersonalSIU01Events.socketConnection = null;
      });

      socketConnection.on("connect_error", (error: any) => {
        console.error("💥 [useSS01] Error de conexión:", error);
        setIsReallyConnected(false);
        setIsReady(false);
        dispatch(setConnectionError({ value: error.message }));
        connectionAttemptRef.current = false;
        TomaAsistenciaPersonalSIU01Events.socketConnection = null;
      });

      socketConnection.on("reconnect", (attemptNumber: any) => {
        console.log("🔄 [useSS01] Reconectado. Intento:", attemptNumber);

        setTimeout(() => {
          if (socketConnection.connected) {
            setIsReallyConnected(true);
            setIsReady(true);
            dispatch(setConnectionStatus({ value: true }));
            dispatch(setConnectionError({ value: null }));
            TomaAsistenciaPersonalSIU01Events.socketConnection =
              socketConnection;
          }
        }, 200);
      });

      socketRef.current = socketConnection;
      dispatch(setGlobalSocket({ value: socketConnection }));
    } catch (error) {
      console.error("❌ [useSS01] Error al crear conexión:", error);
      connectionAttemptRef.current = false;
      setIsReallyConnected(false);
      setIsReady(false);
    }
  }, [token, globalSocket, dispatch]);

  // Limpiar conexión
  const cleanupConnection = useCallback(() => {
    if (socketRef.current) {
      console.log("🧹 [useSS01] Limpiando conexión");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsReallyConnected(false);
    setIsReady(false);
    dispatch(clearGlobalSocket());
    connectionAttemptRef.current = false;
    TomaAsistenciaPersonalSIU01Events.socketConnection = null;
  }, [dispatch]);

  // Crear conexión cuando tengamos token
  useEffect(() => {
    if (token && !globalSocket && !connectionAttemptRef.current) {
      createSocketConnection();
    }
  }, [token, globalSocket, createSocketConnection]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  // Debug simplificado
  const getDebugInfo = useCallback(() => {
    const status = TomaAsistenciaPersonalSIU01Events.getConnectionStatus();

    return {
      // Estados del hook
      hookIsConnected: isConnected,
      hookIsReallyConnected: isReallyConnected,
      hookIsReady: isReady,

      // Estados del socket global
      globalSocketExists: !!globalSocket,
      globalSocketConnected: globalSocket?.connected,
      globalSocketId: globalSocket?.id,

      // Estados de la clase de eventos
      classSocketExists: !!TomaAsistenciaPersonalSIU01Events.socketConnection,
      classSocketConnected:
        TomaAsistenciaPersonalSIU01Events.socketConnection?.connected,

      // Status de la clase
      classStatus: status,
    };
  }, [globalSocket, isConnected, isReallyConnected, isReady]);

  // Funciones helper
  const disconnect = useCallback(() => {
    cleanupConnection();
  }, [cleanupConnection]);

  const reconnect = useCallback(() => {
    cleanupConnection();
    setTimeout(() => {
      createSocketConnection();
    }, 100);
  }, [cleanupConnection, createSocketConnection]);

  return {
    // Estados principales
    globalSocket,
    isConnected,
    isReallyConnected,
    isReady,

    // Utilidades
    getDebugInfo,
    disconnect,
    reconnect,

    // Para retrocompatibilidad
    token: !!token,
  };
};

// "use client";
// import LapizFirmando from "@/components/icons/LapizFirmando";
// import MarcarAsistenciaPropiaDePersonalModal from "@/components/modals/AsistenciaPropiaPersonal/MarcarAsistenciaPropiaDePersonalModal";
// import store, { RootState } from "@/global/store";
// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
//   useMemo,
//   memo,
// } from "react";
// import { useSelector } from "react-redux";
// import { SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY } from "../PlantillaLogin";
// import { useDelegacionEventos } from "@/hooks/useDelegacionDeEventos";
// import { RolesSistema } from "@/interfaces/shared/RolesSistema";
// import { AsistenciaDePersonalIDB } from "@/lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
// import { DatosAsistenciaHoyIDB } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/DatosAsistenciaHoyIDB";
// import { HandlerAsistenciaBase } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerDatosAsistenciaBase";
// import { HandlerProfesorPrimariaAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerProfesorPrimariaAsistenciaResponse";
// import { HorarioTomaAsistencia } from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
// import { HandlerAuxiliarAsistenciaResponse } from "../../../lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerAuxiliarAsistenciaResponse";
// import { HandlerProfesorTutorSecundariaAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerProfesorTutorSecundariaAsistenciaResponse";
// import { HandlerPersonalAdministrativoAsistenciaResponse } from "@/lib/utils/local/db/models/DatosAsistenciaHoy/handlers/HandlerPersonalAdministrativoAsistenciaResponse";
// import {
//   EXTENSIONES_ENTRADA_MINUTOS_PARA_PERSONALES,
//   EXTENSIONES_SALIDA_MINUTOS_PARA_PERSONALES,
// } from "@/constants/EXTENSIONES_TOMA_ASISTENCIA";

import { RolesSistema } from "@/interfaces/shared/RolesSistema";

// // ✅ INTERFACES SIMPLES
// interface EstadoAsistencia {
//   entradaMarcada: boolean;
//   salidaMarcada: boolean;
//   ultimaVerificacion: number;
//   inicializado: boolean;
// }

// interface EstadoBoton {
//   visible: boolean;
//   habilitado: boolean;
//   tipo: "entrada" | "salida" | null;
//   color: "verde" | "rojizo";
//   tooltip: string;
//   mostrarTooltip: boolean;
//   razon?: string;
// }

// // ✅ CONSTANTES
// const VERIFICACION_CADA_HORA_MS = 60 * 60 * 1000; // 1 hora
// const RETRY_HORARIO_MS = 30000; // 30 segundos

// // ✅ SELECTOR OPTIMIZADO QUE SOLO CAMBIA CADA HORA
// const selectHoraActual = (state: RootState) => {
//   const fechaHora = state.others.fechaHoraActualReal.fechaHora;
//   if (!fechaHora) return null;

//   const fecha = new Date(fechaHora);
//   // ✅ CLAVE: Solo hora (NO minutos ni segundos)
//   return {
//     fecha: fecha.toISOString().split("T")[0], // YYYY-MM-DD
//     hora: fecha.getHours(),
//     // ✅ Timestamp que solo cambia cada HORA
//     timestamp: Math.floor(fecha.getTime() / 3600000) * 3600000, // Redondear a horas
//   };
// };

// const selectSidebar = (state: RootState) => ({
//   height: state.elementsDimensions.navBarFooterHeight,
//   isOpen: state.flags.sidebarIsOpen,
// });

// const MarcarAsistenciaDePersonalButton = memo(
//   ({ rol }: { rol: RolesSistema }) => {
//     const { delegarEvento } = useDelegacionEventos();

//     // ✅ SELECTORES OPTIMIZADOS
//     const horaActual = useSelector(selectHoraActual);
//     const sidebar = useSelector(selectSidebar);

//     // ✅ ESTADOS MÍNIMOS
//     const [horario, setHorario] = useState<HorarioTomaAsistencia | null>(null);
//     const [asistencia, setAsistencia] = useState<EstadoAsistencia>({
//       entradaMarcada: false,
//       salidaMarcada: false,
//       ultimaVerificacion: 0,
//       inicializado: false,
//     });
//     const [estadoBoton, setEstadoBoton] = useState<EstadoBoton>({
//       visible: false,
//       habilitado: false,
//       tipo: null,
//       color: "verde",
//       tooltip: "",
//       mostrarTooltip: false,
//     });
//     const [mostrarModal, setMostrarModal] = useState(false);
//     const [asistenciaIDB, setAsistenciaIDB] =
//       useState<AsistenciaDePersonalIDB | null>(null);

//     // ✅ REFS
//     const intervalRef = useRef<NodeJS.Timeout | null>(null);
//     const retryRef = useRef<NodeJS.Timeout | null>(null);
//     const ultimaHoraConsultada = useRef<number>(-1);

//     // ✅ LOG PARA VER CUÁNDO CAMBIA (debe ser solo cada HORA)
//     useEffect(() => {
//       if (horaActual) {
//         console.log(`🕐 Hora cambió: ${horaActual.hora}:00 (solo cada hora)`);
//       }
//     }, [horaActual?.timestamp]);

//     // ✅ EXTENSIONES MEMOIZADAS
//     const extensiones = useMemo(
//       () => ({
//         entrada:
//           EXTENSIONES_ENTRADA_MINUTOS_PARA_PERSONALES[
//             rol as keyof typeof EXTENSIONES_ENTRADA_MINUTOS_PARA_PERSONALES
//           ] || 0,
//         salida:
//           EXTENSIONES_SALIDA_MINUTOS_PARA_PERSONALES[
//             rol as keyof typeof EXTENSIONES_SALIDA_MINUTOS_PARA_PERSONALES
//           ] || 0,
//       }),
//       [rol]
//     );

//     // ✅ DEBUGGING TEMPORAL EN TU COMPONENTE
//     useEffect(() => {
//       const state = store.getState();
//       const fechaRedux = state.others.fechaHoraActualReal.fechaHora;

//       if (fechaRedux) {
//         console.log("🔍 DEBUGGING FECHA REDUX EN COMPONENTE:", {
//           fechaReduxOriginal: fechaRedux,
//           fechaParsed: new Date(fechaRedux),
//           horaActual: new Date(fechaRedux).getHours(),
//           horaEsperada: 15, // 3 PM
//           diferencia: new Date(fechaRedux).getHours() - 15,
//           estaEnHorario:
//             new Date(fechaRedux).getHours() >= 12 &&
//             new Date(fechaRedux).getHours() <= 18,
//         });
//       }
//     }, []);

//     // ✅ INICIALIZACIÓN
//     useEffect(() => {
//       setAsistenciaIDB(new AsistenciaDePersonalIDB("API01"));
//     }, []);

//     useEffect(() => {
//       if (!delegarEvento) return;
//       delegarEvento(
//         "mousedown",
//         "#tooltip-mostrar-asistencia-personal, #tooltip-mostrar-asistencia-personal *",
//         () => ocultarTooltip(),
//         true
//       );
//     }, [delegarEvento]);

//     // ✅ FUNCIÓN HELPER: Restar 5 horas a la fecha de Redux
//     const obtenerFechaReduxCorregida = (): Date | null => {
//       const fechaHoraRedux =
//         store.getState().others.fechaHoraActualReal.fechaHora;
//       const reduxInicializado =
//         store.getState().others.fechaHoraActualReal.inicializado;

//       if (!fechaHoraRedux || !reduxInicializado) {
//         return null;
//       }

//       const fechaRedux = new Date(fechaHoraRedux);
//       // ✅ RESTAR 5 HORAS para obtener la hora real
//       fechaRedux.setHours(fechaRedux.getHours() - 5);

//       console.log("🕐 CORRECCIÓN DE HORA REDUX:", {
//         fechaReduxOriginal: fechaHoraRedux,
//         fechaReduxCorregida: fechaRedux.toISOString(),
//         horaOriginal: new Date(fechaHoraRedux).getHours(),
//         horaCorregida: fechaRedux.getHours(),
//       });

//       return fechaRedux;
//     };

//     // ✅ FUNCIÓN CORREGIDA: aplicarExtensiones usando fecha corregida
//     const aplicarExtensiones = useCallback(
//       (horarioBase: HorarioTomaAsistencia) => {
//         if (!horarioBase.Inicio || !horarioBase.Fin || !horaActual) return null;

//         // ✅ USAR FECHA REDUX CORREGIDA (-5 horas)
//         const fechaCompletaRedux = obtenerFechaReduxCorregida();

//         if (!fechaCompletaRedux) {
//           console.log("⏳ Redux no inicializado o fecha no disponible");
//           return null;
//         }

//         // ✅ EXTRAER SOLO LAS HORAS del horario original
//         const horarioInicio = new Date(horarioBase.Inicio);
//         const horarioFin = new Date(horarioBase.Fin);

//         // ✅ CREAR NUEVAS FECHAS con la fecha REDUX CORREGIDA pero las horas del horario
//         const inicioHoy = new Date(fechaCompletaRedux);
//         inicioHoy.setHours(
//           horarioInicio.getHours(),
//           horarioInicio.getMinutes(),
//           horarioInicio.getSeconds(),
//           horarioInicio.getMilliseconds()
//         );

//         const finHoy = new Date(fechaCompletaRedux);
//         finHoy.setHours(
//           horarioFin.getHours(),
//           horarioFin.getMinutes(),
//           horarioFin.getSeconds(),
//           horarioFin.getMilliseconds()
//         );

//         // ✅ APLICAR EXTENSIONES a las fechas normalizadas
//         const inicioExtendido = new Date(
//           inicioHoy.getTime() - extensiones.entrada * 60 * 1000
//         );
//         const finExtendido = new Date(
//           finHoy.getTime() + extensiones.salida * 60 * 1000
//         );

//         console.log("🔧 Normalización de horarios (CORREGIDO -5h):", {
//           fechaCompletaRedux: fechaCompletaRedux.toISOString(),
//           horarioOriginalInicio: horarioBase.Inicio,
//           horarioOriginalFin: horarioBase.Fin,
//           inicioHoy: inicioHoy.toISOString(),
//           finHoy: finHoy.toISOString(),
//           inicioExtendido: inicioExtendido.toISOString(),
//           finExtendido: finExtendido.toISOString(),
//           extensiones,
//         });

//         return {
//           inicioExtendido,
//           finExtendido,
//         };
//       },
//       [extensiones, horaActual]
//     );

//     // ✅ FUNCIÓN CORREGIDA: determinarEstado con lógica de visibilidad basada en asistencia marcada
//     const determinarEstado = useCallback((): EstadoBoton => {
//       if (!horario || !horaActual) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: "Datos no disponibles",
//         };
//       }

//       const extensionesAplicadas = aplicarExtensiones(horario);
//       if (!extensionesAplicadas) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: "Horario inválido o Redux no inicializado",
//         };
//       }

//       const ahoraCompletaRedux = obtenerFechaReduxCorregida();

//       if (!ahoraCompletaRedux) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: "Fecha Redux no disponible",
//         };
//       }

//       const { inicioExtendido, finExtendido } = extensionesAplicadas;
//       const enHorarioExtendido =
//         ahoraCompletaRedux >= inicioExtendido &&
//         ahoraCompletaRedux <= finExtendido;

//       console.log("🕐 Verificación de horario extendido (CORREGIDO -5h):", {
//         ahoraCompletaRedux: ahoraCompletaRedux.toISOString(),
//         inicioExtendido: inicioExtendido.toISOString(),
//         finExtendido: finExtendido.toISOString(),
//         enHorarioExtendido,
//         entradaMarcada: asistencia.entradaMarcada,
//         salidaMarcada: asistencia.salidaMarcada,
//       });

//       // ❌ FUERA DEL HORARIO EXTENDIDO: No mostrar botón
//       if (!enHorarioExtendido) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: `Fuera de horario laboral extendido (${inicioExtendido.toLocaleTimeString()} - ${finExtendido.toLocaleTimeString()})`,
//         };
//       }

//       // ✅ CALCULAR HORARIO REAL DE SALIDA (sin extensiones)
//       const horarioFin = new Date(horario.Fin);
//       const salidaReal = new Date(ahoraCompletaRedux);
//       salidaReal.setHours(
//         horarioFin.getHours(),
//         horarioFin.getMinutes(),
//         horarioFin.getSeconds(),
//         horarioFin.getMilliseconds()
//       );

//       // Calcular tiempo restante hasta la salida real
//       const tiempoHastaSalidaMs =
//         salidaReal.getTime() - ahoraCompletaRedux.getTime();
//       const tiempoHastaSalidaMinutos = Math.floor(
//         tiempoHastaSalidaMs / (1000 * 60)
//       );
//       const falta1HoraOMenosParaSalida =
//         tiempoHastaSalidaMinutos <= 60 && tiempoHastaSalidaMinutos >= 0;

//       console.log("⏰ Verificación salida real:", {
//         salidaReal: salidaReal.toISOString(),
//         tiempoHastaSalidaMinutos,
//         falta1HoraOMenosParaSalida,
//         entradaMarcada: asistencia.entradaMarcada,
//         salidaMarcada: asistencia.salidaMarcada,
//       });

//       // 🔄 LÓGICA DE VISIBILIDAD BASADA EN ASISTENCIAS MARCADAS

//       // 1️⃣ CASO: SIN ENTRADA MARCADA
//       if (!asistencia.entradaMarcada) {
//         return {
//           visible: true,
//           habilitado: true,
//           tipo: "entrada",
//           color: "verde",
//           tooltip: "¡Registra tu entrada!",
//           mostrarTooltip: true,
//         };
//       }

//       // 2️⃣ CASO: ENTRADA MARCADA pero SIN SALIDA MARCADA
//       if (asistencia.entradaMarcada && !asistencia.salidaMarcada) {
//         // ✅ Si falta 1 hora o menos para salida real → Mostrar botón de salida
//         if (falta1HoraOMenosParaSalida) {
//           return {
//             visible: true,
//             habilitado: true,
//             tipo: "salida",
//             color: "rojizo",
//             tooltip: "¡Registra tu salida!",
//             mostrarTooltip: true,
//           };
//         } else {
//           // ❌ Aún no es momento de salida → Ocultar botón
//           return {
//             visible: false,
//             habilitado: false,
//             tipo: null,
//             color: "verde",
//             tooltip: "",
//             mostrarTooltip: false,
//             razon: `Salida disponible en ${tiempoHastaSalidaMinutos} minutos`,
//           };
//         }
//       }

//       // 3️⃣ CASO: AMBAS ASISTENCIAS MARCADAS (entrada y salida)
//       if (asistencia.entradaMarcada && asistencia.salidaMarcada) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: "Asistencia completa (entrada y salida registradas)",
//         };
//       }

//       // 4️⃣ CASO: SOLO SALIDA MARCADA (caso extraño, pero manejamos)
//       if (!asistencia.entradaMarcada && asistencia.salidaMarcada) {
//         return {
//           visible: false,
//           habilitado: false,
//           tipo: null,
//           color: "verde",
//           tooltip: "",
//           mostrarTooltip: false,
//           razon: "Solo salida registrada (sin entrada)",
//         };
//       }

//       // 5️⃣ CASO: Estado por defecto (no debería llegar aquí)
//       return {
//         visible: false,
//         habilitado: false,
//         tipo: null,
//         color: "verde",
//         tooltip: "",
//         mostrarTooltip: false,
//         razon: "Estado no determinado",
//       };
//     }, [horario, horaActual, asistencia, aplicarExtensiones]);

//     // ✅ FUNCIÓN: Consultar estado asistencia (SOLO cuando es ABSOLUTAMENTE necesario)
//     const consultarAsistencia = useCallback(
//       async (razon: string) => {
//         if (!asistenciaIDB) {
//           console.log("❌ No hay AsistenciaIDB disponible");
//           return;
//         }

//         const ahora = Date.now();

//         // ✅ SI YA SE CONSULTÓ EN LA ÚLTIMA HORA, NO CONSULTAR DE NUEVO
//         if (
//           asistencia.inicializado &&
//           ahora - asistencia.ultimaVerificacion < VERIFICACION_CADA_HORA_MS
//         ) {
//           const minutosFaltantes = Math.ceil(
//             (VERIFICACION_CADA_HORA_MS -
//               (ahora - asistencia.ultimaVerificacion)) /
//               (1000 * 60)
//           );
//           console.log(
//             `⏱️ CONSULTA BLOQUEADA (${razon}): próxima en ${minutosFaltantes} minutos`
//           );
//           return;
//         }

//         try {
//           console.log(
//             `🔍 CONSULTANDO asistencia para ${rol} - Razón: ${razon}`
//           );
//           const resultado = await asistenciaIDB.consultarMiAsistenciaPersonal(
//             rol
//           );

//           setAsistencia({
//             entradaMarcada: resultado.entrada.marcada,
//             salidaMarcada: resultado.salida.marcada,
//             ultimaVerificacion: ahora,
//             inicializado: true,
//           });

//           console.log(`✅ Asistencia actualizada (${razon}):`, {
//             entrada: resultado.entrada.marcada,
//             salida: resultado.salida.marcada,
//             timestamp: new Date(ahora).toLocaleTimeString(),
//           });
//         } catch (error) {
//           console.error(`❌ Error al consultar asistencia (${razon}):`, error);
//         }
//       },
//       [
//         asistenciaIDB,
//         asistencia.ultimaVerificacion,
//         asistencia.inicializado,
//         rol,
//       ]
//     );

//     // ✅ FUNCIÓN: Obtener horario (sin consultas automáticas)
//     const obtenerHorario = useCallback(async () => {
//       if (rol === RolesSistema.Directivo || rol === RolesSistema.Responsable)
//         return;

//       try {
//         const datosIDB = new DatosAsistenciaHoyIDB();
//         const handler = (await datosIDB.getHandler()) as HandlerAsistenciaBase;

//         if (!handler) {
//           console.warn("No se pudo obtener handler, reintentando...");
//           if (retryRef.current) clearTimeout(retryRef.current);
//           retryRef.current = setTimeout(obtenerHorario, RETRY_HORARIO_MS);
//           return;
//         }

//         let nuevoHorario: HorarioTomaAsistencia | null = null;

//         switch (rol) {
//           case RolesSistema.ProfesorPrimaria:
//             nuevoHorario = (
//               handler as HandlerProfesorPrimariaAsistenciaResponse
//             ).getMiHorarioTomaAsistencia();
//             break;
//           case RolesSistema.Auxiliar:
//             nuevoHorario = (
//               handler as HandlerAuxiliarAsistenciaResponse
//             ).getMiHorarioTomaAsistencia();
//             break;
//           case RolesSistema.ProfesorSecundaria:
//           case RolesSistema.Tutor:
//             const horarioPersonal = (
//               handler as HandlerProfesorTutorSecundariaAsistenciaResponse
//             ).getMiHorarioTomaAsistencia();
//             if (horarioPersonal) {
//               nuevoHorario = {
//                 Inicio: horarioPersonal.Hora_Entrada_Dia_Actual,
//                 Fin: horarioPersonal.Hora_Salida_Dia_Actual,
//               };
//             }
//             break;
//           case RolesSistema.PersonalAdministrativo:
//             const horarioAdmin = (
//               handler as HandlerPersonalAdministrativoAsistenciaResponse
//             ).getHorarioPersonal();
//             if (horarioAdmin) {
//               nuevoHorario = {
//                 Inicio: horarioAdmin.Horario_Laboral_Entrada,
//                 Fin: horarioAdmin.Horario_Laboral_Salida,
//               };
//             }
//             break;
//         }

//         if (nuevoHorario) {
//           setHorario(nuevoHorario);
//           console.log(`✅ Horario obtenido para ${rol}:`, nuevoHorario);

//           // ✅ SOLO AQUÍ hacemos la primera consulta de asistencia
//           if (!asistencia.inicializado) {
//             consultarAsistencia("inicialización con horario");
//           }
//         } else {
//           console.warn("Horario no disponible, reintentando...");
//           if (retryRef.current) clearTimeout(retryRef.current);
//           retryRef.current = setTimeout(obtenerHorario, RETRY_HORARIO_MS);
//         }
//       } catch (error) {
//         console.error("Error al obtener horario:", error);
//         if (retryRef.current) clearTimeout(retryRef.current);
//         retryRef.current = setTimeout(obtenerHorario, RETRY_HORARIO_MS);
//       }
//     }, [rol, asistencia.inicializado, consultarAsistencia]);

//     // ✅ EFECTO: Obtener horario al inicio
//     useEffect(() => {
//       if (!horario) {
//         obtenerHorario();
//       }
//     }, [horario, obtenerHorario]);

//     // ✅ EFECTO: Consulta SOLO cuando cambia la HORA
//     useEffect(() => {
//       if (!horaActual || !asistencia.inicializado) return;

//       // ✅ SOLO consultar si cambió la hora Y han pasado 30+ minutos desde la última consulta
//       if (ultimaHoraConsultada.current !== horaActual.hora) {
//         const tiempoPasado = Date.now() - asistencia.ultimaVerificacion;

//         if (tiempoPasado > 30 * 60 * 1000) {
//           // 30 minutos
//           ultimaHoraConsultada.current = horaActual.hora;
//           consultarAsistencia(`cambio de hora a ${horaActual.hora}:00`);
//         }
//       }
//     }, [
//       horaActual?.hora,
//       asistencia.inicializado,
//       asistencia.ultimaVerificacion,
//       consultarAsistencia,
//     ]);

//     // ✅ EFECTO: Actualizar estado del botón
//     useEffect(() => {
//       const nuevoEstado = determinarEstado();
//       setEstadoBoton(nuevoEstado);
//       console.log("🎯 Estado del botón:", nuevoEstado);
//     }, [determinarEstado]);

//     // ✅ EFECTO: Visibility change (solo UNA consulta)
//     useEffect(() => {
//       const handleVisibility = () => {
//         if (
//           document.visibilityState === "visible" &&
//           asistenciaIDB &&
//           asistencia.inicializado
//         ) {
//           const tiempoPasado = Date.now() - asistencia.ultimaVerificacion;
//           if (tiempoPasado > 30 * 60 * 1000) {
//             // Solo si han pasado 30+ minutos
//             consultarAsistencia("pestaña visible después de 30+ min");
//           }
//         }
//       };

//       document.addEventListener("visibilitychange", handleVisibility);
//       return () =>
//         document.removeEventListener("visibilitychange", handleVisibility);
//     }, [
//       asistenciaIDB,
//       asistencia.inicializado,
//       asistencia.ultimaVerificacion,
//       consultarAsistencia,
//     ]);

//     // ✅ TOOLTIP MANAGEMENT
//     const [tooltipOculto, setTooltipOculto] = useState(() => {
//       if (typeof window !== "undefined") {
//         return (
//           sessionStorage.getItem(
//             SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY
//           ) === "true"
//         );
//       }
//       return false;
//     });

//     const ocultarTooltip = useCallback(() => {
//       setTooltipOculto(true);
//       sessionStorage.setItem(
//         SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
//         "true"
//       );
//     }, []);

//     const mostrarTooltip = useCallback(() => {
//       setTooltipOculto(false);
//       sessionStorage.setItem(
//         SE_MOSTRO_TOLTIP_TOMAR_ASISTENCIA_PERSONAL_KEY,
//         "false"
//       );
//     }, []);

//     const handleClick = useCallback(() => {
//       if (!estadoBoton.habilitado) {
//         console.log("❌ Botón deshabilitado:", estadoBoton.razon);
//         return;
//       }

//       if (estadoBoton.mostrarTooltip) ocultarTooltip();
//       setMostrarModal(true);
//     }, [estadoBoton, ocultarTooltip]);

//     // ✅ EFECTO: Mostrar tooltip cuando cambia tipo de acción
//     useEffect(() => {
//       if (estadoBoton.tipo) mostrarTooltip();
//     }, [estadoBoton.tipo, mostrarTooltip]);

//     // ✅ CLEANUP
//     useEffect(() => {
//       return () => {
//         if (intervalRef.current) clearInterval(intervalRef.current);
//         if (retryRef.current) clearTimeout(retryRef.current);
//       };
//     }, []);

//     // ✅ RENDER: Solo si es visible
//     if (!estadoBoton.visible) return null;

//     const mostrarTooltipActual = estadoBoton.mostrarTooltip && !tooltipOculto;

//     return (
//       <>
//         {mostrarModal && (
//           <MarcarAsistenciaPropiaDePersonalModal
//             eliminateModal={() => {
//               setMostrarModal(false);
//               // ✅ CONSULTAR después de marcar asistencia (esto SÍ es necesario)
//               setTimeout(
//                 () => consultarAsistencia("después de marcar asistencia"),
//                 1000
//               );
//             }}
//           />
//         )}

//         <style>
//           {`
//         @keyframes Modificar-Bottom-NavBarFooter {
//             to {
//                 bottom: ${sidebar.isOpen ? `${sidebar.height}px` : "0px"};
//             }
//         }
//         .Mover-NavBarFooter {
//             animation: Modificar-Bottom-NavBarFooter 0.3s forwards;
//         }

//         @keyframes tooltipFadeIn {
//             from {
//                 opacity: 0;
//                 transform: translateX(15px) scale(0.9);
//             }
//             to {
//                 opacity: 1;
//                 transform: translateX(0) scale(1);
//             }
//         }

//         @keyframes tooltipPulse {
//             0%, 100% { transform: translateX(0) scale(1); }
//             50% { transform: translateX(-2px) scale(1.02); }
//         }

//         @keyframes buttonPulse {
//             0%, 100% {
//                 transform: scale(1);
//                 box-shadow:
//                     0 10px 30px rgba(0, 0, 0, 0.25),
//                     0 4px 12px 4px rgba(34, 197, 94, 0.4),
//                     inset 0 1px 0 rgba(255, 255, 255, 0.2);
//             }
//             50% {
//                 transform: scale(1.05);
//                 box-shadow:
//                     0 15px 40px rgba(0, 0, 0, 0.3),
//                     0 6px 20px 6px rgba(34, 197, 94, 0.6),
//                     inset 0 1px 0 rgba(255, 255, 255, 0.3);
//             }
//         }

//         @keyframes buttonPulseRojo {
//             0%, 100% {
//                 transform: scale(1);
//                 box-shadow:
//                     0 10px 30px rgba(0, 0, 0, 0.25),
//                     0 4px 12px 4px rgba(239, 68, 68, 0.4),
//                     inset 0 1px 0 rgba(255, 255, 255, 0.2);
//             }
//             50% {
//                 transform: scale(1.05);
//                 box-shadow:
//                     0 15px 40px rgba(0, 0, 0, 0.3),
//                     0 6px 20px 6px rgba(239, 68, 68, 0.6),
//                     inset 0 1px 0 rgba(255, 255, 255, 0.3);
//             }
//         }

//         @keyframes buttonGlow {
//             0%, 100% {
//                 box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
//             }
//             50% {
//                 box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
//             }
//         }

//         .tooltip-animation {
//             animation: tooltipFadeIn 0.4s ease-out, tooltipPulse 2s ease-in-out infinite 1s;
//         }

//         .button-enhanced-verde {
//             position: relative;
//             animation: buttonPulse 3s ease-in-out infinite;
//         }

//         .button-enhanced-rojizo {
//             position: relative;
//             animation: buttonPulseRojo 3s ease-in-out infinite;
//         }

//         .button-enhanced-verde::before {
//             content: '';
//             position: absolute;
//             top: 0;
//             left: 0;
//             right: 0;
//             bottom: 0;
//             border-radius: 50%;
//             animation: buttonGlow 2s ease-in-out infinite;
//             z-index: -1;
//         }

//         @media (max-width: 500px) {
//             .button-enhanced-verde, .button-enhanced-rojizo {
//                 animation: buttonPulse 2.5s ease-in-out infinite;
//             }
//         }
//         `}
//         </style>

//         <div
//           className="fixed z-[102] right-0 Mover-NavBarFooter
//                    sxs-only:mr-3 sxs-only:mb-3
//                    xs-only:mr-4 xs-only:mb-4
//                    max-sm:mr-5 max-sm:mb-4
//                    mr-6 mb-5"
//           style={{ bottom: sidebar.height }}
//         >
//           {/* Tooltip */}
//           {mostrarTooltipActual && (
//             <div
//               id="tooltip-mostrar-asistencia-personal"
//               className="absolute tooltip-animation
//                        sxs-only:right-14 sxs-only:top-1
//                        xs-only:right-16 xs-only:top-2
//                        max-sm:right-18 max-sm:top-2
//                        right-20 top-3"
//             >
//               <div
//                 className={`${
//                   estadoBoton.color === "verde"
//                     ? "bg-azul-principal"
//                     : "bg-red-600"
//                 } text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg relative
//                          sxs-only:px-2 sxs-only:py-1 sxs-only:text-xs
//                          xs-only:px-2 xs-only:py-1 xs-only:text-xs
//                          max-sm:px-3 max-sm:py-2 max-sm:text-sm
//                          whitespace-nowrap transition-all duration-300`}
//               >
//                 {estadoBoton.tooltip}
//                 <span className="ml-2 inline-block">
//                   {estadoBoton.tipo === "entrada" ? "🚪➡️" : "🚪⬅️"}
//                 </span>
//                 <div
//                   className={`absolute top-1/2 transform -translate-y-1/2
//                            left-full border-l-4 border-y-4 border-y-transparent ${
//                              estadoBoton.color === "verde"
//                                ? "border-l-azul-principal"
//                                : "border-l-red-600"
//                            }`}
//                 ></div>
//               </div>
//             </div>
//           )}

//           {/* Botón */}
//           <button
//             onClick={handleClick}
//             disabled={!estadoBoton.habilitado}
//             title={
//               !estadoBoton.habilitado
//                 ? estadoBoton.razon
//                 : `Registrar ${estadoBoton.tipo}`
//             }
//             className={`${
//               mostrarTooltipActual
//                 ? estadoBoton.color === "verde"
//                   ? "button-enhanced-verde"
//                   : "button-enhanced-rojizo"
//                 : "transition-all duration-300"
//             } ${!estadoBoton.habilitado ? "button-disabled" : ""}
//                      relative overflow-hidden aspect-square
//                      ${
//                        estadoBoton.color === "verde"
//                          ? "bg-gradient-to-br from-verde-principal to-green-600 hover:from-green-500 hover:to-green-700"
//                          : "bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
//                      }
//                      rounded-full flex items-center justify-center
//                      transition-all duration-300 ease-out
//                      ${
//                        estadoBoton.habilitado
//                          ? "hover:scale-110 active:scale-95"
//                          : ""
//                      }
//                      shadow-[0_6px_20px_rgba(0,0,0,0.3),0_2px_8px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
//                      hover:shadow-[0_10px_30px_rgba(0,0,0,0.35),0_4px_15px_rgba(34,197,94,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]
//                      border-2 border-green-400/20
//                      sxs-only:w-12 sxs-only:h-12 sxs-only:p-2
//                      xs-only:w-14 xs-only:h-14 xs-only:p-3
//                      max-sm:w-16 max-sm:h-16 max-sm:p-3
//                      w-18 h-18 p-4`}
//           >
//             {/* Efecto de brillo en hover */}
//             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full hover:translate-x-full transition-transform duration-700"></div>

//             <LapizFirmando className="text-white relative z-10 drop-shadow-sm sxs-only:w-6 xs-only:w-7 max-sm:w-8 w-8" />

//             {/* Punto de notificación cuando hay tooltip */}
//             {mostrarTooltipActual && (
//               <div
//                 className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white animate-ping
//                          sxs-only:w-2 sxs-only:h-2 ${
//                            estadoBoton.color === "verde"
//                              ? "bg-blue-500"
//                              : "bg-yellow-500"
//                          }`}
//               />
//             )}

//             {/* Indicadores de estado */}
//             <div className="absolute -bottom-1 -left-1 flex space-x-1">
//               <div
//                 className={`w-2 h-2 rounded-full border border-white transition-all ${
//                   asistencia.entradaMarcada
//                     ? "bg-green-400 scale-110"
//                     : "bg-gray-400"
//                 }`}
//                 title={
//                   asistencia.entradaMarcada
//                     ? "Entrada registrada"
//                     : "Entrada pendiente"
//                 }
//               />
//               <div
//                 className={`w-2 h-2 rounded-full border border-white transition-all ${
//                   asistencia.salidaMarcada
//                     ? "bg-green-400 scale-110"
//                     : "bg-gray-400"
//                 }`}
//                 title={
//                   asistencia.salidaMarcada
//                     ? "Salida registrada"
//                     : "Salida pendiente"
//                 }
//               />
//             </div>

//             {/* Indicador de última verificación */}
//             {asistencia.ultimaVerificacion > 0 && (
//               <div
//                 className="absolute top-0 left-0 w-2 h-2 bg-blue-400 rounded-full"
//                 title={`Última verificación: ${new Date(
//                   asistencia.ultimaVerificacion
//                 ).toLocaleTimeString()}`}
//               />
//             )}
//           </button>
//         </div>
//       </>
//     );
//   }
// );

// MarcarAsistenciaDePersonalButton.displayName =
//   "MarcarAsistenciaDePersonalButton";

// export default MarcarAsistenciaDePersonalButton;

const MarcarAsistenciaDePersonalButton = ({ rol }: { rol: RolesSistema }) => {
  return <div>EN PROCESO...{rol}</div>;
};

export default MarcarAsistenciaDePersonalButton;

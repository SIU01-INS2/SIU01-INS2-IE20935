/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { EstadosAsistenciaPersonalStyles } from "@/Assets/styles/EstadosAsistenciaPersonalStyles";
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";
import { Meses, mesesTextos } from "@/interfaces/shared/Meses";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import getDiasEscolaresPorMes from "@/lib/helpers/functions/date/getDiasEsolaresPorMes";
import { segundosAMinutos } from "@/lib/helpers/functions/time/segundosAMinutos";
import {
  ErrorResponseAPIBase,
  MessageProperty,
} from "@/interfaces/shared/apis/types";
import { useState, useEffect } from "react";
import { AsistenciaDePersonalIDB } from "@/lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalIDB";
import { convertirAFormato12Horas } from "@/lib/helpers/formatters/fechas-hora/formatearAFormato12Horas";
import { ENTORNO } from "@/constants/ENTORNO";
import { Entorno } from "@/interfaces/shared/Entornos";
import {
  EventosIDB,
  IEventoLocal,
} from "@/lib/utils/local/db/models/EventosIDB";
import { RegistroEntradaSalida } from "@/interfaces/shared/AsistenciaRequests";
import { AsistenciaMensualPersonalLocal } from "@/lib/utils/local/db/models/AsistenciaDePersonal/AsistenciaDePersonalTypes";
import { RootState } from "@/global/store";
import { useSelector } from "react-redux";
import {
  Search,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Clock,
  FileText,
  Download,
} from "lucide-react";
import SiasisUserSelector from "@/components/inputs/SiasisUserSelector";
import { GenericUser } from "@/interfaces/shared/GenericUser";
import FotoPerfilClientSide from "@/components/utils/photos/FotoPerfilClientSide";
import * as ExcelJS from "exceljs";

// 🔧 CONSTANTE DE CONFIGURACIÓN PARA DESARROLLO
const CONSIDERAR_DIAS_NO_ESCOLARES = false; // false = solo días laborales, true = incluir sábados y domingos

interface RegistroDia {
  fecha: string;
  entradaProgramada: string;
  entradaReal: string;
  diferenciaEntrada: string;
  estadoEntrada: EstadosAsistenciaPersonal;
  salidaProgramada: string;
  salidaReal: string;
  diferenciaSalida: string;
  estadoSalida: EstadosAsistenciaPersonal;
  esEvento: boolean;
  nombreEvento?: string;
  esDiaNoEscolar?: boolean;
}

// Mapeo de estados a colores para Excel (equivalente a los estilos CSS)
const COLORES_ESTADOS_EXCEL = {
  [EstadosAsistenciaPersonal.En_Tiempo]: {
    background: "D4F7D4", // verde claro
    font: "047857", // verde oscuro
    nombre: "En tiempo",
  },
  [EstadosAsistenciaPersonal.Temprano]: {
    background: "BFDBFE", // azul claro
    font: "1E40AF", // azul oscuro
    nombre: "Temprano",
  },
  [EstadosAsistenciaPersonal.Tarde]: {
    background: "FED7BA", // naranja claro
    font: "C2410C", // naranja oscuro
    nombre: "Tarde",
  },
  [EstadosAsistenciaPersonal.Cumplido]: {
    background: "D4F7D4", // verde claro
    font: "047857", // verde oscuro
    nombre: "Cumplido",
  },
  [EstadosAsistenciaPersonal.Salida_Anticipada]: {
    background: "FEF3C7", // amarillo claro
    font: "A16207", // amarillo oscuro
    nombre: "Salida anticipada",
  },
  [EstadosAsistenciaPersonal.Falta]: {
    background: "FECACA", // rojo claro
    font: "DC2626", // rojo oscuro
    nombre: "Falta",
  },
  [EstadosAsistenciaPersonal.No_Registrado]: {
    background: "F3F4F6", // gris claro
    font: "6B7280", // gris oscuro
    nombre: "No registrado",
  },
  [EstadosAsistenciaPersonal.Sin_Registro]: {
    background: "F3F4F6", // gris claro
    font: "6B7280", // gris oscuro
    nombre: "Sin registro",
  },
  [EstadosAsistenciaPersonal.Inactivo]: {
    background: "E5E7EB", // gris medio
    font: "4B5563", // gris oscuro
    nombre: "Inactivo",
  },
  [EstadosAsistenciaPersonal.Evento]: {
    background: "DDD6FE", // violeta claro
    font: "7C3AED", // violeta oscuro
    nombre: "Evento",
  },
  [EstadosAsistenciaPersonal.Otro]: {
    background: "F3F4F6", // gris claro
    font: "6B7280", // gris oscuro
    nombre: "Otro",
  },
};

const RegistrosAsistenciaDePersonal = () => {
  const [selectedRol, setSelectedRol] = useState<RolesSistema>();
  const [selectedMes, setSelectedMes] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<GenericUser>();
  const [loading, setLoading] = useState(false);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const [data, setData] = useState<AsistenciaMensualPersonalLocal | null>(null);
  const [eventos, setEventos] = useState<IEventoLocal[]>([]);
  const [registros, setRegistros] = useState<RegistroDia[]>([]);
  const [error, setError] = useState<ErrorResponseAPIBase | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ MEJORADO: Usar useSelector para obtener fecha de Redux reactivamente
  const fechaHoraRedux = useSelector(
    (state: RootState) => state.others.fechaHoraActualReal.fechaHora
  );

  // ✅ MEJORADO: Función helper para obtener fecha Redux con manejo de errores
  const obtenerFechaRedux = () => {
    if (!fechaHoraRedux) {
      return null;
    }

    try {
      const fechaObj = new Date(fechaHoraRedux);

      // Validar que la fecha sea válida
      if (isNaN(fechaObj.getTime())) {
        console.error("❌ Fecha inválida desde Redux:", fechaHoraRedux);
        return null;
      }

      return {
        fechaActual: fechaObj,
        mesActual: fechaObj.getMonth() + 1,
        diaActual: fechaObj.getDate(),
        añoActual: fechaObj.getFullYear(),
        timestamp: fechaObj.getTime(),
        esHoy: true,
      };
    } catch (error) {
      console.error("❌ Error al procesar fecha de Redux:", error);
      return null;
    }
  };

  // ✅ MEJORADO: Obtener fecha una vez y manejar el caso de error
  const fechaRedux = obtenerFechaRedux();

  // ✅ MEJORADO: Si no hay fecha de Redux, mostrar error en lugar de fallback
  const mesActual = fechaRedux?.mesActual || new Date().getMonth() + 1; // fallback solo si Redux falla
  const diaActual = fechaRedux?.diaActual || new Date().getDate();
  const añoActual = fechaRedux?.añoActual || new Date().getFullYear();

  // 🆕 NUEVO: useEffect para limpiar resultados cuando cambie el usuario seleccionado
  useEffect(() => {
    // Solo limpiar si había resultados previos y cambió el usuario
    if (data || registros.length > 0) {
      limpiarResultados();
    }
  }, [usuarioSeleccionado?.ID_O_DNI_Usuario]);

  // Función para obtener meses disponibles (hasta mayo o mes actual)
  const getMesesDisponibles = () => {
    const mesesDisponibles: { value: string; label: string }[] = [];
    const limiteMaximo = mesActual;

    for (let mes = 3; mes <= limiteMaximo; mes++) {
      // Empezar desde marzo (3)
      mesesDisponibles.push({
        value: mes.toString(),
        label: mesesTextos[mes as Meses],
      });
    }

    return mesesDisponibles;
  };

  // Función para verificar si una fecha debe mostrarse (no futura)
  const esFechaValida = (fecha: string): boolean => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const fechaHoy = new Date(añoActual, mesActual - 1, diaActual); // mes-1 porque Date usa 0-11

    return fechaObj <= fechaHoy;
  };

  const [asistenciaPersonalIDB] = useState(
    () =>
      new AsistenciaDePersonalIDB(
        "API01",
        setLoading,
        (error: ErrorResponseAPIBase | null) => {
          if (error) {
            setError({
              success: false,
              message: error.message,
            });
          } else {
            setError(null);
          }
        },
        (message: MessageProperty | null) => {
          if (message) {
            setSuccessMessage(message.message);
            setTimeout(() => setSuccessMessage(""), 3000);
          } else {
            setSuccessMessage("");
          }
        }
      )
  );

  // ✅ ROLES ACTUALIZADOS: Sin emojis y con Directivo agregado
  const roles = [
    {
      value: RolesSistema.Directivo,
      label: "Directivo",
    },
    {
      value: RolesSistema.ProfesorPrimaria,
      label: "Profesor de Primaria",
    },
    {
      value: RolesSistema.ProfesorSecundaria,
      label: "Profesor de Secundaria",
    },
    {
      value: RolesSistema.Auxiliar,
      label: "Auxiliar",
    },
    {
      value: RolesSistema.PersonalAdministrativo,
      label: "Personal Administrativo",
    },
  ];

  // 🔧 FUNCIÓN CORREGIDA para verificar si un día es evento
  const esEvento = (
    fecha: string
  ): { esEvento: boolean; nombreEvento?: string } => {
    const evento = eventos.find((e) => {
      const fechaInicio = new Date(e.Fecha_Inicio + "T00:00:00");
      const fechaFin = new Date(e.Fecha_Conclusion + "T00:00:00");
      const fechaConsulta = new Date(fecha + "T00:00:00");

      return fechaConsulta >= fechaInicio && fechaConsulta <= fechaFin;
    });

    const resultado = {
      esEvento: !!evento,
      nombreEvento: evento?.Nombre,
    };

    return resultado;
  };

  // Función para mapear estados del enum a strings para la UI
  const mapearEstadoParaUI = (estado: EstadosAsistenciaPersonal): string => {
    const mapeoEstados: Record<EstadosAsistenciaPersonal, string> = {
      [EstadosAsistenciaPersonal.Temprano]: "Temprano",
      [EstadosAsistenciaPersonal.En_Tiempo]: "En tiempo",
      [EstadosAsistenciaPersonal.Cumplido]: "Cumplido",
      [EstadosAsistenciaPersonal.Salida_Anticipada]: "Salida anticipada",
      [EstadosAsistenciaPersonal.Tarde]: "Tarde",
      [EstadosAsistenciaPersonal.Falta]: "Falta",
      [EstadosAsistenciaPersonal.Sin_Registro]: "Sin registro",
      [EstadosAsistenciaPersonal.No_Registrado]: "No registrado",
      [EstadosAsistenciaPersonal.Inactivo]: "Inactivo",
      [EstadosAsistenciaPersonal.Evento]: "Evento",
      [EstadosAsistenciaPersonal.Otro]: "Otro",
    };

    return mapeoEstados[estado] || estado;
  };

  // 🕐 FUNCIÓN ADAPTADA para calcular la hora programada con formato 12 horas
  const calcularHoraProgramada = (
    timestamp: number,
    desfaseSegundos: number
  ): string => {
    if (timestamp === 0 || timestamp === null) return "N/A";

    const timestampProgramado = timestamp - desfaseSegundos * 1000;
    const timestampPeru = timestampProgramado + 5 * 60 * 60 * 1000;
    const fechaProgramadaPeru = new Date(timestampPeru);

    const tiempo24Horas = fechaProgramadaPeru.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return convertirAFormato12Horas(tiempo24Horas, false);
  };

  // 🕐 FUNCIÓN ADAPTADA para formatear hora con formato 12 horas
  const formatearHora = (timestamp: number): string => {
    if (timestamp === 0 || timestamp === null) return "No registrado";

    const timestampPeru = timestamp + 5 * 60 * 60 * 1000;
    const fechaPeru = new Date(timestampPeru);

    const tiempo24Horas = fechaPeru.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return convertirAFormato12Horas(tiempo24Horas, false);
  };

  // Función para verificar si una fecha es día laboral (lunes a viernes)
  const esDiaLaboral = (fecha: string): boolean => {
    const fechaObj = new Date(fecha + "T00:00:00");
    const diaSemana = fechaObj.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
    return diaSemana >= 1 && diaSemana <= 5; // Solo lunes a viernes
  };

  // 📅 FUNCIÓN MEJORADA para generar todas las fechas del mes según configuración
  const obtenerFechasDelMes = (mes: number, año: number): string[] => {
    if (CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL) {
      const fechas: string[] = [];
      const ultimoDiaDelMes = new Date(año, mes, 0).getDate();

      for (let dia = 1; dia <= ultimoDiaDelMes; dia++) {
        const fecha = `${año}-${mes.toString().padStart(2, "0")}-${dia
          .toString()
          .padStart(2, "0")}`;
        fechas.push(fecha);
      }

      return fechas;
    } else {
      return getDiasEscolaresPorMes(mes, año);
    }
  };

  // Función para obtener asistencias combinadas de entrada y salida
  const obtenerAsistenciasCombinadas = async (
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<Record<
    string,
    { entrada?: RegistroEntradaSalida; salida?: RegistroEntradaSalida }
  > | null> => {
    try {
      const resultado =
        await asistenciaPersonalIDB.obtenerAsistenciaMensualConAPI({
          id_o_dni,
          mes,
          rol,
        });

      if (!resultado.encontrado) {
        return null;
      }

      const registrosCombinados: Record<
        string,
        { entrada?: RegistroEntradaSalida; salida?: RegistroEntradaSalida }
      > = {};

      const año = new Date().getFullYear();

      // Procesar entradas
      if (resultado.entrada) {
        Object.entries(resultado.entrada.registros).forEach(
          ([dia, registro]) => {
            const fechaCompleta = `${año}-${mes
              .toString()
              .padStart(2, "0")}-${dia.padStart(2, "0")}`;

            const esLaboral = esDiaLaboral(fechaCompleta);
            const debeIncluir = CONSIDERAR_DIAS_NO_ESCOLARES || esLaboral;

            if (debeIncluir) {
              if (!registrosCombinados[dia]) {
                registrosCombinados[dia] = {};
              }
              registrosCombinados[dia].entrada = registro;
            }
          }
        );
      }

      // Procesar salidas
      if (resultado.salida) {
        Object.entries(resultado.salida.registros).forEach(
          ([dia, registro]) => {
            const fechaCompleta = `${año}-${mes
              .toString()
              .padStart(2, "0")}-${dia.padStart(2, "0")}`;

            const esLaboral = esDiaLaboral(fechaCompleta);
            const debeIncluir = CONSIDERAR_DIAS_NO_ESCOLARES || esLaboral;

            if (debeIncluir) {
              if (!registrosCombinados[dia]) {
                registrosCombinados[dia] = {};
              }
              registrosCombinados[dia].salida = registro;
            }
          }
        );
      }

      return Object.keys(registrosCombinados).length > 0
        ? registrosCombinados
        : null;
    } catch (error) {
      console.error("Error al obtener asistencias combinadas:", error);
      return null;
    }
  };

  // Función para procesar datos
  const procesarDatos = async (
    rol: RolesSistema,
    id_o_dni: string | number,
    mes: number
  ) => {
    try {
      const registrosCombinados = await obtenerAsistenciasCombinadas(
        rol,
        id_o_dni,
        mes
      );

      const año = new Date().getFullYear();
      const todasLasFechas = obtenerFechasDelMes(mes, año);
      const fechasFiltradas = todasLasFechas.filter((fecha) =>
        esFechaValida(fecha)
      );

      const registrosResultado: RegistroDia[] = fechasFiltradas.map((fecha) => {
        const fechaObj = new Date(fecha + "T00:00:00");
        const dia = fechaObj.getDate().toString();
        const eventoInfo = esEvento(fecha);
        const esLaboral = esDiaLaboral(fecha);

        // Si es evento, retornar registro especial
        if (eventoInfo.esEvento) {
          return {
            fecha,
            entradaProgramada: "N/A",
            entradaReal: "Evento",
            diferenciaEntrada: "N/A",
            estadoEntrada: EstadosAsistenciaPersonal.Evento,
            salidaProgramada: "N/A",
            salidaReal: "Evento",
            diferenciaSalida: "N/A",
            estadoSalida: EstadosAsistenciaPersonal.Evento,
            esEvento: true,
            nombreEvento: eventoInfo.nombreEvento,
            esDiaNoEscolar: !esLaboral,
          };
        }

        // Si no hay registros combinados
        if (!registrosCombinados || !registrosCombinados[dia]) {
          return {
            fecha,
            entradaProgramada: "N/A",
            entradaReal: "No se tomó asistencia",
            diferenciaEntrada: "N/A",
            estadoEntrada: EstadosAsistenciaPersonal.Sin_Registro,
            salidaProgramada: "N/A",
            salidaReal: "No se tomó asistencia",
            diferenciaSalida: "N/A",
            estadoSalida: EstadosAsistenciaPersonal.Sin_Registro,
            esEvento: false,
            esDiaNoEscolar: !esLaboral,
          };
        }

        const registroDia = registrosCombinados[dia];

        // Procesar información de entrada
        let entradaProgramada = "N/A";
        let entradaReal = "No registrado";
        let diferenciaEntrada = "N/A";
        let estadoEntrada = EstadosAsistenciaPersonal.No_Registrado;

        if (registroDia.entrada) {
          if (registroDia.entrada === null) {
            entradaReal = "Inactivo";
            estadoEntrada = EstadosAsistenciaPersonal.Inactivo;
          } else if (
            (registroDia.entrada.timestamp === null ||
              registroDia.entrada.timestamp === 0) &&
            (registroDia.entrada.desfaseSegundos === null ||
              registroDia.entrada.desfaseSegundos === 0)
          ) {
            entradaReal = "Falta";
            estadoEntrada = EstadosAsistenciaPersonal.Falta;
          } else if (registroDia.entrada.timestamp > 0) {
            estadoEntrada = registroDia.entrada.estado;
            entradaProgramada = calcularHoraProgramada(
              registroDia.entrada.timestamp,
              registroDia.entrada.desfaseSegundos
            );
            entradaReal = formatearHora(registroDia.entrada.timestamp);
            const desfaseMinutos = segundosAMinutos(
              registroDia.entrada.desfaseSegundos
            );
            diferenciaEntrada = `${
              desfaseMinutos >= 0 ? "+" : ""
            }${desfaseMinutos} min`;
          } else {
            estadoEntrada = registroDia.entrada.estado;
            entradaReal = mapearEstadoParaUI(estadoEntrada);
          }
        }

        // Procesar información de salida
        let salidaProgramada = "N/A";
        let salidaReal = "No registrado";
        let diferenciaSalida = "N/A";
        let estadoSalida = EstadosAsistenciaPersonal.No_Registrado;

        if (registroDia.salida) {
          if (registroDia.salida === null) {
            salidaReal = "Inactivo";
            estadoSalida = EstadosAsistenciaPersonal.Inactivo;
          } else if (
            (registroDia.salida.timestamp === null ||
              registroDia.salida.timestamp === 0) &&
            (registroDia.salida.desfaseSegundos === null ||
              registroDia.salida.desfaseSegundos === 0)
          ) {
            salidaReal = "Falta";
            estadoSalida = EstadosAsistenciaPersonal.Falta;
          } else if (registroDia.salida.timestamp > 0) {
            estadoSalida = registroDia.salida.estado;
            salidaProgramada = calcularHoraProgramada(
              registroDia.salida.timestamp,
              registroDia.salida.desfaseSegundos
            );
            salidaReal = formatearHora(registroDia.salida.timestamp);
            const desfaseMinutos = segundosAMinutos(
              registroDia.salida.desfaseSegundos
            );
            diferenciaSalida = `${
              desfaseMinutos >= 0 ? "+" : ""
            }${desfaseMinutos} min`;
          } else {
            estadoSalida = registroDia.salida.estado;
            salidaReal = mapearEstadoParaUI(estadoSalida);
          }
        }

        return {
          fecha,
          entradaProgramada,
          entradaReal,
          diferenciaEntrada,
          estadoEntrada,
          salidaProgramada,
          salidaReal,
          diferenciaSalida,
          estadoSalida,
          esEvento: false,
          esDiaNoEscolar: !esLaboral,
        };
      });

      setRegistros(registrosResultado);
    } catch (error) {
      console.error("Error al procesar datos:", error);
      setError({
        success: false,
        message: "Error al procesar los datos de asistencia",
      });
    }
  };

  // Función para obtener eventos
  const obtenerEventos = async (mes: number) => {
    try {
      const eventosIDB = new EventosIDB("API01", setLoadingEventos);
      const eventosDelMes = await eventosIDB.getEventosPorMes(mes);
      setEventos(eventosDelMes);
    } catch (error) {
      console.error("Error obteniendo eventos:", error);
    }
  };

  // ✅ FUNCIÓN DE BÚSQUEDA - Solo se ejecuta al hacer clic en botón
  const buscarAsistencias = async () => {
    if (
      !selectedRol ||
      !selectedMes ||
      !usuarioSeleccionado?.ID_O_DNI_Usuario
    ) {
      setError({
        success: false,
        message: "Por favor completa todos los campos correctamente",
      });
      return;
    }

    setError(null);
    setSuccessMessage("");
    setLoading(true);

    try {
      await obtenerEventos(parseInt(selectedMes));

      const resultado =
        await asistenciaPersonalIDB.obtenerAsistenciaMensualConAPI({
          rol: selectedRol as RolesSistema,
          id_o_dni: usuarioSeleccionado.ID_O_DNI_Usuario,
          mes: parseInt(selectedMes),
        });

      if (resultado.encontrado) {
        let datosParaMostrar: AsistenciaMensualPersonalLocal;

        if (resultado.entrada) {
          datosParaMostrar = resultado.entrada;
        } else if (resultado.salida) {
          datosParaMostrar = resultado.salida;
        } else {
          throw new Error("No se pudieron procesar los datos obtenidos");
        }

        setData(datosParaMostrar);
        setSuccessMessage(resultado.mensaje);

        // ✅ Procesar datos solo después de búsqueda exitosa
        await procesarDatos(
          selectedRol,
          usuarioSeleccionado.ID_O_DNI_Usuario,
          parseInt(selectedMes)
        );
      } else {
        setError({ success: false, message: resultado.mensaje });
        setData(null);
        setRegistros([]);
      }
    } catch (error) {
      console.error("Error al buscar asistencias:", error);
      setError({
        success: false,
        message: "Error al obtener los datos de asistencia",
      });
      setData(null);
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  // 📊 FUNCIÓN DE EXPORTACIÓN A EXCEL CON DIÁLOGO DE GUARDAR
  const formatearFechaParaExcel = (fecha: string): string => {
    const fechaObj = new Date(fecha + "T00:00:00");
    return fechaObj.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const exportarAsistenciaPersonalAExcel = async (): Promise<void> => {
    if (
      !data ||
      !usuarioSeleccionado ||
      !selectedRol ||
      registros.length === 0
    ) {
      setError({
        success: false,
        message: "No hay datos para exportar. Realiza una búsqueda primero.",
      });
      return;
    }

    setExportandoExcel(true);

    try {
      // Crear el workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Registros de Asistencia", {
        pageSetup: {
          paperSize: 9, // A4
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      });

      // Configurar columnas con anchos apropiados
      worksheet.columns = [
        { key: "fecha", width: 15 },
        { key: "entradaProgramada", width: 16 },
        { key: "entradaReal", width: 16 },
        { key: "diferenciaEntrada", width: 15 },
        { key: "estadoEntrada", width: 18 },
        { key: "salidaProgramada", width: 16 },
        { key: "salidaReal", width: 16 },
        { key: "diferenciaSalida", width: 15 },
        { key: "estadoSalida", width: 18 },
      ];

      // === SECCIÓN DE ENCABEZADO INSTITUCIONAL ===

      // Título principal
      worksheet.mergeCells("A1:I1");
      const tituloCell = worksheet.getCell("A1");
      tituloCell.value = "I.E. 20935 ASUNCIÓN 8 - IMPERIAL, CAÑETE";
      tituloCell.style = {
        font: { size: 16, bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1E40AF" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };
      worksheet.getRow(1).height = 25;

      // Subtítulo
      worksheet.mergeCells("A2:I2");
      const subtituloCell = worksheet.getCell("A2");
      subtituloCell.value = "REGISTRO MENSUAL DE ASISTENCIA DEL PERSONAL";
      subtituloCell.style = {
        font: { size: 14, bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "3B82F6" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };
      worksheet.getRow(2).height = 20;

      // === SECCIÓN DE INFORMACIÓN DEL USUARIO ===

      // Espacio
      worksheet.getRow(3).height = 10;

      // Obtener rol legible
      const rolLegible =
        roles.find((r) => r.value === selectedRol)?.label || selectedRol;

      // Información del usuario
      const infoUsuario = [
        {
          label: "NOMBRE COMPLETO:",
          valor: `${usuarioSeleccionado.Nombres} ${usuarioSeleccionado.Apellidos}`,
        },
        {
          label: "DNI:",
          valor:
            usuarioSeleccionado.DNI_Directivo ??
            usuarioSeleccionado.ID_O_DNI_Usuario,
        },
        { label: "ROL:", valor: rolLegible },
        { label: "MES:", valor: mesesTextos[parseInt(selectedMes) as Meses] },
        { label: "TOTAL REGISTROS:", valor: registros.length.toString() },
        {
          label: "FECHA GENERACIÓN:",
          valor: new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      ];

      let filaActual = 4;
      infoUsuario.forEach((info, index) => {
        if (index % 2 === 0) {
          // Columna izquierda (A-D)
          worksheet.mergeCells(`A${filaActual}:B${filaActual}`);
          const labelCell = worksheet.getCell(`A${filaActual}`);
          labelCell.value = info.label;
          labelCell.style = {
            font: { bold: true, size: 10 },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F3F4F6" },
            },
            alignment: { horizontal: "left", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          };

          worksheet.mergeCells(`C${filaActual}:D${filaActual}`);
          const valorCell = worksheet.getCell(`C${filaActual}`);
          valorCell.value = info.valor;
          valorCell.style = {
            font: { size: 10 },
            alignment: { horizontal: "left", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          };
        } else {
          // Columna derecha (E-I)
          worksheet.mergeCells(`E${filaActual}:F${filaActual}`);
          const labelCell = worksheet.getCell(`E${filaActual}`);
          labelCell.value = info.label;
          labelCell.style = {
            font: { bold: true, size: 10 },
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F3F4F6" },
            },
            alignment: { horizontal: "left", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          };

          worksheet.mergeCells(`G${filaActual}:I${filaActual}`);
          const valorCell = worksheet.getCell(`G${filaActual}`);
          valorCell.value = info.valor;
          valorCell.style = {
            font: { size: 10 },
            alignment: { horizontal: "left", vertical: "middle" },
            border: {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            },
          };

          filaActual++;
        }
      });

      // Si el número de elementos es impar, completar la última fila
      if (infoUsuario.length % 2 !== 0) {
        filaActual++;
      }

      // Espacio antes de la tabla
      filaActual += 2;

      // === SECCIÓN DE ENCABEZADOS DE LA TABLA ===

      const encabezados = [
        "FECHA",
        "ENTRADA\nPROGRAMADA",
        "ENTRADA\nREAL",
        "DIFERENCIA\nENTRADA",
        "ESTADO\nENTRADA",
        "SALIDA\nPROGRAMADA",
        "SALIDA\nREAL",
        "DIFERENCIA\nSALIDA",
        "ESTADO\nSALIDA",
      ];

      const filaEncabezados = filaActual;
      encabezados.forEach((encabezado, index) => {
        const cell = worksheet.getCell(filaEncabezados, index + 1);
        cell.value = encabezado;
        cell.style = {
          font: { bold: true, size: 10, color: { argb: "FFFFFF" } },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "374151" },
          }, // gris-oscuro
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };
      });

      worksheet.getRow(filaEncabezados).height = 35;

      // === SECCIÓN DE DATOS ===

      let filaData = filaEncabezados + 1;

      registros.forEach((registro, index) => {
        const fila = worksheet.getRow(filaData);

        // Determinar color de fondo de la fila
        let colorFondo = "FFFFFF"; // blanco por defecto
        if (index % 2 === 1) {
          colorFondo = "F9FAFB"; // gris muy claro para filas alternas
        }
        if (registro.esDiaNoEscolar && !registro.esEvento) {
          colorFondo = "EBF8FF"; // azul claro para fines de semana
        }

        // Fecha
        let textoFecha = formatearFechaParaExcel(registro.fecha);
        if (registro.esEvento) {
          textoFecha += `\n🎉 ${registro.nombreEvento}`;
        } else if (registro.esDiaNoEscolar) {
          textoFecha += "\n📅 Fin de semana";
        }

        const fechaCell = fila.getCell(1);
        fechaCell.value = textoFecha;
        fechaCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Entrada Programada
        const entradaProgCell = fila.getCell(2);
        entradaProgCell.value = registro.entradaProgramada;
        entradaProgCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Entrada Real
        const entradaRealCell = fila.getCell(3);
        entradaRealCell.value = registro.entradaReal;
        entradaRealCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Diferencia Entrada
        const difEntradaCell = fila.getCell(4);
        difEntradaCell.value = registro.diferenciaEntrada;
        difEntradaCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Estado Entrada (con color específico)
        const estadoEntradaCell = fila.getCell(5);
        const colorEstadoEntrada =
          COLORES_ESTADOS_EXCEL[registro.estadoEntrada];
        estadoEntradaCell.value = colorEstadoEntrada.nombre;
        estadoEntradaCell.style = {
          font: {
            size: 9,
            bold: true,
            color: { argb: colorEstadoEntrada.font },
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorEstadoEntrada.background },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Salida Programada
        const salidaProgCell = fila.getCell(6);
        salidaProgCell.value = registro.salidaProgramada;
        salidaProgCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Salida Real
        const salidaRealCell = fila.getCell(7);
        salidaRealCell.value = registro.salidaReal;
        salidaRealCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Diferencia Salida
        const difSalidaCell = fila.getCell(8);
        difSalidaCell.value = registro.diferenciaSalida;
        difSalidaCell.style = {
          font: { size: 9 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorFondo },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        // Estado Salida (con color específico)
        const estadoSalidaCell = fila.getCell(9);
        const colorEstadoSalida = COLORES_ESTADOS_EXCEL[registro.estadoSalida];
        estadoSalidaCell.value = colorEstadoSalida.nombre;
        estadoSalidaCell.style = {
          font: {
            size: 9,
            bold: true,
            color: { argb: colorEstadoSalida.font },
          },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: colorEstadoSalida.background },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        fila.height = 25;
        filaData++;
      });

      // === SECCIÓN DE PIE DE PÁGINA ===

      filaData += 2;

      // Resumen estadístico
      const totalAsistencias = registros.filter(
        (r) =>
          r.estadoEntrada === EstadosAsistenciaPersonal.En_Tiempo ||
          r.estadoEntrada === EstadosAsistenciaPersonal.Temprano
      ).length;

      const totalTardanzas = registros.filter(
        (r) => r.estadoEntrada === EstadosAsistenciaPersonal.Tarde
      ).length;

      const totalFaltas = registros.filter(
        (r) => r.estadoEntrada === EstadosAsistenciaPersonal.Falta
      ).length;

      const totalEventos = registros.filter((r) => r.esEvento).length;

      // Título del resumen
      worksheet.mergeCells(`A${filaData}:I${filaData}`);
      const resumenTituloCell = worksheet.getCell(`A${filaData}`);
      resumenTituloCell.value = "RESUMEN ESTADÍSTICO";
      resumenTituloCell.style = {
        font: { size: 12, bold: true, color: { argb: "FFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "059669" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };
      worksheet.getRow(filaData).height = 20;
      filaData++;

      // Datos del resumen
      const datosResumen = [
        {
          concepto: "Total Asistencias:",
          valor: totalAsistencias,
          color: "D4F7D4",
        },
        {
          concepto: "Total Tardanzas:",
          valor: totalTardanzas,
          color: "FED7BA",
        },
        { concepto: "Total Faltas:", valor: totalFaltas, color: "FECACA" },
        { concepto: "Días de Evento:", valor: totalEventos, color: "DDD6FE" },
      ];

      datosResumen.forEach((dato) => {
        worksheet.mergeCells(`A${filaData}:F${filaData}`);
        const conceptoCell = worksheet.getCell(`A${filaData}`);
        conceptoCell.value = dato.concepto;
        conceptoCell.style = {
          font: { bold: true, size: 10 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "F3F4F6" },
          },
          alignment: { horizontal: "left", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        worksheet.mergeCells(`G${filaData}:I${filaData}`);
        const valorCell = worksheet.getCell(`G${filaData}`);
        valorCell.value = dato.valor;
        valorCell.style = {
          font: { bold: true, size: 10 },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: dato.color },
          },
          alignment: { horizontal: "center", vertical: "middle" },
          border: {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          },
        };

        filaData++;
      });

      // Información de generación
      filaData += 2;
      worksheet.mergeCells(`A${filaData}:I${filaData}`);
      const infoGenCell = worksheet.getCell(`A${filaData}`);
      infoGenCell.value = `Documento generado automáticamente el ${new Date().toLocaleString(
        "es-ES"
      )} | Sistema SIASIS - I.E. 20935 Asunción 8`;
      infoGenCell.style = {
        font: { size: 8, italic: true },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F9FAFB" },
        },
        alignment: { horizontal: "center", vertical: "middle" },
        border: {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // === GENERAR Y GUARDAR ARCHIVO CON DIÁLOGO ===

      const nombreFinal = `Asistencia_${usuarioSeleccionado.Nombres.replace(
        /\s+/g,
        "_"
      )}_${
        mesesTextos[parseInt(selectedMes) as Meses]
      }_${new Date().getFullYear()}`;

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // 🔍 DEBUG: Logs detallados para diagnosticar
      console.log("🔍 === INICIANDO PROCESO DE GUARDADO ===");
      console.log(
        "- API showSaveFilePicker disponible:",
        "showSaveFilePicker" in window
      );
      console.log("- Protocolo actual:", window.location.protocol);
      console.log("- Hostname actual:", window.location.hostname);
      console.log("- Es contexto seguro:", window.isSecureContext);
      console.log("- Tamaño del buffer:", buffer.byteLength, "bytes");

      // ✅ VERIFICACIÓN EXPLÍCITA: Solo usar File System Access API si está realmente disponible
      const tieneFileSystemAPI = "showSaveFilePicker" in window;

      if (tieneFileSystemAPI) {
        console.log("🚀 === INTENTANDO FILE SYSTEM ACCESS API ===");

        try {
          console.log("📂 Mostrando diálogo de guardar...");

          // Usar la nueva API de File System Access
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: `${nombreFinal}.xlsx`,
            types: [
              {
                description: "Archivos Excel",
                accept: {
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                },
              },
            ],
          });

          console.log("✅ Usuario seleccionó ubicación:", fileHandle.name);
          console.log("💾 Escribiendo archivo...");

          const writable = await fileHandle.createWritable();
          await writable.write(buffer);
          await writable.close();

          console.log("🎉 === ARCHIVO GUARDADO EXITOSAMENTE ===");
          setSuccessMessage("✅ Archivo Excel guardado exitosamente");
        } catch (error: any) {
          console.log("❌ === ERROR EN FILE SYSTEM ACCESS API ===");
          console.log("- Tipo de error:", error.name);
          console.log("- Mensaje:", error.message);
          console.log("- Error completo:", error);

          if (error.name === "AbortError") {
            console.log("👤 Usuario canceló el diálogo de guardar");
            setSuccessMessage("❌ Operación cancelada por el usuario");
          } else {
            console.log("🔄 Fallback a descarga tradicional...");
            downloadTraditional(buffer, nombreFinal);
          }
        }
      } else {
        console.log("⚠️ === FILE SYSTEM ACCESS API NO DISPONIBLE ===");
        console.log("🔄 Usando descarga tradicional...");
        downloadTraditional(buffer, nombreFinal);
      }

      // Limpiar mensaje después de 4 segundos
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("❌ Error al exportar a Excel:", error);
      setError({
        success: false,
        message: "Error al generar el archivo Excel. Inténtalo nuevamente.",
      });
    } finally {
      setExportandoExcel(false);
    }
  };

  // Función helper para descarga tradicional
  const downloadTraditional = (buffer: ArrayBuffer, nombreFinal: string) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${nombreFinal}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setSuccessMessage("✅ Archivo Excel descargado exitosamente");
  };

  // ✅ FUNCIÓN AUXILIAR para limpiar resultados
  const limpiarResultados = () => {
    setData(null);
    setRegistros([]);
    setError(null);
    setSuccessMessage("");
  };

  // ✅ FUNCIONES DE LIMPIEZA cuando cambian los campos (SIN CONSULTAR)
  const handleRolChange = (rol: RolesSistema | undefined) => {
    setSelectedRol(rol);
    // Limpiar campos dependientes
    setUsuarioSeleccionado(undefined);
    setSelectedMes("");
    // Limpiar resultados inmediatamente
    limpiarResultados();
  };

  const handleMesChange = (mes: string) => {
    setSelectedMes(mes);
    // Limpiar resultados inmediatamente
    limpiarResultados();
  };

  // ✅ Manejar Enter en los campos
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      todosLosCamposCompletos &&
      !loading &&
      !loadingEventos
    ) {
      buscarAsistencias();
    }
  };

  // ✅ Estados de validación
  const rolEstaSeleccionado = !!selectedRol;
  const usuarioEstaSeleccionado = !!usuarioSeleccionado?.ID_O_DNI_Usuario;
  const mesEstaSeleccionado = !!selectedMes;
  const todosLosCamposCompletos =
    rolEstaSeleccionado && usuarioEstaSeleccionado && mesEstaSeleccionado;

  return (
    <div className="min-h-full min-w-full -bg-gray-50 sxs-only:p-2 xs-only:p-3 sm-only:p-4 md-only:p-4 lg-only:p-6 xl-only:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Completamente responsivo */}
        <div className="mb-4">
          <div className="flex items-center sxs-only:space-x-2 xs-only:space-x-2 sm-only:space-x-3 md-only:space-x-4 lg-only:space-x-4 xl-only:space-x-4 mb-1">
            <div className="sxs-only:w-7 sxs-only:h-7 xs-only:w-8 xs-only:h-8 sm-only:w-8 sm-only:h-8 md-only:w-9 md-only:h-9 lg-only:w-10 lg-only:h-10 xl-only:w-10 xl-only:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="sxs-only:w-3 sxs-only:h-3 xs-only:w-4 xs-only:h-4 sm-only:w-4 sm-only:h-4 md-only:w-5 md-only:h-5 lg-only:w-6 lg-only:h-6 xl-only:w-6 xl-only:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="sxs-only:text-lg xs-only:text-lg sm-only:text-xl md-only:text-xl lg-only:text-2xl xl-only:text-2xl font-bold text-gray-900">
                Consulta de Asistencias de Personal
              </h1>
              <p className="text-gray-600 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm">
                Consulta los registros mensuales de entrada y salida del
                personal institucional
              </p>
            </div>
          </div>

          {/* Banner de desarrollo si está activado */}
          {CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3 mt-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="sxs-only:w-3 sxs-only:h-3 xs-only:w-4 xs-only:h-4 sm-only:w-4 sm-only:h-4 md-only:w-4 md-only:h-4 lg-only:w-4 lg-only:h-4 xl-only:w-4 xl-only:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                    Modo Desarrollo Activado
                  </p>
                  <p className="text-amber-700 mt-1 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs">
                    Se están mostrando registros de todos los días (incluidos
                    sábados y domingos). Para producción, cambiar
                    CONSIDERAR_DIAS_NO_ESCOLARES a false.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Formulario de búsqueda - Completamente responsivo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 sxs-only:p-3 xs-only:p-3 sm-only:p-4 md-only:p-4 lg-only:p-4 xl-only:p-5 mb-4">
          <div className="space-y-4">
            {/* Campos del formulario - Grid responsivo usando solo breakpoints -only */}
            <div className="grid sxs-only:grid-cols-1 xs-only:grid-cols-1 sm-only:grid-cols-2 md-only:grid-cols-2 lg-only:grid-cols-12 xl-only:grid-cols-12 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-3 md-only:gap-3 lg-only:gap-4 xl-only:gap-4">
              {/* Selector de Rol */}
              <div className="sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-2 md-only:col-span-2 lg-only:col-span-3 xl-only:col-span-3">
                <label className="block sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 mb-1">
                  Tipo de Personal
                </label>
                <select
                  value={selectedRol || ""}
                  onChange={(e) =>
                    handleRolChange(e.target.value as RolesSistema)
                  }
                  onKeyPress={handleKeyPress}
                  disabled={loading || loadingEventos}
                  className={`w-full sxs-only:px-3 sxs-only:py-2.5 xs-only:px-3 xs-only:py-2.5 sm-only:px-3 sm-only:py-2.5 md-only:px-3 md-only:py-2.5 lg-only:px-3 lg-only:py-2.5 xl-only:px-3 xl-only:py-2.5 border-2 rounded-lg transition-all duration-200 sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm bg-white sxs-only:min-h-[2.75rem] xs-only:min-h-[2.75rem] sm-only:min-h-[3rem] md-only:min-h-[3rem] lg-only:min-h-[3rem] xl-only:min-h-[3rem] shadow-sm ${
                    loading || loadingEventos
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                      : "border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  }`}
                >
                  <option value="">Seleccionar tipo de personal</option>
                  {roles.map((rol) => (
                    <option key={rol.value} value={rol.value}>
                      {rol.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Usuario */}
              <div className="sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-2 md-only:col-span-2 lg-only:col-span-4 xl-only:col-span-4">
                <SiasisUserSelector
                  usuarioSeleccionado={usuarioSeleccionado}
                  ID_SELECTOR_USUARIO_GENERICO_HTML="SIASIS-SDU_Seccion-Consulta-Registros-Mensuales-Personal"
                  siasisAPI="API01"
                  rolUsuariosABuscar={selectedRol}
                  setUsuarioSeleccionado={setUsuarioSeleccionado}
                  disabled={!rolEstaSeleccionado || loading || loadingEventos}
                />
              </div>

              {/* Selector de Mes */}
              <div className="sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-1 md-only:col-span-1 lg-only:col-span-3 xl-only:col-span-3">
                <label className="block sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 mb-1">
                  Mes a Consultar
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <select
                    value={selectedMes}
                    onChange={(e) => handleMesChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={
                      !usuarioEstaSeleccionado || loading || loadingEventos
                    }
                    className={`w-full pl-9 pr-3 sxs-only:py-2.5 xs-only:py-2.5 sm-only:py-2.5 md-only:py-2.5 lg-only:py-2.5 xl-only:py-2.5 border-2 rounded-lg transition-all duration-200 sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm bg-white sxs-only:min-h-[2.75rem] xs-only:min-h-[2.75rem] sm-only:min-h-[3rem] md-only:min-h-[3rem] lg-only:min-h-[3rem] xl-only:min-h-[3rem] shadow-sm appearance-none ${
                      !usuarioEstaSeleccionado || loading || loadingEventos
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                        : "border-gray-200 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    }`}
                  >
                    <option value="">
                      {!usuarioEstaSeleccionado
                        ? "Selecciona usuario primero"
                        : "Seleccionar mes"}
                    </option>
                    {usuarioEstaSeleccionado &&
                      getMesesDisponibles().map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Botón de búsqueda */}
              <div className="sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-1 md-only:col-span-1 lg-only:col-span-2 xl-only:col-span-2">
                <label className="block sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 mb-1">
                  &nbsp;
                </label>
                <button
                  type="button"
                  onClick={buscarAsistencias}
                  disabled={
                    !todosLosCamposCompletos || loading || loadingEventos
                  }
                  className={`w-full sxs-only:px-3 sxs-only:py-2.5 xs-only:px-3 xs-only:py-2.5 sm-only:px-4 sm-only:py-2.5 md-only:px-4 md-only:py-2.5 lg-only:px-4 lg-only:py-2.5 xl-only:px-4 xl-only:py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm sxs-only:min-h-[2.75rem] xs-only:min-h-[2.75rem] sm-only:min-h-[3rem] md-only:min-h-[3rem] lg-only:min-h-[3rem] xl-only:min-h-[3rem] shadow-sm ${
                    !todosLosCamposCompletos || loading || loadingEventos
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                      : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-blue-500"
                  }`}
                >
                  {loading || loadingEventos ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Consultando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Buscar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Indicadores de estado */}
            {(loading || loadingEventos) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3">
                <div className="flex items-center">
                  <Loader2 className="animate-spin sxs-only:h-3 sxs-only:w-3 xs-only:h-3 xs-only:w-3 sm-only:h-4 sm-only:w-4 md-only:h-4 md-only:w-4 lg-only:h-4 lg-only:w-4 xl-only:h-4 xl-only:w-4 text-blue-500 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-700 font-semibold truncate sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                      Consultando registros de asistencia...
                    </p>
                    <p className="text-blue-600 truncate sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje informativo sobre exportación */}
            {exportandoExcel && ENTORNO !== Entorno.PRODUCCION && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3">
                <div className="flex items-center">
                  <Download className="animate-bounce sxs-only:h-3 sxs-only:w-3 xs-only:h-3 xs-only:w-3 sm-only:h-4 sm-only:w-4 md-only:h-4 md-only:w-4 lg-only:h-4 lg-only:w-4 xl-only:h-4 xl-only:w-4 text-green-500 mr-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-green-700 font-semibold truncate sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                      Generando archivo Excel...
                    </p>
                    <p className="text-green-600 truncate sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3">
                <div className="flex items-center">
                  <AlertCircle className="sxs-only:w-3 sxs-only:h-3 xs-only:w-4 xs-only:h-4 sm-only:w-4 sm-only:h-4 md-only:w-4 md-only:h-4 lg-only:w-4 lg-only:h-4 xl-only:w-4 xl-only:h-4 text-red-500 mr-2 flex-shrink-0" />
                  <p className="text-red-700 font-medium truncate min-w-0 flex-1 sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                    {error.message}
                  </p>
                </div>
              </div>
            )}

            {/* Mensaje de éxito */}
            {successMessage && ENTORNO !== Entorno.PRODUCCION && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3">
                <div className="flex items-center">
                  <CheckCircle className="sxs-only:w-3 sxs-only:h-3 xs-only:w-4 xs-only:h-4 sm-only:w-4 sm-only:h-4 md-only:w-4 md-only:h-4 lg-only:w-4 lg-only:h-4 xl-only:w-4 xl-only:h-4 text-green-500 mr-2 flex-shrink-0" />
                  <p className="text-green-700 font-medium truncate min-w-0 flex-1 sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ INFORMACIÓN DEL USUARIO - COMPLETAMENTE RESPONSIVO */}
        {data && !loading && !loadingEventos && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 sxs-only:p-3 xs-only:p-3 sm-only:p-4 md-only:p-5 lg-only:p-5 xl-only:p-6 mb-4">
            <div className="flex sxs-only:flex-col xs-only:flex-col sm-only:flex-row md-only:flex-row lg-only:flex-row xl-only:flex-row sxs-only:space-y-3 xs-only:space-y-3 sm-only:space-y-0 md-only:space-y-0 lg-only:space-y-0 xl-only:space-y-0 sxs-only:items-center xs-only:items-center sm-only:items-center md-only:items-center lg-only:items-center xl-only:items-center sm-only:space-x-4 md-only:space-x-4 lg-only:space-x-5 xl-only:space-x-6">
              {/* Avatar con iniciales - Responsivo y corregido */}
              <div className="flex-shrink-0">
                {usuarioSeleccionado?.Google_Drive_Foto_ID ? (
                  <FotoPerfilClientSide
                    Google_Drive_Foto_ID={
                      usuarioSeleccionado.Google_Drive_Foto_ID
                    }
                    className="sxs-only:w-16 sxs-only:h-16 xs-only:w-16 xs-only:h-16 sm-only:w-18 sm-only:h-18 md-only:w-20 md-only:h-20 lg-only:w-20 lg-only:h-20 xl-only:w-24 xl-only:h-24 border-2 border-white rounded-full shadow-md"
                  />
                ) : (
                  <div className="sxs-only:w-16 sxs-only:h-16 xs-only:w-16 xs-only:h-16 sm-only:w-18 sm-only:h-18 md-only:w-20 md-only:h-20 lg-only:w-20 lg-only:h-20 xl-only:w-24 xl-only:h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-md sxs-only:text-lg xs-only:text-lg sm-only:text-xl md-only:text-xl lg-only:text-2xl xl-only:text-2xl">
                    <span className="tracking-wide">
                      {usuarioSeleccionado?.Nombres?.charAt(0)}
                      {usuarioSeleccionado?.Apellidos?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Información del usuario - Responsivo */}
              <div className="flex-1 min-w-0 sxs-only:text-center xs-only:text-center sm-only:text-left md-only:text-left lg-only:text-left xl-only:text-left">
                <div className="flex sxs-only:flex-col sxs-only:items-center xs-only:flex-col xs-only:items-center sm-only:flex-row sm-only:items-center md-only:flex-row md-only:items-center lg-only:flex-row lg-only:items-center xl-only:flex-row xl-only:items-center sxs-only:gap-2 xs-only:gap-2 sm-only:gap-2.5 md-only:gap-2.5 lg-only:gap-2.5 xl-only:gap-3 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-3 md-only:mb-3 lg-only:mb-3 xl-only:mb-3">
                  <h3 className="sxs-only:text-base xs-only:text-base sm-only:text-lg md-only:text-lg lg-only:text-xl xl-only:text-xl font-bold text-gray-900 truncate">
                    {usuarioSeleccionado?.Nombres}{" "}
                    {usuarioSeleccionado?.Apellidos}
                  </h3>
                  <span className="inline-flex items-center sxs-only:px-2 sxs-only:py-0.5 xs-only:px-2 xs-only:py-0.5 sm-only:px-2.5 sm-only:py-0.5 md-only:px-2.5 md-only:py-0.5 lg-only:px-2.5 lg-only:py-0.5 xl-only:px-3 xl-only:py-1 rounded-lg sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold bg-blue-100 text-blue-800 flex-shrink-0 border border-blue-300">
                    {roles.find((r) => r.value === selectedRol)?.label}
                  </span>
                </div>

                {/* Datos en formato responsivo */}
                <div className="flex sxs-only:flex-col sxs-only:items-center sxs-only:gap-1.5 xs-only:flex-col xs-only:items-center xs-only:gap-1.5 sm-only:flex-wrap sm-only:items-center sm-only:gap-x-4 sm-only:gap-y-1 md-only:flex-wrap md-only:items-center md-only:gap-x-5 md-only:gap-y-2 lg-only:flex-wrap lg-only:items-center lg-only:gap-x-6 lg-only:gap-y-2 xl-only:flex-wrap xl-only:items-center xl-only:gap-x-6 xl-only:gap-y-2 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm text-gray-600 sxs-only:mb-2 xs-only:mb-2 sm-only:mb-3 md-only:mb-3 lg-only:mb-3 xl-only:mb-3">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-gray-700 flex-shrink-0">
                      DNI:
                    </span>
                    <span className="font-medium text-gray-900">
                      {usuarioSeleccionado?.DNI_Directivo ??
                        usuarioSeleccionado?.ID_O_DNI_Usuario}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-gray-700 flex-shrink-0">
                      Mes:
                    </span>
                    <span className="font-medium text-gray-900">
                      {mesesTextos[data.mes as Meses]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-gray-700 flex-shrink-0">
                      Registros:
                    </span>
                    <span className="font-medium text-gray-900">
                      {registros.length}
                    </span>
                  </div>

                  {/* Mensaje de días laborables */}
                  <div className="sxs-only:col-span-full xs-only:col-span-full sm-only:flex-basis-full md-only:flex-basis-full lg-only:flex-basis-full xl-only:flex-basis-full">
                    <p className="text-xs text-gray-600 italic">
                      {CONSIDERAR_DIAS_NO_ESCOLARES && ENTORNO === Entorno.LOCAL
                        ? "📅 Incluye todos los días hasta la fecha actual"
                        : "📅 Solo días laborables hasta la fecha actual"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de exportar - Responsivo y funcional */}
              <div className="flex-shrink-0 sxs-only:w-full xs-only:w-full sm-only:w-auto md-only:w-auto lg-only:w-auto xl-only:w-auto">
                <button
                  onClick={exportarAsistenciaPersonalAExcel}
                  disabled={exportandoExcel || !data || registros.length === 0}
                  title={
                    !data || registros.length === 0
                      ? "Realiza una búsqueda para exportar datos"
                      : "Exportar a Excel"
                  }
                  className={`sxs-only:w-full sxs-only:px-4 sxs-only:py-2.5 xs-only:w-full xs-only:px-4 xs-only:py-2.5 sm-only:px-4 sm-only:py-2.5 md-only:px-4 md-only:py-3 lg-only:px-5 lg-only:py-3 xl-only:px-5 xl-only:py-3 rounded-lg font-medium sxs-only:text-sm xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm transition-all duration-200 flex items-center justify-center space-x-2.5 sxs-only:min-w-full xs-only:min-w-full sm-only:min-w-[120px] md-only:min-w-[130px] lg-only:min-w-[135px] xl-only:min-w-[140px] shadow-sm hover:shadow-md ${
                    exportandoExcel || !data || registros.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-300"
                      : "bg-white border border-gray-300 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700"
                  }`}
                >
                  {exportandoExcel ? (
                    <>
                      <Download className="sxs-only:w-4 xs-only:w-4 sm-only:w-5 md-only:w-6 lg-only:w-6 xl-only:w-6 flex-shrink-0 animate-bounce" />
                      <span className="truncate">Generando...</span>
                    </>
                  ) : (
                    <>
                      <img
                        className="sxs-only:w-4 xs-only:w-4 sm-only:w-5 md-only:w-6 lg-only:w-6 xl-only:w-6 flex-shrink-0"
                        src="/images/svg/Aplicaciones Relacionadas/ExcelLogo.svg"
                        alt="Logo de Excel"
                      />
                      <span className="truncate">
                        {!data || registros.length === 0
                          ? "Sin datos"
                          : "Exportar"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de registros - Completamente responsiva */}
        {registros.length > 0 && !loading && !loadingEventos && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="sxs-only:p-3 xs-only:p-3 sm-only:p-4 md-only:p-4 lg-only:p-4 xl-only:p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <FileText className="sxs-only:w-4 sxs-only:h-4 xs-only:w-4 xs-only:h-4 sm-only:w-5 sm-only:h-5 md-only:w-5 md-only:h-5 lg-only:w-5 lg-only:h-5 xl-only:w-5 xl-only:h-5 text-gray-600 flex-shrink-0" />
                <h3 className="sxs-only:text-sm xs-only:text-sm sm-only:text-base md-only:text-base lg-only:text-base xl-only:text-base font-bold text-gray-900 truncate">
                  Detalle de Asistencias
                </h3>
              </div>
            </div>

            {/* Tabla responsiva */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gris-oscuro text-white">
                  <tr>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Fecha
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Entrada Programada
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Entrada Real
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Diferencia Entrada
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Estado Entrada
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Salida Programada
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Salida Real
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Diferencia Salida
                    </th>
                    <th className="px-2 lg-only:px-4 py-3 text-center text-xs lg-only:text-sm font-medium">
                      Estado Salida
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gris-claro">
                  {registros.map((registro, index) => (
                    <tr
                      key={registro.fecha}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } ${
                        registro.esDiaNoEscolar && !registro.esEvento
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        <div className="flex flex-col items-center">
                          <span>
                            {new Date(
                              registro.fecha + "T00:00:00"
                            ).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                          {registro.esEvento && (
                            <div className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-violeta-principal font-medium mt-1">
                              🎉 {registro.nombreEvento}
                            </div>
                          )}
                          {registro.esDiaNoEscolar && !registro.esEvento && (
                            <div className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-blue-600 font-medium mt-1">
                              📅 Fin de semana
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.entradaProgramada}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.entradaReal}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.diferenciaEntrada}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 text-center">
                        <span
                          className={`inline-block sxs-only:px-1 sxs-only:py-0.5 xs-only:px-1 xs-only:py-0.5 sm-only:px-2 sm-only:py-1 md-only:px-2 md-only:py-1 lg-only:px-2 lg-only:py-1 xl-only:px-2 xl-only:py-1 rounded-full sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs font-medium ${
                            EstadosAsistenciaPersonalStyles[
                              registro.estadoEntrada
                            ]
                          }`}
                        >
                          {mapearEstadoParaUI(registro.estadoEntrada)}
                        </span>
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.salidaProgramada}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.salidaReal}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-sm xl-only:text-sm text-gris-oscuro text-center">
                        {registro.diferenciaSalida}
                      </td>
                      <td className="sxs-only:px-1 sxs-only:py-2 xs-only:px-1 xs-only:py-2 sm-only:px-2 sm-only:py-3 md-only:px-2 md-only:py-3 lg-only:px-4 lg-only:py-3 xl-only:px-4 xl-only:py-3 text-center">
                        <span
                          className={`inline-block sxs-only:px-1 sxs-only:py-0.5 xs-only:px-1 xs-only:py-0.5 sm-only:px-2 sm-only:py-1 md-only:px-2 md-only:py-1 lg-only:px-2 lg-only:py-1 xl-only:px-2 xl-only:py-1 rounded-full sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs font-medium ${
                            EstadosAsistenciaPersonalStyles[
                              registro.estadoSalida
                            ]
                          }`}
                        >
                          {mapearEstadoParaUI(registro.estadoSalida)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leyenda explicativa - Completamente responsiva */}
        {registros.length > 0 && !loading && !loadingEventos && (
          <div className="mt-6 bg-white rounded-lg shadow-md sxs-only:p-3 xs-only:p-3 sm-only:p-4 md-only:p-5 lg-only:p-6 xl-only:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Info className="sxs-only:w-4 sxs-only:h-4 xs-only:w-4 xs-only:h-4 sm-only:w-5 sm-only:h-5 md-only:w-5 md-only:h-5 lg-only:w-5 lg-only:h-5 xl-only:w-5 xl-only:h-5 text-blue-500 flex-shrink-0" />
              <h4 className="sxs-only:text-sm xs-only:text-sm sm-only:text-base md-only:text-base lg-only:text-base xl-only:text-base font-bold text-gray-900 truncate">
                Leyenda de Estados de Asistencia
              </h4>
            </div>

            <div className="grid sxs-only:grid-cols-1 xs-only:grid-cols-1 sm-only:grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-3 xl-only:grid-cols-3 sxs-only:gap-3 xs-only:gap-3 sm-only:gap-4 md-only:gap-4 lg-only:gap-4 xl-only:gap-4">
              {/* Estados de Entrada */}
              <div className="space-y-2 min-w-0">
                <h5 className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 bg-gray-100 sxs-only:px-2 sxs-only:py-1 xs-only:px-2 xs-only:py-1 sm-only:px-2 sm-only:py-1 md-only:px-2 md-only:py-1 lg-only:px-2 lg-only:py-1 xl-only:px-2 xl-only:py-1 rounded-md truncate">
                  Estados de Entrada
                </h5>
                <div className="space-y-2">
                  {[
                    {
                      estado: EstadosAsistenciaPersonal.En_Tiempo,
                      descripcion: "Llegó dentro del horario establecido",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Temprano,
                      descripcion: "Llegó antes del horariJo programado",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Tarde,
                      descripcion: "Llegó después del horario establecido",
                    },
                  ].map(({ estado, descripcion }) => (
                    <div
                      key={estado}
                      className="flex items-start space-x-2 min-w-0"
                    >
                      <span
                        className={`inline-flex sxs-only:px-1.5 sxs-only:py-0.5 xs-only:px-1.5 xs-only:py-0.5 sm-only:px-2 sm-only:py-0.5 md-only:px-2 md-only:py-0.5 lg-only:px-2 lg-only:py-0.5 xl-only:px-2 xl-only:py-0.5 rounded-full sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs font-semibold flex-shrink-0 ${EstadosAsistenciaPersonalStyles[estado]}`}
                      >
                        {mapearEstadoParaUI(estado)}
                      </span>
                      <p className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-gray-600 truncate min-w-0 flex-1">
                        {descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estados de Salida */}
              <div className="space-y-2 min-w-0">
                <h5 className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 bg-gray-100 sxs-only:px-2 sxs-only:py-1 xs-only:px-2 xs-only:py-1 sm-only:px-2 sm-only:py-1 md-only:px-2 md-only:py-1 lg-only:px-2 lg-only:py-1 xl-only:px-2 xl-only:py-1 rounded-md truncate">
                  Estados de Salida
                </h5>
                <div className="space-y-2">
                  {[
                    {
                      estado: EstadosAsistenciaPersonal.Cumplido,
                      descripcion: "Completó su horario laboral correctamente",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Salida_Anticipada,
                      descripcion: "Se retiró antes del horario establecido",
                    },
                  ].map(({ estado, descripcion }) => (
                    <div
                      key={estado}
                      className="flex items-start space-x-2 min-w-0"
                    >
                      <span
                        className={`inline-flex sxs-only:px-1.5 sxs-only:py-0.5 xs-only:px-1.5 xs-only:py-0.5 sm-only:px-2 sm-only:py-0.5 md-only:px-2 md-only:py-0.5 lg-only:px-2 lg-only:py-0.5 xl-only:px-2 xl-only:py-0.5 rounded-full sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs font-semibold flex-shrink-0 ${EstadosAsistenciaPersonalStyles[estado]}`}
                      >
                        {mapearEstadoParaUI(estado)}
                      </span>
                      <p className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-gray-600 truncate min-w-0 flex-1">
                        {descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estados Especiales */}
              <div className="space-y-2 min-w-0 sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-1 md-only:col-span-2 lg-only:col-span-1 xl-only:col-span-1">
                <h5 className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-sm font-semibold text-gray-700 bg-gray-100 sxs-only:px-2 sxs-only:py-1 xs-only:px-2 xs-only:py-1 sm-only:px-2 sm-only:py-1 md-only:px-2 md-only:py-1 lg-only:px-2 lg-only:py-1 xl-only:px-2 xl-only:py-1 rounded-md truncate">
                  Estados Especiales
                </h5>
                <div className="space-y-2">
                  {[
                    {
                      estado: EstadosAsistenciaPersonal.Falta,
                      descripcion: "No asistió al trabajo ese día",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.No_Registrado,
                      descripcion: "No marcó entrada/salida en el sistema",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Sin_Registro,
                      descripcion: "No se tomó asistencia ese día",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Inactivo,
                      descripcion: "Usuario inactivo en el sistema",
                    },
                    {
                      estado: EstadosAsistenciaPersonal.Evento,
                      descripcion: "Día feriado o evento especial",
                    },
                  ].map(({ estado, descripcion }) => (
                    <div
                      key={estado}
                      className="flex items-start space-x-2 min-w-0"
                    >
                      <span
                        className={`inline-flex sxs-only:px-1.5 sxs-only:py-0.5 xs-only:px-1.5 xs-only:py-0.5 sm-only:px-2 sm-only:py-0.5 md-only:px-2 md-only:py-0.5 lg-only:px-2 lg-only:py-0.5 xl-only:px-2 xl-only:py-0.5 rounded-full sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs font-semibold flex-shrink-0 ${EstadosAsistenciaPersonalStyles[estado]}`}
                      >
                        {mapearEstadoParaUI(estado)}
                      </span>
                      <p className="sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-gray-600 truncate min-w-0 flex-1">
                        {descripcion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Información importante */}
            <div className="mt-4 sxs-only:p-2 xs-only:p-2 sm-only:p-3 md-only:p-3 lg-only:p-3 xl-only:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Clock className="sxs-only:w-3 sxs-only:h-3 xs-only:w-3 xs-only:h-3 sm-only:w-4 sm-only:h-4 md-only:w-4 md-only:h-4 lg-only:w-4 lg-only:h-4 xl-only:w-4 xl-only:h-4 text-blue-600 sxs-only:mt-0 xs-only:mt-0 sm-only:mt-0.5 md-only:mt-0.5 lg-only:mt-0.5 xl-only:mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h5 className="text-blue-800 font-semibold sxs-only:mb-1 xs-only:mb-1 sm-only:mb-2 md-only:mb-2 lg-only:mb-2 xl-only:mb-2 truncate sxs-only:text-xs xs-only:text-xs sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-sm">
                    Información del Sistema
                  </h5>
                  <div className="grid sxs-only:grid-cols-1 xs-only:grid-cols-1 sm-only:grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-2 xl-only:grid-cols-2 sxs-only:gap-1 xs-only:gap-1 sm-only:gap-2 md-only:gap-2 lg-only:gap-2 xl-only:gap-2 sxs-only:text-xs xs-only:text-xs sm-only:text-xs md-only:text-xs lg-only:text-xs xl-only:text-xs text-blue-700">
                    <div className="flex items-start space-x-1 min-w-0">
                      <span className="text-blue-600 font-bold flex-shrink-0">
                        📊
                      </span>
                      <span className="truncate">
                        Los estados se calculan automáticamente según la
                        diferencia entre horarios programados y reales
                      </span>
                    </div>
                    <div className="flex items-start space-x-1 min-w-0">
                      <span className="text-green-600 font-bold flex-shrink-0">
                        ⏰
                      </span>
                      <span className="truncate">
                        Los registros se sincronizan en tiempo real con el
                        servidor
                      </span>
                    </div>
                    <div className="flex items-start space-x-1 min-w-0">
                      <span className="text-purple-600 font-bold flex-shrink-0">
                        📅
                      </span>
                      <span className="truncate">
                        Se muestran solo días laborables hasta la fecha actual
                      </span>
                    </div>
                    <div className="flex items-start space-x-1 min-w-0">
                      <span className="text-orange-600 font-bold flex-shrink-0">
                        🎯
                      </span>
                      <span className="truncate">
                        Los datos incluyen entrada, salida y diferencias
                        horarias
                      </span>
                    </div>
                    {CONSIDERAR_DIAS_NO_ESCOLARES &&
                      ENTORNO === Entorno.LOCAL && (
                        <div className="sxs-only:col-span-1 xs-only:col-span-1 sm-only:col-span-1 md-only:col-span-2 lg-only:col-span-2 xl-only:col-span-2 flex items-start space-x-1 min-w-0">
                          <span className="text-amber-600 font-bold flex-shrink-0">
                            ⚠️
                          </span>
                          <span className="truncate">
                            <strong>Modo Desarrollo:</strong> Los registros con
                            fondo azul corresponden a fines de semana
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrosAsistenciaDePersonal;

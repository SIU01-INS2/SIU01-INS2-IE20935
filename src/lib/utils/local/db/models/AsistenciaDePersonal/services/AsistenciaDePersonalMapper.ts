/* eslint-disable @typescript-eslint/no-explicit-any */
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { EstadosAsistenciaPersonal } from "@/interfaces/shared/EstadosAsistenciaPersonal";

import { TipoPersonal } from "../AsistenciaDePersonalTypes";
import {
  SEGUNDOS_TOLERANCIA_ENTRADA_PERSONAL,
  SEGUNDOS_TOLERANCIA_SALIDA_PERSONAL,
} from "@/constants/MINUTOS_TOLERANCIA_ASISTENCIA_PERSONAL";

// Interfaces para los registros de entrada/salida
export interface RegistroEntradaSalida {
  timestamp: number;
  desfaseSegundos: number;
  estado: EstadosAsistenciaPersonal;
}

/**
 * 🎯 RESPONSABILIDAD: Conversiones y mapeo entre diferentes tipos de datos
 * - Mapeo de roles a tipos de personal
 * - Mapeo de datos entre diferentes formatos
 * - Determinación de estados de asistencia
 * - Generación de nombres de campos y stores
 *
 * ✅ ACTUALIZADO: Soporte completo para directivos
 */
export class AsistenciaDePersonalMapper {
  /**
   * ✅ ACTUALIZADO: Convierte un rol del sistema al tipo de personal correspondiente
   * Incluye soporte para directivos
   */
  public obtenerTipoPersonalDesdeRolOActor(
    rol: RolesSistema | ActoresSistema
  ): TipoPersonal {
    switch (rol) {
      // ✅ NUEVO: Soporte para directivos
      case RolesSistema.Directivo:
      case ActoresSistema.Directivo:
        return TipoPersonal.DIRECTIVO;

      case RolesSistema.ProfesorPrimaria:
      case ActoresSistema.ProfesorPrimaria:
        return TipoPersonal.PROFESOR_PRIMARIA;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
      case ActoresSistema.ProfesorSecundaria:
        return TipoPersonal.PROFESOR_SECUNDARIA;

      case RolesSistema.Auxiliar:
      case ActoresSistema.Auxiliar:
        return TipoPersonal.AUXILIAR;

      case RolesSistema.PersonalAdministrativo:
      case ActoresSistema.PersonalAdministrativo:
        return TipoPersonal.PERSONAL_ADMINISTRATIVO;

      default:
        throw new Error(`Rol no válido o no soportado: ${rol}`);
    }
  }

  /**
   * ✅ ACTUALIZADO: Mapea rol del sistema a actor (incluye directivos)
   */
  public obtenerActorDesdeRol(rol: RolesSistema): ActoresSistema {
    switch (rol) {
      // ✅ NUEVO: Soporte para directivos
      case RolesSistema.Directivo:
        return ActoresSistema.Directivo;

      case RolesSistema.ProfesorPrimaria:
        return ActoresSistema.ProfesorPrimaria;

      case RolesSistema.ProfesorSecundaria:
      case RolesSistema.Tutor:
        return ActoresSistema.ProfesorSecundaria;

      case RolesSistema.Auxiliar:
        return ActoresSistema.Auxiliar;

      case RolesSistema.PersonalAdministrativo:
        return ActoresSistema.PersonalAdministrativo;

      default:
        throw new Error(`Rol no válido para asistencia personal: ${rol}`);
    }
  }

  public obtenerRolDesdeActor(actor: ActoresSistema): RolesSistema {
    switch (actor) {
      case ActoresSistema.Directivo:
        return RolesSistema.Directivo;
      case ActoresSistema.ProfesorPrimaria:
        return RolesSistema.ProfesorPrimaria;
      case ActoresSistema.ProfesorSecundaria:
        return RolesSistema.ProfesorSecundaria;
      case ActoresSistema.Auxiliar:
        return RolesSistema.Auxiliar;
      case ActoresSistema.PersonalAdministrativo:
        return RolesSistema.PersonalAdministrativo;
      default:
        throw new Error(`Actor no válido: ${actor}`);
    }
  }

  /**
   * Obtiene el nombre del almacén según el tipo de personal y el modo de registro
   */
  public getStoreName(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): string {
    const baseNames = {
      [TipoPersonal.DIRECTIVO]:
        modoRegistro === ModoRegistro.Entrada
          ? "control_entrada_mensual_directivos"
          : "control_salida_mensual_directivos",
      [TipoPersonal.PROFESOR_PRIMARIA]:
        modoRegistro === ModoRegistro.Entrada
          ? "control_entrada_profesores_primaria"
          : "control_salida_profesores_primaria",
      [TipoPersonal.PROFESOR_SECUNDARIA]:
        modoRegistro === ModoRegistro.Entrada
          ? "control_entrada_profesores_secundaria"
          : "control_salida_profesores_secundaria",
      [TipoPersonal.AUXILIAR]:
        modoRegistro === ModoRegistro.Entrada
          ? "control_entrada_auxiliar"
          : "control_salida_auxiliar",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]:
        modoRegistro === ModoRegistro.Entrada
          ? "control_entrada_personal_administrativo"
          : "control_salida_personal_administrativo",
    };

    return baseNames[tipoPersonal];
  }

  /**
   * Obtiene el nombre del campo de identificación según el tipo de personal
   */
  public getIdFieldName(tipoPersonal: TipoPersonal): string {
    const fieldNames = {
      [TipoPersonal.DIRECTIVO]: "Id_Directivo", // ✅ DIFERENTE: ID en lugar de DNI
      [TipoPersonal.PROFESOR_PRIMARIA]: "DNI_Profesor_Primaria",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "DNI_Profesor_Secundaria",
      [TipoPersonal.AUXILIAR]: "DNI_Auxiliar",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "DNI_Personal_Administrativo",
    };

    return fieldNames[tipoPersonal];
  }

  /**
   * Obtiene el nombre del campo ID según el tipo de personal y modo de registro
   */
  public getIdFieldForStore(
    tipoPersonal: TipoPersonal,
    modoRegistro: ModoRegistro
  ): string {
    const idFields = {
      [TipoPersonal.DIRECTIVO]:
        modoRegistro === ModoRegistro.Entrada
          ? "Id_C_E_M_P_Directivo"
          : "Id_C_S_M_P_Directivo",
      [TipoPersonal.PROFESOR_PRIMARIA]:
        modoRegistro === ModoRegistro.Entrada
          ? "Id_C_E_M_P_Profesores_Primaria"
          : "Id_C_S_M_P_Profesores_Primaria",
      [TipoPersonal.PROFESOR_SECUNDARIA]:
        modoRegistro === ModoRegistro.Entrada
          ? "Id_C_E_M_P_Profesores_Secundaria"
          : "Id_C_S_M_P_Profesores_Secundaria",
      [TipoPersonal.AUXILIAR]:
        modoRegistro === ModoRegistro.Entrada
          ? "Id_C_E_M_P_Auxiliar"
          : "Id_C_S_M_P_Auxiliar",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]:
        modoRegistro === ModoRegistro.Entrada
          ? "Id_C_E_M_P_Administrativo"
          : "Id_C_S_M_P_Administrativo",
    };

    return idFields[tipoPersonal];
  }

  /**
   * Obtiene el nombre del índice para la búsqueda por personal y mes
   */
  public getIndexNameForPersonalMes(tipoPersonal: TipoPersonal): string {
    const indexNames = {
      [TipoPersonal.DIRECTIVO]: "por_directivo_mes", // ✅ DIFERENTE
      [TipoPersonal.PROFESOR_PRIMARIA]: "por_profesor_mes",
      [TipoPersonal.PROFESOR_SECUNDARIA]: "por_profesor_mes",
      [TipoPersonal.AUXILIAR]: "por_auxiliar_mes",
      [TipoPersonal.PERSONAL_ADMINISTRATIVO]: "por_administrativo_mes",
    };

    return indexNames[tipoPersonal];
  }

  /**
   * ✅ NUEVO: Determina si el tipo de personal usa ID numérico o DNI
   */
  public usaIdNumerico(tipoPersonal: TipoPersonal): boolean {
    return tipoPersonal === TipoPersonal.DIRECTIVO;
  }

  /**
   * ✅ NUEVO: Valida el formato del identificador según el tipo de personal
   */
  public validarFormatoIdentificador(
    tipoPersonal: TipoPersonal,
    identificador: string
  ): boolean {
    if (this.usaIdNumerico(tipoPersonal)) {
      // Para directivos: debe ser un ID numérico (como string)
      return /^[0-9]+$/.test(identificador);
    } else {
      // Para otros: debe ser DNI de 8 dígitos
      return /^\d{8}$/.test(identificador);
    }
  }

  /**
   * ✅ NUEVO: Obtiene el tipo de identificador legible para mensajes de error
   */
  public getTipoIdentificadorLegible(tipoPersonal: TipoPersonal): string {
    return this.usaIdNumerico(tipoPersonal) ? "ID" : "DNI";
  }

  /**
   * ✅ NUEVO: Mapea el store name al TipoPersonal (útil para operaciones inversas)
   */
  public getPersonalTypeFromStoreName(storeName: string): TipoPersonal | null {
    const storeMapping: Record<string, TipoPersonal> = {
      control_entrada_mensual_directivos: TipoPersonal.DIRECTIVO,
      control_salida_mensual_directivos: TipoPersonal.DIRECTIVO,
      control_entrada_profesores_primaria: TipoPersonal.PROFESOR_PRIMARIA,
      control_salida_profesores_primaria: TipoPersonal.PROFESOR_PRIMARIA,
      control_entrada_profesores_secundaria: TipoPersonal.PROFESOR_SECUNDARIA,
      control_salida_profesores_secundaria: TipoPersonal.PROFESOR_SECUNDARIA,
      control_entrada_auxiliar: TipoPersonal.AUXILIAR,
      control_salida_auxiliar: TipoPersonal.AUXILIAR,
      control_entrada_personal_administrativo:
        TipoPersonal.PERSONAL_ADMINISTRATIVO,
      control_salida_personal_administrativo:
        TipoPersonal.PERSONAL_ADMINISTRATIVO,
    };

    return storeMapping[storeName] || null;
  }

  /**
   * ✅ NUEVO: Obtiene identificador desde JWT token decodificado
   * Maneja diferentes tipos de roles y sus identificadores
   */
  public obtenerIdentificadorDesdeJWT(
    tokenDecodificado: any,
    rol: RolesSistema
  ): string {
    const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

    switch (tipoPersonal) {
      case TipoPersonal.DIRECTIVO:
        // Para directivos: obtener el ID del token
        return (
          tokenDecodificado.Id_Directivo?.toString() ||
          tokenDecodificado.id?.toString() ||
          tokenDecodificado.Id?.toString() ||
          ""
        );

      case TipoPersonal.PROFESOR_PRIMARIA:
        return (
          tokenDecodificado.DNI_Profesor_Primaria || tokenDecodificado.dni || ""
        );

      case TipoPersonal.PROFESOR_SECUNDARIA:
        return (
          tokenDecodificado.DNI_Profesor_Secundaria ||
          tokenDecodificado.dni ||
          ""
        );

      case TipoPersonal.AUXILIAR:
        return tokenDecodificado.DNI_Auxiliar || tokenDecodificado.dni || "";

      case TipoPersonal.PERSONAL_ADMINISTRATIVO:
        return (
          tokenDecodificado.DNI_Personal_Administrativo ||
          tokenDecodificado.dni ||
          ""
        );

      default:
        console.warn(
          `Tipo de personal no reconocido para JWT: ${tipoPersonal}`
        );
        return tokenDecodificado.dni || tokenDecodificado.id?.toString() || "";
    }
  }

  /**
   * ✅ NUEVO: Valida que el identificador extraído del JWT sea válido
   */
  public validarIdentificadorJWT(
    identificador: string,
    rol: RolesSistema
  ): {
    valido: boolean;
    razon: string;
    identificadorLimpio: string;
  } {
    const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);
    const identificadorLimpio = identificador.trim();

    if (!identificadorLimpio) {
      return {
        valido: false,
        razon: `${this.getTipoIdentificadorLegible(
          tipoPersonal
        )} no puede estar vacío`,
        identificadorLimpio: "",
      };
    }

    if (!this.validarFormatoIdentificador(tipoPersonal, identificadorLimpio)) {
      const tipoEsperado = this.getTipoIdentificadorLegible(tipoPersonal);
      const formatoEsperado = this.usaIdNumerico(tipoPersonal)
        ? "ID numérico"
        : "DNI de 8 dígitos";

      return {
        valido: false,
        razon: `${tipoEsperado} tiene formato inválido. Se esperaba: ${formatoEsperado}`,
        identificadorLimpio,
      };
    }

    return {
      valido: true,
      razon: "Identificador válido",
      identificadorLimpio,
    };
  }

  /**
   * Determina el estado de asistencia basado en el desfase de tiempo
   */
  public determinarEstadoAsistencia(
    desfaseSegundos: number,
    modoRegistro: ModoRegistro
  ): EstadosAsistenciaPersonal {
    if (modoRegistro === ModoRegistro.Entrada) {
      // ✅ CAMBIO: Solo Temprano o Tarde
      if (desfaseSegundos <= SEGUNDOS_TOLERANCIA_ENTRADA_PERSONAL) {
        return EstadosAsistenciaPersonal.Temprano; // ✅ CAMBIADO
      } else {
        return EstadosAsistenciaPersonal.Tarde; // ✅ SIN TOLERANCIA
      }
    } else {
      // Para salidas mantener la lógica existente o cambiar según necesites
      if (desfaseSegundos >= -SEGUNDOS_TOLERANCIA_SALIDA_PERSONAL) {
        return EstadosAsistenciaPersonal.Cumplido;
      } else {
        return EstadosAsistenciaPersonal.Salida_Anticipada;
      }
    }
  }

  /**
   * ✅ ACTUALIZADO: Procesa registros JSON manejando valores NULL para 404s
   */
  public procesarRegistrosJSON(
    registrosJSON: any,
    modoRegistro: ModoRegistro
  ): Record<string, RegistroEntradaSalida> {
    const registrosProcesados: Record<string, RegistroEntradaSalida> = {};

    // ✅ MANEJO DE 404s: Si registrosJSON es null, devolver objeto vacío
    if (registrosJSON === null || registrosJSON === undefined) {
      console.log(
        `📝 Procesando registro NULL (404 de API) para ${modoRegistro}`
      );
      return registrosProcesados; // Objeto vacío pero válido
    }

    // ✅ VALIDACIÓN: Asegurar que sea un objeto
    if (typeof registrosJSON !== "object") {
      console.warn(
        `⚠️ registrosJSON no es un objeto válido para ${modoRegistro}:`,
        registrosJSON
      );
      return registrosProcesados;
    }

    Object.entries(registrosJSON).forEach(
      ([dia, registroRaw]: [string, any]) => {
        if (registroRaw === null) {
          registrosProcesados[dia] = {
            timestamp: 0,
            desfaseSegundos: 0,
            estado: EstadosAsistenciaPersonal.Inactivo,
          };
          return;
        }

        if (registroRaw && typeof registroRaw === "object") {
          const timestamp = registroRaw.Timestamp;
          const desfaseSegundos = registroRaw.DesfaseSegundos;

          if (timestamp === null && desfaseSegundos === null) {
            registrosProcesados[dia] = {
              timestamp: 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Falta,
            };
            return;
          }

          if (timestamp === null) {
            registrosProcesados[dia] = {
              timestamp: 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Inactivo,
            };
            return;
          }

          if (desfaseSegundos === null) {
            registrosProcesados[dia] = {
              timestamp: timestamp || 0,
              desfaseSegundos: 0,
              estado: EstadosAsistenciaPersonal.Sin_Registro,
            };
            return;
          }

          const estado = this.determinarEstadoAsistencia(
            desfaseSegundos,
            modoRegistro
          );

          registrosProcesados[dia] = {
            timestamp: timestamp || 0,
            desfaseSegundos: desfaseSegundos || 0,
            estado,
          };
        }
      }
    );

    return registrosProcesados;
  }

  /**
   * Genera clave para cache (formato compatible con Redis)
   */
  public generarClaveCache(
    actor: ActoresSistema,
    modoRegistro: ModoRegistro,
    id_o_dni: string | number,
    fecha: string
  ): string {
    return `${fecha}:${modoRegistro}:${actor}:${id_o_dni}`;
  }

  // ========================================================================================
  // ✅ NUEVOS MÉTODOS PARA FLUJO INTELIGENTE
  // ========================================================================================

  /**
   * ✅ NUEVO: Determina si un rol puede usar el flujo inteligente
   */
  public puedeUsarFlujoInteligente(rol: RolesSistema): boolean {
    try {
      // Intentar mapear el rol para ver si es válido
      this.obtenerTipoPersonalDesdeRolOActor(rol);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  /**
   * ✅ NUEVO: Obtiene configuración específica del rol para optimizaciones
   */
  public obtenerConfiguracionOptimizacion(rol: RolesSistema): {
    puedeUsarCache: boolean;
    requiereValidacionExtra: boolean;
    soportaHorarios: boolean;
    tipoIdentificador: "ID" | "DNI";
  } {
    const tipoPersonal = this.obtenerTipoPersonalDesdeRolOActor(rol);

    return {
      puedeUsarCache: true, // Todos los roles pueden usar cache
      requiereValidacionExtra: tipoPersonal === TipoPersonal.DIRECTIVO, // Directivos requieren validación extra
      soportaHorarios: true, // Todos soportan lógica de horarios
      tipoIdentificador: this.usaIdNumerico(tipoPersonal) ? "ID" : "DNI",
    };
  }

  /**
   * ✅ NUEVO: Mapea datos raw de API a formato interno con timestamp obligatorio
   */
  public mapearDesdeAPIConTimestamp(
    datosAPI: any,
    ultimaFechaActualizacion: number
  ): {
    entrada: any | null;
    salida: any | null;
  } {
    try {
      const registroBase = {
        Id_Registro_Mensual: datosAPI.Id_Registro_Mensual_Entrada || Date.now(),
        Mes: datosAPI.Mes,
        ID_o_DNI_Personal: datosAPI.ID_O_DNI_Usuario,
        ultima_fecha_actualizacion: ultimaFechaActualizacion, // ✅ OBLIGATORIO
      };

      const entrada =
        datosAPI.Entradas !== undefined
          ? {
              ...registroBase,
              Id_Registro_Mensual: datosAPI.Id_Registro_Mensual_Entrada,
              Entradas: datosAPI.Entradas, // Puede ser null para 404s
            }
          : null;

      const salida =
        datosAPI.Salidas !== undefined
          ? {
              ...registroBase,
              Id_Registro_Mensual: datosAPI.Id_Registro_Mensual_Salida,
              Salidas: datosAPI.Salidas, // Puede ser null para 404s
            }
          : null;

      return { entrada, salida };
    } catch (error) {
      console.error("Error al mapear datos de API:", error);
      return { entrada: null, salida: null };
    }
  }

  /**
   * ✅ NUEVO: Valida consistencia de datos antes de guardar
   */
  public validarConsistenciaDatos(
    datosEntrada: any,
    datosSalida: any
  ): {
    valido: boolean;
    errores: string[];
    advertencias: string[];
  } {
    const errores: string[] = [];
    const advertencias: string[] = [];

    // Validar que ambos registros tengan el mismo usuario
    if (datosEntrada && datosSalida) {
      if (datosEntrada.ID_o_DNI_Personal !== datosSalida.ID_o_DNI_Personal) {
        errores.push("El ID/DNI no coincide entre entrada y salida");
      }

      if (datosEntrada.Mes !== datosSalida.Mes) {
        errores.push("El mes no coincide entre entrada y salida");
      }

      // Validar timestamps
      if (!datosEntrada.ultima_fecha_actualizacion) {
        errores.push("Falta timestamp en datos de entrada");
      }

      if (!datosSalida.ultima_fecha_actualizacion) {
        errores.push("Falta timestamp en datos de salida");
      }

      // Advertir sobre diferencias en timestamps
      const diferenciaTimestamp = Math.abs(
        (datosEntrada.ultima_fecha_actualizacion || 0) -
          (datosSalida.ultima_fecha_actualizacion || 0)
      );

      if (diferenciaTimestamp > 60000) {
        // Más de 1 minuto de diferencia
        advertencias.push(
          "Los timestamps de entrada y salida difieren significativamente"
        );
      }
    }

    // Validar registros individuales
    [datosEntrada, datosSalida].forEach((datos, index) => {
      if (datos) {
        const tipo = index === 0 ? "entrada" : "salida";

        if (!datos.ID_o_DNI_Personal) {
          errores.push(`Falta ID/DNI en datos de ${tipo}`);
        }

        if (!datos.Mes || datos.Mes < 1 || datos.Mes > 12) {
          errores.push(`Mes inválido en datos de ${tipo}: ${datos.Mes}`);
        }

        if (!datos.ultima_fecha_actualizacion) {
          errores.push(`Falta timestamp obligatorio en datos de ${tipo}`);
        }
      }
    });

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
    };
  }
}

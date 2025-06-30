/* eslint-disable @typescript-eslint/no-explicit-any */
import { SiasisAPIS } from "@/interfaces/shared/SiasisComponents";
import fetchSiasisApiGenerator from "@/lib/helpers/generators/fetchSiasisApisGenerator";
import {
  ApiResponseBase,
  ErrorResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import { DataErrorTypes } from "@/interfaces/shared/errors";
import {
  AsistenciaCompletaMensualDePersonal,
  GetAsistenciaMensualDePersonalSuccessResponse,
} from "@/interfaces/shared/apis/api01/personal/types";

import {
  RolesSistema,
  ActoresSistema,
  ModoRegistro,
  OperationResult,
} from "../AsistenciaDePersonalTypes";
import { AsistenciaDePersonalMapper } from "./AsistenciaDePersonalMapper";
import { AsistenciaDePersonalDateHelper } from "./AsistenciaDePersonalDateHelper";
import { AsistenciaDePersonalRepository } from "./AsistenciaDePersonalRepository";
import {
  EliminarAsistenciaRequestBody,
  TipoAsistencia,
} from "@/interfaces/shared/AsistenciaRequests";

/**
 * 🎯 RESPONSABILIDAD: Llamadas a APIs externas
 * - Consultar APIs de asistencia
 * - Eliminar asistencias via API
 * - Manejar respuestas de API
 * - Transformar datos entre formatos
 * - Sincronizar eliminaciones con registros locales
 *
 * ✅ CORREGIDO:
 * - Timestamp automático tras eliminaciones
 * - Toda lógica temporal delegada a DateHelper (SRP)
 * - Sincronización completa entre APIs y registros locales
 */
export class AsistenciaDePersonalAPIClient {
  private siasisAPI: SiasisAPIS;
  private mapper: AsistenciaDePersonalMapper;
  private dateHelper: AsistenciaDePersonalDateHelper; // ✅ NUEVO: Dependencia de DateHelper
  private repository: AsistenciaDePersonalRepository; // ✅ NUEVO: Para actualizar registros locales

  constructor(
    siasisAPI: SiasisAPIS,
    mapper: AsistenciaDePersonalMapper,
    dateHelper: AsistenciaDePersonalDateHelper, // ✅ NUEVO
    repository: AsistenciaDePersonalRepository // ✅ NUEVO
  ) {
    this.siasisAPI = siasisAPI;
    this.mapper = mapper;
    this.dateHelper = dateHelper; // ✅ NUEVO
    this.repository = repository; // ✅ NUEVO
  }

  /**
   * Consulta la API para obtener asistencias mensuales
   * ✅ SIN CAMBIOS: No maneja timestamps directamente
   */
  public async consultarAsistenciasMensuales(
    rol: RolesSistema | ActoresSistema,
    id_o_dni: string | number,
    mes: number
  ): Promise<AsistenciaCompletaMensualDePersonal | null> {
    try {
      const { fetchSiasisAPI } = fetchSiasisApiGenerator(this.siasisAPI);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: `/api/personal/asistencias-mensuales?Rol=${rol}&ID_O_DNI=${id_o_dni}&Mes=${mes}`,
        method: "GET",
      });

      if (!fetchCancelable) {
        throw new Error(
          "No se pudo crear la petición de asistencias mensuales"
        );
      }

      const response = await fetchCancelable.fetch();

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            `📡 API devuelve 404 para ${id_o_dni} - mes ${mes} (sin datos)`
          );
          return null;
        }
        throw new Error(`Error al obtener asistencias: ${response.statusText}`);
      }

      const objectResponse = (await response.json()) as ApiResponseBase;

      if (!objectResponse.success) {
        if (
          (objectResponse as ErrorResponseAPIBase).errorType ===
          DataErrorTypes.NO_DATA_AVAILABLE
        ) {
          console.log(
            `📡 API devuelve NO_DATA_AVAILABLE para ${id_o_dni} - mes ${mes}`
          );
          return null;
        }
        throw new Error(`Error en respuesta: ${objectResponse.message}`);
      }

      const { data } =
        objectResponse as GetAsistenciaMensualDePersonalSuccessResponse;

      console.log(
        `📡 API devuelve datos exitosamente para ${id_o_dni} - mes ${mes}`
      );
      return data;
    } catch (error) {
      console.error(
        "Error al consultar asistencias mensuales desde API:",
        error
      );
      return null;
    }
  }

  /**
   * ✅ NUEVO: Consulta Redis específicamente para una persona
   * 🎯 PROPÓSITO: Obtener asistencia específica de una persona desde Redis
   */
  public async consultarRedisEspecifico(
    rol: RolesSistema,
    id_o_dni: string | number,
    modoRegistro: ModoRegistro
  ): Promise<{
    encontrado: boolean;
    datos?: any;
    mensaje: string;
  }> {
    try {
      // Construir URL para consulta específica
      const params = new URLSearchParams({
        ModoRegistro: modoRegistro,
        TipoAsistencia: TipoAsistencia.ParaPersonal,
      });

      const actor = this.mapper.obtenerActorDesdeRol(rol);
      params.append("Actor", actor);
      params.append("ID_o_DNI", String(id_o_dni));

      // Si ES consulta propia, no agregar Actor para que la API detecte consulta propia

      const url = `/api/asistencia-hoy/consultar-asistencias-tomadas?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            encontrado: false,
            mensaje: "No se encontró asistencia en Redis",
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Verificar si hay resultados
      const tieneResultados =
        data.Resultados &&
        (Array.isArray(data.Resultados)
          ? data.Resultados.length > 0
          : data.Resultados !== null);

      if (tieneResultados) {
        console.log(
          `✅ Asistencia encontrada en Redis para ${id_o_dni} - ${modoRegistro}`
        );
        return {
          encontrado: true,
          datos: data,
          mensaje: "Asistencia encontrada en Redis",
        };
      } else {
        console.log(
          `📭 No se encontró asistencia en Redis para ${id_o_dni} - ${modoRegistro}`
        );
        return {
          encontrado: false,
          mensaje: "No se encontró asistencia en Redis para esta persona",
        };
      }
    } catch (error) {
      console.error("❌ Error al consultar Redis específico:", error);
      return {
        encontrado: false,
        mensaje: `Error al consultar Redis: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Consulta Redis para ambos modos (entrada y salida) de una persona
   */
  public async consultarRedisCompletoPorPersona(
    rol: RolesSistema,
    id_o_dni: string | number,
    incluirSalidas: boolean = true
  ): Promise<{
    entrada?: any;
    salida?: any;
    encontradoEntrada: boolean;
    encontradoSalida: boolean;
    mensaje: string;
  }> {
    try {
      const timestampConsulta = this.dateHelper.obtenerTimestampPeruano();
      console.log(
        `🔍 Consulta Redis completa para ${id_o_dni} - incluirSalidas: ${incluirSalidas} (${this.dateHelper.formatearTimestampLegible(
          timestampConsulta
        )})`
      );

      // Consultar entrada
      const resultadoEntrada = await this.consultarRedisEspecifico(
        rol,
        id_o_dni,
        ModoRegistro.Entrada
      );

      let resultadoSalida = {
        encontrado: false,
        mensaje: "Salidas no solicitadas",
      };

      // Consultar salida solo si se requiere
      if (incluirSalidas) {
        resultadoSalida = await this.consultarRedisEspecifico(
          rol,
          id_o_dni,
          ModoRegistro.Salida
        );
      }

      const mensaje = `Redis: entrada=${resultadoEntrada.encontrado}, salida=${
        incluirSalidas ? resultadoSalida.encontrado : "no consultada"
      }`;

      return {
        entrada: resultadoEntrada.encontrado
          ? resultadoEntrada.datos
          : undefined,
        salida: resultadoSalida.encontrado
          ? (resultadoSalida as any).datos
          : undefined,
        encontradoEntrada: resultadoEntrada.encontrado,
        encontradoSalida: incluirSalidas ? resultadoSalida.encontrado : false,
        mensaje,
      };
    } catch (error) {
      console.error("❌ Error en consulta Redis completa:", error);
      return {
        encontradoEntrada: false,
        encontradoSalida: false,
        mensaje: `Error en consulta Redis: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Marca asistencia en Redis mediante API
   */
  public async marcarAsistenciaEnRedis(
    dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    horaEsperadaISO: string
  ): Promise<OperationResult> {
    try {
      const actor = this.mapper.obtenerActorDesdeRol(rol);
      const timestampOperacion = this.dateHelper.obtenerTimestampPeruano();

      const requestBody = {
        ID_o_DNI: dni,
        Actor: actor,
        TipoAsistencia: TipoAsistencia.ParaPersonal,
        ModoRegistro: modoRegistro,
        FechaHoraEsperadaISO: horaEsperadaISO,
      };

      console.log(
        `☁️ Marcando asistencia en Redis con timestamp ${timestampOperacion}:`,
        requestBody
      );

      const response = await fetch("/api/asistencia-hoy/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        return {
          exitoso: true,
          mensaje: "Asistencia marcada exitosamente en Redis",
          datos: {
            ...responseData.data,
            timestampOperacion,
          },
        };
      } else {
        return {
          exitoso: false,
          mensaje: responseData.message || "Error al marcar asistencia",
        };
      }
    } catch (error) {
      console.error("Error al marcar asistencia en Redis:", error);
      return {
        exitoso: false,
        mensaje: `Error al marcar asistencia: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Consulta asistencias tomadas en Redis
   */
  public async consultarAsistenciasTomadasEnRedis(
    tipoAsistencia: TipoAsistencia,
    actor: ActoresSistema,
    modoRegistro: ModoRegistro
  ): Promise<any> {
    try {
      const url = `/api/asistencia-hoy/consultar-asistencias-tomadas?TipoAsistencia=${tipoAsistencia}&Actor=${actor}&ModoRegistro=${modoRegistro}`;

      console.log(`🔍 Consultando asistencias en Redis: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("📡 Datos obtenidos de Redis:", data);

      return data;
    } catch (error) {
      console.error("Error al consultar asistencias en Redis:", error);
      throw error;
    }
  }

  /**
   * ✅ NUEVO: Consulta mis asistencias mensuales (para usuarios no directivos)
   */
  public async consultarMisAsistenciasMensuales(
    mes: number
  ): Promise<AsistenciaCompletaMensualDePersonal | null> {
    try {
      const { fetchSiasisAPI } = fetchSiasisApiGenerator(this.siasisAPI);

      const fetchCancelable = await fetchSiasisAPI({
        endpoint: `/api/personal/mis-asistencias?Mes=${mes}`,
        method: "GET",
      });

      if (!fetchCancelable) {
        throw new Error("No se pudo crear la petición de mis asistencias");
      }

      const response = await fetchCancelable.fetch();

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            `📡 Mis asistencias API devuelve 404 para mes ${mes} (sin datos)`
          );
          return null;
        }
        throw new Error(
          `Error al obtener mis asistencias: ${response.statusText}`
        );
      }

      const objectResponse = (await response.json()) as ApiResponseBase;

      if (!objectResponse.success) {
        if (
          (objectResponse as ErrorResponseAPIBase).errorType ===
          DataErrorTypes.NO_DATA_AVAILABLE
        ) {
          console.log(
            `📡 Mis asistencias API devuelve NO_DATA_AVAILABLE para mes ${mes}`
          );
          return null;
        }
        throw new Error(`Error en respuesta: ${objectResponse.message}`);
      }

      const { data } =
        objectResponse as GetAsistenciaMensualDePersonalSuccessResponse;

      console.log(
        `📡 Mis asistencias API devuelve datos exitosamente para mes ${mes}`
      );
      return data;
    } catch (error) {
      console.error("Error al consultar mis asistencias desde API:", error);
      return null;
    }
  }

  /**
   * ✅ NUEVO: Consulta Redis para asistencia propia (sin Actor ni ID_o_DNI)
   */
  public async consultarMiRedisEspecifico(modoRegistro: ModoRegistro): Promise<{
    encontrado: boolean;
    datos?: any;
    mensaje: string;
  }> {
    try {
      const params = new URLSearchParams({
        TipoAsistencia: TipoAsistencia.ParaPersonal,
        ModoRegistro: modoRegistro,
      });

      const url = `/api/asistencia-hoy/consultar-asistencias-tomadas?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            encontrado: false,
            mensaje: "No se encontró mi asistencia en Redis",
          };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      const tieneResultados =
        data.Resultados &&
        (Array.isArray(data.Resultados)
          ? data.Resultados.length > 0
          : data.Resultados !== null);

      if (tieneResultados) {
        console.log(`✅ Mi asistencia encontrada en Redis - ${modoRegistro}`);
        return {
          encontrado: true,
          datos: data,
          mensaje: "Mi asistencia encontrada en Redis",
        };
      } else {
        console.log(
          `📭 No se encontró mi asistencia en Redis - ${modoRegistro}`
        );
        return {
          encontrado: false,
          mensaje: "No se encontró mi asistencia en Redis",
        };
      }
    } catch (error) {
      console.error("❌ Error al consultar mi Redis específico:", error);
      return {
        encontrado: false,
        mensaje: `Error al consultar mi Redis: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Marca mi asistencia propia en Redis
   */
  public async marcarMiAsistenciaPropia(
    modoRegistro: ModoRegistro,
    horaEsperadaISO: string
  ): Promise<OperationResult> {
    try {
      const timestampOperacion = this.dateHelper.obtenerTimestampPeruano();

      const requestBody = {
        ModoRegistro: modoRegistro,
        FechaHoraEsperadaISO: horaEsperadaISO,
      };

      console.log(
        `☁️ Marcando mi asistencia en Redis con timestamp ${timestampOperacion}:`,
        requestBody
      );

      const response = await fetch("/api/asistencia-hoy/marcar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseData = await response.json();

      if (responseData.success) {
        return {
          exitoso: true,
          mensaje: "Mi asistencia marcada exitosamente en Redis",
          datos: {
            ...responseData.data,
            timestampOperacion,
          },
        };
      } else {
        return {
          exitoso: false,
          mensaje: responseData.message || "Error al marcar mi asistencia",
        };
      }
    } catch (error) {
      console.error("Error al marcar mi asistencia en Redis:", error);
      return {
        exitoso: false,
        mensaje: `Error al marcar mi asistencia: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Elimina asistencia de Redis mediante API
   * ✅ CORREGIDO: Actualiza registros locales y timestamps tras eliminación
   */
  public async eliminarAsistenciaRedis(
    id_o_dni: string | number,
    rol: RolesSistema,
    modoRegistro: ModoRegistro
  ): Promise<OperationResult> {
    try {
      // Mapear RolesSistema a ActoresSistema
      let actor: ActoresSistema;
      try {
        actor = this.mapper.obtenerActorDesdeRol(rol);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        return {
          exitoso: false,
          mensaje: `Rol no soportado para eliminación: ${rol}`,
        };
      }

      // ✅ NUEVO: Obtener información temporal antes de la eliminación
      const infoFechaActual = this.dateHelper.obtenerInfoFechaActual();
      if (!infoFechaActual) {
        return {
          exitoso: false,
          mensaje: "No se pudo obtener fecha actual para procesar eliminación",
        };
      }

      const { diaActual, mesActual } = infoFechaActual;
      const timestampEliminacion = this.dateHelper.obtenerTimestampPeruano();

      // Crear el request body para la API de eliminación
      const requestBody: EliminarAsistenciaRequestBody = {
        ID_o_DNI: String(id_o_dni),
        Actor: actor,
        ModoRegistro: modoRegistro,
        TipoAsistencia: TipoAsistencia.ParaPersonal,
      };

      console.log(
        `☁️ Enviando solicitud de eliminación a Redis con timestamp ${timestampEliminacion} (${this.dateHelper.formatearTimestampLegible(
          timestampEliminacion
        )}):`,
        requestBody
      );

      // Hacer la petición a la API de eliminación
      const response = await fetch("/api/asistencia-hoy/descartar", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`☁️ Asistencia no encontrada en Redis (404)`);
          return {
            exitoso: false,
            mensaje: "Asistencia no encontrada en Redis",
          };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
          exitoso: false,
          mensaje: `Error ${response.status}: ${
            errorData.message || response.statusText
          }`,
        };
      }

      const responseData = await response.json();

      if (responseData.success) {
        console.log(`✅ Eliminación Redis exitosa:`, responseData.data);

        // ✅ NUEVO: Sincronizar eliminación con registros locales
        const sincronizacionLocal =
          await this.sincronizarEliminacionConRegistrosLocales(
            id_o_dni,
            rol,
            modoRegistro,
            diaActual,
            mesActual,
            timestampEliminacion
          );

        if (sincronizacionLocal.exitoso) {
          console.log(
            `🔄 Sincronización local completada: ${sincronizacionLocal.mensaje}`
          );
        } else {
          console.warn(
            `⚠️ Error en sincronización local: ${sincronizacionLocal.mensaje}`
          );
        }

        return {
          exitoso: responseData.data.asistenciaEliminada || false,
          mensaje:
            responseData.message ||
            "Eliminación exitosa de Redis y sincronización local completada",
          datos: {
            ...responseData.data,
            sincronizacionLocal: sincronizacionLocal.exitoso,
            timestampEliminacion,
          },
        };
      } else {
        console.log(`❌ Eliminación Redis falló:`, responseData.message);
        return {
          exitoso: false,
          mensaje: responseData.message || "Error al eliminar de Redis",
        };
      }
    } catch (error) {
      console.error("Error al eliminar de Redis:", error);
      return {
        exitoso: false,
        mensaje: `Error de conexión al eliminar de Redis: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Sincroniza la eliminación de Redis con los registros locales
   * Elimina el día específico del registro mensual y actualiza timestamp
   */
  private async sincronizarEliminacionConRegistrosLocales(
    id_o_dni: string | number,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    dia: number,
    mes: number,
    timestampEliminacion: number
  ): Promise<OperationResult> {
    try {
      const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);

      console.log(
        `🔄 Sincronizando eliminación local: ${id_o_dni} - ${modoRegistro} - día ${dia} del mes ${mes}`
      );

      // Eliminar el día específico del registro mensual local
      const resultadoEliminacion =
        await this.repository.eliminarDiaDeRegistroMensual(
          tipoPersonal,
          modoRegistro,
          id_o_dni,
          mes,
          dia
        );

      if (resultadoEliminacion.exitoso) {
        console.log(
          `✅ Día ${dia} eliminado exitosamente del registro local con timestamp ${timestampEliminacion}`
        );
        return {
          exitoso: true,
          mensaje: `Registro local actualizado: día ${dia} eliminado y timestamp actualizado`,
          datos: {
            diaEliminado: dia,
            mesAfectado: mes,
            modoRegistro,
            timestampActualizacion: timestampEliminacion,
          },
        };
      } else {
        console.warn(
          `⚠️ No se pudo eliminar día ${dia} del registro local: ${resultadoEliminacion.mensaje}`
        );
        return {
          exitoso: false,
          mensaje: `Error al actualizar registro local: ${resultadoEliminacion.mensaje}`,
        };
      }
    } catch (error) {
      console.error("Error en sincronización de eliminación local:", error);
      return {
        exitoso: false,
        mensaje: `Error en sincronización local: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Reintenta una operación con backoff exponencial
   * ✅ CORREGIDO: Usar DateHelper para delays y logging temporal
   */
  public async reintentar<T>(
    operacion: () => Promise<T>,
    maxIntentos: number = 3,
    delayInicial: number = 1000
  ): Promise<T> {
    let ultimoError: any;

    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        const timestampIntento = this.dateHelper.obtenerTimestampPeruano();
        console.log(
          `🔄 Intento ${intento}/${maxIntentos} - ${this.dateHelper.formatearTimestampLegible(
            timestampIntento
          )}...`
        );
        return await operacion();
      } catch (error) {
        ultimoError = error;
        const timestampError = this.dateHelper.obtenerTimestampPeruano();
        console.log(
          `❌ Intento ${intento} falló en ${this.dateHelper.formatearTimestampLegible(
            timestampError
          )}:`,
          error
        );

        if (intento < maxIntentos) {
          const delay = delayInicial * Math.pow(2, intento - 1);
          console.log(`⏱️ Esperando ${delay}ms antes del siguiente intento...`);

          // ✅ CORREGIDO: Usar Promise nativo pero con logging mejorado
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw ultimoError;
  }

  /**
   * Obtiene asistencias con reintentos automáticos
   * ✅ SIN CAMBIOS: Ya delegaba correctamente
   */
  public async consultarAsistenciasConReintentos(
    rol: RolesSistema | ActoresSistema,
    id_o_dni: string | number,
    mes: number,
    maxIntentos: number = 2
  ): Promise<AsistenciaCompletaMensualDePersonal | null> {
    try {
      return await this.reintentar(
        () => this.consultarAsistenciasMensuales(rol, id_o_dni, mes),
        maxIntentos
      );
    } catch (error) {
      console.error(
        `❌ Falló después de ${maxIntentos} intentos al consultar asistencias:`,
        error
      );
      return null;
    }
  }

  /**
   * Elimina asistencia con reintentos automáticos
   * ✅ NUEVO: Ahora incluye sincronización automática
   */
  public async eliminarAsistenciaConReintentos(
    id_o_dni: string | number,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    maxIntentos: number = 2
  ): Promise<OperationResult> {
    try {
      console.log(
        `🗑️ Iniciando eliminación con reintentos para ${id_o_dni} - ${rol} - ${modoRegistro}`
      );

      const resultado = await this.reintentar(
        () => this.eliminarAsistenciaRedis(id_o_dni, rol, modoRegistro),
        maxIntentos
      );

      if (resultado.exitoso) {
        console.log(
          `✅ Eliminación completa exitosa (Redis + Local) para ${id_o_dni}`
        );
      } else {
        console.log(
          `❌ Eliminación falló para ${id_o_dni}: ${resultado.mensaje}`
        );
      }

      return resultado;
    } catch (error) {
      console.error(
        `❌ Falló después de ${maxIntentos} intentos al eliminar asistencia:`,
        error
      );
      return {
        exitoso: false,
        mensaje: `Error después de ${maxIntentos} intentos: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * ✅ NUEVO: Elimina asistencia y fuerza actualización de registros locales
   * Método completo que garantiza consistencia entre Redis y registros locales
   */
  public async eliminarAsistenciaCompleta(
    id_o_dni: string,
    rol: RolesSistema,
    modoRegistro: ModoRegistro,
    dia?: number,
    mes?: number
  ): Promise<OperationResult> {
    try {
      // Obtener fecha actual si no se proporciona
      const infoFecha = this.dateHelper.obtenerInfoFechaActual();
      if (!infoFecha) {
        return {
          exitoso: false,
          mensaje:
            "No se pudo obtener información de fecha para la eliminación",
        };
      }

      const diaFinal = dia || infoFecha.diaActual;
      const mesFinal = mes || infoFecha.mesActual;
      const timestampOperacion = this.dateHelper.obtenerTimestampPeruano();

      console.log(
        `🗑️ Eliminación completa iniciada para ${id_o_dni} - día ${diaFinal}/${mesFinal} - ${modoRegistro} con timestamp ${timestampOperacion}`
      );

      // PASO 1: Eliminar de Redis (que ya incluye sincronización local)
      const resultadoEliminacion = await this.eliminarAsistenciaConReintentos(
        id_o_dni,
        rol,
        modoRegistro
      );

      if (resultadoEliminacion.exitoso) {
        return {
          exitoso: true,
          mensaje: `Eliminación completa exitosa: Redis y registros locales sincronizados`,
          datos: {
            ...resultadoEliminacion.datos,
            diaEliminado: diaFinal,
            mesEliminado: mesFinal,
            timestampOperacion,
            operacionCompleta: true,
          },
        };
      } else {
        // Si falla Redis, intentar al menos limpiar registro local
        console.log(
          `⚠️ Eliminación de Redis falló, intentando limpiar registro local...`
        );

        const tipoPersonal = this.mapper.obtenerTipoPersonalDesdeRolOActor(rol);
        const limpiezaLocal =
          await this.repository.eliminarDiaDeRegistroMensual(
            tipoPersonal,
            modoRegistro,
            id_o_dni,
            mesFinal,
            diaFinal
          );

        return {
          exitoso: false,
          mensaje: `Eliminación de Redis falló, limpieza local: ${
            limpiezaLocal.exitoso ? "exitosa" : "falló"
          }`,
          datos: {
            redisEliminado: false,
            localLimpiado: limpiezaLocal.exitoso,
            timestampOperacion,
            errorRedis: resultadoEliminacion.mensaje,
          },
        };
      }
    } catch (error) {
      console.error("Error en eliminación completa:", error);
      return {
        exitoso: false,
        mensaje: `Error en eliminación completa: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  }

  /**
   * Valida respuesta de la API
   * ✅ SIN CAMBIOS: No maneja timestamps
   */
  public validarRespuestaAPI(response: any): {
    valida: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (!response) {
      errores.push("La respuesta es nula o undefined");
      return { valida: false, errores };
    }

    if (typeof response.success !== "boolean") {
      errores.push("El campo 'success' debe ser un boolean");
    }

    if (typeof response.message !== "string") {
      errores.push("El campo 'message' debe ser un string");
    }

    if (response.success && !response.data) {
      errores.push("Respuesta exitosa debe incluir datos");
    }

    if (!response.success && !response.errorType) {
      errores.push("Respuesta de error debe incluir 'errorType'");
    }

    return {
      valida: errores.length === 0,
      errores,
    };
  }

  /**
   * Transforma datos de API al formato interno
   * ✅ SIN CAMBIOS: No maneja timestamps directamente
   */
  public transformarDatosAPI(datosAPI: AsistenciaCompletaMensualDePersonal): {
    entrada: Record<string, any>;
    salida: Record<string, any>;
  } {
    const entrada = this.mapper.procesarRegistrosJSON(
      datosAPI.Entradas,
      ModoRegistro.Entrada
    );

    const salida = this.mapper.procesarRegistrosJSON(
      datosAPI.Salidas,
      ModoRegistro.Salida
    );

    return { entrada, salida };
  }
}

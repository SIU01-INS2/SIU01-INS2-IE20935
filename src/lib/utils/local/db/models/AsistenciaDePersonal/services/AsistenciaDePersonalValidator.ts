import { AsistenciaMensualPersonalLocal } from "../AsistenciaDePersonalTypes";
import { AsistenciaDePersonalDateHelper } from "./AsistenciaDePersonalDateHelper";

/**
 * 🎯 RESPONSABILIDAD: Validaciones y verificaciones de datos
 * - Verificar sincronización de registros
 * - Validar integridad de datos
 * - Verificar existencia de registros
 * - Comprobar actualización necesaria
 */
export class AsistenciaDePersonalValidator {
  private dateHelper: AsistenciaDePersonalDateHelper;

  constructor(dateHelper: AsistenciaDePersonalDateHelper) {
    this.dateHelper = dateHelper;
  }

  /**
   * Verifica si los registros de entrada y salida están sincronizados
   * CRITERIO: Deben tener la misma cantidad de días ESCOLARES registrados (EXCLUYENDO EL DÍA ACTUAL)
   * DÍAS ESCOLARES: Solo lunes a viernes (fines de semana se ignoran)
   * MOTIVO: Durante el día actual puede haber entradas pero aún no salidas
   */
  public verificarSincronizacionEntradaSalida(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null
  ): {
    estanSincronizados: boolean;
    razon: string;
    diasEntrada: number;
    diasSalida: number;
    diasEscolaresEntrada: number;
    diasEscolaresSalida: number;
  } {
    // Obtener día actual desde Redux
    const fechaActualRedux = this.dateHelper.obtenerFechaActualDesdeRedux();
    if (!fechaActualRedux) {
      console.error(
        "❌ No se pudo obtener fecha desde Redux para verificar sincronización"
      );
      // Fallback: usar todos los días si no podemos obtener la fecha actual
      const diasEntrada = registroEntrada
        ? Object.keys(registroEntrada.registros || {}).length
        : 0;
      const diasSalida = registroSalida
        ? Object.keys(registroSalida.registros || {}).length
        : 0;

      return {
        estanSincronizados: diasEntrada === diasSalida,
        razon:
          diasEntrada === diasSalida
            ? `Ambos tienen ${diasEntrada} días (sin verificar día actual ni días escolares)`
            : `Diferente cantidad: entrada=${diasEntrada}, salida=${diasSalida} (sin verificar día actual ni días escolares)`,
        diasEntrada,
        diasSalida,
        diasEscolaresEntrada: diasEntrada,
        diasEscolaresSalida: diasSalida,
      };
    }

    const diaActual = fechaActualRedux.getDate().toString();

    // Función para contar días escolares excluyendo el día actual
    const contarDiasEscolaresSinActual = (
      registro: AsistenciaMensualPersonalLocal | null
    ): number => {
      if (!registro || !registro.registros) return 0;

      const diasEscolaresSinActual = Object.keys(registro.registros).filter(
        (dia) => {
          return (
            dia !== diaActual &&
            this.dateHelper.esDiaEscolar(dia, fechaActualRedux)
          );
        }
      );

      return diasEscolaresSinActual.length;
    };

    // Contar días en cada registro (incluyendo día actual y fines de semana para info)
    const diasEntrada = registroEntrada
      ? Object.keys(registroEntrada.registros || {}).length
      : 0;
    const diasSalida = registroSalida
      ? Object.keys(registroSalida.registros || {}).length
      : 0;

    // Contar solo días escolares excluyendo el día actual (esto es lo importante para sincronización)
    const diasEscolaresEntrada = contarDiasEscolaresSinActual(registroEntrada);
    const diasEscolaresSalida = contarDiasEscolaresSinActual(registroSalida);

    console.log(
      `🔍 Verificando sincronización de días escolares (día actual: ${diaActual}):`
    );
    console.log(
      `   📊 Entrada: ${diasEntrada} días total → ${diasEscolaresEntrada} días escolares históricos`
    );
    console.log(
      `   📊 Salida: ${diasSalida} días total → ${diasEscolaresSalida} días escolares históricos`
    );

    // Verificación: Solo comparar días escolares anteriores al actual
    if (diasEscolaresEntrada === diasEscolaresSalida) {
      console.log(
        `✅ SINCRONIZADOS: Ambos tienen ${diasEscolaresEntrada} días escolares históricos`
      );
      return {
        estanSincronizados: true,
        razon: `Ambos registros tienen ${diasEscolaresEntrada} días escolares históricos (excluyendo fines de semana y día actual)`,
        diasEntrada,
        diasSalida,
        diasEscolaresEntrada,
        diasEscolaresSalida,
      };
    }

    // Desincronizados: Diferente cantidad de días escolares
    console.log(
      `❌ DESINCRONIZADOS: Entrada=${diasEscolaresEntrada} días escolares, Salida=${diasEscolaresSalida} días escolares`
    );
    return {
      estanSincronizados: false,
      razon: `Diferente cantidad de días escolares históricos: entrada=${diasEscolaresEntrada}, salida=${diasEscolaresSalida} (solo lunes-viernes, excluyendo día actual)`,
      diasEntrada,
      diasSalida,
      diasEscolaresEntrada,
      diasEscolaresSalida,
    };
  }

  /**
   * Verifica si los registros locales necesitan actualización
   */
  public verificarSiNecesitaActualizacion(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null,
    diaActual: number
  ): boolean {
    // Calcular el último día registrado en ambos registros
    let ultimoDiaEntrada = 0;
    let ultimoDiaSalida = 0;

    if (registroEntrada && registroEntrada.registros) {
      const diasEntrada = Object.keys(registroEntrada.registros)
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d));
      ultimoDiaEntrada = diasEntrada.length > 0 ? Math.max(...diasEntrada) : 0;
    }

    if (registroSalida && registroSalida.registros) {
      const diasSalida = Object.keys(registroSalida.registros)
        .map((d) => parseInt(d))
        .filter((d) => !isNaN(d));
      ultimoDiaSalida = diasSalida.length > 0 ? Math.max(...diasSalida) : 0;
    }

    const ultimoDiaLocal = Math.max(ultimoDiaEntrada, ultimoDiaSalida);

    // Si el último día local es menor que el día actual - 1, necesita actualización
    // (dejamos margen de 1 día para evitar consultas constantes)
    const necesitaActualizacion = ultimoDiaLocal < diaActual - 1;

    console.log(`🔍 Verificación actualización:`, {
      ultimoDiaEntrada,
      ultimoDiaSalida,
      ultimoDiaLocal,
      diaActual,
      necesitaActualizacion,
    });

    return necesitaActualizacion;
  }

  /**
   * Verifica si el registro mensual tiene TODOS los días laborales anteriores
   */
  public verificarRegistroMensualCompleto(
    registroMensual: AsistenciaMensualPersonalLocal | null,
    diasLaboralesAnteriores: number[]
  ): boolean {
    if (!registroMensual || !registroMensual.registros) {
      return false;
    }

    // Si no hay días laborales anteriores (primer día laboral del mes), consideramos completo
    if (diasLaboralesAnteriores.length === 0) {
      return true;
    }

    // Verificar que TODOS los días laborales anteriores estén registrados
    for (const diaLaboral of diasLaboralesAnteriores) {
      const diaRegistrado = registroMensual.registros[diaLaboral.toString()];
      if (!diaRegistrado) {
        console.log(
          `❌ Falta el día laboral ${diaLaboral} en el registro mensual`
        );
        return false;
      }
    }

    console.log(
      `✅ Todos los días laborales anteriores están registrados: [${diasLaboralesAnteriores.join(
        ", "
      )}]`
    );
    return true;
  }

  /**
   * Verifica si un registro tiene datos históricos
   */
  public tieneRegistrosHistoricos(
    registroEntrada: AsistenciaMensualPersonalLocal | null,
    registroSalida: AsistenciaMensualPersonalLocal | null
  ): boolean {
    const sincronizacion = this.verificarSincronizacionEntradaSalida(
      registroEntrada,
      registroSalida
    );

    return (
      sincronizacion.diasEscolaresEntrada > 0 ||
      sincronizacion.diasEscolaresSalida > 0
    );
  }

  /**
   * Valida que un registro mensual tenga la estructura correcta
   */
  public validarEstructuraRegistroMensual(
    registro: AsistenciaMensualPersonalLocal | null
  ): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!registro) {
      errores.push("El registro es nulo");
      return { valido: false, errores };
    }

    if (typeof registro.Id_Registro_Mensual !== "number") {
      errores.push("Id_Registro_Mensual debe ser un número");
    }

    if (
      typeof registro.mes !== "number" ||
      registro.mes < 1 ||
      registro.mes > 12
    ) {
      errores.push("El mes debe ser un número entre 1 y 12");
    }

    if (
      typeof registro.ID_o_DNI_Personal !== "string" ||
      registro.ID_o_DNI_Personal.length !== 8
    ) {
      errores.push("Dni_Personal debe ser un string de 8 caracteres");
    }

    if (!registro.registros || typeof registro.registros !== "object") {
      errores.push("registros debe ser un objeto");
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  }

  /**
   * Verifica si un día específico está registrado
   */
  public existeDiaEnRegistro(
    registro: AsistenciaMensualPersonalLocal | null,
    dia: number
  ): boolean {
    if (!registro || !registro.registros) {
      return false;
    }

    return registro.registros.hasOwnProperty(dia.toString());
  }

  /**
   * Cuenta el total de días registrados (incluyendo fines de semana)
   */
  public contarTotalDiasRegistrados(
    registro: AsistenciaMensualPersonalLocal | null
  ): number {
    if (!registro || !registro.registros) {
      return 0;
    }

    return Object.keys(registro.registros).length;
  }

  /**
   * Cuenta solo los días escolares registrados (lunes a viernes)
   */
  public contarDiasEscolaresRegistrados(
    registro: AsistenciaMensualPersonalLocal | null
  ): number {
    if (!registro || !registro.registros) {
      return 0;
    }

    const diasEscolares = Object.keys(registro.registros).filter((dia) =>
      this.dateHelper.esDiaEscolar(dia)
    );

    return diasEscolares.length;
  }
}

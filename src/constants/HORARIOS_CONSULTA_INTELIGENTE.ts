/**
 * ⏰ CONSTANTES: Horarios para el flujo inteligente de consultas de asistencia
 */
export const HORARIOS_CONSULTA = {
  // Horarios del día escolar
  INICIO_DIA_ESCOLAR: 6, // 06:00 AM
  FIN_CONSOLIDACION: 22, // 10:00 PM
  SEPARACION_ENTRADAS_SALIDAS: 12, // 12:00 PM (mediodía)

  // Horarios especiales
  VIERNES_COMPLETO: 20, // 8:00 PM - Hora a partir de la cual se considera que el viernes está "completo"

  // Tolerancias
  MINUTOS_TOLERANCIA_CONSULTA: 30, // Tolerancia para consultas cerca de cambios de hora
};

/**
 * 📅 CONSTANTES: Días de la semana
 */
export const DIAS_SEMANA = {
  DOMINGO: 0,
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
};

/**
 * 🎯 TIPOS: Para mejor tipado
 */
export type HoraDelDia =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23;
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

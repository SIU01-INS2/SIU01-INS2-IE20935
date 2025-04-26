// import { getSubsectionTitle } from "@/lib/assets/ContenidoHelpers";
// import { CommandMenu } from "../../../lib/utils/voice/commands/CommandMenu";
// import {
//   C_V_Anterior,
//   C_V_Buscar,
//   C_V_Home,
//   C_V_Leer,
//   C_V_Modulo_1,
//   C_V_Modulo_2,
//   C_V_Modulo_2_Seccion_1,
//   C_V_Modulo_2_Seccion_2,
//   C_V_Modulo_2_Seccion_3,
//   C_V_Modulo_2_Seccion_4,
//   C_V_Modulo_2_Seccion_5,
//   C_V_Modulo_3,
//   C_V_Modulo_3_Seccion_1,
//   C_V_Modulo_3_Seccion_2,
//   C_V_Modulo_3_Seccion_3,
//   C_V_Modulo_3_Seccion_4,
//   C_V_Modulo_3_Seccion_5,
//   C_V_Modulo_4,
//   C_V_Modulo_4_Seccion_1,
//   C_V_Modulo_4_Seccion_2,
//   C_V_Modulo_4_Seccion_3,
//   C_V_Modulo_4_Seccion_4,
//   C_V_Modulo_4_Seccion_5,
//   C_V_Modulo_4_Seccion_6,
//   C_V_Modulo_4_Seccion_7,
//   C_V_Siguiente,
//   C_V_Usar_Validador,
//   C_V_Validador_Requerimientos,
//   C_VModulo_1_Seccion_1,
//   C_VModulo_1_Seccion_2,
//   C_VModulo_1_Seccion_3,
//   C_VModulo_1_Seccion_4,
// } from "./AllCommandVoices";

// export const C_M_Home = new CommandMenu(
//   "Bienvenido. En esta página principal, puedes navegar rápidamente utilizando comandos de voz. Para acceder directamente a los módulos disponibles, di: 'Módulo uno', 'Módulo dos', 'Módulo tres' o 'Módulo cuatro'. Por otro lado para usar el validador de requerimientos puedes decir validador",
//   [
//     C_V_Modulo_1,
//     C_V_Modulo_2,
//     C_V_Modulo_3,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Menu_Modulos = new CommandMenu(
//   "Puedes decir: 'Buscar' para realizar una búsqueda, para usar el validador de requerimientos puedes decir validador, tambien puedes decir 'Modulo 1', 'Modulo 2', 'Modulo 3' o 'Modulo 4' para acceder a los diferentes módulos. " +
//     "El Módulo 1 trata sobre 'Origen, Modelos, Normas y Herramientas para la Calidad del Software'. " +
//     "El Módulo 2 cubre 'Verificación y Validación de la Documentación del Análisis de Requerimientos'. " +
//     "El Módulo 3 se enfoca en 'Verificación y Validación de la Documentación del Diseño del Sistema'. " +
//     "Y el Módulo 4 aborda 'Factores Críticos de Éxito para el Desarrollo del Software'.",
//   [
//     C_V_Buscar,
//     C_V_Modulo_1,
//     C_V_Modulo_2,
//     C_V_Modulo_3,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Modulo_1 = new CommandMenu(
//   `Estás en el Módulo 1: *Calidad de Software*. Este módulo consta de cuatro secciones: 
//   - Di 'Sección 1' para acceder a *Conceptos, modelos y criterios de calidad de software*.
//   - Di 'Sección 2' para explorar *Herramientas para evaluar la calidad de software*.
//   - Di 'Sección 3' para visitar *Normas y estándares de calidad de software*.
//   - Di 'Sección 4' para descubrir *Origen y evolución de la ingeniería de software*.

//   Además, puedes:
//   - Utilizar el comando 'Buscar' para localizar información específica en este módulo.
//   - Dirigirte a otros módulos: 
//     - Di 'Módulo 2' para acceder a *Verificación y Validación*.
//     - Di 'Módulo 3' para explorar *Documentación del Diseño del Sistema*.
//     - Di 'Módulo 4' para descubrir *Factores Críticos de Éxito para el Desarrollo del Software*. Por otro lado para usar el validador de requerimientos puedes decir validador.
//   ¿Qué deseas hacer?`,
//   [
//     C_VModulo_1_Seccion_1,
//     C_VModulo_1_Seccion_2,
//     C_VModulo_1_Seccion_3,
//     C_VModulo_1_Seccion_4,
//     C_V_Buscar,
//     C_V_Modulo_2,
//     C_V_Modulo_3,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Modulo_2 = new CommandMenu(
//   `Estás en el Módulo 2: *Verificación y Validación*. Este módulo consta de cinco secciones: 
//   - Di 'Sección 1' para acceder a *Conceptos fundamentales de la Verificación y Validación*.
//   - Di 'Sección 2' para explorar *Verificación de la documentación de requerimientos*.
//   - Di 'Sección 3' para visitar *Validación de la documentación de requerimientos*.
//   - Di 'Sección 4' para descubrir *Revisión formal del documento de requerimientos*.
//   - Di 'Sección 5' para acceder a *Herramientas para Verificación y Validación en el análisis de requerimientos*.

//   También puedes:
//   - Usar el comando 'Buscar' para localizar información específica en este módulo.
//   - Navegar a otros módulos:
//     - Di 'Módulo 1' para explorar *Calidad de Software*.
//     - Di 'Módulo 3' para acceder a *Documentación del Diseño del Sistema*.
//     - Di 'Módulo 4' para descubrir *Factores Críticos de Éxito para el Desarrollo del Software*. Por otro lado para usar el validador de requerimientos puedes decir validador.
//   ¿Qué deseas hacer?`,
//   [
//     C_V_Modulo_2_Seccion_1,
//     C_V_Modulo_2_Seccion_2,
//     C_V_Modulo_2_Seccion_3,
//     C_V_Modulo_2_Seccion_4,
//     C_V_Modulo_2_Seccion_5,
//     C_V_Buscar,
//     C_V_Modulo_1,
//     C_V_Modulo_3,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Modulo_3 = new CommandMenu(
//   `Estás en el Módulo 3: *Documentación del Diseño del Sistema*. Este módulo consta de cinco secciones: 
//   - Di 'Sección 1' para acceder a *Conceptos fundamentales del diseño*.
//   - Di 'Sección 2' para explorar *Verificación de documentación*.
//   - Di 'Sección 3' para visitar *Validación de documentación*.
//   - Di 'Sección 4' para descubrir *Revisión formal del diseño*.
//   - Di 'Sección 5' para acceder a *Herramientas de Verificación y Validación*.

//   Además:
//   - Usa el comando 'Buscar' para encontrar información específica en este módulo.
//   - Navega a otros módulos:
//     - Di 'Módulo 1' para explorar *Calidad de Software*.
//     - Di 'Módulo 2' para acceder a *Verificación y Validación*.
//     - Di 'Módulo 4' para descubrir *Factores Críticos de Éxito para el Desarrollo del Software*. Por otro lado para usar el validador de requerimientos puedes decir validador.

//   ¿Qué deseas hacer?`,
//   [
//     C_V_Modulo_3_Seccion_1,
//     C_V_Modulo_3_Seccion_2,
//     C_V_Modulo_3_Seccion_3,
//     C_V_Modulo_3_Seccion_4,
//     C_V_Modulo_3_Seccion_5,
//     C_V_Buscar,
//     C_V_Modulo_1,
//     C_V_Modulo_2,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Modulo_4 = new CommandMenu(
//   `Estás en el Módulo 4: *Factores Críticos de Éxito para el Desarrollo del Software*. Este módulo consta de siete secciones:
//   - Di 'Sección 1' para explorar *Definición y características de factores críticos*.
//   - Di 'Sección 2' para acceder a *Factores técnicos críticos*.
//   - Di 'Sección 3' para visitar *Factores humanos*.
//   - Di 'Sección 4' para descubrir *Factores organizacionales*.
//   - Di 'Sección 5' para explorar *Metodologías y procesos*.
//   - Di 'Sección 6' para acceder a *Factores externos*.
//   - Di 'Sección 7' para visitar *Ejemplos de factores críticos*.

//   Además:
//   - Usa el comando 'Buscar' para localizar información específica en este módulo.
//   - Navega a otros módulos:
//     - Di 'Módulo 1' para explorar *Calidad de Software*.
//     - Di 'Módulo 2' para acceder a *Verificación y Validación*.
//     - Di 'Módulo 3' para descubrir *Documentación del Diseño del Sistema*.
//     Por otro lado para usar el validador de requerimientos puedes decir validador.
//   ¿Qué deseas hacer?`,
//   [
//     C_V_Modulo_4_Seccion_1,
//     C_V_Modulo_4_Seccion_2,
//     C_V_Modulo_4_Seccion_3,
//     C_V_Modulo_4_Seccion_4,
//     C_V_Modulo_4_Seccion_5,
//     C_V_Modulo_4_Seccion_6,
//     C_V_Modulo_4_Seccion_7,
//     C_V_Buscar,
//     C_V_Modulo_1,
//     C_V_Modulo_2,
//     C_V_Modulo_3,
//     C_V_Validador_Requerimientos,
//   ]
// );

// export const C_M_Subsecciones = new CommandMenu(
//   ``,
//   [
//     C_V_Leer,
//     C_V_Siguiente,
//     C_V_Anterior,
//     C_V_Buscar,
//     C_V_Modulo_1,
//     C_V_Modulo_2,
//     C_V_Modulo_3,
//     C_V_Modulo_4,
//     C_V_Validador_Requerimientos,
//   ],
//   (currentPath: string) => {
//     const subsectionTitle = getSubsectionTitle(currentPath);
//     return `Te encuentras en la subsección: ${subsectionTitle}.
//     Comandos de voz disponibles:
//     - Di "leer" para escuchar el contenido.
//     - Di "siguiente" para avanzar a la siguiente subsección.
//     - Di "anterior" para regresar a la subsección previa.
//     - Para detener la lectura en cualquier momento, presiona Control más Alt más X.

//     También puedes dirigirte directamente a cualquiera de los módulos diciendo: 
//     "módulo uno", "módulo dos", "módulo tres" o "módulo cuatro".
//      Por otro lado para usar el validador de requerimientos puedes decir validador.
//     ¿Qué deseas hacer?`;
//   }
// );

// export const C_M_Validador_Requerimientos = new CommandMenu(
//   `Te encuentras en el validador de requerimientos, para volver al inicio puedes decir inicio, si deseas validar algun requerimiento di usar validador`,
//   [C_V_Home, C_V_Usar_Validador]
// );

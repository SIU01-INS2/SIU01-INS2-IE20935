// import {
//   buscarSubseccionesPorTitulo,
//   getNavigationPaths,
//   SubseccionSearchResult,
// } from "@/lib/assets/ContenidoHelpers";
import { CommandVoice } from "../../../lib/utils/voice/commands/CommandVoice";
import { Listener } from "../../../lib/utils/voice/Listener";
import { Speaker } from "../../../lib/utils/voice/Speaker";

// import { C_M_Modulo_2 } from "./CommandMenus";
// import { getCurrentToRead } from "@/lib/assets/Contenido";
// import { generateSearchResultsSpeech } from "@/lib/helpers/functions/generateSearchResultsSpeech";
// import { CommandMenu } from "../../../lib/utils/voice/commands/CommandMenu";
// import { numberToText } from "@/lib/helpers/functions/numberToText";

const speaker = Speaker.getInstance();

//Comandos para otras paginas

export const C_V_Contacto = new CommandVoice(["contacto"], () => {
  return new Promise((resolve) => {
    speaker.start("Redirigiendo al Módulo 1.", () => resolve(null));
    window.location.href = "/modulos/1";
  });
});

export const C_V_Home = new CommandVoice(["inicio"], () => {
  return new Promise((resolve) => {
    speaker.start("Redirigiendo a la pagina de inicio.", () => resolve(null));
    window.location.href = "/";
  });
});

//Comandos Modulo 1

export const C_V_Modulo_1 = new CommandVoice(
  ["módulo1", "modulo1", "módulo 1", "modulo 1", "módulo uno"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo al Módulo 1.", () => resolve(null));
      window.location.href = "/modulos/1";
    });
  }
);

export const C_VModulo_1_Seccion_1 = new CommandVoice(
  ["calidad software conceptos modelos criterios", "sección 1", "sección uno"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Calidad Software: Conceptos, Modelos y Criterios.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/1/calidad-software-conceptos-modelos-criterios";
    });
  }
);

export const C_VModulo_1_Seccion_2 = new CommandVoice(
  ["herramientas calidad software", "sección 2", "sección dos"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo a Herramientas de Calidad de Software.", () =>
        resolve(null)
      );
      window.location.href = "/modulos/1/herramientas-calidad-software";
    });
  }
);

export const C_VModulo_1_Seccion_3 = new CommandVoice(
  ["normas y estándares de calidad software", "sección 3", "sección tres"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Normas y Estándares de Calidad de Software.",
        () => resolve(null)
      );
      window.location.href = "/modulos/1/normas-estandares-calidad-software";
    });
  }
);

export const C_VModulo_1_Seccion_4 = new CommandVoice(
  [
    "origen y evolución de la ingeniería de software",
    "sección 4",
    "sección cuatro",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Origen y Evolución de la Ingeniería de Software.",
        () => resolve(null)
      );
      window.location.href = "/modulos/1/origen-evolucion-ingenieria-software";
    });
  }
);

//Comandos Modulo 2

// export const C_V_Modulo_2 = new CommandVoice(
//   ["módulo2", "modulo2", "módulo 2", "modulo 2", "módulo dos"],
//   () => {
//     return new Promise((resolve) => {
//       speaker.start("Redirigiendo al Módulo 2.", () => {
//         resolve(null);

//         C_M_Modulo_2.start();
//       });
//       window.location.href = "/modulos/2";
//     });
//   }
// );

export const C_V_Modulo_2_Seccion_1 = new CommandVoice(
  ["conceptos fundamentales vyv", "sección 1", "sección uno"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Conceptos Fundamentales de Verificación y Validación.",
        () => resolve(null)
      );
      window.location.href = "/modulos/2/conceptos-fundamentales-vyv";
    });
  }
);

export const C_V_Modulo_2_Seccion_2 = new CommandVoice(
  [
    "verificación de la documentación de requerimientos",
    "sección 2",
    "sección dos",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Verificación de la Documentación de Requerimientos.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/2/verificacion-documentacion-requerimientos";
    });
  }
);

export const C_V_Modulo_2_Seccion_3 = new CommandVoice(
  [
    "validación de la documentación de requerimientos",
    "sección 3",
    "sección tres",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Validación de la Documentación de Requerimientos.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/2/validacion-documentacion-requerimientos";
    });
  }
);

export const C_V_Modulo_2_Seccion_4 = new CommandVoice(
  [
    "revisión formal del documento de requerimientos",
    "sección 4",
    "sección cuatro",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Revisión Formal del Documento de Requerimientos.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/2/revision-formal-documento-requerimientos";
    });
  }
);

export const C_V_Modulo_2_Seccion_5 = new CommandVoice(
  [
    "herramientas vyv para análisis de requerimientos",
    "sección 5",
    "sección cinco",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Herramientas VyV para Análisis de Requerimientos.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/2/herramientas-vyv-analisis-requerimientos";
    });
  }
);

//Comandos Modulo 3

export const C_V_Modulo_3 = new CommandVoice(
  ["módulo3", "modulo3", "módulo 3", "modulo 3", "módulo tres"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo al Módulo 3.", () => resolve(null));
      window.location.href = "/modulos/3";
    });
  }
);

export const C_V_Modulo_3_Seccion_1 = new CommandVoice(
  ["conceptos fundamentales del diseño", "sección 1", "sección uno"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Conceptos Fundamentales del Diseño de Sistema.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/3/conceptos-fundamentales-diseno-sistema";
    });
  }
);

export const C_V_Modulo_3_Seccion_2 = new CommandVoice(
  ["verificación de documentación", "sección 2", "sección dos"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Verificación de la Documentación de Diseño.",
        () => resolve(null)
      );
      window.location.href = "/modulos/3/verificacion-documentacion-diseno";
    });
  }
);

export const C_V_Modulo_3_Seccion_3 = new CommandVoice(
  ["validación de documentación", "sección 3", "sección tres"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Validación de la Documentación de Diseño.",
        () => resolve(null)
      );
      window.location.href = "/modulos/3/validacion-documentacion-diseno";
    });
  }
);

export const C_V_Modulo_3_Seccion_4 = new CommandVoice(
  ["revisión formal del diseño", "sección 4", "sección cuatro"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Revisión Formal del Diseño del Sistema.",
        () => resolve(null)
      );
      window.location.href = "/modulos/3/revision-formal-diseno-sistema";
    });
  }
);

export const C_V_Modulo_3_Seccion_5 = new CommandVoice(
  [
    "herramientas de V y V",
    "herramientas de verificación y validación",
    "sección 5",
    "sección cinco",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Herramientas para la Verificación y Validación del Diseño.",
        () => resolve(null)
      );
      window.location.href = "/modulos/3/herramientas-vyv-diseno-sistema";
    });
  }
);
//Comandos Modulo 4

export const C_V_Modulo_4 = new CommandVoice(
  ["módulo4", "modulo4", "módulo 4", "modulo 4", "módulo cuatro"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo al Módulo 4.", () => resolve(null));
      window.location.href = "/modulos/4";
    });
  }
);

export const C_V_Modulo_4_Seccion_1 = new CommandVoice(
  [
    "definición y características de factores críticos",
    "sección 1",
    "sección uno",
  ],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Definición y Características de los Factores Críticos de Éxito.",
        () => resolve(null)
      );
      window.location.href =
        "/modulos/4/definicion-caracteristicas-factores-criticos";
    });
  }
);

export const C_V_Modulo_4_Seccion_2 = new CommandVoice(
  ["factores técnicos críticos", "sección 2", "sección dos"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Factores Técnicos Críticos para el Desarrollo del Software.",
        () => resolve(null)
      );
      window.location.href = "/modulos/4/factores-tecnicos-criticos";
    });
  }
);

export const C_V_Modulo_4_Seccion_3 = new CommandVoice(
  ["factores humanos", "sección 3", "sección tres"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Factores Humanos en el Desarrollo de Software.",
        () => resolve(null)
      );
      window.location.href = "/modulos/4/factores-humanos";
    });
  }
);

export const C_V_Modulo_4_Seccion_4 = new CommandVoice(
  ["factores organizacionales", "sección 4", "sección cuatro"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo a Factores Organizacionales Críticos.", () =>
        resolve(null)
      );
      window.location.href = "/modulos/4/factores-organizacionales";
    });
  }
);

export const C_V_Modulo_4_Seccion_5 = new CommandVoice(
  ["metodologías y procesos", "sección 5", "sección cinco"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Metodologías y Procesos como Factores de Éxito.",
        () => resolve(null)
      );
      window.location.href = "/modulos/4/metodologias-procesos";
    });
  }
);

export const C_V_Modulo_4_Seccion_6 = new CommandVoice(
  ["factores externos", "sección 6", "sección seis"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo a Factores Externos.", () => resolve(null));
      window.location.href = "/modulos/4/factores-externos";
    });
  }
);

export const C_V_Modulo_4_Seccion_7 = new CommandVoice(
  ["ejemplos de factores críticos", "sección 7", "sección siete"],
  () => {
    return new Promise((resolve) => {
      speaker.start(
        "Redirigiendo a Ejemplos de Factores Críticos de Éxito en Proyectos Reales.",
        () => resolve(null)
      );
      window.location.href = "/modulos/4/ejemplos-factores-criticos";
    });
  }
);

//Comandos Especiales

// Función para crear comandos de voz para cada resultado
// function createResultCommands(
//   searchResults: SubseccionSearchResult[]
// ): CommandVoice[] {
//   return searchResults.map((result, index) => {
//     const num = index + 1;
//     return new CommandVoice(
//       [
//         `resultado ${num}`,
//         `resultado${num}`,
//         `resultado ${numberToText(num)}`,
//         `resultado${numberToText(num)}`,
//         `resultado, ${num}`,
//         `resultado, ${numberToText(num)}`,
//         // Variantes adicionales para posibles transcripciones de Edge
//         `resultado ${num}.`,
//         `resultado, ${num}.`,
//         `resultado ${numberToText(num)}.`,
//         `resultado, ${numberToText(num)}.`,
//       ],
//       () => {
//         return new Promise((resolve) => {
//           speaker.start(`Redirigiendo a ${result.title}`, () => {
//             // CommandVoice.iterateNext = false;
//             window.location.href = result.path;
//             resolve(null);
//           });
//         });
//       }
//     );
//   });
// }

// export const C_V_Buscar = new CommandVoice(["buscar"], () => {
//   return new Promise((resolve) => {
//     speaker.start("Por favor, di el término que deseas buscar.", () => {
//       const listener = Listener.getInstance();

//       listener.start((transcript) => {
//         const searchInput = document.getElementById(
//           "buscador-global"
//         ) as HTMLInputElement;

//         if (searchInput) {
//           searchInput.value = transcript;

//           const searchForm = document.getElementById(
//             "formulario-busqueda"
//           ) as HTMLFormElement;

//           if (searchForm) {
//             searchForm.addEventListener("submit", (event) => {
//               event.preventDefault();

//               const searcherResults = buscarSubseccionesPorTitulo(transcript);

//               CommandVoice.callback1?.(searcherResults);

//               const resultsToRead =
//                 generateSearchResultsSpeech(searcherResults);
//               speaker.start("Buscando...", () => {
//                 // Crear comandos para cada resultado
//                 const resultCommands = createResultCommands(searcherResults);

//                 //Comandos Adicionales

//                 // Comando para repetir resultados
//                 const repeatResultsCommand = new CommandVoice(
//                   ["repetir resultados", "repetir", "repite los resultados"],
//                   () => {
//                     return new Promise((resolve2) => {
//                       const resultsToRead =
//                         generateSearchResultsSpeech(searcherResults);
//                       speaker.start(resultsToRead, () => resolve2(null));
//                     });
//                   }
//                 );

//                 // Comando para nueva búsqueda
//                 const newSearchCommand = new CommandVoice(
//                   ["nueva búsqueda", "buscar otra vez", "buscar de nuevo"],
//                   () => {
//                     return new Promise(() => {
//                       // CommandVoice.iterateNext = true;
//                       resolve(true);
//                     });
//                   }
//                 );

//                 // Combinar todos los comandos
//                 const allCommands = [
//                   ...resultCommands,
//                   repeatResultsCommand,
//                   newSearchCommand,
//                 ];

//                 // Crear y iniciar el menú de comandos
//                 const commandMenu = new CommandMenu(resultsToRead, allCommands);

//                 commandMenu.start();
//               });
//               // resolve(null);
//             });

//             searchForm.dispatchEvent(new Event("submit"));
//           }
//         }

//         // resolve(null);
//       });
//     });
//   });
// });

// export const C_V_Leer = new CommandVoice(["leer"], () => {
//   return new Promise((resolve) => {
//     if (window) {
//       const urlObject = new URL(window.location.href);
//       const contentToRead = getCurrentToRead(urlObject.pathname);
//       if (contentToRead)
//         speaker.start("Leendo...", () => {
//           speaker.start(contentToRead);
//         });
//     }

//     resolve(null);
//   });
// });

// export const C_V_Siguiente = new CommandVoice(["siguiente"], () => {
//   return new Promise((resolve) => {
//     const currentPath = CommandVoice.getCurrentPath?.();

//     if (currentPath) {
//       const nextSubsection = getNavigationPaths(currentPath, "next");

//       if (nextSubsection.path) {
//         speaker.start(
//           `Redirigiendo a ${nextSubsection.title} ubicado en ${nextSubsection.breadcrumbText}`,
//           () => {
//             window.location.href = nextSubsection.path!;
//             resolve(null);
//           }
//         );
//       } else {
//         speaker.start(
//           `No hay una subsección siguiente en este modulo ${nextSubsection.moduleNumber}`,
//           () => resolve(null)
//         );
//       }
//     }

//     resolve(null);
//   });
// });

// export const C_V_Anterior = new CommandVoice(["anterior"], () => {
//   return new Promise((resolve) => {
//     const currentPath = CommandVoice.getCurrentPath?.();

//     if (currentPath) {
//       const prevSubsection = getNavigationPaths(currentPath, "prev");

//       if (prevSubsection.path) {
//         speaker.start(
//           `Redirigiendo a ${prevSubsection.title} ubicado en ${prevSubsection.breadcrumbText}`,
//           () => {
//             window.location.href = prevSubsection.path!;
//             resolve(null);
//           }
//         );
//       } else {
//         speaker.start(
//           `No hay una subsección anterior en este modulo ${prevSubsection.moduleNumber}`,
//           () => resolve(null)
//         );
//       }
//     }

//     resolve(null);
//   });
// });

export const C_V_Validador_Requerimientos = new CommandVoice(
  ["validador"],
  () => {
    return new Promise((resolve) => {
      speaker.start("Redirigiendo al validador de requerimientos", () =>
        resolve(null)
      );
      window.location.href = "/herramientas/validador-requerimientos";
    });
  }
);

export const C_V_Usar_Validador = new CommandVoice(["usar validador"], () => {
  return new Promise((resolve) => {
    speaker.start(
      "¿Tu requerimiento es funcional?, Si es así, dí si, de lo contrario di no para indicar que se trata de un requerimiento no funcional",
      () => {
        const listener = Listener.getInstance();

        listener.start((transcript) => {
          const radioButton = document.querySelector<HTMLInputElement>(
            `input[name="type"][value="${
              transcript === "si" || transcript === "sí"
                ? "Funcional"
                : "No Funcional"
            }"]`
          );
          if (radioButton) {
            radioButton.checked = true;
            resolve(null);
          }
        });
      }
    );
  });
});

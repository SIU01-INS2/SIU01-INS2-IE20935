export class IndexedDBConnection {
  private static instance: IndexedDBConnection;
  private db: IDBDatabase | null = null;
  private dbName: string = "AsistenciaSystem";
  // Usamos la variable de entorno para la versión
  private dbVersionString: string =
    process.env.NEXT_PUBLIC_CLN01_VERSION || "1.0.0";
  private version: number;
  private isInitializing: boolean = false;
  private initPromise: Promise<IDBDatabase> | null = null;

  // Definición de las colecciones y sus configuraciones
  private stores = {
    user_data: {
      keyPath: null,
      autoIncrement: false,
      indexes: [],
    },
    datos_asistencia_hoy: {
      keyPath: null,
      autoIncrement: false,
      indexes: [],
    },
    estudiantes: {
      keyPath: "DNI_Estudiante",
      autoIncrement: false,
      indexes: [
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
        { name: "por_aula", keyPath: "Id_Aula", options: { unique: false } },
        { name: "por_estado", keyPath: "Estado", options: { unique: false } },
      ],
    },
    responsables: {
      keyPath: "DNI_Responsable",
      autoIncrement: false,
      indexes: [
        {
          name: "por_nombre_usuario",
          keyPath: "Nombre_Usuario",
          options: { unique: true },
        },
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
      ],
    },
    relaciones_e_r: {
      keyPath: "Id_Relacion",
      autoIncrement: true,
      indexes: [
        {
          name: "por_responsable",
          keyPath: "DNI_Responsable",
          options: { unique: false },
        },
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_tipo", keyPath: "Tipo", options: { unique: false } },
      ],
    },
    profesores_primaria: {
      keyPath: "DNI_Profesor_Primaria",
      autoIncrement: false,
      indexes: [
        {
          name: "por_nombre_usuario",
          keyPath: "Nombre_Usuario",
          options: { unique: true },
        },
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
        { name: "por_estado", keyPath: "Estado", options: { unique: false } },
      ],
    },
    profesores_secundaria: {
      keyPath: "DNI_Profesor_Secundaria",
      autoIncrement: false,
      indexes: [
        {
          name: "por_nombre_usuario",
          keyPath: "Nombre_Usuario",
          options: { unique: true },
        },
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
        { name: "por_estado", keyPath: "Estado", options: { unique: false } },
      ],
    },
    aulas: {
      keyPath: "Id_Aula",
      autoIncrement: true,
      indexes: [
        { name: "por_nivel", keyPath: "Nivel", options: { unique: false } },
        { name: "por_grado", keyPath: "Grado", options: { unique: false } },
        { name: "por_seccion", keyPath: "Seccion", options: { unique: false } },
        {
          name: "por_nivel_grado_seccion",
          keyPath: ["Nivel", "Grado", "Seccion"],
          options: { unique: true },
        },
        {
          name: "por_profesor_primaria",
          keyPath: "DNI_Profesor_Primaria",
          options: { unique: false },
        },
        {
          name: "por_profesor_secundaria",
          keyPath: "DNI_Profesor_Secundaria",
          options: { unique: false },
        },
      ],
    },
    cursos_horario: {
      keyPath: "Id_Curso_Horario",
      autoIncrement: true,
      indexes: [
        { name: "por_dia", keyPath: "Dia_Semana", options: { unique: false } },
        {
          name: "por_profesor",
          keyPath: "DNI_Profesor_Secundaria",
          options: { unique: false },
        },
        {
          name: "por_aula",
          keyPath: "Id_Aula_Secundaria",
          options: { unique: false },
        },
      ],
    },
    asistencias_e_p_1: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_p_2: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_p_3: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_p_4: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_p_5: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_p_6: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_s_1: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_s_2: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_s_3: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_s_4: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    asistencias_e_s_5: {
      keyPath: "Id_Asistencia_Escolar_Mensual",
      autoIncrement: true,
      indexes: [
        {
          name: "por_estudiante",
          keyPath: "DNI_Estudiante",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_estudiante_mes",
          keyPath: ["DNI_Estudiante", "Mes"],
          options: { unique: true },
        },
      ],
    },
    auxiliares: {
      keyPath: "DNI_Auxiliar",
      autoIncrement: false,
      indexes: [
        {
          name: "por_nombre_usuario",
          keyPath: "Nombre_Usuario",
          options: { unique: true },
        },
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
        { name: "por_estado", keyPath: "Estado", options: { unique: false } },
      ],
    },
    control_entrada_auxiliar: {
      keyPath: "Id_C_E_M_P_Auxiliar",
      autoIncrement: true,
      indexes: [
        {
          name: "por_auxiliar",
          keyPath: "DNI_Auxiliar",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_auxiliar_mes",
          keyPath: ["DNI_Auxiliar", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_salida_auxiliar: {
      keyPath: "Id_C_E_M_P_Auxiliar",
      autoIncrement: true,
      indexes: [
        {
          name: "por_auxiliar",
          keyPath: "DNI_Auxiliar",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_auxiliar_mes",
          keyPath: ["DNI_Auxiliar", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_entrada_profesores_primaria: {
      keyPath: "Id_C_E_M_P_Profesores_Primaria",
      autoIncrement: true,
      indexes: [
        {
          name: "por_profesor",
          keyPath: "DNI_Profesor_Primaria",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_profesor_mes",
          keyPath: ["DNI_Profesor_Primaria", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_salida_profesores_primaria: {
      keyPath: "Id_C_E_M_P_Profesores_Primaria",
      autoIncrement: true,
      indexes: [
        {
          name: "por_profesor",
          keyPath: "DNI_Profesor_Primaria",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_profesor_mes",
          keyPath: ["DNI_Profesor_Primaria", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_entrada_profesores_secundaria: {
      keyPath: "Id_C_E_M_P_Profesores_Secundaria",
      autoIncrement: true,
      indexes: [
        {
          name: "por_profesor",
          keyPath: "DNI_Profesor_Secundaria",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_profesor_mes",
          keyPath: ["DNI_Profesor_Secundaria", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_salida_profesores_secundaria: {
      keyPath: "Id_C_E_M_P_Profesores_Secundaria",
      autoIncrement: true,
      indexes: [
        {
          name: "por_profesor",
          keyPath: "DNI_Profesor_Secundaria",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_profesor_mes",
          keyPath: ["DNI_Profesor_Secundaria", "Mes"],
          options: { unique: true },
        },
      ],
    },
    personal_administrativo: {
      keyPath: "DNI_Personal_Administrativo",
      autoIncrement: false,
      indexes: [
        {
          name: "por_nombre_usuario",
          keyPath: "Nombre_Usuario",
          options: { unique: true },
        },
        { name: "por_nombres", keyPath: "Nombres", options: { unique: false } },
        {
          name: "por_apellidos",
          keyPath: "Apellidos",
          options: { unique: false },
        },
        { name: "por_estado", keyPath: "Estado", options: { unique: false } },
        { name: "por_cargo", keyPath: "Cargo", options: { unique: false } },
      ],
    },
    control_entrada_personal_administrativo: {
      keyPath: "Id_C_E_M_P_Administrativo",
      autoIncrement: true,
      indexes: [
        {
          name: "por_administrativo",
          keyPath: "DNI_Personal_Administrativo",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_administrativo_mes",
          keyPath: ["DNI_Personal_Administrativo", "Mes"],
          options: { unique: true },
        },
      ],
    },
    control_salida_personal_administrativo: {
      keyPath: "Id_C_E_M_P_Administrativo",
      autoIncrement: true,
      indexes: [
        {
          name: "por_administrativo",
          keyPath: "DNI_Personal_Administrativo",
          options: { unique: false },
        },
        { name: "por_mes", keyPath: "Mes", options: { unique: false } },
        {
          name: "por_administrativo_mes",
          keyPath: ["DNI_Personal_Administrativo", "Mes"],
          options: { unique: true },
        },
      ],
    },
    bloqueo_roles: {
      keyPath: "Id_Bloqueo_Rol",
      autoIncrement: true,
      indexes: [{ name: "por_rol", keyPath: "Rol", options: { unique: true } }],
    },
    ajustes_generales_sistema: {
      keyPath: "Id_Constante",
      autoIncrement: true,
      indexes: [
        { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
      ],
    },
    horarios_asistencia: {
      keyPath: "Id_Horario",
      autoIncrement: true,
      indexes: [
        { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
      ],
    },
    eventos: {
      keyPath: "Id_Evento",
      autoIncrement: true,
      indexes: [
        {
          name: "por_fecha_inicio",
          keyPath: "Fecha_Inicio",
          options: { unique: false },
        },
        {
          name: "por_fecha_conclusion",
          keyPath: "Fecha_Conclusion",
          options: { unique: false },
        },
      ],
    },
    registro_fallos_sistema: {
      keyPath: "Id_Registro_Fallo_Sistema",
      autoIncrement: true,
      indexes: [
        { name: "por_fecha", keyPath: "Fecha", options: { unique: false } },
        {
          name: "por_componente",
          keyPath: "Componente",
          options: { unique: false },
        },
      ],
    },
    comunicados: {
      keyPath: "Id_Comunicado",
      autoIncrement: true,
      indexes: [
        {
          name: "por_fecha_inicio",
          keyPath: "Fecha_Inicio",
          options: { unique: false },
        },
        {
          name: "por_fecha_conclusion",
          keyPath: "Fecha_Conclusion",
          options: { unique: false },
        },
      ],
    },
    offline_requests: {
      keyPath: "id",
      autoIncrement: true,
      indexes: [
        {
          name: "por_created_at",
          keyPath: "created_at",
          options: { unique: false },
        },
        {
          name: "por_attempts",
          keyPath: "attempts",
          options: { unique: false },
        },
      ],
    },
    system_meta: {
      keyPath: "key",
      autoIncrement: false,
      indexes: [],
    },
    ultima_modificacion_tablas: {
      keyPath: "Nombre_Tabla",
      autoIncrement: false,
      indexes: [
        {
          name: "por_operacion",
          keyPath: "Operacion",
          options: { unique: false },
        },
        {
          name: "por_fecha",
          keyPath: "Fecha_Modificacion",
          options: { unique: false },
        },
        {
          name: "por_usuario",
          keyPath: "Usuario_Modificacion",
          options: { unique: false },
        },
      ],
    },
    fechas_importantes: {
      keyPath: "Id_Fecha_Importante",
      autoIncrement: true,
      indexes: [
        { name: "por_nombre", keyPath: "Nombre", options: { unique: true } },
        { name: "por_valor", keyPath: "Valor", options: { unique: false } },
        {
          name: "por_ultima_modificacion",
          keyPath: "Ultima_Modificacion",
          options: { unique: false },
        },
      ],
    },
    ultima_actualizacion_tablas_locales: {
      keyPath: "Nombre_Tabla",
      autoIncrement: false,
      indexes: [
        {
          name: "por_operacion",
          keyPath: "Operacion",
          options: { unique: false },
        },
        {
          name: "por_fecha",
          keyPath: "Fecha_Actualizacion",
          options: { unique: false },
        },
      ],
    },
  };

  private constructor() {
    // Constructor privado para patrón Singleton
    this.version = this.getVersionNumber(this.dbVersionString);
  }

  /**
   * Obtiene la instancia única de conexión a IndexedDB
   */
  public static getInstance(): IndexedDBConnection {
    if (!IndexedDBConnection.instance) {
      IndexedDBConnection.instance = new IndexedDBConnection();
    }
    return IndexedDBConnection.instance;
  }

  /**
   * Inicializa la conexión a la base de datos
   */
  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = new Promise((resolve, reject) => {
      // Al abrir con una versión superior, IndexedDB automáticamente
      // dispara onupgradeneeded y gestiona la migración
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        console.log(`Actualizando base de datos a versión ${this.version}`);
        const db = (event.target as IDBOpenDBRequest).result;

        // Si hay stores existentes que ya no necesitamos, los eliminamos
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          const storeName = db.objectStoreNames[i];
          if (!Object.keys(this.stores).includes(storeName)) {
            db.deleteObjectStore(storeName);
          }
        }

        this.configureDatabase(db);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitializing = false;
        console.log(
          `Base de datos inicializada correctamente con versión ${this.version}`
        );
        resolve(this.db);
      };

      request.onerror = (event) => {
        this.isInitializing = false;
        this.initPromise = null;
        reject(
          `Error al abrir IndexedDB: ${
            (event.target as IDBOpenDBRequest).error
          }`
        );
      };
    });

    return this.initPromise;
  }

  /**
   * Configura la estructura de la base de datos
   */
  private configureDatabase(db: IDBDatabase): void {
    // Crear los object stores y sus índices
    for (const [storeName, config] of Object.entries(this.stores)) {
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, {
          keyPath: config.keyPath,
          autoIncrement: config.autoIncrement,
        });

        // Crear los índices
        for (const index of config.indexes) {
          store.createIndex(index.name, index.keyPath, index.options);
        }
      }
    }
  }

  /**
   * Convierte la versión semántica a un número entero para IndexedDB
   */
  private getVersionNumber(versionString: string): number {
    // Eliminar cualquier sufijo (como -alpha, -beta, etc.)
    const cleanVersion = versionString.split("-")[0];

    // Dividir por puntos y convertir a un número entero
    // Por ejemplo: "1.2.3" -> 1 * 10000 + 2 * 100 + 3 = 10203
    const parts = cleanVersion.split(".");
    let versionNumber = 1; // Valor por defecto

    if (parts.length >= 3) {
      versionNumber =
        parseInt(parts[0]) * 10000 +
        parseInt(parts[1]) * 100 +
        parseInt(parts[2]);
    }

    return versionNumber;
  }

  /**
   * Obtiene la conexión a la base de datos
   */
  public async getConnection(): Promise<IDBDatabase> {
    if (!this.db) {
      return this.init();
    }
    return this.db;
  }

  /**
   * Cierra la conexión a la base de datos
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  /**
   * Obtiene una transacción para un almacén específico
   */
  public async getTransaction(
    storeName: string,
    mode: IDBTransactionMode = "readonly"
  ): Promise<IDBTransaction> {
    const db = await this.getConnection();
    return db.transaction(storeName, mode);
  }

  /**
   * Obtiene un object store para realizar operaciones
   */
  public async getStore(
    storeName: string,
    mode: IDBTransactionMode = "readonly"
  ): Promise<IDBObjectStore> {
    const transaction = await this.getTransaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  /**
   * Ejecuta una operación en la base de datos
   */
  public async executeOperation<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    const store = await this.getStore(storeName, mode);

    return new Promise<T>((resolve, reject) => {
      const request = operation(store);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(`Error en operación: ${(event.target as IDBRequest).error}`);
      };
    });
  }
}

// Exportar la instancia única
export default IndexedDBConnection.getInstance();

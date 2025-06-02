import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { CLN01_Stores } from "./CLN01_Stores";
import { SIASIS_CLN01_VERSION } from "@/constants/SIASIS_CLN01_VERSION";

export class IndexedDBConnection {
  private static instance: IndexedDBConnection;
  private db: IDBDatabase | null = null;

  // Propiedad estática que se inicializa de forma inteligente
  private static _rol: RolesSistema | null = null;

  // Usamos la variable de entorno para la versión
  private dbVersionString: string = SIASIS_CLN01_VERSION;
  private version: number;
  private isInitializing: boolean = false;
  private initPromise: Promise<IDBDatabase> | null = null;

  private constructor() {
    // Constructor privado para patrón Singleton
    this.version = this.getVersionNumber(this.dbVersionString);
  }

  /**
   * Getter para el rol que se auto-inicializa desde localStorage si es necesario
   */
  public static get rol(): RolesSistema {
    // Si no está seteado, intentar cargar desde localStorage
    if (!IndexedDBConnection._rol) {
      IndexedDBConnection._rol = IndexedDBConnection.loadRolFromStorage();
    }
    return IndexedDBConnection._rol;
  }

  /**
   * Setter para el rol que también lo guarda en localStorage
   */
  public static set rol(newRol: RolesSistema) {
    IndexedDBConnection._rol = newRol;
    // Guardar en localStorage si estamos en el cliente
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("rol", newRol);
    }
  }

  /**
   * Carga el rol desde localStorage de forma segura
   */
  private static loadRolFromStorage(): RolesSistema {
    // Verificar si estamos en el cliente
    if (typeof window !== "undefined" && window.localStorage) {
      const storedRole = localStorage.getItem("rol") as RolesSistema;
      if (storedRole && Object.values(RolesSistema).includes(storedRole)) {
        return storedRole;
      }
    }
    // Valor por defecto si no hay nada en localStorage o no es válido
    return RolesSistema.Directivo;
  }

  /**
   * Obtiene el nombre de la base de datos basado en el rol actual
   */
  private get dbName(): string {
    return `SIASIS-CLN01-${IndexedDBConnection.rol}`;
  }

  /**
   * Fuerza la recarga del rol desde localStorage
   * Útil cuando sabes que el rol cambió externamente
   */
  public static reloadRolFromStorage(): void {
    IndexedDBConnection._rol = IndexedDBConnection.loadRolFromStorage();
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
   * Cambia el rol y reinicializa la conexión a la BD correspondiente
   */
  public async changeRole(newRole: RolesSistema): Promise<void> {
    const currentRole = IndexedDBConnection.rol;

    // Si es el mismo rol, no hacer nada
    if (currentRole === newRole) return;

    // Cerrar la conexión actual
    this.close();

    // Cambiar el rol (esto automáticamente actualiza localStorage)
    IndexedDBConnection.rol = newRole;

    // Reinicializar con la nueva base de datos
    await this.init();
  }

  /**
   * Inicializa la conexión a la base de datos
   */
  public async init(): Promise<IDBDatabase> {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined") {
      throw new Error("IndexedDB solo está disponible en el navegador");
    }

    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = new Promise((resolve, reject) => {
      // Al abrir con una versión superior, IndexedDB automáticamente
      // dispara onupgradeneeded y gestiona la migración
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        console.log(
          `Actualizando base de datos a versión ${this.version} para rol ${IndexedDBConnection.rol}`
        );
        const db = (event.target as IDBOpenDBRequest).result;

        // Si hay stores existentes que ya no necesitamos, los eliminamos
        for (let i = 0; i < db.objectStoreNames.length; i++) {
          const storeName = db.objectStoreNames[i];
          if (!Object.keys(CLN01_Stores).includes(storeName)) {
            db.deleteObjectStore(storeName);
          }
        }

        this.configureDatabase(db);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitializing = false;
        console.log(
          `Base de datos inicializada correctamente con versión ${this.version} para rol ${IndexedDBConnection.rol}`
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
    for (const [storeName, config] of Object.entries(CLN01_Stores)) {
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

  /**
   * Obtiene información del estado actual
   */
  public getStatus() {
    return {
      currentRole: IndexedDBConnection.rol,
      dbName: this.dbName,
      isConnected: !!this.db,
      isInitializing: this.isInitializing,
    };
  }
}

// Exportar la instancia única
export default IndexedDBConnection.getInstance();

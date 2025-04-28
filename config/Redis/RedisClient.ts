/* eslint-disable @typescript-eslint/no-explicit-any */
import { TipoAsistencia } from "@/interfaces/shared/AsistenciaRequests";
import { Redis } from "@upstash/redis";


// Estructura para almacenar las instancias de Redis
type RedisInstances = {
  [key in TipoAsistencia]: Redis[];
};

// Inicialización de las instancias de Redis
const redisInstances: RedisInstances = {
  [TipoAsistencia.ParaPersonal]: [
    new Redis({
      url: process.env.RDP05_INS1_REDIS_BD_BASE_URL_API!,
      token: process.env.RDP05_INS1_REDIS_BD_TOKEN_FOR_API!,
    }),
    // Aquí puedes agregar más instancias para este tipo en el futuro
  ],
  [TipoAsistencia.ParaEstudiantesSecundaria]: [
    new Redis({
      url: process.env.RDP05_INS2_REDIS_BD_BASE_URL_API!,
      token: process.env.RDP05_INS2_REDIS_BD_TOKEN_FOR_API!,
    }),
    // Aquí puedes agregar más instancias para este tipo en el futuro
  ],
  [TipoAsistencia.ParaEstudiantesPrimaria]: [
    new Redis({
      url: process.env.RDP05_INS3_REDIS_BD_BASE_URL_API!,
      token: process.env.RDP05_INS3_REDIS_BD_TOKEN_FOR_API!,
    }),
    // Aquí puedes agregar más instancias para este tipo en el futuro
  ],
};

// Función para obtener una instancia aleatoria de Redis
export const getRandomRedisClient = (tipoAsistencia?: TipoAsistencia): Redis => {
  if (tipoAsistencia !== undefined) {
    const instances = redisInstances[tipoAsistencia];
    if (!instances || instances.length === 0) {
      throw new Error(`No hay instancias disponibles para el tipo de asistencia: ${tipoAsistencia}`);
    }
    
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  } else {
    // Si no se especifica tipo, elegimos aleatoriamente entre todas las instancias
    const allInstances = Object.values(redisInstances).flat();
    if (allInstances.length === 0) {
      throw new Error("No hay instancias de Redis disponibles");
    }
    
    const randomIndex = Math.floor(Math.random() * allInstances.length);
    return allInstances[randomIndex];
  }
};

// Función para establecer un valor en todas las instancias de Redis de un tipo específico
export const setInAllInstancesByType = async (
  tipoAsistencia: TipoAsistencia, 
  key: string, 
  value: any, 
  expireIn?: number
): Promise<void> => {
  const instances = redisInstances[tipoAsistencia];
  
  const setPromises = instances.map(async (redis) => {
    if (expireIn !== undefined) {
      await redis.set(key, value, { ex: expireIn });
    } else {
      await redis.set(key, value);
    }
  });
  
  await Promise.all(setPromises);
};

// Función para establecer un valor en todas las instancias de Redis sin importar el tipo
export const setInAllInstances = async (
  key: string, 
  value: any, 
  expireIn?: number
): Promise<void> => {
  const allPromises: Promise<any>[] = [];
  
  Object.values(redisInstances).forEach(instances => {
    instances.forEach(async (redis) => {
      if (expireIn !== undefined) {
        allPromises.push(redis.set(key, value, { ex: expireIn }));
      } else {
        allPromises.push(redis.set(key, value));
      }
    });
  });
  
  await Promise.all(allPromises);
};

// Función compatible con tu versión anterior, pero mejorada para usar el sistema de instancias múltiples
export const redisClient = (tipoAsistencia?: TipoAsistencia) => {
  // Devolvemos un objeto con métodos que manejan las operaciones en múltiples instancias
  return {
    get: async (key: string) => {
      // Siempre obtenemos de una instancia aleatoria (del tipo especificado o de cualquiera)
      const redis = getRandomRedisClient(tipoAsistencia);
      return await redis.get(key);
    },
    
    set: async (key: string, value: any, expireIn?: number) => {
      try {
        if (tipoAsistencia !== undefined) {
          await setInAllInstancesByType(tipoAsistencia, key, value, expireIn);
        } else {
          await setInAllInstances(key, value, expireIn);
        }
        return "OK"; // Devuelve "OK" para mantener compatibilidad
      } catch (error) {
        console.error("Error en operación SET:", error);
        throw error;
      }
    },
    
    del: async (key: string) => {
      if (tipoAsistencia !== undefined) {
        // Si se especifica un tipo, primero establecemos null (con expiración rápida) en todas las instancias de ese tipo
        await setInAllInstancesByType(tipoAsistencia, key, null, 1);
        // Luego eliminamos de una instancia aleatoria de ese tipo
        const redis = getRandomRedisClient(tipoAsistencia);
        return await redis.del(key);
      } else {
        // Si no se especifica tipo, establecemos null en todas las instancias
        await setInAllInstances(key, null, 1);
        // Luego eliminamos de una instancia aleatoria
        const redis = getRandomRedisClient();
        return await redis.del(key);
      }
    },
    
    // Método keys para buscar claves según un patrón
    keys: async (pattern: string) => {
      // El método keys se ejecuta siempre en una instancia específica
      // No es necesario ejecutarlo en todas las instancias
      if (tipoAsistencia !== undefined) {
        const redis = getRandomRedisClient(tipoAsistencia);
        return await redis.keys(pattern);
      } else {
        // Si no se especifica tipo, buscamos en una instancia aleatoria
        const redis = getRandomRedisClient();
        return await redis.keys(pattern);
      }
    },
    
    // Puedes añadir más métodos según necesites
  };
};
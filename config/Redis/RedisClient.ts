import { Redis } from "@upstash/redis";

// Cliente Redis usando variables de entorno existentes
export const redisClient = new Redis({
  url: process.env.RDP05_REDIS_BD_BASE_URL_API!,
  token: process.env.RDP05_REDIS_BD_TOKEN_FOR_API!,
});

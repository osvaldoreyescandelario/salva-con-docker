// utils/redisUtils.js
// Modifica la inicialización para que no falle si no hay servidor
const Redis = require("ioredis");

// Creamos la instancia con 'lazyConnect' para que no intente conectar al arrancar
const redis = new Redis({
  lazyConnect: true,
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379
});

async function getRedisValue(key) {
  try {
    if (redis.status === "wait") await redis.connect(); // Conecta solo si es necesario
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    return null; // Fallo silencioso: si no hay Redis, tratamos como si no hubiera dato
  }
}

async function setRedisValue(key, value, ttl) {
  try {
    if (redis.status === "wait") await redis.connect();
    await redis.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    // Fallo silencioso
  }
}

module.exports = { getRedisValue, setRedisValue };

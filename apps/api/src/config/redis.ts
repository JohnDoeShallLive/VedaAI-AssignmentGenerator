import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

export const connectionOptions: ConnectionOptions = {
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
};

// Create a general Redis client for caching
export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => {
  console.log('[redis]: Connected successfully to Redis server');
});

redisClient.on('error', (err) => {
  console.error('[redis]: Redis client error:', err);
});

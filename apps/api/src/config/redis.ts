import Redis from 'ioredis';
import { ConnectionOptions } from 'bullmq';

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisUsername = process.env.REDIS_USERNAME;
const redisPassword = process.env.REDIS_PASSWORD;

export const connectionOptions: ConnectionOptions = {
  host: redisHost,
  port: redisPort,
  username: redisUsername,
  password: redisPassword,
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
};

// Create a general Redis client for caching
export const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  username: redisUsername,
  password: redisPassword,
  maxRetriesPerRequest: null,
});

redisClient.on('connect', () => {
  console.log('[redis]: Connected successfully to Redis server');
});

redisClient.on('error', (err) => {
  console.error('[redis]: Redis client error:', err);
});

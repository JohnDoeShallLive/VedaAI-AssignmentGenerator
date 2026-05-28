import mongoose from 'mongoose';
import { redisClient } from '../src/config/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  // Suppress logs during tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Disconnect any lingering connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (redisClient) {
    await redisClient.quit();
  }
  jest.restoreAllMocks();
});

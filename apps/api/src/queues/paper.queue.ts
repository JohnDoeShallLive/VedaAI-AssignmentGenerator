import { Queue } from 'bullmq';
import { connectionOptions } from '../config/redis';

export const QUEUE_NAME = 'generate-paper';

export const paperQueue = new Queue(QUEUE_NAME, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

console.log(`[queue]: BullMQ Queue "${QUEUE_NAME}" initialized`);

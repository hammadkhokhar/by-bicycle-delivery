import { Queue } from 'bullmq';

export const quoteQueue = new Queue('quote-queue');
import IORedis from 'ioredis';

export const createRedisConnection = async (): Promise<IORedis> => {
  const redis = new IORedis({
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
    maxRetriesPerRequest: null,
  });

  try {
    await redis.ping();
    console.log('Redis connection established');
    return redis;
  } catch (error) {
    console.error('Error establishing Redis connection', error);
    throw error;
  }
};

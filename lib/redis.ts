import Redis from 'ioredis';

// Allow global sharing during development to avoid hitting connection limits upon hot reloads
const globalForRedis = global as unknown as {
    redis: Redis | undefined;
};

// In a real environment, you'd use a real redis url like redis://:password@host:port
// We use localhost for prototyping as requested.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = globalForRedis.redis || new Redis(redisUrl, {
    // Optional configuration for resiliency
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

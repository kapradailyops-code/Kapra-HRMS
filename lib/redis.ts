import Redis from 'ioredis';

// Allow global sharing during development to avoid hitting connection limits upon hot reloads
const globalForRedis = global as unknown as {
    redis: Redis | undefined;
};

// Return a lazy Redis client — only connects when REDIS_URL is provided.
// If no Redis URL is set (e.g. during Vercel build), return null gracefully.
function createRedisClient(): Redis | null {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        // No Redis configured — skip silently (caching is optional)
        return null;
    }

    return new Redis(redisUrl, {
        retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false,
    });
}

export const redis: Redis | null =
    globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
    if (redis) globalForRedis.redis = redis;
}

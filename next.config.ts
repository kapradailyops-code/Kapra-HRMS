import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "standalone",
    // Force all routes to be dynamic (server-rendered on demand)
    // This prevents build-time Prisma/DB connection errors on Vercel
    generateEtags: false,
    headers: async () => [],
    experimental: {
        serverActions: {
            allowedOrigins: ['*'],
        },
    },
};

export default nextConfig;

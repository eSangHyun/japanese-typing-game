import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: '/japanese-typing-game',
    assetPrefix: '/japanese-typing-game',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;

import type { NextConfig } from "next";

const isGithubPages = process.env.GH_PAGES === 'true';

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: isGithubPages ? '/japanese-typing-game' : '',
    assetPrefix: isGithubPages ? '/japanese-typing-game' : '',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;

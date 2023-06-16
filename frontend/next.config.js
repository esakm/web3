/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    experimental: {
        appDir: true,
    },
    webpack: (config) => {
        config.externals.push("pino-pretty", "lokijs", "encoding");
        config.resolve.fallback = { fs: false, net: false, tls: false };
        return config;
    },
    reactStrictMode: true,
}

module.exports = nextConfig

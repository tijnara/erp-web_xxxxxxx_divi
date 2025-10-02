/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname, // force Turbopack root to this folder
    },
    // Allow additional origins during development to avoid cross-origin warnings.
    // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
    allowedDevOrigins: ['100.119.3.44', 'local-origin.dev', '*.local-origin.dev'],
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '100.119.3.44',
                port: '8090',
                pathname: '/assets/**',
            },
        ],
    },
};
export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname, // force Turbopack root to this folder
    },
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
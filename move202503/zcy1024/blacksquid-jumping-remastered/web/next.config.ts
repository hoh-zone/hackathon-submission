import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    output: 'export',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'mainnet-aggregator.hoh.zone',
                port: '',
                pathname: '/v1/blobs/*',
                search: '',
            }
        ],
    },
};

export default nextConfig;

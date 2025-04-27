import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'archive.cetus.zone',
                port: '',
                pathname: '/assets/image/sui/sui.png',
                search: '',
            },
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

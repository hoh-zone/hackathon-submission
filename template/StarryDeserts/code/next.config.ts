import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // 打包为静态文件
  images: {
    unoptimized: true, // 禁用图片优化API，解决与静态导出模式的兼容问题
  },
};

export default nextConfig;

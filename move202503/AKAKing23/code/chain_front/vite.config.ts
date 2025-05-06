import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// import vitePluginsAutoI18n, { BaiduTranslator } from "vite-auto-i18n-plugin";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// const i18nPlugin = vitePluginsAutoI18n({
//   globalPath: "./lang", // 存放翻译文件的目录
//   namespace: "lang", // 命名空间
//   distPath: "./dist/assets",
//   distKey: "index",
//   targetLangList: ["en", "ko", "ja"], // 目标语言列表，英文，韩文，日文
//   originLang: "zh-cn",
//   // 选择翻译器，有道、谷歌或百度
//   // 百度翻译
//   translator: new BaiduTranslator({
//     appId: "20250414002332588",
//     appKey: "eLXJG_amVDe1YDPSDmm7",
//   }),
// });

// https://vite.dev/config/
export default defineConfig({
  // plugins: [react(), i18nPlugin, tailwindcss()],
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001", // 假设你的后端服务运行在3001端口
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // 如果后端路径不包含/api前缀则取消注释
      },
      "/aggregator1/v1": {
        target: "https://aggregator.walrus-testnet.walrus.space",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator1/, ""),
      },
      "/aggregator2/v1": {
        target: "https://wal-aggregator-testnet.staketab.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator2/, ""),
      },
      "/aggregator3/v1": {
        target: "https://walrus-testnet-aggregator.redundex.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator3/, ""),
      },
      "/aggregator4/v1": {
        target: "https://walrus-testnet-aggregator.nodes.guru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator4/, ""),
      },
      "/aggregator5/v1": {
        target: "https://aggregator.walrus.banansen.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator5/, ""),
      },
      "/aggregator6/v1": {
        target: "https://walrus-testnet-aggregator.everstake.one",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/aggregator6/, ""),
      },
      "/publisher1/v1": {
        target: "https://publisher.walrus-testnet.walrus.space",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher1/, ""),
      },
      "/publisher2/v1": {
        target: "https://wal-publisher-testnet.staketab.org",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher2/, ""),
      },
      "/publisher3/v1": {
        target: "https://walrus-testnet-publisher.redundex.com",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher3/, ""),
      },
      "/publisher4/v1": {
        target: "https://walrus-testnet-publisher.nodes.guru",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher4/, ""),
      },
      "/publisher5/v1": {
        target: "https://publisher.walrus.banansen.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher5/, ""),
      },
      "/publisher6/v1": {
        target: "https://walrus-testnet-publisher.everstake.one",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/publisher6/, ""),
      },
    },
  },
});

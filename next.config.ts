// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;


import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

const nextConfig: NextConfig = {
  // 🌟 FORZAMOS EL ENTORNO EDGE DE MANERA GLOBAL PARA CLOUDFLARE
  experimental: {
    runtime: 'edge',
  }
};

if (process.env.NODE_ENV === "development") {
  setupDevPlatform();
}

export default nextConfig;

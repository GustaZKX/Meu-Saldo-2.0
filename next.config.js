import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // Ignora erros de TypeScript durante o build (Modo Relaxado)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignora erros de ESLint durante o build (Modo Relaxado)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
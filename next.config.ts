import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.13"],
  devIndicators: false,
  
  // Performance optimizations
  productionBrowserSourceMaps: false,
  
  // Caching for faster rebuilds
  cacheLife: {
    default: { revalidate: 3600 },
    dynamic: { revalidate: 0 },
  },
  
  // Turbopack configuration (Next.js 16 default)
  turbopack: {
    resolveAlias: {},
  },
};

export default nextConfig;

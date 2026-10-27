import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "20mb" }, // upload de radiografias e fotos
  },
};

export default nextConfig;

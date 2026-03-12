import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@alexandria/shared"],
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;

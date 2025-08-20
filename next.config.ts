import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

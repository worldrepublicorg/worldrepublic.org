import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@selfxyz/core", "@selfxyz/qrcode"],
  reactCompiler: true,
};

export default nextConfig;

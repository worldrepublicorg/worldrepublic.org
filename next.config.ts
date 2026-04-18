import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@selfxyz/core", "@selfxyz/qrcode"],
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/:lang/earn",
        destination: "/:lang",
        permanent: true,
      },
      {
        source: "/:lang/parties",
        destination: "/:lang/govern?tab=parties",
        permanent: true,
      },
      {
        source: "/:lang/parties/:id",
        destination: "/:lang/govern/parties/:id",
        permanent: true,
      },
      {
        source: "/:lang/parties/:id/:path*",
        destination: "/:lang/govern/parties/:id/:path*",
        permanent: true,
      },
      {
        source: "/:lang/vote/elections",
        destination: "/:lang/govern/elections",
        permanent: true,
      },
      {
        source: "/:lang/vote/elections/:path*",
        destination: "/:lang/govern/elections/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

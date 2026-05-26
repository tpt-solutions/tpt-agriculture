import type { NextConfig } from "next";
// @ts-expect-error next-pwa has no types
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  transpilePackages: ["@tpt/ui", "@tpt/core"],
};

export default pwaConfig(nextConfig);

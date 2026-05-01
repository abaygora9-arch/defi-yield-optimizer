import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable static generation for all pages — force server-side rendering */
  experimental: {
    /* needed to avoid SSR prerender errors */
  },
};

export default nextConfig;

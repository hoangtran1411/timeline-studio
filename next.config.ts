import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // TypeScript 7 native compiler does not expose the JS Compiler API;
    // this flag tells Next.js to invoke the tsc CLI for type-checking.
    useTypeScriptCli: true,
  },
};

export default nextConfig;

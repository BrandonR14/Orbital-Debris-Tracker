import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { webpack }) => {
    // satellite.js v5+ includes a WASM runtime (dist/wasm/index.js) that
    // imports 'node:module' to detect its environment — not valid in
    // browser/webpack bundles. Replace it with an empty shim so the
    // pure-JS exports in dist/index.js (lines 1-10) are used instead.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /[\\/]satellite\.js[\\/]dist[\\/]wasm[\\/]index\.js$/,
        path.resolve("./src/lib/satellite-wasm-shim.js")
      )
    );
    return config;
  },
};

export default nextConfig;

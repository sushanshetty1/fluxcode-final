/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  webpack: (config, { isServer }) => {
    // Exclude Python venv and scripts from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/venv/**', '**/scripts/**', '**/node_modules/**'],
    };
    
    // Exclude venv and scripts from module resolution
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    
    return config;
  },
  
  // Exclude venv and scripts directories from type checking and linting
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src']
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default config;

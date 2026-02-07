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
    return config;
  },
};

export default config;

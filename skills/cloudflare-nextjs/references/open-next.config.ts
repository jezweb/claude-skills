// OpenNext Cloudflare Adapter Configuration
// See: https://opennext.js.org/cloudflare/caching

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Basic configuration (defaults are usually sufficient)

  // Optional: Image optimization configuration
  // imageOptimization: {
  //   loader: 'cloudflare',
  // },

  // Optional: Advanced caching configuration
  // See: https://opennext.js.org/cloudflare/caching
  // cache: {
  //   // Override default cache behavior
  // },

  // Optional: Custom middleware configuration
  // middleware: {
  //   // Middleware-specific config
  // },

  // Optional: Routing configuration
  // routing: {
  //   // Custom routing behavior
  // },
});

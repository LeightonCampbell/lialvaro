// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  server: {
    // Avoid Windows "localhost" → IPv6 (::1) hitting a different listener than Vite's IPv4 bind.
    host: true,
    port: 4321,
  },

  adapter: cloudflare(),
});
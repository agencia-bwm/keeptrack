// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.keeptrack.com.br',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
    }),
  ],
  image: {
    // Fotos provisórias vindas do site antigo (trocar pelas profissionais em src/assets/uploads)
    remotePatterns: [{ protocol: 'https', hostname: 'www.keeptrack.com.br' }],
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});

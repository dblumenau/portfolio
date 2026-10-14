import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://danishdave.com',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});

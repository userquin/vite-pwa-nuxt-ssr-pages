// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-29',
  typescript: {
    tsConfig: {
      exclude: ['../service-worker'],
    },
  },

  sourcemap: true,
  vite: {
    build: {
      minify: false,
    },
  },

  devtools: { enabled: true },

  nitro: {
    prerender: {
      // offline required to allow redirection when offline and any server page not in cache.
      // The redirection in the sw plugin requires a page in the sw precache,
      // otherwise infinite redirection loop (we can use custom a 404 page for this or / fallback).
      routes: ['/', '/offline'],
    },
  },

  modules: ['@vite-pwa/nuxt'],

  pwa: {
    strategies: 'injectManifest',
    srcDir: 'service-worker',
    filename: 'sw.ts',
    registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'vite-pwa-nuxt-ssr-pages',
      short_name: 'vite-pwa-nuxt-ssr-pages',
      description: 'vite-pwa-nuxt-ssr-pages',
      theme_color: '#ffffff',
    },

    injectManifest: {
      minify: false,
      sourcemap: true,
      enableWorkboxModulesLogs: true,
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
    },

    devOptions: {
      enabled: false,
      suppressWarnings: true,
      navigateFallback: '/',
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    },

    registerWebManifestInRouteRules: true,
  },
})

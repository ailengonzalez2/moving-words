// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-28',

  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxt/ui'],

  devtools: { enabled: true },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  app: {
    head: {
      title: 'Moving Words',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'An interactive Three.js banner experience' },
      ],
    },
  },
})

export default defineNuxtConfig({
  compatibilityDate: '2025-01-28',

  future: {
    compatibilityVersion: 4,
  },

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  devtools: { enabled: false },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  app: {
    head: {
      title: 'DREAM BIG IN 2026',
      htmlAttrs: { lang: 'en', style: 'background:#000', 'data-color-mode-forced': 'dark' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, user-scalable=no' },
        { name: 'description', content: 'An interactive Three.js particle experience' },
        { name: 'theme-color', content: '#000000' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bungee&family=MuseoModerno:wght@400;700&family=Rammetto+One&family=Rubik+Scribble&display=swap' },
      ],
    },
  },
})

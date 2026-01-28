# Moving Words

An interactive Three.js banner page built with Nuxt 4.

## Tech Stack

- **Nuxt 4** - Vue.js framework
- **Nuxt UI** - UI components (for restart button)
- **TresJS** - Three.js integration for Vue/Nuxt
- **Three.js** - 3D graphics library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (via Nuxt UI)

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun build

# Preview production build
bun preview

# Type checking
bun typecheck
```

## Project Structure

```
moving-words/
├── app/
│   ├── app.vue              # Root component
│   ├── pages/
│   │   └── index.vue        # Main page with Three.js canvas
│   ├── components/          # Vue components
│   ├── composables/         # Composables for Three.js logic
│   └── assets/
│       └── css/
│           └── main.css     # Global styles
├── public/                  # Static assets
├── nuxt.config.ts          # Nuxt configuration
└── package.json
```

## Next Steps

1. Build the Three.js scene with TresJS
2. Add word animation logic
3. Implement restart functionality
4. Deploy to production

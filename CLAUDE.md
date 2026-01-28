# Moving Words - Project Context

## Project Overview

Moving Words is an interactive Three.js banner page built with Nuxt 4. This is a frontend-only art project showcasing animated text in 3D space.

## Tech Stack

- **Nuxt 4** with TypeScript
- **@nuxt/ui** for minimal UI components
- **@tresjs/core** for Three.js integration in Vue/Nuxt
- **Three.js** for 3D graphics
- **Tailwind CSS** (via Nuxt UI)

## Project Type

- Frontend-only interactive art project
- No database or backend needed
- No authentication required
- Single page application with 3D canvas

## Development Commands

```bash
bun dev        # Start dev server at localhost:3000
bun build      # Build for production
bun preview    # Preview production build
bun typecheck  # Run TypeScript type checking
```

## File Structure

```
app/
├── app.vue              # Root component with dark background
├── pages/
│   └── index.vue        # Main page (Three.js canvas + restart button)
├── components/          # Vue components for 3D objects
├── composables/         # Composables for Three.js logic/state
└── assets/css/
    └── main.css         # Global styles

nuxt.config.ts           # Nuxt configuration
tsconfig.json            # TypeScript config with Three.js types
```

## Key Features to Implement

1. **Three.js Scene**: Interactive 3D text/word animations
2. **Restart Button**: Bottom-right button to reset animation
3. **Responsive**: Works on various screen sizes
4. **Performance**: Smooth 60fps animations

## TresJS Integration

TresJS provides Vue components for Three.js:
- `<TresCanvas>` for scene container
- `<TresPerspectiveCamera>` for camera
- `<TresMesh>` for 3D objects
- Access to Three.js primitives via Vue's reactivity

## Deployment Notes

When ready to deploy:
1. Push to GitHub
2. Deploy to Railway or Vercel (static/SSG mode)
3. No environment variables needed (frontend-only)

## Development Notes

- This is a **frontend-only** project
- Skip database/auth setup
- Focus on Three.js animations and interactivity
- Use Nuxt UI sparingly (just the restart button)

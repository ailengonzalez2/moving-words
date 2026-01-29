# Development Guide - Moving Words

## Getting Started

The project is now initialized and ready for development.

### Start Development Server

```bash
bun dev
```

The app will be available at `http://localhost:3000`

You should see a rotating blue cube (placeholder) and a white "Restart" button in the bottom-right corner.

## Project Structure

```
moving-words/
├── app/
│   ├── app.vue                    # Root component (dark background)
│   ├── pages/
│   │   └── index.vue              # Main page with Three.js canvas
│   ├── components/
│   │   └── ThreeScene.vue         # Three.js scene with TresJS
│   ├── composables/               # Add composables for animation logic
│   └── assets/css/
│       └── main.css               # Global styles
├── public/                        # Static assets (textures, fonts, etc.)
├── nuxt.config.ts                 # Nuxt configuration
├── tsconfig.json                  # TypeScript config
└── package.json                   # Dependencies and scripts
```

## Current Setup

### Components

**ThreeScene.vue** - Basic TresJS scene with:
- Perspective camera at `[0, 0, 5]`
- Ambient light (intensity 0.5)
- Directional light at `[2, 2, 2]`
- Example blue cube (placeholder)

**index.vue** - Main page with:
- Full-screen Three.js canvas
- Restart button (bottom-right, z-index 10)
- Click handler ready for animation restart

### Dependencies Installed

- `nuxt@4.3.0` - Nuxt 4 framework
- `@nuxt/ui@4.4.0` - UI components (UButton)
- `@tresjs/core@5.3.3` - Three.js Vue integration
- `three@0.182.0` - Three.js library
- `@types/three@0.182.0` - TypeScript types

## Next Steps: Building the Interactive Banner

### 1. Design the Word Animation

Decide on:
- What words/text to display
- Animation style (floating, morphing, particles, etc.)
- User interaction (mouse tracking, click events, scroll, etc.)
- Color scheme and visual style

### 2. Implement Three.js Scene

**Option A: 3D Text**
```vue
<TresMesh>
  <TresTextGeometry :args="['HELLO', { font, size: 1, depth: 0.2 }]" />
  <TresMeshStandardMaterial />
</TresMesh>
```

**Option B: Particles/Points**
```vue
<TresPoints>
  <TresBufferGeometry />
  <TresPointsMaterial :size="0.05" />
</TresPoints>
```

### 3. Add Animation Logic

Create composables in `app/composables/`:

**useWordAnimation.ts**
```typescript
export function useWordAnimation() {
  const { onLoop } = useRenderLoop()

  onLoop(({ delta }) => {
    // Animation logic here
  })

  const restart = () => {
    // Reset animation state
  }

  return { restart }
}
```

### 4. Connect Restart Button

In `ThreeScene.vue`:
```typescript
const { restart } = useWordAnimation()
defineExpose({ restart })
```

In `index.vue`:
```typescript
const threeScene = ref()
const handleRestart = () => {
  threeScene.value?.restart()
}
```

### 5. Add Interactivity

**Mouse Tracking:**
```typescript
import { usePointer } from '@tresjs/core'

const { x, y } = usePointer()
```

**Camera Controls:**
```typescript
import { OrbitControls } from '@tresjs/cientos'
```

### 6. Performance Optimization

- Use `instanced meshes` for many similar objects
- Implement level-of-detail (LOD) if needed
- Use `performance` mode in TresCanvas
- Consider using `postprocessing` for effects

## Useful TresJS Resources

- [TresJS Documentation](https://tresjs.org)
- [TresJS Examples](https://tresjs.org/examples)
- [Three.js Documentation](https://threejs.org/docs)

## Deployment Checklist (Later)

- [ ] Optimize assets (compress textures, models)
- [ ] Test on mobile devices
- [ ] Add loading state
- [ ] Add error boundaries
- [ ] Push to GitHub
- [ ] Deploy to Railway/Vercel

## Current Git Status

- 3 commits
- All files tracked
- Ready for development

Run `git status` to check current state.

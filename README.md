# Moving Words - Interactive Particle Banner

An interactive Three.js particle system that reveals text through user engagement. Inspired by the mysterious, interactive art installations at makemepulse.com.

## Features

- **2500+ Interactive Particles**: Smooth GPU-accelerated particle system
- **Custom GLSL Shaders**: High-performance vertex and fragment shaders
- **Progressive Interaction**: Click & hold to charge energy and reveal text
- **Responsive Design**: Works on desktop (mouse) and mobile (touch)
- **Smooth Animations**: State-based animation system with seamless transitions
- **Electric Effects**: Dynamic glow and swirl effects with electric blue accents

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

Visit `http://localhost:3000` to see the interactive banner.

## How to Use

1. **Wait** for the "CLICK & HOLD" instruction to appear
2. **Click and hold** (or touch and hold on mobile) anywhere on the screen
3. **Hold for 2 seconds** - watch the progress ring fill as particles swirl
4. **Release** to trigger an explosive particle burst
5. **Watch** as particles reorganize to spell "DREAM BIG IN 2026"
6. **Click Restart** to reset the animation

## Project Structure

```
app/
├── components/
│   └── ThreeScene.vue              # Main Three.js scene
├── composables/
│   ├── useInteraction.ts           # Mouse/touch interaction
│   ├── useTextGeometry.ts          # Text to particles converter
│   └── useParticleSystem.ts        # Particle system with shaders
├── pages/
│   └── index.vue                   # Main page
└── assets/                         # (if needed)
```

## Technical Details

### Architecture
- **Imperative Three.js**: Direct WebGL control for maximum performance
- **Custom Shaders**: GLSL vertex and fragment shaders for GPU acceleration
- **Vue 3 Composition API**: Clean, modular composables pattern
- **TypeScript**: Full type safety throughout

### Animation States
1. `INITIAL` - Floating particles with subtle ambient motion
2. `CHARGING` - Swirling toward cursor with increasing intensity
3. `EXPLODING` - Radial burst from center point
4. `FORMING` - Letter-by-letter text assembly
5. `REVEALED` - Text complete with subtle floating

### Performance
- 60 FPS on modern hardware
- Efficient BufferGeometry with attributes
- Additive blending for glow effects
- Responsive pixel ratio (capped at 2x)
- Proper resource cleanup and disposal

## Customization

### Change the Text
In `/app/components/ThreeScene.vue` (line 107):
```typescript
const text = 'YOUR CUSTOM TEXT'
```

### Adjust Particle Count
In `/app/components/ThreeScene.vue` (line 104):
```typescript
const particleCount = 3000 // Increase or decrease
```

### Modify Colors
In `/app/composables/useParticleSystem.ts` (material uniforms):
```typescript
uColor: { value: new THREE.Color(0xffffff) },      // Base color
uGlowColor: { value: new THREE.Color(0x00d4ff) },  // Glow color (electric blue)
```

### Timing Adjustments
**Hold Duration** (`/app/composables/useInteraction.ts`):
```typescript
const holdDuration = 2000 // milliseconds
```

**Explosion Duration** (`/app/composables/useParticleSystem.ts`):
```typescript
let explosionDuration = 0.8 // seconds
```

**Formation Duration** (`/app/composables/useParticleSystem.ts`):
```typescript
let formDuration = 2.0 // seconds
```

**Letter Stagger** (`/app/components/ThreeScene.vue`):
```typescript
const delays = textGeometry.generateStaggeredDelays(text, targetPositions, 150) // milliseconds
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile: iOS Safari 14+, Chrome for Android

Requires WebGL support.

## Dependencies

- **three**: 3D rendering engine (v0.182.0)
- **@nuxt/ui**: UI components (v4.4.0)
- **nuxt**: Vue.js framework (v4.3.0)

## Performance Tips

For the best experience:
- Use a modern GPU (integrated graphics work fine)
- Close unnecessary browser tabs
- On mobile, close background apps
- Ensure hardware acceleration is enabled in browser settings

## Credits

Design inspiration from [makemepulse.com](https://2016.makemepulse.com/)

Built with Three.js, Vue 3, and Nuxt.

## License

MIT

---

For detailed implementation documentation, see [IMPLEMENTATION.md](/IMPLEMENTATION.md)

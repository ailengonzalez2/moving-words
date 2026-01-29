# Interactive Three.js Particle Banner Implementation

## Overview

This project implements an interactive particle system that reveals text through user interaction. The implementation uses imperative Three.js with custom GLSL shaders for optimal performance.

## Architecture

### File Structure

```
app/
├── components/
│   └── ThreeScene.vue          # Main Three.js scene component
├── composables/
│   ├── useInteraction.ts       # Mouse/touch interaction handling
│   ├── useTextGeometry.ts      # Text to particle position conversion
│   └── useParticleSystem.ts    # Particle system with custom shaders
└── pages/
    └── index.vue               # Main page integrating the scene
```

## Features

### Visual Design
- **Background**: Pure black (#000000)
- **Particles**: White (#FFFFFF) with electric blue (#00D4FF) glow effects
- **Text**: "DREAM BIG IN 2026"
- **Aesthetic**: Mysterious, interactive art installation inspired by makemepulse.com

### Interaction Flow

1. **Initial State**
   - 2500 particles floating randomly in 3D space
   - Subtle ambient floating animation
   - "CLICK & HOLD" instruction with fade animation

2. **Charging (Click & Hold)**
   - Particles swirl toward cursor/touch position
   - Spiral motion with increasing intensity
   - Progress ring fills over 2 seconds
   - Electric blue glow intensifies
   - Energy builds visually

3. **Explosion**
   - After 2 seconds, particles burst outward
   - Radial explosion from center point
   - Bright flash effect
   - 0.8 second duration

4. **Text Formation**
   - Particles reorganize to form text
   - Letter-by-letter reveal with stagger
   - 150ms delay between letters
   - Smooth easing animation
   - 2 second total duration

5. **Revealed State**
   - Text particles maintain position
   - Subtle floating animation
   - Restart button appears

## Technical Implementation

### Composables

#### useInteraction.ts
Manages pointer (mouse/touch) interactions:
- Tracks normalized device coordinates (-1 to 1)
- Handles hold duration and progress (0-1)
- Supports both mouse and touch events
- Calculates hold progress over 2 seconds
- Prevents default behaviors to avoid scrolling

**Key Methods:**
- `attach(element)` - Attach event listeners
- `detach()` - Remove event listeners
- `reset()` - Reset interaction state

#### useTextGeometry.ts
Converts text into particle positions:
- Uses Canvas 2D API to render text
- Samples pixels to generate particle positions
- Creates staggered delays for letter reveal
- Generates random initial positions

**Key Methods:**
- `generateTextPositions(text, particlesPerLetter)` - Convert text to 3D positions
- `generateStaggeredDelays(text, positions, delayPerLetter)` - Create reveal timing
- `generateRandomPositions(count, spread)` - Random starting positions

#### useParticleSystem.ts
Manages particle rendering with custom shaders:
- Custom vertex and fragment shaders
- State machine for animation phases
- Additive blending for glow effects
- Efficient attribute-based animation

**Animation States:**
- `INITIAL` - Floating particles
- `CHARGING` - Swirling to cursor
- `EXPLODING` - Burst outward
- `FORMING` - Assembling text
- `REVEALED` - Text complete

**Key Methods:**
- `init(scene, initialPos, targetPos, delays, pixelRatio)` - Initialize system
- `update(time, pointerPos, chargePower, isCharging, chargeComplete)` - Update animation
- `reset(initialPositions)` - Reset to initial state
- `dispose()` - Cleanup resources

### Custom Shaders

#### Vertex Shader
Handles particle positioning and animation:
- **Uniforms**: Time, pointer position, animation progress values
- **Attributes**: Target positions, random offsets, reveal delays
- **Features**:
  - Floating animation with sine waves
  - Spiral motion toward pointer during charging
  - Radial explosion from center
  - Staggered interpolation to target positions
  - Dynamic size based on distance and state

#### Fragment Shader
Renders particles with glow effects:
- Circular particle shape with soft edges
- Color mixing between white and electric blue
- Additive blending for glow
- Center glow intensification

### Performance Optimizations

1. **ShallowRef for Three.js Objects**
   - Avoids Vue reactivity overhead on large objects
   - Used for scene, camera, renderer references

2. **Custom Shaders**
   - GPU-accelerated particle animation
   - All animation calculations in vertex shader
   - Efficient attribute-based approach

3. **Additive Blending**
   - Creates glow without multiple render passes
   - Depth write disabled for transparency

4. **Responsive Pixel Ratio**
   - Capped at 2x for high-DPI displays
   - Conditional antialiasing (off on high-DPI)

5. **RequestAnimationFrame**
   - Single animation loop
   - Proper cleanup on component unmount

## Usage

### Running the Project

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Interacting with the Scene

1. Open the page
2. Wait for "CLICK & HOLD" instruction
3. Click and hold (or touch and hold on mobile)
4. Hold for 2 seconds to complete charging
5. Release to trigger explosion and text reveal
6. Click "Restart" to reset animation

### Customization

#### Change Text
In `ThreeScene.vue`, line 107:
```typescript
const text = 'YOUR TEXT HERE'
```

#### Adjust Particle Count
In `ThreeScene.vue`, line 104:
```typescript
const particleCount = 2500 // Increase/decrease as needed
```

#### Modify Colors
In `useParticleSystem.ts`, material uniforms:
```typescript
uColor: { value: new THREE.Color(0xffffff) },      // Base color
uGlowColor: { value: new THREE.Color(0x00d4ff) },  // Glow color
```

#### Timing Adjustments
In `useParticleSystem.ts`:
```typescript
let explosionDuration = 0.8  // Explosion length in seconds
let formDuration = 2.0       // Text formation length in seconds
```

In `useTextGeometry.ts`:
```typescript
const delayPerLetter = 150  // Milliseconds between letters
```

In `useInteraction.ts`:
```typescript
const holdDuration = 2000  // Hold time in milliseconds
```

## Browser Compatibility

- Modern browsers with WebGL support
- Desktop: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Chrome for Android
- Tested on high-DPI displays (Retina)

## Dependencies

- **three** (v0.182.0): 3D rendering
- **@tresjs/core** (v5.3.3): Vue Three.js integration (not used in final implementation)
- **@nuxt/ui** (v4.4.0): UI components
- **nuxt** (v4.3.0): Framework

## Performance Notes

- 60 FPS on modern hardware with 2500 particles
- GPU-accelerated via WebGL shaders
- Efficient memory usage with BufferGeometry
- Proper disposal prevents memory leaks

## Future Enhancements

Potential improvements:
- Multiple text phrases with transitions
- Audio integration for charging/explosion
- Particle color variations
- Dynamic particle count based on device
- Post-processing effects (bloom)
- Keyboard-based interaction option
- Mobile gesture controls (pinch/swipe)

## Credits

Inspired by the interactive art installations at makemepulse.com.

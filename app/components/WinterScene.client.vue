<script setup lang="ts">
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  DataTexture,
  RGBAFormat,
  UnsignedByteType,
  LinearFilter,
  Points,
  BufferGeometry,
  BufferAttribute,
} from 'three'

const containerRef = ref<HTMLDivElement | null>(null)

// Scene objects
let renderer: WebGLRenderer | null = null
let sceneObj: Scene | null = null
let camera: OrthographicCamera | null = null
let quad: Mesh | null = null
let quadGeo: PlaneGeometry | null = null
let quadMat: ShaderMaterial | null = null
let crackTexture: DataTexture | null = null
let crackData: Uint8Array | null = null

// Fragment particles
let fragPoints: Points | null = null
let fragGeo: BufferGeometry | null = null
let fragMat: ShaderMaterial | null = null

// Floating background spheres
let sphereGeo: PlaneGeometry | null = null
const NUM_SPHERES = 20

interface FloatingSphere {
  mesh: Mesh
  mat: ShaderMaterial
  fx1: number; fy1: number
  px1: number; py1: number
  fx2: number; fy2: number
  px2: number; py2: number
  ax: number; ay: number
}
const floatingSpheres: FloatingSphere[] = []

let rafId = 0
let elapsedTime = 0

// Constants
const CRACK_RES = 512
const BRUSH_RADIUS = 30
const PAINT_STRENGTH = 0.4
const LERP_FACTOR = 0.12
const MAX_FRAGMENTS = 200

// Mouse state (UV space: 0–1)
const mouse = {
  target: { x: 0.5, y: 0.5 },
  current: { x: 0.5, y: 0.5 },
  prev: { x: 0.5, y: 0.5 },
  active: false,
}

// Fragment particle pool
interface Fragment {
  x: number; y: number
  vx: number; vy: number
  rotation: number
  rotSpeed: number
  size: number
  opacity: number
  age: number
  maxAge: number
  leftH: number
  rightH: number
  alive: boolean
}

const fragments: Fragment[] = []
for (let i = 0; i < MAX_FRAGMENTS; i++) {
  fragments.push({
    x: 0, y: 0, vx: 0, vy: 0,
    rotation: 0, rotSpeed: 0, size: 0,
    opacity: 0, age: 0, maxAge: 1,
    leftH: 0.5, rightH: 0.5, alive: false,
  })
}
let nextFragIdx = 0
let spawnAccumulator = 0
let lastFragSize = 14
let lastRightH = 0.4

// Irregular crack width state
let brushWidthWander = 1.0
let brushWidthTarget = 1.0
let brushWidthTimer = 0

// ── Mouse handler ──
function onMouseMove(e: MouseEvent) {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  mouse.target.x = (e.clientX - rect.left) / rect.width
  mouse.target.y = 1.0 - (e.clientY - rect.top) / rect.height

  if (!mouse.active) {
    mouse.active = true
    mouse.current.x = mouse.target.x
    mouse.current.y = mouse.target.y
    mouse.prev.x = mouse.target.x
    mouse.prev.y = mouse.target.y
  }
}

// ── Background shader: geometric grid reveal ──
const bgVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const bgFragment = /* glsl */ `
precision highp float;

uniform sampler2D uCrackMap;
varying vec2 vUv;

// Hash-based noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float texel = 1.0 / 512.0;
  float intensity = texture2D(uCrackMap, vUv).r;

  // Sample neighbors for gradient (surface normal)
  float iN = texture2D(uCrackMap, vUv + vec2(0.0, texel)).r;
  float iS = texture2D(uCrackMap, vUv - vec2(0.0, texel)).r;
  float iE = texture2D(uCrackMap, vUv + vec2(texel, 0.0)).r;
  float iW = texture2D(uCrackMap, vUv - vec2(texel, 0.0)).r;

  vec2 gradient = vec2(iE - iW, iN - iS) * 0.5;
  float edgeStrength = length(gradient);

  // Depth bands
  float reveal = smoothstep(0.05, 0.35, intensity);
  float outerBevel = smoothstep(0.02, 0.12, intensity) * (1.0 - smoothstep(0.12, 0.25, intensity));
  float midBevel = smoothstep(0.12, 0.25, intensity) * (1.0 - smoothstep(0.25, 0.35, intensity));

  // Directional lighting on bevel
  vec3 lightDir = normalize(vec3(-0.5, 0.5, 1.0));
  vec3 surfNormal = normalize(vec3(gradient * 4.0, 1.0));
  float diffuse = max(dot(surfNormal, lightDir), 0.0);

  // Surface texture noise
  float n = noise(vUv * 40.0);
  float n2 = noise(vUv * 80.0);
  float surfaceNoise = n * 0.7 + n2 * 0.3;
  vec3 noiseNormal = normalize(vec3(
    noise(vUv * 40.0 + vec2(0.1, 0.0)) - noise(vUv * 40.0 - vec2(0.1, 0.0)),
    noise(vUv * 40.0 + vec2(0.0, 0.1)) - noise(vUv * 40.0 - vec2(0.0, 0.1)),
    1.0
  ));
  float surfDiffuse = max(dot(noiseNormal, lightDir), 0.0);

  // Black surface with subtle texture
  vec3 surfaceColor = vec3(0.02 + surfDiffuse * 0.03);

  // Bevel shading: dark gray with directional light
  float bevelLight = 0.08 + diffuse * 0.18;
  vec3 bevelColor = vec3(bevelLight);
  // Ambient occlusion: outer bevel is darker
  bevelColor *= mix(0.5, 1.0, midBevel / max(outerBevel + midBevel, 0.001));

  // Combine bevel zones
  float bevelMask = outerBevel + midBevel;
  vec3 color = mix(surfaceColor, bevelColor, bevelMask);

  // Edge glow: blue-white light escaping from crack
  float rimGlow = smoothstep(0.0, 0.3, edgeStrength) * (1.0 - reveal);
  vec3 glowColor = vec3(0.6, 0.7, 1.0);
  color += glowColor * rimGlow * 0.4;

  // Transparent where cracked — real spheres show through from behind
  float alpha = 1.0 - reveal;
  alpha = max(alpha, rimGlow * 0.6);

  gl_FragColor = vec4(color, alpha);
}
`

// ── Fragment particle shader ──
const fragVertex = /* glsl */ `
attribute float aOpacity;
attribute float aRotation;
attribute float aSize;
attribute float aLeftH;
attribute float aRightH;

varying float vOpacity;
varying float vRotation;
varying float vLeftH;
varying float vRightH;

uniform float uPixelRatio;

void main() {
  vOpacity  = aOpacity;
  vRotation = aRotation;
  vLeftH    = aLeftH;
  vRightH   = aRightH;
  gl_Position  = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio;
}
`

const fragFragment = /* glsl */ `
precision highp float;
varying float vOpacity;
varying float vRotation;
varying float vLeftH;
varying float vRightH;

void main() {
  if (vOpacity < 0.01) discard;

  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vRotation);
  float s = sin(vRotation);
  uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

  // Width bounds
  if (abs(uv.x) > 0.42) discard;

  // Height interpolates from leftH to rightH across x
  float t = (uv.x + 0.42) / 0.84;
  float halfH = mix(vLeftH, vRightH, t) * 0.5;

  // Vertical offset tilts the shape
  float leftOff  = (fract(sin(vLeftH * 127.1 + vRightH * 311.7) * 43758.5) - 0.5) * 0.1;
  float rightOff = (fract(sin(vRightH * 269.5 + vLeftH * 183.3) * 43758.5) - 0.5) * 0.1;
  float off = mix(leftOff, rightOff, t);

  if (abs(uv.y - off) > halfH) discard;

  // Fake surface normal from UV position for 3D lighting
  vec2 centered = vec2(uv.x / 0.42, (uv.y - off) / halfH);
  vec3 fakeNormal = normalize(vec3(centered.x * 0.3, centered.y * 0.3, 1.0));

  // Directional lighting (same light as background bevel)
  vec3 lightDir = normalize(vec3(-0.5, 0.5, 1.0));
  float diffuse = max(dot(fakeNormal, lightDir), 0.0);
  float lighting = 0.2 + diffuse * 0.8; // 0.2 ambient minimum

  // Specular highlight
  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec = pow(max(dot(fakeNormal, halfVec), 0.0), 16.0);

  // Edge darkening
  float edgeFactor = length(centered);
  float edgeDarken = smoothstep(0.4, 0.6, edgeFactor);

  vec3 baseCol = vec3(0.12, 0.12, 0.14);
  vec3 col = baseCol * lighting + vec3(1.0) * spec * 0.15;
  col *= (1.0 - edgeDarken * 0.4);

  gl_FragColor = vec4(col, vOpacity);
}
`

// ── Floating sphere shader ──
const sphereVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const sphereFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
void main() {
  vec2 c = (vUv - 0.5) * 2.0;
  float dist = length(c);
  if (dist > 1.0) discard;

  // 3D sphere normal
  float z = sqrt(max(0.0, 1.0 - dist * dist));
  vec3 normal = normalize(vec3(c, z));

  // Antialiasing at circle edge
  float edge = smoothstep(1.0, 0.97, dist);

  // Directional light from top-right
  vec3 lightDir = normalize(vec3(0.5, 0.6, 0.9));

  // Ambient + diffuse wrap for softer 3D shading
  float wrap = max(dot(normal, lightDir) * 0.5 + 0.5, 0.0);
  float shading = 0.55 + 0.45 * wrap;

  // Fresnel: edges fade to background color for seamless blend
  float fresnel = 1.0 - z;
  fresnel = fresnel * fresnel;

  vec3 bgColor = vec3(0.96);
  vec3 sphereColor = vec3(shading);

  // Blend sphere into background at edges via fresnel
  vec3 color = mix(sphereColor, bgColor, fresnel * 0.7);

  gl_FragColor = vec4(color, edge);

}
`

// ── Init ──
function init() {
  const container = containerRef.value
  if (!container) return
  const w = container.clientWidth
  const h = container.clientHeight
  if (w === 0 || h === 0) return

  sceneObj = new Scene()
  camera = new OrthographicCamera(-1, 1, 1, -1, 0, 2)
  camera.position.z = 1

  renderer = new WebGLRenderer({ alpha: false })
  renderer.setClearColor(0xf5f5f5)
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
  container.appendChild(renderer.domElement)

  // Crack map texture
  crackData = new Uint8Array(CRACK_RES * CRACK_RES * 4)
  crackTexture = new DataTexture(crackData, CRACK_RES, CRACK_RES, RGBAFormat, UnsignedByteType)
  crackTexture.minFilter = LinearFilter
  crackTexture.magFilter = LinearFilter
  crackTexture.needsUpdate = true

  // Floating background spheres
  sphereGeo = new PlaneGeometry(1, 1)
  for (let i = 0; i < NUM_SPHERES; i++) {
    const depth = i / NUM_SPHERES
    const size = 0.05 + Math.random() * 0.55
    const speed = 0.3 + depth * 0.7 + Math.random() * 0.3

    const sMat = new ShaderMaterial({
      vertexShader: sphereVertex,
      fragmentShader: sphereFragment,
      depthTest: true,
      depthWrite: true,
    })

    const sMesh = new Mesh(sphereGeo, sMat)
    sMesh.scale.set(size, size, 1)
    sMesh.position.z = -0.5 + depth * 0.4
    sMesh.renderOrder = -1
    sceneObj.add(sMesh)

    floatingSpheres.push({
      mesh: sMesh,
      mat: sMat,
      fx1: (0.15 + Math.random() * 0.4) * speed,
      fy1: (0.15 + Math.random() * 0.4) * speed,
      px1: Math.random() * Math.PI * 2,
      py1: Math.random() * Math.PI * 2,
      fx2: (0.4 + Math.random() * 0.6) * speed,
      fy2: (0.4 + Math.random() * 0.6) * speed,
      px2: Math.random() * Math.PI * 2,
      py2: Math.random() * Math.PI * 2,
      ax: 0.5 + Math.random() * 1.0,
      ay: 0.4 + Math.random() * 0.8,
    })
  }

  // Fullscreen quad (transparent where cracked)
  quadMat = new ShaderMaterial({
    vertexShader: bgVertex,
    fragmentShader: bgFragment,
    uniforms: {
      uCrackMap: { value: crackTexture },
    },
    transparent: true,
    depthWrite: false,
  })
  quadGeo = new PlaneGeometry(2, 2)
  quad = new Mesh(quadGeo, quadMat)
  quad.renderOrder = 0
  sceneObj.add(quad)

  // Fragment particle system
  fragGeo = new BufferGeometry()
  const pos = new Float32Array(MAX_FRAGMENTS * 3)
  const opa = new Float32Array(MAX_FRAGMENTS)
  const rot = new Float32Array(MAX_FRAGMENTS)
  const siz = new Float32Array(MAX_FRAGMENTS)
  const lh  = new Float32Array(MAX_FRAGMENTS)
  const rh  = new Float32Array(MAX_FRAGMENTS)

  fragGeo.setAttribute('position', new BufferAttribute(pos, 3))
  fragGeo.setAttribute('aOpacity', new BufferAttribute(opa, 1))
  fragGeo.setAttribute('aRotation', new BufferAttribute(rot, 1))
  fragGeo.setAttribute('aSize', new BufferAttribute(siz, 1))
  fragGeo.setAttribute('aLeftH', new BufferAttribute(lh, 1))
  fragGeo.setAttribute('aRightH', new BufferAttribute(rh, 1))

  fragMat = new ShaderMaterial({
    vertexShader: fragVertex,
    fragmentShader: fragFragment,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })

  fragPoints = new Points(fragGeo, fragMat)
  fragPoints.renderOrder = 1
  fragPoints.frustumCulled = false
  sceneObj.add(fragPoints)

  // Reset pool
  for (const f of fragments) f.alive = false
  nextFragIdx = 0
  spawnAccumulator = 0
  lastRightH = 0.35 + Math.random() * 0.35
  brushWidthWander = 1.0
  brushWidthTarget = 1.0
  brushWidthTimer = 0
  elapsedTime = 0
  mouse.active = false

  window.addEventListener('resize', onResize)
  container.addEventListener('mousemove', onMouseMove)
  animate()
}

// ── Crack map decay ──
function decayCrackMap() {
  if (!crackData || !crackTexture) return
  for (let i = 0; i < crackData.length; i += 4) {
    const v = crackData[i]!
    if (v === 0) continue

    const fresh = crackData[i + 1]!
    if (fresh > 0) {
      crackData[i + 1] = Math.max(0, fresh - 3)
    }

    const t = Math.min(1, crackData[i + 1]! / 75)
    const decay = 0.95 + 0.05 * t
    const newVal = Math.floor(v * decay)
    crackData[i] = newVal
    crackData[i + 2] = newVal
  }
  crackTexture.needsUpdate = true
}

// ── Crack map painting ──
function paintCrackMap() {
  if (!crackData || !crackTexture) return

  const dx = mouse.current.x - mouse.prev.x
  const dy = mouse.current.y - mouse.prev.y
  const velocity = Math.sqrt(dx * dx + dy * dy)
  if (velocity < 0.0001) return

  // Wander the brush width for irregular crack thickness
  brushWidthTimer--
  if (brushWidthTimer <= 0) {
    brushWidthTarget = 0.4 + Math.random() * 1.2
    brushWidthTimer = 3 + Math.floor(Math.random() * 15)
  }
  brushWidthWander += (brushWidthTarget - brushWidthWander) * 0.1

  const dynamicRadius = (BRUSH_RADIUS + velocity * 120) * brushWidthWander
  const strength = PAINT_STRENGTH * Math.min(velocity * 25, 1.0)

  const cx = mouse.current.x * CRACK_RES
  const cy = mouse.current.y * CRACK_RES
  const r = Math.ceil(dynamicRadius * 1.3) // extra margin for edge noise
  const xMin = Math.max(0, Math.floor(cx - r))
  const xMax = Math.min(CRACK_RES - 1, Math.ceil(cx + r))
  const yMin = Math.max(0, Math.floor(cy - r))
  const yMax = Math.min(CRACK_RES - 1, Math.ceil(cy + r))

  for (let py = yMin; py <= yMax; py++) {
    for (let px = xMin; px <= xMax; px++) {
      const tdx = px - cx
      const tdy = py - cy
      const dist = Math.sqrt(tdx * tdx + tdy * tdy)

      // Spatial noise in 4px blocks for rough edges
      const bx = px >> 2
      const by = py >> 2
      const h = Math.sin(bx * 12.9898 + by * 78.233) * 43758.5453
      const edgeNoise = (h - Math.floor(h)) * 0.5 - 0.25
      const effectiveRadius = dynamicRadius * (1.0 + edgeNoise)

      if (dist > effectiveRadius) continue
      const t = dist / effectiveRadius
      const falloff = 1.0 - t * t * (3.0 - 2.0 * t)
      const idx = (py * CRACK_RES + px) * 4
      const newVal = Math.min(255, crackData[idx]! + falloff * strength * 255)
      crackData[idx] = newVal
      crackData[idx + 1] = 255
      crackData[idx + 2] = newVal
      crackData[idx + 3] = 255
    }
  }

  crackTexture.needsUpdate = true
}

// ── Fragment spawning ──
function spawnFragment(mx: number, my: number, mvx: number, mvy: number) {
  const f = fragments[nextFragIdx % MAX_FRAGMENTS]!
  nextFragIdx++

  const len = Math.sqrt(mvx * mvx + mvy * mvy)
  if (len < 0.00001) return

  const dirX = mvx / len
  const dirY = mvy / len
  const perpX = -dirY
  const perpY = dirX

  const side = Math.random() > 0.5 ? 1 : -1
  const perpOff = (Math.random() * 0.012 + 0.002) * side
  const behindOff = Math.random() * 0.01 + 0.005

  const sx = mx - dirX * behindOff + perpX * perpOff
  const sy = my - dirY * behindOff + perpY * perpOff

  f.x = sx * 2 - 1
  f.y = sy * 2 - 1

  f.vx = perpX * side * (0.0006 + Math.random() * 0.002)
  f.vy = perpY * side * (0.0006 + Math.random() * 0.002) - 0.0002

  f.rotation = Math.random() * Math.PI * 2
  f.rotSpeed = (Math.random() - 0.5) * 0.03
  if (Math.random() < 0.2) {
    lastFragSize = 22 + Math.random() * 28
  }
  f.size = lastFragSize
  f.opacity = 0.55 + Math.random() * 0.35
  f.age = 0
  f.maxAge = 90 + Math.random() * 120

  // Chain edge heights: left = previous right, right = new random
  f.leftH = lastRightH
  f.rightH = 0.3 + Math.random() * 0.45
  lastRightH = f.rightH

  f.alive = true
}

function spawnFragments() {
  const dx = mouse.current.x - mouse.prev.x
  const dy = mouse.current.y - mouse.prev.y
  const velocity = Math.sqrt(dx * dx + dy * dy)
  if (velocity < 0.0005) return

  spawnAccumulator += velocity * 125
  while (spawnAccumulator >= 1) {
    spawnFragment(mouse.current.x, mouse.current.y, dx, dy)
    spawnAccumulator -= 1
  }
}

// ── Fragment update → GPU buffers ──
function updateFragments() {
  if (!fragGeo) return

  const posArr = (fragGeo.getAttribute('position') as BufferAttribute).array as Float32Array
  const opaArr = (fragGeo.getAttribute('aOpacity') as BufferAttribute).array as Float32Array
  const rotArr = (fragGeo.getAttribute('aRotation') as BufferAttribute).array as Float32Array
  const sizArr = (fragGeo.getAttribute('aSize') as BufferAttribute).array as Float32Array
  const lhArr  = (fragGeo.getAttribute('aLeftH') as BufferAttribute).array as Float32Array
  const rhArr  = (fragGeo.getAttribute('aRightH') as BufferAttribute).array as Float32Array

  for (let i = 0; i < MAX_FRAGMENTS; i++) {
    const f = fragments[i]!

    if (!f.alive) {
      opaArr[i] = 0
      sizArr[i] = 0
      continue
    }

    f.age++
    if (f.age >= f.maxAge) {
      f.alive = false
      opaArr[i] = 0
      sizArr[i] = 0
      continue
    }

    f.x += f.vx
    f.y += f.vy
    f.rotation += f.rotSpeed

    if (f.age / f.maxAge > 0.6) {
      f.opacity *= 0.96
    }

    posArr[i * 3] = f.x
    posArr[i * 3 + 1] = f.y
    posArr[i * 3 + 2] = 0.5
    opaArr[i] = f.opacity
    rotArr[i] = f.rotation
    sizArr[i] = f.size
    lhArr[i] = f.leftH
    rhArr[i] = f.rightH
  }

  fragGeo.getAttribute('position')!.needsUpdate = true
  fragGeo.getAttribute('aOpacity')!.needsUpdate = true
  fragGeo.getAttribute('aRotation')!.needsUpdate = true
  fragGeo.getAttribute('aSize')!.needsUpdate = true
  fragGeo.getAttribute('aLeftH')!.needsUpdate = true
  fragGeo.getAttribute('aRightH')!.needsUpdate = true
}

// ── Animation loop ──
function animate() {
  rafId = requestAnimationFrame(animate)
  if (!renderer || !sceneObj || !camera || !quadMat) return

  mouse.prev.x = mouse.current.x
  mouse.prev.y = mouse.current.y
  mouse.current.x += (mouse.target.x - mouse.current.x) * LERP_FACTOR
  mouse.current.y += (mouse.target.y - mouse.current.y) * LERP_FACTOR

  // Animate floating spheres independently
  elapsedTime += 0.016
  for (const s of floatingSpheres) {
    s.mesh.position.x = Math.sin(elapsedTime * s.fx1 + s.px1) * s.ax * 0.65
                       + Math.sin(elapsedTime * s.fx2 + s.px2) * s.ax * 0.35
    s.mesh.position.y = Math.sin(elapsedTime * s.fy1 + s.py1) * s.ay * 0.65
                       + Math.sin(elapsedTime * s.fy2 + s.py2) * s.ay * 0.35
  }

  decayCrackMap()
  paintCrackMap()
  spawnFragments()
  updateFragments()

  renderer.render(sceneObj, camera)
}

// ── Resize ──
function onResize() {
  if (!containerRef.value || !renderer || !fragMat) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  renderer.setSize(w, h)
  const pr = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(pr)
  fragMat.uniforms.uPixelRatio!.value = pr
}

// ── Cleanup ──
function cleanup() {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  containerRef.value?.removeEventListener('mousemove', onMouseMove)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  for (const s of floatingSpheres) {
    s.mat.dispose()
  }
  floatingSpheres.length = 0
  sphereGeo?.dispose()
  crackTexture?.dispose()
  quadMat?.dispose()
  quadGeo?.dispose()
  fragMat?.dispose()
  fragGeo?.dispose()
}

onMounted(() => nextTick(init))
onUnmounted(cleanup)
</script>

<template>
  <div ref="containerRef" class="winter-scene" />
</template>

<style scoped>
.winter-scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>

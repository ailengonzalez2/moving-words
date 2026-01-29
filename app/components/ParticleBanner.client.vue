<script setup lang="ts">
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  Points,
  AdditiveBlending,
  ShaderMaterial,
} from 'three'

const emit = defineEmits<{
  ready: []
  error: [message: string]
}>()

const containerRef = ref<HTMLDivElement | null>(null)

let renderer: WebGLRenderer | null = null
let sceneObj: Scene | null = null
let camera: PerspectiveCamera | null = null
let geo: BufferGeometry | null = null
let material: ShaderMaterial | null = null
let rafId = 0
let startTime = 0

const PARTICLE_COUNT = 1500
const SPREAD = 24

const vertexShader = /* glsl */`
  uniform float uTime;
  attribute float aRandomSeed;

  varying float vOpacity;

  void main() {
    float seed = aRandomSeed;
    float speed = 0.3 + seed * 0.4;

    vec3 pos = position;
    pos.x += sin(uTime * 0.3 * speed + seed * 6.28) * 0.5;
    pos.y += sin(uTime * 0.2 * speed + seed * 3.14) * 0.4;
    pos.z += sin(uTime * 0.15 * speed + seed * 9.42) * 0.3;

    vOpacity = 0.25 + 0.2 * sin(uTime * 0.5 + seed * 6.28);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float size = 2.0 + sin(seed * 12.56) * 0.8;
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */`
  varying float vOpacity;

  void main() {
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vOpacity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

function init() {
  try {
    const container = containerRef.value
    if (!container) return

    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) return

    sceneObj = new Scene()

    camera = new PerspectiveCamera(60, w / h, 0.1, 100)
    camera.position.z = 20

    renderer = new WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'
    container.appendChild(renderer.domElement)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const seeds = new Float32Array(PARTICLE_COUNT)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * SPREAD
      positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 0.6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
      seeds[i] = Math.random()
    }

    geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geo.setAttribute('aRandomSeed', new Float32BufferAttribute(seeds, 1))

    material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })

    sceneObj.add(new Points(geo, material))
    window.addEventListener('resize', onResize)
    animate()
    emit('ready')
  }
  catch (err: unknown) {
    emit('error', err instanceof Error ? err.message : String(err))
  }
}

function animate() {
  rafId = requestAnimationFrame(animate)
  if (!renderer || !sceneObj || !camera || !material) return
  if (startTime === 0) startTime = performance.now()
  material.uniforms.uTime!.value = (performance.now() - startTime) / 1000
  renderer.render(sceneObj, camera)
}

function onResize() {
  if (!containerRef.value || !camera || !renderer) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function cleanup() {
  cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  material?.dispose()
  geo?.dispose()
}

onMounted(() => nextTick(init))
onUnmounted(cleanup)
</script>

<template>
  <div ref="containerRef" class="banner-container" />
</template>

<style scoped>
.banner-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
}
</style>

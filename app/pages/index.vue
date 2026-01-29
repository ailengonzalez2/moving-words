<script setup lang="ts">
const scenes = ['WINTER', 'SPRING', 'SUMMER', 'AUTUMN'] as const
const currentScene = ref(0)

const sceneFonts: Record<string, string> = {
  WINTER: "'Rammetto One', cursive",
  SPRING: "'Rubik Scribble', system-ui",
  SUMMER: "'Bungee', sans-serif",
  AUTUMN: "'MuseoModerno', sans-serif",
}

const currentFont = computed(() => sceneFonts[scenes[currentScene.value]!])

function next() {
  if (currentScene.value < scenes.length - 1) {
    currentScene.value++
  }
}

function prev() {
  if (currentScene.value > 0) {
    currentScene.value--
  }
}

function restart() {
  currentScene.value = 0
}
</script>

<template>
  <div class="page-root">
    <!-- Winter vertex displacement plane -->
    <WinterScene v-if="scenes[currentScene] === 'WINTER'" />

    <!-- Centered word -->
    <div class="word-container">
      <Transition name="word" mode="out-in">
        <h1 :key="currentScene" class="scene-word" :style="{ fontFamily: currentFont }">
          {{ scenes[currentScene] }}
        </h1>
      </Transition>
    </div>

    <!-- Bottom nav -->
    <div class="nav-bar">
      <button
        class="nav-btn"
        :disabled="currentScene === 0"
        @click="prev"
      >
        BACK
      </button>

      <button class="restart-btn" @click="restart">
        RESTART
      </button>

      <button
        class="nav-btn"
        :disabled="currentScene === scenes.length - 1"
        @click="next"
      >
        NEXT
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-root {
  position: fixed;
  inset: 0;
  background: #000;
  overflow: hidden;
}

/* ── Word ── */
.word-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.scene-word {
  color: #fff;
  font-size: clamp(2.5rem, 10vw, 6rem);
  font-weight: 200;
  letter-spacing: 0.4em;
  margin: 0;
  user-select: none;
  text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
}

/* Word transition */
.word-enter-active { transition: all 0.5s ease; }
.word-leave-active { transition: all 0.3s ease; }
.word-enter-from { opacity: 0; transform: translateY(12px); }
.word-leave-to { opacity: 0; transform: translateY(-12px); }

/* ── Nav bar ── */
.nav-bar {
  position: absolute;
  bottom: 2rem;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.nav-btn,
.restart-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
  padding: 0.6rem 1.5rem;
  font-size: 0.7rem;
  letter-spacing: 0.3em;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.nav-btn:hover:not(:disabled),
.restart-btn:hover {
  border-color: rgba(255, 255, 255, 0.6);
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.2;
  cursor: default;
}
</style>

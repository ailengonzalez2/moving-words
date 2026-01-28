<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { ref } from 'vue'

// Placeholder for Three.js scene
// You'll build your interactive word animations here
</script>

<template>
  <TresCanvas
    window-size
    clear-color="#0a0a0a"
  >
    <!-- Camera -->
    <TresPerspectiveCamera
      :position="[0, 0, 5]"
      :look-at="[0, 0, 0]"
    />

    <!-- Lights -->
    <TresAmbientLight :intensity="0.5" />
    <TresDirectionalLight
      :position="[2, 2, 2]"
      :intensity="1"
    />

    <!-- Example mesh - replace with your word animations -->
    <TresMesh>
      <TresBoxGeometry :args="[1, 1, 1]" />
      <TresMeshStandardMaterial color="#60a5fa" />
    </TresMesh>
  </TresCanvas>
</template>

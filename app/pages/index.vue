<script setup lang="ts">
const handleRestart = () => {
  // TODO: Implement restart logic for Three.js scene
  console.log('Restart animation')
}
</script>

<template>
  <div class="relative w-full h-screen">
    <!-- Three.js canvas -->
    <div class="absolute inset-0">
      <ThreeScene />
    </div>

    <!-- Restart button (bottom right) -->
    <div class="absolute bottom-8 right-8 z-10">
      <UButton
        label="Restart"
        color="white"
        variant="solid"
        size="lg"
        @click="handleRestart"
      />
    </div>
  </div>
</template>

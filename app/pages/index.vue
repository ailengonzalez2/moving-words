<script setup lang="ts">
// Page will contain the Three.js interactive banner
</script>

<template>
  <div class="relative w-full h-screen">
    <!-- Three.js canvas will go here -->
    <div class="absolute inset-0 flex items-center justify-center">
      <h1 class="text-4xl font-bold text-white">Moving Words</h1>
    </div>

    <!-- Restart button (bottom right) -->
    <div class="absolute bottom-8 right-8">
      <UButton
        label="Restart"
        color="white"
        variant="solid"
        size="lg"
      />
    </div>
  </div>
</template>

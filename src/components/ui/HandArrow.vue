<script setup>
// Hand-drawn style arrows used as annotations. Decorative: hidden from AT.
defineProps({
  variant: { type: String, default: 'curve' }, // curve | down | loop | right
  width: { type: [Number, String], default: 120 },
})
</script>

<template>
  <svg class="hand-arrow" :width="width" viewBox="0 0 120 80" fill="none" aria-hidden="true">
    <template v-if="variant === 'curve'">
      <path d="M6 10 C 30 4, 70 6, 92 48" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M78 44 L 94 54 L 99 35" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="variant === 'down'">
      <path d="M60 4 C 52 24, 66 40, 58 70" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M46 58 L 58 72 L 70 58" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else-if="variant === 'loop'">
      <path
        d="M6 60 C 20 20, 50 10, 54 34 C 58 56, 30 56, 40 34 C 50 14, 84 18, 108 30"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path d="M96 20 L 110 31 L 95 40" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </template>
    <template v-else>
      <path d="M4 42 C 30 36, 70 46, 106 38" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M94 27 L 108 38 L 95 50" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </template>
  </svg>
</template>

<style scoped>
.hand-arrow {
  display: block;
  overflow: visible;
}
</style>

<script setup>
// Shared transport controls for every step-based visualizer.
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-vue-next'

const props = defineProps({
  player: { type: Object, required: true }, // return value of useStepPlayer
  label: { type: String, default: 'Animation' },
})
const speeds = [0.5, 1, 2]
</script>

<template>
  <div class="anim-controls" role="group" :aria-label="`${label} controls`">
    <button type="button" class="btn btn--sm btn--icon" :disabled="player.atStart.value" aria-label="Step back" @click="player.prev()">
      <SkipBack :size="16" aria-hidden="true" />
    </button>
    <button
      type="button"
      class="btn btn--sm btn--acid anim-controls__play"
      :aria-label="player.playing.value ? 'Pause' : player.canAutoplay.value ? 'Play' : 'Next step'"
      @click="player.toggle()"
    >
      <Pause v-if="player.playing.value" :size="16" aria-hidden="true" />
      <Play v-else :size="16" aria-hidden="true" />
      <span>{{ player.playing.value ? 'Pause' : player.canAutoplay.value ? 'Play' : 'Step' }}</span>
    </button>
    <button type="button" class="btn btn--sm btn--icon" :disabled="player.atEnd.value" aria-label="Step forward" @click="player.next()">
      <SkipForward :size="16" aria-hidden="true" />
    </button>
    <button type="button" class="btn btn--sm btn--icon" aria-label="Restart" @click="player.restart()">
      <RotateCcw :size="16" aria-hidden="true" />
    </button>
    <span class="anim-controls__count mono" aria-live="polite">
      step {{ Math.min(player.index.value + 1, player.total.value) }} / {{ player.total.value }}
    </span>
    <div class="anim-controls__speed" role="radiogroup" aria-label="Playback speed">
      <button
        v-for="s in speeds"
        :key="s"
        type="button"
        role="radio"
        class="speed"
        :aria-checked="player.speed.value === s"
        @click="player.setSpeed(s)"
      >
        {{ s }}×
      </button>
    </div>
    <span v-if="!player.canAutoplay.value" class="anim-controls__rm label">reduced motion: manual steps</span>
  </div>
</template>

<style scoped>
.anim-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
}
.anim-controls__play {
  min-width: 96px;
}
.anim-controls__count {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 var(--s-2);
}
.anim-controls__speed {
  display: inline-flex;
  border: var(--border-thin);
}
.speed {
  border: 0;
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.35em 0.6em;
  min-height: 32px;
}
.speed + .speed {
  border-left: var(--border-thin);
}
.speed[aria-checked='true'] {
  background: var(--text);
  color: var(--bg);
}
.anim-controls__rm {
  color: var(--muted);
}
</style>

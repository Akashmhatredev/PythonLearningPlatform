import { defineAsyncComponent } from 'vue'

// Lazy component per visualizer type. Each only downloads when a lesson uses it.
const loaders = {
  'code-tracer': () => import('./CodeTracer.vue'),
  'hash-table': () => import('./HashTable.vue'),
  'exception-flow': () => import('./ExceptionFlow.vue'),
  'class-lookup': () => import('./ClassLookup.vue'),
  memory: () => import('./MemoryVisualizer.vue'),
  'asyncio-loop': () => import('./AsyncioLoop.vue'),
  concurrency: () => import('./ConcurrencyTimeline.vue'),
  performance: () => import('./PerformanceLab.vue'),
  'concept-diagram': () => import('./ConceptDiagram.vue'),
  comparison: () => import('./ComparisonVisualizer.vue'),
}

const cache = {}

export function visualizerComponent(type) {
  if (!loaders[type]) return null
  return (cache[type] ??= defineAsyncComponent({ loader: loaders[type], delay: 120, timeout: 20000 }))
}

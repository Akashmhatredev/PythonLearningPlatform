// Catalog of visual-learning components lessons can embed by `type`.
// Pure data, shared by the content validator, the visualizer gallery and the
// lazy component registry (components/diagrams/registry.js).

export const visualizers = {
  'code-tracer': {
    title: 'Python code tracer',
    blurb: 'Runs real Python one step at a time: the call stack, every variable and the objects they point to.',
    props: { code: 'string', inline: 'boolean', notes: 'object', stdin: 'string', editable: 'boolean', maxSteps: 'number' },
  },
  'hash-table': {
    title: 'Hash tables: dict & set',
    blurb: 'Type keys and watch hashing place them in buckets — the reason lookups do not search.',
    props: { preset: ['dict', 'set', 'collision'] },
  },
  'exception-flow': {
    title: 'Exception propagation',
    blurb: 'An exception climbs the call stack until a matching except catches it — or the program crashes.',
    props: { preset: ['uncaught', 'caught', 'finally', 'reraise'] },
  },
  'class-lookup': {
    title: 'Attribute lookup & the MRO',
    blurb: 'How Python finds obj.attr: the instance first, then each class in method resolution order.',
    props: { preset: ['single', 'override', 'diamond', 'super'] },
  },
  memory: {
    title: 'Memory & garbage collection',
    blurb: 'Reference counts rise and fall; cycles need the garbage collector; weak references do not count.',
    props: { preset: ['refcount', 'cycle', 'weakref'] },
  },
  'asyncio-loop': {
    title: 'asyncio event loop',
    blurb: 'Tasks, awaits and the event loop — why async code runs in the order it does.',
    props: { preset: ['await-order', 'gather', 'create-task', 'blocking'] },
  },
  concurrency: {
    title: 'Threads vs processes vs asyncio',
    blurb: 'Timelines of I/O-bound and CPU-bound work under each model, the GIL and race conditions.',
    props: { preset: ['io-bound', 'cpu-bound', 'race-condition'] },
  },
  performance: {
    title: 'Performance lab',
    blurb: 'Measured live in your browser by real Python: lookups, string building, caching and memory.',
    props: { demo: ['membership', 'string-building', 'memoization', 'generator-memory'] },
  },
  'concept-diagram': {
    title: 'Concept diagram',
    blurb: 'A stepped, annotated diagram defined by the lesson.',
    props: { nodes: 'array', edges: 'array', steps: 'array' },
  },
  comparison: {
    title: 'Side-by-side comparison',
    blurb: 'Two approaches to the same problem with their differences called out.',
    props: { left: 'object', right: 'object', points: 'array' },
  },
}

export const visualizerTypes = Object.keys(visualizers)

// Interview categories are views over the question bank: a question belongs to
// a category by the level its lesson lives in, by its question type, or both.

export const interviewCategories = [
  { id: 'fundamentals', label: 'Beginner fundamentals', match: (q) => q.difficulty === 'beginner' },
  {
    id: 'core',
    label: 'Core Python (intermediate)',
    match: (q) => q.difficulty === 'intermediate' && ['basics', 'strings', 'collections', 'control-flow', 'functions', 'modules'].includes(q.level),
  },
  { id: 'data-structures', label: 'Data structures & collections', levels: ['collections', 'strings'] },
  { id: 'functions', label: 'Functions, scope & closures', levels: ['functions', 'functional'] },
  { id: 'iteration', label: 'Iterators, generators & comprehensions', levels: ['iteration'] },
  { id: 'oop', label: 'OOP & the data model', levels: ['oop', 'data-model'] },
  { id: 'advanced', label: 'Decorators, context managers & descriptors', levels: ['advanced-functions'] },
  { id: 'errors-files', label: 'Exceptions, files & data formats', levels: ['errors', 'files-data', 'stdlib'] },
  { id: 'typing', label: 'Type hints & modern Python', levels: ['typing', 'modern-python'] },
  { id: 'internals', label: 'Python internals & memory', levels: ['internals'] },
  { id: 'concurrency', label: 'Concurrency & asyncio', levels: ['concurrency'] },
  { id: 'performance', label: 'Debugging & performance', levels: ['debugging-performance'] },
  { id: 'testing', label: 'Testing & tooling', levels: ['testing', 'environments'] },
  { id: 'apis', label: 'Databases & APIs', levels: ['data-apis'] },
  { id: 'security', label: 'Security', levels: ['security'] },
  { id: 'architecture', label: 'Architecture & design patterns', levels: ['design'], types: ['architecture'] },
  { id: 'output', label: 'Predict the output', types: ['output'] },
  { id: 'debugging', label: 'Debugging & problem-solving', types: ['debugging'] },
  { id: 'scenario', label: 'Real-world scenarios', types: ['scenario'] },
  { id: 'coding', label: 'Practical coding challenges', types: ['coding'] },
]

export function inCategory(q, cat) {
  if (cat.match) return cat.match(q)
  return (cat.levels ?? []).includes(q.level) || (cat.types ?? []).includes(q.type)
}

export const QUESTION_TYPES = [
  { id: 'conceptual', label: 'Conceptual' },
  { id: 'output', label: 'Code output' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'coding', label: 'Coding challenge' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'architecture', label: 'Architecture' },
]

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

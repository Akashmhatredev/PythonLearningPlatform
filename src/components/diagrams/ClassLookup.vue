<script setup>
// Attribute lookup & MRO stepper. Shows where Python finds `obj.attr`: the
// instance's own __dict__ first, then each class in the method resolution order.
// Hand-written walkthroughs; the MROs and printed output were captured by running
// the code. (Simplified: data descriptors such as properties are checked on the
// class before the instance — see the descriptors lesson.)
import { computed } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'single' },
})

const PRESETS = {
  single: {
    code: `class Animal:
    sound = "..."

    def speak(self):
        return f"{self.name} says {self.sound}"

class Dog(Animal):
    sound = "Woof"

rex = Dog()
rex.name = "Rex"
print(rex.speak())`,
    chain: [
      { id: 'inst', label: 'rex', kind: 'instance', names: ['name'] },
      { id: 'Dog', label: 'Dog', kind: 'class', names: ['sound'] },
      { id: 'Animal', label: 'Animal', kind: 'class', names: ['sound', 'speak'] },
      { id: 'object', label: 'object', kind: 'class', names: ['__init__', '__repr__', '__eq__', '…'] },
    ],
    graph: 'Dog(Animal) · Animal(object)',
    steps: [
      { line: 10, text: '`rex = Dog()` makes an **instance**. It starts with an empty `__dict__` of its own.', names: { inst: [] } },
      { line: 11, text: '`rex.name = "Rex"` stores `name` in the instance’s own `__dict__`.' },
      { line: 12, attr: 'rex.speak', at: 'inst', text: 'Python needs `rex.speak`. First stop: the instance’s `__dict__`. No `speak` there…' },
      { line: 12, attr: 'rex.speak', at: 'Dog', text: '…next, the instance’s class, `Dog`. Only `sound` lives there…' },
      { line: 12, attr: 'rex.speak', at: 'Animal', found: true, text: '…then `Dog`’s parent, `Animal`. **Found** `speak`! Because it’s a function on a class, Python binds it to `rex` (that’s where `self` comes from).' },
      { line: 5, attr: 'self.name', at: 'inst', found: true, text: 'Inside `speak`, `self.name` is found immediately on the instance: `"Rex"`.' },
      { line: 5, attr: 'self.sound', at: 'inst', text: '`self.sound`: not on the instance…' },
      { line: 5, attr: 'self.sound', at: 'Dog', found: true, out: ['Rex says Woof'], text: '…found on `Dog` (`"Woof"`). The search **stops at the first match**, so `Animal.sound` is never reached — that’s overriding.' },
    ],
  },
  override: {
    code: `class Shape:
    name = "shape"

    def describe(self):
        return f"I am a {self.name}"

class Square(Shape):
    name = "square"

    def describe(self):
        return super().describe() + " with 4 equal sides"

s = Square()
print(s.describe())
s.name = "box"
print(s.describe())`,
    chain: [
      { id: 'inst', label: 's', kind: 'instance', names: [] },
      { id: 'Square', label: 'Square', kind: 'class', names: ['name', 'describe'] },
      { id: 'Shape', label: 'Shape', kind: 'class', names: ['name', 'describe'] },
      { id: 'object', label: 'object', kind: 'class', names: ['…'] },
    ],
    graph: 'Square(Shape) · Shape(object)',
    steps: [
      { line: 14, attr: 's.describe', at: 'inst', text: '`s.describe`: the instance has no attributes yet…' },
      { line: 14, attr: 's.describe', at: 'Square', found: true, text: '…`Square` defines `describe`, so **its** version wins. `Shape.describe` is *overridden*.' },
      { line: 11, attr: 'super().describe', at: 'Shape', skip: ['inst', 'Square'], found: true, text: '`super().describe()` means “keep searching **after** `Square` in the MRO” — so it finds `Shape.describe`, still bound to the same `s`.' },
      { line: 5, attr: 'self.name', at: 'inst', text: 'In `Shape.describe`, `self` is still the `Square` instance. `self.name`: not on the instance…' },
      { line: 5, attr: 'self.name', at: 'Square', found: true, out: ['I am a square with 4 equal sides'], text: '…found on `Square`: `"square"`. Methods defined in a parent still see the child’s attributes.' },
      { line: 15, names: { inst: ['name'] }, out: ['I am a square with 4 equal sides'], text: '`s.name = "box"` creates an **instance** attribute that *shadows* the class attribute.' },
      { line: 5, attr: 'self.name', at: 'inst', names: { inst: ['name'] }, found: true, out: ['I am a square with 4 equal sides', 'I am a box with 4 equal sides'], text: 'Now `self.name` is found on the instance first: `"box"`. `Square.name` is untouched — other squares still say “square”.' },
    ],
  },
  diamond: {
    code: `class Device:
    def start(self):
        return "Device"

class Camera(Device):
    def start(self):
        return "Camera"

class Phone(Device):
    def start(self):
        return "Phone"

class SmartPhone(Camera, Phone):
    pass

print([c.__name__ for c in SmartPhone.__mro__])
print(SmartPhone().start())`,
    chain: [
      { id: 'inst', label: 'SmartPhone()', kind: 'instance', names: [] },
      { id: 'SmartPhone', label: 'SmartPhone', kind: 'class', names: [] },
      { id: 'Camera', label: 'Camera', kind: 'class', names: ['start'] },
      { id: 'Phone', label: 'Phone', kind: 'class', names: ['start'] },
      { id: 'Device', label: 'Device', kind: 'class', names: ['start'] },
      { id: 'object', label: 'object', kind: 'class', names: ['…'] },
    ],
    graph: 'SmartPhone(Camera, Phone) · Camera(Device) · Phone(Device) — a “diamond”',
    steps: [
      { line: 13, text: '`SmartPhone` inherits from **two** classes that share a parent, `Device`. That shape is the *diamond*.' },
      { line: 16, mro: true, out: ["['SmartPhone', 'Camera', 'Phone', 'Device', 'object']"], text: 'Python flattens the hierarchy into one list, the **MRO** (method resolution order), using the *C3 linearization*: children before parents, and parents in the order you listed them. `Device` appears **once**, after both of its children.' },
      { line: 17, attr: 'start', at: 'inst', out: ["['SmartPhone', 'Camera', 'Phone', 'Device', 'object']"], text: 'Looking up `start`: the instance has nothing…' },
      { line: 17, attr: 'start', at: 'SmartPhone', out: ["['SmartPhone', 'Camera', 'Phone', 'Device', 'object']"], text: '…`SmartPhone` only has `pass`…' },
      { line: 17, attr: 'start', at: 'Camera', found: true, out: ["['SmartPhone', 'Camera', 'Phone', 'Device', 'object']", 'Camera'], text: '…`Camera` is next in the MRO and has `start`. **Found** — `Phone.start` and `Device.start` are never consulted. Swap the bases to `(Phone, Camera)` and the answer flips.' },
    ],
  },
  super: {
    code: `class Base:
    def __init__(self):
        print("Base")

class Logged(Base):
    def __init__(self):
        print("Logged ->")
        super().__init__()

class Cached(Base):
    def __init__(self):
        print("Cached ->")
        super().__init__()

class Service(Logged, Cached):
    def __init__(self):
        print("Service ->")
        super().__init__()

Service()
print([c.__name__ for c in Service.__mro__])`,
    chain: [
      { id: 'Service', label: 'Service', kind: 'class', names: ['__init__'] },
      { id: 'Logged', label: 'Logged', kind: 'class', names: ['__init__'] },
      { id: 'Cached', label: 'Cached', kind: 'class', names: ['__init__'] },
      { id: 'Base', label: 'Base', kind: 'class', names: ['__init__'] },
      { id: 'object', label: 'object', kind: 'class', names: ['__init__'] },
    ],
    graph: 'Service(Logged, Cached) · Logged(Base) · Cached(Base)',
    steps: [
      { line: 20, mro: true, text: 'The MRO of `Service` is **Service → Logged → Cached → Base → object**. `super()` follows *this list*, not “my parent”.' },
      { line: 17, attr: 'Service.__init__', at: 'Service', found: true, out: ['Service ->'], text: '`Service.__init__` runs first.' },
      { line: 8, attr: 'super().__init__', at: 'Logged', skip: ['Service'], found: true, out: ['Service ->', 'Logged ->'], text: '`super()` inside `Service` = “next class after Service in the MRO” → `Logged.__init__`.' },
      { line: 13, attr: 'super().__init__', at: 'Cached', skip: ['Service', 'Logged'], found: true, out: ['Service ->', 'Logged ->', 'Cached ->'], text: 'Surprise: `super()` inside **Logged** goes to `Cached` — a class Logged doesn’t even inherit from! The next class in **Service’s** MRO is `Cached`.' },
      { line: 3, attr: 'super().__init__', at: 'Base', skip: ['Service', 'Logged', 'Cached'], found: true, out: ['Service ->', 'Logged ->', 'Cached ->', 'Base'], text: 'Finally `Base.__init__`. Every class ran **exactly once** — that’s *cooperative* multiple inheritance, and it only works if every class calls `super()`.' },
      { line: 21, mro: true, out: ['Service ->', 'Logged ->', 'Cached ->', 'Base', "['Service', 'Logged', 'Cached', 'Base', 'object']"], text: 'Printing `__mro__` confirms the order. Use `Class.__mro__` (or `Class.mro()`) whenever lookup surprises you.' },
    ],
  },
}

const def = PRESETS[props.preset] ?? PRESETS.single
const player = useStepPlayer(() => def.steps, { interval: 2600 })
const step = computed(() => player.frame.value ?? def.steps[0])
const outLines = computed(() => {
  for (let i = player.index.value; i >= 0; i--) if (def.steps[i].out) return def.steps[i].out
  return []
})
// Names on the instance can change during the walkthrough.
const namesOf = (box) => {
  for (let i = player.index.value; i >= 0; i--) {
    const n = def.steps[i].names?.[box.id]
    if (n) return n
  }
  return box.names
}
const atIndex = computed(() => def.chain.findIndex((b) => b.id === step.value.at))
function stateOf(box, i) {
  if (step.value.skip?.includes(box.id)) return 'skipped'
  if (!step.value.at) return ''
  if (i === atIndex.value) return step.value.found ? 'found' : 'checking'
  if (i < atIndex.value) return 'missed'
  return ''
}
const attrName = computed(() => step.value.attr?.split('.').pop())
</script>

<template>
  <div class="cl">
    <div class="cl__grid">
      <CodeBlock :code="def.code" lang="python" title="main.py" :highlight="[step.line]" :copyable="false" />
      <div class="cl__side">
        <p class="label">lookup chain <span class="muted">· MRO order</span></p>
        <p class="cl__graph mono">{{ def.graph }}</p>
        <p v-if="step.attr" class="cl__query mono">looking up <strong>{{ step.attr }}</strong></p>
        <ol class="cl__chain" :class="{ 'is-mro': step.mro }">
          <li v-for="(box, i) in def.chain" :key="box.id" class="cl__box" :class="[`cl__box--${box.kind}`, `is-${stateOf(box, i)}`]">
            <span class="cl__kind mono">{{ box.kind === 'instance' ? 'instance __dict__' : `class ${box.label}` }}</span>
            <strong v-if="box.kind === 'instance'" class="cl__title mono">{{ box.label }}</strong>
            <span class="cl__names mono">
              <span v-for="n in namesOf(box)" :key="n" class="cl__name" :class="{ 'is-hit': n === attrName && stateOf(box, i) === 'found' }">{{ n }}</span>
              <span v-if="!namesOf(box).length" class="muted">(empty)</span>
            </span>
            <span v-if="stateOf(box, i) === 'found'" class="cl__flag mono">✓ found</span>
            <span v-else-if="stateOf(box, i) === 'checking' || stateOf(box, i) === 'missed'" class="cl__flag mono">✗ not here</span>
            <span v-else-if="stateOf(box, i) === 'skipped'" class="cl__flag mono">skipped by super()</span>
          </li>
        </ol>
      </div>
    </div>
    <div class="cl__out code-panel">
      <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" aria-hidden="true" />output</span></div>
      <pre class="cl__pre">{{ outLines.join('\n') || ' ' }}</pre>
    </div>
    <div class="cl__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="Attribute lookup" />
  </div>
</template>

<style scoped>
.cl {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.cl__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
}
.cl__side .label {
  margin: 0;
}
.cl__graph,
.cl__query {
  margin: 4px 0 8px;
  font-size: 0.75rem;
  color: var(--muted);
}
.cl__query {
  color: var(--text);
}
.cl__chain {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 18px;
  counter-reset: mro;
}
.cl__box {
  position: relative;
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border: var(--border-thin);
  background: var(--surface);
  box-shadow: 3px 3px 0 var(--shadow-color);
  transition: background var(--quick) var(--snap);
}
.cl__box + .cl__box {
  margin: 0;
}
.cl__box + .cl__box::before {
  content: '↓';
  position: absolute;
  top: -19px;
  left: 18px;
  font-weight: 900;
  color: var(--muted);
}
.cl__chain.is-mro .cl__box {
  counter-increment: mro;
}
.cl__chain.is-mro .cl__box::after {
  content: counter(mro);
  position: absolute;
  top: -10px;
  right: -10px;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  background: var(--cobalt);
  color: var(--cobalt-ink);
  border: 2px solid var(--line);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
}
.cl__box--instance {
  background: var(--note-yellow);
}
.cl__kind {
  font-size: 0.65rem;
  color: var(--muted);
}
.cl__box--class .cl__kind {
  font-weight: 800;
  font-size: 0.8rem;
  color: var(--text);
}
.cl__title {
  font-size: 0.85rem;
}
.cl__names {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.72rem;
}
.cl__name {
  padding: 0 5px;
  border: 1.5px solid var(--line);
  background: var(--surface);
}
.cl__name.is-hit {
  background: var(--acid);
  color: var(--acid-ink);
  font-weight: 800;
}
.cl__flag {
  font-size: 0.7rem;
  font-weight: 800;
}
.cl__box.is-checking {
  border-color: var(--cobalt);
  box-shadow: 3px 3px 0 var(--cobalt);
}
.cl__box.is-missed,
.cl__box.is-skipped {
  opacity: 0.5;
}
.cl__box.is-missed .cl__flag,
.cl__box.is-checking .cl__flag {
  color: var(--red-text);
}
.cl__box.is-found {
  background: var(--note-green);
  border-color: var(--green);
  box-shadow: 3px 3px 0 var(--green);
}
.cl__box.is-found .cl__flag {
  color: var(--green);
}
.cl__out {
  box-shadow: none;
}
.cl__pre {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  min-height: 40px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--code-text);
  white-space: pre-wrap;
}
.cl__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.cl__explain :deep(p) {
  margin: 0;
}
@container (max-width: 720px) {
  .cl__grid {
    grid-template-columns: 1fr;
  }
}
</style>

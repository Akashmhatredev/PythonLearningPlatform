<script setup>
// Exception propagation stepper. Each preset is a hand-written walk through how
// CPython unwinds the call stack for the snippet; the printed output and the
// traceback were captured by running the code.
import { computed } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'uncaught' },
})

const CONFIG = `def parse_port(text):
    return int(text)

def load_config(raw):
    port = parse_port(raw["port"])
    return {"port": port}
`
const ERR = "ValueError: invalid literal for int() with base 10: 'eighty'"

const PRESETS = {
  uncaught: {
    code: `${CONFIG}
def main():
    config = load_config({"port": "eighty"})
    print("Listening on", config["port"])

main()`,
    steps: [
      { line: 12, stack: ['<module>'], text: 'The program calls `main()`. Each call pushes a **frame** onto the call stack.' },
      { line: 9, stack: ['<module>', 'main()'], text: '`main()` calls `load_config(...)` — another frame on top.' },
      { line: 5, stack: ['<module>', 'main()', 'load_config()'], text: '`load_config()` calls `parse_port("eighty")`.' },
      { line: 2, stack: ['<module>', 'main()', 'load_config()', 'parse_port()'], exc: 3, text: '`int("eighty")` can’t make a number, so it **raises** a `ValueError`. Normal execution stops right here.' },
      { line: 5, stack: ['<module>', 'main()', 'load_config()'], exc: 2, popped: 'parse_port()', text: '`parse_port()` has no `try`/`except`, so its frame is thrown away and the exception moves **up** to the caller, `load_config()`.' },
      { line: 9, stack: ['<module>', 'main()'], exc: 1, popped: 'load_config()', text: '`load_config()` doesn’t handle it either: popped. The `return` on line 6 never runs.' },
      { line: 12, stack: ['<module>'], exc: 0, popped: 'main()', text: '`main()` has no handler, so line 10 (`print`) is skipped too. The exception reaches the top level.' },
      {
        line: 12,
        stack: [],
        crash: true,
        out: ['Traceback (most recent call last):', '  File "main.py", line 12, in <module>', '  File "main.py", line 9, in main', '  File "main.py", line 5, in load_config', '  File "main.py", line 2, in parse_port', ERR],
        text: 'Nobody caught it, so Python prints a **traceback** — the path the exception travelled, oldest call first, newest last — and the program stops. Read it bottom-up: the last line says what went wrong.',
      },
    ],
  },
  caught: {
    code: `${CONFIG}
def main():
    try:
        config = load_config({"port": "eighty"})
    except ValueError as err:
        print("Bad config:", err)
        config = {"port": 8080}
    print("Listening on", config["port"])

main()`,
    steps: [
      { line: 16, stack: ['<module>'], text: 'Same program, but `main()` now wraps the risky call in `try`.' },
      { line: 10, stack: ['<module>', 'main()'], handler: 1, text: 'Entering the `try` block registers a **handler** for `ValueError` in `main()`’s frame (marked 🛡).' },
      { line: 5, stack: ['<module>', 'main()', 'load_config()'], handler: 1, text: '`load_config()` → `parse_port()`…' },
      { line: 2, stack: ['<module>', 'main()', 'load_config()', 'parse_port()'], handler: 1, exc: 3, text: '`int("eighty")` raises `ValueError`.' },
      { line: 5, stack: ['<module>', 'main()', 'load_config()'], handler: 1, exc: 2, popped: 'parse_port()', text: 'No handler in `parse_port()`: popped, the exception climbs.' },
      { line: 10, stack: ['<module>', 'main()'], handler: 1, exc: 1, popped: 'load_config()', text: 'No handler in `load_config()`: popped. Now it reaches `main()`, which **has** a matching `except ValueError`.' },
      { line: 12, stack: ['<module>', 'main()'], caught: 1, out: ["Bad config: invalid literal for int() with base 10: 'eighty'"], text: 'Caught! The exception object is bound to `err` and the `except` block runs. The exception is now *handled* — it stops travelling.' },
      { line: 14, stack: ['<module>', 'main()'], out: ["Bad config: invalid literal for int() with base 10: 'eighty'", 'Listening on 8080'], text: 'Execution continues **after** the `try` statement as if nothing went wrong — with the fallback config.' },
    ],
  },
  finally: {
    code: `def parse(path):
    raise ValueError(f"{path}: line 3 is broken")

def read_settings(path):
    print("open", path)
    try:
        return parse(path)
    finally:
        print("close", path)

try:
    read_settings("settings.ini")
except ValueError as err:
    print("caught:", err)`,
    steps: [
      { line: 12, stack: ['<module>'], handler: 0, text: 'The top level calls `read_settings()` inside a `try` with an `except ValueError` (🛡).' },
      { line: 5, stack: ['<module>', 'read_settings()'], handler: 0, out: ['open settings.ini'], text: '`read_settings()` “opens” the file…' },
      { line: 7, stack: ['<module>', 'read_settings()'], handler: 0, fin: 1, out: ['open settings.ini'], text: '…and enters a `try` that has a **`finally`** clause (marked ⟲): code that must run no matter how the block exits.' },
      { line: 2, stack: ['<module>', 'read_settings()', 'parse()'], handler: 0, fin: 1, exc: 2, out: ['open settings.ini'], text: '`parse()` raises `ValueError`.' },
      { line: 9, stack: ['<module>', 'read_settings()'], handler: 0, fin: 1, exc: 1, popped: 'parse()', out: ['open settings.ini', 'close settings.ini'], text: 'The exception arrives in `read_settings()`. There’s no `except` here, but before the frame is left, the **`finally` block runs** — the file gets closed.' },
      { line: 13, stack: ['<module>'], handler: 0, exc: 0, popped: 'read_settings()', out: ['open settings.ini', 'close settings.ini'], text: 'After `finally`, the exception carries on upward, unchanged. The top-level handler matches.' },
      { line: 14, stack: ['<module>'], caught: 0, out: ['open settings.ini', 'close settings.ini', 'caught: settings.ini: line 3 is broken'], text: 'Handled. `finally` guarantees cleanup — and the `with` statement uses the same mechanism for files and locks.' },
    ],
  },
  reraise: {
    code: `def charge(card, amount):
    raise ConnectionError("payment gateway timed out")

def checkout(card, amount):
    try:
        charge(card, amount)
    except ConnectionError as err:
        print("log: charge failed:", err)
        raise RuntimeError("checkout failed, please retry") from err

try:
    checkout("4242", 30)
except RuntimeError as err:
    print("user sees:", err)
    print("caused by:", repr(err.__cause__))`,
    steps: [
      { line: 12, stack: ['<module>'], handler: 0, text: 'The top level is ready to catch `RuntimeError` (🛡).' },
      { line: 6, stack: ['<module>', 'checkout()'], handler: 0, handler2: 1, text: '`checkout()` calls `charge()` inside its own `try`, which catches `ConnectionError` (🛡).' },
      { line: 2, stack: ['<module>', 'checkout()', 'charge()'], handler: 0, handler2: 1, exc: 2, excName: 'ConnectionError', text: '`charge()` raises **ConnectionError**.' },
      { line: 8, stack: ['<module>', 'checkout()'], handler: 0, caught: 1, out: ['log: charge failed: payment gateway timed out'], text: '`checkout()` catches it and logs the low-level detail.' },
      { line: 9, stack: ['<module>', 'checkout()'], handler: 0, exc: 1, excName: 'RuntimeError ← ConnectionError', out: ['log: charge failed: payment gateway timed out'], text: 'Then it raises a **new**, higher-level `RuntimeError` **from** the original. `from err` stores the original as `__cause__`, so no information is lost.' },
      { line: 13, stack: ['<module>'], handler: 0, exc: 0, excName: 'RuntimeError ← ConnectionError', popped: 'checkout()', out: ['log: charge failed: payment gateway timed out'], text: '`checkout()` is popped; the `RuntimeError` reaches the top-level handler.' },
      { line: 15, stack: ['<module>'], caught: 0, out: ['log: charge failed: payment gateway timed out', 'user sees: checkout failed, please retry', "caused by: ConnectionError('payment gateway timed out')"], text: 'The caller sees a clear, domain-level error, and can still inspect the root cause. If uncaught, the traceback would show both, joined by *“The above exception was the direct cause of the following exception”*.' },
    ],
  },
}

const def = PRESETS[props.preset] ?? PRESETS.uncaught
const player = useStepPlayer(() => def.steps, { interval: 2600 })
const step = computed(() => player.frame.value ?? def.steps[0])
const outLines = computed(() => {
  for (let i = player.index.value; i >= 0; i--) if (def.steps[i].out) return def.steps[i].out
  return []
})
const frames = computed(() => [...step.value.stack].map((name, i) => ({ name, i })).reverse())
const excLabel = computed(() => step.value.excName ?? (props.preset === 'reraise' ? 'ConnectionError' : 'ValueError'))
</script>

<template>
  <div class="ef">
    <div class="ef__grid">
      <CodeBlock :code="def.code" lang="python" title="main.py" :highlight="[step.line]" :copyable="false" />
      <div class="ef__stack">
        <p class="label">call stack <span class="muted">· newest on top</span></p>
        <ol class="ef__frames" reversed>
          <li v-if="step.popped" :key="`popped-${player.index.value}`" class="ef__frame ef__frame--popped" aria-label="frame removed">
            {{ step.popped }} <span class="ef__tag mono">popped</span>
          </li>
          <li
            v-for="f in frames"
            :key="f.name + f.i"
            class="ef__frame"
            :class="{ 'has-exc': step.exc === f.i, 'is-caught': step.caught === f.i }"
          >
            <span class="ef__fname mono">{{ f.name }}</span>
            <span v-if="step.handler === f.i || step.handler2 === f.i" class="ef__badge" title="has an except handler">🛡 except</span>
            <span v-if="step.fin === f.i" class="ef__badge" title="has a finally clause">⟲ finally</span>
            <span v-if="step.exc === f.i" class="ef__exc mono">⚡ {{ excLabel }}</span>
            <span v-if="step.caught === f.i" class="ef__ok mono">✓ handled</span>
          </li>
          <li v-if="!frames.length" class="ef__empty mono">{{ step.crash ? 'program stopped' : 'empty' }}</li>
        </ol>
      </div>
    </div>
    <div class="ef__out code-panel" :class="{ 'is-crash': step.crash }">
      <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" aria-hidden="true" />output</span></div>
      <pre class="ef__pre">{{ outLines.join('\n') || ' ' }}</pre>
    </div>
    <div class="ef__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="Exception propagation" />
  </div>
</template>

<style scoped>
.ef {
  display: grid;
  container-type: inline-size; /* layout follows the visual's own width (lesson columns are narrow) */
  gap: var(--s-3);
}
.ef__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: var(--s-3);
  align-items: start;
}
.ef__stack .label {
  margin: 0 0 6px;
}
.ef__frames {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.ef__frame {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: var(--border-thin);
  background: var(--surface);
  box-shadow: 3px 3px 0 var(--shadow-color);
  animation: drop 220ms steps(3);
}
.ef__frame + .ef__frame {
  margin: 0;
}
.ef__fname {
  font-weight: 800;
  font-size: 0.85rem;
}
.ef__frame.has-exc {
  border-color: var(--red);
  background: color-mix(in srgb, var(--red) 12%, var(--surface));
  box-shadow: 3px 3px 0 var(--red);
}
.ef__frame.is-caught {
  background: var(--note-green);
  border-color: var(--green);
}
.ef__frame--popped {
  opacity: 0.45;
  text-decoration: line-through;
  border-style: dashed;
  box-shadow: none;
  font-family: var(--font-mono);
  font-size: 0.8rem;
}
.ef__tag {
  font-size: 0.65rem;
  text-decoration: none;
}
.ef__badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border: 1.5px solid var(--cobalt-text);
  color: var(--cobalt-text);
}
.ef__exc {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--red-text);
  flex-basis: 100%;
}
.ef__ok {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--green);
}
.ef__empty {
  font-size: 0.8rem;
  color: var(--muted);
  padding: 8px;
}
.ef__out {
  box-shadow: none;
}
.ef__out.is-crash .ef__pre {
  color: #ffb4a6;
}
.ef__pre {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  min-height: 52px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--code-text);
  white-space: pre-wrap;
}
.ef__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.ef__explain :deep(p) {
  margin: 0;
}
@keyframes drop {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
}
@container (max-width: 720px) {
  .ef__grid {
    grid-template-columns: 1fr;
  }
}
</style>

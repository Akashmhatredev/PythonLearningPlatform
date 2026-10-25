<script setup>
// The program's global variables after the run finished: name, type and repr().
// Read straight from the interpreter, so it shows exactly what Python holds.
defineProps({
  state: { type: Array, default: null }, // [{ name, type, value }]
})
</script>

<template>
  <div class="inspector">
    <p v-if="!state" class="inspector__empty">Run the code to see the variables your program created.</p>
    <p v-else-if="!state.length" class="inspector__empty">The program didn't create any global variables.</p>
    <table v-else class="inspector__table">
      <caption class="visually-hidden">Global variables after the program finished</caption>
      <thead>
        <tr>
          <th scope="col">name</th>
          <th scope="col">type</th>
          <th scope="col">value (repr)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in state" :key="v.name">
          <th scope="row" class="mono">{{ v.name }}</th>
          <td><span class="kind" :class="`kind--${v.type}`">{{ v.type }}</span></td>
          <td><pre class="inspector__val">{{ v.value }}</pre></td>
        </tr>
      </tbody>
    </table>
    <p v-if="state && state.length" class="inspector__hint">Values as they were when the program finished (or crashed).</p>
  </div>
</template>

<style scoped>
.inspector {
  height: 100%;
  overflow: auto;
  background: var(--code-bg);
  color: var(--code-text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.inspector__empty,
.inspector__hint {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  color: var(--code-muted);
}
.inspector__table {
  width: 100%;
  border-collapse: collapse;
}
.inspector__table th,
.inspector__table td {
  text-align: left;
  vertical-align: top;
  padding: 6px var(--s-3);
  border-bottom: 1px solid var(--code-line);
}
.inspector__table thead th {
  color: var(--code-muted);
  font-weight: 700;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.inspector__table tbody th {
  color: #9fd8ff;
  font-weight: 700;
}
.kind {
  display: inline-block;
  padding: 0 6px;
  border: 1.5px solid currentColor;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  color: var(--code-muted);
}
.kind--int,
.kind--float,
.kind--bool {
  color: #9fd8ff;
}
.kind--str {
  color: #b8f2a0;
}
.kind--list,
.kind--dict,
.kind--tuple,
.kind--set {
  color: var(--acid);
}
.kind--function,
.kind--class {
  color: #c9b8ff;
}
.inspector__val {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font: inherit;
  color: #ffe08a;
}
</style>

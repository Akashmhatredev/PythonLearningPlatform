<script setup>
// Runs a lesson quiz. The score uses first-try results on auto-graded
// questions only; self-assessed answers are reported separately.
import { computed, reactive, ref } from 'vue'
import { RotateCcw } from 'lucide-vue-next'
import QuizQuestion from './QuizQuestion.vue'
import { isAutoGradable, scoreQuiz } from '../../utils/grading.js'
import { useProgressStore } from '../../stores/progress.js'
import { DEFAULT_QUIZ_PASS } from '../../utils/learning.js'

const props = defineProps({
  questions: { type: Array, required: true },
  lessonId: { type: String, required: true },
  pass: { type: Number, default: DEFAULT_QUIZ_PASS },
})

const progress = useProgressStore()
const attemptKey = ref(0)
const firstTry = reactive({})
const selfRatings = reactive({})
const recorded = ref(false)

const gradable = computed(() => props.questions.filter(isAutoGradable))
const answeredAll = computed(() => gradable.value.every((q) => q.id in firstTry))
const score = computed(() => scoreQuiz(props.questions, firstTry))
const best = computed(() => progress.lessonState(props.lessonId)?.quiz?.best ?? null)
const attempts = computed(() => progress.lessonState(props.lessonId)?.quiz?.attempts?.length ?? 0)

function onGraded({ id, correct, grading, rating }) {
  if (grading === 'self') {
    selfRatings[id] = rating
    return
  }
  if (id in firstTry) return
  firstTry[id] = correct
  if (answeredAll.value && !recorded.value) {
    recorded.value = true
    progress.recordQuizAttempt(props.lessonId, {
      correct: score.value.correct,
      total: score.value.total,
      ratio: score.value.ratio,
      firstTry: { ...firstTry },
      selfRated: { ...selfRatings },
    })
  }
}

function retake() {
  for (const k of Object.keys(firstTry)) delete firstTry[k]
  for (const k of Object.keys(selfRatings)) delete selfRatings[k]
  recorded.value = false
  attemptKey.value++
}
</script>

<template>
  <div class="quiz">
    <div class="quiz__meta">
      <span class="label">{{ gradable.length }} auto-graded · {{ questions.length - gradable.length }} self-assessed</span>
      <span v-if="best !== null" class="label">best so far {{ Math.round(best * 100) }}% · {{ attempts }} attempt{{ attempts === 1 ? '' : 's' }}</span>
    </div>
    <div :key="attemptKey" class="quiz__list">
      <QuizQuestion v-for="(q, i) in questions" :key="q.id" :question="q" :number="i + 1" @graded="onGraded" />
    </div>

    <div v-if="answeredAll && gradable.length" class="quiz__score" role="status">
      <div class="quiz__big" :class="score.ratio >= pass ? 'is-pass' : 'is-fail'">
        {{ score.correct }}/{{ score.total }}
      </div>
      <div>
        <p class="quiz__verdict">
          <strong v-if="score.ratio >= pass">Passed.</strong>
          <strong v-else>Not yet — {{ Math.round(pass * 100) }}% needed.</strong>
          First-try score: {{ Math.round(score.ratio * 100) }}% <span class="chip">auto-graded</span>
        </p>
        <p v-if="score.ratio < pass" class="muted">
          Re-read the sections behind the questions you missed, then retake. Lessons with low quiz scores appear in your revision list.
        </p>
        <button type="button" class="btn btn--sm" @click="retake"><RotateCcw :size="14" aria-hidden="true" /> Retake quiz</button>
      </div>
    </div>
    <p v-else class="quiz__todo muted">Answer every auto-graded question to record a score ({{ Object.keys(firstTry).length }}/{{ gradable.length }} done).</p>
  </div>
</template>

<style scoped>
.quiz__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--s-2);
  margin-bottom: var(--s-4);
  color: var(--muted);
}
.quiz__list {
  display: grid;
  gap: var(--s-5);
}
.quiz__score {
  display: flex;
  gap: var(--s-5);
  align-items: center;
  margin-top: var(--s-6);
  padding: var(--s-5);
  border: var(--border);
  background: var(--note);
  box-shadow: var(--shadow);
}
.quiz__big {
  font-family: var(--font-display);
  font-weight: 900;
  font-stretch: 125%;
  font-size: var(--step-4);
  line-height: 1;
  padding: var(--s-2) var(--s-4);
  border: var(--border);
  transform: rotate(-3deg);
}
.quiz__big.is-pass {
  background: var(--acid);
  color: var(--acid-ink);
}
.quiz__big.is-fail {
  background: var(--red);
  color: #fff;
}
.quiz__verdict {
  font-size: 1.05rem;
}
.quiz__todo {
  margin-top: var(--s-4);
}
@media (max-width: 600px) {
  .quiz__score {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

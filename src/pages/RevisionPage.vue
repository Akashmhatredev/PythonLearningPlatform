<script setup>
import { computed, onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Play } from 'lucide-vue-next'
import { contentIndex, loadQuestionBank } from '../content/index.js'
import { useInterviewStore } from '../stores/interview.js'
import { useProgressStore } from '../stores/progress.js'
import { lessonsNeedingRevision, revisionQueue } from '../utils/learning.js'
import QuestionCard from '../components/interview/QuestionCard.vue'
import StateBlock from '../components/ui/StateBlock.vue'

const router = useRouter()
const interview = useInterviewStore()
const progress = useProgressStore()
const bank = shallowRef(null)
onMounted(async () => (bank.value = await loadQuestionBank()))

const queue = computed(() => (bank.value ? revisionQueue(bank.value, { questionStats: interview.state.stats, progress: progress.state }) : []))
const lessons = computed(() =>
  bank.value
    ? lessonsNeedingRevision(contentIndex, progress.state, {
        questionStats: interview.state.stats,
        questionLesson: Object.fromEntries(bank.value.map((q) => [q.id, q.lesson])),
      })
    : [],
)

function practiceWeak() {
  const ids = queue.value.slice(0, 10).map((x) => x.question.id)
  if (!ids.length) return
  const sid = interview.startSession({ mode: 'practice', minutes: null, source: 'weak' }, ids)
  router.push(`/interview/session/${sid}`)
}
</script>

<template>
  <div class="page rev">
    <header class="page-head">
      <span class="label">revision queue</span>
      <h1>Your weak spots,<br />in priority order.</h1>
      <p class="rev__lead">
        Built from your own history: questions you got wrong or flagged, topics with low quiz scores, topics you haven’t revisited, and advanced questions on things you’ve finished. Each item says why it’s here.
      </p>
      <div>
        <button type="button" class="btn btn--cobalt btn--lg" :disabled="!queue.length" @click="practiceWeak"><Play :size="18" aria-hidden="true" /> Practice my weak areas</button>
      </div>
    </header>

    <StateBlock v-if="!bank" kind="loading" title="Building your queue…" />
    <template v-else>
      <section class="rev__section">
        <h2 class="rev__h">Lessons to revisit</h2>
        <p v-if="!lessons.length" class="muted">No lessons need revision right now.</p>
        <ul class="rev__lessons">
          <li v-for="l in lessons" :key="l.id">
            <RouterLink :to="contentIndex.lessons[l.id].path" class="rev__lesson">{{ contentIndex.lessons[l.id].title }}</RouterLink>
            <span class="muted">{{ l.reasons.join(' · ') }}</span>
          </li>
        </ul>
      </section>

      <section class="rev__section">
        <h2 class="rev__h">Questions to practise ({{ queue.length }})</h2>
        <StateBlock v-if="!queue.length" kind="empty" title="Nothing queued yet">
          <p>Answer some interview questions or take lesson quizzes — anything you miss or flag will show up here with the reason.</p>
          <RouterLink to="/interview" class="btn btn--sm">Go to interview mode</RouterLink>
        </StateBlock>
        <ol v-else class="rev__queue">
          <li v-for="item in queue.slice(0, 30)" :key="item.question.id" class="rev__item">
            <p class="rev__why">
              <span class="rev__score mono" :title="`priority score ${item.score}`">{{ item.score }}</span>
              <span>{{ item.reasons.join(' · ') }}</span>
            </p>
            <QuestionCard :question="item.question" compact />
          </li>
        </ol>
      </section>
    </template>
  </div>
</template>

<style scoped>
.rev__lead {
  max-width: 64ch;
  font-size: var(--step-1);
  color: var(--text-soft);
}
.rev__section {
  margin-bottom: var(--s-7);
}
.rev__h {
  font-size: var(--step-2);
}
.rev__lessons {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--s-2);
}
.rev__lessons li {
  margin: 0;
  display: grid;
  gap: 2px;
  padding: var(--s-3) var(--s-4);
  border: var(--border-thin);
  background: var(--note-yellow);
}
.rev__lesson {
  font-weight: 800;
}
.rev__queue {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--s-5);
}
.rev__item {
  margin: 0;
}
.rev__why {
  display: flex;
  gap: var(--s-2);
  align-items: center;
  margin: 0 0 var(--s-2);
  font-size: 0.88rem;
  font-weight: 600;
}
.rev__score {
  background: var(--red);
  color: #fff;
  padding: 1px 7px;
  font-weight: 800;
}
</style>

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const ANSWER_COACH = py`# Answer coach: checks a practice answer against the five-part framework.
# Simplified on purpose: it spots *structure* from keyword cues. It cannot tell
# whether what you said is true - only a person (or you, re-checking) can.

QUESTION = "What is the difference between a list and a tuple?"

ANSWER = """
A list is a mutable sequence, while a tuple is an immutable one.
This matters because only immutable, hashable objects can be dict keys.
Under the hood both store references to other objects, but a tuple's size is fixed.
For example, I store a GPS point as a tuple: (51.5, -0.12).
"""

CHECKLIST = {
    "define": ["is a", "is an", "means", "refers to"],
    "why": ["because", "matters", "so that", "exists to"],
    "how": ["under the hood", "internally", "works by", "stores"],
    "example": ["for example", "for instance", "such as"],
    "trade-off": ["trade-off", "downside", "however", "the cost", "instead"],
}

WORDS_PER_MINUTE = 150  # a placeholder: time yourself reading aloud and use your pace


def sentences(text):
    """Split text into sentences at '. ' (simplified: no abbreviations)."""
    parts = text.replace("\n", " ").split(". ")
    return [p.strip().rstrip(".") for p in parts if p.strip()]


def find_parts(answer, checklist):
    """Map each part to the first sentence containing one of its cues, or None."""
    found = {}
    for part, cues in checklist.items():
        found[part] = None
        for sentence in sentences(answer):
            if any(cue in sentence.lower() for cue in cues):
                found[part] = sentence
                break
    return found


def speaking_time(answer, wpm=WORDS_PER_MINUTE):
    """Return (word count, estimated seconds to say it aloud)."""
    words = len(answer.split())
    return words, round(words / wpm * 60)


def report(question, answer):
    found = find_parts(answer, CHECKLIST)
    score = sum(1 for sentence in found.values() if sentence)
    words, seconds = speaking_time(answer)
    print(f"Q: {question}")
    print(f"Structure: {score}/{len(CHECKLIST)} parts found")
    for part, sentence in found.items():
        mark = "x" if sentence else " "
        text = sentence or "missing"
        if len(text) > 44:
            text = text[:44] + "..."
        print(f"  [{mark}] {part:<10}{text}")
    print(f"Length: {words} words, about {seconds} s aloud")
    return score


score = report(QUESTION, ANSWER)
`

export default {
  id: 'answering-framework',
  title: 'How to answer Python interview questions',
  summary: 'A repeatable shape for technical answers — define, why, how, example, trade-off — plus clarifying questions, thinking aloud and honest "I don\'t know"s.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['defining-functions', 'dictionaries'],
  related: ['coding-patterns', 'debugging-scenarios', 'rapid-review', 'clean-code', 'debugging', 'testing-fundamentals', 'main-guard-and-scripts'],
  tags: ['interview', 'interviews', 'answering questions', 'communication', 'framework', 'clarifying questions', 'thinking aloud', 'STAR', 'behavioural', 'technical interview', 'trade-offs', 'live coding', "I don't know"],
  apis: [
    { name: 'Define → Why → How → Example → Trade-off', summary: 'The five-part shape for answering a technical concept question.' },
    { name: 'STAR (Situation, Task, Action, Result)', summary: 'The four-part shape for behavioural "tell me about a time" questions.' },
    { name: 'Clarify → Examples → Approach → Code → Test → Complexity', summary: 'The loop for live coding questions.' },
  ],
  docs: [
    { label: 'The Python Tutorial (official) — the vocabulary interviewers expect', url: 'https://docs.python.org/3/tutorial/index.html' },
    { label: 'Python glossary — precise definitions of common terms', url: 'https://docs.python.org/3/glossary.html' },
    { label: 'Python FAQ — design and history (why Python works the way it does)', url: 'https://docs.python.org/3/faq/design.html' },
    { label: "What's New in Python — version changes worth knowing", url: 'https://docs.python.org/3/whatsnew/index.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`An **interview answer** is a tiny presentation. The interviewer can't see inside your head — they only hear what you say and see what you type. Two people with exactly the same knowledge can get very different results depending on *how* they explain it.`,
    py`This lesson gives you three reusable shapes (*frameworks* — fixed outlines you fill in):`,
    py`1. **Technical concept questions** ("What is a tuple?") → **define → why → how → example → trade-off**.
2. **Coding questions** ("Write a function that…") → **clarify → examples → approach → code → test → complexity**.
3. **Behavioural questions** ("Tell me about a time…") → **STAR: situation → task → action → result**.`,
    py`You'll also practise the skills around them: asking *clarifying questions*, *thinking aloud* while you code, saying "I don't know" without sinking, and correcting yourself gracefully. The other lessons in this level drill the content: [coding patterns](lesson:coding-patterns), [debugging drills](lesson:debugging-scenarios) and the [rapid review](lesson:rapid-review).`,
  ],
  why: [
    py`Interviewers are trying to predict what it would be like to work with you. Clear structure is evidence of clear thinking, and talking through your reasoning shows *how* you solve problems, not just whether you happen to remember the answer.`,
    py`A framework also protects you from nerves. When your mind goes blank, "first I'll define it" is an easy first step — and by the time you've said the definition, the rest usually comes back.`,
    py`Finally, structure saves time. A typical technical interview has many questions to get through. A crisp answer that hits all five parts in under two minutes leaves room for the follow-ups where you really get to show depth.`,
  ],
  eli15: [
    py`Imagine explaining a new board game to a friend. If you start with obscure rule 14, they're lost. If you say "it's a racing game (**what**), you're trying to get home first (**why**), you roll dice and move (**how**), like when I land on a ladder I climb it (**example**), but it's mostly luck so it gets boring for grown-ups (**trade-off**)" — they get it in thirty seconds.`,
    py`Interview answers work the same way. Say what the thing *is*, why it *exists*, how it *works*, show a tiny *example*, and finish with when it's *not* the right choice. That last part is what makes you sound like someone who has actually used it.`,
    py`And if you don't know something? Say so, then say what you *do* know and how you'd find out. Teachers and interviewers both prefer an honest "I'm not sure, but here's my guess and why" to a confident wrong answer.`,
  ],
  analogy: {
    title: 'A good tour guide',
    body: [
      py`A good tour guide stops in front of a building and says: "This is the old town hall (*define*). It was built so the merchants had somewhere neutral to settle disputes (*why*). Notice the thick walls — they kept the archives safe from fire (*how*). The famous 1700s trial happened in that room (*example*). It's beautiful, but the stairs mean it's not wheelchair-friendly, so the council moved out (*trade-off*)."`,
      py`The guide also checks the group first ("Have you all seen the cathedral already?") — that's a **clarifying question**. And when someone asks something the guide doesn't know, a good one says "I'm not certain — I think it was rebuilt after the fire, I'll check," rather than inventing a date.`,
    ],
    mapping: [
      ['"This is the old town hall"', 'define: one sentence saying what the concept is'],
      ['"built so merchants could settle disputes"', 'why: the problem it solves'],
      ['"thick walls kept the archives safe"', 'how: the mechanism underneath'],
      ['"the famous trial happened here"', 'example: concrete code or a real use'],
      ['"not wheelchair-friendly, so they moved"', 'trade-off: limits and alternatives'],
      ['"Have you seen the cathedral?"', 'clarifying question before answering'],
      ['"I think…, I\'ll check"', 'an honest partial answer instead of a bluff'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The five-part answer',
    props: {
      width: 760,
      height: 260,
      layout: 'row',
      nodes: [
        { id: 'define', label: 'Define', note: 'what it is', tone: 'yellow' },
        { id: 'why', label: 'Why', note: 'problem it solves', tone: 'blue' },
        { id: 'how', label: 'How', note: 'mechanism', tone: 'paper' },
        { id: 'example', label: 'Example', note: 'tiny code', tone: 'kraft' },
        { id: 'tradeoff', label: 'Trade-off', note: 'limits & alternatives', tone: 'red' },
      ],
      edges: [
        { from: 'define', to: 'why' },
        { from: 'why', to: 'how' },
        { from: 'how', to: 'example' },
        { from: 'example', to: 'tradeoff' },
      ],
      steps: [
        { focus: ['define'], text: py`**Question:** "What is a set?" **Define** in one sentence: *"A set is an unordered collection of unique, hashable items."* Answer first — no warm-up paragraph.` },
        { focus: ['why'], edges: ['define->why'], text: py`**Why** it exists: *"It's for fast membership tests and removing duplicates — checking \`x in my_set\` doesn't scan the whole collection."*` },
        { focus: ['how'], edges: ['why->how'], text: py`**How** it works: *"Under the hood it's a hash table: Python hashes the item to find where it should live, so a lookup is O(1) on average."* (See [sets](lesson:sets) and [dictionaries](lesson:dictionaries).)` },
        { focus: ['example'], edges: ['how->example'], text: py`**Example**, short enough to say aloud: *"If I've got a list of visitor emails, \`len(set(emails))\` gives me the number of unique visitors."*` },
        { focus: ['tradeoff'], edges: ['example->tradeoff'], text: py`**Trade-off**: *"The cost is that items must be hashable, so no lists inside, and you lose order — if I need unique items in their original order I'd use \`dict.fromkeys(items)\`."* Then **stop** and let them steer.` },
      ],
    },
    alt: 'Five boxes in a row joined by arrows: Define, Why, How, Example, Trade-off. Stepping through fills each box with one sentence of an answer to "What is a set?": a definition, the reason sets exist (fast membership and de-duplication), the hash-table mechanism, an example counting unique emails, and the trade-off that items must be hashable and order is lost.',
    caption: py`Five sentences, about thirty seconds. Each step is a place the interviewer can jump in with a follow-up — which is exactly what you want.`,
  },
  syntax: [
    py`#### 1. Technical concept questions: define → why → how → example → trade-off`,
    py`| part | what to say | sentence starter |
|---|---|---|
| **Define** | one sentence, precise vocabulary | "A ___ is a ___ that ___." |
| **Why** | the problem it solves | "It exists because…" / "This matters because…" |
| **How** | the mechanism, one level down | "Under the hood…" / "When you call it, Python…" |
| **Example** | tiny, realistic code or use case | "For example, in a shopping cart I'd…" |
| **Trade-off** | limits, costs, alternatives | "The downside is… so when ___ I'd use ___ instead." |`,
    { code: py`# "What does if __name__ == '__main__' do?" — the code you'd sketch for the example part
def main():
    print("running as a script")


if __name__ == "__main__":   # True only when this file is run directly
    main()                    # importing the module does NOT call main()`, lang: 'python', title: 'an example small enough to type while you talk' },
    py`#### 2. Coding questions: clarify → examples → approach → code → test → complexity`,
    py`1. **Clarify** inputs, outputs and edge cases: "Can the list be empty? Should I keep the original order? Can I modify the input?"
2. **Examples**: write one normal and one edge-case example *before* coding — they become your tests.
3. **Approach**: say the simple (brute-force) idea first, its cost, then the better one. Get a nod before typing.
4. **Code**: think aloud — name what each block is for, not every keystroke.
5. **Test**: run your examples by hand (or for real), then the edge cases.
6. **Complexity**: state time and space in Big-O, and what dominates. See [coding patterns](lesson:coding-patterns).`,
    py`#### 3. Behavioural questions: STAR`,
    py`- **Situation** — one or two sentences of context ("Our nightly report job…").
- **Task** — what *you* were responsible for.
- **Action** — what *you* did, with technical specifics. This is the longest part.
- **Result** — the outcome (measured if you honestly can) and what you'd do differently.`,
    py`#### 4. When you don't know`,
    py`Use the **honest ladder**: *say so* → *share what you do know nearby* → *reason out loud to a best guess* → *say how you would verify it*. "I haven't used \`__slots__\` myself. I know normal instances keep attributes in a \`__dict__\`, so I'd guess slots replace that with fixed storage to save memory. I'd verify by measuring with \`tracemalloc\`."`,
    { callout: 'tip', title: 'Answer first, then expand', text: py`Lead with the one-sentence answer. If you get cut off after ten seconds, the interviewer should still have heard the right answer. Detail comes after, never before.` },
    { callout: 'note', title: 'Frameworks are scaffolding, not a script', text: py`Real conversations jump around. If the interviewer interrupts after "define", follow them. The framework is there to make sure you *could* cover all five parts, not to force them.` },
  ],
  walkthrough: {
    title: 'How the answer coach works',
    lang: 'python',
    code: ANSWER_COACH,
    intro: py`This is the playground program below. It is deliberately **simple and honest**: it checks whether your answer *has the shape* of a good answer, using keyword cues. It has no idea whether the content is correct. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [5, 12], text: py`The practice question and your answer. The triple-quoted string spans several lines, so you can write a natural spoken answer.` },
      { lines: [14, 20], text: py`The checklist maps each framework part to **cue phrases** — words people tend to use when they're defining (\`"is a"\`), justifying (\`"because"\`), explaining a mechanism (\`"under the hood"\`), giving an example or naming a trade-off.` },
      { lines: [22, 22], text: py`Speaking pace differs from person to person, so this is a placeholder. Read a practice answer aloud with a timer and put your own number here.` },
      { lines: [25, 28], text: py`A **simplified** sentence splitter: it cuts at \`". "\`. Real text has abbreviations like "e.g. ", which would fool it — good enough for practice, not for production NLP.` },
      { lines: [31, 40], text: py`For each part, find the first sentence that contains any of its cues. \`any()\` stops at the first match; \`break\` stops scanning sentences once a part is found. Lower-casing the sentence makes \`"Under the hood"\` match the cue \`"under the hood"\`.` },
      { lines: [49, 62], text: py`\`report()\` prints a checklist: \`[x]\` for found parts with a preview of the sentence, \`[ ]\` for missing ones, then length and estimated speaking time. It returns the score so tests (and you) can use it.` },
      { lines: [65, 65], text: py`Run it: the sample answer gets **4/5** — it never names a trade-off. That's the most commonly skipped part, and the one that separates "has read about it" from "has used it".` },
    ],
  },
  playground: {
    title: 'Answer coach',
    objective: 'Run the coach on the sample answer, then improve the answer — and the coach — until a strong answer scores 5/5.',
    files: { 'main.py': ANSWER_COACH },
    expected: py`A structure report:

\`\`\`text
Q: What is the difference between a list and a tuple?
Structure: 4/5 parts found
  [x] define    A list is a mutable sequence, while a tuple ...
  [x] why       This matters because only immutable, hashabl...
  [x] how       Under the hood both store references to othe...
  [x] example   For example, I store a GPS point as a tuple:...
  [ ] trade-off missing
Length: 51 words, about 20 s aloud
\`\`\`

The coach checks *shape*, not truth: a confident wrong answer with the right keywords would also score 5/5. Use it to practise structure, and check facts against the docs.`,
    experiments: [
      {
        id: 'add-trade-off',
        task: py`Add a fifth sentence to \`ANSWER\` that names a **trade-off** (for example, when you would pick a list instead). Get the coach to report **5/5**.`,
        hint: py`Use one of the trade-off cues: "The downside is…", "However…", or "…so I'd use a list instead."`,
        tests: [
          { name: 'all five parts are found', code: py`assert score == 5, 'The coach should find all five parts — add a trade-off sentence'` },
          { name: 'the report says 5/5', code: py`assert '5/5 parts found' in output` },
        ],
        explain: py`A trade-off sentence such as *"The downside is that tuples can't grow, so for a shopping cart I'd use a list instead"* shows you know when **not** to use the thing. Interviewers listen for that: it's the difference between reciting and having used a tool.`,
      },
      {
        id: 'too-long',
        task: py`Make \`report()\` print a warning line containing \`Too long\` when the estimated speaking time is over **120 seconds**. Short answers must not get the warning.`,
        hint: py`After computing \`seconds\`, add \`if seconds > 120: print("Too long: aim for under 2 minutes")\`.`,
        tests: [
          { name: 'a very long answer gets a warning', code: py`printed = capture(report, QUESTION, ANSWER * 10)
assert 'Too long' in printed, 'Print a line containing "Too long" when seconds > 120'` },
          { name: 'the short sample answer gets no warning', code: py`assert 'Too long' not in output` },
        ],
        explain: py`Long answers aren't automatically better. A first answer of a minute or two leaves room for the interviewer to steer you toward what *they* care about. If they want more, they'll ask — and a follow-up is a chance to show depth.`,
      },
      {
        id: 'fillers',
        task: py`Add a function \`count_fillers(answer)\` that counts the filler words \`um\`, \`uh\`, \`basically\`, \`literally\` and \`actually\` (case-insensitive, ignoring punctuation such as commas). Print \`Fillers: N\` at the end of \`report()\` if you like.`,
        hint: py`Split into words, then clean each one with \`word.strip(",.!?").lower()\` and check membership in a set of fillers.`,
        tests: [
          { name: 'count_fillers exists', code: py`assert callable(ns.get('count_fillers')), 'Define a function named count_fillers(answer)'` },
          { name: 'counts three fillers', code: py`assert count_fillers("Basically, um, a tuple is, uh, immutable.") == 3` },
          { name: 'a clean answer has zero fillers', code: py`assert count_fillers("A tuple is immutable.") == 0` },
        ],
        explain: py`A set of fillers plus \`strip()\` and \`lower()\` handles "Basically," and "Um". Filler words are normal when speaking — but a few seconds of silence while you think usually sounds more confident than "um, basically, like".`,
      },
      {
        id: 'your-answer',
        task: py`Replace \`QUESTION\` with **"What is a decorator?"** and write your own answer that scores at least **4/5**. Then read it aloud with a timer.`,
        hint: py`Define (a decorator *is a* function that wraps another function), why (*because* it adds behaviour without editing the function), how (*works by* returning a new function), example (*for example* a timing decorator), trade-off (*the downside is* hidden behaviour and lost metadata unless you use functools.wraps).`,
        tests: [
          { name: 'the question is about decorators', code: py`assert 'decorator' in QUESTION.lower(), 'Change QUESTION to "What is a decorator?"'` },
          { name: 'your answer scores at least 4/5', code: py`assert score >= 4, f'Your answer scored {score}/5 — add the missing parts'` },
        ],
        explain: py`Writing the answer down and scoring it is a quick self-review loop. The real check is the follow-up: could you write the decorator from your example on a whiteboard? Practise that in [decorators](lesson:decorators).`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The live-coding loop',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'clarify', label: 'Clarify', note: 'inputs, outputs, edge cases', x: 120, y: 90, tone: 'yellow' },
        { id: 'examples', label: 'Examples', note: 'normal + edge case', x: 380, y: 90, tone: 'paper' },
        { id: 'approach', label: 'Approach', note: 'brute force, then better', x: 640, y: 90, tone: 'blue' },
        { id: 'code', label: 'Code', note: 'think aloud', x: 640, y: 240, tone: 'ink' },
        { id: 'test', label: 'Test', note: 'run the examples', x: 380, y: 240, tone: 'kraft' },
        { id: 'complexity', label: 'Complexity', note: 'time & space', x: 120, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'clarify', to: 'examples' },
        { from: 'examples', to: 'approach' },
        { from: 'approach', to: 'code', label: 'agreed?' },
        { from: 'code', to: 'test' },
        { id: 'fix', from: 'test', to: 'code', label: 'bug found', dashed: true },
        { from: 'test', to: 'complexity' },
      ],
      steps: [
        { focus: ['clarify'], text: py`**"Remove duplicates from a list."** Before typing, ask: *keep the original order? Are the items hashable? Return a new list or modify in place?* Each answer changes the solution.` },
        { focus: ['examples'], edges: ['clarify->examples'], text: py`Write examples you can check later: \`[3, 1, 3, 2] → [3, 1, 2]\` and the edge case \`[] → []\`. Examples turn a vague prompt into a spec.` },
        { focus: ['approach'], edges: ['examples->approach'], text: py`Say the approaches out loud: *"Checking each item against a result list is O(n²). A set of seen items makes each check O(1) on average, so O(n) overall. Or \`dict.fromkeys(items)\` does it in one line, because dicts keep insertion order."*` },
        { focus: ['code'], edges: ['approach->code'], text: py`Code while narrating *intent*: "this loop keeps the first time I see each item". Don't read out every character; do explain every decision.` },
        { focus: ['test', 'code'], edges: ['code->test', 'fix'], text: py`Walk your examples through the code. If one fails, say so calmly and fix it — **finding your own bug is a positive signal**, not a failure.` },
        { focus: ['complexity'], edges: ['test->complexity'], text: py`Finish with complexity: *"O(n) time on average and O(n) extra space for the seen set."* Mention what you'd change if the items weren't hashable.` },
      ],
    },
    alt: 'Six boxes arranged in a loop: Clarify, Examples and Approach along the top; Code, Test and Complexity along the bottom. Arrows go Clarify to Examples to Approach to Code to Test to Complexity, with a dashed "bug found" arrow from Test back to Code. Steps walk through answering "remove duplicates from a list".',
    caption: py`The loop for every coding question. The dashed arrow is normal — every good engineer goes round it a few times.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`What is the interviewer actually writing down? Usually a few simple things: **Did they get it right? Could I follow them? Do they know when to use it? Are they honest about gaps? Would they be good to work with?**`,
      py`The five-part framework maps neatly onto those: *define* and *how* show correctness, the *structure* itself shows clarity, *example* and *trade-off* show practical judgement, and the honest ladder covers gaps.`,
      py`Thinking aloud matters because silence gives the interviewer nothing to write. Even "I'm going to try the simple version first and see if it's fast enough" is useful evidence about how you work.`,
    ],
    technical: [
      py`**Depth control.** Every topic has layers. For [\`if __name__ == "__main__"\`](lesson:main-guard-and-scripts): layer 1 — "it runs code only when the file is executed directly"; layer 2 — "Python sets the module attribute \`__name__\` to \`'__main__'\` for the entry script and to the module's name when imported"; layer 3 — "that's how \`python -m package.module\` and console-script entry points find what to run, and why tests can import the module without side effects". Start at layer 1, then offer: *"I can go into how imports set \`__name__\` if that's useful."*`,
      py`**Precise vocabulary is free credibility.** Say *mutable/immutable*, *hashable*, *iterable vs iterator*, *bound method*, *reference*, *namespace*, *O(n) average*. The [Python glossary](https://docs.python.org/3/glossary.html) is a great source of exact one-sentence definitions.`,
      py`**Three kinds of truth.** Good answers say which kind of fact they are stating: a *language guarantee* ("dicts keep insertion order since 3.7"), a *CPython implementation detail* ("small ints from -5 to 256 are cached"), or a *convention* ("a leading underscore means internal"). Mixing them up — e.g. presenting the small-int cache as a language rule — is a classic way to lose points with a senior interviewer.`,
      { callout: 'note', title: 'Rubrics vary', text: py`Every company scores interviews differently, and there's no universal points table. What's consistent is the *kind* of evidence: correctness, communication, problem-solving process, and judgement about trade-offs. Optimise for those, not for any rumoured scoring formula.` },
    ],
    production: [
      py`**Seniority changes the weighting.** For a junior role, a correct definition with a working example is strong. For a senior role, interviewers lean on the *trade-off* and *how* parts: failure modes, performance, maintainability, how it behaves at scale, how you'd test it, and how you'd explain it to a teammate.`,
      py`**Practise out loud, not in your head.** Answers you've only *thought* tend to be twice as long and half as clear when spoken. Record yourself answering three questions a day, listen back, and cut every sentence that doesn't serve one of the five parts. The playground's coach gives you a rough structural check.`,
      py`**Use real stories.** For behavioural questions, prepare four or five STAR stories from your own work or projects (a hard bug, a disagreement, a deadline, a mistake you owned, something you improved). Most behavioural prompts can be answered by adapting one of them. Never invent experience — follow-ups expose it quickly, and honesty is part of what's being assessed.`,
      py`**Verify claims with code.** In a live coding setting, "let me just check" followed by a two-line experiment in the REPL is a strength. It's what professionals do every day.`,
    ],
  },
  mistakes: [
    {
      title: 'Warming up for a minute before answering',
      wrong: { code: py`"So, that's a great question, there are lots of ways to think about it,
and it really depends, and in my last project we had a lot of data and..."`, lang: 'text' },
      right: { code: py`"A generator is a function that produces values lazily with yield.
It exists so you can process large or infinite streams without holding
them in memory. ..."`, lang: 'text' },
      explanation: py`Lead with a one-sentence answer. If the interviewer stops you after ten seconds, they should already have the core of it.`,
    },
    {
      title: 'A definition with no example',
      wrong: { code: py`"A context manager is an object implementing __enter__ and __exit__."`, lang: 'text' },
      right: { code: py`"A context manager sets something up and guarantees it's cleaned up.
For example, 'with open(path) as f:' closes the file even if an
exception is raised inside the block."`, lang: 'text' },
      explanation: py`A memorised definition is easy to fake. A concrete example proves you've used it and gives the interviewer something to ask about.`,
    },
    {
      title: 'Bluffing instead of reasoning',
      wrong: { code: py`"Yes, Python sets are always sorted."`, lang: 'text' },
      right: { code: py`"I don't think order is guaranteed for sets. Small ints can *look*
sorted in CPython because of how they hash, but I wouldn't rely on it.
If I need order, I'd use sorted(my_set) or dict.fromkeys()."`, lang: 'text' },
      explanation: py`A confident wrong answer is worse than an honest partial one. Reasoning aloud from what you do know shows exactly the skill the interviewer wants.`,
    },
    {
      title: 'Coding before clarifying',
      wrong: { code: py`def dedupe(items):
    return list(set(items))   # order lost — was that allowed?`, lang: 'python' },
      right: { code: py`def dedupe(items):
    """Remove duplicates, keeping the first occurrence of each item (asked: order matters)."""
    return list(dict.fromkeys(items))`, lang: 'python' },
      explanation: py`One question — "should I keep the original order?" — changes the solution. Asking it shows you think about requirements before code.`,
    },
    {
      title: 'Absolute claims with no conditions',
      wrong: { code: py`"Always use tuples instead of lists because they're faster."`, lang: 'text' },
      right: { code: py`"Use a tuple for a fixed record that shouldn't change, like coordinates,
and a list for a collection that grows. Speed differences are small;
I'd choose by meaning and measure if performance matters."`, lang: 'text' },
      explanation: py`"Always" and "never" invite the interviewer to find the counter-example. Trade-off language ("when X, I'd use Y") sounds more experienced — because it is.`,
    },
  ],
  debugging: [
    {
      symptom: py`Interviewer: "Can you give me a concrete example?"`,
      cause: py`Your answer stayed abstract — definitions and buzzwords, no code or real use.`,
      fix: py`Always have a two-line example ready. Shopping carts, log files, sensor readings and user records make good, realistic examples.`,
    },
    {
      symptom: py`Interviewer: "Let's move on" while you're still mid-explanation.`,
      cause: py`The answer was too long or drifted from the question.`,
      fix: py`Answer first in one sentence, keep the first answer short, then offer depth: "I can go into how it works internally if that's useful."`,
    },
    {
      symptom: py`Your mind goes blank on a coding question.`,
      cause: py`Trying to see the whole solution at once.`,
      fix: py`Fall back to the loop: restate the problem, write one example by hand, solve the example manually and describe the steps you took — those steps are your algorithm.`,
    },
    {
      symptom: py`Your solution fails the interviewer's test case (e.g. \`ZeroDivisionError: division by zero\` on an empty list).`,
      cause: py`An edge case you didn't clarify or test.`,
      fix: py`Stay calm, say what the input exposes, decide the intended behaviour out loud (raise a clear \`ValueError\`? return \`None\`?), fix it, and add that case to your examples.`,
    },
    {
      symptom: py`Interviewer keeps asking "why?" after each sentence.`,
      cause: py`They're probing depth — your answer stopped at *what* and skipped *why* and *how*.`,
      fix: py`It's a good sign, not a bad one. Go one layer deeper each time, and when you reach the edge of your knowledge, say so and reason from there.`,
    },
  ],
  bestPractices: [
    'Lead with a one-sentence answer, then expand.',
    'Cover define, why, how, example and trade-off for concept questions — and stop when you have.',
    'Ask clarifying questions about inputs, outputs, edge cases and constraints before coding.',
    'Think aloud about decisions, not keystrokes.',
    'Say which kind of fact you are stating: language guarantee, CPython detail, or convention.',
    'When unsure, use the honest ladder: say so, share what you know, reason to a guess, say how you would verify.',
    'Prepare four or five true STAR stories and adapt them to behavioural prompts.',
    'Test your own code with the examples you wrote before coding.',
  ],
  useCases: [
    'Technical phone screens ("What is the difference between a list and a tuple?").',
    'Live coding rounds where you share an editor with the interviewer.',
    'Behavioural rounds ("Tell me about a time you disagreed with a reviewer").',
    'Design discussions where you must compare options and justify a choice.',
    'Explaining a concept to a teammate or in a code review — the same structure works.',
  ],
  whenToUse: {
    use: [
      'Concept questions: the five-part answer.',
      'Coding questions: the clarify → complexity loop.',
      'Behavioural questions: STAR with technical specifics in the Action.',
      'Any time you need to explain a design choice: always end with the trade-off.',
    ],
    avoid: [
      'Forcing all five parts when the interviewer clearly wants a one-line fact.',
      'Reciting a memorised script word for word — it sounds robotic and breaks on follow-ups.',
      'Asking clarifying questions you could answer yourself from the prompt, just to stall.',
    ],
  },
  comparison: {
    title: 'Three kinds of question, three shapes',
    headers: ['', 'Technical concept', 'Coding problem', 'Behavioural'],
    rows: [
      ['example prompt', '"What is a generator?"', '"Write a function to merge two sorted lists."', '"Tell me about a bug you\'re proud of fixing."'],
      ['shape', 'define → why → how → example → trade-off', 'clarify → examples → approach → code → test → complexity', 'situation → task → action → result'],
      ['opening move', 'a one-sentence definition', 'a clarifying question', 'one sentence of context'],
      ['evidence', 'a tiny code example', 'working, tested code', 'specific things you did'],
      ['ends with', 'a trade-off or alternative', 'time and space complexity', 'the result and what you learned'],
      ['typical length', 'short, then follow-ups', 'most of the slot', 'a couple of minutes'],
    ],
    note: py`The shapes overlap: a behavioural answer's *Action* is full of technical detail, and a coding answer explains trade-offs between approaches.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'answering-framework-q1',
      type: 'mcq',
      prompt: 'Which order does the five-part framework for a technical concept question use?',
      options: [
        { text: 'Example → define → trade-off → why → how', why: 'Starting with an example before saying what the thing is leaves the listener guessing what the example shows.' },
        'Define → why → how → example → trade-off',
        { text: 'How → define → example → why → trade-off', why: 'Starting with the mechanism buries the answer. Lead with the one-sentence definition.' },
        { text: 'Trade-off → define → why → how → example', why: 'Opening with limitations sounds defensive and delays the actual answer.' },
      ],
      answer: 1,
      explanation: py`Answer first (define), then motivation (why), mechanism (how), evidence (example) and judgement (trade-off). Each step builds on the one before.`,
    },
    {
      id: 'answering-framework-q2',
      type: 'output',
      prompt: 'A practice tool tracks which parts of the framework you said. What does it print?',
      code: py`steps = ["define", "why", "how", "example", "trade-off"]
said = {"example", "define", "how"}
missing = [s for s in steps if s not in said]
print(len(missing), missing)`,
      answer: "2 ['why', 'trade-off']",
      accept: ['2 ["why", "trade-off"]'],
      explanation: py`The comprehension walks \`steps\` **in order** and keeps the ones not in the set, so the result follows the framework order: \`['why', 'trade-off']\`. The set's own order doesn't matter — only membership is checked.`,
    },
    {
      id: 'answering-framework-q3',
      type: 'bug',
      prompt: 'This helper should report that the answer contains an example, but it prints `False`. Click the buggy line.',
      code: py`def has_example(answer):
    for sentence in answer.split(". "):
        if "for example" in sentence:
            return True
    return False

print(has_example("For example, a tuple can be a dict key."))`,
      answerLine: 3,
      explanation: py`\`in\` on strings is case-sensitive: \`"for example"\` is not in \`"For example, …"\`. Compare against \`sentence.lower()\`. The same mistake bites in real code that matches user input against keywords.`,
    },
    {
      id: 'answering-framework-q4',
      type: 'fill',
      prompt: 'Complete the line so `found` maps each part to `True` if **any** of its cues appears in the lower-cased answer.',
      code: py`text = answer.___()
found = {part: ___(cue in text for cue in cues) for part, cues in CHECKLIST.items()}`,
      answer: [['lower', 'lower()', 'casefold', 'casefold()'], ['any']],
      explanation: py`\`answer.lower()\` normalises case once. \`any()\` takes the generator of booleans and stops at the first \`True\` — it doesn't build a list.`,
    },
    {
      id: 'answering-framework-q5',
      type: 'mcq',
      prompt: 'You\'re asked: "How does CPython decide when to run the cyclic garbage collector?" You only know the basics. What\'s the strongest response?',
      options: [
        { text: '"It runs every 10 seconds."', why: 'That is invented, and the interviewer will likely know. A confident wrong answer costs more than an honest partial one.' },
        { text: '"I don\'t know." — and wait for the next question.', why: 'Honest, but it gives no evidence of reasoning. Share what you do know and how you would find out.' },
        '"I don\'t know the exact trigger. I know CPython frees most objects by reference counting and uses a separate collector for reference cycles; I\'d expect it to run based on allocation activity. I\'d check the gc module docs — gc.get_threshold() shows the settings."',
        { text: 'Change the subject to reference counting, which you know well, without mentioning the question.', why: 'Interviewers notice dodging. Bridge to what you know openly: "I\'m not sure about X, but I do know Y."' },
      ],
      answer: 2,
      explanation: py`That's the honest ladder: say what you don't know, share related knowledge (reference counting + a cycle collector), reason to a labelled guess, and name a concrete way to verify (\`gc.get_threshold()\`, the [gc docs](https://docs.python.org/3/library/gc.html)). See [memory management](lesson:memory-management).`,
    },
    {
      id: 'answering-framework-q6',
      type: 'mcq',
      prompt: 'The prompt is: "Write a function that returns the most common word in a text." What\'s the best **first** thing to do?',
      options: [
        { text: 'Start typing `Counter(text.split()).most_common(1)` immediately', why: 'You might be right, but you have not checked case, punctuation, ties or empty input — and you have shown no process.' },
        'Ask a couple of clarifying questions: case-sensitive? punctuation? what to return on a tie or empty text?',
        { text: 'Explain the theory of hash tables in detail', why: 'Relevant later, perhaps, but the first job is to pin down what the function must do.' },
        { text: 'Say it is too easy and ask for a harder problem', why: 'Simple-looking problems often hide edge cases that are exactly what is being tested.' },
      ],
      answer: 1,
      explanation: py`"Is 'The' the same word as 'the'?" and "what if two words tie?" change the code. Ask a few targeted questions, write an example, then code. See [coding patterns](lesson:coding-patterns) for the \`Counter\` solution.`,
    },
    {
      id: 'answering-framework-q7',
      type: 'short',
      prompt: 'In your own words: how does your answer structure change between "What is a decorator?" and "Tell me about a time you improved slow code"?',
      answer: py`The first is a technical concept question, so I use define → why → how → example → trade-off: what a decorator is, why it exists, how it wraps a function, a small timing example, and the downside (hidden behaviour, need for functools.wraps). The second is behavioural, so I use STAR: the situation (a slow report), my task, the specific actions I took (profiled it, found the hot loop, replaced list lookups with a set) and the result, plus what I learned. Both are concise and answer-first; the behavioural one is a true story told in the first person.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'outline-builder',
      title: 'Build an answer outline',
      difficulty: 'intermediate',
      prompt: py`Write \`build_outline(parts)\`. \`parts\` is a dict whose keys may include \`"define"\`, \`"why"\`, \`"how"\`, \`"example"\` and \`"trade-off"\`, **in any order**, with some missing.

Return **one string** with exactly five lines (joined with \`"\\n"\`), always in framework order:

\`\`\`text
1. Define: <text>
2. Why: <text>
3. How: <text>
4. Example: <text>
5. Trade-off: <text>
\`\`\`

- Strip surrounding whitespace from each text.
- If a key is missing **or** its text is empty/only whitespace, write \`(missing)\` instead, e.g. \`3. How: (missing)\`.
- The labels are the step names with the first letter capitalised (\`"trade-off"\` → \`Trade-off\`).`,
      files: {
        'main.py': py`STEPS = ["define", "why", "how", "example", "trade-off"]


def build_outline(parts):
    # TODO: one line per step, in STEPS order, numbered from 1
    lines = []
    for key, text in parts.items():
        lines.append(f"{key}: {text}")
    return "\n".join(lines)


print(build_outline({
    "example": "  (51.5, -0.12) as a GPS point ",
    "define": "A tuple is an immutable sequence.",
    "why": "Immutable values can be dict keys.",
}))
`,
      },
      hints: [
        'Loop over STEPS, not over parts — the output order must not depend on how the dict was built.',
        'enumerate(STEPS, start=1) gives you the number; parts.get(step, "") gives the text or an empty string.',
        'text = parts.get(step, "").strip(); lines.append(f"{number}. {step.capitalize()}: {text or \'(missing)\'}")',
      ],
      solution: {
        explanation: py`Looping over \`STEPS\` fixes the order regardless of the dict's insertion order. \`parts.get(step, "")\` treats a missing key like an empty string, and \`.strip()\` turns whitespace-only text into \`""\`, which is falsy — so \`text or "(missing)"\` handles both cases in one expression. \`str.capitalize()\` upper-cases only the first character, giving \`Trade-off\`.`,
        files: {
          'main.py': py`STEPS = ["define", "why", "how", "example", "trade-off"]


def build_outline(parts):
    lines = []
    for number, step in enumerate(STEPS, start=1):
        text = parts.get(step, "").strip()
        lines.append(f"{number}. {step.capitalize()}: {text or '(missing)'}")
    return "\n".join(lines)


print(build_outline({
    "example": "  (51.5, -0.12) as a GPS point ",
    "define": "A tuple is an immutable sequence.",
    "why": "Immutable values can be dict keys.",
}))
`,
        },
      },
      tests: [
        { name: 'a full outline comes out in framework order', code: py`full = {"why": "W", "define": "D", "trade-off": "T", "example": "E", "how": "H"}
assert build_outline(full) == "1. Define: D\n2. Why: W\n3. How: H\n4. Example: E\n5. Trade-off: T"` },
        { name: 'missing parts are marked (missing)', code: py`lines = build_outline({"define": "A tuple is an immutable sequence."}).splitlines()
assert lines[1] == "2. Why: (missing)"
assert lines[4] == "5. Trade-off: (missing)"` },
        { name: 'whitespace-only text counts as missing', code: py`assert build_outline({"how": "   "}).splitlines()[2] == "3. How: (missing)"` },
        { name: 'text is stripped', code: py`assert build_outline({"example": "  (1, 2)  "}).splitlines()[3] == "4. Example: (1, 2)"` },
        { name: 'always exactly five lines', code: py`assert len(build_outline({}).splitlines()) == 5` },
      ],
    },
    {
      id: 'pick-the-plan',
      title: 'Pick the right answer shape',
      difficulty: 'intermediate',
      prompt: py`Write two functions.

**\`classify(question)\`** returns one of \`"behavioural"\`, \`"coding"\` or \`"technical"\`:

1. Lower-case the question and strip surrounding whitespace.
2. If it **contains** any phrase in \`BEHAVIOURAL_CUES\` → \`"behavioural"\` (checked first).
3. Otherwise, if it **starts with** any word in \`CODING_STARTS\` → \`"coding"\`.
4. Otherwise → \`"technical"\`.

**\`plan_for(question)\`** returns the list of steps for that kind of question, from the \`PLANS\` dict. Return a **new list** each time (so callers can't change \`PLANS\` by accident).`,
      files: {
        'main.py': py`BEHAVIOURAL_CUES = [
    "tell me about a time",
    "describe a time",
    "give an example of a time",
    "how did you handle",
]
CODING_STARTS = ("write", "implement", "code")
PLANS = {
    "behavioural": ["Situation", "Task", "Action", "Result"],
    "coding": ["Clarify", "Examples", "Approach", "Code", "Test", "Complexity"],
    "technical": ["Define", "Why", "How", "Example", "Trade-off"],
}


def classify(question):
    # TODO: behavioural cues first, then coding starts, else technical
    return "technical"


def plan_for(question):
    # TODO: look up the plan for this kind of question
    return []


for q in ["What is a generator?", "Write a function that reverses a string.",
          "Tell me about a time you missed a deadline."]:
    print(classify(q), "->", " / ".join(plan_for(q)))
`,
      },
      hints: [
        'Normalise once at the top: text = question.strip().lower().',
        'any(cue in text for cue in BEHAVIOURAL_CUES) checks every phrase; str.startswith() accepts a tuple of prefixes.',
        'plan_for can be: return list(PLANS[classify(question)])',
      ],
      solution: {
        explanation: py`Normalising once (\`strip().lower()\`) makes every check case-insensitive. The behavioural check comes first so "Tell me about a time you had to write a script" isn't misread as a coding task. \`str.startswith\` accepts a tuple, so one call tests all three prefixes. \`list(...)\` returns a copy, so a caller appending to the result can't corrupt the shared \`PLANS\` dict — an aliasing bug covered in [mutability & copying](lesson:mutability-and-copying).`,
        files: {
          'main.py': py`BEHAVIOURAL_CUES = [
    "tell me about a time",
    "describe a time",
    "give an example of a time",
    "how did you handle",
]
CODING_STARTS = ("write", "implement", "code")
PLANS = {
    "behavioural": ["Situation", "Task", "Action", "Result"],
    "coding": ["Clarify", "Examples", "Approach", "Code", "Test", "Complexity"],
    "technical": ["Define", "Why", "How", "Example", "Trade-off"],
}


def classify(question):
    text = question.strip().lower()
    if any(cue in text for cue in BEHAVIOURAL_CUES):
        return "behavioural"
    if text.startswith(CODING_STARTS):
        return "coding"
    return "technical"


def plan_for(question):
    return list(PLANS[classify(question)])


for q in ["What is a generator?", "Write a function that reverses a string.",
          "Tell me about a time you missed a deadline."]:
    print(classify(q), "->", " / ".join(plan_for(q)))
`,
        },
      },
      tests: [
        { name: 'behavioural cue', code: py`assert classify("Tell me about a time you missed a deadline.") == "behavioural"` },
        { name: 'coding prompt', code: py`assert classify("Write a function that reverses a string.") == "coding"` },
        { name: 'case and leading spaces are ignored', code: py`assert classify("  IMPLEMENT an LRU cache") == "coding"` },
        { name: 'behavioural wins over coding words', code: py`assert classify("Tell me about a time you had to write a script quickly") == "behavioural"` },
        { name: 'plans for each kind', code: py`assert plan_for("How did you handle a production outage?") == ["Situation", "Task", "Action", "Result"]
assert plan_for("Write fizzbuzz") == ["Clarify", "Examples", "Approach", "Code", "Test", "Complexity"]
assert plan_for("Why is a tuple hashable?") == ["Define", "Why", "How", "Example", "Trade-off"]` },
        { name: 'plan_for returns a copy', code: py`plan_for("What is a set?").append("Extra")
assert PLANS["technical"] == ["Define", "Why", "How", "Example", "Trade-off"], 'Return a new list, not the one stored in PLANS'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'answering-framework-main-guard-drill',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Framework drill: give a five-part answer to "What does `if __name__ == \'__main__\':` do?"',
      answer: 'Define: it runs a block only when the file is executed directly. Why: so a module can be both imported and run as a script without side effects on import. How: Python sets __name__ to "__main__" for the entry script and to the module name when imported. Example: a CLI file with main(). Trade-off: logic hidden in that block can\'t be imported or tested, so keep it to a call to main().',
      explanation: py`This drill is about *shape*. Each sentence does one job, and the trade-off shows practical experience: code written directly under the guard is untestable, so professionals keep the guard to a single \`main()\` call. Details in [main guard & scripts](lesson:main-guard-and-scripts).`,
      code: { lang: 'python', code: py`def main():
    print("Generating the daily report...")


if __name__ == "__main__":   # "__main__" when run as a script
    main()                    # skipped when another file imports this one` },
      whyAsked: 'A warm-up that checks basic module knowledge — and, in a framework drill, whether you can deliver a complete, structured answer in under a minute.',
      mistakes: ['Saying only "it\'s the main function" (Python has no special main function)', 'Explaining the how before saying what it does', 'Forgetting the trade-off entirely'],
      followUps: ['What is __name__ when you run python -m mypackage.tool?', 'Why should the guarded block stay small?', 'How do console-script entry points in packaging relate to this?'],
      modelAnswer: 'That check makes a block of code run only when the file is executed directly, not when it is imported. It exists so one file can be both a reusable module and a runnable script without doing work on import. It works because Python sets the module attribute __name__ to the string "__main__" for the entry script, and to the module\'s own name when it is imported. For example, a report script defines main() and calls it under the guard, while tests import the module and call its functions directly. The trade-off is that anything written inside the guard can\'t be imported or tested, so I keep it to a single call to main().',
    },
    {
      id: 'answering-framework-behavioural-vs-technical',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'Which answer structure fits "Tell me about a time you disagreed with a code review comment" — and how does it differ from a technical concept answer?',
      options: [
        'Define → why → how → example → trade-off',
        'STAR: situation → task → action → result',
        'Clarify → examples → approach → code → test → complexity',
        'No structure: behavioural questions are just small talk',
      ],
      correctOption: 1,
      answer: 'STAR. It\'s a behavioural question about something you did, so you tell a true, specific story: brief situation and task, a detailed action in the first person, and a result plus what you learned. A concept answer instead explains an idea: define, why, how, example, trade-off.',
      explanation: py`Behavioural questions assess how you work with people and handle problems; the evidence is *your actions*. Technical concept questions assess understanding; the evidence is *precision and examples*. Both reward answering first and staying concise. In the disagreement story, the action should show you engaged with the reviewer's reasoning (e.g. you wrote a small benchmark or test to settle it) rather than "winning".`,
      whyAsked: 'Checks that you recognise the kind of question being asked — mismatching the structure (e.g. answering a behavioural prompt with theory) is a very common failure.',
      mistakes: ['Answering with "we" throughout so your own contribution is invisible', 'Spending most of the time on the situation and little on the action', 'Telling a story where the reviewer was simply wrong and you learned nothing'],
      followUps: ['What would you do differently now?', 'How did you resolve it if you still disagreed?', 'How do you give critical review feedback yourself?'],
      modelAnswer: 'That\'s a behavioural question, so I\'d use STAR rather than a technical explanation. I\'d give one or two sentences of situation — for example, a reviewer asked me to replace a dictionary cache with functools.lru_cache — and my task, which was getting the change merged without a performance regression. Most of the answer would be the action, in the first person: I asked about their concern, wrote a small benchmark and a test, and we compared results. Then the result — we kept the simpler lru_cache version — and what I learned about settling disagreements with evidence. A concept question is different: there I define the idea, explain why and how, give an example and end with a trade-off.',
    },
    {
      id: 'answering-framework-dedupe-clarify',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Clarify-then-code drill: "Remove the duplicates from a list." After asking, you learn: keep the **first occurrence order**, items are hashable, and **don\'t modify the input**. Write `dedupe(items)`.',
      answer: 'def dedupe(items): return list(dict.fromkeys(items)) — dicts keep insertion order (guaranteed since 3.7), so the first occurrence of each item wins; O(n) average time.',
      explanation: py`The first instinct, \`list(set(items))\`, throws away order — which is exactly why you ask. \`dict.fromkeys(items)\` builds a dict whose keys are the items in first-seen order; \`list()\` of a dict gives its keys. The explicit version uses a \`seen\` set and a result list; both are O(n) on average. Neither mutates the input.`,
      code: { lang: 'python', code: py`def dedupe_explicit(items):
    seen = set()
    result = []
    for item in items:
        if item not in seen:     # O(1) on average: a hash lookup
            seen.add(item)
            result.append(item)
    return result


print(dedupe_explicit(["tea", "cake", "tea", "bun"]))   # ['tea', 'cake', 'bun']` },
      starter: { files: { 'main.py': py`def dedupe(items):
    # TODO: keep the first occurrence of each item, in order
    return list(set(items))


print(dedupe([3, 1, 3, 2, 1]))
` } },
      tests: [
        { name: 'keeps first-occurrence order', code: py`assert dedupe([3, 1, 3, 2, 1]) == [3, 1, 2]` },
        { name: 'works with strings', code: py`assert dedupe(["tea", "cake", "tea", "bun"]) == ["tea", "cake", "bun"]` },
        { name: 'empty list', code: py`assert dedupe([]) == []` },
        { name: 'does not modify the input', code: py`orders = [2, 2, 1]
dedupe(orders)
assert orders == [2, 2, 1]` },
      ],
      solution: { files: { 'main.py': py`def dedupe(items):
    return list(dict.fromkeys(items))


print(dedupe([3, 1, 3, 2, 1]))
` } },
      hints: ['A set forgets order. Which built-in mapping remembers insertion order?', 'dict.fromkeys(iterable) makes a dict with those keys, in first-seen order.'],
      whyAsked: 'The coding is easy; the signal is whether you ask about order, hashability and mutation before you type.',
      mistakes: ['Using list(set(items)) without asking whether order matters', 'Checking `if item not in result` on a list — O(n) per check, O(n²) overall', 'Mutating the caller\'s list with remove() while iterating over it'],
      followUps: ['What if the items are unhashable, like dicts? (compare by a hashable key, or fall back to O(n²))', 'What if you must keep the last occurrence instead?', 'What is the complexity of each version?'],
      modelAnswer: 'Before coding I\'d ask whether order matters, whether items are hashable, and whether I may modify the input — here: keep first-occurrence order, hashable, don\'t mutate. Then the idiomatic answer is list(dict.fromkeys(items)): dict keys are unique and dicts preserve insertion order, a language guarantee since Python 3.7, so the first occurrence of each item wins. The explicit version keeps a seen set and appends unseen items to a result list. Both are O(n) average time and O(n) extra space. A set alone would be just as fast but would lose the order, which is why the clarifying question mattered.',
    },
    {
      id: 'answering-framework-dont-know-slots',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'You\'re asked "How would you use `__slots__` to reduce memory?" and you have never used `__slots__`. Show how you\'d answer honestly and still score.',
      answer: 'Say you haven\'t used it, then reason from what you know: instances normally keep attributes in a per-instance __dict__; __slots__ declares a fixed set of attribute names so instances store them in fixed slots without a __dict__, saving memory when there are many instances. The cost: you can\'t add new attributes, and inheritance needs care. Offer to verify by measuring.',
      explanation: py`This is the honest ladder: **admit → adjacent knowledge → reasoned guess → how to verify**. Here the guess happens to be right: \`__slots__\` replaces the per-instance \`__dict__\` with fixed storage, which saves memory for large numbers of small objects and blocks new attributes. Verification would use \`tracemalloc\` or compare sizes of many instances. See [records & slots](lesson:records-and-slots).`,
      code: { lang: 'python', code: py`class Reading:
    __slots__ = ("sensor", "value")   # no per-instance __dict__

    def __init__(self, sensor, value):
        self.sensor = sensor
        self.value = value


r = Reading("t1", 21.5)
print(hasattr(r, "__dict__"))   # False
try:
    r.unit = "C"                # not declared in __slots__
except AttributeError as error:
    print("AttributeError:", error)` },
      whyAsked: 'Nobody knows everything. Interviewers deliberately probe the edge of your knowledge to see whether you bluff or reason.',
      mistakes: ['Inventing a confident answer with made-up numbers', 'Saying "I don\'t know" and stopping', 'Apologising at length instead of reasoning'],
      followUps: ['How would you measure the saving?', 'What happens with __slots__ in a subclass that doesn\'t declare them?', 'How does @dataclass(slots=True) (3.10+) relate?'],
      modelAnswer: 'I haven\'t used __slots__ in my own code, so let me reason from what I do know. Normally each instance stores its attributes in its own __dict__, which is a full dictionary per object. I believe __slots__ declares the allowed attribute names up front, so instances store them in fixed slots instead of a dict, which should save memory when you create lots of small objects, like millions of sensor readings. The trade-off I\'d expect is that you can\'t add attributes that aren\'t declared. To be sure, I\'d create many instances with and without slots and compare memory with tracemalloc.',
    },
    {
      id: 'answering-framework-clarify-popular',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A product manager asks you to "find the most popular products" from an order log. What clarifying questions would you ask before writing any Python?',
      answer: 'Define "popular" (number of orders, units sold, or revenue?), the time window, how to break ties, how many results (top 1 or top N), whether cancelled/refunded orders count, how big the data is (fits in memory or streamed), and what format the result should take.',
      explanation: py`Each question changes the code. Orders vs units is \`Counter(o["product"] for o in orders)\` vs summing quantities; revenue needs prices; ties need a deterministic secondary sort; size decides between a list in memory and streaming the file line by line. Asking these is what senior engineers do on day one of any real task.`,
      code: { lang: 'python', code: py`from collections import Counter

orders = [
    {"product": "tea", "qty": 3, "status": "paid"},
    {"product": "cake", "qty": 1, "status": "paid"},
    {"product": "cake", "qty": 1, "status": "refunded"},
    {"product": "bun", "qty": 2, "status": "paid"},
]
paid = [o for o in orders if o["status"] == "paid"]

by_orders = Counter(o["product"] for o in paid)
units = Counter()
for o in paid:
    units[o["product"]] += o["qty"]

print(by_orders.most_common(1))   # [('tea', 1)] - a three-way tie on order count!
print(units.most_common(1))       # [('tea', 3)]` },
      whyAsked: 'Real requirements are vague. Interviewers want to see that you turn ambiguity into a spec instead of guessing.',
      mistakes: ['Asking no questions and coding the first interpretation', 'Asking a dozen questions with no priority — pick the ones that change the code', 'Forgetting to ask about data size'],
      followUps: ['How would you break ties deterministically?', 'What changes if the log is 50 GB?', 'How would you test this?'],
      modelAnswer: 'First I\'d ask what "popular" means, because number of orders, units sold and revenue can give different winners. Then the time window, whether refunded or cancelled orders count, how many products they want back, and how ties should be broken so the result is stable. I\'d also ask how big the log is, because that decides whether I load it into memory or stream it line by line. With those answers, the core is a Counter over the filtered orders and most_common(n), with a secondary sort for ties. I\'d confirm the definition with one worked example before writing the code.',
    },
    {
      id: 'answering-framework-star-bug-story',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: '"Tell me about a difficult bug you fixed." Give a STAR answer with real technical substance. (Use your own story in the interview — this is a model.)',
      answer: 'Situation: a nightly sales report double-counted one hour twice a year. Task: I owned the report. Action: reproduced it with dates around the clock change, found naive datetimes being converted with a fixed offset, switched to timezone-aware UTC timestamps internally and converted only for display, added tests for both daylight-saving transitions. Result: totals matched the source system, and we added a lint rule against naive datetime.now().',
      explanation: py`A strong story has a concrete symptom, a hypothesis-driven investigation, a fix at the root cause rather than a patch, and a prevention step (tests, tooling). The technical substance — naive vs aware datetimes, daylight-saving transitions — gives the interviewer something to dig into. See [dates & times](lesson:dates-and-times) and [debugging](lesson:debugging).`,
      whyAsked: 'Shows how you debug in the real world: reproduce, form hypotheses, find root cause, prevent recurrence — and how you talk about your own work.',
      mistakes: ['Picking a trivial typo bug', 'Describing the team\'s work with "we" so your role is unclear', 'Ending at the fix without prevention or lessons learned', 'Inventing a story — follow-up questions expose it'],
      followUps: ['How did you reproduce it?', 'What would have caught it earlier?', 'What did you change in your process afterwards?'],
      modelAnswer: 'In my last project, a nightly sales report was wrong twice a year — one hour got double-counted around the clock change. I owned that report, so the task was to find the cause and make sure it couldn\'t recur. I reproduced it by running the report for dates on both sides of the daylight-saving transition, and found we were mixing naive datetimes with a hard-coded offset. I changed the pipeline to store timezone-aware UTC timestamps and convert to local time only for display, and added tests for both transitions. The totals then matched the source system, and we added a lint check against naive datetime.now() so the pattern couldn\'t creep back.',
    },
    {
      id: 'answering-framework-narrate-sorted',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'Think-aloud drill: predict the output and narrate each step as you would to an interviewer.',
      code: { lang: 'python', code: py`words = ["kiwi", "fig", "banana", "apple"]
print(sorted(words, key=len)[:2], max(words, key=len))` },
      options: [
        "['fig', 'kiwi'] banana",
        "['apple', 'banana'] kiwi",
        "['fig', 'kiwi'] apple",
        "['kiwi', 'fig'] banana",
      ],
      correctOption: 0,
      answer: "['fig', 'kiwi'] banana",
      explanation: py`Narration: "\`sorted\` with \`key=len\` orders by length: fig (3), kiwi (4), apple (5), banana (6). Slicing \`[:2]\` keeps the two shortest. \`max\` with \`key=len\` returns the *element* with the largest key — banana, not the number 6." Narrating like this lets the interviewer catch a misunderstanding early and give you credit for the correct parts even if you slip.`,
      whyAsked: 'Predict-the-output questions test precise knowledge; asking you to narrate tests whether you can make your reasoning visible.',
      mistakes: ['Thinking max(key=len) returns the length', 'Sorting alphabetically and forgetting the key', 'Staying silent for a minute, then giving only the final answer'],
      followUps: ['What if two words had the same length — which comes first? (sorted is stable: original order)', 'How would you get the shortest word with min?'],
      modelAnswer: 'Let me trace it aloud. sorted with key=len compares lengths, so the order becomes fig with three letters, kiwi with four, apple with five, banana with six; the slice keeps the first two, fig and kiwi. max with key=len uses the length to compare, but returns the element itself, so that\'s banana. So it prints the list fig, kiwi and then banana. One detail worth mentioning: sorted is stable, so words of equal length would keep their original relative order.',
    },
    {
      id: 'answering-framework-self-correct',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'You wrote `average(scores)` in a live round. The interviewer asks: "What happens with an empty list?" What does the code do, and how do you respond?',
      code: { lang: 'python', code: py`def average(scores):
    return sum(scores) / len(scores)` },
      options: ['It returns 0', 'It raises ZeroDivisionError', 'It returns None', 'It raises ValueError'],
      correctOption: 1,
      answer: 'It raises ZeroDivisionError: division by zero, because sum([]) is 0 and len([]) is 0. Acknowledge it, decide the intended behaviour with the interviewer (raise a clear ValueError, or return None), fix it, and add the case to your tests.',
      explanation: py`Interviewers ask "what about…?" to see how you react to a flaw. The strong response is calm and concrete: name the failure, offer options with their trade-offs, implement one. The standard library's \`statistics.mean([])\` raises \`StatisticsError\` (a subclass of \`ValueError\`) — a reasonable precedent for raising rather than silently returning \`0\`.`,
      whyAsked: 'Tests edge-case thinking and composure. Finding and fixing your own bug is a positive signal.',
      mistakes: ['Getting defensive ("nobody would pass an empty list")', 'Silently returning 0, which hides bad data', 'Wrapping it in a bare except'],
      followUps: ['Why might returning 0 be dangerous in a grade book?', 'How would you document the behaviour?', 'Would you use statistics.mean instead?'],
      modelAnswer: 'With an empty list, sum is 0 and len is 0, so it raises ZeroDivisionError. Good catch — I should have listed that in my edge cases. The question is what the caller should get: returning 0 would be misleading, because an empty grade book doesn\'t have an average of zero, so I\'d raise a ValueError with a clear message, which matches statistics.mean raising StatisticsError. Alternatively, if the caller expects "no data" often, returning None and documenting it is fine. I\'d add the empty case to my tests either way.',
    },
    {
      id: 'answering-framework-chunk',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Edge-case drill: write `chunk(items, size)` that splits a list into consecutive lists of `size` items; the last chunk may be shorter. Clarify first — then: `size` below 1 must raise `ValueError`.',
      answer: 'Validate size, then slice in steps: [items[i:i + size] for i in range(0, len(items), size)]. Empty input gives []. On 3.12+, itertools.batched does this lazily for any iterable (yielding tuples).',
      explanation: py`The clarifying questions are the point: what happens to a short last chunk (keep it), what about \`size = 0\` (\`range\` would raise its own confusing error — validate and raise a clear \`ValueError\`), and lists vs any iterable. Slicing never raises for out-of-range ends, which handles the short last chunk for free.`,
      code: { lang: 'pycon', code: py`>>> from itertools import batched      # Python 3.12+
>>> list(batched([1, 2, 3, 4, 5], 2))
[(1, 2), (3, 4), (5,)]` },
      starter: { files: { 'main.py': py`def chunk(items, size):
    # TODO: split items into lists of at most size items
    return [items]


print(chunk([1, 2, 3, 4, 5], 2))
` } },
      tests: [
        { name: 'splits with a shorter last chunk', code: py`assert chunk([1, 2, 3, 4, 5], 2) == [[1, 2], [3, 4], [5]]` },
        { name: 'exact multiple', code: py`assert chunk(["a", "b", "c"], 3) == [["a", "b", "c"]]` },
        { name: 'empty input gives an empty list', code: py`assert chunk([], 3) == []` },
        { name: 'size 0 raises ValueError', code: py`with raises(ValueError):
    chunk([1, 2], 0)` },
      ],
      solution: { files: { 'main.py': py`def chunk(items, size):
    if size < 1:
        raise ValueError(f"size must be at least 1, got {size}")
    return [items[i:i + size] for i in range(0, len(items), size)]


print(chunk([1, 2, 3, 4, 5], 2))
` } },
      hints: ['range(start, stop, step) can jump size items at a time.', 'Slicing past the end of a list is safe: [1, 2, 3][2:10] == [3].', 'Check size before the comprehension and raise ValueError.'],
      whyAsked: 'A small problem with several edge cases (short last chunk, zero size, empty input) — ideal for seeing whether you clarify and test.',
      mistakes: ['Dropping the short last chunk without asking', 'Letting size=0 produce an obscure error from range()', 'Writing index arithmetic with off-by-one errors instead of slicing'],
      followUps: ['How would you make it work for any iterable, lazily?', 'What does itertools.batched return?', 'What is the time complexity?'],
      modelAnswer: 'First I\'d confirm the edge cases: keep a short final chunk, return an empty list for empty input, and reject a size below one with a ValueError rather than letting range fail obscurely. Then the implementation is a comprehension that slices from i to i plus size, with i stepping through range(0, len(items), size); slicing past the end is safe, so the last chunk just comes out shorter. That\'s O(n) time and O(n) space for the copies. If the input could be any iterable or huge, I\'d make it a generator using itertools.islice, and on Python 3.12 or later I\'d simply use itertools.batched, which yields tuples lazily.',
    },
    {
      id: 'answering-framework-depth-layers',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Depth-control drill: "What happens when you call `len(cart)`?" Give the one-sentence answer, then show the deeper layers you would offer if invited.',
      answer: 'Layer 1: it returns the number of items in cart. Layer 2: len() calls type(cart).__len__(cart), so any class can support it by defining __len__, which must return an int >= 0; without it you get TypeError. Layer 3: special methods are looked up on the type, not the instance, and for built-in containers the size is stored in the object, so len() is O(1) (a CPython detail).',
      explanation: py`This is **depth control**: give the short answer, then *offer* layers — "I can go into how the protocol works if that's useful." Layer 2 is the [special-method protocol](lesson:special-methods): \`__len__\` must return a non-negative int, and truth testing falls back to \`__len__\` when a class has no \`__bool__\`. Layer 3 is precision: implicit special-method calls look the method up on the **type**, so assigning \`cart.__len__ = ...\` on an instance changes nothing; and built-in lists, dicts and sets keep their size in the object, so \`len()\` doesn't count anything (a CPython implementation detail — the docs don't promise a complexity).`,
      code: { lang: 'python', code: py`class Cart:
    def __init__(self, items):
        self.items = list(items)

    def __len__(self):
        return len(self.items)


cart = Cart(["tea", "cake"])
print(len(cart))           # 2: len() calls type(cart).__len__(cart)
cart.__len__ = lambda: 99  # set on the instance...
print(len(cart))           # still 2: special methods are looked up on the type
print(bool(Cart([])))      # False: no __bool__, so truth testing uses __len__` },
      whyAsked: 'Simple-sounding questions are often depth probes. Interviewers want to see whether you can zoom in step by step — and stop at the right level.',
      mistakes: ['Launching straight into C-level details before giving the one-line answer', 'Claiming len() "loops over the items to count them"', 'Not knowing that a custom class can support len() with __len__'],
      followUps: ['What happens if __len__ returns -1? (ValueError: __len__() should return >= 0)', 'Why does setting __len__ on an instance not work?', 'How does bool(cart) relate to __len__?'],
      modelAnswer: 'The short answer is that len(cart) returns the number of items in cart. One level down, len is a thin wrapper around the special method __len__: it calls type(cart).__len__(cart), so any class can support len by defining __len__, which must return a non-negative integer, and a class without it raises TypeError. Going deeper, special methods are looked up on the type rather than the instance, so patching __len__ onto an object does nothing, and truth testing falls back to __len__ when there is no __bool__. For built-in containers the size is stored in the object, so in CPython len is constant time rather than a count. I can go into the rest of the data model if that is useful.',
    },
    {
      id: 'answering-framework-pushback-dict-order',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'The interviewer says: "Dicts are unordered, so your solution that relies on insertion order is wrong." You believe it\'s correct. How do you respond?',
      answer: 'Respectfully, with evidence: since Python 3.7 the language guarantees dicts preserve insertion order (in CPython 3.6 it was an implementation detail). Offer a two-line demo, and acknowledge what is true in their point — sets are unordered, very old code may target older versions, and OrderedDict still adds order-aware equality and move_to_end().',
      explanation: py`Pushback is sometimes a test of how you handle disagreement and sometimes genuine. Either way: stay curious, cite the specific version and source (the language reference / What's New in 3.7), demonstrate rather than argue, and give the other side its due. If the code must support Python versions older than 3.7 (rare today), using \`OrderedDict\` would be the safe fix.`,
      code: { lang: 'python', code: py`from collections import OrderedDict

cart = {"tea": 3, "cake": 4}
cart["bun"] = 2
print(list(cart))   # ['tea', 'cake', 'bun'] - guaranteed since Python 3.7

a = OrderedDict(x=1, y=2)
b = OrderedDict(y=2, x=1)
print(a == b, dict(a) == dict(b))   # False True - OrderedDict equality checks order` },
      whyAsked: 'Assesses collaboration under pressure and whether you know version-specific guarantees precisely.',
      mistakes: ['Caving immediately and rewriting correct code', 'Arguing without evidence or getting defensive', 'Saying "dicts have always been ordered"'],
      followUps: ['What does OrderedDict still offer?', 'Are sets ordered?', 'How would you check which Python version a codebase supports?'],
      modelAnswer: 'I\'d say: I think it\'s safe here — since Python 3.7 the language specification guarantees that dicts keep insertion order; in CPython 3.6 it was already true but only as an implementation detail. I\'m happy to show it with a two-line example. You\'re right that sets don\'t keep order, and if we had to support something older than 3.7 I\'d switch to OrderedDict. OrderedDict also still has uses, like move_to_end and equality that compares order. So I\'d keep the solution, but I\'d add a comment noting the 3.7 guarantee for future readers.',
    },
    {
      id: 'answering-framework-large-log-tradeoffs',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A teammate\'s script loads a multi-gigabyte log with `f.readlines()` and runs out of memory. Present two or three alternatives as you would in an interview, with trade-offs.',
      answer: '1) Stream: iterate the file object line by line (a lazy iterator) and aggregate as you go — constant memory, simplest change. 2) Generator pipeline: small composable generator stages (read → parse → filter → aggregate) — still streaming, more testable. 3) If parsing is CPU-heavy, split the file into byte ranges processed by multiple processes, or load into a database (SQLite) if you need repeated ad-hoc queries. Pick 1 or 2 first; measure before adding processes.',
      explanation: py`The structure is the lesson: state the root cause (\`readlines()\` materialises every line as a string in one list), list options from least to most complex, give each a trade-off, recommend one, and say how you'd verify (measure peak memory with \`tracemalloc\`, time with \`perf_counter\`). See [generators](lesson:generators), [lazy evaluation](lesson:lazy-evaluation) and [multiprocessing](lesson:multiprocessing).`,
      code: { lang: 'python', code: py`from collections import Counter


def read_lines(path):
    with open(path, encoding="utf-8") as f:
        for line in f:                 # lazy: one line in memory at a time
            yield line.rstrip("\n")


def status_codes(lines):
    for line in lines:
        parts = line.split()
        if len(parts) > 8:
            yield parts[8]             # e.g. the HTTP status column


def count_statuses(path):
    return Counter(status_codes(read_lines(path)))` },
      whyAsked: 'Architecture questions check whether you can compare options and recommend one with reasons — not whether you know a single "right" answer.',
      mistakes: ['Jumping to multiprocessing or a cluster before trying streaming', 'Listing options without recommending one', 'Claiming speed-ups without measuring'],
      followUps: ['How would you test the pipeline without a huge file?', 'When would multiprocessing actually help here?', 'What if the log is compressed?'],
      modelAnswer: 'The root cause is that readlines builds a list holding every line in memory at once. The simplest fix is to iterate over the file object directly, which reads lazily, and aggregate as I go — memory stays roughly constant. A cleaner version is a pipeline of small generator functions — read, parse, filter, count — which is still streaming but much easier to unit-test with a few fake lines. If profiling then showed the parsing is CPU-bound, I could split the file into byte ranges for several processes, or load it into SQLite if people need repeated ad-hoc queries; both add complexity. I\'d start with streaming and measure peak memory with tracemalloc before going further.',
    },
    {
      id: 'answering-framework-time-running-out',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 2,
      question: 'Five minutes are left and your solution handles the main case but not two edge cases. What do you do?',
      answer: 'Say where you are and prioritise: make sure the main path runs and is tested on one example, then describe (or stub) the edge-case handling and the tests you\'d add, and state the complexity. Don\'t start a rewrite.',
      explanation: py`Interviewers can only credit what they see or hear. A working main path plus a clear plan ("empty input should raise ValueError; duplicate keys need a tie-break — here's where those checks go") usually beats a half-finished rewrite. Leaving \`# TODO: handle empty input\` comments is honest and shows you know the gaps.`,
      code: { lang: 'python', code: py`def best_seller(sales):
    # TODO (out of time): raise ValueError on empty input; break ties by name
    return max(sales, key=sales.get)


print(best_seller({"tea": 12, "cake": 7}))   # tea` },
      whyAsked: 'Shows prioritisation and communication under time pressure — everyday engineering skills.',
      mistakes: ['Going silent and typing frantically', 'Starting over with a "better" approach', 'Pretending the edge cases are handled'],
      followUps: ['How would you handle the tie-break?', 'Which test would you write first?'],
      modelAnswer: 'I\'d say out loud where I am: the main case works, and two edge cases — empty input and ties — are not handled yet. With five minutes, I\'d first run the main path on one example to make sure it\'s correct, because working code is worth more than a half-finished rewrite. Then I\'d add the empty-input check if it\'s quick, and otherwise leave clear TODO comments and explain exactly how I\'d handle each case and which tests I\'d write. Finally I\'d state the complexity so the interviewer has the full picture.',
    },
  ],

  takeaways: [
    'Concept questions: define → why → how → example → trade-off. Answer first, then expand.',
    'Coding questions: clarify → examples → approach → code → test → complexity. Clarifying questions often change the solution.',
    'Behavioural questions: STAR with a true story, first person, most time on the action.',
    'Think aloud about decisions, not keystrokes; finding and fixing your own bug is a positive signal.',
    'When you don\'t know: say so, share adjacent knowledge, reason to a labelled guess, and name how you\'d verify.',
    'Label facts precisely: language guarantee (dict order, 3.7+), CPython detail (small-int cache), or convention.',
    'Keep first answers short, end with a trade-off, and offer more depth instead of forcing it.',
  ],
}

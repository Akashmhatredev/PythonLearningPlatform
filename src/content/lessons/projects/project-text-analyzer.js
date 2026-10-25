// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------------ shared files
const MAIN = py`"""Text Analyzer: python main.py [file.txt]  (analyses story.txt by default)."""
import sys

from report import format_report
from textstats import analyze, load_stopwords


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    path = args[0] if args else "story.txt"
    try:
        with open(path, encoding="utf-8") as file:
            text = file.read()
    except FileNotFoundError:
        print(f"Error: no such file: {path}")
        return 1
    stats = analyze(text, stopwords=load_stopwords("stopwords.txt"))
    print(format_report(stats, title=path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
`

const STORY = py`Every night, the keeper climbed the ninety-nine steps of the old lighthouse. He carried a lamp, a flask of tea and a notebook. "The sea is never the same twice," he liked to say. Was he right? The fishermen thought so!

One stormy night the lamp went out. The keeper didn't panic... He counted the steps, found the spare wick and lit the lamp again. Out on the water, a small boat turned towards the light. The fishermen were safe.

In the morning, the keeper wrote one line in his notebook: "Storm. Lamp out. Lamp lit. Everyone home."
`

const STOPWORDS = py`# Common words left out of the "most common words" list.
# One word per line. Blank lines and lines starting with # are ignored.
the
a
an
and
or
but
of
to
in
on
at
for
with
as
is
was
were
be
he
she
it
his
her
they
them
i
you
we
that
this
so
`

const TEXTSTATS_STARTER = py`"""Text statistics: pure functions that take text (or a list of words) and return numbers."""
import re
from collections import Counter

WORD_RE = re.compile(r"\b[\w']+\b")
SENTENCE_END_RE = re.compile(r"[.!?]+")


def words(text):
    """Return the lower-cased words of text, without punctuation ("It's" -> "it's")."""
    # TODO (step 2): split() keeps punctuation ("world!") and capitals. Use WORD_RE.
    return text.split()


def count_sentences(text):
    """Count the pieces of text that end with . ! or ? (a final piece without one counts too)."""
    # TODO (step 3): counting "." misses "!" and "?", and "..." counts three times.
    return text.count(".")


def average_word_length(word_list):
    """Mean number of characters per word; 0.0 for no words."""
    # TODO (step 4)
    return 0.0


def most_common_words(word_list, n=5, ignore=frozenset()):
    """The n most frequent words as (word, count) pairs, skipping words in ignore."""
    # TODO (step 5): use collections.Counter.
    return []


def longest_words(word_list, n=3):
    """The n longest different words; equal lengths in alphabetical order."""
    # TODO (step 6)
    return []


def load_stopwords(path):
    """Read one word per line into a set (lower-cased; skip blanks and # comments)."""
    # TODO (step 7)
    return set()


def analyze(text, stopwords=frozenset(), top=5):
    """Every statistic about text, in one dict."""
    word_list = words(text)
    return {
        "characters": len(text),
        "characters_no_spaces": sum(1 for ch in text if not ch.isspace()),
        "words": len(word_list),
        "unique_words": len(set(word_list)),
        "sentences": count_sentences(text),
        "average_word_length": average_word_length(word_list),
        "longest_words": longest_words(word_list),
        "top_words": most_common_words(word_list, top, stopwords),
    }
`

const TEXTSTATS = py`"""Text statistics: pure functions that take text (or a list of words) and return numbers."""
import re
from collections import Counter

WORD_RE = re.compile(r"\b[\w']+\b")
SENTENCE_END_RE = re.compile(r"[.!?]+")


def words(text):
    """Return the lower-cased words of text, without punctuation ("It's" -> "it's")."""
    return WORD_RE.findall(text.lower())


def count_sentences(text):
    """Count the pieces of text that end with . ! or ? (a final piece without one counts too)."""
    pieces = SENTENCE_END_RE.split(text)
    return sum(1 for piece in pieces if any(ch.isalnum() for ch in piece))


def average_word_length(word_list):
    """Mean number of characters per word; 0.0 for no words."""
    if not word_list:
        return 0.0
    return sum(len(word) for word in word_list) / len(word_list)


def most_common_words(word_list, n=5, ignore=frozenset()):
    """The n most frequent words as (word, count) pairs, skipping words in ignore."""
    counts = Counter(word for word in word_list if word not in ignore)
    return counts.most_common(n)


def longest_words(word_list, n=3):
    """The n longest different words; equal lengths in alphabetical order."""
    return sorted(set(word_list), key=lambda word: (-len(word), word))[:n]


def load_stopwords(path):
    """Read one word per line into a set (lower-cased; skip blanks and # comments)."""
    stopwords = set()
    with open(path, encoding="utf-8") as file:
        for line in file:
            word = line.strip().lower()
            if word and not word.startswith("#"):
                stopwords.add(word)
    return stopwords


def analyze(text, stopwords=frozenset(), top=5):
    """Every statistic about text, in one dict."""
    word_list = words(text)
    return {
        "characters": len(text),
        "characters_no_spaces": sum(1 for ch in text if not ch.isspace()),
        "words": len(word_list),
        "unique_words": len(set(word_list)),
        "sentences": count_sentences(text),
        "average_word_length": average_word_length(word_list),
        "longest_words": longest_words(word_list),
        "top_words": most_common_words(word_list, top, stopwords),
    }
`

const REPORT_STARTER = py`"""Turns the statistics dict into a readable, aligned text report."""


def format_report(stats, title="Text report"):
    """Return the report as one string (lines joined with newlines)."""
    lines = [title, "=" * len(title)]
    lines.append(f"Words: {stats['words']}")
    # TODO (step 8): "No words found." for empty text, aligned label/value rows
    # for every statistic, and a ranked "Most common words:" section.
    return "\n".join(lines)
`

const REPORT = py`"""Turns the statistics dict into a readable, aligned text report."""

LABEL_WIDTH = 21
BAR_WIDTH = 20


def format_report(stats, title="Text report"):
    """Return the report as one string (lines joined with newlines)."""
    lines = [title, "=" * len(title)]
    if stats["words"] == 0:
        lines.append("No words found.")
        return "\n".join(lines)

    rows = [
        ("Characters", f"{stats['characters']} ({stats['characters_no_spaces']} without spaces)"),
        ("Words", stats["words"]),
        ("Unique words", stats["unique_words"]),
        ("Sentences", stats["sentences"]),
        ("Average word length", f"{stats['average_word_length']:.2f}"),
        ("Longest words", ", ".join(stats["longest_words"])),
    ]
    for name, value in rows:
        label = f"{name}:"
        lines.append(f"{label:<{LABEL_WIDTH}}{value}")

    lines.append("")
    lines.append("Most common words:")
    top_words = stats["top_words"]
    if not top_words:
        lines.append("  (none)")
    highest = top_words[0][1] if top_words else 1
    for rank, (word, count) in enumerate(top_words, start=1):
        bar = "#" * max(1, round(count / highest * BAR_WIDTH))
        lines.append(f"{rank:>3}. {word:<12}{count:>4}  {bar}")
    return "\n".join(lines)
`

const STORY_REPORT = py`story.txt
=========
Characters:          536 (436 without spaces)
Words:               99
Unique words:        61
Sentences:           14
Average word length: 4.12
Longest words:       lighthouse, fishermen, everyone

Most common words:
  1. lamp           5  ####################
  2. keeper         3  ############
  3. out            3  ############
  4. night          2  ########
  5. steps          2  ########`

export default {
  id: 'project-text-analyzer',
  kind: 'project',
  title: 'Project 3: Text Analyzer',
  summary: 'Read a text file and report its words, sentences, characters, most common words (Counter + re), average word length and longest words in a formatted report.',
  difficulty: 'beginner',
  minutes: 80,
  prerequisites: ['string-methods', 'dictionaries', 'reading-writing-files', 'collections-module'],
  related: ['project-todo-manager', 'project-expense-tracker', 'project-log-analyzer', 'regular-expressions', 'string-formatting', 'sets', 'comprehensions', 'list-operations', 'lambdas-and-higher-order', 'lazy-evaluation', 'unicode-and-bytes', 'command-line-programs', 'main-guard-and-scripts', 'pathlib'],
  tags: ['project', 'text analysis', 'word count', 'word frequency', 'Counter', 'most_common', 're', 'regex', 'findall', 'sentences', 'stop words', 'sorted key', 'report', 'f-string alignment', 'files', 'beginner project'],
  apis: [
    { name: 're.findall(pattern, text)', summary: 'Returns every non-overlapping match as a list of strings.' },
    { name: 're.split(pattern, text)', summary: 'Splits text wherever the pattern matches.' },
    { name: 'collections.Counter(iterable)', summary: 'A dict subclass that counts how often each item occurs.' },
    { name: 'Counter.most_common(n)', summary: 'The n most frequent (item, count) pairs; ties keep first-seen order.' },
    { name: 'sorted(items, key=...)', summary: 'Returns a new sorted list; key computes what to compare, e.g. (-len(w), w).' },
    { name: 'f"{value:<21}" / f"{n:>4}"', summary: 'Format-spec alignment: pad to a width, left (<) or right (>) aligned.' },
  ],
  docs: [
    { label: 'collections.Counter', url: 'https://docs.python.org/3/library/collections.html#collections.Counter' },
    { label: 're — regular expression operations', url: 'https://docs.python.org/3/library/re.html' },
    { label: 'Sorting techniques (key functions)', url: 'https://docs.python.org/3/howto/sorting.html' },
    { label: 'Format specification mini-language', url: 'https://docs.python.org/3/library/string.html#formatspec' },
    { label: 'Tutorial — reading and writing files', url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Point this program at any \`.txt\` file — a story, an essay, song lyrics, your own homework — and it prints a report: how many words and sentences, how long the average word is, the longest words, and the five words used most, with a little bar chart.`,
    py`Counting words *sounds* trivial — \`len(text.split())\` — until you notice that \`"Lamp"\`, \`"lamp,"\` and \`"lamp."\` are three different strings to Python. Doing it properly means cleaning text with a [regular expression](lesson:regular-expressions), normalising case, counting with [\`collections.Counter\`](lesson:collections-module), sorting with a custom key and lining up the output with [f-string formatting](lesson:string-formatting).`,
    py`You'll build \`textstats.py\` (pure counting functions), \`report.py\` (the formatted report) and a small \`main.py\` that reads the file. Two text files come with it: \`story.txt\` to analyse and \`stopwords.txt\`, a list of boring words (*the*, *and*, *of*…) to leave out of the top-words list.`,
  ],
  why: [
    py`Text is the most common data there is: emails, reviews, logs, chat messages, documents. Every search engine, spam filter, plagiarism checker and "word cloud" starts with the steps you'll write here — **tokenise** (split into words), **normalise** (same case, no punctuation), **count**, **rank**.`,
    py`It's also a perfect place to learn a key professional lesson: the "obvious" version is wrong in small ways that only careful tests reveal. \`split()\` keeps punctuation, counting dots miscounts \`"Wait..."\`, and dividing by the word count crashes on an empty file. You'll find and fix each one.`,
  ],
  eli15: [
    py`Imagine reading a book with a highlighter and a tally sheet. Every time you see a word, you write it on the sheet — but first you **rub off any punctuation** and write it in **small letters**, so "Lamp," and "lamp" go on the same line. Then you add a tally mark.`,
    py`At the end, the words with the most marks are the "most common words". Counting the full stops, question marks and exclamation marks tells you roughly how many sentences there were. Python's \`Counter\` is a ready-made tally sheet, and a regular expression is the highlighter that picks out just the words.`,
  ],
  analogy: {
    title: 'Sorting a bag of Scrabble tiles… for words',
    body: [
      py`Tip a jar of fridge-magnet words onto a table. Some are capitalised, some have commas stuck to them. To find which word appears most, you'd first clean each magnet (remove the comma, make it lower-case), then sort them into piles of identical words, then line the piles up from tallest to shortest.`,
      py`That's the whole program: \`words()\` cleans, \`Counter\` makes the piles, \`most_common()\` lines them up, and \`format_report()\` takes a photo of the table for you.`,
    ],
    mapping: [
      ['wiping commas off a magnet', 're.findall() keeping only word characters'],
      ['making every magnet lower-case', 'text.lower()'],
      ['piles of identical words', 'Counter — word → count'],
      ['lining piles up by height', 'counts.most_common(5)'],
      ['ignoring "the" and "and" magnets', 'skipping words that are in the stop-word set'],
      ['the photo of the table', 'format_report() — the printed report'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The text-analysis pipeline',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'file', label: 'story.txt', note: 'raw text', x: 90, y: 80, tone: 'kraft' },
        { id: 'text', label: 'text (str)', note: 'file.read()', x: 280, y: 80, tone: 'paper' },
        { id: 'words', label: 'word list', note: 'words(text)', x: 470, y: 80, tone: 'yellow' },
        { id: 'stats', label: 'stats dict', note: 'analyze()', x: 470, y: 250, tone: 'blue' },
        { id: 'stop', label: 'stopwords.txt', note: 'load_stopwords() → set', x: 680, y: 160, tone: 'kraft' },
        { id: 'report', label: 'report', note: 'format_report()', x: 200, y: 250, tone: 'ink' },
      ],
      edges: [
        { from: 'file', to: 'text', label: 'open + read' },
        { from: 'text', to: 'words', label: 'lower + findall' },
        { from: 'words', to: 'stats', label: 'Counter, len, sorted' },
        { id: 'sentences', from: 'text', to: 'stats', label: 'count_sentences', dashed: true },
        { from: 'stop', to: 'stats', label: 'ignore' },
        { from: 'stats', to: 'report', label: 'format' },
      ],
      steps: [
        { focus: ['file', 'text'], edges: ['file->text'], text: py`\`main.py\` opens the file with \`encoding="utf-8"\` and reads it into one string. A missing file becomes a clear error message.` },
        { focus: ['text', 'words'], edges: ['text->words'], text: py`\`words()\` lower-cases the text and uses a regular expression to pick out the words, leaving punctuation behind: \`"Lamp out."\` → \`["lamp", "out"]\`.` },
        { focus: ['text', 'stats'], edges: ['sentences'], text: py`Sentences are counted on the **original** text, because the punctuation that \`words()\` throws away is exactly what marks where a sentence ends.` },
        { focus: ['words', 'stats', 'stop'], edges: ['words->stats', 'stop->stats'], text: py`\`analyze()\` gathers every number into one dict: counts, unique words, average length, longest words, and the top words from a \`Counter\` that skips the stop words.` },
        { focus: ['stats', 'report'], edges: ['stats->report'], text: py`\`format_report()\` turns the dict into aligned lines and a bar chart. Keeping numbers and formatting apart means each can be tested on its own.` },
      ],
    },
    alt: 'Pipeline diagram: story.txt is read into a text string; words() turns the text into a list of lower-case words; count_sentences works on the original text; analyze() combines the word list, sentence count and a stop-word set loaded from stopwords.txt into a stats dict; format_report() turns the dict into the printed report.',
    caption: py`Data flows one way: **file → text → words → numbers → report**. Each arrow is one small function you can test with a one-line string.`,
  },
  animation: {
    type: 'comparison',
    title: 'Counting by hand vs Counter',
    props: {
      left: {
        label: 'A dict and a loop',
        lang: 'python',
        code: py`counts = {}
for word in word_list:
    if word in counts:
        counts[word] += 1
    else:
        counts[word] = 1

top = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)[:5]`,
      },
      right: {
        label: 'collections.Counter',
        lang: 'python',
        code: py`from collections import Counter

counts = Counter(word_list)
top = counts.most_common(5)`,
      },
      points: [
        'Both build the same word → count mapping in one pass over the words.',
        'Counter is a dict subclass: counts["lamp"] works, and a missing word gives 0 instead of KeyError.',
        'most_common(5) sorts by count for you; ties stay in the order the words were first seen.',
        'Write the loop once to understand it — then use Counter in real code.',
      ],
    },
    alt: 'Side-by-side code. Left: an empty dict and a for loop that increments counts[word] or sets it to 1, then sorted() by count. Right: Counter(word_list) and counts.most_common(5). Notes say both produce the same mapping, Counter returns 0 for missing words, and most_common sorts by count.',
  },

  // ------------------------------------------------------------------ plan
  requirements: [
    py`\`textstats.words(text)\` returns the lower-cased words of \`text\` with punctuation removed. A word is a run of letters, digits, underscores and apostrophes that starts and ends with a letter/digit/underscore — so \`"It's"\` → \`"it's"\` and \`'"Run,"'\` → \`"run"\`. Use the provided \`WORD_RE\`.`,
    py`\`textstats.count_sentences(text)\` splits the text at runs of \`.\`, \`!\` and \`?\` and counts the pieces that contain at least one letter or digit: \`"Wait... what?!"\` → 2, \`"No ending"\` → 1, \`""\` → 0.`,
    py`\`textstats.average_word_length(word_list)\` returns the mean length as a float, and \`0.0\` for an empty list.`,
    py`\`textstats.most_common_words(word_list, n=5, ignore=frozenset())\` returns up to \`n\` \`(word, count)\` pairs, most frequent first, ties in first-seen order, skipping words in \`ignore\`.`,
    py`\`textstats.longest_words(word_list, n=3)\` returns the \`n\` longest **different** words, longest first; equal lengths in alphabetical order.`,
    py`\`textstats.load_stopwords(path)\` reads one word per line into a lower-cased \`set\`, ignoring blank lines and lines starting with \`#\`.`,
    py`\`report.format_report(stats, title)\` returns the title, a line of \`=\` the same length, then one \`Label: value\` row per statistic (\`Characters\`, \`Words\`, \`Unique words\`, \`Sentences\`, \`Average word length\` with 2 decimals, \`Longest words\` comma-separated), a blank line, \`Most common words:\` and one ranked line per word like \`  1. lamp           5  ####\`. For text without words it returns the title, the underline and \`No words found.\`.`,
    py`\`main(argv)\` analyses \`argv[0]\` (default \`story.txt\`), prints the report and returns \`0\`; for a missing file it prints \`Error: no such file: {path}\` and returns \`1\`.`,
  ],
  objectives: [
    'Tokenise and normalise text with str.lower() and a regular expression.',
    'Count and rank items with collections.Counter and most_common().',
    'Sort with a key function that combines several criteria (longest first, then alphabetical).',
    'Guard calculations against empty input (no division by zero).',
    'Read text files safely with with/open/encoding and handle a missing file.',
    'Produce an aligned, readable report with f-string format specs.',
  ],

  // ------------------------------------------------------------------ build
  playground: {
    title: 'Text analyzer — starter',
    objective: 'Replace the naive versions in textstats.py and finish report.py until every test passes, then analyse a text of your own.',
    files: { 'main.py': MAIN, 'textstats.py': TEXTSTATS_STARTER, 'report.py': REPORT_STARTER, 'story.txt': STORY, 'stopwords.txt': STOPWORDS },
    expected: py`The starter runs and prints a two-line report with a **wrong** word count (\`split()\` counts \`"ninety-nine"\` as one word and keeps \`"lighthouse."\` with its full stop). When you're done, \`story.txt\` gives:

\`\`\`text
${STORY_REPORT}
\`\`\`

Then paste your own text into \`story.txt\` (or add a new \`.txt\` file and change the default in \`main.py\`) and run it again.`,
    tests: [
      { name: 'words() lower-cases and drops punctuation, keeping apostrophes inside words', code: py`from textstats import words
assert words("Hello, world! It's a WORLD.") == ["hello", "world", "it's", "a", "world"]` },
      { name: 'words() handles quotes, dashes and empty text', code: py`from textstats import words
assert words('"Run," she said -- "run!"') == ["run", "she", "said", "run"]
assert words("ninety-nine") == ["ninety", "nine"]
assert words("") == []` },
      { name: 'count_sentences counts . ! ? endings, not every dot', code: py`from textstats import count_sentences
assert count_sentences("One. Two! Three?") == 3
assert count_sentences("Wait... what?!") == 2
assert count_sentences("No ending") == 1
assert count_sentences("") == 0
assert count_sentences("   ") == 0` },
      { name: 'average_word_length is a float and safe for no words', code: py`from textstats import average_word_length
assert average_word_length(["hi", "there"]) == 3.5
assert average_word_length([]) == 0.0` },
      { name: 'most_common_words ranks by count; ties keep first-seen order', code: py`from textstats import most_common_words
assert most_common_words(["b", "a", "b", "c", "a", "b"], 2) == [("b", 3), ("a", 2)]
assert most_common_words(["sea", "lamp", "sea", "lamp"], 5) == [("sea", 2), ("lamp", 2)]` },
      { name: 'most_common_words skips stop words', code: py`from textstats import most_common_words, words
result = most_common_words(words("The cat and the hat. The end."), 2, ignore={"the", "and"})
assert result == [("cat", 1), ("hat", 1)]` },
      { name: 'longest_words: different words, longest first, ties alphabetical', code: py`from textstats import longest_words
assert longest_words(["sea", "lighthouse", "keeper", "lighthouse", "lantern"], 2) == ["lighthouse", "lantern"]
assert longest_words(["cab", "abc", "zz"], 2) == ["abc", "cab"]` },
      { name: 'load_stopwords reads stopwords.txt into a set', code: py`from textstats import load_stopwords
stop = load_stopwords("stopwords.txt")
assert isinstance(stop, set)
assert {"the", "and", "of"} <= stop
assert "" not in stop and not any(w.startswith("#") for w in stop), 'Skip blank lines and # comments'` },
      { name: 'analyze() puts every statistic in one dict', code: py`from textstats import analyze
stats = analyze("The cat sat. The cat ran!", stopwords={"the"})
assert stats["words"] == 6 and stats["unique_words"] == 4
assert stats["sentences"] == 2
assert stats["average_word_length"] == approx(3.0)
assert stats["longest_words"] == ["cat", "ran", "sat"]
assert stats["top_words"][0] == ("cat", 2)` },
      { name: 'format_report: aligned rows and a ranked top-words list', code: py`import re
from report import format_report
from textstats import analyze
report = format_report(analyze("The cat sat. The cat ran!"), title="cats.txt")
lines = report.splitlines()
assert lines[:2] == ["cats.txt", "========"]
assert re.search(r"^Words:\s+6$", report, re.M), 'Need a line like "Words:   6"'
assert re.search(r"^Sentences:\s+2$", report, re.M)
assert re.search(r"^Average word length:\s+3\.00$", report, re.M), 'Show the average with 2 decimals'
assert "Most common words:" in report
assert re.search(r"^\s*1\. the\s+2\b", report, re.M) and re.search(r"^\s*2\. cat\s+2\b", report, re.M)` },
      { name: 'format_report says "No words found." for empty text', code: py`from report import format_report
from textstats import analyze
assert format_report(analyze("  ...  "), title="empty.txt") == "empty.txt\n=========\nNo words found."` },
      { name: 'main() reports on story.txt and handles a missing file', code: py`import re
assert re.search(r"^Words:\s+99$", output, re.M), 'story.txt has 99 words'
assert re.search(r"^Sentences:\s+14$", output, re.M)
assert re.search(r"^\s*1\. lamp\s+5\b", output, re.M), '"lamp" is the most common non-stop word'
result = []
out = capture(lambda: result.append(main(["missing.txt"])))
assert result == [1] and "Error: no such file: missing.txt" in out` },
    ],
  },
  steps: [
    {
      title: 'Plan the pipeline',
      body: [
        py`Write down what happens to the data, in order: **read** the file into a string → **split** it into clean words → **count** things → **format** a report. Each arrow becomes a function, and each function gets a plain string or list and returns a plain value.`,
        py`| function | input → output |
|---|---|
| \`words(text)\` | \`"Lamp out."\` → \`["lamp", "out"]\` |
| \`count_sentences(text)\` | \`"Hi. Bye!"\` → \`2\` |
| \`average_word_length(words)\` | \`["hi", "there"]\` → \`3.5\` |
| \`most_common_words(words, n, ignore)\` | → \`[("lamp", 5), …]\` |
| \`longest_words(words, n)\` | → \`["lighthouse", …]\` |
| \`analyze(text, stopwords)\` | → one dict with all of the above |
| \`format_report(stats, title)\` | dict → the printed report |`,
        py`\`analyze()\` is already written in the starter: it's just a dict that calls the other functions. Read it first — it's the table of contents for everything you're about to build. \`main.py\` (also complete) reads the file and prints the report.`,
      ],
    },
    {
      title: 'Find the words: why split() is not enough',
      body: [
        py`Try the naive version and look closely:`,
        { code: py`text = "The lamp went out. The keeper lit the Lamp!"
print(text.split())
# ['The', 'lamp', 'went', 'out.', 'The', 'keeper', 'lit', 'the', 'Lamp!']`, lang: 'python', title: 'split() keeps punctuation and capitals' },
        py`\`"lamp"\`, \`"Lamp!"\` — and \`"The"\`/\`"the"\` — would be counted as different words. Two fixes: lower-case everything first, then let a [regular expression](lesson:regular-expressions) pick out only the word characters:`,
        { code: py`import re

WORD_RE = re.compile(r"\b[\w']+\b")


def words(text):
    return WORD_RE.findall(text.lower())


print(words("The lamp went out. The keeper lit the Lamp!"))
print(words("It's \"ninety-nine\" steps, isn't it?"))`, lang: 'python', title: 'textstats.py — words' },
        py`Reading the pattern \`\b[\w']+\b\`:`,
        py`- \`[\w']+\` — one or more characters that are **word characters** (\`\w\`: letters in any language, digits, underscore) **or apostrophes**. So \`it's\` and \`isn't\` stay whole.
- \`\b\` — a **word boundary**: the match must start and end next to a word character, which trims apostrophes used as quote marks (\`'tis\` → \`tis\`).
- \`re.findall\` returns every match as a list of strings; \`re.compile\` builds the pattern once, at import time, and gives it a readable name.`,
        py`Hyphens aren't word characters, so \`ninety-nine\` becomes two words. That's a **choice**, not a law of nature — word counters disagree on it. Write your choice down (we did, in the requirements) and test it.`,
        { callout: 'tip', title: 'Raw strings for regexes', text: py`Always write patterns as raw strings, \`r"..."\`, so Python leaves the backslashes alone and \`\b\` reaches the regex engine as "word boundary" instead of becoming a backspace character.` },
      ],
    },
    {
      title: 'Count sentences (a simplified rule)',
      body: [
        py`\`text.count(".")\` gets this wrong twice: it ignores \`?\` and \`!\`, and \`"Wait..."\` counts as three sentences. Instead, **split** the text at every run of sentence-ending punctuation and count the pieces that still contain a letter or digit:`,
        { code: py`import re

SENTENCE_END_RE = re.compile(r"[.!?]+")


def count_sentences(text):
    pieces = SENTENCE_END_RE.split(text)
    return sum(1 for piece in pieces if any(ch.isalnum() for ch in piece))


print(SENTENCE_END_RE.split("Wait... what?!"))   # ['Wait', ' what', '']
print(count_sentences("Wait... what?!"))         # 2`, lang: 'python', title: 'textstats.py — count_sentences' },
        py`\`[.!?]+\` means "one or more of these three characters", so \`...\` and \`?!\` are each **one** separator. The empty string after the last \`!\` has no letters, so it isn't counted — and a final sentence *without* punctuation still is.`,
        py`\`sum(1 for … if …)\` counts how many items pass a test, using a [generator expression](lesson:lazy-evaluation) (no temporary list). \`any(ch.isalnum() for ch in piece)\` stops at the first letter or digit it finds.`,
        { callout: 'warn', title: 'Simplified', text: py`This rule miscounts abbreviations (\`"Dr. Lee arrived."\` counts 2) and decimals (\`"3.5"\` splits into two pieces). Real sentence splitters (e.g. in the third-party NLTK or spaCy libraries) use lists of abbreviations or trained models. For a word-count report, the simple rule is good enough — and the tests document exactly what it does.` },
      ],
    },
    {
      title: 'Characters and the average word length',
      body: [
        py`Two character counts are useful: everything (\`len(text)\`, including spaces and newlines) and everything except whitespace. \`analyze()\` already does both:`,
        { code: py`text = "Hi there.\n"
print(len(text))                                   # 10
print(sum(1 for ch in text if not ch.isspace()))   # 8`, lang: 'python', title: 'two character counts' },
        py`The average word length is total letters ÷ number of words — which **crashes** on an empty file with \`ZeroDivisionError\`. Guard it:`,
        { code: py`def average_word_length(word_list):
    if not word_list:
        return 0.0
    return sum(len(word) for word in word_list) / len(word_list)


print(average_word_length(["hi", "there"]))   # 3.5
print(average_word_length([]))                # 0.0`, lang: 'python', title: 'textstats.py — average_word_length' },
        py`\`/\` always returns a \`float\` in Python 3, even for \`6 / 2\` (\`3.0\`). We'll round it only when **displaying** it, never in the calculation (see [numbers](lesson:numbers-and-math)).`,
      ],
    },
    {
      title: 'The most common words with Counter',
      body: [
        py`[\`collections.Counter\`](lesson:collections-module) is a dict that counts. Give it any iterable and it tallies the items; \`most_common(n)\` returns the top \`n\` as \`(item, count)\` pairs:`,
        { code: py`from collections import Counter


def most_common_words(word_list, n=5, ignore=frozenset()):
    counts = Counter(word for word in word_list if word not in ignore)
    return counts.most_common(n)


words = ["the", "lamp", "the", "keeper", "lamp", "the", "lamp"]
print(most_common_words(words, 2))                   # [('the', 3), ('lamp', 3)]
print(most_common_words(words, 2, ignore={"the"}))   # [('lamp', 3), ('keeper', 1)]`, lang: 'python', title: 'textstats.py — most_common_words' },
        py`Without stop words, *the* and *a* win every contest, which tells you nothing about the text. Passing them as a **set** makes \`word not in ignore\` a fast hash lookup (see [sets](lesson:sets)).`,
        py`Why \`ignore=frozenset()\` and not \`ignore=set()\`? Default values are created **once**, when the function is defined, and shared by every call. An immutable \`frozenset\` can't be accidentally modified, so it's a safe default (see [function arguments](lesson:function-arguments)).`,
        { callout: 'note', title: 'Ties are deterministic', text: py`\`Counter.most_common\` lists equal counts in the order the items were **first encountered** (documented behaviour, relying on dicts keeping insertion order). That's why the tests can expect \`[("sea", 2), ("lamp", 2)]\` exactly.` },
      ],
    },
    {
      title: 'The longest words: sorting with a key',
      body: [
        py`We want *different* words (\`set\` removes duplicates), longest first, and a fixed order for words of equal length (alphabetical), so the output is the same every run. One \`sorted\` call with a **key function** does it all:`,
        { code: py`def longest_words(word_list, n=3):
    return sorted(set(word_list), key=lambda word: (-len(word), word))[:n]


print(longest_words(["sea", "lighthouse", "keeper", "lighthouse", "lantern"]))
# ['lighthouse', 'lantern', 'keeper']`, lang: 'python', title: 'textstats.py — longest_words' },
        py`\`sorted\` compares the **keys**, not the words. The key is a tuple: Python compares tuples item by item, so \`-len(word)\` decides first (a bigger length gives a smaller negative number, so longer words come first), and only when lengths tie does \`word\` decide, alphabetically. The \`lambda\` is a tiny unnamed function (see [lambdas](lesson:lambdas-and-higher-order)).`,
        py`Sorting a set matters: sets have no reliable order, so \`list(set(words))[:3]\` could give different answers on different runs. Always sort before you slice.`,
      ],
    },
    {
      title: 'Read the files',
      body: [
        py`Two files are read. The stop-word file has one word per line, plus comments:`,
        { code: py`def load_stopwords(path):
    stopwords = set()
    with open(path, encoding="utf-8") as file:
        for line in file:
            word = line.strip().lower()
            if word and not word.startswith("#"):
                stopwords.add(word)
    return stopwords`, lang: 'python', title: 'textstats.py — load_stopwords' },
        py`- \`with open(...)\` closes the file automatically, even if something goes wrong (see [reading & writing files](lesson:reading-writing-files)).
- Looping over a file object gives one line at a time **including its \`\n\`**, which \`strip()\` removes.
- \`encoding="utf-8"\` matters: without it, Python uses the operating system's default, and a file with "café" can fail on one computer and work on another.`,
        py`\`main.py\` reads the text the same way but all at once with \`file.read()\`, and turns \`FileNotFoundError\` into \`Error: no such file: …\` with exit status 1 — the convention for "something went wrong" in command-line tools (see [command-line programs](lesson:command-line-programs)).`,
      ],
    },
    {
      title: 'Format the report',
      body: [
        py`The numbers are done; now make them readable. Format specs inside f-strings pad values to a fixed width: \`<\` aligns left, \`>\` aligns right, and \`.2f\` shows two decimals:`,
        { code: py`label = "Words:"
print(f"{label:<21}{99}")          # 'Words:' padded to 21 characters, then 99
print(f"{4.121212:.2f}")           # 4.12
print(f"{1:>3}. {'lamp':<12}{5:>4}")   # '  1. lamp           5'`, lang: 'python', title: 'alignment with format specs' },
        { code: REPORT, lang: 'python', title: 'report.py' },
        py`Details worth noticing:`,
        py`- The width can itself be a variable: \`f"{label:<{LABEL_WIDTH}}"\` — nested braces inside the format spec.
- The bar chart scales every count against the highest one, so the top word always gets \`BAR_WIDTH\` hashes and no word gets zero (\`max(1, …)\`).
- \`enumerate(top_words, start=1)\` numbers the ranks; \`(word, count)\` unpacks each pair in the \`for\` line.
- Empty text is handled up front with an early \`return\`, instead of printing a report full of zeros.`,
        py`Press **Run tests**. When all twelve pass, press **Run**: the report for \`story.txt\` should match the one shown above the starter.`,
      ],
    },
  ],
  challenges: [
    'Read a file name from the command line properly with argparse, with options --top N and --no-stopwords.',
    'Treat curly apostrophes (’) like straight ones by replacing them before splitting, and add a test for "don’t".',
    'Add a "reading time" line (words ÷ 200 words per minute, rounded up with math.ceil) and a "lexical diversity" line (unique words ÷ words).',
    'Compare two files: print the words that appear in one but not the other, using set difference.',
    'Count bigrams (pairs of neighbouring words) with zip(word_list, word_list[1:]) and Counter, and show the top 5.',
    'Make it work on huge files: read line by line and update the Counter per line instead of reading everything with read().',
    'Write the report to report.txt as well as printing it, and the stats dict to stats.json.',
  ],
  solution: {
    files: { 'main.py': MAIN, 'textstats.py': TEXTSTATS, 'report.py': REPORT, 'story.txt': STORY, 'stopwords.txt': STOPWORDS },
    explanation: [
      py`The finished analyzer is a one-way pipeline split into small, testable pieces:`,
      py`- **\`textstats.py\`** — \`words()\` lower-cases and extracts words with \`\b[\w']+\b\`; \`count_sentences()\` splits on runs of \`.!?\` and counts pieces with a letter or digit; \`average_word_length()\` guards against empty input; \`most_common_words()\` filters stop words into a \`Counter\` and calls \`most_common(n)\`; \`longest_words()\` sorts the *set* of words by \`(-len(word), word)\`; \`load_stopwords()\` reads a commented word list into a set; \`analyze()\` gathers everything into one dict.
- **\`report.py\`** — aligned \`Label: value\` rows with format specs, a ranked list with scaled \`#\` bars, and an early return for empty text.
- **\`main.py\`** — reads the file named on the command line (default \`story.txt\`) with UTF-8, reports a missing file with exit status 1.`,
      py`Because counting and formatting are separate pure functions, the tests can check each rule — punctuation, ties, empty input, alignment — with tiny strings, and one final test checks the real report end to end.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`Counter\` is a dictionary underneath: each word is a **key**, its count is the **value**. Adding a word looks up its key (fast, thanks to hashing — see [dictionaries](lesson:dictionaries)) and adds 1. That's why counting a whole book takes one quick pass, no matter how many different words it has.`,
      { code: py`from collections import Counter

counts = Counter(["lamp", "sea", "lamp"])
print(counts)            # Counter({'lamp': 2, 'sea': 1})
print(counts["lamp"])    # 2
print(counts["whale"])   # 0 — missing words count as zero, no KeyError
print(isinstance(counts, dict))   # True`, lang: 'python', title: 'Counter is a dict' },
    ],
    technical: [
      py`Counting is linear: each word is hashed and updated once, so the work grows in step with the length of the text. \`most_common(n)\` with a small \`n\` uses a heap (\`heapq.nlargest\`) instead of sorting every distinct word; with no \`n\` it sorts them all.`,
      py`In Python 3, \`str\` patterns are **Unicode-aware** by default: \`\w\` matches "é", "ß", "ж" and digits from other scripts. Add the \`re.ASCII\` flag if you only want \`[a-zA-Z0-9_]\`. Case-insensitive comparison across languages is better done with \`str.casefold()\` than \`str.lower()\` — for example \`"Straße".casefold() == "strasse"\`.`,
      py`\`re.compile\` is optional — the \`re\` module caches recently used patterns — but naming a compiled pattern at module level documents it and avoids a cache lookup on every call.`,
    ],
    production: [
      py`\`file.read()\` loads the whole file into memory. For multi-gigabyte inputs, iterate line by line and call \`counts.update(words(line))\`: memory then depends on the number of *distinct* words, not the size of the file.`,
      py`Text from the outside world arrives in many encodings. Decide explicitly (\`encoding="utf-8"\`), and choose an \`errors=\` policy (\`"replace"\` to keep going with � for bad bytes, the default \`"strict"\` to fail loudly). See [Unicode & bytes](lesson:unicode-and-bytes).`,
      py`Serious natural-language work uses third-party libraries (NLTK, spaCy) for tokenisation, sentence splitting and lemmatisation (*ran* → *run*). Their results differ from our regex in edge cases, so pin the library version and test the outputs your product depends on.`,
    ],
  },
  mistakes: [
    {
      title: 'Counting words with split() and forgetting case',
      wrong: { code: py`from collections import Counter

text = "The lamp. the LAMP!"
print(Counter(text.split()))   # 4 different "words", each counted once`, lang: 'python' },
      right: { code: py`import re
from collections import Counter

text = "The lamp. the LAMP!"
print(Counter(re.findall(r"\b[\w']+\b", text.lower())))   # the: 2, lamp: 2`, lang: 'python' },
      explanation: py`\`split()\` only splits on whitespace, so punctuation stays glued to words, and \`"The"\` ≠ \`"the"\`. Normalise case and extract words with a pattern before counting.`,
    },
    {
      title: 'Dividing by the word count without a guard',
      wrong: { code: py`def average_word_length(word_list):
    return sum(len(w) for w in word_list) / len(word_list)   # ZeroDivisionError on []`, lang: 'python' },
      right: { code: py`def average_word_length(word_list):
    if not word_list:
        return 0.0
    return sum(len(w) for w in word_list) / len(word_list)`, lang: 'python' },
      explanation: py`Empty files, files of only punctuation and files with only stop words all exist. Decide what the answer should be for "nothing" and return it explicitly.`,
    },
    {
      title: 'Slicing a set (random-looking results)',
      wrong: { code: py`words = ["sea", "lighthouse", "keeper", "lantern"]
print(list(set(words))[:2])   # order is not defined`, lang: 'python' },
      right: { code: py`words = ["sea", "lighthouse", "keeper", "lantern"]
print(sorted(set(words), key=lambda w: (-len(w), w))[:2])   # ['lighthouse', 'lantern']`, lang: 'python' },
      explanation: py`Sets are unordered: the order you see can change between runs (string hashes are randomised per process). Sort with an explicit key before taking the "first" items.`,
    },
    {
      title: 'A mutable default for the ignore list',
      wrong: { code: py`def most_common_words(word_list, n=5, ignore=set()):
    ignore.add("the")         # changes the shared default for every later call
    ...`, lang: 'python', static: true },
      right: { code: py`def most_common_words(word_list, n=5, ignore=frozenset()):
    ignore = set(ignore) | {"the"}   # build a new set; the default is untouched
    ...`, lang: 'python', static: true },
      explanation: py`Default values are evaluated once, when \`def\` runs. A mutable default (\`set()\`, \`[]\`, \`{}\`) is shared between calls, so changes leak from one call into the next. Use an immutable default (\`frozenset()\`, \`()\`) or \`None\`.`,
    },
    {
      title: 'Opening files without an encoding',
      wrong: { code: py`with open("story.txt") as file:      # uses the OS default encoding
    text = file.read()`, lang: 'python' },
      right: { code: py`with open("story.txt", encoding="utf-8") as file:
    text = file.read()`, lang: 'python' },
      explanation: py`The default text encoding depends on the platform and its settings, so the same file can be read correctly on one machine and raise \`UnicodeDecodeError\` (or show garbled "cafÃ©") on another. State the encoding every time.`,
    },
  ],
  debugging: [
    {
      symptom: py`ZeroDivisionError: division by zero`,
      cause: py`The average was computed for an empty word list — an empty file, or one with only punctuation.`,
      fix: py`Return \`0.0\` (or \`None\`) early when the list is empty, and add a test with \`""\`.`,
    },
    {
      symptom: py`UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 12: invalid continuation byte`,
      cause: py`The file isn't UTF-8 — often an older file saved as Latin-1/Windows-1252.`,
      fix: py`Open it with the right encoding (\`encoding="latin-1"\`), or re-save it as UTF-8. For "best effort" reading use \`errors="replace"\`.`,
    },
    {
      symptom: py`The top words are "the", "and", "a", "of"…`,
      cause: py`Stop words aren't being skipped — the set wasn't passed through, or its words aren't lower-case (or still contain \`\n\`).`,
      fix: py`Print the stop-word set; \`strip()\` and \`lower()\` each line when loading, and pass the set as \`ignore\`.`,
    },
    {
      symptom: py`"lamp" and "lamp." appear as separate entries.`,
      cause: py`Words were produced with \`split()\` (or the regex isn't applied).`,
      fix: py`Use \`words()\` everywhere; print \`words(text)[:20]\` to inspect the tokens.`,
    },
    {
      symptom: py`FileNotFoundError: [Errno 2] No such file or directory: 'story.txt'`,
      cause: py`The program is running in a different folder from the file (relative paths are relative to the *current working directory*, not to the script).`,
      fix: py`Print \`Path.cwd()\`; run from the project folder, or build the path from \`Path(__file__).parent\` (see [pathlib](lesson:pathlib)).`,
    },
  ],
  bestPractices: [
    'Normalise before counting: one case, no punctuation, consistent apostrophes.',
    'Write down your tokenising rules (hyphens, apostrophes, digits) and test them with tiny strings.',
    'Use Counter for frequencies and most_common() for rankings instead of hand-written loops.',
    'Always sort before slicing anything that came from a set or dict you didn\'t order yourself.',
    'Guard every division and every "first item" access against empty input.',
    'Open text files with with open(..., encoding="utf-8").',
  ],
  useCases: [
    'Word clouds, keyword extraction and "trending topics".',
    'Readability tools: average word and sentence length feed readability scores.',
    'Search engines and spam filters, which start by tokenising and counting words.',
    'Log analysis: counting error codes, IP addresses or endpoints (see the log-analyzer project).',
    'Checking essays for over-used words.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-text-analyzer-q1',
      type: 'output',
      prompt: 'What does this print?',
      code: py`print("Hello, world! Hello.".split())`,
      options: [
        "['Hello,', 'world!', 'Hello.']",
        { text: "['hello', 'world', 'hello']", why: 'split() neither lower-cases nor removes punctuation; it only splits on whitespace.' },
        { text: "['Hello', 'world', 'Hello']", why: 'The comma, exclamation mark and full stop stay attached to the words.' },
        { text: "['Hello, world! Hello.']", why: 'With no argument, split() splits on runs of whitespace, so there are three pieces.' },
      ],
      answer: 0,
      explanation: py`That's why the analyzer uses \`re.findall\` on lower-cased text: otherwise \`"Hello,"\` and \`"Hello."\` would be counted as different words.`,
    },
    {
      id: 'project-text-analyzer-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from collections import Counter

print(Counter("banana").most_common(2))`,
      answer: "[('a', 3), ('n', 2)]",
      accept: ["[('a', 3), ('n', 2)]", '[("a", 3), ("n", 2)]'],
      explanation: py`A string is an iterable of characters, so \`Counter("banana")\` counts letters: a → 3, n → 2, b → 1. \`most_common(2)\` returns the top two as \`(item, count)\` tuples.`,
    },
    {
      id: 'project-text-analyzer-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`words = ["sea", "keeper", "lantern", "wick", "lighthouse"]
print(sorted(words, key=lambda w: (-len(w), w))[:3])`,
      options: [
        "['lighthouse', 'lantern', 'keeper']",
        { text: "['keeper', 'lantern', 'lighthouse']", why: 'That is plain alphabetical order. The key sorts by -len(w) first, so longer words come first.' },
        { text: "['sea', 'wick', 'keeper']", why: 'That would be shortest first. Negating the length reverses the order.' },
        { text: "['lighthouse', 'keeper', 'lantern']", why: 'lantern (7 letters) is longer than keeper (6).' },
      ],
      answer: 0,
      explanation: py`The keys are \`(-10, 'lighthouse')\`, \`(-7, 'lantern')\`, \`(-6, 'keeper')\`, \`(-4, 'wick')\`, \`(-3, 'sea')\`. Sorting ascending puts the most negative — the longest word — first.`,
    },
    {
      id: 'project-text-analyzer-q4',
      type: 'bug',
      prompt: 'The analyzer crashes on an empty file. Click the line that raises the error.',
      code: py`def average_word_length(word_list):
    total = 0
    for word in word_list:
        total += len(word)
    return total / len(word_list)

print(average_word_length([]))`,
      answerLine: 5,
      explanation: py`With no words, \`len(word_list)\` is \`0\` and \`total / 0\` raises \`ZeroDivisionError\`. Return \`0.0\` early when the list is empty.`,
    },
    {
      id: 'project-text-analyzer-q5',
      type: 'fill',
      prompt: 'Complete the code that extracts lower-case words and returns the 3 most frequent.',
      code: py`import re
from collections import Counter

word_list = re.___(r"\b[\w']+\b", text.lower())
top = Counter(word_list).___(3)`,
      answer: [['findall'], ['most_common']],
      explanation: py`\`re.findall\` returns every match as a list; \`Counter(...).most_common(3)\` returns the three highest \`(word, count)\` pairs.`,
    },
    {
      id: 'project-text-analyzer-q6',
      type: 'mcq',
      prompt: 'Why does `count_sentences` work on the original text instead of the word list?',
      options: [
        { text: 'Because the word list is lower-case', why: 'Case has nothing to do with sentence endings.' },
        'Because words() throws away the punctuation (. ! ?) that marks where sentences end',
        { text: 'Because lists cannot be searched with regular expressions', why: 'True-ish, but the real reason is that the information is gone from the word list.' },
        { text: 'For speed only', why: 'It is about correctness: the needed characters are not in the word list.' },
      ],
      answer: 1,
      explanation: py`Each step of a pipeline discards information. Decide *before* each step which later calculations still need what it throws away.`,
    },
    {
      id: 'project-text-analyzer-q7',
      type: 'short',
      prompt: 'Name one kind of text our simple sentence counter gets wrong, and say why.',
      answer: py`Abbreviations such as "Dr. Lee arrived." (counted as 2) or decimal numbers like "It costs 3.50 today." (the dot splits it), because the rule treats every run of . ! ? as the end of a sentence. Real sentence splitters use abbreviation lists or trained models.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-text-analyzer-counter',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is collections.Counter, and how would you find the five most common words in a text with it?',
      answer: 'Counter is a dict subclass that maps items to how many times they occur. Normalise the text into words (lower-case, punctuation removed), pass them to Counter, and call most_common(5).',
      explanation: py`Because Counter is a dict, counting is one hash-table update per word — a single linear pass. Missing keys return 0, Counters support \`+\`, \`-\`, \`update()\` and \`total()\` (3.10+), and \`most_common(n)\` returns the top items with ties in first-seen order.`,
      code: { lang: 'python', code: py`import re
from collections import Counter

text = "The lamp went out. The keeper lit the lamp."
counts = Counter(re.findall(r"\b[\w']+\b", text.lower()))
print(counts.most_common(2))   # [('the', 3), ('lamp', 2)]` },
      whyAsked: 'Frequency counting is one of the most common small tasks in interviews and real code; Counter shows standard-library fluency.',
      mistakes: ['Forgetting to normalise case and punctuation', 'Sorting the whole dict by hand when most_common exists', 'Saying Counter is slower than a manual dict loop without measuring'],
      followUps: ['How would you count words across many files?', 'What does Counter subtraction do with negative counts?', 'How would you count without Counter?'],
      modelAnswer: 'Counter, from the collections module, is a dictionary subclass for tallying: keys are items and values are counts, and a missing key reads as zero. To get the five most common words I would first normalise the text — lower-case it and extract words with a regular expression so punctuation does not create separate entries — then build Counter(words) and call most_common(5). Counting is a single pass over the words, and most_common with a small n uses a heap rather than sorting everything. Ties come back in the order the words were first seen.',
    },
    {
      id: 'project-text-analyzer-hapax',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Write `words_used_once(text)` that returns, in alphabetical order, the words that appear exactly once in `text`. Treat words case-insensitively and ignore punctuation (use the regex `\\b[\\w\']+\\b` on the lower-cased text).',
      answer: 'Extract lower-cased words with re.findall, count them with Counter, keep the words whose count is 1, and return them sorted.',
      explanation: py`This is a two-pass job: you can't know a word appears only once until you've seen the whole text. Counter does the first pass; a comprehension over \`counts.items()\` does the second. Sorting makes the result deterministic.`,
      starter: { files: { 'main.py': py`import re
from collections import Counter


def words_used_once(text):
    """Alphabetically sorted words that occur exactly once (case-insensitive)."""
    # TODO
    return []


print(words_used_once("The sea, the sky. The SEA again!"))
` } },
      tests: [
        { name: 'finds the words used once, sorted', code: py`assert words_used_once("The sea, the sky. The SEA again!") == ["again", "sky"]` },
        { name: 'is case-insensitive and ignores punctuation', code: py`assert words_used_once("Lamp! lamp, LAMP. Wick") == ["wick"]` },
        { name: 'returns [] for empty text', code: py`assert words_used_once("") == []` },
      ],
      solution: { files: { 'main.py': py`import re
from collections import Counter


def words_used_once(text):
    """Alphabetically sorted words that occur exactly once (case-insensitive)."""
    counts = Counter(re.findall(r"\b[\w']+\b", text.lower()))
    return sorted(word for word, count in counts.items() if count == 1)


print(words_used_once("The sea, the sky. The SEA again!"))
` } },
      hints: ['Start by getting a clean list of words: re.findall(pattern, text.lower()).', 'Counter(word_list).items() gives (word, count) pairs.', 'sorted(word for word, count in counts.items() if count == 1)'],
      whyAsked: 'Checks normalisation, counting and filtering — and whether you remember to make the output order deterministic.',
      mistakes: ['Using list.count() inside a loop (quadratic time)', 'Forgetting to lower-case', 'Returning words in set or dict order instead of sorted'],
      followUps: ['What is the time complexity?', 'How would you return the words in order of first appearance instead?', 'How would you do it for a file too big for memory?'],
      modelAnswer: 'I normalise first: lower-case the text and pull out words with re.findall, so punctuation and capitals don\'t create fake distinct words. Then Counter gives me every word\'s count in one linear pass. A generator over counts.items() keeps the words whose count is exactly one, and sorted() makes the output deterministic. Calling list.count for each word would also work but would be quadratic, which matters for long texts.',
    },
    {
      id: 'project-text-analyzer-big-file',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Your analyzer works on short stories, but someone runs it on a 20 GB dump of chat logs and it runs out of memory. What do you change?',
      answer: 'Stop reading the whole file with read(). Iterate over the file line by line and update a Counter per line (counts.update(words(line))), keeping only running totals. Memory then depends on the number of distinct words, not the file size.',
      explanation: py`A file object is an iterator over lines, so \`for line in file:\` reads a little at a time. All our statistics can be computed incrementally: running totals for characters, words and word lengths; a Counter for frequencies; sentence counts per line (with care for sentences that span lines). Only the distinct-word data structures grow, and they're bounded by the vocabulary. If even that is too big, approximate algorithms (e.g. Count-Min Sketch) or a database/map-reduce job take over.`,
      code: { lang: 'python', code: py`import re
from collections import Counter

WORD_RE = re.compile(r"\b[\w']+\b")


def count_words_streaming(path):
    counts = Counter()
    with open(path, encoding="utf-8", errors="replace") as file:
        for line in file:                     # one line in memory at a time
            counts.update(WORD_RE.findall(line.lower()))
    return counts` },
      whyAsked: 'Tests whether you can reason about memory and streaming — a jump from "works on my sample" to "works in production".',
      mistakes: ['Suggesting a bigger machine as the only fix', 'Reading in fixed-size chunks and splitting words at chunk boundaries', 'Forgetting that the Counter itself can still grow large'],
      followUps: ['How would you parallelise it?', 'Which statistics are hard to compute in a streaming way (e.g. median word length)?', 'How do you handle encoding errors in a huge file?'],
      modelAnswer: 'The problem is file.read(), which loads all 20 gigabytes into one string. I would iterate over the file object line by line and update the statistics incrementally — a running word count and total length, and a Counter updated with each line\'s words. Memory then grows with the vocabulary rather than the file size. I would open it with an explicit encoding and errors="replace" so one bad byte doesn\'t stop a long job. If the vocabulary itself were too large, I would move to an approximate counter or split the work across machines and merge the Counters.',
    },
    {
      id: 'project-text-analyzer-tokenizer-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare three ways to split text into words: str.split(), a regex like \\b[\\w\']+\\b, and an NLP library tokenizer (e.g. spaCy). When would you use each?',
      answer: 'split() is fastest and fine for clean, whitespace-separated tokens (IDs, CSV-ish data) but keeps punctuation. A regex handles punctuation and apostrophes with explicit, testable rules — good for word counts and search. An NLP tokenizer handles language-specific cases (abbreviations, "don\'t" → do + n\'t, URLs, emoji, languages without spaces) at the cost of a large dependency and slower speed.',
      explanation: py`The right tool depends on how much linguistic accuracy you need. Our regex is a deliberate middle ground: standard library only, easy to test, good enough for statistics. Note it still treats hyphens and curly apostrophes in a particular way — every tokenizer makes choices you should test for your data.`,
      whyAsked: 'Shows judgement about trade-offs rather than knowledge of one API.',
      mistakes: ['Claiming one approach is always correct', 'Ignoring languages without spaces (Chinese, Japanese)', 'Adding a heavy dependency for a simple word count'],
      followUps: ['How would you handle URLs and e-mail addresses?', 'What is stemming vs lemmatisation?', 'How do you test a tokenizer?'],
      modelAnswer: 'str.split is the simplest and fastest, splitting only on whitespace, so it\'s fine when tokens are already clean but it leaves punctuation attached. A regular expression lets me define words explicitly — letters, digits and inner apostrophes — which is standard-library only and easy to unit-test; that\'s what I would use for word statistics. When accuracy across languages and edge cases matters — abbreviations, contractions, URLs, languages without spaces — I would reach for an NLP library tokenizer and accept the dependency and the slower speed. Whichever I choose, I would write tests with the tricky inputs that matter for the product.',
    },
    {
      id: 'project-text-analyzer-encoding',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A user\'s file crashes the analyzer with `UnicodeDecodeError: \'utf-8\' codec can\'t decode byte 0xe9 in position 12`. What is going on and how do you fix it?',
      answer: 'The file isn\'t valid UTF-8 — byte 0xE9 is "é" in Latin-1/Windows-1252. Open it with the correct encoding (encoding="cp1252" or "latin-1"), or re-save it as UTF-8; use errors="replace" only if losing those characters is acceptable.',
      explanation: py`Files store bytes; an encoding says how bytes map to characters. In UTF-8, "é" is two bytes (\`C3 A9\`), so a lone \`E9\` is invalid. Guessing the encoding is unreliable; the best fix is to know it (ask, or check the source) and standardise on UTF-8.`,
      whyAsked: 'Encoding bugs are among the most common real-world file problems.',
      mistakes: ['Saying "Python can\'t read accents"', 'Wrapping everything in try/except and skipping the file', 'Using errors="ignore" and silently losing data'],
      followUps: ['What is the difference between str and bytes?', 'Why does the same code work on one computer and fail on another?', 'What does errors="replace" do?'],
      modelAnswer: 'Python is decoding the file\'s bytes as UTF-8, and byte E9 on its own isn\'t valid UTF-8 — it\'s how Latin-1 or Windows-1252 store "é". So the file was saved in a legacy encoding. The fix is to open it with that encoding, or better, convert the file to UTF-8 once. If I can\'t know the encoding and approximate text is acceptable, errors="replace" keeps the job running with replacement characters, but I wouldn\'t silently ignore errors. I always pass the encoding explicitly so behaviour doesn\'t depend on the machine.',
    },
  ],

  takeaways: [
    'Text analysis is a pipeline: read → tokenise → normalise → count → rank → format.',
    'split() is not a tokenizer: lower-case and extract words with a regex such as \\b[\\w\']+\\b.',
    'Counter counts in one pass, returns 0 for missing items, and most_common(n) ranks with stable tie order.',
    'sorted() with a tuple key like (-len(w), w) expresses "longest first, then alphabetical" in one line.',
    'Guard against empty input (no division by zero) and always open text files with encoding="utf-8".',
    'Keep numbers and formatting apart so each can be tested; format specs like :<21 and :.2f align the report.',
  ],
}

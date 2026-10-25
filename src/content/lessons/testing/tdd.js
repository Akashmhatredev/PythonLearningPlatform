// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const COVERAGE_LITE = py`"""coverage_lite - a SIMPLIFIED line-coverage tool built on sys.settrace.

Real coverage.py also measures module-level code and branches, uses a fast
C tracer (or sys.monitoring on Python 3.12+), handles whole projects and
writes HTML reports.
"""
import ast
import sys


def statement_lines(path):
    """Line numbers of the statements inside functions (docstrings skipped)."""
    with open(path) as file:
        tree = ast.parse(file.read())
    lines = set()
    for function in ast.walk(tree):
        if isinstance(function, ast.FunctionDef):
            lines |= {node.lineno for node in ast.walk(function) if isinstance(node, ast.stmt) and node is not function}
            first = function.body[0]
            if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
                lines.discard(first.lineno)
    return lines


def measure(path, run):
    """Call run() while recording which lines of path execute."""
    executed = set()

    def tracer(frame, event, arg):
        if not frame.f_code.co_filename.endswith(path):
            return None                      # don't trace other files
        if event == "line":
            executed.add(frame.f_lineno)
        return tracer

    previous = sys.gettrace()
    sys.settrace(tracer)
    try:
        value = run()
    finally:
        sys.settrace(previous)
    statements = statement_lines(path)
    return value, statements & executed, statements - executed


def report(path, covered, missed):
    total = len(covered) + len(missed)
    percent = round(100 * len(covered) / total) if total else 100
    if missed and percent == 100:
        percent = 99                         # like coverage.py: never round up to 100
    missing = ", ".join(str(line) for line in sorted(missed))
    print(f"{'Name':<14}{'Stmts':>6}{'Miss':>6}{'Cover':>7}   Missing")
    print("-" * 44)
    print(f"{path:<14}{total:>6}{len(missed):>6}{percent:>6}%   {missing}".rstrip())
`

const PASSWORD = py`"""password.py - grown one test at a time with TDD."""

MIN_LENGTH = 12
COMMON_PASSWORDS = {"password", "password1234", "qwerty", "qwertyuiop12", "letmein", "iloveyou"}


def check_password(password, username=""):
    """Return a list of problems; an empty list means the password is acceptable."""
    problems = []
    if len(password) < MIN_LENGTH:
        problems.append(f"use at least {MIN_LENGTH} characters")
    if password.lower() in COMMON_PASSWORDS:
        problems.append("this password is too common")
    if username and username.lower() in password.lower():
        problems.append("don't include your username")
    return problems
`

const TESTS = py`"""Tests written BEFORE the code in password.py, plus a SIMPLIFIED coverage report."""
import unittest

import coverage_lite
from password import check_password


class TestCheckPassword(unittest.TestCase):
    def test_short_password_is_rejected(self):
        self.assertIn("use at least 12 characters", check_password("tiny"))

    def test_long_unusual_password_is_accepted(self):
        self.assertEqual(check_password("correct-horse-battery-staple"), [])

    def test_common_password_is_rejected(self):
        self.assertIn("this password is too common", check_password("password1234"))

    def test_common_check_ignores_case(self):
        self.assertIn("this password is too common", check_password("PassWord1234"))

    def test_password_containing_username_is_rejected(self):
        problems = check_password("ada-lovelace-1815", username="Ada")
        self.assertIn("don't include your username", problems)

    def test_every_problem_is_reported(self):
        self.assertEqual(len(check_password("qwerty", username="qwerty")), 3)


def run_suite():
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestCheckPassword)
    return unittest.TextTestRunner(verbosity=1).run(suite)


if __name__ == "__main__":
    result, covered, missed = coverage_lite.measure("password.py", run_suite)
    coverage_lite.report("password.py", covered, missed)
`

const CYCLE_TEST = py`import unittest

from password import check_password


class TestCheckPassword(unittest.TestCase):
    def test_short_password_is_rejected(self):
        self.assertIn("use at least 12 characters", check_password("tiny"))


if __name__ == "__main__":
    unittest.main(argv=["cycle-1"], exit=False, verbosity=2)
`

const CYCLE_RED = py`"""password.py - cycle 1, RED: the function exists, the rule doesn't."""


def check_password(password, username=""):
    return []
`

const CYCLE_GREEN = py`"""password.py - cycle 1, GREEN: the simplest code that passes."""


def check_password(password, username=""):
    if len(password) < 12:
        return ["use at least 12 characters"]
    return []
`

const DISCOUNT_TESTS = py`

class TestApplyCode(unittest.TestCase):
    def test_save10_takes_ten_percent_off(self):
        self.assertEqual(apply_code(2500, "SAVE10"), 2250)

    def test_save10_rounds_the_discount_down_to_whole_cents(self):
        self.assertEqual(apply_code(999, "SAVE10"), 900)    # 10% of 999 is 99.9 -> 99 off

    def test_codes_ignore_case_and_spaces(self):
        self.assertEqual(apply_code(2500, "  save10 "), 2250)

    def test_fiveoff_takes_500_cents_off(self):
        self.assertEqual(apply_code(2000, "FIVEOFF"), 1500)

    def test_fiveoff_needs_a_subtotal_of_at_least_2000(self):
        with self.assertRaisesRegex(ValueError, "at least 2000"):
            apply_code(1999, "FIVEOFF")

    def test_unknown_code_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "unknown code"):
            apply_code(2500, "FREESTUFF")


if __name__ == "__main__":
    unittest.main(argv=["discounts"], exit=False, verbosity=2)
`

const DISCOUNT_STARTER = py`import unittest


def apply_code(subtotal_cents, code):
    """Return the subtotal (in cents) after applying a discount code."""
    return subtotal_cents          # TODO: make the tests pass, one at a time
` + DISCOUNT_TESTS

const DISCOUNT_SOLUTION = py`import unittest


def apply_code(subtotal_cents, code):
    """Return the subtotal (in cents) after applying a discount code."""
    code = code.strip().upper()
    if code == "SAVE10":
        return subtotal_cents - subtotal_cents // 10
    if code == "FIVEOFF":
        if subtotal_cents < 2000:
            raise ValueError("FIVEOFF needs a subtotal of at least 2000 cents")
        return subtotal_cents - 500
    raise ValueError(f"unknown code: {code!r}")
` + DISCOUNT_TESTS

const REGRESSION_HEAD = py`import unittest

MIN_LENGTH = 12

`

const REGRESSION_STARTER = REGRESSION_HEAD + py`
def check_password(password, username=""):
    """Return a list of problems; an empty list means the password is acceptable."""
    problems = []
    if len(password) < MIN_LENGTH:
        problems.append(f"use at least {MIN_LENGTH} characters")
    if username and username in password:
        problems.append("don't include your username")
    return problems


class TestCheckPassword(unittest.TestCase):
    def test_password_containing_username_is_rejected(self):
        self.assertIn("don't include your username", check_password("ada-lovelace-1815", "ada"))

    # Bug report: "My password ADA-lovelace-1815 was accepted although my username is ada."
    # TODO 1 (red):   add test_username_check_ignores_case that reproduces the report
    # TODO 2 (green): fix check_password


if __name__ == "__main__":
    unittest.main(argv=["regression"], exit=False, verbosity=2)
`

const REGRESSION_SOLUTION = REGRESSION_HEAD + py`
def check_password(password, username=""):
    """Return a list of problems; an empty list means the password is acceptable."""
    problems = []
    if len(password) < MIN_LENGTH:
        problems.append(f"use at least {MIN_LENGTH} characters")
    if username and username.lower() in password.lower():
        problems.append("don't include your username")
    return problems


class TestCheckPassword(unittest.TestCase):
    def test_password_containing_username_is_rejected(self):
        self.assertIn("don't include your username", check_password("ada-lovelace-1815", "ada"))

    def test_username_check_ignores_case(self):
        # Regression test for the bug report: written first, watched fail, then fixed.
        self.assertIn("don't include your username", check_password("ADA-lovelace-1815", "ada"))
        self.assertIn("don't include your username", check_password("ada-lovelace-1815", "Ada"))


if __name__ == "__main__":
    unittest.main(argv=["regression"], exit=False, verbosity=2)
`

const PROPERTY_DEMO = py`

def generate_list(rng):
    return [rng.randint(-5, 5) for _ in range(rng.randint(0, 6))]


print(find_counterexample(lambda xs: sorted(sorted(xs)) == sorted(xs), generate_list))
print(find_counterexample(lambda xs: sorted(xs) == xs, generate_list))
`

export default {
  id: 'tdd',
  title: 'Test-driven development & coverage',
  summary: 'TDD grows code in tiny red → green → refactor loops with the test written first; coverage shows which lines your tests never ran — but not whether they check anything.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['testing-fundamentals', 'pytest-basics'],
  related: ['fixtures', 'mocking', 'clean-code', 'debugging', 'raising-exceptions', 'secrets-and-passwords', 'input-validation', 'code-quality-tools', 'solid', 'functional-concepts', 'numbers-and-math', 'clean-architecture'],
  tags: ['TDD', 'test-driven development', 'red green refactor', 'triangulation', 'fake it', 'regression test', 'coverage', 'coverage.py', 'pytest-cov', 'line coverage', 'branch coverage', 'mutation testing', 'property-based testing', 'Hypothesis', 'characterization tests', 'refactoring'],
  apis: [
    { name: 'coverage run -m pytest / coverage report -m', summary: 'coverage.py: run the tests while recording executed lines, then print a table with the missing line numbers.' },
    { name: 'pytest --cov=PACKAGE --cov-report=term-missing', summary: 'pytest-cov plugin: the same measurement and table as part of a pytest run.' },
    { name: '--cov-branch / [tool.coverage.run] branch = true', summary: 'Also measure branch coverage: did every if/while go both ways?' },
    { name: '--cov-fail-under=N / fail_under = N', summary: 'Fail the run if total coverage drops below N percent.' },
    { name: 'sys.settrace(func)', summary: 'Install a trace function called on every new frame and line — the hook simple coverage tools are built on.' },
    { name: 'hypothesis.given(strategies...)', summary: 'Third-party property-based testing: run a test with many generated inputs and shrink any failure to a minimal example.' },
  ],
  docs: [
    { label: 'coverage.py documentation', url: 'https://coverage.readthedocs.io/' },
    { label: 'pytest-cov documentation', url: 'https://pytest-cov.readthedocs.io/' },
    { label: 'Hypothesis documentation', url: 'https://hypothesis.readthedocs.io/' },
    { label: 'unittest — Unit testing framework', url: 'https://docs.python.org/3/library/unittest.html' },
    { label: 'sys.settrace', url: 'https://docs.python.org/3/library/sys.html#sys.settrace' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`**Test-driven development (TDD)** flips the usual order: you write a small **failing test first**, then just enough code to make it pass, then tidy up. Repeat, in loops of a few minutes:`,
    py`1. **Red** — write a test for the next tiny piece of behaviour and watch it fail.
2. **Green** — write the simplest code that makes it pass (even if it's a bit silly).
3. **Refactor** — improve the code (names, duplication, structure) while all tests stay green.`,
    py`The second half of this lesson is about **coverage**: a tool that records which lines your tests actually ran. It's great at finding untested code — and easy to misread. 100% coverage means every line *ran*, not that every line was *checked*. We'll prove that live, then peek at two ideas that go further: **mutation testing** and **property-based testing**.`,
  ],
  why: [
    py`Writing the test first forces you to decide **what the code should do** — inputs, outputs, error cases — before you get lost in *how*. Each test is a tiny, executable piece of the specification.`,
    py`Watching the test fail first proves it **can** fail (a test that never fails protects nothing — see [testing fundamentals](lesson:testing-fundamentals)). Small steps mean that when something breaks, the cause is the last few lines you wrote. And code written to be testable tends to be **better designed**: small functions, clear inputs, dependencies passed in rather than hidden.`,
    py`Coverage and mutation testing answer the follow-up question every team asks: "how good are our tests, really?"`,
  ],
  eli15: [
    py`Imagine building a LEGO set with a friend who checks each step. Before you add a piece, your friend says what the model should look like after it ("now there's a window on the left"). You add the piece; your friend checks. If it matches, you move on; if not, you only have *one* piece to look at.`,
    py`TDD is that, for code. The "what it should look like" is a test you write first. It fails (red) because you haven't built that part yet. You write a little code until it passes (green). Then you tidy up without breaking anything (refactor).`,
    py`Coverage is a highlighter that marks every line of your code the tests touched. Lines left un-highlighted were never tested. But a highlighted line only means "the tests walked past it" — not that they checked it was right.`,
  ],
  analogy: {
    title: 'A sat-nav that recalculates after every turn',
    body: [
      py`A sat-nav doesn't plan the whole trip and hope. It takes one turn, checks where you are, and adjusts. Small steps with constant feedback mean you're never more than one wrong turn away from the right road.`,
      py`TDD drives code the same way: one small test (the next turn), the code to pass it (drive), a check (green), a tidy-up (refactor) — then the next turn. Coverage is the trip log showing every road you drove down. It can't tell you whether you looked at the sights — just that you passed them.`,
    ],
    mapping: [
      ['deciding the next turn', 'writing the next failing test (red)'],
      ['driving that one stretch', 'writing the simplest code that passes (green)'],
      ['tidying the route plan', 'refactoring with the tests as a safety net'],
      ['"recalculating…" after a wrong turn', 'a red test pointing at the last small change'],
      ['the log of roads driven', 'a coverage report'],
      ['driving past a museum without going in', 'a line that ran in tests but whose result nobody asserted'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The TDD loop',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'next', label: 'Pick the next tiny behaviour', note: 'from your test list', x: 380, y: 45, tone: 'paper' },
        { id: 'red', label: 'RED', note: 'write a failing test, run it, see it fail', x: 640, y: 160, tone: 'red' },
        { id: 'green', label: 'GREEN', note: 'simplest code that passes', x: 380, y: 275, tone: 'blue' },
        { id: 'refactor', label: 'REFACTOR', note: 'clean up; tests stay green', x: 120, y: 160, tone: 'yellow' },
      ],
      edges: [
        { from: 'next', to: 'red', label: 'write test' },
        { from: 'red', to: 'green', label: 'write code' },
        { from: 'green', to: 'refactor', label: 'all green' },
        { from: 'refactor', to: 'next', label: 'commit' },
      ],
      steps: [
        { focus: ['next'], text: py`Keep a short **test list**: behaviours you still need ("rejects short passwords", "rejects common ones", "ignores case"…). Pick the simplest one that teaches you something.` },
        { focus: ['red'], edges: ['next->red'], text: py`**Red.** Write one test for it and run it. It must fail — and fail for the *right reason* (an assertion, not a typo or \`ImportError\`). A test you never saw fail might not be testing anything.` },
        { focus: ['green'], edges: ['red->green'], text: py`**Green.** Write the *least* code that passes. Hard-coding a return value ("fake it") is allowed: the next test will force the real logic. Run **all** the tests.` },
        { focus: ['refactor'], edges: ['green->refactor'], text: py`**Refactor.** Remove duplication, rename, extract a function — change structure, not behaviour. Run the tests after each small change; red means undo the last step.` },
        { focus: ['next'], edges: ['refactor->next'], text: py`Commit, cross the item off the list, add any new cases you thought of, and go round again. Loops are measured in minutes, not hours.` },
      ],
    },
    alt: 'A loop of four boxes: pick the next tiny behaviour, then RED write a failing test, then GREEN write the simplest code that passes, then REFACTOR clean up while tests stay green, then back to picking the next behaviour.',
  },
  syntax: [
    py`#### A TDD session, step by step (pytest)`,
    py`Feature: \`check_password(password, username="")\` returns a list of problems; an empty list means "acceptable". First item on the test list: short passwords are rejected.`,
    { code: py`# test_password.py
from password import check_password


def test_short_password_is_rejected():
    assert "use at least 12 characters" in check_password("tiny")`, lang: 'python', static: true, title: 'RED: the test comes first' },
    { code: py`$ pytest -q
F                                                                        [100%]
=================================== FAILURES ===================================
_______________________ test_short_password_is_rejected ________________________

    def test_short_password_is_rejected():
>       assert "use at least 12 characters" in check_password("tiny")
E       assert 'use at least 12 characters' in []
E        +  where [] = check_password('tiny')

test_password.py:6: AssertionError
...
1 failed in 0.02s`, lang: 'text', title: 'red: it fails for the right reason (abridged; with a stub check_password that returns [])' },
    { code: py`def check_password(password, username=""):
    if len(password) < 12:
        return ["use at least 12 characters"]
    return []`, lang: 'python', title: 'GREEN: the simplest code that passes' },
    py`Next test: "a long, unusual password has no problems" — passes already, so it's a *characterising* test, not a driving one. Then "common passwords are rejected" drives a second rule; once there are two \`return\` paths, **refactor** to collect problems in a list. That's how the playground's \`password.py\` grew.`,
    py`#### Techniques for small steps`,
    py`- **Fake it ('til you make it):** return a constant to get to green fast; the next test removes the fake.
- **Triangulate:** add a second example that a fake can't satisfy (\`shipping(20) == 4.99\` *and* \`shipping(50) == 0\`), forcing the general rule. See it in *Watch it work*.
- **Obvious implementation:** if the real code is truly obvious, just write it — TDD is about feedback, not ceremony.
- **One failing test at a time.** If you have three red tests, you've taken too big a step.
- **Bug fixes start red too:** reproduce the bug report as a failing **regression test**, then fix.`,
    py`#### Measuring coverage`,
    { code: py`python -m pip install coverage pytest-cov

coverage run -m pytest            # run the tests under coverage.py
coverage report -m                # table with the Missing line numbers
coverage html                     # browsable report in htmlcov/index.html

pytest --cov=password --cov-report=term-missing     # the same via pytest-cov
pytest --cov=password --cov-branch --cov-fail-under=90`, lang: 'bash', title: 'terminal' },
    { code: py`Name          Stmts   Miss  Cover   Missing
-------------------------------------------
password.py      11      1    91%   15`, lang: 'text', title: 'coverage report -m (shape of the output; tests that never pass a username)' },
    py`- **Stmts**: executable statements coverage.py found (docstrings aren't counted; module-level lines such as imports and \`def\` lines are).
- **Miss** / **Missing**: statements that never ran — here line 15, the username rule.
- **Branch coverage** (\`--branch\`) also records whether each \`if\` went *both* ways. A line can be fully covered while one branch is never taken: \`if member: total = 0\` with only member tests never checks the non-member path. Partial branches appear as \`14->16\` in Missing.`,
    { code: py`[tool.coverage.run]
branch = true
source = ["password"]

[tool.coverage.report]
show_missing = true
fail_under = 90
exclude_lines = ["pragma: no cover", "if __name__ == .__main__.:"]`, lang: 'toml', title: 'pyproject.toml' },
  ],
  walkthrough: {
    title: 'The password tests and the coverage report',
    lang: 'python',
    code: TESTS,
    intro: py`This is \`main.py\` in the playground. Each test was written **before** the code that makes it pass; read them top to bottom as the history of the TDD session.`,
    steps: [
      { lines: [9, 10], text: py`Cycle 1: the first rule. Written first, it failed against an empty \`check_password\`, then a three-line implementation made it pass.` },
      { lines: [12, 13], text: py`A test that pins the "happy path" — and the shape of the result: an empty list, not \`None\` or \`True\`.` },
      { lines: [15, 19], text: py`Cycle 2 drove the common-password rule; the second test triangulates the case-insensitivity (\`"PassWord1234"\`), which forced \`.lower()\`.` },
      { lines: [21, 23], text: py`Cycle 3: the username rule. Passing \`username="Ada"\` with a lower-case password also pins case-insensitivity.` },
      { lines: [25, 26], text: py`A guard against a tempting refactor (returning at the first problem): every problem must be reported.` },
      { lines: [29, 36], text: py`The **simplified** coverage tool runs the whole suite under \`sys.settrace\`, records which lines of \`password.py\` executed, and prints a coverage.py-style table.` },
    ],
  },
  playground: {
    title: 'TDD a password checker, then question the coverage',
    objective: 'Run the suite and the coverage report, do one full red → green cycle, open a coverage gap, then show that 100% coverage can hide a bug.',
    files: { 'main.py': TESTS, 'password.py': PASSWORD, 'coverage_lite.py': COVERAGE_LITE },
    expected: py`unittest's progress (stderr) shows six dots and \`OK\`. Then the **simplified** coverage report:

\`\`\`text
Name           Stmts  Miss  Cover   Missing
--------------------------------------------
password.py        8     0   100%
\`\`\`

It only counts statements **inside functions**; real coverage.py also counts module-level lines (imports, constants, \`def\` lines). These rules follow modern guidance — length, a blocklist, no personal info — rather than "must contain a symbol"; real systems also check breached-password lists and store passwords with a slow hash ([secrets & passwords](lesson:secrets-and-passwords)). Switch to the **Cycle 1** variants to see the very first red and green steps.`,
    experiments: [
      {
        id: 'red-green',
        task: py`New rule: a password that is **one character repeated** (like \`"aaaaaaaaaaaa"\`) gets the problem \`"don't repeat a single character"\`. Do it the TDD way: **first** add \`test_repeated_character_is_rejected\` to \`TestCheckPassword\` and run — see it fail (red). **Then** add the rule to \`password.py\` and run again (green).`,
        hint: py`Test: \`self.assertIn("don't repeat a single character", check_password("aaaaaaaaaaaa"))\`. Code: a string made of one repeated character has \`len(set(password)) == 1\`.`,
        tests: [
          { name: 'the test exists and the suite passes', code: py`import unittest
assert "test_repeated_character_is_rejected" in unittest.defaultTestLoader.getTestCaseNames(TestCheckPassword), 'Add test_repeated_character_is_rejected first'
assert result.wasSuccessful(), 'Some tests fail — now make them green'` },
          { name: 'the rule works', code: py`assert "don't repeat a single character" in check_password("aaaaaaaaaaaa")
assert "don't repeat a single character" in check_password("ZZZZZZZZZZZZZZZZ")
assert check_password("correct-horse-battery-staple") == []` },
        ],
        explain: py`You saw the test fail for the right reason (the message wasn't in the list) before any code existed — proof the test can catch a missing rule. Then the smallest change made it pass, and the coverage report shows the new lines are covered too.`,
      },
      {
        id: 'coverage-gap',
        task: py`Delete (or rename to not start with \`test\`) both tests that pass a \`username\`: \`test_password_containing_username_is_rejected\` and \`test_every_problem_is_reported\`. Run. Which line appears under **Missing**? (Restore them afterwards.)`,
        hint: py`Rename them to \`_test_...\` so unittest stops collecting them.`,
        tests: [{ name: 'the report now shows missed lines', code: py`assert missed, 'Remove (or rename) the two tests that pass a username, then run'` }],
        explain: py`Only the line that appends the username problem is missed: the \`if\` line itself still runs (its condition is just false). That's coverage at its most useful — a precise pointer to **untested behaviour**. Line coverage would not notice if the condition were wrong but the append line were reached by some other test; branch coverage helps there.`,
      },
      {
        id: 'boundary-mutant',
        task: py`Coverage is 100%, but is the length rule really tested? In \`password.py\`, change \`len(password) < MIN_LENGTH\` to \`len(password) <= MIN_LENGTH\` and run: every test still passes, coverage still says 100%! Change it back, then add tests that would catch it: a **12-character** password gets no length problem, an **11-character** one does.`,
        hint: py`\`"abcdefghijkl"\` has 12 characters; \`"abcdefghijk"\` has 11. Use \`assertNotIn("use at least 12 characters", ...)\` and \`assertIn(...)\`.`,
        tests: [{ name: 'your tests catch both boundary mutants', code: py`import unittest
real = ns["check_password"]
def suite_passes_with(fake):
    ns["check_password"] = fake
    try:
        outcome = unittest.TestResult()
        unittest.defaultTestLoader.loadTestsFromTestCase(TestCheckPassword).run(outcome)
        return outcome.wasSuccessful()
    finally:
        ns["check_password"] = real
LENGTH = "use at least 12 characters"
def rejects_12(password, username=""):
    problems = real(password, username)
    return problems if len(password) != 12 or LENGTH in problems else [LENGTH] + problems
def accepts_11(password, username=""):
    problems = real(password, username)
    return [p for p in problems if p != LENGTH] if len(password) == 11 else problems
assert suite_passes_with(real), 'Your tests must pass on the real code (did you change <= back to <?)'
assert not suite_passes_with(rejects_12), 'A version that rejects 12-character passwords still passes: test exactly 12 characters'
assert not suite_passes_with(accepts_11), 'A version that accepts 11-character passwords still passes: test exactly 11 characters'` }],
        explain: py`The \`<=\` change is a **mutant** — a small, deliberate bug — and it *survived*: the tests ran the line but never checked a password at the boundary. Coverage measures **execution**, not **verification**. Mutation-testing tools automate exactly this experiment over every operator and constant in your code.`,
      },
      {
        id: 'more-mutants',
        task: py`Play mutation tester by hand. One at a time, try: removing \`.lower()\` from the common-password check; changing \`and\` to \`or\` in the username rule; deleting \`problems.append("this password is too common")\`. Run after each — which mutants do the tests **kill** (some test fails) and which **survive**? Undo each change before the next.`,
        explain: py`Every mutant here should be killed: \`test_common_check_ignores_case\` kills the first, \`test_long_unusual_password_is_accepted\` the second (an empty username is "in" every string), and several tests kill the third. A suite's **mutation score** (killed ÷ total mutants) is a much stronger signal than its coverage percentage.`,
      },
    ],
    variants: [
      { id: 'cycle-1-red', label: 'Cycle 1 — red', files: { 'main.py': CYCLE_TEST, 'password.py': CYCLE_RED } },
      { id: 'cycle-1-green', label: 'Cycle 1 — green', files: { 'main.py': CYCLE_TEST, 'password.py': CYCLE_GREEN } },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Fake it, then triangulate',
    props: {
      code: py`# Cycle 1 - test: orders under 50 pay 4.99 shipping.
# GREEN with the simplest possible code: a hard-coded answer.
def shipping(total):
    return 4.99

assert shipping(20) == 4.99
print("cycle 1 green")

# Cycle 2 - a second example the fake can't satisfy (triangulation).
cases = [(20, 4.99), (50, 0), (49.99, 4.99)]
print("fake passes:", [shipping(t) == want for t, want in cases])

# ...so now we write the real rule, and every example passes.
def shipping(total):
    return 0 if total >= 50 else 4.99

for total, want in cases:
    assert shipping(total) == want, (total, want)
print("cycle 2 green:", [shipping(t) for t, _ in cases])
`,
      notes: {
        4: '"Fake it": returning a constant is a legitimate way to reach green quickly.',
        10: 'Triangulation: pick examples on **both sides** of the rule — including the boundary 50 and just below it, 49.99.',
        11: 'The fake fails the new example: `[True, False, True]`. Red again — the test now demands the real logic.',
        15: 'The general rule replaces the fake. `>=` (not `>`) is pinned by the 50 example.',
        18: 'All three examples pass. Next step would be refactoring — names, constants — with the tests as a safety net.',
      },
    },
    alt: 'Step-by-step trace. A first shipping function returns the constant 4.99 and passes the single test for an order of 20. A list of three cases (20, 50 and 49.99) shows the fake fails the 50 case. A real implementation returning 0 for totals of 50 or more replaces it and all three assertions pass.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`How can a tool know which lines ran? Python lets you install a **trace function** with \`sys.settrace(fn)\`. The interpreter then calls \`fn\` on events — a function being called, each new line about to run, a return, an exception. A coverage tool's trace function simply records \`(file, line number)\` for every *line* event; after the tests, it compares that set with the list of all statements in the file. That's exactly what the playground's \`coverage_lite.py\` does, in about 40 lines.`,
      py`To list "all statements", it parses the source into an **AST** (the parsed structure of the code — see [bytecode](lesson:bytecode)) and collects every statement node's line number.`,
    ],
    technical: [
      py`#### What coverage proves — and doesn't`,
      py`| coverage says | it means | it does NOT mean |
|---|---|---|
| line 15 missed | no test ever executed it | — (this is reliable and useful) |
| 100% line coverage | every statement ran at least once | that any result was checked, or that boundaries, combinations or missing features are tested |
| 100% branch coverage | every \`if\` went both ways | that every *combination* of conditions or every input class was tried |`,
      py`Coverage is a **gap-finder**, not a quality score. A suite with no assertions at all can reach 100%.`,
      py`#### Mutation testing`,
      py`A mutation tool (for Python: **mutmut**, **cosmic-ray**) makes many small changes to your code — \`<\` → \`<=\`, \`+\` → \`-\`, \`True\` → \`False\`, delete a call, return \`None\` — and runs the tests against each **mutant**. A failing test **kills** the mutant; if all tests pass, the mutant **survived**, pointing at behaviour nobody verifies. The **mutation score** is killed ÷ total. Costs: it's slow (one test run per mutant, though tools only run the tests that cover the mutated line), and some mutants are **equivalent** (they don't change behaviour, so they can't be killed).`,
      py`#### Property-based testing`,
      py`Example-based tests check specific inputs you thought of. **Property-based tests** state a rule that must hold for *all* inputs and let a library generate hundreds of them. **Hypothesis** (third-party) also **shrinks** a failing input to a minimal one:`,
      { code: py`from hypothesis import given, strategies as st


@given(st.integers(min_value=0, max_value=10**6), st.integers(min_value=1, max_value=50))
def test_shares_always_add_up(total_cents, people):
    shares = split_bill(total_cents, people)
    assert sum(shares) == total_cents
    assert max(shares) - min(shares) <= 1


@given(st.text(min_size=12))
def test_long_passwords_never_get_a_length_complaint(password):
    assert "use at least 12 characters" not in check_password(password)`, lang: 'python', static: true, title: 'test_properties.py (requires pip install hypothesis)' },
      { code: py`Falsifying example: test_shares_always_add_up(
    total_cents=1,
    people=2,
)`, lang: 'text', title: 'a Hypothesis failure report for a buggy split_bill (abridged)' },
      py`Good properties: **round-trips** (\`loads(dumps(x)) == x\`), **invariants** (shares add up; a sorted list is sorted), **comparison with a simple reference implementation**, and "never crashes on any input".`,
    ],
    production: [
      py`- **Use coverage to find gaps, not as a target.** Look at the *Missing* column for important code paths you forgot. A sensible threshold in CI (\`--cov-fail-under\`) stops coverage silently dropping, but when a number becomes the goal, people write assertion-free tests to hit it.
- **Turn on branch coverage**; it catches untested \`else\` paths that line coverage hides.
- **Exclude deliberately**, not to game the number: \`# pragma: no cover\` for genuinely untestable lines (defensive \`raise NotImplementedError\`, \`if __name__ == "__main__":\`).
- **Run mutation testing on critical code** (pricing, permissions, money) rather than everywhere — it's slow but the best measure of assertion quality.
- **TDD doesn't fit everything.** Exploratory spikes, UI layout and throwaway scripts often go faster without it — then add tests before the code goes to production. For untested **legacy code**, first write **characterization tests** that pin current behaviour, then refactor and TDD new changes ([clean code](lesson:clean-code)).
- **Bugs get regression tests.** Every fixed bug gets a test that failed before the fix — the cheapest insurance there is.`,
    ],
  },
  mistakes: [
    {
      title: 'Writing a test that never failed',
      wrong: { code: py`# Wrote the code first, then a test that passed immediately:
def test_discount():
    assert apply_code(2500, "SAVE10") == apply_code(2500, "SAVE10")`, lang: 'python', static: true },
      right: { code: py`def test_save10_takes_ten_percent_off():
    assert apply_code(2500, "SAVE10") == 2250   # written first: failed, then passed`, lang: 'python', static: true },
      explanation: py`A test that has never been red might not be able to go red — like this tautology. TDD's "watch it fail" step is the cheapest way to prove a test actually tests something.`,
    },
    {
      title: 'Taking steps that are too big',
      wrong: { code: py`# Five new tests, then 80 lines of code, then... 3 failures.
# Which line is wrong? Time to debug.`, lang: 'python', static: true },
      right: { code: py`# One test -> run (red) -> a few lines -> run (green) -> refactor -> run.
# A failure always points at the last few lines you touched.`, lang: 'python', static: true },
      explanation: py`Big steps throw away TDD's main benefit: knowing exactly what broke. If you're stuck red for more than a few minutes, undo and take a smaller step.`,
    },
    {
      title: 'Chasing a coverage number with assertion-free tests',
      wrong: { code: py`def test_check_password_runs():
    check_password("tiny")              # covers lines, checks nothing
    check_password("qwerty", "qwerty")`, lang: 'python', static: true },
      right: { code: py`def test_every_problem_is_reported():
    problems = check_password("qwerty", "qwerty")
    assert len(problems) == 3`, lang: 'python', static: true },
      explanation: py`Both reach the same coverage. Only one can ever fail. Coverage tells you where tests are missing; it can't tell you whether the tests that exist are any good.`,
    },
    {
      title: 'Refactoring while red',
      wrong: { code: py`# Test fails, and you also rename functions and move code around "while you're at it".`, lang: 'python', static: true },
      right: { code: py`# Get to green first (even with ugly code), commit, THEN refactor in small, green steps.`, lang: 'python', static: true },
      explanation: py`Refactoring means "change structure, keep behaviour" — and the tests are how you know behaviour is kept. With a red test you have no safety net.`,
    },
  ],
  debugging: [
    {
      symptom: py`A new test passes the first time you run it — before you wrote any code.`,
      cause: py`The behaviour already exists, the test is wrong (tautology, wrong function, missing assert), or it isn't being collected at all.`,
      fix: py`Temporarily break the code (or the expected value) and confirm the test goes red. Check it's collected (\`pytest --collect-only -q\`).`,
    },
    {
      symptom: py`Red for the wrong reason: ImportError / NameError / AttributeError instead of an AssertionError.`,
      cause: py`The test can't even reach the behaviour: the function or module doesn't exist yet, or has a different name.`,
      fix: py`Create a stub (\`def check_password(password, username=""): return []\`) so the test fails on its **assertion** — then you know it checks the right thing.`,
    },
    {
      symptom: py`Coverage: No data was collected. (no-data-collected)`,
      cause: py`coverage.py didn't see your code run: wrong \`--source\`/\`--cov=\` name, tests importing an installed copy instead of your source tree, or code running in a subprocess.`,
      fix: py`Point \`--cov\` at the importable package name, install your project in editable mode, and check with \`coverage report\` which files were measured.`,
    },
    {
      symptom: py`100% coverage, but a bug at a boundary reached production.`,
      cause: py`Lines ran, but no test checked the boundary values (\`<\` vs \`<=\`).`,
      fix: py`Add boundary tests (at, just below, just above). Consider branch coverage and mutation testing for critical modules.`,
    },
  ],
  bestPractices: [
    'Keep a test list; pick the next smallest behaviour; one failing test at a time.',
    'Always see a new test fail for the right reason (an assertion) before making it pass.',
    'In green, write the simplest code that passes; let the next test (triangulation) force generality.',
    'Refactor only when green, in small steps, running the tests after each.',
    'Start every bug fix with a failing regression test.',
    'Use coverage (with branches) to find untested code, not as a goal; set a floor in CI so it cannot silently drop.',
    'Judge assertion quality with boundary tests, mutation testing on critical code and property-based tests.',
  ],
  useCases: [
    'Business rules with many cases: pricing, discounts, validation, permissions.',
    'Fixing bugs: reproduce as a failing test, then fix.',
    'Designing an API from the caller\'s point of view: the test is the first caller.',
    'Finding dead or untested code paths with a coverage report before a release.',
    'Hardening parsers and calculations with property-based tests.',
  ],
  comparison: {
    title: 'Ways to judge a test suite',
    headers: ['', 'line coverage', 'branch coverage', 'mutation score', 'property-based tests'],
    rows: [
      ['question it answers', 'which lines ran?', 'did each decision go both ways?', 'would the tests notice a small bug?', 'does a rule hold for many generated inputs?'],
      ['catches assertion-free tests', 'no', 'no', 'yes', 'n/a (they are tests themselves)'],
      ['cost', 'cheap', 'cheap', 'slow (many test runs)', 'moderate'],
      ['Python tools', 'coverage.py, pytest-cov', 'coverage.py --branch', 'mutmut, cosmic-ray', 'Hypothesis'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'tdd-q1',
      type: 'mcq',
      prompt: 'You have just written a new test and watched it fail. What should you do in the "green" step?',
      options: [
        { text: 'Implement the complete feature properly, including cases no test covers yet', why: 'That is a big step with no tests guiding it. Write just enough to pass; the next tests will drive the rest.' },
        'Write the simplest code that makes this test (and all others) pass, even if it is crude',
        { text: 'Refactor the existing code first so the new feature fits nicely', why: 'Refactoring happens while green. With a red test you have no safety net.' },
        { text: 'Delete the test if it is hard to make pass', why: 'The test is your specification; if it is too big, replace it with a smaller step — don\'t drop the requirement.' },
      ],
      answer: 1,
      explanation: py`Green is about getting back to safety fast. Clean-up comes in the refactor step, generality comes from the next test.`,
    },
    {
      id: 'tdd-q2',
      type: 'output',
      prompt: 'After cycle 1, `shipping` was "faked". What does this print?',
      code: py`def shipping(total):
    return 4.99

tests = [(20, 4.99), (50, 0), (49.99, 4.99)]
print([shipping(t) == want for t, want in tests])`,
      answer: '[True, False, True]',
      accept: ['[True, False, True]'],
      explanation: py`The fake satisfies the two "pays shipping" examples but not \`(50, 0)\`. That second, different example is **triangulation**: it makes the test suite demand the real rule.`,
    },
    {
      id: 'tdd-q3',
      type: 'bug',
      prompt: 'The only tests call `shipping(20)` and `shipping(80, member=True)`. Click the line that a coverage report lists as **Missing**.',
      code: py`def shipping(total, member=False):
    if member:
        return 0
    if total >= 50:
        return 0
    return 4.99`,
      answerLine: 5,
      explanation: py`\`shipping(20)\` runs lines 2, 4 and 6; the member call runs lines 2 and 3. No test has a non-member total of 50 or more, so line 5 never runs. (The \`if\` on line 4 *does* run — its condition is just always false.)`,
    },
    {
      id: 'tdd-q4',
      type: 'fill',
      prompt: 'Name the three steps of the TDD loop, in order.',
      code: py`# 1. ___       write a small test and watch it fail
# 2. ___       write the simplest code that makes it pass
# 3. ___       improve the code while every test stays green`,
      answer: [['red', 'RED', 'Red'], ['green', 'GREEN', 'Green'], ['refactor', 'REFACTOR', 'Refactor']],
      explanation: py`Red → green → refactor, in loops of a few minutes.`,
    },
    {
      id: 'tdd-q5',
      type: 'mcq',
      prompt: 'Your suite has 100% line coverage. Which of these can you conclude? (Select all that apply.)',
      options: [
        'Every statement in the measured code was executed at least once by the tests',
        { text: 'Every function returns the right result for every input', why: 'Coverage records execution, not verification — a test without assertions covers lines too.' },
        { text: 'Every if statement was tested both ways', why: 'That is branch coverage. Line coverage is satisfied when the if line runs, whichever way it goes.' },
        { text: 'A mutation tool would find no surviving mutants', why: 'Survivors are common at 100% coverage — e.g. an untested boundary (< vs <=).' },
      ],
      answer: [0],
      explanation: py`100% line coverage is a guarantee about **execution** only. It's a useful floor — code that never runs in tests is certainly untested — but it says nothing about assertion quality.`,
    },
    {
      id: 'tdd-q6',
      type: 'mcq',
      prompt: 'A mutation-testing tool changes `if total >= 50:` to `if total > 50:` and runs your tests. They all pass. What does that tell you?',
      options: [
        { text: 'The mutant was killed; your tests are strong', why: 'Killed means some test FAILED on the mutant. Here everything passed.' },
        'The mutant survived: no test checks a total of exactly 50, so that boundary is unverified',
        { text: 'The line is not covered', why: 'The line may well be covered; it is the boundary value that no test checks.' },
        { text: 'The tool is broken — passing tests are always good', why: 'Tests passing on deliberately broken code means they cannot tell the two versions apart.' },
      ],
      answer: 1,
      explanation: py`A surviving mutant is a concrete, actionable gap: add a test for exactly 50. It can also be an **equivalent mutant** that can't change behaviour — then it's safe to ignore.`,
    },
    {
      id: 'tdd-q7',
      type: 'short',
      prompt: 'Why should you watch a new test fail before writing the code that makes it pass?',
      answer: py`Because it proves the test can fail — that it is collected, reaches the code and asserts the right thing. A test that passes before the behaviour exists is either testing something else, is a tautology, or has no real assertion, and would never catch a regression. Seeing it fail for the right reason (an assertion, not an ImportError) also confirms the failure message is useful.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'discount-codes',
      title: 'Make the red tests green, one at a time',
      difficulty: 'intermediate',
      prompt: py`The tests for \`apply_code(subtotal_cents, code)\` were written first; the function is a stub. Work in TDD rhythm: run, pick the **first** failing test, write the least code to make it pass, run again, refactor when green. Don't change the tests.

The rules the tests describe:

- \`"SAVE10"\` takes 10% off, rounding the **discount down** to whole cents (\`999\` → \`900\`);
- \`"FIVEOFF"\` takes 500 cents off, but only for subtotals of at least 2000 cents; below that it raises \`ValueError\` with a message containing \`at least 2000\`;
- codes ignore upper/lower case and surrounding spaces;
- any other code raises \`ValueError\` with a message containing \`unknown code\`.

The checker runs the \`TestApplyCode\` suite (all 6 tests must pass) and calls \`apply_code\` directly.`,
      files: { 'main.py': DISCOUNT_STARTER },
      hints: [
        'Start with SAVE10: subtotal_cents - subtotal_cents // 10 rounds the discount down, because // floors the 10%.',
        'Normalise the code once at the top: code = code.strip().upper(). Then one if per code, and raise ValueError at the end for anything else.',
        'For FIVEOFF check the minimum first: if subtotal_cents < 2000: raise ValueError("FIVEOFF needs a subtotal of at least 2000 cents").',
      ],
      solution: {
        explanation: py`Normalising the code first means the comparisons stay simple and the case/space rule is handled in one place — a natural refactor once the third test arrives. Integer cents with \`//\` keep money exact (no float rounding surprises — see [numbers & math](lesson:numbers-and-math)). Validation comes before the arithmetic so invalid input fails fast with a clear message, and the final \`raise\` makes "unknown code" the default rather than silently returning the full price. Each rule was driven by one test; when they all passed, you were done — that's the TDD definition of "finished".`,
        files: { 'main.py': DISCOUNT_SOLUTION },
      },
      tests: [
        { name: 'the TestApplyCode suite passes (all 6 tests)', code: py`import unittest
outcome = unittest.TestResult()
suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestApplyCode)
suite.run(outcome)
assert outcome.testsRun >= 6, 'Keep all six tests'
assert outcome.wasSuccessful(), f'{len(outcome.failures) + len(outcome.errors)} test(s) still red — run the program and read the report'` },
        { name: 'SAVE10 rounds the discount down', code: py`assert apply_code(1000, "SAVE10") == 900
assert apply_code(15, "SAVE10") == 14` },
        { name: 'codes ignore case and spaces', code: py`assert apply_code(3000, " fiveoff ") == 2500` },
        { name: 'FIVEOFF below 2000 raises ValueError', code: py`with raises(ValueError, match="at least 2000"):
    apply_code(500, "FIVEOFF")` },
        { name: 'unknown codes raise ValueError', code: py`with raises(ValueError, match="unknown code"):
    apply_code(500, "HALFPRICE")` },
      ],
    },
    {
      id: 'regression-first',
      title: 'Bug fix, test first',
      difficulty: 'intermediate',
      prompt: py`A user reports: *"My password \`ADA-lovelace-1815\` was accepted although my username is \`ada\`."* The username check is case-sensitive.

1. **Red:** add a test method \`test_username_check_ignores_case\` to \`TestCheckPassword\` that reproduces the report. Run it and watch it fail.
2. **Green:** fix \`check_password\` so the username check ignores case.

The checker verifies that your new test exists, that it **fails on the original buggy code** (so it really reproduces the bug), that the whole suite passes on your fix, and that the rule works for any mix of upper and lower case.`,
      files: { 'main.py': REGRESSION_STARTER },
      hints: [
        'The test can use the exact data from the report: check_password("ADA-lovelace-1815", "ada") should contain "don\'t include your username".',
        'Before fixing, run it: the test should FAIL. That failure is the bug, captured.',
        'Compare lower-cased versions: if username and username.lower() in password.lower():',
      ],
      solution: {
        explanation: py`The regression test pins the exact scenario from the bug report (and the mirror case, an upper-case username), so the bug can never silently return. Writing it first proved two things: the test can detect the bug (it failed against the old code), and the fix is what made it pass. Lower-casing both sides makes the comparison case-insensitive; for full Unicode case-folding, \`str.casefold()\` is even more thorough.`,
        files: { 'main.py': REGRESSION_SOLUTION },
      },
      tests: [
        { name: 'your regression test exists', code: py`import unittest
assert "test_username_check_ignores_case" in unittest.defaultTestLoader.getTestCaseNames(TestCheckPassword), 'Add a method named test_username_check_ignores_case'` },
        { name: 'it fails on the original buggy code', code: py`import unittest
def buggy(password, username=""):
    problems = []
    if len(password) < MIN_LENGTH:
        problems.append(f"use at least {MIN_LENGTH} characters")
    if username and username in password:
        problems.append("don't include your username")
    return problems
real = ns["check_password"]
ns["check_password"] = buggy
try:
    outcome = unittest.TestResult()
    TestCheckPassword("test_username_check_ignores_case").run(outcome)
finally:
    ns["check_password"] = real
assert not outcome.wasSuccessful(), 'Your test passes on the buggy code, so it does not reproduce the report — use mixed case'` },
        { name: 'the whole suite passes on your fix', code: py`import unittest
outcome = unittest.TestResult()
unittest.defaultTestLoader.loadTestsFromTestCase(TestCheckPassword).run(outcome)
assert outcome.wasSuccessful(), 'Make every test green by fixing check_password'` },
        { name: 'the username rule ignores case', code: py`message = "don't include your username"
assert message in check_password("ADA-lovelace-1815", "ada")
assert message in check_password("ada-lovelace-1815", "ADA")
assert message in check_password("Ada-Lovelace-1815", "aDa")
assert check_password("correct-horse-battery-staple", "ada") == []` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'tdd-red-green-refactor',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is test-driven development? Walk me through one cycle.',
      answer: 'Writing a failing test before the code. Red: write a small test for the next behaviour and see it fail. Green: write the simplest code that passes. Refactor: improve the design while all tests stay green. Repeat in short loops.',
      explanation: py`The benefits come from the constraints: tests define behaviour up front, every test has been seen failing, steps stay small so failures are easy to locate, and the design is shaped by being used (by the test) before it is built.`,
      whyAsked: 'Checks whether you know TDD as a disciplined loop rather than "writing tests at some point".',
      mistakes: ['Describing "write all the tests, then all the code"', 'Skipping the refactor step', 'Not mentioning watching the test fail'],
      followUps: ['What is triangulation?', 'When would you not use TDD?', 'How does TDD affect design?'],
      modelAnswer: 'TDD means the test comes first, in very small loops. In the red step I pick the next tiny behaviour — say, short passwords are rejected — write a test for it and run it to see it fail for the right reason. In the green step I write the simplest code that passes, even a hard-coded value if that is enough. Then I refactor: remove duplication, improve names, restructure, re-running the tests after each change so behaviour is preserved. Then I pick the next behaviour. The payoff is a specification I can execute, tests I know can fail, and small steps so a failure always points at what I just changed.',
    },
    {
      id: 'tdd-coverage-meaning',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Explain line coverage versus branch coverage. What does 100% coverage prove?',
      answer: 'Line coverage records which statements ran during the tests; branch coverage records whether each decision (if/while) took every possible direction. 100% proves only that every line (or branch) executed — not that results were asserted, boundaries checked, or input combinations tried.',
      explanation: py`Example: \`if member: total = 0\` tested only with members has 100% line coverage but 50% branch coverage for that \`if\`. And a test that calls every function without asserting anything reaches 100% of both.`,
      code: { lang: 'python', code: py`def shipping(total, member=False):
    cost = 4.99
    if member:
        cost = 0
    return cost

# Only test: shipping(20, member=True) == 0
# Line coverage: 100%.  Branch coverage: the "member is False" path never ran.` },
      whyAsked: 'Teams use coverage numbers everywhere; this checks you can interpret them honestly.',
      mistakes: ['Equating 100% coverage with "fully tested"', 'Not knowing branch coverage exists'],
      followUps: ['How would you measure assertion quality?', 'Would you enforce a coverage threshold in CI?'],
      modelAnswer: 'Line coverage tells me which statements were executed at least once by the test suite. Branch coverage goes further and records whether each decision went every way — both the true and the false side of an if. Even 100% branch coverage only proves execution: a test with no assertions gets the same score as a thorough one, and boundaries or combinations of conditions can still be untested. So I use coverage to find code that is definitely untested, look at the missing lines and partial branches, and judge test quality with boundary tests, code review and, for critical code, mutation testing.',
    },
    {
      id: 'tdd-coverage-mandate',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your manager wants to require 100% coverage on every pull request. How do you respond?',
      answer: 'Agree with the goal (well-tested code), push back on the target: a hard 100% invites assertion-free tests and tests of trivial code (Goodhart\'s law). Propose a realistic floor that can\'t drop (e.g. fail_under plus "no decrease" on changed code), branch coverage, reviewing the missing lines in PRs, and mutation testing for critical modules.',
      explanation: py`Coverage is excellent as a diagnostic and poor as a target. A threshold that ratchets up, plus diff coverage on changed lines, keeps pressure on without encouraging gaming. Mutation testing on money and security code measures what actually matters: would the tests notice a bug?`,
      whyAsked: 'Tests engineering judgement and the ability to disagree constructively.',
      mistakes: ['Saying coverage is useless', 'Accepting 100% without discussing the incentives'],
      followUps: ['What is diff coverage?', 'Which code is legitimately excluded from coverage?'],
      modelAnswer: 'I would agree with the intent — we want our code tested — but suggest a better mechanism. A mandatory 100% turns coverage into a target, and people start writing tests that execute lines without asserting anything, or contort code to reach the last few percent. Instead I would enforce a floor that can only go up, require high coverage on changed lines in each pull request, turn on branch coverage, and have reviewers look at the Missing column rather than the percentage. For the most critical modules, like pricing or permissions, I would add mutation testing, because it measures whether the tests would actually catch a bug.',
    },
    {
      id: 'tdd-mutation-testing',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What is mutation testing, what is an equivalent mutant, and why isn\'t everyone using it?',
      answer: 'A tool creates many small variants of the code (mutants: flip an operator, change a constant, delete a call) and runs the tests against each. A failing test kills the mutant; survivors reveal unverified behaviour. An equivalent mutant behaves identically to the original, so it can never be killed. It is slow — one test run per mutant — and survivors need human triage.',
      explanation: py`Python tools include mutmut and cosmic-ray. Practical use: run on critical modules, in CI nightly, or only on changed code. The mutation score (killed ÷ total, ignoring equivalent mutants) is a much stronger quality signal than coverage.`,
      whyAsked: 'Distinguishes candidates who think about test quality, not just quantity.',
      mistakes: ['Confusing mutation testing with fuzzing', 'Claiming it proves correctness'],
      followUps: ['Give an example of an equivalent mutant.', 'How would you make mutation testing affordable in CI?'],
      modelAnswer: 'Mutation testing asks: if I put a small bug in this code, would the tests notice? A tool makes hundreds of small changes — turning less-than into less-or-equal, plus into minus, deleting a call — and runs the suite against each mutant. If a test fails, the mutant is killed; if everything passes, it survived, and that points at behaviour no test verifies, like an unchecked boundary. Some mutants are equivalent — for example changing a loop bound in a way that can\'t affect the result — and can never be killed, so survivors need a human look. The cost is the main reason it\'s not universal: it multiplies test runs, so I\'d use it on critical modules or changed code rather than the whole codebase.',
    },
    {
      id: 'tdd-property-checker',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `find_counterexample(prop, generate, runs=200, seed=0)`: create `random.Random(seed)`, call `generate(rng)` up to `runs` times, and return the first generated value for which `prop(value)` is false — or `None` if the property held every time.',
      answer: 'rng = random.Random(seed); loop runs times: value = generate(rng); if not prop(value): return value; after the loop return None.',
      explanation: py`This is the core of property-based testing without the clever parts. Hypothesis adds smart strategies (edge cases like empty lists and huge numbers come up often), **shrinking** failures to the smallest example, and a database that replays previous failures. A seeded \`random.Random\` keeps the search reproducible — essential for debugging a failure.`,
      starter: { files: { 'main.py': py`import random


def find_counterexample(prop, generate, runs=200, seed=0):
    """Return the first generated value where prop(value) is False, or None."""
    # TODO
    return None
` + PROPERTY_DEMO } },
      tests: [
        { name: 'returns None when the property always holds', code: py`def gen(rng):
    return [rng.randint(-5, 5) for _ in range(rng.randint(0, 8))]
assert find_counterexample(lambda xs: sorted(sorted(xs)) == sorted(xs), gen) is None` },
        { name: 'finds a value that breaks the property', code: py`found = find_counterexample(lambda n: n % 7 != 0, lambda rng: rng.randint(0, 1000))
assert found is not None and found % 7 == 0` },
        { name: 'the same seed gives the same counterexample', code: py`gen = lambda rng: rng.randint(0, 10**6)
prop = lambda n: n % 13 != 0
assert find_counterexample(prop, gen, seed=1) == find_counterexample(prop, gen, seed=1)` },
        { name: 'checks the property exactly runs times when it holds', code: py`calls = []
def prop(value):
    calls.append(value)
    return True
find_counterexample(prop, lambda rng: rng.random(), runs=50)
assert len(calls) == 50` },
      ],
      solution: { files: { 'main.py': py`import random


def find_counterexample(prop, generate, runs=200, seed=0):
    """Return the first generated value where prop(value) is False, or None."""
    rng = random.Random(seed)
    for _ in range(runs):
        value = generate(rng)
        if not prop(value):
            return value
    return None
` + PROPERTY_DEMO } },
      hints: ['Create the generator once: rng = random.Random(seed).', 'Return as soon as prop(value) is falsy; return None after the loop.'],
      whyAsked: 'Shows you understand what property-based testing does under the hood and why seeds matter.',
      mistakes: ['Using the global random module (not reproducible)', 'Creating a new Random inside the loop (same value every time)'],
      followUps: ['How would you shrink a failing list to a minimal one?', 'What makes a good property?'],
      modelAnswer: 'I create one random.Random with the given seed so every run is reproducible, then loop up to runs times: generate a value, check the property, and return the value as soon as the property is false. If the loop finishes, the property held for every sample and I return None. Real property-based tools like Hypothesis add much more — strategies that favour edge cases, shrinking a failure down to the smallest example, and remembering past failures — but the core idea is exactly this: state a rule and let the computer search for a counterexample.',
    },
    {
      id: 'tdd-legacy-code',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You must add "free shipping for members" to a 600-line checkout function with no tests and a database call in the middle. How would you work?',
      answer: 'Pin current behaviour first with characterization tests at the outside (using a test double or test database for the DB call), find or create a seam (extract the shipping calculation into a pure function, inject the DB dependency), cover the extracted function with focused tests, then TDD the new member rule in that small function, and refactor further in green steps.',
      explanation: py`Characterization tests record what the code *does* today (even if odd), so refactoring can't silently change it. Extracting a pure function creates a testable unit; dependency injection or patching the DB call breaks the hard dependency ([mocking](lesson:mocking), [clean architecture](lesson:clean-architecture)). Only then is the change itself small and test-driven.`,
      whyAsked: 'Real jobs involve legacy code; this tests whether you can apply TDD pragmatically rather than only on greenfield code.',
      mistakes: ['Rewriting the function from scratch', 'Adding the feature first and "testing later"', 'Mocking every line of the function'],
      followUps: ['What is a seam?', 'How do you write a characterization test for output you don\'t understand?'],
      modelAnswer: 'I would not start by changing the function. First I write a few characterization tests around the whole checkout — given these items and this customer, it currently returns this total — using a test database or a double for the database call, so I have a safety net even for behaviour I don\'t fully understand. Then I extract the shipping calculation into a small pure function, re-running those tests after each step, and inject or patch the database dependency so the new function has none. With that seam in place, I test-drive the member rule: a failing test for a member order, the simplest change to pass it, then refactor. The feature ends up small and fully tested, and the rest of the function is safer than before.',
    },
  ],

  takeaways: [
    'TDD loop: red (write a small failing test), green (simplest code that passes), refactor (improve while green) — in loops of minutes.',
    'Watch every new test fail for the right reason; fake it to get green, triangulate to force the real rule; fix bugs by writing the failing test first.',
    'Coverage (coverage.py, pytest-cov) records which lines/branches ran; it is a reliable gap-finder and an unreliable quality score.',
    '100% coverage proves execution, not verification: boundaries and assertion quality need targeted tests.',
    'Mutation testing (mutmut, cosmic-ray) checks whether tests notice small bugs; surviving mutants are concrete gaps.',
    'Property-based testing (Hypothesis) checks rules over many generated inputs and shrinks failures to minimal examples.',
  ],
}

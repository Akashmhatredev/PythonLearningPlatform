// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const CART = py`"""A tiny shopping cart: the code under test."""

DISCOUNT_THRESHOLD = 50.00   # spend this much or more...
DISCOUNT_RATE = 0.10         # ...and get 10% off


class Cart:
    def __init__(self):
        self.items = {}      # name -> (unit_price, quantity)

    def add_item(self, name, unit_price, quantity=1):
        if quantity <= 0:
            raise ValueError(f"quantity must be positive, got {quantity}")
        if name in self.items:
            price, old_quantity = self.items[name]
            self.items[name] = (price, old_quantity + quantity)
        else:
            self.items[name] = (unit_price, quantity)

    def subtotal(self):
        return sum(price * qty for price, qty in self.items.values())

    def total(self):
        subtotal = self.subtotal()
        if subtotal >= DISCOUNT_THRESHOLD:
            subtotal -= subtotal * DISCOUNT_RATE
        return round(subtotal, 2)
`

const CART_TESTS = py`import unittest

from cart import Cart


class TestCart(unittest.TestCase):
    def setUp(self):
        # Runs before EVERY test method: each test gets a fresh, empty cart.
        self.cart = Cart()

    def test_subtotal_is_price_times_quantity(self):
        self.cart.add_item("apple", 0.50, 4)        # Arrange
        self.cart.add_item("bread", 2.25)
        result = self.cart.subtotal()              # Act
        self.assertEqual(result, 4.25)             # Assert

    def test_adding_same_item_twice_adds_quantities(self):
        self.cart.add_item("apple", 0.50, 2)
        self.cart.add_item("apple", 0.50, 3)
        self.assertEqual(self.cart.items["apple"], (0.50, 5))

    def test_no_discount_just_below_threshold(self):
        self.cart.add_item("headphones", 49.99)
        self.assertEqual(self.cart.total(), 49.99)

    def test_discount_at_exactly_the_threshold(self):
        self.cart.add_item("board game", 50.00)
        self.assertEqual(self.cart.total(), 45.00)


if __name__ == "__main__":
    program = unittest.main(argv=["cart-tests"], exit=False, verbosity=2)
    result = program.result
    print(f"{result.testsRun} tests run, {len(result.failures)} failed, {len(result.errors)} errors")
`

// shared snippet for experiment tests: run the learner's TestCart suite quietly
const RUN_SUITE = py`import unittest
def run_suite():
    result = unittest.TestResult()
    unittest.defaultTestLoader.loadTestsFromTestCase(TestCart).run(result)
    return result
`

const GRADES_STARTER = py`import unittest


def letter_grade(score):
    """Convert a score from 0 to 100 (inclusive) into a letter grade."""
    if not 0 <= score <= 100:
        raise ValueError(f"score must be between 0 and 100, got {score}")
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


class TestLetterGrade(unittest.TestCase):
    def test_95_is_an_a(self):
        self.assertEqual(letter_grade(95), "A")

    # TODO: add tests for the boundaries and for invalid scores


if __name__ == "__main__":
    unittest.main(argv=["grades"], exit=False, verbosity=2)
`

const GRADES_SOLUTION = py`import unittest


def letter_grade(score):
    """Convert a score from 0 to 100 (inclusive) into a letter grade."""
    if not 0 <= score <= 100:
        raise ValueError(f"score must be between 0 and 100, got {score}")
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


class TestLetterGrade(unittest.TestCase):
    def test_95_is_an_a(self):
        self.assertEqual(letter_grade(95), "A")

    def test_exactly_90_is_an_a(self):
        self.assertEqual(letter_grade(90), "A")

    def test_89_is_a_b(self):
        self.assertEqual(letter_grade(89), "B")

    def test_full_marks_are_allowed(self):
        self.assertEqual(letter_grade(100), "A")

    def test_zero_is_an_f(self):
        self.assertEqual(letter_grade(0), "F")

    def test_scores_above_100_are_rejected(self):
        with self.assertRaises(ValueError):
            letter_grade(101)

    def test_negative_scores_are_rejected(self):
        with self.assertRaises(ValueError):
            letter_grade(-1)


if __name__ == "__main__":
    unittest.main(argv=["grades"], exit=False, verbosity=2)
`

// mutation check used by the grade exercise: swap letter_grade for a broken one, run the learner's suite
const GRADE_CHECK = py`import unittest
real = ns["letter_grade"]
def suite_passes_with(fake):
    ns["letter_grade"] = fake
    try:
        result = unittest.TestResult()
        unittest.defaultTestLoader.loadTestsFromTestCase(TestLetterGrade).run(result)
        return result.wasSuccessful()
    finally:
        ns["letter_grade"] = real
`

const BILL_STARTER = py`import unittest


def split_bill(total_cents, people):
    """Split a bill into whole cents so the shares add up to the total exactly."""
    share = total_cents // people
    return [share] * people


class TestSplitBill(unittest.TestCase):
    def test_even_split(self):
        self.assertEqual(split_bill(900, 3), [300, 300, 300])

    def test_leftover_cents_go_to_the_first_people(self):
        self.assertEqual(split_bill(1000, 3), [334, 333, 333])

    def test_shares_always_add_up_to_the_total(self):
        for total in [0, 1, 99, 1001, 12345]:
            for people in [1, 2, 3, 7]:
                with self.subTest(total=total, people=people):
                    self.assertEqual(sum(split_bill(total, people)), total)

    def test_zero_people_is_rejected(self):
        with self.assertRaises(ValueError):
            split_bill(1000, 0)

    def test_negative_total_is_rejected(self):
        with self.assertRaises(ValueError):
            split_bill(-500, 2)


if __name__ == "__main__":
    unittest.main(argv=["bill"], exit=False, verbosity=2)
`

const BILL_SOLUTION = BILL_STARTER.replace(
  py`    share = total_cents // people
    return [share] * people`,
  py`    if people < 1:
        raise ValueError(f"need at least one person, got {people}")
    if total_cents < 0:
        raise ValueError(f"the total cannot be negative, got {total_cents}")
    share, leftover = divmod(total_cents, people)
    # the first 'leftover' people pay one extra cent each
    return [share + 1 if i < leftover else share for i in range(people)]`,
)

export default {
  id: 'testing-fundamentals',
  title: 'Testing fundamentals: assert & unittest',
  summary: 'An automated test is a small program that runs your code and checks the answer — start with assert, structure tests as arrange-act-assert, and run whole suites with unittest.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['defining-functions', 'try-except', 'classes-and-objects'],
  related: ['pytest-basics', 'fixtures', 'mocking', 'tdd', 'raising-exceptions', 'main-guard-and-scripts', 'debugging', 'numbers-and-math'],
  tags: ['testing', 'unit test', 'assert', 'AssertionError', 'unittest', 'TestCase', 'assertEqual', 'assertRaises', 'setUp', 'tearDown', 'arrange act assert', 'test pyramid', 'integration test', 'end-to-end test', 'edge cases', 'regression test', 'subTest'],
  apis: [
    { name: 'assert condition, message', summary: 'Raises AssertionError(message) if the condition is false. Removed entirely when Python runs with -O.' },
    { name: 'unittest.TestCase', summary: 'Base class for a group of tests; every method whose name starts with test is one test.' },
    { name: 'TestCase.assertEqual(a, b)', summary: 'Fails with a message showing both values when a != b.' },
    { name: 'TestCase.assertRaises(Exc)', summary: 'Context manager: the block must raise Exc (or a subclass), otherwise the test fails.' },
    { name: 'TestCase.setUp() / tearDown()', summary: 'Run before / after every single test method, on a fresh TestCase instance.' },
    { name: 'TestCase.subTest(**params)', summary: 'Context manager that reports each loop iteration separately, so one failing case does not hide the others.' },
    { name: 'unittest.main()', summary: 'Finds the TestCase classes in the module, runs them and prints a report to stderr.' },
    { name: 'python -m unittest', summary: 'Command-line runner; discover mode finds test*.py files below the current directory.' },
  ],
  docs: [
    { label: 'unittest — Unit testing framework', url: 'https://docs.python.org/3/library/unittest.html' },
    { label: 'The assert statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement' },
    { label: 'unittest — command-line interface and test discovery', url: 'https://docs.python.org/3/library/unittest.html#command-line-interface' },
    { label: 'python -O (optimisation flag)', url: 'https://docs.python.org/3/using/cmdline.html#cmdoption-O' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **test** is a small piece of code that runs another piece of code and checks that it did the right thing. An **automated test** does that without a human watching: you press one button (or type one command) and a computer checks hundreds of behaviours in seconds.`,
    py`Python gives you two tools out of the box:`,
    py`- the **\`assert\` statement** — one line that says "this must be true, otherwise stop with an error";
- the **\`unittest\`** module — a full testing *framework* (a library that organises, runs and reports tests) that ships with every Python.`,
    py`In this lesson you'll learn to write good tests with both, structure them as **arrange → act → assert**, choose between **unit, integration and end-to-end** tests, and hunt for the **edge cases** where bugs hide. Next, [pytest](lesson:pytest-basics) — the tool most Python teams use — builds directly on these ideas.`,
  ],
  why: [
    py`Without tests, the only way to know your code works is to run it by hand and look at the output. That's slow, boring, and you won't do it for *every* feature after *every* change — so old features quietly break. A bug that sneaks back after being fixed is called a **regression**, and catching regressions is the number-one job of a test suite.`,
    py`Tests also let you **change code without fear**. Want to speed up a function or tidy messy code (*refactoring*)? Run the tests: green means behaviour is unchanged. And tests are **living documentation**: \`test_discount_at_exactly_the_threshold\` tells a new teammate a business rule more precisely than any comment.`,
    py`Finally, writing a test forces you to decide what "correct" means — including the awkward cases (empty cart? negative quantity?) that you'd otherwise discover in production.`,
  ],
  eli15: [
    py`Imagine you build a vending machine. Before you sell it, you'd test it: put in a coin, press B4, check that crisps come out. Put in no coin — nothing should come out. Press a button that doesn't exist — it should show an error.`,
    py`A software test is exactly that, written as code: **set things up** (insert coin), **do the thing** (press B4), **check the result** (crisps came out). Because it's code, the computer can repeat all 200 checks every time you change one screw inside the machine.`,
    py`\`assert\` is the "check the result" part: \`assert crisps_came_out\` means "if this isn't true, shout". \`unittest\` is the clipboard that lists every check, runs them all, and tells you which ones failed.`,
  ],
  analogy: {
    title: 'A pilot’s pre-flight checklist',
    body: [
      py`Before every flight, pilots run the same checklist: fuel level, flaps move, lights work. Each item is quick, specific and has a clear pass/fail answer. They do it *every* time — not just when they feel something is wrong — because the one time you skip it is the time something broke.`,
      py`A test suite is your code's pre-flight checklist. Each test checks one specific behaviour, gives a clear pass/fail, and the whole list runs automatically before every "take-off" (commit, merge, release).`,
    ],
    mapping: [
      ['one checklist item ("flaps move")', 'one test method checking one behaviour'],
      ['the whole checklist', 'a test suite (all your TestCase classes)'],
      ['a clear pass/fail for each item', 'an assertion: assertEqual, assertRaises, assert'],
      ['getting the plane into a known state first', 'setUp(): arrange a fresh object before each test'],
      ['running it before every flight', 'running tests before every commit or in CI'],
      ['a failed item grounds the plane', 'a failing test blocks the merge until it is fixed'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Three tests, three outcomes: pass, fail and error',
    props: {
      code: py`def average(scores):
    return sum(scores) // len(scores)   # bug: // throws away the .5

def test_average_of_three():
    scores = [70, 80, 90]          # Arrange
    result = average(scores)       # Act
    assert result == 80            # Assert

def test_average_keeps_fractions():
    assert average([1, 2]) == 1.5

def test_average_of_nothing_is_zero():
    assert average([]) == 0

tests = [test_average_of_three, test_average_keeps_fractions, test_average_of_nothing_is_zero]
for test in tests:
    try:
        test()
        print("PASS", test.__name__)
    except AssertionError:
        print("FAIL", test.__name__)
    except Exception as error:
        print("ERROR", test.__name__, type(error).__name__)
`,
      notes: {
        2: 'The code under test. It has a real bug: `//` is *floor* division, so 1.5 becomes 1.',
        5: '**Arrange**: build the input.',
        6: '**Act**: call the code under test exactly once.',
        7: '**Assert**: check the result. 240 // 3 is 80, so this test passes — the bug is invisible here.',
        10: '`[1, 2]` exposes the bug: `3 // 2` is `1`, not `1.5`. The assert raises **AssertionError**.',
        13: 'An empty list makes `len(scores)` zero, so Python raises **ZeroDivisionError** before the assert even runs.',
        18: 'A tiny test runner: call each test, and sort what happens into PASS, FAIL or ERROR.',
        21: 'AssertionError means "the code ran but gave the wrong answer" — a **failure**.',
        23: 'Any other exception means "the code crashed" — unittest calls this an **error**.',
      },
    },
    alt: 'Step-by-step trace of three test functions run by a small loop. The first test arranges a list of three scores, calls average and asserts the result is 80; it passes. The second asserts average of 1 and 2 is 1.5, but floor division returns 1, so an AssertionError is raised and FAIL is printed. The third calls average on an empty list, which raises ZeroDivisionError, so ERROR is printed.',
    caption: py`One passing test proved almost nothing: the bug only showed up with an odd total (\`[1, 2]\`) and an empty list. That's why good suites test **edge cases**, not just the "happy path".`,
  },
  syntax: [
    py`#### The assert statement`,
    { code: py`assert condition                 # raises AssertionError if condition is falsy
assert condition, "message"      # ...with a message explaining what went wrong

price = 4.5
assert price > 0, f"price must be positive, got {price}"`, lang: 'python', title: 'assert' },
    py`\`assert\` is a *statement*, not a function — never wrap it in parentheses with the message inside: \`assert (x == 1, "msg")\` asserts a **tuple**, which is always truthy, so it can never fail (Python even warns: *SyntaxWarning: assertion is always true, perhaps remove parentheses?*).`,
    { callout: 'warn', title: 'assert is for tests and "can\'t happen" checks — not input validation', text: py`Running Python with \`python -O\` sets \`__debug__\` to \`False\` and **removes every assert** from the compiled code. Checks that must always run (user input, API data, permissions) should \`raise ValueError(...)\` explicitly — see [raising exceptions](lesson:raising-exceptions).` },
    py`#### Arrange → Act → Assert`,
    py`Almost every good test has three parts, often separated by a blank line:`,
    py`1. **Arrange** — build the objects and inputs the test needs.
2. **Act** — do the *one* thing you're testing (usually one function call).
3. **Assert** — check the result (return value, changed state, or raised exception).`,
    py`Some teams call the same idea **Given / When / Then**: *given* a cart with one €50 item, *when* I ask for the total, *then* I get €45.`,
    py`#### unittest in one screen`,
    { code: py`import unittest

from cart import Cart                 # the code under test


class TestCart(unittest.TestCase):    # a group of related tests
    def setUp(self):                  # runs before EACH test method
        self.cart = Cart()

    def tearDown(self):               # runs after EACH test (even a failing one)
        pass                          # close files, connections... if you opened any

    def test_empty_cart_total_is_zero(self):     # names must start with "test"
        self.assertEqual(self.cart.total(), 0)

    def test_zero_quantity_is_rejected(self):
        with self.assertRaises(ValueError) as caught:
            self.cart.add_item("pen", 1.50, quantity=0)
        self.assertIn("positive", str(caught.exception))


if __name__ == "__main__":
    unittest.main()                   # run every test in this file`, lang: 'python', title: 'test_cart.py' },
    py`| assertion | passes when |
|---|---|
| \`assertEqual(a, b)\` / \`assertNotEqual\` | \`a == b\` / \`a != b\` |
| \`assertTrue(x)\` / \`assertFalse(x)\` | \`bool(x)\` is True / False |
| \`assertIs(a, b)\`, \`assertIsNone(x)\` | identity: \`a is b\`, \`x is None\` |
| \`assertIn(a, b)\` | \`a in b\` |
| \`assertIsInstance(obj, cls)\` | \`isinstance(obj, cls)\` |
| \`assertAlmostEqual(a, b)\` | \`round(a - b, 7) == 0\` — use for floats |
| \`assertCountEqual(a, b)\` | same elements, any order |
| \`assertRaises(Exc)\` | the \`with\` block raises \`Exc\` or a subclass |
| \`assertRaisesRegex(Exc, pattern)\` | …and the message matches the regex |`,
    py`The specialised methods exist because they produce better failure messages: \`assertEqual\` prints \`AssertionError: 4.0 != 4.25\`, while \`assertTrue(a == b)\` can only say \`False is not true\`.`,
    py`#### Running tests from the terminal`,
    { code: py`python -m unittest                       # discover test*.py files under the current folder
python -m unittest -v                    # verbose: one line per test
python -m unittest test_cart             # one module
python -m unittest test_cart.TestCart.test_empty_cart_total_is_zero   # one test
python -m unittest discover -s tests     # look inside ./tests`, lang: 'bash', title: 'terminal' },
    py`#### Many cases in one test: subTest`,
    { code: py`import unittest


class TestQuantities(unittest.TestCase):
    def test_non_positive_quantities_are_rejected(self):
        for quantity in [0, -1, -100]:
            with self.subTest(quantity=quantity):    # each case is reported separately
                with self.assertRaises(ValueError):
                    if quantity <= 0:
                        raise ValueError("quantity must be positive")`, lang: 'python', title: 'subTest' },
    py`Without \`subTest\`, the first failing iteration would stop the loop and hide the others. (pytest's \`@pytest.mark.parametrize\` does this job more neatly — see [pytest basics](lesson:pytest-basics#syntax).)`,
  ],
  walkthrough: {
    title: 'Reading the cart test suite',
    lang: 'python',
    code: CART_TESTS,
    intro: py`This is \`main.py\` in the playground below; the code under test lives in \`cart.py\`. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [1, 3], text: py`Import the framework and the code under test. Tests live in a **separate file** from the code they test; the test imports it like any other module.` },
      { lines: [6], text: py`A test class groups related tests. Subclassing \`unittest.TestCase\` gives you all the \`assert...\` methods and the setUp/tearDown machinery.` },
      { lines: [7, 9], text: py`\`setUp\` runs before **every** test method. unittest also creates a brand-new \`TestCart\` instance for every test, so no test can see a cart another test filled.` },
      { lines: [11, 15], text: py`A textbook **arrange → act → assert** test. The method name says the behaviour in plain English; when it fails, the name alone tells you what broke.` },
      { lines: [22, 28], text: py`Two **boundary tests**. The rule is "€50 or more gets 10% off", so we test *just below* (49.99) and *exactly at* (50.00) the threshold. Off-by-one mistakes like \`>\` instead of \`>=\` live exactly there.` },
      { lines: [31, 34], text: py`\`unittest.main()\` finds every \`TestCase\` in the module and runs it. \`exit=False\` stops it from calling \`sys.exit()\` afterwards (useful in notebooks and this playground); \`verbosity=2\` prints one line per test. The report goes to **stderr**, so we also print a one-line summary to stdout.` },
    ],
  },
  playground: {
    title: 'Testing a shopping cart',
    objective: 'Run the suite, then break the code on purpose, add tests for an empty cart and for invalid quantities, and watch the report change.',
    files: { 'main.py': CART_TESTS, 'cart.py': CART },
    expected: py`unittest's report (on stderr) lists the four tests as \`ok\`, then \`Ran 4 tests\` and \`OK\`. The final stdout line is:

\`\`\`text
4 tests run, 0 failed, 0 errors
\`\`\`

The tests run in **alphabetical order** of their method names, not the order you wrote them. Real shops store money as integer cents or \`decimal.Decimal\` — floats just keep this example short (see [numbers & math](lesson:numbers-and-math)).`,
    experiments: [
      {
        id: 'see-it-fail',
        task: py`Break the code on purpose: in \`cart.py\`, change \`subtotal >= DISCOUNT_THRESHOLD\` to \`subtotal > DISCOUNT_THRESHOLD\`. Run it. Which test fails, and what does the \`FAIL:\` report say? (Put \`>=\` back after this experiment.)`,
        hint: py`It's line 25 of \`cart.py\`. Read the report from the bottom up: the last line of the traceback is \`AssertionError: 50.0 != 45.0\`.`,
        tests: [{ name: 'a test now fails', code: py`assert "1 failed" in output, 'Change >= to > in cart.py and run again'` }],
        explain: py`Only the boundary test notices: €50.00 is no longer "≥ the threshold" so no discount is applied, and \`assertEqual\` shows both values (\`50.0 != 45.0\`). Without that one boundary test, this bug would have shipped. Remember to change \`>\` back to \`>=\`.`,
      },
      {
        id: 'empty-cart',
        task: py`Add a test method named \`test_empty_cart_total_is_zero\` that checks a brand-new cart's \`total()\` is \`0\`. Make sure the whole suite passes.`,
        hint: py`\`setUp\` already gives you \`self.cart\`. One line is enough: \`self.assertEqual(self.cart.total(), 0)\`.`,
        tests: [
          { name: 'the test exists', code: py`import unittest
assert "test_empty_cart_total_is_zero" in unittest.defaultTestLoader.getTestCaseNames(TestCart), 'Add a method named test_empty_cart_total_is_zero to TestCart'` },
          { name: 'the whole suite passes', code: RUN_SUITE + py`
result = run_suite()
assert result.wasSuccessful(), 'Some tests fail — check the report and fix them (did you put >= back?)'` },
        ],
        explain: py`"Empty" is the classic edge case. \`sum()\` of nothing is \`0\`, and \`round(0, 2)\` is \`0\`, so it passes — and now that behaviour is *locked in*: if someone later changes \`subtotal()\` in a way that crashes on an empty cart, this test will tell them immediately.`,
      },
      {
        id: 'assert-raises',
        task: py`Add a test method (any name starting with \`test\`) that checks \`add_item("pen", 1.50, 0)\` raises \`ValueError\`, using \`with self.assertRaises(ValueError):\`.`,
        hint: py`Put **only** the call that should fail inside the \`with\` block:
\`\`\`python
def test_zero_quantity_is_rejected(self):
    with self.assertRaises(ValueError):
        self.cart.add_item("pen", 1.50, 0)
\`\`\``,
        tests: [
          { name: 'your tests catch a cart that forgets to validate quantity', code: RUN_SUITE + py`
from cart import Cart
original = Cart.add_item
def add_item_without_check(self, name, unit_price, quantity=1):
    if name in self.items:
        price, old_quantity = self.items[name]
        self.items[name] = (price, old_quantity + quantity)
    else:
        self.items[name] = (unit_price, quantity)
Cart.add_item = add_item_without_check
try:
    result = run_suite()
finally:
    Cart.add_item = original
assert not result.wasSuccessful(), 'A Cart that accepts quantity 0 still passes all your tests — add a test using assertRaises(ValueError)'` },
          { name: 'the suite passes on the real cart', code: RUN_SUITE + py`
result = run_suite()
assert result.wasSuccessful(), 'Your new test fails on the real (correct) cart — check the call inside the with block'` },
        ],
        explain: py`The checker swapped in a broken \`add_item\` with no validation and ran *your* tests: one of them failed, so your suite really guards that rule. This is the idea behind **mutation testing** ([TDD & coverage](lesson:tdd)): a test is only useful if it fails when the code is wrong.`,
      },
      {
        id: 'verbosity',
        task: py`Change \`verbosity=2\` to \`verbosity=1\`, run, then try \`verbosity=0\`. Compare the reports.`,
        explain: py`With \`verbosity=1\` (the default for \`unittest.main()\`) each passing test is a single \`.\`, a failure is \`F\`, an error \`E\` and a skip \`s\`. pytest uses the same characters. Big suites use the quiet form; \`-v\` is for when you want to see every name.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The test pyramid',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'e2e', label: 'End-to-end tests', note: 'few · slow · the whole system', x: 380, y: 60, tone: 'red' },
        { id: 'integration', label: 'Integration tests', note: 'some · modules + real DB / files', x: 380, y: 165, tone: 'yellow' },
        { id: 'unit', label: 'Unit tests', note: 'many · milliseconds · one function or class', x: 380, y: 270, tone: 'blue' },
        { id: 'fast', label: 'Fast, precise feedback', note: 'pinpoints the broken line', x: 110, y: 270, tone: 'paper' },
        { id: 'real', label: 'Realistic confidence', note: 'proves the parts work together', x: 650, y: 60, tone: 'paper' },
      ],
      edges: [
        { id: 'u-i', from: 'unit', to: 'integration', label: 'combine units' },
        { id: 'i-e', from: 'integration', to: 'e2e', label: 'add UI / network' },
        { id: 'u-fast', from: 'unit', to: 'fast', dashed: true },
        { id: 'e-real', from: 'e2e', to: 'real', dashed: true },
      ],
      steps: [
        { focus: ['unit'], text: py`**Unit tests** check one small *unit* — a function or a class — on its own, with no network, database or real files. They run in milliseconds, so you can have thousands and run them on every save.` },
        { focus: ['unit', 'fast'], edges: ['u-fast'], text: py`When a unit test fails it points at one function, so the bug is easy to find. That precision is why they form the wide **base** of the pyramid.` },
        { focus: ['integration'], edges: ['u-i'], text: py`**Integration tests** check that several units work *together* with something real: the cart talking to an actual SQLite database, or code reading a real CSV file. Slower, fewer, but they catch mismatched assumptions between parts.` },
        { focus: ['e2e'], edges: ['i-e'], text: py`**End-to-end (E2E) tests** drive the whole application like a user would — click the button in a real browser, check the order email. Most realistic, but slow, and often *flaky* (failing randomly because of timing or networks).` },
        { focus: ['e2e', 'real'], edges: ['e-real'], text: py`The pyramid (popularised by Mike Cohn) is a rule of thumb, not a law: **many** unit tests, **some** integration tests, **a few** E2E tests. An upside-down "ice-cream cone" of mostly E2E tests is slow and painful to debug.` },
      ],
    },
    alt: 'A three-level pyramid. The wide base is Unit tests: many, milliseconds, one function or class, linked to fast precise feedback. The middle is Integration tests: some, modules with a real database or files. The narrow top is End-to-end tests: few, slow, the whole system, linked to realistic confidence.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`assert\` is really just a short way to write an \`if\` that raises an error. The language reference defines \`assert expr, msg\` as equivalent to:`,
      { code: py`if __debug__:
    if not expr:
        raise AssertionError(msg)`, lang: 'python', static: true, title: 'what assert means' },
      py`\`__debug__\` is \`True\` normally and \`False\` under \`python -O\`, which is why optimised runs skip asserts completely.`,
      py`A test "passes" simply because it **finishes without raising**. That means a test with *no* assertion always passes — it only proves the code didn't crash.`,
    ],
    technical: [
      py`What \`unittest.main()\` does, step by step:`,
      py`1. A **TestLoader** looks through the module for \`TestCase\` subclasses and, in each one, for method names starting with \`test\` (the loader's \`testMethodPrefix\`). It sorts them **alphabetically** by name.
2. For **every test method** it creates a **new instance** of the class: \`TestCart("test_subtotal_is_price_times_quantity")\`. That's why \`self.cart\` set in \`setUp\` can't leak between tests.
3. A **TextTestRunner** runs each instance: \`setUp()\` → the test method → \`tearDown()\` (only if \`setUp\` succeeded) → any functions registered with \`addCleanup()\`.
4. The outcome goes into a **TestResult**: an \`AssertionError\` (the class's \`failureException\`) is a **failure**; any other exception is an **error**; \`unittest.SkipTest\` is a **skip**.
5. The runner prints the report to **stderr** and \`unittest.main()\` calls \`sys.exit()\` with status 0 for success or 1 otherwise — that exit code is how CI systems know the build is red.`,
      py`The failure/error split is useful: a *failure* says "your code gave the wrong answer", an *error* says "your code (or the test itself) crashed". In [pytest](lesson:pytest-basics), an exception inside the test body counts as a failure, and "error" is reserved for problems in setup code ([fixtures](lesson:fixtures)).`,
      { callout: 'note', title: 'Language guarantee vs convention', text: py`The \`test\` prefix, alphabetical order and one-instance-per-test are documented behaviour of the \`unittest\` library, not of the Python language. Other runners (pytest, nose2) have their own rules — pytest, for example, runs tests in the order they appear in the file.` },
    ],
    production: [
      py`In real projects, tests run automatically in **CI** (continuous integration — a server that runs your suite on every push and blocks merging when anything is red). That only works if the suite is:`,
      py`- **Fast** — unit tests take milliseconds each; slow suites stop being run.
- **Isolated** — each test builds its own state and cleans up; tests pass in *any* order and in parallel.
- **Deterministic** — same code, same result, every time. No real clock, randomness or network without control (see [mocking](lesson:mocking)). A test that sometimes fails for no reason is **flaky**, and flaky tests teach people to ignore red builds.
- **Focused** — one behaviour per test, with a name that describes it. When \`test_discount_at_exactly_the_threshold\` fails you know the bug before you open the file.`,
      py`When you fix a bug, first write a test that reproduces it (it fails), then fix the code (it passes). That **regression test** guarantees the same bug can never silently return. This habit grows naturally into [test-driven development](lesson:tdd).`,
      py`Hunt for **edge cases** systematically: empty / one / many; zero and negative numbers; exactly at, just below and just above every boundary; very large inputs; \`None\`; empty strings, whitespace and non-ASCII text; duplicates; and invalid types. Bugs cluster at the edges because that's where humans forget to think.`,
    ],
  },
  mistakes: [
    {
      title: 'A test with no assertion',
      wrong: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    def test_discount(self):
        cart = Cart()
        cart.add_item("board game", 50.00)
        cart.total() == 45.00      # compares, then throws the result away`, lang: 'python' },
      right: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    def test_discount(self):
        cart = Cart()
        cart.add_item("board game", 50.00)
        self.assertEqual(cart.total(), 45.00)`, lang: 'python' },
      explanation: py`A test passes whenever it finishes without raising. The comparison on its own line computes \`True\` or \`False\` and discards it, so this test can **never** fail. Always end with an assertion — and watch a new test fail at least once to prove it can.`,
    },
    {
      title: 'Wrapping assert in parentheses',
      wrong: { code: py`total = 40
assert (total == 45, "discount not applied")   # always passes!`, lang: 'python' },
      right: { code: py`total = 45
assert total == 45, "discount not applied"`, lang: 'python' },
      explanation: py`With the parentheses you're asserting a two-item **tuple**, and any non-empty tuple is truthy. Python prints \`SyntaxWarning: assertion is always true, perhaps remove parentheses?\` — treat that warning as an error.`,
    },
    {
      title: 'Using assert to validate input in real code',
      wrong: { code: py`def withdraw(balance, amount):
    assert amount > 0, "amount must be positive"   # vanishes under python -O
    return balance - amount`, lang: 'python' },
      right: { code: py`def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError(f"amount must be positive, got {amount}")
    return balance - amount`, lang: 'python' },
      explanation: py`\`python -O\` strips every assert, so the "check" silently disappears in optimised deployments. Use \`assert\` in tests and for internal "this can never happen" sanity checks; use \`raise\` for anything that guards real data.`,
    },
    {
      title: 'Tests that share state',
      wrong: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    cart = Cart()          # ONE cart, created once, shared by every test

    def test_add_apple(self):
        self.cart.add_item("apple", 0.50)
        self.assertEqual(len(self.cart.items), 1)

    def test_add_bread(self):
        self.cart.add_item("bread", 2.25)
        self.assertEqual(len(self.cart.items), 1)   # fails: the apple is still there`, lang: 'python' },
      right: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    def setUp(self):
        self.cart = Cart()   # a fresh cart before every test

    def test_add_apple(self):
        self.cart.add_item("apple", 0.50)
        self.assertEqual(len(self.cart.items), 1)

    def test_add_bread(self):
        self.cart.add_item("bread", 2.25)
        self.assertEqual(len(self.cart.items), 1)`, lang: 'python' },
      explanation: py`A class attribute is created once and shared by every instance, so tests leak into each other and the result depends on the order they run in. Build state in \`setUp\` (or a [fixture](lesson:fixtures)) so each test starts clean.`,
    },
    {
      title: 'Comparing floats with assertEqual',
      wrong: { code: py`import unittest


class TestMoney(unittest.TestCase):
    def test_sum(self):
        self.assertEqual(0.1 + 0.2, 0.3)   # AssertionError: 0.30000000000000004 != 0.3`, lang: 'python' },
      right: { code: py`import unittest


class TestMoney(unittest.TestCase):
    def test_sum(self):
        self.assertAlmostEqual(0.1 + 0.2, 0.3)`, lang: 'python' },
      explanation: py`Most decimal fractions can't be stored exactly in binary floating point (see [numbers & math](lesson:numbers-and-math)). Compare floats with a tolerance (\`assertAlmostEqual\`, or \`math.isclose\` / \`pytest.approx\`), or avoid floats for money entirely.`,
    },
    {
      title: 'Putting too much inside assertRaises',
      wrong: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    def test_bad_quantity(self):
        with self.assertRaises(ValueError):
            cart = Cart()
            cart.add_item("pen", "1.50", 2)     # a typo here could raise ValueError too...
            cart.add_item("pen", 1.50, 0)`, lang: 'python' },
      right: { code: py`import unittest
from cart import Cart


class TestCart(unittest.TestCase):
    def test_bad_quantity(self):
        cart = Cart()
        with self.assertRaises(ValueError):
            cart.add_item("pen", 1.50, 0)       # only the call that should fail`, lang: 'python' },
      explanation: py`If any line in the block raises the expected exception, the test passes — even the wrong line. Keep exactly one call inside, and check the message (\`assertRaisesRegex\` or \`caught.exception\`) when several things could raise the same type.`,
    },
  ],
  debugging: [
    {
      symptom: py`Ran 0 tests in 0.000s  /  NO TESTS RAN`,
      cause: py`The runner found nothing: method names don't start with \`test\` (\`check_total\`), the class doesn't inherit from \`unittest.TestCase\`, or (with \`python -m unittest discover\`) the file name doesn't match \`test*.py\`.`,
      fix: py`Rename methods to \`test_...\`, subclass \`unittest.TestCase\`, name files \`test_something.py\`. Run with \`-v\` to see exactly which tests were collected.`,
    },
    {
      symptom: py`AttributeError: 'TestCart' object has no attribute 'cart'`,
      cause: py`\`setUp\` never ran — usually it's misspelled (\`setup\`, \`set_up\`, \`SetUp\`). unittest only calls the exact name \`setUp\`.`,
      fix: py`Spell it \`setUp\` (camelCase, from Java's JUnit heritage), and \`tearDown\` likewise.`,
    },
    {
      symptom: py`AssertionError: ValueError not raised`,
      cause: py`The code inside \`with self.assertRaises(ValueError):\` finished normally — the validation you expected doesn't exist or isn't reached.`,
      fix: py`Check the code under test really raises for that input, and that the right call is inside the \`with\` block.`,
    },
    {
      symptom: py`ERROR: test_zero_people_is_rejected ... ZeroDivisionError: integer division or modulo by zero`,
      cause: py`The test expected \`ValueError\`, but a *different* exception escaped. \`assertRaises\` only catches the type you name (and its subclasses); anything else becomes an **error**.`,
      fix: py`Add an explicit check in the code under test that raises the documented exception (\`if people < 1: raise ValueError(...)\`).`,
    },
    {
      symptom: py`A test passes on its own but fails when the whole suite runs (or the other way round).`,
      cause: py`Shared state: a class attribute, module-level list, global setting, or file left behind by another test. The result depends on test order.`,
      fix: py`Create state in \`setUp\`, clean up in \`tearDown\`/\`addCleanup\`, never mutate module-level data in tests. Run a single test in isolation to confirm.`,
    },
  ],
  bestPractices: [
    'Test behaviour, not implementation: assert on results and visible effects, not on private helper calls.',
    'One behaviour per test, named after that behaviour: test_discount_at_exactly_the_threshold.',
    'Structure every test as arrange → act → assert, and keep each part short.',
    'Watch every new test fail once (break the code on purpose) — a test that cannot fail is worthless.',
    'Test edge cases deliberately: empty, one, many, zero, negative, at / below / above each boundary, invalid input.',
    'Keep tests isolated and deterministic: fresh state in setUp, no real network, clock or randomness without control.',
    'Prefer specific assertions (assertEqual, assertIn, assertRaises) over assertTrue(...) for clearer failure messages.',
    'When you fix a bug, add a regression test that fails before the fix and passes after it.',
  ],
  useCases: [
    'Locking in business rules (discount thresholds, tax, grading boundaries) so later changes cannot break them silently.',
    'Refactoring or optimising code with confidence: the suite proves behaviour did not change.',
    'Reproducing a reported bug as a failing test before fixing it.',
    'Documenting how a function should be called and what it returns, in executable form.',
    'Blocking merges in CI when any test fails.',
  ],
  whenToUse: {
    use: [
      'unittest when you cannot install packages (it ships with Python) or the project already uses it.',
      'Plain assert in quick scripts, notebooks and inside pytest tests.',
      'Unit tests for logic with many cases; integration tests where your code meets a database, file format or API.',
    ],
    avoid: [
      'assert for validating user input or anything that must run in production (python -O removes it).',
      'Relying only on end-to-end tests — slow, flaky and hard to debug.',
      'Testing private details (exact internal calls, attribute names) that make refactoring painful.',
    ],
  },
  comparison: {
    title: 'Unit vs integration vs end-to-end tests',
    headers: ['', 'Unit', 'Integration', 'End-to-end'],
    rows: [
      ['checks', 'one function or class in isolation', 'several parts together, with a real DB / file / service', 'the whole app, as a user uses it'],
      ['speed', 'milliseconds', 'slower (real I/O)', 'slowest (browser, network, deploy)'],
      ['how many', 'many', 'some', 'a few critical journeys'],
      ['when it fails', 'points at one unit', 'points at a boundary between parts', 'something somewhere is broken'],
      ['example', 'Cart.total() applies 10% at €50', 'orders are saved to and loaded from SQLite', 'a user adds to cart, pays, and receives an email'],
    ],
    note: py`The lines blur in practice ("is a test with a real temporary file a unit test?"). What matters is the trade-off: faster and more precise towards the left, more realistic towards the right.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'testing-fundamentals-q1',
      type: 'mcq',
      prompt: py`In \`unittest\`, what is the difference between a **failure** and an **error**?`,
      options: [
        { text: 'There is none — they are two names for the same outcome', why: 'unittest counts them separately: FAILED (failures=1, errors=2).' },
        'A failure is an assertion that did not hold; an error is any other exception raised while the test ran',
        { text: 'A failure happens in setUp; an error happens in the test method', why: 'Where it happens does not decide it — the exception type does. An exception in setUp is reported as an error.' },
        { text: 'An error means the test file has a syntax error', why: 'A syntax error stops the module from importing at all; that is reported differently (a failed import).' },
      ],
      answer: 1,
      explanation: py`An \`AssertionError\` (from \`assert\` or any \`self.assert...\` method) is a **failure**: the code ran but gave the wrong answer. Any other exception — \`ZeroDivisionError\`, \`KeyError\`… — is an **error**: something crashed.`,
    },
    {
      id: 'testing-fundamentals-q2',
      type: 'output',
      prompt: 'What does this tiny test runner print?',
      code: py`def test_addition():
    assert 1 + 1 == 2

def test_strings():
    assert "py" in "python", "substring check"
    assert len([]) == 1, "expected length 1"

for test in (test_addition, test_strings):
    try:
        test()
        print(test.__name__, "passed")
    except AssertionError as error:
        print(test.__name__, "failed:", error)`,
      answer: 'test_addition passed\ntest_strings failed: expected length 1',
      accept: ['test_addition passed\ntest_strings failed: expected length 1'],
      explanation: py`The first assert in \`test_strings\` holds (\`"py"\` is in \`"python"\`). The second fails, and its message becomes the exception's text, so \`print(..., error)\` shows \`expected length 1\`.`,
    },
    {
      id: 'testing-fundamentals-q3',
      type: 'output',
      prompt: py`What does the final \`print\` show? (unittest's own report goes to stderr — ignore it.)`,
      code: py`import unittest

log = []

class TestOrder(unittest.TestCase):
    def setUp(self):
        log.append("setUp")

    def test_zebra(self):
        log.append("zebra")

    def test_apple(self):
        log.append("apple")

unittest.main(argv=["demo"], exit=False, verbosity=0)
print(log)`,
      options: [
        { text: "['setUp', 'zebra', 'apple']", why: 'setUp runs before every test, not once per class — and the order is not the order in the file.' },
        { text: "['setUp', 'zebra', 'setUp', 'apple']", why: 'setUp does run twice, but unittest sorts test methods by name.' },
        "['setUp', 'apple', 'setUp', 'zebra']",
        { text: "['apple', 'zebra']", why: 'setUp is called automatically before each test method.' },
      ],
      answer: 2,
      explanation: py`unittest's loader sorts test methods **alphabetically**, so \`test_apple\` runs before \`test_zebra\`, and \`setUp\` runs before **each** of them. Good tests never depend on this order.`,
    },
    {
      id: 'testing-fundamentals-q4',
      type: 'bug',
      prompt: 'This test passes even when `total()` is completely broken. Click the line responsible.',
      code: py`import unittest
from cart import Cart

class TestCart(unittest.TestCase):
    def test_discount_at_threshold(self):
        cart = Cart()
        cart.add_item("board game", 50.00)
        cart.total() == 45.00`,
      answerLine: 8,
      explanation: py`Line 8 is an expression, not an assertion: it computes \`True\`/\`False\` and throws it away. A test passes whenever it doesn't raise, so this one can never fail. Write \`self.assertEqual(cart.total(), 45.00)\`.`,
    },
    {
      id: 'testing-fundamentals-q5',
      type: 'fill',
      prompt: 'Complete the test so it checks that a negative quantity raises `ValueError`, and that a valid item is stored.',
      code: py`class TestCart(unittest.TestCase):
    def setUp(self):
        self.cart = Cart()

    def test_negative_quantity_is_rejected(self):
        with self.___(ValueError):
            self.cart.add_item("pen", 1.50, -2)

    def test_item_is_stored(self):
        self.cart.add_item("pen", 1.50, 2)
        self.___(self.cart.items["pen"], (1.50, 2))`,
      answer: [['assertRaises'], ['assertEqual']],
      explanation: py`\`assertRaises\` used as a context manager fails the test unless the block raises the named exception. \`assertEqual\` compares two values and shows both if they differ.`,
    },
    {
      id: 'testing-fundamentals-q6',
      type: 'mcq',
      prompt: 'Which of these are properties of a good unit test? (Select all that apply.)',
      options: [
        'It runs in milliseconds',
        'It gives the same result every time it runs',
        { text: 'It relies on the test before it having added some data', why: 'That makes it order-dependent: it breaks when run alone, in parallel or in a different order.' },
        'It checks one behaviour and its name says which',
        { text: 'It calls a real payment API to be realistic', why: 'Real networks are slow, can fail randomly and may cost money. Use a test double for unit tests; keep real-service checks to a few integration tests.' },
      ],
      answer: [0, 1, 3],
      explanation: py`Good unit tests are **fast**, **deterministic**, **isolated** and **focused**. Depending on other tests or on the outside world makes a test slow and flaky.`,
    },
    {
      id: 'testing-fundamentals-q7',
      type: 'short',
      prompt: py`A teammate uses \`assert user_age >= 0\` to validate data coming from a web form. Why is that a bad idea, and what should they write instead?`,
      answer: py`Asserts are removed entirely when Python runs with -O (__debug__ is False), so the check can silently disappear in production. assert is meant for tests and internal sanity checks. For real input validation, use an explicit check that always runs: if user_age < 0: raise ValueError("age cannot be negative").`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'grade-boundaries',
      title: 'Guard the grade boundaries',
      difficulty: 'intermediate',
      prompt: py`\`letter_grade(score)\` is **correct**: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, otherwise F, and any score outside 0–100 (inclusive) raises \`ValueError\`. Your job is to write tests — add test methods to the \`TestLetterGrade\` class.

The checker grades your tests the way a mutation-testing tool would. It runs your \`TestLetterGrade\` suite:

1. against the real \`letter_grade\` — **all your tests must pass**;
2. against five deliberately broken versions — **each one must make at least one of your tests fail**:
   - a version that gives **90** a \`"B"\`;
   - a version that gives **89** an \`"A"\`;
   - a version that **rejects 100** with \`ValueError\`;
   - a version that **accepts scores above 100** (returns \`"A"\`);
   - a version that **accepts negative scores** (returns \`"F"\`).

Call the function by its name, \`letter_grade(...)\`, inside your tests.`,
      files: { 'main.py': GRADES_STARTER },
      hints: [
        'Bugs live at the edges. For each rule, test the value exactly at the boundary and the value just next to it.',
        'You need tests for 90 → "A", 89 → "B" and 100 → "A", plus two tests that expect ValueError (one for a score above 100, one for a negative score).',
        'with self.assertRaises(ValueError):\n    letter_grade(101)\n— and the same idea with letter_grade(-1). For the boundaries: self.assertEqual(letter_grade(90), "A").',
      ],
      solution: {
        explanation: py`Each test pins one edge of the specification. \`90 → "A"\` and \`89 → "B"\` pin both sides of the A boundary, so a \`>\`-instead-of-\`>=\` bug or a shifted threshold fails. \`100 → "A"\` and the two \`assertRaises\` tests pin both ends of the valid range. A suite that only tested comfortable middle values like 95 would pass against every broken version — high "coverage" of the code, but no protection. This is exactly how mutation-testing tools judge a test suite (see [TDD & coverage](lesson:tdd)).`,
        files: { 'main.py': GRADES_SOLUTION },
      },
      tests: [
        { name: 'all your tests pass on the correct letter_grade', code: GRADE_CHECK + py`
assert suite_passes_with(real), 'At least one of your tests fails on the CORRECT function — check its expected value'` },
        { name: 'catches a version that grades 90 as B', code: GRADE_CHECK + py`
assert not suite_passes_with(lambda s: "B" if s == 90 else real(s)), 'A broken version that gives 90 a "B" passes your tests. Test exactly 90.'` },
        { name: 'catches a version that grades 89 as A', code: GRADE_CHECK + py`
assert not suite_passes_with(lambda s: "A" if s == 89 else real(s)), 'A broken version that gives 89 an "A" passes your tests. Test 89 (just below the boundary).'` },
        { name: 'catches a version that rejects 100', code: GRADE_CHECK + py`
def rejects_100(s):
    if s == 100:
        raise ValueError("score must be below 100")
    return real(s)
assert not suite_passes_with(rejects_100), 'A broken version that rejects a perfect score passes your tests. Test that 100 is an "A".'` },
        { name: 'catches a version that accepts scores above 100', code: GRADE_CHECK + py`
assert not suite_passes_with(lambda s: "A" if s > 100 else real(s)), 'A broken version that accepts 101 passes your tests. Use assertRaises(ValueError) with a score above 100.'` },
        { name: 'catches a version that accepts negative scores', code: GRADE_CHECK + py`
assert not suite_passes_with(lambda s: "F" if s < 0 else real(s)), 'A broken version that accepts -1 passes your tests. Use assertRaises(ValueError) with a negative score.'` },
      ],
    },
    {
      id: 'split-the-bill',
      title: 'Make the red tests green',
      difficulty: 'intermediate',
      prompt: py`The tests are already written; the code isn't. \`split_bill(total_cents, people)\` must return a **list of whole-cent shares**, one per person, that:

- add up to \`total_cents\` **exactly**;
- differ by at most one cent, with the **leftover cents going to the first people** (\`split_bill(1000, 3)\` → \`[334, 333, 333]\`);
- raise \`ValueError\` if \`people\` is less than 1 or \`total_cents\` is negative.

Run the program to read the failing report, then fix **only** \`split_bill\`. The checker runs the \`TestSplitBill\` suite (all 5 tests must pass — don't delete or weaken them) and also calls \`split_bill\` directly, e.g. \`split_bill(5, 3) == [2, 2, 1]\`.`,
      files: { 'main.py': BILL_STARTER },
      hints: [
        'Read the report: which tests FAIL (wrong answer) and which ERROR (crash)? The ZeroDivisionError is an error because nothing raises the ValueError the test expects.',
        'divmod(total_cents, people) gives you both the equal share and the number of leftover cents. Validate people and total_cents first.',
        'share, leftover = divmod(total_cents, people)\nreturn [share + 1 if i < leftover else share for i in range(people)]\n— with two if ... raise ValueError(...) checks above it.',
      ],
      solution: {
        explanation: py`The validation comes first so bad input fails fast with the documented \`ValueError\` instead of an accidental \`ZeroDivisionError\`. \`divmod(1000, 3)\` returns \`(333, 1)\`: everyone pays 333 and the first 1 person pays one extra cent. Because \`share * people + leftover == total_cents\` by definition of \`divmod\`, the shares always add up — which is exactly what the \`subTest\` loop checks across 20 combinations. Notice how the tests acted as a precise specification: you knew you were done when the report said \`OK\`.`,
        files: { 'main.py': BILL_SOLUTION },
      },
      tests: [
        { name: 'the TestSplitBill suite passes (all 5 tests)', code: py`import unittest
result = unittest.TestResult()
suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestSplitBill)
suite.run(result)
assert result.testsRun >= 5, 'Keep all five tests in TestSplitBill'
assert result.wasSuccessful(), f'{len(result.failures)} failing and {len(result.errors)} erroring test(s) — run the program and read the report'` },
        { name: 'leftover cents go to the first people', code: py`assert split_bill(1000, 3) == [334, 333, 333]
assert split_bill(5, 3) == [2, 2, 1]` },
        { name: 'one person pays everything', code: py`assert split_bill(1234, 1) == [1234]` },
        { name: 'zero people raises ValueError', code: py`with raises(ValueError):
    split_bill(1000, 0)` },
        { name: 'a negative total raises ValueError', code: py`with raises(ValueError):
    split_bill(-500, 2)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'testing-fundamentals-why-test',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why do we write automated tests? What do they give you that running the program by hand does not?',
      answer: 'They check behaviour automatically and repeatably, so regressions are caught on every change; they make refactoring safe; they document intended behaviour precisely; and they force you to define "correct", including edge cases.',
      explanation: py`Manual checking doesn't scale: after each change you'd need to re-check every feature. An automated suite re-checks all of them in seconds, in CI, on every push. The suite is also executable documentation and a design tool — hard-to-test code is usually tightly coupled code.`,
      whyAsked: 'Interviewers want to hear that you see tests as an engineering tool (regressions, refactoring, design feedback), not as a chore.',
      mistakes: ['Saying tests "prove the code has no bugs" — they can only show the presence of bugs for the cases you check', 'Only mentioning finding bugs, not regressions or refactoring safety'],
      followUps: ['What is a regression test?', 'Can tests slow a team down?', 'What would you test first in an untested codebase?'],
      modelAnswer: 'The main reason is catching regressions: once a behaviour is covered by a test, any later change that breaks it is caught immediately, usually in CI before it merges. That makes refactoring safe — I can restructure code and the green suite tells me behaviour didn\'t change. Tests also document intent precisely: a test called test_discount_at_exactly_the_threshold states a business rule in executable form. And writing them forces me to decide what correct means for edge cases like empty input. They can\'t prove the absence of bugs, but they make whole classes of mistakes cheap to find.',
    },
    {
      id: 'testing-fundamentals-pyramid',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Explain unit, integration and end-to-end tests. How would you balance them in a web shop’s test suite?',
      answer: 'Unit tests check one function or class in isolation (fast, many); integration tests check parts working together with real dependencies such as a database (slower, some); end-to-end tests drive the whole system like a user (slowest, few). Follow the test pyramid: many unit, some integration, a few E2E for critical journeys like checkout.',
      explanation: py`Each level trades speed and precision for realism. A broken discount rule should be caught by a millisecond unit test that points at one function; a mismatched SQL column needs an integration test against a real (often temporary) database; "can a customer actually pay?" deserves one or two E2E tests. Too many E2E tests make the suite slow and flaky.`,
      whyAsked: 'It reveals whether you can design a test strategy, not just write individual tests.',
      mistakes: ['Treating the pyramid as exact ratios', 'Mocking everything and having no integration tests at all', 'Relying mainly on E2E tests'],
      followUps: ['What is a flaky test and how do you deal with one?', 'Is a test that uses a temporary SQLite file a unit or an integration test?', 'What is the "testing trophy"?'],
      modelAnswer: 'A unit test checks one small piece — a function or class — in isolation, so it runs in milliseconds and points straight at the broken code. An integration test checks that pieces work together with something real, like the order repository against an actual database. An end-to-end test drives the whole application the way a user does, through the UI or public API. For a web shop I would follow the pyramid: lots of unit tests for pricing, discounts and validation; integration tests for persistence and external APIs; and a handful of end-to-end tests for critical journeys like checkout. The trade-off is speed and precision versus realism, and too many end-to-end tests make a suite slow and flaky.',
    },
    {
      id: 'testing-fundamentals-tuple-assert',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This test has passed for months, yet the discount code it checks was broken last week. Why?',
      code: { lang: 'python', code: py`def test_discount():
    total = checkout_total(["board game"])
    assert (total == 45.00, "10% discount not applied")` },
      options: ['assert cannot compare floats', 'The assert checks a non-empty tuple, which is always truthy', 'Tests without unittest.TestCase never run', 'The message string makes the assert pass'],
      correctOption: 1,
      answer: 'The parentheses turn the assert into `assert (condition, message)` — a two-element tuple, which is always truthy, so the assertion can never fail. Remove the parentheses: `assert total == 45.00, "..."`.',
      explanation: py`\`assert\` is a statement with the form \`assert expr, msg\`. Wrapping both parts in parentheses creates one expression, a tuple. CPython emits \`SyntaxWarning: assertion is always true, perhaps remove parentheses?\` at compile time; linters such as Ruff flag it as well.`,
      whyAsked: 'Classic "test that cannot fail" bug; tests attention to detail and knowledge that assert is a statement.',
      mistakes: ['Blaming float comparison', 'Not noticing that a passing test can be useless'],
      followUps: ['How would you make sure a new test can fail?', 'What other patterns create tests that can never fail?'],
      modelAnswer: 'The assert is wrapped in parentheses, so instead of "assert condition, message" it asserts a tuple of two items. A non-empty tuple is always truthy, so this line can never fail no matter what total is. Python actually emits a SyntaxWarning saying the assertion is always true. The fix is to drop the parentheses. More generally, I always watch a new test fail once — by breaking the code or the expected value — to prove it can catch something.',
    },
    {
      id: 'testing-fundamentals-order-dependence',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A test passes when you run it alone but fails when the full suite runs. How do you investigate and fix it?',
      answer: 'It is order-dependent: another test leaves shared state behind (a class attribute, module global, environment variable, file or database row). Find the polluter by running the failing test together with smaller subsets of the earlier tests, then make every test build fresh state in setUp/fixtures and clean up after itself.',
      explanation: py`Common culprits: mutable class attributes on the TestCase, module-level caches, singletons, changed \`os.environ\`, files written to the working directory, and rows left in a shared database. Fixes: build state in \`setUp\`, clean up with \`tearDown\`/\`addCleanup\`, use temporary directories, patch globals with automatic undo (\`unittest.mock.patch\`, pytest's \`monkeypatch\`). Plugins such as pytest-randomly shuffle test order so these bugs surface early.`,
      whyAsked: 'Order-dependent tests are among the most common real-world test-suite problems; the answer shows practical debugging skill.',
      mistakes: ['Re-running until it passes', 'Fixing it by forcing a particular test order', 'Blaming the test framework'],
      followUps: ['How can you detect order dependence automatically?', 'What is the difference between setUp and setUpClass, and when is setUpClass risky?'],
      modelAnswer: 'That pattern almost always means shared state: some earlier test changes something — a class attribute, a module-level cache, an environment variable, a file or a database row — and doesn\'t restore it. I would reproduce it by running the failing test after progressively smaller groups of earlier tests until I find the polluter. The fix is isolation: each test builds what it needs in setUp or a fixture and cleans up with tearDown or addCleanup, and globals are changed only through tools that undo the change automatically, like mock.patch. To stop it recurring, I would run the suite in random order in CI.',
    },
    {
      id: 'testing-fundamentals-mini-runner',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `run_tests(tests)` that calls each zero-argument test function and returns `{"passed": [...], "failed": [...], "errors": [...]}` with the test function names. An `AssertionError` is a failure, any other exception is an error, and one bad test must not stop the others.',
      answer: 'Loop over the functions, call each inside try/except: no exception → passed; except AssertionError → failed; except Exception → errors. Append test.__name__ to the right list.',
      explanation: py`The order of the \`except\` clauses matters: \`AssertionError\` is itself a subclass of \`Exception\`, so it must be caught first. Catching \`Exception\` (not \`BaseException\`) lets \`KeyboardInterrupt\` still stop the run — real runners do the same.`,
      starter: { files: { 'main.py': py`def run_tests(tests):
    """Run each test function; sort names into passed / failed / errors."""
    report = {"passed": [], "failed": [], "errors": []}
    # TODO
    return report


def test_ok():
    assert 2 + 2 == 4

def test_wrong():
    assert 2 + 2 == 5

def test_crash():
    {}["missing"]

print(run_tests([test_ok, test_wrong, test_crash]))
` } },
      tests: [
        { name: 'a passing test is reported as passed', code: py`def test_fine():
    assert True
assert run_tests([test_fine]) == {"passed": ["test_fine"], "failed": [], "errors": []}` },
        { name: 'an AssertionError is a failure', code: py`def test_bad():
    assert 1 == 2
assert run_tests([test_bad])["failed"] == ["test_bad"]` },
        { name: 'any other exception is an error', code: py`def test_boom():
    1 / 0
assert run_tests([test_boom])["errors"] == ["test_boom"]` },
        { name: 'one bad test does not stop the others', code: py`assert run_tests([test_crash, test_wrong, test_ok]) == {"passed": ["test_ok"], "failed": ["test_wrong"], "errors": ["test_crash"]}` },
      ],
      solution: { files: { 'main.py': py`def run_tests(tests):
    """Run each test function; sort names into passed / failed / errors."""
    report = {"passed": [], "failed": [], "errors": []}
    for test in tests:
        try:
            test()
        except AssertionError:
            report["failed"].append(test.__name__)
        except Exception:
            report["errors"].append(test.__name__)
        else:
            report["passed"].append(test.__name__)
    return report


def test_ok():
    assert 2 + 2 == 4

def test_wrong():
    assert 2 + 2 == 5

def test_crash():
    {}["missing"]

print(run_tests([test_ok, test_wrong, test_crash]))
` } },
      hints: ['Use try / except / else inside the loop.', 'Catch AssertionError before Exception — it is a subclass of Exception.'],
      whyAsked: 'Shows you understand what a test runner does under the hood and the failure-vs-error distinction.',
      mistakes: ['Catching Exception first, so failures are reported as errors', 'Letting the first exception end the loop', 'Catching BaseException and swallowing KeyboardInterrupt'],
      followUps: ['How would you add setUp/tearDown support?', 'How would you time each test?', 'How does pytest discover test functions without you listing them?'],
      modelAnswer: 'I loop over the test functions and call each one inside try/except/else. If it raises AssertionError, it is a failure — the code ran but the check did not hold — so its name goes in failed. Any other Exception is an error, meaning something crashed. If nothing is raised, the else branch records it as passed. The except order matters because AssertionError is a subclass of Exception. Catching per test means one broken test cannot stop the others, which is exactly what real runners like unittest do.',
    },
    {
      id: 'testing-fundamentals-unittest-main',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What actually happens when you call `unittest.main()`? Why does each test method get a fresh `self`?',
      answer: 'unittest.main builds a TestProgram: a TestLoader finds TestCase subclasses in __main__, collects methods starting with "test" (sorted by name) and creates one TestCase instance per method; a TextTestRunner runs each — setUp, the method, tearDown, cleanups — recording outcomes in a TestResult, prints the report to stderr and exits with status 0 or 1.',
      explanation: py`One-instance-per-method is a deliberate isolation design inherited from JUnit: attributes set in \`setUp\` live on that instance only. Failures are exceptions matching \`self.failureException\` (AssertionError); anything else is an error; \`SkipTest\` marks a skip. \`exit=False\` returns the TestProgram instead of calling \`sys.exit\`, and \`program.result\` holds the TestResult with \`testsRun\`, \`failures\`, \`errors\` and \`skipped\`.`,
      whyAsked: 'Senior candidates are expected to understand their tools, which helps when debugging odd runner behaviour or writing custom runners.',
      mistakes: ['Thinking setUp runs once per class (that is setUpClass)', 'Assuming tests run in source order', 'Not knowing the report goes to stderr and the exit code signals failure'],
      followUps: ['When would you use setUpClass, and what are the risks?', 'How does addCleanup differ from tearDown?', 'How does CI know a test run failed?'],
      modelAnswer: 'unittest.main creates a TestProgram. Its TestLoader scans the __main__ module for TestCase subclasses and collects every method whose name starts with "test", sorted alphabetically. For each method it instantiates the class separately, so every test gets a fresh self — that is the isolation guarantee, and why state from setUp can\'t leak. A TextTestRunner then runs setUp, the test method, tearDown and any registered cleanups, classifying AssertionErrors as failures and other exceptions as errors in a TestResult. Finally it prints the report to stderr and calls sys.exit with zero or one, which is what CI uses to mark a build red.',
    },
  ],

  takeaways: [
    'A test runs your code and checks the result automatically; its main job is catching regressions on every change.',
    'Structure tests as arrange → act → assert, one behaviour per test, with a name that describes that behaviour.',
    'assert raises AssertionError when the condition is false — but python -O removes asserts, so never use them to validate real input.',
    'unittest: subclass TestCase, name methods test_*, use assertEqual / assertRaises / assertAlmostEqual; setUp runs before every test on a fresh instance.',
    'A failure is an assertion that did not hold; an error is any other exception. A test with no assertion can never fail.',
    'Good tests are fast, isolated, deterministic and focused — and they hunt edge cases: empty, zero, negative, and both sides of every boundary.',
    'The test pyramid: many unit tests, some integration tests, a few end-to-end tests.',
  ],
}

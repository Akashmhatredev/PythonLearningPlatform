// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------------ shared files
const MAIN = py`"""Number Guessing Game: run this file to play."""
from game import play


def main():
    try:
        play()
    except EOFError:
        # The input ran out (Ctrl+D on macOS/Linux, Ctrl+Z then Enter on Windows,
        # or no more pre-typed lines): leave politely instead of crashing.
        print("\nInput ended. Thanks for playing, bye!")


if __name__ == "__main__":
    main()
`

const RULES_STARTER = py`"""The rules of the game: pure functions, no input() and no print()."""
import random

LOW = 1
HIGH = 100
MAX_ATTEMPTS = 7


def pick_secret(low=LOW, high=HIGH, rng=random):
    """Return a random whole number from low to high (both included).

    rng is anything with a randint(a, b) method: the random module in the
    real game, a fake with a fixed answer in the tests.
    """
    # TODO (step 2): ask rng for the number instead of always returning 50.
    return 50


def check_guess(guess, secret):
    """Return "higher", "lower" or "correct".

    "higher" means the secret is higher than the guess (so guess higher next).
    """
    # TODO (step 3)
    return "correct"


def parse_guess(text, low=LOW, high=HIGH):
    """Turn what the player typed into an int from low to high.

    Raise ValueError with a friendly message for anything else.
    """
    # TODO (step 4): strip spaces, convert with int(), check the range.
    return None
`

const RULES = py`"""The rules of the game: pure functions, no input() and no print()."""
import random

LOW = 1
HIGH = 100
MAX_ATTEMPTS = 7


def pick_secret(low=LOW, high=HIGH, rng=random):
    """Return a random whole number from low to high (both included).

    rng is anything with a randint(a, b) method: the random module in the
    real game, a fake with a fixed answer in the tests.
    """
    return rng.randint(low, high)


def check_guess(guess, secret):
    """Return "higher", "lower" or "correct".

    "higher" means the secret is higher than the guess (so guess higher next).
    """
    if guess < secret:
        return "higher"
    if guess > secret:
        return "lower"
    return "correct"


def parse_guess(text, low=LOW, high=HIGH):
    """Turn what the player typed into an int from low to high.

    Raise ValueError with a friendly message for anything else.
    """
    text = text.strip()
    if not text:
        raise ValueError("Please type a number.")
    try:
        guess = int(text)
    except ValueError:
        raise ValueError(f"'{text}' is not a whole number.") from None
    if not low <= guess <= high:
        raise ValueError(f"{guess} is out of range: pick a number between {low} and {high}.")
    return guess
`

const GAME_STARTER = py`"""The interactive part: reads guesses with input() and prints feedback."""
import random

from rules import HIGH, LOW, MAX_ATTEMPTS, check_guess, parse_guess, pick_secret

HINTS = {
    "higher": "Too low! Go higher.",
    "lower": "Too high! Go lower.",
}


def play_round(secret, low=LOW, high=HIGH, max_attempts=MAX_ATTEMPTS):
    """Play one round.

    Returns the number of attempts used, or None if the player ran out.
    """
    # TODO (step 5): loop until the guess is correct or the attempts run out.
    return None


def ask_yes_no(prompt):
    """Ask until the player answers y/yes or n/no. Return True for yes."""
    # TODO (step 6)
    return False


def format_summary(stats):
    """Return e.g. "Rounds: 2 | Wins: 1 | Best: 4" ("Best: -" with no wins)."""
    # TODO (step 7)
    return "TODO: summary"


def play(rng=random, low=LOW, high=HIGH, max_attempts=MAX_ATTEMPTS):
    """Play rounds until the player stops. Return the stats dict."""
    print(f"I'm thinking of a number between {low} and {high}.")
    print(f"You have {max_attempts} attempts per round. Good luck!")
    stats = {"rounds": 0, "wins": 0, "best": None}
    # TODO (step 7): repeat rounds while ask_yes_no("Play again? (y/n) ")
    # says yes, and update stats after every round.
    secret = pick_secret(low, high, rng)
    play_round(secret, low, high, max_attempts)
    print(format_summary(stats))
    return stats
`

const GAME = py`"""The interactive part: reads guesses with input() and prints feedback."""
import random

from rules import HIGH, LOW, MAX_ATTEMPTS, check_guess, parse_guess, pick_secret

HINTS = {
    "higher": "Too low! Go higher.",
    "lower": "Too high! Go lower.",
}


def play_round(secret, low=LOW, high=HIGH, max_attempts=MAX_ATTEMPTS):
    """Play one round.

    Returns the number of attempts used, or None if the player ran out.
    """
    attempts = 0
    while attempts < max_attempts:
        text = input(f"Guess #{attempts + 1}: ")
        try:
            guess = parse_guess(text, low, high)
        except ValueError as err:
            print(err)
            continue                      # a typo does not cost an attempt
        attempts += 1
        result = check_guess(guess, secret)
        if result == "correct":
            word = "attempt" if attempts == 1 else "attempts"
            print(f"Correct! You got it in {attempts} {word}.")
            return attempts
        left = max_attempts - attempts
        print(f"{HINTS[result]} ({left} left)")
    print(f"Out of attempts! The number was {secret}.")
    return None


def ask_yes_no(prompt):
    """Ask until the player answers y/yes or n/no. Return True for yes."""
    while True:
        answer = input(prompt).strip().lower()
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("Please answer y or n.")


def format_summary(stats):
    """Return e.g. "Rounds: 2 | Wins: 1 | Best: 4" ("Best: -" with no wins)."""
    best = "-" if stats["best"] is None else stats["best"]
    return f"Rounds: {stats['rounds']} | Wins: {stats['wins']} | Best: {best}"


def play(rng=random, low=LOW, high=HIGH, max_attempts=MAX_ATTEMPTS):
    """Play rounds until the player stops. Return the stats dict."""
    print(f"I'm thinking of a number between {low} and {high}.")
    print(f"You have {max_attempts} attempts per round. Good luck!")
    stats = {"rounds": 0, "wins": 0, "best": None}
    while True:
        secret = pick_secret(low, high, rng)
        attempts = play_round(secret, low, high, max_attempts)
        stats["rounds"] += 1
        if attempts is not None:
            stats["wins"] += 1
            if stats["best"] is None or attempts < stats["best"]:
                stats["best"] = attempts
        if not ask_yes_no("Play again? (y/n) "):
            break
    print(format_summary(stats))
    return stats
`

// A fake random-number generator used by several tests.
const FAKE = py`class FakeRandom:
    def __init__(self, *numbers):
        self.numbers = list(numbers)
        self.calls = []

    def randint(self, low, high):
        self.calls.append((low, high))
        return self.numbers.pop(0)
`

export default {
  id: 'project-number-game',
  kind: 'project',
  title: 'Project 1: Number Guessing Game',
  summary: 'Build a complete terminal game — random secret, validated input, higher/lower hints, an attempt limit and play-again — split into testable functions.',
  difficulty: 'beginner',
  minutes: 75,
  prerequisites: ['while-loops', 'defining-functions', 'try-except'],
  related: ['first-program', 'type-conversion', 'if-statements', 'loop-control', 'booleans-and-comparisons', 'dictionaries', 'modules-and-imports', 'main-guard-and-scripts', 'raising-exceptions', 'input-validation', 'testing-fundamentals', 'mocking', 'clean-architecture', 'project-todo-manager'],
  tags: ['project', 'game', 'guessing game', 'random', 'randint', 'input', 'validation', 'while loop', 'ValueError', 'EOFError', 'dependency injection', 'binary search', 'beginner project'],
  apis: [
    { name: 'random.randint(a, b)', summary: 'A random integer N with a <= N <= b — both ends included.' },
    { name: 'int(text)', summary: 'Converts a string such as " 42 " to an int; raises ValueError for text that is not a whole number.' },
    { name: 'input(prompt)', summary: 'Prints the prompt, waits for a line and returns it as a str (raises EOFError when input has ended).' },
    { name: 'str.strip() / str.lower()', summary: 'Remove surrounding whitespace / lower-case the text, used to normalise answers.' },
    { name: 'raise ValueError(message)', summary: 'Signal bad input with an exception the caller can catch and show.' },
  ],
  docs: [
    { label: 'random — generate pseudo-random numbers', url: 'https://docs.python.org/3/library/random.html' },
    { label: 'Built-in functions: input() and int()', url: 'https://docs.python.org/3/library/functions.html#input' },
    { label: 'Tutorial — errors and exceptions', url: 'https://docs.python.org/3/tutorial/errors.html' },
    { label: 'Tutorial — more control flow tools', url: 'https://docs.python.org/3/tutorial/controlflow.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`The computer picks a secret number between 1 and 100. You guess. It answers *"too low"* or *"too high"* until you get it — or run out of attempts. Then it asks if you want to play again.`,
    py`It sounds like a toy, and it is — but it is also a **complete program**: it takes input from a human, survives every kind of typo, keeps score, loops, ends cleanly and is covered by automated tests. Those are exactly the habits that separate a script that *usually* works from software you can trust.`,
    py`You'll build it as three small files: \`rules.py\` (pure game logic — no \`input()\`, no \`print()\`), \`game.py\` (talks to the player) and a tiny \`main.py\` that starts everything. Along the way you'll use [while loops](lesson:while-loops), [functions](lesson:defining-functions), [type conversion](lesson:type-conversion), [try/except](lesson:try-except) and a trick professionals use to test anything random.`,
  ],
  why: [
    py`Every interactive program has the same skeleton: **read → validate → decide → respond → repeat**. A chat bot, an ATM, a command-line tool and a web form all follow it. The guessing game is the smallest program that has every one of those steps, so it is the perfect place to practise them.`,
    py`It also forces you to deal with the two things beginners usually ignore: **bad input** (people type \`forty\`, \`4.5\`, \`500\` or nothing at all) and **randomness in tests** (how do you check "the player won in 3 guesses" if the secret is different every run?). Solving both properly is a real professional skill.`,
  ],
  eli15: [
    py`Think of the game as a conversation with a very patient friend who is hiding a number behind their back.`,
    py`- You say a number. If it isn't a number at all ("banana"), your friend says *"that's not a number"* and lets you try again for free.
- If it's a real number, your friend says *"higher"*, *"lower"* or *"yes!"*, and you lose one of your seven tries.
- When the round ends, your friend asks *"again?"*.`,
    py`Our code just writes that conversation down as rules. The **rules** (is 30 too low for 42?) live in one file, and the **talking** (asking, printing) lives in another. Keeping them apart means we can test the rules without having to type anything.`,
  ],
  analogy: {
    title: 'A referee and an announcer',
    body: [
      py`At a football match, the **referee** applies the rules: offside or not, goal or not. The **announcer** tells the crowd what happened. The referee never shouts into a microphone, and the announcer never decides a goal.`,
      py`Our game is split the same way. \`rules.py\` is the referee: given a guess and the secret, it *decides* — \`"higher"\`, \`"lower"\`, \`"correct"\`. \`game.py\` is the announcer: it asks the player, *announces* the decision and keeps the scoreboard. Because the referee doesn't need a crowd, we can test every rule in silence.`,
    ],
    mapping: [
      ['referee', 'rules.py — pure functions that decide (check_guess, parse_guess)'],
      ['announcer', 'game.py — input() and print(), talking to the player'],
      ['the match starting', 'main.py — calls play() when you run the program'],
      ['the scoreboard', 'the stats dict: rounds, wins, best'],
      ['a training match with a known result', 'a test that injects a fake random generator with a fixed secret'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'How the three files work together',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'player', label: 'Player', note: 'types guesses', x: 90, y: 165, tone: 'kraft' },
        { id: 'main', label: 'main.py', note: 'starts the game, handles Ctrl+D', x: 300, y: 60, tone: 'yellow' },
        { id: 'game', label: 'game.py', note: 'input() · print() · stats', x: 300, y: 250, tone: 'blue' },
        { id: 'rules', label: 'rules.py', note: 'pure: parse · check · pick', x: 580, y: 250, tone: 'paper' },
        { id: 'rng', label: 'random', note: 'or a fake in tests', x: 580, y: 70, tone: 'ink' },
      ],
      edges: [
        { from: 'main', to: 'game', label: 'play()' },
        { from: 'player', to: 'game', label: 'input()' },
        { from: 'game', to: 'rules', label: 'parse_guess / check_guess' },
        { from: 'rules', to: 'rng', label: 'rng.randint()' },
        { id: 'reply', from: 'game', to: 'player', label: 'print()', dashed: true },
      ],
      steps: [
        { focus: ['main'], text: py`You run \`main.py\`. It does almost nothing: it calls \`play()\` and catches \`EOFError\` so that running out of input ends the game politely.` },
        { focus: ['main', 'game'], edges: ['main->game'], text: py`\`play()\` in \`game.py\` runs the session: rounds, the play-again question and the scoreboard.` },
        { focus: ['rules', 'rng'], edges: ['game->rules', 'rules->rng'], text: py`Each round starts with \`pick_secret()\`, which asks **whatever random generator it was given** for a number. In the real game that's the \`random\` module; in a test it's a fake that always answers 42.` },
        { focus: ['player', 'game'], edges: ['player->game'], text: py`The player types a guess. \`input()\` always returns a **string**, even if they typed digits.` },
        { focus: ['game', 'rules'], edges: ['game->rules'], text: py`\`parse_guess()\` turns the text into an int or raises \`ValueError\`; \`check_guess()\` decides \`"higher"\`, \`"lower"\` or \`"correct"\`. No printing happens in \`rules.py\`.` },
        { focus: ['game', 'player'], edges: ['reply'], text: py`\`game.py\` turns that decision into words (*"Too low! Go higher."*) and loops until the round is won or the attempts run out.` },
      ],
    },
    alt: 'Diagram of five boxes. main.py calls play() in game.py. The player sends input() to game.py and game.py prints replies back. game.py calls parse_guess and check_guess in rules.py, and rules.py asks a random generator (the random module or a test fake) for the secret.',
    caption: py`The **rules** never talk to the player, and the **game** never decides who wins. That split is what makes the program easy to test and easy to change.`,
  },

  // ------------------------------------------------------------------ plan
  requirements: [
    py`\`rules.pick_secret(low, high, rng)\` returns \`rng.randint(low, high)\` — the random generator is a parameter (default: the \`random\` module), so tests can pass a fake.`,
    py`\`rules.check_guess(guess, secret)\` returns \`"higher"\` when the secret is higher than the guess, \`"lower"\` when it is lower and \`"correct"\` when they are equal.`,
    py`\`rules.parse_guess(text, low, high)\` ignores surrounding spaces and returns an \`int\`. It raises \`ValueError\` whose message contains \`whole number\` for text like \`"forty"\` or \`"4.5"\`, and contains \`between {low} and {high}\` for numbers outside the range. \`low\` and \`high\` themselves are valid.`,
    py`\`game.play_round(secret, low=1, high=100, max_attempts=7)\` reads guesses with \`input()\`. Invalid text prints the error message and **does not use an attempt**. A wrong guess prints \`Too low! Go higher.\` or \`Too high! Go lower.\`. A win prints a line starting with \`Correct!\` and returns the number of attempts used; running out prints \`Out of attempts! The number was {secret}.\` and returns \`None\`.`,
    py`\`game.ask_yes_no(prompt)\` keeps asking until the answer is \`y\`, \`yes\`, \`n\` or \`no\` (any capitalisation, spaces ignored), printing \`Please answer y or n.\` otherwise. It returns \`True\` for yes.`,
    py`\`game.format_summary(stats)\` returns exactly \`Rounds: 2 | Wins: 1 | Best: 4\` — with \`Best: -\` when there are no wins yet.`,
    py`\`game.play(rng)\` plays rounds until the player answers no to \`Play again? (y/n)\`, prints the summary and returns the stats dict \`{"rounds": …, "wins": …, "best": …}\` (\`best\` is the fewest attempts in a won round, or \`None\`).`,
    py`Running out of input (Ctrl+D) ends the program with a goodbye message, never a traceback.`,
  ],
  objectives: [
    'Turn a vague game idea into small functions, each with one job and a clear return value.',
    'Validate untrusted input with int(), a range check and ValueError — and recover without crashing.',
    'Write a loop that stops for two different reasons (a win or the attempt limit).',
    'Separate pure logic from input/output so the logic can be tested without typing.',
    'Make randomness testable by injecting the random generator (dependency injection).',
    'Keep a session scoreboard in a dict and format it with an f-string.',
  ],

  // ------------------------------------------------------------------ build
  playground: {
    title: 'Number guessing game — starter',
    objective: 'Fill in the TODOs in rules.py and game.py until every test is green, then play a few rounds yourself.',
    files: { 'main.py': MAIN, 'rules.py': RULES_STARTER, 'game.py': GAME_STARTER },
    expected: py`The starter runs but doesn't play yet: it prints the welcome lines and \`TODO: summary\`. Press **Run tests** to see which behaviours are missing, then work through the steps below. When it's finished, a round looks like this:

\`\`\`text
I'm thinking of a number between 1 and 100.
You have 7 attempts per round. Good luck!
Guess #1: fifty
'fifty' is not a whole number.
Guess #1: 50
Too high! Go lower. (6 left)
Guess #2: 25
Too low! Go higher. (5 left)
Guess #3: 37
Correct! You got it in 3 attempts.
Play again? (y/n) n
Rounds: 1 | Wins: 1 | Best: 3
\`\`\``,
    tests: [
      { name: 'check_guess says "higher" when the guess is too low', code: py`from rules import check_guess
assert check_guess(30, 42) == "higher"
assert check_guess(1, 2) == "higher"` },
      { name: 'check_guess says "lower" for a high guess and "correct" for a match', code: py`from rules import check_guess
assert check_guess(80, 42) == "lower"
assert check_guess(42, 42) == "correct"` },
      { name: 'parse_guess turns " 42 " into the int 42', code: py`from rules import parse_guess
result = parse_guess(" 42 ", 1, 100)
assert result == 42
assert type(result) is int, 'Return an int, not the text'` },
      { name: 'parse_guess rejects text that is not a whole number', code: py`from rules import parse_guess
for bad in ["forty", "4.5", "4 2"]:
    with raises(ValueError, match="whole number"):
        parse_guess(bad, 1, 100)` },
      { name: 'parse_guess rejects numbers outside the range but accepts the ends', code: py`from rules import parse_guess
for bad in ["0", "101", "-5"]:
    with raises(ValueError, match="between 1 and 100"):
        parse_guess(bad, 1, 100)
assert parse_guess("1", 1, 100) == 1
assert parse_guess("100", 1, 100) == 100` },
      { name: 'pick_secret asks the injected generator for a number in range', code: py`from rules import pick_secret
${FAKE}
fake = FakeRandom(42)
assert pick_secret(1, 100, fake) == 42
assert fake.calls == [(1, 100)], 'Call rng.randint(low, high) exactly once'` },
      { name: 'play_round gives hints and returns the attempts used', stdin: '50\n30\n42', code: py`from game import play_round
result = []
out = capture(lambda: result.append(play_round(42)))
assert result == [3]
assert "Too high! Go lower." in out and "Too low! Go higher." in out
assert "Correct!" in out` },
      { name: 'typos and out-of-range guesses do not use an attempt', stdin: 'abc\n0\n\n42', code: py`from game import play_round
result = []
out = capture(lambda: result.append(play_round(42)))
assert result == [1], 'Only valid guesses count as attempts'
assert "whole number" in out and "between 1 and 100" in out` },
      { name: 'running out of attempts reveals the number and returns None', stdin: '1\n2\n3', code: py`from game import play_round
result = []
out = capture(lambda: result.append(play_round(42, max_attempts=3)))
assert result == [None]
assert "The number was 42" in out` },
      { name: 'ask_yes_no repeats until it gets y/yes/n/no', stdin: 'maybe\n  Y \nno', code: py`from game import ask_yes_no
answers = []
out = capture(lambda: answers.extend([ask_yes_no("Again? "), ask_yes_no("Again? ")]))
assert answers == [True, False]
assert out.count("Please answer y or n.") == 1` },
      { name: 'format_summary matches the required format', code: py`from game import format_summary
assert format_summary({"rounds": 2, "wins": 1, "best": 4}) == "Rounds: 2 | Wins: 1 | Best: 4"
assert format_summary({"rounds": 1, "wins": 0, "best": None}) == "Rounds: 1 | Wins: 0 | Best: -"` },
      { name: 'play() runs rounds until "n" and returns the stats', stdin: '42\ny\n50\n25\n12\n6\n7\nn', code: py`from game import play
${FAKE}
stats = []
out = capture(lambda: stats.append(play(FakeRandom(42, 7))))
assert stats == [{"rounds": 2, "wins": 2, "best": 1}]
assert "Rounds: 2 | Wins: 2 | Best: 1" in out` },
    ],
  },
  steps: [
    {
      title: 'Plan the pieces before you type',
      body: [
        py`Write the game as a sentence first: *"Pick a secret. Repeatedly read a guess; if it's not a valid number, complain; otherwise say higher/lower until it's right or the guesses run out. Then offer another round."*`,
        py`Every verb in that sentence becomes a function. Sort them into two piles:`,
        py`| decides something (pure) → \`rules.py\` | talks to the player → \`game.py\` |
|---|---|
| \`pick_secret\` — choose the number | \`play_round\` — one round of guesses |
| \`parse_guess\` — is this text a valid guess? | \`ask_yes_no\` — play again? |
| \`check_guess\` — higher, lower or correct? | \`play\`, \`format_summary\` — the session |`,
        py`A **pure function** gets everything it needs through its parameters and gives its answer back with \`return\` — no \`input()\`, no \`print()\`, no hidden state. Pure functions are the easiest code in the world to test: call them, check the result.`,
        { code: MAIN, lang: 'python', title: 'main.py (already complete in the starter)' },
        py`\`main.py\` stays tiny on purpose. The \`if __name__ == "__main__":\` guard (see [scripts vs modules](lesson:main-guard-and-scripts)) means "only start the game when this file is run directly", so other code — and the tests — can import the functions without a game starting.`,
      ],
    },
    {
      title: 'Pick the secret — with a random generator you can swap',
      body: [
        py`\`random.randint(1, 100)\` returns a whole number from 1 to 100, **both ends included**. That's all we need… except that a test can't check "the player won in 3 guesses" if the secret changes every run.`,
        py`The fix is called **dependency injection**: instead of the function reaching out for \`random\` itself, it *receives* the generator as a parameter. The default is the real \`random\` module, so normal callers never notice:`,
        { code: py`import random


def pick_secret(low=1, high=100, rng=random):
    return rng.randint(low, high)


print(pick_secret())                          # different every run
print(pick_secret(1, 100, random.Random(7)))  # seeded: the same every run`, lang: 'python', title: 'rules.py — pick_secret' },
        py`Any object with a \`randint(a, b)\` method works as \`rng\`: the \`random\` module, a seeded \`random.Random(7)\`, or a tiny fake class in a test that always answers 42. This is [duck typing](lesson:polymorphism-and-duck-typing): Python only cares that the method exists.`,
        { callout: 'warn', title: 'randint vs randrange', text: py`\`random.randint(1, 100)\` can return 100. \`random.randrange(1, 100)\` **cannot** — like \`range()\`, it stops *before* the end. Mixing them up is a classic off-by-one bug.` },
      ],
    },
    {
      title: 'Decide: higher, lower or correct?',
      body: [
        py`\`check_guess\` compares two ints and names the result. Return words, not printed sentences: the caller decides how to show them (English text, a colour, an emoji, a sound…).`,
        { code: py`def check_guess(guess, secret):
    if guess < secret:
        return "higher"     # the secret is higher: guess higher next time
    if guess > secret:
        return "lower"
    return "correct"


print(check_guess(30, 42), check_guess(80, 42), check_guess(42, 42))`, lang: 'python', title: 'rules.py — check_guess' },
        py`Each \`if\` ends with \`return\`, so no \`elif\`/\`else\` is needed: once a \`return\` runs, the function is over. Be precise about what \`"higher"\` means — here it's the direction the *player* should move, which is what the hint will say.`,
      ],
    },
    {
      title: 'Validate the input — and raise a helpful error',
      body: [
        py`\`input()\` always returns a **string**. \`"42" == 42\` is \`False\`, and \`"50" < 42\` crashes with \`TypeError\`, so we must convert. \`int()\` does that, ignores surrounding spaces, and raises \`ValueError\` for anything that isn't a whole number:`,
        { code: py`>>> int(" 42 ")
42
>>> int("4.5")
ValueError: invalid literal for int() with base 10: '4.5'`, lang: 'pycon' },
        py`That built-in message is accurate but unfriendly. We catch it and **raise our own** \`ValueError\` with words a player understands. \`from None\` hides the original error in tracebacks, because ours already explains everything (see [raising exceptions](lesson:raising-exceptions)).`,
        { code: py`def parse_guess(text, low=1, high=100):
    text = text.strip()
    if not text:
        raise ValueError("Please type a number.")
    try:
        guess = int(text)
    except ValueError:
        raise ValueError(f"'{text}' is not a whole number.") from None
    if not low <= guess <= high:
        raise ValueError(f"{guess} is out of range: pick a number between {low} and {high}.")
    return guess`, lang: 'python', title: 'rules.py — parse_guess' },
        py`\`low <= guess <= high\` is a *chained comparison*: it means \`low <= guess and guess <= high\`. Why raise instead of printing? Because \`parse_guess\` is a referee: it reports the problem and lets the caller decide what to do with it. The game prints the message; a web version could show it in red.`,
        { callout: 'tip', title: 'Test the edges', text: py`The values most likely to be wrong are the boundaries: \`0\`, \`1\`, \`100\`, \`101\`. The tests check all four. Make a habit of trying the edges of every range you write.` },
      ],
    },
    {
      title: 'One round: the guessing loop',
      body: [
        py`A round ends for one of two reasons — a correct guess or no attempts left. A [while loop](lesson:while-loops) handles the limit; \`return\` handles the win:`,
        { code: py`def play_round(secret, low=1, high=100, max_attempts=7):
    attempts = 0
    while attempts < max_attempts:
        text = input(f"Guess #{attempts + 1}: ")
        try:
            guess = parse_guess(text, low, high)
        except ValueError as err:
            print(err)
            continue                      # a typo does not cost an attempt
        attempts += 1
        result = check_guess(guess, secret)
        if result == "correct":
            word = "attempt" if attempts == 1 else "attempts"
            print(f"Correct! You got it in {attempts} {word}.")
            return attempts
        left = max_attempts - attempts
        print(f"{HINTS[result]} ({left} left)")
    print(f"Out of attempts! The number was {secret}.")
    return None`, lang: 'python', title: 'game.py — play_round' },
        py`Read it slowly:`,
        py`1. \`except ValueError as err:\` catches the error \`parse_guess\` raised and binds it to \`err\`; \`print(err)\` shows its message.
2. \`continue\` jumps straight back to the top of the loop **before** \`attempts += 1\`, so typos are free.
3. \`HINTS[result]\` looks up the hint in a dict: \`{"higher": "Too low! Go higher.", "lower": "Too high! Go lower."}\` — a [dictionary](lesson:dictionaries) instead of another \`if\`/\`elif\` chain.
4. If the loop ends without a \`return\`, the player is out of attempts, so we reveal the secret and return \`None\` — Python's "no result".`,
        py`Why 7 attempts? Each smart guess (always the middle of what's left) halves the possibilities: 100 → 50 → 25 → 13 → 7 → 4 → 2 → 1. Seven halvings always find any number from 1 to 100. That strategy is **binary search** — the interview corner below asks you to write it.`,
      ],
    },
    {
      title: 'Ask "play again?" until the answer makes sense',
      body: [
        py`This is the classic **input-validation loop**: \`while True\` repeats forever, and \`return\` is the only way out — so the function can only finish with a valid answer.`,
        { code: py`def ask_yes_no(prompt):
    while True:
        answer = input(prompt).strip().lower()
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("Please answer y or n.")`, lang: 'python', title: 'game.py — ask_yes_no' },
        py`\`.strip().lower()\` normalises the text first, so \`"  Y "\`, \`"YES"\` and \`"yes"\` all count. Checking membership in a small tuple (\`in ("y", "yes")\`) reads better than \`answer == "y" or answer == "yes"\`.`,
      ],
    },
    {
      title: 'The session: rounds, play-again and a scoreboard',
      body: [
        py`\`play()\` repeats rounds and remembers how they went in a dict. \`best\` starts as \`None\` ("no wins yet") and only goes down:`,
        { code: py`def play(rng=random, low=LOW, high=HIGH, max_attempts=MAX_ATTEMPTS):
    print(f"I'm thinking of a number between {low} and {high}.")
    print(f"You have {max_attempts} attempts per round. Good luck!")
    stats = {"rounds": 0, "wins": 0, "best": None}
    while True:
        secret = pick_secret(low, high, rng)
        attempts = play_round(secret, low, high, max_attempts)
        stats["rounds"] += 1
        if attempts is not None:
            stats["wins"] += 1
            if stats["best"] is None or attempts < stats["best"]:
                stats["best"] = attempts
        if not ask_yes_no("Play again? (y/n) "):
            break
    print(format_summary(stats))
    return stats


def format_summary(stats):
    best = "-" if stats["best"] is None else stats["best"]
    return f"Rounds: {stats['rounds']} | Wins: {stats['wins']} | Best: {best}"`, lang: 'python', title: 'game.py — play and format_summary' },
        py`Two details matter. First, **a new secret for every round** — but only one per round: \`pick_secret\` is called *outside* \`play_round\`'s loop. Second, play-again is a **loop**, not \`play()\` calling itself: a function that calls itself for every new round would pile up stack frames and eventually hit \`RecursionError\` (see [recursion](lesson:recursion)).`,
        py`\`attempts is not None\` (not \`!= None\`, and not just \`if attempts:\`) is the correct test for "did we get a result?" — see [None & identity](lesson:none-and-truthiness).`,
      ],
    },
    {
      title: 'Handle the end of input — and test with a fake generator',
      body: [
        py`If the input stream ends (Ctrl+D in a terminal, or a test that supplies only three lines), \`input()\` raises \`EOFError\`. \`main.py\` catches it once, at the very top, and says goodbye. Nothing deeper needs to know about it.`,
        py`Now the payoff of the design. This test plays a whole session **without a human and without luck**:`,
        { code: py`import random   # noqa: F401  (the real game would use it)


class FakeRandom:
    """Stands in for the random module: hands out pre-chosen numbers."""

    def __init__(self, *numbers):
        self.numbers = list(numbers)

    def randint(self, low, high):
        return self.numbers.pop(0)


rng = FakeRandom(42, 7)
print(rng.randint(1, 100), rng.randint(1, 100))   # 42 7 — every time`, lang: 'python', title: 'a fake random generator' },
        py`The playground tests do exactly this: they pass \`FakeRandom(42, 7)\` to \`play()\`, feed the guesses through the **stdin** of the test (each line answers one \`input()\` call) and check the stats dict. Press **Run tests** — when all twelve are green, the game is finished. Then press **Run** and play it for real.`,
        { callout: 'note', title: 'Seeds are the other option', text: py`\`random.Random(7)\` always produces the same sequence, so seeding also makes runs repeatable. A fake is clearer in tests because the secret is written right there (\`42\`) instead of hidden behind a seed. The [mocking](lesson:mocking) lesson shows \`unittest.mock\`, the industrial version of this trick.` },
      ],
    },
  ],
  challenges: [
    'Difficulty levels: ask for easy (1–10, 4 attempts), normal (1–100, 7) or hard (1–1000, 10) before each session and pass the numbers through to play_round.',
    'Repeat-guess protection: keep the guesses of the current round in a set and print "You already tried 50." without using an attempt.',
    'Warmer/colder: when the player is within 5 of the secret, add "(very close!)" to the hint.',
    'Persistent best score: save the best round to best_score.json at the end and load it at the start (see the JSON lesson).',
    'Flip the roles: the player thinks of a number and the computer guesses it with binary search, reading "higher"/"lower"/"correct" from input().',
    'Replace the stats dict with a small dataclass (GameStats) that has a record(attempts) method.',
  ],
  solution: {
    files: { 'main.py': MAIN, 'rules.py': RULES, 'game.py': GAME },
    explanation: [
      py`The finished game is three files with clearly separated jobs:`,
      py`- **\`rules.py\`** — pure functions. \`pick_secret\` asks an injected generator for \`randint(low, high)\`; \`check_guess\` names the comparison; \`parse_guess\` converts and range-checks the text, raising \`ValueError\` with a player-friendly message.
- **\`game.py\`** — everything that talks to the player. \`play_round\` loops while attempts remain, uses \`continue\` so invalid input is free, and returns the attempts used or \`None\`. \`ask_yes_no\` is a \`while True\` validation loop. \`play\` runs the session as a loop (never recursion), keeps the scoreboard in a dict and returns it.
- **\`main.py\`** — the entry point: calls \`play()\` under the \`__main__\` guard and turns \`EOFError\` into a goodbye.`,
      py`Because the decisions are pure and the generator is injectable, every behaviour — including a full two-round session — is covered by fast, deterministic tests that never need a person at the keyboard.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`random\` doesn't produce *truly* random numbers. It runs a formula — a **pseudo-random number generator** — that turns a starting value (the *seed*) into a long sequence of numbers that *look* random. Same seed, same sequence:`,
      { code: py`import random

a = random.Random(2024)
b = random.Random(2024)
print([a.randint(1, 100) for _ in range(3)] == [b.randint(1, 100) for _ in range(3)])  # True`, lang: 'python', title: 'same seed, same numbers' },
      py`When you don't choose a seed, Python seeds the generator from the operating system's randomness source when it starts, so every run is different.`,
    ],
    technical: [
      py`The module-level functions (\`random.randint\`, \`random.choice\`, …) are methods of one hidden, shared \`random.Random\` instance. Creating your own instance (\`random.Random(seed)\`) gives you an independent stream that other code can't disturb — handy for reproducible simulations.`,
      py`CPython's generator is the **Mersenne Twister**: fast and statistically good, but **predictable** — after observing enough outputs, an attacker can compute the rest. That's fine for games and simulations, never for passwords, tokens or anything security-related. Use the \`secrets\` module for those (see [secrets & passwords](lesson:secrets-and-passwords)).`,
      py`\`int()\` accepts more than ASCII digits: surrounding whitespace, a sign (\`"+5"\`), underscores between digits (\`"1_000"\`) and digits from other scripts (\`"٤٢"\` is 42). Our range check still applies afterwards, so all of these are handled safely.`,
    ],
    production: [
      py`The "pure core, thin I/O shell" split you used here scales to large systems: business rules in plain functions or classes, with input/output (terminal, web requests, databases) at the edges. It's the idea behind [clean architecture](lesson:clean-architecture).`,
      py`Real programs validate at the **trust boundary** — the moment data arrives from outside — and convert it into well-typed values once. After \`parse_guess\`, the rest of the code can trust that \`guess\` is an \`int\` in range. See [input validation](lesson:input-validation).`,
      py`Injecting dependencies (random generators, clocks, file systems, HTTP clients) is how professional test suites stay fast and deterministic. A test that depends on luck or on the time of day is a *flaky* test — and flaky tests get ignored.`,
    ],
  },
  mistakes: [
    {
      title: 'Comparing the raw input string with the int secret',
      wrong: { code: py`secret = 42
guess = input("Guess: ")       # "42" — a str!
if guess == secret:            # "42" == 42 is always False
    print("Correct!")`, lang: 'python' },
      right: { code: py`secret = 42
guess = int(input("Guess: "))  # 42 — an int
if guess == secret:
    print("Correct!")`, lang: 'python' },
      explanation: py`\`input()\` always returns a \`str\`, and a string is never equal to an int. The game silently never lets anyone win. Convert with \`int()\` (inside \`try\`) before comparing.`,
    },
    {
      title: 'Picking a new secret on every guess',
      wrong: { code: py`import random

for attempt in range(7):
    secret = random.randint(1, 100)   # moves every time!
    guess = int(input("Guess: "))
    print("higher" if guess < secret else "lower")`, lang: 'python' },
      right: { code: py`import random

secret = random.randint(1, 100)       # chosen once per round
for attempt in range(7):
    guess = int(input("Guess: "))
    print("higher" if guess < secret else "lower")`, lang: 'python' },
      explanation: py`Code inside a loop runs on every pass. The hints become meaningless because the target keeps moving. Choose the secret once, before the guessing loop.`,
    },
    {
      title: 'Using randrange when you meant randint',
      wrong: { code: py`import random

secret = random.randrange(1, 100)   # 1..99 — never 100`, lang: 'python' },
      right: { code: py`import random

secret = random.randint(1, 100)     # 1..100 inclusive`, lang: 'python' },
      explanation: py`\`randrange\` follows \`range()\` rules and excludes the end; \`randint\` includes it. The bug is invisible in casual play — only the edge value is missing — which is exactly why tests check the edges.`,
    },
    {
      title: 'Counting invalid guesses as attempts',
      wrong: { code: py`def play_round(secret, max_attempts=7):
    for attempts in range(1, max_attempts + 1):
        try:
            guess = int(input("Guess: "))
        except ValueError:
            print("Not a number")
            continue          # still used up one of the seven passes
        if guess == secret:
            return attempts
    return None`, lang: 'python' },
      right: { code: py`def play_round(secret, max_attempts=7):
    attempts = 0
    while attempts < max_attempts:
        try:
            guess = int(input("Guess: "))
        except ValueError:
            print("Not a number")
            continue          # attempts unchanged: the typo is free
        attempts += 1
        if guess == secret:
            return attempts
    return None`, lang: 'python' },
      explanation: py`A \`for\` loop over \`range(7)\` always makes exactly seven passes, typos included. When "attempts" and "loop passes" are different things, keep your own counter and increment it only for valid guesses.`,
    },
    {
      title: 'Playing again by calling the function from itself',
      wrong: { code: py`def play():
    play_round(42)
    if input("Again? ") == "y":
        play()            # each round adds a stack frame that never ends`, lang: 'python', static: true },
      right: { code: py`def play():
    while True:
        play_round(42)
        if input("Again? ") != "y":
            break`, lang: 'python', static: true },
      explanation: py`Recursion here works for a few rounds, but every round leaves an unfinished \`play()\` call on the stack; after roughly a thousand rounds Python raises \`RecursionError\`. It also makes the stats awkward to keep. Repetition is a loop's job.`,
    },
    {
      title: 'A bare except that hides real bugs',
      wrong: { code: py`try:
    guess = int(input("Guess: "))
except:
    print("Not a number")`, lang: 'python' },
      right: { code: py`try:
    guess = int(input("Guess: "))
except ValueError:
    print("Not a number")`, lang: 'python' },
      explanation: py`A bare \`except:\` also catches \`EOFError\`, \`KeyboardInterrupt\` (Ctrl+C) and your own typos such as \`NameError\` — so the game can't be stopped and bugs disappear silently. Catch the specific exception you expect.`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: invalid literal for int() with base 10: 'abc'`,
      cause: py`\`int()\` was called on text that isn't a whole number, outside any \`try\`.`,
      fix: py`Do the conversion inside \`try: … except ValueError:\` (here: inside \`parse_guess\`) and show a friendly message instead of crashing.`,
    },
    {
      symptom: py`TypeError: '<' not supported between instances of 'str' and 'int'`,
      cause: py`The guess is still the string from \`input()\` when you compare it with the int secret.`,
      fix: py`Convert first: \`guess = parse_guess(text, low, high)\`, then compare. \`print(type(guess))\` confirms what you actually have.`,
    },
    {
      symptom: py`EOFError: EOF when reading a line`,
      cause: py`\`input()\` was called but there was no more input — Ctrl+D was pressed, or a test/Input tab supplied fewer lines than the program asked for.`,
      fix: py`Supply enough lines, and catch \`EOFError\` once at the top level (\`main.py\`) so the program exits politely.`,
    },
    {
      symptom: py`The game never ends, or every test stops with "the time limit was reached".`,
      cause: py`A loop whose condition never becomes false: \`attempts += 1\` is missing or unreachable (for example placed after \`continue\`, or only in the \`except\` branch).`,
      fix: py`Check that every path through the loop either changes \`attempts\` or leaves the function. Print \`attempts\` at the top of the loop to watch it.`,
    },
    {
      symptom: py`A test passes sometimes and fails other times.`,
      cause: py`The test depends on a real random secret.`,
      fix: py`Inject the generator: pass a \`FakeRandom(42)\` (or a seeded \`random.Random(7)\`) to \`pick_secret\`/\`play\` so the secret is known.`,
    },
  ],
  bestPractices: [
    'Keep decisions in pure functions (no input/print) and do all talking in a thin layer around them.',
    'Validate input where it enters the program; after that, work with the converted, trusted value.',
    'Raise specific exceptions (ValueError) with messages written for the person who will read them.',
    'Use while True + return/break for "ask until valid"; use a real loop, not recursion, for "play again".',
    'Inject randomness (and clocks, files, networks) so tests are deterministic.',
    'Test the boundaries of every range: low, high, low - 1 and high + 1.',
  ],
  useCases: [
    'Any command-line tool that asks the user for numbers: quiz apps, calculators, menu-driven programs.',
    'Input validation loops in kiosks, ATMs and installers ("Enter a PIN between …").',
    'Binary search: finding a value in sorted data, a bad commit with git bisect, the right setting by halving.',
    'Testing code with randomness: games, simulations, A/B test assignment, shuffling.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-number-game-q1',
      type: 'mcq',
      prompt: 'Which call can return **100** as the secret?',
      options: [
        { text: 'random.randrange(1, 100)', why: 'randrange excludes the end, like range(): it returns 1..99.' },
        'random.randint(1, 100)',
        { text: 'int(random.random() * 100)', why: 'random.random() is always below 1.0, so this gives 0..99 — never 100, and it can return 0.' },
        { text: 'random.choice(range(1, 100))', why: 'range(1, 100) stops at 99.' },
      ],
      answer: 1,
      explanation: py`\`randint(a, b)\` is the one random function whose upper bound is **inclusive**. It's equivalent to \`randrange(a, b + 1)\`.`,
    },
    {
      id: 'project-number-game-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def check_guess(guess, secret):
    if guess < secret:
        return "higher"
    if guess > secret:
        return "lower"
    return "correct"

print([check_guess(g, 50) for g in (10, 90, 50)])`,
      options: [
        "['higher', 'lower', 'correct']",
        { text: "['lower', 'higher', 'correct']", why: 'check_guess names the direction the player should move: 10 is below 50, so the answer is "higher".' },
        { text: "['higher', 'lower']", why: 'All three guesses produce a result; the third one is "correct".' },
        { text: 'TypeError', why: 'All values are ints, so < and > work.' },
      ],
      answer: 0,
      explanation: py`10 < 50 → \`"higher"\`; 90 > 50 → \`"lower"\`; 50 equals 50, so neither \`if\` returns and the last line gives \`"correct"\`.`,
    },
    {
      id: 'project-number-game-q3',
      type: 'output',
      prompt: 'The player types `7` (with spaces around it). What does this print?',
      code: py`text = " 7 "
print(int(text) + 1)
print(text == 7)`,
      options: [
        '8\nFalse',
        { text: '8\nTrue', why: 'text is still the string " 7 ". A string never equals an int; only int(text) is 7.' },
        { text: 'ValueError', why: 'int() ignores surrounding whitespace, so int(" 7 ") is 7.' },
        { text: ' 7 1\nFalse', why: 'int(text) is a number, so + 1 is arithmetic, not string concatenation.' },
      ],
      answer: 0,
      explanation: py`\`int(" 7 ")\` strips the spaces and returns \`7\`, so the first line is \`8\`. The original \`text\` is unchanged and is a \`str\`, so \`text == 7\` is \`False\` — the bug behind "I typed the right number and it said wrong".`,
    },
    {
      id: 'project-number-game-q4',
      type: 'bug',
      prompt: 'Requirement: *typos must not use up an attempt.* With this code, typing `abc` costs the player a guess. Click the line that causes it.',
      code: py`def play_round(secret, max_attempts=7):
    attempts = 0
    while attempts < max_attempts:
        text = input("Guess: ")
        attempts += 1
        try:
            guess = parse_guess(text, 1, 100)
        except ValueError as err:
            print(err)
            continue
        if check_guess(guess, secret) == "correct":
            return attempts
    return None`,
      answerLine: 5,
      explanation: py`\`attempts += 1\` runs before the input is validated, so the \`continue\` for a typo comes too late. Move the increment after the \`try\`/\`except\` — only valid guesses should count.`,
    },
    {
      id: 'project-number-game-q5',
      type: 'fill',
      prompt: 'Complete `pick_secret` so it uses the injected generator, and the `except` so it catches only bad numbers.',
      code: py`def pick_secret(low, high, rng):
    return rng.___(low, high)

try:
    guess = int(text)
except ___:
    print("Not a whole number")`,
      answer: [['randint'], ['ValueError']],
      explanation: py`\`rng.randint(low, high)\` works for the \`random\` module, a seeded \`random.Random\` and a test fake alike. \`int()\` signals bad text with \`ValueError\` — catch exactly that.`,
    },
    {
      id: 'project-number-game-q6',
      type: 'mcq',
      prompt: 'Why does `main.py` wrap `play()` in `try: … except EOFError:`?',
      options: [
        { text: 'Because int() raises EOFError for bad text', why: 'int() raises ValueError. EOFError comes from input().' },
        'Because input() raises EOFError when there is no more input (Ctrl+D, or a test with too few lines), and the game should end politely',
        { text: 'To stop the player pressing Ctrl+C', why: 'Ctrl+C raises KeyboardInterrupt, a different exception — and you usually should let it stop the program.' },
        { text: 'It is required by the if __name__ == "__main__" guard', why: 'The guard works without any try/except.' },
      ],
      answer: 1,
      explanation: py`End of input is a normal way for a terminal session to finish. Handling it once at the top level keeps \`game.py\` simple and turns a traceback into a goodbye.`,
    },
    {
      id: 'project-number-game-q7',
      type: 'short',
      prompt: 'Why does `pick_secret` take the random generator as a parameter instead of just calling `random.randint` inside?',
      answer: py`So the caller can choose the source of numbers. The real game passes the random module (the default), while tests pass a fake or seeded generator that returns a known secret. That makes the game testable and deterministic — this is dependency injection.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-number-game-test-randomness',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you write reliable tests for code that uses random numbers?',
      answer: 'Make the randomness controllable: inject the random generator (or a function that returns the random value) as a parameter, then pass a fake or a seeded random.Random in tests. Test the logic that uses the number separately from the code that generates it.',
      explanation: py`A test must give the same verdict every run. If \`play()\` picks its own secret, the test can't know which guesses win. Passing \`rng\` in (dependency injection) lets the test supply \`FakeRandom(42)\`. Seeding (\`random.Random(7)\`) also works but hides the value behind the seed. \`unittest.mock.patch\` can replace \`random.randint\` when you can't change the signature.`,
      code: { lang: 'python', code: py`import random


def pick_secret(low=1, high=100, rng=random):
    return rng.randint(low, high)


class FakeRandom:
    def randint(self, low, high):
        return 42


assert pick_secret(rng=FakeRandom()) == 42` },
      whyAsked: 'Testability of non-deterministic code (time, randomness, network) is a daily concern; it reveals whether you design for tests.',
      mistakes: ['Saying "run the test many times and hope"', 'Seeding the global random module inside library code', 'Asserting only that the result is "in range" and calling it tested'],
      followUps: ['How would you do the same for datetime.now()?', 'When would you use unittest.mock.patch instead?', 'Why is the random module unsuitable for passwords?'],
      modelAnswer: 'I separate generating the random value from using it. The function that needs randomness receives the generator as a parameter, with the real random module as the default, so production code is unchanged. In tests I pass a tiny fake whose randint returns a fixed number, or a seeded random.Random, so every run is identical and I can assert exact outcomes. If I can\'t change the signature, unittest.mock.patch can swap random.randint for the duration of a test. The same technique works for clocks, files and HTTP clients.',
    },
    {
      id: 'project-number-game-binary-search',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write `auto_play(secret, low, high)` that plays the guessing game perfectly with binary search and returns the list of guesses it made. Use the provided `check_guess`. Always guess the middle: `(low + high) // 2`. Raise `ValueError` if the secret is outside the range.',
      answer: 'Keep a low/high window. Guess the middle; if the answer is "higher" move low to guess + 1, if "lower" move high to guess - 1; stop on "correct". Each guess halves the window, so 1..100 never needs more than 7 guesses.',
      explanation: py`Binary search works because every answer rules out half of the remaining candidates. After *k* guesses at most about n / 2^k candidates remain, so the number of guesses grows with log₂(n): 7 for 100 numbers, 10 for 1,000, 20 for a million. The \`ValueError\` guard matters: without it, a secret outside the range would make the window cross over and the loop would never find it.`,
      starter: { files: { 'main.py': py`def check_guess(guess, secret):
    if guess < secret:
        return "higher"
    if guess > secret:
        return "lower"
    return "correct"


def auto_play(secret, low, high):
    """Return the guesses a binary-search player makes until it finds secret."""
    guesses = []
    # TODO
    return guesses


print(auto_play(42, 1, 100))
` } },
      tests: [
        { name: 'finds 42 in 1..100 with the expected guesses', code: py`assert auto_play(42, 1, 100) == [50, 25, 37, 43, 40, 41, 42]` },
        { name: 'never needs more than 7 guesses for 1..100', code: py`assert all(auto_play(s, 1, 100)[-1] == s for s in range(1, 101))
assert max(len(auto_play(s, 1, 100)) for s in range(1, 101)) == 7` },
        { name: 'a one-number range takes one guess', code: py`assert auto_play(5, 5, 5) == [5]` },
        { name: 'a secret outside the range raises ValueError', code: py`with raises(ValueError):
    auto_play(101, 1, 100)` },
      ],
      solution: { files: { 'main.py': py`def check_guess(guess, secret):
    if guess < secret:
        return "higher"
    if guess > secret:
        return "lower"
    return "correct"


def auto_play(secret, low, high):
    """Return the guesses a binary-search player makes until it finds secret."""
    if not low <= secret <= high:
        raise ValueError(f"secret {secret} is not between {low} and {high}")
    guesses = []
    while True:
        guess = (low + high) // 2
        guesses.append(guess)
        result = check_guess(guess, secret)
        if result == "correct":
            return guesses
        if result == "higher":
            low = guess + 1
        else:
            high = guess - 1


print(auto_play(42, 1, 100))
` } },
      hints: ['Keep two variables, low and high, for the range that could still contain the secret.', 'After "higher", the secret is above the guess: low = guess + 1. After "lower": high = guess - 1.', 'Check the range once at the start and raise ValueError, then loop with while True until check_guess says "correct".'],
      whyAsked: 'Binary search is the most common "halve the problem" algorithm; this framing checks loop invariants and off-by-one discipline.',
      mistakes: ['Setting low = guess instead of guess + 1 (can loop forever)', 'Using / instead of // and getting float guesses', 'No guard for a secret outside the range'],
      followUps: ['What is the time complexity?', 'How would you use the bisect module on a sorted list?', 'How many guesses would 1..1,000,000 need?'],
      modelAnswer: 'I keep a window, low to high, that must contain the secret. Each turn I guess the middle with integer division, ask check_guess, and shrink the window: after "higher" low becomes guess plus one, after "lower" high becomes guess minus one. Because each answer discards half the window, the number of guesses is logarithmic — at most seven for 1 to 100. I validate the input first, otherwise a secret outside the window would make low pass high and the loop would never end.',
    },
    {
      id: 'project-number-game-validation-design',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 4,
      question: 'Players complain that typing "fifty" crashes the game, and that a typo costs them a turn. How do you fix both, and where does each piece of code go?',
      answer: 'Put conversion and range checking in a pure parse function that raises ValueError with a friendly message. In the round loop, catch ValueError, print the message and continue before incrementing the attempt counter.',
      explanation: py`Validation (is this a valid guess?) is a *rule*, so it belongs in a pure function that can be unit-tested with strings. Recovering (print and ask again) is *interaction*, so it belongs in the loop. Counting only after successful parsing keeps typos free.`,
      code: { lang: 'python', code: py`def parse_guess(text, low, high):
    try:
        guess = int(text.strip())
    except ValueError:
        raise ValueError(f"'{text.strip()}' is not a whole number.") from None
    if not low <= guess <= high:
        raise ValueError(f"Pick a number between {low} and {high}.")
    return guess` },
      whyAsked: 'Input handling and putting code in the right layer are everyday tasks; the answer shows whether you think in terms of responsibilities.',
      mistakes: ['Using a bare except', 'Checking str.isdigit() (rejects "-5" and " 42 ", accepts "²")', 'Printing inside the validation function so it cannot be reused'],
      followUps: ['Why raise instead of returning None?', 'How would you test parse_guess?', 'What other inputs would you try (empty, spaces, 1_000)?'],
      modelAnswer: 'I would write a parse_guess function that strips the text, converts it with int inside a try, checks the range and raises ValueError with a message meant for the player. It never prints, so it is easy to test with plain strings. In the round loop I call it inside try/except ValueError, print the message and continue — and I only increment the attempt counter after parsing succeeds, so typos are free. That keeps the rule testable and the interaction simple.',
    },
    {
      id: 'project-number-game-string-compare',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A beginner forgot to convert the input. What does `print("9" < "10")` print, and why does it matter for this game?',
      options: ['True', 'False', 'TypeError'],
      correctOption: 1,
      answer: 'False. Strings compare character by character, and "9" sorts after "1", so "9" is "greater" than "10". Comparing unconverted guesses gives nonsense hints.',
      explanation: py`String comparison is *lexicographic* (dictionary order by character code). \`"9" < "10"\` compares \`"9"\` with \`"1"\` first and decides immediately. Comparing a \`str\` with an \`int\` (\`"9" < 10\`) raises \`TypeError\` in Python 3. Either way, convert with \`int()\` first.`,
      whyAsked: 'Checks understanding of types and comparison semantics — a frequent source of silent bugs with user input and CSV data.',
      mistakes: ['Assuming Python converts strings to numbers automatically', 'Thinking "9" < "10" is a TypeError'],
      followUps: ['What does sorted(["9", "10", "100"]) return?', 'How do you sort numeric strings numerically? (key=int)'],
      modelAnswer: 'It prints False. Strings are compared character by character, so "9" versus "10" is decided by "9" versus "1", and 9 comes after 1. In the game that means hints would be wrong for any multi-digit guess, or a str-versus-int comparison would raise TypeError. The fix is to convert input to int once, at the boundary, and work with ints afterwards.',
    },
    {
      id: 'project-number-game-architecture',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'Your manager wants a web version of the guessing game next month. How does the rules.py / game.py split help, and what would you change?',
      answer: 'rules.py has no input() or print(), so the web version reuses it unchanged. Only the interaction layer is replaced: instead of a blocking loop with input(), a web handler receives one guess per request, calls parse_guess/check_guess, and stores the round state (secret, attempts) between requests.',
      explanation: py`This is the "functional core, imperative shell" pattern. The core (pure rules) is independent of the user interface; the shell adapts it to a terminal, a web request or a GUI event. In a web app there is no loop waiting on \`input()\` — each request is one step, so the state that lived in local variables (secret, attempts) must be stored, e.g. in a session or database. The tests for \`rules.py\` keep passing because nothing in it changed.`,
      whyAsked: 'Tests whether you can see separation of concerns and state management beyond a single script.',
      mistakes: ['Planning to rewrite everything', 'Keeping input()/print() inside the rules', 'Storing per-player state in a global variable on a multi-user server'],
      followUps: ['Where would you store the secret so the player cannot see it?', 'How would you turn play_round into a class with a guess() method?', 'What would the HTTP API look like?'],
      modelAnswer: 'Because the rules are pure functions, the web version can import rules.py unchanged, and all of its tests still apply. What changes is the shell: a web server cannot block on input(), so each request carries one guess, the handler calls parse_guess and check_guess, and the round state — secret and attempts — has to be stored between requests, for example in a server-side session. I would probably refactor play_round into a small Round class with a guess method that returns the outcome, which both the terminal and web versions could use.',
    },
  ],

  takeaways: [
    'Every interactive program is read → validate → decide → respond → repeat; the guessing game has all five.',
    'input() returns a str: convert with int() inside try/except ValueError, then range-check.',
    'Raise exceptions with human-friendly messages from validation code; catch them where you can recover.',
    'Use continue so invalid input does not count, a while loop for the attempt limit, and return to exit early on a win.',
    'Repeat sessions with a loop, never by calling the function from itself.',
    'Pure functions plus an injected random generator make every behaviour testable without typing or luck.',
  ],
}

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TICKET_BOOTH = py`# Ticket booth: keep asking until the answer makes sense
PRICES = {"adult": 12.50, "child": 7.00, "senior": 9.00}


def read_ticket_count(prompt):
    """Ask again and again until the user types a whole number from 1 to 8."""
    while True:
        answer = input(prompt)
        try:
            count = int(answer)
        except ValueError:
            print(f"  {answer!r} is not a whole number. Try again.")
        else:
            if 1 <= count <= 8:
                return count
            print("  You can book 1 to 8 tickets.")


def ticket_price(kind):
    try:
        price = PRICES[kind]
    except KeyError as err:
        print(f"  Unknown ticket type: {err}")
        return None
    else:
        return price
    finally:
        print(f"  (price lookup for {kind!r} finished)")


count = read_ticket_count("How many tickets? ")
kind = input("Ticket type (adult/child/senior)? ").strip().lower()
price = ticket_price(kind)
if price is None:
    print("  Charging the adult price instead.")
    kind, price = "adult", PRICES["adult"]
print(f"Total for {count} {kind} ticket(s): {count * price:.2f}")
`

export default {
  id: 'try-except',
  title: 'try, except, else & finally',
  summary: 'Catch the errors you expect, let the ones you don\'t expect crash loudly, and always clean up — with try, except, else and finally.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['reading-errors', 'while-loops', 'defining-functions'],
  related: ['raising-exceptions', 'custom-exceptions', 'error-handling-patterns', 'exception-groups', 'context-managers', 'input-validation', 'reading-writing-files', 'logging'],
  tags: ['exceptions', 'try', 'except', 'else', 'finally', 'error handling', 'ValueError', 'KeyError', 'BaseException', 'Exception', 'bare except', 'KeyboardInterrupt', 'input validation', 'exception hierarchy'],
  apis: [
    { name: 'try / except', summary: 'Run a block; if it raises an exception whose type matches an except clause, run that handler instead of crashing.' },
    { name: 'except (A, B) as e', summary: 'Catch several exception types with one handler and bind the exception object to the name e (deleted when the handler ends).' },
    { name: 'else (on try)', summary: 'Runs only if the try block finished without raising — the place for code that should not be protected by the handler.' },
    { name: 'finally', summary: 'Runs on every way out of the try statement: success, handled error, unhandled error, return, break or continue.' },
    { name: 'BaseException', summary: 'Root of all exceptions, including SystemExit, KeyboardInterrupt and GeneratorExit, which are not errors in your program.' },
    { name: 'Exception', summary: 'Base class of all ordinary errors; the broadest thing application code should normally catch.' },
    { name: 'exc.args', summary: 'The tuple of arguments the exception was created with, e.g. (\'invalid literal …\',).' },
    { name: 'sys.exception()', summary: '(3.11+) Returns the exception currently being handled, or None.' },
  ],
  docs: [
    { label: 'Python tutorial — Errors and exceptions', url: 'https://docs.python.org/3/tutorial/errors.html' },
    { label: 'Language reference — the try statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-try-statement' },
    { label: 'Built-in exceptions — the exception hierarchy', url: 'https://docs.python.org/3/library/exceptions.html#exception-hierarchy' },
    { label: 'PEP 765 — disallow return/break/continue that exit a finally block (3.14 warning)', url: 'https://peps.python.org/pep-0765/' },
    { label: 'PEP 758 — except without brackets (3.14)', url: 'https://peps.python.org/pep-0758/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`When something goes wrong while a program runs — a file is missing, a user types "twelve" where you wanted \`12\`, you divide by zero — Python **raises an exception**. An *exception* is an object that describes the problem: its **type** (\`ValueError\`, \`KeyError\`, \`ZeroDivisionError\`…) says what kind of problem it is, and its **message** says the details.`,
    py`If nothing deals with the exception, Python stops the program and prints a **traceback** — the report you learned to read in [reading error messages](lesson:reading-errors). The \`try\` statement lets you deal with it instead:`,
    { code: py`try:
    count = int(answer)          # might raise ValueError
except ValueError:
    print("Please type a whole number.")`, lang: 'python', static: true, title: 'the core idea' },
    py`"Try this; if *that specific thing* goes wrong, do this instead." Two optional extra clauses complete the picture: \`else\` (runs only when the \`try\` block succeeded) and \`finally\` (runs **no matter what**, for clean-up). By the end of this lesson you'll know exactly when each one runs, which exceptions to catch, and why catching *everything* is one of the most damaging habits in Python.`,
  ],
  why: [
    py`Real programs live in a messy world. Users mistype, files get deleted, networks drop, sensors send garbage. A program that crashes on the first bad input is useless; a program that **silently ignores** problems is dangerous. \`try\`/\`except\` is how you sit between those extremes: recover from the failures you expected, and let everything else stop the program loudly so it gets fixed.`,
    py`It also keeps the "happy path" readable. Instead of checking every possible problem before every line, you write the normal steps plainly and put the recovery logic in one clearly marked place. (The trade-offs between *checking first* and *trying and catching* get their own lesson: [EAFP vs LBYL](lesson:error-handling-patterns).)`,
    py`And \`finally\` guarantees clean-up — closing a file, releasing a lock, printing "done" — even when an error escapes. That guarantee is what the \`with\` statement is built on ([context managers](lesson:context-managers)).`,
  ],
  eli15: [
    py`Imagine you're baking from a recipe. Step 3 says "crack two eggs". Normally that works. But sometimes the egg box is empty.`,
    py`A program **without** \`try\` is a baker who, on finding no eggs, screams and walks out of the kitchen forever. A program with \`try\`/\`except\` is a baker who has a note: *"If there are no eggs, use a banana instead."* The baker tries step 3; if the specific problem "no eggs" happens, they follow the note and carry on.`,
    py`\`else\` is "if the eggs were fine, *then* whisk them" — you only whisk when cracking worked. \`finally\` is "whatever happened, switch the oven off at the end". And catching *every* problem with one note ("if anything at all goes wrong, keep going") is a terrible idea: if the kitchen catches fire, you do **not** want the baker to shrug and keep baking.`,
  ],
  analogy: {
    title: 'A trapeze act with a safety net',
    body: [
      py`A trapeze artist performs high above the ring (**try**). Below is a net designed to catch one specific kind of trouble: a fall (**except**). If the act goes perfectly, there's a bow and applause — which only happens if nobody fell (**else**). And whatever happens, the crew resets the rigging afterwards (**finally**).`,
      py`The net catches *falls*. It is not designed to catch a fire in the tent, or the ringmaster ending the show — those must be handled by someone else, higher up. That's why you catch **specific** exceptions: a net that "catches everything" would also trap the people trying to evacuate the tent (that's what a bare \`except:\` does to Ctrl+C).`,
    ],
    mapping: [
      ['the trapeze act', 'the try block: the code that might fail'],
      ['the net under the trapeze', 'an except clause for one type of exception'],
      ['different nets for different tricks', 'several except clauses, checked top to bottom'],
      ['the bow after a clean performance', 'else: runs only if the try block raised nothing'],
      ['resetting the rigging, every time', 'finally: runs however the try statement ends'],
      ['a fall nobody prepared for', 'an unhandled exception: it keeps falling to the caller, then crashes the program'],
      ['the ringmaster stopping the show', 'KeyboardInterrupt / SystemExit: not errors, must not be caught by accident'],
    ],
  },
  visual: {
    type: 'exception-flow',
    title: 'An exception climbs the call stack until something catches it',
    props: { preset: 'caught' },
    alt: 'Animated call stack with main() calling load(), which calls parse(). parse() raises an exception. The exception leaves parse(), passes through load() because it has no matching handler, and is caught by an except clause in main(); the program then continues after that try statement instead of crashing.',
    caption: py`Step through it. When an exception is raised, the **rest of the current block is skipped**. Python checks the nearest enclosing \`try\` for an \`except\` whose type matches; if there isn't one, the function is abandoned and the search continues in its *caller*. The first matching handler wins — and execution continues **after** that whole \`try\` statement, not back where the error happened.`,
  },
  syntax: [
    py`#### The full shape`,
    { code: py`try:
    risky_step()                  # code that might raise
except ValueError:
    handle_bad_value()            # runs if a ValueError (or subclass) was raised
except (KeyError, IndexError) as err:
    handle_lookup(err)            # one handler for several types; err is the exception object
else:
    use_the_result()              # runs only if the try block raised nothing
finally:
    clean_up()                    # runs no matter how we leave`, lang: 'python', static: true, title: 'try / except / else / finally' },
    py`Rules the compiler enforces:`,
    py`- A \`try\` needs **at least one** \`except\` or a \`finally\` (\`SyntaxError: expected 'except' or 'finally' block\`).
- \`else\` is only allowed when there is at least one \`except\`.
- Order is fixed: \`try\` → \`except\`… → \`else\` → \`finally\`.
- A bare \`except:\` (no type) must be the last handler (\`SyntaxError: default 'except:' must be last\`). You'll see below why you should almost never write one.`,
    py`#### When each clause runs`,
    py`| clause | runs when… | typical job |
|---|---|---|
| \`try\` | always (until something raises) | the work that might fail — keep it **small** |
| \`except T\` | an exception of type \`T\` (or a subclass of \`T\`) escaped the \`try\` block | recover: retry, use a default, show a friendly message |
| \`else\` | the \`try\` block finished **without** raising | the next steps that depend on the try succeeding |
| \`finally\` | **every** time: success, handled error, unhandled error, \`return\`, \`break\`, \`continue\` | release resources, restore state, log "done" |`,
    py`#### Catching specific exceptions`,
    py`Each \`except\` names a class. An exception matches if it is an instance of that class **or any subclass** — exactly like \`isinstance()\`. Handlers are tested **top to bottom** and only the **first** match runs, so put specific types before general ones.`,
    { code: py`def parse_quantity(text):
    try:
        return int(text)
    except ValueError:                 # "abc", "4.5", ""
        return 0
    except TypeError:                  # None, a list, ...
        return 0


def per_person(total, people):
    try:
        return total / people
    except (ZeroDivisionError, TypeError):   # a tuple catches any of these
        return None


print(parse_quantity("3"), parse_quantity("lots"), parse_quantity(None))
print(per_person(30, 4), per_person(30, 0), per_person(30, "four"))`, lang: 'python', title: 'specific types, and a tuple of types' },
    { callout: 'version', title: 'Python 3.14: brackets optional (PEP 758)', text: py`From Python 3.14 you may write \`except ZeroDivisionError, TypeError:\` without the brackets — but **only when there is no \`as\`**. \`except ValueError, TypeError as err:\` is still a \`SyntaxError\` (\`multiple exception types must be parenthesized when using 'as'\`). Code that must run on 3.13 or older needs the brackets, so most code will keep using them for years. More in [exception groups](lesson:exception-groups).` },
    py`#### \`as\`: getting hold of the exception object`,
    py`\`except ValueError as err:\` binds the exception object to \`err\`. Useful things on it:`,
    { code: py`try:
    int("twelve")
except ValueError as err:
    print(type(err).__name__)   # ValueError
    print(err)                  # invalid literal for int() with base 10: 'twelve'
    print(err.args)             # ("invalid literal for int() with base 10: 'twelve'",)

try:
    open("missing-scores.txt")
except FileNotFoundError as err:
    print(err.filename)         # missing-scores.txt  (OSError subclasses add fields)`, lang: 'python', title: 'inspecting the exception' },
    { callout: 'warn', title: 'The name vanishes when the handler ends', text: py`Python deletes \`err\` at the end of the \`except\` block (as if you wrote \`del err\`). Using it afterwards raises \`NameError: name 'err' is not defined\`. If you need the exception later, assign it to another name inside the handler: \`last_error = err\`.` },
    py`#### The exception hierarchy (the part that matters)`,
    { code: py`BaseException
 ├── SystemExit            # sys.exit() — "please stop the program"
 ├── KeyboardInterrupt     # the user pressed Ctrl+C
 ├── GeneratorExit         # a generator is being closed
 └── Exception             # ← every ordinary error lives under here
      ├── ArithmeticError
      │    └── ZeroDivisionError
      ├── LookupError
      │    ├── IndexError          # list index out of range
      │    └── KeyError            # missing dict key
      ├── ValueError               # right type, wrong value: int("abc")
      │    └── UnicodeError ...
      ├── TypeError                # wrong type: "a" + 1
      ├── NameError, AttributeError, ...
      └── OSError                  # anything the operating system reports
           ├── FileNotFoundError
           ├── PermissionError
           └── TimeoutError ...`, lang: 'text', title: 'a slice of the built-in hierarchy' },
    py`Because matching follows subclasses, \`except LookupError\` catches both \`IndexError\` and \`KeyError\`, and \`except OSError\` catches every file-system problem. \`except Exception\` catches every *error* — but **not** \`SystemExit\`, \`KeyboardInterrupt\` or \`GeneratorExit\`, which deliberately sit outside \`Exception\` because they are signals, not bugs.`,
    py`#### Why bare \`except:\` is dangerous`,
    py`A bare \`except:\` (or \`except BaseException:\`) catches **everything** — including Ctrl+C and \`sys.exit()\`. A loop like this can't be stopped from the keyboard, and it hides every bug, typo and crash behind one vague message:`,
    { code: py`while True:
    try:
        process_next_order()
    except:                      # catches KeyboardInterrupt too!
        print("something went wrong, retrying")`, lang: 'python', static: true, title: 'the anti-pattern' },
    py`Catch the narrowest type you can actually handle. If you truly need a catch-all (for example at the very top of a web server, to log the problem and keep serving other users), use \`except Exception as err:\`, **log the traceback**, and never \`pass\` silently — see [error-handling patterns](lesson:error-handling-patterns) and [logging](lesson:logging).`,
  ],
  walkthrough: {
    title: 'Reading the ticket booth line by line',
    lang: 'python',
    code: TICKET_BOOTH,
    intro: py`This is the playground program below. Press **Guide** there to follow these steps inside the editor. The Input tab is pre-filled with \`two\`, \`0\`, \`3\`, \`student\` — one answer per \`input()\` call.`,
    steps: [
      { lines: [7, 8], text: py`\`while True\` repeats forever; the only way out is the \`return\` on line 15. This "ask until valid" loop is the standard shape for validating user input.` },
      { lines: [9, 12], text: py`The \`try\` block holds **just** the risky call, \`int(answer)\`. For \`"two"\` it raises \`ValueError\`, the rest of the \`try\` block is skipped, and the matching handler prints a friendly message. Then the loop goes round again.` },
      { lines: [13, 16], text: py`\`else\` runs only when \`int()\` **succeeded**. The range check lives here, not inside \`try\`, so a bug in it could never be mistaken for "the user typed letters". \`0\` converts fine but fails the range check; \`3\` is returned.` },
      { lines: [20, 24], text: py`Looking up a missing dict key raises \`KeyError\`. \`as err\` binds the exception object; printing it shows the missing key **with quotes** (\`'student'\`) — that's how \`KeyError\` formats its message.` },
      { lines: [25, 28], text: py`\`else\` returns the price when the lookup worked. \`finally\` runs **on every path out**: after the \`return None\` in the handler *and* after the \`return price\` in \`else\`. The return value is remembered while \`finally\` runs, then handed back.` },
      { lines: [31, 37], text: py`The main program glues it together. Because \`ticket_price\` returns \`None\` for unknown types, the caller decides what "recovery" means: here, fall back to the adult price.` },
    ],
  },
  playground: {
    title: 'Ticket booth',
    objective: 'Run it, match each output line to the clause that printed it, then change the Input tab and see which paths run.',
    files: { 'main.py': TICKET_BOOTH },
    stdin: 'two\n0\n3\nstudent',
    expected: py`With the pre-filled input (\`two\`, \`0\`, \`3\`, \`student\`) the Output panel shows each answer after its prompt:

\`\`\`text
How many tickets? two
  'two' is not a whole number. Try again.
How many tickets? 0
  You can book 1 to 8 tickets.
How many tickets? 3
Ticket type (adult/child/senior)? student
  Unknown ticket type: 'student'
  (price lookup for 'student' finished)
  Charging the adult price instead.
Total for 3 adult ticket(s): 37.50
\`\`\`

Change \`student\` to \`child\` in the Input tab and run again: the \`else\` path runs and \`finally\` still prints its line.`,
    experiments: [
      {
        id: 'show-the-message',
        task: py`In \`read_ticket_count\`, change \`except ValueError:\` to \`except ValueError as err:\` and add a line inside the handler that prints Python's own message: \`print("  Python says:", err)\`.`,
        hint: py`Keep the friendly message too. \`err\` is the exception object; printing it shows its message.`,
        tests: [
          { name: 'prints the ValueError message for "two"', stdin: 'two\n3\nadult', code: py`assert "invalid literal for int() with base 10: 'two'" in output, 'Print err inside the except ValueError handler'` },
          { name: 'still books the tickets afterwards', stdin: 'two\n3\nadult', code: py`assert "Total for 3 adult ticket(s): 37.50" in output` },
        ],
        explain: py`\`as err\` binds the exception instance. \`str(err)\` is its message — the same text you'd see on the last line of a traceback. Real programs usually show users a friendly message and send \`err\` (with the traceback) to a log for developers.`,
      },
      {
        id: 'else-runs-on-success',
        task: py`In \`ticket_price\`, add \`print(f"  Found {kind}: {price:.2f}")\` inside the \`else:\` block, just before \`return price\`. Predict: will it appear before or after the \`finally\` line? Will it appear for \`"student"\`?`,
        hint: py`The new line goes between \`else:\` and \`return price\`, indented to match \`return price\`.`,
        tests: [
          { name: 'prints "Found child: 7.00" for a known type', stdin: '3\nadult', code: py`assert "Found child: 7.00" in capture(ticket_price, "child")` },
          { name: 'else runs before finally', stdin: '3\nadult', code: py`out = capture(ticket_price, "child")
assert out.index("Found") < out.index("finished"), 'else runs first, finally runs last'` },
          { name: 'else does not run when the lookup fails', stdin: '3\nadult', code: py`assert "Found" not in capture(ticket_price, "dragon")` },
        ],
        explain: py`\`else\` runs only when the \`try\` block raised nothing, and always **before** \`finally\`. For an unknown type the \`except\` branch runs instead, so the "Found" line never appears — but \`finally\` still does.`,
      },
      {
        id: 'tuple-of-exceptions',
        task: py`Add a function \`per_person(total, people)\` that returns \`round(total / people, 2)\`, but returns \`None\` when \`people\` is \`0\` **or** not a number (like \`"four"\`). Use **one** \`except\` clause with a tuple of two exception types.`,
        hint: py`Dividing by \`0\` raises \`ZeroDivisionError\`; dividing by a string raises \`TypeError\`. Write \`except (ZeroDivisionError, TypeError):\`.`,
        tests: [
          { name: 'per_person(30, 4) == 7.5', stdin: '3\nadult', code: py`assert callable(ns.get('per_person')), 'Define a function named per_person'
assert per_person(30, 4) == 7.5` },
          { name: 'per_person(10, 3) is rounded to 3.33', stdin: '3\nadult', code: py`assert per_person(10, 3) == 3.33` },
          { name: 'zero people gives None', stdin: '3\nadult', code: py`assert per_person(30, 0) is None` },
          { name: 'a non-number gives None', stdin: '3\nadult', code: py`assert per_person(30, "four") is None` },
        ],
        explain: py`A tuple in an \`except\` clause means "any of these types". Use it when the recovery is genuinely the same for each. If the recoveries differ (say, a friendly message for zero but a bug report for a wrong type), write separate clauses.`,
      },
      {
        id: 'end-of-input',
        task: py`When \`input()\` has nothing left to read (the user pressed Ctrl+D / Ctrl+Z, or a script's input ran out) it raises \`EOFError\`. Make \`read_ticket_count\` **return \`1\`** in that case instead of crashing. Try it: empty the Input tab and run.`,
        hint: py`Wrap just the \`input(prompt)\` line: \`try: answer = input(prompt)\` / \`except EOFError: return 1\`. Keep the existing \`try\` for \`int()\` as it is.`,
        tests: [
          { name: 'returns 1 when input() raises EOFError', stdin: '3\nadult', code: py`import builtins

def no_more_input(prompt=""):
    raise EOFError("EOF when reading a line")

builtins.input = no_more_input
assert read_ticket_count("How many tickets? ") == 1` },
          { name: 'normal answers still work', stdin: '3\nadult', code: py`assert "Total for 3 adult ticket(s): 37.50" in output` },
        ],
        explain: py`Each \`try\` should protect one risky operation with its own recovery. Reading input and converting it fail in different ways (\`EOFError\` vs \`ValueError\`) and need different responses, so they get separate, small \`try\` blocks.`,
      },
    ],
  },
  animation: {
    type: 'exception-flow',
    title: 'finally runs while the exception unwinds',
    props: { preset: 'finally' },
    alt: 'Animated call stack main() → load() → parse(). parse() raises an exception. On its way up, the exception passes through a function that has a finally block; the finally block runs (for example closing a file) before the exception continues upward to the handler or crashes the program.',
    caption: py`\`finally\` is not a handler — it doesn't stop the exception. It runs as the exception passes through, then the exception **keeps climbing**. That's exactly what you want for clean-up: the file gets closed whether or not anyone above manages to recover.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When a line raises an exception, Python does **not** carry on to the next line. It looks for the closest \`try\` that encloses the failing line:`,
      py`1. If that \`try\` has an \`except\` whose type matches, the handler runs, and the program continues **after the whole \`try\` statement**.
2. If not (or there is no \`try\` at all), the current function is abandoned — any \`finally\` blocks run on the way out — and the search repeats in the function that called it.
3. If the search reaches the top of the program with no match, Python prints the traceback and stops.`,
      py`This climb is called **unwinding the call stack** (the *call stack* is the list of functions currently running, each waiting for the one it called). You can watch it in the "Picture it" visual above, and step through a real one in [raising exceptions](lesson:raising-exceptions).`,
      { code: py`def load(text):
    print("load: start")
    value = int(text)          # raises for "oops"
    print("load: end")         # skipped when int() fails
    return value


def main():
    try:
        load("oops")
        print("main: after load")   # skipped too
    except ValueError:
        print("main: caught it")
    print("main: carries on")


main()`, lang: 'python', title: 'what gets skipped' },
    ],
    technical: [
      py`**Matching is \`isinstance\`.** For each \`except\` clause, top to bottom, Python checks whether the exception is an instance of the listed class (or of any class in the tuple). The first match wins; later clauses are never even looked at. That's why \`except Exception:\` placed before \`except ValueError:\` makes the second clause dead code — Python doesn't warn you.`,
      py`**The exception object.** Every exception is an instance of a class deriving from \`BaseException\`. It carries \`args\` (the constructor arguments), a \`__traceback__\` (the chain of frames it passed through), and — when it was raised while handling another exception — a \`__context__\` pointing at that earlier exception. That's what produces "During handling of the above exception, another exception occurred". [Raising exceptions](lesson:raising-exceptions) covers chaining in depth.`,
      py`**The handler variable is deleted.** At the end of \`except E as err:\`, Python runs the equivalent of \`del err\`. The reason: the exception references its traceback, the traceback references the frame, and the frame references \`err\` — a reference cycle that would keep every local variable in that frame alive until the cyclic garbage collector ran. Deleting the name breaks the cycle.`,
      py`**Inside a handler**, \`sys.exception()\` (3.11+) returns the exception being handled (older code uses \`sys.exc_info()\`, which returns a \`(type, value, traceback)\` tuple). Outside any handler it returns \`None\`.`,
      py`**\`finally\` and control flow.** If the \`try\` block executes \`return\`, the return value is saved, \`finally\` runs, then the function returns. If \`finally\` itself executes \`return\`, \`break\` or \`continue\`, it **replaces** whatever was happening — including a propagating exception, which is silently lost. Python 3.14 emits \`SyntaxWarning: 'return' in a 'finally' block\` for this (PEP 765).`,
      { callout: 'note', title: 'CPython detail: "zero-cost" try', text: py`Since CPython 3.11, entering a \`try\` block costs essentially nothing: the compiler records protected bytecode ranges in an *exception table*, which is consulted only when something is actually raised. Raising and catching is the comparatively expensive part (building the exception object and traceback). This is an implementation detail — other Pythons may differ — and it's not a reason to use exceptions for ordinary, frequent branching.` },
    ],
    production: [
      py`**Keep \`try\` blocks tiny.** Wrap only the call that can raise the exception you're handling. Everything that should run after success goes in \`else\` (or after the statement). A big \`try\` turns unrelated bugs into misleading "recoveries".`,
      py`**Catch what you can handle, where you can handle it.** A low-level function that can't do anything useful about a missing file should let \`FileNotFoundError\` propagate; the code that knows the user (a CLI, a web handler) catches it and responds. See [catching at the right layer](lesson:error-handling-patterns).`,
      py`**Catch-alls belong at the top, and they log.** A worker loop or request handler may use \`except Exception:\` so one bad job doesn't kill the service — but it must record the full traceback (\`logger.exception(...)\`, see [logging](lesson:logging)) and usually report the failure, never \`pass\`.`,
      py`**Let \`KeyboardInterrupt\` and \`SystemExit\` through.** If you must react to them (say, to save work before quitting), catch them explicitly, do the clean-up, and re-raise with a bare \`raise\`. Better still, put the clean-up in \`finally\` or a \`with\` block, which run anyway.`,
      py`**Validate untrusted input at the boundary.** Converting with \`int()\`/\`float()\` inside \`try\`, then checking ranges in \`else\`, is the standard pattern for forms, CLI arguments and file contents — see [input validation](lesson:input-validation).`,
    ],
  },
  mistakes: [
    {
      title: 'Catching everything with a bare except',
      wrong: { code: py`def load_age(text):
    try:
        return int(text)
    except:                  # also catches Ctrl+C, sys.exit() and your own typos
        return 0`, lang: 'python' },
      right: { code: py`def load_age(text):
    try:
        return int(text)
    except (ValueError, TypeError):   # exactly the failures we can recover from
        return 0`, lang: 'python' },
      explanation: py`A bare \`except:\` catches \`BaseException\`, so it swallows \`KeyboardInterrupt\`, \`SystemExit\` and every bug (a misspelt name raises \`NameError\`, which would quietly become "age 0"). Name the exceptions you expect.`,
    },
    {
      title: 'A try block that is far too big',
      wrong: { code: py`def average_score(path):
    try:
        with open(path) as file:
            scores = [int(line) for line in file]
        return sum(scores) / len(scores)
    except Exception:
        return "file missing"`, lang: 'python' },
      right: { code: py`def average_score(path):
    try:
        file = open(path)
    except FileNotFoundError:
        return None
    with file:
        scores = [int(line) for line in file]
    return sum(scores) / len(scores) if scores else None`, lang: 'python' },
      explanation: py`In the wrong version, a bad line (\`ValueError\`) or an empty file (\`ZeroDivisionError\`) also reports "file missing" — a lie that sends you debugging the wrong thing. Protect only the operation whose failure you understand.`,
    },
    {
      title: 'Catching the wrong exception type',
      wrong: { code: py`stock = {"apples": 12}
try:
    print(stock["kiwis"])
except IndexError:          # dicts raise KeyError, not IndexError
    print("not stocked")`, lang: 'python' },
      right: { code: py`stock = {"apples": 12}
try:
    print(stock["kiwis"])
except KeyError:
    print("not stocked")`, lang: 'python' },
      explanation: py`Lists raise \`IndexError\`, dicts raise \`KeyError\`. If you're unsure, trigger the error once in the REPL and read the last line of the traceback. (\`LookupError\` is the parent of both.)`,
    },
    {
      title: 'Using the "as" name after the handler',
      wrong: { code: py`try:
    int("x")
except ValueError as err:
    pass
print("last error:", err)    # NameError: name 'err' is not defined`, lang: 'python', static: true },
      right: { code: py`last_error = None
try:
    int("x")
except ValueError as err:
    last_error = err
print("last error:", last_error)`, lang: 'python' },
      explanation: py`The \`as\` name is deleted when the handler ends (to avoid a reference cycle through the traceback). Copy it to another name if you need it later.`,
    },
    {
      title: 'return (or break) inside finally',
      wrong: { code: py`def save():
    try:
        raise OSError("disk full")
    finally:
        return "saved"       # swallows the OSError!`, lang: 'python', static: true },
      right: { code: py`def save():
    try:
        write_to_disk()
    finally:
        print("closing the file")   # clean-up only; no return here
    return "saved"`, lang: 'python', static: true },
      explanation: py`A \`return\`, \`break\` or \`continue\` that leaves a \`finally\` block silently discards any exception in flight. Python 3.14 warns about it (\`SyntaxWarning: 'return' in a 'finally' block\`, PEP 765). Keep \`finally\` for clean-up only.`,
    },
  ],
  debugging: [
    {
      symptom: py`NameError: name 'err' is not defined (on a line after the except block)`,
      cause: py`The \`except … as err\` name is deleted automatically when the handler finishes.`,
      fix: py`Store the exception in another variable inside the handler (\`last_error = err\`) or do the work inside the handler.`,
    },
    {
      symptom: py`SyntaxError: expected 'except' or 'finally' block`,
      cause: py`A \`try:\` with neither \`except\` nor \`finally\`, an \`else\` with no \`except\`, or a dedented line between \`try\` and \`except\`.`,
      fix: py`Add the handler (or \`finally\`) directly after the \`try\` block and check indentation.`,
    },
    {
      symptom: py`SyntaxError: default 'except:' must be last`,
      cause: py`A bare \`except:\` placed before a specific \`except\` clause.`,
      fix: py`Move it to the end — or better, replace it with \`except Exception:\` plus logging, or remove it.`,
    },
    {
      symptom: py`SyntaxError: multiple exception types must be parenthesized when using 'as'`,
      cause: py`\`except ValueError, TypeError as err:\` — the bracket-free form (3.14+) is only allowed without \`as\`. (Before 3.14, *any* bracket-free list was an error: \`multiple exception types must be parenthesized\`.)`,
      fix: py`Write \`except (ValueError, TypeError) as err:\`.`,
    },
    {
      symptom: py`The program ignores Ctrl+C and keeps looping.`,
      cause: py`A bare \`except:\` or \`except BaseException:\` inside the loop catches \`KeyboardInterrupt\`.`,
      fix: py`Catch specific types (or \`Exception\` at most). \`KeyboardInterrupt\` derives from \`BaseException\`, not \`Exception\`.`,
    },
    {
      symptom: py`During handling of the above exception, another exception occurred:`,
      cause: py`The code **inside** an \`except\` block raised a new exception (often a typo or a second failure). Python shows both tracebacks.`,
      fix: py`Read the **last** traceback first — that's the new bug in your handler — then the first one, which is what you were trying to handle. Keep handlers simple.`,
    },
  ],
  bestPractices: [
    'Catch the most specific exception type that describes the failure you can handle.',
    'Keep the try block to the one or two lines that can raise that exception; put follow-up work in else.',
    'Never use a bare except: — at most except Exception:, and only where you log the traceback.',
    'Never write except ...: pass without a comment explaining why ignoring the error is correct.',
    'Use finally (or a with statement) for clean-up that must happen on every path.',
    'Don\'t return, break or continue inside finally — it swallows exceptions.',
    'Show users a friendly message; give developers the full traceback in logs.',
  ],
  whenToUse: {
    use: [
      'The failure is expected in normal use (bad input, missing file, network hiccup) and you know a sensible recovery.',
      'Checking in advance is impossible or racy (the file could vanish between the check and the open).',
      'You must clean up whatever happens (finally).',
    ],
    avoid: [
      'To hide bugs: TypeError, NameError and AttributeError usually mean the code is wrong, not the input.',
      'When you can\'t do anything useful about the error at this level — let it propagate to a caller that can.',
      'As a substitute for a cheap, clear check in a hot loop (e.g. use dict.get(key, default) when a missing key is common).',
    ],
  },
  comparison: {
    title: 'What runs, in each situation',
    headers: ['situation', 'except T', 'else', 'finally', 'after the try statement'],
    rows: [
      ['try block finishes normally', 'skipped', 'runs', 'runs', 'runs'],
      ['try raises T (caught)', 'runs', 'skipped', 'runs', 'runs'],
      ['try raises something not matched', 'skipped', 'skipped', 'runs', 'skipped — the exception propagates'],
      ['try executes return', 'skipped', 'skipped', 'runs (then the function returns)', 'skipped'],
      ['the handler itself raises', '(was running)', 'skipped', 'runs', 'skipped — the new exception propagates'],
    ],
    note: py`\`finally\` is the only clause that runs in every row. That's the guarantee \`with\` statements are built on.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'try-except-q1',
      type: 'mcq',
      prompt: py`When does the \`else\` block of a \`try\` statement run?`,
      options: [
        { text: 'Only when an exception was raised and caught', why: 'That is when the matching except block runs. else is the opposite case.' },
        'Only when the try block finished without raising any exception',
        { text: 'Always, after everything else', why: 'That describes finally, not else. else is skipped whenever the try block raises.' },
        { text: 'When an exception was raised but no except clause matched it', why: 'In that case the exception propagates to the caller; neither else nor the code after the try statement runs (only finally does).' },
      ],
      answer: 1,
      explanation: py`\`else\` is "the try succeeded, now continue". Putting follow-up code there (instead of inside \`try\`) means its errors won't be mistaken for the failure you were handling.`,
    },
    {
      id: 'try-except-q2',
      type: 'output',
      prompt: 'Predict the output, one item per line.',
      code: py`def check(n):
    try:
        print("A")
        result = 10 / n
    except ZeroDivisionError:
        print("B")
    else:
        print("C")
    finally:
        print("D")

check(0)
check(5)`,
      answer: py`A
B
D
A
C
D`,
      explanation: py`\`check(0)\`: "A", then \`10 / 0\` raises → handler prints "B" → \`finally\` prints "D". \`check(5)\`: "A", division works → \`else\` prints "C" → \`finally\` prints "D". \`finally\` runs both times; \`else\` and \`except\` never both run.`,
    },
    {
      id: 'try-except-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`try:
    int("ten")
except Exception:
    print("general")
except ValueError:
    print("specific")`,
      options: [
        'general',
        { text: 'specific', why: 'Python does not look for the "best" match. It checks clauses top to bottom and the first match wins; ValueError is a subclass of Exception, so the first clause matches.' },
        { text: 'general\nspecific', why: 'At most one except clause runs per exception.' },
        { text: 'A ValueError traceback', why: 'The exception is caught — by the first clause, because every ValueError is also an Exception.' },
      ],
      answer: 0,
      explanation: py`\`int("ten")\` raises \`ValueError\`, which **is an** \`Exception\`, so the first clause matches and the second is dead code. Always order handlers from specific to general.`,
    },
    {
      id: 'try-except-q4',
      type: 'bug',
      prompt: 'Calling `in_stock("kiwis")` crashes with a traceback instead of returning False. Click the line that causes the problem.',
      code: py`stock = {"apples": 12, "pears": 0}

def in_stock(item):
    try:
        return stock[item] > 0
    except IndexError:
        return False

print(in_stock("kiwis"))`,
      answerLine: 6,
      explanation: py`A missing **dict** key raises \`KeyError\`, not \`IndexError\` (that's for sequences like lists). The handler never matches, so the \`KeyError\` escapes. Use \`except KeyError:\` — or avoid the exception entirely with \`stock.get(item, 0) > 0\`.`,
    },
    {
      id: 'try-except-q5',
      type: 'fill',
      prompt: 'Complete the function: catch bad text **and** `None` in one clause, return the age only on success, and always print the "checked" line.',
      code: py`def read_age(text):
    try:
        age = int(text)
    except ___ as err:
        print("Bad age:", err)
        return None
    ___:
        return age
    ___:
        print("checked", repr(text))`,
      answer: [['(ValueError, TypeError)', '(TypeError, ValueError)'], ['else'], ['finally']],
      explanation: py`\`int("abc")\` raises \`ValueError\`; \`int(None)\` raises \`TypeError\`; a tuple catches either. \`else\` runs only when \`int()\` worked; \`finally\` runs on both paths — even after the \`return\` statements.`,
    },
    {
      id: 'try-except-q6',
      type: 'mcq',
      prompt: py`Which of these is **not** caught by \`except Exception:\`?`,
      options: [
        { text: 'ValueError', why: 'ValueError is a subclass of Exception, so it is caught.' },
        { text: 'FileNotFoundError', why: 'FileNotFoundError → OSError → Exception, so it is caught.' },
        'KeyboardInterrupt',
        { text: 'KeyError', why: 'KeyError → LookupError → Exception, so it is caught.' },
      ],
      answer: 2,
      explanation: py`\`KeyboardInterrupt\` (Ctrl+C), \`SystemExit\` (\`sys.exit()\`) and \`GeneratorExit\` inherit directly from \`BaseException\`, so that "catch all errors" handlers don't accidentally stop the user from quitting.`,
    },
    {
      id: 'try-except-q7',
      type: 'short',
      prompt: py`A teammate wraps a whole function in \`try: … except: pass\` "so it never crashes". Explain two concrete problems this causes.`,
      answer: py`1) It catches BaseException, so Ctrl+C (KeyboardInterrupt) and sys.exit() (SystemExit) are swallowed — the program can't be stopped normally. 2) It hides every bug: a typo (NameError), a wrong type (TypeError) or a real failure silently turns into "nothing happened", with no message or traceback, so the bug surfaces later somewhere else and is much harder to find. Catch the specific exceptions you expect, and log anything you catch broadly.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'safe-int',
      title: 'A forgiving int converter',
      difficulty: 'intermediate',
      prompt: py`Write \`to_int(value, default=0)\` that returns \`int(value)\` when the conversion works, and \`default\` when it fails because the value is **bad text** or **the wrong type**:

- \`to_int("42")\` → \`42\`, \`to_int(" 7 ")\` → \`7\` (\`int()\` ignores surrounding spaces)
- \`to_int("4.5")\` → \`0\`, \`to_int("abc", default=-1)\` → \`-1\` (these raise \`ValueError\`)
- \`to_int(None)\` → \`0\` (this raises \`TypeError\`)

It must **not** hide other errors: if converting raises anything else (the tests use an object whose conversion raises \`RuntimeError\`), that exception must reach the caller. So no bare \`except:\` and no \`except Exception:\`.`,
      files: {
        'main.py': py`def to_int(value, default=0):
    # TODO: try the conversion; return default for ValueError and TypeError only
    return int(value)


print(to_int("42"))
`,
      },
      hints: [
        'Put return int(value) inside a try block.',
        'Which exceptions do int("4.5") and int(None) raise? Try them in the playground, then catch exactly those two.',
        'try:\n    return int(value)\nexcept (ValueError, TypeError):\n    return default',
      ],
      solution: {
        explanation: py`\`int(value)\` raises \`ValueError\` for text that isn't a whole number and \`TypeError\` for values of the wrong type such as \`None\`. Catching that tuple — and nothing broader — covers bad input while letting genuine surprises (here a \`RuntimeError\` from a broken object) propagate with their traceback. Returning straight from the \`try\` keeps the function tiny; \`else\` isn't needed because there's no follow-up work.`,
        files: {
          'main.py': py`def to_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


print(to_int("42"))
print(to_int("4.5"))
print(to_int("abc", default=-1))
print(to_int(None))
`,
        },
      },
      tests: [
        { name: 'converts good text', code: py`assert to_int("42") == 42
assert to_int(" 7 ") == 7` },
        { name: 'bad text gives the default', code: py`assert to_int("4.5") == 0
assert to_int("abc", default=-1) == -1` },
        { name: 'None gives the default', code: py`assert to_int(None) == 0
assert to_int(None, default=5) == 5` },
        { name: 'other errors are not hidden', code: py`class BrokenSensor:
    def __int__(self):
        raise RuntimeError("sensor offline")

with raises(RuntimeError):
    to_int(BrokenSensor())` },
      ],
    },
    {
      id: 'load-scores',
      title: 'Load scores, skip the junk',
      difficulty: 'intermediate',
      prompt: py`\`scores.txt\` holds one \`name,score\` pair per line, but some lines are broken. Write \`load_scores(path)\` that returns a dict \`{name: score}\` with **int** scores:

- Strip spaces around names and scores (\`int()\` already ignores spaces).
- **Skip** any line that isn't exactly two comma-separated parts or whose score isn't a whole number (both raise \`ValueError\`), and print \`Skipping line N: <the line>\` for it (\`N\` counts from 1).
- If the file doesn't exist, return an **empty dict** (catch \`FileNotFoundError\`).
- Don't catch anything else: \`load_scores(None)\` must still raise \`TypeError\`.

For the given file the result is \`{"ada": 91, "ben": 78, "eve": 85}\`.`,
      files: {
        'main.py': py`def load_scores(path):
    """Return {name: score} from a "name,score" file. Skip bad lines; {} if the file is missing."""
    scores = {}
    # TODO: read the file (handle FileNotFoundError), then convert each line (handle ValueError)
    return scores


print(load_scores("scores.txt"))
print(load_scores("missing.txt"))
`,
        'scores.txt': py`ada,91
ben, 78
cy,not-a-number
dee
eve,85
`,
      },
      hints: [
        'Use two separate try blocks: one around reading the file, one around converting each line.',
        'name, score = line.split(",") raises ValueError when there are not exactly two parts; int(score) raises ValueError for "not-a-number". One except ValueError covers both.',
        'try:\n    with open(path, encoding="utf-8") as file:\n        lines = file.read().splitlines()\nexcept FileNotFoundError:\n    return {}\nfor number, line in enumerate(lines, start=1):\n    try:\n        name, score = line.split(",")\n        value = int(score)\n    except ValueError:\n        print(f"Skipping line {number}: {line}")\n        continue\n    scores[name.strip()] = value',
      ],
      solution: {
        explanation: py`Two small \`try\` blocks, each with one job. The first protects **opening and reading** the file; a missing file is an expected situation, so we return \`{}\`. The second protects **parsing one line**: unpacking into exactly two names and \`int()\` both raise \`ValueError\` on bad data, so one handler skips the line and reports it, then \`continue\` moves on. The dict update sits *after* the \`try\`, so it only runs for good lines. Nothing broader is caught, so a programming mistake like passing \`None\` as the path still raises \`TypeError\` — loudly, where you'll see it.`,
        files: {
          'main.py': py`def load_scores(path):
    """Return {name: score} from a "name,score" file. Skip bad lines; {} if the file is missing."""
    try:
        with open(path, encoding="utf-8") as file:
            lines = file.read().splitlines()
    except FileNotFoundError:
        return {}

    scores = {}
    for number, line in enumerate(lines, start=1):
        try:
            name, score = line.split(",")
            value = int(score)
        except ValueError:
            print(f"Skipping line {number}: {line}")
            continue
        scores[name.strip()] = value
    return scores


print(load_scores("scores.txt"))
print(load_scores("missing.txt"))
`,
          'scores.txt': py`ada,91
ben, 78
cy,not-a-number
dee
eve,85
`,
        },
      },
      tests: [
        { name: 'loads the good lines', code: py`assert load_scores("scores.txt") == {"ada": 91, "ben": 78, "eve": 85}` },
        { name: 'reports each skipped line', code: py`out = capture(load_scores, "scores.txt")
assert "Skipping line 3: cy,not-a-number" in out
assert "Skipping line 4: dee" in out` },
        { name: 'a missing file gives an empty dict', code: py`assert load_scores("no-such-file.txt") == {}` },
        { name: 'strips spaces around names', code: py`with open("extra.txt", "w", encoding="utf-8") as f:
    f.write("  zed , 70\n")
assert load_scores("extra.txt") == {"zed": 70}` },
        { name: 'does not hide a TypeError', code: py`with raises(TypeError):
    load_scores(None)` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'try-except-clause-order',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain try, except, else and finally. When does each one run?',
      answer: 'try holds code that might raise. An except clause runs if an exception of its type (or a subclass) escapes the try block — the first matching clause wins. else runs only if the try block raised nothing. finally runs on every exit path: success, handled or unhandled exception, return, break or continue.',
      explanation: py`The point of \`else\` is to keep the \`try\` block small: code that depends on success goes in \`else\`, so its own errors aren't caught by handlers meant for the risky line. \`finally\` is for clean-up and does **not** stop an exception — it runs while the exception passes through.`,
      code: { lang: 'python', code: py`def read_number(text):
    try:
        number = int(text)
    except ValueError:
        print("not a number")
        return None
    else:
        print("converted")
        return number
    finally:
        print("done")


read_number("7")    # converted, done
read_number("x")    # not a number, done` },
      whyAsked: 'It checks whether you know the semantics precisely — especially that else is not "always" and that finally does not catch anything.',
      mistakes: ['Saying else runs "if no except matched" (then the exception propagates)', 'Saying finally catches or suppresses exceptions', 'Not knowing finally runs after a return'],
      followUps: ['Why use else instead of putting the code at the end of try?', 'What happens if finally contains a return?', 'Can a try have finally but no except?'],
      modelAnswer: 'try marks code that might raise an exception. If an exception escapes it, Python checks the except clauses top to bottom and runs the first one whose type matches, including subclasses. else runs only when the try block finished without raising, and I use it to keep the try block minimal, so follow-up code is not accidentally covered by the handler. finally runs on every exit path — success, a handled error, an unhandled error, even a return — which makes it the place for clean-up. It does not stop an exception; the exception keeps propagating after finally runs.',
    },
    {
      id: 'try-except-ctrl-c',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A data-import script runs `while True:` with `try: import_next_file() except: print("retrying")`. Ops report that Ctrl+C does nothing and failures never show a cause. What is wrong and how do you fix it?',
      answer: 'The bare except catches BaseException, including KeyboardInterrupt (Ctrl+C) and SystemExit, and discards every traceback. Catch only the expected failures (e.g. OSError, ValueError), or at most Exception, log the exception with its traceback, and let KeyboardInterrupt and SystemExit propagate.',
      explanation: py`\`KeyboardInterrupt\` and \`SystemExit\` derive from \`BaseException\` precisely so that \`except Exception\` doesn't catch them. A bare \`except:\` defeats that design. It also hides programming errors (\`NameError\`, \`TypeError\`) behind "retrying", so a typo becomes an infinite retry loop.`,
      code: { lang: 'python', code: py`import logging

logger = logging.getLogger("importer")


def run_forever(import_next_file):
    while True:
        try:
            import_next_file()
        except (OSError, ValueError):
            logger.exception("import failed; will retry")   # message + traceback
        # KeyboardInterrupt / SystemExit propagate and stop the loop` },
      whyAsked: 'Bare excepts are one of the most common real-world Python bugs; interviewers want to see you know the hierarchy and value observability.',
      mistakes: ['Replacing except: with except BaseException: (same problem)', 'Fixing Ctrl+C but still swallowing the traceback', 'Adding a sleep but not narrowing the exception'],
      followUps: ['Where would a catch-all be acceptable?', 'How would you add a retry limit and backoff?', 'How do you log an exception with its traceback?'],
      modelAnswer: 'A bare except catches BaseException, which includes KeyboardInterrupt and SystemExit, so Ctrl+C is swallowed and the loop keeps going. It also throws away the traceback, so a typo or a real bug just prints "retrying" forever. I would catch the specific failures we expect from an import, like OSError for file problems or ValueError for bad data, and log them with logger.exception so the traceback is kept. KeyboardInterrupt and SystemExit then propagate naturally. If I genuinely need a catch-all at the top of a worker, I use except Exception plus logging, never a bare except.',
    },
    {
      id: 'try-except-misleading-handler',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This code prints "Config file not found" — but the file definitely exists. What is going on, and how would you rewrite it?',
      code: { lang: 'python', code: py`import json

def load_port(path):
    try:
        with open(path) as f:
            config = json.load(f)
        return int(config["port"])
    except Exception:
        print("Config file not found")
        return 8080` },
      answer: 'The try block is too big and the handler too broad: a JSONDecodeError (invalid JSON), KeyError (no "port") or ValueError (port not numeric) are all reported as "file not found". Narrow the try to the open() call with except FileNotFoundError, and handle (or let propagate) the other errors with accurate messages.',
      explanation: py`Broad handlers plus misleading messages are worse than crashing: you debug the wrong problem. Give each failure its own handler — or let unexpected ones propagate with their real traceback.`,
      whyAsked: 'Shows whether you can diagnose error-handling smells in real code, not just recite syntax.',
      mistakes: ['Saying "add more except clauses" without narrowing the try', 'Catching json.JSONDecodeError as ValueError without knowing it is a subclass'],
      followUps: ['json.JSONDecodeError is a subclass of which built-in?', 'Should a missing "port" key fall back to a default or fail?', 'How would you log the original error?'],
      modelAnswer: 'The handler catches Exception around the whole function, so any failure — invalid JSON, a missing "port" key, a non-numeric port — gets reported as "file not found". That message is a lie, which sends people debugging the wrong thing. I would keep the try around only the open call and catch FileNotFoundError there, returning the default if that really is the policy. For bad JSON or a missing key I would either catch json.JSONDecodeError and KeyError separately with accurate messages or let them propagate so the traceback shows the real cause. The general rule is: small try blocks, specific exceptions, honest messages.',
    },
    {
      id: 'try-except-return-in-finally',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and what is the problem with it?',
      code: { lang: 'python', code: py`def save():
    try:
        raise OSError("disk full")
    finally:
        return "saved"

print(save())` },
      options: ['saved', 'An OSError traceback', 'saved, then an OSError traceback', 'None'],
      correctOption: 0,
      answer: 'It prints "saved". The return inside finally replaces the propagating OSError, so the error is silently lost. Python 3.14 warns about it at compile time (SyntaxWarning: \'return\' in a \'finally\' block, PEP 765).',
      explanation: py`When \`finally\` runs during unwinding, the exception is "in flight". A \`return\` (or \`break\`/\`continue\`) that exits the \`finally\` block abandons it. The same applies when \`try\` already returned: a \`return\` in \`finally\` overrides that value too. Keep \`finally\` for clean-up and put \`return\` after the statement.`,
      whyAsked: 'A classic trap that reveals whether you understand finally as "runs during unwinding" rather than "a handler".',
      mistakes: ['Expecting the traceback because "finally doesn\'t catch exceptions"', 'Not knowing that a return in finally also overrides a return in try'],
      followUps: ['What does def f(): try: return 1 finally: return 2 return?', 'What did PEP 765 change in Python 3.14?', 'Is break inside finally also a problem?'],
      modelAnswer: 'It prints "saved" with no traceback. finally runs while the OSError is propagating, and a return that exits the finally block replaces whatever was in progress — so the exception is silently discarded. The same happens to a return value from the try block. That is why returning, breaking or continuing out of finally is considered a bug, and since Python 3.14 the compiler emits a SyntaxWarning for it under PEP 765. I keep finally strictly for clean-up and put the return after the try statement.',
    },
    {
      id: 'try-except-as-deleted',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Why does Python delete the name bound by `except ... as err` when the handler ends?',
      answer: 'To avoid a reference cycle: the exception holds its traceback, the traceback holds the frame, and the frame holds err. Without the implicit del err, every local in that frame would stay alive until the cyclic garbage collector ran. Copy the exception to another name if you need it later.',
      explanation: py`The language reference specifies that \`except E as N:\` behaves as if the handler ended with \`del N\` (in a \`finally\`). The cycle is exception → \`__traceback__\` → frame → locals → exception. In CPython, objects in a cycle aren't freed by reference counting alone; they wait for the cyclic GC, which can keep large objects (buffers, open files) alive longer than expected. See [memory management](lesson:memory-management).`,
      code: { lang: 'python', code: py`saved = None
try:
    {}["missing"]
except KeyError as err:
    saved = err              # keep it deliberately
print(repr(saved))           # KeyError('missing')
print("err" in globals())    # False — the name was deleted` },
      whyAsked: 'Tests understanding of exception objects, tracebacks and object lifetime — senior-level Python knowledge.',
      mistakes: ['Saying "because the exception is destroyed" (it isn\'t, if something else references it)', 'Not knowing about __traceback__'],
      followUps: ['What is in exc.__traceback__?', 'How does traceback.format_exception use it?', 'Why can holding onto exceptions in a list cause memory growth?'],
      modelAnswer: 'Every exception object keeps a reference to its traceback, and the traceback references the stack frames it passed through, including their local variables. If the handler name err stayed bound in that frame, we would have a cycle: frame to err to exception to traceback to frame. In CPython that cycle cannot be freed by reference counting alone, so all those locals would linger until the cyclic garbage collector runs. To prevent that, the language specifies an implicit del err at the end of the handler. If I need the exception afterwards, I assign it to another name deliberately, accepting that it keeps the traceback alive.',
    },
    {
      id: 'try-except-ask-int',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: py`Write \`ask_int(prompt, low, high)\` that keeps calling \`input(prompt)\` until the user types a whole number between \`low\` and \`high\` (inclusive), then returns it as an int. For non-numbers print a message containing \`not a whole number\`; for numbers out of range print a message containing \`between {low} and {high}\` (e.g. \`between 0 and 120\`).`,
      answer: 'A while True loop: read input, try int(); on ValueError print the message and continue; otherwise return if in range, else print the range message.',
      explanation: py`The \`try\` protects only \`int(text)\`. The range check happens after the conversion succeeded, so a bug there could never be mistaken for bad input. The loop is the standard "ask until valid" shape used in CLIs.`,
      starter: { files: { 'main.py': py`def ask_int(prompt, low, high):
    """Keep asking until the user types a whole number from low to high."""
    # TODO: loop, convert with int(), handle ValueError, check the range
    return int(input(prompt))


age = ask_int("Age? ", 0, 120)
print("Thanks! Age recorded:", age)
` } },
      tests: [
        { name: 'returns the first valid number', stdin: '42', code: py`assert ask_int("Age? ", 0, 120) == 42` },
        { name: 'skips text that is not a number', stdin: 'forty\n42', code: py`assert ask_int("Age? ", 0, 120) == 42` },
        { name: 'skips numbers out of range', stdin: '-5\n121\n7', code: py`assert ask_int("Age? ", 0, 120) == 7` },
        { name: 'explains each rejection', stdin: 'forty\n200\n42', code: py`out = capture(ask_int, "Age? ", 0, 120)
assert "not a whole number" in out
assert "between 0 and 120" in out` },
      ],
      solution: { files: { 'main.py': py`def ask_int(prompt, low, high):
    """Keep asking until the user types a whole number from low to high."""
    while True:
        text = input(prompt)
        try:
            number = int(text)
        except ValueError:
            print(f"{text!r} is not a whole number.")
            continue
        if low <= number <= high:
            return number
        print(f"Please enter a number between {low} and {high}.")


age = ask_int("Age? ", 0, 120)
print("Thanks! Age recorded:", age)
` } },
      hints: ['Use while True and only leave the loop with return.', 'Wrap just int(text) in try/except ValueError; use continue in the handler.', 'After a successful conversion, check low <= number <= high.'],
      whyAsked: 'A practical warm-up: input validation is everywhere, and it shows whether you keep try blocks small.',
      mistakes: ['Putting the range check inside the try block', 'Using recursion instead of a loop (unbounded stack growth on repeated bad input)', 'Catching Exception instead of ValueError'],
      followUps: ['How would you limit the number of attempts?', 'How would you handle EOFError when input runs out?', 'How would you test this function without a human typing?'],
      modelAnswer: 'I use a while True loop that reads the input and tries int on it. If that raises ValueError, I print that it is not a whole number and continue the loop. If the conversion worked I check the range: in range returns the number, otherwise I print the allowed range and ask again. I keep only the int call in the try block, so a bug in the range logic can never be mistaken for bad user input. For testing I feed input through stdin or patch input, and in a real CLI I would also handle EOFError so piped input ending early fails cleanly.',
    },
  ],

  takeaways: [
    'An exception is an object describing a failure; if nothing catches it, it unwinds the call stack and crashes the program with a traceback.',
    'except T catches T and its subclasses; clauses are checked top to bottom and only the first match runs — put specific types first.',
    'else runs only when the try block raised nothing; finally runs on every exit path and does not stop the exception.',
    'Keep try blocks tiny and catch the narrowest type you can genuinely handle; a tuple catches several types with one handler.',
    'except … as err gives you the exception object (message, args, extra fields); the name is deleted when the handler ends.',
    'Never use a bare except: it catches KeyboardInterrupt and SystemExit (which derive from BaseException, not Exception) and hides bugs.',
    'Don\'t return/break/continue out of finally — it silently discards exceptions (Python 3.14 warns, PEP 765).',
  ],
}

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TOOLBOX = py`from collections.abc import Callable, Iterable, Sequence


def first[T](items: Sequence[T], default: T) -> T:
    """Return the first item, or default when there are none."""
    return items[0] if items else default


def group_by[T, K](items: Iterable[T], key: Callable[[T], K]) -> dict[K, list[T]]:
    """Put items into lists, keyed by key(item)."""
    groups: dict[K, list[T]] = {}
    for item in items:
        groups.setdefault(key(item), []).append(item)
    return groups


class Stack[T]:
    """Last in, first out. A Stack[str] holds strs (as far as checkers know)."""

    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def __len__(self) -> int:
        return len(self._items)


type Pair[T] = tuple[T, T]


def min_max(numbers: Sequence[float]) -> Pair[float]:
    return min(numbers), max(numbers)


songs = ["Intro", "Halo", "Run", "Hymn"]
print(first(songs, "silence"))
print(first([], 0))
print(group_by(songs, len))

undo = Stack[str]()
undo.push("type 'hello'")
undo.push("delete word")
print(undo.pop(), "|", len(undo), "left")

print(min_max([3.5, 9.0, 1.25]))
print(first.__type_params__, Stack.__type_params__, Pair.__value__)
`

const SOLVER = py`"""A SIMPLIFIED, runtime imitation of how a type checker 'solves' T.

Real checkers (mypy, pyright) do this without running anything, on every
call, for every kind of type. This toy only understands hints shaped like
T or Sequence[T] / list[T], and peeks at the actual values to guess types.
"""
import typing
from collections.abc import Sequence, Sized


def solve(func, *args):
    hints = typing.get_type_hints(func)
    returns = hints.pop("return")
    solved: dict[typing.TypeVar, set[type]] = {}
    for hint, value in zip(hints.values(), args):
        if isinstance(hint, typing.TypeVar):               # param: T
            solved.setdefault(hint, set()).add(type(value))
        elif typing.get_args(hint) and isinstance(typing.get_args(hint)[0], typing.TypeVar):
            tv = typing.get_args(hint)[0]                    # param: Sequence[T]
            solved.setdefault(tv, set()).update(type(item) for item in value)
    print(f"{func.__name__}{args}")
    for tv, types in solved.items():
        names = " | ".join(sorted(t.__name__ for t in types))
        bound = tv.__bound__
        if bound is not None and not all(issubclass(t, bound) for t in types):
            print(f"  error: {tv.__name__} = {names}, but {tv.__name__} must be a {bound.__name__}")
        else:
            shown = names if returns is tv else returns
            print(f"  {tv.__name__} = {names}  ->  returns {shown}")


def first[T](items: Sequence[T], default: T) -> T:
    return items[0] if items else default


def longest[T: Sized](a: T, b: T) -> T:
    return a if len(a) >= len(b) else b


solve(first, ["tea", "milk"], "none")
solve(first, [3, 1, 2], 0)
solve(first, [3, 1, 2], "none")    # mixed: T widens to fit both
solve(longest, "tea", "coffee")
solve(longest, 10, 200)            # int has no len(): breaks the bound
`

export default {
  id: 'generics',
  title: 'Generics & type parameters',
  summary: 'Type variables let one function or class work with many types while keeping the link between them — "whatever type goes in comes back out" — so checkers stay precise without copy-pasted code or Any.',
  difficulty: 'advanced',
  minutes: 60,
  prerequisites: ['type-hints', 'typing-collections-and-unions'],
  related: ['protocols', 'static-type-checking', 'classes-and-objects', 'decorators', 'advanced-decorators', 'container-protocols', 'lambdas-and-higher-order', 'inheritance', 'abstract-base-classes', 'modern-features', 'collections-module'],
  tags: ['generics', 'TypeVar', 'type parameters', 'PEP 695', 'type statement', 'Generic', 'bound', 'constraints', 'ParamSpec', 'Concatenate', 'variance', 'covariant', 'contravariant', 'invariant', 'TypeVarTuple', 'typing', 'mypy', 'pyright'],
  apis: [
    { name: 'def f[T](x: T) -> T', summary: 'A generic function with a type parameter T (PEP 695 syntax, Python 3.12+).' },
    { name: 'class C[T]:', summary: 'A generic class; C[int] is "a C of ints" for type checkers (3.12+).' },
    { name: 'type Alias[T] = ...', summary: 'A generic type alias created by the type statement (3.12+); a typing.TypeAliasType at runtime.' },
    { name: '[T: Bound] / [T: (A, B)]', summary: 'A bound (T must be Bound or a subtype) or constraints (T must be exactly A or B).' },
    { name: '[**P, R] with Callable[P, R]', summary: 'ParamSpec: captures a whole parameter list, used to type decorators that keep the signature.' },
    { name: 'typing.TypeVar("T", bound=..., covariant=...)', summary: 'The older spelling of a type variable, needed for Python 3.11 and earlier.' },
    { name: 'typing.Generic[T]', summary: 'Base class that makes an old-style class generic; PEP 695 classes get it implicitly.' },
    { name: 'typing.ParamSpec("P") / typing.Concatenate', summary: 'Old spelling of **P, and a way to add or remove leading parameters in a Callable.' },
    { name: 'obj.__type_params__', summary: 'Tuple of the TypeVar / ParamSpec / TypeVarTuple objects a function, class or alias declared.' },
    { name: 'type[T]', summary: 'The class object itself (not an instance) — handy when a function needs the type at runtime.' },
  ],
  docs: [
    { label: 'typing — generics', url: 'https://docs.python.org/3/library/typing.html#generics' },
    { label: 'Language reference — type parameter lists', url: 'https://docs.python.org/3/reference/compound_stmts.html#type-params' },
    { label: 'PEP 695 — Type Parameter Syntax', url: 'https://peps.python.org/pep-0695/' },
    { label: 'PEP 612 — Parameter Specification Variables', url: 'https://peps.python.org/pep-0612/' },
    { label: 'mypy — generics', url: 'https://mypy.readthedocs.io/en/stable/generics.html' },
    { label: 'mypy — variance (common issues)', url: 'https://mypy.readthedocs.io/en/stable/common_issues.html#variance' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Some functions don't care *what* they hold, only that they hand back the same kind of thing. \`first(items)\` returns an item from the list — a \`str\` from a list of strings, an \`int\` from a list of ints. How do you write its hint?`,
    { code: py`from typing import Any


def first_any(items: list[Any]) -> Any: ...      # checker forgets everything


def first_str(items: list[str]) -> str: ...      # only works for strings


def first[T](items: list[T]) -> T: ...            # "whatever type goes in comes out"`, lang: 'python', title: 'three attempts — the third is generic' },
    py`The last one is **generic**. \`T\` is a **type variable** (also called a *type parameter*): a placeholder for "some type, decided by the caller". A type checker fills it in separately for every call: for \`first(["tea", "milk"])\`, \`T\` is \`str\`, so the result is a \`str\`; for \`first([3, 1])\` it is an \`int\`.`,
    py`The square brackets after the name, \`first[T]\`, *declare* the type variable. That syntax is new in **Python 3.12** (PEP 695). The same idea works for classes (\`class Stack[T]\`) and type aliases (\`type Pair[T] = tuple[T, T]\`), and you'll see the older \`TypeVar\` spelling in code that supports 3.11 and earlier. You already use generics every day: \`list[str]\` and \`dict[str, int]\` from [collections & unions](lesson:typing-collections-and-unions) are generic classes with their type parameters filled in.`,
  ],
  why: [
    py`Without generics you have two bad choices. Write \`Any\` and the checker stops checking (it would let you call \`.upper()\` on an int). Or write one copy of the function per type — \`first_str\`, \`first_int\`, \`first_order\` — and maintain them all.`,
    py`Generics keep the **relationship** between types: "the return type is the item type", "keys in, values out", "this decorator returns a function with the *same* parameters it was given". That relationship is what lets your editor autocomplete \`.upper()\` on the result of \`first(names)\` and lets a checker catch \`first(names) + 1\`.`,
    py`Every reusable container (stacks, caches, queues, result types, repositories) and many utilities (\`max\`, \`sorted\`, \`dict.get\`) are typed with generics. If you write libraries, decorators or shared helpers, you'll write them too.`,
  ],
  eli15: [
    py`Picture a lunchbox with a label that says "Contents: ____". Put a sandwich in and the label reads "sandwich"; whoever opens it knows they're getting a sandwich, not soup. A \`Box[T]\` is that lunchbox, and \`T\` is the blank on the label.`,
    py`The lunchbox itself doesn't care what's inside — that's why one design works for every lunch. But once it's filled, the label lets everyone (your editor, the type checker) know exactly what comes out. Python itself never reads the label; it just carries the box.`,
  ],
  analogy: {
    title: 'The coat check',
    body: [
      py`At a coat check you hand over an item and get a ticket. Hand in a coat, and later you get a coat back. Hand in an umbrella, you get an umbrella back. The counter works for anything — but it promises **the same kind of thing comes back**. That promise is a type variable.`,
      py`Some coat checks have rules. "Only things that fit on a hanger" is a **bound**: any coat, jacket or dress is fine. "Coats or umbrellas — nothing else" is a list of **constraints**. And a rack labelled "dogs' leashes only" can't be treated as a rack for "any pet item": someone might hang a cat toy on it. That's *variance*, the trickiest part of generics, and you'll meet it below.`,
    ],
    mapping: [
      ['the coat-check counter', 'a generic function or class: first[T], Stack[T]'],
      ['"whatever you handed in"', 'the type variable T'],
      ['your ticket remembers it was a coat', 'the checker solves T = Coat for this call'],
      ['"hangable items only"', 'a bound: T: Hangable (any subtype is fine)'],
      ['"coats or umbrellas only"', 'constraints: T: (Coat, Umbrella) (exactly one of these)'],
      ['the attendant never looks at the ticket\'s label', 'Python never checks type parameters at runtime'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'Type parameters at runtime: stored, never checked',
    props: {
      code: py`class Box[T]:
    def __init__(self, item: T) -> None:
        self.item = item

    def get(self) -> T:
        return self.item


def first[T](items: list[T]) -> T:
    return items[0]


cups = Box[int](3)
note = Box("hello")
total = cups.get() + 1
word = first(["tea", "milk"])
oops = Box[int]("not an int")
print(total, word, oops.get())
print(type(cups).__name__, Box.__type_params__)
`,
      notes: {
        1: 'Defining a generic class creates the class **and** a type parameter object `T`, stored in `Box.__type_params__`.',
        9: 'A generic function. Its `T` is a different object from the class\'s `T` — each one exists only inside its own definition.',
        13: '`Box[int]` means "a Box of ints". At runtime it builds an ordinary `Box`; the `[int]` is remembered but never checked.',
        14: 'No `[str]` needed: a type checker *infers* `Box[str]` from the argument. At runtime nothing is inferred at all.',
        16: 'A checker solves `T = str` for this call, so it knows `word` is a `str`. Python simply runs the body.',
        17: 'Wrong on purpose: a str inside a `Box[int]`. Python runs it without complaint — only a type checker would object.',
        19: '`type(cups)` is plain `Box`: the `[int]` has been **erased**.',
      },
    },
    alt: 'A step-by-step trace. A generic class Box[T] and a generic function first[T] are defined. cups = Box[int](3) creates a normal Box holding 3. note = Box("hello") holds a string. total is 4. first(["tea", "milk"]) returns "tea". oops = Box[int]("not an int") runs without error even though the item is a string. The program prints 4 tea not an int, then Box (T,).',
    caption: py`Step through with ▶. Watch line 17: the "wrong" type sails through. Generics are a contract for **type checkers**; at runtime they are erased.`,
  },
  syntax: [
    py`#### Generic functions (3.12+)`,
    { code: py`from collections.abc import Callable, Sequence


def first[T](items: Sequence[T], default: T) -> T:
    return items[0] if items else default


def pair_up[K, V](keys: Sequence[K], values: Sequence[V]) -> dict[K, V]:
    return dict(zip(keys, values, strict=True))


def apply_twice[T](func: Callable[[T], T], value: T) -> T:
    return func(func(value))`, lang: 'python', title: 'declare type parameters in [ ] after the name' },
    py`- \`[T]\` declares a type variable that exists **only inside** this function. Several are allowed: \`[K, V]\`.
- Use each type variable at least **twice** — that's what links things. In \`first\`, \`T\` ties the items, the default and the result together. A \`T\` that appears once links nothing; write \`object\` instead.
- By convention type variables are short and capitalised: \`T\` (type), \`K\`/\`V\` (key/value), \`R\` (return), \`P\` (parameters). Longer names like \`ItemT\` are fine when it helps.`,
    py`A type checker *infers* T from the arguments — you never write \`first[str](...)\`. To see what it worked out, use \`reveal_type\`:`,
    { code: py`from typing import reveal_type   # (continuing the example above)

word = first(["tea", "milk"], "none")
count = first([3, 1, 2], 0)
reveal_type(word)     # at runtime: prints "Runtime type is 'str'" to stderr
reveal_type(count)`, lang: 'python', title: 'ask the checker what T became' },
    { code: py`main.py:5: note: Revealed type is "builtins.str"
main.py:6: note: Revealed type is "builtins.int"`, lang: 'text', title: 'mypy output' },
    py`#### Generic classes`,
    { code: py`class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []    # annotate: an empty list has no item type yet

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()


undo: Stack[str] = Stack()      # the usual way to choose T
redo = Stack[str]()             # also valid: subscript the class itself
redo.push("delete word")
# redo.push(42)  -> checker: Argument 1 to "push" of "Stack" has incompatible type "int"; expected "str"`, lang: 'python', title: 'one T for the whole class' },
    py`Inside the class, \`T\` means "the item type of *this* stack". Every method shares it, which is how the checker knows that what you \`pop()\` from a \`Stack[str]\` is a \`str\`. If the constructor takes a \`T\` (\`Box("hello")\`) the checker infers \`Box[str]\` by itself.`,
    py`#### Generic type aliases: the \`type\` statement (3.12+)`,
    { code: py`type Pair[T] = tuple[T, T]
type Grid[T] = list[list[T]]
type Tree[T] = T | list[Tree[T]]      # recursive: the value is evaluated lazily


def min_max(numbers: list[float]) -> Pair[float]:
    return min(numbers), max(numbers)


board: Grid[str] = [["X", "O"], ["O", "X"]]`, lang: 'python', title: 'aliases with their own type parameters' },
    py`#### Bounds and constraints: limiting what T can be`,
    { code: py`from collections.abc import Sized


def longest[T: Sized](a: T, b: T) -> T:        # bound: any type that has len()
    return a if len(a) >= len(b) else b


def concat[S: (str, bytes)](a: S, b: S) -> S:  # constraints: exactly str, or exactly bytes
    return a + b


longest("tea", "coffee")       # T = str
longest([1, 2], [3])           # T = list[int]
concat("tea", "pot")           # S = str
concat(b"tea", b"pot")         # S = bytes
# longest(10, 200)             # rejected: int is not Sized
# concat("tea", b"pot")        # rejected: S can't be str and bytes at once`, lang: 'python', title: 'T: Bound and T: (A, B)' },
    py`| | bound \`[T: Sized]\` | constraints \`[S: (str, bytes)]\` |
|---|---|---|
| allowed types | \`Sized\` **or any subtype** (str, list, your own class with \`__len__\`) | **exactly** one of the listed types |
| what T becomes | the precise argument type (\`list[int]\`) | one of the listed types (a \`str\` subclass is treated as \`str\`) |
| typical use | "anything with this ability" — often a [protocol](lesson:protocols) | a few unrelated types that must not be mixed |
| count | one bound | at least two constraints |`,
    py`Why not just write \`a: str | bytes, b: str | bytes\`? Because a union lets the caller *mix* them, and \`"tea" + b"pot"\` crashes. The constrained \`S\` says "both the same one of these".`,
    py`#### ParamSpec: typing decorators that keep the signature`,
    { code: py`import functools
from collections.abc import Callable


def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print("calling", func.__name__)
        return func(*args, **kwargs)
    return wrapper


@logged
def add(a: int, b: int = 0) -> int:
    return a + b


add(2, b=3)        # checker still knows: (a: int, b: int = 0) -> int
# add("2")         # rejected, because P captured add's real parameters`, lang: 'python', title: '**P captures the whole parameter list' },
    py`\`**P\` declares a **ParamSpec**: a placeholder for an entire parameter list (names, types, defaults, keyword-only markers). \`Callable[P, R]\` is "a function taking P and returning R"; \`P.args\` and \`P.kwargs\` type the \`*args\`/\`**kwargs\` that forward them. Without it, decorators typed as \`Callable[..., Any]\` erase every signature they touch. See [decorators](lesson:decorators) and [advanced decorators](lesson:advanced-decorators).`,
    py`#### Variance: when is a \`Box[Dog]\` a \`Box[Animal]\`?`,
    py`A \`Dog\` is an \`Animal\`. Is a \`list[Dog]\` a \`list[Animal]\`? It feels like yes — but no, and here is the bug that the "no" prevents:`,
    { code: py`class Animal:
    pass


class Dog(Animal):
    def bark(self) -> str:
        return "Woof"


class Cat(Animal):
    pass


def adopt_cat(shelter: list[Animal]) -> None:
    shelter.append(Cat())          # fine: a Cat is an Animal


kennel: list[Dog] = [Dog()]
adopt_cat(kennel)                  # the checker rejects THIS line
for dog in kennel:
    print(dog.bark())              # otherwise: AttributeError on the Cat`, lang: 'python', title: 'why list[Dog] is not a list[Animal]' },
    { code: py`pets.py:19: error: Argument 1 to "adopt_cat" has incompatible type "list[Dog]"; expected "list[Animal]"  [arg-type]
pets.py:19: note: "list" is invariant -- see https://mypy.readthedocs.io/en/stable/common_issues.html#variance
pets.py:19: note: Consider using "Sequence" instead, which is covariant`, lang: 'text', title: 'mypy' },
    py`A list can be **written to**. If a \`list[Dog]\` counted as a \`list[Animal]\`, any function could slip a \`Cat\` into your dogs. So \`list\` is **invariant**: \`list[Dog]\` and \`list[Animal]\` are simply different types.`,
    py`A \`Sequence\` is **read-only** — no \`append\`. Reading a \`Dog\` where you expected an \`Animal\` is always safe, so \`Sequence[Dog]\` *is* a \`Sequence[Animal]\`: \`Sequence\` is **covariant** (it "varies the same way" as its item type). Functions go the other way: a function that can feed *any* animal can certainly feed a dog, so \`Callable[[Animal], None]\` is accepted where \`Callable[[Dog], None]\` is expected — **contravariant** in its parameters.`,
    py`| variance | meaning | examples |
|---|---|---|
| covariant | \`X[Dog]\` is an \`X[Animal]\` | \`Sequence\`, \`tuple\`, \`frozenset\`, \`Iterable\`, \`Iterator\`, \`Mapping\` values, a \`Callable\`'s return type |
| invariant | no relation at all | \`list\`, \`dict\`, \`set\` — anything you can both read and write |
| contravariant | \`X[Animal]\` is an \`X[Dog]\` | a \`Callable\`'s parameter types |`,
    py`Rule of thumb: **accept read-only types** (\`Sequence\`, \`Iterable\`, \`Mapping\`) in parameters when you only read, and callers can pass more specific collections. With the 3.12+ syntax, checkers **infer** the variance of your own class's type parameters from how you use them; with the old spelling you declare it (\`TypeVar("T_co", covariant=True)\`).`,
    py`#### The older spelling (Python 3.11 and earlier)`,
    { code: py`from collections.abc import Callable, Sequence, Sized
from typing import Generic, ParamSpec, TypeVar

T = TypeVar("T")                          # the string must match the variable name
S = TypeVar("S", str, bytes)              # constraints
L = TypeVar("L", bound=Sized)             # bound
T_co = TypeVar("T_co", covariant=True)    # variance declared by hand
P = ParamSpec("P")
R = TypeVar("R")


def first(items: Sequence[T]) -> T:       # T is "bound" to this function by being used here
    return items[0]


class Stack(Generic[T]):                  # inherit Generic[T] to make the class generic
    def __init__(self) -> None:
        self._items: list[T] = []


def logged(func: Callable[P, R]) -> Callable[P, R]:
    return func`, lang: 'python', title: 'TypeVar, Generic and ParamSpec' },
    { callout: 'version', title: 'Which Python versions?', text: py`The \`[T]\` syntax and the \`type\` statement are **3.12+** (PEP 695) — on 3.11 or older they are a \`SyntaxError\`, so libraries that support older versions still use \`TypeVar\`. ParamSpec arrived in **3.10** (PEP 612). Default values for type parameters (\`class Box[T = int]\`) are **3.13+** (PEP 696). Both spellings mean the same thing to type checkers, and recent mypy and pyright releases understand both.` },
  ],
  walkthrough: {
    title: 'Reading the generic toolbox line by line',
    lang: 'python',
    code: TOOLBOX,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [4, 6], text: py`\`first[T]\` declares one type parameter. It appears three times — items, default and result — so a checker knows \`first(songs, "silence")\` returns a \`str\` and \`first([], 0)\` returns an \`int\`.` },
      { lines: [9, 14], text: py`Two type parameters: \`T\` (the items) and \`K\` (whatever \`key\` returns). The return type \`dict[K, list[T]]\` says "keys come from the key function, values are lists of the original items". The local \`groups\` is annotated because an empty \`{}\` gives the checker nothing to infer from.` },
      { lines: [17, 21], text: py`A generic class. \`T\` belongs to the whole class: \`_items\` is a \`list[T]\`, so every method agrees on the item type.` },
      { lines: [23, 27], text: py`\`push\` takes a \`T\`, \`pop\` returns a \`T\`. On a \`Stack[str]\`, a checker rejects \`push(42)\` and knows \`pop()\` gives a \`str\`. Because \`T\` is both written and read, the class is *invariant* in \`T\`.` },
      { lines: [33, 37], text: py`A generic alias made by the \`type\` statement: \`Pair[float]\` means \`tuple[float, float]\`. The name documents the intent ("two of the same thing").` },
      { lines: [41, 43], text: py`Three calls, three different solutions: \`T = str\`; \`T = int\` (from the default \`0\`, since \`[]\` says nothing); \`T = str, K = int\` (\`len\` returns an int).` },
      { lines: [45, 48], text: py`\`Stack[str]()\` picks \`T\` explicitly. At runtime this is an ordinary \`Stack\`; nothing stops a non-str — that's the checker's job.` },
      { lines: [51], text: py`Type parameters are real runtime objects. \`__type_params__\` holds them; \`Pair.__value__\` is the alias's (lazily evaluated) definition.` },
    ],
  },
  playground: {
    title: 'A generic toolbox',
    objective: 'Run it, then add your own generic function, method and bounded type parameter — and prove that Python never enforces any of it.',
    files: { 'main.py': TOOLBOX },
    expected: py`Six lines:

\`\`\`text
Intro
0
{5: ['Intro'], 4: ['Halo', 'Hymn'], 3: ['Run']}
delete word | 1 left
(1.25, 9.0)
(T,) (T,) tuple[T, T]
\`\`\`

The last line shows that type parameters are ordinary objects Python stores — and nothing more. Switch to the **Simplified checker** variant to watch a toy version of what mypy and pyright do with them.`,
    experiments: [
      {
        id: 'last',
        task: py`Add a generic function \`last[T](items: Sequence[T], default: T) -> T\` that returns the **last** item, or \`default\` when \`items\` is empty. Print \`last(songs, "silence")\`.`,
        hint: py`Copy \`first\` and change the index: \`return items[-1] if items else default\`. Keep the \`[T]\` after the name.`,
        tests: [
          { name: 'last() exists and works', code: py`assert callable(ns.get('last')), 'Define a function named last()'
assert last(["a", "b", "c"], "z") == "c" and last([], 0) == 0` },
          { name: 'last declares a type parameter used in the return type', code: py`import typing
assert len(getattr(last, '__type_params__', ())) == 1, 'Declare one type parameter: def last[T](...)'
assert typing.get_type_hints(last).get('return') is last.__type_params__[0], 'The return hint should be T'` },
        ],
        explain: py`\`last\` has the same *shape* as \`first\`, so the same type parameter pattern works: T links the items, the default and the result. A checker now knows \`last(songs, "silence")\` is a \`str\` — try \`.upper()\` on it in your editor.`,
      },
      {
        id: 'peek',
        task: py`Give \`Stack\` a \`peek(self) -> T\` method that returns the top item **without** removing it.`,
        hint: py`The top is the last list element: \`return self._items[-1]\`. Annotate the return as \`T\` — the class's type parameter is visible in every method.`,
        tests: [
          { name: 'peek returns the top item and leaves it there', code: py`s = Stack()
s.push("a")
s.push("b")
assert hasattr(s, 'peek'), 'Add a peek() method to Stack'
assert s.peek() == "b" and len(s) == 2` },
          { name: 'peek is annotated -> T', code: py`import typing
assert typing.get_type_hints(Stack.peek).get('return') is Stack.__type_params__[0], 'Annotate peek with -> T'` },
        ],
        explain: py`Methods share the class's \`T\`, so a checker knows \`undo.peek()\` returns a \`str\` on a \`Stack[str]\` and an \`int\` on a \`Stack[int]\` — one implementation, precise types everywhere.`,
      },
      {
        id: 'bounded',
        task: py`Write \`longest[T: Sized](items: Iterable[T]) -> T\` that returns the item with the greatest \`len()\`. Add \`Sized\` to the import on line 1, then print \`longest(songs)\`.`,
        hint: py`\`max(items, key=len)\` does the work. The bound goes inside the brackets: \`def longest[T: Sized](items: Iterable[T]) -> T:\`.`,
        tests: [
          { name: 'longest() returns the longest item', code: py`assert callable(ns.get('longest')), 'Define a function named longest()'
assert longest(["Run", "Intro", "Halo"]) == "Intro"
assert longest([[1], [1, 2, 3], []]) == [1, 2, 3]` },
          { name: 'T is bounded by Sized', code: py`import collections.abc, typing
params = getattr(longest, '__type_params__', ())
bound = params[0].__bound__ if params else None
assert bound is collections.abc.Sized or typing.get_origin(bound) is collections.abc.Sized, 'Write def longest[T: Sized](...) with Sized from collections.abc'` },
        ],
        explain: py`The bound says "T can be any type that has \`len()\`" — strings, lists, your own classes with \`__len__\`. Inside the function a checker allows \`len(item)\`; outside, \`longest([10, 200])\` is rejected because \`int\` isn't \`Sized\`. And the result keeps its precise type: \`longest(songs)\` is a \`str\`, not just "something Sized".`,
      },
      {
        id: 'erasure',
        task: py`Prove that type parameters are erased: at the end, call \`undo.push(404)\` (an int on a \`Stack[str]\`!), then \`print(undo.pop() + 1)\` and \`print(undo.__orig_class__)\`.`,
        hint: py`Three lines at the very end of the file. Predict: does Python complain?`,
        tests: [
          { name: 'the int went through and came back out', code: py`assert '405' in output, 'Push 404, then print(undo.pop() + 1)'` },
          { name: 'printed the remembered Stack[str]', code: py`assert 'Stack[str]' in output, 'print(undo.__orig_class__)'` },
        ],
        explain: py`Python ran it happily and printed \`405\`. \`Stack[str]()\` remembers the \`[str]\` in \`__orig_class__\`, but nothing ever reads it. A checker would stop you at \`undo.push(404)\` with \`Argument 1 to "push" of "Stack" has incompatible type "int"; expected "str"\` — generics are a promise to tools, not a runtime lock.`,
      },
    ],
    variants: [
      { id: 'solver', label: 'Simplified checker: solving T', files: { 'main.py': SOLVER } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'How a type checker solves T',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'call', label: 'first(songs, "silence")', note: 'list[str], str', x: 130, y: 60, tone: 'yellow' },
        { id: 'sig', label: 'first[T]', note: 'items: Sequence[T], default: T', x: 400, y: 60, tone: 'paper' },
        { id: 'solve', label: 'T = str', note: 'for this call only', x: 650, y: 60, tone: 'blue' },
        { id: 'ret', label: '-> str', note: 'T replaced in the return type', x: 650, y: 210, tone: 'blue' },
        { id: 'ok', label: 'word.upper()', note: 'allowed', x: 400, y: 165, tone: 'paper' },
        { id: 'bad', label: 'word + 1', note: 'error: str + int', x: 400, y: 275, tone: 'red' },
        { id: 'runtime', label: 'Python at runtime', note: 'just runs the body', x: 130, y: 220, tone: 'kraft' },
      ],
      edges: [
        { from: 'call', to: 'sig', label: 'line up' },
        { from: 'sig', to: 'solve', label: 'solve' },
        { from: 'solve', to: 'ret', label: 'substitute' },
        { from: 'ret', to: 'ok', label: 'check' },
        { from: 'ret', to: 'bad', label: 'check' },
        { from: 'call', to: 'runtime', label: 'runs anyway', dashed: true },
      ],
      steps: [
        { focus: ['call'], text: py`A type checker reaches \`word = first(songs, "silence")\`. From earlier lines it already knows \`songs\` is a \`list[str]\` and \`"silence"\` is a \`str\` — without running anything.` },
        { focus: ['call', 'sig'], edges: ['call->sig'], text: py`It lines the arguments up with the parameters: \`list[str]\` against \`Sequence[T]\` suggests T = str; \`str\` against \`T\` suggests T = str.` },
        { focus: ['solve'], edges: ['sig->solve'], text: py`The clues agree: **T = str**, for this call only. In \`first([3, 1], 0)\` T is \`int\`. If clues disagree — \`first([3], "none")\` — the checker widens T to a type that fits both, such as \`object\` or \`int | str\` (mypy and pyright choose differently).` },
        { focus: ['solve', 'ret'], edges: ['solve->ret'], text: py`It substitutes the answer into the return type: \`-> T\` becomes \`-> str\`, so \`word\` is a \`str\`.` },
        { focus: ['ok', 'bad'], edges: ['ret->ok', 'ret->bad'], text: py`Every later use is checked against \`str\`: \`word.upper()\` is fine; \`word + 1\` is reported as \`Unsupported operand types for + ("str" and "int")\`.` },
        { focus: ['runtime'], edges: ['call->runtime'], text: py`None of this happens when the program runs. Python calls \`first\` like any other function. The solving is done entirely by the checker, before you run anything — Python never even looks at T.` },
      ],
    },
    alt: 'Diagram: the call first(songs, "silence") with argument types list[str] and str is lined up with the signature first[T](items: Sequence[T], default: T). The checker solves T = str, substitutes it so the return type is str, then checks later uses: word.upper() is allowed and word + 1 is an error. A dashed arrow shows that Python at runtime just runs the body and ignores T.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A type variable is an ordinary Python object. When the \`def\` or \`class\` statement runs, Python creates a \`typing.TypeVar\` called \`T\` and stores it on the function or class in \`__type_params__\`. That's all Python does with it.`,
      { code: py`def first[T](items: list[T]) -> T:
    return items[0]


T = first.__type_params__[0]
print(type(T).__name__, T.__name__)   # TypeVar T
print(first.__annotations__)          # {'items': list[T], 'return': T}`, lang: 'python', title: 'T is just an object' },
      py`The *meaning* of T — "the item type, decided per call" — exists only in the type checker. It reads the source, solves T for each call, and reports mismatches. At runtime the type arguments are **erased**: \`Stack[str]()\` builds a normal \`Stack\`, and \`isinstance(s, Stack[str])\` raises \`TypeError\` because Python has no idea what's inside. Use \`isinstance(s, Stack)\`.`,
    ],
    technical: [
      py`#### Annotation scopes (PEP 695)`,
      py`\`def first[T]\` doesn't put \`T\` in the module's globals. The compiler creates a hidden *annotation scope* that holds \`T\` and wraps the function or class definition. That's why \`T\` is a \`NameError\` outside, and why two functions can each have their own \`T\` (they are different objects). With the old spelling, one module-level \`T = TypeVar("T")\` was shared by every function that mentioned it, and its scope had to be worked out from usage — a common source of confusion that PEP 695 removed.`,
      py`Bounds and constraints are evaluated **lazily**: \`def f[T: SomeLaterClass](...)\` works even if the class is defined further down; the expression runs only when someone reads \`T.__bound__\`. The same goes for \`type\` aliases: \`Pair.__value__\` is computed on first access, which is what makes recursive aliases like \`type Tree[T] = T | list[Tree[T]]\` possible.`,
      py`#### What a generic class really is`,
      { code: py`import typing


class Box[T]:
    def __init__(self, item: T) -> None:
        self.item = item


print(Box.__mro__)              # (Box, typing.Generic, object): Generic was added for you
print(Box.__orig_bases__)       # (typing.Generic[T],)
b = Box[int]("hi")
print(b.__orig_class__)         # __main__.Box[int]   (remembered, never checked)
print(typing.get_args(b.__orig_class__))   # (<class 'int'>,)`, lang: 'python', title: 'Generic, __orig_bases__ and __orig_class__' },
      py`\`Box[int]\` returns a *generic alias* object; calling it creates a plain \`Box\` and then tries to set \`__orig_class__\` on the instance (silently skipped if the class uses \`__slots__\`). The \`type\` statement creates a \`typing.TypeAliasType\` with \`__name__\`, \`__type_params__\` and a lazily computed \`__value__\`.`,
      py`#### Variance under the hood`,
      py`Old-style type variables are invariant unless you say otherwise — their repr shows it: \`~T\` (invariant), \`+T_co\` (covariant), \`-T_contra\` (contravariant). PEP 695 type parameters set \`__infer_variance__ = True\`: the checker inspects the class body. If T appears only in return types and read-only attributes, it is covariant; only in parameters, contravariant; both, or in a mutable attribute, invariant. Our \`Stack[T]\` is invariant (push takes T, pop returns T); a read-only \`Box\` that only had \`get() -> T\` would be covariant.`,
      py`#### The rest of the family`,
      { code: py`from collections.abc import Callable
from typing import Concatenate


def with_retries[**P, R](func: Callable[Concatenate[int, P], R]) -> Callable[P, R]:
    """func takes an extra leading 'attempt' int; the wrapper hides it."""
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(1, *args, **kwargs)
    return wrapper


def as_tuple[*Ts](*args: *Ts) -> tuple[*Ts]:    # TypeVarTuple (PEP 646, 3.11)
    return args


class Cache[K, V = str]:                         # default for V (PEP 696, 3.13)
    pass`, lang: 'python', title: 'Concatenate, TypeVarTuple and defaults' },
      py`\`Concatenate[int, P]\` adds (or, read the other way, removes) leading parameters. \`*Ts\` is a **TypeVarTuple** — any number of types, useful for typing things like \`zip\` or array shapes. Defaults let \`Cache[int]\` mean \`Cache[int, str]\`. All three are advanced tools; most code only ever needs plain \`T\`, a bound, and \`**P\` for decorators.`,
      { callout: 'note', title: 'CPython detail', text: py`\`Box[int]\` is cached: asking twice returns the same alias object in CPython. Calling through the alias (\`Box[int](...)\`) also does a little extra work to set \`__orig_class__\`, so hot loops usually write \`b: Box[int] = Box(...)\` instead. These are implementation details; the language only promises that the alias behaves like the class when called.` },
    ],
    production: [
      py`**Reach for a type parameter when a relationship matters**: the output type depends on the input type, two arguments must match, or a container's methods must agree. If \`T\` would appear only once, use \`object\` (accepts anything, forces narrowing) instead.`,
      py`**Bound by ability, not by class.** \`[T: Sized]\` or a bound that is a [protocol](lesson:protocols) (\`[T: SupportsClose]\`) accepts any class with the right methods — including ones you didn't write. typeshed (the stubs that describe the standard library) types \`max\`, \`min\` and \`sorted\` this way: their type variable is bound to "supports \`<\` or \`>\`", built from small protocols.`,
      py`**Need the type at runtime? Pass it.** Because type arguments are erased, \`load[T](path) -> T\` can't know what to build. The standard pattern is a \`type[T]\` parameter: \`def parse_as[T](raw: str, kind: type[T]) -> T\` — callers write \`parse_as("42", int)\` and the checker infers \`T = int\` from the class they passed. Dependency-injection containers and serializers use this everywhere.`,
      py`**Supporting older Pythons.** PEP 695 syntax is a \`SyntaxError\` before 3.12, so a library that supports 3.10/3.11 must use \`TypeVar\`/\`Generic\`. The \`typing_extensions\` package backports newer pieces (for example \`TypeVar\` with \`default=\`). Once your minimum version is 3.12, linters such as Ruff can flag old-style generics and suggest the new syntax.`,
      py`**Keep it readable.** Three nested type parameters in a public signature is a smell. Name complex types with a \`type\` alias, and prefer a small [protocol](lesson:protocols) or a plain union when the relationship isn't the point. Check everything in CI with [mypy or pyright](lesson:static-type-checking) — an unchecked generic signature is just decoration.`,
    ],
  },
  mistakes: [
    {
      title: 'Using Any where a type variable keeps the link',
      wrong: { code: py`from typing import Any


def first(items: list[Any]) -> Any:
    return items[0]


name = first(["ada", "ben"])
name.uppper()        # typo: the checker says nothing — Any switches checking off`, lang: 'python' },
      right: { code: py`def first[T](items: list[T]) -> T:
    return items[0]


name = first(["ada", "ben"])
name.uppper()        # error: "str" has no attribute "uppper"; maybe "upper"?  [attr-defined]`, lang: 'python' },
      explanation: py`\`Any\` means "don't check this". Everything that touches an \`Any\` result becomes unchecked too. A type variable carries the caller's real type through, so the checker keeps working on the result.`,
    },
    {
      title: 'A type variable that appears only once',
      wrong: { code: py`def log_value[T](value: T) -> None:
    print("value:", value)`, lang: 'python' },
      right: { code: py`def log_value(value: object) -> None:
    print("value:", value)`, lang: 'python' },
      explanation: py`A type variable is only useful when it *links* two places. Used once, it means "anything", which \`object\` already says more simply. Pyright warns about this: \`TypeVar "T" appears only once in generic function signature\`.`,
    },
    {
      title: 'Accepting list[...] when you only read',
      wrong: { code: py`class Animal:
    weight_kg: float = 10.0


class Dog(Animal):
    pass


def total_weight(animals: list[Animal]) -> float:
    return sum(a.weight_kg for a in animals)


kennel: list[Dog] = [Dog(), Dog()]
total_weight(kennel)      # error: incompatible type "list[Dog]"; expected "list[Animal]"`, lang: 'python' },
      right: { code: py`from collections.abc import Iterable


class Animal:
    weight_kg: float = 10.0


class Dog(Animal):
    pass


def total_weight(animals: Iterable[Animal]) -> float:
    return sum(a.weight_kg for a in animals)


kennel: list[Dog] = [Dog(), Dog()]
total_weight(kennel)      # OK: Iterable is covariant`, lang: 'python' },
      explanation: py`\`list\` is invariant because it can be written to. If your function only reads, say so with \`Iterable\`, \`Sequence\` or \`Mapping\` — they are covariant, so a list of any subtype is accepted.`,
    },
    {
      title: 'Mixing types that must match: union instead of constraints',
      wrong: { code: py`def concat(a: str | bytes, b: str | bytes) -> str | bytes:
    return a + b       # error: Unsupported operand types for + ("str" and "bytes")`, lang: 'python' },
      right: { code: py`def concat[S: (str, bytes)](a: S, b: S) -> S:
    return a + b       # OK: both are str, or both are bytes`, lang: 'python' },
      explanation: py`A union lets each argument independently be either type, so the checker must assume \`"tea" + b"pot"\` could happen. A constrained type variable says "pick **one** of these for the whole call", and the return type follows the pick.`,
    },
    {
      title: 'isinstance() with a parameterised generic',
      wrong: { code: py`class Stack[T]:
    pass


undo = Stack[str]()
print(isinstance(undo, Stack[str]))   # TypeError at runtime`, lang: 'python' },
      right: { code: py`class Stack[T]:
    pass


undo = Stack[str]()
print(isinstance(undo, Stack))        # True — check the class, not its parameters`, lang: 'python' },
      explanation: py`Type arguments are erased at runtime, so Python can't answer "is this a Stack *of str*?". It raises \`TypeError: Subscripted generics cannot be used with class and instance checks\`. Check the plain class, and if you really must, check the items yourself.`,
    },
    {
      title: 'Using the 3.12 syntax on an older Python',
      wrong: { code: py`# deployed on Python 3.11:
def first[T](items: list[T]) -> T:      # SyntaxError before 3.12
    return items[0]`, lang: 'python', static: true },
      right: { code: py`from typing import TypeVar

T = TypeVar("T")


def first(items: list[T]) -> T:
    return items[0]`, lang: 'python' },
      explanation: py`The \`[T]\` syntax and the \`type\` statement are grammar, not library features: an older interpreter can't even parse the file, so nothing in it runs. Match the spelling to the oldest Python you support (\`requires-python\` in pyproject.toml).`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: Subscripted generics cannot be used with class and instance checks`,
      cause: py`\`isinstance(x, Stack[str])\` (or \`issubclass\`) with type arguments. They are erased at runtime, so Python refuses to guess.`,
      fix: py`Check the bare class: \`isinstance(x, Stack)\`. Let the type checker handle the \`[str]\` part.`,
    },
    {
      symptom: py`error: Argument 1 to "adopt_cat" has incompatible type "list[Dog]"; expected "list[Animal]"  [arg-type]`,
      cause: py`Invariance: \`list\` can be written to, so \`list[Dog]\` is not a \`list[Animal]\`.`,
      fix: py`If the function only reads, annotate the parameter as \`Sequence[Animal]\` or \`Iterable[Animal]\`. If it really appends, the error just saved you from a bug — build a \`list[Animal]\` on purpose.`,
    },
    {
      symptom: py`error: Value of type variable "T" of "longest" cannot be "int"  [type-var]`,
      cause: py`The argument breaks the type variable's bound or constraints (here \`T: Sized\`, and \`int\` has no \`len()\`).`,
      fix: py`Pass a value of an allowed type, or widen the bound if the function genuinely supports more types.`,
    },
    {
      symptom: py`error: Need type annotation for "_items" (hint: "_items: list[<type>] = ...")  [var-annotated]`,
      cause: py`\`self._items = []\` in a generic class: an empty list gives the checker nothing to infer the item type from.`,
      fix: py`Annotate it with the class's type parameter: \`self._items: list[T] = []\`.`,
    },
    {
      symptom: py`NameError: name 'T' is not defined`,
      cause: py`A PEP 695 type parameter used outside its function or class — e.g. a helper function at module level that mentions \`T\`, or \`isinstance(x, T)\`.`,
      fix: py`Give that function its own type parameter (\`def helper[T](...)\`). Type parameters are scoped to the definition that declares them.`,
    },
    {
      symptom: py`SyntaxError on a line like def first[T](items: list[T]) -> T: (CI or a server runs Python 3.11 or older)`,
      cause: py`The \`[T]\` syntax and \`type\` statement need Python 3.12+.`,
      fix: py`Upgrade the runtime, or use \`TypeVar\` / \`Generic\` until your minimum supported version is 3.12.`,
    },
  ],
  bestPractices: [
    'Use a type parameter only when it links at least two places (inputs to output, or methods of one class); otherwise use object.',
    'Prefer the 3.12+ syntax (def f[T], class C[T], type A[T] = ...) once your minimum Python is 3.12; use TypeVar/Generic before that.',
    'Accept read-only, covariant types (Iterable, Sequence, Mapping) in parameters; return concrete types (list, dict).',
    'Bound type parameters by ability (Sized, a Protocol) rather than by a concrete base class.',
    'Use a constrained type variable (T: (str, bytes)) when arguments must all be the same one of a few types — not a union.',
    'Type decorators with ParamSpec ([**P, R] and Callable[P, R]) plus functools.wraps so signatures survive.',
    'Annotate empty containers inside generic classes (self._items: list[T] = []).',
    'When code needs the type at runtime, take a type[T] argument; never rely on erased type arguments.',
  ],
  useCases: [
    'Reusable containers: Stack[T], Queue[T], LRUCache[K, V], a Repository[Model].',
    'Helpers that return one of their inputs: first, last, max_by, pick_random, retry_until.',
    'Decorators that must keep the decorated function\'s exact signature (logging, timing, caching, retries).',
    'Result / Option style wrappers: Ok[T] | Err[E] that carry a typed payload.',
    'Factories and deserializers: parse_as[T](raw, kind: type[T]) -> T.',
  ],
  whenToUse: {
    use: [
      'The return type depends on the argument types (first, max, dict.get).',
      'Several arguments must share one type (concat of two strs, or two bytes).',
      'A class stores and returns items of one caller-chosen type.',
      'A decorator wraps functions of any signature and must not erase it.',
    ],
    avoid: [
      'The type variable would appear only once — use object.',
      'Only one concrete type is ever used — just write that type.',
      'Each argument may independently be one of several types — a union is clearer.',
      'You need to check the type at runtime — generics are erased; pass a type[T] or use isinstance on real classes.',
    ],
  },
  comparison: {
    title: 'The same generics, two spellings',
    headers: ['', 'PEP 695 syntax (3.12+)', 'TypeVar spelling (works on older versions too)'],
    rows: [
      ['generic function', 'def first[T](xs: list[T]) -> T', 'T = TypeVar("T") then def first(xs: list[T]) -> T'],
      ['generic class', 'class Stack[T]:', 'class Stack(Generic[T]):'],
      ['bound', 'def f[T: Sized](x: T) -> T', 'T = TypeVar("T", bound=Sized)'],
      ['constraints', 'def f[S: (str, bytes)](...)', 'S = TypeVar("S", str, bytes)'],
      ['ParamSpec', 'def deco[**P, R](f: Callable[P, R])', 'P = ParamSpec("P"); R = TypeVar("R")'],
      ['generic alias', 'type Pair[T] = tuple[T, T]', 'Pair: TypeAlias = tuple[T, T] (TypeAlias is deprecated since 3.12)'],
      ['variance', 'inferred by the checker', 'declared: TypeVar("T_co", covariant=True)'],
      ['scope of T', 'only the def / class that declares it', 'a module-level object, scope inferred from usage'],
    ],
    note: py`Type checkers treat both spellings the same way. Choose by your minimum supported Python version, and don't mix the two in one signature.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'generics-q1',
      type: 'mcq',
      prompt: py`In \`def first[T](items: list[T]) -> T\`, what does \`T\` stand for?`,
      options: [
        { text: 'A special built-in type that accepts any value, like Any', why: 'Any turns checking off. T is a placeholder that the checker fills in with the caller\'s real type, so checking stays on.' },
        'A placeholder for one specific type, chosen separately for each call based on the arguments',
        { text: 'A class that Python checks the list items against at runtime', why: 'Python never checks type parameters at runtime; they are erased.' },
        { text: 'The type tuple, abbreviated', why: 'T is just a conventional name for "a type". It could be called ItemT.' },
      ],
      answer: 1,
      explanation: py`\`T\` is a type variable. For \`first(["a", "b"])\` the checker solves \`T = str\` and therefore knows the result is a \`str\`; for \`first([1, 2])\` it solves \`T = int\`. Python itself only stores \`T\` in \`first.__type_params__\`.`,
    },
    {
      id: 'generics-q2',
      type: 'output',
      prompt: 'What does this print (Python 3.14)?',
      code: py`def first[T](items: list[T]) -> T:
    return items[0]


print(first(["a", "b"]), first([10, 20]))
print(first.__type_params__)`,
      options: [
        'a 10 then (T,)',
        { text: 'a 10 then (~T,)', why: '~T is how an old-style, invariant TypeVar("T") prints. PEP 695 parameters infer their variance, and their repr is just T.' },
        { text: 'a 10 then ()', why: 'The [T] after the name declares a type parameter, which is stored in __type_params__.' },
        { text: 'TypeError on the second call, because T was already bound to str', why: 'T is solved per call, and only by type checkers. At runtime nothing is bound or checked.' },
      ],
      answer: 0,
      explanation: py`Both calls just run the body. \`__type_params__\` is a tuple holding the \`TypeVar\` object the \`[T]\` created; PEP 695 type variables print as plain \`T\`.`,
    },
    {
      id: 'generics-q3',
      type: 'bug',
      prompt: 'mypy reports exactly one error in this file. Click the line it points to.',
      code: py`class Animal: ...
class Dog(Animal): ...
class Cat(Animal): ...


def adopt_cat(shelter: list[Animal]) -> None:
    shelter.append(Cat())


kennel: list[Dog] = [Dog(), Dog()]
adopt_cat(kennel)
print(len(kennel))`,
      answerLine: 11,
      explanation: py`\`list\` is invariant, so \`list[Dog]\` is not a \`list[Animal]\`: \`Argument 1 to "adopt_cat" has incompatible type "list[Dog]"; expected "list[Animal]"\`. And for good reason — the call would put a \`Cat\` into a list everyone believes holds only dogs. Line 7 is fine on its own: appending a \`Cat\` to a real \`list[Animal]\` is legal.`,
    },
    {
      id: 'generics-q4',
      type: 'fill',
      prompt: 'Complete the signature so a checker knows `apply_twice(str.strip, "  hi  ")` returns a `str` and `apply_twice(abs, -3)` returns an `int`.',
      code: py`from collections.abc import Callable


def apply_twice[___](func: Callable[[T], T], value: T) -> ___:
    return func(func(value))`,
      answer: [['T'], ['T']],
      explanation: py`Declare the type parameter in the brackets and use it for the result. \`T\` then links the function's input and output, the starting value and the return type.`,
    },
    {
      id: 'generics-q5',
      type: 'mcq',
      prompt: py`Given \`def concat[S: (str, bytes)](a: S, b: S) -> S: return a + b\`, which call does a type checker **reject**?`,
      options: [
        { text: 'concat("tea", "pot")', why: 'Both arguments are str, so S = str and the result is a str.' },
        { text: 'concat(b"tea", b"pot")', why: 'Both arguments are bytes, so S = bytes.' },
        'concat("tea", b"pot")',
        { text: 'concat("", "")', why: 'Empty strings are still str: S = str.' },
      ],
      answer: 2,
      explanation: py`Constraints mean S must be **exactly one** of \`str\` or \`bytes\` for the whole call. A str and a bytes can't both be S (mypy reports a \`[type-var]\` error). At runtime the call would crash anyway: \`can't concat bytes to str\`.`,
    },
    {
      id: 'generics-q6',
      type: 'mcq',
      prompt: py`A parameter is annotated \`readings: Sequence[float]\`. Which arguments does a type checker accept? (Select all that apply.)`,
      options: [
        'a list[int]',
        'a tuple[float, ...]',
        { text: 'a set[float]', why: 'A set is not a Sequence: it has no order and no indexing.' },
        { text: 'a str', why: 'A str is a Sequence[str], not a Sequence[float].' },
      ],
      answer: [0, 1],
      explanation: py`\`Sequence\` is read-only and therefore **covariant**: a sequence of a subtype is accepted. \`int\` is accepted where \`float\` is expected, so \`list[int]\` works. With \`list[float]\` as the annotation, a \`list[int]\` would be rejected (invariance).`,
    },
    {
      id: 'generics-q7',
      type: 'short',
      prompt: py`Why does \`isinstance(cache, LRUCache[str, int])\` raise a \`TypeError\`, while \`isinstance(cache, LRUCache)\` works?`,
      answer: py`Type arguments are erased at runtime: an \`LRUCache[str, int]\` is just an ordinary \`LRUCache\` object, with no record Python could use to verify what its keys and values are (checking every item would also be slow and unreliable for mutable containers). So Python refuses the parameterised check. \`isinstance\` with the plain class only checks the object's class, which Python does know. The \`[str, int]\` part is the type checker's job.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'swap-and-invert',
      title: 'Swap pairs and invert dicts',
      difficulty: 'intermediate',
      prompt: py`Write two generic functions using the 3.12+ syntax. Each needs **two** type parameters.

1. \`swap[A, B](pair: tuple[A, B]) -> tuple[B, A]\` returns the pair with its two items reversed: \`swap(("Ada", 36))\` → \`(36, "Ada")\`.
2. \`invert[K, V](mapping: Mapping[K, V]) -> dict[V, K]\` returns a **new** dict with keys and values swapped (if two keys share a value, the later key wins). It must not modify the input.

The tests check the behaviour **and** the hints: the type parameters must be named exactly \`A, B\` and \`K, V\`, and the return hints must be \`tuple[B, A]\` and \`dict[V, K]\`.`,
      files: {
        'main.py': py`from collections.abc import Mapping


def swap(pair):
    # TODO: make generic with [A, B] and return the pair reversed
    return pair


def invert(mapping):
    # TODO: make generic with [K, V] and return a new dict, values -> keys
    return {}


print(swap(("Ada", 36)))
print(invert({"tea": 1, "milk": 2}))
`,
      },
      hints: [
        'Two type parameters go in one bracket: def swap[A, B](pair: tuple[A, B]) -> tuple[B, A]:',
        'The body of swap is one line: return pair[1], pair[0]. For invert, a dict comprehension builds the new dict.',
        'def invert[K, V](mapping: Mapping[K, V]) -> dict[V, K]:\n    return {value: key for key, value in mapping.items()}',
      ],
      solution: {
        explanation: py`\`swap\` has two independent type parameters, so the checker can track *both* positions: \`swap(("Ada", 36))\` is a \`tuple[int, str]\`. \`invert\` takes the read-only \`Mapping\` (so a dict, a \`Counter\` or a \`MappingProxyType\` all work) and returns a concrete \`dict[V, K]\` — the swapped order in the hint documents exactly what the function does. The comprehension builds a fresh dict, so the input is untouched; later keys overwrite earlier ones for duplicate values.`,
        files: {
          'main.py': py`from collections.abc import Mapping


def swap[A, B](pair: tuple[A, B]) -> tuple[B, A]:
    return pair[1], pair[0]


def invert[K, V](mapping: Mapping[K, V]) -> dict[V, K]:
    return {value: key for key, value in mapping.items()}


print(swap(("Ada", 36)))
print(invert({"tea": 1, "milk": 2}))
`,
        },
      },
      tests: [
        { name: 'swap reverses a pair', code: py`assert swap(("Ada", 36)) == (36, "Ada")
assert swap((1, 2)) == (2, 1)` },
        { name: 'invert swaps keys and values', code: py`assert invert({"tea": 1, "milk": 2}) == {1: "tea", 2: "milk"}` },
        { name: 'invert does not modify its input', code: py`orders = {"tea": 1}
invert(orders)
assert orders == {"tea": 1}` },
        { name: 'swap is generic: [A, B] -> tuple[B, A]', code: py`import typing
params = getattr(swap, '__type_params__', ())
assert [p.__name__ for p in params] == ['A', 'B'], 'Declare def swap[A, B](...)'
A, B = params
assert typing.get_type_hints(swap).get('return') == tuple[B, A], 'The return hint should be tuple[B, A]'` },
        { name: 'invert is generic: [K, V] -> dict[V, K]', code: py`import typing
params = getattr(invert, '__type_params__', ())
assert [p.__name__ for p in params] == ['K', 'V'], 'Declare def invert[K, V](...)'
K, V = params
assert typing.get_type_hints(invert).get('return') == dict[V, K], 'The return hint should be dict[V, K]'` },
      ],
    },
    {
      id: 'typed-logging-decorator',
      title: 'A decorator that keeps its signature',
      difficulty: 'advanced',
      prompt: py`Turn \`logged\` into a properly typed decorator using a **ParamSpec**:

- Signature: \`def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]\`.
- Inside, define \`wrapper(*args: P.args, **kwargs: P.kwargs) -> R\` decorated with \`@functools.wraps(func)\`.
- Each call appends the tuple \`(func.__name__, args, kwargs)\` to the module-level list \`CALL_LOG\`, then returns \`func(*args, **kwargs)\` unchanged.

The tests check: results are unchanged, calls are recorded (e.g. \`("add", (2,), {"b": 3})\`), the wrapper keeps the name \`add\` and has \`__wrapped__\` (from \`functools.wraps\`), the type parameters are a \`ParamSpec\` named \`P\` and a \`TypeVar\` named \`R\`, and \`logged\`'s return hint is \`Callable[P, R]\`.`,
      files: {
        'main.py': py`import functools
from collections.abc import Callable

CALL_LOG: list[tuple[str, tuple, dict]] = []


def logged(func):
    # TODO: type with [**P, R], wrap func, record each call in CALL_LOG
    return func


@logged
def add(a: int, b: int = 0) -> int:
    return a + b


@logged
def greet(name: str, *, shout: bool = False) -> str:
    text = f"Hello, {name}"
    return text.upper() if shout else text


print(add(2, b=3))
print(greet("Ada", shout=True))
print(CALL_LOG)
`,
      },
      hints: [
        'Start with the outer signature: def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:',
        'Define wrapper inside logged, put @functools.wraps(func) on it, append to CALL_LOG, call func, and finally return wrapper (not func).',
        '    @functools.wraps(func)\n    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:\n        CALL_LOG.append((func.__name__, args, kwargs))\n        return func(*args, **kwargs)\n    return wrapper',
      ],
      solution: {
        explanation: py`\`**P\` captures the decorated function's entire parameter list and \`R\` its return type. Because the decorator returns \`Callable[P, R]\` — the same P and R — a checker still knows that \`add\` takes \`(a: int, b: int = 0)\` and returns \`int\`, so \`add("2")\` is rejected and autocomplete still shows the real parameters. \`P.args\`/\`P.kwargs\` tell the checker that \`wrapper\` forwards exactly those arguments. \`functools.wraps\` copies the name, docstring and annotations at runtime and sets \`__wrapped__\`, so tools such as \`inspect.signature\` also see the original. The type hints change nothing at runtime; \`wraps\` and the body do the real work.`,
        files: {
          'main.py': py`import functools
from collections.abc import Callable

CALL_LOG: list[tuple[str, tuple, dict]] = []


def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        CALL_LOG.append((func.__name__, args, kwargs))
        return func(*args, **kwargs)
    return wrapper


@logged
def add(a: int, b: int = 0) -> int:
    return a + b


@logged
def greet(name: str, *, shout: bool = False) -> str:
    text = f"Hello, {name}"
    return text.upper() if shout else text


print(add(2, b=3))
print(greet("Ada", shout=True))
print(CALL_LOG)
`,
        },
      },
      tests: [
        { name: 'decorated functions still return the right values', code: py`assert add(2, b=3) == 5
assert greet("Ada") == "Hello, Ada" and greet("Ada", shout=True) == "HELLO, ADA"` },
        { name: 'every call is recorded in CALL_LOG', code: py`assert ("add", (2,), {"b": 3}) in CALL_LOG, 'Append (func.__name__, args, kwargs) to CALL_LOG on every call'
assert ("greet", ("Ada",), {"shout": True}) in CALL_LOG` },
        { name: 'functools.wraps keeps the name and sets __wrapped__', code: py`assert add.__name__ == "add"
assert hasattr(add, '__wrapped__'), 'Use @functools.wraps(func) on the wrapper'` },
        { name: 'logged declares [**P, R]', code: py`import typing
params = getattr(logged, '__type_params__', ())
assert len(params) == 2, 'Declare def logged[**P, R](...)'
P, R = params
assert isinstance(P, typing.ParamSpec) and P.__name__ == 'P', 'The first type parameter should be **P'
assert isinstance(R, typing.TypeVar) and R.__name__ == 'R'` },
        { name: 'logged returns Callable[P, R]', code: py`import collections.abc, typing
P, R = logged.__type_params__
ret = typing.get_type_hints(logged).get('return')
assert typing.get_origin(ret) is collections.abc.Callable and typing.get_args(ret) == (P, R), 'Annotate the return as Callable[P, R]'` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'generics-why-not-any',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What problem do generics solve? Why not just annotate a reusable function with Any?',
      answer: 'Generics let one function or class work with many types while keeping the relationship between them — e.g. "the return type is the element type". Any accepts everything but also switches checking off for the result, so mistakes downstream go unnoticed.',
      explanation: py`With \`def first(items: list[Any]) -> Any\`, the result of \`first(names)\` is \`Any\`, so \`first(names) + 1\` or a typo like \`.uppper()\` passes the checker. With \`def first[T](items: list[T]) -> T\` the checker solves \`T = str\` per call and keeps checking. The alternative to Any — one copy per type — is duplication.`,
      code: { lang: 'python', code: py`def first[T](items: list[T]) -> T:
    return items[0]


name = first(["ada", "ben"])   # checker: str
count = first([3, 1, 2])       # checker: int` },
      whyAsked: 'Checks that you understand what a type variable buys you, not just its syntax.',
      mistakes: ['Saying generics make Python check types at runtime', 'Treating Any and a TypeVar as interchangeable', 'Not mentioning that the checker solves T per call'],
      followUps: ['When would you use object instead of a TypeVar?', 'How does a checker infer T when two arguments disagree?', 'What does the [T] syntax require in terms of Python version?'],
      modelAnswer: 'Generics solve the problem of writing one piece of code that works for many types without losing type information. A type variable like T is a placeholder that the type checker fills in separately for every call, so first of a list of strings is known to return a string. If I used Any instead, the function would accept everything but the result would also be Any, which turns checking off for everything downstream — a typo or a str-plus-int bug would sail through. The other option, one function per type, is just duplication. So I use a type variable whenever the output type depends on the input type, and object when I accept anything but do not return it.',
    },
    {
      id: 'generics-bound-vs-constraints',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What is the difference between a bounded type variable `[T: Sized]` and a constrained one `[S: (str, bytes)]`? When do you use each?',
      answer: 'A bound accepts the bound type or any subtype, and T becomes the precise argument type. Constraints accept exactly one of the listed types per call, and S becomes one of those types. Use a bound for "anything with this ability"; constraints for a few unrelated types that must not be mixed.',
      explanation: py`\`longest[T: Sized](a: T, b: T) -> T\` called with two lists returns \`list[int]\` — the precise type survives. \`concat[S: (str, bytes)](a: S, b: S) -> S\` called with a \`str\` subclass returns plain \`str\`, and mixing str with bytes is rejected. A union (\`str | bytes\`) is different again: each argument may independently be either, so \`a + b\` can't be type-checked safely.`,
      code: { lang: 'python', code: py`from collections.abc import Sized


def longest[T: Sized](a: T, b: T) -> T:
    return a if len(a) >= len(b) else b


def concat[S: (str, bytes)](a: S, b: S) -> S:
    return a + b` },
      whyAsked: 'Bounds vs constraints is a classic source of confusion and shows whether you can choose the right tool.',
      mistakes: ['Thinking constraints mean "any subtype of these"', 'Using a union where the arguments must match', 'Trying to write a single constraint'],
      followUps: ['Why is a protocol often a good bound?', 'What does mypy report when an argument violates a bound?', 'How would you write these with the TypeVar spelling?'],
      modelAnswer: 'A bound says T can be the bound type or any subtype of it, and T keeps the precise type of the argument — longest of two lists returns a list of ints, not just something Sized. Constraints say T must be exactly one of a fixed list of types for the whole call, and the result is one of those listed types. I use a bound when I care about an ability, often expressed as a protocol, like "has len" or "supports less-than". I use constraints for a small set of unrelated types that must not be mixed, the classic case being str or bytes in a concat function. A union would be wrong there, because it lets the caller mix a str and bytes and the addition would crash.',
    },
    {
      id: 'generics-variance',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain variance. Why is `list[Dog]` not a `list[Animal]`, but `Sequence[Dog]` is a `Sequence[Animal]`? What about `Callable[[Animal], None]`?',
      answer: 'Variance describes how subtyping of the item type carries over to the container. list is invariant because it is mutable: treating list[Dog] as list[Animal] would let code append a Cat. Sequence is read-only, so it is covariant. Callable is contravariant in its parameters: a function that accepts any Animal can be used where a function accepting a Dog is expected.',
      explanation: py`Reading is safe in the covariant direction (a Dog read as an Animal is fine); writing is safe in the contravariant direction (a function that handles any Animal can handle Dogs). Something that is both read and written, like \`list\`, \`dict\` or \`set\`, must be invariant. With PEP 695 classes, checkers infer variance from how T is used; with \`TypeVar\` you declare \`covariant=True\` or \`contravariant=True\`.`,
      code: { lang: 'python', code: py`from collections.abc import Callable, Sequence


class Animal: ...
class Dog(Animal): ...


def count(pets: Sequence[Animal]) -> int:        # list[Dog] accepted: covariant
    return len(pets)


def feed(dogs: list[Dog], feeder: Callable[[Dog], None]) -> None:
    for dog in dogs:
        feeder(dog)


def feed_any(animal: Animal) -> None: ...
feed([Dog()], feed_any)                          # OK: contravariant parameter` },
      whyAsked: 'Variance errors are the most confusing type-checker messages in practice; explaining them clearly signals real typing experience.',
      mistakes: ['Saying list[Dog] is a list[Animal] "because Dog is an Animal"', 'Mixing up covariant and contravariant', 'Not connecting invariance to mutability'],
      followUps: ['Why is Mapping covariant in its values but not its keys?', 'How do PEP 695 classes get their variance?', 'Is tuple[Dog, ...] a tuple[Animal, ...]?'],
      modelAnswer: 'Variance is about whether a container of a subtype counts as a container of the supertype. A list is mutable, so if a list of Dogs counted as a list of Animals, a function could append a Cat and the caller would later call bark on it — that is why list, dict and set are invariant. Sequence has no write methods, and reading a Dog where you expect an Animal is always safe, so Sequence is covariant; that is why I annotate read-only parameters as Sequence or Iterable. Callables flip it for parameters: a function that can handle any Animal can be used where one that handles Dogs is expected, so they are contravariant in their arguments and covariant in their return type. With the 3.12 class syntax, the checker infers this from how T is used; with TypeVar you declare it.',
    },
    {
      id: 'generics-lru-cache',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement a generic `LRUCache[K, V]` with `__init__(capacity)`, `get(key) -> V | None` (marks the key as recently used), `put(key, value)` (evicts the least recently used entry when over capacity) and `__len__`. Use the 3.12+ syntax with type parameters named `K` and `V`.',
      answer: 'Store entries in an OrderedDict[K, V]; get moves the key to the end, put inserts/moves to the end and pops from the front (popitem(last=False)) when len exceeds capacity. Both operations are O(1).',
      explanation: py`\`OrderedDict\` remembers order and supports \`move_to_end\` and \`popitem(last=False)\` in constant time — exactly the two operations an LRU cache needs. The class is generic in K and V, so \`LRUCache[str, bytes]\` gives precise types for \`get\` and \`put\`. A production version would distinguish "missing" from "stored None" (a sentinel or raising \`KeyError\`) and might add locking for threads; \`functools.lru_cache\` already covers function memoisation.`,
      starter: { files: { 'main.py': py`from collections import OrderedDict


class LRUCache:
    # TODO: make generic with [K, V]; store entries in an OrderedDict
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._data = {}

    def get(self, key):
        return None

    def put(self, key, value) -> None:
        self._data[key] = value

    def __len__(self) -> int:
        return len(self._data)


cache = LRUCache(2)
cache.put("home", "<html>home</html>")
cache.put("about", "<html>about</html>")
cache.get("home")
cache.put("blog", "<html>blog</html>")    # evicts "about"
print(len(cache), cache.get("about"), cache.get("home"))
` } },
      tests: [
        { name: 'get returns stored values and None for missing keys', code: py`c = LRUCache(2)
c.put("a", 1)
assert c.get("a") == 1
assert c.get("zzz") is None` },
        { name: 'evicts the least recently used entry', code: py`c = LRUCache(2)
c.put("a", 1)
c.put("b", 2)
c.put("c", 3)
assert len(c) == 2 and c.get("a") is None and c.get("c") == 3` },
        { name: 'get refreshes recency', code: py`c = LRUCache(2)
c.put("a", 1)
c.put("b", 2)
c.get("a")
c.put("c", 3)
assert c.get("a") == 1 and c.get("b") is None` },
        { name: 'put on an existing key updates it and refreshes recency', code: py`c = LRUCache(2)
c.put("a", 1)
c.put("b", 2)
c.put("a", 10)
c.put("c", 3)
assert c.get("a") == 10 and c.get("b") is None and len(c) == 2` },
        { name: 'declared as class LRUCache[K, V]', code: py`assert [p.__name__ for p in getattr(LRUCache, '__type_params__', ())] == ['K', 'V'], 'Declare class LRUCache[K, V]:'` },
      ],
      solution: { files: { 'main.py': py`from collections import OrderedDict


class LRUCache[K, V]:
    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self._data: OrderedDict[K, V] = OrderedDict()

    def get(self, key: K) -> V | None:
        if key not in self._data:
            return None
        self._data.move_to_end(key)
        return self._data[key]

    def put(self, key: K, value: V) -> None:
        self._data[key] = value
        self._data.move_to_end(key)
        if len(self._data) > self.capacity:
            self._data.popitem(last=False)

    def __len__(self) -> int:
        return len(self._data)


cache = LRUCache[str, str](2)
cache.put("home", "<html>home</html>")
cache.put("about", "<html>about</html>")
cache.get("home")
cache.put("blog", "<html>blog</html>")    # evicts "about"
print(len(cache), cache.get("about"), cache.get("home"))
` } },
      hints: [
        'OrderedDict keeps insertion order; move_to_end(key) marks a key as most recent.',
        'popitem(last=False) removes the oldest entry. Do it in put when len(self._data) > self.capacity.',
        'class LRUCache[K, V]: with self._data: OrderedDict[K, V] = OrderedDict(), get -> V | None, put(key: K, value: V) -> None.',
      ],
      whyAsked: 'LRU cache is a staple interview problem; typing it generically shows you can combine data-structure skills with modern typing.',
      mistakes: ['Forgetting that get must refresh recency', 'Evicting before inserting, or evicting the newest entry', 'Using a list to track order (O(n) removals)', 'Leaving the cache untyped so get() returns Any'],
      followUps: ['How would you distinguish a stored None from a missing key?', 'How would you make it thread-safe?', 'When would you just use functools.lru_cache instead?'],
      modelAnswer: 'I would make the class generic over K and V and store entries in an OrderedDict, because it keeps order and supports move_to_end and popitem(last=False) in constant time. get checks membership, moves the key to the end to mark it as recently used and returns the value, or None if it is missing. put stores the value, moves it to the end and, if the size now exceeds the capacity, pops the oldest entry from the front. Typing it as LRUCache[K, V] means a checker knows cache.get returns a V or None for that particular cache. In production I would use a sentinel or raise KeyError so a stored None is distinguishable, and add a lock if threads share it.',
    },
    {
      id: 'generics-paramspec-decorator',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your team added `def timed(func: Callable[..., Any]) -> Callable[..., Any]` to dozens of service functions. Since then, editors show no parameter hints for those functions and the checker accepts calls with wrong arguments. What happened and how do you fix it?',
      answer: 'Callable[..., Any] erases the signature: every decorated function now looks like "takes anything, returns Any". Type the decorator with a ParamSpec and a TypeVar — def timed[**P, R](func: Callable[P, R]) -> Callable[P, R] — with a wrapper(*args: P.args, **kwargs: P.kwargs) -> R, and keep functools.wraps for runtime metadata.',
      explanation: py`A decorator's return annotation *replaces* the decorated function's type. \`Callable[..., Any]\` means "any arguments, unchecked result", so both argument checking and return-type checking vanish. A ParamSpec captures the original parameter list and the TypeVar the return type, and returning \`Callable[P, R]\` restores them. \`functools.wraps\` is the runtime half (name, docstring, \`__wrapped__\` for \`inspect.signature\`); the ParamSpec is the static half. If the decorator adds or removes parameters, \`Concatenate\` describes that.`,
      code: { lang: 'python', code: py`import functools
import time
from collections.abc import Callable


def timed[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__}: {time.perf_counter() - start:.4f}s")
    return wrapper` },
      whyAsked: 'Decorators are everywhere in production code; typing them badly silently disables checking across a codebase.',
      mistakes: ['Blaming the editor or the checker', 'Only adding functools.wraps (fixes runtime metadata, not static types)', 'Typing it as a TypeVar bound to Callable without explaining the trade-offs'],
      followUps: ['How would you type a decorator that injects a leading db argument?', 'How do you type a decorator that takes arguments, like @retry(times=3)?', 'What does functools.wraps do at runtime?'],
      modelAnswer: 'The decorator\'s return type replaces the decorated function\'s type, and Callable of dot-dot-dot to Any means "takes anything, returns Any" — so the real signatures were erased, which kills both autocomplete and argument checking. The fix is to type it with a ParamSpec for the parameters and a TypeVar for the return: def timed with type parameters **P and R, taking Callable of P, R and returning Callable of P, R. The inner wrapper takes *args typed P.args and **kwargs typed P.kwargs and returns R, so the checker knows it forwards exactly the original arguments. I keep functools.wraps, which handles the runtime side — name, docstring and __wrapped__ for introspection. If a decorator adds or removes a leading argument, Concatenate expresses that.',
    },
    {
      id: 'generics-runtime-erasure',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print on Python 3.14?',
      code: { lang: 'python', code: py`class Box[T]:
    def __init__(self, item: T) -> None:
        self.item = item


b = Box[int]("hello")
print(b.item, type(b).__name__, Box.__type_params__)` },
      options: [
        'TypeError: expected int, got str',
        'hello Box (T,)',
        'hello Box[int] (T,)',
        'hello Box ()',
      ],
      correctOption: 1,
      answer: '`hello Box (T,)` — type arguments are not checked or kept on the type: Box[int](...) builds a plain Box, and __type_params__ holds the declared T.',
      explanation: py`\`Box[int]\` is a generic alias; calling it creates an ordinary \`Box\` (and records \`Box[int]\` in \`b.__orig_class__\`). Nothing validates \`"hello"\` against \`int\`. \`type(b)\` is the plain class, and \`Box.__type_params__\` is the tuple of type parameter objects declared by \`[T]\`. A type checker would have flagged the call; Python does not.`,
      whyAsked: 'Tests whether you know where typing ends and runtime begins — crucial for not over-trusting annotations.',
      mistakes: ['Expecting a runtime TypeError', 'Thinking type(b) is Box[int]', 'Not knowing __type_params__ exists'],
      followUps: ['Where does Box[int] get remembered at runtime?', 'Why does isinstance(b, Box[int]) raise TypeError?', 'How would you validate the item type at runtime if you needed to?'],
      modelAnswer: 'It prints hello, Box, and a tuple containing T. Box of int is a generic alias: calling it builds an ordinary Box instance, and nothing checks that "hello" is an int — the type arguments are erased, although CPython does record the alias in b.__orig_class__. type(b) is just Box, and Box.__type_params__ holds the TypeVar the [T] syntax created. A type checker would flag the call before it ran, which is exactly the division of labour: generics are for static tools, and if I need runtime validation I add it explicitly, for example with an isinstance check or a validation library.',
    },
    {
      id: 'generics-supporting-old-pythons',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You maintain an open-source library that supports Python 3.10 to 3.14. A contributor opens a PR rewriting all generics with the `def f[T]` / `class C[T]` / `type` syntax. Do you merge it? What is your typing strategy?',
      answer: 'Not while 3.10/3.11 are supported: PEP 695 syntax is a SyntaxError there, so the package would not even import. Keep TypeVar/Generic/ParamSpec (and typing_extensions for newer features), run the type checker against the oldest and newest supported versions in CI, and plan the switch for when requires-python reaches 3.12.',
      explanation: py`New *syntax* can't be backported — the parser itself must understand it. New *library* features often can: \`typing_extensions\` provides newer typing names (for example \`TypeVar\` with defaults) for old interpreters. A good strategy: declare \`requires-python\`, configure the checker's \`python_version\` to the minimum, test in CI on the min and max versions, and when the minimum reaches 3.12, migrate mechanically (linters can flag old-style generics). Both spellings mean the same to checkers, so users see no difference.`,
      code: { lang: 'python', code: py`# library code that must import on Python 3.10+
from collections.abc import Callable, Sequence
from typing import Generic, ParamSpec, TypeVar

T = TypeVar("T")
P = ParamSpec("P")       # 3.10+
R = TypeVar("R")


def first(items: Sequence[T]) -> T:
    return items[0]


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []` },
      whyAsked: 'Shows awareness of the difference between syntax and library features, and of compatibility in real projects.',
      mistakes: ['Assuming from __future__ import or typing_extensions can enable the [T] syntax', 'Merging because "type checkers understand it"', 'Not running CI on the minimum supported version'],
      followUps: ['What does typing_extensions give you?', 'How do you tell mypy which Python version to check against?', 'When would you drop support for 3.11?'],
      modelAnswer: 'I would not merge it yet. The bracket syntax and the type statement are grammar, so on Python 3.10 or 3.11 the module would be a SyntaxError and the package would not even import — nothing like a future import or typing_extensions can fix new syntax. So the library keeps the TypeVar, Generic and ParamSpec spelling, which type checkers treat identically, and uses typing_extensions for newer typing features that do have backports. In CI I would run the checker with python_version set to the minimum and run tests on the oldest and newest interpreters. Once requires-python moves to 3.12, I would migrate in one mechanical change, with a linter flagging any leftovers.',
    },
  ],

  takeaways: [
    'A type variable (T) is a placeholder that a type checker fills in per call, keeping the link between input and output types — unlike Any, which switches checking off.',
    'Python 3.12+ syntax: def first[T](...), class Stack[T]:, type Pair[T] = tuple[T, T]; older code uses TypeVar, Generic and TypeAlias.',
    'Bound [T: Sized] = the bound or any subtype, T keeps the precise type; constraints [S: (str, bytes)] = exactly one of the listed types per call.',
    'Type decorators with ParamSpec — def deco[**P, R](f: Callable[P, R]) -> Callable[P, R] — plus functools.wraps, so signatures survive.',
    'Variance: list/dict/set are invariant (read and write); Sequence/Iterable/Mapping values are covariant; Callable parameters are contravariant. Accept read-only types when you only read.',
    'Type arguments are erased at runtime: Stack[str]() is a plain Stack, and isinstance(x, Stack[str]) raises TypeError. Pass type[T] when code needs the type at runtime.',
    'Use a type parameter only when it appears in at least two places; otherwise object says the same thing more simply.',
  ],
}

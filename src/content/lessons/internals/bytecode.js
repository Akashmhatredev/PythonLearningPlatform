// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const EXPLORER = py`# Bytecode explorer: follow one function from text to bytecode
import ast
import dis
import io
import tokenize

SOURCE = """
def line_total(price, qty):
    discount = 0.1
    return price * qty * (1 - discount)
"""

# 1. Tokens: the text cut into names, numbers and symbols
tokens = tokenize.generate_tokens(io.StringIO(SOURCE).readline)
words = [tok.string for tok in tokens if tok.string.strip()]
print("tokens:", " ".join(words))

# 2. AST: the grammatical structure of the code
tree = ast.parse(SOURCE)
func = tree.body[0]
print("AST:", type(func).__name__, func.name, "->",
      [type(stmt).__name__ for stmt in func.body])

# 3. Code object: what compile() produces
module_code = compile(SOURCE, "<shop>", "exec")
namespace = {}
exec(module_code, namespace)        # runs the def, which builds the function
line_total = namespace["line_total"]
code = line_total.__code__
print("co_varnames:", code.co_varnames)   # arguments first, then locals
print("co_consts:", code.co_consts)       # literal values the code needs
print("co_names:", code.co_names)         # global and attribute names

# 4. Bytecode: the instructions the evaluation loop runs (CPython 3.14)
dis.dis(line_total)
print("line_total(10, 3) =", line_total(10, 3))
`

export default {
  id: 'bytecode',
  title: 'Bytecode & how CPython runs your code',
  summary: 'CPython turns your source into tokens, then an abstract syntax tree, then code objects full of bytecode that a specializing evaluation loop executes — and knowing which of those steps are language guarantees and which are version-specific details tells you what is worth optimising.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['object-model', 'defining-functions', 'modules-and-imports'],
  related: ['object-model', 'memory-management', 'gil-and-free-threading', 'what-is-programming', 'scope', 'closures', 'profiling', 'performance', 'optimization-techniques', 'injection-attacks', 'packaging', 'modern-features'],
  tags: ['bytecode', 'dis', 'disassembler', 'ast', 'abstract syntax tree', 'tokenize', 'tokens', 'compile()', 'code object', '__code__', 'co_consts', 'co_names', 'co_varnames', 'evaluation loop', 'ceval', 'value stack', '.pyc', '__pycache__', 'py_compile', 'compileall', 'constant folding', 'specializing adaptive interpreter', 'PEP 659', 'JIT', 'PEP 744', 'python -O', 'CPython detail'],
  apis: [
    { name: 'tokenize.generate_tokens(readline)', summary: 'Splits Python source text into tokens (NAME, OP, NUMBER, STRING, NEWLINE…).' },
    { name: 'ast.parse(source)', summary: 'Parses source into an abstract syntax tree of ast.* nodes without running it.' },
    { name: 'ast.dump(node) / ast.unparse(node)', summary: 'Show a tree as text / turn a tree back into source code.' },
    { name: 'ast.literal_eval(text)', summary: 'Safely evaluates a string containing only Python literals (numbers, strings, lists, dicts…). Never runs code.' },
    { name: 'compile(source, filename, mode)', summary: 'Compiles source (or an AST) to a code object. mode is "exec", "eval" or "single"; optimize=1 behaves like python -O.' },
    { name: 'func.__code__', summary: 'The code object behind a function: co_varnames, co_consts, co_names, co_argcount, co_code…' },
    { name: 'dis.dis(x, adaptive=False)', summary: 'Prints the bytecode of a function, code object or source string. adaptive=True (3.11+) shows specialized instructions.' },
    { name: 'dis.get_instructions(x)', summary: 'Iterates over Instruction objects (opname, arg, argval, positions…) — the programmatic version of dis.dis.' },
    { name: 'py_compile.compile(path) / python -m compileall', summary: 'Write .pyc files into __pycache__ ahead of time.' },
    { name: 'importlib.util.MAGIC_NUMBER', summary: 'The 4 bytes at the start of every .pyc: they change whenever the bytecode format changes.' },
  ],
  docs: [
    { label: 'dis — Disassembler for Python bytecode', url: 'https://docs.python.org/3/library/dis.html' },
    { label: 'ast — Abstract Syntax Trees', url: 'https://docs.python.org/3/library/ast.html' },
    { label: 'tokenize — Tokenizer for Python source', url: 'https://docs.python.org/3/library/tokenize.html' },
    { label: 'Built-in functions — compile()', url: 'https://docs.python.org/3/library/functions.html#compile' },
    { label: 'Data model — code objects', url: 'https://docs.python.org/3/reference/datamodel.html#code-objects' },
    { label: 'Modules tutorial — “Compiled” Python files', url: 'https://docs.python.org/3/tutorial/modules.html#compiled-python-files' },
    { label: 'PEP 659 — Specializing Adaptive Interpreter', url: 'https://peps.python.org/pep-0659/' },
    { label: 'PEP 744 — JIT Compilation', url: 'https://peps.python.org/pep-0744/' },
    { label: 'PEP 552 — Deterministic pycs', url: 'https://peps.python.org/pep-0552/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Your computer's processor can't read Python. Something has to translate \`total = price * qty\` into steps a machine can carry out. In **CPython** — the standard interpreter, and the one running this playground — that happens in a pipeline:`,
    py`1. **Tokenizing**: the source text is cut into *tokens*, the "words" of the language: names, numbers, operators, indentation.
2. **Parsing**: the tokens are arranged into an **abstract syntax tree** (*AST*): a tree that records the structure — "an assignment whose value is a multiplication of two names".
3. **Compiling**: the AST is turned into **code objects**: packages of **bytecode** (a compact list of simple instructions such as "load this variable", "multiply the top two values") plus the constants and names those instructions need.
4. **Executing**: the **evaluation loop** — a big loop written in C — reads the bytecode one instruction at a time and does what each one says.`,
    py`Every stage can be inspected from Python: \`tokenize\`, \`ast\`, \`compile()\` and \`dis\` are all in the standard library. This lesson walks the whole pipeline, then looks at what modern CPython adds on top: cached \`.pyc\` files, compile-time **constant folding**, the **specializing adaptive interpreter** (3.11+) and the experimental **JIT** compiler (3.13+).`,
    { callout: 'note', title: 'Language vs implementation', text: py`The Python *language* defines what your code **means**. Tokens and the grammar are part of the language; the shape of \`ast\` nodes is close to it but can change between versions; **bytecode, \`.pyc\` files, \`dis\` output, specialization and the JIT are CPython implementation details** that change in every release. PyPy, GraalPy and MicroPython run the same Python with completely different machinery. Everything marked "CPython 3.14 output" below will look different on other versions.` },
  ],
  why: [
    py`**It demystifies errors and speed.** Why does a \`SyntaxError\` at the bottom of a file stop the top from running? Why is the same loop faster inside a function? Why did your code get faster when you upgraded from 3.10 to 3.11 without changing a line? Each answer lives in one stage of the pipeline.`,
    py`**It powers real tools.** Linters, formatters, type checkers and code-modification tools work on the AST. Coverage tools, debuggers and profilers hook into the evaluation loop. \`ast.literal_eval\` safely parses data that looks like Python. Knowing the pipeline means you can read and build such tools.`,
    py`**It tells you what *not* to optimise.** Once you see that \`24 * 60 * 60\` costs nothing at run time and that the interpreter specializes hot code by itself, you stop writing "clever" code to save instructions and start writing clear code — then measure (see [profiling](lesson:profiling)).`,
  ],
  eli15: [
    py`Imagine you write a recipe in English, but the kitchen robot only understands a tiny instruction set: *pick up*, *pour*, *stir*, *put down*.`,
    py`First someone reads your recipe word by word (**tokens**). Then they work out the grammar — which ingredient goes with which action (**the tree**). Then they rewrite it as a robot card: *pick up flour, pick up sugar, mix, put down in bowl* (**bytecode**). The robot just works through the card, one instruction at a time (**the evaluation loop**).`,
    py`The rewritten card is saved in a drawer (**the \`.pyc\` file**) so next time nobody has to translate the recipe again — unless you changed the recipe. And a clever robot notices "I always mix *flour* here" and keeps a faster, flour-only move ready (**specialization**).`,
  ],
  analogy: {
    title: 'A translator, a robot card and a drawer',
    body: [
      py`A human translator turns your recipe into a card of simple robot steps once. The robot follows the card, step by step, using a little tray to hold whatever it is currently working with. Translated cards go in a drawer, labelled with the robot model they were written for — a newer robot needs a new card.`,
      py`CPython does exactly that. The compiler is the translator, bytecode is the card, the evaluation loop is the robot, its tray is the *value stack*, and \`__pycache__\` is the drawer. The robot model on the label is the Python version in the \`.pyc\` file name.`,
    ],
    mapping: [
      ['reading the recipe word by word', 'tokenizing: tokenize'],
      ['understanding the grammar of each sentence', 'parsing into an AST: ast.parse'],
      ['writing the robot card', 'compiling to a code object: compile()'],
      ['the simple steps on the card', 'bytecode instructions: dis.dis'],
      ['the robot following the card', 'the evaluation loop (written in C)'],
      ['the tray holding ingredients in use', 'the value stack of a frame'],
      ['the drawer of translated cards', '__pycache__/*.pyc'],
      ['“for robot model 3.14” on the label', 'cpython-314 in the file name and the magic number inside'],
      ['a robot keeping a faster move for the usual ingredient', 'the specializing adaptive interpreter (3.11+)'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'From source text to running code',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'src', label: 'Source', note: 'cart.py: text', x: 95, y: 80, tone: 'yellow' },
        { id: 'tok', label: 'Tokens', note: 'NAME OP NUMBER…', x: 280, y: 80 },
        { id: 'ast', label: 'AST', note: 'a tree of nodes', x: 465, y: 80 },
        { id: 'code', label: 'Code object', note: 'bytecode + consts + names', x: 655, y: 80, tone: 'blue' },
        { id: 'pyc', label: '.pyc cache', note: '__pycache__/', x: 655, y: 255, tone: 'kraft' },
        { id: 'loop', label: 'Evaluation loop', note: 'runs instructions', x: 465, y: 255, tone: 'red' },
        { id: 'spec', label: 'Specialized', note: 'adaptive bytecode (3.11+)', x: 280, y: 255, tone: 'blue' },
        { id: 'jit', label: 'JIT', note: 'machine code (3.13+, opt-in)', x: 95, y: 255, tone: 'ink' },
      ],
      edges: [
        { from: 'src', to: 'tok', label: 'tokenize' },
        { from: 'tok', to: 'ast', label: 'parse' },
        { from: 'ast', to: 'code', label: 'compile' },
        { from: 'code', to: 'pyc', label: 'cache', dashed: true },
        { from: 'pyc', to: 'loop', label: 'load', dashed: true },
        { from: 'code', to: 'loop', label: 'execute' },
        { from: 'loop', to: 'spec', label: 'warm-up' },
        { from: 'spec', to: 'jit', label: 'hot code', dashed: true },
      ],
      steps: [
        { focus: ['src', 'tok'], edges: ['src->tok'], text: py`The **tokenizer** reads the text and produces tokens: \`NAME 'total'\`, \`OP '='\`, \`NAME 'price'\`… Indentation becomes \`INDENT\`/\`DEDENT\` tokens. You can watch it with the \`tokenize\` module.` },
        { focus: ['tok', 'ast'], edges: ['tok->ast'], text: py`The **parser** checks the grammar and builds an **AST**: \`Assign(targets=[Name('total')], value=BinOp(Name('price'), Mult(), Name('qty')))\`. A grammar mistake anywhere stops here with \`SyntaxError\` — before a single line has run.` },
        { focus: ['ast', 'code'], edges: ['ast->code'], text: py`The **compiler** works out which names are local, global or free (the *symbol table*), applies small optimisations such as constant folding, and emits a **code object** per module, function, class body and lambda.` },
        { focus: ['code', 'pyc'], edges: ['code->pyc'], text: py`For **imported** modules, CPython saves the compiled code in \`__pycache__/name.cpython-314.pyc\`. Next time, if the source hasn't changed, it skips straight to loading the cached code. (The script you run directly is not cached.)` },
        { focus: ['code', 'pyc', 'loop'], edges: ['code->loop', 'pyc->loop'], text: py`The **evaluation loop** executes the bytecode: fetch an instruction, perform it, move to the next. Each function call gets a *frame* with its own local variables and a small *value stack* for intermediate results.` },
        { focus: ['loop', 'spec'], edges: ['loop->spec'], text: py`Since **3.11** (PEP 659) the loop **specializes** instructions that run often: a generic \`BINARY_OP\` that keeps seeing two ints is rewritten in place to an int-only version. If the types change, it falls back. All automatic — no type hints involved.` },
        { focus: ['spec', 'jit'], edges: ['spec->jit'], text: py`**3.13+** includes an experimental **JIT** that can translate hot specialized code into machine code. It is off by default and not available in every build — here, in WebAssembly, \`sys._jit.is_available()\` is \`False\`.` },
      ],
    },
    alt: 'Diagram of eight boxes. Top row, left to right: Source, Tokens, AST, Code object, linked by arrows labelled tokenize, parse and compile. From Code object a dashed arrow labelled cache goes down to .pyc cache, and a dashed arrow labelled load goes from .pyc cache to Evaluation loop. A solid arrow labelled execute goes from Code object to Evaluation loop. The bottom row continues right to left: Evaluation loop, Specialized (adaptive bytecode, 3.11+) via warm-up, and a dashed arrow labelled hot code to JIT (machine code, 3.13+, opt-in).',
    caption: py`Solid arrows happen on every run; dashed ones are optional or cached. Only the first two stages (tokens and grammar) are defined by the language — everything from the code object down is how **CPython** chooses to do it.`,
  },
  syntax: [
    py`#### The pipeline, stage by stage`,
    py`| stage | what it is | inspect it with | defined by |
|---|---|---|---|
| tokens | names, numbers, operators, \`INDENT\`/\`DEDENT\` | \`tokenize\` | the language (lexical analysis) |
| AST | a tree of \`ast.*\` nodes | \`ast.parse\`, \`ast.dump\` | close to the grammar; node details can change between versions |
| code object | bytecode + constants + names | \`compile()\`, \`func.__code__\` | CPython detail |
| bytecode | instructions such as \`LOAD_FAST\`, \`BINARY_OP\` | \`dis.dis\`, \`dis.get_instructions\` | CPython detail, changes every version |
| \`.pyc\` | cached code objects on disk | \`py_compile\`, \`importlib.util\` | CPython detail |`,
    py`#### 1. Tokens`,
    { code: py`import io
import tokenize

source = "total = price * qty\n"
for tok in tokenize.generate_tokens(io.StringIO(source).readline):
    print(tokenize.tok_name[tok.type], repr(tok.string))
# NAME 'total', OP '=', NAME 'price', OP '*', NAME 'qty', NEWLINE '\n', ENDMARKER ''`, lang: 'python', title: 'tokenize: the words of the program' },
    py`#### 2. The abstract syntax tree`,
    { code: py`import ast

tree = ast.parse("total = price * qty + 2 * 3")
print(ast.dump(tree.body[0], indent=2))   # Assign(targets=[Name(id='total', ...)], value=BinOp(...))
print(ast.unparse(tree))                  # total = price * qty + 2 * 3

print(ast.literal_eval("[1, 2.5, {'qty': 3}]"))   # safe: literals only, never runs code`, lang: 'python', title: 'ast: parse without running' },
    py`\`ast.parse\` never executes anything, which is why linters can analyse code safely. Tools walk the tree with \`ast.NodeVisitor\` (read-only) or \`ast.NodeTransformer\` (rewrite nodes). \`ast.literal_eval\` uses the parser to read data such as \`"[1, 2]"\` without the danger of \`eval\` — see [injection attacks](lesson:injection-attacks).`,
    py`#### 3. Code objects`,
    { code: py`def line_total(price, qty):
    discount = 0.1
    return price * qty * (1 - discount)

code = line_total.__code__          # every function carries its code object
print(code.co_name)                 # line_total
print(code.co_argcount)             # 2
print(code.co_varnames)             # ('price', 'qty', 'discount'): arguments, then locals
print(code.co_consts)               # (0.1,) in CPython 3.14: constants the bytecode loads
print(code.co_names)                # (): names looked up globally or as attributes`, lang: 'python', title: 'what a function is made of' },
    py`| attribute | holds |
|---|---|
| \`co_varnames\` | local variable names (arguments first) — stored in fast, array-like slots |
| \`co_consts\` | constants: numbers, strings, \`None\`, nested code objects… |
| \`co_names\` | global names, attribute names and imported names |
| \`co_cellvars\` / \`co_freevars\` | variables shared with inner functions — the machinery of [closures](lesson:closures) |
| \`co_code\` | the raw bytecode as \`bytes\` |
| \`co_filename\`, \`co_firstlineno\` | where the code came from (used in tracebacks) |`,
    py`\`compile(source, filename, mode)\` builds a code object from text yourself: \`"exec"\` for a module or statements, \`"eval"\` for one expression, \`"single"\` for one interactive statement. \`exec()\` and \`eval()\` then run it. A module's code object contains the code objects of its functions in \`co_consts\`; the \`def\` statement wraps one in a function object at run time.`,
    py`#### 4. Reading bytecode with \`dis\``,
    { code: py`import dis

def line_total(price, qty):
    return price * qty

dis.dis(line_total)
for ins in dis.get_instructions(line_total):
    print(ins.opname, ins.argval)`, lang: 'python', title: 'disassemble a function' },
    { code: py`  3           RESUME                   0

  4           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (price, qty)
              BINARY_OP                5 (*)
              RETURN_VALUE`, lang: 'text', title: 'CPython 3.14 output (other versions differ)' },
    py`Read each line as *line number · instruction · argument · (what the argument means)*. \`LOAD_FAST_BORROW_LOAD_FAST_BORROW\` is a 3.14 *superinstruction* that pushes two local variables at once (older versions show two \`LOAD_FAST\` lines); \`BINARY_OP 5 (*)\` pops two values and pushes their product; \`RETURN_VALUE\` returns the top of the stack. \`RESUME\` marks the start of the function for the interpreter's bookkeeping.`,
    { callout: 'warn', title: 'Never depend on bytecode', text: py`The \`dis\` docs say it plainly: bytecode is an implementation detail of CPython, and instructions can be added, removed or changed between versions. Tests that assert on opcode names break on upgrade. If you need to analyse code, use the AST.` },
    py`#### 5. \`.pyc\` files and \`__pycache__\``,
    { code: py`python -m py_compile cart.py      # writes __pycache__/cart.cpython-314.pyc
python -m compileall src/         # compile a whole tree (e.g. when building an image)
python -B app.py                  # don't write .pyc files (same as PYTHONDONTWRITEBYTECODE=1)
python -O app.py                  # optimize=1: drops assert and if __debug__ blocks (.opt-1.pyc)`, lang: 'bash', title: 'creating and controlling the cache' },
    py`When you **import** a module, CPython looks for \`__pycache__/<module>.<tag>.pyc\`, where the tag (\`cpython-314\`) names the interpreter version. A \`.pyc\` starts with a 16-byte header: a **magic number** that changes whenever the bytecode format changes, flags, and either the source file's modification time and size or (PEP 552) a hash of the source. If the header doesn't match, the source is recompiled. Deleting \`__pycache__\` is always safe.`,
    py`#### Compile-time optimisations`,
    { code: py`import dis

def seconds_per_day():
    return 24 * 60 * 60        # folded at compile time

print([ins.argval for ins in dis.get_instructions(seconds_per_day)])
# CPython 3.14: [0, 86400, None] - the multiplications are gone`, lang: 'python', title: 'constant folding' },
    py`CPython folds expressions made only of constants (\`24 * 60 * 60\` → \`86400\`, \`"ab" + "cd"\` → \`"abcd"\`), within size limits so \`.pyc\` files don't explode. Note that \`x * 24 * 60\` is **not** folded: it means \`(x * 24) * 60\`, so no sub-expression is all-constant — \`x * (24 * 60)\` is. With \`-O\` (or \`compile(..., optimize=1)\`), \`assert\` statements and \`if __debug__:\` blocks are removed entirely; \`-OO\` also drops docstrings.`,
    { callout: 'version', title: 'How CPython got faster', text: py`**3.11**: the specializing adaptive interpreter (PEP 659) and "zero-cost" exceptions (a \`try\` block costs nothing until something is raised). **3.12**: list/dict/set comprehensions are inlined into the enclosing function (PEP 709) and \`sys.monitoring\` (PEP 669) gives tools cheaper hooks. **3.13**: an experimental JIT compiler (PEP 744), disabled by default. None of these changed what any program means.` },
  ],
  walkthrough: {
    title: 'Reading the bytecode explorer',
    lang: 'python',
    code: EXPLORER,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps inside the editor.`,
    steps: [
      { lines: [7, 11], text: py`The function lives in a **string**, so we can feed it to each stage of the pipeline ourselves instead of letting Python do it all at once.` },
      { lines: [14, 16], text: py`\`tokenize.generate_tokens\` cuts the text into tokens. We keep only the visible ones (newlines, indents and the end marker have empty or whitespace strings) and print them: \`def line_total ( price , qty ) : …\`.` },
      { lines: [19, 22], text: py`\`ast.parse\` builds the tree. The module's body holds one \`FunctionDef\` named \`line_total\`, whose own body holds two statements: an \`Assign\` and a \`Return\`. Nothing has run yet.` },
      { lines: [25, 28], text: py`\`compile()\` produces the **module's** code object. Running it with \`exec\` executes the \`def\` statement, which wraps the function's code object (stored in the module's \`co_consts\`) into a function object and binds the name \`line_total\` in \`namespace\`.` },
      { lines: [29, 32], text: py`The function's code object lists its local names (\`price\`, \`qty\`, \`discount\` — arguments first), its constants (\`0.1\`; the small int \`1\` is loaded by a special instruction in 3.14) and the global/attribute names it uses (none).` },
      { lines: [35, 36], text: py`\`dis.dis\` prints the instructions, grouped by source line. Read them as a stack machine: load \`price\` and \`qty\`, multiply, load \`1\` and \`discount\`, subtract, multiply, return. Then we call the function for real: \`27.0\`.` },
    ],
  },
  playground: {
    title: 'Bytecode explorer',
    objective: 'Run it, match each printed stage to the pipeline, then change the source and watch the code object and the bytecode change.',
    files: { 'main.py': EXPLORER },
    expected: py`CPython 3.14 output (the bytecode part differs on other versions):

\`\`\`text
tokens: def line_total ( price , qty ) : discount = 0.1 return price * qty * ( 1 - discount )
AST: FunctionDef line_total -> ['Assign', 'Return']
co_varnames: ('price', 'qty', 'discount')
co_consts: (0.1,)
co_names: ()
  2           RESUME                   0

  3           LOAD_CONST               0 (0.1)
              STORE_FAST               2 (discount)

  4           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (price, qty)
              BINARY_OP                5 (*)
              LOAD_SMALL_INT           1
              LOAD_FAST_BORROW         2 (discount)
              BINARY_OP               10 (-)
              BINARY_OP                5 (*)
              RETURN_VALUE
line_total(10, 3) = 27.0
\`\`\`

The line numbers start at 2 because \`SOURCE\` begins with a newline.`,
    experiments: [
      {
        id: 'fold',
        task: py`At the end of the file, define \`def day_seconds(): return 24 * 60 * 60\` and call \`dis.dis(day_seconds)\`. Is any multiplication left in the bytecode?`,
        hint: py`Look for a \`BINARY_OP\` line — or for the number 86400.`,
        tests: [
          { name: 'day_seconds() exists and returns 86400', code: py`assert callable(ns.get("day_seconds")), 'Define day_seconds()'
assert day_seconds() == 86400` },
          { name: 'the product was folded at compile time', code: py`import dis
values = [ins.argval for ins in dis.get_instructions(day_seconds)]
assert 86400 in values and "86400" in output, 'Disassemble day_seconds with dis.dis'` },
        ],
        explain: py`The compiler saw that \`24 * 60 * 60\` only involves constants and replaced it with \`86400\`, so the function just loads one constant and returns it. Writing the readable expression costs nothing at run time. (Folding is a CPython optimisation; it never changes the result.)`,
      },
      {
        id: 'shipping',
        task: py`Edit \`SOURCE\`: add a local variable \`shipping = 4.99\` and return \`price * qty * (1 - discount) + shipping\`. Predict the new \`co_varnames\` and \`co_consts\` before running.`,
        hint: py`Locals are listed after the arguments, in the order the compiler first meets them.`,
        tests: [
          { name: 'shipping is a local variable', code: py`assert "shipping" in line_total.__code__.co_varnames, 'Add shipping = 4.99 inside the function in SOURCE'` },
          { name: 'line_total(10, 3) includes shipping', code: py`assert line_total(10, 3) == approx(31.99)` },
        ],
        explain: py`\`co_varnames\` is now \`('price', 'qty', 'discount', 'shipping')\` and \`co_consts\` gains \`4.99\`. Each local gets a numbered slot, which is why the bytecode says \`STORE_FAST 3 (shipping)\`: "store into slot 3" — no dictionary lookup at all.`,
      },
      {
        id: 'assert-optimize',
        task: py`Add \`assert qty > 0, "qty must be positive"\` as the first line of the function body in \`SOURCE\` and run: the bytecode gains a comparison, a jump and \`RAISE_VARARGS\`. Then pass \`optimize=1\` to the \`compile()\` call — that's what \`python -O\` does — and run again.`,
        hint: py`\`compile(SOURCE, "<shop>", "exec", optimize=1)\`.`,
        tests: [
          { name: 'SOURCE contains the assert', code: py`assert "assert qty > 0" in SOURCE, 'Add the assert line to the function in SOURCE'` },
          { name: 'the assert vanished from the bytecode', code: py`assert "RAISE_VARARGS" not in output, 'Compile with optimize=1 so the assert is removed'` },
        ],
        explain: py`With \`optimize=1\` the compiler drops every \`assert\` statement — the check simply doesn't exist in the bytecode. That's why \`assert\` must never guard real input validation: a deployment running \`python -O\` silently loses the check. Use \`if ...: raise ValueError(...)\` for anything that must always happen.`,
      },
      {
        id: 'specialize',
        task: py`At the end, call \`line_total(10, 3)\` 1,000 times in a loop, then run \`dis.dis(line_total, adaptive=True)\`. Compare the instruction names with the first listing.`,
        hint: py`\`for _ in range(1000): line_total(10, 3)\` — then look for instruction names with extra suffixes such as \`_INT\` or \`_CHECK\`.`,
        tests: [{ name: 'specialized instructions are shown', code: py`assert "BINARY_OP_" in output or "RESUME_CHECK" in output, 'Warm the function up, then use dis.dis(line_total, adaptive=True)'` }],
        explain: py`After warm-up, CPython rewrote some generic instructions in place: for example \`BINARY_OP\` multiplying two ints becomes \`BINARY_OP_MULTIPLY_INT\`, and \`RESUME\` becomes \`RESUME_CHECK\`. These are CPython 3.14 names; the idea (PEP 659) is what matters: hot code is specialized for the types it actually sees, and falls back safely if the types change.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'The evaluation loop runs a stack machine',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'i1', label: 'LOAD_FAST price', x: 110, y: 35 },
        { id: 'i2', label: 'LOAD_FAST qty', x: 110, y: 89 },
        { id: 'i3', label: 'BINARY_OP *', x: 110, y: 143 },
        { id: 'i4', label: 'LOAD_FAST fee', x: 110, y: 197 },
        { id: 'i5', label: 'BINARY_OP +', x: 110, y: 251 },
        { id: 'i6', label: 'RETURN_VALUE', x: 110, y: 305 },
        { id: 'locals', label: 'Fast locals', note: 'price=3 qty=4 fee=5', x: 420, y: 90, tone: 'yellow' },
        { id: 'stack', label: 'Value stack', note: 'the frame’s tray', x: 420, y: 250, tone: 'blue' },
        { id: 'caller', label: 'Caller', note: 'receives 17', x: 670, y: 250, tone: 'paper' },
      ],
      edges: [
        { id: 'load', from: 'locals', to: 'stack', label: 'push a reference' },
        { id: 'ret', from: 'stack', to: 'caller', label: 'return top' },
      ],
      steps: [
        { focus: ['locals'], text: py`We call \`line_total(3, 4, 5)\` where the body is \`return price * qty + fee\`. The call creates a **frame**: the arguments sit in numbered *fast local* slots, and an empty **value stack** waits for intermediate results. (Instruction names are simplified; CPython 3.14 merges some of them.)` },
        { focus: ['i1', 'locals', 'stack'], edges: ['load'], text: py`\`LOAD_FAST price\` copies a reference from slot 0 onto the stack. Stack: \`[3]\`.` },
        { focus: ['i2', 'locals', 'stack'], edges: ['load'], text: py`\`LOAD_FAST qty\` pushes slot 1. Stack: \`[3, 4]\`.` },
        { focus: ['i3', 'stack'], text: py`\`BINARY_OP *\` pops two values, multiplies them (by calling the int type's multiply code) and pushes the result. Stack: \`[12]\`.` },
        { focus: ['i4', 'locals', 'stack'], edges: ['load'], text: py`\`LOAD_FAST fee\` pushes slot 2. Stack: \`[12, 5]\`.` },
        { focus: ['i5', 'stack'], text: py`\`BINARY_OP +\` pops both and pushes the sum. Stack: \`[17]\`. Notice there is no name for the intermediate \`12\` — it only ever lived on the stack.` },
        { focus: ['i6', 'stack', 'caller'], edges: ['ret'], text: py`\`RETURN_VALUE\` pops \`17\`, the frame is discarded, and the caller's own stack receives the value. The loop then continues with the **caller's** next instruction. That's the whole trick: fetch, execute, repeat.` },
      ],
    },
    alt: 'Diagram with six instruction boxes in a column on the left: LOAD_FAST price, LOAD_FAST qty, BINARY_OP *, LOAD_FAST fee, BINARY_OP +, RETURN_VALUE. On the right, a Fast locals box with price=3 qty=4 fee=5, a Value stack box, and a Caller box. Each step highlights one instruction: loads push values from the locals onto the stack, binary operations pop two values and push one result, and RETURN_VALUE passes 17 to the caller.',
    caption: py`Bytecode is a **stack machine**: instructions take their inputs from the top of the value stack and push their results back. Real instructions also carry inline caches for specialization — invisible here, visible with \`dis.dis(..., show_caches=True)\`.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`"Is Python compiled or interpreted?" — **both**. CPython first *compiles* your source to bytecode (fast, automatic, and invisible), then *interprets* that bytecode. It isn't compiled to machine code ahead of time like C, and it isn't re-reading your text line by line like a shell script.`,
      py`That explains a beginner puzzle: a \`SyntaxError\` on line 50 stops the file before line 1 runs. The whole file must be tokenized, parsed and compiled successfully first. Errors that happen *while running* (\`NameError\`, \`ZeroDivisionError\`…) only appear when the evaluation loop reaches that instruction.`,
      { code: py`print("start")
total = 10 / 0      # a runtime error: only raised when this line executes
print("never printed")`, lang: 'python', title: 'runtime errors happen when the instruction runs' },
      py`Why compile at all? Bytecode is much quicker to execute than text: names are resolved to slot numbers, constants are prepared once, and the structure is already worked out. It is also the same on Windows, macOS and Linux — the \`.pyc\` drawer works anywhere the same CPython version runs.`,
    ],
    technical: [
      py`**The compiler** (CPython detail). After parsing, CPython builds a *symbol table* that decides, for every name in every scope, whether it is local, global, or a free variable of a closure — this is where [the LEGB rule](lesson:scope) is decided, **at compile time**. That's why assigning to a name anywhere in a function makes it local everywhere in that function (and why reading it before the assignment raises \`UnboundLocalError\`). Code generation then emits instructions into a control-flow graph, an optimiser folds constants and removes dead jumps, and the result is assembled into a code object with its line-number table and **exception table** (since 3.11, \`try\` blocks are recorded in a table instead of setup instructions, so entering a \`try\` costs nothing).`,
      py`**The evaluation loop** (CPython detail). The heart of CPython is one C function, \`_PyEval_EvalFrameDefault\`, whose instruction implementations are written in a small DSL (\`Python/bytecodes.c\`, since 3.12) and generated into C. For each instruction it fetches the opcode and argument, jumps to the matching implementation, and runs it. Every call gets a frame holding the fast locals, the value stack and a pointer to the current instruction; since 3.11 these frames are lightweight structs and a full Python \`frame\` object is only built when someone asks for it (a traceback, \`sys._getframe\`, a debugger).`,
      py`**Specialization** (PEP 659, 3.11+). Many instructions are *adaptive*. After a code object has run a few times, each adaptive instruction records what it sees and rewrites itself into a **specialized** form — \`LOAD_ATTR_INSTANCE_VALUE\` for a plain instance attribute, \`BINARY_OP_ADD_INT\` for two ints, \`LOAD_GLOBAL_BUILTIN\` with a cached lookup. Each specialized instruction checks a cheap *guard* first (is it still an int? did the globals dict change?); if the guard fails it **deoptimizes** to the generic path and may re-specialize later. Results go in *inline caches* stored in the bytecode itself.`,
      { code: py`  3           RESUME_CHECK             0

  4           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (price, qty)
              BINARY_OP_MULTIPLY_INT   5 (*)
              RETURN_VALUE`, lang: 'text', title: 'dis.dis(line_total, adaptive=True) after many int calls — CPython 3.14 output' },
      py`**The JIT** (PEP 744, 3.13+). CPython's experimental JIT uses a technique called *copy-and-patch*: it stitches together pre-compiled machine-code templates for hot sequences of specialized instructions. In 3.13 it had to be enabled when building CPython; 3.14's official Windows and macOS installers include it but leave it **off** unless you set \`PYTHON_JIT=1\`. It is not recommended for production yet, and it never changes what code means. \`sys._jit.is_available()\` / \`is_enabled()\` (3.14, private API) report its status — in this WebAssembly playground it isn't available.`,
      { callout: 'note', title: 'Other implementations', text: py`**PyPy** compiles Python to its own bytecode and uses a *tracing JIT* that turns hot loops into machine code — often much faster for pure-Python loops. **GraalPy** runs on GraalVM and compiles hot code with the Graal JIT. **MicroPython** compiles to a compact bytecode of its own (precompiled \`.mpy\` files) for microcontrollers. **Pyodide**, which runs this playground, *is* CPython compiled to WebAssembly: same bytecode and \`dis\` output as CPython 3.14, but no JIT. Code that only relies on language behaviour runs on all of them; code that inspects bytecode doesn't.` },
    ],
    production: [
      py`**Write clear code; let the compiler and specializer work.** Constant expressions are folded, attribute and global lookups are cached by specialization, and old tricks such as \`def f(data, len=len):\` save little on modern CPython while hurting readability. When something is slow, measure with \`timeit\`/\`cProfile\` (see [profiling](lesson:profiling)) and fix the algorithm or the data structure first ([performance](lesson:performance)).`,
      py`**What still helps in hot code.** Put hot loops inside **functions** (locals use array slots; module-level names are dict lookups). Prefer **built-ins and comprehensions** (\`sum\`, \`sorted\`, \`str.join\`) — their loops run in C, outside the evaluation loop. Keep hot variables **type-stable**: a value that is sometimes an int and sometimes a float keeps deoptimizing. See [optimization techniques](lesson:optimization-techniques).`,
      py`**\`-O\` is a production switch with consequences.** It removes \`assert\` statements and \`if __debug__:\` blocks; \`-OO\` also strips docstrings, which breaks libraries that read them at run time. Never use \`assert\` for validation, authentication or anything that must run.`,
      py`**\`.pyc\` files in deployments.** Add \`__pycache__/\` to \`.gitignore\`. In container images, either precompile with \`python -m compileall\` at build time (faster cold starts, and works on read-only file systems) or set \`PYTHONDONTWRITEBYTECODE=1\` if you'd rather not have them. Use hash-based \`.pyc\` files (\`compileall --invalidation-mode checked-hash\`, PEP 552) for reproducible builds where file timestamps are meaningless. \`.pyc\` files are **not** obfuscation: decompilers exist, and a \`.pyc\` only runs on the CPython version that wrote it.`,
      py`**Tools live at these layers.** Formatters, linters and codemods work on the AST (or a concrete syntax tree that keeps comments). Coverage, debuggers and profilers watch the evaluation loop through \`sys.settrace\`/\`sys.setprofile\` or the faster \`sys.monitoring\` (3.12+). Security tools flag \`eval\`/\`exec\` — compiling and running strings is the most dangerous thing the pipeline can do with untrusted input.`,
    ],
  },
  mistakes: [
    {
      title: 'Using assert for checks that must always run',
      wrong: { code: py`def withdraw(balance, amount):
    assert amount > 0, "amount must be positive"   # removed by python -O
    return balance - amount`, lang: 'python' },
      right: { code: py`def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError("amount must be positive")
    return balance - amount`, lang: 'python' },
      explanation: py`\`python -O\` compiles \`assert\` statements away: the check is not in the bytecode at all. Keep \`assert\` for internal sanity checks during development; use \`if ...: raise\` for real validation.`,
    },
    {
      title: 'Writing tools or tests that depend on bytecode',
      wrong: { code: py`import dis

def uses_multiplication(func):
    # breaks whenever CPython renames or merges instructions
    return any(ins.opname == "BINARY_MULTIPLY" for ins in dis.get_instructions(func))`, lang: 'python' },
      right: { code: py`import ast
import inspect

def uses_multiplication(func):
    tree = ast.parse(inspect.getsource(func))
    return any(isinstance(node, ast.Mult) for node in ast.walk(tree))`, lang: 'python' },
      explanation: py`\`BINARY_MULTIPLY\` existed until 3.10; 3.11 replaced it with \`BINARY_OP\`. Bytecode changes every release; the AST is far more stable and describes what the source *says*. (Use \`dis\` to learn and debug, not to build features.)`,
    },
    {
      title: 'Hand-optimising for the interpreter without measuring',
      wrong: { code: py`def total_length(words, len=len, sum=sum):   # "faster" builtins via defaults
    return sum([len(w) for w in words])`, lang: 'python' },
      right: { code: py`def total_length(words):
    return sum(len(word) for word in words)`, lang: 'python' },
      explanation: py`Binding built-ins as default arguments was a classic micro-optimisation for older interpreters. Specialization now caches global and builtin lookups, so the gain is small, while the code is harder to read and the function signature is polluted. Optimise only what a profiler shows is slow.`,
    },
    {
      title: 'Using eval to parse data',
      wrong: { code: py`settings_text = '{"retries": 3, "hosts": ["a", "b"]}'
settings = eval(settings_text)    # runs ANY code the text contains`, lang: 'python' },
      right: { code: py`import ast
import json

settings_text = '{"retries": 3, "hosts": ["a", "b"]}'
settings = json.loads(settings_text)          # for JSON
same = ast.literal_eval(settings_text)        # for Python literals only`, lang: 'python' },
      explanation: py`\`eval\` sends the text through the whole pipeline and executes it, so \`"__import__('os').system(...)"\` would run. \`json.loads\` and \`ast.literal_eval\` only parse; they never execute. See [injection attacks](lesson:injection-attacks).`,
    },
    {
      title: 'Committing __pycache__ to version control',
      wrong: { code: py`git add .        # adds __pycache__/*.cpython-314.pyc too`, lang: 'bash' },
      right: { code: py`echo "__pycache__/" >> .gitignore
echo "*.py[cod]" >> .gitignore
git add .`, lang: 'bash' },
      explanation: py`\`.pyc\` files are build artefacts tied to one interpreter version. Committing them bloats diffs, causes merge conflicts and can confuse other versions. They are regenerated automatically.`,
    },
  ],
  debugging: [
    {
      symptom: py`SyntaxError: '(' was never closed`,
      cause: py`The parser failed, so the file never reached the compiler and **no line ran** — even lines above the mistake.`,
      fix: py`Look at the line shown and the line *before* it for unbalanced brackets or quotes. Editors and \`python -m py_compile file.py\` catch these without running anything.`,
    },
    {
      symptom: py`ImportError: bad magic number in 'cart': b'\x03\xf3\r\n'`,
      cause: py`Python found a \`.pyc\` written by a different CPython version and there was no \`.py\` source next to it to recompile from (for example a "sourceless" deployment, or an old \`cart.pyc\` lying beside your code).`,
      fix: py`Delete the stale \`.pyc\` files (and \`__pycache__\`) and ship the source, or rebuild the \`.pyc\` files with the exact interpreter version you deploy.`,
    },
    {
      symptom: py`ValueError: malformed node or string on line 1: Call(...)`,
      cause: py`\`ast.literal_eval\` was given something that isn't a pure literal — a function call, a name, an operator it doesn't allow. That is the safety feature working.`,
      fix: py`Only pass literal data (numbers, strings, bytes, tuples, lists, dicts, sets, booleans, None). For JSON use \`json.loads\`; never fall back to \`eval\`.`,
    },
    {
      symptom: py`The dis output in a tutorial (LOAD_FAST, BINARY_MULTIPLY…) doesn't match what you see.`,
      cause: py`Bytecode changes in every CPython release: instructions are renamed, merged into superinstructions, or replaced.`,
      fix: py`Check the tutorial's Python version and read the \`dis\` docs for your version. Reason about what the instructions do, not their exact names.`,
    },
    {
      symptom: py`You edited a module but the old behaviour still runs.`,
      cause: py`Rarely the \`.pyc\` (it is invalidated by the source's modification time and size); usually the module is already imported in a long-running process or REPL (\`sys.modules\`), or a different copy of the file is being imported.`,
      fix: py`Restart the process (or use \`importlib.reload\` in a REPL) and print \`module.__file__\` to see which file was actually loaded.`,
    },
  ],
  bestPractices: [
    'Use dis and ast to learn and debug; build tools on the AST, never on bytecode.',
    'Write readable constant expressions (24 * 60 * 60) — they are folded at compile time.',
    'Never put required checks in assert; python -O removes them.',
    'Keep hot loops inside functions, prefer built-ins and comprehensions, and keep hot variables type-stable.',
    'Ignore __pycache__ in git; precompile with compileall in deployment images if cold-start time matters.',
    'Parse data with json.loads or ast.literal_eval — never eval.',
    'Label anything you learn from dis with the Python version it came from.',
  ],
  useCases: [
    'Understanding why one version of a hot loop is faster than another.',
    'Writing a custom lint rule or code-mod with ast.NodeVisitor / NodeTransformer.',
    'Safely parsing configuration values that look like Python literals with ast.literal_eval.',
    'Speeding up container cold starts by precompiling with python -m compileall.',
    'Explaining in interviews how Python executes code and what changed in 3.11+.',
  ],
  comparison: {
    title: 'Same Python, different engines',
    headers: ['', 'Compiles your source to…', 'Then runs it with…', 'Watch out for'],
    rows: [
      ['CPython (default)', 'CPython bytecode in code objects', 'the specializing evaluation loop', 'bytecode changes every version'],
      ['CPython with JIT (3.13+, opt-in)', 'CPython bytecode', 'the loop plus machine code for hot traces', 'experimental; off by default'],
      ['PyPy', 'PyPy’s own bytecode', 'an interpreter plus a tracing JIT', 'C extensions run through a compatibility layer'],
      ['GraalPy', 'its own internal representation', 'GraalVM with the Graal JIT', 'warm-up time; JVM integration'],
      ['MicroPython', 'compact MicroPython bytecode (.mpy)', 'a small interpreter on a microcontroller', 'a subset of the standard library'],
      ['Pyodide (this playground)', 'CPython 3.14 bytecode', 'CPython compiled to WebAssembly', 'no JIT, no threads'],
    ],
    note: py`The language reference describes behaviour, not machinery. Bytecode, \`.pyc\` files and \`dis\` output belong to one implementation and one version.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'bytecode-q1',
      type: 'mcq',
      prompt: 'When you run `python shop.py`, what does CPython’s evaluation loop actually execute?',
      options: [
        { text: 'The source text, one line at a time', why: 'The whole file is tokenized, parsed and compiled first — that’s why a SyntaxError anywhere stops line 1 from running.' },
        'Bytecode instructions stored in code objects',
        { text: 'Machine code produced ahead of time, like a C compiler', why: 'CPython interprets bytecode. The experimental JIT (3.13+) is off by default and only handles hot code.' },
        { text: 'The abstract syntax tree', why: 'The AST is an intermediate step. The compiler turns it into code objects before anything runs.' },
      ],
      answer: 1,
      explanation: py`Source → tokens → AST → code objects (bytecode + constants + names). The evaluation loop fetches and executes bytecode instructions; specialization rewrites hot instructions in place, but it is still bytecode.`,
    },
    {
      id: 'bytecode-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def greet(name, punctuation="!"):
    message = "Hi " + name
    return message + punctuation

code = greet.__code__
print(code.co_argcount, code.co_varnames)`,
      answer: "2 ('name', 'punctuation', 'message')",
      accept: ["2 ('name', 'punctuation', 'message')"],
      explanation: py`\`co_argcount\` counts the positional parameters (a default value doesn't change that). \`co_varnames\` lists all local variable names — arguments first, then the locals assigned in the body.`,
    },
    {
      id: 'bytecode-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import ast

tree = ast.parse("total = price * qty")
stmt = tree.body[0]
print(type(stmt).__name__, type(stmt.value).__name__)`,
      options: [
        'Assign BinOp',
        { text: 'Expr BinOp', why: 'Expr is a statement that is just an expression (like a bare function call). An = statement is an Assign.' },
        { text: 'Assign Mult', why: 'Mult is the operator node inside the BinOp (stmt.value.op), not the value itself.' },
        { text: 'Name BinOp', why: 'Name is the target (stmt.targets[0]). The statement itself is an Assign.' },
      ],
      answer: 0,
      explanation: py`The module's body holds one \`Assign\` statement. Its \`value\` is a \`BinOp\` node with \`left=Name('price')\`, \`op=Mult()\` and \`right=Name('qty')\`. Nothing was executed — \`price\` and \`qty\` don't even need to exist.`,
    },
    {
      id: 'bytecode-q4',
      type: 'bug',
      prompt: 'This service runs in production with `python -O`. Which line silently stops protecting the account?',
      code: py`def withdraw(balance, amount):
    assert amount > 0, "amount must be positive"
    if amount > balance:
        raise ValueError("insufficient funds")
    return balance - amount`,
      answerLine: 2,
      explanation: py`\`-O\` compiles every \`assert\` away, so a negative amount would *increase* the balance. Replace it with \`if amount <= 0: raise ValueError("amount must be positive")\`. The \`if\`/\`raise\` on lines 3–4 is unaffected by \`-O\`.`,
    },
    {
      id: 'bytecode-q5',
      type: 'fill',
      prompt: 'Complete the code so it prints the bytecode of `line_total` and then its local variable names.',
      code: py`import dis

def line_total(price, qty):
    return price * qty

dis.___(line_total)
print(line_total.___.co_varnames)`,
      answer: [['dis'], ['__code__']],
      explanation: py`\`dis.dis()\` disassembles a function, method, class, code object or source string. Every function keeps its code object in \`__code__\`, whose \`co_varnames\` is \`('price', 'qty')\`.`,
    },
    {
      id: 'bytecode-q6',
      type: 'mcq',
      prompt: 'What does CPython’s specializing adaptive interpreter (PEP 659, 3.11+) do?',
      options: [
        { text: 'Uses your type hints to pick faster instructions', why: 'The interpreter ignores type hints. Specialization is based on the types it actually observes at run time.' },
        'Rewrites frequently executed instructions into type-specific versions based on what it observes, with a guard that falls back if the types change',
        { text: 'Compiles every function to machine code before it runs', why: 'That would be an ahead-of-time compiler. Specialized instructions are still bytecode; the separate JIT is experimental and opt-in.' },
        { text: 'Changes the result of operations when it detects a faster algorithm', why: 'Specialization never changes behaviour — a specialized instruction must produce exactly what the generic one would.' },
      ],
      answer: 1,
      explanation: py`After warm-up, an adaptive instruction such as \`BINARY_OP\` that keeps seeing two ints becomes \`BINARY_OP_ADD_INT\` (or similar), with an inline cache and a cheap type check. If the check fails, it deoptimizes to the generic path. All automatic and invisible except through \`dis.dis(..., adaptive=True)\`.`,
    },
    {
      id: 'bytecode-q7',
      type: 'short',
      prompt: 'What are the `.pyc` files in `__pycache__`, why does CPython create them, and is it safe to delete them?',
      answer: py`They are cached, compiled code objects (bytecode) for imported modules, named after the interpreter version (e.g. \`cart.cpython-314.pyc\`). Loading them skips tokenizing, parsing and compiling, so imports start faster. The header (magic number plus the source's timestamp/size or hash) tells CPython whether the cache is still valid; otherwise it recompiles. Deleting them is always safe — they are regenerated on the next import (unless writing is disabled with \`-B\`/\`PYTHONDONTWRITEBYTECODE\`).`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'globals-used',
      title: 'Which globals does a function read?',
      difficulty: 'intermediate',
      prompt: py`Write \`globals_used(func)\` that returns a **sorted list of the unique global names** a function reads — module-level variables *and* built-ins such as \`len\` — by scanning its bytecode with \`dis.get_instructions(func)\`.

- Global (and built-in) reads use the \`LOAD_GLOBAL\` instruction; the name is the instruction's \`argval\`.
- Attribute names are **not** globals: for \`math.pi\` only \`"math"\` counts.
- Arguments and local variables are not globals.
- Each name appears once.

Example: for \`def total(prices): return round(sum(prices) * (1 + TAX), 2)\` the result is \`["TAX", "round", "sum"]\` (sorted: capitals come first).`,
      files: {
        'main.py': py`import dis
import math

TAX = 0.2


def globals_used(func):
    # TODO: co_names is a start... but does it only contain globals?
    return sorted(func.__code__.co_names)


def area(radius):
    return round(math.pi * radius ** 2, 2) + TAX


print(globals_used(area))
`,
      },
      hints: [
        'co_names mixes global names with attribute names: for area it contains both "math" and "pi".',
        'Loop over dis.get_instructions(func) and keep ins.argval when ins.opname == "LOAD_GLOBAL".',
        'return sorted({ins.argval for ins in dis.get_instructions(func) if ins.opname == "LOAD_GLOBAL"})',
      ],
      solution: {
        explanation: py`\`co_names\` is the code object's table of *names used by name* — globals, but also attribute names (\`pi\`) and imported names — so it over-reports. The bytecode tells you how each name is used: \`LOAD_GLOBAL\` is a lookup in the module's globals and then the built-ins, while \`LOAD_ATTR\` looks up an attribute on an object. Collecting the \`argval\` of every \`LOAD_GLOBAL\` into a set removes duplicates, and \`sorted\` gives a stable order. Two honest limitations: generator expressions and nested functions have their own code objects (you'd recurse into \`co_consts\` to include them), and opcode names are a CPython detail — fine for a learning or debugging tool, not for a long-lived library (there, analyse the AST).`,
        files: {
          'main.py': py`import dis
import math

TAX = 0.2


def globals_used(func):
    """Sorted, unique global (and built-in) names that func reads."""
    names = {
        ins.argval
        for ins in dis.get_instructions(func)
        if ins.opname == "LOAD_GLOBAL"
    }
    return sorted(names)


def area(radius):
    return round(math.pi * radius ** 2, 2) + TAX


print(globals_used(area))
`,
        },
      },
      tests: [
        { name: 'module globals and built-ins are found', code: py`TAX_RATE = 0.2
def total(prices):
    return round(sum(prices) * (1 + TAX_RATE), 2)
assert globals_used(total) == ["TAX_RATE", "round", "sum"]` },
        { name: 'attribute names are not globals', code: py`import math
def circle(r):
    return math.pi * r * r
assert globals_used(circle) == ["math"], 'math.pi reads the global math, then the attribute pi'` },
        { name: 'arguments and locals are ignored', code: py`def double(n):
    result = n * 2
    return result
assert globals_used(double) == []` },
        { name: 'each name appears once', code: py`def twice(items):
    return len(items) + len(items)
assert globals_used(twice) == ["len"]` },
      ],
    },
    {
      id: 'mini-eval-loop',
      title: 'Build a tiny evaluation loop',
      difficulty: 'advanced',
      prompt: py`Write \`run(program)\`, a miniature stack machine in the spirit of CPython's evaluation loop. \`program\` is a list of \`(opcode, argument)\` tuples. Keep a \`stack\` (a list) and a \`variables\` dict, execute the instructions in order and **return \`variables\`**.

| instruction | effect |
|---|---|
| \`("PUSH", value)\` | push \`value\` |
| \`("LOAD", name)\` | push \`variables[name]\` |
| \`("STORE", name)\` | pop the top value and store it in \`variables[name]\` |
| \`("BINARY", op)\` | pop the **right** operand, then the **left**, push \`left op right\`; \`op\` is one of \`"+"\`, \`"-"\`, \`"*"\`, \`"/"\` |

Any other opcode raises \`ValueError\`. Example: \`run([("PUSH", 10), ("PUSH", 4), ("BINARY", "-"), ("STORE", "change")])\` returns \`{"change": 6}\`.`,
      files: {
        'main.py': py`def run(program):
    stack = []
    variables = {}
    for opcode, arg in program:
        if opcode == "PUSH":
            stack.append(arg)
        # TODO: LOAD, STORE, BINARY and unknown opcodes
    return variables


program = [
    ("PUSH", 3), ("STORE", "price"),
    ("PUSH", 4), ("STORE", "qty"),
    ("LOAD", "price"), ("LOAD", "qty"), ("BINARY", "*"),
    ("PUSH", 6), ("BINARY", "+"),
    ("STORE", "total"),
]
print(run(program))
`,
      },
      hints: [
        'Write one branch per opcode inside the loop: if / elif / else. The else branch raises ValueError.',
        'For BINARY, pop twice: right = stack.pop() first, then left = stack.pop(). A dict of functions from the operator module ({"+": operator.add, ...}) keeps it short.',
        'elif opcode == "STORE": variables[arg] = stack.pop() — and for BINARY: right = stack.pop(); left = stack.pop(); stack.append(OPS[arg](left, right))',
      ],
      solution: {
        explanation: py`This is the shape of every bytecode interpreter: a loop that fetches an instruction, dispatches on its opcode and manipulates a stack. Operands come off the stack in reverse order — the right operand was pushed last, so it's popped first — which is why \`10 - 4\` works out as \`6\`, not \`-6\`. CPython's real loop adds a lot on top (instructions as compact bytes with jump targets, frames for calls, reference counting on every push and pop, exception tables, specialization and inline caches), and it's written in C — this version is **simplified** for learning. An unknown opcode raising instead of being skipped matters: silently ignoring an instruction would corrupt the stack for everything after it.`,
        files: {
          'main.py': py`import operator

OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}


def run(program):
    stack = []
    variables = {}
    for opcode, arg in program:
        if opcode == "PUSH":
            stack.append(arg)
        elif opcode == "LOAD":
            stack.append(variables[arg])
        elif opcode == "STORE":
            variables[arg] = stack.pop()
        elif opcode == "BINARY":
            right = stack.pop()          # pushed last, popped first
            left = stack.pop()
            stack.append(OPS[arg](left, right))
        else:
            raise ValueError(f"unknown instruction: {opcode}")
    return variables


program = [
    ("PUSH", 3), ("STORE", "price"),
    ("PUSH", 4), ("STORE", "qty"),
    ("LOAD", "price"), ("LOAD", "qty"), ("BINARY", "*"),
    ("PUSH", 6), ("BINARY", "+"),
    ("STORE", "total"),
]
print(run(program))
`,
        },
      },
      tests: [
        { name: 'PUSH, BINARY and STORE work', code: py`assert run([("PUSH", 3), ("PUSH", 4), ("BINARY", "*"), ("STORE", "area")]) == {"area": 12}` },
        { name: 'operands are popped in the right order', code: py`assert run([("PUSH", 10), ("PUSH", 4), ("BINARY", "-"), ("STORE", "change")]) == {"change": 6}
assert run([("PUSH", 9), ("PUSH", 2), ("BINARY", "/"), ("STORE", "half")]) == {"half": 4.5}` },
        { name: 'LOAD reads stored variables', code: py`program = [
    ("PUSH", 3), ("STORE", "price"),
    ("PUSH", 4), ("STORE", "qty"),
    ("LOAD", "price"), ("LOAD", "qty"), ("BINARY", "*"),
    ("PUSH", 6), ("BINARY", "+"),
    ("STORE", "total"),
]
assert run(program) == {"price": 3, "qty": 4, "total": 18}` },
        { name: 'unknown opcodes raise ValueError', code: py`with raises(ValueError):
    run([("PUSH", 1), ("JUMP", 0)])` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'bytecode-compiled-or-interpreted',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Is Python a compiled or an interpreted language?',
      answer: 'Neither label fits cleanly: “compiled vs interpreted” describes implementations, not languages. CPython compiles source to bytecode automatically, then interprets the bytecode in its evaluation loop; PyPy adds a JIT that compiles hot code to machine code.',
      explanation: py`CPython's pipeline is tokenize → parse to an AST → compile to code objects → execute bytecode. The compile step is why a \`SyntaxError\` anywhere prevents the file from running at all, and why \`.pyc\` caches exist. Since 3.11 the interpreter specializes hot instructions, and 3.13+ has an experimental, opt-in JIT.`,
      whyAsked: 'A common opener that shows whether you know what actually happens when Python runs, beyond a one-word answer.',
      mistakes: ['Saying Python reads and executes source line by line', 'Saying Python is compiled to machine code like C', 'Treating CPython’s behaviour as a property of the language'],
      followUps: ['What is in a .pyc file?', 'Why does a SyntaxError on the last line stop the first line from running?', 'What does a JIT add?'],
      modelAnswer: 'Strictly, compiled or interpreted describes an implementation, not the language. In CPython, the standard implementation, it is both: when a module is loaded, the source is tokenized, parsed into an abstract syntax tree and compiled into bytecode inside code objects, and then a C evaluation loop interprets that bytecode one instruction at a time. Compiled bytecode for imported modules is cached in __pycache__ so the compile step is skipped next time. That is also why a syntax error anywhere stops the whole file before it runs. Other implementations differ: PyPy, for example, uses a tracing JIT that turns hot loops into machine code.',
    },
    {
      id: 'bytecode-pipeline',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Walk me through what happens between `import cart` and the first line of `cart.py` executing.',
      answer: 'The import system finds cart.py, checks __pycache__ for a valid cart.cpython-3XX.pyc and loads its code object if the header matches; otherwise it tokenizes, parses to an AST, compiles to a code object (writing a new .pyc), then creates a module object and executes the module’s code object in the module’s namespace.',
      explanation: py`Finding uses \`sys.path\` and the import machinery. A cached \`.pyc\` is valid when its magic number matches the running interpreter and its recorded source mtime/size (or hash, PEP 552) matches. Compiling builds a symbol table (local/global/free names), emits bytecode, folds constants and produces nested code objects for functions and classes. Executing the module's code runs top-level statements: \`def\` and \`class\` create function and class objects at that moment. The module is placed in \`sys.modules\` before execution, which is how circular imports see partially initialised modules.`,
      whyAsked: 'It connects imports, compilation and execution, and reveals whether you understand that def/class are statements that run.',
      mistakes: ['Saying functions are created when the file is parsed', 'Forgetting the .pyc validity check', 'Not knowing that the module is registered in sys.modules before it finishes executing'],
      followUps: ['When is a .pyc considered stale?', 'Why does a circular import see a half-initialised module?', 'Is the main script cached as a .pyc?'],
      modelAnswer: 'First the import system searches sys.path and finds cart.py. It then looks in __pycache__ for cart.cpython-314.pyc; if the magic number matches this interpreter and the recorded source timestamp and size, or hash, still match, it loads the cached code object directly. Otherwise it tokenizes the source, parses it into an AST, runs the compiler — which builds the symbol table, emits bytecode and folds constants — and writes a fresh .pyc. Then it creates a module object, registers it in sys.modules, and executes the module’s code object in the module’s namespace. Top-level statements run in order, and def and class statements create their function and class objects right then.',
    },
    {
      id: 'bytecode-faster-311',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Python 3.11 made many programs noticeably faster without any code changes. What changed inside CPython, and what is the status of the JIT?',
      answer: 'The main change was the specializing adaptive interpreter (PEP 659): hot bytecode instructions rewrite themselves into type-specialized versions with inline caches and cheap guards, deoptimizing if the types change. 3.11 also made frames cheaper, inlined Python-to-Python calls and made try blocks zero-cost. An experimental copy-and-patch JIT (PEP 744) arrived in 3.13; it is opt-in and not recommended for production yet.',
      explanation: py`Specialization targets the commonest dynamic overheads: attribute lookups (\`LOAD_ATTR_INSTANCE_VALUE\`), global lookups (\`LOAD_GLOBAL_MODULE\`/\`_BUILTIN\` with cached dict versions), arithmetic on ints/floats, calls to Python functions. It is based on observed types, not annotations, and never changes semantics. The JIT translates sequences of specialized instructions into machine code from pre-compiled templates; in 3.14 the official Windows/macOS builds include it but it stays off unless \`PYTHON_JIT=1\`. Exact speed-ups depend heavily on the workload — measure your own.`,
      whyAsked: 'Shows that you follow how the runtime evolves and can explain performance without myths.',
      mistakes: ['Claiming type hints made Python faster', 'Saying 3.11 added a JIT', 'Quoting a single speed-up number as if it applied to every program'],
      followUps: ['What happens when a specialized instruction sees an unexpected type?', 'How can you see specialization with dis?', 'Why might type-unstable code benefit less?'],
      modelAnswer: 'The big change in 3.11 was the specializing adaptive interpreter from PEP 659. After a function warms up, generic instructions like BINARY_OP or LOAD_ATTR observe the types they actually see and rewrite themselves in place into specialized versions — adding two ints, reading an instance attribute at a known offset — with an inline cache and a cheap guard. If the guard fails they deoptimize and can re-specialize later, so behaviour never changes, and type hints play no part. 3.11 also made frames cheaper and exception handling zero-cost until something is raised. On top of that, 3.13 added an experimental copy-and-patch JIT; it is still opt-in — in 3.14 you enable it with PYTHON_JIT=1 — and not recommended for production yet. How much faster any program gets depends on the workload, so I would measure.',
    },
    {
      id: 'bytecode-function-vs-module',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'The same loop runs faster when it is inside a function than when it is at module level. Why?',
      options: ['Functions are compiled to machine code', 'Locals are stored in array slots (LOAD_FAST/STORE_FAST) while module-level names are dictionary lookups (LOAD_NAME/STORE_NAME or LOAD_GLOBAL)', 'Module-level code is interpreted from source each iteration', 'The GIL is released inside functions'],
      correctOption: 1,
      answer: 'Inside a function the compiler knows every local name, so it gives each one a numbered slot and accesses it with LOAD_FAST/STORE_FAST. At module level names live in the module’s globals dict, so every read and write of the loop variable and accumulators is a dictionary operation.',
      explanation: py`You can see it with \`dis\`: module code uses \`STORE_NAME\`/\`LOAD_NAME\`, function code uses \`STORE_FAST\`/\`LOAD_FAST\` (or 3.14's borrowed variants). Specialization narrows the gap for globals by caching lookups, but locals are still the cheapest. The fix is the idiom you already know: put the work in \`def main():\` and call it under \`if __name__ == "__main__":\`.`,
      code: { lang: 'python', code: py`import dis

dis.dis(compile("total = 0\nfor n in range(3):\n    total += n", "<module>", "exec"))  # LOAD_NAME / STORE_NAME

def main():
    total = 0
    for n in range(3):
        total += n
    return total

dis.dis(main)   # STORE_FAST / LOAD_FAST (3.14 shows LOAD_FAST_BORROW variants)` },
      whyAsked: 'It links a practical performance observation to the compiler’s scoping decisions.',
      mistakes: ['Attributing it to the GIL or to machine-code compilation', 'Not knowing locals are resolved at compile time'],
      followUps: ['Why does assigning to a name anywhere in a function make it local everywhere in it?', 'How does specialization help global lookups?'],
      modelAnswer: 'It comes down to how names are stored. Inside a function, the compiler knows all the local names in advance, so each gets a numbered slot in the frame and the bytecode uses LOAD_FAST and STORE_FAST, which are just array accesses. At module level, names live in the module’s globals dictionary, so every read and write of the loop variable and the total is a dictionary lookup or store — STORE_NAME and LOAD_NAME. Specialization in 3.11+ caches global lookups and narrows the gap, but locals remain cheaper, which is one more reason to put scripts in a main function.',
    },
    {
      id: 'bytecode-pyc-deploy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You are building a Docker image for a Python service. Should the image contain .pyc files, should they be in git, and can shipping only .pyc files protect your source code?',
      answer: 'Keep __pycache__ out of git. In the image, precompiling with python -m compileall at build time is reasonable: it speeds up cold starts and avoids writes on a read-only file system (alternatively set PYTHONDONTWRITEBYTECODE=1). Shipping only .pyc files is not protection: they decompile readily, and they only run on the exact CPython version that produced them.',
      explanation: py`A \`.pyc\` is a cache keyed by interpreter version (magic number + \`cpython-3XX\` tag) and validated against the source's mtime/size or hash. In images built reproducibly, timestamps can be meaningless — hash-based pycs (\`--invalidation-mode checked-hash\` or \`unchecked-hash\`, PEP 552) fix that. Sourceless distribution breaks on every interpreter upgrade (\`ImportError: bad magic number\`) and hides nothing from a determined reader.`,
      whyAsked: 'Practical deployment knowledge that connects the compilation cache with containers, reproducibility and security myths.',
      mistakes: ['Committing __pycache__', 'Believing .pyc files are obfuscation or a licensing protection', 'Not knowing .pyc files are version-specific'],
      followUps: ['What is PEP 552 and why does it matter for reproducible builds?', 'What happens when a .pyc’s magic number doesn’t match?', 'Where would you set PYTHONDONTWRITEBYTECODE?'],
      modelAnswer: 'I would never put __pycache__ in git — it is a build artefact tied to one interpreter version. In the image I would usually run python -m compileall during the build, so containers start a bit faster and never try to write .pyc files at runtime, which matters on read-only file systems; if I didn’t want them at all I would set PYTHONDONTWRITEBYTECODE. For reproducible builds I would use hash-based pycs from PEP 552 instead of timestamps. And shipping only .pyc files does not protect the code: decompilers exist, and the files only load on the exact CPython version that wrote them, so every upgrade would break with a bad magic number.',
    },
    {
      id: 'bytecode-assert-debugging',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A permission check works in every test, but in production users can perform admin actions. The check is `assert user.is_admin, "admins only"`. What is going on?',
      answer: 'Production runs Python with -O (or PYTHONOPTIMIZE), which compiles assert statements away entirely. Replace the assert with an explicit if-not-raise (e.g. raise PermissionError), and audit the codebase for asserts used as checks.',
      explanation: py`With \`optimize=1\` the compiler removes \`assert\` statements and \`if __debug__:\` blocks; the check is not in the bytecode at all (\`dis\` proves it). Tests usually run without \`-O\`, so they never see the problem. Linters such as Bandit flag asserts used outside tests for exactly this reason.`,
      whyAsked: 'A real security bug class that tests both compiler knowledge and secure-coding habits.',
      mistakes: ['Blaming the tests or the user object', 'Not knowing that -O removes asserts', 'Fixing it by removing -O instead of the assert'],
      followUps: ['What else does -OO remove?', 'How would you prove it with dis?', 'When is assert appropriate?'],
      modelAnswer: 'The production interpreter is almost certainly running with -O or PYTHONOPTIMIZE set, and that tells the compiler to drop assert statements completely — the check simply isn’t in the bytecode, so every user passes. Tests run without -O, which is why they never caught it. The fix is to use a real check, if not user.is_admin: raise PermissionError, and to search the codebase for other asserts that guard behaviour. I would also add a linter rule that flags assert outside tests. Asserts are fine for internal invariants during development, never for security or validation.',
    },
    {
      id: 'bytecode-constant-folder',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Using the `ast` module, write `fold(expression)` that folds constant sub-expressions the way CPython’s optimiser does and returns the new source: `fold("x * (24 * 60 * 60)")` → `"x * 86400"`. Support `+`, `-` and `*`. Leave everything else unchanged.',
      answer: 'Parse with ast.parse(mode="eval"), run an ast.NodeTransformer whose visit_BinOp first folds its children (generic_visit), then replaces a BinOp whose left and right are both ast.Constant with ast.Constant(result), and finally ast.unparse the tree.',
      explanation: py`Folding bottom-up is the key: \`(1 + 2) * (3 + 4)\` first becomes \`3 * 7\`, then \`21\`. Because \`x * 24 * 60\` parses as \`(x * 24) * 60\`, it has no all-constant sub-expression and stays as it is — CPython behaves the same way. Real compilers add guards this sketch lacks: they refuse to fold results that would be huge (\`"a" * 10**9\`) and handle errors such as division by zero by leaving the expression alone so the error happens at run time.`,
      starter: { files: { 'main.py': py`import ast


def fold(expression):
    tree = ast.parse(expression, mode="eval")
    # TODO: replace BinOp nodes whose two operands are constants
    return ast.unparse(tree)


print(fold("x * (24 * 60 * 60)"))
` } },
      tests: [
        { name: 'folds a constant sub-expression', code: py`assert fold("x * (24 * 60 * 60)") == "x * 86400"` },
        { name: 'folds bottom-up to a single constant', code: py`assert fold("(1 + 2) * (3 + 4)") == "21"
assert fold("2 * 3 + x") == "6 + x"` },
        { name: 'left-to-right chains with a name are not folded', code: py`assert fold("x * 24 * 60") == "x * 24 * 60"` },
        { name: 'expressions without constants are unchanged', code: py`assert fold("price * qty - discount") == "price * qty - discount"` },
      ],
      solution: { files: { 'main.py': py`import ast
import operator

OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul}


class ConstantFolder(ast.NodeTransformer):
    def visit_BinOp(self, node):
        self.generic_visit(node)              # fold the children first
        op = OPS.get(type(node.op))
        if op and isinstance(node.left, ast.Constant) and isinstance(node.right, ast.Constant):
            folded = ast.Constant(op(node.left.value, node.right.value))
            return ast.copy_location(folded, node)
        return node


def fold(expression):
    tree = ast.parse(expression, mode="eval")
    tree = ast.fix_missing_locations(ConstantFolder().visit(tree))
    return ast.unparse(tree)


print(fold("x * (24 * 60 * 60)"))
` } },
      hints: ['Subclass ast.NodeTransformer and implement visit_BinOp; whatever it returns replaces the node.', 'Call self.generic_visit(node) first so the children are already folded, then check isinstance(node.left, ast.Constant) and isinstance(node.right, ast.Constant).'],
      whyAsked: 'It tests practical AST skills — the basis of linters and code-mods — and understanding of how compile-time optimisation works.',
      mistakes: ['Folding top-down, so nested constants are missed', 'Using eval on sub-expressions', 'Expecting x * 24 * 60 to fold'],
      followUps: ['How would you avoid folding results that are enormous?', 'What should happen with 1 / 0?', 'How would you also fold unary minus?'],
      modelAnswer: 'I parse the expression with ast.parse in eval mode and write an ast.NodeTransformer with a visit_BinOp method. The first thing it does is call generic_visit, so the children are folded before the parent — that’s what turns (1 + 2) * (3 + 4) into 21. Then, if the operator is one I support and both operands are now ast.Constant nodes, I compute the value with the matching function from the operator module and return a new Constant, copying the location. Otherwise I return the node unchanged. Finally I fix missing locations and unparse. Note that x * 24 * 60 stays as it is because it parses as (x * 24) * 60 — CPython’s own folder behaves the same. A production version would also guard against huge results and leave errors like division by zero for run time.',
    },
  ],

  takeaways: [
    'CPython runs code in stages: tokens → AST → code objects full of bytecode → the evaluation loop.',
    'A SyntaxError stops the whole file before anything runs; runtime errors happen when the evaluation loop reaches the instruction.',
    'tokenize, ast, compile(), __code__ and dis let you inspect every stage; build tools on the AST, not on bytecode.',
    'Code objects hold bytecode plus co_consts, co_names and co_varnames; locals live in fast array slots, globals in dicts.',
    'Bytecode, .pyc files and dis output are CPython details that change every version — label what you learn with its version.',
    'Constant expressions are folded at compile time; -O removes assert statements, so never use assert for validation.',
    'Since 3.11 the specializing adaptive interpreter rewrites hot instructions for the types it sees; the 3.13+ JIT is experimental and off by default.',
  ],
}

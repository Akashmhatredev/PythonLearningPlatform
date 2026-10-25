// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const RECEIPT = py`# A café receipt, formatted with f-strings
shop = "Corner Café"
items = [("Flat white", 2, 3.20), ("Croissant", 3, 2.45), ("Orange juice", 1, 3.75)]
vat_rate = 0.2
width = 34

print(f"{shop:^{width}}")
print("=" * width)
subtotal = 0
for name, qty, price in items:          # runs once per item
    line_total = qty * price
    subtotal += line_total
    print(f"{name:<15}{qty:>3} x{price:>6.2f}{line_total:>8.2f}")

vat = subtotal * vat_rate
total = subtotal + vat
print("-" * width)
print(f"{'Subtotal':<26}{subtotal:>8.2f}")
print(f"{'VAT':<26}{vat:>8.2f}")
print(f"{'TOTAL':<26}{total:>8.2f}")
print("=" * width)
print(f"VAT rate {vat_rate:.0%} | Please pay \${total:,.2f}")
print(f"{subtotal=}")
`

export default {
  id: 'string-formatting',
  title: 'f-strings & string formatting',
  summary: 'f-strings drop the value of any expression straight into text, and the format-spec mini-language after the colon controls width, alignment, decimals, separators and percentages.',
  difficulty: 'beginner',
  minutes: 40,
  prerequisites: ['strings-basics', 'numbers-and-math'],
  related: ['string-methods', 'type-conversion', 'logging', 'dates-and-times', 'special-methods', 'injection-attacks', 'modern-features'],
  tags: ['f-strings', 'formatting', 'format spec', 'format mini-language', 'decimal places', 'alignment', 'padding', 'thousands separator', 'percent', 'str.format', 'percent formatting', 'self-documenting expressions', '!r', 'repr', 'PEP 701', 'template strings', 't-strings', 'PEP 750'],
  apis: [
    { name: 'f"...{expr}..."', summary: 'An f-string: evaluates each expression in braces and inserts its formatted value.' },
    { name: '{value:spec}', summary: 'Format spec mini-language: [[fill]align][sign][z][#][0][width][grouping][.precision][type].' },
    { name: '{expr=}', summary: 'Python 3.8+: self-documenting expression — prints the expression text, "=", and the value\'s repr.' },
    { name: '{value!r} / {value!s} / {value!a}', summary: 'Convert with repr(), str() or ascii() before formatting.' },
    { name: 'format(value, spec)', summary: 'The built-in behind f-strings: formats one value with a spec string.' },
    { name: 'str.format(*args, **kwargs)', summary: 'Older method: "{} scored {:.1f}".format(name, score). Still useful for templates stored separately.' },
    { name: '"%s" % value', summary: 'printf-style formatting, the oldest style; still used by the logging module.' },
    { name: 't"...{expr}..."', summary: 'Python 3.14+: a template string — returns a string.templatelib.Template, not a str.' },
  ],
  docs: [
    { label: 'Tutorial — fancier output formatting', url: 'https://docs.python.org/3/tutorial/inputoutput.html#fancier-output-formatting' },
    { label: 'Language reference — f-strings', url: 'https://docs.python.org/3/reference/lexical_analysis.html#f-strings' },
    { label: 'Library reference — format specification mini-language', url: 'https://docs.python.org/3/library/string.html#format-specification-mini-language' },
    { label: 'PEP 701 — syntactic formalization of f-strings (3.12)', url: 'https://peps.python.org/pep-0701/' },
    { label: 'PEP 750 — template strings (3.14)', url: 'https://peps.python.org/pep-0750/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Programs constantly turn values into text: \`"Ada scored 98 points"\`, \`"Total: $21.00"\`, a neatly aligned table. Gluing pieces with \`+\` and \`str()\` works but quickly becomes unreadable. An **f-string** (a *formatted string literal*) solves this: put an \`f\` before the opening quote and write any expression inside \`{braces}\`.`,
    { code: py`name = "Ada"
score = 98
print("Hello, " + name + "! You scored " + str(score) + " points.")   # clunky
print(f"Hello, {name}! You scored {score} points.")                  # clear`, lang: 'python', title: 'the same message, two ways' },
    py`After a colon inside the braces you can add a **format specification** — a tiny language for *how* the value should look: \`{price:.2f}\` (two decimal places), \`{name:>10}\` (right-aligned in 10 characters), \`{population:,}\` (thousands separators), \`{ratio:.0%}\` (a percentage). That mini-language is the main subject of this lesson.`,
  ],
  why: [
    py`Formatting is where your program meets humans. Money should show two decimals, tables should line up, big numbers need separators, percentages need a \`%\`. Getting this right by hand — rounding, padding with spaces, inserting commas — is fiddly and bug-prone. The format mini-language does it in a few characters.`,
    py`f-strings are also the best **debugging** tool you have: \`print(f"{total=}")\` prints both the name and the value. And knowing the older styles (\`str.format\`, \`%\`) matters because you'll meet them in existing code and in [logging](lesson:logging), where they are still the right choice.`,
  ],
  eli15: [
    py`An f-string is a sentence with blanks in it, like a form letter: "Dear ____, you owe ____." The \`f\` tells Python "fill in the blanks *right now*", and each \`{…}\` says what goes in the blank — a variable, a sum, anything.`,
    py`The bit after the colon is like instructions to a sign painter: "make this exactly 10 letters wide, push it to the right", or "show two numbers after the decimal point", or "put commas in the big number". \`f"{3.14159:.2f}"\` gives \`3.14\`.`,
  ],
  analogy: {
    title: 'A mail-merge letter with style instructions',
    body: [
      py`Mail merge takes a letter with placeholders — "Dear «name», your balance is «balance»" — and fills them in for each customer. An f-string is a one-off mail merge that happens the moment Python reaches that line.`,
      py`The format spec is the *styling* on each placeholder: "balance: two decimals, thousands separators, right-aligned in a 12-character box". The data stays the same; only how it's shown changes.`,
    ],
    mapping: [
      ['the letter with placeholders', 'the f-string: f"Dear {name}, you owe {balance}"'],
      ['the merge happening', 'evaluation — immediately, when the line runs'],
      ['what goes in a placeholder', 'any expression: a name, qty * price, items[0]'],
      ['styling on a placeholder', 'the format spec after the colon: {balance:,.2f}'],
      ['a fixed-width box on the form', 'width and alignment: {name:<15}'],
      ['a template kept for later', 'str.format / string.Template — or t-strings (3.14+)'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Anatomy of a replacement field',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'expr', label: 'price', note: 'expression', x: 80, y: 90, tone: 'yellow' },
        { id: 'conv', label: '!r', note: 'conversion (optional)', x: 190, y: 210, tone: 'paper' },
        { id: 'colon', label: ':', note: 'spec starts', x: 230, y: 90, tone: 'ink' },
        { id: 'fill', label: '*>', note: 'fill + align', x: 330, y: 90, tone: 'blue' },
        { id: 'width', label: '10', note: 'width', x: 430, y: 90, tone: 'blue' },
        { id: 'group', label: ',', note: 'grouping', x: 520, y: 90, tone: 'blue' },
        { id: 'prec', label: '.2', note: 'precision', x: 610, y: 90, tone: 'blue' },
        { id: 'type', label: 'f', note: 'type', x: 690, y: 90, tone: 'blue' },
        { id: 'out', label: '**1,234.50', note: 'result', x: 520, y: 230, tone: 'kraft' },
      ],
      edges: [
        { from: 'expr', to: 'colon' },
        { from: 'expr', to: 'conv', dashed: true },
        { from: 'colon', to: 'fill' },
        { from: 'fill', to: 'width' },
        { from: 'width', to: 'group' },
        { from: 'group', to: 'prec' },
        { from: 'prec', to: 'type' },
        { from: 'type', to: 'out', label: 'format()' },
      ],
      steps: [
        { focus: ['expr'], text: py`\`f"{price:*>10,.2f}"\` with \`price = 1234.5\`. First, the **expression** before the colon is evaluated. It can be any Python expression: \`price\`, \`qty * price\`, \`items[0]\`.` },
        { focus: ['conv'], edges: ['expr->conv'], text: py`Optionally, a **conversion** — \`!r\`, \`!s\` or \`!a\` — runs \`repr()\`, \`str()\` or \`ascii()\` on the value first. Not used in this example.` },
        { focus: ['colon'], edges: ['expr->colon'], text: py`The **colon** separates the value from the **format spec**. Everything after it is instructions for how to display the value.` },
        { focus: ['fill'], edges: ['colon->fill'], text: py`**Fill and align**: \`*>\` means "right-align (\`>\`) and pad with \`*\`". Alignment is \`<\` left, \`>\` right, \`^\` centre. Fill defaults to a space.` },
        { focus: ['width'], edges: ['fill->width'], text: py`**Width**: the result is at least 10 characters. It is a minimum — longer values are never cut.` },
        { focus: ['group'], edges: ['width->group'], text: py`**Grouping**: \`,\` inserts thousands separators (\`_\` uses underscores).` },
        { focus: ['prec', 'type'], edges: ['group->prec', 'prec->type'], text: py`**Precision and type**: \`.2f\` means fixed-point with 2 digits after the decimal point. Other types: \`d\` integer, \`%\` percentage, \`e\` scientific, \`x\` hex, \`b\` binary.` },
        { focus: ['out'], edges: ['type->out'], text: py`Python calls \`format(price, "*>10,.2f")\` and gets \`**1,234.50\`: 8 characters of number, padded with two \`*\` on the left to reach 10.` },
      ],
    },
    alt: 'A diagram of the replacement field {price:*>10,.2f}. Boxes from left to right: the expression price, the colon, fill and align *>, width 10, grouping comma, precision .2 and type f. An optional conversion !r hangs off the expression. All parts feed into format(), producing the result **1,234.50.',
  },
  syntax: [
    py`#### f-string basics`,
    { code: py`name = "Ada"
qty, price = 3, 2.45
print(f"{name} bought {qty} croissants")      # names
print(f"Total: {qty * price}")                 # any expression
print(f"Shout: {name.upper()}!")               # method calls
print(f"First letter: {name[0]}")              # indexing
print(f"{{braces}} are written doubled")        # literal { and }`, lang: 'python', title: 'expressions inside braces' },
    py`The expression is evaluated **when the line runs**, and its result is converted to text with \`format()\`. An f-string is an ordinary \`str\` afterwards — changing a variable later doesn't change a string you already built.`,
    py`#### The format specification mini-language`,
    py`Everything after the colon follows this pattern (every part is optional, but the order is fixed):`,
    { code: py`[[fill]align][sign][z][#][0][width][grouping][.precision][type]`, lang: 'text', title: 'format spec grammar' },
    py`| part | examples | meaning |
|---|---|---|
| align | \`<\` \`>\` \`^\` | left, right, centre inside the width |
| fill | \`*^\`, \`0>\`, \`.<\` | the character used for padding (written before the align) |
| sign | \`+\`, \`-\`, \` \` | \`+\` always shows a sign: \`+3\` / \`-3\` |
| width | \`10\` | minimum total characters |
| \`0\` | \`05\` | pad numbers with zeros: \`00042\` |
| grouping | \`,\` \`_\` | thousands separators: \`1,234,567\` |
| precision | \`.2\` | digits after the point (\`f\`, \`%\`) or significant digits (\`g\`) |
| type | \`f\` \`d\` \`%\` \`e\` \`g\` \`x\` \`b\` | fixed-point, integer, percent, scientific, general, hex, binary |
| \`#\` | \`#x\` | add a prefix: \`0xff\`, \`0b101\` |
| \`z\` | \`z.1f\` | turn \`-0.0\` into \`0.0\` (Python 3.11+) |`,
    { code: py`price = 1234.5
print(f"{price:.2f}")      # 1234.50      two decimals
print(f"{price:,.2f}")     # 1,234.50     plus thousands separators
print(f"{price:>12,.2f}|") #     1,234.50| right-aligned in 12 characters
print(f"{0.256:.1%}")      # 25.6%        multiplies by 100 and adds %
print(f"{42:05d}")         # 00042        zero-padded integer
print(f"{-7:+d} {7:+d}")   # -7 +7        always show the sign
print(f"{'menu':*^10}")    # ***menu***   centred, padded with *
print(f"{255:#x} {5:b}")   # 0xff 101     hex with prefix, binary
print(f"{1234567:_}")      # 1_234_567    underscore grouping
print(f"{0.000123:.2e}")   # 1.23e-04     scientific notation`, lang: 'python', title: 'the specs you will use most' },
    py`The width can itself come from a variable — nest a replacement field inside the spec: \`f"{name:>{width}}"\`.`,
    py`#### Self-documenting expressions: \`=\` (Python 3.8+)`,
    { code: py`total = 21.0
item = "tea"
print(f"{total=}")        # total=21.0
print(f"{total = }")      # total = 21.0   (spaces are kept)
print(f"{item=}")         # item='tea'     (uses repr by default)
print(f"{total=:.2f}")    # total=21.00    (with a format spec)
print(f"{len(item)=}")    # len(item)=3    (works for any expression)`, lang: 'python', title: 'the debugging superpower' },
    { callout: 'version', title: 'Python 3.8+', text: py`The \`=\` specifier was added in Python 3.8. It shows the expression text, \`=\`, and the value's \`repr()\` — or its formatted value if you add a spec.` },
    py`#### Conversions: !r, !s, !a`,
    { code: py`name = "Ada "
print(f"[{name}]")     # [Ada ]     str() — what users see
print(f"[{name!r}]")   # ['Ada ']   repr() — quotes show the trailing space
print(f"{'café'!a}")   # 'caf\xe9'  ascii() — escapes non-ASCII`, lang: 'python', title: 'choose repr for debugging' },
    py`\`!r\` is invaluable in error messages: \`f"Unknown command: {cmd!r}"\` makes an empty string, a trailing space or a newline visible.`,
    py`#### Quotes, backslashes and comments inside f-strings (Python 3.12+)`,
    { code: py`names = ["Ada", "Grace"]
print(f"Team: {", ".join(names)}")     # same quotes inside: OK in 3.12+
print(f"{'\n'.join(names)}")           # backslashes inside braces: OK in 3.12+
print(f"Total: {
    sum([3, 4, 5])  # comments and line breaks inside braces: OK in 3.12+
}")`, lang: 'python', title: 'PEP 701 relaxed the old restrictions' },
    { callout: 'version', title: 'Python 3.12+ (PEP 701)', text: py`Before 3.12, an expression inside an f-string could not reuse the string's own quote character, contain a backslash, or contain a \`#\` comment — you had to write \`f"Team: {', '.join(names)}"\`. If your code must run on 3.11 or older, keep using the other quote type inside the braces.` },
    py`#### The older styles: str.format and %`,
    { code: py`name, score = "Ada", 97.5

# str.format (Python 2.6+): same mini-language, values passed separately
print("{} scored {:.1f}".format(name, score))
print("{name} scored {score:.1f}".format(name=name, score=score))

# printf-style % formatting (the oldest)
print("%s scored %.1f%%" % (name, score))   # %% is a literal percent sign`, lang: 'python', title: 'you will meet these in older code' },
    py`Prefer f-strings for new code. \`str.format\` is still the right tool when the **template is defined somewhere else** than the values — for example a message loaded from a translation file — because an f-string is evaluated immediately where it is written. \`%\`-style survives mainly in the [logging](lesson:logging) module, which formats lazily: \`log.info("user %s logged in", name)\`.`,
    py`#### Template strings: t"…" (Python 3.14+, a teaser)`,
    { code: py`name = "Ada"
template = t"Hello {name}!"
print(type(template))            # <class 'string.templatelib.Template'>
print(template.strings)          # ('Hello ', '!')
print(template.values)           # ('Ada',)`, lang: 'python', title: 'a t-string is NOT a str' },
    { callout: 'version', title: 'Python 3.14+ (PEP 750)', text: py`A **t-string** looks like an f-string but doesn't produce text. It produces a \`Template\` object holding the literal parts and the interpolated values *separately*, so a library can process each value safely — for example HTML-escape user input or turn values into SQL parameters — before building the final string. You can't print it as text or concatenate it with a \`str\` by accident. It's a tool for library authors; day-to-day you'll keep writing f-strings. More in the internals section.` },
  ],
  walkthrough: {
    title: 'Reading the receipt line by line',
    lang: 'python',
    code: RECEIPT,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [2, 5], text: py`The data: a shop name, a list of \`(name, quantity, price)\` items, the VAT (sales tax) rate, and the receipt width in characters.` },
      { lines: [7], text: py`\`{shop:^{width}}\` centres the shop name in a field \`width\` characters wide. The inner \`{width}\` is replaced first, so the spec becomes \`^34\`.` },
      { lines: [10, 13], text: py`A \`for\` loop (see [for loops](lesson:for-loops)) runs the indented lines once per item. Each line uses fixed widths that add up to 34: name left-aligned in 15, quantity right-aligned in 3, \`" x"\`, price in 6 with 2 decimals, line total in 8 with 2 decimals.` },
      { lines: [19, 21], text: py`Labels are left-aligned in 26 and amounts right-aligned in 8 — so the decimal points line up in one column. \`'Subtotal'\` uses single quotes inside the double-quoted f-string.` },
      { lines: [23], text: py`\`{vat_rate:.0%}\` turns \`0.2\` into \`20%\`. \`\${total:,.2f}\` is a literal \`$\` followed by a replacement field with thousands separators and two decimals.` },
      { lines: [24], text: py`\`{subtotal=}\` prints \`subtotal=17.5\` — the expression, an equals sign and the repr of the value. Perfect for quick debugging.` },
    ],
  },
  playground: {
    title: 'Café receipt',
    objective: 'Run it, then change the format specs to handle bigger orders, discounts and debugging output.',
    files: { 'main.py': RECEIPT },
    expected: py`\`\`\`text
           Corner Café
==================================
Flat white       2 x  3.20    6.40
Croissant        3 x  2.45    7.35
Orange juice     1 x  3.75    3.75
----------------------------------
Subtotal                     17.50
VAT                           3.50
TOTAL                        21.00
==================================
VAT rate 20% | Please pay $21.00
subtotal=17.5
\`\`\``,
    experiments: [
      {
        id: 'big-order',
        task: py`Add a \`("Birthday cake", 1, 1250.00)\` item to the list, then change the item line's format so line totals show **thousands separators** (\`1,250.00\`).`,
        hint: py`Add \`,\` before the precision in the line total's spec: \`{line_total:>8,.2f}\`.`,
        tests: [
          { name: 'the cake line shows 1,250.00', code: py`assert "1,250.00" in output, 'Add the cake and use , in the line_total spec'` },
        ],
        explain: py`The \`,\` grouping option inserts separators every three digits; \`1,250.00\` is exactly 8 characters, so the column still lines up. Try the subtotal and total lines too — with a big order you'll want wider fields.`,
      },
      {
        id: 'discount',
        task: py`Add \`discount = 0.15\` near the top and print a line \`Discount: 15%\`, formatting the number with a **percent** spec rather than typing "15%".`,
        hint: py`\`f"Discount: {discount:.0%}"\` — the \`%\` type multiplies by 100 and adds the sign; \`.0\` means no decimals.`,
        tests: [
          { name: 'prints Discount: 15%', code: py`assert "Discount: 15%" in output` },
          { name: 'discount is stored as a fraction', code: py`assert ns.get('discount') == 0.15, 'Store discount = 0.15 and let the format spec add the %'` },
        ],
        explain: py`Store rates as fractions (\`0.15\`) and let \`:.0%\` handle the presentation. That keeps the maths simple (\`price * (1 - discount)\`) and the display consistent.`,
      },
      {
        id: 'debug-total',
        task: py`Change the last line so it shows \`total\` instead, with **two decimals**, using the \`=\` specifier — for example \`total=21.00\`.`,
        hint: py`Put the spec after the \`=\`: \`f"{total=:.2f}"\`.`,
        tests: [
          { name: 'prints total= with two decimals', code: py`assert f"total={total:.2f}" in output, 'Use f"{total=:.2f}"'` },
        ],
        explain: py`With a spec, \`=\` uses \`format()\` instead of \`repr()\`, so you get \`total=21.00\`. Without one it would show \`total=21.0\`.`,
      },
      {
        id: 'repr-shop',
        task: py`Add a line that prints the shop name with \`!r\`, so you can see its quotes: \`'Corner Café'\`.`,
        hint: py`\`print(f"{shop!r}")\``,
        tests: [
          { name: 'prints the repr of shop', code: py`assert repr(shop) in output, 'Use the !r conversion'` },
        ],
        explain: py`\`!r\` calls \`repr()\`, which shows a string *as Python source* — quotes included. Add a trailing space to the shop name and look again: \`repr\` makes invisible characters visible.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'An f-string is filled in immediately',
    props: {
      code: py`price = 4.5
qty = 3
label = f"{qty} x {price:.2f} = {qty * price:.2f}"
price = 5.0
print(label)

template = "{qty} x {price:.2f}"
print(template.format(qty=qty, price=price))
`,
      notes: {
        3: 'The f-string is evaluated **now**: Python computes each expression, formats it, and builds an ordinary str.',
        4: 'Changing `price` afterwards doesn\'t touch `label` — it is just text.',
        5: '`label` still says 4.50.',
        7: 'A plain string with placeholders is only a template. Nothing is filled in yet.',
        8: '`.format()` fills it with the **current** values, so this line shows 5.00.',
      },
    },
    alt: 'A step-by-step trace. price is 4.5 and qty is 3. label is built from an f-string and becomes the string "3 x 4.50 = 13.50". price is then changed to 5.0, but label stays the same and prints 3 x 4.50 = 13.50. A plain template string "{qty} x {price:.2f}" is filled later with format(), printing 3 x 5.00.',
    caption: py`f-strings evaluate where they are written. When you need to fill a template *later* (or many times), use \`str.format\` on a stored template — or, in 3.14+, a t-string processed by a function.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Each \`{...}\` in an f-string does two things: evaluate the expression, then call \`format(value, spec)\` to turn the result into text. The literal parts and the formatted parts are joined into one new \`str\`. That's all — there's no hidden template left behind.`,
      { code: py`price = 1234.5
print(format(price, ",.2f"))   # what {price:,.2f} does under the hood
print(f"{price:,.2f}")`, lang: 'python', title: 'format() is the engine' },
      py`Because the spec is interpreted by the *value's type*, the same spec can mean different things: numbers understand \`.2f\`, strings understand \`>10\`, and dates understand \`%Y-%m-%d\` (see [dates & times](lesson:dates-and-times)): \`f"{today:%d %B %Y}"\`.`,
    ],
    technical: [
      py`\`format(value, spec)\` calls \`type(value).__format__(value, spec)\`. Every type implements its own mini-language. Your own classes can too, by defining \`__format__\` — see [special methods](lesson:special-methods):`,
      { code: py`class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    def __format__(self, spec):
        if spec == "F":
            return f"{self.celsius * 9 / 5 + 32:.1f}°F"
        return f"{self.celsius:{spec}}°C"

t = Temperature(21.5)
print(f"{t:.1f} / {t:F}")   # 21.5°C / 70.7°F`, lang: 'python', title: 'a custom __format__' },
      py`**Rounding** in \`.2f\` uses the exact binary value of the float, and ties round to the even digit. So \`f"{2.675:.2f}"\` is \`2.67\` (2.675 is stored as slightly *less* than 2.675), while \`f"{0.125:.2f}"\` is \`0.12\` (an exact tie, rounded to even). For money, store amounts as integer cents or use [\`decimal.Decimal\`](lesson:numbers-and-math) and only format at the end.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython compiles an f-string into bytecode that formats each value and joins the pieces (\`FORMAT_SIMPLE\`, \`FORMAT_WITH_SPEC\`, \`BUILD_STRING\` in 3.14 — run \`import dis; dis.dis('f"Hi {name}, you owe {total:.2f}"')\` to see it). There is no template parsing at run time, which is one reason f-strings are typically faster than \`str.format\`. Instruction names change between versions and other implementations do it differently.` },
      py`**t-strings (3.14+)** take a different path: \`t"Hello {name}"\` evaluates \`name\` immediately but **doesn't** format or join anything. You get a \`string.templatelib.Template\`; iterating over it yields literal strings and \`Interpolation\` objects (each with \`.value\`, \`.expression\`, \`.conversion\` and \`.format_spec\`). A processing function decides what to do with each value:`,
      { code: py`from string.templatelib import Interpolation
import html

def render_html(template):
    parts = []
    for part in template:
        if isinstance(part, Interpolation):
            parts.append(html.escape(str(part.value)))   # escape user data
        else:
            parts.append(part)                           # trusted literal text
    return "".join(parts)

comment = "<script>alert('hi')</script>"
print(render_html(t"<p>{comment}</p>"))
# <p>&lt;script&gt;alert(&#x27;hi&#x27;)&lt;/script&gt;</p>`, lang: 'python', title: 'simplified t-string processor (Python 3.14+)' },
      py`That example is **simplified**: real HTML templating libraries also handle attributes, nested templates and format specs. The point is the shape — values arrive separately from literal text, so they can't be confused with markup.`,
    ],
    production: [
      py`**Logging:** pass values as arguments, \`logger.info("order %s paid %.2f", order_id, amount)\`, not an f-string. The message is only formatted if that log level is enabled, and log aggregation tools can group messages by their constant template. See [logging](lesson:logging).`,
      py`**Never format untrusted input into code-like strings.** f-strings in SQL (\`f"SELECT * FROM users WHERE name = '{name}'"\`) cause SQL injection — use parameterised queries ([SQL & sqlite3](lesson:sql-and-sqlite), [injection attacks](lesson:injection-attacks)). The same applies to shell commands and HTML.`,
      py`**Never let users supply format strings to \`str.format\`.** A template like \`"{user.__init__.__globals__}"\` can walk attributes and leak secrets from your program. If users write templates (email subjects, notifications), use \`string.Template\` with \`safe_substitute\`, which only substitutes plain \`$names\`.`,
      py`**Internationalisation:** translators need the whole sentence with named placeholders (\`"{name} has {count} messages"\`), because word order differs between languages. Translation libraries such as \`gettext\` therefore work with \`str.format\`-style or \`%\`-style templates, not f-strings.`,
    ],
  },
  mistakes: [
    {
      title: 'Forgetting the f prefix',
      wrong: { code: py`name = "Ada"
print("Hello, {name}!")    # Hello, {name}!`, lang: 'python' },
      right: { code: py`name = "Ada"
print(f"Hello, {name}!")   # Hello, Ada!`, lang: 'python' },
      explanation: py`Without the \`f\`, braces are just characters. Linters such as Ruff can flag strings that look like they were meant to be f-strings.`,
    },
    {
      title: 'Formatting a number that is still a string',
      wrong: { code: py`price = input("Price? ")      # always a str, e.g. "4.5"
print(f"{price:.2f}")       # ValueError: Unknown format code 'f' for object of type 'str'`, lang: 'python', static: true },
      right: { code: py`price = float("4.5")          # convert input first
print(f"{price:.2f}")       # 4.50`, lang: 'python' },
      explanation: py`Numeric specs like \`.2f\` only work on numbers. \`input()\` and file data give you strings — convert with \`float()\` or \`int()\` first (see [type conversion](lesson:type-conversion)).`,
    },
    {
      title: 'Using round() to format for display',
      wrong: { code: py`total = 21.0
print("Total:", round(total, 2))   # Total: 21.0 — not 21.00`, lang: 'python' },
      right: { code: py`total = 21.0
print(f"Total: {total:.2f}")       # Total: 21.00`, lang: 'python' },
      explanation: py`\`round()\` returns a number, and numbers don't remember trailing zeros. Formatting with \`.2f\` controls the *text* and always shows exactly two decimals.`,
    },
    {
      title: 'Building SQL with an f-string',
      wrong: { code: py`name = "Robert'); DROP TABLE students;--"
query = f"SELECT * FROM students WHERE name = '{name}'"   # SQL injection!`, lang: 'python' },
      right: { code: py`import sqlite3
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE students (name TEXT)")
name = "Robert'); DROP TABLE students;--"
rows = db.execute("SELECT * FROM students WHERE name = ?", (name,)).fetchall()
print(rows)   # [] — the name is treated as data, never as SQL`, lang: 'python' },
      explanation: py`f-strings paste text in; they don't know about SQL quoting. Let the database driver insert values with placeholders (\`?\`). See [injection attacks](lesson:injection-attacks).`,
    },
    {
      title: 'Reusing the outer quotes before Python 3.12',
      wrong: { code: py`names = ["Ada", "Grace"]
print(f"Team: {", ".join(names)}")   # SyntaxError on Python 3.11 and older`, lang: 'python', static: true },
      right: { code: py`names = ["Ada", "Grace"]
print(f"Team: {', '.join(names)}")   # works on every version`, lang: 'python' },
      explanation: py`PEP 701 (3.12) allows any quotes inside the braces. If your project supports older Pythons, use the other quote type inside — or compute the value on its own line first, which is often more readable anyway.`,
    },
    {
      title: 'Expecting a literal brace',
      wrong: { code: py`print(f"Set: {1, 2}")     # Set: (1, 2) — braces were treated as a field`, lang: 'python' },
      right: { code: py`print(f"Set: {{1, 2}}")   # Set: {1, 2}`, lang: 'python' },
      explanation: py`Inside f-strings (and \`str.format\` templates), double the braces to get literal \`{\` and \`}\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: Unknown format code 'f' for object of type 'str'`,
      cause: py`A numeric format spec (\`.2f\`, \`d\`, \`%\`) was applied to a string, usually input that was never converted.`,
      fix: py`Convert first: \`float(text)\`. Use \`f"{value!r}"\` to check what type of value you really have.`,
    },
    {
      symptom: py`SyntaxError: f-string: expecting '}'`,
      cause: py`An unbalanced brace inside an f-string, e.g. \`f"{name"\` or a stray \`{\` meant literally.`,
      fix: py`Close every \`{\`; write literal braces as \`{{\` and \`}}\`.`,
    },
    {
      symptom: py`IndexError: Replacement index 1 out of range for positional args tuple`,
      cause: py`A \`str.format\` template has more \`{}\` fields than arguments passed to \`format()\`.`,
      fix: py`Pass one argument per field, or switch to named fields (\`{name}\`) or an f-string.`,
    },
    {
      symptom: py`KeyError: 'name'`,
      cause: py`\`"{name}".format(...)\` was called without a \`name=\` keyword argument.`,
      fix: py`Pass every named field, e.g. \`.format(name=name)\` or \`.format_map(values)\`.`,
    },
    {
      symptom: py`TypeError: not enough arguments for format string`,
      cause: py`A \`%\`-style string has more \`%s\`/\`%d\` markers than values, or a single value was passed where a tuple was expected. A literal \`%\` must be written \`%%\`.`,
      fix: py`Pass a tuple with one value per marker — or rewrite the line as an f-string.`,
    },
  ],
  bestPractices: [
    'Use f-strings for new code; keep expressions inside the braces short and simple.',
    'Format money and measurements with an explicit precision: {amount:,.2f}, not round().',
    'Store rates as fractions (0.15) and display them with :.0% or :.1%.',
    'Debug with {value=} and {value!r} — they show names, quotes and hidden whitespace.',
    'Use %-style arguments in logging calls: logger.info("saved %s", path).',
    'Never format untrusted values into SQL, shell commands or HTML — use parameters and escaping.',
    'Never let users supply str.format templates; use string.Template.safe_substitute for user-editable templates.',
    'Mention version requirements when relying on 3.12+ f-string syntax or 3.14 t-strings.',
  ],
  useCases: [
    'Receipts, invoices and reports with aligned columns and two-decimal amounts.',
    'Progress messages and percentages: f"{done / total:.0%} complete".',
    'Debug output: print(f"{response.status=} {len(items)=}").',
    'Zero-padded identifiers and times: f"INV-{number:06d}", f"{minutes:02d}:{seconds:02d}".',
    'Clear error messages: raise ValueError(f"Unknown colour: {colour!r}").',
  ],
  comparison: {
    title: 'Three ways to format the same line',
    headers: ['', 'f-string (3.6+)', 'str.format (2.6+)', '% formatting (oldest)'],
    rows: [
      ['example', 'f"{name} owes {amount:.2f}"', '"{} owes {:.2f}".format(name, amount)', '"%s owes %.2f" % (name, amount)'],
      ['values appear', 'inline, where they are used', 'separately, as arguments', 'separately, as a tuple'],
      ['evaluated', 'immediately, at that line', 'when .format() is called', 'when % is applied'],
      ['mini-language', 'full format spec', 'full format spec', 'its own, smaller set (%5.2f, %-10s)'],
      ['best for', 'almost everything', 'templates stored elsewhere (config, translations)', 'logging calls and legacy code'],
    ],
    note: py`All three end up calling the same kinds of formatting code. Pick f-strings by default; recognise the others when you read them.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'string-formatting-q1',
      type: 'mcq',
      prompt: py`What does \`f"{3.14159:.2f}"\` produce?`,
      options: [
        '3.14',
        { text: '3.1', why: '.2 means two digits after the decimal point for the f type, not two significant digits.' },
        { text: '3.14159', why: 'The precision .2 limits the output to two decimal places.' },
        { text: '  3.14', why: 'No width was given, so there is no padding.' },
      ],
      answer: 0,
      explanation: py`\`.2f\` = fixed-point notation with 2 digits after the decimal point. For two *significant* digits you'd use \`.2g\` (\`3.1\`).`,
    },
    {
      id: 'string-formatting-q2',
      type: 'output',
      prompt: 'Which line does this print? (Spaces matter.)',
      code: py`print(f"{'cat':>6}|{'dog':<6}|")`,
      options: [
        '   cat|dog   |',
        { text: 'cat   |   dog|', why: '> means right-align (padding goes on the left) and < means left-align.' },
        { text: 'cat|dog|', why: 'A width of 6 pads each word to six characters.' },
        { text: ' cat  | dog  |', why: 'That would be centring (^), and even then the split of spaces differs.' },
      ],
      answer: 0,
      explanation: py`\`>6\` right-aligns \`cat\` in 6 characters (3 spaces then \`cat\`); \`<6\` left-aligns \`dog\` (\`dog\` then 3 spaces).`,
    },
    {
      id: 'string-formatting-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`item = "tea"
qty = 3
print(f"{item=} {qty=}")`,
      answer: "item='tea' qty=3",
      accept: ["item='tea' qty=3"],
      explanation: py`The \`=\` specifier (3.8+) prints the expression, \`=\`, and the value's **repr** — so strings appear with quotes.`,
    },
    {
      id: 'string-formatting-q4',
      type: 'bug',
      prompt: 'This prints `{name} scored {score} points` instead of the values. Click the buggy line.',
      code: py`name = "Ada"
score = 98
print("{name} scored {score} points")`,
      answerLine: 3,
      explanation: py`The string is missing the \`f\` prefix, so the braces are printed literally. Write \`print(f"{name} scored {score} points")\`.`,
    },
    {
      id: 'string-formatting-q5',
      type: 'fill',
      prompt: 'Fill in the two format specs so the program prints `85.0%` and then `007`.',
      code: py`ratio = 0.85
print(f"{ratio:___}")
agent = 7
print(f"{agent:___}")`,
      answer: [['.1%'], ['03d', '03', '0>3', '>03']],
      explanation: py`\`.1%\` multiplies by 100, shows one decimal and adds a percent sign. \`03d\` pads an integer with zeros to width 3 (\`0>3\` — fill with 0, right-align, width 3 — also works).`,
    },
    {
      id: 'string-formatting-q6',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`total = 5
print(f"{{total}} = {total}")`,
      options: [
        '{total} = 5',
        { text: '5 = 5', why: 'Doubled braces {{ and }} produce literal braces; they are not a replacement field.' },
        { text: '{5} = 5', why: 'The doubled braces escape the field entirely, so the name total is printed as text.' },
        { text: 'SyntaxError', why: 'Doubled braces are the documented way to write a literal brace.' },
      ],
      answer: 0,
      explanation: py`\`{{\` and \`}}\` are escapes for literal braces, so \`{{total}}\` prints \`{total}\`. Only the single-brace field is replaced.`,
    },
    {
      id: 'string-formatting-q7',
      type: 'short',
      prompt: 'Why should you NOT build a SQL query with an f-string such as `f"... WHERE name = \'{name}\'"`?',
      answer: py`An f-string pastes the value into the SQL text, so a value containing quotes or SQL (e.g. "x' OR '1'='1") changes the meaning of the query — SQL injection. Use parameterised queries (placeholders like ? with the values passed separately), so the database driver treats the value strictly as data.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'format-price',
      title: 'Format a price',
      difficulty: 'beginner',
      prompt: py`Write \`format_price(amount)\` that returns the amount as a dollar string with **thousands separators** and **exactly two decimals**. Negative amounts put the minus sign *before* the dollar sign.

\`\`\`text
format_price(1234.5)    ->  "$1,234.50"
format_price(0)         ->  "$0.00"
format_price(1000000)   ->  "$1,000,000.00"
format_price(-5)        ->  "-$5.00"
\`\`\``,
      files: {
        'main.py': py`def format_price(amount):
    # TODO: "$" + the amount with thousands separators and 2 decimals
    return str(amount)


print(format_price(1234.5))
print(format_price(-5))
`,
      },
      hints: [
        'The spec ",.2f" gives thousands separators and two decimals. A $ before the braces is just literal text.',
        'For negatives, format abs(amount) and put the sign in front yourself. A conditional expression helps: sign = "-" if amount < 0 else "".',
        'return f"{sign}${abs(amount):,.2f}"',
      ],
      solution: {
        explanation: py`\`,.2f\` does all the hard work: two decimals (rounded), and a comma every three digits. Formatting \`abs(amount)\` keeps the minus sign out of the number so we can place it before the \`$\` ourselves. \`"-" if amount < 0 else ""\` is a *conditional expression*: it evaluates to \`"-"\` for negative amounts and \`""\` otherwise. (In real money code, amounts would be integer cents or \`Decimal\`, but the formatting is the same.)`,
        files: {
          'main.py': py`def format_price(amount):
    sign = "-" if amount < 0 else ""
    return f"{sign}\${abs(amount):,.2f}"


print(format_price(1234.5))
print(format_price(-5))
`,
        },
      },
      tests: [
        { name: '1234.5 becomes $1,234.50', code: py`assert format_price(1234.5) == "$1,234.50"` },
        { name: 'zero becomes $0.00', code: py`assert format_price(0) == "$0.00"` },
        { name: 'a million gets two separators', code: py`assert format_price(1000000) == "$1,000,000.00"` },
        { name: 'negative amounts are -$5.00', code: py`assert format_price(-5) == "-$5.00"` },
        { name: 'rounds to two decimals', code: py`assert format_price(9.999) == "$10.00"` },
      ],
    },
    {
      id: 'progress-bar',
      title: 'Text progress bar',
      difficulty: 'beginner',
      prompt: py`Write \`progress_bar(done, total, width=20)\` that returns a text progress bar:

- the bar is \`width\` characters long, inside square brackets;
- the first \`done * width // total\` characters are \`#\`, the rest are \`.\`;
- after the bar comes a space and the percentage with **no decimals**.

\`\`\`text
progress_bar(5, 20)           ->  "[#####...............] 25%"
progress_bar(0, 10)           ->  "[....................] 0%"
progress_bar(10, 10)          ->  "[####################] 100%"
progress_bar(1, 3, width=6)   ->  "[##....] 33%"
\`\`\``,
      files: {
        'main.py': py`def progress_bar(done, total, width=20):
    filled = 0              # TODO: how many characters are "#"?
    bar = ""                # TODO: "#" repeated, then "." repeated
    return f"[{bar}]"       # TODO: add the percentage


print(progress_bar(5, 20))
print(progress_bar(1, 3, width=6))
`,
      },
      hints: [
        'String repetition builds the bar: "#" * filled + "." * (width - filled).',
        'done / total is a fraction like 0.25. Which format type turns a fraction into a percentage?',
        'return f"[{bar}] {done / total:.0%}"',
      ],
      solution: {
        explanation: py`\`done * width // total\` scales progress to the bar's width using integer division, so the bar is always whole characters. \`"#" * filled + "." * (width - filled)\` keeps the total length equal to \`width\`. The \`%\` format type multiplies the fraction by 100 and appends \`%\`; \`.0\` removes the decimals, so \`1 / 3\` displays as \`33%\`.`,
        files: {
          'main.py': py`def progress_bar(done, total, width=20):
    filled = done * width // total
    bar = "#" * filled + "." * (width - filled)
    return f"[{bar}] {done / total:.0%}"


print(progress_bar(5, 20))
print(progress_bar(1, 3, width=6))
`,
        },
      },
      tests: [
        { name: 'a quarter done', code: py`assert progress_bar(5, 20) == "[#####...............] 25%"` },
        { name: 'nothing done', code: py`assert progress_bar(0, 10) == "[....................] 0%"` },
        { name: 'all done', code: py`assert progress_bar(10, 10) == "[####################] 100%"` },
        { name: 'custom width and rounding', code: py`assert progress_bar(1, 3, width=6) == "[##....] 33%"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'string-formatting-three-styles',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Python has f-strings, str.format() and %-formatting. Which do you use, and is there still a reason to use the older ones?',
      answer: 'f-strings for almost everything: most readable, values inline, typically fastest. str.format when the template is stored separately from the values (config, translations). %-style in logging calls, where formatting is deferred until the record is emitted.',
      explanation: py`All three produce strings, and f-strings and \`str.format\` share the same format-spec mini-language. The key difference is *when* evaluation happens: an f-string is evaluated where it's written, so it can't be a reusable template. Logging's \`%\`-style arguments are only interpolated if the message is actually emitted, and the constant template helps log aggregation.`,
      whyAsked: 'A practical style question that reveals whether you know the trade-offs or just a habit.',
      mistakes: ['Saying the old styles are deprecated (they are not)', 'Using f-strings inside logging calls without knowing the trade-off', 'Not knowing that f-strings evaluate immediately'],
      followUps: ['Why can\'t an f-string be loaded from a config file?', 'What does logging do with the arguments if the level is disabled?'],
      modelAnswer: 'By default I use f-strings: the values sit inline where they are used, they support the full format-spec mini-language and they are usually the fastest option. The older styles are not deprecated, and each still has a niche. str.format is useful when the template lives somewhere else, like a translation file, because an f-string is evaluated immediately where it is written. And for logging I pass %-style arguments, logger.info("user %s", name), so the message is only built if that level is enabled and log tools can group by the constant template.',
    },
    {
      id: 'string-formatting-spec-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print?',
      code: { lang: 'python', code: py`print(f"{0.5:.0%} {1e6:,.0f} {42:08.3f} {255:#x}")` },
      options: [
        '50% 1,000,000 0042.000 0xff',
        '0.5% 1,000,000 42.000 ff',
        '50% 1000000.0 00042.00 0xff',
        '50.0% 1e+06 0042.000 255',
      ],
      correctOption: 0,
      answer: '50% 1,000,000 0042.000 0xff',
      explanation: py`\`.0%\` multiplies by 100 with no decimals → \`50%\`. \`,.0f\` gives fixed-point with separators and no decimals → \`1,000,000\`. \`08.3f\` is width 8, zero-padded, 3 decimals: \`42.000\` is 6 characters, so two zeros are added → \`0042.000\`. \`#x\` is hex with a \`0x\` prefix → \`0xff\`.`,
      whyAsked: 'Tests fluent reading of the mini-language, which comes up constantly in reporting code.',
      mistakes: ['Thinking width counts only digits before the decimal point', 'Forgetting that % multiplies by 100'],
      followUps: ['How would you show exactly 3 significant digits?', 'What does the z option do?'],
      modelAnswer: 'It prints 50% 1,000,000 0042.000 0xff. The percent type multiplies by a hundred, and .0 drops the decimals. ,.0f is fixed-point with thousands separators and no decimals. 08.3f means a total width of eight, padded with zeros, with three decimals — 42.000 is six characters, so two zeros go in front. And #x formats as hexadecimal with the 0x prefix.',
    },
    {
      id: 'string-formatting-float-rounding',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 4,
      question: 'Why does `f"{2.675:.2f}"` print `2.67` and `f"{0.125:.2f}"` print `0.12`, when school rounding would give 2.68 and 0.13? How would you format money correctly?',
      code: { lang: 'python', code: py`from decimal import Decimal, ROUND_HALF_UP
print(f"{2.675:.2f} {0.125:.2f}")                 # 2.67 0.12
print(Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # 2.68` },
      answer: '2.675 is stored in binary as slightly less than 2.675, so it rounds down. 0.125 is stored exactly, and exact ties round to the even digit (banker\'s rounding). For money, use Decimal with an explicit rounding mode, or integer cents.',
      explanation: py`Floats are binary fractions; most decimal fractions can't be represented exactly. Formatting works on the *exact* stored value, and for exact halves Python (like IEEE 754) rounds to even, which avoids systematic bias when summing many rounded values. \`decimal.Decimal("2.675")\` stores the decimal digits exactly and lets you choose \`ROUND_HALF_UP\` if your business rule requires it. Note: build Decimals from strings, not floats — \`Decimal(2.675)\` would capture the binary error.`,
      whyAsked: 'Money bugs are expensive; this checks whether you understand floating point instead of blaming Python.',
      mistakes: ['Calling it a Python bug', 'Suggesting round() fixes it (it has the same behaviour)', 'Constructing Decimal from a float'],
      followUps: ['What does round(2.5) return?', 'Why is round-half-to-even the default?'],
      modelAnswer: 'Two different reasons. 2.675 cannot be stored exactly as a binary float — the stored value is a tiny bit below 2.675 — so rounding to two places correctly gives 2.67. 0.125 is exactly representable, so it is a true tie, and Python rounds ties to the even digit, which gives 0.12; that rule avoids bias when many values are rounded. For money I would not use floats at all: either integer cents, or decimal.Decimal built from strings, with an explicit rounding mode like ROUND_HALF_UP, and only format at the very end.',
    },
    {
      id: 'string-formatting-user-templates',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your app lets customers customise notification text such as "Hi {user.name}, your order shipped". The code does `template.format(user=user)`. A security reviewer flags it. What is the risk and what would you do instead?',
      code: { lang: 'python', code: py`SECRET_KEY = "s3cr3t"

class User:
    def __init__(self, name):
        self.name = name

template = "{user.__init__.__globals__[SECRET_KEY]}"   # written by an attacker
print(template.format(user=User("ada")))               # leaks s3cr3t` },
      answer: 'str.format field names can traverse attributes and index items, so a malicious template can reach module globals (secrets, config) through any object passed in. Use string.Template with safe_substitute and a whitelist of plain values, or a sandboxed template engine.',
      explanation: py`Replacement fields support \`.attr\` and \`[key]\` lookups. From any function or method you can reach \`__globals__\`, i.e. the module's namespace. \`string.Template\` only substitutes \`$identifier\` placeholders from the mapping you pass — no attribute access, no format specs — and \`safe_substitute\` leaves unknown placeholders untouched instead of raising. Pass plain strings (\`name=user.name\`), not rich objects. For anything richer, use a sandboxed engine such as Jinja2's \`SandboxedEnvironment\`.`,
      whyAsked: 'Format-string injection is a real vulnerability class; this checks security awareness beyond SQL injection.',
      mistakes: ['Thinking only eval() can leak data', 'Trying to blacklist "__" in templates instead of changing the mechanism', 'Suggesting f-strings (they cannot be user-supplied at all without eval)'],
      followUps: ['Why is passing the whole user object risky even with a whitelist of placeholders?', 'How do t-strings (3.14) relate to this problem?'],
      modelAnswer: 'str.format is more powerful than it looks: field names can follow attributes and index into items. So a template written by a customer can walk from the user object to a method, then to __globals__, and read anything in that module, such as secret keys. Blacklisting underscores is fragile; I would change the mechanism. For user-editable text I would use string.Template with safe_substitute, which only replaces plain $name placeholders from a mapping I build, and I would pass simple strings like the name, never whole objects. If customers need loops or conditions, I would use a sandboxed template engine.',
    },
    {
      id: 'string-formatting-logging-lazy',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why do style guides recommend `logger.debug("loaded %s rows", count)` instead of `logger.debug(f"loaded {count} rows")`?',
      answer: 'With %-style arguments, the logging module formats the message only if the record will actually be emitted, and the message template stays constant, which helps log aggregation and filtering. The f-string is always evaluated, even when DEBUG is disabled.',
      explanation: py`Logging stores \`msg\` and \`args\` on the \`LogRecord\` and only calls \`msg % args\` when a handler formats it. If DEBUG is off, no string is built. A constant template like \`"loaded %s rows"\` also lets tools such as Sentry group identical events. The arguments themselves are still evaluated, so expensive computations should be guarded with \`if logger.isEnabledFor(logging.DEBUG):\`. Linters (Ruff's \`G004\`, pylint's \`logging-fstring-interpolation\`) can enforce the style.`,
      code: { lang: 'python', code: py`import logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("import")
count = 1200
logger.debug("loaded %s rows", count)    # not formatted: DEBUG is disabled
logger.info("loaded %s rows", count)     # INFO loaded 1200 rows` },
      whyAsked: 'Shows familiarity with production logging practices and with when formatting actually happens.',
      mistakes: ['Saying f-strings are "not allowed" in logging without explaining why', 'Thinking the arguments are not evaluated at all'],
      followUps: ['How would you avoid computing an expensive argument when DEBUG is off?', 'What does logger.exception add?'],
      modelAnswer: 'When I pass arguments separately, the logging module keeps the template and the values on the log record and only does the % formatting if the record is actually emitted. So if DEBUG is disabled, no string gets built. The template also stays constant, which lets log aggregation tools group the same message across many values. With an f-string the text is always built before logging even sees it. The arguments are still evaluated either way, so for something expensive I would check logger.isEnabledFor first.',
    },
    {
      id: 'string-formatting-tstrings',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Python 3.14 added template strings, t"...". How do they differ from f-strings, and what problem do they solve?',
      answer: 't"..." evaluates the interpolated expressions immediately like an f-string, but returns a string.templatelib.Template instead of a str. The literal parts and the values (as Interpolation objects with value, expression, conversion and format_spec) stay separate, so a processing function can escape or parameterise each value — safe HTML, SQL, shell or structured logging.',
      explanation: py`The core issue with f-strings in security-sensitive places is that formatting erases the boundary between trusted text and untrusted values. A \`Template\` preserves that boundary. Because it isn't a \`str\`, you can't accidentally send it somewhere that expects text: concatenating it with a \`str\` raises \`TypeError\`. Libraries can accept \`Template\` objects and decide how each value is rendered. It's new in 3.14 (PEP 750), so code using t-strings won't even parse on older versions.`,
      code: { lang: 'python', code: py`name = "Ada"
tmpl = t"Hello {name!r:>8}!"
for part in tmpl:
    print(repr(part))
# 'Hello '
# Interpolation('Ada', 'name', 'r', '>8')
# '!'` },
      whyAsked: 'Checks that you follow language evolution and understand why separating data from code matters.',
      mistakes: ['Saying t-strings are just lazy f-strings (values are evaluated eagerly)', 'Thinking you can print a t-string to get formatted text', 'Not mentioning the version requirement'],
      followUps: ['How would you write a function that renders a Template with HTML escaping?', 'How does this relate to parameterised SQL queries?'],
      modelAnswer: 'A t-string looks like an f-string, and its expressions are evaluated immediately, but the result is a Template object rather than a str. It keeps the literal pieces and the interpolated values separate — each value comes as an Interpolation with the value, the original expression text, the conversion and the format spec. That lets a library decide how to render each value: escape it for HTML, turn it into a SQL parameter, or log it as structured data. Because it is not a string, you cannot accidentally concatenate it or send it to something expecting text. It is a Python 3.14 feature, so it is mainly for library authors right now.',
    },
    {
      id: 'string-formatting-duration',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Write `format_duration(seconds)` that returns a non-negative number of seconds as `"HH:MM:SS"` with two-digit, zero-padded fields: 3723 → "01:02:03". Hours may grow past 99 (360000 → "100:00:00").',
      answer: 'Use divmod twice to split into hours, minutes and seconds, then f"{h:02d}:{m:02d}:{s:02d}".',
      explanation: py`\`divmod(a, b)\` returns \`(a // b, a % b)\` in one step. Splitting off hours (3600 s) and then minutes (60 s) leaves seconds. \`:02d\` pads to *at least* two digits, so hours beyond 99 simply get wider — width is a minimum, never a truncation.`,
      starter: { files: { 'main.py': py`def format_duration(seconds):
    # TODO: split into hours, minutes and seconds, then format as HH:MM:SS
    return str(seconds)


print(format_duration(3723))
` } },
      tests: [
        { name: '3723 seconds is 01:02:03', code: py`assert format_duration(3723) == "01:02:03"` },
        { name: 'under a minute', code: py`assert format_duration(59) == "00:00:59"` },
        { name: 'zero', code: py`assert format_duration(0) == "00:00:00"` },
        { name: 'more than 99 hours', code: py`assert format_duration(360000) == "100:00:00"` },
      ],
      solution: { files: { 'main.py': py`def format_duration(seconds):
    hours, rest = divmod(seconds, 3600)
    minutes, secs = divmod(rest, 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


print(format_duration(3723))
` } },
      hints: ['divmod(seconds, 3600) gives hours and the remaining seconds.', 'The spec 02d pads an integer with zeros to width 2.'],
      whyAsked: 'A quick check of integer arithmetic plus format specs — the kind of utility every codebase has.',
      mistakes: ['Using / instead of // and getting floats', 'Hard-coding string slicing of the hours to two digits', 'Forgetting zero padding'],
      followUps: ['How would you do this with datetime.timedelta?', 'How would you handle negative durations?'],
      modelAnswer: 'I split the total with divmod: divmod by 3600 gives the hours and the leftover seconds, and divmod of the leftover by 60 gives minutes and seconds. Then a single f-string with 02d on each field gives zero-padded two-digit values. Because a width in a format spec is a minimum, hours over 99 just become three digits rather than being cut off. For anything involving dates I would reach for datetime.timedelta instead.',
    },
  ],

  takeaways: [
    'f"...{expr}..." evaluates each expression immediately and builds an ordinary str; double braces {{ }} give literal braces.',
    'After the colon, the format spec controls the look: fill/align (<, >, ^), width, grouping (, or _), precision (.2) and type (f, d, %, e, x).',
    '{value=} (3.8+) shows the expression and its repr; !r shows quotes and hidden whitespace — both are great for debugging.',
    'Python 3.12 (PEP 701) allows any quotes, backslashes and comments inside f-string braces; older versions do not.',
    'str.format suits templates stored elsewhere; %-style suits logging. Never format untrusted values into SQL, shell or HTML, and never let users write str.format templates.',
    't"..." (3.14+) returns a Template object, not a str, so libraries can process values safely.',
  ],
}

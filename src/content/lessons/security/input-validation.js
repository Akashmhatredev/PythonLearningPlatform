// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SIGNUP = py`import re
import unicodedata
from dataclasses import dataclass

USERNAME_RE = re.compile(r"[a-z0-9_]{3,20}")
COUNTRIES = {"GB", "IN", "US", "DE", "JP"}   # allow-list


class ValidationError(ValueError):
    """Bad input. The message is safe to show to the user."""


@dataclass(frozen=True)
class SignUp:
    username: str
    age: int
    country: str


def clean_text(raw, max_len):
    if not isinstance(raw, str):
        raise ValidationError("expected text")
    if len(raw) > 4 * max_len:          # cheap check before any real work
        raise ValidationError("input is far too long")
    text = unicodedata.normalize("NFKC", raw).strip()
    if len(text) > max_len:
        raise ValidationError(f"at most {max_len} characters")
    return text


def parse_username(raw):
    name = clean_text(raw, 20).casefold()
    if not USERNAME_RE.fullmatch(name):
        raise ValidationError("username: 3-20 of a-z, 0-9, _")
    return name


def parse_age(raw):
    text = clean_text(raw, 3)
    if not (text.isascii() and text.isdecimal()):
        raise ValidationError("age: digits 0-9 only")
    age = int(text)
    if not 13 <= age <= 120:
        raise ValidationError("age: must be 13-120")
    return age


def parse_country(raw):
    code = clean_text(raw, 2).upper()
    if code not in COUNTRIES:
        raise ValidationError("country: not supported")
    return code


def parse_signup(form):
    return SignUp(
        username=parse_username(form.get("username", "")),
        age=parse_age(form.get("age", "")),
        country=parse_country(form.get("country", "")),
    )


forms = [
    {"username": "  Ada_Lovelace ", "age": "36", "country": "gb"},
    {"username": "ｂｏｂ", "age": "15", "country": "US"},
    {"username": "eve' OR '1'='1", "age": "20", "country": "GB"},
    {"username": "cy", "age": "40", "country": "IN"},
    {"username": "dee", "age": "٤٢", "country": "DE"},
    {"username": "fin", "age": "-5", "country": "JP"},
    {"username": "gus", "age": "30", "country": "FR"},
]

for form in forms:
    try:
        user = parse_signup(form)
    except ValidationError as err:
        print("REJECTED", repr(form.get("username")), "->", err)
    else:
        print("ACCEPTED", user)
`

const TRACE = py`def parse_quantity(raw):
    text = raw.strip()
    if not (text.isascii() and text.isdecimal()):
        raise ValueError("digits only")
    qty = int(text)
    if not 1 <= qty <= 10:
        raise ValueError("1 to 10 please")
    return qty


for raw in [" 3 ", "²", "50"]:
    try:
        print("ok:", parse_quantity(raw))
    except ValueError as err:
        print("rejected:", repr(raw), err)
`

export default {
  id: 'input-validation',
  title: 'Input validation & trust boundaries',
  summary: 'Treat every value that crosses a trust boundary as hostile until you have normalised it, checked it against an allow-list and turned it into a typed object.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['raising-exceptions', 'string-methods', 'dataclasses'],
  related: ['injection-attacks', 'secrets-and-passwords', 'secure-practices', 'unicode-and-bytes', 'regular-expressions', 'custom-exceptions', 'type-conversion', 'building-apis', 'json-data', 'enums'],
  tags: ['security', 'input validation', 'trust boundary', 'allow-list', 'block-list', 'parse dont validate', 'normalisation', 'unicode', 'casefold', 'NFKC', 'fullmatch', 'int parsing', 'NaN', 'pydantic', 'mass assignment', 'server-side validation', 'OWASP'],
  apis: [
    { name: 'unicodedata.normalize(form, s)', summary: 'Returns the Unicode normal form of s. NFKC folds look-alike "compatibility" characters (ｆｕｌｌｗｉｄｔｈ, ligatures, superscripts) into plain ones.' },
    { name: 'str.casefold()', summary: 'An aggressive lower() for caseless comparison: "Straße".casefold() == "strasse".' },
    { name: 're.fullmatch(pattern, s)', summary: 'Matches only if the whole string matches. Safer than re.match with ^…$, because $ also matches before a trailing newline.' },
    { name: 'str.isascii() / str.isdecimal()', summary: 'Together they accept exactly the characters 0–9. isdigit() also accepts superscripts like "²" that int() rejects.' },
    { name: 'int(text)', summary: 'Parses an integer. Also accepts surrounding whitespace, a sign, underscores and non-ASCII decimal digits — and refuses strings over 4300 digits by default.' },
    { name: 'math.isfinite(x)', summary: 'False for NaN and ±inf — floats that slip through careless range checks.' },
    { name: '@dataclass(frozen=True)', summary: 'An immutable typed record: the "parsed" result your core logic can trust.' },
  ],
  docs: [
    { label: 'unicodedata.normalize()', url: 'https://docs.python.org/3/library/unicodedata.html#unicodedata.normalize' },
    { label: 're.fullmatch() and the $ anchor', url: 'https://docs.python.org/3/library/re.html#re.fullmatch' },
    { label: 'str.casefold() and the str predicates', url: 'https://docs.python.org/3/library/stdtypes.html#str.casefold' },
    { label: 'Integer string conversion length limit', url: 'https://docs.python.org/3/library/stdtypes.html#int-max-str-digits' },
    { label: 'OWASP Input Validation Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **trust boundary** is any line where data enters your program from somewhere you don't control: a web form, a JSON request body, an uploaded file, a command-line argument, a message from another service, even rows another team writes into a shared database. On one side the data could be *anything*; on the other side your code assumes it is sensible.`,
    py`**Input validation** is the checkpoint on that line. Before the data is used, you check its **type** (is it text? a number?), **length** (how big?), **format** (does it look like a username?), **range** (is the age between 13 and 120?) and **membership** (is the country one we support?). Anything that fails is rejected with a clear error.`,
    py`The professional version goes one step further: **parse, don't validate**. Instead of checking a raw string and then passing the same raw string around, you *convert* it — once, at the boundary — into a typed object such as a frozen dataclass. Code behind the boundary only ever sees \`SignUp(username='ada', age=36, country='GB')\`, never the raw form.`,
    py`This is the first of four security lessons. Next come [injection attacks](lesson:injection-attacks), [secrets & passwords](lesson:secrets-and-passwords) and [secure practices](lesson:secure-practices).`,
  ],
  why: [
    py`Most security bugs begin with an assumption about input: "the age is a number", "the file name has no slashes", "nobody will send a 2 GB JSON body". Attackers don't use your app the way you designed it — they send whatever bytes they like, directly to your server, skipping your web page and its JavaScript entirely.`,
    py`Validation also makes ordinary code more robust. A function that receives a \`SignUp\` object doesn't need to wonder whether \`age\` is \`"36"\`, \`36\`, \`" 36 "\` or \`None\`. Errors surface early, at the edge, with a message that names the field — instead of deep inside the program as a confusing \`TypeError\`.`,
    py`One caution up front: validation reduces risk but does not replace the right defence at the point of *use*. A valid surname can still contain an apostrophe (\`O'Brien\`), so SQL must still be parameterised and HTML must still be escaped. Validation is one layer of **defence in depth** — several independent protections, so one mistake isn't fatal.`,
  ],
  eli15: [
    py`Picture a nightclub. The bouncer at the door checks every person **before** they get in: ID card real? old enough? on the guest list? Once you're inside, the bartender doesn't check again — they trust the door.`,
    py`Your program's door is wherever data comes in. The bouncer's rules are your validation: "must be text, 3–20 letters, only these characters". Notice the bouncer uses a **guest list** (only these names get in) rather than a **ban list** (everyone except these names gets in) — a stranger in a fake moustache isn't on the ban list, but they aren't on the guest list either.`,
    py`And the best bouncers hand you a wristband. After the door, nobody looks at your messy ID again — they just check the wristband. That wristband is the typed object you make after parsing.`,
  ],
  analogy: {
    title: 'Passport control at an airport',
    body: [
      py`Airports split the world into *landside* (anyone can walk in) and *airside* (only checked passengers). The split happens at one well-guarded point: passport control and security. Officers check documents against strict rules, refuse anything odd, and in return give you a boarding pass.`,
      py`Inside, gates don't re-inspect your passport — they scan the boarding pass, a standard, trusted format created by the checkpoint. If the airport moved its checks to the gates, or let each gate invent its own rules, something would slip through.`,
    ],
    mapping: [
      ['landside: anyone can be there', 'untrusted input: requests, files, CLI args, other services'],
      ['passport control', 'the trust boundary where validation happens'],
      ['strict document rules', 'type, length, format, range and allow-list checks'],
      ['"you are not on the list" — refused', 'reject bad input with a clear error; don\'t try to repair it'],
      ['boarding pass', 'the parsed, typed object (a frozen dataclass)'],
      ['gates trusting the boarding pass', 'core logic that only accepts the typed object'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Data crossing a trust boundary',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'raw', label: 'Raw input', note: 'form, JSON, file, argv', x: 90, y: 90, tone: 'red' },
        { id: 'limit', label: 'Size limit', note: 'cheap check first', x: 250, y: 90, tone: 'kraft' },
        { id: 'norm', label: 'Normalise', note: 'NFKC, strip, casefold', x: 410, y: 90, tone: 'kraft' },
        { id: 'parse', label: 'Parse + check', note: 'format, range, allow-list', x: 580, y: 90, tone: 'yellow' },
        { id: 'typed', label: 'Typed object', note: 'SignUp(...)', x: 580, y: 240, tone: 'blue' },
        { id: 'core', label: 'Core logic', note: 'trusts its inputs', x: 300, y: 240, tone: 'ink' },
        { id: 'reject', label: 'Reject', note: '400 + field error', x: 90, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'raw', to: 'limit' },
        { from: 'limit', to: 'norm' },
        { from: 'norm', to: 'parse' },
        { from: 'parse', to: 'typed', label: 'valid' },
        { from: 'typed', to: 'core' },
        { id: 'bad', from: 'parse', to: 'reject', label: 'invalid', dashed: true },
      ],
      steps: [
        { focus: ['raw'], text: py`Everything arriving from outside is **untrusted**: it may be the wrong type, huge, malformed or deliberately crafted. Assume nothing.` },
        { focus: ['limit'], edges: ['raw->limit'], text: py`First, a **cheap size check**. Reject a 10 MB "username" before doing any expensive work on it (normalising, regex matching, parsing).` },
        { focus: ['norm'], edges: ['limit->norm'], text: py`**Normalise** to one canonical form: strip whitespace, \`unicodedata.normalize("NFKC", …)\`, \`casefold()\`. Always normalise *before* checking — normalisation can turn harmless-looking characters into meaningful ones.` },
        { focus: ['parse'], edges: ['norm->parse'], text: py`**Parse and check**: \`fullmatch\` against an allow-list pattern, convert to \`int\`, check the range, check membership in a set of allowed values.` },
        { focus: ['typed', 'core'], edges: ['parse->typed', 'typed->core'], text: py`Success produces a **typed object**. Core logic accepts only that type, so it can never be handed raw input by accident.` },
        { focus: ['reject'], edges: ['bad'], text: py`Failure produces a **clear rejection** naming the field — on a web API, a 400 or 422 response. Never silently "fix" bad input and carry on.` },
      ],
    },
    alt: 'Diagram of a validation pipeline. Raw input flows through a size limit, normalisation, and parse-and-check stages. Valid data becomes a typed object passed to core logic; invalid data branches to a reject node that returns a field error.',
    caption: py`The boundary is a pipeline, and its order matters: limit → normalise → parse/check → typed object.`,
  },
  syntax: [
    py`#### 1. Type and length come first`,
    { code: py`def clean_text(raw, max_len):
    if not isinstance(raw, str):            # JSON could send a list, a number, null...
        raise ValueError("expected text")
    if len(raw) > 4 * max_len:              # cheap guard before expensive work
        raise ValueError("input is far too long")
    return raw.strip()`, lang: 'python', title: 'type and size' },
    py`JSON gives you whatever the client sent: \`{"age": [1, 2]}\` is perfectly valid JSON. Check the type before you call string methods on it.`,
    py`#### 2. Normalise, then validate`,
    { code: py`import unicodedata

def normalise(raw: str) -> str:
    return unicodedata.normalize("NFKC", raw).strip()

print(normalise("  ｂｏｂ "))               # bob  (full-width letters folded)
print(normalise("＜script＞"))              # <script>  (!)
print("Straße".casefold())                  # strasse — for caseless comparison`, lang: 'python', title: 'canonical form first' },
    py`**NFKC** folds "compatibility" characters — full-width letters, ligatures like \`ﬁ\`, superscripts — into their plain equivalents, and **composes** accents so \`"e" + combining accent\` becomes one \`"é"\`. \`casefold()\` is \`lower()\` made for comparisons. Check *after* normalising: the full-width \`＜\` looks harmless to a check for \`"<"\` but becomes a real \`<\` once normalised. See [Unicode & bytes](lesson:unicode-and-bytes).`,
    py`#### 3. Format: allow-list patterns with \`fullmatch\``,
    { code: py`import re

USERNAME_RE = re.compile(r"[a-z0-9_]{3,20}")    # ASCII classes, explicit length

def is_username(name: str) -> bool:
    return USERNAME_RE.fullmatch(name) is not None

print(is_username("ada_l"))        # True
print(is_username("admin\n"))      # False — fullmatch has no trailing-newline loophole`, lang: 'python', title: 'describe what is allowed' },
    { callout: 'warn', title: 'Two regex traps', text: py`\`$\` matches at the end of the string **or just before a trailing newline**, so \`re.match(r"^[a-z]+$", "admin\n")\` succeeds. And \`\d\` matches *any* Unicode decimal digit (Arabic-Indic \`٤٢\`, Devanagari…). Use \`re.fullmatch\` and explicit classes like \`[0-9]\` (or the \`re.ASCII\` flag). Keep patterns simple and length-limit the input first: nested quantifiers like \`(a+)+\` can backtrack for a very long time (*ReDoS*, regular-expression denial of service). See [regular expressions](lesson:regular-expressions).` },
    py`#### 4. Allow-lists for values you can enumerate`,
    { code: py`from enum import Enum

COUNTRIES = {"GB", "IN", "US", "DE", "JP"}

class Plan(Enum):
    FREE = "free"
    PRO = "pro"

country = " gb ".strip().upper()
if country not in COUNTRIES:
    raise ValueError("country: not supported")

plan = Plan("pro")      # ValueError for anything that isn't a member
print(country, plan)`, lang: 'python', title: 'membership checks' },
    py`An **allow-list** names what *is* permitted and rejects everything else. A **block-list** names what is forbidden and lets everything else through — and attackers are endlessly creative at finding the thing you forgot to block. Use [enums](lesson:enums) or sets wherever the valid values are known.`,
    py`#### 5. Numbers: strict parsing and real range checks`,
    { code: py`import math

def parse_age(text: str) -> int:
    text = text.strip()
    if not (text.isascii() and text.isdecimal()):   # exactly 0-9, nothing else
        raise ValueError("age: digits 0-9 only")
    age = int(text)
    if not 13 <= age <= 120:                         # write the range you WANT
        raise ValueError("age: must be 13-120")
    return age

def parse_discount(text: str) -> float:
    value = float(text)
    if not math.isfinite(value) or not 0 <= value <= 50:
        raise ValueError("discount: 0-50")
    return value`, lang: 'python', title: 'ints and floats' },
    py`\`int()\` is more generous than you might expect: it accepts \`" 7 "\`, \`"+5"\`, \`"1_000"\` and non-ASCII digits like \`"٤٢"\`. That's fine for a calculator but surprising for an ID field. Meanwhile \`"²".isdigit()\` is \`True\` but \`int("²")\` fails — so \`isdigit()\` is the wrong pre-check. For floats, \`float("nan")\` fails *every* comparison, so a check written as "reject if \`< 0\` or \`> 50\`" lets NaN straight through. See [type conversion](lesson:type-conversion).`,
    py`#### 6. Parse into a typed object`,
    { code: py`from dataclasses import dataclass

@dataclass(frozen=True)
class SignUp:
    username: str
    age: int
    country: str

def parse_signup(form: dict) -> SignUp:
    return SignUp(
        username=parse_username(form.get("username", "")),
        age=parse_age(form.get("age", "")),
        country=parse_country(form.get("country", "")),
    )

def create_account(signup: SignUp) -> None:   # only ever receives parsed data
    ...`, lang: 'python', title: 'parse, don\'t validate', static: true },
    py`Only the fields you name are read, so extra keys like \`"is_admin": true\` are ignored instead of slipping into your object (the *mass-assignment* bug). \`frozen=True\` means nobody can modify the parsed record later. See [dataclasses](lesson:dataclasses).`,
    py`#### 7. The same thing with pydantic (third-party, not runnable here)`,
    { code: py`from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, ValidationError

Username = Annotated[          # pydantic's regex engine treats $ as the true end of the string
    str,
    StringConstraints(strip_whitespace=True, to_lower=True, pattern=r"^[a-z0-9_]{3,20}$"),
]

class SignUp(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, strict=True)

    username: Username
    age: int = Field(ge=13, le=120)
    country: Literal["GB", "IN", "US", "DE", "JP"]

try:
    signup = SignUp.model_validate({"username": "Ada", "age": 36, "country": "GB"})
except ValidationError as exc:
    print(exc.errors())          # a list of field-by-field problems`, lang: 'python', title: 'pydantic v2 (pip install pydantic)', static: true },
    py`Libraries such as **pydantic** (used by FastAPI), Django forms and marshmallow implement this pattern for you: declare the shape once, get typed objects or a structured list of errors. \`extra="forbid"\` rejects unknown fields; \`strict=True\` stops \`"36"\` being quietly turned into \`36\`. The ideas in this lesson are what these tools do under the hood — see [building APIs](lesson:building-apis).`,
  ],
  walkthrough: {
    title: 'Reading the sign-up validator',
    lang: 'python',
    code: SIGNUP,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [5, 6], text: py`Two allow-lists. The regex describes the *only* characters a username may contain (ASCII lowercase, digits, underscore) and its length. The set lists the only countries we accept.` },
      { lines: [9, 10], text: py`A custom exception for "the user sent bad data". Subclassing \`ValueError\` means generic handlers still catch it, while our loop can catch exactly this type. Its messages are written to be safe to show users. See [custom exceptions](lesson:custom-exceptions).` },
      { lines: [13, 17], text: py`The typed result. \`frozen=True\` makes instances immutable, so once parsed, nobody can sneak a bad value in later.` },
      { lines: [20, 28], text: py`\`clean_text\` handles the shared steps in the right order: type check, cheap length guard, **then** normalise (NFKC + strip), **then** the real length check — normalising can change the length.` },
      { lines: [31, 35], text: py`Usernames are case-folded and must \`fullmatch\` the pattern. \`fullmatch\` is all-or-nothing: no trailing newline, no extra characters.` },
      { lines: [38, 45], text: py`\`isascii() and isdecimal()\` together mean "only the characters 0–9" — so \`"-5"\`, \`"٤٢"\` and \`"²"\` are rejected *before* \`int()\` sees them. The range check is written as the range we **want** (\`13 <= age <= 120\`).` },
      { lines: [55, 60], text: py`\`parse_signup\` reads only the three fields it knows. Every value that leaves this function has been parsed; extra keys in the form are simply never looked at.` },
      { lines: [63, 71], text: py`Seven test submissions. Note \`"ｂｏｂ"\` (full-width letters) is *accepted* as \`bob\` after NFKC, and the SQL-ish username is rejected by the pattern — though the real SQL defence lives in [injection attacks](lesson:injection-attacks).` },
      { lines: [73, 79], text: py`\`try / except / else\`: only \`ValidationError\` is caught, so a genuine bug (say, a \`TypeError\`) would still crash loudly. \`repr()\` shows the raw value with quotes and escapes, which is safer for logs than printing it raw.` },
    ],
  },
  playground: {
    title: 'Sign-up form validator',
    objective: 'Run it, explain each ACCEPTED/REJECTED line, then tighten and extend the rules.',
    files: { 'main.py': SIGNUP },
    expected: py`Seven lines — two accepted, five rejected:

\`\`\`text
ACCEPTED SignUp(username='ada_lovelace', age=36, country='GB')
ACCEPTED SignUp(username='bob', age=15, country='US')
REJECTED "eve' OR '1'='1" -> username: 3-20 of a-z, 0-9, _
REJECTED 'cy' -> username: 3-20 of a-z, 0-9, _
REJECTED 'dee' -> age: digits 0-9 only
REJECTED 'fin' -> age: digits 0-9 only
REJECTED 'gus' -> country: not supported
\`\`\`

Notice how much cleaning happened to Ada's input: spaces stripped, case folded, \`gb\` upper-cased.`,
    experiments: [
      {
        id: 'raise-minimum-age',
        task: py`The service now requires users to be **16 or older**. Change the rule so \`parse_age("15")\` is rejected and \`parse_age("16")\` returns \`16\`. Which submission flips from ACCEPTED to REJECTED?`,
        hint: py`Only one number in \`parse_age\` needs to change — and its error message should match.`,
        tests: [
          { name: 'parse_age("15") is rejected', code: py`with raises(ValidationError):
    parse_age("15")` },
          { name: 'parse_age("16") returns 16', code: py`assert parse_age("16") == 16` },
        ],
        explain: py`Because every rule lives in one place at the boundary, a policy change is a one-line edit — and Bob (age 15) is now rejected. If the age check were scattered through the codebase you'd have to hunt down every copy.`,
      },
      {
        id: 'newline-trap',
        task: py`See why the code uses \`fullmatch\`. At the very end, add these two lines and predict their output first:

\`\`\`python
print(bool(re.match(r"^[a-z0-9_]{3,20}$", "admin\n")))
print(bool(USERNAME_RE.fullmatch("admin\n")))
\`\`\``,
        hint: py`\`$\` matches at the end of the string *or* just before a final newline.`,
        tests: [{ name: 'printed True then False', code: py`assert "True\nFalse" in output, 'Print the re.match result, then the fullmatch result'` }],
        explain: py`\`re.match\` with \`^…$\` accepts \`"admin\n"\` because \`$\` is allowed to match before a trailing newline. A username with a hidden newline can break log files, CSV exports and HTTP headers later. \`fullmatch\` requires the *entire* string to match, with no exceptions.`,
      },
      {
        id: 'add-bio',
        task: py`Add an optional **bio** field. Give \`SignUp\` a field \`bio: str = ""\`, write \`parse_bio(raw)\` that cleans the text with a maximum of **160** characters, and pass \`bio=parse_bio(form.get("bio", ""))\` in \`parse_signup\`.`,
        hint: py`\`parse_bio\` can simply \`return clean_text(raw, 160)\` — free text has no pattern, but it still has a type and a length limit.`,
        tests: [
          { name: 'a short bio is kept', code: py`s = parse_signup({"username": "ada", "age": "30", "country": "GB", "bio": "  Hi! "})
assert s.bio == "Hi!"` },
          { name: 'a missing bio becomes ""', code: py`assert parse_signup({"username": "ada", "age": "30", "country": "GB"}).bio == ""` },
          { name: 'a 161-character bio is rejected', code: py`with raises(ValidationError):
    parse_signup({"username": "ada", "age": "30", "country": "GB", "bio": "x" * 161})` },
        ],
        explain: py`Free-text fields can't be allow-listed character by character (people write apostrophes, emoji, accents), but they can still be type-checked, normalised and length-limited. Their *safety* then depends on how they are used: parameterised SQL, escaped HTML — see [injection attacks](lesson:injection-attacks).`,
      },
      {
        id: 'reject-unknown-fields',
        task: py`An attacker adds \`"is_admin": "yes"\` to the form. It's currently ignored — make it a hard error instead. At the start of \`parse_signup\`, raise \`ValidationError\` if the form contains any key other than the ones you expect (include \`"bio"\` if you added it).`,
        hint: py`Compare key sets: \`unknown = set(form) - {"username", "age", "country"}\`, then \`if unknown: raise ValidationError(...)\`.`,
        tests: [
          { name: 'an unexpected key is rejected', code: py`with raises(ValidationError):
    parse_signup({"username": "ada", "age": "30", "country": "GB", "is_admin": "yes"})` },
          { name: 'a normal form still works', code: py`assert parse_signup({"username": "ada", "age": "30", "country": "GB"}).username == "ada"` },
        ],
        explain: py`Ignoring unknown fields is already safe here because we only read named keys. Rejecting them is stricter and surfaces client bugs and probing early — it's what pydantic's \`extra="forbid"\` does. The real danger is code like \`User(**form)\`, which would happily set \`is_admin\`.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Watch strict parsing accept one value and reject two',
    props: {
      code: TRACE,
      notes: {
        2: 'Surrounding whitespace is removed first — part of normalising.',
        3: '`isascii() and isdecimal()` is true only for the characters 0–9. The superscript `"²"` fails here, even though `"²".isdigit()` would be True.',
        5: 'Only now do we call `int()`, knowing it will succeed.',
        6: 'The range is written as what we *want*. `"50"` parses fine but fails this check.',
        14: 'Each rejection is caught at the boundary and reported with `repr()`, which shows exactly what was received.',
      },
    },
    alt: 'A step-by-step trace of parse_quantity called on three inputs. " 3 " is stripped, passes the digit check and returns 3. "²" fails the isascii and isdecimal check and raises ValueError. "50" becomes the int 50 but fails the 1 to 10 range check and raises ValueError. Each error is caught in the loop and printed with repr of the raw value.',
    caption: py`Step through and watch where each input leaves the function: a return value, or an exception caught by the loop.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Think of validation as a short pipeline that every untrusted value goes through exactly once, at the edge of your program:`,
      py`1. **Limit** — refuse absurd sizes before doing work.
2. **Decode** — bytes to text with an explicit encoding (UTF-8), failing on bad bytes.
3. **Normalise** — one canonical form: strip, NFKC, casefold where case doesn't matter.
4. **Parse** — turn text into the real type: \`int\`, \`date\`, an enum member.
5. **Check** — format, range, allow-list, cross-field rules ("end date after start date").
6. **Wrap** — build a typed, immutable object.`,
      py`**Reject, don't repair.** It's tempting to "clean up" bad input — delete the \`<script>\`, chop the length, drop odd characters — and continue. Repairs create surprises: the result may differ from what the user meant, and removal-based filters can often be bypassed (deleting \`<script>\` from \`<scr<script>ipt>\` *creates* \`<script>\`). Normalising to a canonical form is fine; silently changing meaning is not.`,
    ],
    technical: [
      py`**Unicode normal forms.** The same visible text can be different code points: \`"é"\` is either one code point (U+00E9) or \`"e"\` + a combining accent (U+0301). **NFC** composes, **NFD** decomposes. The **K** forms (NFKC/NFKD) also fold *compatibility* characters: full-width \`ｂ\` → \`b\`, ligature \`ﬁ\` → \`fi\`, superscript \`²\` → \`2\`. NFKC is the usual choice for identifiers. Even after NFKC, different scripts can look identical (Latin \`a\` vs Cyrillic \`а\`) — these *confusables* are why strict ASCII patterns are popular for usernames.`,
      py`**\`casefold()\` vs \`lower()\`.** \`casefold\` applies full Unicode case folding for comparisons: \`"Straße".lower()\` is \`"straße"\` but \`casefold()\` gives \`"strasse"\`. Use it when comparing or storing case-insensitive keys; keep the user's original spelling separately if you want to display it.`,
      py`**What \`int()\` accepts.** Leading/trailing whitespace, an optional sign, underscores between digits (PEP 515), and any Unicode *decimal* digit. The \`str\` predicates differ: \`isdecimal()\` ⊂ \`isdigit()\` ⊂ \`isnumeric()\`. Only \`isdecimal\` lines up with what \`int()\` can parse; add \`isascii()\` to restrict to \`0–9\`.`,
      { callout: 'version', title: 'Python 3.11+: the 4300-digit limit', text: py`Converting a huge decimal string to an \`int\` takes time that grows faster than the length of the string, which allowed a denial-of-service attack. Since Python 3.11 (and security releases of some older versions), \`int()\` refuses strings longer than 4300 digits with a \`ValueError\`. You can change it with \`sys.set_int_max_str_digits()\`, but a field-specific length check is clearer.` },
      py`**Floats.** \`float()\` happily parses \`"nan"\`, \`"inf"\` and \`"1e308"\`. NaN compares false with everything, so "reject if \`x < 0 or x > 50\`" accepts it, while "accept if \`0 <= x <= 50\`" rejects it. Write checks as *conditions for acceptance* (fail closed), and add \`math.isfinite\`. For money, parse into \`decimal.Decimal\` instead.`,
    ],
    production: [
      py`**Server-side, always.** Client-side checks (HTML \`required\`, JavaScript) are a user-experience feature: they give fast feedback. They provide **zero** security, because anyone can send an HTTP request directly. Every boundary in your backend validates on its own — including messages from your own other services and data read back from files or caches that others could have modified.`,
      py`**Limits at every layer.** Configure maximum request body sizes at the web server or framework, maximum JSON nesting, maximum upload sizes, maximum list lengths ("at most 100 items per batch"). A missing upper bound is one of the most common validation gaps.`,
      py`**Errors.** Return a 400/422 response with field-level messages ("age: must be 13-120"). Don't echo the raw value back into HTML (that's an XSS risk) and don't leak internals (stack traces, SQL). When logging rejected input, log a truncated \`repr()\` so newlines can't forge log lines — see [injection attacks](lesson:injection-attacks).`,
      py`**Validation is not authorisation.** \`invoice_id = 1042\` can be perfectly well-formed and still belong to someone else. After parsing, a separate access-control check decides whether *this* user may touch *that* object — see [secure practices](lesson:secure-practices).`,
      py`**Test the boundary hard.** Unit-test each parser with nasty inputs (empty, whitespace, huge, Unicode look-alikes, wrong JSON types, NaN). Property-based testing tools such as Hypothesis generate thousands of weird inputs automatically — see [pytest basics](lesson:pytest-basics).`,
    ],
  },
  mistakes: [
    {
      title: 'Block-list filtering instead of rejecting',
      wrong: { code: py`def strip_scripts(comment):
    return comment.replace("<script>", "")

print(strip_scripts("<scr<script>ipt>alert(1)"))   # <script>alert(1) — the filter built it!`, lang: 'python' },
      right: { code: py`import html

comment = "<script>alert(1)"
print(html.escape(comment))   # &lt;script&gt;alert(1) — safe to put in HTML`, lang: 'python' },
      explanation: py`Removing "bad" substrings is a block-list, and block-lists get bypassed. For free text, accept it as data and **escape it for its destination** when you output it (HTML, SQL parameters, shell argument lists). For structured fields, use an allow-list and reject anything else.`,
    },
    {
      title: 'Using re.match with ^…$ (or re.search) for whole-string checks',
      wrong: { code: py`import re

def valid_code(code):
    return re.match(r"^[A-Z]{3}$", code) is not None

print(valid_code("ABC\n"))   # True — $ matched before the newline`, lang: 'python' },
      right: { code: py`import re

def valid_code(code):
    return re.fullmatch(r"[A-Z]{3}", code) is not None

print(valid_code("ABC\n"))   # False`, lang: 'python' },
      explanation: py`\`$\` matches at the very end *or* just before a trailing newline. \`re.fullmatch\` requires the whole string to match. (\`\Z\` also means "true end of string" if you must use \`re.match\`.)`,
    },
    {
      title: 'Pre-checking numbers with isdigit()',
      wrong: { code: py`def parse_count(text):
    if text.isdigit():
        return int(text)        # "²".isdigit() is True -> int("²") raises ValueError
    raise ValueError("not a number")`, lang: 'python' },
      right: { code: py`def parse_count(text):
    if text.isascii() and text.isdecimal():
        return int(text)
    raise ValueError("not a number")`, lang: 'python' },
      explanation: py`\`isdigit()\` accepts superscripts and other digit-like characters that \`int()\` can't parse, so the "safe" path crashes. \`isascii() and isdecimal()\` means exactly \`0–9\`.`,
    },
    {
      title: 'Validating before normalising',
      wrong: { code: py`import unicodedata

def tag_name(raw):
    if "<" in raw or ">" in raw:
        raise ValueError("no angle brackets")
    return unicodedata.normalize("NFKC", raw)

print(tag_name("＜b＞"))   # <b> — the check ran on the wrong form`, lang: 'python' },
      right: { code: py`import unicodedata

def tag_name(raw):
    name = unicodedata.normalize("NFKC", raw)
    if "<" in name or ">" in name:
        raise ValueError("no angle brackets")
    return name`, lang: 'python' },
      explanation: py`Any transformation after the check can turn a passing value into a failing one. Normalise (and decode, and case-fold) **first**, then validate the exact value you are going to use.`,
    },
    {
      title: 'Letting bool pass as int',
      wrong: { code: py`def parse_quantity(value):
    if not isinstance(value, int):
        raise ValueError("quantity must be a number")
    return value

print(parse_quantity(True))   # 1 — a JSON true became a quantity`, lang: 'python' },
      right: { code: py`def parse_quantity(value):
    if type(value) is not int:          # or: isinstance(value, bool) -> reject first
        raise ValueError("quantity must be a whole number")
    return value`, lang: 'python' },
      explanation: py`\`bool\` is a subclass of \`int\`, so \`isinstance(True, int)\` is \`True\`. When validating parsed JSON, exclude \`bool\` explicitly.`,
    },
    {
      title: 'A range check that lets NaN through',
      wrong: { code: py`def check_discount(percent):
    if percent < 0 or percent > 50:
        raise ValueError("0-50 only")
    return percent

print(check_discount(float("nan")))   # nan — both comparisons were False`, lang: 'python' },
      right: { code: py`import math

def check_discount(percent):
    if not (math.isfinite(percent) and 0 <= percent <= 50):
        raise ValueError("0-50 only")
    return percent`, lang: 'python' },
      explanation: py`Write the condition for **acceptance**, so anything unexpected falls into the rejection branch (*fail closed*). NaN makes every comparison \`False\`, which turns a rejection-style check into a hole.`,
    },
  ],
  debugging: [
    {
      symptom: py`ValueError: invalid literal for int() with base 10: '²'`,
      cause: py`The input passed an \`isdigit()\` check (superscripts count as digits) but \`int()\` only parses decimal digits.`,
      fix: py`Pre-check with \`text.isascii() and text.isdecimal()\`, or wrap \`int()\` in \`try/except ValueError\` and convert the failure into your own validation error.`,
    },
    {
      symptom: py`ValueError: Exceeds the limit (4300 digits) for integer string conversion: value has 5000 digits; use sys.set_int_max_str_digits() to increase the limit`,
      cause: py`Someone sent an enormous number string. Python 3.11+ refuses it to prevent a denial-of-service.`,
      fix: py`Don't raise the global limit. Add a field-level length check (an age has at most 3 digits) so the input is rejected with your own clear message before \`int()\` is called.`,
    },
    {
      symptom: py`A username containing a newline was accepted and later broke the log file / CSV export.`,
      cause: py`The check used \`re.match(r"^…$")\` (or \`re.search\`), and \`$\` matches before a trailing newline.`,
      fix: py`Use \`re.fullmatch\` with an explicit character class, and add a test case with \`"name\n"\`.`,
    },
    {
      symptom: py`A request with one long field makes the server hang at 100% CPU.`,
      cause: py`Catastrophic regex backtracking (ReDoS) on a pattern with nested quantifiers, or expensive processing before any size check.`,
      fix: py`Length-limit input before regex matching, simplify the pattern (no \`(x+)+\`), and consider atomic groups or possessive quantifiers (3.11+).`,
    },
  ],
  bestPractices: [
    'Identify every trust boundary (HTTP, files, CLI, env, queues, other services) and validate on the server at each one.',
    'Check type and size first, normalise second, then parse and validate the normalised value.',
    'Prefer allow-lists (sets, enums, explicit regex classes) over block-lists; reject rather than repair.',
    'Use re.fullmatch with ASCII classes like [a-z0-9_] and explicit length bounds; length-limit before regex.',
    'Parse into typed, immutable objects at the edge; core logic should accept only those types.',
    'Read only the fields you expect; never build objects with Model(**untrusted_dict).',
    'Write range checks as acceptance conditions (0 <= x <= 50) and use math.isfinite for floats.',
    'Return clear, field-level errors without echoing raw input or internal details.',
    'Treat validation as one layer: still parameterise SQL, escape HTML and enforce authorisation.',
  ],
  useCases: [
    'Sign-up and profile forms (usernames, ages, countries, bios).',
    'JSON API request bodies before they reach business logic.',
    'Query-string parameters such as page numbers, sort keys and filters.',
    'File uploads: size, extension allow-list, content checks.',
    'Command-line arguments and environment-variable configuration.',
    'Messages from queues or webhooks sent by other systems.',
  ],
  comparison: {
    title: 'Three ways to deal with input',
    headers: ['', 'Block-list', 'Allow-list check', 'Parse into a type'],
    rows: [
      ['idea', 'reject or strip known-bad things', 'accept only known-good shapes', 'convert once into a trusted object'],
      ['example', 'remove "<script>", ban "DROP"', 'fullmatch [a-z0-9_]{3,20}', 'SignUp(username=..., age=36)'],
      ['when something unexpected arrives', 'it gets through', 'it is rejected', 'it is rejected'],
      ['later code receives', 'the raw string', 'the raw string (checked)', 'a typed, immutable value'],
      ['risk of forgetting to check', 'high', 'medium: every use must re-check', 'low: the type proves it was parsed'],
    ],
    note: py`Block-lists still have a place as an *extra* signal (e.g. a list of breached passwords), but never as the main defence.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'input-validation-q1',
      type: 'mcq',
      prompt: py`Your sign-up page uses JavaScript to make sure the age is between 13 and 120 before the form is submitted. What should the server do with the \`age\` field?`,
      options: [
        { text: 'Nothing — the browser already checked it', why: 'Anyone can send a request without your page or its JavaScript (curl, a script, a modified browser). Client-side checks are for user experience only.' },
        { text: 'Convert it with int() and trust the result', why: 'int() accepts "-5", "999" and other values that are valid integers but invalid ages. You still need the range check.' },
        'Parse and range-check it again on the server, rejecting anything outside 13–120',
        { text: 'Strip any non-digit characters and use what is left', why: 'That is repairing input: "1a2b0" would become 120. Reject bad input instead of guessing what was meant.' },
      ],
      answer: 2,
      explanation: py`The server is the trust boundary. It must enforce every rule itself, because the client is under the user's (or attacker's) control.`,
    },
    {
      id: 'input-validation-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import re

name = "admin\n"
print(bool(re.match(r"^[a-z]+$", name)), bool(re.fullmatch(r"[a-z]+", name)))`,
      options: [
        { text: 'False False', why: 'The first check is the surprising one: $ is allowed to match just before a trailing newline.' },
        'True False',
        { text: 'True True', why: 'fullmatch requires every character to match [a-z]+, and "\\n" is not a lowercase letter.' },
        { text: 'False True', why: 'fullmatch is the stricter of the two, never the looser.' },
      ],
      answer: 1,
      explanation: py`\`$\` matches at the end of the string **or** right before a final \`\n\`, so \`re.match\` accepts \`"admin\n"\`. \`re.fullmatch\` needs the whole string to match, so it rejects it.`,
    },
    {
      id: 'input-validation-q3',
      type: 'output',
      prompt: 'Predict the four lines this prints.',
      code: py`values = ["42", " 7 ", "1_000", "²"]
for v in values:
    try:
        print(int(v))
    except ValueError:
        print("bad:", repr(v))`,
      answer: "42\n7\n1000\nbad: '²'",
      accept: ["42 7 1000 bad: '²'"],
      explanation: py`\`int()\` strips surrounding whitespace and allows underscores between digits (PEP 515), so \`" 7 "\` → \`7\` and \`"1_000"\` → \`1000\`. The superscript \`²\` is a "digit" for \`isdigit()\` but not a decimal digit, so \`int()\` rejects it. If an ID field should only contain \`0–9\`, you need a stricter check than \`int()\` alone.`,
    },
    {
      id: 'input-validation-q4',
      type: 'bug',
      prompt: 'A shop lets staff enter a discount percentage. Someone typed `nan` and every product was sold at a strange price. Click the line with the bug.',
      code: py`def parse_discount(text):
    percent = float(text)
    if percent < 0 or percent > 50:
        raise ValueError("discount must be 0-50")
    return percent`,
      answerLine: 3,
      explanation: py`\`float("nan")\` compares \`False\` with everything, so neither \`< 0\` nor \`> 50\` is true and NaN passes. Write the acceptance condition and reject everything else: \`if not (math.isfinite(percent) and 0 <= percent <= 50): raise …\`.`,
    },
    {
      id: 'input-validation-q5',
      type: 'fill',
      prompt: 'Complete the function so that look-alike characters are folded and the comparison ignores case. `canonical("  ＡＤＡ ")` should return `"ada"`.',
      code: py`import unicodedata

def canonical(raw):
    return unicodedata.normalize(___, raw).strip().___()`,
      answer: [['"NFKC"', "'NFKC'", 'NFKC'], ['casefold', 'casefold()', 'lower', 'lower()']],
      explanation: py`\`NFKC\` folds compatibility characters such as full-width \`Ａ\` into plain \`A\`; \`casefold()\` is the comparison-oriented version of \`lower()\` (it also turns \`ß\` into \`ss\`). \`lower()\` works for this input, but \`casefold()\` is the right tool for caseless matching.`,
    },
    {
      id: 'input-validation-q6',
      type: 'mcq',
      prompt: 'An endpoint does `user = User(**request_json)` and then saves the user. Which attack does this enable most directly?',
      options: [
        { text: 'SQL injection', why: 'Nothing here builds SQL text. The problem is which attributes get set, not how they are stored.' },
        'Mass assignment: the client can set fields it should never control, such as is_admin',
        { text: 'A timing attack', why: 'Timing attacks exploit how long comparisons take; this code doesn\'t compare secrets.' },
        { text: 'None — Python checks the keyword names', why: 'Python only checks that the names exist on User. If is_admin is a real field, it is accepted.' },
      ],
      answer: 1,
      explanation: py`\`**request_json\` passes *every* key the client chose. Read only the fields that clients may set (or use a schema with \`extra="forbid"\`) and set privileged fields in server code.`,
    },
    {
      id: 'input-validation-q7',
      type: 'short',
      prompt: 'In your own words: what does "parse, don\'t validate" mean, and why is it safer than checking a string and passing the string along?',
      answer: py`Instead of checking raw input and then continuing to pass the raw value around, you convert it once, at the boundary, into a typed value (an int, an enum, a frozen dataclass) and only that typed value flows inward. It's safer because the type itself proves the check happened: functions that accept a SignUp can't be called with an unchecked dict by mistake, every rule lives in one place, and you can't forget to re-check in one of many call sites.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'strict-quantity',
      title: 'A strict quantity parser',
      difficulty: 'intermediate',
      prompt: py`An online shop receives the quantity of an item as text from a form. Write \`parse_quantity(raw)\` that:

- raises \`ValueError\` if \`raw\` is not a \`str\` (for example \`None\` or \`5\`);
- strips surrounding whitespace;
- accepts **only** 1–3 ASCII digits \`0-9\` after stripping — no signs, underscores, spaces inside, or non-ASCII digits such as \`"٣"\` or \`"²"\`;
- returns the value as an \`int\` if it is between **1 and 99** inclusive;
- raises \`ValueError\` for anything else (including \`""\` and \`"0"\`).

Examples: \`parse_quantity(" 12 ")\` → \`12\`; \`parse_quantity("+5")\`, \`parse_quantity("1_0")\`, \`parse_quantity("100")\` all raise \`ValueError\`.`,
      files: {
        'main.py': py`def parse_quantity(raw):
    # TODO: make this strict
    return int(raw)


for raw in [" 12 ", "0", "+5", "1_0", "٣"]:
    try:
        print(repr(raw), "->", parse_quantity(raw))
    except ValueError as err:
        print(repr(raw), "-> rejected:", err)
`,
      },
      hints: [
        'Do the checks in order: type, strip, characters, length, int(), range.',
        'text.isascii() and text.isdecimal() is True only for strings made of 0-9 — but it is also False for "", which you want to reject anyway.',
        'if not isinstance(raw, str): raise ValueError(...); text = raw.strip(); if not (text.isascii() and text.isdecimal() and len(text) <= 3): raise ...; n = int(text); if not 1 <= n <= 99: raise ...',
      ],
      solution: {
        explanation: py`Each rule maps to one line, in the order that keeps later steps safe: the type check makes \`.strip()\` safe; the character check (\`isascii() and isdecimal()\`) makes \`int()\` safe and rejects signs, underscores, inner spaces and Unicode digits that \`int()\` would otherwise accept; the length check bounds the work; and the range check is written as the condition for acceptance, so anything unexpected is rejected. Note that \`"".isdecimal()\` is \`False\`, so empty input is handled for free.`,
        files: {
          'main.py': py`def parse_quantity(raw):
    if not isinstance(raw, str):
        raise ValueError("quantity must be text")
    text = raw.strip()
    if not (text.isascii() and text.isdecimal() and len(text) <= 3):
        raise ValueError("quantity: 1-3 digits 0-9 only")
    quantity = int(text)
    if not 1 <= quantity <= 99:
        raise ValueError("quantity: must be 1-99")
    return quantity


for raw in [" 12 ", "0", "+5", "1_0", "٣"]:
    try:
        print(repr(raw), "->", parse_quantity(raw))
    except ValueError as err:
        print(repr(raw), "-> rejected:", err)
`,
        },
      },
      tests: [
        { name: 'valid quantities are returned as ints', code: py`assert parse_quantity("3") == 3
assert parse_quantity(" 12 ") == 12
assert type(parse_quantity("99")) is int` },
        { name: 'out-of-range values are rejected', code: py`for bad in ["0", "100", "000"]:
    with raises(ValueError):
        parse_quantity(bad)` },
        { name: 'signs, underscores and inner spaces are rejected', code: py`for bad in ["+5", "-1", "1_0", "1 2"]:
    with raises(ValueError):
        parse_quantity(bad)` },
        { name: 'non-ASCII digits are rejected', code: py`for bad in ["٣", "²", "３"]:
    with raises(ValueError):
        parse_quantity(bad)` },
        { name: 'empty, blank and non-numeric text is rejected', code: py`for bad in ["", "   ", "abc", "1e2"]:
    with raises(ValueError):
        parse_quantity(bad)` },
        { name: 'non-strings raise ValueError', code: py`for bad in [None, 5, ["3"]]:
    with raises(ValueError):
        parse_quantity(bad)` },
      ],
    },
    {
      id: 'parse-order',
      title: 'Parse a JSON order into a typed object',
      difficulty: 'advanced',
      prompt: py`An API receives orders as decoded JSON (a \`dict\`). Complete \`parse_order(data)\` so it returns an \`Order\` or raises \`ValidationError\` (already defined; a subclass of \`ValueError\`). Rules:

1. \`data\` must be a \`dict\`.
2. Allowed keys are exactly \`"sku"\`, \`"quantity"\` and \`"gift_wrap"\`. **Any other key** is an error (no mass assignment!). \`"sku"\` and \`"quantity"\` are required.
3. \`sku\` must be a \`str\`; after \`.strip().upper()\` it must fully match three ASCII letters, a dash and four ASCII digits, e.g. \`"ABC-1234"\`.
4. \`quantity\` must be an \`int\` — **not** a \`bool\` and not a string — between 1 and 10 inclusive.
5. \`gift_wrap\` is optional (default \`False\`) and, if present, must be a real \`bool\`.

Return \`Order(sku=..., quantity=..., gift_wrap=...)\` with the cleaned sku.`,
      files: {
        'main.py': py`import re
from dataclasses import dataclass


class ValidationError(ValueError):
    pass


@dataclass(frozen=True)
class Order:
    sku: str
    quantity: int
    gift_wrap: bool = False


def parse_order(data):
    # TODO: validate everything instead of trusting the client
    return Order(**data)


print(parse_order({"sku": "abc-1234", "quantity": 2}))
`,
      },
      hints: [
        'Check the container first (isinstance(data, dict)), then the key set: set(data) - ALLOWED gives unknown keys, and REQUIRED - set(data) gives missing ones.',
        'isinstance(True, int) is True, so test type(q) is int (or reject bool first). For the sku use re.fullmatch(r"[A-Z]{3}-[0-9]{4}", sku).',
        'Build the result yourself: return Order(sku=sku, quantity=quantity, gift_wrap=gift_wrap) — never Order(**data).',
      ],
      solution: {
        explanation: py`The function is a small boundary: it never hands the client's dict to the constructor. It checks the container type, compares key sets (unknown keys are rejected, so \`"price": 0\` or \`"is_admin": true\` can't sneak in), then parses each field with its own rule. \`type(quantity) is not int\` rejects \`True\` (a \`bool\` is an \`int\` subclass) and strings like \`"2"\`. The sku pattern uses \`[0-9]\` rather than \`\d\` so Arabic-Indic digits don't match, and \`fullmatch\` so nothing extra is allowed. The returned frozen \`Order\` is the only thing the rest of the program sees.`,
        files: {
          'main.py': py`import re
from dataclasses import dataclass

SKU_RE = re.compile(r"[A-Z]{3}-[0-9]{4}")
ALLOWED = {"sku", "quantity", "gift_wrap"}
REQUIRED = {"sku", "quantity"}


class ValidationError(ValueError):
    pass


@dataclass(frozen=True)
class Order:
    sku: str
    quantity: int
    gift_wrap: bool = False


def parse_order(data):
    if not isinstance(data, dict):
        raise ValidationError("order must be a JSON object")
    unknown = set(data) - ALLOWED
    if unknown:
        raise ValidationError(f"unknown fields: {sorted(map(str, unknown))}")
    missing = REQUIRED - set(data)
    if missing:
        raise ValidationError(f"missing fields: {sorted(missing)}")

    sku = data["sku"]
    if not isinstance(sku, str):
        raise ValidationError("sku must be text")
    sku = sku.strip().upper()
    if not SKU_RE.fullmatch(sku):
        raise ValidationError("sku must look like ABC-1234")

    quantity = data["quantity"]
    if type(quantity) is not int or not 1 <= quantity <= 10:
        raise ValidationError("quantity must be a whole number from 1 to 10")

    gift_wrap = data.get("gift_wrap", False)
    if type(gift_wrap) is not bool:
        raise ValidationError("gift_wrap must be true or false")

    return Order(sku=sku, quantity=quantity, gift_wrap=gift_wrap)


print(parse_order({"sku": "abc-1234", "quantity": 2}))
`,
        },
      },
      tests: [
        { name: 'a valid order is parsed and cleaned', code: py`assert parse_order({"sku": " abc-1234 ", "quantity": 2}) == Order("ABC-1234", 2, False)
assert parse_order({"sku": "XYZ-0001", "quantity": 10, "gift_wrap": True}).gift_wrap is True` },
        { name: 'unknown keys are rejected (mass assignment)', code: py`with raises(ValidationError):
    parse_order({"sku": "ABC-1234", "quantity": 1, "price": 0})` },
        { name: 'missing required fields are rejected', code: py`with raises(ValidationError):
    parse_order({"sku": "ABC-1234"})` },
        { name: 'quantity must be a real int from 1 to 10', code: py`for bad in [True, "2", 2.0, 0, 11]:
    with raises(ValidationError):
        parse_order({"sku": "ABC-1234", "quantity": bad})` },
        { name: 'bad skus are rejected', code: py`for bad in ["AB-1234", "ABC-12345", "ABC-١٢٣٤", 1234, "ABC1234"]:
    with raises(ValidationError):
        parse_order({"sku": bad, "quantity": 1})` },
        { name: 'gift_wrap must be a bool, and data must be a dict', code: py`with raises(ValidationError):
    parse_order({"sku": "ABC-1234", "quantity": 1, "gift_wrap": "yes"})
with raises(ValidationError):
    parse_order([("sku", "ABC-1234")])` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'input-validation-trust-boundary',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a trust boundary, and where in a web application should input validation happen?',
      answer: 'A trust boundary is any point where data enters from a source you do not control — HTTP requests, uploaded files, CLI arguments, environment, queues, other services. Validation must happen on the server at each of those points, before the data reaches business logic. Client-side checks are only for user experience.',
      explanation: py`The browser, a mobile app or a partner's service are all outside your control, so anything they send can be crafted. Server-side validation at the edge converts untrusted input into trusted, typed values. Inside the boundary, code can rely on those types instead of re-checking everywhere.`,
      whyAsked: 'It checks the foundational security mindset: knowing where untrusted data comes from and who is responsible for checking it.',
      mistakes: ['Saying client-side validation is enough', 'Only thinking of HTTP forms and forgetting files, headers, queues and other services', 'Validating deep inside business logic instead of at the edge'],
      followUps: ['Is data read back from your own database trusted?', 'What would you validate on an uploaded image?', 'How does validation relate to output escaping?'],
      modelAnswer: 'A trust boundary is the line where data moves from something I don\'t control into my code — an HTTP request, an uploaded file, a command-line argument, a message from another service. On that line I assume the data could be anything. So validation happens on the server, at the edge, before business logic runs: I check type, size, format, range and allowed values, and convert the input into typed objects. Client-side validation is still useful for fast feedback, but it gives no security, because anyone can send a request directly. Inside the boundary, functions accept the typed objects, so they don\'t need to re-validate.',
    },
    {
      id: 'input-validation-allow-vs-block',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A file-upload handler rejects names containing "../", "..\\" or "/". A reviewer says "use an allow-list instead". Which approach is more robust, and why?',
      options: [
        'The block-list: it targets the exact attack',
        'The allow-list, e.g. fullmatch r"[A-Za-z0-9_-]{1,64}\\.(png|jpg)": anything not explicitly allowed is rejected',
        'Neither — escaping the file name is enough',
        'They are equivalent if the block-list is long enough',
      ],
      correctOption: 1,
      answer: 'The allow-list. A block-list must anticipate every bad variant (encodings, absolute paths, Windows separators, Unicode look-alikes, NUL bytes); an allow-list accepts only a small known-good shape, so unanticipated inputs fail closed.',
      explanation: py`Block-lists fail *open*: whatever you forgot is accepted. Allow-lists fail *closed*: whatever you didn't think of is rejected. For uploads, the strongest design avoids user-chosen names entirely — store files under a server-generated ID and keep the original name only as display metadata. Path checks with \`resolve()\` and \`is_relative_to()\` are a second layer (see [injection attacks](lesson:injection-attacks)).`,
      whyAsked: 'Allow-list thinking is the core habit of secure input handling; this checks whether the candidate can articulate fail-open vs fail-closed.',
      mistakes: ['Adding more patterns to the block-list', 'Believing escaping fixes path traversal', 'Forgetting that the allow-list must be checked after normalisation'],
      followUps: ['How would you store the uploaded file safely?', 'When is a block-list still useful?', 'Why normalise before checking?'],
      modelAnswer: 'The allow-list is more robust. A block-list fails open: it rejects the patterns I thought of and accepts everything else, and attackers specialise in the things I didn\'t think of — absolute paths, backslashes, encoded separators, odd Unicode. An allow-list fails closed: I describe a small safe shape, such as letters, digits, dash and underscore plus a known extension, and everything else is rejected. Even better, I wouldn\'t use the client\'s file name as the storage name at all; I\'d generate an ID on the server. Block-lists are fine as an extra signal, never as the main defence.',
    },
    {
      id: 'input-validation-newline-bypass',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This check is meant to allow only 3–20 lowercase letters, but a penetration tester got `"admin\\n"` accepted. Why, and how do you fix it?',
      code: { lang: 'python', code: py`import re

def valid_username(name):
    return re.match(r"^[a-z]{3,20}$", name) is not None

print(valid_username("admin\n"))   # True` },
      answer: 'In Python regex, $ matches at the end of the string or just before a trailing newline. Use re.fullmatch(r"[a-z]{3,20}", name) (or end the pattern with \\Z).',
      explanation: py`The trailing newline survives into the stored username, where it can break log lines, CSV files or HTTP headers, or make \`"admin\n"\` look like \`"admin"\` in an admin UI. \`fullmatch\` requires the entire string to match. Related trap: \`\d\` and \`\w\` match Unicode digits and letters unless you use explicit classes or \`re.ASCII\`.`,
      whyAsked: 'A classic real-world validation bypass that tests precise knowledge of regex semantics rather than general advice.',
      mistakes: ['Blaming re.match vs re.search', 'Adding .strip() afterwards instead of fixing the check', 'Not knowing $ vs \\Z'],
      followUps: ['What does \\d match in Python 3?', 'How could this regex cause a denial of service if it had nested quantifiers?'],
      modelAnswer: 'The problem is the dollar anchor: in Python\'s re module, $ matches at the end of the string or just before a final newline, so "admin\\n" passes. I\'d switch to re.fullmatch with the pattern [a-z]{3,20}, which only succeeds if the entire string matches. If I had to keep re.match I\'d anchor with \\Z instead. I\'d also add a unit test with a trailing newline, and check that the pattern uses explicit ASCII classes, because \\d and \\w match Unicode characters by default.',
    },
    {
      id: 'input-validation-parse-tags',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: py`Write \`parse_tags(raw)\` for a blog: \`raw\` is a comma-separated string. Return a list of tags where each tag is NFKC-normalised, stripped and case-folded; empty pieces are skipped; each tag must fully match \`[a-z0-9-]{1,20}\`; duplicates are removed keeping the first occurrence; at most 5 tags. Raise \`ValueError\` if \`raw\` is longer than 200 characters, any tag is invalid, or there are more than 5 distinct tags.`,
      answer: 'Length-check raw first, split on commas, normalise each piece (NFKC, strip, casefold), skip empties, fullmatch against the allow-list pattern, de-duplicate with a seen set, then enforce the count.',
      explanation: py`The order matters: the cheap size check protects everything after it; normalising before matching means \`"ｐｙｔｈｏｎ"\` and \`"Python"\` both become \`"python"\` and are recognised as duplicates; \`fullmatch\` with an explicit ASCII class is the allow-list.`,
      starter: { files: { 'main.py': py`import re
import unicodedata

TAG_RE = re.compile(r"[a-z0-9-]{1,20}")


def parse_tags(raw):
    # TODO: normalise, validate and de-duplicate
    return raw.split(",")


print(parse_tags(" Python, ASYNC ,python,,web-dev "))
` } },
      tests: [
        { name: 'normalises, skips empties and de-duplicates', code: py`assert parse_tags(" Python, ASYNC ,python,,web-dev ") == ["python", "async", "web-dev"]` },
        { name: 'full-width letters are folded', code: py`assert parse_tags("ｐｙｔｈｏｎ, Python") == ["python"]` },
        { name: 'empty input gives an empty list', code: py`assert parse_tags("") == []
assert parse_tags(" , ,") == []` },
        { name: 'invalid tags are rejected', code: py`for bad in ["c++", "rust lang", "a" * 21, "über", "tag!"]:
    with raises(ValueError):
        parse_tags(bad)` },
        { name: 'too many tags or too long input is rejected', code: py`with raises(ValueError):
    parse_tags("a,b,c,d,e,f")
with raises(ValueError):
    parse_tags("a," * 101)` },
      ],
      solution: { files: { 'main.py': py`import re
import unicodedata

TAG_RE = re.compile(r"[a-z0-9-]{1,20}")


def parse_tags(raw):
    if len(raw) > 200:
        raise ValueError("too much input")
    tags = []
    seen = set()
    for piece in raw.split(","):
        tag = unicodedata.normalize("NFKC", piece).strip().casefold()
        if not tag:
            continue
        if not TAG_RE.fullmatch(tag):
            raise ValueError(f"invalid tag: {tag!r}")
        if tag not in seen:
            seen.add(tag)
            tags.append(tag)
    if len(tags) > 5:
        raise ValueError("at most 5 tags")
    return tags


print(parse_tags(" Python, ASYNC ,python,,web-dev "))
` } },
      hints: ['Check len(raw) before splitting.', 'unicodedata.normalize("NFKC", piece).strip().casefold() gives the canonical tag.', 'A set remembers what you have seen; a list keeps the order.'],
      whyAsked: 'A realistic boundary function: it combines size limits, normalisation order, allow-list matching and de-duplication — easy to get subtly wrong.',
      mistakes: ['Validating before normalising', 'Using re.match with ^…$ instead of fullmatch', 'De-duplicating with set() and losing order', 'Counting tags before de-duplication'],
      followUps: ['Here "tag\\n" is accepted as "tag" because each piece is stripped — when is that acceptable, and when would you reject it instead?', 'How would you report all invalid tags at once instead of the first?'],
      modelAnswer: 'First I reject anything over 200 characters so the rest of the work is bounded. Then I split on commas and, for each piece, normalise with NFKC, strip and casefold, so look-alike and differently-cased tags become identical. Empty pieces are skipped; anything else must fullmatch the allow-list pattern of ASCII lowercase letters, digits and dashes, otherwise I raise ValueError. I de-duplicate with a seen set while appending to a list to keep the original order, and only then check the five-tag limit, because duplicates shouldn\'t count twice.',
    },
    {
      id: 'input-validation-unicode',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Why should a system normalise Unicode before validating or comparing identifiers like usernames, and which tools would you use in Python?',
      answer: 'The same visible text can be encoded in different ways (composed vs decomposed accents, full-width forms, ligatures), so naive checks and comparisons disagree and can be bypassed. Normalise first with unicodedata.normalize("NFKC", s), then casefold() for caseless comparison, and only then validate and store the canonical form.',
      explanation: py`Without normalisation, \`"Ａdmin"\` (full-width A) can pass an "is this the reserved name admin?" check and later display identically, or two accounts can exist for visually identical names. NFKC folds compatibility characters; \`casefold\` handles case properly (\`ß\` → \`ss\`). Remaining risk: *confusables* across scripts (Latin \`a\` vs Cyrillic \`а\`) survive NFKC, which is why many services restrict usernames to ASCII or apply a confusable-detection step (see Unicode Technical Standard #39).`,
      code: { lang: 'python', code: py`import unicodedata

def canonical(name: str) -> str:
    return unicodedata.normalize("NFKC", name).casefold()

print(canonical("Ａdmin") == canonical("admin"))   # True
print("Straße".lower(), canonical("Straße"))       # straße strasse` },
      whyAsked: 'Separates candidates who have dealt with real-world text and account-takeover/impersonation issues from those who think lower() is enough.',
      mistakes: ['Using lower() and assuming that handles all case issues', 'Normalising after the check', 'Believing NFKC solves look-alike characters across scripts'],
      followUps: ['NFC vs NFKC — when would you prefer NFC?', 'Should you store the normalised or the original form?', 'What are confusables?'],
      modelAnswer: 'Unicode lets the same visible string be written with different code points — an accented letter can be one character or two, and there are full-width letters and ligatures that look like plain ASCII. If I validate or compare without normalising, a check like "is this the reserved name admin" can be bypassed with a full-width A, or two users can end up with names that look identical. So at the boundary I normalise with unicodedata.normalize NFKC, then casefold for comparisons, and only then run my allow-list checks and uniqueness checks on that canonical form. NFKC doesn\'t catch look-alikes across scripts, such as a Cyrillic a, so for usernames I\'d also restrict to ASCII or add a confusable check.',
    },
    {
      id: 'input-validation-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'You are designing the request-handling layer of a JSON API. How do you structure validation so it is consistent, hard to bypass and easy to review?',
      answer: 'Validate once at the edge with declarative schemas per endpoint (types, lengths, ranges, enums, extra fields forbidden), turning requests into immutable typed objects; enforce size limits before parsing; keep business logic typed against those objects; return structured 400/422 errors; and keep authorisation, output encoding and parameterised queries as separate layers.',
      explanation: py`A layered design: (1) infrastructure limits — maximum body size, timeouts, rate limits; (2) decoding — strict JSON, UTF-8; (3) schema parsing — pydantic/dataclass parsers per endpoint, with \`extra="forbid"\` and strict types; (4) domain checks that need context (does this SKU exist? is the date range valid?); (5) authorisation — may this user act on this object?; (6) safe use — parameterised SQL, escaped output. Schemas double as API documentation (OpenAPI) and are easy to diff in code review. Shared value types (\`Email\`, \`Sku\`, \`Quantity\`) keep rules consistent across endpoints.`,
      whyAsked: 'Senior-level question: tests whether the candidate can turn validation from ad-hoc checks into an architecture with clear responsibilities.',
      mistakes: ['Sprinkling isinstance checks through business logic', 'Treating validation as authorisation', 'Forgetting size limits and nested structure limits', 'Returning raw exception text to clients'],
      followUps: ['Where do checks like "SKU exists in the database" belong?', 'How do you version schemas without breaking clients?', 'How would you test the validation layer?'],
      modelAnswer: 'I\'d validate once, at the edge, with a declarative schema per endpoint — in Python usually pydantic models or dataclass parsers — that define types, lengths, ranges and allowed values, forbid unknown fields and use strict typing. Before that, the web server enforces body size and nesting limits. Parsing produces immutable typed objects, and service functions only accept those types, so raw dicts can\'t leak inward. Contextual checks like "does this product exist" happen in the service layer, and authorisation is a separate step. Errors come back as structured 400 or 422 responses with field names. And I keep the other layers — parameterised queries, output escaping — because validation alone isn\'t an injection defence.',
    },
  ],

  takeaways: [
    'A trust boundary is wherever outside data enters your code; validate on the server at every one — client-side checks are only UX.',
    'Order matters: type and size first, then normalise (strip, NFKC, casefold), then parse and check the normalised value.',
    'Prefer allow-lists (sets, enums, re.fullmatch with explicit ASCII classes) over block-lists; reject instead of repairing.',
    'Parse, don\'t validate: convert input once into typed, immutable objects and let core logic accept only those.',
    'Know the traps: $ matches before a trailing newline, \\d matches Unicode digits, isdigit() accepts "²", bool is an int, NaN passes "reject if out of range" checks.',
    'Read only the fields you expect; never construct objects with Model(**untrusted_data).',
    'Validation is one layer of defence in depth — still parameterise queries, escape output and check authorisation.',
  ],
}

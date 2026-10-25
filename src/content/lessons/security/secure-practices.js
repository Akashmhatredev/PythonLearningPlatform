// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const LAB = py`import io
import json
import logging
import pickle
import re
import tempfile
from pathlib import Path


# 1. Unpickling runs code chosen by whoever made the bytes.
class Innocent:
    def __reduce__(self):
        # pickle calls print(...) while LOADING. Harmless here; could be anything.
        return (print, ("!! code ran inside pickle.loads !!",))


payload = pickle.dumps(Innocent())
print("loading an untrusted pickle...")
pickle.loads(payload)
print("loading JSON instead:", json.loads('{"level": 3, "coins": 120}'))

# 2. Fail closed: deny unless a rule explicitly allows.
PERMISSIONS = {("admin", "delete"), ("admin", "edit"), ("editor", "edit")}


def is_allowed(user, action):
    try:
        return (user["role"], action) in PERMISSIONS
    except (KeyError, TypeError):
        return False                    # anything unexpected -> deny


print("editor edit:", is_allowed({"role": "editor"}, "edit"))
print("editor delete:", is_allowed({"role": "editor"}, "delete"))
print("no role at all:", is_allowed({}, "edit"))


# 3. Log what happened, never the secrets.
class RedactSecrets(logging.Filter):
    PATTERN = re.compile(r"(password|token|api_key)=\S+", re.IGNORECASE)

    def filter(self, record):
        record.msg = self.PATTERN.sub(r"\1=[REDACTED]", record.getMessage())
        record.args = None
        return True


stream = io.StringIO()
handler = logging.StreamHandler(stream)
handler.addFilter(RedactSecrets())
log = logging.getLogger("shop")
log.addHandler(handler)
log.warning("login failed user=ada password=%s", "hunter2")
print("log line:", stream.getvalue().strip())

# 4. Temporary files: unpredictable location, private, cleaned up automatically.
with tempfile.TemporaryDirectory() as workdir:
    report = Path(workdir) / "report.csv"
    report.write_text("id,total\n1,9.99\n")
    print("report written in a private temp dir:", report.exists())
print("temp dir deleted afterwards:", not report.exists())
`

const TIMING = py`def naive_equal(secret, guess):
    steps = 0
    if len(secret) != len(guess):
        return False, steps
    for a, b in zip(secret, guess):
        steps += 1
        if a != b:
            return False, steps      # early exit: leaks how far we got
    return True, steps


SECRET = "k7q2"
for guess in ["a000", "k000", "k700", "k7q0"]:
    ok, steps = naive_equal(SECRET, guess)
    print(guess, ok, "comparisons:", steps)
`

export default {
  id: 'secure-practices',
  title: 'Unsafe deserialization, dependencies & secure defaults',
  summary: 'The habits that keep Python services safe: never deserialize untrusted pickles or YAML objects, lock down dependencies, grant least privilege, fail closed, handle temp files and logs carefully, and review code against the OWASP Top 10.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['injection-attacks', 'secrets-and-passwords', 'serialization'],
  related: ['input-validation', 'pip-and-dependencies', 'logging', 'virtual-environments', 'code-quality-tools', 'error-handling-patterns', 'building-apis', 'database-patterns', 'context-managers'],
  tags: ['security', 'deserialization', 'pickle', 'yaml.safe_load', 'shelve', 'supply chain', 'typosquatting', 'dependency confusion', 'pip-audit', 'Dependabot', 'require-hashes', 'least privilege', 'secure defaults', 'fail closed', 'tempfile', 'logging', 'redaction', 'timing attack', 'compare_digest', 'OWASP Top 10', 'code review', 'tarfile'],
  apis: [
    { name: 'yaml.safe_load(text)', summary: 'PyYAML loader that builds only plain types (dict, list, str, numbers, bool, None, dates) — no arbitrary Python objects.' },
    { name: 'pickle.loads(data)', summary: 'Rebuilds Python objects by running instructions in the data. Only for data you created and protected yourself.' },
    { name: 'tempfile.TemporaryDirectory()', summary: 'A private, randomly named directory deleted automatically when the with block ends.' },
    { name: 'tempfile.mkstemp()', summary: 'Creates and opens a new file with an unpredictable name and owner-only permissions; returns (fd, path).' },
    { name: 'logging.Filter', summary: 'A hook that can inspect and rewrite each log record — e.g. to redact secrets before they are written.' },
    { name: 'hmac.compare_digest(a, b)', summary: 'Constant-time comparison for secrets: no early exit on the first difference.' },
    { name: 'pip install --require-hashes', summary: 'Refuses any download whose hash doesn\'t match the one recorded in requirements.txt.' },
    { name: 'tarfile extract(..., filter="data")', summary: 'Blocks absolute paths, ../ escapes, links outside the target and special files when extracting (default in 3.14).' },
  ],
  docs: [
    { label: 'pickle — security warning', url: 'https://docs.python.org/3/library/pickle.html' },
    { label: 'tempfile — generate temporary files and directories', url: 'https://docs.python.org/3/library/tempfile.html' },
    { label: 'tarfile — extraction filters', url: 'https://docs.python.org/3/library/tarfile.html#tarfile-extraction-filter' },
    { label: 'pip — secure installs (hash-checking mode)', url: 'https://pip.pypa.io/en/stable/topics/secure-installs/' },
    { label: 'pip-audit (PyPA)', url: 'https://github.com/pypa/pip-audit' },
    { label: 'OWASP Top 10', url: 'https://owasp.org/Top10/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`The previous lessons fixed specific bugs: [bad input](lesson:input-validation), [injection](lesson:injection-attacks) and [leaked secrets](lesson:secrets-and-passwords). This one is about the **habits and defaults** that make a whole codebase hard to attack — the things a security-minded reviewer checks on every pull request.`,
    py`You'll cover five areas: **unsafe deserialization** (\`pickle\`, \`yaml.load\`, \`shelve\` can run code while loading), the **software supply chain** (the packages you install are code you run), **least privilege and secure defaults** (deny unless allowed, fail closed), **careful plumbing** (temp files, logs, constant-time comparisons), and the **OWASP Top 10** as a map of what goes wrong in real systems.`,
  ],
  why: [
    py`Most real breaches don't involve clever new attacks. They involve a debug flag left on, a dependency nobody updated, a service running with far more permissions than it needed, an error handler that let a request through, or a log file full of tokens. These are *design and habit* problems, and they're cheap to prevent when you know what to look for.`,
    py`Security is also about limiting damage. You will eventually ship a bug. Least privilege, safe defaults and good logging decide whether that bug leaks one record or the whole database — and whether you notice.`,
  ],
  eli15: [
    py`Think of a school building. **Unsafe deserialization** is accepting a sealed box from a stranger that assembles itself into *anything* when opened — maybe a robot that unlocks doors. Only open boxes you packed yourself.`,
    py`**Dependencies** are like food from suppliers: check you're buying from the real bakery (not "Bakeery"), write down exactly what you ordered, and read the recall notices.`,
    py`**Least privilege** means the cleaner's key opens the cupboards they clean, not the head teacher's office. **Failing closed** means that when the card reader breaks, the door stays *locked*, not open. And you don't write the alarm code on the visitors' sign-in sheet — that's **logging without secrets**.`,
  ],
  analogy: {
    title: 'Running a restaurant kitchen safely',
    body: [
      py`A good kitchen only accepts deliveries from known suppliers, checks seals and batch numbers, and keeps the invoice so a recall can be traced. Each cook has access to their own station, not the safe. When the fridge thermometer fails, food is thrown out rather than served. And nobody writes customers' card numbers on the order tickets pinned above the pass.`,
    ],
    mapping: [
      ['self-assembling mystery delivery', 'pickle / yaml.load on untrusted data'],
      ['known suppliers, sealed batches, invoices', 'pinned dependencies with hashes, a lock file'],
      ['reading recall notices', 'pip-audit and Dependabot alerts'],
      ['cooks only reach their own station', 'least privilege for processes, DB users and tokens'],
      ['broken thermometer → throw it out', 'fail closed: errors deny, not allow'],
      ['no card numbers on tickets', 'logs record events, never secrets or personal data'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Where your dependencies can betray you',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'dev', label: 'Your project', note: 'pyproject / requirements', x: 100, y: 160, tone: 'yellow' },
        { id: 'pip', label: 'pip / uv', note: 'resolves & downloads', x: 300, y: 160, tone: 'ink' },
        { id: 'index', label: 'Package index', note: 'PyPI or private', x: 520, y: 160, tone: 'blue' },
        { id: 'typo', label: 'Typosquat', note: '"reqeusts"', x: 520, y: 40, tone: 'red' },
        { id: 'confuse', label: 'Dependency confusion', note: 'public copy of an internal name', x: 520, y: 285, tone: 'red' },
        { id: 'audit', label: 'pip-audit / Dependabot', note: 'known vulnerabilities', x: 100, y: 285, tone: 'kraft' },
      ],
      edges: [
        { from: 'dev', to: 'pip', label: 'install' },
        { from: 'pip', to: 'index' },
        { id: 'typo-edge', from: 'typo', to: 'pip', dashed: true, label: 'one typo away' },
        { id: 'confuse-edge', from: 'confuse', to: 'pip', dashed: true, label: 'higher version wins' },
        { id: 'audit-edge', from: 'audit', to: 'dev', label: 'alerts & PRs' },
      ],
      steps: [
        { focus: ['dev', 'pip', 'index'], edges: ['dev->pip', 'pip->index'], text: py`\`pip install\` downloads code and, for source distributions, may **run build code on your machine** before you ever import it. Every dependency — and every dependency of a dependency — runs with your app's permissions.` },
        { focus: ['typo'], edges: ['typo-edge'], text: py`**Typosquatting:** attackers publish look-alike names (\`reqeusts\`, \`python-dateutils\`) hoping for a typo. Defence: copy names from official docs, review every new dependency, and install from a lock file rather than typing names.` },
        { focus: ['confuse'], edges: ['confuse-edge'], text: py`**Dependency confusion:** your company has an internal package \`acme-billing\`. Someone publishes \`acme-billing\` version 99 on public PyPI; an installer configured with \`--extra-index-url\` may pick the higher public version. Defence: one private index that proxies PyPI, or reserved names, and **hash pinning**.` },
        { focus: ['audit', 'dev'], edges: ['audit-edge'], text: py`**Known vulnerabilities** are published in advisory databases. \`pip-audit\` checks your environment or requirements against them; Dependabot or Renovate open update pull requests automatically. Run both continuously, not once.` },
      ],
    },
    alt: 'Diagram: your project installs packages through pip from a package index. Two dashed red attack paths lead into pip: a typosquatted package name and dependency confusion where a public package with a higher version shadows an internal one. A separate node, pip-audit and Dependabot, sends alerts and update pull requests back to the project.',
  },
  syntax: [
    py`#### 1. Deserialization: only load formats that can't run code`,
    { code: py`import json
import pickle

# DANGEROUS on untrusted bytes: pickle runs instructions embedded in the data
# state = pickle.loads(request_body)

# SAFE: JSON can only produce dicts, lists, strings, numbers, booleans and None
state = json.loads('{"level": 3, "coins": 120}')
print(state)          # then validate its shape — see input validation`, lang: 'python', title: 'pickle vs JSON' },
    py`\`pickle\` (and everything built on it: \`shelve\`, \`multiprocessing\` queues, many \`joblib\` and machine-learning model files) can call **any** importable function during loading — the playground proves it with a harmless \`print\`. The Python docs are blunt: only unpickle data you trust. \`marshal\` isn't safe for untrusted data either. If two of *your own* services must exchange pickles, sign them with HMAC and verify before loading (see [serialization](lesson:serialization)).`,
    { code: py`import yaml                                   # pip install pyyaml

config = yaml.safe_load(text)                 # plain types only: the right default
config = yaml.load(text, Loader=yaml.SafeLoader)   # same thing, explicit

# DANGEROUS: these can construct arbitrary Python objects from tags like !!python/object
yaml.load(text, Loader=yaml.UnsafeLoader)
yaml.load(text, Loader=yaml.Loader)`, lang: 'python', title: 'YAML: always safe_load', static: true },
    py`For configuration you write yourself, prefer \`tomllib\` (standard library, read-only, 3.11+) or JSON. Whatever you load, validate the result's shape before using it.`,
    py`#### 2. Supply chain: pin, hash, audit, update`,
    { code: py`# requirements.in — what you actually depend on
requests>=2.32
pydantic>=2.7

# requirements.txt — generated by: pip-compile --generate-hashes requirements.in
requests==2.32.3 \
    --hash=sha256:<64 hex characters for the wheel> \
    --hash=sha256:<64 hex characters for the sdist>
# ...every transitive dependency, pinned and hashed`, lang: 'text', title: 'a hashed lock file (pip-tools)' },
    { code: py`pip install --require-hashes -r requirements.txt   # any mismatch -> install fails
pip-audit -r requirements.txt                       # report known vulnerabilities
uv lock                                             # uv: writes uv.lock with hashes`, lang: 'bash', title: 'installing and auditing' },
    { code: py`# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"`, lang: 'text', title: 'automatic update pull requests' },
    py`Pinning exact versions makes builds reproducible; **hashes** make them tamper-evident — if the file on the index changes, the install fails instead of running new code. Lock files are for *applications*; libraries declare compatible ranges (see [pip & dependencies](lesson:pip-and-dependencies)). Before adding a dependency, ask: is it maintained, widely used, and worth the code it brings?`,
    py`#### 3. Least privilege and secure defaults`,
    { code: py`# Database: the app's user can read and write orders — nothing else
# GRANT SELECT, INSERT, UPDATE ON orders TO shop_app;

# Container: don't run as root
# USER app            (in the Dockerfile)

# Files the app creates: owner-only permissions
import os

fd = os.open("session.key", os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)

# Never switch off protections "temporarily"
# requests.get(url, verify=False)          # disables TLS certificate checks — NO
# app.run(debug=True, host="0.0.0.0")      # interactive debugger exposed to the network — NO`, lang: 'python', title: 'least privilege in practice', static: true },
    py`**Least privilege**: every process, database user, API token and person gets the minimum access needed, so one compromised piece can't reach everything. **Secure defaults**: the safe behaviour is what happens when nobody configures anything — \`DEBUG\` defaults to off, TLS verification on, new users have no permissions, timeouts are set. **Fail closed**: when a check errors, the answer is "no".`,
    { code: py`def can_delete(user, document):
    try:
        return user.is_admin or document.owner_id == user.id
    except AttributeError:
        return False            # malformed data or a bug -> deny, and log it`, lang: 'python', title: 'fail closed' },
    { callout: 'warn', title: 'assert is not a security check', text: py`\`assert\` statements are **removed** when Python runs with \`-O\` (optimised mode), so \`assert user.is_admin\` silently disappears in some deployments. Use \`if not ...: raise PermissionError(...)\` for anything that must always be enforced.` },
    py`#### 4. Temporary files, logs and comparisons`,
    { code: py`import tempfile
from pathlib import Path

with tempfile.TemporaryDirectory() as workdir:          # random name, private, auto-deleted
    report = Path(workdir) / "report.csv"
    report.write_text("id,total\n1,9.99\n")

with tempfile.NamedTemporaryFile("w", suffix=".json") as tmp:   # deleted on close
    tmp.write("{}")

fd, path = tempfile.mkstemp(suffix=".bin")    # created with 0o600 permissions, you clean up`, lang: 'python', title: 'tempfile' },
    py`Never build temp paths yourself (\`"/tmp/report.csv"\`, \`f"/tmp/{user}.txt"\`): on shared machines another user can predict the name and pre-create it or plant a symlink there. \`tempfile.mktemp()\` is deprecated for exactly this reason — it returns a name without creating the file.`,
    py`**Logs** should say *what happened* — user ID, action, outcome, request ID — never passwords, tokens, session cookies, \`Authorization\` headers, full card numbers or unnecessary personal data. Add a redacting \`logging.Filter\` as a safety net (playground part 3) and log untrusted values with \`%r\` (see [logging](lesson:logging)). **Secret comparisons** use \`hmac.compare_digest\` — the animation below shows why.`,
    { callout: 'version', title: 'Python 3.14: safer tar extraction by default', text: py`\`tarfile\` archives can contain \`../\` paths, absolute paths and links pointing outside the target folder. Extraction *filters* (added in 3.12 and backported to security releases) block these; \`filter="data"\` is the safe choice. Since Python 3.14 it is the **default**. On older versions, always pass \`tar.extractall(dest, filter="data")\`.` },
    py`#### 5. The OWASP Top 10, mapped to Python`,
    py`The OWASP Top 10 is a widely used, regularly updated list of the most critical web-application security risks. Names and numbering below follow the **2025** edition:`,
    py`| category | what it looks like in Python | defence |
|---|---|---|
| A01 Broken Access Control | \`/invoices/1043\` returns another customer's invoice; no ownership check | check authorisation on every object, deny by default |
| A02 Security Misconfiguration | \`DEBUG=True\` in production, default passwords, verbose error pages | secure defaults, reviewed config |
| A03 Software Supply Chain Failures | typosquatted package, unpinned or unaudited dependencies | lock files with hashes, pip-audit, Dependabot |
| A04 Cryptographic Failures | SHA-256 passwords, tokens from \`random\`, \`verify=False\` | Argon2id, \`secrets\`, TLS verification |
| A05 Injection | f-string SQL, \`shell=True\`, \`eval\` | placeholders, argument lists, \`literal_eval\` |
| A06 Insecure Design | unlimited reset-code guesses, no abuse cases considered | threat modelling, rate limits by design |
| A07 Authentication Failures | no rate limiting or MFA, session not rotated after login | proven auth libraries, MFA, rate limits |
| A08 Software or Data Integrity Failures | \`pickle.loads\` on uploads, \`yaml.load\`, unsigned updates | JSON + validation, \`safe_load\`, signatures |
| A09 Logging & Alerting Failures | failed logins not logged — or passwords logged | log security events without secrets, alert on them |
| A10 Mishandling of Exceptional Conditions | \`except Exception: return True\` in an auth check, tracebacks shown to users | fail closed, generic error responses |`,
    { callout: 'note', title: 'Editions change', text: py`The 2021 edition is still widely cited (there, Injection was A03:2021 and server-side request forgery had its own category). Always check [owasp.org/Top10](https://owasp.org/Top10/) for the current list — the categories matter more than the numbers.` },
  ],
  walkthrough: {
    title: 'Reading the security lab',
    lang: 'python',
    code: LAB,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [11, 14], text: py`\`__reduce__\` tells pickle how to rebuild an object: "call this function with these arguments". An attacker controls both when they craft the bytes. Here it's \`print\`; in an attack it would be something like \`os.system\`.` },
      { lines: [17, 20], text: py`Just *loading* the pickle runs the call — no method of the object is ever used. JSON, by contrast, can only produce plain data.` },
      { lines: [23, 30], text: py`Permissions are an **allow-list** of (role, action) pairs. Anything not listed is denied, and any error (missing role, a \`None\` user) is also a denial — the check fails closed.` },
      { lines: [39, 45], text: py`A \`logging.Filter\` sees each record before it's written. It formats the message, replaces \`password=…\`, \`token=…\` and \`api_key=…\` values, and clears \`args\` so the original values can't be re-inserted.` },
      { lines: [48, 54], text: py`The handler writes to an in-memory stream so we can print what *would* have reached the log file: the event is recorded, the password isn't.` },
      { lines: [57, 61], text: py`\`TemporaryDirectory\` creates a randomly named private directory and deletes it — with everything inside — when the block ends, even if an exception is raised.` },
    ],
  },
  playground: {
    title: 'Security lab',
    objective: 'See a pickle run code on load, then extend the allow-list permissions, the log redaction, and replace pickle with JSON.',
    files: { 'main.py': LAB },
    expected: py`\`\`\`text
loading an untrusted pickle...
!! code ran inside pickle.loads !!
loading JSON instead: {'level': 3, 'coins': 120}
editor edit: True
editor delete: False
no role at all: False
log line: login failed user=ada password=[REDACTED]
report written in a private temp dir: True
temp dir deleted afterwards: True
\`\`\`

The second line is the important one: code ran *during loading*, before your program touched the object.`,
    experiments: [
      {
        id: 'viewer-role',
        task: py`Add a **viewer** role that may only \`"read"\`, and let editors \`"read"\` too. Don't change \`is_allowed\` — only the permission data.`,
        hint: py`Add \`("viewer", "read")\` and \`("editor", "read")\` to the \`PERMISSIONS\` set.`,
        tests: [
          { name: 'viewers can read but not edit', code: py`assert is_allowed({"role": "viewer"}, "read") is True
assert is_allowed({"role": "viewer"}, "edit") is False` },
          { name: 'editors can read', code: py`assert is_allowed({"role": "editor"}, "read") is True` },
          { name: 'unknown roles are still denied', code: py`assert is_allowed({"role": "guest"}, "read") is False` },
        ],
        explain: py`With deny-by-default, new capabilities are explicit, reviewable data changes. Nobody gets "read" by accident, and a typo in a role name results in *less* access, not more.`,
      },
      {
        id: 'redact-secret',
        task: py`A teammate logs \`client secret=%s\`. Extend \`RedactSecrets.PATTERN\` so values after \`secret=\` are redacted too.`,
        hint: py`Add \`secret\` to the alternation: \`(password|token|api_key|secret)=\S+\`.`,
        tests: [{ name: 'secret= values are redacted', code: py`import logging
record = logging.LogRecord("t", logging.WARNING, "", 0, "client secret=%s", ("s3cr3t-value",), None)
RedactSecrets().filter(record)
assert "s3cr3t-value" not in record.getMessage()
assert "secret=[REDACTED]" in record.getMessage()` }],
        explain: py`Redaction filters are a safety net, not the main control — the real fix is not logging secrets in the first place. Because the filter only knows patterns you listed, it's worth also preferring structured logs where sensitive *fields* can be dropped by name.`,
      },
      {
        id: 'json-save',
        task: py`Replace pickle for saving game state. Write \`save(state)\` returning a JSON string and \`load(text)\` returning the dict, then print \`load(save({"level": 3, "coins": 120}))\`.`,
        hint: py`\`json.dumps(state)\` and \`json.loads(text)\`. In real code, \`load\` would also validate the keys and types.`,
        tests: [
          { name: 'round-trips a state dict', code: py`assert load(save({"level": 3, "coins": 120})) == {"level": 3, "coins": 120}
assert isinstance(save({"level": 1}), str)` },
          { name: 'no pickle inside save/load', code: py`import inspect
assert "pickle" not in inspect.getsource(save) + inspect.getsource(load)` },
        ],
        explain: py`A JSON save file can be edited by the player, but it can't run code when loaded — the worst it can do is contain bad values, which validation catches. That trade is almost always worth it.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'How an early-exit comparison leaks a secret (simplified simulation)',
    props: {
      code: TIMING,
      notes: {
        3: 'A length mismatch returns immediately — real comparisons often leak the length too.',
        7: 'The first mismatch ends the loop. More correct leading characters → more work → a slightly longer response.',
        13: 'Each guess fixes one more character. Counting comparisons stands in for measuring time, which an attacker would do statistically over many requests.',
      },
    },
    alt: 'Trace of a naive string comparison against the secret k7q2. Each guess gets one more character right, and the number of comparisons printed grows from 1 to 4, showing how early exit leaks how much of the guess is correct.',
    caption: py`**Simplified:** we count comparisons instead of measuring nanoseconds. Real attacks measure many requests and use statistics, but the leak is the same — which is why secrets are compared with \`hmac.compare_digest\`, whose running time doesn't depend on where the first difference is.`,
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Security failures cluster around a few questions you can ask of any code:`,
      py`1. **Where does this data come from, and can it run code when I load it?** (deserialization)
2. **Whose code am I running?** (dependencies)
3. **If this part is compromised, what else can it reach?** (least privilege)
4. **What happens when something goes wrong?** (fail closed, error handling)
5. **What ends up on disk or in logs?** (temp files, logging)
6. **Could time or error messages reveal a secret?** (side channels)`,
    ],
    technical: [
      py`**How pickle executes code.** A pickle is a little program for the *pickle virtual machine*. Opcodes such as \`GLOBAL\`/\`STACK_GLOBAL\` import any attribute by module and name (\`os.system\`), and \`REDUCE\` calls it with arguments from the stack. That's how \`__reduce__\` works legitimately — and why a crafted byte string can call anything. \`pickle.Unpickler.find_class\` can be overridden to allow-list classes, but the docs still recommend not unpickling untrusted data at all.`,
      py`**YAML tags.** YAML supports tags like \`!!python/object/apply:\` that PyYAML's full and unsafe loaders map to Python constructors. \`SafeLoader\` only recognises standard tags, so the same document fails with a \`ConstructorError\` instead of running anything.`,
      py`**Timing leaks.** \`==\` on strings and bytes compares lengths and then content, and can return at the first difference. Over a network the difference per character is tiny, but attackers can average many measurements. \`hmac.compare_digest\` examines every byte regardless of mismatches. It still reveals the *length* — fine for fixed-length digests. Another robust pattern: compare *hashes* of the two values, so an attacker can't control which bytes line up.`,
      py`**Temp-file races.** The classic attack: your program checks that \`/tmp/report.csv\` doesn't exist, then creates it; in between, another local user creates a symlink there pointing at one of your files, and your write overwrites it. \`mkstemp\` avoids this by creating the file atomically with \`O_EXCL\` (fail if it exists) and owner-only permissions.`,
      { callout: 'note', title: 'CPython detail', text: py`\`hmac.compare_digest\` is implemented in C to avoid data-dependent branches, but the docs note that when the inputs differ in length or type, timing can still reveal their types and lengths — not their values. It's the right tool for comparing tokens, MACs and digests — not a general-purpose crypto primitive.` },
    ],
    production: [
      py`**A security review checklist for Python pull requests:**`,
      py`- [ ] No secrets in code, config, tests or logs; new settings come from the environment.
- [ ] All SQL uses placeholders; dynamic identifiers come from allow-lists.
- [ ] No \`shell=True\`, \`os.system\`, \`eval\`, \`exec\`, \`pickle.loads\`, \`yaml.load\` on anything a user can influence.
- [ ] Every request handler checks **authorisation** for the specific object, not just authentication.
- [ ] Input is parsed and validated at the boundary; file paths are contained; uploads are size-limited.
- [ ] Errors fail closed; no bare \`except\` returning success; no \`assert\` for security checks.
- [ ] Tokens from \`secrets\`; passwords via Argon2id/bcrypt; comparisons with \`compare_digest\`.
- [ ] TLS verification on; timeouts on every network call; \`DEBUG\` off by default.
- [ ] New dependencies are justified, spelled correctly and added to the hashed lock file.
- [ ] Security-relevant events (logins, permission denials, admin actions) are logged — without secrets.`,
      py`**Automate the boring parts.** Run Bandit or Semgrep (static analysis), pip-audit (dependencies) and secret scanning in CI, and keep Dependabot/Renovate PRs flowing. Automation catches the known patterns; human review focuses on design and access control, which tools can't judge (see [code quality tools](lesson:code-quality-tools)).`,
      py`**Generic errors outside, details inside.** Show users "Something went wrong (reference 7f3a…)" and log the stack trace server-side with the same reference. Framework debug pages are for localhost only.`,
    ],
  },
  mistakes: [
    {
      title: 'Loading untrusted data with pickle',
      wrong: { code: py`import pickle

def load_save_file(uploaded_bytes):
    return pickle.loads(uploaded_bytes)     # the uploader decides what code runs`, lang: 'python' },
      right: { code: py`import json

def load_save_file(uploaded_bytes):
    data = json.loads(uploaded_bytes)
    if not isinstance(data, dict) or type(data.get("level")) is not int:
        raise ValueError("invalid save file")
    return data`, lang: 'python' },
      explanation: py`Pickle is only for data you produced and protected (and ideally signed). For anything from users, the network or other teams, use JSON (or another data-only format) plus validation.`,
    },
    {
      title: 'yaml.load with a full or unsafe loader',
      wrong: { code: py`config = yaml.load(request_text, Loader=yaml.Loader)`, lang: 'python', static: true },
      right: { code: py`config = yaml.safe_load(request_text)`, lang: 'python', static: true },
      explanation: py`Non-safe loaders can build arbitrary Python objects from YAML tags. \`safe_load\` builds only plain data. Old tutorials that call \`yaml.load(text)\` without a loader predate this distinction.`,
    },
    {
      title: 'Failing open in an error handler',
      wrong: { code: py`def is_allowed(user, action):
    try:
        return user["role"] != "banned"
    except Exception:
        return True            # "don't block users because of a bug"

print(is_allowed(None, "delete"))   # True`, lang: 'python' },
      right: { code: py`ALLOWED = {("admin", "delete"), ("member", "read")}

def is_allowed(user, action):
    try:
        return (user["role"], action) in ALLOWED
    except (KeyError, TypeError):
        return False

print(is_allowed(None, "delete"))   # False`, lang: 'python' },
      explanation: py`Two problems: a block-list ("everyone except banned") and an error path that grants access. Use an allow-list and make every unexpected path a denial. Catch specific exceptions so real bugs still surface in your logs.`,
    },
    {
      title: 'Using assert for access control',
      wrong: { code: py`def delete_account(current_user, account_id):
    assert current_user.is_admin, "admins only"
    ...`, lang: 'python', static: true },
      right: { code: py`def delete_account(current_user, account_id):
    if not current_user.is_admin:
        raise PermissionError("admins only")
    ...`, lang: 'python', static: true },
      explanation: py`\`python -O\` strips every \`assert\`. Asserts document assumptions for developers; they never enforce rules.`,
    },
    {
      title: 'Predictable temporary file names',
      wrong: { code: py`path = f"/tmp/export_{user_id}.csv"
with open(path, "w") as f:
    f.write(csv_text)`, lang: 'python', static: true },
      right: { code: py`import tempfile

with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
    f.write(csv_text)
    export_path = f.name     # random name, 0o600 permissions`, lang: 'python', static: true },
      explanation: py`Guessable names in shared directories enable symlink and pre-creation attacks, and can leak data to other users. Let \`tempfile\` pick the name and permissions, and clean up afterwards.`,
    },
    {
      title: 'Disabling TLS verification to "fix" an error',
      wrong: { code: py`requests.get("https://internal-api.example", verify=False)`, lang: 'python', static: true },
      right: { code: py`requests.get("https://internal-api.example", verify="/etc/ssl/certs/internal-ca.pem", timeout=10)`, lang: 'python', static: true },
      explanation: py`\`verify=False\` lets anyone on the network path impersonate the server. If an internal certificate authority is involved, point \`verify\` at its certificate bundle. Always set a \`timeout\` too.`,
    },
  ],
  debugging: [
    {
      symptom: py`yaml.constructor.ConstructorError: could not determine a constructor for the tag 'tag:yaml.org,2002:python/object/apply:os.system'`,
      cause: py`\`yaml.safe_load\` met a Python-object tag. Either the file was written with \`yaml.dump\` of custom objects, or someone is attempting an attack.`,
      fix: py`Keep \`safe_load\`. Change the producer to write plain data (\`yaml.safe_dump\`), and log/alert if the input came from outside.`,
    },
    {
      symptom: py`ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.`,
      cause: py`A downloaded file's hash differs from the lock file: you changed a version without regenerating hashes, a different file (wheel vs sdist, other platform) was selected, or the package was tampered with.`,
      fix: py`Regenerate the lock file (\`pip-compile --generate-hashes\`, \`uv lock\`) for intentional changes. If nothing changed on your side, stop and investigate — this is the control doing its job.`,
    },
    {
      symptom: py`ERROR: In --require-hashes mode, all requirements must have their versions pinned with ==.`,
      cause: py`Hash-checking mode is on (because at least one requirement has a hash) but some requirement uses a range or is missing its hash.`,
      fix: py`Generate the complete lock file with a tool rather than editing hashes by hand; every transitive dependency needs \`==\` and a hash.`,
    },
    {
      symptom: py`pip-audit reports: Found 1 known vulnerability in 1 package`,
      cause: py`A pinned version matches a published advisory.`,
      fix: py`Upgrade to the fixed version listed in the report, re-lock and run tests. If no fix exists, assess whether the vulnerable code path is reachable and mitigate or replace — document any temporary ignore with a review date.`,
    },
    {
      symptom: py`PermissionError: [Errno 13] Permission denied: '/var/app/static/cache'`,
      cause: py`After switching the service to a non-root user (least privilege), it still tries to write somewhere only root could.`,
      fix: py`Don't go back to root. Give the app one dedicated writable directory (or use \`tempfile\`) and keep the code and config read-only.`,
    },
  ],
  bestPractices: [
    'Never pickle.loads, shelve.open, marshal.loads or yaml.load (non-safe loader) data that anyone else could have influenced.',
    'Use JSON, tomllib or yaml.safe_load — and validate the result.',
    'Pin application dependencies with hashes in a lock file, install with --require-hashes, run pip-audit in CI and keep Dependabot/Renovate updates flowing.',
    'Review every new dependency: correct name, maintained, widely used, worth its weight.',
    'Grant least privilege to processes, containers, database users and API tokens.',
    'Default to safe: DEBUG off, TLS verification on, timeouts set, new users without permissions.',
    'Fail closed: allow-list permissions, deny on errors, never use assert for security checks.',
    'Use tempfile for temporary files and directories; never build names in /tmp yourself.',
    'Log security events without secrets or unnecessary personal data; add a redaction filter as a safety net.',
    'Compare secrets with hmac.compare_digest; extract tar files with filter="data".',
  ],
  useCases: [
    'Code review of web handlers, background jobs and CLI tools.',
    'Loading save files, configuration, caches and ML models.',
    'Setting up CI for a new service: lock files, audits, scanners.',
    'Designing permissions for multi-user applications.',
    'Writing exports, reports and uploads through temporary files.',
    'Preparing for a security audit or penetration test.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'secure-practices-q1',
      type: 'mcq',
      prompt: 'Users can upload a saved game file to your server. Which loading code is safe?',
      options: [
        { text: 'pickle.loads(data)', why: 'Unpickling runs whatever callables the file specifies — the uploader chooses the code.' },
        { text: 'shelve.open(path)', why: 'shelve stores its values with pickle, so it has exactly the same problem.' },
        { text: 'yaml.load(data, Loader=yaml.UnsafeLoader)', why: 'The unsafe loader can construct arbitrary Python objects from YAML tags.' },
        'json.loads(data) followed by validation of the keys and types',
      ],
      answer: 3,
      explanation: py`JSON can only produce plain data types, so loading can't execute code. Validation then makes sure the data has the shape your program expects.`,
    },
    {
      id: 'secure-practices-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def allowed_open(user):
    try:
        return user["role"] != "banned"
    except KeyError:
        return True

def allowed_closed(user):
    try:
        return user["role"] in {"member", "admin"}
    except KeyError:
        return False

print(allowed_open({}), allowed_closed({}),
      allowed_open({"role": "hacker"}), allowed_closed({"role": "hacker"}))`,
      answer: 'True False True False',
      accept: ['True False True False'],
      explanation: py`\`allowed_open\` uses a block-list and treats errors as "allow", so both the missing role and the made-up role get in. \`allowed_closed\` uses an allow-list and treats errors as "deny".`,
    },
    {
      id: 'secure-practices-q3',
      type: 'bug',
      prompt: 'This endpoint works in development, but in production (run with `python -O`) anyone can delete accounts. Click the line responsible.',
      code: py`def delete_account(current_user, account_id, db):
    assert current_user.is_admin, "admins only"
    db.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    db.commit()
    return {"deleted": account_id}`,
      answerLine: 2,
      explanation: py`\`-O\` removes \`assert\` statements entirely, so the admin check vanishes. Use \`if not current_user.is_admin: raise PermissionError("admins only")\`. (The SQL itself is correctly parameterised.)`,
    },
    {
      id: 'secure-practices-q4',
      type: 'fill',
      prompt: 'Complete the code: load YAML without allowing Python objects, and work in a private temporary directory that is deleted automatically.',
      code: py`import tempfile
import yaml

config = yaml.___(untrusted_text)
with tempfile.___() as workdir:
    print("working in", workdir)`,
      answer: [['safe_load'], ['TemporaryDirectory']],
      explanation: py`\`yaml.safe_load\` builds only plain data. \`tempfile.TemporaryDirectory()\` creates a randomly named directory and removes it (and its contents) when the block exits.`,
    },
    {
      id: 'secure-practices-q5',
      type: 'mcq',
      prompt: 'An attacker uploads a malicious file to the package index under the **same name and version** you depend on (for example via a compromised mirror). Which practice makes your install fail instead of running it?',
      options: [
        { text: 'Pinning the exact version with ==', why: 'The version string is identical, so == is satisfied. Pinning alone doesn\'t detect changed file contents.' },
        'Hash pinning: requirements with --hash=sha256:… installed in --require-hashes mode',
        { text: 'Running pip-audit', why: 'pip-audit reports known published vulnerabilities; a fresh malicious upload won\'t be in an advisory database yet.' },
        { text: 'Using a virtual environment', why: 'A venv isolates packages from other projects, but still installs whatever it downloads.' },
      ],
      answer: 1,
      explanation: py`Hashes record exactly which file you reviewed and tested. Any different bytes — tampered or merely unexpected — produce a mismatch and stop the install.`,
    },
    {
      id: 'secure-practices-q6',
      type: 'output',
      prompt: 'Using the `naive_equal` function from the animation (it returns `(matched, comparisons)`), what does this print?',
      code: py`def naive_equal(secret, guess):
    steps = 0
    if len(secret) != len(guess):
        return False, steps
    for a, b in zip(secret, guess):
        steps += 1
        if a != b:
            return False, steps
    return True, steps

print(naive_equal("k7q2", "k7x9"), naive_equal("k7q2", "k7"))`,
      options: [
        { text: '(False, 4) (False, 2)', why: 'The loop stops at the first mismatch (the third character), and different lengths return before the loop starts.' },
        '(False, 3) (False, 0)',
        { text: '(False, 2) (False, 0)', why: 'steps is incremented before the comparison, so the mismatching third pair is counted.' },
        { text: '(False, 3) (False, 2)', why: 'Length is checked first: "k7" has a different length, so the function returns immediately with 0 steps.' },
      ],
      answer: 1,
      explanation: py`Two correct leading characters → 3 comparisons. The amount of work depends on the secret, which is exactly the side channel \`hmac.compare_digest\` removes. (The length check leaks the length — acceptable for fixed-length digests.)`,
    },
    {
      id: 'secure-practices-q7',
      type: 'short',
      prompt: 'Explain "least privilege" and "fail closed" with one concrete example each from a Python web service.',
      answer: py`Least privilege: give each component only the access it needs — e.g. the web app's database user can SELECT/INSERT/UPDATE the orders table but can't drop tables or read the admin schema, and the container runs as a non-root user — so a compromised component can do limited damage. Fail closed: when a security check can't reach a decision (missing data, an exception, a timeout talking to the permission service), the answer is "deny" — e.g. an authorisation function returns False in its except branch and the request gets a 403, rather than letting it through.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'redact-for-logs',
      title: 'Redact a structured log event',
      difficulty: 'intermediate',
      prompt: py`Your service logs request details as dictionaries. Write \`redact(data)\` that returns a **new** structure in which the value of every key whose name contains (case-insensitively) \`password\`, \`token\`, \`secret\`, \`api_key\` or \`authorization\` is replaced by \`"[REDACTED]"\`.

- Work recursively through nested \`dict\`s and \`list\`s.
- Leave every other value unchanged.
- **Don't modify the input** — the original dict is still needed by the request handler.

Example: \`redact({"user": "ada", "headers": {"Authorization": "Bearer x"}})\` → \`{"user": "ada", "headers": {"Authorization": "[REDACTED]"}}\`.`,
      files: {
        'main.py': py`SENSITIVE = ("password", "token", "secret", "api_key", "authorization")


def redact(data):
    # TODO: only handles one exact key, top level only, and mutates the input
    if "password" in data:
        data["password"] = "[REDACTED]"
    return data


event = {
    "user": "ada",
    "password": "hunter2",
    "headers": {"Authorization": "Bearer abc", "Accept": "json"},
    "items": [{"sku": "ABC-1", "gift_token": "t-123"}],
}
print(redact(event))
`,
      },
      hints: [
        'Write it as a recursive function with three cases: dict, list, and anything else (return as-is).',
        'For a dict, build a new dict: for each key, check any(word in key.lower() for word in SENSITIVE).',
        'return {k: ("[REDACTED]" if is_sensitive(k) else redact(v)) for k, v in data.items()} — and [redact(x) for x in data] for lists.',
      ],
      solution: {
        explanation: py`Recursion mirrors the shape of the data: dicts and lists are rebuilt (so the input is never mutated), and leaves are returned unchanged. Matching on a lower-cased substring catches \`Authorization\`, \`gift_token\` and \`DB_PASSWORD\` alike. Non-string keys are converted with \`str()\` before checking so odd keys can't crash logging. In production you would apply this in a logging filter or in your structured-logging pipeline, so every log call benefits automatically.`,
        files: {
          'main.py': py`SENSITIVE = ("password", "token", "secret", "api_key", "authorization")


def is_sensitive(key):
    name = str(key).lower()
    return any(word in name for word in SENSITIVE)


def redact(data):
    if isinstance(data, dict):
        return {
            key: "[REDACTED]" if is_sensitive(key) else redact(value)
            for key, value in data.items()
        }
    if isinstance(data, list):
        return [redact(item) for item in data]
    return data


event = {
    "user": "ada",
    "password": "hunter2",
    "headers": {"Authorization": "Bearer abc", "Accept": "json"},
    "items": [{"sku": "ABC-1", "gift_token": "t-123"}],
}
print(redact(event))
`,
        },
      },
      tests: [
        { name: 'top-level sensitive keys are redacted', code: py`assert redact({"user": "ada", "password": "x"}) == {"user": "ada", "password": "[REDACTED]"}` },
        { name: 'matching is case-insensitive and by substring', code: py`r = redact({"Authorization": "Bearer x", "DB_PASSWORD": "p", "refresh_token": "t", "Accept": "json"})
assert r == {"Authorization": "[REDACTED]", "DB_PASSWORD": "[REDACTED]", "refresh_token": "[REDACTED]", "Accept": "json"}` },
        { name: 'nested dicts and lists are handled', code: py`r = redact({"headers": {"X-Api_Key": "k"}, "items": [{"sku": "A", "client_secret": "s"}, 5]})
assert r == {"headers": {"X-Api_Key": "[REDACTED]"}, "items": [{"sku": "A", "client_secret": "[REDACTED]"}, 5]}` },
        { name: 'the input is not modified', code: py`original = {"password": "hunter2", "nested": {"token": "t"}}
redact(original)
assert original == {"password": "hunter2", "nested": {"token": "t"}}` },
      ],
    },
    {
      id: 'deny-by-default',
      title: 'Turn a fail-open permission check into deny-by-default',
      difficulty: 'advanced',
      prompt: py`Rewrite \`can(user, action, document)\` so it **only** returns \`True\` when a rule explicitly allows the action, and returns \`False\` (never raises) for anything unexpected:

- \`user\` is a dict with \`"id"\` and \`"role"\`; \`document\` is a dict with \`"owner_id"\` and \`"visibility"\` (\`"public"\` or \`"private"\`).
- **admin**: may \`"read"\`, \`"edit"\` and \`"delete"\` any document.
- **member**: may \`"read"\` public documents; may \`"read"\` and \`"edit"\` documents they own (\`owner_id == id\`). Members may never delete.
- Any other role, any other action, missing keys or a non-dict argument → \`False\`.`,
      files: {
        'main.py': py`def can(user, action, document):
    # TODO: this is a block-list that fails open
    try:
        if user["role"] == "member" and action == "delete":
            return False
        if user["role"] == "member" and action == "edit" and document["owner_id"] != user["id"]:
            return False
        return True                 # everything else is allowed
    except Exception:
        return True                 # if in doubt, let them in


alice = {"id": 1, "role": "member"}
doc = {"owner_id": 2, "visibility": "private"}
print(can(alice, "read", doc))
`,
      },
      hints: [
        'Start with "return False" at the end and add explicit allow rules above it — never the other way round.',
        'Validate the shapes first: isinstance(user, dict) and isinstance(document, dict); use .get() so missing keys give None instead of raising.',
        'Admin: action in {"read", "edit", "delete"}. Member: owns = document.get("owner_id") == user.get("id") (and the id is not None); allow read if public or owns; allow edit if owns.',
      ],
      solution: {
        explanation: py`The new version is an allow-list: each \`return True\` corresponds to one written rule, and everything else falls through to \`return False\`. Shape checks and \`.get()\` mean malformed input can't raise, so there's no need for a catch-all \`except\` that might hide bugs or grant access. The \`owner_id is not None\` guard stops a subtle hole: a user dict without an \`"id"\` would otherwise "own" every document whose \`owner_id\` is also missing. Notice how much easier this is to review — you can read the permissions straight off the code.`,
        files: {
          'main.py': py`ADMIN_ACTIONS = {"read", "edit", "delete"}


def can(user, action, document):
    if not isinstance(user, dict) or not isinstance(document, dict):
        return False
    role = user.get("role")
    if role == "admin":
        return action in ADMIN_ACTIONS
    if role == "member":
        owner_id = document.get("owner_id")
        owns = owner_id is not None and owner_id == user.get("id")
        if action == "read":
            return owns or document.get("visibility") == "public"
        if action == "edit":
            return owns
    return False


alice = {"id": 1, "role": "member"}
doc = {"owner_id": 2, "visibility": "private"}
print(can(alice, "read", doc))
`,
        },
      },
      tests: [
        { name: 'admins can do the three actions, nothing else', code: py`admin = {"id": 9, "role": "admin"}
doc = {"owner_id": 1, "visibility": "private"}
assert all(can(admin, a, doc) for a in ["read", "edit", "delete"])
assert can(admin, "transfer_ownership", doc) is False` },
        { name: 'members: own documents and public reads only', code: py`m = {"id": 1, "role": "member"}
own = {"owner_id": 1, "visibility": "private"}
other_private = {"owner_id": 2, "visibility": "private"}
other_public = {"owner_id": 2, "visibility": "public"}
assert can(m, "read", own) and can(m, "edit", own)
assert can(m, "read", other_public) is True
assert can(m, "read", other_private) is False
assert can(m, "edit", other_public) is False
assert can(m, "delete", own) is False` },
        { name: 'unknown roles and actions are denied', code: py`doc = {"owner_id": 1, "visibility": "public"}
assert can({"id": 1, "role": "guest"}, "read", doc) is False
assert can({"id": 1, "role": "member"}, "share", doc) is False` },
        { name: 'malformed input is denied, never raises', code: py`assert can(None, "read", {"owner_id": 1, "visibility": "public"}) is False
assert can({"role": "member"}, "edit", {"visibility": "private"}) is False
assert can({"id": 1, "role": "member"}, "read", None) is False
assert can({}, "read", {}) is False` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'secure-practices-least-privilege',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What do "least privilege", "secure by default" and "fail closed" mean? Give a Python example of each.',
      answer: 'Least privilege: each component gets only the access it needs (a DB user limited to its tables, a non-root container). Secure by default: the unconfigured behaviour is the safe one (DEBUG off, TLS verification on, no permissions for new users). Fail closed: when a check errors or can\'t decide, the answer is deny (an authorisation function returns False in its except branch).',
      explanation: py`All three limit damage when — not if — something goes wrong: a compromised component can reach less, a forgotten setting doesn't open a hole, and a bug in a check blocks a request rather than allowing it.`,
      whyAsked: 'Foundational principles that show up in design reviews, incident post-mortems and almost every security discussion.',
      mistakes: ['Confusing least privilege with "users have few features"', 'Thinking fail closed means crashing the app', 'Giving only abstract definitions without examples'],
      followUps: ['When might failing closed be the wrong choice?', 'How would you apply least privilege to API tokens?'],
      modelAnswer: 'Least privilege means every process, user and credential gets the minimum access it needs — for example, my Django app\'s database user can read and write its own tables but can\'t create or drop them, and the container runs as a non-root user. Secure by default means the behaviour you get without configuration is the safe one: DEBUG defaults to False, HTTP clients verify TLS and have timeouts, and new accounts have no permissions. Fail closed means that when a security check hits an error or missing data, it denies — my permission function returns False in its except branch. Together they turn bugs into small incidents instead of big ones.',
    },
    {
      id: 'secure-practices-safe-formats',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A partner sends you configuration files. Which loader is safe to use on them?',
      options: ['pickle.load(f)', 'yaml.load(f, Loader=yaml.Loader)', 'shelve.open(path)', 'yaml.safe_load(f)'],
      correctOption: 3,
      answer: 'yaml.safe_load (or json.load / tomllib.load). pickle and shelve execute code during loading; yaml.Loader and UnsafeLoader can construct arbitrary Python objects.',
      explanation: py`Data-only formats — JSON, TOML via \`tomllib\`, YAML via \`safe_load\`, CSV — can only produce plain values. Code-capable formats — pickle, shelve, marshal, YAML with full/unsafe loaders, jsonpickle — rebuild arbitrary objects. Even with a safe loader, validate the result and limit its size.`,
      whyAsked: 'Checks practical knowledge of which standard and common libraries are safe on untrusted input — a frequent source of remote-code-execution bugs.',
      mistakes: ['Assuming yaml.load is safe because the file "looks like" config', 'Forgetting shelve uses pickle', 'Skipping validation after a safe load'],
      followUps: ['How could two of your own services exchange pickles safely?', 'Why might you still reject a huge but valid JSON document?'],
      modelAnswer: 'yaml.safe_load. It only builds plain types — dicts, lists, strings, numbers, booleans, None and dates — so the file can\'t run code. pickle and shelve, which is built on pickle, execute callables while loading, and PyYAML\'s full or unsafe loaders can construct arbitrary Python objects from tags. For partner data I\'d prefer JSON or TOML, use a safe loader, enforce a size limit and validate the structure into typed objects before using it.',
    },
    {
      id: 'secure-practices-unfixed-cve',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'pip-audit in CI reports a critical vulnerability in a transitive dependency, and no fixed version exists yet. The release is tomorrow. What do you do?',
      answer: 'Find out whether you are actually exposed (which direct dependency pulls it in, whether the vulnerable feature or code path is used), then mitigate: avoid the feature, add input restrictions or configuration that blocks the attack, replace or pin away from the dependency if possible, or apply a vendor workaround. Record a time-limited, documented exception in the audit config, monitor for a fix, and escalate if exposure is real.',
      explanation: py`\`pip-audit\` matches versions, not usage. Read the advisory: what's vulnerable, under which conditions? Use the dependency tree (\`pipdeptree\`, \`uv tree\`) to see who depends on it. If the vulnerable path is reachable from untrusted input, consider delaying or shipping with mitigations (a WAF rule, disabling a feature). Never silence the check without an owner and an expiry date.`,
      whyAsked: 'Real dependency management is about risk decisions, not just running a tool; this checks judgement and communication.',
      mistakes: ['Ignoring the alert permanently', 'Blindly blocking the release without assessing exposure', 'Removing the dependency from the lock file manually'],
      followUps: ['How do you suppress a single advisory in pip-audit while keeping the rest?', 'What would you tell the product manager?'],
      modelAnswer: 'First I\'d read the advisory and work out whether we\'re exposed: which of our direct dependencies pulls it in, and whether we use the vulnerable feature with untrusted input. If we\'re not exposed, I\'d add a documented, time-limited exception for that one advisory with an owner, and watch for a fix. If we are, I\'d look for mitigations — disabling the feature, validating or limiting the input that triggers it, a configuration workaround, or swapping the dependency — and if none is good enough, recommend delaying the release. Either way I\'d communicate the risk clearly and keep Dependabot watching for the patched version.',
    },
    {
      id: 'secure-practices-auth-review',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Review this decorator that protects admin endpoints. What is wrong?',
      code: { lang: 'python', code: py`import functools

def admin_required(view):
    @functools.wraps(view)
    def wrapper(request, *args, **kwargs):
        try:
            assert request.user.role == "admin"
        except Exception:
            pass
        return view(request, *args, **kwargs)
    return wrapper`, static: true },
      answer: 'It never denies anything: a failed assert raises AssertionError, which the broad except swallows, and the view runs anyway. Asserts also vanish under python -O. Replace with an explicit check that raises PermissionError (or returns 403), with no catch-all that continues to the view.',
      explanation: py`Correct shape: \`if getattr(getattr(request, "user", None), "role", None) != "admin": raise PermissionError("admin only")\` (or return a 403 response), then call the view. Let unexpected exceptions propagate to the framework's error handler, which returns a 500 — still a denial, and visible in logs.`,
      whyAsked: 'Combines two Python-specific foot-guns (assert, broad except) in a security-critical place — a good test of careful reading.',
      mistakes: ['Spotting only the -O issue', 'Suggesting to "log and continue"', 'Fixing it by catching only AssertionError but still continuing'],
      followUps: ['How would you test this decorator?', 'Where should authorisation live in a larger app?'],
      modelAnswer: 'This decorator fails open. If the user isn\'t an admin, the assert raises AssertionError, the bare except Exception swallows it, and then the view runs anyway — so it protects nothing. On top of that, assert statements are stripped when Python runs with -O. I\'d replace it with an explicit if-check that raises PermissionError or returns a 403, and I wouldn\'t wrap it in a catch-all; any unexpected error should propagate and become a 500, which is still a denial. I\'d add tests for an admin, a normal user and a request with no user at all.',
    },
    {
      id: 'secure-practices-atomic-write',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: py`Write \`atomic_write(path, text)\` that replaces a file's contents so readers see either the old or the new file, never a half-written one. Use \`tempfile.mkstemp\` **in the same directory** as \`path\`, write and flush, then \`os.replace\`. If anything fails, the original file must be unchanged and the temporary file deleted.`,
      answer: 'fd, tmp = tempfile.mkstemp(dir=path.parent); write via os.fdopen(fd, "w"), flush and fsync; os.replace(tmp, path); on any exception unlink tmp and re-raise.',
      explanation: py`\`os.replace\` is atomic when source and destination are on the same file system — hence the temp file in the same directory. \`mkstemp\` gives an unpredictable name with owner-only permissions, avoiding temp-file races. The \`except BaseException\` cleanup guarantees no stray temp files, and re-raising keeps the error visible.`,
      starter: { files: { 'main.py': py`import os
import tempfile
from pathlib import Path


def atomic_write(path, text):
    # TODO: a crash halfway leaves a truncated file
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


atomic_write("report.txt", "total: 42\n")
print(Path("report.txt").read_text())
` } },
      tests: [
        { name: 'writes and overwrites the file', code: py`atomic_write("out.txt", "first")
atomic_write("out.txt", "second")
assert Path("out.txt").read_text() == "second"` },
        { name: 'a failed write leaves the original untouched', code: py`Path("data").mkdir(exist_ok=True)
Path("data/report.txt").write_text("old")
with raises(TypeError):
    atomic_write("data/report.txt", None)
assert Path("data/report.txt").read_text() == "old"` },
        { name: 'no temporary files are left behind', code: py`Path("clean").mkdir(exist_ok=True)
atomic_write("clean/a.txt", "ok")
try:
    atomic_write("clean/a.txt", None)
except TypeError:
    pass
assert sorted(p.name for p in Path("clean").iterdir()) == ["a.txt"]` },
        { name: 'uses mkstemp and os.replace', code: py`src = files["main.py"]
assert "mkstemp" in src and "os.replace" in src` },
      ],
      solution: { files: { 'main.py': py`import os
import tempfile
from pathlib import Path


def atomic_write(path, text):
    path = Path(path)
    fd, tmp_name = tempfile.mkstemp(dir=path.parent, prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_name, path)
    except BaseException:
        os.unlink(tmp_name)
        raise


atomic_write("report.txt", "total: 42\n")
print(Path("report.txt").read_text())
` } },
      hints: ['tempfile.mkstemp(dir=...) returns (fd, name) — open the fd with os.fdopen.', 'os.replace(tmp_name, path) swaps the file in one step.', 'Wrap the write and replace in try/except BaseException: os.unlink(tmp_name); raise.'],
      whyAsked: 'Shows practical command of tempfile, atomic file operations and exception-safe cleanup — integrity matters for config files, caches and exports.',
      mistakes: ['Creating the temp file in /tmp (os.replace may fail across file systems)', 'Forgetting to delete the temp file on failure', 'Swallowing the exception'],
      followUps: ['Why does the temp file need to be in the same directory?', 'What does fsync add, and what does it cost?'],
      modelAnswer: 'I create the temporary file with tempfile.mkstemp in the same directory as the target, which gives an unpredictable name and owner-only permissions. I write through os.fdopen, flush and fsync so the data is really on disk, then call os.replace, which atomically swaps the new file into place on the same file system — readers see the old or the new file, never half of one. Everything is in a try block: on any exception I delete the temp file and re-raise, so the original stays intact and nothing is left behind.',
    },
    {
      id: 'secure-practices-timing',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What is a timing attack, why does `hmac.compare_digest` exist, and what does it not protect against?',
      answer: 'A timing attack infers secret data from how long an operation takes. A normal == can stop at the first differing byte, so response times reveal how many leading bytes of a guess are right, letting an attacker recover a token byte by byte. compare_digest takes time independent of where the inputs differ. It does not hide the length, and it doesn\'t protect other side channels or slow code elsewhere.',
      explanation: py`Network noise makes single measurements useless, but statistics over many requests can reveal small differences, so security code doesn't rely on noise. Use \`compare_digest\` for tokens, API keys, HMAC tags and password-hash outputs (password libraries do this internally). For lookups by secret (e.g. API key → user), store a hash of the key and look up by hash, so the secret itself isn't compared character by character in a database index.`,
      whyAsked: 'Distinguishes candidates who know the mechanism and its limits from those who only know "use compare_digest".',
      mistakes: ['Saying timing attacks are impossible over a network', 'Believing compare_digest hides length', 'Using compare_digest for non-secret values everywhere "just in case" while missing the real secret comparisons'],
      followUps: ['How would you look up an API key in a database without timing leaks?', 'Do password hashing libraries need compare_digest?'],
      modelAnswer: 'A timing attack learns secrets from how long the system takes to respond. Ordinary string equality can return as soon as one character differs, so a guess with more correct leading characters takes slightly longer; with enough measurements and statistics, an attacker can recover a token one character at a time. hmac.compare_digest examines all the bytes regardless of where they differ, so its timing doesn\'t reveal that. It still leaks the length, which is fine for fixed-length digests, and it does nothing about other side channels. For API keys I store a hash and look up by the hash.',
    },
  ],

  takeaways: [
    'pickle, shelve, marshal and non-safe YAML loaders can run code while loading — never use them on untrusted data; use JSON, tomllib or yaml.safe_load plus validation.',
    'Dependencies are code you run: pin with hashes in a lock file, install with --require-hashes, run pip-audit, keep Dependabot updates flowing and review new packages.',
    'Least privilege limits the blast radius; secure defaults make the unconfigured path safe; fail closed turns errors into denials.',
    'Never use assert or catch-all excepts for security checks.',
    'Let tempfile choose temp names and permissions; extract archives with filter="data" (the default in 3.14).',
    'Log security events without secrets; compare secrets with hmac.compare_digest.',
    'Use the OWASP Top 10 and a review checklist to look at every change through an attacker\'s eyes.',
  ],
}

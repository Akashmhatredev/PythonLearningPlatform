// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TOOLKIT = py`import hashlib
import hmac
import os
import secrets
import time

# 1. Secrets come from the environment, not from source code.
#    (Here we simulate what the hosting platform would set. Demo only!)
os.environ.setdefault("WEBHOOK_SECRET", "demo-only-" + "x" * 22)


def require_env(name):
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"missing required setting {name}")   # the name, never a value
    return value


WEBHOOK_SECRET = require_env("WEBHOOK_SECRET").encode()
print("WEBHOOK_SECRET loaded:", "*" * 8, f"({len(WEBHOOK_SECRET)} bytes)")

# 2. Unguessable tokens come from the secrets module.
reset_token = secrets.token_urlsafe(32)
print("reset token:", reset_token[:6] + "...", "length", len(reset_token))


# 3. HMAC: prove a message came from someone who knows the key.
def sign(body):
    return hmac.new(WEBHOOK_SECRET, body, hashlib.sha256).hexdigest()


def verify(body, signature):
    return hmac.compare_digest(sign(body), signature)


body = b'{"order": 1042, "status": "paid"}'
signature = sign(body)
print("genuine:", verify(body, signature))
print("tampered:", verify(b'{"order": 1042, "status": "refunded"}', signature))

# 4. Why a single fast hash is NOT a password hash: count guesses per second.
start = time.perf_counter()
for guess in range(100_000):
    hashlib.sha256(f"password{guess}".encode()).digest()
elapsed = time.perf_counter() - start
print(f"sha256 guesses per second, in your browser: about {100_000 / elapsed:,.0f}")
`

const HMAC_TRACE = py`import hashlib
import hmac

KEY = b"shared-webhook-key"   # hard-coded ONLY for this demo


def sign(body):
    return hmac.new(KEY, body, hashlib.sha256).hexdigest()


def verify(body, signature):
    expected = sign(body)
    return hmac.compare_digest(expected, signature)


message = b"order=1042&status=paid"
tag = sign(message)
print(tag[:16])
print(verify(message, tag))
print(verify(b"order=1042&status=refunded", tag))
`

export default {
  id: 'secrets-and-passwords',
  title: 'Secrets management & password hashing',
  summary: 'Keep secrets out of code and logs, generate tokens with the secrets module, sign messages with HMAC, and store passwords only as slow, salted hashes.',
  difficulty: 'advanced',
  minutes: 55,
  prerequisites: ['input-validation', 'dataclasses', 'unicode-and-bytes'],
  related: ['injection-attacks', 'secure-practices', 'virtual-environments', 'logging', 'serialization', 'project-structure', 'building-apis', 'code-quality-tools'],
  tags: ['security', 'secrets', 'environment variables', 'os.environ', 'getenv', '.env', 'gitignore', 'secret manager', 'secrets module', 'token_urlsafe', 'compare_digest', 'hashing', 'encryption', 'password hashing', 'salt', 'pepper', 'work factor', 'argon2', 'argon2id', 'bcrypt', 'scrypt', 'PBKDF2', 'HMAC', 'key rotation'],
  apis: [
    { name: 'os.environ[name] / os.environ.get(name)', summary: 'Read an environment variable: [] raises KeyError when it is missing (fail fast); .get returns None or a default.' },
    { name: 'os.getenv(name, default=None)', summary: 'Shortcut for os.environ.get.' },
    { name: 'secrets.token_urlsafe(nbytes)', summary: 'A random URL-safe text token from the OS cryptographic random source; 32 bytes gives 43 characters.' },
    { name: 'secrets.token_hex(nbytes) / token_bytes(nbytes)', summary: 'Random tokens as hex text or raw bytes.' },
    { name: 'hmac.new(key, msg, hashlib.sha256)', summary: 'A keyed hash (MAC): only someone with the key can produce or check it.' },
    { name: 'hmac.compare_digest(a, b)', summary: 'Compares two secrets in time that does not depend on where they first differ.' },
    { name: 'hashlib.pbkdf2_hmac / hashlib.scrypt', summary: 'Slow, salted key-derivation functions suitable for passwords (need a CPython built with OpenSSL).' },
  ],
  docs: [
    { label: 'secrets — generate secure random numbers', url: 'https://docs.python.org/3/library/secrets.html' },
    { label: 'hmac — keyed-hashing for message authentication', url: 'https://docs.python.org/3/library/hmac.html' },
    { label: 'hashlib — key derivation (pbkdf2_hmac, scrypt)', url: 'https://docs.python.org/3/library/hashlib.html#key-derivation' },
    { label: 'os.environ', url: 'https://docs.python.org/3/library/os.html#os.environ' },
    { label: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html' },
    { label: 'OWASP Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`A **secret** is any value that grants access or proves identity: database passwords, API keys, signing keys, OAuth client secrets, session tokens. Anyone who reads a secret can *become* your application.`,
    py`This lesson covers the two halves of the job. **Managing your app's secrets**: keep them out of source code and logs, load them from the environment or a secret manager, and rotate them when they leak. **Handling your users' secrets**: generate unguessable tokens with the \`secrets\` module, and store passwords only as *slow, salted hashes* — never in a form you could turn back into the password.`,
    py`Along the way you'll meet **HMAC**, the tool for proving that a message (a webhook, a cookie, a download link) really came from someone who holds a key and wasn't altered.`,
  ],
  why: [
    py`Source code gets copied everywhere: laptops, CI servers, forks, backups, screenshots, AI assistants, public repositories pushed by accident. Leaked credentials are one of the most common ways attackers get in, and automated bots scan public code hosts for keys constantly.`,
    py`Password databases leak too. When they do, the only thing standing between the attacker and your users' accounts — on *your* site and every other site where they reused the password — is how you stored them. A plain SHA-256 is designed to be fast, so attackers with GPUs can test enormous numbers of guesses; a properly tuned Argon2id makes each guess deliberately expensive.`,
  ],
  eli15: [
    py`Writing an API key in your code is like writing your house key's shape on the front door: everyone who walks past can copy it. Instead, your program asks the place it runs ("the environment") for the key when it starts, a bit like a hotel giving you a key card at check-in.`,
    py`For user passwords, the website shouldn't keep the password at all. It keeps a **fingerprint**: run the password through a special blender that's *slow on purpose* and adds a random pinch of salt. At login, blend the typed password with the same salt and compare fingerprints. If thieves steal the fingerprints, each guess costs them real time, and the salt means they must attack every account separately.`,
  ],
  analogy: {
    title: 'A hotel, its key cards and its guest book',
    body: [
      py`The hotel never paints room codes on the walls (hard-coded secrets). The front desk programs key cards at check-in from a locked system (environment variables, secret managers), and cards expire or get re-coded if one is lost (rotation).`,
      py`The guest book doesn't record your PIN — only a smudged imprint that takes a minute to check (a slow password hash), with a unique pattern per guest (salt). The manager's wax seal on letters proves they came from the hotel (HMAC): anyone can read the letter, but only the holder of the seal can make a valid one.`,
    ],
    mapping: [
      ['room codes painted on the wall', 'secrets hard-coded in source code'],
      ['key cards issued at check-in', 'secrets injected through environment variables or a secret manager'],
      ['re-coding locks after a card is lost', 'rotating a leaked secret'],
      ['a slow imprint instead of the PIN', 'a password hash made with Argon2id / bcrypt / scrypt / PBKDF2'],
      ['a different imprint pattern per guest', 'a unique random salt per password'],
      ['the manager\'s wax seal', 'an HMAC signature made with a secret key'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Storing and checking a password',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'pw', label: 'Password', note: 'typed by the user', x: 90, y: 80, tone: 'yellow' },
        { id: 'salt', label: 'Random salt', note: '16 bytes, per user', x: 90, y: 240, tone: 'kraft' },
        { id: 'kdf', label: 'Slow KDF', note: 'Argon2id, tuned cost', x: 320, y: 160, tone: 'blue' },
        { id: 'db', label: 'Stored record', note: 'algo + params + salt + hash', x: 560, y: 160, tone: 'ink' },
        { id: 'cmp', label: 'Constant-time compare', note: 'match → logged in', x: 560, y: 285, tone: 'paper' },
      ],
      edges: [
        { from: 'pw', to: 'kdf' },
        { from: 'salt', to: 'kdf' },
        { from: 'kdf', to: 'db', label: 'sign-up' },
        { id: 'check', from: 'db', to: 'cmp', label: 'login: recompute with stored salt' },
      ],
      steps: [
        { focus: ['pw', 'salt'], text: py`At sign-up, generate a fresh **random salt** for this user. A salt isn't secret; its job is to make every user's hash unique, so identical passwords don't produce identical hashes and precomputed tables are useless.` },
        { focus: ['kdf'], edges: ['pw->kdf', 'salt->kdf'], text: py`Feed password + salt into a **slow key-derivation function** (KDF). Its *work factor* (iterations, memory) makes each computation deliberately expensive — tolerable once per login, crippling for billions of guesses.` },
        { focus: ['db'], edges: ['kdf->db'], text: py`Store the algorithm name, its parameters, the salt and the resulting hash together, e.g. \`$argon2id$v=19$m=…,t=…,p=…$<salt>$<hash>\`. Never the password, never anything reversible.` },
        { focus: ['db', 'cmp'], edges: ['check'], text: py`At login, read the record, recompute with the **stored** salt and parameters, and compare in constant time. If the parameters are weaker than today's policy, re-hash the password now — you have it in memory for this one moment.` },
      ],
    },
    alt: 'Diagram: a password and a random salt feed into a slow key derivation function, which produces a stored record containing the algorithm, parameters, salt and hash. At login the stored record is used to recompute the hash and compare it in constant time.',
  },
  syntax: [
    py`#### 1. Never in code — read secrets from the environment`,
    { code: py`import os

# Required secret: fail fast at start-up, naming the variable (never printing a value)
DATABASE_URL = os.environ["DATABASE_URL"]          # KeyError if missing

# Optional, non-secret setting: a default is fine
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Never give a secret a default — a "temporary" fallback ends up in production
# API_KEY = os.getenv("API_KEY", "sk_live_abc123")   # NO`, lang: 'python', title: 'environment variables', static: true },
    py`Environment variables are set by whatever starts your program — your shell, a process manager, a container platform, a CI system — so the same code runs with different secrets in development, staging and production. Read them once at start-up, convert them to the right types, and keep them in one settings object (see the exercise).`,
    py`#### 2. Local development: \`.env\` files that never get committed`,
    { code: py`# .env  (on your machine only — listed in .gitignore)
DATABASE_URL=postgresql://app:local-dev-password@localhost/shop
PAYMENT_API_KEY=sk_test_51Hx...

# .env.example  (committed: documents what's needed, with fake values)
DATABASE_URL=postgresql://user:password@localhost/dbname
PAYMENT_API_KEY=sk_test_replace_me`, lang: 'text', title: '.env and .env.example' },
    { code: py`# .gitignore
.env
.env.*
!.env.example
*.pem
*.key`, lang: 'text', title: '.gitignore — add it before the first commit' },
    { code: py`# pip install python-dotenv   (development convenience, third-party)
from dotenv import load_dotenv
import os

load_dotenv()                       # copies .env into os.environ (won't override real env vars)
DATABASE_URL = os.environ["DATABASE_URL"]`, lang: 'python', title: 'loading .env in development', static: true },
    py`#### 3. Production: a secret manager`,
    { code: py`# AWS example with boto3 (third-party); GCP Secret Manager, Azure Key Vault
# and HashiCorp Vault have equivalent clients.
import json
import boto3

client = boto3.client("secretsmanager")
response = client.get_secret_value(SecretId="prod/shop/database")
db_config = json.loads(response["SecretString"])`, lang: 'python', title: 'fetching a secret at start-up', static: true },
    py`A **secret manager** stores secrets encrypted, controls exactly which service may read which secret, records every access in an audit log, and supports rotation. The app authenticates with its *platform identity* (an IAM role, a service account) rather than with yet another secret.`,
    py`#### 4. Tokens: \`secrets\`, never \`random\``,
    { code: py`import secrets

session_id = secrets.token_urlsafe(32)        # 43 URL-safe characters
api_key = "sk_" + secrets.token_hex(16)       # "sk_" + 32 hex characters
otp = "".join(secrets.choice("0123456789") for _ in range(6))
print(len(session_id), len(api_key), len(otp))   # 43 35 6`, lang: 'python', title: 'the secrets module' },
    py`\`random\` is a fast, *predictable* generator (the Mersenne Twister) designed for simulations and games: after observing enough outputs, its future outputs can be computed. \`secrets\` uses the operating system's cryptographically secure source. 32 random bytes (256 bits) is a sensible default for tokens.`,
    py`#### 5. Hashing vs encryption vs password hashing`,
    py`| tool | reversible? | key? | speed | use it for |
|---|---|---|---|---|
| **hash** (SHA-256) | no | no | very fast | checksums, de-duplication, fingerprints of high-entropy values |
| **HMAC** (HMAC-SHA256) | no | yes | very fast | proving a message wasn't forged or altered |
| **encryption** (AES-GCM, Fernet) | yes, with the key | yes | fast | data you must read back: stored API tokens, backups |
| **password hash / KDF** (Argon2id, bcrypt, scrypt, PBKDF2) | no | no (salt per user) | **slow on purpose** | user passwords |`,
    py`Encrypting passwords is wrong because whoever gets the key gets every password. A plain fast hash is wrong because guessing is cheap. Use a password-hashing function.`,
    py`#### 6. Password hashing in practice (third-party / OpenSSL — not runnable here)`,
    { code: py`# pip install argon2-cffi  — recommended first choice
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()        # Argon2id with the library's recommended parameters


def hash_password(password: str) -> str:
    return ph.hash(password)                 # salt generated for you; params encoded in the string


def check_password(stored: str, password: str) -> bool:
    try:
        ph.verify(stored, password)          # constant-time comparison inside
    except VerifyMismatchError:
        return False
    if ph.check_needs_rehash(stored):
        ...                                  # parameters were raised: re-hash and save now
    return True`, lang: 'python', title: 'Argon2id with argon2-cffi', static: true },
    { code: py`import bcrypt                       # pip install bcrypt

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
ok = bcrypt.checkpw(password.encode(), hashed)
# Note: bcrypt only uses the first 72 bytes of the password.`, lang: 'python', title: 'bcrypt', static: true },
    { code: py`import hashlib
import hmac
import secrets

ITERATIONS = 600_000            # OWASP's PBKDF2-HMAC-SHA256 figure at the time of writing


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return "$".join(["pbkdf2_sha256", str(ITERATIONS), salt.hex(), digest.hex()])


def check_password(stored: str, password: str) -> bool:
    algorithm, iterations, salt_hex, digest_hex = stored.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
    return hmac.compare_digest(digest, bytes.fromhex(digest_hex))


# scrypt: n=2**17, r=8 needs about 128 MiB, above OpenSSL's default memory cap — raise maxmem
key = hashlib.scrypt(b"pw", salt=secrets.token_bytes(16), n=2**17, r=8, p=1,
                     maxmem=256 * 1024 * 1024, dklen=32)`, lang: 'python', title: 'standard library only: PBKDF2 and scrypt', static: true },
    { callout: 'note', title: 'Work-factor numbers', text: py`At the time of writing, the OWASP Password Storage Cheat Sheet suggests Argon2id with at least 19 MiB of memory, 2 iterations and parallelism 1; scrypt with N=2^17, r=8, p=1; bcrypt with a cost of 10 or more; and PBKDF2-HMAC-SHA256 with 600,000 iterations. These figures rise as hardware gets faster — check the current cheat sheet, measure on your own servers, and store parameters with each hash so you can raise them later.` },
    { callout: 'warn', title: 'Not available in this playground', text: py`This browser runtime has no OpenSSL, so \`hashlib.pbkdf2_hmac\` and \`hashlib.scrypt\` don't exist here, and third-party packages can't be installed. Runnable code in this lesson uses SHA-256 and HMAC to demonstrate *ideas* — a single SHA-256 is **not** a password hash.` },
    py`#### 7. HMAC: tamper-proof messages`,
    { code: py`import hashlib
import hmac

key = b"from-a-secret-manager"          # demo value
body = b'{"order": 1042, "status": "paid"}'

signature = hmac.new(key, body, hashlib.sha256).hexdigest()       # sender attaches this

received_ok = hmac.compare_digest(
    hmac.new(key, body, hashlib.sha256).hexdigest(), signature    # receiver recomputes
)
print(received_ok)   # True`, lang: 'python', title: 'sign and verify' },
    py`Payment providers and code hosts sign their webhooks this way. HMAC is designed to be keyed — don't invent \`sha256(key + message)\`, which is vulnerable to *length-extension* attacks. Compare with \`hmac.compare_digest\`, not \`==\` (see [secure practices](lesson:secure-practices) for timing attacks).`,
  ],
  walkthrough: {
    title: 'Reading the secrets toolkit',
    lang: 'python',
    code: TOOLKIT,
    intro: py`This is the playground program. Press **Guide** in the playground to follow these steps in the editor.`,
    steps: [
      { lines: [9, 9], text: py`\`setdefault\` simulates the deployment platform injecting a secret. In a real app this line doesn't exist — the value arrives from outside the code.` },
      { lines: [12, 16], text: py`\`require_env\` fails fast with a message that names the missing **variable** but never prints a value. Crashing at start-up is far better than running half-configured.` },
      { lines: [19, 20], text: py`Secrets for HMAC are bytes, so the string is encoded. The program proves it loaded the secret without revealing it — printing only its length.` },
      { lines: [23, 24], text: py`\`token_urlsafe(32)\` turns 32 random bytes into 43 URL-safe characters. Run the program twice — you'll get a different token every time.` },
      { lines: [28, 33], text: py`\`sign\` produces an HMAC-SHA256 tag; \`verify\` recomputes it and compares with \`compare_digest\`. Without the key, nobody can produce a valid tag for a modified body.` },
      { lines: [36, 39], text: py`The genuine body verifies; changing \`paid\` to \`refunded\` changes the expected tag completely, so verification fails.` },
      { lines: [42, 46], text: py`A live measurement: how many SHA-256 password guesses *this* browser tab can make per second. Attackers use GPUs that are much faster still. This is why passwords need a deliberately slow function.` },
    ],
  },
  playground: {
    title: 'Secrets toolkit',
    objective: 'Load a secret safely, create tokens, sign and verify a webhook, and measure why fast hashes fail for passwords.',
    files: { 'main.py': TOOLKIT },
    expected: py`Something like this (the token and the speed change on every run):

\`\`\`text
WEBHOOK_SECRET loaded: ******** (32 bytes)
reset token: q3Zp1X... length 43
genuine: True
tampered: False
sha256 guesses per second, in your browser: about <your number>
\`\`\`

The last number is measured live on your device — it is not a benchmark claim.`,
    experiments: [
      {
        id: 'missing-setting',
        task: py`Ask for a setting that doesn't exist. Add code that calls \`require_env("DATABASE_URL")\` inside \`try / except RuntimeError as err:\` and prints the error.`,
        hint: py`\`try: require_env("DATABASE_URL")\` then \`except RuntimeError as err: print(err)\`.`,
        tests: [{ name: 'the error names the missing variable', code: py`assert "missing required setting DATABASE_URL" in output` }],
        explain: py`In a real app you would *not* catch this — you'd let the program stop at start-up. The message names the variable so an operator can fix the deployment, and contains no secret values.`,
      },
      {
        id: 'api-key-format',
        task: py`Create an API key named \`api_key\` that starts with \`sk_\` followed by \`secrets.token_hex(16)\`, and print its length.`,
        hint: py`\`api_key = "sk_" + secrets.token_hex(16)\` — 16 bytes become 32 hex characters.`,
        tests: [{ name: 'api_key looks right', code: py`key = ns.get("api_key")
assert isinstance(key, str) and key.startswith("sk_") and len(key) == 35
int(key[3:], 16)` }],
        explain: py`A recognisable prefix (\`sk_\`, \`ghp_\`, …) lets secret scanners spot leaked keys in code and logs. The random part supplies 128 bits of unpredictability. Store only a hash of API keys on the server, just like reset tokens.`,
      },
      {
        id: 'salts',
        task: py`See what a salt does. Make \`digest_a\` and \`digest_b\` by hashing the same password with two **different** random salts — \`hashlib.sha256(secrets.token_bytes(16) + b"hunter2").hexdigest()\` each — and print \`digest_a == digest_b\`.`,
        hint: py`Call \`secrets.token_bytes(16)\` separately for each digest.`,
        tests: [{ name: 'same password, different digests', code: py`assert ns.get("digest_a") and ns.get("digest_b")
assert digest_a != digest_b
assert "False" in output` }],
        explain: py`Same password, different salts → unrelated digests. Attackers can't spot users who share a password or use precomputed tables. But the salt only forces *separate* work per user; it doesn't make each guess slow. You need both a salt and a slow function — which real password hashers bundle together.`,
      },
      {
        id: 'forgery',
        task: py`Play the attacker: without knowing the key, try to forge a signature for the refunded message with \`forged = hmac.new(b"guess", <refunded body>, hashlib.sha256).hexdigest()\`, then print \`"forged:", verify(<refunded body>, forged)\`.`,
        hint: py`Store the refunded body in a variable first so you can use it in both calls.`,
        tests: [{ name: 'the forgery is rejected', code: py`assert ns.get("forged"), 'Create a variable named forged'
assert "forged: False" in output` }],
        explain: py`An HMAC tag depends on every bit of the key. Without it, the attacker's tag is just a random-looking string that won't match. This is how webhook receivers know a "payment succeeded" message really came from the payment provider.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Sign once, verify twice',
    props: {
      code: HMAC_TRACE,
      notes: {
        4: 'Hard-coded only so this trace is self-contained. Real keys come from the environment or a secret manager.',
        8: '`hmac.new(key, message, hashlib.sha256)` mixes the key into the hash in a way that resists forgery.',
        12: 'The receiver recomputes the tag from the body it received, using its own copy of the key.',
        13: '`compare_digest` takes the same time whether the first or the last character differs.',
        19: 'One changed word in the body → a completely different expected tag → `False`.',
      },
    },
    alt: 'Step-by-step trace of a sign function computing an HMAC-SHA256 tag for a message, and a verify function recomputing the tag and comparing it with compare_digest. The genuine message verifies as True, the modified message as False.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Three different jobs, three different tools: **keep** secrets out of code (environment, secret manager); **create** secrets that can't be guessed (\`secrets\`); **check** secrets without storing them in readable form (password hashes for passwords, plain SHA-256 is fine for long random tokens, HMAC for messages).`,
      py`Why is SHA-256 fine for a reset token but not for a password? A token from \`token_urlsafe(32)\` has 256 bits of randomness — there's nothing to guess, even at billions of tries per second. Human passwords have far less randomness, and attackers try the likely ones first, so each guess must be made expensive.`,
    ],
    technical: [
      py`**Salts** are random, unique per password and stored next to the hash. They defeat precomputed "rainbow" tables and stop identical passwords from having identical hashes. A **pepper** is an extra *secret* key (kept outside the database, e.g. in a secret manager or hardware module) applied with HMAC before or after hashing; if only the database leaks, the hashes can't even be attacked. Peppers complicate rotation, so treat them as optional hardening.`,
      py`**Work factors.** PBKDF2 repeats HMAC many times (CPU cost). bcrypt uses an expensive key schedule (CPU cost, small memory). scrypt and Argon2 are *memory-hard*: each guess needs a big block of RAM, which makes massively parallel GPU or custom-hardware attacks much more expensive. Argon2 won the Password Hashing Competition and is specified in RFC 9106; its Argon2id variant is the usual first choice; PBKDF2 is the choice when you need FIPS-validated primitives.`,
      py`**HMAC** computes \`H((K ⊕ opad) ‖ H((K ⊕ ipad) ‖ message))\` — two nested hashes with the key mixed in twice. This structure is what defeats the length-extension attack that breaks naive \`sha256(key + message)\`, where an attacker can append data and compute a valid hash without knowing the key.`,
      py`**\`secrets\` under the hood** uses \`os.urandom\`, which asks the operating system's cryptographically secure generator (seeded from hardware events). \`random\` uses the Mersenne Twister: excellent statistical quality, but its internal state can be reconstructed from 624 consecutive 32-bit outputs, after which every future value is known.`,
      { callout: 'note', title: 'CPython detail', text: py`\`hashlib.pbkdf2_hmac\` and \`hashlib.scrypt\` are wrappers around OpenSSL; since Python 3.12 there is no pure-Python fallback for PBKDF2, so minimal builds without OpenSSL (like this browser runtime) don't have them. Official CPython installers always include OpenSSL.` },
    ],
    production: [
      py`**Secret hygiene checklist.** Secrets live in a secret manager or the platform's secret store; apps receive them through environment variables or mounted files; each service gets only the secrets it needs; humans rarely see production secrets at all. Kubernetes Secrets are only base64-encoded unless encryption at rest is configured — base64 is an encoding, not encryption.`,
      py`**Scanning.** Turn on your code host's secret scanning and push protection, and add a pre-commit hook such as gitleaks or detect-secrets so keys are caught before they leave your laptop (see [code quality tools](lesson:code-quality-tools)).`,
      py`**When a secret leaks: rotate first.** 1) Revoke or rotate the credential immediately — assume it has already been copied (deleting the commit doesn't un-leak it; it lives in clones, caches and forks). 2) Deploy the new secret. 3) Check the provider's access logs for misuse during the exposure window. 4) Optionally purge it from history (\`git filter-repo\`) and 5) fix the process that let it leak. Systems designed with *short-lived*, automatically rotated credentials make this routine.`,
      py`**Never log secrets.** Tracebacks, debug dumps, \`repr()\` of settings objects, HTTP request logs with \`Authorization\` headers and URLs containing tokens all leak. Mark secret fields \`repr=False\`, redact in log filters, and keep tokens out of URLs (see [logging](lesson:logging) and [secure practices](lesson:secure-practices)).`,
      py`**Password policy.** Current NIST guidance (SP 800-63B) favours long passphrases, no forced composition rules or routine expiry, and checking new passwords against lists of known-breached passwords. Add rate limiting and multi-factor authentication — hashing protects stolen databases, not live login endpoints.`,
    ],
  },
  mistakes: [
    {
      title: 'Hard-coding a secret "just for now"',
      wrong: { code: py`STRIPE_KEY = "sk_live_51Hx9aQ2eZvKYlo2C..."   # now in git history forever`, lang: 'python', static: true },
      right: { code: py`import os

STRIPE_KEY = os.environ["STRIPE_KEY"]    # injected by the platform / secret manager`, lang: 'python', static: true },
      explanation: py`Anything committed is effectively published to everyone who can ever read the repository, including its history. If it already happened: rotate the key first, then clean up.`,
    },
    {
      title: 'Generating tokens with random',
      wrong: { code: py`import random
import string

token = "".join(random.choices(string.ascii_letters + string.digits, k=32))`, lang: 'python' },
      right: { code: py`import secrets

token = secrets.token_urlsafe(32)`, lang: 'python' },
      explanation: py`\`random\` is predictable once an attacker has seen enough outputs. Use \`secrets\` for anything security-related: tokens, password-reset links, API keys, one-time codes.`,
    },
    {
      title: 'Storing passwords with a fast hash',
      wrong: { code: py`import hashlib

stored = hashlib.sha256(password.encode()).hexdigest()   # unsalted and fast`, lang: 'python', static: true },
      right: { code: py`from argon2 import PasswordHasher   # pip install argon2-cffi

stored = PasswordHasher().hash(password)  # salted, slow, parameters stored`, lang: 'python', static: true },
      explanation: py`MD5, SHA-1 and SHA-256 are built to be fast — the opposite of what passwords need. Unsalted, identical passwords also share identical hashes. Use Argon2id, bcrypt, scrypt or PBKDF2 with a high work factor.`,
    },
    {
      title: 'Comparing secrets with ==',
      wrong: { code: py`def valid_signature(expected: str, received: str) -> bool:
    return expected == received`, lang: 'python' },
      right: { code: py`import hmac

def valid_signature(expected: str, received: str) -> bool:
    return hmac.compare_digest(expected.encode(), received.encode())`, lang: 'python' },
      explanation: py`\`==\` can stop at the first differing character, so response times may hint at how much of a guess was right. \`compare_digest\` takes the same time regardless. Comparing bytes also avoids the \`TypeError\` it raises for non-ASCII \`str\`.`,
    },
    {
      title: 'Leaking secrets through repr() and logs',
      wrong: { code: py`from dataclasses import dataclass

@dataclass
class Settings:
    database_url: str
    api_key: str

settings = Settings("postgresql://app:pw@db/shop", "sk_live_abc")
print(settings)   # Settings(database_url='postgresql://app:pw@db/shop', api_key='sk_live_abc')`, lang: 'python' },
      right: { code: py`from dataclasses import dataclass, field

@dataclass
class Settings:
    database_url: str = field(repr=False)
    api_key: str = field(repr=False)

settings = Settings("postgresql://app:pw@db/shop", "sk_live_abc")
print(settings)   # Settings()`, lang: 'python' },
      explanation: py`Settings objects end up in logs, error reports and debugger output. \`field(repr=False)\` keeps secret fields out of the generated \`repr\`. Also scrub secrets from exception messages and URLs.`,
    },
    {
      title: '"I deleted the commit, so the key is safe"',
      explanation: py`Once pushed, a secret may already be in forks, clones, CI caches, mirrors and the scanners attackers run on public repositories. Rewriting history is cleanup, not remediation. **Revoke/rotate the secret first**, check its usage logs, then clean history and add scanning so it doesn't happen again.`,
    },
  ],
  debugging: [
    {
      symptom: py`KeyError: 'DATABASE_URL'`,
      cause: py`A required environment variable isn't set in this environment (a new machine, a CI job, a container missing its config).`,
      fix: py`Set it in the deployment configuration or your local \`.env\`. Catch it once at start-up and exit with a clear "missing required setting DATABASE_URL" message — never fall back to a hard-coded value.`,
    },
    {
      symptom: py`TypeError: comparing strings with non-ASCII characters is not supported`,
      cause: py`\`hmac.compare_digest\` was given \`str\` values containing non-ASCII characters (e.g. an attacker-supplied header).`,
      fix: py`Compare bytes: \`hmac.compare_digest(expected.encode(), received.encode())\`, or reject non-ASCII input first. Don't let this error turn into a 500 with a stack trace.`,
    },
    {
      symptom: py`TypeError: Strings must be encoded before hashing`,
      cause: py`\`hashlib\` and \`hmac\` work on bytes; a \`str\` was passed.`,
      fix: py`Encode explicitly with UTF-8: \`hashlib.sha256(text.encode())\`. For keys: \`hmac.new(key.encode(), …)\` — or store keys as bytes from the start.`,
    },
    {
      symptom: py`TypeError: Missing required argument 'digestmod'.`,
      cause: py`\`hmac.new(key, msg)\` was called without choosing a hash. Since Python 3.8 there is no default (the old default was MD5).`,
      fix: py`Always pass it: \`hmac.new(key, msg, hashlib.sha256)\`.`,
    },
    {
      symptom: py`AttributeError: module 'hashlib' has no attribute 'pbkdf2_hmac'`,
      cause: py`The Python build has no OpenSSL (minimal or embedded builds, such as this browser runtime).`,
      fix: py`Use a standard CPython build, or a dedicated library such as argon2-cffi or bcrypt. Don't replace it with a home-made loop of SHA-256 calls.`,
    },
  ],
  bestPractices: [
    'Never put secrets in source code, config files in git, Docker images, URLs or logs.',
    'Load secrets from environment variables or a secret manager at start-up; fail fast if a required one is missing.',
    'Commit .env.example, never .env; add .env to .gitignore before the first commit, and enable secret scanning.',
    'Use the secrets module (token_urlsafe(32), token_hex) for every token; never random.',
    'Store passwords with Argon2id (or bcrypt / scrypt / PBKDF2 with a high work factor) and store the parameters with the hash.',
    'Store only hashes of reset tokens and API keys; a single SHA-256 is fine for high-entropy random tokens.',
    'Sign messages with hmac.new(key, msg, hashlib.sha256) and verify with hmac.compare_digest on bytes.',
    'Mark secret fields repr=False and redact secrets in logs and error reports.',
    'When a secret leaks: rotate it first, check access logs, then clean up history and fix the process.',
  ],
  useCases: [
    'Database URLs, API keys and signing keys for web services and scripts.',
    'User sign-up and login (password storage and verification).',
    'Password-reset links, email-verification links, session IDs and API keys.',
    'Verifying webhooks from payment providers and code hosts.',
    'Signed cookies and expiring download links.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'secrets-and-passwords-q1',
      type: 'mcq',
      prompt: 'Which is the best way to store user passwords?',
      options: [
        { text: 'Encrypt them with AES and keep the key in an environment variable', why: 'Encryption is reversible: anyone who obtains the key (or the running server) gets every password. You never need to read a password back.' },
        { text: 'SHA-256 with a random salt per user', why: 'Salts stop precomputed tables, but SHA-256 is fast, so each guess is still cheap. Passwords need a deliberately slow function.' },
        'Argon2id (or bcrypt/scrypt/PBKDF2) with a unique salt and a tuned work factor, parameters stored with the hash',
        { text: 'Base64-encode them', why: 'Base64 is an encoding, not protection — anyone can decode it instantly.' },
      ],
      answer: 2,
      explanation: py`Password-hashing functions combine a per-user salt with a deliberately expensive computation, and their output records the parameters so they can be raised over time.`,
    },
    {
      id: 'secrets-and-passwords-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import secrets

token = secrets.token_urlsafe(32)
hex_key = secrets.token_hex(16)
print(len(token), len(hex_key))`,
      answer: '43 32',
      accept: ['43 32'],
      explanation: py`\`token_urlsafe(32)\` base64url-encodes 32 random bytes without padding: 32 × 4/3 rounded up = 43 characters. \`token_hex(16)\` gives two hex characters per byte = 32. The *number of bytes* is what sets the strength.`,
    },
    {
      id: 'secrets-and-passwords-q3',
      type: 'bug',
      prompt: 'This webhook handler is meant to reject forged requests. Click the line with the security bug.',
      code: py`import hashlib
import hmac
import os

SECRET = os.environ["WEBHOOK_SECRET"].encode()

def is_genuine(body: bytes, signature: str) -> bool:
    expected = hmac.new(SECRET, body, hashlib.sha256).hexdigest()
    return expected == signature`,
      answerLine: 9,
      explanation: py`\`==\` may return as soon as a character differs, leaking timing information about how much of a forged signature is correct. Use \`hmac.compare_digest(expected.encode(), signature.encode())\`. The rest — key from the environment, \`hmac.new\` with SHA-256 — is right.`,
    },
    {
      id: 'secrets-and-passwords-q4',
      type: 'fill',
      prompt: 'Complete the code so that a missing `API_KEY` stops the program at start-up, and the token is generated securely.',
      code: py`import os
import secrets

API_KEY = os.___["API_KEY"]
session_token = secrets.___(32)`,
      answer: [['environ'], ['token_urlsafe', 'token_hex', 'token_bytes']],
      explanation: py`\`os.environ["API_KEY"]\` raises \`KeyError\` when the variable is missing — failing fast is what you want for a required secret. \`secrets.token_urlsafe(32)\` (or \`token_hex\` / \`token_bytes\`) uses the OS's secure random source.`,
    },
    {
      id: 'secrets-and-passwords-q5',
      type: 'mcq',
      prompt: 'A developer accidentally pushed a live payment API key to a public repository 10 minutes ago. What should happen **first**?',
      options: [
        { text: 'Force-push a commit that removes it', why: 'The key may already be cloned, cached or scraped by bots. Removing it from the repository doesn\'t make it secret again.' },
        { text: 'Make the repository private', why: 'Helps prevent further exposure, but anyone who copied it already can use it.' },
        'Revoke or rotate the key at the provider, deploy the replacement, then investigate usage and clean up history',
        { text: 'Add the file to .gitignore', why: '.gitignore only affects untracked files; it does nothing for a key already committed and pushed.' },
      ],
      answer: 2,
      explanation: py`Assume a leaked secret is compromised. Rotating it is the only action that removes the attacker's access; everything else is cleanup and prevention.`,
    },
    {
      id: 'secrets-and-passwords-q6',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`import hashlib

a = hashlib.sha256(b"salt-1" + b"hunter2").hexdigest()
b = hashlib.sha256(b"salt-2" + b"hunter2").hexdigest()
c = hashlib.sha256(b"salt-1" + b"hunter2").hexdigest()
print(a == b, a == c)`,
      options: [
        { text: 'True True', why: 'The salts differ between a and b, so the hashed inputs differ.' },
        'False True',
        { text: 'False False', why: 'Hashing is deterministic: the same salt and password always give the same digest — that\'s how login checks work.' },
        { text: 'True False', why: 'Look at which inputs are identical: a and c share both salt and password.' },
      ],
      answer: 1,
      explanation: py`Same input → same digest (needed to verify logins); different salt → unrelated digest (so identical passwords look different). Remember this shows salting only — a single SHA-256 is still far too fast for passwords.`,
    },
    {
      id: 'secrets-and-passwords-q7',
      type: 'short',
      prompt: 'Why is a single SHA-256 acceptable for storing password-reset tokens made with `secrets.token_urlsafe(32)` but not for storing user passwords?',
      answer: py`A token from token_urlsafe(32) contains 256 bits of randomness, so even billions of guesses per second can't find it — the hash only needs to be one-way so a database leak doesn't reveal usable tokens. Human passwords have little randomness and follow patterns, so attackers can guess likely ones quickly; for those, the hash must be deliberately slow and salted (Argon2id, bcrypt, scrypt, PBKDF2) to make each guess expensive.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'webhook-signature',
      title: 'Verify a webhook signature',
      difficulty: 'intermediate',
      prompt: py`A payment provider sends webhooks with a hex HMAC-SHA256 signature of the raw body, made with a shared key. Fix both functions:

- \`sign(body, key)\` returns \`hmac.new(key, body, hashlib.sha256).hexdigest()\` (both arguments are \`bytes\`).
- \`verify(body, signature, key)\` returns \`True\` only if \`signature\` (a \`str\` from an HTTP header) matches. It must use \`hmac.compare_digest\`, and must return \`False\` — not raise — for garbage such as \`"zz"\`, \`""\` or non-ASCII text like \`"é"\`.`,
      files: {
        'main.py': py`import hashlib
import hmac


def sign(body, key):
    # TODO: this is not a MAC
    return hashlib.sha256(key + body).hexdigest()


def verify(body, signature, key):
    # TODO: compare safely
    return sign(body, key) == signature


key = b"demo-shared-key"
body = b'{"event": "payment.succeeded", "amount": 4200}'
signature = sign(body, key)
print(signature[:16], verify(body, signature, key))
`,
      },
      hints: [
        'The standard library already implements HMAC correctly: hmac.new(key, msg, digestmod).',
        'compare_digest raises TypeError for non-ASCII str — compare bytes instead: .encode() both sides.',
        'return hmac.compare_digest(sign(body, key).encode(), signature.encode())',
      ],
      solution: {
        explanation: py`\`sha256(key + body)\` looks like a keyed hash but is vulnerable to length extension; \`hmac.new\` is the correct construction. \`verify\` recomputes the expected signature from the body it actually received and compares in constant time. Encoding both sides to bytes means any string — including non-ASCII garbage from an attacker — is simply compared and returns \`False\`, instead of raising \`TypeError\` and turning into a 500 error. Different lengths are fine too: \`compare_digest\` just returns \`False\`.`,
        files: {
          'main.py': py`import hashlib
import hmac


def sign(body, key):
    return hmac.new(key, body, hashlib.sha256).hexdigest()


def verify(body, signature, key):
    expected = sign(body, key)
    return hmac.compare_digest(expected.encode(), signature.encode())


key = b"demo-shared-key"
body = b'{"event": "payment.succeeded", "amount": 4200}'
signature = sign(body, key)
print(signature[:16], verify(body, signature, key))
`,
        },
      },
      tests: [
        { name: 'sign() is HMAC-SHA256', code: py`import hashlib, hmac
assert sign(b"hello", b"k") == hmac.new(b"k", b"hello", hashlib.sha256).hexdigest()` },
        { name: 'a genuine signature verifies', code: py`s = sign(b"body", b"key")
assert verify(b"body", s, b"key") is True` },
        { name: 'tampered bodies and wrong keys fail', code: py`s = sign(b"amount=10", b"key")
assert verify(b"amount=99", s, b"key") is False
assert verify(b"amount=10", s, b"other-key") is False` },
        { name: 'garbage signatures return False', code: py`for bad in ["zz", "", "é", "x" * 64]:
    assert verify(b"body", bad, b"key") is False` },
        { name: 'uses hmac.compare_digest', code: py`assert "compare_digest" in files["main.py"]` },
      ],
    },
    {
      id: 'settings-from-env',
      title: 'Settings that fail fast and never leak',
      difficulty: 'advanced',
      prompt: py`\`load_settings(env)\` receives a mapping such as \`os.environ\` and returns a frozen \`Settings\`. Requirements:

1. \`DATABASE_URL\` and \`API_KEY\` are **required** and must be non-empty. If any are missing, raise \`RuntimeError\` whose message names **every** missing variable — and contains no values from \`env\`.
2. \`DEBUG\` is optional: \`"true"\` / \`"false"\` in any letter case → \`bool\`; missing → \`False\`; anything else → \`ValueError\`.
3. \`PORT\` is optional: an int from 1 to 65535, default \`8000\`; otherwise \`ValueError\`.
4. \`repr(settings)\` (and therefore \`print(settings)\`) must **not** contain the database URL or the API key.`,
      files: {
        'main.py': py`from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    api_key: str
    debug: bool = False
    port: int = 8000


def load_settings(env):
    # TODO: fail fast, parse types, and keep secrets out of repr()
    return Settings(
        database_url=env.get("DATABASE_URL", ""),
        api_key=env.get("API_KEY", ""),
        debug=env.get("DEBUG") == "true",
        port=int(env.get("PORT", 8000)),
    )


demo_env = {"DATABASE_URL": "postgresql://app:pw@db/shop", "API_KEY": "sk_live_abc", "DEBUG": "False"}
print(load_settings(demo_env))
`,
      },
      hints: [
        'Collect the missing names first: missing = [n for n in ("DATABASE_URL", "API_KEY") if not env.get(n)].',
        'dataclasses.field(repr=False) hides a field from the generated __repr__.',
        'For DEBUG: value = env.get("DEBUG", "false").lower(); allow only "true"/"false". For PORT: check .isascii() and .isdecimal() before int(), then the range.',
      ],
      solution: {
        explanation: py`Required secrets are checked together, so an operator sees *all* missing names in one error, and the message is built only from the variable names — never from values. \`field(repr=False)\` removes the secret fields from the generated \`repr\`, so printing or logging the settings object can't leak them (the object still holds them for the code that needs them). Optional values are parsed strictly: \`"yes"\` or \`"1"\` for \`DEBUG\` is an error rather than a silent \`False\`, and \`PORT\` must be plain digits in range. Real apps call \`load_settings(os.environ)\` once at start-up and let the exception stop the process.`,
        files: {
          'main.py': py`from dataclasses import dataclass, field

REQUIRED = ("DATABASE_URL", "API_KEY")


@dataclass(frozen=True)
class Settings:
    database_url: str = field(repr=False)
    api_key: str = field(repr=False)
    debug: bool = False
    port: int = 8000


def parse_bool(name, raw):
    value = raw.strip().lower()
    if value not in ("true", "false"):
        raise ValueError(f"{name} must be true or false")
    return value == "true"


def parse_port(raw):
    text = raw.strip()
    if not (text.isascii() and text.isdecimal()) or not 1 <= int(text) <= 65535:
        raise ValueError("PORT must be a number from 1 to 65535")
    return int(text)


def load_settings(env):
    missing = [name for name in REQUIRED if not env.get(name)]
    if missing:
        raise RuntimeError(f"missing required settings: {', '.join(missing)}")
    return Settings(
        database_url=env["DATABASE_URL"],
        api_key=env["API_KEY"],
        debug=parse_bool("DEBUG", env.get("DEBUG", "false")),
        port=parse_port(env.get("PORT", "8000")),
    )


demo_env = {"DATABASE_URL": "postgresql://app:pw@db/shop", "API_KEY": "sk_live_abc", "DEBUG": "False"}
print(load_settings(demo_env))
`,
        },
      },
      tests: [
        { name: 'loads required values and defaults', code: py`s = load_settings({"DATABASE_URL": "postgresql://app:pw@db/shop", "API_KEY": "sk_live_abc"})
assert (s.database_url, s.api_key, s.debug, s.port) == ("postgresql://app:pw@db/shop", "sk_live_abc", False, 8000)` },
        { name: 'missing settings are all named, with no values', code: py`with raises(RuntimeError) as info:
    load_settings({"DATABASE_URL": "postgresql://app:pw@db/shop"})
msg = str(info.value)
assert "API_KEY" in msg and "pw@db" not in msg
with raises(RuntimeError) as info:
    load_settings({"API_KEY": ""})
assert "DATABASE_URL" in str(info.value) and "API_KEY" in str(info.value)` },
        { name: 'repr() does not leak secrets', code: py`s = load_settings({"DATABASE_URL": "postgresql://app:pw@db/shop", "API_KEY": "sk_live_abc"})
assert "sk_live_abc" not in repr(s) and "pw@db" not in repr(s)` },
        { name: 'DEBUG is parsed strictly', code: py`base = {"DATABASE_URL": "x", "API_KEY": "y"}
assert load_settings({**base, "DEBUG": "TRUE"}).debug is True
assert load_settings({**base, "DEBUG": "false"}).debug is False
with raises(ValueError):
    load_settings({**base, "DEBUG": "yes"})` },
        { name: 'PORT is parsed and range-checked', code: py`base = {"DATABASE_URL": "x", "API_KEY": "y"}
assert load_settings({**base, "PORT": "8080"}).port == 8080
for bad in ["0", "70000", "http", "-1"]:
    with raises(ValueError):
        load_settings({**base, "PORT": bad})` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'secrets-and-passwords-hash-vs-encrypt',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain the difference between hashing, encryption and password hashing. Which do you use for user passwords?',
      answer: 'Hashing is a one-way, keyless fingerprint and is fast. Encryption is reversible with a key. Password hashing is one-way, salted and deliberately slow (Argon2id, bcrypt, scrypt, PBKDF2). Use password hashing for passwords — never encryption or a plain fast hash.',
      explanation: py`You never need to recover a password, only check it, so reversible encryption adds risk for no benefit. Fast hashes make offline guessing cheap. Password hashes add per-user salts and a tunable work factor so stolen hashes are expensive to crack.`,
      whyAsked: 'A classic screening question: confusing these three is a red flag for anyone touching authentication.',
      mistakes: ['Saying "we encrypt passwords"', 'Recommending MD5/SHA-256 for passwords', 'Not mentioning salts or work factors'],
      followUps: ['What is a salt, and is it secret?', 'What is a pepper?', 'How do you upgrade old hashes to a stronger algorithm?'],
      modelAnswer: 'A hash like SHA-256 is a one-way fingerprint with no key, designed to be fast — good for checksums. Encryption is reversible: with the key you get the original back, which is right for data you need to read later. Password hashing is a special kind of one-way function that\'s salted per user and deliberately slow, like Argon2id, bcrypt, scrypt or PBKDF2 with a high work factor. For passwords I always use a password hash, typically Argon2id via a well-maintained library, store the parameters with the hash, and re-hash on login when I raise the parameters.',
    },
    {
      id: 'secrets-and-passwords-review-login',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Review this login check. List the problems and how you would fix them.',
      code: { lang: 'python', code: py`import hashlib

def check_login(user, password):
    hashed = hashlib.md5(password.encode()).hexdigest()
    if hashed == user.password_hash:
        return True
    print(f"failed login for {user.email} with password {password}")
    return False` },
      answer: 'MD5 is fast and broken for this purpose; there is no salt; == is not constant-time; and the failure path logs the plaintext password. Switch to Argon2id (argon2-cffi PasswordHasher.verify, which salts and compares safely), migrate old hashes on next login, and log failures without any secret — plus rate limiting.',
      explanation: py`Migration path: keep verifying legacy MD5 hashes only to re-hash the password with Argon2id on the user's next successful login, and force resets for accounts that never return. Logging a typed password is especially bad: users often mistype into the wrong field or reuse passwords elsewhere, and logs are widely readable.`,
      whyAsked: 'Tests the ability to spot several independent security flaws in a small, realistic snippet — and to propose a migration, not just a rewrite.',
      mistakes: ['Only noticing MD5', 'Proposing SHA-256 with a salt as the fix', 'Forgetting the plaintext password in the log', 'Ignoring how to migrate existing users'],
      followUps: ['How would you migrate a million existing MD5 hashes?', 'What else protects the login endpoint besides hashing?'],
      modelAnswer: 'There are four problems. MD5 is a fast general-purpose hash, so stolen hashes can be guessed extremely quickly, and there\'s no salt, so identical passwords share hashes and precomputed tables work. The comparison uses double-equals rather than a constant-time compare. And the failure branch logs the plaintext password, which is a serious leak. I\'d move to Argon2id through argon2-cffi, whose verify handles salts, parameters and safe comparison; on each successful legacy login I\'d re-hash with Argon2id. I\'d log only the user ID and outcome, and add rate limiting and MFA on the endpoint.',
    },
    {
      id: 'secrets-and-passwords-random-vs-secrets',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 2,
      question: 'Which call should generate a password-reset token?',
      options: ['random.randint(100000, 999999)', '"".join(random.choices(string.ascii_letters, k=32))', 'uuid.uuid1().hex', 'secrets.token_urlsafe(32)'],
      correctOption: 3,
      answer: 'secrets.token_urlsafe(32). The random module is predictable, a 6-digit number is guessable, and uuid1 is derived from a timestamp and host identifier rather than secure randomness.',
      explanation: py`\`random\` (Mersenne Twister) is not cryptographically secure. \`uuid1\` encodes time and a node ID — partly predictable. \`uuid4\` uses \`os.urandom\` in CPython, but \`secrets\` states the intent explicitly and lets you choose the size. Store only a hash of the token, make it single-use, and give it a short expiry.`,
      whyAsked: 'Checks that the candidate knows which standard-library randomness is safe for security purposes.',
      mistakes: ['Thinking random is fine if seeded with the time', 'Using short numeric codes without rate limiting', 'Storing the raw token in the database'],
      followUps: ['How long should the token be valid?', 'Why store a hash of the token?'],
      modelAnswer: 'I\'d use secrets.token_urlsafe(32), which draws 256 bits from the operating system\'s cryptographically secure generator and encodes them safely for a URL. The random module is predictable — its state can be reconstructed from outputs — and a six-digit code is guessable without strict rate limits. uuid1 is built from a timestamp and host identifier, so it\'s partly predictable. I\'d also store only a SHA-256 of the token, make it single-use and expire it quickly.',
    },
    {
      id: 'secrets-and-passwords-reset-tokens',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: py`Implement \`new_reset_token()\` returning \`(token, token_hash)\`: \`token\` from \`secrets.token_urlsafe(32)\` (emailed to the user) and \`token_hash\`, the SHA-256 hex digest of the token (stored in the database). Then implement \`token_matches(token, stored_hash)\` using \`hmac.compare_digest\`.`,
      answer: 'token = secrets.token_urlsafe(32); token_hash = hashlib.sha256(token.encode()).hexdigest(); token_matches recomputes the hash of the presented token and compares the two hex digests with hmac.compare_digest.',
      explanation: py`Storing only the hash means a database leak doesn't hand out working reset links. A single fast hash is fine here because the token has 256 bits of entropy — there's nothing to brute-force. In production, also store an expiry time and the user ID, and delete the record after use.`,
      starter: { files: { 'main.py': py`import hashlib
import hmac
import random
import string


def new_reset_token():
    # TODO: use a secure generator and store only a hash
    token = "".join(random.choices(string.ascii_letters, k=20))
    return token, token


def token_matches(token, stored_hash):
    return token == stored_hash


token, stored = new_reset_token()
print(token_matches(token, stored))
` } },
      tests: [
        { name: 'tokens are long, URL-safe and unique', code: py`import re
tokens = {new_reset_token()[0] for _ in range(20)}
assert len(tokens) == 20
assert all(len(t) >= 43 and re.fullmatch(r"[A-Za-z0-9_-]+", t) for t in tokens)` },
        { name: 'the stored value is the SHA-256 of the token, not the token', code: py`import hashlib
token, stored = new_reset_token()
assert stored != token
assert stored == hashlib.sha256(token.encode()).hexdigest()` },
        { name: 'token_matches accepts the right token and rejects others', code: py`token, stored = new_reset_token()
assert token_matches(token, stored) is True
assert token_matches(token + "x", stored) is False
assert token_matches(new_reset_token()[0], stored) is False` },
        { name: 'uses secrets and compare_digest, not random', code: py`src = files["main.py"]
assert "secrets." in src and "compare_digest" in src and "import random" not in src` },
      ],
      solution: { files: { 'main.py': py`import hashlib
import hmac
import secrets


def _digest(token):
    return hashlib.sha256(token.encode()).hexdigest()


def new_reset_token():
    token = secrets.token_urlsafe(32)
    return token, _digest(token)


def token_matches(token, stored_hash):
    return hmac.compare_digest(_digest(token).encode(), stored_hash.encode())


token, stored = new_reset_token()
print(token_matches(token, stored))
` } },
      hints: ['secrets.token_urlsafe(32) gives 43+ URL-safe characters.', 'hashlib.sha256(token.encode()).hexdigest() is the stored value.', 'To check, hash the presented token and compare the two digests with hmac.compare_digest.'],
      whyAsked: 'Reset flows are a common account-takeover path; the question checks secure randomness, hashing at rest and constant-time comparison together.',
      mistakes: ['Storing the raw token', 'Using random or uuid1', 'Comparing with == instead of hmac.compare_digest'],
      followUps: ['How do you make the token single-use and expiring?', 'Why is a fast hash acceptable here?'],
      modelAnswer: 'I generate the token with secrets.token_urlsafe(32), which is 256 bits of secure randomness, and email it to the user. In the database I store only its SHA-256 hex digest, so a database leak doesn\'t expose working links. A fast hash is fine because the token is far too random to brute-force. To check a presented token, I hash it and compare the digests with hmac.compare_digest. In production I\'d store the user ID and an expiry with the hash and delete the record once it\'s used.',
    },
    {
      id: 'secrets-and-passwords-leaked-key',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Secret scanning alerts you that a cloud access key was committed to a public repository three days ago. Walk through your response.',
      answer: 'Revoke/rotate the key immediately and deploy a replacement; review the provider\'s audit logs for activity with that key since the commit and respond to any misuse; remove the key from code and, if useful, from history; then fix the root cause — secrets from a secret manager or environment, pre-commit and push-protection scanning, least-privilege and short-lived credentials.',
      explanation: py`Three days in public means you must assume compromise — bots scrape public repositories for keys continuously. Order matters: rotation ends the attacker's access; investigation measures the damage (new users, instances, data reads); cleanup and process changes prevent a repeat. A blameless post-incident review finds why the key was in a file at all.`,
      whyAsked: 'Incident response judgement: candidates who start with "rewrite git history" reveal they don\'t treat leaked secrets as compromised.',
      mistakes: ['Starting with git history rewriting', 'Not checking audit logs for misuse', 'Rotating without updating every consumer, causing an outage', 'Blaming the individual instead of fixing the process'],
      followUps: ['How would you avoid an outage while rotating?', 'What would make this key less dangerous next time?'],
      modelAnswer: 'I treat the key as compromised, because public repositories are scanned by bots within minutes. Step one is to revoke or rotate it at the cloud provider and deploy the replacement to everything that uses it. Step two is to check the provider\'s audit logs for any activity with that key since the commit — new resources, data access, IAM changes — and escalate if there was misuse. Then I remove it from the code, and optionally purge history, knowing that doesn\'t un-leak it. Finally I fix the process: secrets only from a secret manager or environment, push protection and pre-commit scanning, and short-lived, least-privilege credentials so any future leak is far less damaging.',
    },
    {
      id: 'secrets-and-passwords-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design secrets management for a Python service deployed to development, staging and production. How do secrets get into the process, and how do you rotate them?',
      answer: 'Store secrets per environment in a secret manager; grant each service identity read access only to its own secrets; inject them at start-up (environment variables or mounted files, or fetched via the SDK) into one typed settings object that fails fast and never logs values; local development uses an uncommitted .env; rotate with versioned secrets and overlapping validity, prefer short-lived dynamic credentials, and audit access.',
      explanation: py`Key points: separate secrets per environment (a staging leak never unlocks production); workload identity (IAM roles, service accounts) instead of a "secret to fetch secrets"; one settings module that parses and validates all configuration; rotation with two valid versions during cut-over (dual-key verification for signing keys, new DB user then retire the old one); automation so rotation is boring; audit logs and alerts on unusual access.`,
      whyAsked: 'Senior question covering operational security, least privilege and rotation — beyond "use environment variables".',
      mistakes: ['Sharing one set of secrets across environments', 'Baking secrets into container images', 'Forgetting rotation and how to do it without downtime', 'No audit trail'],
      followUps: ['Environment variables or mounted files — trade-offs?', 'How do you rotate an HMAC signing key without rejecting in-flight requests?'],
      modelAnswer: 'Each environment has its own secrets in a secret manager, and each service runs with its own platform identity that can read only the secrets it needs — so there is no bootstrap password to leak. At start-up the platform injects them as environment variables or files, or the app fetches them, and a single settings module parses and validates everything, fails fast if something is missing, and keeps secret fields out of repr and logs. Developers use an uncommitted .env with non-production values. For rotation I keep two versions valid during a cut-over — for signing keys I accept both while signing with the new one — and prefer short-lived, automatically issued credentials. Access is audited and alerts fire on anything unusual.',
    },
  ],

  takeaways: [
    'Secrets never go in source code, git, images, URLs or logs; load them from the environment or a secret manager and fail fast if missing.',
    'Commit .env.example, ignore .env, and turn on secret scanning; a leaked secret must be rotated first — deleting the commit is not enough.',
    'Use the secrets module (token_urlsafe(32), token_hex) for tokens and keys; random is predictable.',
    'Hashing is one-way and fast, encryption is reversible, password hashing is one-way, salted and deliberately slow.',
    'Store passwords with Argon2id (or bcrypt / scrypt / PBKDF2 with a high work factor) and keep the parameters with the hash so you can raise them.',
    'A single SHA-256 is fine for high-entropy random tokens — never for passwords.',
    'Use hmac.new(key, msg, hashlib.sha256) to sign messages and hmac.compare_digest on bytes to check them.',
  ],
}

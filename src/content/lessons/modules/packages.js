// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const SHOP_INIT = py`"""shop: a tiny online-shop package.

The names imported here are the package's public API: users write
from shop import Cart without knowing which file Cart lives in.
"""
print("[shop/__init__.py runs]")

from .cart import Cart
from .pricing import format_money

__all__ = ["Cart", "format_money"]
__version__ = "1.0.0"
`

const SHOP_PRICING = py`"""Money helpers. Prices are whole pence (ints), so there is no float rounding."""
VAT_PERCENT = 20


def with_vat(pence):
    return pence + pence * VAT_PERCENT // 100


def format_money(pence):
    return f"£{pence // 100}.{pence % 100:02d}"
`

const SHOP_CART = py`"""The shopping cart."""
from .pricing import format_money, with_vat   # relative: a sibling module


class Cart:
    def __init__(self):
        self.items = []   # (name, unit price in pence, quantity)

    def add(self, name, pence, quantity=1):
        self.items.append((name, pence, quantity))

    def total(self):
        return sum(with_vat(pence) * qty for _, pence, qty in self.items)

    def receipt(self):
        lines = [f"{qty} x {name}: {format_money(with_vat(pence) * qty)}"
                 for name, pence, qty in self.items]
        lines.append(f"TOTAL: {format_money(self.total())}")
        return "\n".join(lines)
`

const SHOP_PAYMENTS_INIT = py`"""Payment methods: a subpackage of shop."""
`

const SHOP_CARD = py`"""Card payments. Two dots climb from shop.payments up to shop."""
from ..pricing import format_money


def pay(amount_pence, card_number):
    return f"Charged {format_money(amount_pence)} to card ending {card_number[-4:]}"
`

const MAIN = py`import sys

import shop                       # runs shop/__init__.py
from shop import Cart             # re-exported by shop/__init__.py
from shop.payments import card    # a module inside a subpackage

cart = Cart()
cart.add("notebook", 250, 2)
cart.add("pen", 120, 3)
print(cart.receipt())
print(card.pay(cart.total(), "4111111111111111"))

print("--- the package machinery ---")
print("version:", shop.__version__)
print("Cart is defined in:", Cart.__module__)
print("card's package:", card.__package__)
print("loaded:", sorted(name for name in sys.modules if name.startswith("shop")))
`

const TEXTSTATS_CLEANING = py`"""Turning raw text into a list of clean, lower-case words."""


def words(text):
    cleaned = (word.strip(".,!?;:").lower() for word in text.split())
    return [word for word in cleaned if word]
`

const TEXTSTATS_MAIN = py`import textstats

TEXT = "The cat sat. The cat ran! A dog sat."

if hasattr(textstats, "word_count"):
    print("words:", textstats.word_count(TEXT))
    print("top 2:", textstats.top_words(TEXT, 2))
else:
    print("textstats does not export word_count yet")
`

const BILLING_INIT = py`"""Billing: customers and their orders."""
`

const BILLING_MAIN = py`from billing.customers import Customer

ada = Customer("Ada")
order = ada.place_order(4200)
print(order.summary())
`

export default {
  id: 'packages',
  title: 'Packages, __init__.py & relative imports',
  summary: 'A package is a folder of modules with an __init__.py; dotted imports walk it, relative imports move inside it, and __all__ shapes its public API.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['modules-and-imports'],
  related: ['main-guard-and-scripts', 'project-structure', 'packaging', 'classes-and-objects', 'code-quality-tools'],
  tags: ['packages', '__init__.py', 'subpackages', 'dotted import', 'absolute import', 'relative import', 'from . import', '__all__', 'public API', 'namespace packages', 'PEP 420', 'circular imports', '__path__', '__package__'],
  apis: [
    { name: '__init__.py', summary: 'Marks a folder as a regular package; its code runs the first time the package is imported.' },
    { name: 'import package.module', summary: 'Imports the package, then the submodule; binds the top-level name package.' },
    { name: 'from . import module', summary: 'Relative import of a sibling module from inside a package.' },
    { name: 'from .module import name', summary: 'Relative import of a name from a sibling module.' },
    { name: 'from ..module import name', summary: 'Relative import from the parent package (each extra dot climbs one level).' },
    { name: '__all__', summary: 'A list of public names: controls what from package import * binds and documents the API.' },
    { name: 'package.__path__', summary: 'The folder(s) Python searches for the package\'s submodules.' },
    { name: '__package__', summary: 'The package a module belongs to; used to resolve its relative imports.' },
    { name: 'importlib.util.resolve_name(name, package)', summary: 'Turns a relative module name like "..pricing" into an absolute one.' },
  ],
  docs: [
    { label: 'Python tutorial — Packages', url: 'https://docs.python.org/3/tutorial/modules.html#packages' },
    { label: 'Language reference — Packages (regular and namespace)', url: 'https://docs.python.org/3/reference/import.html#packages' },
    { label: 'PEP 328 — Absolute and relative imports', url: 'https://peps.python.org/pep-0328/' },
    { label: 'PEP 420 — Implicit namespace packages', url: 'https://peps.python.org/pep-0420/' },
    { label: 'PEP 8 — Imports', url: 'https://peps.python.org/pep-0008/#imports' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Once a project has more than a handful of [modules](lesson:modules-and-imports), you want to group them — the same way you put files into folders. A **package** is exactly that: a **folder of modules** that Python can import as one unit.`,
    { code: py`shop/                  <- the package "shop"
    __init__.py        <- makes the folder a (regular) package
    cart.py            <- module "shop.cart"
    pricing.py         <- module "shop.pricing"
    payments/          <- a subpackage "shop.payments"
        __init__.py
        card.py        <- module "shop.payments.card"`, lang: 'text', title: 'a package on disk' },
    py`You reach inside with **dotted names**: \`import shop.cart\`, \`from shop.payments import card\`. Inside the package, modules can refer to each other with **relative imports** (\`from .pricing import with_vat\` — "from the module *pricing* next to me"). And \`__init__.py\` gets to decide what the package looks like from the outside, so users can simply write \`from shop import Cart\`.`,
    py`This lesson covers how dotted imports are resolved, what \`__init__.py\` and \`__all__\` are for, absolute vs relative imports, namespace packages, and the classic headache of big codebases: **circular imports**.`,
  ],
  why: [
    py`**Organisation.** Real projects have dozens or hundreds of modules. Packages turn a flat pile of files into a tree: \`shop.payments.card\`, \`shop.payments.voucher\`, \`shop.reports.sales\`. Related code lives together.`,
    py`**Namespaces at scale.** Two packages can both have a \`utils\` module — \`shop.utils\` and \`blog.utils\` never clash, because the full dotted name is different.`,
    py`**A clean public API.** \`__init__.py\` can re-export the important names so users write \`from shop import Cart\` and never need to know (or depend on) which internal file \`Cart\` lives in. You can then reorganise the inside freely.`,
    py`**Distribution.** Everything you install with pip — \`requests\`, \`django\`, \`numpy\` — is one or more packages. Understanding packages is the first step to [packaging your own code](lesson:packaging).`,
  ],
  eli15: [
    py`A module is a toolbox. A package is a **cupboard** that holds several toolboxes, maybe with smaller cupboards inside.`,
    py`To get a tool you give its full address: "the *shop* cupboard → the *payments* shelf → the *card* toolbox". In Python that's \`shop.payments.card\`.`,
    py`\`__init__.py\` is a note stuck on the cupboard door. It's read the first time anyone opens the cupboard, and it can say "the most useful tools are right here at the front" — that's how \`from shop import Cart\` works without saying which toolbox \`Cart\` is in.`,
    py`When you're already *inside* the cupboard, you can give short directions: "the box next to me" (\`from . import pricing\`) or "the shelf above me" (\`from .. import pricing\`). Those are relative imports.`,
  ],
  analogy: {
    title: 'A department store',
    body: [
      py`A department store (the package) has departments (subpackages) with aisles (modules) full of products (functions and classes). At the entrance there's a **store directory** listing the featured products and where to find them — that's \`__init__.py\`, and its list of featured products is \`__all__\`.`,
      py`A delivery driver needs the store's **full address** and the department name — an absolute import. A shop assistant already inside can just say "two aisles over" — a relative import. That shortcut only makes sense if you're inside the store: a relative import in a file that isn't part of a package fails.`,
    ],
    mapping: [
      ['the store', 'the top-level package (shop)'],
      ['a department', 'a subpackage (shop.payments)'],
      ['an aisle', 'a module (shop.payments.card)'],
      ['the directory at the entrance', '__init__.py — runs when the package is first imported'],
      ['"featured products" on the directory', '__all__ and the names re-exported by __init__.py'],
      ['the full street address', 'an absolute import: from shop.pricing import with_vat'],
      ['"two aisles over"', 'a relative import: from ..pricing import with_vat'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'How `import shop.cart` is resolved',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'stmt', label: 'import shop.cart', note: 'in main.py', x: 95, y: 70, tone: 'yellow' },
        { id: 'syspath', label: 'sys.path', note: 'searched for "shop"', x: 95, y: 250, tone: 'blue' },
        { id: 'pkg', label: 'shop/__init__.py', note: 'runs first', x: 300, y: 250, tone: 'kraft' },
        { id: 'pkgmod', label: 'module shop', note: 'sys.modules["shop"], has __path__', x: 300, y: 70 },
        { id: 'cartpy', label: 'shop/cart.py', note: 'found via shop.__path__', x: 510, y: 250, tone: 'kraft' },
        { id: 'cartmod', label: 'module shop.cart', note: 'sys.modules["shop.cart"]', x: 510, y: 70 },
        { id: 'bind', label: 'name: shop', note: 'bound in main.py', x: 680, y: 160, tone: 'yellow' },
      ],
      edges: [
        { from: 'stmt', to: 'syspath', label: 'parent first' },
        { from: 'syspath', to: 'pkg', label: 'found shop/' },
        { from: 'pkg', to: 'pkgmod', label: 'run + cache' },
        { from: 'pkgmod', to: 'cartpy', label: 'search __path__' },
        { from: 'cartpy', to: 'cartmod', label: 'run + cache' },
        { id: 'attr', from: 'cartmod', to: 'pkgmod', label: 'shop.cart = …', dashed: true },
        { from: 'pkgmod', to: 'bind', label: 'bind top name' },
      ],
      steps: [
        { focus: ['stmt'], text: py`Python splits the dotted name. To import \`shop.cart\` it must first import every parent: \`shop\`, then \`shop.cart\`. (Each step checks \`sys.modules\` first, so already-imported parents are reused.)` },
        { focus: ['syspath', 'pkg'], edges: ['stmt->syspath', 'syspath->pkg'], text: py`**The parent.** Python searches \`sys.path\` for \`shop\` and finds a *folder* \`shop/\` containing \`__init__.py\` — a **regular package**.` },
        { focus: ['pkgmod'], edges: ['pkg->pkgmod'], text: py`A module object \`shop\` is created, cached in \`sys.modules["shop"]\`, and **\`__init__.py\` runs**. The package module gets a \`__path__\` attribute: the list of folders where its submodules live (here, just \`.../shop\`).` },
        { focus: ['cartpy', 'cartmod'], edges: ['pkgmod->cartpy', 'cartpy->cartmod'], text: py`**The child.** \`cart\` is searched for **only in \`shop.__path__\`**, not in all of \`sys.path\`. \`shop/cart.py\` is found, run once, and cached as \`sys.modules["shop.cart"]\`.` },
        { focus: ['cartmod', 'pkgmod'], edges: ['attr'], text: py`The submodule is also set as an **attribute** of its parent: \`shop.cart\` now refers to the module object.` },
        { focus: ['bind'], edges: ['pkgmod->bind'], text: py`Finally, \`import shop.cart\` binds the **top-level** name \`shop\` in main.py — not \`cart\`. You write \`shop.cart.Cart()\`. To get a short name, use \`from shop import cart\` or \`import shop.cart as cart\`.` },
      ],
    },
    alt: 'Diagram: import shop.cart first searches sys.path for shop, finds the shop folder with __init__.py, runs it and caches the shop module with its __path__. Then it searches only shop.__path__ for cart, runs shop/cart.py and caches shop.cart, sets it as an attribute of shop, and finally binds the top-level name shop in main.py.',
    caption: py`Step through with ▶. Parents are always imported before children — which is why \`shop/__init__.py\` runs even when you only asked for \`shop.cart\`.`,
  },
  syntax: [
    py`#### Importing from a package`,
    { code: py`import shop.cart                  # binds shop:   shop.cart.Cart()
import shop.cart as cart          # binds cart:   cart.Cart()
from shop import cart             # binds cart:   cart.Cart()
from shop.cart import Cart        # binds Cart:   Cart()
from shop import Cart             # works only if shop/__init__.py provides Cart`, lang: 'python', title: 'absolute imports', static: true },
    py`These are **absolute imports**: the full dotted path from a folder on \`sys.path\`. They work the same from anywhere and PEP 8 recommends them as the default.`,
    py`#### Relative imports (inside a package only)`,
    { code: py`# in shop/cart.py  (package: shop)
from . import pricing                 # the sibling module shop.pricing
from .pricing import with_vat         # a name from shop.pricing

# in shop/payments/card.py  (package: shop.payments)
from .. import pricing                # shop.pricing: '..' is the parent package
from ..pricing import format_money    # a name from shop.pricing
from . import voucher                 # shop.payments.voucher`, lang: 'python', title: 'relative imports', static: true },
    py`- One dot means **the package this module is in**; each extra dot climbs one level.
- Only the \`from … import …\` form can be relative; \`import .pricing\` is a \`SyntaxError\`.
- They're resolved using the module's \`__package__\`, so they only work in a module that was imported **as part of a package**. Run that file directly (\`python shop/cart.py\`) and you get \`ImportError: attempted relative import with no known parent package\` — run it as \`python -m shop.cart\` instead (see [scripts vs modules](lesson:main-guard-and-scripts)).
- Too many dots: \`ImportError: attempted relative import beyond top-level package\`.`,
    py`#### What \`__init__.py\` is for`,
    py`1. It **marks** the folder as a regular package.
2. It **runs** the first time the package (or anything inside it) is imported — keep it light.
3. It can **re-export** a public API: \`from .cart import Cart\` lets users write \`from shop import Cart\`.
4. It can define package-level names like \`__version__\` and \`__all__\`.

An empty \`__init__.py\` is perfectly normal — most are.`,
    py`#### \`__all__\`: the public list`,
    { code: py`# shop/__init__.py
from .cart import Cart
from .pricing import format_money, with_vat

__all__ = ["Cart", "format_money"]   # with_vat is importable, but not "public"`, lang: 'python', static: true, title: '__all__' },
    py`\`__all__\` is a list of strings. It decides exactly what \`from shop import *\` binds, and it **documents** the public API for readers, documentation generators and linters. It doesn't make anything private: \`from shop import with_vat\` still works. A leading underscore (\`_helpers.py\`, \`_cache\`) is the other convention for "internal, don't rely on this".`,
    py`#### Namespace packages (briefly)`,
    py`A folder **without** \`__init__.py\` on \`sys.path\` can still be imported, as a *namespace package* (PEP 420, Python 3.3+). Its \`__path__\` can combine **several** folders with the same name in different places on \`sys.path\` — that's how separately installed distributions can share one top-level name (e.g. company plugins all under \`acme.*\`). For your own code, always add \`__init__.py\`: it's explicit, faster to find, and some tools treat namespace packages differently.`,
    { callout: 'version', title: 'Python 2 habits', text: py`Very old code uses \`from __future__ import absolute_import\` and implicit relative imports (\`import pricing\` meaning "the sibling module"). In Python 3, \`import pricing\` is **always absolute** — it searches \`sys.path\`, not the current package. Use \`from . import pricing\` for a sibling.` },
  ],
  walkthrough: {
    title: 'Reading main.py line by line',
    lang: 'python',
    code: MAIN,
    intro: py`This is \`main.py\` in the playground below. The package lives in the \`shop/\` files. Press **Guide** in the playground to follow along in the editor.`,
    steps: [
      { lines: [3], text: py`\`import shop\` finds the folder \`shop/\` with an \`__init__.py\` and runs that file. Its banner is the first line of output. \`__init__.py\` itself imports \`.cart\` and \`.pricing\`, so those modules load too.` },
      { lines: [4], text: py`\`Cart\` really lives in \`shop/cart.py\`, but \`__init__.py\` re-exported it, so it can be imported straight from \`shop\`. The package is already in \`sys.modules\`, so nothing re-runs.` },
      { lines: [5], text: py`A module inside a subpackage. Python imports \`shop\` (cached), then \`shop.payments\` (runs its \`__init__.py\`), then \`shop.payments.card\`. Inside card.py, \`from ..pricing import format_money\` climbs from \`shop.payments\` up to \`shop\`.` },
      { lines: [7, 11], text: py`Ordinary use. Prices are stored as whole pence (ints) — a notebook at 250p with 20% VAT is 300p — which avoids float rounding errors in money.` },
      { lines: [15], text: py`\`__module__\` records where a class was **defined**: \`shop.cart\`, even though we imported it from \`shop\`.` },
      { lines: [16], text: py`\`__package__\` is what Python uses to resolve a module's relative imports. For card.py it's \`shop.payments\`, so one dot means \`shop.payments\` and two dots mean \`shop\`.` },
      { lines: [17], text: py`Every module in the package is cached under its full dotted name.` },
    ],
  },
  playground: {
    title: 'The shop package',
    objective: 'Run it, then open the shop/ files. Extend the public API, switch an import style and add a module to the payments subpackage.',
    files: {
      'main.py': MAIN,
      'shop/__init__.py': SHOP_INIT,
      'shop/cart.py': SHOP_CART,
      'shop/pricing.py': SHOP_PRICING,
      'shop/payments/__init__.py': SHOP_PAYMENTS_INIT,
      'shop/payments/card.py': SHOP_CARD,
    },
    expected: py`\`\`\`text
[shop/__init__.py runs]
2 x notebook: £6.00
3 x pen: £4.32
TOTAL: £10.32
Charged £10.32 to card ending 1111
--- the package machinery ---
version: 1.0.0
Cart is defined in: shop.cart
card's package: shop.payments
loaded: ['shop', 'shop.cart', 'shop.payments', 'shop.payments.card', 'shop.pricing']
\`\`\`

Notice that \`shop/__init__.py\` ran exactly once, first, and that every module is cached under its full dotted name.`,
    experiments: [
      {
        id: 'export-with-vat',
        task: py`Make \`with_vat\` part of the package's public API: import it in **shop/__init__.py** and add it to \`__all__\`. Then in main.py, \`from shop import with_vat\` and print \`with_vat(1000)\`.`,
        hint: py`In \`shop/__init__.py\`: change the pricing import to \`from .pricing import format_money, with_vat\` and add \`"with_vat"\` to the \`__all__\` list.`,
        tests: [
          { name: '"with_vat" is in shop.__all__', code: py`assert 'with_vat' in module('shop').__all__` },
          { name: 'shop.with_vat works', code: py`assert module('shop').with_vat(1000) == 1200` },
          { name: 'main prints 1200', code: py`assert '1200' in output, 'print(with_vat(1000)) in main.py'` },
        ],
        explain: py`\`__init__.py\` is the package's front door. Re-exporting a name there means users get a short, stable import path (\`from shop import with_vat\`) while you stay free to move the function between internal modules later.`,
      },
      {
        id: 'absolute-import',
        task: py`In **shop/cart.py**, replace the relative import with the equivalent **absolute** import. Does the output change?`,
        hint: py`\`from .pricing import …\` becomes \`from shop.pricing import …\`.`,
        tests: [
          { name: 'cart.py uses an absolute import', code: py`src = files['shop/cart.py']
assert 'from shop.pricing import' in src and 'from .pricing' not in src` },
          { name: 'the receipt still works', code: py`assert 'TOTAL: £10.32' in output` },
        ],
        explain: py`Both forms import the same module. Absolute imports are clearer to read and work in any module; relative imports are shorter and survive renaming the top-level package. PEP 8 recommends absolute imports by default and accepts explicit relative imports inside complex packages — pick one style per project and be consistent.`,
      },
      {
        id: 'who-am-i',
        task: py`At the top of **shop/payments/card.py**, add \`print("card.py:", __name__, "| package:", __package__)\`. Predict the line before you run.`,
        tests: [{ name: 'prints the module and package names', code: py`assert 'card.py: shop.payments.card | package: shop.payments' in output` }],
        explain: py`\`__name__\` is the full dotted name the module was imported under, and \`__package__\` is the package it belongs to. Relative imports are resolved from \`__package__\`: \`..pricing\` → drop one level from \`shop.payments\` → \`shop\` → \`shop.pricing\`.`,
      },
      {
        id: 'voucher',
        task: py`Add a new module **shop/payments/voucher.py** with \`pay(amount_pence, code)\` returning \`f"Paid {format_money(amount_pence)} with voucher {code}"\`. Import \`format_money\` with a **relative** import, then call it from main.py.`,
        hint: py`Copy the import line from card.py: \`from ..pricing import format_money\`. In main.py: \`from shop.payments import voucher\` and \`print(voucher.pay(500, "SPRING"))\`.`,
        tests: [
          { name: 'shop/payments/voucher.py exists', code: py`assert 'shop/payments/voucher.py' in files, 'Create the file shop/payments/voucher.py'` },
          { name: 'it uses a relative import', code: py`assert 'from ..pricing import' in files['shop/payments/voucher.py']` },
          { name: 'pay(500, "SPRING") works', code: py`assert module('shop.payments.voucher').pay(500, "SPRING") == "Paid £5.00 with voucher SPRING"` },
        ],
        explain: py`New module, zero registration: any \`.py\` file inside a package folder becomes a submodule with a dotted name. The relative import keeps working even if someone renames \`shop\` to \`store\` one day.`,
      },
    ],
  },
  animation: {
    type: 'comparison',
    title: 'Absolute vs relative imports',
    props: {
      left: { label: 'Absolute (shop/payments/card.py)', lang: 'python', code: py`from shop.pricing import format_money
from shop.payments import voucher


def pay(amount_pence, card_number):
    ...` },
      right: { label: 'Relative (shop/payments/card.py)', lang: 'python', code: py`from ..pricing import format_money
from . import voucher


def pay(amount_pence, card_number):
    ...` },
      points: [
        'Both import exactly the same modules; Python turns the relative form into the absolute one using __package__.',
        'Absolute imports read the same everywhere and work in scripts too — PEP 8\'s default recommendation.',
        'Relative imports are shorter in deep packages and keep working if the top-level package is renamed.',
        'Relative imports only work inside a module imported as part of a package — not in a file run directly with python path/to/file.py.',
        'Pick one style per project (linters like Ruff can enforce it).',
      ],
    },
    alt: 'Side-by-side code. Left: from shop.pricing import format_money and from shop.payments import voucher. Right: from ..pricing import format_money and from . import voucher. Points list the trade-offs between the two styles.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A package is itself a **module object** — the one created from \`__init__.py\`. The only visible difference is that it has a \`__path__\` attribute telling Python where to find its submodules.`,
      py`Importing anything inside a package imports **every parent first**: \`import shop.payments.card\` runs \`shop/__init__.py\`, then \`shop/payments/__init__.py\`, then \`card.py\` — each only once.`,
      py`That's why a slow or crashing \`__init__.py\` hurts: it runs whenever *anything* in the package is used. Keep \`__init__.py\` files short — re-exports and constants, no real work.`,
    ],
    technical: [
      py`**Submodule search.** For \`shop.cart\`, the path-based finder searches \`shop.__path__\` instead of \`sys.path\`. For a regular package that's \`[".../shop"]\`. For a namespace package it's a dynamic list of every \`shop/\` folder found on \`sys.path\` without an \`__init__.py\`.`,
      py`**Relative-import resolution.** \`from ..pricing import x\` in a module whose \`__package__\` is \`"shop.payments"\` becomes \`from shop.pricing import x\`: strip one trailing component per extra dot, then append the name. \`importlib.util.resolve_name("..pricing", "shop.payments")\` does exactly this and returns \`'shop.pricing'\`.`,
      { code: py`import importlib.util

print(importlib.util.resolve_name(".cart", "shop"))               # shop.cart
print(importlib.util.resolve_name("..pricing", "shop.payments"))  # shop.pricing`, lang: 'python', title: 'resolving relative names' },
      py`When you run a file directly, it is \`__main__\` with \`__package__\` set to \`None\` (or \`""\`), so there's no package to be relative to — hence *"attempted relative import with no known parent package"*. \`python -m shop.cart\` imports the parents first and sets \`__package__ = "shop"\`, so relative imports work.`,
      py`**Circular imports.** Python puts a module in \`sys.modules\` **before** running its code. If \`orders.py\` imports \`customers.py\` and \`customers.py\` imports \`orders.py\` back, the second import finds the *half-finished* \`orders\` module in the cache. \`import billing.orders\` / \`from billing import orders\` then succeeds (you just get the incomplete module object, which will be complete by the time you call into it), but \`from billing.orders import Order\` fails if \`Order\` hasn't been defined yet:`,
      { code: py`ImportError: cannot import name 'Order' from partially initialized module
'billing.orders' (most likely due to a circular import) (/home/ada/shop/billing/orders.py)`, lang: 'text' },
      py`**The fixes, best first:** (1) **restructure** — move what both modules need into a third module, or merge them if they really are one thing; (2) **import the module, not the name** (\`from billing import orders\`, then use \`orders.Order\` inside functions) so nothing is looked up until call time; (3) **import inside the function** that needs it; (4) for imports needed only by type hints, guard them with \`if typing.TYPE_CHECKING:\` — they're seen by type checkers but never run.`,
    ],
    production: [
      py`**Design the public API in \`__init__.py\`.** Re-export the handful of names users need, list them in \`__all__\`, and treat everything else (especially \`_underscore\` modules) as internal. Then you can refactor internals without breaking users. Libraries like \`requests\` expose \`requests.get\` exactly this way.`,
      py`**Keep \`__init__.py\` cheap.** Importing \`shop.pricing\` must not drag in a heavy \`shop.reports\` module that pulls in a charting library. If you want \`shop.reports\` reachable as an attribute without paying for it up front, a module-level \`__getattr__\` (PEP 562, Python 3.7+) can import it on first access.`,
      { code: py`# shop/__init__.py — lazy access to a heavy subpackage (PEP 562)
import importlib

from .cart import Cart

__all__ = ["Cart", "reports"]


def __getattr__(name):            # called only when normal lookup fails
    if name == "reports":
        return importlib.import_module(".reports", __name__)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")`, lang: 'python', title: 'lazy subpackage' },
      py`**Circular imports are a design smell.** They usually mean two modules are too tangled — often a "models know about services and services know about models" situation. Draw the dependency arrows: they should point one way (\`views → services → models\`). Tools like \`import-linter\` (third-party) can enforce layers in CI.`,
      py`**Use the \`src/\` layout** for anything you distribute, so tests import the *installed* package rather than the folder that happens to be in the current directory — see [project structure](lesson:project-structure).`,
    ],
  },
  mistakes: [
    {
      title: 'Running a module inside a package as a script',
      wrong: { code: py`# shop/cli.py
from .cart import Cart

# $ python shop/cli.py
# ImportError: attempted relative import with no known parent package`, lang: 'python', static: true },
      right: { code: py`# from the folder that CONTAINS shop/:
# $ python -m shop.cli
from .cart import Cart`, lang: 'python', static: true },
      explanation: py`\`python shop/cli.py\` runs the file as a standalone \`__main__\` script — Python doesn't know it belongs to \`shop\`, so relative imports have nothing to be relative to (and \`shop/\` itself isn't on \`sys.path\`, its *parent* folder is what's needed). \`python -m shop.cli\` imports it as part of the package. See [scripts vs modules](lesson:main-guard-and-scripts).`,
    },
    {
      title: 'Circular imports of names',
      wrong: { code: py`# billing/orders.py
from billing.customers import Customer    # needs customers...

# billing/customers.py
from billing.orders import Order          # ...which needs orders: ImportError`, lang: 'python', static: true },
      right: { code: py`# billing/orders.py
from billing import customers             # import the module, not the name

# billing/customers.py
from billing import orders                # use orders.Order inside methods`, lang: 'python', static: true },
      explanation: py`A from-import of a *name* needs that name to exist **now**, but the other module is only half-run. Importing the *module* defers the lookup until a function actually runs, by which time both modules are complete. Better still, move shared code into a third module so the arrows point one way.`,
    },
    {
      title: 'Forgetting __init__.py (an accidental namespace package)',
      wrong: { code: py`shop/
    cart.py          # no __init__.py: shop becomes a namespace package`, lang: 'text' },
      right: { code: py`shop/
    __init__.py      # explicit regular package (may be empty)
    cart.py`, lang: 'text' },
      explanation: py`Without \`__init__.py\` the import still works, which hides the mistake. But namespace packages can silently merge same-named folders from different places on \`sys.path\`, and some tools (test discovery, type checkers, packaging tools) need extra configuration for them. Add \`__init__.py\` unless you *intend* a namespace package.`,
    },
    {
      title: 'Heavy work in __init__.py',
      wrong: { code: py`# shop/__init__.py
from .reports import build_yearly_report   # pulls in a big charting library
DATA = build_yearly_report()               # runs on every import of anything in shop`, lang: 'python', static: true },
      right: { code: py`# shop/__init__.py
from .cart import Cart

__all__ = ["Cart"]`, lang: 'python', static: true },
      explanation: py`\`__init__.py\` runs before *any* submodule can be used, so \`from shop.pricing import with_vat\` would build a yearly report first. Keep it to light re-exports; let callers import heavy modules explicitly or load them lazily.`,
    },
    {
      title: 'Too many dots',
      wrong: { code: py`# shop/payments/card.py
from ...pricing import format_money   # climbs above shop`, lang: 'python', static: true },
      right: { code: py`# shop/payments/card.py
from ..pricing import format_money    # . = shop.payments, .. = shop`, lang: 'python', static: true },
      explanation: py`Count from the module's package: one dot is \`shop.payments\`, two is \`shop\`, three would be above the top-level package: \`ImportError: attempted relative import beyond top-level package\`.`,
    },
  ],
  debugging: [
    {
      symptom: py`ImportError: attempted relative import with no known parent package`,
      cause: py`The file containing \`from . import …\` was run directly (\`python shop/cli.py\`, or the IDE's "Run file" button), so it's \`__main__\` with no package.`,
      fix: py`From the folder containing \`shop/\`, run \`python -m shop.cli\`. Or keep scripts outside the package and have them use absolute imports.`,
    },
    {
      symptom: py`ImportError: cannot import name 'Order' from partially initialized module 'billing.orders' (most likely due to a circular import)`,
      cause: py`Two modules import names from each other at the top level. The second import sees the first module half-built.`,
      fix: py`Read the traceback bottom-up to find the cycle. Move shared code into a third module, or import the module (\`from billing import orders\`) and use \`orders.Order\` inside functions. Type-hint-only imports go under \`if TYPE_CHECKING:\`.`,
    },
    {
      symptom: py`ModuleNotFoundError: No module named 'shop'`,
      cause: py`The folder that **contains** \`shop/\` isn't on \`sys.path\` — e.g. you ran a script from inside \`shop/\` or from a \`tests/\` folder.`,
      fix: py`Run from the project root with \`python -m\`, or install the project in editable mode (\`python -m pip install -e .\`) so \`shop\` is importable from anywhere.`,
    },
    {
      symptom: py`AttributeError: module 'shop' has no attribute 'fromat_money'`,
      cause: py`During \`from shop import *\`, every name in \`__all__\` is looked up — and one of them is misspelled or not imported in \`__init__.py\`.`,
      fix: py`Fix the spelling in \`__all__\` and make sure each listed name is actually defined or imported in \`__init__.py\`. Linters (Ruff rule F822) catch undefined names in \`__all__\`.`,
    },
    {
      symptom: py`AttributeError: module 'shop' has no attribute 'reports'`,
      cause: py`Submodules aren't attributes of their package until something imports them. \`import shop\` alone doesn't load \`shop/reports.py\`.`,
      fix: py`Import the submodule explicitly: \`import shop.reports\` or \`from shop import reports\` (or have \`__init__.py\` import it).`,
    },
  ],
  bestPractices: [
    'Give every regular package an __init__.py, and keep it short: re-exports, __all__, __version__ — no heavy work.',
    'Re-export the public API in __init__.py so users write from shop import Cart, and list it in __all__.',
    'Prefix internal modules and names with an underscore (_parsing.py, _cache).',
    'Default to absolute imports; explicit relative imports are fine inside a package — pick one style and let a linter enforce it.',
    'Run modules inside packages with python -m package.module from the project root, never python package/module.py.',
    'Keep dependencies between modules pointing one way; fix circular imports by restructuring, not by clever import tricks.',
    'Use if TYPE_CHECKING: for imports needed only in type hints.',
  ],
  useCases: [
    'Grouping a growing application into layers: shop.models, shop.services, shop.web.',
    'Publishing a library with a small, stable public API in __init__.py.',
    'Plugin systems: one subpackage per plugin, discovered by name.',
    'Splitting a large module into a package without breaking imports (re-export from __init__.py).',
  ],
  whenToUse: {
    use: [
      'You have more than a few related modules, or two modules want the same short name (utils, models).',
      'You will distribute or install the code (pip install) — the importable unit is a package.',
      'You want a stable public API while keeping freedom to reorganise internals.',
    ],
    avoid: [
      'A single small script — a package adds structure you don\'t need yet.',
      'Deep nesting for its own sake (company.product.core.utils.helpers.strings) — flat is better than nested.',
      'Namespace packages for ordinary projects — use them only to split one namespace across separately installed distributions.',
    ],
  },
  comparison: {
    title: 'Regular vs namespace packages',
    headers: ['', 'Regular package', 'Namespace package (PEP 420)'],
    rows: [
      ['marker', 'folder with __init__.py', 'folder without __init__.py'],
      ['code that runs on import', '__init__.py', 'none'],
      ['__path__', 'one folder', 'every same-named folder on sys.path, merged'],
      ['can re-export an API / define __all__', 'yes', 'no (no __init__.py to put it in)'],
      ['typical use', 'almost everything', 'one namespace split across separately installed distributions'],
    ],
    note: py`If in doubt, add \`__init__.py\`. An accidental namespace package works until a tool or a same-named folder elsewhere surprises you.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'packages-q1',
      type: 'mcq',
      prompt: py`What does a package's \`__init__.py\` do?`,
      options: [
        'Marks the folder as a regular package and runs the first time the package is imported',
        { text: 'It is the constructor called each time you create an object from the package', why: 'Packages are not classes. __init__.py is a module file; it runs once, on first import, like any other module.' },
        { text: 'It runs every time any module inside the package is imported', why: 'It runs once per process: afterwards the package module is cached in sys.modules.' },
        { text: 'It is required, otherwise the folder cannot be imported at all', why: 'Since Python 3.3, a folder without __init__.py can still be imported as a namespace package (PEP 420).' },
      ],
      answer: 0,
      explanation: py`\`__init__.py\` turns the folder into a regular package; its code runs once on first import of the package (or anything in it), and it's the natural place to re-export the public API.`,
    },
    {
      id: 'packages-q2',
      type: 'output',
      prompt: py`\`shop/__init__.py\` is empty and \`shop/cart.py\` contains \`TAX = 0.2\`. What does this print?`,
      code: py`import shop.cart

print(shop.cart.TAX, "cart" in dir())`,
      answer: '0.2 False',
      accept: ['0.2 False'],
      explanation: py`\`import shop.cart\` binds only the **top-level** name \`shop\` in your namespace; \`cart\` is reached as an attribute, \`shop.cart\`. So \`"cart" in dir()\` is \`False\`. Use \`from shop import cart\` if you want the short name.`,
    },
    {
      id: 'packages-q3',
      type: 'bug',
      prompt: py`This module lives at \`shop/payments/card.py\`. Importing it fails with \`ImportError: attempted relative import beyond top-level package\`. Click the faulty line.`,
      code: py`"""Card payments for the shop package."""
from ...pricing import format_money


def pay(amount_pence):
    return f"Charged {format_money(amount_pence)}"`,
      answerLine: 2,
      explanation: py`The module's package is \`shop.payments\`. One dot = \`shop.payments\`, two dots = \`shop\`, three dots would be the parent of \`shop\`, which doesn't exist. It should be \`from ..pricing import format_money\`.`,
    },
    {
      id: 'packages-q4',
      type: 'fill',
      prompt: py`Fill in the relative imports. The first line is in \`shop/cart.py\`; the second is in \`shop/payments/card.py\`. Both import from \`shop/pricing.py\`.`,
      code: py`from ___pricing import with_vat         # in shop/cart.py
from ___pricing import format_money     # in shop/payments/card.py`,
      answer: [['.'], ['..']],
      explanation: py`In \`shop/cart.py\` (package \`shop\`) the sibling is \`.pricing\`. In \`shop/payments/card.py\` (package \`shop.payments\`) you need to climb one level: \`..pricing\`.`,
    },
    {
      id: 'packages-q5',
      type: 'mcq',
      prompt: py`\`python shop/cli.py\` fails with *attempted relative import with no known parent package*. What is the best fix?`,
      options: [
        { text: 'Replace every relative import in the package with sys.path.append() calls', why: 'sys.path hacks depend on the working directory and hide the real problem: the file is not being run as part of its package.' },
        'From the folder containing shop/, run python -m shop.cli',
        { text: 'Delete shop/__init__.py', why: 'That makes shop a namespace package but the file still runs as a standalone script with no parent package.' },
        { text: 'Add __package__ = "shop" at the top of cli.py', why: 'A brittle hack that relies on import internals; python -m sets up the package context properly.' },
      ],
      answer: 1,
      explanation: py`\`python -m shop.cli\` imports \`shop\` first and runs \`cli\` as \`__main__\` with \`__package__ = "shop"\`, so relative imports resolve. See [scripts vs modules](lesson:main-guard-and-scripts).`,
    },
    {
      id: 'packages-q6',
      type: 'mcq',
      prompt: py`\`orders.py\` does \`from billing.customers import Customer\` and \`customers.py\` does \`from billing.orders import Order\`. Which change fixes the circular import **regardless of which module is imported first**?`,
      options: [
        { text: 'Swap the order of the two files in the folder', why: 'File order on disk is irrelevant; the cycle is in the import statements.' },
        { text: 'Change only orders.py to from billing import customers', why: 'That works if customers is imported first, but importing orders first still hits from billing.orders import Order on a half-built module.' },
        'Move whatever both modules need into a third module (or make both import modules, not names, and look names up at call time)',
        { text: 'Wrap both imports in try/except ImportError: pass', why: 'That hides the error and leaves Customer or Order undefined — you get NameError later instead.' },
      ],
      answer: 2,
      explanation: py`Breaking the cycle structurally (a third module both depend on) is the cleanest fix. Importing *modules* on both sides also works, because names are only looked up when functions run, after both modules have finished loading.`,
    },
    {
      id: 'packages-q7',
      type: 'short',
      prompt: py`Explain the difference between \`__all__\` and a leading underscore as ways of marking names "internal". Does either one make a name truly private?`,
      answer: py`\`__all__\` lists the public names explicitly: it controls what from package import * binds and documents the API. A leading underscore marks a single name or module as internal by convention, and star-imports skip it when there's no __all__. Neither enforces anything: from shop import _cache or from shop import with_vat still work. Python relies on convention, not access control.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'textstats-package',
      title: 'Give a package a public API',
      difficulty: 'intermediate',
      prompt: py`The \`textstats\` package has two modules. Finish it:

1. In **textstats/counting.py**, import \`words\` from the sibling module \`cleaning\` with a **relative** import (\`from .cleaning import words\`).
2. In **textstats/__init__.py**, re-export \`word_count\` and \`top_words\` from \`counting\` (relative import) and set \`__all__ = ["word_count", "top_words"]\`.

Then \`main.py\` (no changes needed) prints:

\`\`\`text
words: 9
top 2: [('the', 2), ('cat', 2)]
\`\`\``,
      files: {
        'main.py': TEXTSTATS_MAIN,
        'textstats/__init__.py': py`"""textstats: tiny text statistics."""
# TODO: re-export word_count and top_words, and define __all__
`,
        'textstats/cleaning.py': TEXTSTATS_CLEANING,
        'textstats/counting.py': py`"""Counting words."""
from collections import Counter

# TODO: import words() from the sibling module cleaning (relative import)


def word_count(text):
    return len(words(text))


def top_words(text, n=3):
    return Counter(words(text)).most_common(n)
`,
      },
      hints: [
        'Both changes are import lines. Inside a package, one dot means "this package": .cleaning is textstats.cleaning.',
        'counting.py needs from .cleaning import words. __init__.py needs from .counting import top_words, word_count.',
        'textstats/__init__.py:\nfrom .counting import top_words, word_count\n\n__all__ = ["word_count", "top_words"]',
      ],
      solution: {
        explanation: py`\`counting.py\` uses a relative import to reach its sibling — it keeps working even if the package is renamed. \`__init__.py\` is the package's front door: re-exporting the two functions lets users write \`textstats.word_count(...)\` or \`from textstats import word_count\` without knowing about \`counting.py\`, and \`__all__\` documents exactly which names are public (and what a star-import would bind). \`words\` stays an internal detail. Counter.most_common keeps ties in first-seen order, so "the" comes before "cat".`,
        files: {
          'main.py': TEXTSTATS_MAIN,
          'textstats/__init__.py': py`"""textstats: tiny text statistics."""
from .counting import top_words, word_count

__all__ = ["word_count", "top_words"]
`,
          'textstats/cleaning.py': TEXTSTATS_CLEANING,
          'textstats/counting.py': py`"""Counting words."""
from collections import Counter

from .cleaning import words


def word_count(text):
    return len(words(text))


def top_words(text, n=3):
    return Counter(words(text)).most_common(n)
`,
        },
      },
      tests: [
        { name: 'counting.py uses a relative import', code: py`assert 'from .cleaning import' in files['textstats/counting.py']` },
        { name: 'textstats.word_count works', code: py`assert module('textstats').word_count("The cat sat. The cat ran! A dog sat.") == 9` },
        { name: 'textstats.top_words works', code: py`assert module('textstats').top_words("b a b", 1) == [('b', 2)]` },
        { name: '__all__ lists exactly the two functions', code: py`assert sorted(module('textstats').__all__) == ['top_words', 'word_count']` },
        { name: 'main prints the stats', code: py`assert "words: 9" in output and "top 2: [('the', 2), ('cat', 2)]" in output` },
      ],
    },
    {
      id: 'break-the-cycle',
      title: 'Break a circular import',
      difficulty: 'intermediate',
      prompt: py`Run the project: it crashes with \`ImportError: cannot import name 'Customer' from partially initialized module 'billing.customers'\`. \`customers.py\` needs \`Order\` (to place orders) and \`orders.py\` needs \`Customer\` (to validate the owner) — a cycle.

Fix the imports in **billing/customers.py** and **billing/orders.py** so that:

- \`main.py\` prints \`Ada owes £42.00\`;
- **either** module can be imported first (\`import billing.orders\` on its own must work too);
- the behaviour stays the same: \`Customer("Ada").place_order(4200)\` returns an \`Order\`, and \`Order("not a customer", 1)\` raises \`TypeError\`.`,
      files: {
        'main.py': BILLING_MAIN,
        'billing/__init__.py': BILLING_INIT,
        'billing/customers.py': py`"""Customers can place orders."""
from billing.orders import Order


class Customer:
    def __init__(self, name):
        self.name = name

    def place_order(self, pence):
        return Order(self, pence)
`,
        'billing/orders.py': py`"""Every order belongs to a customer."""
from billing.customers import Customer


class Order:
    def __init__(self, customer, pence):
        if not isinstance(customer, Customer):
            raise TypeError("an order needs a Customer")
        self.customer = customer
        self.pence = pence

    def summary(self):
        return f"{self.customer.name} owes £{self.pence / 100:.2f}"
`,
      },
      hints: [
        'The problem is from-importing a *name* from a module that is only half-run. Neither class is needed until a method is actually called.',
        'Import the module instead of the name: from billing import orders, then refer to orders.Order inside the method (and the same idea in the other file).',
        'customers.py: from billing import orders … return orders.Order(self, pence). orders.py: from billing import customers … isinstance(customer, customers.Customer).',
      ],
      solution: {
        explanation: py`\`from billing.orders import Order\` needs \`Order\` to exist **at import time**, but during a cycle the other module is cached in \`sys.modules\` half-built. \`from billing import orders\` only needs the *module object*, which already exists in the cache (Python 3.7+ finds a half-imported submodule there), and \`orders.Order\` is looked up later, when \`place_order\` runs — by then both modules have finished loading. Fixing **both** sides makes the import order irrelevant; fixing one side only works if the other module happens to be imported first. In a bigger codebase, also consider whether the dependency should exist at all: e.g. an \`Order\` could simply accept any object with a \`name\` (duck typing), removing one arrow of the cycle.`,
        files: {
          'main.py': BILLING_MAIN,
          'billing/__init__.py': BILLING_INIT,
          'billing/customers.py': py`"""Customers can place orders."""
from billing import orders


class Customer:
    def __init__(self, name):
        self.name = name

    def place_order(self, pence):
        return orders.Order(self, pence)
`,
          'billing/orders.py': py`"""Every order belongs to a customer."""
from billing import customers


class Order:
    def __init__(self, customer, pence):
        if not isinstance(customer, customers.Customer):
            raise TypeError("an order needs a Customer")
        self.customer = customer
        self.pence = pence

    def summary(self):
        return f"{self.customer.name} owes £{self.pence / 100:.2f}"
`,
        },
      },
      tests: [
        { name: 'main prints "Ada owes £42.00"', code: py`assert output.strip() == "Ada owes £42.00"` },
        { name: 'place_order returns an Order for that customer', code: py`c = module('billing.customers').Customer("Bo")
o = c.place_order(100)
assert type(o).__name__ == "Order" and o.customer is c and o.pence == 100` },
        { name: 'Order still rejects non-customers', code: py`with raises(TypeError):
    module('billing.orders').Order("not a customer", 1)` },
        { name: 'billing.orders can be imported first', code: py`import sys, importlib
for name in [n for n in sys.modules if n == "billing" or n.startswith("billing.")]:
    del sys.modules[name]
orders = importlib.import_module("billing.orders")
customers = importlib.import_module("billing.customers")
assert orders.Order(customers.Customer("Cy"), 5).summary() == "Cy owes £0.05"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'packages-what-is-package',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a Python package, and is `__init__.py` required?',
      answer: 'A package is a module that can contain other modules — on disk, usually a folder of .py files. A folder with __init__.py is a regular package; __init__.py runs on first import and can define the package API. Since Python 3.3 a folder without it can be imported as a namespace package (PEP 420), but for normal projects you should include it.',
      explanation: py`A package is itself a module object with a \`__path__\` attribute listing where its submodules live. Regular packages have one folder and an \`__init__.py\`; namespace packages have no \`__init__.py\` and may merge several folders from different \`sys.path\` entries.`,
      whyAsked: 'A basic structural question — interviewers check you know what __init__.py does beyond "it must be there".',
      mistakes: ['Saying __init__.py is always required (outdated since 3.3)', 'Saying __init__.py runs every time a submodule is imported', 'Confusing packages with classes'],
      followUps: ['What would you put in __init__.py?', 'When would you deliberately use a namespace package?'],
      modelAnswer: 'A package is a module that contains other modules — in practice a folder of Python files that you import with dotted names like shop.cart. If the folder has an __init__.py it is a regular package: that file runs once, the first time the package is imported, and it is where I re-export the public API and define __all__ or __version__. Since Python 3.3 a folder without __init__.py can still be imported as a namespace package, which can even span several folders on sys.path. That is useful for splitting one namespace across separately installed distributions, but for normal projects I always add __init__.py to be explicit.',
    },
    {
      id: 'packages-absolute-vs-relative',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare absolute and relative imports. Which would you use, and when do relative imports fail?',
      answer: 'Absolute imports spell the full path (from shop.pricing import x) and work anywhere; relative imports (from ..pricing import x) are resolved from the current module\'s __package__ and only work in modules imported as part of a package. PEP 8 prefers absolute imports; explicit relative imports are acceptable within a package. They fail when the file is run directly as a script.',
      explanation: py`Relative imports are syntactic sugar: Python rewrites them using \`__package__\` (\`importlib.util.resolve_name\`). A script run as \`python shop/cli.py\` is \`__main__\` with no package, so it raises *attempted relative import with no known parent package*; \`python -m shop.cli\` works.`,
      whyAsked: 'This trips up many developers in real projects; the answer shows whether you understand how the import system knows "where" a module is.',
      mistakes: ['Thinking import pricing is an implicit relative import (that was Python 2)', 'Fixing relative-import errors with sys.path hacks', 'Not knowing python -m'],
      followUps: ['What does python -m change?', 'How would you enforce one style across a team?'],
      modelAnswer: 'An absolute import names the full dotted path from the top-level package, like from shop.pricing import format_money; it reads the same in any file and works in scripts too. A relative import like from ..pricing import format_money is resolved from the current module\'s __package__ — one dot is my own package and each extra dot climbs a level. Its advantage is brevity and surviving a rename of the top-level package. The catch is that it only works when the module was imported as part of the package, so running the file directly gives "no known parent package"; the fix is python -m shop.cli. I default to absolute imports, as PEP 8 suggests, and let a linter enforce the choice.',
    },
    {
      id: 'packages-import-order-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Each file prints its own name when it runs. What does `main.py` print?',
      code: { lang: 'python', code: py`# shop/__init__.py        print("shop")
# shop/payments/__init__.py print("payments")
# shop/payments/card.py   print("card")

# main.py
import shop.payments.card
import shop
from shop.payments import card
print("done")` },
      options: ['card, shop, payments, done', 'shop, payments, card, done', 'shop, payments, card, shop, card, done', 'card, done'],
      correctOption: 1,
      answer: 'shop, payments, card, done. Importing a submodule imports each parent first, top-down, and every module runs only once; the later imports are cache hits.',
      explanation: py`\`import shop.payments.card\` imports \`shop\` (runs its \`__init__.py\`), then \`shop.payments\` (its \`__init__.py\`), then \`card\`. The next two imports find everything in \`sys.modules\` and run nothing.`,
      whyAsked: 'Tests understanding of parent-first loading and the module cache, which explains import side effects and circular-import behaviour.',
      mistakes: ['Assuming only the leaf module runs', 'Assuming repeated imports re-run code'],
      followUps: ['Why does that make heavy __init__.py files a problem?', 'What would change with a namespace package?'],
      modelAnswer: 'It prints shop, payments, card and then done. To import shop.payments.card Python must import every parent first, top-down, so the two __init__.py files run before card.py. Each module is cached in sys.modules under its full dotted name, so the following import shop and from shop.payments import card are cache hits and print nothing. This is also why a slow __init__.py hurts — it runs before anything inside the package can be used.',
    },
    {
      id: 'packages-circular-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'You see `ImportError: cannot import name \'Order\' from partially initialized module \'billing.orders\' (most likely due to a circular import)`. Explain what happened and how you would fix it.',
      answer: 'Two modules import names from each other at top level. Python caches a module before running it, so the second import finds billing.orders half-built, without Order defined yet. Fix by restructuring (move shared code to a third module), importing modules instead of names and looking them up at call time, importing inside the function, or using TYPE_CHECKING for type-hint-only imports.',
      explanation: py`The traceback shows the loop: main → customers → orders → customers. The structural fix removes one arrow; the "import the module" fix works because \`from billing import orders\` only needs the module object (already in \`sys.modules\`), and \`orders.Order\` is read later.`,
      code: { lang: 'python', code: py`# a type-hint-only import never runs at runtime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from billing.orders import Order


def total(order: "Order") -> int:
    return order.pence` },
      whyAsked: 'Circular imports are a common pain point in growing codebases; good answers show both the mechanism and design-level fixes.',
      mistakes: ['Wrapping the import in try/except', 'Only ever moving imports into functions without asking why the cycle exists', 'Not knowing why the module is "partially initialized"'],
      followUps: ['Why does from billing import orders work when from billing.orders import Order fails?', 'How can you prevent cycles in a large codebase?'],
      modelAnswer: 'Python adds a module to sys.modules before executing it. Here orders and customers import names from each other at the top, so when the second one asks for Order, it gets the half-run orders module where Order has not been defined yet. I would read the traceback to see the cycle, then prefer a structural fix — move what both need into a third module, or question whether one of the dependencies is needed. Tactical fixes are importing the module rather than the name and looking it up at call time, a local import inside the function, or putting type-hint-only imports under TYPE_CHECKING. Long-term, I keep dependencies flowing one way and can enforce layers with a tool like import-linter.',
    },
    {
      id: 'packages-public-api-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You maintain an internal library used by many teams. How do you design its package so you can refactor internals without breaking users?',
      answer: 'Expose a small public API from the top-level __init__.py (re-exports listed in __all__), keep implementation in underscore-prefixed modules, document that only the public names are supported, keep __init__.py light (lazy-load heavy parts via module __getattr__), and deprecate moved names with warnings before removing them.',
      explanation: py`Users import from the stable surface (\`from payments import charge\`), never from \`payments._stripe_client\`. When you move \`charge\` to another internal module, only \`__init__.py\` changes. For renamed public names, keep the old name working for a while and emit a \`DeprecationWarning\` (a module-level \`__getattr__\` can do this). Version the package semantically so breaking changes are signalled — see [packaging](lesson:packaging).`,
      code: { lang: 'python', code: py`# payments/__init__.py
import warnings

from ._charging import charge, refund

__all__ = ["charge", "refund"]


def __getattr__(name):   # PEP 562, Python 3.7+
    if name == "make_charge":   # old public name, kept for compatibility
        warnings.warn("make_charge is deprecated; use charge", DeprecationWarning, stacklevel=2)
        return charge
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")` },
      whyAsked: 'Senior roles own shared code; this probes API design, backwards compatibility and knowledge of Python\'s conventions for privacy.',
      mistakes: ['Expecting users to import from deep internal modules', 'Doing heavy work in __init__.py', 'Removing names without a deprecation period'],
      followUps: ['How would you detect users importing private modules?', 'How does semantic versioning fit in?'],
      modelAnswer: 'I would make the top-level __init__.py the contract: it re-exports the handful of supported names and lists them in __all__, while the implementation lives in underscore-prefixed modules that users should not import. That way moving code internally only means updating the re-export. I keep __init__.py cheap, and if a heavy subpackage needs to be reachable I lazy-load it with a module-level __getattr__. When a public name must change, I keep the old one working for a release or two with a DeprecationWarning and signal breaking changes with semantic versioning. Python does not enforce privacy, so the underscore convention, documentation and linters do that job.',
    },
    {
      id: 'packages-resolve-relative',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 7,
      question: 'Write `resolve(relative, package)` that converts a relative module name to an absolute one, like the import system does: `resolve("..pricing", "shop.payments")` → `"shop.pricing"`, `resolve(".", "shop")` → `"shop"`. Raise `ImportError("attempted relative import beyond top-level package")` when there are too many dots. Don\'t use `importlib.util.resolve_name`.',
      answer: 'Count the leading dots (level), take the rest as the name, drop level - 1 trailing components from the package with rsplit(".", level - 1), raise ImportError if there are not enough components, then join base and name.',
      explanation: py`One dot means the package itself, so \`level - 1\` components are removed. \`package.rsplit(".", level - 1)\` splits off exactly that many from the right; if fewer parts come back than \`level\`, we've climbed above the top. This mirrors CPython's \`importlib._bootstrap._resolve_name\`.`,
      starter: { files: { 'main.py': py`def resolve(relative, package):
    """Turn a relative module name ('..pricing') into an absolute one."""
    # TODO: count the dots, climb the package, append the rest
    return relative


print(resolve("..pricing", "shop.payments"))
print(resolve(".cart", "shop"))
` } },
      tests: [
        { name: 'sibling: .cart in shop', code: py`assert resolve(".cart", "shop") == "shop.cart"` },
        { name: 'parent: ..pricing in shop.payments', code: py`assert resolve("..pricing", "shop.payments") == "shop.pricing"` },
        { name: 'bare dots name a package', code: py`assert resolve(".", "shop.payments") == "shop.payments"
assert resolve("..", "shop.payments") == "shop"` },
        { name: 'matches importlib for deeper cases', code: py`import importlib.util
for rel, pkg in [("...x.y", "a.b.c.d"), (".m", "a.b"), ("..", "a.b.c")]:
    assert resolve(rel, pkg) == importlib.util.resolve_name(rel, pkg), (rel, pkg)` },
        { name: 'too many dots raises ImportError', code: py`with raises(ImportError, match="beyond top-level package"):
    resolve("...pricing", "shop.payments")` },
        { name: 'does not call importlib.util.resolve_name', code: py`assert 'resolve_name' not in files['main.py']` },
      ],
      solution: { files: { 'main.py': py`def resolve(relative, package):
    """Turn a relative module name ('..pricing') into an absolute one."""
    name = relative.lstrip(".")
    level = len(relative) - len(name)
    parts = package.rsplit(".", level - 1)
    if len(parts) < level:
        raise ImportError("attempted relative import beyond top-level package")
    base = parts[0]
    return f"{base}.{name}" if name else base


print(resolve("..pricing", "shop.payments"))
print(resolve(".cart", "shop"))
` } },
      hints: ['relative.lstrip(".") gives the name; the difference in length is the number of dots.', 'One dot = the package itself, so you remove level - 1 components from the right: package.rsplit(".", level - 1).', 'If rsplit returned fewer than level parts, there were not enough components to climb: raise ImportError.'],
      whyAsked: 'A compact string-manipulation task that proves you truly understand relative-import semantics (and the off-by-one of "one dot is the current package").',
      mistakes: ['Treating one dot as "the parent"', 'Splitting on every dot and slicing with an off-by-one', 'Forgetting the bare-dots case (from . import x)'],
      followUps: ['Where does the package argument come from at runtime?', 'Why can\'t a script run as __main__ use relative imports?'],
      modelAnswer: 'I strip the leading dots to get the name and count them to get the level. One dot means the current package, so I need to drop level minus one components from the right of the package name, which rsplit with a maxsplit of level minus one does neatly. If rsplit returns fewer parts than the level, there were not enough components to climb, so I raise ImportError just like Python does. Then I return base plus dot plus name, or just base when the name is empty, as in from . import x. At runtime the package argument is the module\'s __package__.',
    },
  ],

  takeaways: [
    'A package is a module that contains modules — usually a folder with __init__.py; submodules have dotted names like shop.payments.card.',
    'Importing a submodule imports every parent first (running each __init__.py once); import a.b binds only the name a.',
    '__init__.py marks a regular package, runs on first import, and is where you re-export the public API and set __all__.',
    'Relative imports (from . / from ..) are resolved from __package__ and only work in modules imported as part of a package — use python -m to run them.',
    'Prefer absolute imports by default; never fix import errors with sys.path hacks.',
    'Circular imports happen because modules are cached before they finish running; fix them by restructuring or importing modules instead of names.',
    'Folders without __init__.py become namespace packages (PEP 420) — use them only on purpose.',
  ],
}

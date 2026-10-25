// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const INVENTORY = py`"""inventory.py - stock levels saved in a JSON file."""
import json
import os
from pathlib import Path


def data_dir():
    """Where the shop keeps its files (override with the SHOP_DATA_DIR variable)."""
    return Path(os.environ.get("SHOP_DATA_DIR", "shop-data"))


class Inventory:
    def __init__(self, path):
        self.path = Path(path)
        self.stock = json.loads(self.path.read_text()) if self.path.exists() else {}

    def add(self, name, quantity):
        if quantity <= 0:
            raise ValueError(f"quantity must be positive, got {quantity}")
        self.stock[name] = self.stock.get(name, 0) + quantity

    def remove(self, name, quantity):
        if self.stock.get(name, 0) < quantity:
            raise ValueError(f"only {self.stock.get(name, 0)} {name} left")
        self.stock[name] -= quantity

    def save(self):
        self.path.write_text(json.dumps(self.stock, indent=2))

    def report(self):
        for name, quantity in sorted(self.stock.items()):
            print(f"{name}: {quantity}")
`

const TESTS = py`"""Fixture ideas with only the standard library: setUp, addCleanup, temp folders."""
import contextlib
import io
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from inventory import Inventory, data_dir

EVENTS = []   # records the order of setup and teardown steps


class TestInventory(unittest.TestCase):
    @classmethod
    def setUpClass(cls):                         # ~ scope="class": runs once
        EVENTS.append("setUpClass")
        cls.sample = {"apple": 10, "pear": 4}

    def setUp(self):                             # ~ a function-scoped fixture
        EVENTS.append("setUp")
        folder = tempfile.TemporaryDirectory()   # ~ tmp_path: a fresh folder per test
        self.addCleanup(folder.cleanup)          # ~ the code after yield
        self.addCleanup(EVENTS.append, "cleanup")
        self.tmp_path = Path(folder.name)
        self.inventory = Inventory(self.tmp_path / "stock.json")
        for name, quantity in self.sample.items():
            self.inventory.add(name, quantity)

    def tearDown(self):
        EVENTS.append("tearDown")

    def test_remove_reduces_stock(self):
        self.inventory.remove("apple", 3)
        self.assertEqual(self.inventory.stock["apple"], 7)

    def test_save_then_reload(self):
        self.inventory.save()
        reloaded = Inventory(self.tmp_path / "stock.json")
        self.assertEqual(reloaded.stock, {"apple": 10, "pear": 4})

    def test_data_dir_comes_from_the_environment(self):
        with mock.patch.dict(os.environ, {"SHOP_DATA_DIR": "/srv/shop"}):   # ~ monkeypatch.setenv
            self.assertEqual(data_dir(), Path("/srv/shop"))

    def test_report_prints_sorted_lines(self):
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):     # ~ capsys
            self.inventory.report()
        self.assertEqual(buffer.getvalue(), "apple: 10\npear: 4\n")


if __name__ == "__main__":
    program = unittest.main(argv=["fixtures-demo"], exit=False, verbosity=2)
    result = program.result
    print(" -> ".join(EVENTS))
`

const ENGINE = py`"""How pytest fixtures work: a SIMPLIFIED engine.

Real pytest adds conftest.py lookup, module/class/package scopes, params,
autouse, per-test caching for shared function fixtures, and error reporting.
"""
import inspect

FIXTURES = {}


def fixture(scope="function"):
    def register(function):
        FIXTURES[function.__name__] = (function, scope)
        return function
    return register


@fixture(scope="session")
def catalogue():
    print("  [setup] load the catalogue (once per session)")
    yield {"apple": 0.50, "pear": 0.75}
    print("  [teardown] close the catalogue")


@fixture()
def cart(catalogue):                     # a fixture can request another fixture
    print("  [setup] new empty cart")
    items = []
    yield items
    print("  [teardown] cart had", items)


def test_add_apple(cart, catalogue):
    cart.append("apple")
    assert catalogue[cart[0]] == 0.50


def test_cart_starts_empty(cart):
    assert cart == []


class Session:
    def __init__(self):
        self.cache = {}                                  # session values live here
        self.finalizers = {"session": [], "function": []}

    def get(self, name):
        function, scope = FIXTURES[name]
        if scope == "session" and name in self.cache:
            return self.cache[name]
        kwargs = {arg: self.get(arg) for arg in inspect.signature(function).parameters}
        generator = function(**kwargs)
        value = next(generator)                          # setup: run up to the yield
        self.finalizers[scope].append(generator)
        if scope == "session":
            self.cache[name] = value
        return value

    def finish(self, scope):
        for generator in reversed(self.finalizers[scope]):
            next(generator, None)                        # teardown: resume after the yield
        self.finalizers[scope].clear()


session = Session()
for test in [test_add_apple, test_cart_starts_empty]:
    print(test.__name__)
    kwargs = {name: session.get(name) for name in inspect.signature(test).parameters}
    try:
        test(**kwargs)
        print("  PASSED")
    except AssertionError:
        print("  FAILED")
    session.finish("function")
session.finish("session")
`

const LEAKY_HEAD = py`import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


def save_order(order_id, items, folder="."):
    path = Path(folder) / f"order-{order_id}.txt"
    path.write_text("\n".join(items))
    return path


def currency():
    return os.environ.get("SHOP_CURRENCY", "EUR")

`

const LEAKY_STARTER = LEAKY_HEAD + py`
class TestOrders(unittest.TestCase):
    basket = []                                       # ONE list shared by every test

    def test_basket_gets_an_item(self):
        self.basket.append("apple")
        self.assertEqual(self.basket, ["apple"])

    def test_basket_starts_empty(self):
        self.assertEqual(self.basket, [])

    def test_save_order_writes_a_file(self):
        path = save_order(1, ["apple", "pear"])       # writes into the current folder
        self.assertEqual(path.read_text(), "apple\npear")

    def test_currency_can_be_configured(self):
        os.environ["SHOP_CURRENCY"] = "GBP"            # never put back
        self.assertEqual(currency(), "GBP")

    def test_default_currency_is_euro(self):
        self.assertEqual(currency(), "EUR")


if __name__ == "__main__":
    unittest.main(argv=["orders"], exit=False, verbosity=2)
`

const LEAKY_SOLUTION = LEAKY_HEAD + py`
class TestOrders(unittest.TestCase):
    def setUp(self):
        self.basket = []                              # a fresh list for every test
        folder = tempfile.TemporaryDirectory()
        self.addCleanup(folder.cleanup)               # removed even if the test fails
        self.tmp_path = Path(folder.name)

    def test_basket_gets_an_item(self):
        self.basket.append("apple")
        self.assertEqual(self.basket, ["apple"])

    def test_basket_starts_empty(self):
        self.assertEqual(self.basket, [])

    def test_save_order_writes_a_file(self):
        path = save_order(1, ["apple", "pear"], folder=self.tmp_path)
        self.assertEqual(path.read_text(), "apple\npear")

    def test_currency_can_be_configured(self):
        with mock.patch.dict(os.environ, {"SHOP_CURRENCY": "GBP"}):
            self.assertEqual(currency(), "GBP")

    def test_default_currency_is_euro(self):
        with mock.patch.dict(os.environ):             # restores whatever was there
            os.environ.pop("SHOP_CURRENCY", None)
            self.assertEqual(currency(), "EUR")


if __name__ == "__main__":
    unittest.main(argv=["orders"], exit=False, verbosity=2)
`

const LEAKY_CHECK = py`import os
import unittest
from pathlib import Path
names = unittest.defaultTestLoader.getTestCaseNames(TestOrders)
def run_in(order):
    outcome = unittest.TestResult()
    unittest.TestSuite(TestOrders(name) for name in order).run(outcome)
    return outcome
`

const RUNNER_DEMO = py`

def catalogue():
    print("setup catalogue")
    yield {"apple": 0.50}
    print("teardown catalogue")


def cart(catalogue):
    print("setup cart")
    yield []
    print("teardown cart")


def check_apple_price(cart, catalogue):
    cart.append("apple")
    assert catalogue[cart[0]] == 0.50


print(run_with_fixtures(check_apple_price, {"catalogue": catalogue, "cart": cart}))
`

const RUNNER_STARTER = py`import inspect


def run_with_fixtures(test, fixtures):
    """Call test(), injecting fixtures by parameter name. Return "passed" or "failed"."""
    # TODO: set up the fixtures the test asks for (and the ones THEY ask for),
    #       run the test, then tear everything down in reverse order.
    return "failed"
` + RUNNER_DEMO

const RUNNER_SOLUTION = py`import inspect


def run_with_fixtures(test, fixtures):
    """Call test(), injecting fixtures by parameter name. Return "passed" or "failed"."""
    values = {}        # fixture name -> value, so each is set up once per run
    started = []       # generators in setup order, for teardown

    def get(name):
        if name in values:
            return values[name]
        if name not in fixtures:
            raise LookupError(f"fixture {name!r} not found")
        function = fixtures[name]
        kwargs = {arg: get(arg) for arg in inspect.signature(function).parameters}
        generator = function(**kwargs)
        values[name] = next(generator)          # setup: run up to the yield
        started.append(generator)
        return values[name]

    try:
        kwargs = {arg: get(arg) for arg in inspect.signature(test).parameters}
        try:
            test(**kwargs)
            return "passed"
        except Exception:
            return "failed"
    finally:
        for generator in reversed(started):
            next(generator, None)               # teardown: resume after the yield
` + RUNNER_DEMO

const PATCHER_DEMO = py`

import types

shop = types.SimpleNamespace(currency="EUR")
patcher = Patcher()
patcher.setattr(shop, "currency", "GBP")
print("patched:", shop.currency)
patcher.undo()
print("restored:", shop.currency)
`

export default {
  id: 'fixtures',
  title: 'pytest fixtures',
  summary: 'A fixture is a named, reusable piece of test setup and teardown that pytest hands to any test that asks for it by argument name.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['pytest-basics', 'generators'],
  related: ['testing-fundamentals', 'mocking', 'tdd', 'context-managers', 'contextlib', 'pathlib', 'sql-and-sqlite', 'clean-architecture', 'scope', 'logging'],
  tags: ['pytest', 'fixtures', '@pytest.fixture', 'dependency injection', 'scope', 'session', 'module', 'yield fixture', 'teardown', 'conftest.py', 'tmp_path', 'monkeypatch', 'capsys', 'caplog', 'autouse', 'setUp', 'tearDown', 'addCleanup', 'tempfile'],
  apis: [
    { name: '@pytest.fixture(scope="function", autouse=False, params=None)', summary: 'Turns a function into a fixture; tests receive its return/yield value by naming it as a parameter.' },
    { name: 'yield in a fixture', summary: 'Code before yield is setup, the yielded value goes to the test, code after yield is teardown.' },
    { name: 'conftest.py', summary: 'Fixtures defined here are available to every test in its folder and sub-folders, without importing.' },
    { name: 'tmp_path', summary: 'Built-in fixture: a fresh pathlib.Path directory unique to each test.' },
    { name: 'monkeypatch', summary: 'Built-in fixture: setattr / setenv / delenv / setitem / chdir, all undone after the test.' },
    { name: 'capsys / caplog', summary: 'Built-in fixtures capturing printed output (readouterr()) and log records.' },
    { name: 'TestCase.addCleanup(fn, *args)', summary: 'unittest: register a cleanup that runs after tearDown, in reverse order, even if the test failed.' },
    { name: 'tempfile.TemporaryDirectory()', summary: 'Creates a temporary folder; .cleanup() (or leaving the with block) deletes it.' },
  ],
  docs: [
    { label: 'pytest — How to use fixtures', url: 'https://docs.pytest.org/en/stable/how-to/fixtures.html' },
    { label: 'pytest — About fixtures', url: 'https://docs.pytest.org/en/stable/explanation/fixtures.html' },
    { label: 'pytest — Fixtures reference (built-ins)', url: 'https://docs.pytest.org/en/stable/reference/fixtures.html' },
    { label: 'pytest — tmp_path and monkeypatch', url: 'https://docs.pytest.org/en/stable/how-to/monkeypatch.html' },
    { label: 'unittest — addCleanup and class/module fixtures', url: 'https://docs.python.org/3/library/unittest.html#unittest.TestCase.addCleanup' },
    { label: 'tempfile — temporary files and directories', url: 'https://docs.python.org/3/library/tempfile.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Most tests need something prepared first: an empty cart, a database with three products, a temporary folder, a fake API client. A **fixture** is pytest's name for that prepared thing — and for the code that builds it and cleans it up.`,
    { code: py`import pytest


@pytest.fixture
def cart():
    return Cart()


def test_starts_empty(cart):          # "cart" names the fixture
    assert cart.total() == 0


def test_add_item(cart):              # a brand-new Cart again
    cart.add_item("apple", 0.50)
    assert cart.total() == 0.50`, lang: 'python', static: true, title: 'test_cart.py' },
    py`You never call \`cart()\` yourself. pytest reads each test's **parameter names**, finds the fixtures with those names, runs them, and passes in the results. That's called **dependency injection**: the test declares what it needs and the framework supplies it. Fixtures can ask for other fixtures, decide how long they live (**scope**), and clean up after themselves with \`yield\`.`,
    py`pytest isn't installable in this sandbox, so pytest code here is shown statically and the playground uses the standard-library equivalents — \`setUp\`, \`addCleanup\`, \`tempfile\` and \`unittest.mock\` — plus a **simplified** fixture engine you can run.`,
  ],
  why: [
    py`Copy-pasting setup into every test buries the interesting line under boilerplate, and forgetting cleanup leaves files, environment variables or database rows behind that make *other* tests fail. Fixtures give setup a **name**, put it in **one place**, and guarantee **teardown** runs — even when the test fails.`,
    py`Compared with unittest's \`setUp\` (which builds *everything* for *every* test in the class), fixtures are à la carte: each test asks only for what it uses, fixtures compose like building blocks, and sharing an expensive resource across tests is one argument: \`scope="session"\`.`,
  ],
  eli15: [
    py`Imagine a cooking class. Before each recipe, an assistant puts the right tools on your bench — a clean bowl, a whisk, three eggs — and after you're done, they wash up. You never fetch tools yourself: you just say what the recipe needs.`,
    py`A fixture is that assistant. Your test says "I need \`cart\` and \`tmp_path\`" simply by having parameters with those names. pytest lays them out, runs the test, then cleans up. Some things are set up once for the whole class (the oven — **session** scope); others are fresh for every recipe (the bowl — **function** scope).`,
  ],
  analogy: {
    title: 'A kitchen assistant who preps every station',
    body: [
      py`In a restaurant, a prep assistant sets up each station before service and cleans it afterwards. Cooks just name what they need. Big things like the oven are switched on once a day; cutting boards are fresh for every dish so flavours don't mix.`,
      py`Fixtures work the same way: the test names what it needs, pytest prepares it, and scope decides how long it lives before it's cleaned up.`,
    ],
    mapping: [
      ['"I need a whisk and two bowls"', 'test parameters: def test_x(cart, tmp_path)'],
      ['the prep assistant', 'pytest resolving fixtures by name'],
      ['setting up / washing up', 'code before / after yield in a fixture'],
      ['the oven, on all day', 'scope="session": created once, shared'],
      ['a fresh cutting board per dish', 'scope="function" (default): new for every test'],
      ['the station checklist on the wall', 'conftest.py: fixtures shared by a whole folder'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'How a yield fixture wraps a test (simplified)',
    props: {
      code: py`import inspect

def cart():
    print("setup: new cart")
    items = []
    yield items                     # the test runs while we're paused here
    print("teardown: cart had", items)

FIXTURES = {"cart": cart}

def test_add_apple(cart):
    cart.append("apple")
    assert cart == ["apple"]

def run(test):
    names = inspect.signature(test).parameters     # the names the test asks for
    generators = [FIXTURES[name]() for name in names]
    args = [next(g) for g in generators]           # setup: run up to yield
    try:
        test(*args)
        print("PASSED", test.__name__)
    finally:
        for g in reversed(generators):
            next(g, None)                          # teardown: resume after yield
run(test_add_apple)
`,
      notes: {
        3: 'A fixture written as a **generator**: the code before `yield` is setup, after it is teardown.',
        16: 'pytest looks at the test\'s **parameter names** — that is the whole injection mechanism.',
        18: '`next()` runs the fixture up to its `yield`; the yielded value becomes the test\'s argument.',
        20: 'The test receives the fixture value as an ordinary argument.',
        23: 'In `finally`, so teardown runs even if the test fails. Several fixtures are torn down in **reverse** order.',
      },
    },
    alt: 'Step-by-step trace. A generator fixture cart prints setup, creates an empty list and yields it. The runner reads the test parameter names, creates the generator, calls next to run setup and get the list, calls the test which appends apple, prints PASSED, then in finally resumes the generator so it prints teardown with the list.',
    caption: py`This is a **simplified** model, but it's genuinely how yield fixtures behave: pytest calls \`next()\` for setup and resumes the generator for teardown.`,
  },
  syntax: [
    py`#### Defining and requesting fixtures`,
    { code: py`import sqlite3
import pytest


@pytest.fixture
def db():
    connection = sqlite3.connect(":memory:")
    connection.execute("CREATE TABLE products (name TEXT, stock INTEGER)")
    yield connection              # the test runs here
    connection.close()            # teardown: runs even if the test failed


@pytest.fixture
def stocked_db(db):               # fixtures can request fixtures
    db.executemany("INSERT INTO products VALUES (?, ?)", [("apple", 10), ("pear", 0)])
    return db


def test_out_of_stock(stocked_db):
    rows = stocked_db.execute("SELECT name FROM products WHERE stock = 0").fetchall()
    assert rows == [("pear",)]`, lang: 'python', static: true, title: 'test_products.py' },
    py`- A fixture may \`return\` a value (no teardown needed) or \`yield\` exactly once (setup → test → teardown).
- Within one test each fixture is created **once**, even if several fixtures request it — \`stocked_db\` and the test share the same \`db\`.
- Teardown runs in **reverse** order of setup. If setup code *before* \`yield\` raises, that fixture's teardown doesn't run (it never finished setting up), and the test is reported as an **error**.`,
    py`#### Scope: how long a fixture lives`,
    { code: py`@pytest.fixture(scope="session")      # once per test run
def catalogue():
    return load_catalogue("catalogue.json")


@pytest.fixture(scope="module")       # once per test file
def schema_db(): ...


@pytest.fixture                       # scope="function", the default: once per test
def cart(catalogue):
    return Cart(catalogue)`, lang: 'python', static: true, title: 'scopes' },
    py`| scope | created | torn down | use for |
|---|---|---|---|
| \`function\` (default) | before each test | after that test | anything mutable — safest |
| \`class\` | before the first test in a class | after the last one | rarely needed |
| \`module\` | once per test file | end of the file | expensive, read-only setup |
| \`package\` | once per package | end of the package | rarely needed |
| \`session\` | once per run | end of the run | very expensive, **read-only** resources |`,
    py`A fixture may only request fixtures with the **same or wider** scope. A session fixture asking for the function-scoped \`tmp_path\` fails with *ScopeMismatch* (use \`tmp_path_factory\` instead).`,
    py`#### conftest.py: sharing fixtures`,
    { code: py`tests/
├── conftest.py          # fixtures here work in every test below
├── test_cart.py
└── api/
    ├── conftest.py      # extra (or overriding) fixtures for tests/api/ only
    └── test_orders.py`, lang: 'text', title: 'project layout' },
    py`pytest loads \`conftest.py\` files automatically. **Never import them** — just name the fixture as a parameter. A fixture in a closer \`conftest.py\` (or in the test module) **overrides** one with the same name further up.`,
    py`#### Built-in fixtures you'll use constantly`,
    { code: py`def test_save_writes_json(tmp_path):              # pathlib.Path, unique per test
    inventory = Inventory(tmp_path / "stock.json")
    inventory.add("apple", 10)
    inventory.save()
    assert (tmp_path / "stock.json").exists()


def test_data_dir_from_env(monkeypatch):           # every change undone afterwards
    monkeypatch.setenv("SHOP_DATA_DIR", "/srv/shop")
    assert data_dir() == Path("/srv/shop")


def test_report(capsys):                           # captures stdout / stderr
    inventory = Inventory("unused.json")
    inventory.add("pear", 4)
    inventory.report()
    assert capsys.readouterr().out == "pear: 4\n"


def test_low_stock_warning(caplog):                # captures logging records
    check_stock({"apple": 1})
    assert "apple is low" in caplog.text`, lang: 'python', static: true, title: 'tmp_path, monkeypatch, capsys, caplog' },
    py`\`monkeypatch\` also has \`setattr(obj, "name", value)\`, \`delenv\`, \`setitem\`, \`delitem\`, \`chdir\` and \`syspath_prepend\`. Run \`pytest --fixtures\` to list every fixture available to a test, with its docstring.`,
    py`#### More fixture options`,
    { code: py`@pytest.fixture(params=["sqlite", "memory"])     # every test using it runs twice
def repository(request):
    return make_repository(request.param)


@pytest.fixture(autouse=True)                      # used by every test in scope, no argument needed
def no_real_network(monkeypatch):
    monkeypatch.setattr("socket.socket", None)


@pytest.fixture
def make_product():                                # "factory as fixture"
    def make(name="apple", price=0.50, stock=10):
        return Product(name, price, stock)
    return make`, lang: 'python', static: true, title: 'params, autouse, factories' },
  ],
  walkthrough: {
    title: 'The standard-library version of fixtures',
    lang: 'python',
    code: TESTS,
    intro: py`This is \`main.py\` in the playground. Each \`# ~\` comment names the pytest feature the line imitates.`,
    steps: [
      { lines: [16, 19], text: py`\`setUpClass\` runs **once** before the class's tests, like a class/module-scoped fixture. Only put read-only data here — anything stored on \`cls\` is shared.` },
      { lines: [21, 23], text: py`\`setUp\` runs before **every** test, like a function-scoped fixture. \`TemporaryDirectory\` creates a fresh folder — the job \`tmp_path\` does in pytest.` },
      { lines: [24, 25], text: py`\`addCleanup\` registers teardown work. Cleanups run **after** \`tearDown\`, in **reverse** order, even if the test or a later part of \`setUp\` failed — the same guarantee as code after \`yield\`.` },
      { lines: [26, 29], text: py`Build the object under test from fresh pieces: a new \`Inventory\` in a new folder, filled with a **copy** of the sample data via \`add()\`.` },
      { lines: [43, 45], text: py`\`mock.patch.dict(os.environ, {...})\` sets an environment variable and restores the original mapping when the block ends — what \`monkeypatch.setenv\` does.` },
      { lines: [47, 51], text: py`\`redirect_stdout\` captures printed text into a \`StringIO\`, the job of pytest's \`capsys\`.` },
      { lines: [54, 57], text: py`Run the suite (report on stderr), then print the recorded order of setup and cleanup steps.` },
    ],
  },
  playground: {
    title: 'Fixtures with setUp, addCleanup and temp folders',
    objective: 'Run the suite and read the setup/teardown order, then break isolation on purpose, and add tests that use a temp file and a patched environment.',
    files: { 'main.py': TESTS, 'inventory.py': INVENTORY },
    expected: py`unittest's report (stderr) shows 4 tests \`ok\`. The last stdout line shows the order of events:

\`\`\`text
setUpClass -> setUp -> tearDown -> cleanup -> setUp -> tearDown -> cleanup -> ...
\`\`\`

\`setUpClass\` once, then for each test: \`setUp\`, the test, \`tearDown\`, then the cleanups (in reverse registration order). Switch to the **simplified fixture engine** variant to see injection by name and scopes in action.`,
    experiments: [
      {
        id: 'shared-state',
        task: py`Break isolation on purpose. In \`setUp\`, replace the two-line \`for\` loop with \`self.inventory.stock = self.sample\` (no copy). Run it: which tests fail, and why? (Put the loop back afterwards.)`,
        hint: py`\`self.sample\` is one dict created once in \`setUpClass\`. What does \`remove("apple", 3)\` do to it?`,
        tests: [{ name: 'the shared sample dict was mutated by a test', code: py`assert TestInventory.sample["apple"] == 7, 'Replace the for loop with self.inventory.stock = self.sample and run'` }],
        explain: py`Every inventory now points at the **same** dict that lives on the class. \`test_remove_reduces_stock\` takes it down to 7, and the tests that run after it see 7 instead of 10. This is exactly why function scope is the default and why wide-scoped fixtures must be read-only (or hand out copies). Restore the loop.`,
      },
      {
        id: 'temp-file',
        task: py`Add a test method \`test_save_creates_the_file\` that calls \`self.inventory.save()\` and checks that \`self.tmp_path / "stock.json"\` exists and contains \`"apple"\`.`,
        hint: py`\`path = self.tmp_path / "stock.json"\`, then \`self.assertTrue(path.exists())\` and \`self.assertIn("apple", path.read_text())\`.`,
        tests: [
          { name: 'the new test exists and the suite passes', code: py`import unittest
assert "test_save_creates_the_file" in unittest.defaultTestLoader.getTestCaseNames(TestInventory), 'Add a method named test_save_creates_the_file'
assert result.wasSuccessful(), 'Some tests fail — did you restore the for loop in setUp?'` },
          { name: 'it fails if save() writes nothing', code: py`import unittest
cls = ns["Inventory"]
original = cls.save
cls.save = lambda self: None
try:
    outcome = unittest.TestResult()
    TestInventory("test_save_creates_the_file").run(outcome)
finally:
    cls.save = original
assert not outcome.wasSuccessful(), 'With save() doing nothing your test still passes — check the file exists'` },
        ],
        explain: py`Each test writes into its own throwaway folder, so tests never see each other's files and nothing is left behind. In pytest this whole setup is just a \`tmp_path\` parameter.`,
      },
      {
        id: 'env-default',
        task: py`Add \`test_default_data_dir\` that checks \`data_dir()\` returns \`Path("shop-data")\` when \`SHOP_DATA_DIR\` is **not** set — even on a machine where it is. Use \`with mock.patch.dict(os.environ, clear=True):\`.`,
        hint: py`\`clear=True\` empties \`os.environ\` for the duration of the block and restores everything afterwards.`,
        tests: [{ name: 'the new test exists and the suite passes', code: py`import unittest
assert "test_default_data_dir" in unittest.defaultTestLoader.getTestCaseNames(TestInventory), 'Add a method named test_default_data_dir'
assert result.wasSuccessful()` }],
        explain: py`Tests that read the environment must control it, or they pass on your laptop and fail in CI (or the other way round). pytest's version: \`monkeypatch.delenv("SHOP_DATA_DIR", raising=False)\`.`,
      },
      {
        id: 'cleanup-order',
        task: py`Swap the two \`addCleanup\` lines in \`setUp\` and run again. Predict the new event order first. Then add a third cleanup, \`self.addCleanup(EVENTS.append, "first registered")\`, as the **first** line of \`setUp\`.`,
        explain: py`Cleanups run **last-in, first-out**, like a stack — and pytest tears down fixtures in reverse setup order for the same reason: later things may depend on earlier ones (close the cursor before the connection).`,
      },
    ],
    variants: [
      { id: 'engine', label: 'Simplified fixture engine', files: { 'main.py': ENGINE } },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Scopes: who lives how long',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'session', label: 'catalogue', note: 'scope="session"', x: 380, y: 50, tone: 'red' },
        { id: 'modA', label: 'db for test_cart.py', note: 'scope="module"', x: 200, y: 160, tone: 'yellow' },
        { id: 'modB', label: 'db for test_orders.py', note: 'scope="module"', x: 580, y: 160, tone: 'yellow' },
        { id: 't1', label: 'test_add', note: 'fresh cart', x: 100, y: 280, tone: 'blue' },
        { id: 't2', label: 'test_remove', note: 'fresh cart', x: 300, y: 280, tone: 'blue' },
        { id: 't3', label: 'test_checkout', note: 'fresh cart', x: 580, y: 280, tone: 'blue' },
      ],
      edges: [
        { from: 'session', to: 'modA' },
        { from: 'session', to: 'modB' },
        { from: 'modA', to: 't1' },
        { from: 'modA', to: 't2' },
        { from: 'modB', to: 't3' },
      ],
      steps: [
        { focus: ['session'], text: py`The first test that needs \`catalogue\` triggers its setup. Being **session**-scoped, it's cached and reused by every later test in the run.` },
        { focus: ['modA'], edges: ['session->modA'], text: py`Entering \`test_cart.py\`, the **module**-scoped \`db\` is set up once for that file.` },
        { focus: ['t1'], edges: ['modA->t1'], text: py`\`test_add\` gets a brand-new **function**-scoped \`cart\`, plus the shared \`db\` and \`catalogue\`. After it finishes, only \`cart\` is torn down.` },
        { focus: ['t2'], edges: ['modA->t2'], text: py`\`test_remove\` gets *another* fresh cart, but the **same** \`db\`. If \`test_add\` had changed rows in it, \`test_remove\` would see them — wide scopes are only safe for read-only or reset state.` },
        { focus: ['modB', 't3'], edges: ['session->modB', 'modB->t3'], text: py`Leaving \`test_cart.py\` tears down its \`db\`. \`test_orders.py\` gets its own \`db\`; \`catalogue\` carries on.` },
        { focus: ['session'], text: py`When the run ends, \`catalogue\` is torn down last — teardown always happens in reverse order of setup.` },
      ],
    },
    alt: 'Tree diagram. A session-scoped catalogue at the top feeds two module-scoped db fixtures, one per test file. The first file has two tests and the second one test, each with a fresh function-scoped cart. Steps show the catalogue created once, each module db created per file, carts created per test, and teardown in reverse order.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`When a test asks for \`cart\`, pytest searches for a fixture with that name, from closest to furthest: the test's **class**, its **module**, each **conftest.py** from the test's folder up to the rootdir, installed **plugins**, then the **built-ins** (\`tmp_path\`, \`monkeypatch\`, \`capsys\`…). The closest definition wins.`,
      py`If setup fails, pytest reports an **error** (not a failure) with a clear phase label:`,
      { code: py`==================================== ERRORS ====================================
_________________ ERROR at setup of test_remove_reduces_stock __________________
...
E       FileNotFoundError: [Errno 2] No such file or directory: 'stock.json'
...
=========================== short test summary info ============================
ERROR test_inventory.py::test_remove_reduces_stock - FileNotFoundError: [Errno...
1 passed, 1 error in 0.05s`, lang: 'text', title: 'real pytest output (abridged)' },
      py`"Error at setup" means: the test itself never ran — look at the fixture, not the test.`,
    ],
    technical: [
      py`For each test pytest builds the **closure** of fixtures it needs (its parameters, their parameters, plus \`autouse\` fixtures in scope) and instantiates them in an order that respects both dependencies and scope: wider-scoped fixtures first, then dependencies before dependents. Each value is **cached** for its scope (per test, per module, per session…), which is why two fixtures requesting \`db\` in one test get the same object.`,
      py`A yield fixture is driven exactly like a generator: \`next()\` runs setup and returns the value; after the test, pytest resumes it and expects it to finish. Teardowns are registered as **finalizers** on the scope and run **last-in, first-out**. A second \`yield\` is an error. (\`request.addfinalizer(fn)\` is the older, explicit way to register teardown.)`,
      py`The \`request\` fixture gives a fixture information about who asked: \`request.param\` (for \`params=\` fixtures), \`request.node\` (the test item), \`request.getfixturevalue(name)\`. Parametrized fixtures multiply test items just like \`@pytest.mark.parametrize\`.`,
      { callout: 'note', title: 'unittest equivalents', text: py`\`setUp\`/\`tearDown\` ≈ function scope; \`setUpClass\`/\`tearDownClass\` ≈ class scope; module-level \`setUpModule\`/\`tearDownModule\` ≈ module scope; \`addCleanup\` ≈ code after \`yield\` (LIFO, runs even after failures). \`tearDown\` only runs if \`setUp\` succeeded; cleanups registered before a failure still run.` },
    ],
    production: [
      py`- **Database tests:** create the schema once (\`scope="session"\`), then give each test a function-scoped connection inside a **transaction that is rolled back** at teardown. Fast, and every test still starts clean ([SQL & sqlite3](lesson:sql-and-sqlite), [database patterns](lesson:database-patterns)).
- **Factories as fixtures** (\`make_product(name=..., stock=...)\`) beat dozens of near-identical fixtures: tests state only the details that matter to them.
- **Keep fixtures small and explicit.** \`autouse=True\` hides dependencies — reserve it for global safety nets (block real network, freeze settings).
- **Know where a fixture comes from:** \`pytest --fixtures\` lists them, \`pytest --setup-show\` prints every setup and teardown as it happens.
- **Isolation is the goal.** Combine fixtures with [mocking](lesson:mocking) for collaborators you don't control and with \`pytest-randomly\` to catch order dependence.`,
    ],
  },
  mistakes: [
    {
      title: 'Calling a fixture directly',
      wrong: { code: py`@pytest.fixture
def cart():
    return Cart()


def test_starts_empty():
    assert cart().total() == 0`, lang: 'python', static: true },
      right: { code: py`def test_starts_empty(cart):
    assert cart.total() == 0`, lang: 'python', static: true },
      explanation: py`Fixtures are requested, not called. pytest stops with *Fixture "cart" called directly. Fixtures are not meant to be called directly…* Name it as a parameter instead.`,
    },
    {
      title: 'A wide-scoped fixture holding mutable state',
      wrong: { code: py`@pytest.fixture(scope="module")
def inventory():
    return Inventory({"apple": 10})       # one object for the whole file`, lang: 'python', static: true },
      right: { code: py`@pytest.fixture                         # function scope: fresh per test
def inventory():
    return Inventory({"apple": 10})`, lang: 'python', static: true },
      explanation: py`Any test that changes the shared object changes it for every later test, so results depend on order. Widen scope only for expensive, read-only resources — or reset state in a function-scoped fixture.`,
    },
    {
      title: 'Cleanup in the test body instead of teardown',
      wrong: { code: py`def test_export(tmp_path):
    os.environ["EXPORT_DIR"] = str(tmp_path)
    assert export_report() == "ok"        # if this fails...
    del os.environ["EXPORT_DIR"]          # ...this never runs`, lang: 'python', static: true },
      right: { code: py`def test_export(tmp_path, monkeypatch):
    monkeypatch.setenv("EXPORT_DIR", str(tmp_path))   # undone automatically
    assert export_report() == "ok"`, lang: 'python', static: true },
      explanation: py`A failing assert stops the test, so cleanup written after it is skipped and the change leaks into other tests. Put cleanup after \`yield\` in a fixture, use \`monkeypatch\`, or \`addCleanup\` in unittest.`,
    },
    {
      title: 'Importing fixtures from conftest.py',
      wrong: { code: py`from conftest import db       # don't

def test_products(db): ...`, lang: 'python', static: true },
      right: { code: py`def test_products(db):        # pytest finds conftest fixtures by name
    ...`, lang: 'python', static: true },
      explanation: py`conftest.py is loaded by pytest itself; importing it can load it twice under different module names and breaks with packages. Just request the fixture by name.`,
    },
  ],
  debugging: [
    {
      symptom: py`fixture 'db' not found  /  available fixtures: cache, capfd, capsys, ..., tmp_path, ...  /  use 'pytest --fixtures [testpath]' for help on them.`,
      cause: py`No fixture with that name is visible from this test: a typo, or it's defined in a \`conftest.py\` in a *different* folder (conftest fixtures only reach tests in their folder and below).`,
      fix: py`Check the spelling; move the fixture to a \`conftest.py\` higher up; run \`pytest --fixtures path/to/test_file.py\` to see what's visible there.`,
    },
    {
      symptom: py`ScopeMismatch: You tried to access the function scoped fixture tmp_path with a module scoped request object`,
      cause: py`A wider-scoped fixture requested a narrower one. A module fixture can't depend on something that is recreated for every test.`,
      fix: py`Narrow the outer fixture's scope, or use the wide-scoped variant (\`tmp_path_factory.mktemp("data")\` for session/module temp folders).`,
    },
    {
      symptom: py`ERROR at setup of test_x`,
      cause: py`An exception was raised inside a fixture before \`yield\`/\`return\`; the test body never ran.`,
      fix: py`Read the traceback from the fixture's code. Note that the fixture's own teardown did not run (setup never finished) — other fixtures' teardowns did.`,
    },
    {
      symptom: py`Tests pass alone but fail together (or in a different order).`,
      cause: py`A wide-scoped fixture or module-level object is mutated by some tests, or cleanup is skipped after a failure.`,
      fix: py`Use function scope for mutable things, move cleanup after \`yield\` / into \`monkeypatch\`, and run with \`pytest-randomly\` to surface the problem.`,
    },
  ],
  bestPractices: [
    'Name fixtures after what they provide (stocked_db, admin_client), not how (setup_stuff).',
    'Default to function scope; widen only for expensive, read-only resources.',
    'Use yield for anything that needs cleanup; never put cleanup after an assert in the test body.',
    'Prefer the built-ins: tmp_path for files, monkeypatch for env vars and attributes, capsys/caplog for output.',
    'Share fixtures through conftest.py at the right folder level; never import conftest.',
    'Prefer small fixtures composed together, and factory fixtures over many near-duplicates.',
  ],
  useCases: [
    'A fresh in-memory SQLite database (or a rolled-back transaction) for every test.',
    'Temporary folders and files for code that reads or writes to disk.',
    'Setting environment variables, config values or the current time for one test only.',
    'Capturing printed output or log messages to assert on them.',
    'Sharing an expensive, read-only resource (a loaded catalogue, a started test server) across a whole run.',
  ],
  comparison: {
    title: 'unittest setup vs pytest fixtures',
    headers: ['', 'unittest', 'pytest fixtures'],
    rows: [
      ['per-test setup', 'setUp() — builds everything for every test in the class', 'function-scoped fixtures — each test asks only for what it needs'],
      ['teardown', 'tearDown() (only if setUp succeeded), addCleanup()', 'code after yield, run in reverse order'],
      ['shared setup', 'setUpClass / setUpModule', 'scope="class" / "module" / "package" / "session"'],
      ['reuse across files', 'base classes / mixins', 'conftest.py, by name, no imports'],
      ['temp files / env / output', 'tempfile, mock.patch.dict, redirect_stdout', 'tmp_path, monkeypatch, capsys'],
      ['how a test gets it', 'self.attribute', 'a parameter with the fixture\'s name'],
    ],
    note: py`pytest runs unittest classes too, and can even use \`@pytest.mark.usefixtures\` on them, so the two styles can live side by side during a migration.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'fixtures-q1',
      type: 'mcq',
      prompt: py`A fixture named \`stocked_db\` exists in \`conftest.py\`. How does a test get it?`,
      options: [
        { text: 'from conftest import stocked_db, then call stocked_db()', why: 'Never import conftest, and fixtures are never called directly — pytest raises an error if you do.' },
        'Declare a parameter named stocked_db: def test_x(stocked_db)',
        { text: 'Decorate the test with @pytest.fixture("stocked_db")', why: '@pytest.fixture defines fixtures; it does not request them.' },
        { text: 'Read it from self.stocked_db', why: 'That is the unittest setUp style; pytest injects fixtures as function arguments.' },
      ],
      answer: 1,
      explanation: py`pytest matches parameter names to fixture names (dependency injection). conftest.py fixtures are visible to every test in that folder and below, with no import.`,
    },
    {
      id: 'fixtures-q2',
      type: 'output',
      prompt: py`This simulates how pytest drives two yield fixtures. What does it print?`,
      code: py`def make(name):
    print("setup", name)
    yield name
    print("teardown", name)

active = [make("db"), make("cart")]
values = [next(g) for g in active]
print("test uses", values)
for g in reversed(active):
    next(g, None)`,
      answer: "setup db\nsetup cart\ntest uses ['db', 'cart']\nteardown cart\nteardown db",
      accept: ["setup db\nsetup cart\ntest uses ['db', 'cart']\nteardown cart\nteardown db"],
      explanation: py`Creating a generator runs nothing; each \`next()\` runs setup up to \`yield\`. After the "test", the generators are resumed in **reverse** order, so the fixture set up last is torn down first.`,
    },
    {
      id: 'fixtures-q3',
      type: 'output',
      prompt: py`What does the final \`print\` show? (Ignore unittest's own report on stderr.)`,
      code: py`import unittest

log = []

class TestReceipt(unittest.TestCase):
    def setUp(self):
        self.addCleanup(log.append, "cleanup 1")
        self.addCleanup(log.append, "cleanup 2")

    def tearDown(self):
        log.append("tearDown")

    def test_it(self):
        log.append("test")

unittest.main(argv=["x"], exit=False, verbosity=0)
print(log)`,
      options: [
        { text: "['test', 'cleanup 1', 'cleanup 2', 'tearDown']", why: 'Cleanups run after tearDown, not before — and in reverse order.' },
        { text: "['test', 'tearDown', 'cleanup 1', 'cleanup 2']", why: 'Right place, wrong order: cleanups run last-in, first-out.' },
        "['test', 'tearDown', 'cleanup 2', 'cleanup 1']",
        { text: "['cleanup 1', 'cleanup 2', 'test', 'tearDown']", why: 'addCleanup only registers the function; it runs after the test.' },
      ],
      answer: 2,
      explanation: py`unittest runs the test, then \`tearDown\`, then the registered cleanups in **LIFO** order — the same reverse order pytest uses for fixture teardown.`,
    },
    {
      id: 'fixtures-q4',
      type: 'bug',
      prompt: 'The second test fails only when the whole file runs. Click the line that causes it.',
      code: py`@pytest.fixture(scope="module")
def inventory():
    return Inventory({"apple": 10})

def test_sell_apples(inventory):
    inventory.remove("apple", 3)
    assert inventory.stock["apple"] == 7

def test_apples_in_stock(inventory):
    assert inventory.stock["apple"] == 10`,
      answerLine: 1,
      explanation: py`With \`scope="module"\` both tests share one \`Inventory\`, so the second one sees 7 apples. Remove the scope (function is the default) so each test gets a fresh object.`,
    },
    {
      id: 'fixtures-q5',
      type: 'fill',
      prompt: 'Complete the fixture: it should use pytest\'s per-test temporary folder, create a stock file, hand its path to the test, then delete the file afterwards.',
      code: py`@pytest.___
def stock_file(___):
    path = tmp_path / "stock.json"
    path.write_text('{"apple": 10}')
    ___ path
    path.unlink()`,
      answer: [['fixture', 'fixture()'], ['tmp_path'], ['yield']],
      explanation: py`\`@pytest.fixture\` registers it, the \`tmp_path\` parameter requests the built-in fixture, and \`yield\` hands over the path while keeping the cleanup line alive. (With \`tmp_path\`, deleting is optional — the folder is unique anyway.)`,
    },
    {
      id: 'fixtures-q6',
      type: 'mcq',
      prompt: 'A function prints a receipt. Which built-in fixture lets your test assert on what it printed?',
      options: [
        'capsys',
        { text: 'caplog', why: 'caplog captures records sent through the logging module, not print() output.' },
        { text: 'monkeypatch', why: 'monkeypatch changes attributes, env vars and dict items; it does not capture output.' },
        { text: 'tmp_path', why: 'tmp_path gives you a temporary folder, unrelated to stdout.' },
      ],
      answer: 0,
      explanation: py`\`capsys.readouterr()\` returns what was written to stdout and stderr since the last call, as \`.out\` and \`.err\`.`,
    },
    {
      id: 'fixtures-q7',
      type: 'short',
      prompt: 'When would you make a fixture session-scoped, and what must be true about the object it provides?',
      answer: py`When creating it is expensive (loading a big catalogue, starting a test server, creating a database schema) and many tests need it. The object must be read-only for tests, or reset before each test (e.g. via a function-scoped fixture that rolls back a transaction), because every test shares the same instance — mutations would leak between tests and make results depend on order.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'fix-leaky-tests',
      title: 'Fix the leaky tests',
      difficulty: 'intermediate',
      prompt: py`\`TestOrders\` has three isolation bugs: a **class-level list** shared by every test, a test that **writes a file into the current folder**, and a test that **sets an environment variable and never restores it**. Fix the *tests* (don't change \`save_order\` or \`currency\`) using \`setUp\`, \`tempfile.TemporaryDirectory\` + \`addCleanup\`, and \`mock.patch.dict\`.

The checker requires that:

1. all five test methods still exist with the same names;
2. the suite passes in its normal order **and** in reverse order;
3. after the suite runs, no \`order-*.txt\` file is left in the current folder;
4. after the suite runs, \`os.environ\` is exactly as it was before.`,
      files: { 'main.py': LEAKY_STARTER },
      hints: [
        'Run it and read which tests fail. Each failure is caused by an earlier test leaving something behind.',
        'Create self.basket = [] in setUp. Make a TemporaryDirectory in setUp, register folder.cleanup with addCleanup, and pass folder=... to save_order.',
        'with mock.patch.dict(os.environ, {"SHOP_CURRENCY": "GBP"}):\n    self.assertEqual(currency(), "GBP")\n— the original environment is restored when the block ends.',
      ],
      solution: {
        explanation: py`Each fix gives a test its **own** copy of what it touches. \`self.basket = []\` in \`setUp\` creates a new list per test (a class attribute is created once and shared). The temporary folder is unique per test and removed by \`addCleanup\` even if the test fails. \`mock.patch.dict\` snapshots \`os.environ\` and restores it on exit, so later tests see the real environment. The default-currency test also clears the variable inside a patch, so it passes on a machine where \`SHOP_CURRENCY\` happens to be set. In pytest these three fixes are a \`basket\` fixture, \`tmp_path\` and \`monkeypatch.setenv\`.`,
        files: { 'main.py': LEAKY_SOLUTION },
      },
      tests: [
        { name: 'all five tests still exist', code: LEAKY_CHECK + py`
expected = {"test_basket_gets_an_item", "test_basket_starts_empty", "test_save_order_writes_a_file",
            "test_currency_can_be_configured", "test_default_currency_is_euro"}
assert expected <= set(names), f'Missing: {sorted(expected - set(names))}'` },
        { name: 'passes in the normal order', code: LEAKY_CHECK + py`
os.environ.pop("SHOP_CURRENCY", None)
outcome = run_in(names)
assert outcome.wasSuccessful(), f'{len(outcome.failures)} failing test(s) in the normal order'` },
        { name: 'passes in reverse order', code: LEAKY_CHECK + py`
os.environ.pop("SHOP_CURRENCY", None)
outcome = run_in(list(reversed(names)))
assert outcome.wasSuccessful(), f'{len(outcome.failures)} failing test(s) in reverse order'` },
        { name: 'leaves no order files in the current folder', code: LEAKY_CHECK + py`
for leftover in Path(".").glob("order-*.txt"):
    leftover.unlink()
run_in(names)
assert not list(Path(".").glob("order-*.txt")), 'save_order wrote into the current folder — give it a temporary folder'` },
        { name: 'leaves os.environ unchanged', code: LEAKY_CHECK + py`
os.environ.pop("SHOP_CURRENCY", None)
before = dict(os.environ)
run_in(names)
assert dict(os.environ) == before, 'A test changed os.environ and did not restore it'` },
      ],
    },
    {
      id: 'mini-fixture-runner',
      title: 'Write a tiny fixture runner',
      difficulty: 'advanced',
      prompt: py`Implement \`run_with_fixtures(test, fixtures)\` — the heart of pytest's fixture system, simplified.

- \`fixtures\` is a dict mapping a name to a **generator function** that yields exactly once. A fixture function's own parameters name other fixtures it needs.
- Inject fixtures into \`test\` by its **parameter names** (use \`inspect.signature(fn).parameters\`), resolving fixtures' dependencies too.
- Set up each fixture **at most once** per call, even if several functions request it.
- Return \`"passed"\` if the test finishes, \`"failed"\` if it raises any \`Exception\`.
- After the test — pass or fail — resume every started generator (\`next(gen, None)\`) in **reverse** setup order.
- A name with no fixture raises \`LookupError\`.`,
      files: { 'main.py': RUNNER_STARTER },
      hints: [
        'Write an inner function get(name) that returns a cached value, or looks up the fixture, gets ITS arguments by calling get() for each parameter, creates the generator and calls next() on it.',
        'Keep a dict of values (the cache) and a list of started generators. Put the teardown loop in a finally block so it runs after a failing test too.',
        'try:\n    kwargs = {arg: get(arg) for arg in inspect.signature(test).parameters}\n    try: test(**kwargs); return "passed"\n    except Exception: return "failed"\nfinally:\n    for g in reversed(started): next(g, None)',
      ],
      solution: {
        explanation: py`\`get()\` is a small recursive resolver with a cache: it returns an existing value, or builds the fixture's arguments first (depth-first), starts the generator, and records it. Because values are cached by name, a fixture requested twice is set up once — pytest's per-scope caching in miniature. The \`finally\` block guarantees teardown even when the test fails, and \`reversed(started)\` tears down dependents before what they depend on. \`return\` inside \`try\` still runs \`finally\` first.`,
        files: { 'main.py': RUNNER_SOLUTION },
      },
      tests: [
        { name: 'injects a fixture by parameter name', code: py`def basket():
    yield ["apple"]
def check(basket):
    assert basket == ["apple"]
assert run_with_fixtures(check, {"basket": basket}) == "passed"` },
        { name: 'a fixture can request another fixture', code: py`def db():
    yield {"apple": 10}
def repo(db):
    yield lambda name: db[name]
def check(repo):
    assert repo("apple") == 10
assert run_with_fixtures(check, {"db": db, "repo": repo}) == "passed"` },
        { name: 'each fixture is set up once per call', code: py`calls = []
def db():
    calls.append("db")
    yield {}
def repo(db):
    yield db
def check(repo, db):
    assert repo is db
assert run_with_fixtures(check, {"db": db, "repo": repo}) == "passed"
assert calls == ["db"]` },
        { name: 'teardown runs in reverse order', code: py`log = []
def db():
    log.append("db setup")
    yield None
    log.append("db teardown")
def repo(db):
    log.append("repo setup")
    yield None
    log.append("repo teardown")
def check(repo):
    pass
run_with_fixtures(check, {"db": db, "repo": repo})
assert log == ["db setup", "repo setup", "repo teardown", "db teardown"]` },
        { name: 'a failing test returns "failed" and still tears down', code: py`log = []
def cart():
    yield []
    log.append("teardown")
def check(cart):
    assert cart == ["pear"]
assert run_with_fixtures(check, {"cart": cart}) == "failed"
assert log == ["teardown"]` },
        { name: 'an unknown fixture raises LookupError', code: py`def check(nonexistent):
    pass
with raises(LookupError):
    run_with_fixtures(check, {})` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'fixtures-what-and-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a pytest fixture, and why use one instead of writing setup code in each test?',
      answer: 'A fixture is a named function that provides something a test needs (and optionally cleans it up). Tests request it by parameter name and pytest injects it. It removes duplicated setup, guarantees teardown even on failure, composes with other fixtures, and can be shared across tests and files with a chosen scope.',
      explanation: py`Fixtures separate *what a test needs* from *how it is built*. Changing how carts are created means editing one fixture, not fifty tests. Teardown after \`yield\` runs even when the test fails, which inline cleanup can't promise.`,
      whyAsked: 'Fixtures are the core of idiomatic pytest; this checks you use them deliberately.',
      mistakes: ['Describing fixtures as "just setUp"', 'Not mentioning teardown or scope', 'Saying you call fixtures from the test'],
      followUps: ['How does pytest know which fixture to pass?', 'What happens if a fixture raises?', 'What is conftest.py for?'],
      modelAnswer: 'A fixture is a function decorated with pytest.fixture that provides something a test needs, like a fresh cart, a database connection or a temporary folder. A test asks for it simply by having a parameter with the same name, and pytest builds it and passes it in — dependency injection. If the fixture yields, the code after yield is teardown, and pytest runs it even if the test fails. Fixtures can depend on other fixtures, live for a chosen scope, and be shared through conftest.py. So setup lives in one named place instead of being copy-pasted, and cleanup is guaranteed.',
    },
    {
      id: 'fixtures-scopes',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare function, module and session scope. What is a ScopeMismatch error?',
      answer: 'Function scope (default) creates the fixture for every test — safest. Module scope creates it once per test file; session scope once per run — faster for expensive resources but shared, so it must be read-only or reset per test. A fixture can only depend on fixtures of the same or wider scope; a session fixture requesting a function fixture raises ScopeMismatch.',
      explanation: py`The trade-off is speed versus isolation. A common pattern combines both: a session fixture creates the expensive thing (schema, server), and a function fixture wraps each test in something resettable (a rolled-back transaction).`,
      whyAsked: 'Scope misuse is the most common source of order-dependent pytest suites.',
      mistakes: ['Making everything session-scoped "for speed"', 'Not knowing the dependency direction rule'],
      followUps: ['How would you get a temp folder in a session fixture? (tmp_path_factory)', 'How do you detect order dependence?'],
      modelAnswer: 'Scope controls how long a fixture lives. Function scope, the default, builds it fresh for each test, so tests can\'t affect each other. Module scope builds it once per test file and session scope once per run, which saves time for expensive resources, but every test shares the same object — so it must be read-only or reset per test. Because a wider fixture outlives narrower ones, it can only depend on fixtures with the same or wider scope; a session fixture asking for tmp_path raises ScopeMismatch, and the fix is tmp_path_factory. In practice I combine them: session for the expensive resource, function for the per-test reset.',
    },
    {
      id: 'fixtures-db-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Your integration tests use a real PostgreSQL database. Creating the schema takes seconds, and tests currently leave rows behind that break other tests. Design the fixtures.',
      answer: 'A session-scoped fixture creates the database/schema once (and drops it at the end). A function-scoped fixture opens a connection, begins a transaction, yields a session bound to it, and rolls back at teardown, so each test sees a clean database. Add factory fixtures for test data, and keep these tests in an integration tier (marker) separate from fast unit tests.',
      explanation: py`Rollback-per-test gives isolation at a fraction of the cost of recreating the schema. Caveats: code under test that commits needs savepoints/nested transactions (many ORMs support a "join the outer transaction" mode), and parallel runs (pytest-xdist) need one database per worker.`,
      code: { lang: 'python', code: py`@pytest.fixture(scope="session")
def engine():
    engine = create_test_database()        # schema once per run
    yield engine
    drop_test_database(engine)


@pytest.fixture
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    yield connection                       # each test works inside a transaction
    transaction.rollback()                 # ...that is thrown away afterwards
    connection.close()` },
      whyAsked: 'Shows you can balance speed and isolation in a realistic test architecture.',
      mistakes: ['Recreating the schema for every test (slow)', 'Sharing one connection with committed data (leaky)', 'Deleting rows manually after each test (fragile)'],
      followUps: ['What if the code under test calls commit()?', 'How would this work with pytest-xdist?', 'When would you use SQLite instead?'],
      modelAnswer: 'I would split it by cost. A session-scoped engine fixture creates the test database and schema once per run and drops it at the end. On top of that, a function-scoped db fixture opens a connection, starts a transaction, yields it to the test and rolls back in teardown, so every test starts from the same clean state without paying for schema creation again. Test data comes from small factory fixtures so each test states only what matters. If the code under test commits, I would use savepoints so the outer rollback still wins, and with parallel workers each worker gets its own database. These tests would carry an integration marker so the fast unit suite stays fast.',
    },
    {
      id: 'fixtures-conftest-visibility',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A fixture `api_client` lives in `tests/api/conftest.py`. A test in `tests/test_models.py` that requests it errors with "fixture \'api_client\' not found". Why?',
      options: ['conftest.py must be imported in the test file', 'conftest.py fixtures are only visible to tests in that folder and its sub-folders', 'Fixtures must be defined in the same file as the test', 'The fixture needs autouse=True'],
      correctOption: 1,
      answer: 'conftest.py fixtures are visible to tests in the same directory and below. tests/test_models.py is above tests/api/, so it cannot see them. Move the fixture to tests/conftest.py (or a plugin) if both need it.',
      explanation: py`pytest collects conftest.py files along each test's path from the rootdir down. That scoping lets sub-folders add or override fixtures without affecting others.`,
      whyAsked: 'Tests practical knowledge of how fixtures are shared in real multi-folder projects.',
      mistakes: ['Importing conftest to "fix" it', 'Duplicating the fixture in several files'],
      followUps: ['How can a sub-folder override a fixture?', 'How do you share fixtures across repositories? (a pytest plugin)'],
      modelAnswer: 'conftest.py files are scoped by directory: their fixtures are visible to tests in that folder and below. test_models.py sits one level above tests/api, so pytest never looks in tests/api/conftest.py for it. If both places need the fixture, I move it up to tests/conftest.py; if several projects need it, I package it as a pytest plugin. Importing conftest directly is the wrong fix — pytest loads those files itself.',
    },
    {
      id: 'fixtures-monkeypatch-vs-mock',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use pytest’s monkeypatch versus unittest.mock.patch?',
      answer: 'monkeypatch is a fixture for simple, automatically-undone replacements: environment variables, dict items, attributes, cwd, sys.path. mock.patch replaces an object with a Mock you can configure and inspect (return_value, side_effect, assert_called_with). Use monkeypatch to change state; use mock when you need a test double that records calls.',
      explanation: py`They overlap — \`monkeypatch.setattr(module, "fn", fake)\` works fine — but \`mock\` brings call recording and assertions, autospec and \`side_effect\`. Both undo their changes after the test. See [mocking](lesson:mocking).`,
      whyAsked: 'Checks that you pick the simplest tool for test isolation.',
      mistakes: ['Thinking monkeypatch creates mock objects', 'Patching os.environ by direct assignment'],
      followUps: ['How do you patch an environment variable with each?', 'What is pytest-mock?'],
      modelAnswer: 'monkeypatch is a pytest fixture for changing state temporarily — setenv, setattr, setitem, chdir — and it undoes everything when the test ends. unittest.mock.patch replaces something with a Mock object that I can program and inspect, for example to make an API call raise or to assert it was called once with certain arguments. So for "this env var should be X during the test" I use monkeypatch; for "replace the payment gateway and check how it was called" I use mock. They combine well: monkeypatch.setattr with a Mock as the value is perfectly fine.',
    },
    {
      id: 'fixtures-patcher',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement a simplified `monkeypatch`: a `Patcher` class with `setattr(target, name, value)`, `setitem(mapping, key, value)` and `undo()`. `undo()` restores everything in reverse order: original values come back, and attributes or keys that did not exist before are removed.',
      answer: 'Record (kind, target, key, old value or a MISSING sentinel) before each change; undo() walks the records in reverse, restoring old values or deleting what was added, then clears the list.',
      explanation: py`A sentinel object distinguishes "didn't exist" from "was \`None\`". Reverse order matters when the same attribute is patched twice: undoing the second patch restores the first value, then undoing the first restores the original. Real \`monkeypatch\` also handles class attributes vs instance attributes, \`raising=\`, \`setenv\`/\`delenv\` and \`chdir\`.`,
      starter: { files: { 'main.py': py`_MISSING = object()


class Patcher:
    """A simplified pytest monkeypatch."""

    def __init__(self):
        self._undo = []

    def setattr(self, target, name, value):
        pass   # TODO: remember the old value, then set the new one

    def setitem(self, mapping, key, value):
        pass   # TODO

    def undo(self):
        pass   # TODO: restore in reverse order
` + PATCHER_DEMO } },
      tests: [
        { name: 'setattr changes the attribute and undo restores it', code: py`import types
shop = types.SimpleNamespace(currency="EUR")
p = Patcher()
p.setattr(shop, "currency", "GBP")
assert shop.currency == "GBP"
p.undo()
assert shop.currency == "EUR"` },
        { name: 'patching twice still restores the original', code: py`import types
shop = types.SimpleNamespace(currency="EUR")
p = Patcher()
p.setattr(shop, "currency", "GBP")
p.setattr(shop, "currency", "USD")
p.undo()
assert shop.currency == "EUR"` },
        { name: 'an attribute that did not exist is removed', code: py`import types
shop = types.SimpleNamespace()
p = Patcher()
p.setattr(shop, "discount", 0.1)
assert shop.discount == 0.1
p.undo()
assert not hasattr(shop, "discount")` },
        { name: 'setitem restores existing keys and removes new ones', code: py`env = {"HOME": "/home/ada"}
p = Patcher()
p.setitem(env, "HOME", "/tmp")
p.setitem(env, "SHOP_MODE", "test")
assert env == {"HOME": "/tmp", "SHOP_MODE": "test"}
p.undo()
assert env == {"HOME": "/home/ada"}` },
      ],
      solution: { files: { 'main.py': py`_MISSING = object()


class Patcher:
    """A simplified pytest monkeypatch."""

    def __init__(self):
        self._undo = []

    def setattr(self, target, name, value):
        self._undo.append(("attr", target, name, getattr(target, name, _MISSING)))
        setattr(target, name, value)

    def setitem(self, mapping, key, value):
        self._undo.append(("item", mapping, key, mapping.get(key, _MISSING)))
        mapping[key] = value

    def undo(self):
        for kind, target, key, old in reversed(self._undo):
            if kind == "attr":
                if old is _MISSING:
                    delattr(target, key)
                else:
                    setattr(target, key, old)
            elif old is _MISSING:
                del target[key]
            else:
                target[key] = old
        self._undo.clear()
` + PATCHER_DEMO } },
      hints: ['Before changing anything, store the old value — use getattr(target, name, _MISSING) so a missing attribute is recorded too.', 'In undo(), iterate reversed(self._undo); if the old value is _MISSING, delete instead of restoring.'],
      whyAsked: 'Shows you understand why patching tools must record and reverse changes, and the sentinel pattern.',
      mistakes: ['Using None to mean "missing"', 'Undoing in forward order (double patches restore the wrong value)', 'Forgetting to clear the record after undo'],
      followUps: ['How would you add setenv/delenv?', 'Why does real monkeypatch treat class attributes specially?'],
      modelAnswer: 'Before every change I record what was there: the target, the name or key, and the old value — or a unique sentinel object if nothing existed, because None is a legitimate value. undo walks those records in reverse order: if the old value is the sentinel I delete the attribute or key, otherwise I put the old value back. Reverse order matters when the same thing is patched twice, so the original value is what survives. Finally I clear the records so undo is idempotent. That is essentially what pytest\'s monkeypatch does at teardown.',
    },
  ],

  takeaways: [
    'A fixture is named, reusable setup: tests request it by parameter name and pytest injects it (dependency injection).',
    'yield splits a fixture into setup and teardown; teardown runs even when the test fails, in reverse order of setup.',
    'Scope (function by default, class, module, package, session) sets how long a fixture lives; wide scopes must hold read-only or reset state.',
    'conftest.py shares fixtures with every test in its folder and below — never import it.',
    'Built-ins: tmp_path for files, monkeypatch for env vars/attributes, capsys and caplog for output.',
    'Standard-library equivalents: setUp/tearDown, setUpClass, addCleanup (LIFO), tempfile, mock.patch.dict, redirect_stdout.',
  ],
}

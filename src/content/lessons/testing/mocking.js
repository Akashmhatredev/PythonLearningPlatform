// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const PAYMENTS = py`"""payments.py - the real payment provider client (never call it from unit tests)."""


class PaymentGateway:
    def charge(self, card_token, amount_cents):
        """Charge a card and return a charge id such as 'ch_123'."""
        raise ConnectionError("the real gateway needs the network")

    def refund(self, charge_id):
        raise ConnectionError("the real gateway needs the network")
`

const RATES = py`"""rates.py - live exchange rates from a web API (unavailable in tests)."""


def get_exchange_rate(currency):
    raise ConnectionError(f"would fetch the {currency} rate over the network")
`

const ORDERS = py`"""orders.py - the code under test."""
import random
from datetime import datetime, timezone

from rates import get_exchange_rate


class PaymentDeclined(Exception):
    pass


def place_order(gateway, card_token, amount_eur, currency="EUR"):
    """Charge the customer and return a receipt dict."""
    rate = 1.0 if currency == "EUR" else get_exchange_rate(currency)
    amount_cents = round(amount_eur * rate * 100)
    try:
        charge_id = gateway.charge(card_token, amount_cents)
    except ConnectionError:
        raise PaymentDeclined("payment provider unreachable, please retry") from None
    return {
        "charge_id": charge_id,
        "amount_cents": amount_cents,
        "currency": currency,
        "order_number": f"ORD-{random.randint(1000, 9999)}",
        "placed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
`

const TESTS = py`import unittest
from datetime import datetime, timezone
from unittest import mock

from orders import PaymentDeclined, place_order
from payments import PaymentGateway

FIXED_NOW = datetime(2026, 3, 14, 9, 30, tzinfo=timezone.utc)


class TestPlaceOrder(unittest.TestCase):
    def setUp(self):
        # A mock that has the real class's methods and signatures:
        self.gateway = mock.create_autospec(PaymentGateway, instance=True)
        self.gateway.charge.return_value = "ch_001"        # stub: a canned answer

    def test_charges_the_card_in_cents(self):
        place_order(self.gateway, "tok_visa", 12.50)
        self.gateway.charge.assert_called_once_with("tok_visa", 1250)   # check the call

    def test_receipt_contains_the_charge_id(self):
        receipt = place_order(self.gateway, "tok_visa", 12.50)
        self.assertEqual(receipt["charge_id"], "ch_001")

    def test_unreachable_provider_becomes_payment_declined(self):
        self.gateway.charge.side_effect = ConnectionError("timeout")    # simulate a failure
        with self.assertRaises(PaymentDeclined):
            place_order(self.gateway, "tok_visa", 12.50)

    @mock.patch("orders.get_exchange_rate", return_value=0.85)          # patch where it is LOOKED UP
    def test_converts_other_currencies(self, fake_rate):
        receipt = place_order(self.gateway, "tok_visa", 10.00, currency="GBP")
        fake_rate.assert_called_once_with("GBP")
        self.assertEqual(receipt["amount_cents"], 850)

    def test_order_number_and_time_are_controlled(self):
        with (
            mock.patch("orders.random.randint", return_value=4242),
            mock.patch("orders.datetime") as fake_datetime,
        ):
            fake_datetime.now.return_value = FIXED_NOW
            receipt = place_order(self.gateway, "tok_visa", 5.00)
        self.assertEqual(receipt["order_number"], "ORD-4242")
        self.assertEqual(receipt["placed_at"], "2026-03-14T09:30:00+00:00")


if __name__ == "__main__":
    program = unittest.main(argv=["mocking-demo"], exit=False, verbosity=2)
    result = program.result
    print(f"{result.testsRun} tests, {len(result.failures)} failures, {len(result.errors)} errors")
`

const FROST_FN = py`import unittest
from unittest import mock


def send_frost_alerts(client, notifier, cities):
    """Warn every city below 0 °C; skip cities whose lookup fails. Return the cities alerted."""
    alerted = []
    for city in cities:
        try:
            temperature = client.get_temperature(city)
        except ConnectionError:
            continue
        if temperature < 0:
            notifier.send(city, f"Frost warning: {temperature}°C in {city}")
            alerted.append(city)
    return alerted

`

const FROST_STARTER = FROST_FN + py`
class TestFrostAlerts(unittest.TestCase):
    def test_warm_city_is_not_alerted(self):
        client = mock.Mock()
        client.get_temperature.return_value = 12
        self.assertEqual(send_frost_alerts(client, mock.Mock(), ["Rome"]), [])

    # TODO: add tests using return_value, side_effect and assert_called_once_with / assert_not_called


if __name__ == "__main__":
    unittest.main(argv=["frost"], exit=False, verbosity=2)
`

const FROST_SOLUTION = FROST_FN + py`
class TestFrostAlerts(unittest.TestCase):
    def setUp(self):
        self.client = mock.Mock()       # stub: we program its answers
        self.notifier = mock.Mock()     # mock: we check how it was called

    def test_warm_city_is_not_alerted(self):
        self.client.get_temperature.return_value = 12
        self.assertEqual(send_frost_alerts(self.client, self.notifier, ["Rome"]), [])
        self.notifier.send.assert_not_called()

    def test_freezing_city_gets_exactly_one_alert(self):
        self.client.get_temperature.return_value = -3
        alerted = send_frost_alerts(self.client, self.notifier, ["Oslo"])
        self.assertEqual(alerted, ["Oslo"])
        self.notifier.send.assert_called_once_with("Oslo", "Frost warning: -3°C in Oslo")

    def test_zero_degrees_is_not_frost(self):
        self.client.get_temperature.return_value = 0
        send_frost_alerts(self.client, self.notifier, ["Paris"])
        self.notifier.send.assert_not_called()

    def test_a_failed_lookup_is_skipped(self):
        self.client.get_temperature.side_effect = [ConnectionError("timeout"), -5]
        alerted = send_frost_alerts(self.client, self.notifier, ["Oslo", "Helsinki"])
        self.assertEqual(alerted, ["Helsinki"])
        self.notifier.send.assert_called_once_with("Helsinki", "Frost warning: -5°C in Helsinki")


if __name__ == "__main__":
    unittest.main(argv=["frost"], exit=False, verbosity=2)
`

// mutation check: swap send_frost_alerts for broken versions and run the learner's TestFrostAlerts
const FROST_CHECK = py`import unittest
real = ns["send_frost_alerts"]
def suite_passes_with(fake):
    ns["send_frost_alerts"] = fake
    try:
        outcome = unittest.TestResult()
        unittest.defaultTestLoader.loadTestsFromTestCase(TestFrostAlerts).run(outcome)
        return outcome.wasSuccessful()
    finally:
        ns["send_frost_alerts"] = real
def broken(is_frost=lambda t: t < 0, send=True, message="Frost warning: {t}°C in {city}", stop_on_error=False):
    def version(client, notifier, cities):
        alerted = []
        for city in cities:
            try:
                t = client.get_temperature(city)
            except ConnectionError:
                if stop_on_error:
                    return alerted
                continue
            if is_frost(t):
                if send:
                    notifier.send(city, message.format(t=t, city=city))
                alerted.append(city)
        return alerted
    return version
`

const RETRY_HEAD = py`import time


class PaymentDeclined(Exception):
    pass

`

const RETRY_DEMO = py`

class FlakyGateway:
    """Times out once, then works."""

    def __init__(self):
        self.calls = 0

    def charge(self, card_token, amount_cents):
        self.calls += 1
        if self.calls == 1:
            raise ConnectionError("timeout")
        return "ch_42"


waits = []
print(charge_with_retry(FlakyGateway(), "tok_visa", 500, sleep=waits.append))
print("waited:", waits)
`

const RETRY_STARTER = RETRY_HEAD + py`
def charge_with_retry(gateway, card_token, amount_cents, attempts=3, sleep=time.sleep):
    """Try gateway.charge up to attempts times, waiting 1, 2, 4... seconds between tries."""
    # TODO: retry on ConnectionError with back-off; give up with PaymentDeclined
    return gateway.charge(card_token, amount_cents)
` + RETRY_DEMO

const RETRY_SOLUTION = RETRY_HEAD + py`
def charge_with_retry(gateway, card_token, amount_cents, attempts=3, sleep=time.sleep):
    """Try gateway.charge up to attempts times, waiting 1, 2, 4... seconds between tries."""
    delay = 1
    for attempt in range(1, attempts + 1):
        try:
            return gateway.charge(card_token, amount_cents)
        except ConnectionError as error:
            if attempt == attempts:
                raise PaymentDeclined(f"gave up after {attempts} attempts") from error
            sleep(delay)
            delay *= 2
` + RETRY_DEMO

const STUB_DEMO = py`

rate = RecordingStub(return_value=0.85)
print(rate("GBP"), rate.calls)
`

export default {
  id: 'mocking',
  title: 'Mocking with unittest.mock',
  summary: 'Test doubles stand in for slow, random or external collaborators; unittest.mock builds them, records every call, and patch swaps them in where your code looks them up.',
  difficulty: 'intermediate',
  minutes: 60,
  prerequisites: ['testing-fundamentals', 'modules-and-imports'],
  related: ['pytest-basics', 'fixtures', 'tdd', 'modules-and-imports', 'dates-and-times', 'http-clients', 'clean-architecture', 'solid', 'protocols', 'polymorphism-and-duck-typing', 'decorators', 'context-managers', 'raising-exceptions'],
  tags: ['mock', 'mocking', 'unittest.mock', 'Mock', 'MagicMock', 'patch', 'return_value', 'side_effect', 'assert_called_once_with', 'call_args', 'autospec', 'create_autospec', 'spec', 'test double', 'stub', 'fake', 'spy', 'dependency injection', 'over-mocking', 'where to patch'],
  apis: [
    { name: 'Mock() / MagicMock()', summary: 'A flexible fake object: any attribute or call works and is recorded. MagicMock also supports magic methods (len, iteration, with).' },
    { name: 'mock.return_value', summary: 'What calling the mock returns.' },
    { name: 'mock.side_effect', summary: 'An exception to raise, an iterable of results (one per call), or a function to call instead.' },
    { name: 'mock.assert_called_once_with(*args, **kwargs)', summary: 'Fails unless the mock was called exactly once, with exactly these arguments. Also: assert_called_with, assert_any_call, assert_not_called, assert_has_calls.' },
    { name: 'mock.call_args / call_args_list / call_count', summary: 'The last call, every call (as call(...) objects) and how many calls there were.' },
    { name: 'patch("module.name", ...)', summary: 'Replace an object while a test runs (decorator or with block) and restore it afterwards. Target the name where it is looked up.' },
    { name: 'patch.object(obj, "attr") / patch.dict(d, values)', summary: 'Patch one attribute of an object you already have, or entries of a dict such as os.environ.' },
    { name: 'create_autospec(spec) / patch(..., autospec=True)', summary: 'A mock that copies the real object\'s attributes and signatures, so wrong calls and typos fail.' },
  ],
  docs: [
    { label: 'unittest.mock — mock object library', url: 'https://docs.python.org/3/library/unittest.mock.html' },
    { label: 'unittest.mock — where to patch', url: 'https://docs.python.org/3/library/unittest.mock.html#where-to-patch' },
    { label: 'unittest.mock — autospeccing', url: 'https://docs.python.org/3/library/unittest.mock.html#autospeccing' },
    { label: 'unittest.mock — getting started (examples)', url: 'https://docs.python.org/3/library/unittest.mock-examples.html' },
    { label: 'pytest — monkeypatch', url: 'https://docs.pytest.org/en/stable/how-to/monkeypatch.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Some code is hard to test because of who it talks to: a payment provider that charges real money, a weather API that's down half the time, the clock that never shows the same time twice, \`random\` that never gives the same order number. A **test double** is a stand-in for one of those collaborators, used only in tests — like a stunt double in a film.`,
    py`Python ships a library for building them: **\`unittest.mock\`**. A \`Mock\` object accepts any call, returns whatever you program it to, and **records** every call so you can check it afterwards. \`patch\` temporarily swaps a real object for a mock while a test runs and puts the real one back afterwards.`,
    { code: py`from unittest import mock

gateway = mock.Mock()
gateway.charge.return_value = "ch_001"            # program the answer

receipt = place_order(gateway, "tok_visa", 12.50)  # the code under test

gateway.charge.assert_called_once_with("tok_visa", 1250)   # check how it was used`, lang: 'python', static: true, title: 'the idea in four lines' },
    py`Everything in this lesson runs in the sandbox — \`unittest.mock\` is part of the standard library, and it works the same under pytest.`,
  ],
  why: [
    py`Unit tests must be **fast**, **deterministic** (same result every run) and **isolated** (see [testing fundamentals](lesson:testing-fundamentals)). Real networks are slow and flaky, real clocks and random numbers change every run, and real payment APIs cost money. Doubles remove all of that.`,
    py`Doubles also let you test situations that are hard to create for real: "what if the provider times out?", "what if it's 23:59 on New Year's Eve?", "what if the API returns an empty list?". One line — \`side_effect = ConnectionError()\` — and you're there.`,
    py`But mocks are a sharp tool. A test that mocks everything can pass while the real system is broken. Knowing **what** to replace, **where** to patch and **when to stop** is as important as the API.`,
  ],
  eli15: [
    py`Imagine testing a fire alarm. You don't set the kitchen on fire — you use a can of test smoke. The alarm can't tell the difference, and you can check it beeped.`,
    py`A mock is that can of test smoke for code. Your \`place_order\` function normally talks to a bank. In a test, you hand it a fake bank (a \`Mock\`) that always says "OK, charge ch_001". Afterwards you ask the fake bank: "were you asked to charge exactly 12.50 € — once?" The real bank is never contacted.`,
  ],
  analogy: {
    title: 'A flight simulator',
    body: [
      py`Pilots practise engine failures in a simulator, not in a real plane. The simulator can make any situation happen on demand (storm, engine fire), never hurts anyone, and records every move the pilot makes for the instructor to review.`,
      py`Test doubles are your code's simulator: you script the world's responses (\`return_value\`, \`side_effect\`), the code under test can't tell the difference, and the mock records every call for your assertions. And just as pilots still fly real planes before getting their licence, you still need a few real integration tests.`,
    ],
    mapping: [
      ['the simulator instead of a real plane', 'a test double instead of the real collaborator'],
      ['scripting a storm or engine fire', 'side_effect = ConnectionError("timeout")'],
      ['normal flight conditions', 'return_value = "ch_001"'],
      ['the instructor reviewing the recording', 'assert_called_once_with(...), call_args_list'],
      ['a simulator built from the real plane\'s specs', 'create_autospec(PaymentGateway)'],
      ['real flight hours still required', 'a few integration tests against the real thing'],
    ],
  },
  visual: {
    type: 'code-tracer',
    title: 'A Mock records calls and plays back answers',
    props: {
      code: py`from unittest.mock import Mock

gateway = Mock()
gateway.charge.return_value = "ch_001"        # stub behaviour

charge_id = gateway.charge("tok_visa", 1250)  # any call is accepted...
print(charge_id)
print(gateway.charge.call_args)               # ...and recorded
print(gateway.charge.call_count)

gateway.charge.side_effect = [ConnectionError("timeout"), "ch_002"]
for attempt in range(2):
    try:
        print("attempt", attempt, "->", gateway.charge("tok_visa", 1250))
    except ConnectionError as error:
        print("attempt", attempt, "-> error:", error)

gateway.charge.assert_called_with("tok_visa", 1250)
print("total calls:", gateway.charge.call_count)
`,
      notes: {
        3: '`Mock()` creates attributes on demand: `gateway.charge` springs into existence the first time you touch it, as another Mock.',
        4: '`return_value` is what calling the mock gives back.',
        6: 'The call succeeds whatever the arguments — and the mock remembers them.',
        8: '`call_args` is the **last** call: `call(\'tok_visa\', 1250)`.',
        11: 'A list as `side_effect` gives one result per call; an exception in the list is **raised** instead of returned.',
        18: '`assert_called_with` checks the most recent call. It raises `AssertionError` with both calls shown if they differ.',
      },
    },
    alt: 'Step-by-step trace. A Mock named gateway gets charge.return_value set to ch_001. Calling gateway.charge returns ch_001, and call_args shows the recorded call with count 1. Then side_effect is set to a list: the first call raises ConnectionError timeout, the second returns ch_002. assert_called_with passes and the total call count is 3.',
  },
  syntax: [
    py`#### The vocabulary of test doubles`,
    py`| double | what it is | example |
|---|---|---|
| **dummy** | passed in but never used | \`place_order(gateway, None, ...)\` for an unused logger |
| **stub** | returns canned answers | exchange rate always \`0.85\` |
| **spy** | a real-ish object that records calls | \`Mock(wraps=real_function)\` |
| **mock** | a double you **check** afterwards | \`gateway.charge.assert_called_once_with(...)\` |
| **fake** | a simpler *working* implementation | an in-memory repository or email outbox |`,
    py`A \`unittest.mock.Mock\` can play any of these roles. "Mocking" in everyday speech means using any of them.`,
    py`#### Programming a Mock`,
    { code: py`from unittest.mock import Mock, call

rates = Mock()
rates.get.return_value = 0.85                    # every call returns 0.85
rates.get.side_effect = ConnectionError("down")  # ...or every call raises
rates.get.side_effect = [0.85, 0.86, 0.84]       # ...or one result per call (then StopIteration)
rates.get.side_effect = lambda currency: {"GBP": 0.85}[currency]   # ...or compute it
rates.get.side_effect = None                     # back to using return_value

rates.get("GBP")
rates.get.assert_called_once_with("GBP")
rates.get.assert_not_called()                    # (would fail now)
print(rates.get.call_count, rates.get.call_args, rates.get.call_args_list)
rates.get.assert_has_calls([call("GBP")])`, lang: 'python', static: true, title: 'return_value, side_effect and assertions' },
    py`\`MagicMock\` is a \`Mock\` that also pre-configures **magic methods**, so it works with \`len()\`, iteration, \`with\` blocks and comparisons. \`patch\` creates a \`MagicMock\` by default. A plain \`Mock\` in a \`with\` statement raises \`TypeError\`.`,
    py`#### patch: swap something in, put it back afterwards`,
    { code: py`from unittest import mock


@mock.patch("orders.get_exchange_rate", return_value=0.85)     # as a decorator
def test_converts_gbp(fake_rate):
    ...


def test_converts_usd():
    with mock.patch("orders.get_exchange_rate") as fake_rate:  # as a context manager
        fake_rate.return_value = 1.08
        ...                                                     # restored after the block


@mock.patch("orders.send_email")
@mock.patch("orders.get_exchange_rate")
def test_both(fake_rate, fake_email):     # bottom decorator -> FIRST argument
    ...


def test_config():
    with mock.patch.object(settings, "TAX_RATE", 0.2), \
         mock.patch.dict("os.environ", {"SHOP_MODE": "test"}):
        ...`, lang: 'python', static: true, title: 'patch, patch.object, patch.dict' },
    py`#### Where to patch: where it's looked up`,
    py`\`patch("a.b")\` replaces the name \`b\` **inside module \`a\`**. So patch the name in the module that **uses** it:`,
    py`- \`orders.py\` does \`from rates import get_exchange_rate\` → it has its *own* name \`get_exchange_rate\` → patch \`"orders.get_exchange_rate"\`.
- \`orders.py\` does \`import rates\` and calls \`rates.get_exchange_rate(...)\` → it looks the function up on the \`rates\` module at call time → patch \`"rates.get_exchange_rate"\`.`,
    py`#### Autospec: mocks that know the real API`,
    { code: py`from unittest import mock

gateway = mock.create_autospec(PaymentGateway, instance=True)
gateway.charge("tok_visa")          # TypeError: missing a required argument: 'amount_cents'
gateway.chrage("tok_visa", 1250)    # AttributeError: Mock object has no attribute 'chrage'

@mock.patch("orders.get_exchange_rate", autospec=True)   # same idea for patch
def test_rate(fake_rate): ...`, lang: 'python', static: true, title: 'create_autospec' },
    py`A plain \`Mock\` accepts *anything*, so a test keeps passing after someone renames \`charge\` or adds a parameter — the mock and the real class have silently drifted apart. \`spec=Class\` restricts attributes; **autospec** also checks call signatures, recursively.`,
    { callout: 'tip', title: 'Async code', text: py`For \`async def\` collaborators use \`AsyncMock\` (awaiting it returns \`return_value\`); \`patch\` and \`create_autospec\` pick it automatically for async functions. pytest users often use the \`mocker\` fixture from the pytest-mock plugin — the same API, undone automatically after each test.` },
  ],
  walkthrough: {
    title: 'Reading the order tests',
    lang: 'python',
    code: TESTS,
    intro: py`This is \`main.py\` in the playground; the code under test is \`orders.py\`.`,
    steps: [
      { lines: [12, 15], text: py`Every test gets a fresh **autospecced** gateway: it has \`charge\` and \`refund\` with the real signatures, so a wrong call fails loudly. \`return_value\` makes it a stub.` },
      { lines: [17, 19], text: py`The mock is checked afterwards: exactly one charge, of **1250 cents**. If someone forgets the euros→cents conversion, this fails with *Expected / Actual* lines.` },
      { lines: [25, 28], text: py`\`side_effect\` makes the call **raise**. One line simulates a network outage, so we can test the error path deterministically.` },
      { lines: [30, 34], text: py`\`orders.py\` imported the function with \`from rates import ...\`, so the name to patch is \`orders.get_exchange_rate\`. The decorator passes the mock in as an extra argument.` },
      { lines: [36, 44], text: py`Randomness and time, controlled. \`datetime.datetime.now\` can't be patched (it's a built-in type), so we replace the **name** \`datetime\` inside \`orders\`. The parenthesised multi-\`with\` needs Python 3.10+.` },
    ],
  },
  playground: {
    title: 'Testing an order service with mocks',
    objective: 'Run the tests, patch the wrong target to see why "where it is looked up" matters, then add a retry with side_effect sequences.',
    files: { 'main.py': TESTS, 'orders.py': ORDERS, 'payments.py': PAYMENTS, 'rates.py': RATES },
    expected: py`unittest's report (on stderr) lists 5 tests as \`ok\`, then the summary line:

\`\`\`text
5 tests, 0 failures, 0 errors
\`\`\`

No network was used: \`payments.py\` and \`rates.py\` raise \`ConnectionError\` if anything calls the real thing.`,
    experiments: [
      {
        id: 'wrong-target',
        task: py`Change the patch target on \`test_converts_other_currencies\` from \`"orders.get_exchange_rate"\` to \`"rates.get_exchange_rate"\`. Run it. Which exception appears, and why? (Change it back afterwards.)`,
        hint: py`Read \`orders.py\` line 5: \`from rates import get_exchange_rate\`. Which module's name does \`place_order\` use?`,
        tests: [{ name: 'the currency test now errors', code: py`broken = [str(test) for test, _ in result.errors + result.failures]
assert any("test_converts_other_currencies" in name for name in broken), 'Patch "rates.get_exchange_rate" instead and run again'` }],
        explain: py`\`from rates import get_exchange_rate\` copied a reference into \`orders\`' own namespace when it was imported. Patching \`rates.get_exchange_rate\` replaced the name in \`rates\` only; \`orders\` still pointed at the real function, which tried the "network" and raised \`ConnectionError\`. Patch the name **where it is looked up**. Now change it back.`,
      },
      {
        id: 'retry',
        task: py`The provider sometimes times out once and then works. Make \`place_order\` (in \`orders.py\`) **retry the charge once** after a \`ConnectionError\`, and only raise \`PaymentDeclined\` if the second attempt fails too. Add a test using \`self.gateway.charge.side_effect = [ConnectionError("timeout"), "ch_002"]\`.`,
        hint: py`Wrap the charge in a loop of two attempts, or call it again inside the \`except\` block in its own \`try\`. The existing test where *every* call raises must still pass.`,
        tests: [
          { name: 'one timeout, then success', code: py`from unittest import mock
gateway = mock.Mock()
gateway.charge.side_effect = [ConnectionError("timeout"), "ch_002"]
receipt = place_order(gateway, "tok_visa", 1.00)
assert receipt["charge_id"] == "ch_002"
assert gateway.charge.call_count == 2` },
          { name: 'two timeouts still raise PaymentDeclined', code: py`from unittest import mock
gateway = mock.Mock()
gateway.charge.side_effect = ConnectionError("timeout")
with raises(PaymentDeclined):
    place_order(gateway, "tok_visa", 1.00)
assert gateway.charge.call_count == 2, f'expected 2 attempts, got {gateway.charge.call_count}'` },
        ],
        explain: py`A \`side_effect\` list scripts a *sequence* of behaviours — impossible to reproduce reliably with a real network, trivial with a mock. \`call_count\` proves the retry happened exactly once. (Production code would also wait between attempts — see the second exercise.)`,
      },
      {
        id: 'not-called',
        task: py`Add a test \`test_eur_orders_do_not_look_up_a_rate\` that patches \`orders.get_exchange_rate\`, places a **EUR** order, and asserts the rate function was **not** called.`,
        hint: py`Use \`@mock.patch("orders.get_exchange_rate")\` and \`fake_rate.assert_not_called()\`.`,
        tests: [{ name: 'the test exists and the suite passes', code: py`import unittest
assert "test_eur_orders_do_not_look_up_a_rate" in unittest.defaultTestLoader.getTestCaseNames(TestPlaceOrder), 'Add test_eur_orders_do_not_look_up_a_rate to TestPlaceOrder'
assert result.wasSuccessful(), 'Some tests fail — did you put the patch target back?'` }],
        explain: py`Checking that something did **not** happen is a classic mock assertion — here it guards against a wasted (and, in real life, slow) API call. Use it sparingly: asserting every internal call ties tests to implementation details.`,
      },
      {
        id: 'immutable-datetime',
        task: py`In \`test_order_number_and_time_are_controlled\`, change \`mock.patch("orders.datetime")\` to \`mock.patch("datetime.datetime.now")\`. Run it and read the error. Then put it back.`,
        explain: py`You get \`TypeError: cannot set 'now' attribute of immutable type 'datetime.datetime'\`: built-in (C) types can't have attributes replaced. Patch the name \`datetime\` in the module under test, or — better design — pass a clock in (\`place_order(..., now=...)\`). Third-party libraries such as freezegun and time-machine exist for freezing time across a whole test.`,
      },
    ],
  },
  animation: {
    type: 'concept-diagram',
    title: 'Patch where it is looked up',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'real', label: 'real get_exchange_rate', note: 'function object (network)', x: 600, y: 70, tone: 'red' },
        { id: 'rates', label: 'rates namespace', note: 'name: get_exchange_rate', x: 160, y: 70, tone: 'yellow' },
        { id: 'orders', label: 'orders namespace', note: 'name: get_exchange_rate', x: 160, y: 230, tone: 'yellow' },
        { id: 'fake', label: 'MagicMock', note: 'return_value = 0.85', x: 600, y: 230, tone: 'blue' },
      ],
      edges: [
        { id: 'r-real', from: 'rates', to: 'real', label: 'defined here' },
        { id: 'o-real', from: 'orders', to: 'real', label: 'from rates import …' },
        { id: 'r-fake', from: 'rates', to: 'fake', label: 'patch("rates.…")', dashed: true },
        { id: 'o-fake', from: 'orders', to: 'fake', label: 'patch("orders.…")' },
      ],
      steps: [
        { focus: ['rates', 'real'], edges: ['r-real'], text: py`\`rates.py\` defines the function: the name \`get_exchange_rate\` in the \`rates\` module points at the real function object.` },
        { focus: ['orders', 'real'], edges: ['r-real', 'o-real'], text: py`\`from rates import get_exchange_rate\` creates a **second name**, in \`orders\`, pointing at the same object — just like \`b = a\` (see [variables](lesson:variables-and-names)).` },
        { focus: ['rates', 'fake'], edges: ['r-fake', 'o-real'], text: py`\`patch("rates.get_exchange_rate")\` re-points only the name in \`rates\`. \`place_order\` looks the function up in **orders**, still finds the real one, and hits the network.` },
        { focus: ['orders', 'fake'], edges: ['r-real', 'o-fake'], text: py`\`patch("orders.get_exchange_rate")\` re-points the name \`place_order\` actually uses. The mock answers \`0.85\`.` },
        { focus: ['orders', 'real'], edges: ['r-real', 'o-real'], text: py`When the test (or \`with\` block) ends, \`patch\` puts the original reference back — the next test sees the real function again.` },
      ],
    },
    alt: 'Diagram with two module namespaces, rates and orders, each holding the name get_exchange_rate, a real function object and a MagicMock. Initially both names point to the real function. Patching rates.get_exchange_rate moves only the rates arrow to the mock, so orders still uses the real function. Patching orders.get_exchange_rate moves the orders arrow to the mock. After the test the arrow is restored.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A \`Mock\` is an ordinary Python object with a clever \`__getattr__\`: touching an attribute that doesn't exist creates a **child mock**, stores it, and returns it. That's why \`gateway.charge.return_value = ...\` works without defining \`charge\` first. Calling a mock appends a \`call(...)\` record to its history and then returns \`return_value\` (or applies \`side_effect\`).`,
      py`\`patch\` is a context manager / decorator that does three things: imports the target module, saves the current value of the attribute and sets the replacement, and on exit **restores** the saved value — even if the test failed.`,
    ],
    technical: [
      py`- **Names, not objects.** \`patch\` never changes the real function; it rebinds a *name* in one namespace (\`setattr(module, "name", mock)\`). Any other name already bound to the original — like the one created by \`from x import y\` — is untouched. That's the whole "where to patch" rule.
- **Spec and autospec.** \`Mock(spec=Gateway)\` only allows attributes that exist on \`Gateway\` (typos raise \`AttributeError\`). \`create_autospec\` goes further: every method becomes a mock with the real **signature**, checked on each call with \`inspect.signature(...).bind\` — giving \`TypeError: missing a required argument: 'amount_cents'\`.
- **Assertion-name guard.** Because any attribute is valid on a plain mock, a misspelt assertion like \`assert_called_once_wiht\` used to pass silently. Mock now raises \`AttributeError: '...' is not a valid assertion\` for names that look like misspelt assertions (including \`called_once_with\` without the \`assert_\` prefix in current Python); a spec makes typos impossible altogether.
- **MagicMock** pre-configures supported dunder methods: \`len(m)\` is 0, \`iter(m)\` is empty, \`with m as x\` gives \`m.__enter__.return_value\`, \`bool(m)\` is True.`,
      { callout: 'note', title: 'Comparing calls', text: py`\`call("tok_visa", 1250)\` compares positional and keyword arguments separately: a mock called as \`charge(card_token="tok_visa", amount_cents=1250)\` doesn't equal \`call("tok_visa", 1250)\` — unless it is autospecced, in which case calls are normalised against the signature.` },
    ],
    production: [
      py`- **Prefer injection over patching.** Passing \`gateway\`, \`clock\` or \`rng\` in as arguments (see [clean architecture](lesson:clean-architecture) and [SOLID](lesson:solid)) makes tests need no \`patch\` at all, and makes dependencies visible. Patch is for code you can't easily restructure.
- **Don't mock what you don't own.** Wrap third-party clients (an HTTP library, a cloud SDK) in a small adapter class of your own; mock *the adapter* in unit tests and test the adapter itself against the real service (or a recorded response) in a few integration tests ([HTTP clients](lesson:http-clients)).
- **Always spec.** Use \`create_autospec\` / \`autospec=True\` so tests break when the real interface changes.
- **Prefer fakes for rich collaborators.** An in-memory repository with real behaviour is often clearer than a mock with ten configured return values.
- **Mock at the boundary only.** Network, clock, randomness, file system, other services. Mocking your own small helpers ties tests to how the code is written, so every refactor breaks them — that's **over-mocking**.`,
    ],
  },
  mistakes: [
    {
      title: 'Patching where the object is defined instead of where it is used',
      wrong: { code: py`# orders.py:  from rates import get_exchange_rate
@mock.patch("rates.get_exchange_rate", return_value=0.85)
def test_gbp(fake_rate):
    place_order(gateway, "tok_visa", 10.00, currency="GBP")   # real function still called`, lang: 'python', static: true },
      right: { code: py`@mock.patch("orders.get_exchange_rate", return_value=0.85)
def test_gbp(fake_rate):
    place_order(gateway, "tok_visa", 10.00, currency="GBP")`, lang: 'python', static: true },
      explanation: py`\`from rates import ...\` gives \`orders\` its own name for the function. Patch that name. (If \`orders\` did \`import rates\` and called \`rates.get_exchange_rate\`, patching \`rates.get_exchange_rate\` would be right.)`,
    },
    {
      title: 'An unspecced mock that drifts from the real API',
      wrong: { code: py`gateway = mock.Mock()
gateway.charge.return_value = "ch_001"
# Real signature changed to charge(card_token, amount_cents, currency) -
# the test still passes, production crashes.`, lang: 'python', static: true },
      right: { code: py`gateway = mock.create_autospec(PaymentGateway, instance=True)
gateway.charge.return_value = "ch_001"
# Wrong calls now raise TypeError in the test.`, lang: 'python', static: true },
      explanation: py`A bare \`Mock\` accepts any attribute and any arguments, so it can't notice that the real interface moved on. Autospec keeps the double honest.`,
    },
    {
      title: 'Asserting every internal call (over-mocking)',
      wrong: { code: py`@mock.patch("orders.round")
@mock.patch("orders._format_receipt")
def test_place_order(fake_format, fake_round):
    place_order(gateway, "tok_visa", 12.50)
    fake_round.assert_called_once_with(1250.0)
    fake_format.assert_called_once()`, lang: 'python', static: true },
      right: { code: py`def test_place_order_charges_cents_and_returns_receipt():
    receipt = place_order(gateway, "tok_visa", 12.50)
    gateway.charge.assert_called_once_with("tok_visa", 1250)
    assert receipt["amount_cents"] == 1250`, lang: 'python', static: true },
      explanation: py`Mocking your own helpers tests *how* the function works, not *what* it does: any refactor breaks the test even when behaviour is unchanged. Mock only the boundary (the gateway) and assert on outcomes.`,
    },
    {
      title: 'Mixing up the order of stacked patch decorators',
      wrong: { code: py`@mock.patch("orders.send_email")
@mock.patch("orders.get_exchange_rate")
def test_x(fake_email, fake_rate):     # names swapped!
    fake_rate.return_value = 0.85      # actually configures send_email`, lang: 'python', static: true },
      right: { code: py`@mock.patch("orders.send_email")
@mock.patch("orders.get_exchange_rate")
def test_x(fake_rate, fake_email):     # bottom decorator -> first argument
    fake_rate.return_value = 0.85`, lang: 'python', static: true },
      explanation: py`Decorators apply bottom-up, so the patch closest to the function supplies the first argument. When it gets confusing, use \`with mock.patch(...) as name:\` blocks instead.`,
    },
  ],
  debugging: [
    {
      symptom: py`ConnectionError: would fetch the GBP rate over the network  (inside a test that patches it)`,
      cause: py`The patch target isn't the name the code uses — usually \`from x import y\` in the module under test while you patched \`x.y\`.`,
      fix: py`Patch \`"module_under_test.y"\`. Print \`module_under_test.y\` inside the test: it should show a \`<MagicMock ...>\`.`,
    },
    {
      symptom: py`TypeError: cannot set 'now' attribute of immutable type 'datetime.datetime'`,
      cause: py`You tried to patch a method on a built-in (C) type. Their attributes are read-only.`,
      fix: py`Patch the name \`datetime\` in the module under test (\`patch("orders.datetime")\`), or inject a clock function.`,
    },
    {
      symptom: py`AssertionError: expected call not found.  Expected: charge('tok_visa', 1250)  Actual: charge('tok_visa', 125000)`,
      cause: py`The mock was called, but with different arguments — here euros were converted to cents twice.`,
      fix: py`Read Expected vs Actual; decide whether the code or the test's expectation is wrong. \`call_args_list\` shows every call.`,
    },
    {
      symptom: py`StopIteration  (raised from a mock call)`,
      cause: py`A list \`side_effect\` ran out: the mock was called more times than there are items.`,
      fix: py`Add enough items, or check \`call_count\` — the code may be calling more often than you think (an unexpected retry loop?).`,
    },
    {
      symptom: py`AttributeError: 'assert_called_once_wiht' is not a valid assertion. Use a spec for the mock if 'assert_called_once_wiht' is meant to be an attribute.`,
      cause: py`A typo in an assertion method name. Mock refuses names that look like misspelt assertions.`,
      fix: py`Fix the spelling — and use \`create_autospec\` so typos in *any* attribute fail.`,
    },
  ],
  bestPractices: [
    'Replace only boundaries: network, clock, randomness, file system, other services. Use real objects for your own logic.',
    'Prefer dependency injection (pass gateway, clock, rng in) over patch; patch what you cannot inject.',
    'Patch the name where it is looked up, and keep patches as narrow and short-lived as possible.',
    'Use create_autospec / autospec=True so mocks fail when the real interface changes.',
    'Assert on outcomes first; add call assertions only for calls that are the behaviour (charging a card, sending an email).',
    'Wrap third-party clients in your own adapter; mock the adapter, integration-test the adapter.',
    'Keep a few integration tests against real (or recorded) services — mocks prove nothing about the real thing.',
  ],
  useCases: [
    'Payment, email and SMS providers: never call them from unit tests; assert the request you would send.',
    'Simulating timeouts, 500 errors and retries with side_effect.',
    'Freezing time and randomness for receipts, tokens and scheduling logic.',
    'Testing code that uses an HTTP API without the network (a stubbed client or adapter).',
    'Checking that something was NOT done: no email for a failed order, no API call when a cache hit.',
  ],
  comparison: {
    title: 'Mock vs MagicMock vs autospec vs a hand-written fake',
    headers: ['', 'Mock()', 'MagicMock()', 'create_autospec(Real)', 'fake class'],
    rows: [
      ['any attribute allowed', 'yes', 'yes', 'only real ones', 'only what you write'],
      ['signature checked', 'no', 'no', 'yes', 'yes (it is real code)'],
      ['magic methods (len, with, iter)', 'no', 'yes', 'as on the real class', 'if you write them'],
      ['records calls', 'yes', 'yes', 'yes', 'only if you add it'],
      ['real behaviour', 'none', 'none', 'none', 'simplified but working'],
      ['best for', 'quick stubs', 'objects used with with/len/iter', 'most unit-test doubles', 'rich collaborators (repositories, outboxes)'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'mocking-q1',
      type: 'mcq',
      prompt: py`A test replaces the exchange-rate lookup with a double that always returns \`0.85\`, and then only checks the order's total. What kind of test double is that?`,
      options: [
        'A stub',
        { text: 'A mock', why: 'A mock is a double you check afterwards (how it was called). This test never asserts on the double.' },
        { text: 'A fake', why: 'A fake is a simplified but working implementation, like an in-memory database.' },
        { text: 'A dummy', why: 'A dummy is passed in but never used. This one is used: it supplies the rate.' },
      ],
      answer: 0,
      explanation: py`It provides **canned answers** and isn't inspected — that's a stub. The same \`Mock\` object becomes a "mock" the moment you assert on its calls.`,
    },
    {
      id: 'mocking-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from unittest.mock import Mock

fetch = Mock(side_effect=[10, ValueError("bad"), 30])
print(fetch())
try:
    fetch()
except ValueError as error:
    print("error:", error)
print(fetch(), fetch.call_count)`,
      answer: '10\nerror: bad\n30 3',
      accept: ['10\nerror: bad\n30 3'],
      explanation: py`A list \`side_effect\` supplies one result per call; an exception **instance** in the list is raised instead of returned. Every call is counted, including the one that raised — 3 in total. A fourth call would raise \`StopIteration\`.`,
    },
    {
      id: 'mocking-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from unittest.mock import Mock

m = Mock(return_value=5)
print(m(1, 2) + m())
print(m.call_args)
print(m.call_count)`,
      options: [
        { text: '10 / call(1, 2) / 2', why: 'call_args is the MOST RECENT call, which had no arguments.' },
        '10 / call() / 2',
        { text: '5 / call() / 1', why: 'The mock is called twice in the first line; both calls return 5.' },
        { text: 'TypeError: a Mock cannot be added', why: 'm(...) returns its return_value, the int 5, so this is 5 + 5.' },
      ],
      answer: 1,
      explanation: py`Both calls return \`5\`, so the sum is \`10\`. \`call_args\` holds only the **last** call (\`call()\`); use \`call_args_list\` for all of them.`,
    },
    {
      id: 'mocking-q4',
      type: 'bug',
      prompt: py`\`orders.py\` contains \`from rates import get_exchange_rate\`. This test still hits the real (network) function. Click the line to fix.`,
      code: py`from unittest import mock

@mock.patch("rates.get_exchange_rate", return_value=0.85)
def test_converts_gbp(fake_rate):
    receipt = place_order(gateway, "tok_visa", 10.00, currency="GBP")
    assert receipt["amount_cents"] == 850`,
      answerLine: 3,
      explanation: py`\`orders\` has its own name for the function, created at import time. Patch \`"orders.get_exchange_rate"\` — the name \`place_order\` looks up.`,
    },
    {
      id: 'mocking-q5',
      type: 'fill',
      prompt: 'Make the gateway answer "ch_001", check it was charged once with 1250 cents, then make the next call raise a timeout.',
      code: py`gateway = mock.create_autospec(PaymentGateway, instance=True)
gateway.charge.___ = "ch_001"
place_order(gateway, "tok_visa", 12.50)
gateway.charge.___("tok_visa", 1250)
gateway.charge.___ = ConnectionError("timeout")`,
      answer: [['return_value'], ['assert_called_once_with'], ['side_effect']],
      explanation: py`\`return_value\` sets the canned answer, \`assert_called_once_with\` checks the single call's arguments, and \`side_effect\` set to an exception makes the next call raise it.`,
    },
    {
      id: 'mocking-q6',
      type: 'mcq',
      prompt: py`What does \`create_autospec(PaymentGateway, instance=True)\` give you that \`Mock()\` doesn't? (Select all that apply.)`,
      options: [
        'Calling a method with the wrong arguments raises TypeError',
        'Accessing a method that does not exist (a typo) raises AttributeError',
        { text: 'The real charge() method runs, but its calls are recorded', why: 'That is a spy (Mock(wraps=...)). Autospec copies the interface, not the behaviour.' },
        { text: 'It makes network calls safe to run in tests', why: 'No real code runs at all — and that is not a "safe network" feature.' },
      ],
      answer: [0, 1],
      explanation: py`Autospec builds a mock from the real object's attributes and signatures, so tests break when code calls something that doesn't exist or calls it wrongly — protecting against mocks drifting from reality.`,
    },
    {
      id: 'mocking-q7',
      type: 'short',
      prompt: 'What is over-mocking, and why is it dangerous?',
      answer: py`Over-mocking is replacing so much (often your own helper functions and internal calls) that the test only checks how the code is wired, not what it does. Such tests break on every harmless refactor, yet can stay green while the real system is broken — for example when a mocked API returns a shape the real one never does. Mock only boundaries (network, clock, randomness, external services), assert on outcomes, use autospec, and keep some integration tests.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'frost-alert-tests',
      title: 'Test the frost alerts with mocks',
      difficulty: 'intermediate',
      prompt: py`\`send_frost_alerts(client, notifier, cities)\` is **correct**: for each city it calls \`client.get_temperature(city)\`; if the temperature is **below 0** it calls \`notifier.send(city, "Frost warning: -3°C in Oslo")\` (with that city's values) and adds the city to the returned list. A city whose lookup raises \`ConnectionError\` is skipped.

Add test methods to \`TestFrostAlerts\` using \`mock.Mock()\` for the client and notifier (\`return_value\`, \`side_effect\`, \`assert_called_once_with\`, \`assert_not_called\`). The checker runs your suite against the real function — **all tests must pass** — and against broken versions; **each must make at least one test fail**:

- one that also alerts at **exactly 0 °C**;
- one that returns the right cities but **never calls** \`notifier.send\`;
- one that sends the **wrong message** (\`"Frost in Oslo"\`);
- one that **stops at the first failed lookup** instead of skipping it.`,
      files: { 'main.py': FROST_STARTER },
      hints: [
        'A freezing city needs two checks: the returned list, and notifier.send.assert_called_once_with("Oslo", "Frost warning: -3°C in Oslo").',
        'For 0 °C: return_value = 0, then notifier.send.assert_not_called(). For the failed lookup: side_effect = [ConnectionError("timeout"), -5] with two cities.',
        'self.client.get_temperature.side_effect = [ConnectionError("timeout"), -5]\nalerted = send_frost_alerts(self.client, self.notifier, ["Oslo", "Helsinki"])\nself.assertEqual(alerted, ["Helsinki"])',
      ],
      solution: {
        explanation: py`The client is a **stub** (we script its answers with \`return_value\` and \`side_effect\`), the notifier is a **mock** (we check how it was called). Sending the alert *is* the behaviour, so asserting on \`notifier.send\` is appropriate here — the exact-message assertion catches the wrong-text version, \`assert_not_called\` at 0 °C catches the boundary bug, and the \`side_effect\` list makes the first city's lookup fail deterministically so the "stops early" version is caught. No network, no randomness, and each test takes microseconds.`,
        files: { 'main.py': FROST_SOLUTION },
      },
      tests: [
        { name: 'all your tests pass on the correct function', code: FROST_CHECK + py`
assert suite_passes_with(real), 'At least one of your tests fails on the CORRECT function'` },
        { name: 'catches alerting at exactly 0 °C', code: FROST_CHECK + py`
assert not suite_passes_with(broken(is_frost=lambda t: t <= 0)), 'Test that 0 °C sends no alert (assert_not_called)'` },
        { name: 'catches a version that never sends', code: FROST_CHECK + py`
assert not suite_passes_with(broken(send=False)), 'Assert that notifier.send was called for a freezing city'` },
        { name: 'catches the wrong message', code: FROST_CHECK + py`
assert not suite_passes_with(broken(message="Frost in {city}")), 'Use assert_called_once_with with the exact message'` },
        { name: 'catches stopping at the first failed lookup', code: FROST_CHECK + py`
assert not suite_passes_with(broken(stop_on_error=True)), 'Use side_effect = [ConnectionError(...), -5] with two cities and check the second is alerted'` },
      ],
    },
    {
      id: 'retry-with-backoff',
      title: 'Retry with back-off — tested without waiting',
      difficulty: 'intermediate',
      prompt: py`Implement \`charge_with_retry(gateway, card_token, amount_cents, attempts=3, sleep=time.sleep)\`:

- call \`gateway.charge(card_token, amount_cents)\` and return its result as soon as one call succeeds;
- on \`ConnectionError\`, call \`sleep(delay)\` and try again, with delays **1, 2, 4, …** seconds (doubling) — sleep only *between* attempts, never after the last one;
- after \`attempts\` failures, raise \`PaymentDeclined\` **chained** from the last error (\`raise ... from error\`);
- any other exception (e.g. \`ValueError\` for an invalid card) propagates immediately, without retrying.

The tests pass a \`Mock\` as \`sleep\`, so they check the delays without actually waiting. Injecting \`sleep\` as a parameter is what makes that possible.`,
      files: { 'main.py': RETRY_STARTER },
      hints: [
        'Loop for attempt in range(1, attempts + 1) with a try/except ConnectionError around the charge.',
        'In the except block: if this was the last attempt, raise PaymentDeclined(...) from error; otherwise sleep(delay) and double the delay.',
        'Don\'t catch Exception — only ConnectionError — so ValueError escapes on the first call.',
      ],
      solution: {
        explanation: py`The loop returns on the first success, so a healthy gateway is called once and \`sleep\` never runs. Only \`ConnectionError\` is caught: other errors mean "retrying won't help" and escape immediately. The last-attempt check happens *before* sleeping, so there is no pointless wait at the end, and \`from error\` keeps the original cause in the traceback ([exception chaining](lesson:raising-exceptions)). Because \`sleep\` is a parameter (dependency injection), tests replace it with a \`Mock\` and assert \`call_args_list == [call(1), call(2)]\` in microseconds — no \`patch("time.sleep")\` needed.`,
        files: { 'main.py': RETRY_SOLUTION },
      },
      tests: [
        { name: 'returns at once when the first charge succeeds', code: py`from unittest import mock
gateway, sleep = mock.Mock(), mock.Mock()
gateway.charge.return_value = "ch_1"
assert charge_with_retry(gateway, "tok", 500, sleep=sleep) == "ch_1"
gateway.charge.assert_called_once_with("tok", 500)
sleep.assert_not_called()` },
        { name: 'retries after a timeout, waiting 1 second', code: py`from unittest import mock
gateway, sleep = mock.Mock(), mock.Mock()
gateway.charge.side_effect = [ConnectionError("timeout"), "ch_2"]
assert charge_with_retry(gateway, "tok", 500, sleep=sleep) == "ch_2"
assert gateway.charge.call_count == 2
sleep.assert_called_once_with(1)` },
        { name: 'backs off 1, then 2 seconds', code: py`from unittest import mock
gateway, sleep = mock.Mock(), mock.Mock()
gateway.charge.side_effect = [ConnectionError(), ConnectionError(), "ch_3"]
assert charge_with_retry(gateway, "tok", 500, sleep=sleep) == "ch_3"
assert sleep.call_args_list == [mock.call(1), mock.call(2)]` },
        { name: 'gives up with a chained PaymentDeclined', code: py`from unittest import mock
gateway, sleep = mock.Mock(), mock.Mock()
gateway.charge.side_effect = ConnectionError("down")
try:
    charge_with_retry(gateway, "tok", 500, sleep=sleep)
except PaymentDeclined as error:
    assert isinstance(error.__cause__, ConnectionError), 'Use raise PaymentDeclined(...) from error'
else:
    raise AssertionError("Expected PaymentDeclined after 3 failed attempts")
assert gateway.charge.call_count == 3
assert sleep.call_args_list == [mock.call(1), mock.call(2)], 'Sleep only between attempts'` },
        { name: 'does not retry other errors', code: py`from unittest import mock
gateway, sleep = mock.Mock(), mock.Mock()
gateway.charge.side_effect = ValueError("invalid card")
with raises(ValueError):
    charge_with_retry(gateway, "tok", 500, sleep=sleep)
assert gateway.charge.call_count == 1
sleep.assert_not_called()` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'mocking-test-doubles',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a test double? Explain the difference between a stub, a mock and a fake.',
      answer: 'A test double replaces a real collaborator in a test. A stub returns canned answers; a mock is a double whose interactions you verify (was it called, with what); a fake is a simplified working implementation such as an in-memory repository. Dummies (unused placeholders) and spies (record calls on real behaviour) complete the set.',
      explanation: py`The terms come from Gerard Meszaros' *xUnit Test Patterns*. In Python, \`unittest.mock.Mock\` can act as a stub, mock or spy (\`wraps=\`); fakes are usually small hand-written classes.`,
      whyAsked: 'Checks precise vocabulary and whether you choose the right double for the job.',
      mistakes: ['Calling everything a mock without distinguishing roles', 'Thinking fakes and mocks are the same'],
      followUps: ['When would you prefer a fake over a mock?', 'What is a spy?'],
      modelAnswer: 'A test double is anything that stands in for a real collaborator during a test — the payment gateway, the clock, an email service. A stub just provides canned answers, like an exchange-rate lookup that always returns 0.85. A mock is a double I verify afterwards: for example I assert the gateway was charged exactly once with 1250 cents. A fake is a lightweight but working implementation, like an in-memory repository or an outbox list instead of real email. In Python, unittest.mock.Mock covers stubs and mocks; for collaborators with real logic I usually prefer a small fake because it keeps tests readable.',
    },
    {
      id: 'mocking-where-to-patch',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain "patch where it is looked up, not where it is defined", with an example.',
      answer: 'patch rebinds a name in one namespace. If orders.py does `from rates import get_exchange_rate`, orders has its own name for the function, so you must patch "orders.get_exchange_rate"; patching "rates.get_exchange_rate" leaves orders using the original. If orders does `import rates` and calls rates.get_exchange_rate, patch "rates.get_exchange_rate".',
      explanation: py`Python names are references ([variables](lesson:variables-and-names)). \`from x import y\` copies the reference at import time; \`patch\` changes one name, not the object, so only code that looks the name up in the patched namespace sees the mock.`,
      code: { lang: 'python', code: py`# orders.py
from rates import get_exchange_rate      # orders.get_exchange_rate -> real function

# test
@mock.patch("orders.get_exchange_rate", return_value=0.85)    # correct
@mock.patch("rates.get_exchange_rate", return_value=0.85)     # no effect on orders`, static: true },
      whyAsked: 'The single most common mocking bug; explaining it shows you understand Python\'s import and name binding.',
      mistakes: ['"Just patch it in the module where it is defined"', 'Patching builtins globally instead of the module\'s name'],
      followUps: ['How would you patch datetime.now?', 'Why does import style change the patch target?'],
      modelAnswer: 'patch doesn\'t modify the function object; it temporarily rebinds a name inside one module. When orders.py does from rates import get_exchange_rate, Python creates a second name in the orders module pointing at the function. place_order looks it up there, so I must patch orders.get_exchange_rate — patching rates.get_exchange_rate only changes the name in rates, and the code under test still calls the real one. If instead orders did import rates and called rates.get_exchange_rate, the lookup happens on the rates module at call time, so patching rates.get_exchange_rate would be right. The rule is: patch the namespace the code under test reads from.',
    },
    {
      id: 'mocking-datetime',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A test does `mock.patch("datetime.datetime.now", return_value=FIXED)` and fails with `TypeError: cannot set \'now\' attribute of immutable type \'datetime.datetime\'`. Why, and what are the options?',
      options: ['now() is a static method and cannot be mocked', 'datetime.datetime is a built-in (C) type whose attributes are read-only, so patch cannot set them', 'You must use MagicMock for class methods', 'The test needs autospec=True'],
      correctOption: 1,
      answer: 'Built-in types implemented in C are immutable, so patch can\'t replace their attributes. Patch the name datetime in the module under test (patch("orders.datetime")), inject a clock (now=datetime.now as a parameter), or use a time-freezing library.',
      explanation: py`Injection is the most robust: \`def place_order(..., now=lambda: datetime.now(timezone.utc))\`. Patching the module-level name works but must match the import style (\`from datetime import datetime\` vs \`import datetime\`).`,
      whyAsked: 'Time is the most common source of flaky tests; this checks you know practical fixes.',
      mistakes: ['Monkey-patching the datetime class globally with a subclass', 'Sleeping in tests to "wait for" a time'],
      followUps: ['How do you test code that runs "every Monday at 9:00"?', 'Why prefer injecting a clock?'],
      modelAnswer: 'datetime.datetime is a built-in type written in C, and those types don\'t allow their attributes to be replaced, so patch fails when it tries to set now. I have three options. I can patch the name datetime inside the module under test, for example patch("orders.datetime") and set now.return_value. Better, I can inject a clock — a now parameter or a clock object — so tests just pass a fixed time. Or I can use a library that freezes time. I prefer injection because it makes the time dependency explicit and needs no patching at all.',
    },
    {
      id: 'mocking-over-mocking',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'All 600 unit tests are green, yet checkout broke in production when the payment provider changed its JSON response. Every test mocks the provider\'s HTTP client directly. What went wrong, and how would you restructure the tests?',
      answer: 'The mocks encoded assumptions about the provider that nobody verified, and mocking a third-party client spreads those assumptions everywhere. Wrap the provider in your own adapter (PaymentGateway) with a small, stable interface; unit-test business logic against an autospecced adapter or a fake; test the adapter itself with integration/contract tests against the sandbox API or recorded responses; and monitor in production.',
      explanation: py`"Don't mock what you don't own": your adapter is the seam. Integration tests at that seam catch format changes; unit tests stay fast and readable. Autospec prevents drift between the adapter and its doubles.`,
      whyAsked: 'Distinguishes engineers who use mocks pragmatically from those who believe mocks prove correctness.',
      mistakes: ['"Add more mocks"', 'Replacing all unit tests with slow end-to-end tests', 'Blaming the provider without changing the test strategy'],
      followUps: ['What is a contract test?', 'How would you record and replay HTTP responses?', 'Where do fakes fit?'],
      modelAnswer: 'The tests only proved that our code works with our idea of the provider. Because every test mocked the raw HTTP client, those assumptions were copied into hundreds of places and nothing checked them against reality. I would introduce an adapter — our own PaymentGateway class with methods like charge and refund — that is the only code that knows the provider\'s JSON. Business logic would be unit-tested against an autospecced or fake gateway, so those tests stay fast. The adapter itself gets a small set of integration or contract tests against the provider\'s sandbox or recorded responses, run in CI, so a format change fails there. Monitoring and alerts on payment errors close the loop.',
    },
    {
      id: 'mocking-mock-vs-magicmock',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare Mock, MagicMock and create_autospec. Which do you use by default?',
      answer: 'Mock accepts any attribute and call and records them; MagicMock additionally pre-configures magic methods (len, iter, with, comparisons) — patch creates one by default; create_autospec builds a mock from a real object so only real attributes exist and calls are checked against real signatures. Default to autospec for doubles of your own interfaces.',
      explanation: py`Plain \`Mock\` is fine for quick stubs; \`MagicMock\` when the code uses the object as a container or context manager; autospec when the double stands in for a real class or function — which is most of the time.`,
      whyAsked: 'Tests practical command of the library beyond "Mock()".',
      mistakes: ['Not knowing patch returns a MagicMock', 'Never using spec, so mocks drift silently'],
      followUps: ['What does spec= do without autospec?', 'How do you mock an async function? (AsyncMock)'],
      modelAnswer: 'Mock is the base: any attribute access creates a child mock, any call is accepted and recorded. MagicMock is a Mock with magic methods pre-wired, so it works with len, iteration, with-blocks and comparisons — and it\'s what patch gives you by default. create_autospec, or autospec=True on patch, builds the mock from a real class or function, so only real attributes exist and every call is checked against the real signature. My default for replacing a real collaborator is autospec, because a test then breaks when the real interface changes instead of drifting silently.',
    },
    {
      id: 'mocking-recording-stub',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Build a tiny `RecordingStub(return_value=None, side_effect=None)`: calling it records `(args, kwargs)` in `.calls`; `side_effect` may be an exception instance (raise it) or a list (one item per call; exception instances in the list are raised); otherwise it returns `return_value`. Add `assert_called_once_with(*args, **kwargs)` that raises `AssertionError` unless there was exactly one call with those arguments.',
      answer: 'Store calls in a list; convert a list side_effect to an iterator in __init__; in __call__ record first, then raise or return; the assertion compares len(calls) == 1 and calls[0] == (args, kwargs).',
      explanation: py`Recording **before** raising mirrors \`Mock\`: a call that raised still counts. Turning the list into an iterator once means each call consumes the next item.`,
      starter: { files: { 'main.py': py`class RecordingStub:
    def __init__(self, return_value=None, side_effect=None):
        self.return_value = return_value
        self.side_effect = side_effect
        self.calls = []

    def __call__(self, *args, **kwargs):
        # TODO: record the call, then apply side_effect or return return_value
        return None

    def assert_called_once_with(self, *args, **kwargs):
        pass   # TODO
` + STUB_DEMO } },
      tests: [
        { name: 'returns return_value and records calls', code: py`stub = RecordingStub(return_value=0.85)
assert stub("GBP", fresh=True) == 0.85
assert stub.calls == [(("GBP",), {"fresh": True})]` },
        { name: 'an exception side_effect is raised and still recorded', code: py`stub = RecordingStub(side_effect=ConnectionError("down"))
with raises(ConnectionError):
    stub("GBP")
assert len(stub.calls) == 1` },
        { name: 'a list side_effect gives one item per call', code: py`stub = RecordingStub(side_effect=[1, ValueError("bad"), 3])
assert stub() == 1
with raises(ValueError):
    stub()
assert stub() == 3` },
        { name: 'assert_called_once_with passes and fails correctly', code: py`stub = RecordingStub()
stub("tok", 500)
stub.assert_called_once_with("tok", 500)
with raises(AssertionError):
    stub.assert_called_once_with("tok", 999)
stub("tok", 500)
with raises(AssertionError):
    stub.assert_called_once_with("tok", 500)` },
      ],
      solution: { files: { 'main.py': py`class RecordingStub:
    def __init__(self, return_value=None, side_effect=None):
        self.return_value = return_value
        self.side_effect = iter(side_effect) if isinstance(side_effect, list) else side_effect
        self.calls = []

    def __call__(self, *args, **kwargs):
        self.calls.append((args, kwargs))            # record first, like Mock
        effect = self.side_effect
        if effect is None:
            return self.return_value
        if isinstance(effect, BaseException):
            raise effect
        item = next(effect)                          # list: one item per call
        if isinstance(item, BaseException):
            raise item
        return item

    def assert_called_once_with(self, *args, **kwargs):
        if self.calls != [(args, kwargs)]:
            raise AssertionError(f"expected one call with {(args, kwargs)}, got {self.calls}")
` + STUB_DEMO } },
      hints: ['In __init__, if side_effect is a list, store iter(side_effect) so each call can take next().', 'Exactly one matching call means self.calls == [(args, kwargs)].'],
      whyAsked: 'Building a minimal double shows you understand what Mock does rather than treating it as magic.',
      mistakes: ['Recording only successful calls', 'Re-creating the iterator on every call (always returns the first item)', 'Checking only the last call in assert_called_once_with'],
      followUps: ['How would you support a callable side_effect?', 'How does Mock create child attributes on demand? (__getattr__)'],
      modelAnswer: 'The stub keeps a list of calls and records (args, kwargs) at the very start of __call__, so even calls that raise are counted, just like Mock. In __init__ I turn a list side_effect into an iterator once, so every call consumes the next item. On each call: no side_effect means return return_value; an exception instance is raised; otherwise I take the next item and raise it if it\'s an exception or return it. assert_called_once_with just compares the whole call list to a single expected entry, which checks both the count and the arguments in one go.',
    },
  ],

  takeaways: [
    'A test double replaces a slow, random or external collaborator: stubs answer, mocks are verified, fakes work, spies record.',
    'Mock creates attributes on demand and records every call; return_value sets the answer; side_effect raises, sequences or computes.',
    'Verify with assert_called_once_with / assert_not_called / call_args_list — but assert on outcomes first.',
    'patch rebinds a name temporarily and restores it; patch the name where the code under test looks it up.',
    'Use create_autospec / autospec=True so doubles fail when the real interface changes; built-in types like datetime can\'t be patched directly.',
    'Prefer injecting dependencies (gateway, clock, sleep, rng) over patching; mock only boundaries; avoid over-mocking and keep some integration tests.',
  ],
}

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------ shared files

const ERRORS_PY = py`"""How a remote call can fail. The split decides what is worth retrying."""


class FetchError(Exception):
    """Something went wrong talking to the remote API."""


class TransientError(FetchError):
    """Temporary trouble (503, connection reset): worth retrying."""


class PermanentError(FetchError):
    """Will never work (404, 400): retrying only wastes time."""
`

const FAKE_API_PY = py`"""A fake remote catalogue API with scripted, deterministic behaviour.

No network: latency is asyncio.sleep, failures are exceptions. Each product id
can have a script of outcomes, one per attempt; the last outcome repeats.
"""
import asyncio
from collections import Counter

from errors import PermanentError, TransientError

PRODUCTS = {
    1: ("USB-C cable", "9.99", 120),
    2: ("Wireless   mouse", "24.50", 35),
    3: ("Mechanical keyboard", "89.00", 12),
    4: ("Laptop stand", "39.95", 0),
    6: ("Monitor arm", "64.99", 5),
    7: ("Desk lamp", "29.00", 40),
    8: ("Noise-cancelling headphones", "199.00", 3),
    9: ("Docking station", "149.00", 7),
    10: ("HDMI cable", "7.49", 200),
    11: ("Ergonomic chair", "N/A", 2),  # the API sends a broken price
    12: ("Mouse pad", "5.99", 300),
}
# Product 5 does not exist: the API answers 404.

DEFAULT_SCRIPT = {
    3: ["transient", "transient", "ok"],  # flaky: works on the 3rd attempt
    7: ["slow", "ok"],                    # too slow once, then fine
    9: ["slow"],                          # always too slow
}


class FakeCatalogClient:
    def __init__(self, script=None, latency=0.005, slow_latency=0.2):
        self.script = DEFAULT_SCRIPT if script is None else script
        self.latency = latency
        self.slow_latency = slow_latency
        self.calls = Counter()   # attempts per product id
        self.in_flight = 0       # requests running right now
        self.max_in_flight = 0   # the most that ever ran at the same time

    async def fetch_product(self, product_id):
        self.calls[product_id] += 1
        outcomes = self.script.get(product_id, ["ok"])
        outcome = outcomes[min(self.calls[product_id], len(outcomes)) - 1]
        self.in_flight += 1
        self.max_in_flight = max(self.max_in_flight, self.in_flight)
        try:
            if outcome == "slow":
                await asyncio.sleep(self.slow_latency)
            else:
                await asyncio.sleep(self.latency * (1 + product_id % 3))
            if outcome == "transient":
                raise TransientError(f"503 Service Unavailable (product {product_id})")
            if product_id not in PRODUCTS:
                raise PermanentError(f"404 Not Found (product {product_id})")
            name, price, stock = PRODUCTS[product_id]
            return {"id": product_id, "name": f"  {name} ", "price": price, "stock": stock}
        finally:
            self.in_flight -= 1  # runs even when a timeout cancels the sleep
`

const MODELS_PY = py`"""Validated data: what the pipeline produces for each product id."""
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation


@dataclass(frozen=True)
class Product:
    id: int
    name: str
    price: Decimal
    stock: int


@dataclass(frozen=True)
class Outcome:
    """The result for ONE id: a Product or an error message — never an exception."""
    product_id: int
    product: Product | None
    error: str | None
    attempts: int

    @property
    def ok(self):
        return self.error is None


def transform(raw):
    """Validate and normalise one raw API payload. Raises ValueError if it's unusable."""
    try:
        product_id, name, price, stock = raw["id"], raw["name"], raw["price"], raw["stock"]
    except KeyError as exc:
        raise ValueError(f"missing field {exc}") from None
    name = " ".join(str(name).split())
    if not name:
        raise ValueError("empty name")
    try:
        price = Decimal(price)
    except (InvalidOperation, TypeError):
        raise ValueError(f"bad price {price!r}") from None
    if not price.is_finite() or price < 0:
        raise ValueError(f"bad price {price!r}")
    if isinstance(stock, bool) or not isinstance(stock, int) or stock < 0:
        raise ValueError(f"bad stock {stock!r}")
    return Product(product_id, name, price, stock)
`

const REPORT_PY = py`"""Turn a Report into text. Sorted by id, so the output never depends on timing."""


def format_report(report):
    lines = [
        f"Fetched {len(report.products)}/{len(report.attempts)} products "
        f"({len(report.failures)} failed, {len(report.retried)} retried)",
        f"Stock value: {report.stock_value:,.2f}",
        "",
        f"{'ID':>3}  {'Product':<28} {'Price':>7} {'Stock':>6}",
    ]
    for product_id in sorted(report.products):
        p = report.products[product_id]
        lines.append(f"{p.id:>3}  {p.name:<28} {p.price:>7} {p.stock:>6}")
    if report.failures:
        lines += ["", "Failures:"]
        for product_id in sorted(report.failures):
            lines.append(f"{product_id:>3}  {report.failures[product_id]}")
    if report.retried:
        retried = ", ".join(f"#{i} ({report.attempts[i]} attempts)" for i in report.retried)
        lines += ["", f"Needed retries: {retried}"]
    return "\n".join(lines)
`

const MAIN_PY = py`import asyncio
import time

from fake_api import FakeCatalogClient
from pipeline import run_pipeline
from report import format_report

PRODUCT_IDS = list(range(1, 13))


async def main():
    client = FakeCatalogClient()
    started = time.perf_counter()
    report = await run_pipeline(PRODUCT_IDS, client, workers=4, max_concurrency=3)
    elapsed = time.perf_counter() - started
    print(format_report(report))
    print()
    print(f"API calls: {sum(client.calls.values())}, most at once: {client.max_in_flight}")
    print(f"Took about {elapsed:.2f} s (varies from run to run)")


if __name__ == "__main__":
    asyncio.run(main())
`

// ------------------------------------------------------------ starter

const RETRY_STARTER = py`"""Retry an async operation with exponential backoff."""
import asyncio

from errors import TransientError

RETRYABLE = (TransientError, TimeoutError)


def backoff_delays(attempts, base=0.01, factor=2.0, cap=1.0):
    """The waits BETWEEN attempts: attempts=4, base=0.1 -> [0.1, 0.2, 0.4] (each at most cap)."""
    # TODO
    return []


async def with_retries(operation, *, attempts=3, base=0.01, factor=2.0, cap=1.0,
                       retry_on=RETRYABLE, sleep=asyncio.sleep):
    """Await operation() until it succeeds; retry only retry_on errors, waiting
    backoff_delays(...) in between with await sleep(delay). Re-raise the last error."""
    # TODO
    raise NotImplementedError("TODO: with_retries()")
`

const FETCHER_HEAD = py`"""Fetch ONE product: bounded, timed-out, retried, validated."""
import asyncio
from dataclasses import dataclass

from errors import PermanentError, TransientError
from models import Outcome, transform
from retry import with_retries


@dataclass(frozen=True)
class FetchSettings:
    timeout: float = 0.05     # seconds allowed for each attempt
    attempts: int = 3
    base_delay: float = 0.01  # first backoff delay; doubles each retry
`

const FETCHER_STARTER = FETCHER_HEAD + py`

async def fetch_one(client, product_id, *, semaphore, settings=FetchSettings(), sleep=asyncio.sleep):
    # TODO: make each attempt
    #   (1) hold the semaphore (only while the request runs, not while backing off),
    #   (2) give up after settings.timeout seconds with asyncio.timeout(...),
    #   (3) and retry through with_retries(..., attempts=settings.attempts,
    #       base=settings.base_delay, sleep=sleep). Count the attempts in tries.
    tries = 1
    try:
        raw = await client.fetch_product(product_id)
    except TimeoutError:
        return Outcome(product_id, None, f"timed out after {tries} attempts", tries)
    except TransientError as exc:
        return Outcome(product_id, None, f"gave up after {tries} attempts: {exc}", tries)
    except PermanentError as exc:
        return Outcome(product_id, None, str(exc), tries)
    try:
        product = transform(raw)
    except ValueError as exc:
        return Outcome(product_id, None, f"invalid payload: {exc}", tries)
    return Outcome(product_id, product, None, tries)
`

const PIPELINE_HEAD = py`"""Producer -> fetch workers -> collector, connected by asyncio queues."""
import asyncio
from dataclasses import dataclass, field
from decimal import Decimal

from fetcher import FetchSettings, fetch_one

STOP = object()  # sentinel: "no more work" (can never be mistaken for a real id)


@dataclass
class Report:
    products: dict = field(default_factory=dict)  # id -> Product
    failures: dict = field(default_factory=dict)  # id -> reason
    attempts: dict = field(default_factory=dict)  # id -> attempts used

    def add(self, outcome):
        self.attempts[outcome.product_id] = outcome.attempts
        if outcome.ok:
            self.products[outcome.product_id] = outcome.product
        else:
            self.failures[outcome.product_id] = outcome.error

    @property
    def retried(self):
        return sorted(pid for pid, n in self.attempts.items() if n > 1)

    @property
    def stock_value(self):
        return sum((p.price * p.stock for p in self.products.values()), start=Decimal("0"))
`

const PIPELINE_STARTER = PIPELINE_HEAD + py`

async def produce(ids, jobs, workers):
    # TODO: put every id on the jobs queue, then one STOP per worker
    raise NotImplementedError("TODO: produce()")


async def fetch_worker(client, jobs, results, semaphore, settings, sleep=asyncio.sleep):
    # TODO: loop: take an id from jobs; on STOP put STOP on results and return;
    #       otherwise put fetch_one(...)'s Outcome on results
    raise NotImplementedError("TODO: fetch_worker()")


async def collect(results, workers, report):
    # TODO: report.add() every Outcome until you have seen one STOP per worker
    raise NotImplementedError("TODO: collect()")


async def run_pipeline(ids, client, *, workers=4, max_concurrency=3,
                       settings=FetchSettings(), queue_size=10, sleep=asyncio.sleep):
    # TODO: replace this one-at-a-time loop with the real pipeline:
    #   a bounded jobs Queue(maxsize=queue_size) and a results Queue,
    #   produce + "workers" fetch_worker tasks + collect, all in ONE asyncio.TaskGroup,
    #   sharing one asyncio.Semaphore(max_concurrency).
    ids = list(dict.fromkeys(ids))  # drop duplicates, keep the order
    semaphore = asyncio.Semaphore(max_concurrency)
    report = Report()
    for product_id in ids:
        outcome = await fetch_one(client, product_id, semaphore=semaphore,
                                  settings=settings, sleep=sleep)
        report.add(outcome)
    return report
`

// ------------------------------------------------------------ solution

const RETRY_SOLUTION = py`"""Retry an async operation with exponential backoff."""
import asyncio

from errors import TransientError

RETRYABLE = (TransientError, TimeoutError)


def backoff_delays(attempts, base=0.01, factor=2.0, cap=1.0):
    """The waits BETWEEN attempts: attempts=4, base=0.1 -> [0.1, 0.2, 0.4] (each at most cap)."""
    return [min(cap, base * factor**n) for n in range(attempts - 1)]


async def with_retries(operation, *, attempts=3, base=0.01, factor=2.0, cap=1.0,
                       retry_on=RETRYABLE, sleep=asyncio.sleep):
    """Await operation() until it succeeds; retry only retry_on errors, waiting
    backoff_delays(...) in between with await sleep(delay). Re-raise the last error."""
    if attempts < 1:
        raise ValueError("attempts must be at least 1")
    delays = backoff_delays(attempts, base, factor, cap)
    for attempt in range(attempts):
        try:
            return await operation()
        except retry_on:
            if attempt == attempts - 1:
                raise  # out of attempts: the caller sees the real reason
            await sleep(delays[attempt])
`

const FETCHER_SOLUTION = FETCHER_HEAD + py`

async def fetch_one(client, product_id, *, semaphore, settings=FetchSettings(), sleep=asyncio.sleep):
    tries = 0

    async def attempt():
        nonlocal tries
        async with semaphore:                              # wait for a free slot...
            tries += 1
            async with asyncio.timeout(settings.timeout):  # ...then start the clock
                return await client.fetch_product(product_id)

    try:
        raw = await with_retries(attempt, attempts=settings.attempts,
                                 base=settings.base_delay, sleep=sleep)
    except TimeoutError:
        return Outcome(product_id, None, f"timed out after {tries} attempts", tries)
    except TransientError as exc:
        return Outcome(product_id, None, f"gave up after {tries} attempts: {exc}", tries)
    except PermanentError as exc:
        return Outcome(product_id, None, str(exc), tries)
    try:
        product = transform(raw)
    except ValueError as exc:
        return Outcome(product_id, None, f"invalid payload: {exc}", tries)
    return Outcome(product_id, product, None, tries)
`

const PIPELINE_SOLUTION = PIPELINE_HEAD + py`

async def produce(ids, jobs, workers):
    for product_id in ids:
        await jobs.put(product_id)  # waits while the queue is full: backpressure
    for _ in range(workers):
        await jobs.put(STOP)        # one stop signal per worker


async def fetch_worker(client, jobs, results, semaphore, settings, sleep=asyncio.sleep):
    while True:
        product_id = await jobs.get()
        if product_id is STOP:
            await results.put(STOP)  # tell the collector this worker is done
            return
        outcome = await fetch_one(client, product_id, semaphore=semaphore,
                                  settings=settings, sleep=sleep)
        await results.put(outcome)


async def collect(results, workers, report):
    finished = 0
    while finished < workers:
        item = await results.get()
        if item is STOP:
            finished += 1
        else:
            report.add(item)
    return report


async def run_pipeline(ids, client, *, workers=4, max_concurrency=3,
                       settings=FetchSettings(), queue_size=10, sleep=asyncio.sleep):
    if workers < 1 or max_concurrency < 1:
        raise ValueError("workers and max_concurrency must be at least 1")
    ids = list(dict.fromkeys(ids))  # drop duplicates, keep the order
    jobs = asyncio.Queue(maxsize=queue_size)
    results = asyncio.Queue()
    semaphore = asyncio.Semaphore(max_concurrency)
    report = Report()
    async with asyncio.TaskGroup() as tg:
        tg.create_task(produce(ids, jobs, workers))
        for _ in range(workers):
            tg.create_task(fetch_worker(client, jobs, results, semaphore, settings, sleep))
        tg.create_task(collect(results, workers, report))
    return report
`

// ------------------------------------------------------------ tests (platform)

const TESTS = [
  {
    name: 'backoff_delays() doubles from base, is capped, and has one delay fewer than attempts',
    code: py`retry = module('retry')
assert retry.backoff_delays(4, base=0.1) == approx([0.1, 0.2, 0.4])
assert retry.backoff_delays(3, base=1, factor=3, cap=10) == approx([1, 3])
assert retry.backoff_delays(6, base=0.5, cap=2.0) == approx([0.5, 1.0, 2.0, 2.0, 2.0])
assert retry.backoff_delays(1) == []`,
  },
  {
    name: 'with_retries() retries transient errors, waiting the backoff delays in between',
    code: py`retry, errors = module('retry'), module('errors')
delays, calls = [], []
async def fake_sleep(delay):
    delays.append(delay)
async def flaky():
    calls.append(1)
    if len(calls) < 3:
        raise errors.TransientError("503")
    return "catalogue"
result = await retry.with_retries(flaky, attempts=4, base=0.5, sleep=fake_sleep)
assert result == "catalogue"
assert len(calls) == 3
assert delays == approx([0.5, 1.0])`,
  },
  {
    name: 'with_retries() never retries permanent errors, retries TimeoutError, and re-raises after the last attempt',
    code: py`retry, errors = module('retry'), module('errors')
async def no_wait(delay):
    pass
calls = []
async def missing():
    calls.append(1)
    raise errors.PermanentError("404")
with raises(errors.PermanentError):
    await retry.with_retries(missing, attempts=5, sleep=no_wait)
assert len(calls) == 1, 'a 404 will never succeed: do not retry it'
timeouts = []
async def too_slow():
    timeouts.append(1)
    raise TimeoutError()
with raises(TimeoutError):
    await retry.with_retries(too_slow, attempts=3, sleep=no_wait)
assert len(timeouts) == 3`,
  },
  {
    name: 'fetch_one() returns a validated Product and recovers from transient errors',
    code: py`import asyncio
from decimal import Decimal
fetcher, fake = module('fetcher'), module('fake_api')
client = fake.FakeCatalogClient()
sem = asyncio.Semaphore(3)
async with asyncio.timeout(5):
    good = await fetcher.fetch_one(client, 2, semaphore=sem)
    flaky = await fetcher.fetch_one(client, 3, semaphore=sem)
assert good.ok and good.attempts == 1
assert good.product.name == "Wireless mouse" and good.product.price == Decimal("24.50")
assert flaky.ok, flaky.error
assert flaky.attempts == 3 and client.calls[3] == 3`,
  },
  {
    name: 'fetch_one() gives every attempt its own timeout',
    code: py`import asyncio
fetcher, fake = module('fetcher'), module('fake_api')
client = fake.FakeCatalogClient()
sem = asyncio.Semaphore(3)
async with asyncio.timeout(5):
    always_slow = await fetcher.fetch_one(client, 9, semaphore=sem)
    slow_once = await fetcher.fetch_one(client, 7, semaphore=sem)
assert not always_slow.ok
assert always_slow.error == "timed out after 3 attempts", always_slow.error
assert always_slow.attempts == 3
assert slow_once.ok and slow_once.attempts == 2
assert client.in_flight == 0, 'cancelled requests must still be counted as finished'`,
  },
  {
    name: 'fetch_one() does not retry a 404 and reports invalid payloads',
    code: py`import asyncio
fetcher, fake = module('fetcher'), module('fake_api')
client = fake.FakeCatalogClient()
sem = asyncio.Semaphore(3)
async with asyncio.timeout(5):
    missing = await fetcher.fetch_one(client, 5, semaphore=sem)
    broken = await fetcher.fetch_one(client, 11, semaphore=sem)
assert (missing.error, missing.attempts) == ("404 Not Found (product 5)", 1)
assert client.calls[5] == 1
assert broken.error == "invalid payload: bad price 'N/A'", broken.error`,
  },
  {
    name: 'fetch_one() holds the semaphore only while a request runs',
    code: py`import asyncio
fetcher, fake = module('fetcher'), module('fake_api')
client = fake.FakeCatalogClient()
sem = asyncio.Semaphore(2)
async with asyncio.timeout(5):
    outcomes = await asyncio.gather(*(fetcher.fetch_one(client, i, semaphore=sem) for i in (1, 2, 4, 6, 8, 10)))
assert all(o.ok for o in outcomes)
assert client.max_in_flight == 2, f'at most 2 requests at once, saw {client.max_in_flight}'

locked_while_sleeping = []
one_slot = asyncio.Semaphore(1)
async def spy_sleep(delay):
    locked_while_sleeping.append(one_slot.locked())
flaky = fake.FakeCatalogClient(script={1: ["transient", "ok"]})
async with asyncio.timeout(5):
    outcome = await fetcher.fetch_one(flaky, 1, semaphore=one_slot, sleep=spy_sleep)
assert outcome.ok and outcome.attempts == 2
assert locked_while_sleeping == [False], 'release the semaphore before backing off'`,
  },
  {
    name: 'produce() queues every id, then one STOP per worker',
    code: py`import asyncio
pipeline = module('pipeline')
jobs = asyncio.Queue()
async with asyncio.timeout(5):
    await pipeline.produce([4, 8, 15], jobs, workers=2)
items = [jobs.get_nowait() for _ in range(jobs.qsize())]
assert items[:3] == [4, 8, 15]
assert items[3:] == [pipeline.STOP, pipeline.STOP]`,
  },
  {
    name: 'fetch_worker() forwards one Outcome per id and a STOP when told to stop',
    code: py`import asyncio
pipeline, fake, fetcher = module('pipeline'), module('fake_api'), module('fetcher')
jobs, results = asyncio.Queue(), asyncio.Queue()
for item in (1, 5, pipeline.STOP, 2):
    jobs.put_nowait(item)
async with asyncio.timeout(5):
    await pipeline.fetch_worker(fake.FakeCatalogClient(), jobs, results,
                                asyncio.Semaphore(1), fetcher.FetchSettings())
out = [results.get_nowait() for _ in range(results.qsize())]
assert len(out) == 3 and out[2] is pipeline.STOP
assert [o.product_id for o in out[:2]] == [1, 5]
assert jobs.qsize() == 1, 'stop reading after the STOP'`,
  },
  {
    name: 'collect() adds outcomes to the report until every worker has stopped',
    code: py`import asyncio
pipeline, models = module('pipeline'), module('models')
results = asyncio.Queue()
for item in (models.Outcome(1, None, "boom", 2), pipeline.STOP,
             models.Outcome(5, None, "404 Not Found (product 5)", 1), pipeline.STOP):
    results.put_nowait(item)
report = pipeline.Report()
async with asyncio.timeout(5):
    await pipeline.collect(results, 2, report)
assert report.failures == {1: "boom", 5: "404 Not Found (product 5)"}
assert report.attempts == {1: 2, 5: 1} and report.retried == [1]`,
  },
  {
    name: 'run_pipeline() produces the right report for the scripted API',
    code: py`import asyncio
from decimal import Decimal
pipeline, fake = module('pipeline'), module('fake_api')
async with asyncio.timeout(10):
    report = await pipeline.run_pipeline(range(1, 13), fake.FakeCatalogClient())
assert sorted(report.products) == [1, 2, 3, 4, 6, 7, 8, 10, 12]
assert report.failures == {
    5: "404 Not Found (product 5)",
    9: "timed out after 3 attempts",
    11: "invalid payload: bad price 'N/A'",
}
assert {i: report.attempts[i] for i in (3, 5, 7, 9)} == {3: 3, 5: 1, 7: 2, 9: 3}
assert report.retried == [3, 7, 9]
assert report.stock_value == Decimal("8501.25")`,
  },
  {
    name: 'run_pipeline() really runs requests concurrently, but never more than max_concurrency',
    code: py`import asyncio
pipeline, fake = module('pipeline'), module('fake_api')
async with asyncio.timeout(10):
    c3 = fake.FakeCatalogClient()
    await pipeline.run_pipeline(range(1, 13), c3, workers=4, max_concurrency=3)
    c2 = fake.FakeCatalogClient()
    await pipeline.run_pipeline(range(1, 13), c2, workers=6, max_concurrency=2)
    c1 = fake.FakeCatalogClient()
    await pipeline.run_pipeline(range(1, 13), c1, workers=1, max_concurrency=5)
assert c3.max_in_flight == 3, f'expected 3 requests at once, saw {c3.max_in_flight}'
assert c2.max_in_flight == 2
assert c1.max_in_flight == 1, 'one worker means one request at a time'`,
  },
  {
    name: 'run_pipeline() ignores duplicates, handles no ids, and does not depend on the worker count',
    code: py`import asyncio
pipeline, fake = module('pipeline'), module('fake_api')
async with asyncio.timeout(10):
    empty = await pipeline.run_pipeline([], fake.FakeCatalogClient())
    dupes_client = fake.FakeCatalogClient()
    dupes = await pipeline.run_pipeline([2, 2, 4, 2], dupes_client)
    one = await pipeline.run_pipeline(range(1, 13), fake.FakeCatalogClient(), workers=1)
    many = await pipeline.run_pipeline(range(1, 13), fake.FakeCatalogClient(), workers=7)
assert (empty.products, empty.failures) == ({}, {})
assert sorted(dupes.products) == [2, 4] and dupes_client.calls[2] == 1
assert one.products == many.products and one.failures == many.failures`,
  },
  {
    name: 'the report text is sorted and lists failures and retries',
    code: py`import asyncio
pipeline, fake, report_mod = module('pipeline'), module('fake_api'), module('report')
async with asyncio.timeout(10):
    report = await pipeline.run_pipeline(range(1, 13), fake.FakeCatalogClient())
text = report_mod.format_report(report)
assert text.startswith("Fetched 9/12 products (3 failed, 3 retried)")
assert "Stock value: 8,501.25" in text
assert "  9  timed out after 3 attempts" in text
assert text.endswith("Needed retries: #3 (3 attempts), #7 (2 attempts), #9 (3 attempts)")`,
  },
]

export default {
  id: 'project-async-pipeline',
  kind: 'project',
  title: 'Project 8: Async Data Pipeline',
  summary: 'Fetch data from a flaky, slow remote API with asyncio — bounded concurrency, per-request timeouts, retries with backoff, queue-connected stages in a TaskGroup — and turn the chaos into a clean report.',
  difficulty: 'advanced',
  minutes: 180,
  prerequisites: ['asyncio-basics', 'asyncio-in-practice', 'custom-exceptions', 'dataclasses', 'closures'],
  related: ['project-log-analyzer', 'project-production-service', 'concurrency-concepts', 'choosing-concurrency', 'exception-groups', 'http-clients', 'generators', 'lambdas-and-higher-order', 'mocking', 'logging', 'performance', 'decorators'],
  tags: ['project', 'asyncio', 'async pipeline', 'Semaphore', 'bounded concurrency', 'retries', 'exponential backoff', 'jitter', 'asyncio.timeout', 'timeouts', 'asyncio.Queue', 'producer consumer', 'backpressure', 'TaskGroup', 'structured concurrency', 'sentinel', 'transient errors', 'fake client'],
  apis: [
    { name: 'asyncio.Semaphore(n)', summary: '`async with sem:` lets at most n tasks into the block at once; the rest wait their turn.' },
    { name: 'asyncio.timeout(seconds)', summary: '(3.11+) `async with asyncio.timeout(0.05):` cancels the block and raises TimeoutError if it takes too long.' },
    { name: 'asyncio.Queue(maxsize)', summary: 'An async FIFO queue; `await put()` waits while a bounded queue is full (backpressure), `await get()` waits while it is empty.' },
    { name: 'asyncio.TaskGroup', summary: '(3.11+) `async with asyncio.TaskGroup() as tg:` waits for every task created with tg.create_task(); if one fails, the rest are cancelled and errors raise as an ExceptionGroup.' },
    { name: 'asyncio.gather(*aws)', summary: 'Run awaitables concurrently and return their results in the order given.' },
  ],
  docs: [
    { label: 'asyncio — Synchronization primitives (Semaphore)', url: 'https://docs.python.org/3/library/asyncio-sync.html#asyncio.Semaphore' },
    { label: 'asyncio — Timeouts', url: 'https://docs.python.org/3/library/asyncio-task.html#timeouts' },
    { label: 'asyncio — Queues', url: 'https://docs.python.org/3/library/asyncio-queue.html' },
    { label: 'asyncio — Task groups', url: 'https://docs.python.org/3/library/asyncio-task.html#task-groups' },
    { label: 'Developing with asyncio (common mistakes)', url: 'https://docs.python.org/3/library/asyncio-dev.html' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Your shop's prices and stock live in a supplier's catalogue that you can only reach over the network, one product per request. The API is *usually* quick. Sometimes it answers **503 — try again later**. Sometimes it hangs. Sometimes it says **404** for a product that's gone, or sends a price of \`"N/A"\`. You need all 12 products, now, without hammering the supplier.`,
    py`In this project you build an **async data pipeline** that handles exactly that: a producer feeds product ids into a [queue](lesson:asyncio-in-practice), several workers fetch them concurrently — but never more than a fixed number at once (**Semaphore**) — every attempt gets a deadline (**asyncio.timeout**, 3.11+), temporary failures are **retried with exponential backoff**, payloads are validated, and a collector turns everything into a report. All the tasks live inside one **TaskGroup** (3.11+).`,
    py`There's no network in the browser, so the remote API is a **fake async client** with scripted latency and failures. That's not a shortcut — it's how professionals test this kind of code: deterministic fakes make every failure mode reproducible.`,
  ],
  why: [
    py`Network calls spend almost all their time *waiting*. Fetching 12 products one after the other means 12 waits in a row; with [async/await](lesson:asyncio-basics) the waits overlap, so the whole batch takes roughly as long as the slowest few requests.`,
    py`But "as concurrent as possible" is wrong too. Fire 10,000 requests at once and the supplier rate-limits or blocks you, your sockets run out, and memory balloons. Real pipelines need **limits** (semaphores, bounded queues), **deadlines** (timeouts), and **resilience** (retries for the right errors only).`,
    py`Finally, errors must not take the whole batch down: one bad product should become a line in the report, not an exception that cancels the other 11 requests.`,
  ],
  eli15: [
    py`Imagine ordering 12 pizzas by phone from a busy pizzeria. You have three phones, so three calls at once is your limit (the **semaphore**). Calling one-by-one would take ages; calling all 12 at once is impossible and rude.`,
    py`If someone doesn't pick up within a few rings, you hang up (the **timeout**) and try again a bit later — waiting a little longer each time so you don't annoy them (**backoff**). If they say "we're closed for good" (**404**), you don't keep calling. If they read out a nonsense price, you write "invalid" next to that order.`,
    py`A friend writes the list of pizzas on sticky notes (the **producer**), you and your helpers take notes off the pile and make calls (the **workers**), and someone at the table writes down every result (the **collector**). When the pile is empty, everybody stops. That's the whole pipeline.`,
  ],
  analogy: {
    title: 'A call centre with three phone lines',
    body: [
      py`A small call centre has a stack of numbers to ring, a few agents, three phone lines, a rule about how long to let a phone ring, and a rule about calling back. A supervisor collects every agent's result sheet.`,
    ],
    mapping: [
      ['the stack of numbers to call', 'the jobs asyncio.Queue filled by produce()'],
      ['agents taking the next number', 'fetch_worker tasks doing await jobs.get()'],
      ['only three phone lines', 'asyncio.Semaphore(3)'],
      ['hang up after a few rings', 'async with asyncio.timeout(0.05)'],
      ['"busy, call back later" — wait longer each time', 'TransientError + exponential backoff'],
      ['"this number no longer exists"', 'PermanentError: never retried'],
      ['a "you can go home" note per agent', 'one STOP sentinel per worker'],
      ['the supervisor with the result sheets', 'collect() building the Report'],
      ['the shift: nobody leaves until all are done', 'async with asyncio.TaskGroup()'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The pipeline, stage by stage',
    props: {
      width: 780,
      height: 340,
      nodes: [
        { id: 'ids', label: 'product ids', note: '1 … 12', x: 70, y: 80, tone: 'yellow' },
        { id: 'produce', label: 'produce()', note: 'then STOP × workers', x: 70, y: 230, tone: 'blue' },
        { id: 'jobs', label: 'jobs Queue', note: 'bounded', x: 240, y: 230, tone: 'kraft' },
        { id: 'workers', label: 'fetch_worker × 4', note: 'fetch_one()', x: 410, y: 230, tone: 'blue' },
        { id: 'sem', label: 'Semaphore(3)', note: 'timeout + retries', x: 410, y: 80, tone: 'red' },
        { id: 'api', label: 'Fake API', note: 'slow / 503 / 404', x: 620, y: 80, tone: 'ink' },
        { id: 'results', label: 'results Queue', note: 'Outcomes', x: 580, y: 230, tone: 'kraft' },
        { id: 'collect', label: 'collect()', note: '→ Report', x: 720, y: 230, tone: 'paper' },
      ],
      edges: [
        { from: 'ids', to: 'produce' },
        { from: 'produce', to: 'jobs', label: 'put' },
        { from: 'jobs', to: 'workers', label: 'get' },
        { from: 'workers', to: 'sem', label: 'acquire', dashed: true },
        { from: 'sem', to: 'api', label: '≤ 3 at once' },
        { from: 'workers', to: 'results', label: 'Outcome' },
        { from: 'results', to: 'collect' },
      ],
      steps: [
        { focus: ['ids', 'produce', 'jobs'], edges: ['ids->produce', 'produce->jobs'], text: py`**produce()** puts every id on a *bounded* queue. If the workers fall behind and the queue is full, \`await jobs.put()\` simply waits — that's **backpressure**. After the ids it adds one \`STOP\` per worker.` },
        { focus: ['jobs', 'workers'], edges: ['jobs->workers'], text: py`Four **fetch_worker** tasks loop: \`await jobs.get()\`, fetch, repeat. While one waits on the network, the event loop runs the others.` },
        { focus: ['workers', 'sem', 'api'], edges: ['workers->sem', 'sem->api'], text: py`Each attempt first acquires the **Semaphore** — at most 3 requests in flight, even with 4 workers — and runs under its own **timeout**. Transient failures are retried after a growing delay, *outside* the semaphore so a sleeping retry doesn't hog a slot.` },
        { focus: ['api'], text: py`The fake API is scripted: product 3 fails twice with 503, 7 is slow once, 9 is always too slow, 5 doesn't exist and 11 sends a broken price. Every run behaves identically, so tests can assert exact results.` },
        { focus: ['workers', 'results'], edges: ['workers->results'], text: py`Every id becomes an **Outcome** value — a product *or* an error message. Failures are data, not exceptions, so one bad product never cancels the others.` },
        { focus: ['results', 'collect'], edges: ['results->collect'], text: py`**collect()** adds outcomes to the **Report** until it has seen one \`STOP\` per worker. The **TaskGroup** around all six tasks returns only when every one has finished.` },
      ],
    },
    alt: 'Pipeline diagram. Product ids go to produce(), which puts them on a bounded jobs queue followed by stop signals. Four fetch_worker tasks take ids from the queue; each request acquires a Semaphore of 3 and calls the fake API with a timeout and retries. Workers put Outcome values on a results queue, which collect() reads to build the Report.',
    caption: py`Two queues decouple the stages; the semaphore limits the one resource that matters — requests to the API.`,
  },
  animation: {
    type: 'asyncio-loop',
    props: { preset: 'gather' },
    title: 'Why the waits overlap',
    alt: 'An event-loop stepper: several tasks start, each hits an await on a sleep and is parked as a waiting timer, so the loop runs the next task immediately; the total time is close to the longest wait rather than the sum of all waits.',
    caption: py`Each \`await\` on network I/O hands control back to the event loop, which runs another task. That's the only reason async code is faster here — there's still one thread doing one thing at a time.`,
  },

  requirements: [
    'retry.py: backoff_delays(attempts, base=0.01, factor=2.0, cap=1.0) returns the attempts - 1 delays base × factor**n, each capped at cap. with_retries(operation, *, attempts, base, factor, cap, retry_on=(TransientError, TimeoutError), sleep=asyncio.sleep) awaits operation(), retries only retry_on errors after await sleep(delay), and re-raises the last error when attempts run out; other exceptions propagate immediately.',
    'fetcher.py: fetch_one(client, product_id, *, semaphore, settings, sleep) runs each attempt inside async with semaphore (the semaphore is NOT held while backing off) and asyncio.timeout(settings.timeout), retries via with_retries, and never raises for expected failures: it returns an Outcome(product_id, product, error, attempts).',
    'Outcome errors are exactly: "timed out after N attempts", "gave up after N attempts: <transient message>", the PermanentError message (e.g. "404 Not Found (product 5)", not retried), or "invalid payload: <reason>" when transform() raises ValueError.',
    'pipeline.py: produce(ids, jobs, workers) puts every id and then one STOP per worker; fetch_worker(...) puts one Outcome per id on results and, on STOP, puts STOP and returns; collect(results, workers, report) adds outcomes until it has seen workers STOPs.',
    'run_pipeline(ids, client, *, workers=4, max_concurrency=3, settings, queue_size=10, sleep) removes duplicate ids, connects the stages with a bounded jobs Queue and a results Queue, runs them all in one asyncio.TaskGroup with one shared Semaphore(max_concurrency), and returns the Report.',
    'With the scripted API: products 1–4, 6–8, 10, 12 succeed (3 after 3 attempts, 7 after 2), 5 → 404, 9 → timed out after 3 attempts, 11 → invalid payload; the stock value is 8,501.25; at most max_concurrency requests are ever in flight.',
  ],
  objectives: [
    'Tell transient from permanent failures and retry only what can succeed.',
    'Implement exponential backoff with a cap, and make waiting injectable for fast tests.',
    'Put a deadline on every attempt with asyncio.timeout and clean up correctly on cancellation.',
    'Bound concurrency with asyncio.Semaphore, holding it only around the scarce resource.',
    'Connect stages with asyncio.Queue: backpressure, sentinels and clean shutdown.',
    'Run a group of tasks with TaskGroup and understand how failures propagate.',
    'Turn expected failures into values so one bad item can\'t sink a batch, and test async code deterministically with fakes.',
  ],

  playground: {
    title: 'Async pipeline — starter',
    objective: 'Implement backoff and retries, add the semaphore, timeout and retries to fetch_one, and replace the sequential loop with the queue + TaskGroup pipeline.',
    files: {
      'main.py': MAIN_PY,
      'pipeline.py': PIPELINE_STARTER,
      'fetcher.py': FETCHER_STARTER,
      'retry.py': RETRY_STARTER,
      'models.py': MODELS_PY,
      'fake_api.py': FAKE_API_PY,
      'errors.py': ERRORS_PY,
      'report.py': REPORT_PY,
    },
    expected: py`The starter already runs — one request at a time, no timeouts, no retries. Notice what's wrong in its report: product 3 fails on the first 503, product 9 "succeeds" after a long wait, and \`most at once: 1\`.

When you're done you should see:

\`\`\`text
Fetched 9/12 products (3 failed, 3 retried)
Stock value: 8,501.25
...
Failures:
  5  404 Not Found (product 5)
  9  timed out after 3 attempts
 11  invalid payload: bad price 'N/A'

Needed retries: #3 (3 attempts), #7 (2 attempts), #9 (3 attempts)

API calls: 17, most at once: 3
\`\`\`

The time line varies from run to run — compare it with the starter's.`,
    tests: TESTS,
  },

  steps: [
    {
      title: '1. Why async — and why limits',
      body: [
        py`A request to a remote API is mostly *waiting*: for the network, for the server. [asyncio](lesson:asyncio-basics) runs many such waits at once on a single thread: each \`await\` on I/O hands control back to the **event loop**, which resumes whichever task is ready. Compare the two shapes:`,
        { code: py`import asyncio
import time


async def fetch(i):
    await asyncio.sleep(0.05)          # stands in for a network call
    return i


async def one_by_one(ids):
    return [await fetch(i) for i in ids]


async def all_together(ids):
    return await asyncio.gather(*(fetch(i) for i in ids))


for strategy in (one_by_one, all_together):
    start = time.perf_counter()
    asyncio.run(strategy(range(8)))
    print(f"{strategy.__name__:<13} {time.perf_counter() - start:.2f} s")`, lang: 'python', title: 'sequential vs concurrent waits' },
        py`Eight 0.05 s waits in a row take about eight times longer than eight overlapping waits. Run it and see on your machine. This is *concurrency* (overlapping waits), not *parallelism* (several CPUs) — see [concurrency vs parallelism](lesson:concurrency-concepts).`,
        py`But unlimited concurrency is a bug in disguise: real APIs enforce rate limits, servers have connection limits, and each in-flight request holds memory. So the pipeline needs three controls — **how many at once**, **how long each may take**, and **what to do when one fails**. Steps 3–6 build them one by one, then steps 7–9 assemble the pipeline.`,
        { callout: 'version', title: 'Python versions', text: py`This project uses \`asyncio.timeout()\` and \`asyncio.TaskGroup\`, both new in **Python 3.11**. On 3.8–3.10 you'd use \`asyncio.wait_for()\` and \`asyncio.gather()\` instead (shown later). The sandbox runs 3.14.` },
      ],
    },
    {
      title: '2. A fake API you can trust',
      body: [
        py`Testing against a real flaky service is hopeless: failures appear at random. So \`fake_api.py\` scripts them. Each product id can have a list of outcomes, one per attempt — product 3 is \`["transient", "transient", "ok"]\`, so it works on the third try *every time*.`,
        { code: py`    async def fetch_product(self, product_id):
        self.calls[product_id] += 1
        outcomes = self.script.get(product_id, ["ok"])
        outcome = outcomes[min(self.calls[product_id], len(outcomes)) - 1]
        self.in_flight += 1
        self.max_in_flight = max(self.max_in_flight, self.in_flight)
        try:
            ...                                   # sleep, then succeed or raise
        finally:
            self.in_flight -= 1   # runs even when a timeout cancels the sleep`, lang: 'python', static: true, title: 'fake_api.py (excerpt)' },
        py`The fake also **measures**: \`calls\` counts attempts per id and \`max_in_flight\` records the most requests that ever overlapped. That turns "is my semaphore working?" into an assertion instead of a feeling.`,
        py`Note the \`finally\`. When a timeout fires, asyncio *cancels* the task by raising \`CancelledError\` at the \`await\`. Without \`finally\`, \`in_flight\` would never be decremented for timed-out requests — the same class of bug as a connection that's never returned to a pool. Fakes like this one are the async cousin of [mocks](lesson:mocking).`,
      ],
    },
    {
      title: '3. Classify failures: transient vs permanent',
      body: [
        py`Retrying is only useful when the next attempt *might* succeed. So \`errors.py\` splits failures by **what to do about them**, not by where they came from ([custom exceptions](lesson:custom-exceptions)):`,
        { code: py`class FetchError(Exception):
    """Something went wrong talking to the remote API."""


class TransientError(FetchError):
    """Temporary trouble (503, connection reset): worth retrying."""


class PermanentError(FetchError):
    """Will never work (404, 400): retrying only wastes time."""


RETRYABLE = (TransientError, TimeoutError)
print([cls.__name__ for cls in RETRYABLE])`, lang: 'python', title: 'errors.py + the retry policy' },
        py`With a real HTTP client you'd map status codes onto these: 429, 502, 503, 504 and connection errors → transient; 400, 401, 403, 404, 422 → permanent. A **timeout** is retryable too — the request may just have been unlucky — so \`TimeoutError\` joins the tuple.`,
        { callout: 'warn', title: 'Retrying writes is dangerous', text: py`Fetching is safe to repeat. A \`POST /orders\` that timed out may have *succeeded* on the server — retrying it can order twice. Only retry operations that are **idempotent**, or send an idempotency key the server uses to deduplicate.` },
      ],
    },
    {
      title: '4. Retries with exponential backoff',
      body: [
        py`If a server is overloaded, retrying instantly makes it worse. **Exponential backoff** waits longer after each failure: 10 ms, 20 ms, 40 ms… with a **cap** so it never waits absurdly long. Keep the arithmetic in a pure function — trivial to test:`,
        { code: py`def backoff_delays(attempts, base=0.01, factor=2.0, cap=1.0):
    return [min(cap, base * factor**n) for n in range(attempts - 1)]


print(backoff_delays(4, base=0.1))           # 3 waits between 4 attempts
print(backoff_delays(6, base=0.5, cap=2.0))  # capped`, lang: 'python', title: 'retry.py — the delays' },
        py`The retry loop takes the operation as a **function that returns a coroutine** (calling it again creates a fresh attempt — a coroutine object can only be awaited once), and the \`sleep\` function as a parameter:`,
        { code: py`async def with_retries(operation, *, attempts=3, base=0.01, factor=2.0, cap=1.0,
                       retry_on=RETRYABLE, sleep=asyncio.sleep):
    delays = backoff_delays(attempts, base, factor, cap)
    for attempt in range(attempts):
        try:
            return await operation()
        except retry_on:
            if attempt == attempts - 1:
                raise                    # out of attempts: the caller sees the real reason
            await sleep(delays[attempt])`, lang: 'python', static: true, title: 'retry.py — the loop' },
        py`- Only \`retry_on\` exceptions are caught. A \`PermanentError\` — or a genuine bug like \`KeyError\` — propagates immediately.
- A bare \`raise\` re-raises the *last* error with its traceback, so callers can tell "timed out three times" from "503 three times".
- **Injecting \`sleep\`** lets tests pass an \`async def fake_sleep(d): delays.append(d)\` that records delays without waiting. That's [dependency injection](lesson:clean-architecture) applied to time.`,
        { callout: 'tip', title: 'Production: add jitter', text: py`If 1,000 clients all fail at the same moment, plain backoff makes them all retry at the same moments too. Production code adds **jitter** — e.g. \`delay = random.uniform(0, capped_delay)\` ("full jitter") — to spread retries out. Libraries like *tenacity* and *backoff* package all of this as decorators ([decorators](lesson:decorators)).` },
      ],
    },
    {
      title: '5. A deadline for every attempt',
      body: [
        py`A request that never answers is worse than one that fails: it holds a worker (and a semaphore slot) forever. \`asyncio.timeout()\` (3.11+) cancels the block when the deadline passes and raises \`TimeoutError\` at the \`async with\`:`,
        { code: py`import asyncio


async def slow_api():
    try:
        await asyncio.sleep(0.2)
        return "data"
    finally:
        print("slow_api cleaned up")   # cancellation runs finally blocks


async def main():
    try:
        async with asyncio.timeout(0.05):
            print(await slow_api())
    except TimeoutError:
        print("gave up after 0.05 s")


asyncio.run(main())`, lang: 'python', title: 'asyncio.timeout in action' },
        py`Under the hood the timeout cancels the current task (a \`CancelledError\` is raised at the pending \`await\`, \`finally\` blocks run) and converts the cancellation into \`TimeoutError\` when leaving the block. On 3.11+, \`asyncio.TimeoutError\` is the built-in \`TimeoutError\`.`,
        py`The timeout goes **per attempt**, not around the whole retry loop: each try gets its full 0.05 s. (A *total* deadline around everything is also useful — the two are complementary.) On Python before 3.11, \`await asyncio.wait_for(coro, timeout)\` does the per-call version.`,
        { callout: 'warn', title: 'Never swallow CancelledError', text: py`Cancellation is how timeouts and TaskGroups stop tasks. A bare \`except:\` or \`except BaseException:\` that doesn't re-raise \`CancelledError\` breaks timeouts in ways that are very hard to debug. \`except Exception:\` is safe here: since 3.8, \`CancelledError\` is a \`BaseException\`, not an \`Exception\`.` },
      ],
    },
    {
      title: '6. Bounded concurrency with a Semaphore',
      body: [
        py`An \`asyncio.Semaphore(3)\` is a counter with 3 permits. \`async with sem:\` takes one (waiting if none are left) and gives it back when the block ends — even if the block raises or is cancelled.`,
        { code: py`import asyncio

in_flight = peak = 0


async def request(sem, i):
    global in_flight, peak
    async with sem:
        in_flight += 1
        peak = max(peak, in_flight)
        await asyncio.sleep(0.01)
        in_flight -= 1


async def main():
    sem = asyncio.Semaphore(3)
    await asyncio.gather(*(request(sem, i) for i in range(10)))
    print("most at once:", peak)


asyncio.run(main())`, lang: 'python', title: 'measuring the limit' },
        py`*Where* you hold it matters. Look at the order in \`fetch_one\`:`,
        { code: py`    async def attempt():
        nonlocal tries
        async with semaphore:                              # 1. wait for a free slot...
            tries += 1
            async with asyncio.timeout(settings.timeout):  # 2. ...then start the clock
                return await client.fetch_product(product_id)`, lang: 'python', static: true, title: 'fetcher.py — one attempt' },
        py`- The **timeout is inside the semaphore**: time spent queueing for a slot doesn't count against the request's deadline. Otherwise a busy pipeline would time out requests that never even started.
- The **semaphore is inside the attempt**, and the retry loop wraps the attempt — so during a backoff sleep the slot is *free* for other products. Holding it while sleeping would waste a third of your capacity on doing nothing.
- \`nonlocal tries\` lets the inner function update the counter of the enclosing one ([closures](lesson:closures)).`,
      ],
    },
    {
      title: '7. fetch_one: failures become values',
      body: [
        py`\`fetch_one\` composes the pieces and then makes a crucial decision: **expected failures are returned, not raised.** Every id produces exactly one \`Outcome\`, holding either a \`Product\` or an error message:`,
        { code: py`    try:
        raw = await with_retries(attempt, attempts=settings.attempts,
                                 base=settings.base_delay, sleep=sleep)
    except TimeoutError:
        return Outcome(product_id, None, f"timed out after {tries} attempts", tries)
    except TransientError as exc:
        return Outcome(product_id, None, f"gave up after {tries} attempts: {exc}", tries)
    except PermanentError as exc:
        return Outcome(product_id, None, str(exc), tries)
    try:
        product = transform(raw)
    except ValueError as exc:
        return Outcome(product_id, None, f"invalid payload: {exc}", tries)
    return Outcome(product_id, product, None, tries)`, lang: 'python', static: true, title: 'fetcher.py — turning errors into Outcomes' },
        py`Why? Inside a TaskGroup, an exception escaping any task **cancels all the others**. That's exactly right for *bugs* (fail fast, don't produce a half-wrong report) and exactly wrong for "product 5 doesn't exist". So: expected, per-item problems → values in the report; unexpected exceptions → let them propagate.`,
        py`\`transform()\` (in \`models.py\`) is the validation boundary: it normalises the name (\`"  Wireless   mouse "\` → \`"Wireless mouse"\`), parses the price as a \`Decimal\` and rejects \`"N/A"\`, negative or non-finite prices, and bad stock values. Never let unvalidated remote data into the rest of the system ([input validation](lesson:input-validation)).`,
      ],
    },
    {
      title: '8. Stages connected by queues',
      body: [
        py`An \`asyncio.Queue\` hands items from producers to consumers. \`await queue.get()\` waits while it's empty; on a **bounded** queue (\`maxsize\`), \`await queue.put()\` waits while it's full. That second wait is **backpressure**: a fast producer automatically slows down to the speed of the workers instead of piling up millions of items in memory.`,
        { code: py`STOP = object()   # a unique sentinel: can never be confused with a real id


async def produce(ids, jobs, workers):
    for product_id in ids:
        await jobs.put(product_id)
    for _ in range(workers):
        await jobs.put(STOP)            # one per worker: each one stops exactly one


async def fetch_worker(client, jobs, results, semaphore, settings, sleep=asyncio.sleep):
    while True:
        product_id = await jobs.get()
        if product_id is STOP:
            await results.put(STOP)     # pass the news on to the collector
            return
        await results.put(await fetch_one(client, product_id, semaphore=semaphore,
                                          settings=settings, sleep=sleep))


async def collect(results, workers, report):
    finished = 0
    while finished < workers:           # done when EVERY worker has said so
        item = await results.get()
        if item is STOP:
            finished += 1
        else:
            report.add(item)
    return report`, lang: 'python', static: true, title: 'pipeline.py — the three stages' },
        py`Shutdown is the tricky part of every pipeline. Sentinels make it explicit: the producer knows how many workers exist, each worker forwards its stop signal, and the collector counts them. Get the counts wrong and something waits forever on an empty queue — the classic pipeline hang.`,
        { callout: 'version', title: 'Queue.shutdown() (3.13+)', text: py`Python 3.13 added \`Queue.shutdown()\`: after it, \`get()\` on an empty queue raises \`QueueShutDown\` instead of waiting, which can replace sentinels. Sentinels work on every version and make the protocol visible, so this project uses them.` },
      ],
    },
    {
      title: '9. One TaskGroup to run them all',
      body: [
        py`\`run_pipeline\` creates the queues and the semaphore, then starts every stage inside an \`asyncio.TaskGroup\` (3.11+):`,
        { code: py`async def run_pipeline(ids, client, *, workers=4, max_concurrency=3,
                       settings=FetchSettings(), queue_size=10, sleep=asyncio.sleep):
    ids = list(dict.fromkeys(ids))            # drop duplicates, keep the order
    jobs = asyncio.Queue(maxsize=queue_size)
    results = asyncio.Queue()
    semaphore = asyncio.Semaphore(max_concurrency)
    report = Report()
    async with asyncio.TaskGroup() as tg:
        tg.create_task(produce(ids, jobs, workers))
        for _ in range(workers):
            tg.create_task(fetch_worker(client, jobs, results, semaphore, settings, sleep))
        tg.create_task(collect(results, workers, report))
    return report                              # every task has finished here`, lang: 'python', static: true, title: 'pipeline.py — run_pipeline()' },
        py`This is **structured concurrency**: tasks can't outlive the block that started them. Leaving the \`async with\` means *all* of them are done. If any task raises, the group cancels the rest and raises an \`ExceptionGroup\` containing every error, which callers handle with \`except*\` ([exception groups](lesson:exception-groups)):`,
        { code: py`import asyncio


async def ok():
    await asyncio.sleep(0.01)


async def buggy():
    await asyncio.sleep(0.005)
    raise KeyError("price")


async def main():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(ok())
            tg.create_task(buggy())
    except* KeyError as group:
        print("bug found:", group.exceptions)


asyncio.run(main())`, lang: 'python', title: 'a failing task cancels its siblings' },
        py`Compare \`asyncio.gather()\`: by default the first exception is propagated but the other tasks *keep running* unsupervised; with \`return_exceptions=True\` errors become values in the result list. TaskGroup's "all or nothing" is the safer default — which is precisely why \`fetch_one\` returns expected failures as values.`,
      ],
    },
    {
      title: '10. Production: real clients and real limits',
      body: [
        py`Swap the fake for a real async HTTP client and the pipeline stays the same. With **httpx** (install it locally; no network in the sandbox):`,
        { code: py`import httpx

from errors import PermanentError, TransientError

TRANSIENT_STATUS = {429, 502, 503, 504}


class HttpCatalogClient:
    def __init__(self, base_url, token):
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=httpx.Timeout(5.0),
            limits=httpx.Limits(max_connections=10),
        )

    async def fetch_product(self, product_id):
        try:
            response = await self._client.get(f"/products/{product_id}")
        except httpx.TransportError as exc:          # DNS, refused, reset...
            raise TransientError(str(exc)) from exc
        if response.status_code in TRANSIENT_STATUS:
            raise TransientError(f"{response.status_code} for product {product_id}")
        if response.is_error:
            raise PermanentError(f"{response.status_code} for product {product_id}")
        return response.json()

    async def aclose(self):
        await self._client.aclose()`, lang: 'python', static: true, title: 'a real client with the same interface (run locally)' },
        py`Because the pipeline only needs "an object with \`async fetch_product(id)\`", the fake and the real client are interchangeable — a [protocol](lesson:protocols) in all but name. Things production adds:`,
        py`- **Rate limits**: a semaphore limits *concurrency*, not *requests per second*. APIs that allow "10 requests/second" need a token-bucket limiter, and \`429 Too Many Requests\` responses often include a \`Retry-After\` header you should honour instead of your own backoff.
- **Circuit breaker**: if most recent calls failed, stop calling for a while and fail fast, giving the remote service room to recover.
- **Connection reuse**: one shared \`AsyncClient\` (connection pool) for the whole run, closed at the end with \`async with\` or \`aclose()\`.
- **Observability**: log every retry and timeout with the product id ([logging](lesson:logging)), and export counts of successes, retries and failures — the report you built is the batch version of that.
- **Blocking code**: never call \`time.sleep()\`, \`requests.get()\` or heavy CPU work inside a coroutine — it freezes every task. Use \`await asyncio.to_thread(func, ...)\` for unavoidable blocking calls ([choosing a concurrency model](lesson:choosing-concurrency)).`,
      ],
    },
  ],

  challenges: [
    'Total deadline: give run_pipeline a deadline for the whole batch (asyncio.timeout around the TaskGroup). What happens to the report when it fires? Make it return a partial report with the unfinished ids listed as "not attempted".',
    'Jitter: add full jitter to backoff_delays using a random.Random(seed) passed in, so tests stay deterministic while production gets spread-out retries.',
    'Rate limiting (production concern): add a token-bucket limiter allowing at most N request starts per second, and prove it with the fake client by recording start times relative to the loop clock.',
    'Retry-After: let TransientError carry an optional retry_after seconds value (as a 429 would) and make with_retries prefer it over its own delay, still capped.',
    'Circuit breaker (production concern): after 5 consecutive failures, fail every request immediately for a cool-down period, then let one trial request through.',
    'Streaming results: turn the collector into an async generator (async def ... yield) so a caller can do async for outcome in pipeline(...) and show progress live.',
    'Graceful cancellation: press-stop semantics — cancel run_pipeline from outside after 3 products and check, with the fake client\'s in_flight counter, that nothing is left running.',
    'Use Queue.shutdown() (3.13+) instead of sentinels and compare the shutdown logic.',
  ],

  solution: {
    files: {
      'main.py': MAIN_PY,
      'pipeline.py': PIPELINE_SOLUTION,
      'fetcher.py': FETCHER_SOLUTION,
      'retry.py': RETRY_SOLUTION,
      'models.py': MODELS_PY,
      'fake_api.py': FAKE_API_PY,
      'errors.py': ERRORS_PY,
      'report.py': REPORT_PY,
    },
    explanation: [
      py`**retry.py**: \`backoff_delays\` is one comprehension, \`min(cap, base * factor**n)\` for the \`attempts - 1\` gaps. \`with_retries\` loops over the attempts, returns on the first success, catches only \`retry_on\` errors, re-raises with a bare \`raise\` on the final attempt and otherwise awaits the injected \`sleep\`.`,
      py`**fetcher.py**: an inner \`attempt()\` coroutine function holds the semaphore *only* while a request runs, starts the per-attempt \`asyncio.timeout\` after the slot is acquired, and counts tries via \`nonlocal\`. \`with_retries\` drives it; every expected failure — timeout, exhausted transient retries, permanent error, invalid payload — becomes an \`Outcome\` value.`,
      py`**pipeline.py**: \`produce\` fills a bounded queue and appends one \`STOP\` per worker; each \`fetch_worker\` turns ids into outcomes and forwards its \`STOP\`; \`collect\` counts \`STOP\`s to know when everything is finished. \`run_pipeline\` deduplicates ids and starts all stages in one \`TaskGroup\` sharing one \`Semaphore\`, so leaving the block guarantees every task is done — and any unexpected bug cancels the batch instead of producing a half-wrong report.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`\`async def\` creates a *coroutine function*. Calling it doesn't run anything — it returns a coroutine object. \`await\` runs it until it has to wait, and at that point the **event loop** switches to another task that's ready. There's still only one thread: tasks take turns at every \`await\`.`,
      { code: py`import asyncio


async def step(name, delay):
    print(name, "starts")
    await asyncio.sleep(delay)    # "I'm waiting — run someone else"
    print(name, "done")


async def main():
    await asyncio.gather(step("A", 0.02), step("B", 0.01))


asyncio.run(main())`, lang: 'python' },
    ],
    technical: [
      py`**Semaphores and queues are not thread-safe** — they don't need to be. asyncio tasks only switch at \`await\`, so code between two awaits runs without interruption. That's why \`self.in_flight += 1\` in the fake client is safe here but would be a race with threads ([threading](lesson:threading)).`,
      py`**Cancellation** is cooperative: \`task.cancel()\` schedules a \`CancelledError\` to be raised at the task's current \`await\`. \`asyncio.timeout()\` uses exactly this and, on exit, converts the cancellation it caused into \`TimeoutError\` (while still propagating cancellations that came from elsewhere). \`async with sem:\` releases the permit in its \`__aexit__\`, so cancellation can't leak permits.`,
      py`**TaskGroup** keeps references to its tasks (so they can't be garbage-collected mid-flight — a real pitfall with bare \`create_task()\`), waits for all of them in \`__aexit__\`, and on the first failure cancels the remaining tasks and raises an \`ExceptionGroup\` of the errors (excluding the cancellations it caused).`,
      { callout: 'note', title: 'CPython / sandbox detail', text: py`In the browser sandbox, asyncio runs on top of the JavaScript event loop (Pyodide's *webloop*), but the semantics — ordering at \`await\`, timeouts, cancellation — are those of CPython's asyncio. \`time.sleep()\` blocks the whole loop there too.` },
    ],
    production: [
      py`**Choose limits from the other side's capacity.** The right \`max_concurrency\` is set by the API's documented limits and your connection pool, not by "more is faster". Measure latency percentiles and error rates while ramping up.`,
      py`**Budget your retries.** Retries multiply load exactly when a service is struggling. Cap attempts, add jitter, honour \`Retry-After\`, and consider a retry *budget* (e.g. no more than a small fraction of requests may be retries) or a circuit breaker.`,
      py`**Make results auditable.** In batch jobs, the per-item outcome report (what succeeded, what failed and why, how many attempts) is what lets someone re-run only the failures tomorrow. Persist it — and make the operation idempotent so re-runs are safe.`,
    ],
  },
  mistakes: [
    {
      title: 'Blocking the event loop with time.sleep',
      wrong: { code: py`async def with_retries(operation, attempts=3):
    for attempt in range(attempts):
        try:
            return await operation()
        except TransientError:
            time.sleep(0.5)          # freezes EVERY task for 0.5 s`, lang: 'python', static: true },
      right: { code: py`async def with_retries(operation, attempts=3):
    for attempt in range(attempts):
        try:
            return await operation()
        except TransientError:
            await asyncio.sleep(0.5)   # only this task waits`, lang: 'python', static: true },
      explanation: py`\`time.sleep\` blocks the only thread, so no other task can run. \`await asyncio.sleep\` suspends just this coroutine. The same applies to blocking HTTP libraries and heavy CPU work.`,
    },
    {
      title: 'Holding the semaphore while backing off',
      wrong: { code: py`async with semaphore:
    raw = await with_retries(lambda: client.fetch_product(pid))   # sleeps inside the slot`, lang: 'python', static: true },
      right: { code: py`async def attempt():
    async with semaphore:
        return await client.fetch_product(pid)

raw = await with_retries(attempt)    # the slot is free during backoff`, lang: 'python', static: true },
      explanation: py`A product that's backing off doesn't need a connection. Holding the slot while sleeping silently reduces your real concurrency, sometimes to almost nothing during an outage.`,
    },
    {
      title: 'Retrying a coroutine object',
      wrong: { code: py`coro = client.fetch_product(3)
for attempt in range(3):
    try:
        return await coro      # RuntimeError: cannot reuse already awaited coroutine
    except TransientError:
        await asyncio.sleep(0.01)`, lang: 'python', static: true },
      right: { code: py`for attempt in range(3):
    try:
        return await client.fetch_product(3)   # a fresh coroutine each time
    except TransientError:
        await asyncio.sleep(0.01)`, lang: 'python', static: true },
      explanation: py`A coroutine object runs once. Retry helpers must receive a *function* that creates a new coroutine per attempt (\`operation\`, a lambda or an inner \`async def\`).`,
    },
    {
      title: 'Retrying everything',
      wrong: { code: py`except Exception:
    await asyncio.sleep(delay)   # retries 404s, bugs, validation errors...`, lang: 'python', static: true },
      right: { code: py`except (TransientError, TimeoutError):
    await asyncio.sleep(delay)   # only what can succeed next time`, lang: 'python', static: true },
      explanation: py`Retrying a 404 or a \`KeyError\` wastes time and load, and hides bugs behind slow failures. Retry a narrow, explicit set of transient errors.`,
    },
    {
      title: 'Too few stop signals',
      wrong: { code: py`async def produce(ids, jobs, workers):
    for product_id in ids:
        await jobs.put(product_id)
    await jobs.put(STOP)          # only ONE worker will ever stop`, lang: 'python', static: true },
      right: { code: py`async def produce(ids, jobs, workers):
    for product_id in ids:
        await jobs.put(product_id)
    for _ in range(workers):
        await jobs.put(STOP)      # one for each worker`, lang: 'python', static: true },
      explanation: py`Each worker consumes one sentinel and exits. With one sentinel and four workers, three wait forever on an empty queue, the collector never sees enough stops, and the TaskGroup never finishes.`,
    },
  ],
  debugging: [
    {
      symptom: py`The pipeline never finishes; no error, no output.`,
      cause: py`A shutdown mismatch: fewer \`STOP\`s than workers, a worker that \`return\`s without forwarding \`STOP\`, or a collector waiting for more stops than there are workers.`,
      fix: py`Count the sentinels on paper: producer puts \`workers\` stops, each worker forwards exactly one, the collector waits for \`workers\`. In tests, wrap runs in \`async with asyncio.timeout(5):\` so a hang becomes a \`TimeoutError\`.`,
    },
    {
      symptom: py`RuntimeError: cannot reuse already awaited coroutine`,
      cause: py`A retry loop awaited the same coroutine object twice.`,
      fix: py`Pass a callable that creates a new coroutine (\`lambda: client.fetch_product(pid)\` or an inner \`async def attempt()\`).`,
    },
    {
      symptom: py`ExceptionGroup: unhandled errors in a TaskGroup (1 sub-exception)`,
      cause: py`An exception escaped one task, so the group cancelled the others and re-raised it wrapped in a group.`,
      fix: py`Read the sub-exception's traceback (it's printed below). If it's an expected per-item failure, turn it into an \`Outcome\`; if it's a bug, fix it. Handle groups with \`except* SomeError\`.`,
    },
    {
      symptom: py`Everything "works" but the run takes as long as doing the requests one by one.`,
      cause: py`Something blocks the loop (\`time.sleep\`, a blocking HTTP client, CPU work) or the code awaits each request before starting the next (\`for ...: await fetch()\`).`,
      fix: py`Check \`max_in_flight\`; replace blocking calls with async ones or \`asyncio.to_thread\`; start work concurrently with tasks or a worker pool. Running with \`asyncio.run(main(), debug=True)\` logs callbacks that hog the loop.`,
    },
    {
      symptom: py`A timed-out request still seems to be "in flight" afterwards.`,
      cause: py`Cleanup code (decrementing a counter, releasing a connection) wasn't in a \`finally\` or \`async with\`, so cancellation skipped it.`,
      fix: py`Put cleanup in \`finally\` / context managers; cancellation runs them as it unwinds.`,
    },
  ],
  bestPractices: [
    'Retry only transient failures (and timeouts), with capped exponential backoff and jitter in production.',
    'Give every network attempt a deadline; put the timeout inside the semaphore.',
    'Hold scarce resources (semaphore slots, connections) only around the work that needs them.',
    'Use bounded queues for backpressure and explicit sentinels (or Queue.shutdown) for shutdown.',
    'Run related tasks in a TaskGroup so none can outlive or silently fail the batch.',
    'Return expected per-item failures as values; let unexpected exceptions propagate.',
    'Inject the client and the sleep function so tests are fast and deterministic.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-async-pipeline-q1',
      type: 'mcq',
      prompt: 'Four workers share `asyncio.Semaphore(3)`, and each request runs inside `async with sem:`. What does the semaphore guarantee?',
      options: [
        { text: 'Requests run in parallel on 3 CPU cores', why: 'asyncio runs on one thread; a semaphore limits concurrency, it doesn\'t add parallelism.' },
        'At most 3 requests are inside the block at any moment; the 4th waits for a permit',
        { text: 'At most 3 requests per second', why: 'That would be a rate limiter. A semaphore limits how many run at the same time, regardless of how fast they finish.' },
        { text: 'Only 3 of the 4 workers will ever do any work', why: 'Permits are returned when a block ends, so every worker gets turns.' },
      ],
      answer: 1,
      explanation: py`A semaphore is a counter of permits. \`async with\` takes one (waiting if none are free) and returns it on exit — even on errors or cancellation.`,
    },
    {
      id: 'project-async-pipeline-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`def backoff_delays(attempts, base=0.01, factor=2.0, cap=1.0):
    return [min(cap, base * factor**n) for n in range(attempts - 1)]


print(backoff_delays(5, base=0.25, cap=1.0))`,
      answer: '[0.25, 0.5, 1.0, 1.0]',
      accept: ['[0.25, 0.5, 1.0, 1.0]'],
      explanation: py`Five attempts have four gaps: 0.25, 0.5, 1.0, and 2.0 capped to 1.0.`,
    },
    {
      id: 'project-async-pipeline-q3',
      type: 'output',
      prompt: 'In what order are the names printed?',
      code: py`import asyncio


async def job(name, delay):
    await asyncio.sleep(delay)
    print(name)


async def main():
    await asyncio.gather(job("slow", 0.02), job("fast", 0.01))
    print("done")


asyncio.run(main())`,
      options: [
        { text: 'slow, fast, done', why: 'gather starts both coroutines concurrently; the one with the shorter sleep finishes first.' },
        'fast, slow, done',
        { text: 'done, fast, slow', why: 'await gather(...) only returns after both jobs have finished.' },
        { text: 'fast, done, slow', why: 'gather waits for all of its awaitables before returning.' },
      ],
      answer: 1,
      explanation: py`Both sleeps overlap; "fast" wakes first. \`gather\` returns only when both are done (and returns results in argument order, even though they *finished* in a different order).`,
    },
    {
      id: 'project-async-pipeline-q4',
      type: 'bug',
      prompt: 'This retry helper makes the whole pipeline stall during backoff. Click the line.',
      code: py`import asyncio
import time


async def with_retries(operation, attempts=3, delay=0.1):
    for attempt in range(attempts):
        try:
            return await operation()
        except TimeoutError:
            if attempt == attempts - 1:
                raise
            time.sleep(delay)`,
      answerLine: 12,
      explanation: py`\`time.sleep\` blocks the event loop's only thread, so *every* task stops while one product backs off. Use \`await asyncio.sleep(delay)\`.`,
    },
    {
      id: 'project-async-pipeline-q5',
      type: 'fill',
      prompt: 'Complete one attempt: wait for a free slot first, then give the request 0.05 seconds (Python 3.11+).',
      code: py`async def attempt(client, product_id, semaphore):
    async with ___:
        async with asyncio.___(0.05):
            return await client.fetch_product(product_id)`,
      answer: [['semaphore'], ['timeout']],
      explanation: py`The semaphore is outermost so queueing time doesn't eat into the deadline; \`asyncio.timeout(0.05)\` cancels the request and raises \`TimeoutError\` if it takes longer.`,
    },
    {
      id: 'project-async-pipeline-q6',
      type: 'mcq',
      prompt: 'Why does `fetch_one` return `Outcome(..., error="404 ...")` instead of letting `PermanentError` escape?',
      options: [
        { text: 'Exceptions are slower than return values', why: 'Performance is not the reason; correctness of the batch is.' },
        'An exception escaping a task in the TaskGroup would cancel every other in-flight fetch',
        { text: 'asyncio cannot propagate exceptions from tasks', why: 'It can — TaskGroup collects them into an ExceptionGroup.' },
        { text: 'So the error can be retried later automatically', why: 'Permanent errors are deliberately never retried.' },
      ],
      answer: 1,
      explanation: py`TaskGroup treats an escaping exception as "the batch failed" and cancels the siblings. Expected per-item failures are data for the report; only bugs should escape.`,
    },
    {
      id: 'project-async-pipeline-q7',
      type: 'short',
      prompt: 'Explain why the producer puts one STOP sentinel per worker, and what goes wrong with too few or too many.',
      answer: py`Each worker exits after consuming exactly one STOP. With too few, some workers wait forever on an empty queue, the collector never receives enough STOPs, and the TaskGroup never finishes — the pipeline hangs. Extra STOPs are left unconsumed in the queue (harmless here, but a sign the protocol is wrong, and on a bounded queue the producer could block forever trying to put them).`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-async-pipeline-why-asyncio',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is asyncio a good fit for this pipeline, and when would it be the wrong tool?',
      answer: 'The work is I/O-bound: each request mostly waits on the network, and asyncio overlaps thousands of waits on one thread with little overhead. It’s the wrong tool for CPU-bound work (parsing huge files, image processing), which blocks the loop — use processes for that — and awkward when your libraries are blocking (use threads or asyncio.to_thread).',
      explanation: py`asyncio gives concurrency, not parallelism: one thread switching at \`await\` points. That's ideal when tasks spend their time waiting and cheap compared with one thread per request. CPU-heavy code never awaits, so it starves every other task; multiprocessing (or a free-threaded build for some workloads) is the answer there. See [choosing a concurrency model](lesson:choosing-concurrency).`,
      whyAsked: 'Checks that you choose concurrency models from the workload, not from fashion.',
      mistakes: ['Saying asyncio runs code in parallel', 'Ignoring that one blocking call stalls everything', 'Not mentioning the async library ecosystem requirement'],
      followUps: ['What does asyncio.to_thread do?', 'How does the GIL relate to this?', 'How would you mix CPU-heavy transforms into this pipeline?'],
      modelAnswer: 'Fetching products is I/O-bound: almost all the time is spent waiting for the network. asyncio runs many of those waits concurrently on a single thread — each await hands control to the event loop — so I get high concurrency with very little overhead and no locking. It would be the wrong choice for CPU-bound steps, because code that never awaits blocks every other task; I would move that work to a process pool. And if I were stuck with blocking libraries, I would use threads or asyncio.to_thread rather than pretend they are async.',
    },
    {
      id: 'project-async-pipeline-rate-limits',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 6,
      question: 'The supplier announces a limit of 10 requests per second and starts answering 429 Too Many Requests with a Retry-After header. Your pipeline uses Semaphore(20). What changes?',
      answer: 'A semaphore limits concurrency, not rate, so add a rate limiter (e.g. a token bucket) that gates request starts at ≤ 10/s, treat 429 as transient, honour Retry-After (capped) instead of the computed backoff, add jitter, and probably lower concurrency. Monitor the 429 rate and consider a circuit breaker so the whole batch backs off together.',
      explanation: py`With fast responses, 20 concurrent requests can mean hundreds per second. A token bucket refills N tokens per second and each request must take one before starting. \`Retry-After\` is the server telling you exactly when to come back, which beats guessing. If many 429s arrive, a shared pause (circuit breaker or global backoff) prevents every worker from retrying in lockstep.`,
      whyAsked: 'Distinguishes engineers who know the difference between concurrency limits and rate limits — a common production incident.',
      mistakes: ['Just lowering the semaphore and hoping', 'Retrying 429s immediately', 'Ignoring Retry-After', 'Letting each worker back off independently with identical delays'],
      followUps: ['How would you implement a token bucket with asyncio?', 'How do you share a rate limit across several processes or machines?', 'How would you test it deterministically?'],
      modelAnswer: 'The semaphore only caps how many requests overlap; with fast responses twenty slots can still be far more than ten per second. I would add a token-bucket limiter in front of each request so starts never exceed ten per second, keep a modest concurrency limit for connections, and classify 429 as transient. When the server sends Retry-After I would wait that long, capped and with a little jitter, instead of my own exponential delay. If 429s keep coming I would trip a circuit breaker so the whole pipeline pauses together rather than every worker hammering the API. Across several processes the limit has to be shared, for example via Redis or by giving each process a fraction of the budget.',
    },
    {
      id: 'project-async-pipeline-hang',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate’s version of the pipeline processes every product and then hangs forever. There is no error. Their worker looks like this: `while not jobs.empty(): pid = await jobs.get(); ...` and the collector waits for one STOP per worker. What’s wrong?',
      answer: 'The worker exits when the queue is momentarily empty instead of on a sentinel, and it never forwards a STOP — so the collector waits forever for STOPs that never come. Also, checking empty() races with the producer: a worker can quit before the producer has put more items. Use a sentinel per worker and forward it to the collector.',
      explanation: py`\`queue.empty()\` is a snapshot, not a protocol: with a bounded queue or a slow producer it can be true while more work is coming. Shutdown has to be an explicit message. The collector's loop condition (\`finished < workers\`) then never becomes false, which is why nothing errors — everything is just waiting.`,
      whyAsked: 'Shutdown bugs are the most common failure in producer/consumer code.',
      mistakes: ['Adding a sleep before checking empty()', 'Cancelling tasks with a timeout and calling it fixed', 'Not realising the hang is in the collector, not the worker'],
      followUps: ['How does queue.join() / task_done() work, and when would you use it instead?', 'What does Queue.shutdown() (3.13) change?'],
      modelAnswer: 'Two problems. The worker uses jobs.empty() as its stop condition, which is only a snapshot — it can be empty for a moment while the producer is still adding ids, so workers may quit early. And when they quit they don’t forward a STOP, so the collector, which waits for one STOP per worker, waits forever; that’s why there is no error, just a hang. The fix is an explicit shutdown protocol: the producer puts one sentinel per worker after the real items, each worker exits on its sentinel and forwards one to the collector. In tests I would also wrap the run in asyncio.timeout so a hang turns into a clear failure.',
    },
    {
      id: 'project-async-pipeline-taskgroup-vs-gather',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `asyncio.gather()` and `asyncio.TaskGroup` for running the workers. Which would you choose here, and why?',
      answer: 'TaskGroup (3.11+): structured concurrency — no task outlives the block, the first failure cancels the siblings, and all errors surface as an ExceptionGroup. gather: returns results in order; on error it propagates the first exception but leaves the other tasks running unless you cancel them, or with return_exceptions=True returns errors as values. For a pipeline of cooperating stages, TaskGroup is safer; gather is handy for a flat list of independent calls whose results you want in order.',
      explanation: py`The failure semantics are the real difference. With gather, a crashed worker can leave the producer blocked on a full queue and the collector waiting forever, and those orphaned tasks keep running. TaskGroup cancels the rest and reports every error, so a bug ends the run cleanly.`,
      whyAsked: 'Tests understanding of error propagation and task lifetimes, not just API names.',
      mistakes: ['Thinking gather cancels the other tasks on failure by default', 'Not knowing TaskGroup raises ExceptionGroup', 'Ignoring the Python version requirement'],
      followUps: ['How do you handle an ExceptionGroup?', 'How would you write this on Python 3.10?'],
      modelAnswer: 'I would use a TaskGroup. It gives structured concurrency: every task is guaranteed to be finished when the block exits, and if one task raises, the group cancels the others and raises an ExceptionGroup with the real errors, which I can handle with except*. gather returns results in order, which is nice for a flat list of independent calls, but by default when one awaitable fails the exception propagates while the other tasks keep running, so in a pipeline a crashed worker could leave the producer or collector stuck. With return_exceptions=True gather turns errors into values instead. For connected stages, TaskGroup’s all-or-nothing behaviour is what I want — and I return expected per-item failures as values so they don’t trigger it.',
    },
    {
      id: 'project-async-pipeline-map-bounded',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Write `async def map_bounded(func, items, limit)` that awaits `func(item)` for every item with at most `limit` calls running at once, and returns the results in the same order as `items`. If any call raises, the exception should propagate (it’s fine if it arrives wrapped in an ExceptionGroup).',
      answer: 'Create one Semaphore(limit); wrap each call in a coroutine that holds the semaphore; start them all with a TaskGroup (or gather) and collect results by index.',
      explanation: py`Starting a task per item is fine — the semaphore, not the number of tasks, controls how many calls run at once. Keeping results in order is easiest with \`gather\` (which preserves argument order) or by storing each result at its index. For very large inputs you'd use a fixed pool of workers and a queue instead, so you don't create a million task objects up front.`,
      starter: { files: { 'main.py': py`import asyncio


async def map_bounded(func, items, limit):
    # TODO: at most \`limit\` calls at once, results in input order
    return [await func(item) for item in items]


async def double(x):
    await asyncio.sleep(0.01)
    return x * 2


print(asyncio.run(map_bounded(double, [1, 2, 3, 4], limit=2)))
` } },
      tests: [
        { name: 'results come back in input order', code: py`import asyncio
async def slow_first(x):
    await asyncio.sleep(0.02 if x == 1 else 0.005)
    return x * 10
async with asyncio.timeout(5):
    assert await map_bounded(slow_first, [1, 2, 3], limit=3) == [10, 20, 30]` },
        { name: 'never more than limit at once, but really concurrent', code: py`import asyncio
state = {"now": 0, "peak": 0}
async def tracked(x):
    state["now"] += 1
    state["peak"] = max(state["peak"], state["now"])
    await asyncio.sleep(0.01)
    state["now"] -= 1
    return x
async with asyncio.timeout(5):
    assert await map_bounded(tracked, list(range(9)), limit=3) == list(range(9))
assert state["peak"] == 3, state` },
        { name: 'errors propagate', code: py`import asyncio
async def boom(x):
    await asyncio.sleep(0.001)
    if x == 2:
        raise ValueError("bad item")
    return x
try:
    async with asyncio.timeout(5):
        await map_bounded(boom, [1, 2, 3], limit=2)
except* ValueError:
    pass
else:
    raise AssertionError("the ValueError was swallowed")` },
      ],
      solution: { files: { 'main.py': py`import asyncio


async def map_bounded(func, items, limit):
    semaphore = asyncio.Semaphore(limit)

    async def run(item):
        async with semaphore:
            return await func(item)

    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(run(item)) for item in items]
    return [task.result() for task in tasks]


async def double(x):
    await asyncio.sleep(0.01)
    return x * 2


print(asyncio.run(map_bounded(double, [1, 2, 3, 4], limit=2)))
` } },
      hints: ['One asyncio.Semaphore(limit) shared by every call.', 'Wrap each call: async def run(item): async with sem: return await func(item)', 'Start all of them in a TaskGroup and read task.result() in the original order.'],
      whyAsked: 'A compact, very common real-world utility that combines semaphores, task management, ordering and error handling.',
      mistakes: ['Creating a new semaphore per call (no limit at all)', 'Collecting results in completion order', 'Awaiting each call in the loop (sequential)'],
      followUps: ['How would you avoid creating a task per item for a million items?', 'How would you return errors as values instead of failing the whole batch?'],
      modelAnswer: 'I create one semaphore with the limit and wrap each call in a small coroutine that acquires it before awaiting func. Then I start one task per item inside a TaskGroup and, after the block, read each task’s result in the original order, so ordering doesn’t depend on which finished first. If any call raises, the TaskGroup cancels the rest and raises an ExceptionGroup, which satisfies the fail-fast requirement. For huge inputs I would switch to a fixed number of worker tasks pulling from a queue, so memory doesn’t grow with the input size.',
    },
  ],

  takeaways: [
    'asyncio overlaps waiting, not computing: it is the right tool for I/O-bound pipelines on one thread.',
    'Limit concurrency with a Semaphore, and hold it only while a request actually runs.',
    'Give every attempt a deadline with asyncio.timeout (3.11+); cancellation runs finally blocks, so clean up there.',
    'Retry only transient failures, with capped exponential backoff (plus jitter in production); never retry 404s or bugs.',
    'Connect stages with asyncio.Queue: bounded queues give backpressure, one sentinel per consumer gives clean shutdown.',
    'TaskGroup (3.11+) keeps tasks structured: none outlive the block, and a failure cancels the rest — so return expected per-item failures as values.',
    'Deterministic fakes with injected time make flaky-network code fully testable.',
  ],
}

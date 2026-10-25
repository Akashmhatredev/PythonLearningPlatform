// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------ data

const ACCESS_LOG = py`198.51.100.23 - - [12/Mar/2026:09:02:11 +0000] "GET / HTTP/1.1" 200 5120 12ms
198.51.100.23 - - [12/Mar/2026:09:02:12 +0000] "GET /static/app.css HTTP/1.1" 200 2048 3ms
203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms
203.0.113.7 - - [12/Mar/2026:09:05:42 +0000] "GET /api/products?page=2 HTTP/1.1" 200 790 51ms
192.0.2.44 - - [12/Mar/2026:09:11:03 +0000] "POST /api/login HTTP/1.1" 401 64 120ms
192.0.2.44 - - [12/Mar/2026:09:11:09 +0000] "POST /api/login HTTP/1.1" 200 128 135ms
=== server restarted ===
203.0.113.7 - - [12/Mar/2026:09:14:27 +0000] "GET /api/products/42 HTTP/1.1" 200 640 22ms
198.51.100.9 - - [12/Mar/2026:09:31:55 +0000] "GET /favicon.ico HTTP/1.1" 404 - 2ms
203.0.113.7 - - [12/Mar/2026:09:47:18 +0000] "POST /api/cart HTTP/1.1" 201 256 87ms
198.51.100.23 - - [12/Mar/2026:10:00:02 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 45ms
203.0.113.50 - - [12/Mar/2026:10:03:31 +0000] "GET /api/products/7 HTTP/1.1" 500 92 1840ms
203.0.113.50 - - [12/Mar/2026:10:03:35 +0000] "GET /api/products/7 HTTP/1.1" 500 92 1795ms
203.0.113.7 - - [12/Mar/2026:10:05:00 +0000] "POST /api/checkout HTTP/1.1" 200 512 640ms
203.0.113.7 - - [12/Mar/2026:10:05:02 +0000] "GET /api/orders/9001 HTT
192.0.2.44 - - [12/Mar/2026:10:12:45 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 47ms
192.0.2.44 - - [12/Mar/2026:10:12:49 +0000] "DELETE /api/cart/3 HTTP/1.1" 204 - 33ms
198.51.100.9 - - [12/Mar/2026:10:20:13 +0000] "GET /admin HTTP/1.1" 403 128 4ms
198.51.100.9 - - [12/Mar/2026:10:20:14 +0000] "GET /wp-login.php HTTP/1.1" 404 - 3ms
198.51.100.23 - - [12/Mar/2026:10:41:09 +0000] "GET /api/products/42 HTTP/1.1" 200 640 25ms
203.0.113.50 - - [12/Mar/2026:10:58:30 +0000] "GET /api/products/7 HTTP/1.1" 200 655 61ms
198.51.100.23 - - [31/Feb/2026:11:00:00 +0000] "GET / HTTP/1.1" 200 5120 11ms
203.0.113.7 - - [12/Mar/2026:11:02:40 +0000] "GET /api/products?page=3 HTTP/1.1" 200 640 44ms
203.0.113.7 - - [12/Mar/2026:11:02:58 +0000] "POST /api/checkout HTTP/1.1" 502 0 3005ms
203.0.113.7 - - [12/Mar/2026:11:03:30 +0000] "POST /api/checkout HTTP/1.1" 200 512 702ms
192.0.2.44 - - [12/Mar/2026:11:15:12 +0000] "GET /api/orders HTTP/1.1" 200 1024 95ms

198.51.100.9 - - [12/Mar/2026:11:30:00 +0000] "GET /.env HTTP/1.1" 404 - 2ms
192.0.2.44 - - [12/Mar/2026:11:44:21 +0000] "PUT /api/profile HTTP/1.1" 200 210 58ms
198.51.100.23 - - [12/Mar/2026:11:59:59 +0000] "get / HTTP/1.1" 200 5120 10ms
198.51.100.23 - - [12/Mar/2026:11:59:59 +0000] "GET / HTTP/1.1" 200 5120 10ms
`

// ------------------------------------------------------------ shared files

const MAIN_PY = py`"""Entry point. In a terminal you would run e.g.:  python main.py access.log --errors-only"""
from cli import main

DEMO_ARGS = ["--errors-only", "--top", "3"]

if __name__ == "__main__":
    try:
        main()                     # like running:  python main.py
        print("\n$ python main.py " + " ".join(DEMO_ARGS))
        main(DEMO_ARGS)            # like running:  python main.py --errors-only --top 3
    except NotImplementedError as exc:
        print(f"[not built yet] {exc}")
`

const REPORT_PY = py`"""Turn a Summary into text. Pure formatting: no parsing, no I/O."""

BAR_WIDTH = 20


def bar(count, total):
    return "#" * round(BAR_WIDTH * count / total) if total else ""


def format_report(summary, top=5):
    if summary.total == 0:
        return "No matching requests."
    lines = [
        f"Requests: {summary.total} | bytes sent: {summary.total_bytes:,} | "
        f"avg time: {summary.avg_duration_ms:.1f} ms",
        "",
        "Status codes:",
    ]
    for status, count in sorted(summary.status_counts.items()):
        lines.append(f"  {status}  {count:>4}  {bar(count, summary.total)}")

    lines += ["", f"Top {top} paths:"]
    for path, count in summary.path_counts.most_common(top):
        lines.append(f"  {count:>4}  {path}")

    lines += ["", "Errors (4xx/5xx) per hour:"]
    if not summary.errors_per_hour:
        lines.append("  none")
    for hour, count in sorted(summary.errors_per_hour.items()):
        lines.append(f"  {hour}  {count:>4}")

    lines += ["", f"Slowest {len(summary.slowest)} requests:"]
    for record in summary.slowest:
        when = record.timestamp.strftime("%H:%M:%S")
        lines.append(
            f"  {record.duration_ms:>6} ms  {record.method} {record.path} "
            f"-> {record.status}  at {when}"
        )
    return "\n".join(lines)
`

const STATS_HEAD = py`"""Aggregate records in ONE pass: the records may be a generator."""
import heapq
from collections import Counter
from dataclasses import dataclass, field


@dataclass
class Summary:
    total: int = 0
    total_bytes: int = 0
    total_duration_ms: int = 0
    status_counts: Counter = field(default_factory=Counter)
    path_counts: Counter = field(default_factory=Counter)
    errors_per_hour: Counter = field(default_factory=Counter)
    slowest: list = field(default_factory=list)

    @property
    def avg_duration_ms(self):
        return self.total_duration_ms / self.total if self.total else 0.0

    def top_paths(self, n=5):
        return self.path_counts.most_common(n)
`

// ------------------------------------------------------------ starter

const PARSING_STARTER = py`"""Turn raw log lines into LogRecord objects."""
import re
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlsplit

# One line looks like:
# 203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms
LOG_PATTERN = re.compile(
    r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3}) \S+ \S+ '
    r'\[(?P<time>[^\]]+)\] '
    # TODO: "(?P<method>...) (?P<target>...) HTTP/..." in double quotes,
    #       then (?P<status>...) (?P<size>...) (?P<duration>...)ms
)
TIME_FORMAT = "%d/%b/%Y:%H:%M:%S %z"


@dataclass(frozen=True, slots=True)
class LogRecord:
    ip: str
    timestamp: datetime
    method: str
    path: str
    query: str
    status: int
    size: int
    duration_ms: int

    @property
    def is_error(self):
        return self.status >= 400

    @property
    def hour(self):
        return self.timestamp.strftime("%Y-%m-%d %H:00")


def parse_line(line):
    """Return a LogRecord, or None if the line is malformed."""
    # TODO: LOG_PATTERN.fullmatch(...), strptime with TIME_FORMAT (bad date -> None),
    #       urlsplit the target into path + query, "-" size -> 0, ints for numbers
    raise NotImplementedError("TODO: parse_line()")
`

const PIPELINE_STARTER = py`"""Lazy pipeline stages. Each one is a generator pulling from the previous one."""
from parsing import parse_line


def read_lines(path):
    """Yield every line of the file without its trailing newline, one at a time."""
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            yield line.rstrip("\n")


def parse_records(lines, errors=None):
    # TODO: a generator. Number the lines from 1, skip blank lines,
    #       yield a LogRecord for each good line, and append
    #       (line_number, line) to errors (if given) for each malformed one.
    raise NotImplementedError("TODO: parse_records()")


def filter_records(records, *, status=None, method=None, path_prefix=None,
                   since=None, until=None, errors_only=False):
    # TODO: a generator that only yields records matching EVERY given filter.
    #       method is case-insensitive; since <= timestamp < until.
    raise NotImplementedError("TODO: filter_records()")
`

const STATS_STARTER = STATS_HEAD + py`

def summarize(records, slowest=3):
    # TODO: one loop over records that updates every field of a Summary.
    #       Keep only the n slowest records (a heap of size n), slowest first,
    #       earlier record first when durations tie. Errors = status >= 400.
    raise NotImplementedError("TODO: summarize()")
`

const CLI_STARTER = py`"""Command-line interface: argparse options -> pipeline -> report."""
import argparse
import sys
from datetime import datetime, timezone

from pipeline import filter_records, parse_records, read_lines
from report import format_report
from stats import summarize

METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]


def positive_int(text):
    # TODO: raise argparse.ArgumentTypeError for non-numbers, 0 and negatives
    return int(text)


def iso_datetime(text):
    # TODO: datetime.fromisoformat(text); a naive result means UTC;
    #       invalid text -> argparse.ArgumentTypeError
    raise NotImplementedError("TODO: iso_datetime()")


def build_parser():
    parser = argparse.ArgumentParser(
        prog="loganalyzer", description="Summarise a web server access log."
    )
    parser.add_argument("logfile", nargs="?", default="access.log", help="log file to read")
    parser.add_argument("--status", type=int, help="only this status code, e.g. 404")
    parser.add_argument("--method", help="only this HTTP method")  # TODO: upper-case + choices
    parser.add_argument("--path", dest="path_prefix", help="only paths starting with this")
    parser.add_argument("--since", type=iso_datetime, help="ISO time, e.g. 2026-03-12T10:00")
    parser.add_argument("--until", type=iso_datetime, help="ISO time (exclusive)")
    parser.add_argument("--errors-only", action="store_true", help="only 4xx and 5xx")
    parser.add_argument("--top", type=positive_int, default=5, help="how many paths to list")
    parser.add_argument("--slowest", type=positive_int, default=3, help="how many slow requests")
    return parser


def analyze(args):
    malformed = []
    records = parse_records(read_lines(args.logfile), errors=malformed)
    records = filter_records(
        records, status=args.status, method=args.method, path_prefix=args.path_prefix,
        since=args.since, until=args.until, errors_only=args.errors_only,
    )
    report = format_report(summarize(records, slowest=args.slowest), top=args.top)
    if malformed:
        numbers = ", ".join(str(n) for n, _ in malformed)
        report += f"\n\nSkipped {len(malformed)} malformed line(s): {numbers}"
    return report


def run(argv=None):
    """Parse argv (None means sys.argv[1:]) and return the report text."""
    return analyze(build_parser().parse_args(argv))


def main(argv=None):
    try:
        report = run(argv)
    except FileNotFoundError as exc:
        print(f"loganalyzer: error: cannot open {exc.filename!r}", file=sys.stderr)
        return 1
    print(report)
    return 0
`

// ------------------------------------------------------------ solution

const PARSING_SOLUTION = py`"""Turn raw log lines into LogRecord objects."""
import re
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlsplit

# One line looks like:
# 203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms
LOG_PATTERN = re.compile(
    r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3}) \S+ \S+ '
    r'\[(?P<time>[^\]]+)\] '
    r'"(?P<method>[A-Z]+) (?P<target>\S+) HTTP/[\d.]+" '
    r'(?P<status>\d{3}) (?P<size>\d+|-) (?P<duration>\d+)ms'
)
TIME_FORMAT = "%d/%b/%Y:%H:%M:%S %z"


@dataclass(frozen=True, slots=True)
class LogRecord:
    ip: str
    timestamp: datetime
    method: str
    path: str
    query: str
    status: int
    size: int
    duration_ms: int

    @property
    def is_error(self):
        return self.status >= 400

    @property
    def hour(self):
        return self.timestamp.strftime("%Y-%m-%d %H:00")


def parse_line(line):
    """Return a LogRecord, or None if the line is malformed."""
    match = LOG_PATTERN.fullmatch(line.strip())
    if match is None:
        return None
    try:
        timestamp = datetime.strptime(match["time"], TIME_FORMAT)
    except ValueError:  # e.g. 31/Feb: the shape was right, the date is impossible
        return None
    target = urlsplit(match["target"])
    size = match["size"]
    return LogRecord(
        ip=match["ip"],
        timestamp=timestamp,
        method=match["method"],
        path=target.path,
        query=target.query,
        status=int(match["status"]),
        size=0 if size == "-" else int(size),
        duration_ms=int(match["duration"]),
    )
`

const PIPELINE_SOLUTION = py`"""Lazy pipeline stages. Each one is a generator pulling from the previous one."""
from parsing import parse_line


def read_lines(path):
    """Yield every line of the file without its trailing newline, one at a time."""
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            yield line.rstrip("\n")


def parse_records(lines, errors=None):
    for number, line in enumerate(lines, start=1):
        if not line.strip():
            continue
        record = parse_line(line)
        if record is None:
            if errors is not None:
                errors.append((number, line))
            continue
        yield record


def filter_records(records, *, status=None, method=None, path_prefix=None,
                   since=None, until=None, errors_only=False):
    method = method.upper() if method else None
    for record in records:
        if status is not None and record.status != status:
            continue
        if method is not None and record.method != method:
            continue
        if path_prefix is not None and not record.path.startswith(path_prefix):
            continue
        if since is not None and record.timestamp < since:
            continue
        if until is not None and record.timestamp >= until:
            continue
        if errors_only and not record.is_error:
            continue
        yield record
`

const STATS_SOLUTION = STATS_HEAD + py`

def summarize(records, slowest=3):
    summary = Summary()
    heap = []  # min-heap of (duration, -sequence, record); its root is the fastest kept
    for sequence, record in enumerate(records):
        summary.total += 1
        summary.total_bytes += record.size
        summary.total_duration_ms += record.duration_ms
        summary.status_counts[record.status] += 1
        summary.path_counts[record.path] += 1
        if record.is_error:
            summary.errors_per_hour[record.hour] += 1

        item = (record.duration_ms, -sequence, record)
        if len(heap) < slowest:
            heapq.heappush(heap, item)
        elif slowest:
            heapq.heappushpop(heap, item)  # push, then drop the fastest

    summary.slowest = [record for _, _, record in sorted(heap, reverse=True)]
    return summary
`

const CLI_SOLUTION = py`"""Command-line interface: argparse options -> pipeline -> report."""
import argparse
import sys
from datetime import datetime, timezone

from pipeline import filter_records, parse_records, read_lines
from report import format_report
from stats import summarize

METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]


def positive_int(text):
    try:
        value = int(text)
    except ValueError:
        raise argparse.ArgumentTypeError(f"not a whole number: {text!r}") from None
    if value < 1:
        raise argparse.ArgumentTypeError(f"must be at least 1, got {value}")
    return value


def iso_datetime(text):
    try:
        value = datetime.fromisoformat(text)
    except ValueError:
        raise argparse.ArgumentTypeError(
            f"not an ISO date/time: {text!r} (try 2026-03-12T10:00)"
        ) from None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)  # the log is in UTC
    return value


def build_parser():
    parser = argparse.ArgumentParser(
        prog="loganalyzer", description="Summarise a web server access log."
    )
    parser.add_argument("logfile", nargs="?", default="access.log", help="log file to read")
    parser.add_argument("--status", type=int, help="only this status code, e.g. 404")
    parser.add_argument("--method", type=str.upper, choices=METHODS, help="only this HTTP method")
    parser.add_argument("--path", dest="path_prefix", help="only paths starting with this")
    parser.add_argument("--since", type=iso_datetime, help="ISO time, e.g. 2026-03-12T10:00")
    parser.add_argument("--until", type=iso_datetime, help="ISO time (exclusive)")
    parser.add_argument("--errors-only", action="store_true", help="only 4xx and 5xx")
    parser.add_argument("--top", type=positive_int, default=5, help="how many paths to list")
    parser.add_argument("--slowest", type=positive_int, default=3, help="how many slow requests")
    return parser


def analyze(args):
    malformed = []
    records = parse_records(read_lines(args.logfile), errors=malformed)
    records = filter_records(
        records, status=args.status, method=args.method, path_prefix=args.path_prefix,
        since=args.since, until=args.until, errors_only=args.errors_only,
    )
    report = format_report(summarize(records, slowest=args.slowest), top=args.top)
    if malformed:
        numbers = ", ".join(str(n) for n, _ in malformed)
        report += f"\n\nSkipped {len(malformed)} malformed line(s): {numbers}"
    return report


def run(argv=None):
    """Parse argv (None means sys.argv[1:]) and return the report text."""
    return analyze(build_parser().parse_args(argv))


def main(argv=None):
    try:
        report = run(argv)
    except FileNotFoundError as exc:
        print(f"loganalyzer: error: cannot open {exc.filename!r}", file=sys.stderr)
        return 1
    print(report)
    return 0
`

// ------------------------------------------------------------ tests (platform)

const GOOD_LINE = '203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms'

const TESTS = [
  {
    name: 'LOG_PATTERN is a compiled regex with the named groups the parser needs',
    code: py`import re
parsing = module('parsing')
assert isinstance(parsing.LOG_PATTERN, re.Pattern)
needed = {"ip", "time", "method", "target", "status", "size", "duration"}
missing = needed - set(parsing.LOG_PATTERN.groupindex)
assert not missing, f"add these named groups: {sorted(missing)}"`,
  },
  {
    name: 'parse_line() turns a good line into a LogRecord with real types',
    code: py`from datetime import datetime, timezone
parsing = module('parsing')
r = parsing.parse_line('${GOOD_LINE}')
assert r is not None, 'this line is valid and should parse'
assert r.ip == "203.0.113.7" and r.method == "GET"
assert r.path == "/api/products" and r.query == "page=1"
assert (r.status, r.size, r.duration_ms) == (200, 812, 48)
assert r.timestamp == datetime(2026, 3, 12, 9, 5, 40, tzinfo=timezone.utc)
assert r.hour == "2026-03-12 09:00"`,
  },
  {
    name: 'parse_line() maps a "-" size to 0 and keeps paths without a query',
    code: py`parsing = module('parsing')
r = parsing.parse_line('198.51.100.9 - - [12/Mar/2026:09:31:55 +0000] "GET /favicon.ico HTTP/1.1" 404 - 2ms')
assert r is not None
assert (r.path, r.query, r.size, r.status) == ("/favicon.ico", "", 0, 404)
assert r.is_error`,
  },
  {
    name: 'parse_line() returns None for malformed lines instead of crashing',
    code: py`parsing = module('parsing')
bad = [
    "=== server restarted ===",
    '203.0.113.7 - - [12/Mar/2026:10:05:02 +0000] "GET /api/orders/9001 HTT',
    '198.51.100.23 - - [31/Feb/2026:11:00:00 +0000] "GET / HTTP/1.1" 200 5120 11ms',
    '198.51.100.23 - - [12/Mar/2026:11:59:59 +0000] "get / HTTP/1.1" 200 5120 10ms',
    '198.51.100.23 - - [12/Mar/2026:11:59:59 +0000] "GET / HTTP/1.1" 2OO 5120 10ms',
    '${GOOD_LINE} trailing junk',
]
for line in bad:
    assert parsing.parse_line(line) is None, f"should be rejected: {line!r}"`,
  },
  {
    name: 'read_lines() is a lazy generator that strips the newline',
    code: py`import inspect
pipeline = module('pipeline')
lines = pipeline.read_lines("access.log")
assert inspect.isgenerator(lines)
assert next(lines) == '198.51.100.23 - - [12/Mar/2026:09:02:11 +0000] "GET / HTTP/1.1" 200 5120 12ms'`,
  },
  {
    name: 'parse_records() is lazy: it yields the first record before reading further',
    code: py`import inspect
pipeline = module('pipeline')

def lines():
    yield '${GOOD_LINE}'
    raise RuntimeError("read too far: parse_records is not lazy")

records = pipeline.parse_records(lines())
assert inspect.isgenerator(records), 'parse_records should be a generator function (use yield)'
assert next(records).path == "/api/products"`,
  },
  {
    name: 'parse_records() skips blank lines and reports malformed ones with their line numbers',
    code: py`pipeline = module('pipeline')
errors = []
records = list(pipeline.parse_records(pipeline.read_lines("access.log"), errors=errors))
assert len(records) == 26
assert [n for n, _ in errors] == [7, 15, 22, 30]
assert errors[0] == (7, "=== server restarted ===")
assert len(list(pipeline.parse_records(["", "   ", "nonsense"]))) == 0`,
  },
  {
    name: 'filter_records() applies status, method (any case), path prefix and errors_only',
    code: py`import inspect
pipeline = module('pipeline')
def records():
    return pipeline.parse_records(pipeline.read_lines("access.log"))
assert inspect.isgenerator(pipeline.filter_records(records()))
assert len(list(pipeline.filter_records(records()))) == 26
assert len(list(pipeline.filter_records(records(), status=404))) == 3
assert len(list(pipeline.filter_records(records(), method="post"))) == 6
assert len(list(pipeline.filter_records(records(), path_prefix="/api/products"))) == 10
assert len(list(pipeline.filter_records(records(), errors_only=True))) == 8
assert len(list(pipeline.filter_records(records(), method="GET", status=500))) == 2`,
  },
  {
    name: 'filter_records() keeps since <= timestamp < until',
    code: py`from datetime import datetime, timezone
pipeline = module('pipeline')
ten = datetime(2026, 3, 12, 10, 0, tzinfo=timezone.utc)
eleven = datetime(2026, 3, 12, 11, 0, tzinfo=timezone.utc)
recs = list(pipeline.filter_records(
    pipeline.parse_records(pipeline.read_lines("access.log")), since=ten, until=eleven))
assert len(recs) == 10
assert all(ten <= r.timestamp < eleven for r in recs)`,
  },
  {
    name: 'summarize() counts totals, bytes and status codes in one pass over a generator',
    code: py`pipeline, stats = module('pipeline'), module('stats')
s = stats.summarize(pipeline.parse_records(pipeline.read_lines("access.log")))
assert s.total == 26
assert s.total_bytes == 21107
assert s.status_counts == {200: 16, 201: 1, 204: 1, 401: 1, 403: 1, 404: 3, 500: 2, 502: 1}
assert round(s.avg_duration_ms, 1) == 341.9`,
  },
  {
    name: 'summarize() finds the top paths (query strings ignored) and errors per hour',
    code: py`pipeline, stats = module('pipeline'), module('stats')
s = stats.summarize(pipeline.parse_records(pipeline.read_lines("access.log")))
assert s.path_counts.most_common(3) == [("/api/products", 5), ("/api/products/7", 3), ("/api/checkout", 3)]
assert s.errors_per_hour == {"2026-03-12 09:00": 2, "2026-03-12 10:00": 4, "2026-03-12 11:00": 2}`,
  },
  {
    name: 'summarize() keeps the n slowest requests, slowest first, earliest first on ties',
    code: py`from datetime import datetime, timezone
parsing, stats = module('parsing'), module('stats')
t = datetime(2026, 3, 12, 9, 0, tzinfo=timezone.utc)
def rec(path, ms):
    return parsing.LogRecord(ip="192.0.2.1", timestamp=t, method="GET", path=path,
                             query="", status=200, size=10, duration_ms=ms)
data = [rec("/a", 50), rec("/b", 900), rec("/c", 50), rec("/d", 300), rec("/e", 900)]
s = stats.summarize(iter(data), slowest=3)
assert [r.path for r in s.slowest] == ["/b", "/e", "/d"]
empty = stats.summarize(iter([]))
assert (empty.total, empty.slowest, empty.avg_duration_ms) == (0, [], 0.0)`,
  },
  {
    name: 'build_parser() understands every option and rejects bad values',
    code: py`from datetime import datetime, timezone
cli = module('cli')
p = cli.build_parser()
args = p.parse_args(["web.log", "--status", "500", "--method", "post", "--top", "3",
                     "--errors-only", "--since", "2026-03-12T10:00"])
assert args.logfile == "web.log" and args.status == 500 and args.method == "POST"
assert args.top == 3 and args.errors_only is True
assert args.since == datetime(2026, 3, 12, 10, 0, tzinfo=timezone.utc)
defaults = p.parse_args([])
assert (defaults.logfile, defaults.top, defaults.slowest, defaults.status) == ("access.log", 5, 3, None)
for bad in (["--top", "0"], ["--top", "x"], ["--since", "yesterday"], ["--method", "FETCH"]):
    with raises(SystemExit):
        p.parse_args(bad)`,
  },
  {
    name: 'run(argv) produces the full report, including skipped line numbers',
    code: py`cli = module('cli')
report = cli.run(["access.log", "--errors-only", "--top", "2"])
assert report.startswith("Requests: 8 | bytes sent: 376 |"), report.splitlines()[0]
assert "Top 2 paths:" in report
assert "  2026-03-12 10:00     4" in report
assert "    3005 ms  POST /api/checkout -> 502  at 11:02:58" in report
assert report.endswith("Skipped 4 malformed line(s): 7, 15, 22, 30")
assert cli.run(["access.log", "--status", "418"]).startswith("No matching requests.")`,
  },
]

export default {
  id: 'project-log-analyzer',
  kind: 'project',
  title: 'Project 6: Log File Analyzer',
  summary: 'Build a command-line tool that streams a web server log through a lazy generator pipeline — regex parsing, filtering, one-pass aggregation — and prints a clear report.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['regular-expressions', 'generators', 'lazy-evaluation', 'collections-module', 'command-line-programs'],
  related: ['project-inventory-system', 'project-async-pipeline', 'dates-and-times', 'dataclasses', 'reading-writing-files', 'iterators', 'itertools', 'performance', 'string-formatting', 'logging', 'main-guard-and-scripts', 'http-and-rest'],
  tags: ['project', 'log analyzer', 'logs', 'access log', 're', 'regex', 'named groups', 'fullmatch', 'generator pipeline', 'lazy evaluation', 'Counter', 'heapq', 'argparse', 'CLI', 'datetime', 'strptime', 'malformed data'],
  apis: [
    { name: 're.compile() / Pattern.fullmatch()', summary: 'Compile a pattern once; fullmatch() succeeds only if the whole string matches.' },
    { name: '(?P<name>...) / match["name"]', summary: 'Named groups label parts of a regex; read them by name from the match object.' },
    { name: 'datetime.strptime(text, fmt)', summary: 'Parse text into a datetime; %z reads offsets like +0000 into a timezone-aware value.' },
    { name: 'urllib.parse.urlsplit()', summary: 'Split "/api/products?page=1" into path "/api/products" and query "page=1".' },
    { name: 'collections.Counter / most_common(n)', summary: 'Count hashable things; most_common returns the n biggest counts (ties in first-seen order).' },
    { name: 'heapq.heappushpop()', summary: 'Push then pop the smallest item — keeps a bounded "top n" in one pass.' },
    { name: 'argparse.ArgumentParser.parse_args(argv)', summary: 'Parse a list of arguments (sys.argv[1:] when argv is None); exits with status 2 on bad input.' },
  ],
  docs: [
    { label: 're — Regular expression operations', url: 'https://docs.python.org/3/library/re.html' },
    { label: 'Generator expressions and generators (functional HOWTO)', url: 'https://docs.python.org/3/howto/functional.html#generators' },
    { label: 'collections.Counter', url: 'https://docs.python.org/3/library/collections.html#collections.Counter' },
    { label: 'heapq — Heap queue algorithm', url: 'https://docs.python.org/3/library/heapq.html' },
    { label: 'argparse — Parser for command-line options', url: 'https://docs.python.org/3/library/argparse.html' },
    { label: 'datetime — strftime() and strptime() format codes', url: 'https://docs.python.org/3/library/datetime.html#format-codes' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Every time someone visits a website, the web server writes one line to an **access log**: who asked (IP address), when, what (\`GET /api/products\`), how it went (status \`200\`, \`404\`, \`500\`), how big the answer was and how long it took. A busy site writes millions of these lines a day.`,
    py`When the site is slow or broken, those logs are the first place engineers look. In this project you build **loganalyzer**, a command-line tool that reads a log and answers: *How many requests? Which status codes? Which pages are hit most? When did the errors happen? Which requests were slowest?*`,
    py`You'll combine a [compiled regular expression](lesson:regular-expressions) with named groups, a chain of [generators](lesson:generators) that processes one line at a time ([lazy pipelines](lesson:lazy-evaluation)), [Counter and heapq](lesson:collections-module) for aggregation, and [argparse](lesson:command-line-programs) for options — plus honest handling of the broken lines that every real log contains.`,
  ],
  why: [
    py`Logs are *big*. Reading a 10 GB file with \`readlines()\` tries to hold all of it in memory at once. A generator pipeline reads one line, parses it, counts it, forgets it — so memory stays small and constant no matter how big the file is.`,
    py`Logs are also *messy*. Servers restart mid-line, files get truncated, someone pastes a note in. A good tool doesn't crash on line 4,000,001; it skips the bad line, counts it and tells you where it was.`,
    py`And the pattern is everywhere: read → parse → filter → aggregate → report is how data pipelines, ETL jobs and monitoring tools are built. Learn it here on 31 lines, and it scales to billions.`,
  ],
  eli15: [
    py`Imagine a supermarket receipt roll that's a kilometre long. You want to know which product sold most. You wouldn't cut the whole roll into pieces and spread them on the floor first — you'd unroll it a bit at a time, read each line, put a tally mark next to the product on your notepad, and let the read part fall behind you.`,
    py`That's a **generator pipeline**: one person unrolls (\`read_lines\`), one reads each line and writes it neatly on a card (\`parse_records\`), one throws away cards you don't care about (\`filter_records\`), one keeps the tally (\`summarize\`). Each passes a single card along when the next person asks for it.`,
    py`If a line is smudged and unreadable, you don't stop the whole shop — you note "line 7 was smudged" and carry on.`,
  ],
  analogy: {
    title: 'A bucket brigade',
    body: [
      py`In a bucket brigade, people stand in a line and pass buckets along one at a time. Nobody holds all the water; each person does one small job and hands the bucket to the next person *when they're ready for it*. If the last person stops, everyone waits — no buckets pile up.`,
    ],
    mapping: [
      ['the well', 'the log file on disk'],
      ['each person in the line', 'one generator stage (read, parse, filter)'],
      ['one bucket', 'one line / one LogRecord'],
      ['handing a bucket when asked', 'yield: a value is produced only when next() asks for it'],
      ['a leaky bucket set aside and noted', 'a malformed line recorded in the errors list'],
      ['the person filling the tank and keeping score', 'summarize(): Counter tallies and a top-n heap'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'The lazy pipeline',
    props: {
      width: 780,
      height: 330,
      nodes: [
        { id: 'cli', label: 'cli.py', note: 'argparse options', x: 390, y: 50, tone: 'yellow' },
        { id: 'file', label: 'access.log', note: 'millions of lines', x: 70, y: 180, tone: 'kraft' },
        { id: 'read', label: 'read_lines', note: 'yields str', x: 210, y: 180, tone: 'blue' },
        { id: 'parse', label: 'parse_records', note: 'yields LogRecord', x: 360, y: 180, tone: 'blue' },
        { id: 'filter', label: 'filter_records', note: 'yields matches', x: 510, y: 180, tone: 'blue' },
        { id: 'summary', label: 'summarize', note: 'Counter + heap', x: 660, y: 180, tone: 'ink' },
        { id: 'bad', label: 'errors list', note: '(line no, text)', x: 360, y: 290, tone: 'red' },
        { id: 'report', label: 'format_report', note: 'text out', x: 660, y: 290, tone: 'paper' },
      ],
      edges: [
        { from: 'file', to: 'read' },
        { from: 'read', to: 'parse', label: 'line' },
        { from: 'parse', to: 'filter', label: 'record' },
        { from: 'filter', to: 'summary', label: 'record' },
        { from: 'parse', to: 'bad', label: 'malformed', dashed: true },
        { from: 'summary', to: 'report', label: 'Summary' },
        { from: 'cli', to: 'filter', label: '--status, --since…', dashed: true },
      ],
      steps: [
        { focus: ['cli'], text: py`\`cli.py\` turns \`--errors-only --top 3\` into a settings object and **builds** the pipeline. Building it does no work yet: calling a generator function only creates a paused generator.` },
        { focus: ['summary'], text: py`Work starts when \`summarize()\` runs its \`for\` loop and asks the filter stage for its first record…` },
        { focus: ['filter', 'parse', 'read', 'file'], edges: ['file->read', 'read->parse', 'parse->filter'], text: py`…which asks the parser, which asks the reader, which reads **one line** from the file. The request travels left, the data travels right.` },
        { focus: ['parse', 'bad'], edges: ['parse->bad'], text: py`A line that doesn't match the regex (or has an impossible date) becomes \`None\`; the parser notes its line number and simply asks for the next line. The pipeline never crashes on bad data.` },
        { focus: ['filter', 'summary'], edges: ['filter->summary'], text: py`Records that pass every filter reach \`summarize()\`, which updates Counters and a small heap of the slowest requests, then lets the record go. Memory use stays flat.` },
        { focus: ['report'], edges: ['summary->report'], text: py`When the file runs out, every generator finishes, and \`format_report()\` turns the \`Summary\` into text.` },
      ],
    },
    alt: 'Pipeline diagram. access.log flows into read_lines, which yields lines to parse_records, which yields LogRecords to filter_records, which yields matching records to summarize. parse_records sends malformed lines to an errors list. summarize produces a Summary for format_report. cli.py configures the filters with argparse options.',
    caption: py`Data flows left to right, but *demand* flows right to left: nothing is read until the last stage asks for it.`,
  },

  requirements: [
    'parsing.py: LOG_PATTERN is a compiled regex with named groups ip, time, method, target, status, size and duration for lines like: 203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms',
    'parse_line(line) uses fullmatch and returns a frozen LogRecord(ip, timestamp, method, path, query, status, size, duration_ms) — timestamp timezone-aware via strptime("%d/%b/%Y:%H:%M:%S %z"), path and query split with urlsplit, size "-" as 0, numbers as int — or None for any malformed line (wrong shape, impossible date, lowercase method, trailing junk).',
    'pipeline.py: read_lines(path) and parse_records(lines, errors=None) and filter_records(records, *, status, method, path_prefix, since, until, errors_only) are all generators. parse_records numbers lines from 1, skips blank lines, and appends (line_number, line) to errors for malformed lines.',
    'filter_records keeps a record only if it matches every filter given: exact status, method case-insensitively, path starting with path_prefix, since <= timestamp < until, and status >= 400 when errors_only is true.',
    'stats.py: summarize(records, slowest=3) makes ONE pass and returns a Summary with total, total_bytes, total_duration_ms, status_counts, path_counts and errors_per_hour (Counters; hour keys like "2026-03-12 10:00") and slowest — the n slowest records, slowest first, earlier first on ties.',
    'cli.py: build_parser() supports logfile (default access.log), --status, --method (upper-cased, must be a known method), --path, --since/--until (ISO dates, naive means UTC), --errors-only, --top and --slowest (positive ints). Bad values exit via argparse (SystemExit).',
    'run(argv) returns the report text and appends "Skipped N malformed line(s): ..." when lines were skipped; main(argv) prints it and returns an exit code.',
  ],
  objectives: [
    'Write a readable, anchored regex with named groups and compile it once.',
    'Convert matched text into typed, immutable records and reject impossible values.',
    'Chain generator functions into a lazy pipeline and prove it is lazy.',
    'Handle malformed input gracefully: skip, count and report instead of crashing.',
    'Aggregate in a single pass with Counter and a bounded heap.',
    'Build a testable command-line interface with argparse and custom argument types.',
    'Work with timezone-aware datetimes and avoid naive/aware comparisons.',
  ],

  playground: {
    title: 'Log analyzer — starter',
    objective: 'Finish LOG_PATTERN and parse_line, the pipeline generators, summarize() and the argparse types until every check passes.',
    files: {
      'main.py': MAIN_PY,
      'parsing.py': PARSING_STARTER,
      'pipeline.py': PIPELINE_STARTER,
      'stats.py': STATS_STARTER,
      'report.py': REPORT_PY,
      'cli.py': CLI_STARTER,
      'access.log': ACCESS_LOG,
    },
    expected: py`The starter stops at the first missing stage:

\`\`\`text
[not built yet] TODO: parse_records()
\`\`\`

When it's finished, the first report starts with \`Requests: 26 | bytes sent: 21,107 | avg time: 341.9 ms\`, lists the status codes with little bars, the top paths, errors per hour, the three slowest requests and \`Skipped 4 malformed line(s): 7, 15, 22, 30\`. The second report (\`--errors-only --top 3\`) covers only the 8 failed requests.`,
    tests: TESTS,
  },

  steps: [
    {
      title: '1. Look at the data before writing code',
      body: [
        py`Open \`access.log\` in the editor. Every good line has the same anatomy:`,
        { code: py`203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms
│            │ │  │                            │    │                      │         │   │   └ duration
│            │ │  │                            │    │                      │         │   └ bytes sent ("-" = none)
│            │ │  │                            │    │                      │         └ status code
│            │ │  │                            │    │                      └ protocol
│            │ │  │                            │    └ target: path + optional ?query
│            │ │  │                            └ HTTP method
│            │ │  └ timestamp with UTC offset
│            │ └ authenticated user ("-" = none)
│            └ identity ("-", historical)
└ client IP address`, lang: 'text', title: 'one line, labelled' },
        py`This is a simplified variant of the *Common Log Format* used by Apache and nginx, with a response time added at the end. (The IP addresses are from ranges reserved for documentation, so they belong to nobody.)`,
        py`Now look for the **bad** lines: line 7 is a note someone wrote, line 15 was cut off mid-write, line 22 has the date *31 February*, line 30 has a lowercase \`get\`, and line 27 is blank. Real logs always contain surprises like these. Deciding *up front* what to do with them — skip, count, report — is part of the design.`,
        { callout: 'tip', title: 'Status code families', text: py`2xx = success, 3xx = redirect, 4xx = the client asked for something wrong (404 not found, 401 not logged in, 403 forbidden), 5xx = the server failed (500 internal error, 502 bad gateway). This tool treats every status ≥ 400 as an error. See [HTTP & REST](lesson:http-and-rest).` },
      ],
    },
    {
      title: '2. A compiled regex with named groups',
      body: [
        py`A [regular expression](lesson:regular-expressions) describes the *shape* of a line. Named groups \`(?P<name>...)\` label the parts you want to keep, so later code says \`match["status"]\` instead of the fragile \`match.group(7)\`.`,
        { code: py`import re

LOG_PATTERN = re.compile(
    r'(?P<ip>\d{1,3}(?:\.\d{1,3}){3}) \S+ \S+ '      # 203.0.113.7 - -
    r'\[(?P<time>[^\]]+)\] '                         # [12/Mar/2026:09:05:40 +0000]
    r'"(?P<method>[A-Z]+) (?P<target>\S+) HTTP/[\d.]+" '   # "GET /api/... HTTP/1.1"
    r'(?P<status>\d{3}) (?P<size>\d+|-) (?P<duration>\d+)ms'  # 200 812 48ms
)

line = '203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET /api/products?page=1 HTTP/1.1" 200 812 48ms'
match = LOG_PATTERN.fullmatch(line)
print(match["method"], match["target"], match["status"])
print(LOG_PATTERN.fullmatch("=== server restarted ==="))`, lang: 'python', title: 'parsing.py — the pattern' },
        py`Reading it piece by piece:`,
        py`- \`\d{1,3}(?:\.\d{1,3}){3}\` — four groups of 1–3 digits separated by dots. \`(?:...)\` groups *without* capturing.
- \`\[(?P<time>[^\]]+)\]\` — a literal \`[\`, then "one or more characters that are not \`]\`", then \`]\`. A negated class like \`[^\]]+\` can't overshoot, unlike \`.*\`.
- \`(?P<method>[A-Z]+)\` — upper-case letters only, so \`get\` is rejected.
- \`(?P<size>\d+|-)\` — digits *or* a dash.
- Adjacent string literals are joined by Python, so the pattern can be split over lines with a comment per part. (\`re.VERBOSE\` is the other way to do that.)`,
        py`Two important choices: **raw strings** (\`r'...'\`) so \`\d\` reaches the regex engine untouched, and **\`fullmatch\`** instead of \`match\`/\`search\`, so a line with junk at the end is rejected instead of half-matched. Compiling once at import time also avoids re-parsing the pattern for every line (Python's \`re\` module caches recent patterns too, but the compiled constant makes the intent explicit).`,
      ],
    },
    {
      title: '3. From a match to a typed record',
      body: [
        py`A match gives you strings. The rest of the program wants *types*: an \`int\` status, a real \`datetime\`. Do the conversion once, in \`parse_line\`, and store it in a frozen [dataclass](lesson:dataclasses):`,
        { code: py`@dataclass(frozen=True, slots=True)
class LogRecord:
    ip: str
    timestamp: datetime
    method: str
    path: str
    query: str
    status: int
    size: int
    duration_ms: int


def parse_line(line):
    match = LOG_PATTERN.fullmatch(line.strip())
    if match is None:
        return None
    try:
        timestamp = datetime.strptime(match["time"], TIME_FORMAT)
    except ValueError:            # right shape, impossible date (31/Feb)
        return None
    target = urlsplit(match["target"])
    size = match["size"]
    return LogRecord(
        ip=match["ip"], timestamp=timestamp, method=match["method"],
        path=target.path, query=target.query,
        status=int(match["status"]),
        size=0 if size == "-" else int(size),
        duration_ms=int(match["duration"]),
    )`, lang: 'python', static: true, title: 'parsing.py — parse_line()' },
        py`- \`frozen=True\` makes records immutable: no stage can accidentally change one that another stage is still using. \`slots=True\` (3.10+) makes each record smaller in memory — handy when millions flow through.
- \`TIME_FORMAT = "%d/%b/%Y:%H:%M:%S %z"\`: \`%b\` reads month abbreviations (\`Mar\`) and \`%z\` reads \`+0000\` into a **timezone-aware** datetime. See [dates & times](lesson:dates-and-times).
- \`urlsplit\` separates \`/api/products?page=1\` into path and query, so page 1 and page 2 count as the same endpoint later.`,
        { callout: 'note', title: 'Return None or raise?', text: py`For one bad line among millions, \`None\` is a fine "no result" signal: it's expected, cheap to check, and the caller decides what to do. For a single value a user typed (like \`--since yesterday\`), raising is better — there's nothing sensible to skip to. See [error-handling patterns](lesson:error-handling-patterns).` },
      ],
    },
    {
      title: '4. Reading lazily',
      body: [
        py`\`read_lines\` is already written for you — it's the model for every stage:`,
        { code: py`def read_lines(path):
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:                # a file object yields one line at a time
            yield line.rstrip("\n")`, lang: 'python', title: 'pipeline.py — read_lines()' },
        py`Because the function contains \`yield\`, calling \`read_lines("access.log")\` runs **none** of its body. It returns a paused *generator*. Each \`next()\` runs the body until the next \`yield\`, hands over one line and pauses again. The file stays open between calls and \`with\` closes it when the loop finishes (or when the generator is closed or garbage-collected).`,
        py`\`errors="replace"\` matters on real servers: a single invalid byte would otherwise raise \`UnicodeDecodeError\` and kill the run. Replacing it with \`�\` lets that one line fail the regex and be reported like any other malformed line. See [reading & writing files](lesson:reading-writing-files) and [Unicode](lesson:unicode-and-bytes).`,
        { callout: 'warn', title: 'Errors arrive late', text: py`With generators, an error surfaces when the data is *consumed*, not when the pipeline is built. A missing file raises \`FileNotFoundError\` inside \`summarize()\`'s loop — which is why \`cli.main()\` wraps the whole \`run()\` call, not just the \`read_lines()\` call.` },
      ],
    },
    {
      title: '5. Parsing stage: skip, count and report bad lines',
      body: [
        py`\`parse_records\` turns a stream of lines into a stream of records. \`enumerate(lines, start=1)\` gives human line numbers for free, and an optional list collects the rejects:`,
        { code: py`def parse_records(lines, errors=None):
    for number, line in enumerate(lines, start=1):
        if not line.strip():
            continue                    # blank lines are not errors
        record = parse_line(line)
        if record is None:
            if errors is not None:
                errors.append((number, line))
            continue
        yield record`, lang: 'python', title: 'pipeline.py — parse_records()' },
        py`The \`errors\` list is a simple "side channel": the main output is records, the side output is problems. A dataclass with counters, or a logging call, would work too — the key is that bad data is **visible**, not silently dropped. If 30% of lines suddenly fail to parse after a server upgrade, you want the report to scream about it.`,
        py`How do you *prove* it's lazy? Feed it a source that explodes if read too far — the platform's test does exactly this:`,
        { code: py`def lines():
    yield '203.0.113.7 - - [12/Mar/2026:09:05:40 +0000] "GET / HTTP/1.1" 200 812 48ms'
    raise RuntimeError("read too far!")


def eager(lines):
    return [line.upper() for line in lines]    # reads everything first


def lazy(lines):
    for line in lines:
        yield line.upper()


print(next(lazy(lines()))[:11])
try:
    eager(lines())
except RuntimeError as exc:
    print("eager version:", exc)`, lang: 'python', title: 'a laziness probe' },
      ],
    },
    {
      title: '6. Filtering stage: one generator, many options',
      body: [
        py`\`filter_records\` takes **keyword-only** arguments (everything after the \`*\`), so a call reads like a sentence and can't mix up positions: \`filter_records(records, status=404, method="get")\`. Each \`None\` means "don't filter on this".`,
        { code: py`def filter_records(records, *, status=None, method=None, path_prefix=None,
                   since=None, until=None, errors_only=False):
    method = method.upper() if method else None
    for record in records:
        if status is not None and record.status != status:
            continue
        if method is not None and record.method != method:
            continue
        if path_prefix is not None and not record.path.startswith(path_prefix):
            continue
        if since is not None and record.timestamp < since:
            continue
        if until is not None and record.timestamp >= until:
            continue
        if errors_only and not record.is_error:
            continue
        yield record`, lang: 'python', title: 'pipeline.py — filter_records()' },
        py`Note \`status is not None\` rather than \`if status:\` — the second form would silently ignore a filter value of \`0\`, and it's a habit that bites with numbers ([truthiness](lesson:none-and-truthiness)). The time window is **half-open** (\`since <= t < until\`), so consecutive windows like 10:00–11:00 and 11:00–12:00 never count a request twice.`,
        py`Because every stage has the same shape — iterable in, iterator out — you can add stages without touching the others: deduplicate, sample every 10th record, enrich IPs with a country… That composability is the real power of [lazy pipelines](lesson:lazy-evaluation).`,
      ],
    },
    {
      title: '7. Aggregating in one pass',
      body: [
        py`A generator can only be consumed **once**. If \`summarize\` looped over the records to count statuses and then again to find the slowest, the second loop would see nothing. So everything is computed in a single loop:`,
        { code: py`def summarize(records, slowest=3):
    summary = Summary()
    heap = []  # min-heap of (duration, -sequence, record)
    for sequence, record in enumerate(records):
        summary.total += 1
        summary.total_bytes += record.size
        summary.total_duration_ms += record.duration_ms
        summary.status_counts[record.status] += 1
        summary.path_counts[record.path] += 1
        if record.is_error:
            summary.errors_per_hour[record.hour] += 1

        item = (record.duration_ms, -sequence, record)
        if len(heap) < slowest:
            heapq.heappush(heap, item)
        elif slowest:
            heapq.heappushpop(heap, item)

    summary.slowest = [record for _, _, record in sorted(heap, reverse=True)]
    return summary`, lang: 'python', static: true, title: 'stats.py — summarize()' },
        py`- **Counter** ([collections](lesson:collections-module)) is a dict that starts every key at 0, so \`counts[key] += 1\` just works, and \`most_common(n)\` sorts for you (ties stay in first-seen order).
- **The slowest n** without storing every record: keep a *min-heap* of at most n items. Its root is the fastest of the kept ones; \`heappushpop\` adds the new record and evicts the fastest in O(log n). Memory: n records, not millions.
- **Tie-breaking**: tuples compare element by element. Equal durations fall back to \`-sequence\`, so a later record (more negative) is "smaller" and evicted first — the earliest slow request wins. The sequence also guarantees two \`LogRecord\`s are never compared directly.`,
        py`For a one-off list, \`heapq.nlargest(3, records, key=...)\` does the same job in one call — but it needs its own pass over the data. See [performance](lesson:performance) for why O(n log k) beats sorting everything.`,
      ],
    },
    {
      title: '8. The report',
      body: [
        py`\`report.py\` is pure formatting: a \`Summary\` in, a string out. Returning a string (instead of printing) makes it trivial to test and to reuse — write it to a file, send it in an email, show it in a web page.`,
        { code: py`total = 26
for status, count in [(200, 16), (404, 3), (500, 2)]:
    bar = "#" * round(20 * count / total)
    print(f"  {status}  {count:>4}  {bar}")
print(f"bytes sent: {21107:,}")`, lang: 'python', title: 'alignment with format specs' },
        py`\`{count:>4}\` right-aligns in 4 characters and \`{n:,}\` adds thousands separators — see [f-strings](lesson:string-formatting). The report handles the empty case first (\`No matching requests.\`), which also avoids a division by zero in the average.`,
      ],
    },
    {
      title: '9. A command-line interface you can test',
      body: [
        py`[argparse](lesson:command-line-programs) turns \`["--errors-only", "--top", "3"]\` into an object with attributes. Custom **type functions** validate and convert in one step — raise \`argparse.ArgumentTypeError\` and argparse prints a friendly message and exits with status 2:`,
        { code: py`import argparse
from datetime import datetime, timezone


def positive_int(text):
    try:
        value = int(text)
    except ValueError:
        raise argparse.ArgumentTypeError(f"not a whole number: {text!r}") from None
    if value < 1:
        raise argparse.ArgumentTypeError(f"must be at least 1, got {value}")
    return value


def iso_datetime(text):
    try:
        value = datetime.fromisoformat(text)
    except ValueError:
        raise argparse.ArgumentTypeError(f"not an ISO date/time: {text!r}") from None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


parser = argparse.ArgumentParser(prog="loganalyzer")
parser.add_argument("logfile", nargs="?", default="access.log")
parser.add_argument("--method", type=str.upper, choices=["GET", "POST"])
parser.add_argument("--since", type=iso_datetime)
parser.add_argument("--top", type=positive_int, default=5)
print(parser.parse_args(["--method", "post", "--since", "2026-03-12T10:00"]))`, lang: 'python', title: 'custom argument types' },
        py`\`type=str.upper\` runs *before* \`choices\` is checked, so \`post\` becomes \`POST\` and passes. \`iso_datetime\` makes naive input **UTC**, because the log timestamps are aware and Python refuses to compare the two kinds: \`TypeError: can't compare offset-naive and offset-aware datetimes\`.`,
        py`The testability trick is \`parse_args(argv)\`: with \`argv=None\` it reads \`sys.argv[1:]\` (the real command line), but tests pass an explicit list. \`run(argv)\` returns text and \`main(argv)\` prints it and returns an exit code — so \`main.py\` can call \`main()\` like a terminal would and also \`main(["--errors-only", "--top", "3"])\` as a demo.`,
      ],
    },
    {
      title: '10. Production: logs at real scale',
      body: [
        py`The design you built — lazy stages, one-pass aggregation, explicit handling of bad lines — is exactly how the professional tools work. A few things they add:`,
        { code: py`import gzip
import sys


def read_lines(source):
    """Read plain or gzip-compressed logs, or standard input when source is "-"."""
    if source == "-":
        for line in sys.stdin:
            yield line.rstrip("\n")
        return
    opener = gzip.open if source.endswith(".gz") else open
    with opener(source, "rt", encoding="utf-8", errors="replace") as fh:
        for line in fh:
            yield line.rstrip("\n")


def read_many(paths):
    for path in paths:                    # rotated logs: access.log.1.gz, access.log.2.gz, ...
        yield from read_lines(path)`, lang: 'python', static: true, title: 'compressed, rotated and piped logs (run locally)' },
        py`- **Rotation**: servers rename \`access.log\` to \`access.log.1\` and compress older files. \`yield from\` chains them into one stream ([advanced generators](lesson:advanced-generators)).
- **Pipes**: reading \`sys.stdin\` lets you run \`zcat access.log.*.gz | python main.py -\` like any Unix tool.
- **Structured logs**: if you control the server, log JSON lines instead of free text — one \`json.loads\` per line beats a fragile regex. Python's own [logging](lesson:logging) can emit them.
- **Scale**: for many servers, logs are shipped to a central system (an ELK/OpenSearch stack, Loki, a data warehouse) and queried there. Your pipeline is the mental model of what those systems do.
- **Privacy**: IP addresses can be personal data in some jurisdictions; production tools often truncate or hash them and limit how long logs are kept.`,
      ],
    },
  ],

  challenges: [
    'Status classes: add a --status option value like 5xx (keep exact codes working) and a "Status classes" section (2xx/3xx/4xx/5xx) to the report.',
    'Percentiles: report the median and 95th percentile response time. Hint: statistics.quantiles needs all values — what does that cost in memory, and is there a streaming alternative?',
    'Unique visitors: count distinct IPs per hour. How much memory does a set of IPs need for a big site? Look up HyperLogLog as the production answer.',
    'Top talkers: list the 5 IP addresses with the most 4xx responses — a basic intrusion signal (/wp-login.php, /.env probes in the sample log are real-world scanner traffic).',
    'Follow mode (production concern): like tail -f, keep reading new lines as the file grows and print a rolling summary every N lines. How do you detect that the file was rotated underneath you?',
    'Output formats: add --format json so other programs can consume the summary (Counters → dicts, datetimes → ISO strings).',
    'Robustness (production concern): fail with exit code 3 if more than 5% of lines are malformed — a parse rate that drops suddenly usually means the log format changed.',
    'Speed: time the analyzer on a generated 1-million-line log with time.perf_counter, then profile it with cProfile to see where the time goes (regex? strptime?).',
  ],

  solution: {
    files: {
      'main.py': MAIN_PY,
      'parsing.py': PARSING_SOLUTION,
      'pipeline.py': PIPELINE_SOLUTION,
      'stats.py': STATS_SOLUTION,
      'report.py': REPORT_PY,
      'cli.py': CLI_SOLUTION,
      'access.log': ACCESS_LOG,
    },
    explanation: [
      py`**parsing.py** finishes the pattern with the quoted request (\`[A-Z]+\` methods only, a non-space target, \`HTTP/\` plus a version) and the three trailing numbers (\`\d+|-\` for the size, \`\d+ms\` for the duration). \`parse_line\` uses \`fullmatch\`, so trailing junk fails; \`strptime\` turns the time into an aware datetime and returns \`None\` for impossible dates; \`urlsplit\` separates path and query.`,
      py`**pipeline.py** has three generators. \`parse_records\` numbers lines with \`enumerate(..., start=1)\`, skips blanks, records malformed lines as \`(number, line)\` and yields only good records. \`filter_records\` checks each optional filter with \`is not None\` and uses a half-open time window.`,
      py`**stats.py** loops over the records exactly once, updating Counters and a min-heap bounded to \`slowest\` items. Storing \`(duration, -sequence, record)\` gives deterministic tie-breaking and never compares records directly.`,
      py`**cli.py** adds validated argument types: \`positive_int\` and \`iso_datetime\` raise \`ArgumentTypeError\` (argparse turns that into a clean error and exit status 2), and \`--method\` uses \`type=str.upper\` with \`choices\`. Naive \`--since\`/\`--until\` values become UTC so they can be compared with the log's aware timestamps.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`A generator function is a function with \`yield\` in it. Calling it doesn't run it — you get a generator object. Each \`next()\` resumes the function exactly where it paused, with all its local variables intact.`,
      { code: py`def countdown(n):
    print("starting")
    while n > 0:
        yield n
        n -= 1


gen = countdown(3)
print("created")      # "starting" has not been printed yet
print(next(gen))      # starting, then 3
print(list(gen))      # [2, 1] — the rest
print(list(gen))      # [] — a generator is used up after one pass`, lang: 'python' },
    ],
    technical: [
      py`**Pull-based evaluation.** In \`summarize(filter_records(parse_records(read_lines(p))))\`, the outermost \`for\` calls \`next()\` on the filter generator, which calls \`next()\` on the parser, which calls \`next()\` on the reader, which reads one buffered line. Only one record is "in flight" at a time; the call chain is re-entered for every item. Each generator keeps its frame (locals + instruction pointer) alive between calls.`,
      py`**Regex engine.** Python's \`re\` is a backtracking engine. Patterns like \`(.*)*\` or nested quantifiers on overlapping text can take exponential time on a bad line (*catastrophic backtracking*). Specific classes (\`[^\]]+\`, \`\S+\`, \`\d{3}\`) and anchoring with \`fullmatch\` keep matching fast and predictable. Python 3.11 added possessive quantifiers and atomic groups (\`(?>...)\`) for the hard cases.`,
      py`**Heaps.** \`heapq\` implements a binary min-heap on a plain list: \`heap[0]\` is always the smallest item; push and pop are O(log n). Keeping a top-k heap over N items costs O(N log k) time and O(k) memory, versus O(N log N) and O(N) for sorting everything.`,
      { callout: 'note', title: 'CPython detail', text: py`The \`re\` module keeps an internal cache of recently compiled patterns, so calling \`re.match(pattern_string, ...)\` in a loop doesn't recompile every time. The cache size is an implementation detail; a module-level compiled pattern is the clear, explicit choice either way.` },
    ],
    production: [
      py`**Malformed-line rate is a metric.** Production parsers export "lines parsed / lines rejected" counters. A sudden change usually means the log format changed after a deploy, and a silent parser would make every dashboard wrong without anyone noticing.`,
      py`**Time zones.** Always store and compare timestamps as aware UTC datetimes; convert to local time only for display. Mixing naive and aware values raises \`TypeError\` (good) but mixing different *local* times silently shifts hours (bad).`,
      py`**Exit codes and streams.** CLI tools print results to stdout and errors to stderr, and return 0 for success, 1 for runtime errors and 2 for usage errors (argparse's convention). That lets shell scripts and schedulers react correctly — see [command-line programs](lesson:command-line-programs).`,
    ],
  },
  mistakes: [
    {
      title: 'Reading the whole file into memory',
      wrong: { code: py`def read_lines(path):
    with open(path) as fh:
        return fh.readlines()      # a 10 GB log = 10+ GB of RAM`, lang: 'python' },
      right: { code: py`def read_lines(path):
    with open(path) as fh:
        for line in fh:            # one line at a time
            yield line.rstrip("\n")`, lang: 'python' },
      explanation: py`\`readlines()\` builds a list of every line before you process the first one. Iterating over the file object (inside a generator) keeps memory constant.`,
    },
    {
      title: 'Consuming a generator twice',
      wrong: { code: py`records = parse_records(read_lines("access.log"))
total = sum(1 for _ in records)
errors = sum(1 for r in records if r.is_error)   # always 0!`, lang: 'python', static: true },
      right: { code: py`summary = summarize(parse_records(read_lines("access.log")))
print(summary.total, sum(summary.errors_per_hour.values()))`, lang: 'python', static: true },
      explanation: py`The first \`sum\` exhausted the generator; the second loop gets nothing and silently reports 0. Compute everything in one pass, or rebuild the pipeline (or \`list()\` it if it's small).`,
    },
    {
      title: 'Using re.match or re.search where you mean fullmatch',
      wrong: { code: py`import re

pattern = re.compile(r"(?P<status>\d{3})")
print(pattern.match("200 OK, and also garbage"))   # matches "200": junk accepted`, lang: 'python' },
      right: { code: py`import re

pattern = re.compile(r"(?P<status>\d{3})")
print(pattern.fullmatch("200 OK, and also garbage"))   # None: rejected`, lang: 'python' },
      explanation: py`\`match\` only anchors the start and \`search\` anchors nothing. For validating a whole line, \`fullmatch\` (or \`^...$\` with care about newlines) is the honest check.`,
    },
    {
      title: 'Crashing on the first bad line',
      wrong: { code: py`def parse_line(line):
    m = LOG_PATTERN.fullmatch(line)
    return LogRecord(ip=m["ip"], ...)   # TypeError: 'NoneType' object is not subscriptable`, lang: 'python', static: true },
      right: { code: py`def parse_line(line):
    m = LOG_PATTERN.fullmatch(line)
    if m is None:
        return None                     # let the caller count and skip it
    ...`, lang: 'python', static: true },
      explanation: py`A failed match returns \`None\`. Check it explicitly; then the pipeline can skip and report the line instead of dying on line 4,000,001 of a nightly job.`,
    },
    {
      title: 'Filtering with truthiness',
      wrong: { code: py`if status and record.status != status:   # status=0 or "" silently disables the filter
    continue`, lang: 'python', static: true },
      right: { code: py`if status is not None and record.status != status:
    continue`, lang: 'python', static: true },
      explanation: py`"Not given" is \`None\`; anything else — including falsy values — is a real filter. Say \`is not None\` when that's what you mean.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: can't compare offset-naive and offset-aware datetimes`,
      cause: py`A \`--since\` value parsed without a time zone was compared with the log's \`+0000\` timestamps.`,
      fix: py`Make both sides aware: \`value.replace(tzinfo=timezone.utc)\` for naive input (or reject naive input), and parse log times with \`%z\`.`,
    },
    {
      symptom: py`TypeError: 'NoneType' object is not subscriptable`,
      cause: py`Code did \`match["status"]\` on a line the regex didn't match, so \`match\` was \`None\`.`,
      fix: py`Check \`if match is None:\` first and treat the line as malformed.`,
    },
    {
      symptom: py`The report says "Requests: 0" although the file clearly has lines.`,
      cause: py`Either the regex never matches (check one real line in a REPL with \`LOG_PATTERN.fullmatch(line)\`) or a generator was already consumed by an earlier loop or \`list()\`.`,
      fix: py`Print the "Skipped N malformed line(s)" count: if every line is skipped, it's the pattern; if none are, the pipeline was exhausted earlier.`,
    },
    {
      symptom: py`ValueError: day 31 must be in range 1..28 for month 2 in year 2026`,
      cause: py`\`strptime\` validates real calendar dates; the line had the right *shape* but an impossible date.`,
      fix: py`Catch \`ValueError\` around \`strptime\` and treat the line as malformed.`,
    },
    {
      symptom: py`loganalyzer: error: argument --top: must be at least 1, got 0`,
      cause: py`Not a bug — your custom type function rejected the value and argparse exited with status 2.`,
      fix: py`In tests, expect it: \`with raises(SystemExit): parser.parse_args(["--top", "0"])\`.`,
    },
  ],
  bestPractices: [
    'Compile regexes once, use raw strings, named groups and fullmatch.',
    'Convert text to real types (int, datetime) at the parsing boundary, into immutable records.',
    'Make every stage a generator: iterable in, iterator out.',
    'Never crash on one bad record — skip it, count it and report where it was.',
    'Aggregate in a single pass; use Counter for tallies and a bounded heap for top-n.',
    'Keep timestamps timezone-aware and in UTC.',
    'Make CLIs testable: parse_args(argv) with an explicit list, return text, and use exit codes.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-log-analyzer-q1',
      type: 'mcq',
      prompt: 'What happens when this line runs?\n\n```python\nrecords = parse_records(read_lines("huge.log"))\n```',
      options: [
        { text: 'The whole file is read and parsed into memory', why: 'Both functions are generators: calling them only creates paused generator objects.' },
        'Nothing is read yet — two paused generators are created',
        { text: 'The first line is read and parsed', why: 'Not even that: the body of a generator function starts running only on the first next().' },
        { text: 'FileNotFoundError is raised immediately if the file is missing', why: 'The open() call is inside the generator body, so it runs (and fails) only when the pipeline is consumed.' },
      ],
      answer: 1,
      explanation: py`Calling a generator function runs none of its body. Work starts when something iterates — here, \`summarize()\`'s loop.`,
    },
    {
      id: 'project-log-analyzer-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`durations = (ms for ms in [120, 45, 3005])
print(max(durations), sum(durations))`,
      answer: '3005 0',
      accept: ['3005 0'],
      explanation: py`\`max()\` consumes the generator completely. \`sum()\` then gets an empty iterator and returns 0. One pass only — that's why \`summarize()\` computes everything in a single loop.`,
    },
    {
      id: 'project-log-analyzer-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from collections import Counter

paths = Counter(["/cart", "/home", "/home", "/login", "/cart"])
print(paths.most_common(2))`,
      options: [
        "[('/cart', 2), ('/home', 2)]",
        { text: "[('/home', 2), ('/cart', 2)]", why: 'Counts tie at 2; most_common keeps ties in the order the keys were first seen, and /cart was seen first.' },
        { text: "[('/home', 2), ('/login', 1)]", why: '/cart also has a count of 2.' },
        { text: "{'/cart': 2, '/home': 2}", why: 'most_common returns a list of (key, count) tuples, not a dict.' },
      ],
      answer: 0,
      explanation: py`\`most_common\` sorts by count (highest first) and, because the sort is stable, equal counts keep insertion order. The project's top-paths test relies on this.`,
    },
    {
      id: 'project-log-analyzer-q4',
      type: 'bug',
      prompt: 'This parser accepts lines with garbage at the end. Click the line responsible.',
      code: py`import re

PATTERN = re.compile(r"(?P<method>[A-Z]+) (?P<path>\S+) (?P<status>\d{3})")


def parse(line):
    match = PATTERN.match(line)
    if match is None:
        return None
    return match["method"], match["path"], int(match["status"])`,
      answerLine: 7,
      explanation: py`\`match\` only anchors at the start, so \`"GET / 200 trailing junk"\` matches. Use \`PATTERN.fullmatch(line)\` to require the whole line to fit the pattern.`,
    },
    {
      id: 'project-log-analyzer-q5',
      type: 'fill',
      prompt: 'Complete the named group and the lookup so the status code is read by name.',
      code: py`import re

pattern = re.compile(r'"(?P<request>[^"]+)" (___<status>\d{3})')
m = pattern.search('"GET / HTTP/1.1" 404')
print(int(m[___]))`,
      answer: [['?P'], ['"status"', "'status'"]],
      explanation: py`Named groups are written \`(?P<name>...)\` and read with \`m["name"]\` (or \`m.group("name")\`).`,
    },
    {
      id: 'project-log-analyzer-q6',
      type: 'mcq',
      prompt: 'Why does `summarize()` keep a heap of at most n items instead of collecting every record and sorting at the end?',
      options: [
        { text: 'heapq is the only way to sort records', why: 'sorted() can sort records just fine; the issue is memory and work for huge inputs.' },
        'It finds the n slowest in one pass using memory for only n records',
        { text: 'Heaps keep the records in insertion order', why: 'A heap only guarantees the smallest item is at index 0; it is not insertion-ordered.' },
        { text: 'sorted() cannot handle ties', why: 'sorted() is stable and handles ties; it just needs all N records in memory.' },
      ],
      answer: 1,
      explanation: py`A bounded min-heap costs O(N log n) time and O(n) memory, and works on a stream that can only be read once.`,
    },
    {
      id: 'project-log-analyzer-q7',
      type: 'short',
      prompt: 'Why does `parse_records` record malformed lines instead of either raising an exception or silently skipping them?',
      answer: py`Raising would stop a long job on one bad line, which real logs always contain. Silently skipping would hide problems — if a log format changes, every line could be dropped and the report would look valid but be wrong. Recording the line numbers keeps the pipeline running while making data-quality issues visible.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-log-analyzer-generators-why',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why did you build the analyzer as a chain of generators? What do you give up?',
      answer: 'Generators process one record at a time, so memory stays constant regardless of file size, results start flowing immediately, and stages compose cleanly. The costs: a generator can be consumed only once, you can’t index or take len() of it, errors surface late (when consumed), and debugging a lazy chain is less obvious.',
      explanation: py`Each stage is "iterable in, iterator out", so you can insert, remove or reorder stages freely. Because nothing is materialised, a 10 GB file uses about as much memory as a 10 KB one. The single-pass restriction is why aggregation must happen in one loop, and the late-error behaviour is why error handling wraps the consumer, not the constructor.`,
      whyAsked: 'Tests understanding of lazy evaluation beyond syntax: memory model, composability and trade-offs.',
      mistakes: ['Saying generators are “faster” in general', 'Forgetting the single-pass limitation', 'Not knowing when errors are raised'],
      followUps: ['How would you fan one stream out to two consumers? (itertools.tee, and its memory cost)', 'How would you parallelise the parsing stage?'],
      modelAnswer: 'I used generators because logs can be far larger than memory: each stage pulls one item from the previous one, transforms it and passes it on, so memory stays flat and output starts immediately. The stages also compose nicely — each takes an iterable and returns an iterator, so adding a filter is one more function in the chain. The trade-offs are that a generator is single-use, so I had to aggregate everything in one pass; you can’t take len() or index it; and exceptions such as a missing file appear only when the pipeline is consumed, so I handle errors around the consumer.',
    },
    {
      id: 'project-log-analyzer-scale',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Your analyzer works on one 50 MB file. Now 40 servers each produce 5 GB of logs per day and the team wants hourly dashboards plus alerts when the 5xx rate spikes. How does the design evolve?',
      answer: 'Keep the same stages but distribute them: ship logs from each server (agents) to a central pipeline, parse at ingest (ideally structured JSON logs so no regex is needed), aggregate incrementally into time-bucketed metrics (counts per status per minute), store raw logs in cheap storage and metrics in a time-series database, and alert on the aggregated rates. Track parse-failure rates as a metric too.',
      explanation: py`One machine reading files sequentially stops scaling, and re-reading a day of logs every hour wastes work. Production systems parse once at ingestion, emit compact aggregates (per minute/hour), and keep the raw data separately for investigations. The same read → parse → filter → aggregate shape appears in tools like Fluent Bit/Vector (shipping), OpenSearch/Loki (search) and Prometheus-style metrics (alerting).`,
      whyAsked: 'Probes system-design thinking: incremental aggregation, separation of raw data and metrics, operational concerns.',
      mistakes: ['Proposing to “just use threads” on one machine', 'Recomputing everything from raw logs for every dashboard refresh', 'Ignoring malformed data and time zones'],
      followUps: ['How do you count unique visitors across servers without storing every IP?', 'How do you handle logs arriving late or out of order?', 'What retention and privacy rules apply to IP addresses?'],
      modelAnswer: 'The pipeline shape stays the same, but each stage moves. On every server a lightweight agent tails and ships log lines to a central queue. If we control the servers, I would switch them to structured JSON logs so parsing is reliable without regexes. A stream processor parses each line once at ingestion and updates time-bucketed aggregates — requests and errors per status per minute — which go into a time-series store that powers dashboards and alert rules such as “5xx rate above a threshold for five minutes”. Raw logs go to cheap object storage or a search index for investigations, with a retention policy. I would also export the parse-failure rate as its own metric so a format change is noticed immediately.',
    },
    {
      id: 'project-log-analyzer-silent-drop',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'After a web server upgrade, the daily report shows traffic dropped by 60%. Marketing panics. The analyzer reports no errors. What do you check first?',
      answer: 'Whether the log format changed: check the malformed-line count and try the regex on a few new lines. A new field, a different time format or quoting change would make lines fail to parse and vanish from the totals. Then fix the parser, add a test with the new format, and alert on the malformed rate in future.',
      explanation: py`"Fewer records" can mean fewer requests *or* fewer parsable lines. A parser that silently drops lines turns a format change into a fake business event. Compare the raw line count (\`wc -l\`) with the parsed count, look at the first skipped lines, and make the parse-failure rate part of the report.`,
      whyAsked: 'Tests debugging instinct: distrust the measuring instrument before trusting a dramatic result.',
      mistakes: ['Assuming the traffic really dropped', 'Making the regex “looser” until everything matches without understanding the new format', 'Not adding a regression test'],
      followUps: ['How would you support two log formats during a rollout?', 'What threshold of malformed lines should fail the job?'],
      modelAnswer: 'Before believing the business story I would check the measuring tool. A server upgrade is a classic moment for the log format to change — an extra field, a different timestamp or quoting — and then lines fail the regex. I would compare the raw line count with the parsed count, look at the skipped-line numbers and test the pattern on a couple of new lines. Once confirmed, I would update the pattern or support both formats during the rollout, add a test with a real new line, and make the job fail or alert when the malformed rate crosses a threshold, so this can’t happen silently again.',
    },
    {
      id: 'project-log-analyzer-tz-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'After adding a `--since` option, running `python main.py --since 2026-03-12T10:00` crashes with `TypeError: can\'t compare offset-naive and offset-aware datetimes`. Explain and fix.',
      answer: 'datetime.fromisoformat("2026-03-12T10:00") returns a naive datetime (no tzinfo), but the log timestamps were parsed with %z and are aware. Python refuses to compare them. Make the CLI value aware — e.g. treat naive input as UTC with .replace(tzinfo=timezone.utc) — or require an explicit offset.',
      explanation: py`A naive datetime has no time zone, so comparing it with an aware one is ambiguous, and Python raises instead of guessing. Normalising every timestamp to aware UTC at the boundary (parsing and CLI input) removes the whole class of bugs.`,
      code: { lang: 'python', code: py`from datetime import datetime, timezone

since = datetime.fromisoformat("2026-03-12T10:00")
if since.tzinfo is None:
    since = since.replace(tzinfo=timezone.utc)
logged = datetime.strptime("12/Mar/2026:10:03:31 +0000", "%d/%b/%Y:%H:%M:%S %z")
print(logged >= since)   # True` },
      whyAsked: 'Time-zone bugs are among the most common real-world defects in data tools.',
      mistakes: ['Stripping the tzinfo from the log timestamps instead', 'Using local time for comparisons'],
      followUps: ['When would .replace(tzinfo=...) be wrong and .astimezone() right?', 'How do you display UTC times in a user’s local zone?'],
      modelAnswer: 'fromisoformat without an offset gives a naive datetime, while the log timestamps are aware because I parse them with %z. Python won’t compare naive and aware values because the result would depend on an unknown time zone. Since the logs are in UTC, I normalise CLI input at the boundary: if the parsed value has no tzinfo, I attach UTC with replace. Then every comparison in the pipeline is aware-versus-aware in the same zone.',
    },
    {
      id: 'project-log-analyzer-parse-duration',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Different servers log durations differently. Write `parse_duration(text)` that returns whole milliseconds for `"48ms"`, `"1.5s"`, `"2m"` (minutes) and `"750us"` (microseconds, rounded to the nearest ms), allowing surrounding spaces. Anything else — negative numbers, missing unit, unknown unit — raises `ValueError`.',
      answer: 'Use one compiled fullmatch regex with a number group and a unit group, then multiply by a unit table and round.',
      explanation: py`A table of multipliers keeps the logic data-driven: adding hours is one dict entry. \`fullmatch\` with \`\d+(?:\.\d+)?\` rejects signs, missing units and junk in one place. Note that \`round()\` uses round-half-to-even, so 0.5 ms becomes 0 — fine here, but worth knowing.`,
      starter: { files: { 'main.py': py`def parse_duration(text):
    # TODO: support ms, s, m and us; raise ValueError for anything else
    return int(text.removesuffix("ms"))


print(parse_duration("48ms"))
` } },
      tests: [
        { name: 'milliseconds and seconds', code: py`assert parse_duration("48ms") == 48
assert parse_duration("1.5s") == 1500
assert parse_duration(" 2s ") == 2000` },
        { name: 'minutes and microseconds', code: py`assert parse_duration("2m") == 120000
assert parse_duration("750us") == 1
assert parse_duration("2400us") == 2` },
        { name: 'invalid values raise ValueError', code: py`for bad in ["48", "-5ms", "1.5h", "ms", "12 ms", "1e3ms"]:
    with raises(ValueError):
        parse_duration(bad)` },
      ],
      solution: { files: { 'main.py': py`import re

DURATION = re.compile(r"(?P<number>\d+(?:\.\d+)?)(?P<unit>us|ms|s|m)")
TO_MS = {"us": 0.001, "ms": 1, "s": 1000, "m": 60_000}


def parse_duration(text):
    match = DURATION.fullmatch(text.strip())
    if match is None:
        raise ValueError(f"not a duration: {text!r}")
    return round(float(match["number"]) * TO_MS[match["unit"]])


print(parse_duration("48ms"))
` } },
      hints: ['One regex with two named groups: the number and the unit.', 'With fullmatch the unit group must consume the rest of the string, so (us|ms|s|m) can never stop halfway through "ms".', 'Look up a multiplier in a dict and round(float(number) * multiplier).'],
      whyAsked: 'Combines regex, validation and clean data-driven design in a small, realistic task.',
      mistakes: ['A chain of endswith() checks where "ms" also ends with "s"', 'Using float() on untrusted text without validating the shape (accepts "1e3", "nan")', 'Forgetting to strip spaces'],
      followUps: ['How would you support "1m30s"?', 'Why might float rounding be a problem, and how would Decimal help?'],
      modelAnswer: 'I would write one compiled pattern with a number group — digits with an optional decimal part — and a unit group, and use fullmatch on the stripped text so signs, exponents, missing units and junk are all rejected in one place. Then I look up the unit in a dictionary of millisecond multipliers and round the product. Keeping the units in a table makes the function easy to extend, and the single regex makes the accepted format explicit and testable.',
    },
  ],

  takeaways: [
    'Read → parse → filter → aggregate → report is the universal shape of data pipelines; build each stage as a generator.',
    'Generators do nothing until consumed, use constant memory and can be consumed only once — so aggregate in a single pass.',
    'Compile regexes once with raw strings and named groups, and validate whole lines with fullmatch.',
    'Convert to real types at the parsing boundary and keep timestamps timezone-aware (UTC).',
    'Never crash on one bad line: skip it, count it and report where it was — the malformed rate is a signal.',
    'Counter tallies, most_common ranks, and a bounded heap finds the top n without storing everything.',
    'Make CLIs testable with parse_args(list), custom type functions, returned text and proper exit codes.',
  ],
}

// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

// ------------------------------------------------------------ settings.py

const SETTINGS_HEAD = py`"""Configuration from environment variables (12-factor style), validated at start-up."""
import os
from collections.abc import Mapping
from dataclasses import dataclass, field

PREFIX = "SHRTN_"
ENVIRONMENTS = ("development", "test", "production")
STORAGES = ("memory", "sqlite")
LOG_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR")


class ConfigError(Exception):
    def __init__(self, problems: list[str]) -> None:
        super().__init__("invalid configuration:\n  - " + "\n  - ".join(problems))
        self.problems = problems


def production_problems(settings: "Settings") -> list[str]:
    """Rules that only apply when real users depend on the service."""
    problems = []
    if not settings.admin_token:
        problems.append(f"{PREFIX}ADMIN_TOKEN is required in production")
    if not settings.base_url.startswith("https://"):
        problems.append(f"{PREFIX}BASE_URL must use https:// in production")
    if settings.storage == "memory":
        problems.append(f"{PREFIX}STORAGE=memory loses every link on restart; use sqlite")
    elif settings.database_path == ":memory:":
        problems.append(f"{PREFIX}DATABASE_PATH must be a file in production")
    return problems


@dataclass(frozen=True)
class Settings:
    environment: str = "development"
    base_url: str = "http://localhost:8000"
    storage: str = "memory"
    database_path: str = ":memory:"
    code_length: int = 7
    max_url_length: int = 2048
    log_level: str = "INFO"
    admin_token: str = field(default="", repr=False)  # a secret: never in reprs or logs
`

const SETTINGS_STARTER = SETTINGS_HEAD + py`
    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "Settings":
        env = os.environ if env is None else env
        # TODO: validate everything, collect ALL problems, then raise ConfigError(problems):
        #  - strip every value; ENV and STORAGE lower-case, LOG_LEVEL upper-case,
        #    each must be one of ENVIRONMENTS / STORAGES / LOG_LEVELS
        #  - BASE_URL must start with http:// or https:// (drop a trailing "/")
        #  - CODE_LENGTH 4-16 and MAX_URL_LENGTH 100-8192, as whole numbers
        #  - when ENV is production, add production_problems(settings)
        return cls(
            environment=env.get(PREFIX + "ENV", "development"),
            base_url=env.get(PREFIX + "BASE_URL", "http://localhost:8000"),
            storage=env.get(PREFIX + "STORAGE", "memory"),
            database_path=env.get(PREFIX + "DATABASE_PATH", ":memory:"),
            code_length=int(env.get(PREFIX + "CODE_LENGTH", "7")),
            max_url_length=int(env.get(PREFIX + "MAX_URL_LENGTH", "2048")),
            log_level=env.get(PREFIX + "LOG_LEVEL", "INFO"),
            admin_token=env.get(PREFIX + "ADMIN_TOKEN", ""),
        )
`

const SETTINGS_SOLUTION = SETTINGS_HEAD + py`
    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "Settings":
        env = os.environ if env is None else env
        problems: list[str] = []

        def text(name: str, default: str) -> str:
            return env.get(PREFIX + name, default).strip()

        def one_of(name: str, value: str, options: tuple[str, ...]) -> str:
            if value not in options:
                problems.append(f"{PREFIX}{name} must be one of {', '.join(options)} (got {value!r})")
            return value

        def number(name: str, default: int, low: int, high: int) -> int:
            raw = text(name, str(default))
            try:
                value = int(raw)
            except ValueError:
                problems.append(f"{PREFIX}{name} must be a whole number (got {raw!r})")
                return default
            if not low <= value <= high:
                problems.append(f"{PREFIX}{name} must be between {low} and {high} (got {value})")
            return value

        base_url = text("BASE_URL", "http://localhost:8000").rstrip("/")
        if not base_url.startswith(("http://", "https://")):
            problems.append(f"{PREFIX}BASE_URL must start with http:// or https:// (got {base_url!r})")

        settings = cls(
            environment=one_of("ENV", text("ENV", "development").lower(), ENVIRONMENTS),
            base_url=base_url,
            storage=one_of("STORAGE", text("STORAGE", "memory").lower(), STORAGES),
            database_path=text("DATABASE_PATH", ":memory:"),
            code_length=number("CODE_LENGTH", 7, 4, 16),
            max_url_length=number("MAX_URL_LENGTH", 2048, 100, 8192),
            log_level=one_of("LOG_LEVEL", text("LOG_LEVEL", "INFO").upper(), LOG_LEVELS),
            admin_token=text("ADMIN_TOKEN", ""),
        )
        if settings.environment == "production":
            problems.extend(production_problems(settings))
        if problems:
            raise ConfigError(problems)
        return settings
`

// ------------------------------------------------------------ logging_setup.py

const LOGGING_HEAD = py`"""Structured logging: one JSON object per line, written to stdout."""
import json
import logging
import sys
from datetime import datetime, timezone
from typing import TextIO

# Attributes every LogRecord has. Anything else on a record came from extra={...}.
STANDARD_ATTRS = set(vars(logging.LogRecord("x", logging.INFO, __file__, 0, "", None, None)))
STANDARD_ATTRS |= {"message", "asctime"}


class JsonFormatter(logging.Formatter):
`

const LOGGING_FORMAT_STARTER = py`    def format(self, record: logging.LogRecord) -> str:
        # TODO: return ONE line of JSON with
        #   "ts"      - record.created as an ISO-8601 UTC time (milliseconds is plenty),
        #   "level", "logger", "message" (record.getMessage()),
        #   every extra field: attributes of the record NOT in STANDARD_ATTRS,
        #   "exception" - self.formatException(record.exc_info), only when there is one.
        #   Use json.dumps(entry, default=str) so odd values can't crash logging.
        return super().format(record)
`

const LOGGING_FORMAT_SOLUTION = py`    def format(self, record: logging.LogRecord) -> str:
        entry: dict[str, object] = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        for key, value in vars(record).items():
            if key not in STANDARD_ATTRS and not key.startswith("_"):
                entry[key] = value
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, default=str)
`

const LOGGING_TAIL = py`

def configure_logging(settings, stream: TextIO | None = None) -> logging.Logger:
    """Configure the "shrtn" logger once. Safe to call again (handlers are replaced)."""
    logger = logging.getLogger("shrtn")
    logger.setLevel(settings.log_level)
    logger.handlers.clear()
    handler = logging.StreamHandler(stream if stream is not None else sys.stdout)
    handler.setFormatter(JsonFormatter())
    logger.addHandler(handler)
    logger.propagate = False
    return logger
`

// ------------------------------------------------------------ domain.py

const DOMAIN_HEAD = py`"""The core: what a short link is and which ones are valid. No I/O in here."""
import re
from dataclasses import dataclass
from datetime import datetime
from urllib.parse import urlsplit

CODE_PATTERN = re.compile(r"[A-Za-z0-9_-]{3,32}")
RESERVED_CODES = {"healthz", "links", "admin", "static"}


class DomainError(Exception):
    """Base class for expected, user-facing problems."""


class ValidationError(DomainError):
    pass


class NotFoundError(DomainError):
    pass


class ConflictError(DomainError):
    pass


@dataclass(frozen=True)
class ShortLink:
    code: str
    target_url: str
    created_at: datetime
    hits: int = 0


def validate_code(code: object) -> str:
    if not isinstance(code, str) or not CODE_PATTERN.fullmatch(code):
        raise ValidationError("custom code must be 3-32 letters, digits, '-' or '_'")
    if code.lower() in RESERVED_CODES:
        raise ValidationError(f"{code!r} is reserved")
    return code
`

const DOMAIN_STARTER = DOMAIN_HEAD + py`

def validate_url(url: object, max_length: int = 2048) -> str:
    # TODO: strip it, then reject (ValidationError with a clear reason):
    #  - longer than max_length
    #  - containing whitespace or control characters
    #  - a scheme other than http or https (javascript:, data:, ftp: ...)
    #  - no host name ("https://", "docs.python.org" without a scheme)
    if not isinstance(url, str) or not url.strip():
        raise ValidationError("url is required")
    return url.strip()
`

const DOMAIN_SOLUTION = DOMAIN_HEAD + py`

def validate_url(url: object, max_length: int = 2048) -> str:
    if not isinstance(url, str) or not url.strip():
        raise ValidationError("url is required")
    url = url.strip()
    if len(url) > max_length:
        raise ValidationError(f"url is longer than {max_length} characters")
    if any(ch.isspace() or ord(ch) < 32 for ch in url):
        raise ValidationError("url must not contain spaces or control characters")
    try:
        parts = urlsplit(url)
    except ValueError:
        raise ValidationError("url is malformed") from None
    if parts.scheme.lower() not in {"http", "https"}:
        raise ValidationError("url must start with http:// or https://")
    if not parts.hostname:
        raise ValidationError("url must include a host name")
    return url
`

// ------------------------------------------------------------ repository.py

const REPO_HEAD = py`"""Storage behind a Protocol: the service never knows which adapter it got."""
import sqlite3
from dataclasses import replace
from datetime import datetime
from typing import Protocol, runtime_checkable

from domain import ConflictError, ShortLink


@runtime_checkable
class LinkRepository(Protocol):
    def add(self, link: ShortLink) -> None: ...
    def get(self, code: str) -> ShortLink | None: ...
    def record_hit(self, code: str) -> None: ...
    def delete(self, code: str) -> bool: ...
    def ping(self) -> bool: ...


class InMemoryLinkRepository:
    """Fast and simple. Data lives in one process and is lost on restart."""

    def __init__(self) -> None:
        self._links: dict[str, ShortLink] = {}

    def add(self, link: ShortLink) -> None:
        if link.code in self._links:
            raise ConflictError(f"code {link.code!r} is already taken")
        self._links[link.code] = link

    def get(self, code: str) -> ShortLink | None:
        return self._links.get(code)

    def record_hit(self, code: str) -> None:
        link = self._links[code]
        self._links[code] = replace(link, hits=link.hits + 1)

    def delete(self, code: str) -> bool:
        return self._links.pop(code, None) is not None

    def ping(self) -> bool:
        return True


class SqliteLinkRepository:
    SCHEMA = """
        CREATE TABLE IF NOT EXISTS links (
            code        TEXT PRIMARY KEY,
            target_url  TEXT    NOT NULL,
            created_at  TEXT    NOT NULL,
            hits        INTEGER NOT NULL DEFAULT 0
        )
    """

    def __init__(self, conn: sqlite3.Connection) -> None:
        self.conn = conn
        self.conn.execute(self.SCHEMA)

    def get(self, code: str) -> ShortLink | None:
        row = self.conn.execute(
            "SELECT code, target_url, created_at, hits FROM links WHERE code = ?", (code,)
        ).fetchone()
        if row is None:
            return None
        return ShortLink(row[0], row[1], datetime.fromisoformat(row[2]), row[3])

    def ping(self) -> bool:
        try:
            self.conn.execute("SELECT 1").fetchone()
            return True
        except sqlite3.Error:
            return False
`

const REPO_STARTER = REPO_HEAD + py`
    def add(self, link: ShortLink) -> None:
        # TODO: INSERT inside "with self.conn:" (store created_at.isoformat());
        #       a duplicate code (sqlite3.IntegrityError) must become ConflictError
        raise NotImplementedError("TODO: SqliteLinkRepository.add()")

    def record_hit(self, code: str) -> None:
        # TODO: UPDATE links SET hits = hits + 1 WHERE code = ?   (one atomic statement)
        raise NotImplementedError("TODO: SqliteLinkRepository.record_hit()")

    def delete(self, code: str) -> bool:
        # TODO: DELETE ... WHERE code = ?; return True only if a row was deleted
        raise NotImplementedError("TODO: SqliteLinkRepository.delete()")
`

const REPO_SOLUTION = REPO_HEAD + py`
    def add(self, link: ShortLink) -> None:
        try:
            with self.conn:
                self.conn.execute(
                    "INSERT INTO links (code, target_url, created_at, hits) VALUES (?, ?, ?, ?)",
                    (link.code, link.target_url, link.created_at.isoformat(), link.hits),
                )
        except sqlite3.IntegrityError:
            raise ConflictError(f"code {link.code!r} is already taken") from None

    def record_hit(self, code: str) -> None:
        with self.conn:
            self.conn.execute("UPDATE links SET hits = hits + 1 WHERE code = ?", (code,))

    def delete(self, code: str) -> bool:
        with self.conn:
            cursor = self.conn.execute("DELETE FROM links WHERE code = ?", (code,))
        return cursor.rowcount == 1
`

// ------------------------------------------------------------ service.py

const SERVICE_HEAD = py`"""Use cases. Every collaborator is passed in (dependency injection)."""
import logging
import secrets
import string
from collections.abc import Callable, Iterator
from datetime import datetime, timezone

from domain import ConflictError, NotFoundError, ShortLink, validate_code, validate_url
from repository import LinkRepository

ALPHABET = string.ascii_letters + string.digits


def random_codes(length: int, alphabet: str = ALPHABET) -> Iterator[str]:
    """An endless supply of unguessable codes (secrets, not random)."""
    while True:
        yield "".join(secrets.choice(alphabet) for _ in range(length))


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class LinkService:
    MAX_CODE_ATTEMPTS = 5

    def __init__(
        self,
        repo: LinkRepository,
        *,
        codes: Iterator[str],
        clock: Callable[[], datetime] = utc_now,
        max_url_length: int = 2048,
        logger: logging.Logger | None = None,
    ) -> None:
        self.repo = repo
        self.codes = codes
        self.clock = clock
        self.max_url_length = max_url_length
        self.log = logger or logging.getLogger("shrtn.service")

    def shorten(self, url: object, custom_code: object = None) -> ShortLink:
        target = validate_url(url, self.max_url_length)
        if custom_code is not None:
            link = ShortLink(validate_code(custom_code), target, self.clock())
            self.repo.add(link)  # ConflictError if the code is taken
        else:
            link = self._add_with_generated_code(target)
        self.log.info("link created", extra={"code": link.code, "custom": custom_code is not None})
        return link

    def resolve(self, code: str) -> ShortLink:
        link = self.stats(code)
        self.repo.record_hit(code)
        return link

    def stats(self, code: str) -> ShortLink:
        link = self.repo.get(code)
        if link is None:
            raise NotFoundError(f"no link with code {code!r}")
        return link

    def delete(self, code: str) -> None:
        if not self.repo.delete(code):
            raise NotFoundError(f"no link with code {code!r}")
        self.log.info("link deleted", extra={"code": code})
`

const SERVICE_STARTER = SERVICE_HEAD + py`
    def _add_with_generated_code(self, target: str) -> ShortLink:
        # TODO: random codes can collide with existing ones. Try up to
        #       MAX_CODE_ATTEMPTS codes from self.codes: on ConflictError log a
        #       warning ("code collision", extra={"code": ...}) and try the next one.
        #       If every attempt collides, raise RuntimeError.
        link = ShortLink(next(self.codes), target, self.clock())
        self.repo.add(link)
        return link
`

const SERVICE_SOLUTION = SERVICE_HEAD + py`
    def _add_with_generated_code(self, target: str) -> ShortLink:
        for _ in range(self.MAX_CODE_ATTEMPTS):
            link = ShortLink(next(self.codes), target, self.clock())
            try:
                self.repo.add(link)
            except ConflictError:
                self.log.warning("code collision", extra={"code": link.code})
                continue
            return link
        raise RuntimeError(f"no free code after {self.MAX_CODE_ATTEMPTS} attempts")
`

// ------------------------------------------------------------ api.py

const API_HEAD = py`"""The HTTP edge: (method, path, body, headers) in, Response out. Framework-free."""
import hmac
import json
import logging
import re
import time
import uuid
from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from http import HTTPStatus
from typing import Any

from domain import ConflictError, NotFoundError, ValidationError
from repository import LinkRepository
from service import LinkService
from settings import Settings

MAX_BODY_BYTES = 16 * 1024
ALLOWED_FIELDS = {"url", "code"}
SAFE_REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{1,64}")


@dataclass
class Response:
    status: int
    body: dict[str, Any] | None = None
    headers: dict[str, str] = field(default_factory=dict)


def parse_json_object(body: bytes) -> dict[str, Any]:
    if len(body) > MAX_BODY_BYTES:
        raise ValidationError("request body is too large")
    try:
        data = json.loads(body or b"null")
    except ValueError:
        raise ValidationError("request body must be valid JSON") from None
    if not isinstance(data, dict):
        raise ValidationError("request body must be a JSON object")
    unknown = sorted(set(data) - ALLOWED_FIELDS)
    if unknown:
        raise ValidationError(f"unknown field(s): {', '.join(unknown)}")
    return data


def not_allowed(*methods: str) -> Response:
    return Response(405, {"error": "method not allowed"}, {"Allow": ", ".join(methods)})


class App:
    def __init__(
        self,
        service: LinkService,
        settings: Settings,
        repo: LinkRepository,
        *,
        logger: logging.Logger | None = None,
        request_ids: Callable[[], str] | None = None,
    ) -> None:
        self.service = service
        self.settings = settings
        self.repo = repo  # used only by the health check
        self.log = logger or logging.getLogger("shrtn.http")
        self.request_ids = request_ids or (lambda: uuid.uuid4().hex[:12])

    # ------------------------------------------------------------ the one entry point
    def handle(self, method: str, path: str, body: bytes = b"",
               headers: Mapping[str, str] | None = None) -> Response:
        lowered = {name.lower(): value for name, value in (headers or {}).items()}
        supplied_id = lowered.get("x-request-id", "")
        request_id = supplied_id if SAFE_REQUEST_ID.fullmatch(supplied_id) else self.request_ids()
        method = method.upper()
        started = time.perf_counter()
        try:
            response = self.route(method, path, body, lowered)
        except ValidationError as exc:
            response = Response(400, {"error": str(exc)})
        except NotFoundError as exc:
            response = Response(404, {"error": str(exc)})
        except ConflictError as exc:
            response = Response(409, {"error": str(exc)})
        except Exception:
            self.log.exception("unhandled error", extra={"request_id": request_id})
            response = Response(500, {"error": "internal server error", "request_id": request_id})
        response.headers["X-Request-ID"] = request_id
        self.log.info("request", extra={
            "request_id": request_id,
            "method": method,
            "path": path,
            "status": response.status,
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        })
        return response

    def route(self, method: str, path: str, body: bytes, headers: dict[str, str]) -> Response:
        parts = [part for part in path.split("/") if part]
        match (method, parts):
            case ("GET", ["healthz"]):
                return self.health()
            case ("POST", ["links"]):
                return self.create(body)
            case ("GET", ["links", code, "stats"]):
                return self.stats(code)
            case ("DELETE", ["links", code]):
                return self.delete(code, headers)
            case (_, ["healthz"]) | (_, ["links", _, "stats"]):
                return not_allowed("GET")
            case (_, ["links"]):
                return not_allowed("POST")
            case (_, ["links", _]):
                return not_allowed("DELETE")
            case ("GET", [code]):
                return self.redirect(code)
            case (_, [_]):
                return not_allowed("GET")
        raise NotFoundError(f"no route for {path}")

    # ------------------------------------------------------------ handlers
    def create(self, body: bytes) -> Response:
        data = parse_json_object(body)
        link = self.service.shorten(data.get("url"), data.get("code"))
        short_url = f"{self.settings.base_url}/{link.code}"
        return Response(
            201,
            {"code": link.code, "short_url": short_url, "target_url": link.target_url},
            {"Location": short_url},
        )

    def redirect(self, code: str) -> Response:
        link = self.service.resolve(code)
        return Response(302, None, {"Location": link.target_url, "Cache-Control": "no-store"})

    def stats(self, code: str) -> Response:
        link = self.service.stats(code)
        return Response(200, {
            "code": link.code,
            "target_url": link.target_url,
            "hits": link.hits,
            "created_at": link.created_at.isoformat(),
        })
`

const API_HANDLERS_STARTER = py`
    def health(self) -> Response:
        # TODO: check the repository with ping(). A ping that returns False OR raises
        #       means {"status": "degraded", "checks": {"database": "failing"}} and 503;
        #       otherwise {"status": "ok", "checks": {"database": "ok"}} and 200.
        #       Include "environment": self.settings.environment in both.
        return Response(200, {"status": "ok", "environment": self.settings.environment})

    def delete(self, code: str, headers: dict[str, str]) -> Response:
        # TODO (SECURITY): only "Authorization: Bearer <settings.admin_token>" may delete.
        #       Anything else -> 401 {"error": ...} with a "WWW-Authenticate: Bearer" header.
        #       Compare tokens with hmac.compare_digest, and refuse everyone when no
        #       admin token is configured.
        self.service.delete(code)
        return Response(204)
`

const API_HANDLERS_SOLUTION = py`
    def health(self) -> Response:
        try:
            database_ok = bool(self.repo.ping())
        except Exception:
            self.log.exception("health check failed")
            database_ok = False
        healthy = database_ok
        return Response(200 if healthy else 503, {
            "status": "ok" if healthy else "degraded",
            "checks": {"database": "ok" if database_ok else "failing"},
            "environment": self.settings.environment,
        })

    def delete(self, code: str, headers: dict[str, str]) -> Response:
        if not self.is_admin(headers):
            return Response(401, {"error": "missing or invalid token"}, {"WWW-Authenticate": "Bearer"})
        self.service.delete(code)
        return Response(204)

    def is_admin(self, headers: dict[str, str]) -> bool:
        expected = self.settings.admin_token
        scheme, _, supplied = headers.get("authorization", "").partition(" ")
        if not expected or scheme != "Bearer" or not supplied:
            return False
        return hmac.compare_digest(supplied.encode(), expected.encode())
`

const API_TAIL = py`

def wsgi_adapter(app: App) -> Callable:
    """Expose App as a WSGI application, so gunicorn (or any WSGI server) can run it."""
    def wsgi_app(environ, start_response):
        try:
            length = int(environ.get("CONTENT_LENGTH") or 0)
        except ValueError:
            length = 0
        body = environ["wsgi.input"].read(min(length, MAX_BODY_BYTES + 1)) if length > 0 else b""
        headers = {
            key[5:].replace("_", "-"): value
            for key, value in environ.items() if key.startswith("HTTP_")
        }
        response = app.handle(environ["REQUEST_METHOD"], environ.get("PATH_INFO") or "/", body, headers)
        payload = b"" if response.body is None else json.dumps(response.body).encode("utf-8")
        out = [("Content-Length", str(len(payload))), *response.headers.items()]
        if response.body is not None:
            out.insert(0, ("Content-Type", "application/json"))
        start_response(f"{response.status} {HTTPStatus(response.status).phrase}", out)
        return [payload]

    return wsgi_app
`

// ------------------------------------------------------------ container, fakes, main

const CONTAINER_PY = py`"""The composition root: the ONE place that chooses concrete classes."""
import sqlite3
from collections.abc import Callable, Iterator
from datetime import datetime
from typing import TextIO

from api import App
from logging_setup import configure_logging
from repository import InMemoryLinkRepository, LinkRepository, SqliteLinkRepository
from service import LinkService, random_codes, utc_now
from settings import Settings


def build_repository(settings: Settings) -> LinkRepository:
    if settings.storage == "sqlite":
        return SqliteLinkRepository(sqlite3.connect(settings.database_path))
    return InMemoryLinkRepository()


def build_app(
    settings: Settings,
    *,
    repo: LinkRepository | None = None,
    codes: Iterator[str] | None = None,
    clock: Callable[[], datetime] | None = None,
    log_stream: TextIO | None = None,
    request_ids: Callable[[], str] | None = None,
) -> App:
    """Real collaborators by default; tests pass fakes for any of them."""
    logger = configure_logging(settings, log_stream)
    repo = repo if repo is not None else build_repository(settings)
    service = LinkService(
        repo,
        codes=codes if codes is not None else random_codes(settings.code_length),
        clock=clock or utc_now,
        max_url_length=settings.max_url_length,
        logger=logger.getChild("service"),
    )
    return App(service, settings, repo, logger=logger.getChild("http"), request_ids=request_ids)
`

const FAKES_PY = py`"""Test doubles: tiny, predictable stand-ins for real collaborators."""
from datetime import datetime, timezone
from itertools import count

from domain import ShortLink


class FixedClock:
    """A clock that never moves, so tests can assert exact timestamps."""

    def __init__(self, when: datetime = datetime(2026, 3, 12, 9, 30, tzinfo=timezone.utc)) -> None:
        self.when = when

    def __call__(self) -> datetime:
        return self.when


def sequential_codes(prefix: str = "c"):
    """c0001, c0002, ... instead of random codes."""
    for n in count(1):
        yield f"{prefix}{n:04d}"


def sequential_ids(prefix: str = "req"):
    numbers = count(1)
    return lambda: f"{prefix}-{next(numbers)}"


class BrokenRepository:
    """Behaves like a database that has gone away."""

    def add(self, link: ShortLink) -> None:
        raise ConnectionError("database unavailable")

    def get(self, code: str) -> ShortLink | None:
        raise ConnectionError("database unavailable")

    def record_hit(self, code: str) -> None:
        raise ConnectionError("database unavailable")

    def delete(self, code: str) -> bool:
        raise ConnectionError("database unavailable")

    def ping(self) -> bool:
        raise ConnectionError("database unavailable")
`

const MAIN_PY = py`"""Run the service in-process: real settings, real wiring, a scripted set of requests."""
import json

from container import build_app
from settings import ConfigError, Settings

DEMO_REQUESTS = [
    ("GET", "/healthz", None),
    ("POST", "/links", {"url": "https://docs.python.org/3/library/asyncio.html", "code": "asyncio-docs"}),
    ("POST", "/links", {"url": "https://peps.python.org/pep-0008/"}),
    ("POST", "/links", {"url": "javascript:alert(document.cookie)"}),
    ("POST", "/links", {"url": "https://example.com", "code": "asyncio-docs"}),
    ("GET", "/asyncio-docs", None),
    ("GET", "/links/asyncio-docs/stats", None),
    ("GET", "/no-such-code", None),
    ("DELETE", "/links/asyncio-docs", None),
]


def check_unsafe_config():
    unsafe = {"SHRTN_ENV": "production", "SHRTN_BASE_URL": "http://sho.rt"}
    try:
        Settings.from_env(unsafe)
    except ConfigError as exc:
        print(f"Refused an unsafe production config: {exc}\n")
    else:
        print("WARNING: an unsafe production config was accepted!\n")


def main(env=None):
    check_unsafe_config()
    try:
        settings = Settings.from_env(env)  # None means: read os.environ
    except ConfigError as exc:
        print(exc)
        return 1
    print(settings, "\n")
    app = build_app(settings)  # logs go to stdout as JSON lines
    for method, path, payload in DEMO_REQUESTS:
        body = json.dumps(payload).encode() if payload is not None else b""
        response = app.handle(method, path, body)
        shown = response.body if response.body is not None else response.headers.get("Location", "")
        print(f"   -> {method} {path}: {response.status} {shown}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
`

const API_STARTER = API_HEAD + API_HANDLERS_STARTER + API_TAIL
const API_SOLUTION = API_HEAD + API_HANDLERS_SOLUTION + API_TAIL
const LOGGING_STARTER = LOGGING_HEAD + LOGGING_FORMAT_STARTER + LOGGING_TAIL
const LOGGING_SOLUTION = LOGGING_HEAD + LOGGING_FORMAT_SOLUTION + LOGGING_TAIL

// ------------------------------------------------------------ tests (platform)

const SETUP = py`import io
import json
settings_mod, container, fakes = module('settings'), module('container'), module('fakes')

def make_app(env=None, **kwargs):
    settings = settings_mod.Settings.from_env({"SHRTN_BASE_URL": "https://sho.rt", **(env or {})})
    kwargs.setdefault("codes", fakes.sequential_codes())
    kwargs.setdefault("clock", fakes.FixedClock())
    kwargs.setdefault("request_ids", fakes.sequential_ids())
    kwargs.setdefault("log_stream", io.StringIO())
    return container.build_app(settings, **kwargs)

def post(app, payload, headers=None):
    return app.handle("POST", "/links", json.dumps(payload).encode(), headers)
`

const TESTS = [
  {
    name: 'Settings.from_env() uses safe defaults and normalises values',
    code: py`Settings = module('settings').Settings
s = Settings.from_env({})
assert s == Settings()
assert (s.environment, s.storage, s.code_length, s.log_level) == ("development", "memory", 7, "INFO")
t = Settings.from_env({"SHRTN_ENV": " Test ", "SHRTN_BASE_URL": "https://sho.rt/", "SHRTN_CODE_LENGTH": "9",
                       "SHRTN_LOG_LEVEL": "debug", "SHRTN_STORAGE": "SQLITE", "OTHER_APP_SETTING": "x"})
assert (t.environment, t.base_url, t.code_length, t.log_level, t.storage) == ("test", "https://sho.rt", 9, "DEBUG", "sqlite")`,
  },
  {
    name: 'Settings.from_env() reports ALL problems at once, enforces production rules and hides the secret',
    code: py`settings_mod = module('settings')
try:
    settings_mod.Settings.from_env({"SHRTN_CODE_LENGTH": "three", "SHRTN_ENV": "staging",
                                    "SHRTN_STORAGE": "redis", "SHRTN_MAX_URL_LENGTH": "50"})
except settings_mod.ConfigError as exc:
    problems = exc.problems
else:
    raise AssertionError("ConfigError was not raised")
assert len(problems) == 4, problems
for name in ("SHRTN_CODE_LENGTH", "SHRTN_ENV", "SHRTN_STORAGE", "SHRTN_MAX_URL_LENGTH"):
    assert any(name in p for p in problems), f"no problem mentions {name}"
try:
    settings_mod.Settings.from_env({"SHRTN_ENV": "production", "SHRTN_BASE_URL": "http://sho.rt"})
except settings_mod.ConfigError as exc:
    assert len(exc.problems) == 3, exc.problems
else:
    raise AssertionError("an unsafe production config was accepted")
prod = settings_mod.Settings.from_env({"SHRTN_ENV": "production", "SHRTN_BASE_URL": "https://sho.rt",
                                       "SHRTN_STORAGE": "sqlite", "SHRTN_DATABASE_PATH": "/data/shrtn.db",
                                       "SHRTN_ADMIN_TOKEN": "s3cret"})
assert prod.admin_token == "s3cret" and "s3cret" not in repr(prod)`,
  },
  {
    name: 'validate_url() and validate_code() accept good input and reject dangerous or malformed input',
    code: py`domain = module('domain')
assert domain.validate_url("  https://docs.python.org/3/?q=1#x ") == "https://docs.python.org/3/?q=1#x"
assert domain.validate_url("http://localhost:8000/a") == "http://localhost:8000/a"
bad = ["javascript:alert(1)", "data:text/html,hi", "ftp://files.example.com/x", "https://",
       "docs.python.org", "https://exa mple.com", "https://example.com/\tx",
       "https://example.com/" + "a" * 3000, "", None, 42]
for url in bad:
    with raises(domain.ValidationError):
        domain.validate_url(url)
with raises(domain.ValidationError):
    domain.validate_url("https://example.com/" + "a" * 100, max_length=50)
assert domain.validate_code("pep-8_docs") == "pep-8_docs"
for code in ["ab", "has space", "links", "HEALTHZ", "x" * 33]:
    with raises(domain.ValidationError):
        domain.validate_code(code)`,
  },
  {
    name: 'both repositories satisfy the same contract (in-memory and SQLite)',
    code: py`import sqlite3
from datetime import datetime, timezone
repo_mod, domain = module('repository'), module('domain')
when = datetime(2026, 3, 12, 9, 30, tzinfo=timezone.utc)

def check(repo):
    assert isinstance(repo, repo_mod.LinkRepository)
    link = domain.ShortLink("abc", "https://example.com/a", when)
    repo.add(link)
    assert repo.get("abc") == link
    assert repo.get("ABC") is None and repo.get("nope") is None
    with raises(domain.ConflictError):
        repo.add(domain.ShortLink("abc", "https://example.com/b", when))
    repo.record_hit("abc")
    repo.record_hit("abc")
    assert repo.get("abc").hits == 2
    assert repo.delete("abc") is True and repo.delete("abc") is False
    assert repo.get("abc") is None and repo.ping() is True

check(repo_mod.InMemoryLinkRepository())
check(repo_mod.SqliteLinkRepository(sqlite3.connect(":memory:")))`,
  },
  {
    name: 'LinkService.shorten() uses the injected codes and clock and retries code collisions',
    code: py`from datetime import datetime, timezone
service_mod, repo_mod, domain, fakes = module('service'), module('repository'), module('domain'), module('fakes')
repo = repo_mod.InMemoryLinkRepository()
repo.add(domain.ShortLink("c0001", "https://taken.example", fakes.FixedClock()()))
svc = service_mod.LinkService(repo, codes=fakes.sequential_codes(), clock=fakes.FixedClock())
link = svc.shorten("  https://docs.python.org/3/  ")
assert link.code == "c0002", 'c0001 was taken: try the next code'
assert link.target_url == "https://docs.python.org/3/"
assert link.created_at == datetime(2026, 3, 12, 9, 30, tzinfo=timezone.utc)
assert svc.shorten("https://peps.python.org/", custom_code="peps").code == "peps"
with raises(domain.ConflictError):
    svc.shorten("https://example.com", custom_code="peps")
with raises(domain.ValidationError):
    svc.shorten("https://example.com", custom_code="no spaces")
unlucky = service_mod.LinkService(repo, codes=iter(["c0001"] * 10), clock=fakes.FixedClock())
with raises(RuntimeError):
    unlucky.shorten("https://example.com")`,
  },
  {
    name: 'resolve() counts hits, unknown codes raise NotFoundError, codes are random and unguessable',
    code: py`service_mod, repo_mod, domain, fakes = module('service'), module('repository'), module('domain'), module('fakes')
svc = service_mod.LinkService(repo_mod.InMemoryLinkRepository(), codes=fakes.sequential_codes(),
                              clock=fakes.FixedClock())
svc.shorten("https://example.com/docs", custom_code="docs")
assert svc.resolve("docs").target_url == "https://example.com/docs"
svc.resolve("docs")
assert svc.stats("docs").hits == 2
with raises(domain.NotFoundError):
    svc.resolve("nope")
svc.delete("docs")
with raises(domain.NotFoundError):
    svc.delete("docs")
codes = service_mod.random_codes(9)
first, second = next(codes), next(codes)
assert len(first) == 9 and first.isalnum() and first != second`,
  },
  {
    name: 'POST /links answers 201 with the short URL; bad input 400; a taken code 409',
    code: SETUP + py`app = make_app()
r = post(app, {"url": "https://docs.python.org/3/"})
assert r.status == 201, r.body
assert r.body == {"code": "c0001", "short_url": "https://sho.rt/c0001", "target_url": "https://docs.python.org/3/"}
assert r.headers["Location"] == "https://sho.rt/c0001"
assert post(app, {"url": "https://example.com", "code": "docs"}).status == 201
assert post(app, {"url": "https://example.com/2", "code": "docs"}).status == 409
assert app.handle("POST", "/links", b"{not json").status == 400
assert post(app, {"url": "https://example.com", "colour": "red"}).status == 400
assert post(app, ["https://example.com"]).status == 400
assert post(app, {"url": "javascript:alert(1)"}).status == 400`,
  },
  {
    name: 'GET /<code> redirects (302), stats count hits, unknown paths 404, wrong methods 405',
    code: SETUP + py`app = make_app()
post(app, {"url": "https://peps.python.org/pep-0008/", "code": "pep8"})
r = app.handle("GET", "/pep8")
assert r.status == 302 and r.headers["Location"] == "https://peps.python.org/pep-0008/"
app.handle("GET", "/pep8")
stats = app.handle("GET", "/links/pep8/stats")
assert stats.status == 200 and stats.body["hits"] == 2
assert stats.body["created_at"] == "2026-03-12T09:30:00+00:00"
assert app.handle("GET", "/missing").status == 404
assert app.handle("GET", "/a/b/c/d").status == 404
r = app.handle("GET", "/links")
assert r.status == 405 and r.headers["Allow"] == "POST"
assert app.handle("PUT", "/healthz").status == 405
assert app.handle("POST", "/pep8").headers.get("Allow") == "GET"`,
  },
  {
    name: 'DELETE /links/<code> needs the admin bearer token (401 / 204 / 404)',
    code: SETUP + py`app = make_app({"SHRTN_ADMIN_TOKEN": "s3cret-token"})
post(app, {"url": "https://example.com", "code": "temp"})
r = app.handle("DELETE", "/links/temp")
assert r.status == 401, r.status
assert r.headers.get("WWW-Authenticate") == "Bearer"
assert app.handle("DELETE", "/links/temp", headers={"Authorization": "Bearer wrong"}).status == 401
ok = app.handle("DELETE", "/links/temp", headers={"Authorization": "Bearer s3cret-token"})
assert ok.status == 204 and ok.body is None
assert app.handle("GET", "/temp").status == 404
assert app.handle("DELETE", "/links/temp", headers={"Authorization": "Bearer s3cret-token"}).status == 404
open_app = make_app()   # no admin token configured
post(open_app, {"url": "https://example.com", "code": "keep"})
assert open_app.handle("DELETE", "/links/keep", headers={"Authorization": "Bearer "}).status == 401`,
  },
  {
    name: 'GET /healthz answers 200 when the database answers, 503 when it does not',
    code: SETUP + py`ok = make_app().handle("GET", "/healthz")
assert ok.status == 200
assert ok.body["status"] == "ok" and ok.body["checks"] == {"database": "ok"}
broken = make_app(repo=fakes.BrokenRepository()).handle("GET", "/healthz")
assert broken.status == 503, broken.status
assert broken.body["status"] == "degraded" and broken.body["checks"] == {"database": "failing"}`,
  },
  {
    name: 'unexpected errors become a generic 500 with the request id, and are logged with the traceback',
    code: SETUP + py`class ExplodingRepository(module('repository').InMemoryLinkRepository):
    def get(self, code):
        raise RuntimeError("connection to postgres://admin:hunter2@db failed")

stream = io.StringIO()
app = make_app(repo=ExplodingRepository(), log_stream=stream)
r = app.handle("GET", "/anything")
assert r.status == 500
assert r.body == {"error": "internal server error", "request_id": "req-1"}
assert "hunter2" not in json.dumps(r.body)
logged = [json.loads(line) for line in stream.getvalue().splitlines()]
errors = [entry for entry in logged if entry["level"] == "ERROR"]
assert errors, 'log the unexpected error'
assert "RuntimeError" in errors[0]["exception"] and errors[0]["request_id"] == "req-1"`,
  },
  {
    name: 'every request is logged as one JSON line with request id, method, path, status and duration',
    code: SETUP + py`stream = io.StringIO()
app = make_app(log_stream=stream)
app.handle("GET", "/healthz")
r = post(app, {"url": "https://example.com"}, headers={"X-Request-ID": "abc-123"})
assert r.headers["X-Request-ID"] == "abc-123"
evil = app.handle("GET", "/healthz", headers={"X-Request-ID": "x\nFAKE LOG LINE"})
assert evil.headers["X-Request-ID"] == "req-2", 'never trust a request id that could forge log lines'
lines = [json.loads(line) for line in stream.getvalue().splitlines()]
requests = [entry for entry in lines if entry["message"] == "request"]
assert [(e["request_id"], e["method"], e["path"], e["status"]) for e in requests][:2] == [
    ("req-1", "GET", "/healthz", 200), ("abc-123", "POST", "/links", 201)]
assert all(e["level"] == "INFO" and e["logger"] == "shrtn.http" for e in requests)
assert isinstance(requests[0]["duration_ms"], (int, float))
assert lines[0]["ts"].endswith("+00:00")
created = [entry for entry in lines if entry["message"] == "link created"]
assert created and created[0]["code"] == "c0001"`,
  },
  {
    name: 'the WSGI adapter serves the same app to any WSGI server',
    code: SETUP + py`from wsgiref.util import setup_testing_defaults
wsgi_app = module('api').wsgi_adapter(make_app())

def call(method, path, body=b"", extra=None):
    environ = {"REQUEST_METHOD": method, "PATH_INFO": path, "CONTENT_LENGTH": str(len(body)),
               "wsgi.input": io.BytesIO(body), **(extra or {})}
    setup_testing_defaults(environ)
    seen = {}
    def start_response(status, headers, exc_info=None):
        seen["status"], seen["headers"] = status, dict(headers)
    payload = b"".join(wsgi_app(environ, start_response))
    return seen["status"], seen["headers"], payload

status, headers, payload = call("POST", "/links", b'{"url": "https://example.com/wsgi"}',
                                {"HTTP_X_REQUEST_ID": "wsgi-1"})
assert status == "201 Created"
assert headers["Content-Type"] == "application/json" and headers["X-Request-ID"] == "wsgi-1"
assert int(headers["Content-Length"]) == len(payload)
code = json.loads(payload)["code"]
status, headers, payload = call("GET", "/" + code)
assert status == "302 Found" and headers["Location"] == "https://example.com/wsgi" and payload == b""`,
  },
]

export default {
  id: 'project-production-service',
  kind: 'project',
  title: 'Project 9: Production-Style Service',
  summary: 'Build a URL-shortener service the way teams ship real ones: validated settings from the environment, structured logs, a layered design with dependency injection, safe errors, a health check, tests with fakes — plus packaging, linting, type checking and deployment.',
  difficulty: 'advanced',
  minutes: 240,
  prerequisites: ['clean-architecture', 'protocols', 'logging', 'building-apis', 'project-library-api'],
  related: ['project-inventory-system', 'project-async-pipeline', 'packaging', 'code-quality-tools', 'static-type-checking', 'secrets-and-passwords', 'input-validation', 'secure-practices', 'dataclasses', 'match-statement', 'mocking', 'fixtures', 'solid', 'design-patterns', 'virtual-environments'],
  tags: ['project', 'production', 'URL shortener', '12-factor', 'settings', 'environment variables', 'structured logging', 'JSON logs', 'request id', 'dependency injection', 'composition root', 'Protocol', 'repository', 'health check', 'fakes', 'hmac.compare_digest', 'secrets', 'pyproject.toml', 'ruff', 'mypy', 'Docker', 'gunicorn', 'WSGI'],
  apis: [
    { name: 'os.environ / Mapping', summary: 'Environment variables as a mapping of strings; accept any Mapping so tests can pass a plain dict.' },
    { name: 'dataclasses.field(repr=False)', summary: 'Leave a field (like a secret token) out of the generated __repr__.' },
    { name: 'logging.Formatter.format(record)', summary: 'Override to control how each LogRecord is rendered — e.g. as one JSON object per line.' },
    { name: 'logger.info(msg, extra={...})', summary: 'Attach structured fields to a log record; they become attributes a formatter can output.' },
    { name: 'typing.Protocol / @runtime_checkable', summary: 'Structural interfaces: any class with the right methods qualifies, no inheritance needed.' },
    { name: 'hmac.compare_digest(a, b)', summary: 'Compare secrets in constant time, so response timing does not leak how much of a token was right.' },
    { name: 'secrets.choice(seq)', summary: 'Cryptographically strong random choice — use it, not random, for anything that must be unguessable.' },
  ],
  docs: [
    { label: 'logging — Logging HOWTO / Cookbook', url: 'https://docs.python.org/3/howto/logging-cookbook.html' },
    { label: 'typing.Protocol', url: 'https://docs.python.org/3/library/typing.html#typing.Protocol' },
    { label: 'secrets — Generate secure random numbers', url: 'https://docs.python.org/3/library/secrets.html' },
    { label: 'Python Packaging User Guide — Writing pyproject.toml', url: 'https://packaging.python.org/en/latest/guides/writing-pyproject-toml/' },
    { label: 'mypy documentation', url: 'https://mypy.readthedocs.io/en/stable/' },
    { label: 'PEP 3333 — WSGI', url: 'https://peps.python.org/pep-3333/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`You've built programs that *work*. This project is about building a program that *keeps working* when other people run it, change it, deploy it at 2 a.m. and debug it from logs alone. The example is a **URL shortener** — \`POST /links\` turns \`https://docs.python.org/3/library/asyncio.html\` into \`https://sho.rt/asyncio-docs\`, and \`GET /asyncio-docs\` redirects there — small enough to finish, rich enough to need every production habit.`,
    py`You'll build: **settings** read from environment variables and validated at start-up; **structured JSON logs** with a request id on every line; a **layered design** — domain, service, repository *protocol* with in-memory and SQLite adapters — wired together in one **composition root** with **dependency injection**; strict **validation**, safe **error handling** and HTTP-style responses; a **health check**; and **tests with fakes**. Then static steps cover **packaging** with \`pyproject.toml\`, **linting and type checking**, and **deployment** with a container and a WSGI server.`,
    py`Builds on [clean architecture](lesson:clean-architecture), [protocols](lesson:protocols), [logging](lesson:logging) and the [Library API project](lesson:project-library-api).`,
  ],
  why: [
    py`In production nobody can attach a debugger. What you have is the configuration you were started with, the logs you wrote, the health endpoint your platform polls, and the tests that ran before deploy. Each of those has to be designed in — they can't be bolted on during an incident.`,
    py`A URL shortener is also a classic security exercise: it takes URLs from strangers and sends other people's browsers to them. Accept \`javascript:\` URLs or guessable codes, leak a stack trace or log a secret, and you've built an attack tool.`,
    py`Finally, dependency injection is what makes all of this *testable*: when the clock, the random codes, the storage and the log stream are parameters, every behaviour — including "the database is down" — can be tested in milliseconds.`,
  ],
  eli15: [
    py`Think of a restaurant kitchen. The **settings** are the instructions taped to the wall before service starts: "tonight we serve 40 people, the oven runs at 200°". If the note says "oven at banana", the head chef refuses to open — better than discovering it mid-dinner.`,
    py`The **chefs** (service) follow recipes and don't care whether the fridge is the big walk-in or a small one (the **repository**) — any fridge with a door and shelves will do. Every order ticket gets a **number** (request id) and the kitchen keeps a **logbook** of every ticket in a neat, fixed format, so the manager can later search "what happened to ticket 1042?".`,
    py`A health inspector (the **health check**) pops in regularly: "is the fridge working?". And before opening night, the team does practice runs with **pretend ingredients** (fakes) — including a practice run where the fridge "breaks" — so they know what to do when it really happens.`,
  ],
  analogy: {
    title: 'A restaurant kitchen ready for service',
    body: [
      py`A good kitchen works no matter which chef is on shift, because the instructions, the stations and the logbook are standardised. Your service should work no matter who deploys it.`,
    ],
    mapping: [
      ['instructions on the wall, checked before opening', 'Settings.from_env() → ConfigError at start-up'],
      ['the secret recipe kept out of sight', 'admin_token with repr=False, never logged'],
      ['the rules of the cuisine', 'domain.py: ShortLink, validate_url, validate_code'],
      ['chefs following recipes', 'LinkService: the use cases'],
      ['"any fridge will do"', 'the LinkRepository Protocol, with memory and SQLite adapters'],
      ['the manager who assigns staff and equipment', 'build_app(): the composition root'],
      ['ticket numbers and the logbook', 'request ids and JSON log lines'],
      ['the health inspector', 'GET /healthz → 200 or 503'],
      ['practice runs with pretend ingredients', 'tests with FixedClock, sequential codes, BrokenRepository'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Layers, wiring and what crosses each boundary',
    props: {
      width: 780,
      height: 360,
      nodes: [
        { id: 'env', label: 'environment', note: 'SHRTN_* variables', x: 90, y: 60, tone: 'yellow' },
        { id: 'container', label: 'container.py', note: 'composition root', x: 300, y: 60, tone: 'ink' },
        { id: 'logs', label: 'stdout', note: 'JSON log lines', x: 560, y: 60, tone: 'kraft' },
        { id: 'api', label: 'api.py', note: 'routes, errors → status', x: 120, y: 200, tone: 'blue' },
        { id: 'service', label: 'service.py', note: 'use cases', x: 330, y: 200, tone: 'blue' },
        { id: 'domain', label: 'domain.py', note: 'rules, no I/O', x: 330, y: 310, tone: 'red' },
        { id: 'protocol', label: 'LinkRepository', note: 'Protocol', x: 540, y: 200, tone: 'paper' },
        { id: 'adapters', label: 'memory | SQLite', note: 'adapters', x: 700, y: 300, tone: 'kraft' },
      ],
      edges: [
        { from: 'env', to: 'container', label: 'Settings' },
        { from: 'container', to: 'api', label: 'builds', dashed: true },
        { from: 'container', to: 'logs', label: 'configures', dashed: true },
        { from: 'api', to: 'service', label: 'calls' },
        { from: 'service', to: 'domain', label: 'validates' },
        { from: 'service', to: 'protocol', label: 'depends on' },
        { from: 'adapters', to: 'protocol', label: 'implements' },
      ],
      steps: [
        { focus: ['env', 'container'], edges: ['env->container'], text: py`At start-up, \`Settings.from_env()\` reads and **validates** every \`SHRTN_*\` variable. One bad value stops the process with a list of *all* problems — before it serves a single request.` },
        { focus: ['container', 'api', 'logs'], edges: ['container->api', 'container->logs'], text: py`\`build_app()\` — the **composition root** — configures JSON logging and picks concrete classes: which repository, which code generator, which clock. It's the only module that knows them all.` },
        { focus: ['api', 'service'], edges: ['api->service'], text: py`A request enters \`App.handle()\`: it gets a **request id**, is routed with \`match\`, and calls the service. Domain errors become 400/404/409; anything unexpected becomes a logged, generic 500.` },
        { focus: ['service', 'domain'], edges: ['service->domain'], text: py`The service runs the use case and relies on \`domain.py\` for the rules: which URLs and codes are acceptable. The domain has no I/O at all, so it's trivial to test.` },
        { focus: ['service', 'protocol', 'adapters'], edges: ['service->protocol', 'adapters->protocol'], text: py`The service depends on the \`LinkRepository\` **Protocol**, not on SQLite. The arrow from the adapters points *towards* the abstraction: that's **dependency inversion**. Tests plug in fakes the same way.` },
      ],
    },
    alt: 'Architecture diagram. Environment variables feed Settings into container.py, the composition root, which builds api.py and configures JSON logging to stdout. api.py calls service.py, which validates with domain.py and depends on the LinkRepository protocol. The in-memory and SQLite adapters implement that protocol.',
    caption: py`Dependencies point inward: the edge (HTTP, storage adapters) depends on the core, never the other way round.`,
  },

  requirements: [
    'settings.py: Settings.from_env(env=None) reads SHRTN_* variables from any Mapping (os.environ by default), strips values, lower-cases ENV/STORAGE, upper-cases LOG_LEVEL, drops a trailing "/" from BASE_URL, parses CODE_LENGTH (4–16) and MAX_URL_LENGTH (100–8192), and raises ONE ConfigError whose .problems lists every invalid variable by name — plus production_problems() when ENV is production. admin_token never appears in repr().',
    'logging_setup.py: JsonFormatter renders each record as one JSON line with ts (UTC ISO-8601), level, logger, message, every extra={...} field, and exception (the formatted traceback) when present.',
    'domain.py: validate_url(url, max_length) strips and returns the URL, rejecting non-strings/empty values, anything longer than max_length, whitespace or control characters, schemes other than http/https and URLs without a host — always with ValidationError.',
    'repository.py: SqliteLinkRepository satisfies the same contract as InMemoryLinkRepository: add (duplicate code → ConflictError), get, record_hit (atomic UPDATE), delete (True only if a row was removed) and ping.',
    'service.py: LinkService.shorten() tries up to MAX_CODE_ATTEMPTS generated codes, logging a "code collision" warning and moving on when a code is taken, and raises RuntimeError if all collide; custom codes are validated and may conflict (ConflictError).',
    'api.py: GET /healthz answers 200 {"status": "ok", "checks": {"database": "ok"}} or 503 {"status": "degraded", "checks": {"database": "failing"}} when ping() returns False or raises. DELETE /links/<code> requires Authorization: Bearer <admin token> (compared with hmac.compare_digest; nobody may delete when no token is configured) and otherwise answers 401 with WWW-Authenticate: Bearer.',
    'Unchanged behaviour to keep green: POST /links → 201 + Location, GET /<code> → 302, GET /links/<code>/stats → 200, 400/404/409/405 mapping, a generic 500 body with the request id, one JSON "request" log line per request, and the WSGI adapter.',
  ],
  objectives: [
    'Load configuration from the environment into a frozen, validated Settings object, failing fast with every problem listed.',
    'Keep secrets out of reprs, logs and responses, and compare them in constant time.',
    'Emit structured JSON logs with request ids and per-request timing.',
    'Design a domain core with no I/O, a service with injected collaborators, and storage behind a Protocol with two adapters.',
    'Map domain errors to HTTP-style responses in one place, and turn unexpected errors into safe 500s that are still debuggable.',
    'Write a health check that reflects real dependencies.',
    'Test everything with fakes — fixed clocks, predictable codes, broken repositories, captured logs — and run one contract test against every adapter.',
    'Package the project with pyproject.toml, lint and type-check it, and deploy it behind a WSGI server in a container.',
  ],

  playground: {
    title: 'URL-shortener service — starter',
    objective: 'Finish Settings validation, the JSON log formatter, URL validation, the SQLite adapter, collision retries, the health check and the admin-only delete.',
    files: {
      'main.py': MAIN_PY,
      'settings.py': SETTINGS_STARTER,
      'logging_setup.py': LOGGING_STARTER,
      'domain.py': DOMAIN_STARTER,
      'repository.py': REPO_STARTER,
      'service.py': SERVICE_STARTER,
      'api.py': API_STARTER,
      'container.py': CONTAINER_PY,
      'fakes.py': FAKES_PY,
    },
    expected: py`The starter runs, and its output shows three production bugs on purpose:

- \`WARNING: an unsafe production config was accepted!\`
- \`POST /links: 201\` for \`javascript:alert(document.cookie)\` — a stored attack link
- \`DELETE /links/asyncio-docs: 204\` with **no token** — anyone can delete links

and its logs are plain text. When you're done, the config is refused with three listed problems, every log line is JSON like

\`\`\`text
{"ts": "...+00:00", "level": "INFO", "logger": "shrtn.http", "message": "request", "request_id": "...", "method": "GET", "path": "/healthz", "status": 200, "duration_ms": 0.1}
\`\`\`

the \`javascript:\` link gets a 400 and the anonymous delete a 401. (Timestamps, request ids and the generated code change on every run.)`,
    tests: TESTS,
  },

  steps: [
    {
      title: '1. What "production-style" means',
      body: [
        py`"Production-ready" isn't one feature; it's a checklist of things that let *other people* run, operate and change your code safely. This project ticks the ones that matter most for a small web service:`,
        py`| concern | in this project | why it matters |
|---|---|---|
| configuration | \`Settings.from_env()\` | same code in dev, test and prod; no secrets in code |
| fail fast | \`ConfigError\` at start-up | a bad deploy dies immediately, not at the first request |
| observability | JSON logs, request ids, timing | you debug production from logs |
| layering & DI | domain / service / repository / api, \`build_app()\` | change one part without breaking others; test with fakes |
| validation & security | \`validate_url\`, \`hmac.compare_digest\`, generic 500s | the internet is hostile |
| health | \`GET /healthz\` | load balancers and orchestrators route around sick instances |
| tests | contract tests + fakes | every behaviour, including outages, checked in milliseconds |
| packaging & tooling | \`pyproject.toml\`, ruff, mypy | installable, consistent, type-checked |
| deployment | container + WSGI server | reproducible, isolated, restartable |`,
        py`Many of these ideas are summarised by the *Twelve-Factor App* methodology (config in the environment, logs as event streams, disposable processes). Run the starter now: its output demonstrates three bugs you're about to fix.`,
      ],
    },
    {
      title: '2. Settings: configuration from the environment',
      body: [
        py`Configuration that changes between deployments — URLs, storage, log level, secrets — comes from **environment variables**, not from the code. The same build then runs everywhere, and secrets never land in git.`,
        py`Two design choices make \`from_env\` production-grade *and* testable:`,
        py`- It accepts **any \`Mapping\`**, defaulting to \`os.environ\`. Tests pass a plain dict — no monkeypatching global state.
- It **collects every problem** before raising, so an operator fixes all of them in one deploy instead of one per crash loop.`,
        { code: py`import os
from collections.abc import Mapping
from dataclasses import dataclass, field


class ConfigError(Exception):
    def __init__(self, problems):
        super().__init__("; ".join(problems))
        self.problems = problems


@dataclass(frozen=True)
class Settings:
    environment: str = "development"
    code_length: int = 7
    admin_token: str = field(default="", repr=False)

    @classmethod
    def from_env(cls, env: Mapping[str, str] | None = None) -> "Settings":
        env = os.environ if env is None else env
        problems = []
        environment = env.get("SHRTN_ENV", "development").strip().lower()
        if environment not in ("development", "test", "production"):
            problems.append(f"SHRTN_ENV must be development, test or production (got {environment!r})")
        raw = env.get("SHRTN_CODE_LENGTH", "7").strip()
        code_length = int(raw) if raw.isdigit() else 0
        if not 4 <= code_length <= 16:
            problems.append(f"SHRTN_CODE_LENGTH must be a whole number from 4 to 16 (got {raw!r})")
        if problems:
            raise ConfigError(problems)
        return cls(environment, code_length, env.get("SHRTN_ADMIN_TOKEN", ""))


print(Settings.from_env({"SHRTN_ADMIN_TOKEN": "s3cret"}))     # the token is not shown
try:
    Settings.from_env({"SHRTN_ENV": "staging", "SHRTN_CODE_LENGTH": "three"})
except ConfigError as exc:
    print(exc.problems)`, lang: 'python', title: 'the pattern (simplified)' },
        py`\`frozen=True\` means nothing can change settings after start-up, and \`field(repr=False)\` keeps the admin token out of \`print(settings)\` and out of any log line that includes the settings object.`,
        py`**Production rules** go one step further: in \`ENV=production\`, \`production_problems()\` refuses configurations that would work but be unsafe — no admin token, plain \`http://\`, or in-memory storage that loses every link on restart. Safe defaults for development, strict checks for production.`,
        { callout: 'tip', title: 'Secrets', text: py`Environment variables are the common baseline for secrets, but they can leak through crash dumps, \`/proc\` or child processes. Mature setups mount secrets as files or fetch them from a secret manager (Vault, a cloud KMS) at start-up — behind the same \`Settings\` object. See [secrets & passwords](lesson:secrets-and-passwords).` },
      ],
    },
    {
      title: '3. The domain: rules with no I/O',
      body: [
        py`\`domain.py\` holds the heart of the system: what a \`ShortLink\` is, the domain errors, and the rules for valid input. It imports nothing that touches the network, the disk or the clock — so it's the easiest code in the project to test and the least likely to change.`,
        py`URL validation here is a **security** feature. A shortener stores URLs from strangers and sends other people's browsers to them:`,
        { code: py`from urllib.parse import urlsplit

for url in ["https://docs.python.org/3/", "javascript:alert(document.cookie)",
            "data:text/html,<script>...</script>", "https://", "docs.python.org"]:
    parts = urlsplit(url)
    ok = parts.scheme in {"http", "https"} and bool(parts.hostname)
    print(f"{ok!s:<5} scheme={parts.scheme!r:<14} host={parts.hostname!r}")`, lang: 'python', title: 'why the scheme and host checks matter' },
        py`- \`javascript:\` and \`data:\` URLs execute code in the victim's browser when followed — an **allow-list** of \`http\`/\`https\` blocks them (deny-lists always miss a scheme).
- Whitespace and control characters are rejected because they enable header and log injection and hide the real destination.
- A length limit stops someone storing megabytes per link.`,
        py`Custom codes get an allow-list regex (\`[A-Za-z0-9_-]{3,32}\`) and a **reserved** list (\`healthz\`, \`links\`, …) so nobody can register a code that shadows a real route. See [input validation](lesson:input-validation) and [injection attacks](lesson:injection-attacks).`,
        { callout: 'note', title: 'Open redirects', text: py`A shortener *is* an open redirect by design. Production shorteners add abuse controls: rate limits per client, checking targets against malware/phishing lists, and a preview page. Never put an open redirect on a domain that also hosts logins.` },
      ],
    },
    {
      title: '4. Storage behind a Protocol, with two adapters',
      body: [
        py`The service needs *something* that can add, get, count hits, delete and ping. A [Protocol](lesson:protocols) says exactly that — structurally, so any class with these methods qualifies without inheriting anything:`,
        { code: py`from typing import Protocol, runtime_checkable


@runtime_checkable
class LinkRepository(Protocol):
    def add(self, link: "ShortLink") -> None: ...
    def get(self, code: str) -> "ShortLink | None": ...
    def record_hit(self, code: str) -> None: ...
    def delete(self, code: str) -> bool: ...
    def ping(self) -> bool: ...


class InMemoryLinkRepository:          # no base class needed
    def __init__(self):
        self._links = {}
    def add(self, link): self._links[link.code] = link
    def get(self, code): return self._links.get(code)
    def record_hit(self, code): pass
    def delete(self, code): return self._links.pop(code, None) is not None
    def ping(self): return True


print(isinstance(InMemoryLinkRepository(), LinkRepository))   # True: it has the methods`, lang: 'python', title: 'a structural interface (simplified adapter)' },
        py`\`@runtime_checkable\` lets \`isinstance\` check that the methods *exist* (not their signatures); the real guarantee comes from a type checker like mypy, which verifies every argument and return type.`,
        py`The SQLite adapter must honour the same contract — including translating \`sqlite3.IntegrityError\` into the domain's \`ConflictError\`, and counting hits with one atomic \`UPDATE links SET hits = hits + 1\` instead of read-modify-write (which loses updates under concurrency).`,
        py`How do you know two adapters really behave the same? Run **one contract test against both** — the platform's repository test does exactly that with a \`check(repo)\` function. Add a PostgreSQL adapter later and the same test tells you whether it's a drop-in replacement. More in [database patterns](lesson:database-patterns).`,
      ],
    },
    {
      title: '5. The service: use cases with injected collaborators',
      body: [
        py`\`LinkService\` doesn't create anything it depends on. The repository, the **code generator**, the **clock** and the **logger** all arrive through \`__init__\`. That's **dependency injection** — and it's the reason the tests can run "what if this code is already taken?" deterministically.`,
        { code: py`import secrets
import string
from itertools import count

ALPHABET = string.ascii_letters + string.digits


def random_codes(length):
    while True:                                   # production: unguessable
        yield "".join(secrets.choice(ALPHABET) for _ in range(length))


def sequential_codes():
    for n in count(1):                            # tests: predictable
        yield f"c{n:04d}"


production, testing = random_codes(7), sequential_codes()
print(len(next(production)), next(testing), next(testing))`, lang: 'python', title: 'two code generators, one interface: an iterator of strings' },
        py`Why \`secrets\` and not \`random\`? \`random\` is a Mersenne Twister: fast and fine for simulations, but its output can be predicted after observing enough values. Short codes that are guessable let anyone enumerate everyone's private links. Anything security-sensitive uses \`secrets\`.`,
        py`Random codes *can* collide with existing ones, so the service retries a few times:`,
        { code: py`    def _add_with_generated_code(self, target: str) -> ShortLink:
        for _ in range(self.MAX_CODE_ATTEMPTS):
            link = ShortLink(next(self.codes), target, self.clock())
            try:
                self.repo.add(link)
            except ConflictError:
                self.log.warning("code collision", extra={"code": link.code})
                continue
            return link
        raise RuntimeError(f"no free code after {self.MAX_CODE_ATTEMPTS} attempts")`, lang: 'python', static: true, title: 'service.py — collision retry' },
        py`The *database* decides whether a code is free (the insert fails on a duplicate primary key) — not a "check, then insert" that two requests could race. Running out of attempts is not the user's fault, so it's a \`RuntimeError\` → 500, and a warning in the logs that tells you it's time for longer codes.`,
      ],
    },
    {
      title: '6. The HTTP edge: routing, errors and auth',
      body: [
        py`\`App.handle(method, path, body, headers)\` is a framework-free edge: plain values in, a \`Response\` dataclass out. Routing uses [structural pattern matching](lesson:match-statement) (3.10+) on the method and the path segments:`,
        { code: py`        parts = [part for part in path.split("/") if part]
        match (method, parts):
            case ("GET", ["healthz"]):
                return self.health()
            case ("POST", ["links"]):
                return self.create(body)
            case ("GET", ["links", code, "stats"]):
                return self.stats(code)
            case ("DELETE", ["links", code]):
                return self.delete(code, headers)
            case (_, ["links"]):
                return not_allowed("POST")          # 405 + Allow
            case ("GET", [code]):
                return self.redirect(code)
            ...`, lang: 'python', static: true, title: 'api.py — route()' },
        py`Error handling lives in **one** \`try\` in \`handle()\`: \`ValidationError\` → 400, \`NotFoundError\` → 404, \`ConflictError\` → 409, and everything else → **500 with a generic body** plus the request id, while the full traceback goes to the logs. The client gets something to quote to support ("request id 3f9c…"); an attacker gets nothing about your internals.`,
        py`The admin-only \`DELETE\` checks a bearer token:`,
        { code: py`import hmac


def is_admin(headers: dict[str, str], expected: str) -> bool:
    scheme, _, supplied = headers.get("authorization", "").partition(" ")
    if not expected or scheme != "Bearer" or not supplied:
        return False                       # no token configured = nobody is admin
    return hmac.compare_digest(supplied.encode(), expected.encode())


print(is_admin({"authorization": "Bearer s3cret"}, "s3cret"))
print(is_admin({"authorization": "Bearer guess"}, "s3cret"))
print(is_admin({"authorization": "Bearer "}, ""))`, lang: 'python', title: 'constant-time comparison, safe default' },
        py`\`==\` on strings stops at the first differing character, so response *timing* can reveal how much of a guess was right. \`hmac.compare_digest\` takes the same time regardless. And note the **safe default**: if no token is configured, deleting is impossible rather than unprotected. Answer **401** with \`WWW-Authenticate: Bearer\` for missing or wrong credentials (403 is for "you are authenticated but not allowed"). See [secure practices](lesson:secure-practices).`,
      ],
    },
    {
      title: '7. Structured logging with request ids',
      body: [
        py`Plain-text logs are for humans reading one line at a time. Production logs are read by *machines* — search, dashboards, alerts — so each line is a JSON object with consistent fields. The standard library does this with a custom \`Formatter\` ([logging](lesson:logging)):`,
        { code: py`import io
import json
import logging
from datetime import datetime, timezone

STANDARD = set(vars(logging.LogRecord("x", logging.INFO, "", 0, "", None, None))) | {"message"}


class JsonFormatter(logging.Formatter):
    def format(self, record):
        entry = {
            "ts": datetime.fromtimestamp(record.created, timezone.utc).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        entry.update({k: v for k, v in vars(record).items() if k not in STANDARD})
        if record.exc_info:
            entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(entry, default=str)


stream = io.StringIO()
handler = logging.StreamHandler(stream)
handler.setFormatter(JsonFormatter())
log = logging.getLogger("demo.http")
log.addHandler(handler)
log.setLevel(logging.INFO)
log.info("request", extra={"request_id": "a1b2", "method": "GET", "status": 200})
print(json.loads(stream.getvalue())["request_id"])`, lang: 'python', title: 'a JSON formatter in 25 lines' },
        py`\`extra={...}\` adds attributes to the \`LogRecord\`; the formatter outputs every attribute that isn't one of the standard ones. \`default=str\` means an odd value (a \`datetime\`, a \`Decimal\`) can never crash logging itself.`,
        py`Every request gets a **request id** — taken from an incoming \`X-Request-ID\` header (so one id can follow a request through several services) *only if* it matches a safe pattern, otherwise freshly generated — and it's echoed in the response and attached to every log line about that request. Validating the incoming id matters: a value containing a newline could otherwise forge fake log entries.`,
        py`Logs go to **stdout**, one event per line; the platform (Docker, Kubernetes, systemd) collects them. Never log secrets, passwords, full tokens or personal data you don't need. \`configure_logging\` clears existing handlers so calling it twice never duplicates lines.`,
        { callout: 'tip', title: 'Going further', text: py`To attach the request id to logs written deep inside the service (not just the access log line), store it in a \`contextvars.ContextVar\` at the start of \`handle()\` and add it in a \`logging.Filter\`. Context variables are per-task in asyncio, so this also works in async servers.` },
      ],
    },
    {
      title: '8. Composition root, health check and tests with fakes',
      body: [
        py`\`container.build_app(settings, ...)\` is the **composition root**: the only function that knows every concrete class. Each collaborator has a production default and can be overridden — which is exactly what the tests do:`,
        { code: py`app = build_app(
    Settings.from_env({"SHRTN_BASE_URL": "https://sho.rt"}),
    codes=sequential_codes(),          # c0001, c0002, ...
    clock=FixedClock(),                # always 2026-03-12 09:30 UTC
    request_ids=sequential_ids(),      # req-1, req-2, ...
    log_stream=io.StringIO(),          # capture the JSON logs
)
response = app.handle("POST", "/links", b'{"url": "https://docs.python.org/3/"}')
assert response.status == 201
assert response.body["short_url"] == "https://sho.rt/c0001"`, lang: 'python', static: true, title: 'a test with fakes' },
        py`**Fakes** are small working implementations (\`FixedClock\`, \`sequential_codes\`, \`BrokenRepository\`), different from [mocks](lesson:mocking), which record calls. Fakes keep tests about *behaviour*: "when the database is down, the health check says 503" — not "ping was called once".`,
        py`The **health check** must reflect real dependencies: \`GET /healthz\` pings the repository and answers **503** with \`"status": "degraded"\` when it fails or raises. Load balancers and orchestrators use exactly that status code to stop sending traffic to a sick instance or restart it. A health check that always says 200 is worse than none — it hides outages.`,
        py`With pytest (installed locally), fixtures make the wiring reusable — see [fixtures](lesson:fixtures):`,
        { code: py`import io
import json

import pytest

from container import build_app
from fakes import BrokenRepository, FixedClock, sequential_codes, sequential_ids
from settings import Settings


@pytest.fixture
def logs():
    return io.StringIO()


@pytest.fixture
def app(logs):
    return build_app(Settings.from_env({}), codes=sequential_codes(), clock=FixedClock(),
                     request_ids=sequential_ids(), log_stream=logs)


def test_health_is_503_when_database_is_down():
    app = build_app(Settings.from_env({}), repo=BrokenRepository(), log_stream=io.StringIO())
    assert app.handle("GET", "/healthz").status == 503


@pytest.mark.parametrize("url", ["javascript:alert(1)", "ftp://x.example", "https://"])
def test_rejects_dangerous_urls(app, url):
    response = app.handle("POST", "/links", json.dumps({"url": url}).encode())
    assert response.status == 400`, lang: 'python', static: true, title: 'tests/test_api.py (pytest, run locally)' },
      ],
    },
    {
      title: '9. Packaging, linting and type checking',
      body: [
        py`To install, test and deploy the service like any other package, it gets a standard layout and a \`pyproject.toml\` ([packaging](lesson:packaging)). In a real repository the modules move into \`src/shrtn/\` and imports become \`from shrtn.domain import ...\`:`,
        { code: py`shrtn/
├── pyproject.toml
├── README.md
├── src/
│   └── shrtn/
│       ├── __init__.py
│       ├── settings.py   logging_setup.py   domain.py
│       ├── repository.py service.py         api.py
│       ├── container.py  wsgi.py            main.py
└── tests/
    ├── fakes.py
    └── test_settings.py  test_repository.py  test_api.py`, lang: 'text', title: 'project layout (src layout)' },
        { code: py`[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "shrtn"
version = "0.1.0"
description = "A small, production-style URL shortener"
readme = "README.md"
requires-python = ">=3.11"
dependencies = []                      # standard library only

[project.optional-dependencies]
server = ["gunicorn>=22"]
dev = ["pytest>=8", "ruff>=0.6", "mypy>=1.11"]

[project.scripts]
shrtn = "shrtn.main:main"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "S"]   # pycodestyle, pyflakes, isort, bugbear, pyupgrade, bandit

[tool.mypy]
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]`, lang: 'toml', title: 'pyproject.toml' },
        py`Then the quality gate every change must pass — locally, in a pre-commit hook and in CI ([code quality tools](lesson:code-quality-tools), [static type checking](lesson:static-type-checking)):`,
        { code: py`python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
ruff format --check .        # formatting
ruff check .                 # lint: bugs, unused imports, insecure calls
mypy src                     # types: e.g. passing a repository missing ping()
pytest -q                    # behaviour`, lang: 'bash', title: 'the quality gate' },
        py`The type hints you've been writing pay off here: if someone adds a \`RedisLinkRepository\` that forgets \`ping\`, or returns \`None\` where \`bool\` is promised, mypy fails the build before any test runs — the Protocol is checked structurally. Ruff's \`S\` rules flag things like \`random\` used for tokens, \`assert\` in production code paths, and SQL built from strings.`,
        { callout: 'note', title: 'Typing details', text: py`Annotations like \`ShortLink | None\` (3.10+) are evaluated lazily from Python 3.14 (PEP 649/749), but this code also runs on 3.11–3.13, where they're evaluated at definition time — so forward references to classes defined later are written as strings, e.g. \`"Settings"\`.` },
      ],
    },
    {
      title: '10. Deployment: container, WSGI server, configuration and probes',
      body: [
        py`The service is a WSGI application (\`api.wsgi_adapter\`), so any WSGI server can run it. A tiny module creates it from the real environment:`,
        { code: py`# src/shrtn/wsgi.py
from shrtn.api import wsgi_adapter
from shrtn.container import build_app
from shrtn.settings import Settings

application = wsgi_adapter(build_app(Settings.from_env()))   # fails fast on bad config`, lang: 'python', static: true, title: 'wsgi.py' },
        { code: py`FROM python:3.14-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --no-cache-dir ".[server]" \
 && useradd --create-home --uid 10001 app
USER app
ENV SHRTN_ENV=production SHRTN_STORAGE=sqlite SHRTN_DATABASE_PATH=/data/shrtn.db
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--access-logfile", "-", "shrtn.wsgi:application"]`, lang: 'text', title: 'Dockerfile' },
        py`Reading it as a checklist:`,
        py`- **Slim base image, non-root user** — less to attack, less damage if compromised.
- **\`PYTHONUNBUFFERED=1\`** — logs reach stdout immediately instead of sitting in a buffer when the container dies.
- **No secrets in the image.** \`SHRTN_ADMIN_TOKEN\` and \`SHRTN_BASE_URL\` are injected at run time by the platform's secret store; \`Settings\` refuses to start without them in production.
- **Each worker is a separate process** with its own memory — which is why in-memory storage is refused in production: with 2 workers, a link created on one would 404 on the other. Each worker opens its own SQLite connection when it imports the app (avoid gunicorn's \`--preload\` with SQLite, which would share one connection across forked processes). For more than one machine, use a server database such as PostgreSQL behind the same repository Protocol.`,
        { code: py`# Kubernetes-style probes (excerpt)
readinessProbe:
  httpGet: { path: /healthz, port: 8000 }
  periodSeconds: 10
livenessProbe:
  httpGet: { path: /healthz, port: 8000 }
  periodSeconds: 30
  failureThreshold: 3`, lang: 'text', title: 'health probes' },
        py`The **readiness** probe takes an instance out of the load balancer while \`/healthz\` returns 503; the **liveness** probe restarts it if it stays unhealthy. Finally, a CI pipeline runs the quality gate from step 9 on every push and only builds and deploys the image when everything is green — so "it works on my machine" becomes "it passed the same checks as everyone else's code".`,
      ],
    },
  ],

  challenges: [
    'Request-scoped logging: store the request id in a contextvars.ContextVar and add it to EVERY log line (including "link created") with a logging.Filter.',
    'Rate limiting (production concern): limit POST /links to N per minute per client (use an injected clock in tests) and answer 429 with a Retry-After header.',
    'Expiry: add an optional expires_in_days to POST /links; expired links answer 410 Gone. Test it by moving a fake clock forward.',
    'Readiness vs liveness: split /healthz into /livez (the process is alive) and /readyz (dependencies OK), and explain which one should restart the container.',
    'Graceful shutdown (production concern): when the server sends SIGTERM, stop accepting new requests, finish in-flight ones and close the database. What does gunicorn do for you here?',
    'PostgreSQL adapter: write PostgresLinkRepository (psycopg, run locally) and make the existing contract test parametrised over all three adapters.',
    'Metrics: count requests per route and status, and expose them at /metrics in the Prometheus text format; compute a latency histogram from duration_ms.',
    'Hardening: reject URLs whose host is an IP literal in private ranges (ipaddress.ip_address(...).is_private), and explain why that matters if the service ever fetches link previews (SSRF).',
  ],

  solution: {
    files: {
      'main.py': MAIN_PY,
      'settings.py': SETTINGS_SOLUTION,
      'logging_setup.py': LOGGING_SOLUTION,
      'domain.py': DOMAIN_SOLUTION,
      'repository.py': REPO_SOLUTION,
      'service.py': SERVICE_SOLUTION,
      'api.py': API_SOLUTION,
      'container.py': CONTAINER_PY,
      'fakes.py': FAKES_PY,
    },
    explanation: [
      py`**settings.py**: small helper closures — \`text\`, \`one_of\`, \`number\` — read and normalise each variable and *append* to a shared \`problems\` list instead of raising, so one \`ConfigError\` lists everything. Production rules are added only when \`ENV=production\`. The token stays out of \`repr()\` via \`field(repr=False)\`.`,
      py`**logging_setup.py**: \`JsonFormatter.format\` builds a dict with a UTC ISO timestamp, level, logger and message, copies every non-standard record attribute (the \`extra\` fields), adds the formatted traceback when there is one, and serialises with \`default=str\`.`,
      py`**domain.py**: \`validate_url\` strips, checks length, rejects whitespace/control characters, parses with \`urlsplit\` (malformed → \`ValidationError\`), allow-lists \`http\`/\`https\` and requires a host name.`,
      py`**repository.py**: the SQLite adapter inserts inside \`with self.conn:\` and translates \`IntegrityError\` to \`ConflictError\`, increments hits with one atomic \`UPDATE\`, and reports deletion via \`cursor.rowcount\`.`,
      py`**service.py**: generated codes are tried up to \`MAX_CODE_ATTEMPTS\` times, letting the repository decide what's free and logging each collision; exhausting them raises \`RuntimeError\` (a server problem → 500).`,
      py`**api.py**: \`health()\` treats a ping that returns \`False\` *or raises* as failing and answers 503; \`delete()\` requires a bearer token compared with \`hmac.compare_digest\`, refuses everyone when no token is configured, and answers 401 with \`WWW-Authenticate: Bearer\` otherwise.`,
    ],
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`**Dependency injection** sounds fancy but is just "pass things in instead of creating them inside". Compare:`,
      { code: py`from datetime import datetime, timezone


class HardWired:
    def stamp(self):
        return datetime.now(timezone.utc)        # impossible to test exactly


class Injected:
    def __init__(self, clock):
        self.clock = clock                       # any callable returning a datetime

    def stamp(self):
        return self.clock()


fixed = datetime(2026, 3, 12, 9, 30, tzinfo=timezone.utc)
print(Injected(lambda: fixed).stamp() == fixed)  # True, every time`, lang: 'python' },
    ],
    technical: [
      py`**Logging internals.** \`logger.info(msg, extra=d)\` creates a \`LogRecord\` and sets each key of \`d\` as an attribute (keys that clash with built-in attributes like \`message\` raise \`KeyError\`). The record travels to the logger's handlers, then up the hierarchy (\`shrtn.http\` → \`shrtn\`) unless \`propagate\` is \`False\`. Each handler's formatter turns it into text. \`logger.exception()\` is \`error()\` with \`exc_info=True\`, which is why the formatter sees the traceback.`,
      py`**Protocols vs ABCs.** An ABC requires explicit inheritance and checks at instantiation that abstract methods are implemented. A Protocol is structural: type checkers accept any class with matching methods, and \`@runtime_checkable\` adds a shallow \`isinstance\` check (method names only). Protocols suit adapters you don't control or want decoupled from your package; ABCs suit families you own. See [abstract base classes](lesson:abstract-base-classes).`,
      py`**Frozen settings** are safe to share between threads and requests because they can't change. Configuration that *must* change at run time (feature flags) needs a different, explicitly synchronised mechanism — don't mutate a global settings object.`,
      { callout: 'note', title: 'CPython detail', text: py`\`secrets\` draws from the operating system's CSPRNG (\`os.urandom\`), while \`random\` uses a Mersenne Twister seeded once; its internal state can be reconstructed from enough outputs. That is a property of the algorithms, not of CPython specifically, but it's why the two modules exist separately.` },
    ],
    production: [
      py`**The three pillars of observability**: logs (what happened, per event), metrics (how much/how fast, aggregated) and traces (where time went across services). Request ids are the seed of tracing; standards like OpenTelemetry propagate trace ids across services automatically and can export your structured logs, metrics and traces together.`,
      py`**Error budgets and health.** A health endpoint should check what makes the instance useless (no database) but not every optional dependency — or one flaky external service takes your whole fleet out of rotation. Many teams separate liveness (restart me) from readiness (don't send me traffic).`,
      py`**Configuration drift.** Validate configuration in CI too (run \`Settings.from_env\` against each environment's variables before deploying), keep defaults safe, and log the *non-secret* effective settings once at start-up so incidents can be correlated with config changes.`,
    ],
  },
  mistakes: [
    {
      title: 'Reading os.environ all over the code',
      wrong: { code: py`import os


def shorten(url):
    length = int(os.environ.get("CODE_LENGTH", "7"))   # parsed (and maybe crashing) per request
    ...`, lang: 'python', static: true },
      right: { code: py`settings = Settings.from_env()        # once, at start-up, validated
app = build_app(settings)              # passed down explicitly`, lang: 'python', static: true },
      explanation: py`Scattered environment reads fail late (at the first request that needs them), can't be listed or validated together, and force tests to patch global state. Read and validate once; pass the result down.`,
    },
    {
      title: 'Leaking secrets through repr and logs',
      wrong: { code: py`@dataclass(frozen=True)
class Settings:
    admin_token: str = ""

log.info("starting with %s", settings)   # the token is now in every log archive`, lang: 'python', static: true },
      right: { code: py`@dataclass(frozen=True)
class Settings:
    admin_token: str = field(default="", repr=False)

log.info("starting with %s", settings)   # Settings(...) without the token`, lang: 'python', static: true },
      explanation: py`Logs are copied to many systems and kept for a long time. Keep secrets out of reprs, never log request headers wholesale, and treat a leaked token as compromised.`,
    },
    {
      title: 'Using random for codes or tokens',
      wrong: { code: py`import random
import string

code = "".join(random.choices(string.ascii_letters, k=7))   # predictable`, lang: 'python' },
      right: { code: py`import secrets
import string

code = "".join(secrets.choice(string.ascii_letters) for _ in range(7))   # unguessable`, lang: 'python' },
      explanation: py`\`random\` is designed for simulations; its sequence can be reconstructed. Anything that must be unguessable — codes for private links, tokens, password reset links — uses \`secrets\`.`,
    },
    {
      title: 'Returning exception details to clients',
      wrong: { code: py`except Exception as exc:
    return Response(500, {"error": str(exc)})   # "connection to postgres://admin:hunter2@db failed"`, lang: 'python', static: true },
      right: { code: py`except Exception:
    log.exception("unhandled error", extra={"request_id": request_id})
    return Response(500, {"error": "internal server error", "request_id": request_id})`, lang: 'python', static: true },
      explanation: py`Exception messages can contain credentials, file paths, SQL and library versions. Log them (server-side, access-controlled) and give the client only a request id to report.`,
    },
    {
      title: 'A health check that can\'t fail',
      wrong: { code: py`def health(self):
    return Response(200, {"status": "ok"})`, lang: 'python', static: true },
      right: { code: py`def health(self):
    try:
        ok = bool(self.repo.ping())
    except Exception:
        ok = False
    return Response(200 if ok else 503, {"status": "ok" if ok else "degraded"})`, lang: 'python', static: true },
      explanation: py`Orchestrators trust the status code. An always-200 health check keeps a broken instance in rotation, so users see errors while every dashboard says "healthy".`,
    },
  ],
  debugging: [
    {
      symptom: py`ConfigError: invalid configuration: - SHRTN_ADMIN_TOKEN is required in production - SHRTN_BASE_URL must use https:// in production`,
      cause: py`Not a bug: the service refused to start because the deployment is missing configuration.`,
      fix: py`Set the listed variables in the deployment (secrets via the secret store). Fixing all listed problems at once is the point of collecting them.`,
    },
    {
      symptom: py`Every log line appears twice.`,
      cause: py`Logging was configured more than once (two handlers on the same logger), or a handler on "shrtn" *and* on the root logger with propagation on.`,
      fix: py`Configure in one place (the composition root), clear existing handlers before adding, and set \`propagate = False\` on the configured logger (or only configure the root).`,
    },
    {
      symptom: py`KeyError: "Attempt to overwrite 'message' in LogRecord"`,
      cause: py`An \`extra={...}\` key clashes with a built-in LogRecord attribute (\`message\`, \`asctime\`, \`name\`, \`args\`, …).`,
      fix: py`Rename the field (\`"detail"\` instead of \`"message"\`, \`"logger_name"\` instead of \`"name"\`).`,
    },
    {
      symptom: py`In production, links created a moment ago sometimes answer 404.`,
      cause: py`Several worker processes each have their own in-memory repository (or their own copy of a SQLite file on different machines).`,
      fix: py`Use shared storage for multi-process deployments — which is why \`production_problems\` rejects \`STORAGE=memory\`.`,
    },
    {
      symptom: py`TypeError: Object of type datetime is not JSON serializable (from a log call).`,
      cause: py`An \`extra\` field holds a non-JSON value and the formatter calls \`json.dumps\` without a fallback.`,
      fix: py`Use \`json.dumps(entry, default=str)\` in the formatter so logging can never crash the request it describes.`,
    },
  ],
  bestPractices: [
    'Read configuration once from the environment into a frozen, validated object; fail fast listing every problem.',
    'Keep secrets out of code, images, reprs and logs; compare them with hmac.compare_digest.',
    'Log JSON to stdout with a request id, method, path, status and duration on every request.',
    'Keep the domain free of I/O; put storage behind a Protocol and wire concrete classes in one composition root.',
    'Inject clocks, randomness, storage and log streams so every behaviour — including outages — is testable with fakes.',
    'Map expected errors to 4xx in one place; log unexpected ones and return a generic 500 with a request id.',
    'Make /healthz reflect real dependencies; ship with pyproject.toml, ruff, mypy and pytest in CI.',
  ],

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'project-production-service-q1',
      type: 'mcq',
      prompt: 'Why does `Settings.from_env()` take an optional mapping instead of always reading `os.environ` directly?',
      options: [
        { text: 'Because os.environ is slow to read', why: 'Reading it is cheap; this is about design and testing, not speed.' },
        'So tests can pass a plain dict and the function stays pure and predictable',
        { text: 'Because os.environ is not available in production', why: 'It is available everywhere; the default argument still uses it.' },
        { text: 'So settings can be changed while the service runs', why: 'Settings are frozen on purpose — they are read once at start-up.' },
      ],
      answer: 1,
      explanation: py`Accepting any \`Mapping\` (defaulting to \`os.environ\`) is dependency injection for configuration: tests pass \`{"SHRTN_ENV": "production"}\` without patching global state.`,
    },
    {
      id: 'project-production-service-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    env: str = "test"
    token: str = field(default="", repr=False)


print(Settings(token="s3cret"))`,
      answer: "Settings(env='test')",
      accept: ["Settings(env='test')"],
      explanation: py`\`repr=False\` removes the field from the generated \`__repr__\`, so printing or logging the settings can't leak the token. The value is still there: \`Settings(token="s3cret").token\` works.`,
    },
    {
      id: 'project-production-service-q3',
      type: 'bug',
      prompt: 'This admin check has a security weakness. Click the line.',
      code: py`def is_admin(headers, expected):
    supplied = headers.get("authorization", "").removeprefix("Bearer ")
    if not expected:
        return False
    return supplied == expected`,
      answerLine: 5,
      explanation: py`String \`==\` returns as soon as a character differs, so response timing can leak how many leading characters of a guess were right. Use \`hmac.compare_digest(supplied.encode(), expected.encode())\`, which takes the same time regardless.`,
    },
    {
      id: 'project-production-service-q4',
      type: 'fill',
      prompt: 'Complete the structural interface so any class with these methods counts as a repository.',
      code: py`from typing import ___


class LinkRepository(Protocol):
    def get(self, code: str) -> ShortLink ___ None: ...
    def ping(self) -> bool: ...`,
      answer: [['Protocol'], ['|']],
      explanation: py`\`typing.Protocol\` defines a structural type; \`ShortLink | None\` (3.10+) says the method returns a link or \`None\`.`,
    },
    {
      id: 'project-production-service-q5',
      type: 'mcq',
      prompt: 'The database is unreachable. What should `GET /healthz` answer, and why?',
      options: [
        { text: '200 with {"status": "degraded"} — the web process itself is running', why: 'Load balancers and orchestrators look at the status code; a 200 keeps the broken instance in rotation.' },
        '503 Service Unavailable, so load balancers stop routing traffic to this instance',
        { text: '500 Internal Server Error, because something crashed', why: '500 means an unexpected bug while handling the request; 503 says "temporarily unable to serve", which is exactly the situation.' },
        { text: '404 Not Found, because the data cannot be found', why: 'The health resource exists; it reports a dependency problem.' },
      ],
      answer: 1,
      explanation: py`503 means "can't serve right now, try elsewhere/later". Readiness probes use it to remove the instance from rotation until the dependency recovers.`,
    },
    {
      id: 'project-production-service-q6',
      type: 'output',
      prompt: 'What does this print?',
      code: py`import json
import logging

STANDARD = set(vars(logging.LogRecord("x", logging.INFO, "", 0, "", None, None))) | {"message"}
record = logging.LogRecord("shrtn.http", logging.INFO, "", 0, "request", None, None)
record.status = 201
extra = {k: v for k, v in vars(record).items() if k not in STANDARD}
print(json.dumps(extra))`,
      answer: '{"status": 201}',
      accept: ['{"status": 201}'],
      explanation: py`Only attributes that aren't standard \`LogRecord\` attributes survive the filter — here the \`status\` added after creation (what \`extra={"status": 201}\` does for you).`,
    },
    {
      id: 'project-production-service-q7',
      type: 'short',
      prompt: 'What is a composition root, and why does this project have exactly one?',
      answer: py`It's the single place (build_app in container.py) where concrete implementations are chosen and wired together — which repository, code generator, clock, logger. Everything else depends on abstractions passed in. Having one keeps knowledge of concrete classes out of the core, makes swapping implementations a one-line change, and lets tests build the same app with fakes by overriding parameters.`,
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'project-production-service-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 7,
      question: 'Walk me through the architecture of your URL shortener. How would you add a Redis cache for redirects and move from SQLite to PostgreSQL without touching the business logic?',
      answer: 'Domain (entities, rules, no I/O) → service (use cases, depends on a LinkRepository Protocol, injected clock and code generator) → adapters (in-memory, SQLite) and the HTTP edge, all wired in one composition root from validated Settings. A cache is another adapter: a CachingLinkRepository that implements the same Protocol and wraps the real one (decorator pattern). PostgreSQL is a new adapter passing the same contract tests; only build_app and settings change.',
      explanation: py`Because the service depends on an abstraction, anything that satisfies the Protocol can be substituted. A caching decorator delegates to an inner repository and adds read-through caching for \`get\` (with invalidation on \`delete\`). The shared contract test is what proves each new adapter is a true drop-in. Hit counting is the subtle part: with a cache, counts should be incremented atomically in the store (or buffered and flushed), never computed from cached values.`,
      whyAsked: 'Senior back-end interviews probe whether your design actually enables change, not just whether it has layers.',
      mistakes: ['Putting cache logic inside the service', 'Forgetting cache invalidation on delete', 'Not mentioning how to verify the new adapter (contract tests)'],
      followUps: ['How long would you cache redirects, and what about deleted links?', 'How do you migrate existing data from SQLite to PostgreSQL?', 'Where would rate limiting live?'],
      modelAnswer: 'The core is a domain module with the ShortLink entity and validation rules and no I/O at all. The service implements the use cases — shorten, resolve, stats, delete — and depends only on a LinkRepository protocol plus an injected clock, code generator and logger. Adapters implement the protocol — in-memory and SQLite today — and the HTTP edge maps requests and domain errors to responses. One composition root builds everything from validated settings. To add Redis I would write a caching repository that implements the same protocol and wraps the real one, caching get and invalidating on delete, so the service doesn’t change. PostgreSQL is just another adapter; I’d run the same contract test suite against it, migrate the data, and switch it in build_app via configuration.',
    },
    {
      id: 'project-production-service-404-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'After moving the service from one process to gunicorn with four workers, users report that freshly created short links sometimes 404. Nothing is in the error logs. What is happening?',
      answer: 'With in-memory storage each worker process has its own dictionary. A link created by worker 1 doesn’t exist in workers 2–4, so a redirect landing on another worker 404s — a normal, expected 404, so no error is logged. Fix: shared storage (a database), and make the configuration refuse in-memory storage in production.',
      explanation: py`Processes don't share memory. Anything stored in a module-level dict, an in-process cache or a per-process SQLite \`:memory:\` database is invisible to the others. The structured request logs would show the pattern: the POST and the failing GET have different worker pids. This is exactly why \`production_problems\` rejects \`STORAGE=memory\`.`,
      whyAsked: 'Checks understanding of process models and statelessness — a classic first-deployment bug.',
      mistakes: ['Blaming caching or DNS', 'Suggesting sticky sessions as the fix', 'Increasing workers to “fix” it'],
      followUps: ['What does “stateless service” mean?', 'How would you have caught this before deploying?', 'Is SQLite enough for multiple machines?'],
      modelAnswer: 'The workers are separate processes, so with in-memory storage each has its own copy of the links. A link created through one worker simply doesn’t exist in the others, and a redirect that lands on a different worker returns a legitimate 404, which is why nothing shows up as an error. The fix is to make the web processes stateless and keep state in shared storage — SQLite on a single machine, PostgreSQL across machines. I would also encode the lesson in configuration validation, which is what refusing STORAGE=memory in production does, and add a deployment test that creates and resolves links across several requests.',
    },
    {
      id: 'project-production-service-protocol-vs-abc',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'You used a typing.Protocol for the repository. When would you choose an abstract base class instead?',
      answer: 'Protocols are structural: any class with matching methods satisfies them, checked by type checkers, without inheritance — great for adapters and third-party classes. ABCs are nominal: subclasses must inherit and are checked at instantiation, and they can share implementation (template methods, default methods). Choose an ABC when you own the hierarchy and want runtime enforcement or shared code; a Protocol when you want loose coupling.',
      explanation: py`\`@runtime_checkable\` only checks method names at runtime, so Protocol guarantees come mainly from mypy/pyright. ABCs raise \`TypeError\` if you instantiate a subclass that misses an abstract method, and they can provide concrete helper methods. Many codebases use Protocols at module boundaries (ports) and ABCs inside a package's own class families.`,
      whyAsked: 'Distinguishes structural and nominal typing — important for designing pluggable systems in Python.',
      mistakes: ['Saying Protocols are enforced at runtime like ABCs', 'Thinking you must inherit from a Protocol to satisfy it', 'Not mentioning static type checkers'],
      followUps: ['What does @runtime_checkable actually check?', 'Can a class satisfy a Protocol it has never heard of?'],
      modelAnswer: 'A Protocol describes a shape: any class with the right methods and signatures satisfies it, and the check is done by the type checker, without inheritance. That’s ideal for a repository port, because adapters — even third-party classes — don’t need to know about my package. An ABC is nominal: implementers must inherit from it, Python refuses to instantiate subclasses that miss abstract methods, and the base class can share real code. I’d pick an ABC when I own the hierarchy and want runtime enforcement or shared behaviour, and a Protocol when I want loose coupling at a boundary. Note that runtime_checkable only checks that method names exist.',
    },
    {
      id: 'project-production-service-debug-500',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A customer reports “I got an error creating a link at about 14:05” and sends a screenshot showing `{"error": "internal server error", "request_id": "7c1e9a02b4f1"}`. How do you find the cause with this service’s design?',
      answer: 'Search the JSON logs for request_id 7c1e9a02b4f1: you’ll find the "request" access line (method, path, status 500, duration) and the ERROR "unhandled error" line with the full traceback, same request id. From the traceback, reproduce it in a test using fakes (e.g. a repository that raises the same error), fix, and add the test.',
      explanation: py`This is the payoff of request ids and structured logging: the client sees an opaque id, the operator gets an exact join key across all log lines for that request, even across services if the id is propagated. Without them you'd be grepping timestamps across thousands of lines. The fake-based tests then let you reproduce infrastructure failures deterministically.`,
      whyAsked: 'Tests practical incident-handling skills and whether you understand why observability features exist.',
      mistakes: ['Asking the customer for more details first', 'Searching logs by timestamp only', 'Fixing without a regression test'],
      followUps: ['How would you propagate the request id to a downstream service?', 'What should never appear in those logs?'],
      modelAnswer: 'The request id is the key. I would search the structured logs for that id, which gives me the access log line — method, path, a 500 status and the duration — and the ERROR line logged by the catch-all handler with the full traceback, because both carry the same request_id field. The traceback tells me what failed, say the database raising during the insert. I would reproduce it with a fake that raises the same error, fix the code or the infrastructure, and keep the test as a regression test. That workflow is exactly why the service returns a request id instead of exception details.',
    },
    {
      id: 'project-production-service-feature-flags',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Write `load_flags(env)` that reads feature flags from a mapping: every key starting with `SHRTN_FEATURE_` becomes a lower-case flag name (`SHRTN_FEATURE_PREVIEW_PAGE` → `"preview_page"`). Values `1/true/yes/on` mean True and `0/false/no/off` mean False, case-insensitive and ignoring surrounding spaces. Collect every invalid value and raise one `ValueError` that names all the bad variables. Other keys are ignored.',
      answer: 'Iterate the mapping, filter by prefix, normalise the value, look it up in a dict of accepted spellings, and collect problems before raising once.',
      explanation: py`Explicit allow-lists of spellings beat \`bool(value)\` — which is \`True\` for the string \`"false"\`. Collecting problems mirrors \`Settings.from_env\`: an operator sees every mistake at once.`,
      starter: { files: { 'main.py': py`def load_flags(env):
    # TODO
    return {key: bool(value) for key, value in env.items()}


print(load_flags({"SHRTN_FEATURE_PREVIEW_PAGE": "on", "PATH": "/usr/bin"}))
` } },
      tests: [
        { name: 'parses flags and ignores other keys', code: py`flags = load_flags({"SHRTN_FEATURE_PREVIEW_PAGE": "on", "SHRTN_FEATURE_STATS": " False ",
                    "SHRTN_ENV": "test", "PATH": "/usr/bin"})
assert flags == {"preview_page": True, "stats": False}` },
        { name: 'accepts every spelling, any case', code: py`for value in ("1", "true", "YES", "On"):
    assert load_flags({"SHRTN_FEATURE_X": value}) == {"x": True}
for value in ("0", "false", "No", "OFF"):
    assert load_flags({"SHRTN_FEATURE_X": value}) == {"x": False}` },
        { name: 'one ValueError naming every bad variable', code: py`try:
    load_flags({"SHRTN_FEATURE_A": "maybe", "SHRTN_FEATURE_B": "", "SHRTN_FEATURE_C": "on"})
except ValueError as exc:
    assert "SHRTN_FEATURE_A" in str(exc) and "SHRTN_FEATURE_B" in str(exc)
    assert "SHRTN_FEATURE_C" not in str(exc)
else:
    raise AssertionError("ValueError was not raised")` },
      ],
      solution: { files: { 'main.py': py`PREFIX = "SHRTN_FEATURE_"
SPELLINGS = {
    "1": True, "true": True, "yes": True, "on": True,
    "0": False, "false": False, "no": False, "off": False,
}


def load_flags(env):
    flags, problems = {}, []
    for key, raw in env.items():
        if not key.startswith(PREFIX):
            continue
        value = SPELLINGS.get(raw.strip().lower())
        if value is None:
            problems.append(f"{key} must be on/off, true/false, yes/no or 1/0 (got {raw!r})")
        else:
            flags[key.removeprefix(PREFIX).lower()] = value
    if problems:
        raise ValueError("; ".join(problems))
    return flags


print(load_flags({"SHRTN_FEATURE_PREVIEW_PAGE": "on", "PATH": "/usr/bin"}))
` } },
      hints: ['bool("false") is True — you need an explicit table of spellings.', 'Use key.startswith(PREFIX) and key.removeprefix(PREFIX).lower().', 'Append problems to a list while looping; raise once at the end.'],
      whyAsked: 'Small, realistic configuration parsing that shows attention to edge cases and operator experience.',
      mistakes: ['Using bool(value)', 'Raising on the first problem', 'Forgetting to strip whitespace or ignore unrelated variables'],
      followUps: ['How would you change flags without restarting the service?', 'How would you test code paths behind a flag?'],
      modelAnswer: 'I loop over the mapping and skip keys without the prefix. For each flag I strip and lower-case the value and look it up in an explicit table of accepted spellings — I can’t use bool, because bool of the string "false" is True. Valid flags go into the result under the lower-cased name without the prefix; invalid ones are appended to a problems list, and at the end I raise a single ValueError listing every bad variable, the same fail-fast-with-everything approach as the settings loader.',
    },
  ],

  takeaways: [
    'Production-ready means operable: validated configuration, structured logs, real health checks, safe errors, tests, packaging and a repeatable deployment.',
    'Read settings once from the environment into a frozen object; collect every problem and fail fast; keep secrets out of reprs and logs.',
    'Log one JSON object per line to stdout with a request id, and never trust client-supplied ids or log secrets.',
    'Domain without I/O, a service with injected collaborators, storage behind a Protocol, and one composition root that wires it all.',
    'Map expected errors to 4xx in one place; unexpected ones become a logged, generic 500 carrying the request id.',
    'Fakes (fixed clock, predictable codes, broken repository) plus contract tests make every behaviour — including outages — testable in milliseconds.',
    'Ship with pyproject.toml, ruff, mypy and pytest in CI; deploy a stateless WSGI app in a non-root container with secrets injected at run time.',
  ],
}

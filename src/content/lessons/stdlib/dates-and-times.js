// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const TRIP_PLANNER = py`# Plan a trip: calendar dates, durations, parsing and time zones
from datetime import date, datetime, timedelta, timezone

# 1. Calendar dates and timedelta
booked = date(2026, 6, 14)
trip_starts = date(2026, 7, 3)
countdown = trip_starts - booked             # date - date -> timedelta
print("Days from booking to trip:", countdown.days)
print("Trip starts on a", trip_starts.strftime("%A"))
returns = trip_starts + timedelta(weeks=2)   # date + timedelta -> date
print("Return date:", returns.isoformat())

# 2. Parsing text into a datetime
receipt = "03/07/2026 07:45"                 # day/month/year on a UK receipt
checked_in = datetime.strptime(receipt, "%d/%m/%Y %H:%M")
print("Checked in:", checked_in.strftime("%d %b %Y at %H:%M"))

# 3. Aware datetimes: one instant, different clocks
BST = timezone(timedelta(hours=1), "BST")    # London in summer
EDT = timezone(timedelta(hours=-4), "EDT")   # New York in summer
departs = datetime(2026, 7, 3, 9, 30, tzinfo=BST)
arrives = datetime(2026, 7, 3, 12, 15, tzinfo=EDT)
print("Flight time:", arrives - departs)
print("Departs (UTC):", departs.astimezone(timezone.utc).isoformat())
print("Lands at", arrives.strftime("%H:%M %Z"), "=", arrives.astimezone(BST).strftime("%H:%M %Z"))
`

export default {
  id: 'dates-and-times',
  title: 'Dates & times with datetime',
  summary: 'The datetime module models calendar dates, clock times, instants and durations; parse and format with strptime/strftime and ISO 8601, keep datetimes time-zone aware, and store instants in UTC.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['string-formatting', 'numbers-and-math'],
  related: ['regular-expressions', 'json-data', 'csv-data', 'logging', 'profiling', 'sql-and-sqlite', 'mocking'],
  tags: ['datetime', 'date', 'time', 'timedelta', 'timezone', 'UTC', 'naive', 'aware', 'strftime', 'strptime', 'ISO 8601', 'fromisoformat', 'isoformat', 'zoneinfo', 'DST', 'daylight saving', 'timestamp', 'epoch', 'calendar', 'monotonic'],
  apis: [
    { name: 'date(year, month, day)', summary: 'A calendar date with no time of day. date.today() gives the local date.' },
    { name: 'datetime(year, month, day, hour=0, minute=0, second=0, microsecond=0, tzinfo=None)', summary: 'A date plus a time; aware if tzinfo is set, naive otherwise.' },
    { name: 'time(hour, minute, second)', summary: 'A time of day, independent of any date.' },
    { name: 'timedelta(days, seconds, microseconds, milliseconds, minutes, hours, weeks)', summary: 'A duration; the result of subtracting dates/datetimes, and addable to them.' },
    { name: 'timezone(offset, name=None) / timezone.utc', summary: 'A fixed UTC offset tzinfo. datetime.UTC is an alias of timezone.utc (3.11+).' },
    { name: 'datetime.now(tz=None)', summary: 'The current time; pass timezone.utc to get an aware result.' },
    { name: 'dt.strftime(format) / datetime.strptime(text, format)', summary: 'Format to text / parse from text using % codes such as %Y-%m-%d %H:%M.' },
    { name: 'dt.isoformat() / datetime.fromisoformat(text)', summary: 'ISO 8601 text out and in; fromisoformat accepts most ISO 8601 forms, including "Z" (3.11+).' },
    { name: 'dt.astimezone(tz)', summary: 'The same instant expressed in another time zone.' },
    { name: 'dt.replace(...)', summary: 'A copy with some fields changed (e.g. tzinfo=...) — datetimes are immutable.' },
    { name: 'dt.timestamp() / datetime.fromtimestamp(ts, tz)', summary: 'Convert to and from POSIX seconds since 1970-01-01 UTC.' },
    { name: 'zoneinfo.ZoneInfo(key)', summary: '3.9+: an IANA time zone such as "Europe/London", with daylight-saving rules (needs the tz database).' },
  ],
  docs: [
    { label: 'datetime — basic date and time types', url: 'https://docs.python.org/3/library/datetime.html' },
    { label: 'strftime() and strptime() format codes', url: 'https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes' },
    { label: 'zoneinfo — IANA time zone support', url: 'https://docs.python.org/3/library/zoneinfo.html' },
    { label: 'calendar — general calendar functions', url: 'https://docs.python.org/3/library/calendar.html' },
    { label: 'PEP 495 — local time disambiguation (fold)', url: 'https://peps.python.org/pep-0495/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Dates and times look simple until you write code for them. Months have different lengths, years have leap days, clocks jump forward and back for daylight saving, and "9:30" means a different moment in London and New York. Python's \`datetime\` module gives you precise types for each idea so you don't have to juggle numbers and strings yourself:`,
    py`- \`date\` — a calendar day: 2026-07-03.
- \`time\` — a time of day: 09:30.
- \`datetime\` — both together: 2026-07-03 09:30. With a time zone attached, it's an exact **instant** on the world's timeline.
- \`timedelta\` — a **duration**: 7 hours 45 minutes, 19 days.
- \`timezone\` — a fixed offset from UTC, such as +01:00.`,
    py`You'll also learn to turn text into dates (**parsing**) and dates into text (**formatting**), why every datetime should know its time zone, and why serious systems store times in **UTC**.`,
  ],
  why: [
    py`Almost every application deals with time: due dates, booking windows, log timestamps, subscriptions that renew monthly, reports "for last week". Bugs here are expensive and embarrassing — a reminder that fires an hour late after the clocks change, an invoice dated in the wrong year at midnight on New Year's Eve, a server in one country comparing times written in another.`,
    py`Doing date arithmetic by hand ("add 30 days", "split the string on dashes") breaks on edge cases. \`datetime\` already knows the calendar rules, and its error messages tell you when you mix incompatible kinds of time.`,
  ],
  eli15: [
    py`A **date** is a box on a calendar. A **datetime** is a box on the calendar plus the reading on a clock. A **timedelta** is a length of time, like "two weeks" — you can add it to a date to get another date, or subtract two dates to get one.`,
    py`The tricky part is clocks. When it's 09:30 in London, it's 04:30 in New York and 14:00 in Delhi — but it's the *same moment*. A datetime with a **time zone** knows which clock it's reading, so Python can tell that those three are equal. A datetime without one (called **naive**) is like a note saying "meet at 9:30" without saying which city: fine for your own diary, dangerous for anything shared.`,
  ],
  analogy: {
    title: 'Clocks on the wall of a world airport',
    body: [
      py`Airports often have a row of clocks labelled London, New York, Tokyo. They show different numbers, but they're all describing **one instant**. Airlines avoid confusion by writing schedules with the offset ("09:30 +01:00") or in UTC, the reference clock everyone can convert from.`,
      py`An **aware** datetime is a clock reading *with* its city label. A **naive** datetime is a reading with the label torn off. A **timedelta** is the gap between two moments — like a flight duration — and it doesn't care which clock you used, as long as you knew the labels.`,
    ],
    mapping: [
      ['one moment in the world', 'an instant: an aware datetime'],
      ['the clock labelled "London"', 'a tzinfo: timezone(timedelta(hours=1)) or ZoneInfo("Europe/London")'],
      ['the reference clock (Greenwich)', 'UTC: timezone.utc'],
      ['a reading with the label torn off', 'a naive datetime (tzinfo is None)'],
      ['reading the same moment on another clock', 'dt.astimezone(other_tz)'],
      ['a flight duration', 'a timedelta: arrives - departs'],
      ['the printed timetable', 'formatting: strftime / isoformat'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'One instant, many clocks',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'utc', label: '08:30 UTC', note: 'one instant (2026-07-03)', x: 380, y: 60, tone: 'ink' },
        { id: 'london', label: '09:30+01:00', note: 'London clock (BST)', x: 130, y: 180, tone: 'blue' },
        { id: 'ny', label: '04:30-04:00', note: 'New York clock (EDT)', x: 380, y: 180, tone: 'blue' },
        { id: 'delhi', label: '14:00+05:30', note: 'Delhi clock (IST)', x: 630, y: 180, tone: 'blue' },
        { id: 'naive', label: '09:30', note: 'naive: which 09:30?', x: 130, y: 285, tone: 'red' },
      ],
      edges: [
        { from: 'utc', to: 'london', label: 'astimezone' },
        { from: 'utc', to: 'ny', label: 'astimezone' },
        { from: 'utc', to: 'delhi', label: 'astimezone' },
        { from: 'london', to: 'naive', label: 'replace(tzinfo=None)', dashed: true },
      ],
      steps: [
        { focus: ['utc'], text: py`An **instant** is a single point on the world's timeline. The usual reference clock is **UTC** (Coordinated Universal Time). Here: 08:30 UTC on 3 July 2026.` },
        { focus: ['utc', 'london', 'ny', 'delhi'], edges: ['utc->london', 'utc->ny', 'utc->delhi'], text: py`The same instant reads differently on local clocks. An **aware** datetime stores the clock reading *and* its offset from UTC. \`astimezone(tz)\` re-expresses the instant on another clock. All three compare **equal** with \`==\`.` },
        { focus: ['london', 'naive'], edges: ['london->naive'], text: py`Strip the offset and you get a **naive** datetime: just "09:30 on 3 July". Python can no longer tell which instant it means, so it refuses to compare or subtract naive and aware datetimes (\`TypeError\`).` },
        { focus: ['utc'], text: py`The production rule: **store and compute in UTC (aware), convert to the user's zone only for display**. Offsets like +01:00 are fixed; real places switch offsets for daylight saving, which is what \`zoneinfo.ZoneInfo("Europe/London")\` models.` },
      ],
    },
    alt: 'Diagram: one instant, 08:30 UTC on 3 July 2026, at the top. Arrows labelled astimezone lead to three local readings: 09:30+01:00 in London, 04:30-04:00 in New York and 14:00+05:30 in Delhi. A dashed arrow from the London reading, labelled replace(tzinfo=None), leads to a naive 09:30 that no longer identifies a specific instant.',
  },
  syntax: [
    py`#### Creating dates, times and datetimes`,
    { code: py`from datetime import date, time, datetime

launch = date(2026, 7, 3)
alarm = time(7, 45)
meeting = datetime(2026, 7, 3, 9, 30)          # naive: no time zone
print(launch, alarm, meeting)                  # 2026-07-03 07:45:00 2026-07-03 09:30:00
print(launch.year, launch.month, launch.day)   # 2026 7 3
print(launch.weekday(), launch.strftime("%A")) # 4 Friday  (Monday is 0)
print(datetime.combine(launch, alarm))         # 2026-07-03 07:45:00
print(meeting.date(), meeting.time())          # 2026-07-03 09:30:00`, lang: 'python', title: 'the basic types' },
    py`\`date.today()\` and \`datetime.now()\` give the current date and time — useful in programs, but avoid them in examples and tests because their output changes every run. Invalid values fail immediately: \`date(2026, 2, 30)\` raises \`ValueError: day 30 must be in range 1..28 for month 2 in year 2026\`. All these objects are **immutable**; use \`.replace(day=1)\` to get a modified copy.`,
    py`#### Durations: timedelta`,
    { code: py`from datetime import date, datetime, timedelta

due = date(2026, 7, 3) + timedelta(weeks=2)      # date + timedelta -> date
print(due)                                       # 2026-07-17
gap = date(2026, 7, 3) - date(2026, 6, 14)       # date - date -> timedelta
print(gap, gap.days)                             # 19 days, 0:00:00 19

shift = timedelta(hours=7, minutes=45)
print(shift, shift.total_seconds())              # 7:45:00 27900.0
print(datetime(2026, 7, 3, 22, 0) + shift)       # 2026-07-04 05:45:00 — rolls over midnight
print(timedelta(hours=-1))                       # -1 day, 23:00:00 (normalised form)`, lang: 'python', title: 'adding, subtracting, measuring' },
    py`A \`timedelta\` stores only days, seconds and microseconds — there is **no "month" or "year" duration**, because months and years have different lengths. "One month after 31 January" is a business decision, not arithmetic; the internals section shows how to handle it.`,
    py`#### Formatting: strftime and f-strings`,
    { code: py`from datetime import datetime

dt = datetime(2026, 4, 12, 9, 15, 2)
print(dt.strftime("%Y-%m-%d %H:%M:%S"))     # 2026-04-12 09:15:02
print(dt.strftime("%a %d %b %Y, %I:%M %p")) # Sun 12 Apr 2026, 09:15 AM
print(f"{dt:%d/%m/%Y}")                     # 12/04/2026 — same codes in f-strings
print(dt.isoformat())                       # 2026-04-12T09:15:02`, lang: 'python', title: 'date to text' },
    py`| code | meaning | example |
|---|---|---|
| \`%Y\` \`%m\` \`%d\` | year, month, day (zero-padded) | 2026, 04, 12 |
| \`%H\` \`%M\` \`%S\` | hour (24h), minute, second | 09, 15, 02 |
| \`%I\` \`%p\` | hour (12h), AM/PM | 09, AM |
| \`%A\` \`%a\` | weekday name, abbreviated | Sunday, Sun |
| \`%B\` \`%b\` | month name, abbreviated | April, Apr |
| \`%j\` | day of the year | 102 |
| \`%z\` \`%Z\` | UTC offset, zone name | +0100, BST |
| \`%%\` | a literal % | % |`,
    py`Names such as \`%A\` and \`%b\` follow the process's *locale* (language settings), so "Apr" might print as "avr." on a French system. For machine-readable output, stick to numbers or ISO 8601.`,
    py`#### Parsing: strptime and fromisoformat`,
    { code: py`from datetime import datetime, date

# strptime: you describe the exact format
receipt = datetime.strptime("03/07/2026 07:45", "%d/%m/%Y %H:%M")
print(receipt)                                     # 2026-07-03 07:45:00

# ISO 8601: the international standard format
print(date.fromisoformat("2026-07-03"))            # 2026-07-03
print(datetime.fromisoformat("2026-07-03T09:30:00+01:00"))   # aware
print(datetime.fromisoformat("2026-07-03T08:30:00Z"))        # "Z" means UTC (3.11+)`, lang: 'python', title: 'text to date' },
    py`If the text doesn't fit the format, you get \`ValueError: time data '12/04/2026' does not match format '%Y-%m-%d'\` — good: silent misreading of 03/07 as March 7th instead of 3 July is far worse. Prefer **ISO 8601** (\`YYYY-MM-DD\`, \`YYYY-MM-DDTHH:MM:SS+HH:MM\`) for anything you store or exchange: it's unambiguous, sorts correctly as text, and \`fromisoformat\` reads it without a format string.`,
    { callout: 'version', title: 'fromisoformat across versions', text: py`\`fromisoformat\` exists since Python 3.7, but before 3.11 it only accepted the exact format produced by \`isoformat()\`. Since 3.11 it accepts most ISO 8601 inputs, including a trailing \`Z\` and compact forms like \`20260412T091502\`.` },
    py`#### Naive vs aware datetimes`,
    { code: py`from datetime import datetime, timedelta, timezone

naive = datetime(2026, 7, 3, 9, 30)
aware = datetime(2026, 7, 3, 9, 30, tzinfo=timezone(timedelta(hours=1)))
print(naive.tzinfo, aware.tzinfo)       # None UTC+01:00

now_utc = datetime.now(timezone.utc)    # the right way to get "now"
print(now_utc.tzinfo)                   # UTC

print(aware.astimezone(timezone.utc))   # 2026-07-03 08:30:00+00:00
india = timezone(timedelta(hours=5, minutes=30), "IST")
print(aware.astimezone(india))          # 2026-07-03 14:00:00+05:30`, lang: 'python', title: 'attaching and converting time zones' },
    py`A datetime is **aware** when its \`tzinfo\` gives a UTC offset, and **naive** when \`tzinfo\` is \`None\`. Aware datetimes represent exact instants, so you can compare and subtract them across zones. Naive datetimes are just calendar-and-clock readings. Mixing them raises \`TypeError: can't compare offset-naive and offset-aware datetimes\`.`,
    { callout: 'warn', title: 'datetime.utcnow() is deprecated (3.12+)', text: py`\`datetime.utcnow()\` returns a **naive** datetime holding UTC numbers — easy to mistake for local time. It is deprecated since Python 3.12 (as is \`utcfromtimestamp\`). Use \`datetime.now(timezone.utc)\` (or \`datetime.now(datetime.UTC)\`, 3.11+), which is aware.` },
    py`#### Real time zones: zoneinfo (Python 3.9+)`,
    { code: py`from datetime import datetime
from zoneinfo import ZoneInfo     # needs the IANA time zone database

meeting = datetime(2026, 7, 3, 9, 30, tzinfo=ZoneInfo("Europe/London"))
print(meeting)                                          # 2026-07-03 09:30:00+01:00 (summer time)
print(meeting.astimezone(ZoneInfo("America/New_York"))) # 2026-07-03 04:30:00-04:00
winter = meeting.replace(month=12)
print(winter.utcoffset())                               # 0:00:00 — London is on GMT in December`, lang: 'python', title: 'IANA zones know about daylight saving', static: true },
    py`A fixed \`timezone(timedelta(hours=1))\` is always +01:00. A real place like London is +00:00 in winter and +01:00 in summer, and the rules have changed over the years. \`zoneinfo.ZoneInfo\` (standard library since 3.9) reads those rules from the **IANA time zone database**. Most Linux and macOS systems provide it; on Windows (and in this browser sandbox, which has no tz database) you install the \`tzdata\` package from PyPI. That's why the runnable examples in this lesson use fixed offsets, and the code above is shown but not run.`,
  ],
  walkthrough: {
    title: 'Reading the trip planner line by line',
    lang: 'python',
    code: TRIP_PLANNER,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 8], text: py`Two \`date\` objects. Subtracting them gives a \`timedelta\`; \`.days\` reads its whole number of days (19).` },
      { lines: [9], text: py`\`strftime("%A")\` formats the weekday name: 3 July 2026 is a Friday.` },
      { lines: [10, 11], text: py`Adding \`timedelta(weeks=2)\` to a date gives another date, with month lengths handled for you. \`isoformat()\` prints it as \`YYYY-MM-DD\`.` },
      { lines: [14, 16], text: py`\`strptime\` parses text using a format you describe. \`%d/%m/%Y\` says "day first", so \`03/07\` is 3 July, not March 7th. The result is a **naive** datetime.` },
      { lines: [19, 22], text: py`Two fixed-offset zones, and two **aware** datetimes: departure on the London clock, arrival on the New York clock.` },
      { lines: [23], text: py`Subtracting aware datetimes converts both to UTC first: 08:30 → 16:15 UTC is a 7:45:00 flight, even though the clock readings (09:30 and 12:15) differ by only 2:45.` },
      { lines: [24, 25], text: py`\`astimezone\` re-expresses an instant on another clock; \`%Z\` prints the zone's name. The plane lands at 12:15 EDT, which is 17:15 in London.` },
    ],
  },
  playground: {
    title: 'Trip planner',
    objective: 'Run it, then parse an API timestamp, compute a check-in window, fix a naive/aware mix-up and find the end of the month.',
    files: { 'main.py': TRIP_PLANNER },
    expected: py`\`\`\`text
Days from booking to trip: 19
Trip starts on a Friday
Return date: 2026-07-17
Checked in: 03 Jul 2026 at 07:45
Flight time: 7:45:00
Departs (UTC): 2026-07-03T08:30:00+00:00
Lands at 12:15 EDT = 17:15 BST
\`\`\``,
    experiments: [
      {
        id: 'api-timestamp',
        task: py`The airline's API reports the departure as \`"2026-07-03T08:30:00Z"\`. Parse it into \`api_time\` with \`datetime.fromisoformat\`, then print \`api_time == departs\`. Predict the answer first.`,
        hint: py`\`api_time = datetime.fromisoformat("2026-07-03T08:30:00Z")\` — the \`Z\` means UTC.`,
        tests: [
          { name: 'api_time is an aware datetime', code: py`assert ns.get('api_time') is not None and api_time.tzinfo is not None, 'Parse the string with datetime.fromisoformat'` },
          { name: 'it is the same instant as departs', code: py`assert api_time == departs` },
        ],
        explain: py`\`True\`: 08:30 UTC and 09:30 +01:00 are the same instant, and aware datetimes compare instants, not clock readings. Since Python 3.11, \`fromisoformat\` understands the \`Z\` suffix.`,
      },
      {
        id: 'checkin-window',
        task: py`Online check-in opens **24 hours** before departure. Create \`checkin_opens\` and print it in UTC.`,
        hint: py`\`checkin_opens = departs - timedelta(hours=24)\`, then \`checkin_opens.astimezone(timezone.utc)\`.`,
        tests: [
          { name: 'checkin_opens is 24 hours before departs', code: py`assert ns.get('checkin_opens') == departs - timedelta(hours=24)` },
        ],
        explain: py`Subtracting a \`timedelta\` from an aware datetime keeps its time zone. With a fixed offset that's exactly 24 real hours. (With a \`ZoneInfo\` zone across a daylight-saving change, "the same wall-clock time yesterday" and "24 hours ago" can differ — see internals.)`,
      },
      {
        id: 'naive-trap',
        task: py`How long between check-in and departure? First try \`print(departs - checked_in)\` and read the error. Then attach the London zone to the receipt time with \`.replace(tzinfo=BST)\` and store the duration in \`wait\`.`,
        hint: py`\`wait = departs - checked_in.replace(tzinfo=BST)\``,
        tests: [
          { name: 'wait is 1 hour 45 minutes', code: py`assert ns.get('wait') == timedelta(hours=1, minutes=45)` },
        ],
        explain: py`\`TypeError: can't subtract offset-naive and offset-aware datetimes\` — Python won't guess which zone the receipt used. \`replace(tzinfo=BST)\` *labels* the naive time ("this was London time") without changing its numbers; \`astimezone\` would instead *convert* to a different clock. Use \`replace\` to attach a zone you know, \`astimezone\` to convert.`,
      },
      {
        id: 'month-end',
        task: py`Find the last day of the month the trip starts in and store it as a \`date\` called \`last_day\`. Use \`calendar.monthrange(year, month)\`, which returns \`(first_weekday, number_of_days)\`.`,
        hint: py`\`import calendar\`, then \`days = calendar.monthrange(trip_starts.year, trip_starts.month)[1]\` and \`last_day = trip_starts.replace(day=days)\`.`,
        tests: [
          { name: 'last_day is 31 July 2026', code: py`assert ns.get('last_day') == date(2026, 7, 31)` },
        ],
        explain: py`\`calendar.monthrange\` knows month lengths and leap years (\`monthrange(2028, 2)\` gives 29 days). \`replace(day=...)\` returns a new \`date\` — dates are immutable.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'Library loan: date arithmetic step by step',
    props: {
      code: py`from datetime import date, timedelta
borrowed = date(2026, 1, 30)
loan = timedelta(weeks=3)
due = borrowed + loan
print(due, due.strftime("%A"))
returned = date(2026, 2, 25)
late = returned - due
print(late.days, "days late")
fine = late.days * 0.25
print(f"Fine: {fine:.2f}")
`,
      notes: {
        3: 'A `timedelta` is a duration. `weeks=3` is stored as 21 days.',
        4: 'date + timedelta → a new date. January has 31 days, so 30 Jan + 21 days lands in February automatically.',
        7: 'date − date → timedelta. Its `.days` attribute is a plain int.',
        9: 'From here on it is ordinary arithmetic on numbers.',
      },
    },
    alt: 'A step-by-step trace. borrowed is the date 2026-01-30, loan is a timedelta of 21 days, due is 2026-02-20, a Friday. returned is 2026-02-25, so late is a timedelta of 5 days, and the fine is 1.25.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Under the hood a \`date\` is three numbers (year, month, day) that the module checks against the calendar. \`datetime\` adds hour, minute, second and microsecond — microseconds are the finest precision it stores. A \`timedelta\` normalises everything into days, seconds and microseconds, which is why \`timedelta(hours=36)\` displays as \`1 day, 12:00:00\` and \`timedelta(hours=-1)\` as \`-1 day, 23:00:00\` (minus one day plus 23 hours).`,
      py`Every one of these objects is **immutable** and **comparable**: dates sort in time order, \`max(dates)\` finds the latest, and you can use them as dictionary keys.`,
    ],
    technical: [
      py`**Two kinds of arithmetic.** Python's aware-datetime arithmetic follows two documented rules that surprise people around daylight saving:`,
      py`1. \`aware_dt + timedelta\` adjusts the **wall-clock** fields and keeps the same \`tzinfo\`; the UTC offset is then recomputed for the new local time.
2. \`a - b\` with **different** \`tzinfo\` objects converts both to UTC first (absolute time). With the **same** \`tzinfo\` object, the \`tzinfo\` is ignored and the wall-clock difference is returned.`,
      { code: py`from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

london = ZoneInfo("Europe/London")
before = datetime(2026, 3, 28, 12, 0, tzinfo=london)  # Saturday, GMT +00:00
after = before + timedelta(days=1)                     # Sunday 12:00, now BST +01:00
print(after.utcoffset())                                # 1:00:00
print(after - before)                                   # 1 day, 0:00:00  (same tzinfo: wall clock)
utc = ZoneInfo("UTC")
print(after.astimezone(utc) - before.astimezone(utc))   # 23:00:00        (real elapsed time)`, lang: 'python', title: 'the DST surprise (static: needs the tz database)', static: true },
      py`Clocks in the UK went forward on Sunday 29 March 2026, so "the same time tomorrow" was only 23 real hours later. For elapsed time across zones, convert to UTC first. For "every day at 9:00 local", add days to the local wall-clock time.`,
      py`**Ambiguous and missing times.** When clocks go back, a wall time like 01:30 happens twice. PEP 495 added the \`fold\` attribute (0 = first occurrence, 1 = second) so \`ZoneInfo\` can tell them apart. When clocks go forward, some wall times never happen at all.`,
      py`**Timestamps.** \`dt.timestamp()\` returns POSIX time: seconds since 1970-01-01 00:00 UTC, ignoring leap seconds. On a **naive** datetime it assumes the machine's local time zone, so the same code gives different numbers on different servers — another reason to stay aware. \`datetime.fromtimestamp(ts, tz=timezone.utc)\` converts back.`,
      { callout: 'note', title: 'CPython detail', text: py`CPython implements \`datetime\` in C (the \`_datetime\` extension) with a pure-Python fallback (\`_pydatetime\` since 3.12). Supported years run from 1 to 9999 (\`datetime.MINYEAR\`/\`MAXYEAR\`) — that range is part of the documented API; the C implementation is the CPython detail.` },
    ],
    production: [
      py`**Store UTC, display local.** Keep instants as aware UTC datetimes in your code and database (e.g. \`TIMESTAMP WITH TIME ZONE\` in PostgreSQL), exchange them as ISO 8601 with an offset (\`2026-07-03T08:30:00+00:00\`), and convert to the user's \`ZoneInfo\` only when displaying. Store the user's time zone as an **IANA name** (\`"Europe/London"\`), never as a fixed offset — offsets change with the seasons.`,
      py`**Future local events are different.** "The meeting is at 09:00 Berlin time on 1 March next year" should be stored as local date-time + zone name, because governments change DST rules; converting to UTC today could give the wrong instant later.`,
      py`**Measure durations with a monotonic clock.** \`datetime.now()\` can jump when the system clock is corrected (NTP) or changed by hand. For timing code or timeouts use \`time.monotonic()\` or \`time.perf_counter()\` — see [profiling](lesson:profiling).`,
      py`**Make "now" injectable.** Functions that call \`datetime.now()\` internally are hard to test. Pass the current time in as a parameter (\`def is_overdue(due, now)\`) or inject a clock object, and use [mocking](lesson:mocking) only where you must.`,
      py`**Month arithmetic is a business rule.** Decide what "one month after 31 January" means (28 Feb? 3 March?) and implement it explicitly with \`calendar.monthrange\` — or use the third-party \`python-dateutil\` package's \`relativedelta\`, which clamps to the month's last day.`,
      { code: py`from dateutil.relativedelta import relativedelta   # third-party: pip install python-dateutil
from datetime import date

print(date(2026, 1, 31) + relativedelta(months=1))   # 2026-02-28`, lang: 'python', title: 'third-party month arithmetic', static: true },
    ],
  },
  mistakes: [
    {
      title: 'Mixing naive and aware datetimes',
      wrong: { code: py`from datetime import datetime, timezone
deadline = datetime(2026, 7, 3, 17, 0)          # naive
now = datetime.now(timezone.utc)                # aware
print(now > deadline)   # TypeError: can't compare offset-naive and offset-aware datetimes`, lang: 'python', static: true },
      right: { code: py`from datetime import datetime, timezone
deadline = datetime(2026, 7, 3, 17, 0, tzinfo=timezone.utc)
now = datetime(2026, 7, 3, 16, 0, tzinfo=timezone.utc)   # in real code: datetime.now(timezone.utc)
print(now > deadline)   # False`, lang: 'python' },
      explanation: py`Python refuses to guess what zone a naive datetime is in. Make every datetime that represents an instant aware — ideally in UTC — at the moment you create or parse it.`,
    },
    {
      title: 'Using utcnow() for "now in UTC"',
      wrong: { code: py`from datetime import datetime
stamp = datetime.utcnow()       # naive! and deprecated since 3.12`, lang: 'python', static: true },
      right: { code: py`from datetime import datetime, timezone
stamp = datetime.now(timezone.utc)
print(stamp.tzinfo)             # UTC`, lang: 'python' },
      explanation: py`\`utcnow()\` returns UTC numbers with no time zone attached, so later code (and \`.timestamp()\`) treats them as local time. \`now(timezone.utc)\` is aware and unambiguous.`,
    },
    {
      title: 'Adding a "month" with timedelta(days=30)',
      wrong: { code: py`from datetime import date, timedelta
renewal = date(2026, 1, 31) + timedelta(days=30)
print(renewal)    # 2026-03-02 — skipped February entirely`, lang: 'python' },
      right: { code: py`import calendar
from datetime import date

def add_month(d):
    year, month = (d.year + 1, 1) if d.month == 12 else (d.year, d.month + 1)
    last = calendar.monthrange(year, month)[1]
    return d.replace(year=year, month=month, day=min(d.day, last))

print(add_month(date(2026, 1, 31)))   # 2026-02-28`, lang: 'python' },
      explanation: py`Months aren't a fixed number of days. Write the rule you actually want (here: same day next month, clamped to the month's end) and test it with 31st-of-month and leap-year dates.`,
    },
    {
      title: 'Guessing the format of ambiguous dates',
      wrong: { code: py`from datetime import datetime
d = datetime.strptime("03/07/2026", "%m/%d/%Y")   # US order — but the file is British
print(d.strftime("%d %B"))    # 07 March — should have been 3 July`, lang: 'python' },
      right: { code: py`from datetime import datetime
d = datetime.strptime("03/07/2026", "%d/%m/%Y")   # the format the source documents
print(d.strftime("%d %B"))    # 03 July
print(d.date().isoformat())   # 2026-07-03 — store it unambiguously`, lang: 'python' },
      explanation: py`\`03/07/2026\` parses successfully either way; only the documented source format tells you which is right. Convert to ISO 8601 as soon as you've parsed it.`,
    },
    {
      title: 'Using replace() when you meant astimezone()',
      wrong: { code: py`from datetime import datetime, timedelta, timezone
utc_time = datetime(2026, 7, 3, 8, 30, tzinfo=timezone.utc)
india = timezone(timedelta(hours=5, minutes=30))
print(utc_time.replace(tzinfo=india))   # 08:30+05:30 — a different instant!`, lang: 'python' },
      right: { code: py`from datetime import datetime, timedelta, timezone
utc_time = datetime(2026, 7, 3, 8, 30, tzinfo=timezone.utc)
india = timezone(timedelta(hours=5, minutes=30))
print(utc_time.astimezone(india))       # 14:00+05:30 — same instant`, lang: 'python' },
      explanation: py`\`replace(tzinfo=...)\` changes the *label* and keeps the clock numbers — right for tagging a naive time whose zone you know. \`astimezone(...)\` converts an aware time to another clock — right for display.`,
    },
    {
      title: 'Timing code with datetime.now()',
      wrong: { code: py`from datetime import datetime
start = datetime.now()
total = sum(range(100_000))
print("took", datetime.now() - start)   # can be wrong if the system clock is adjusted`, lang: 'python' },
      right: { code: py`import time
start = time.perf_counter()
total = sum(range(100_000))
print(f"took {time.perf_counter() - start:.4f}s")`, lang: 'python' },
      explanation: py`\`perf_counter\` (or \`monotonic\`) never goes backwards and has the best available resolution. Wall-clock time is for *when* something happened, not *how long* it took.`,
    },
  ],
  debugging: [
    {
      symptom: py`TypeError: can't compare offset-naive and offset-aware datetimes`,
      cause: py`One datetime has a \`tzinfo\` and the other doesn't — often a parsed string (naive) compared with \`datetime.now(timezone.utc)\` (aware).`,
      fix: py`Make both aware: \`naive.replace(tzinfo=known_zone)\` if you know its zone, then convert with \`astimezone\` as needed. Normalise at the point where data enters the program.`,
    },
    {
      symptom: py`ValueError: time data '12/04/2026' does not match format '%Y-%m-%d'`,
      cause: py`The \`strptime\` format string doesn't describe the text — wrong order, wrong separators, or extra characters such as a trailing newline.`,
      fix: py`Write the format to match the source exactly (\`"%d/%m/%Y"\`), \`strip()\` the input, and print \`repr(text)\` to see hidden characters.`,
    },
    {
      symptom: py`ValueError: day 30 must be in range 1..28 for month 2 in year 2026`,
      cause: py`A date was built from invalid parts, typically by changing the month with \`replace(month=...)\` on a 29th/30th/31st.`,
      fix: py`Clamp the day with \`calendar.monthrange(year, month)[1]\`.`,
    },
    {
      symptom: py`TypeError: unsupported operand type(s) for +: 'datetime.date' and 'int'`,
      cause: py`An integer was added to a date. Python doesn't assume it means days.`,
      fix: py`Add a \`timedelta\`: \`d + timedelta(days=1)\`.`,
    },
    {
      symptom: py`zoneinfo._common.ZoneInfoNotFoundError: 'No time zone found with key Europe/London'`,
      cause: py`The IANA time zone database isn't available — common on Windows, minimal Docker images and browser runtimes.`,
      fix: py`\`pip install tzdata\` (the zoneinfo module uses it automatically) or install the OS package (\`tzdata\` on Debian/Ubuntu).`,
    },
    {
      symptom: py`Reports are one hour off for half of the year`,
      cause: py`A fixed offset (\`timezone(timedelta(hours=1))\`) was used for a place that observes daylight saving, or naive local times were compared with UTC.`,
      fix: py`Use \`ZoneInfo("Europe/London")\` (or the relevant IANA zone) for real places, and keep internal values in UTC.`,
    },
  ],
  bestPractices: [
    'Create aware datetimes for instants: datetime.now(timezone.utc), fromisoformat with an offset, or replace(tzinfo=...) for a known zone.',
    'Store and compute in UTC; convert to the user\'s ZoneInfo zone only for display.',
    'Exchange and store dates as ISO 8601 (isoformat/fromisoformat); avoid ambiguous formats like 03/07/2026.',
    'Use timedelta for durations, and calendar.monthrange (or dateutil.relativedelta) for month-based rules.',
    'Use time.monotonic()/perf_counter() to measure elapsed time, not datetime.now().',
    'Pass "now" into functions instead of calling datetime.now() inside them, so they are testable.',
    'Store user time zones as IANA names ("Europe/London"), never as fixed offsets.',
  ],
  useCases: [
    'Due dates, reminders and expiry checks (borrowed + timedelta(weeks=3)).',
    'Parsing timestamps from logs, CSV files and APIs into datetime objects.',
    'Showing times in each user\'s local zone in a global app.',
    'Scheduling: next business day, last day of the month, weekly reports.',
    'Computing durations: flight times, session lengths, SLA breaches.',
  ],
  comparison: {
    title: 'Which type do I need?',
    headers: ['type', 'represents', 'example', 'typical use'],
    rows: [
      ['date', 'a calendar day', 'date(2026, 7, 3)', 'birthdays, due dates, holidays'],
      ['time', 'a time of day (no date)', 'time(9, 30)', 'opening hours, alarms'],
      ['datetime (naive)', 'a calendar day + clock reading, zone unknown', 'datetime(2026, 7, 3, 9, 30)', 'local-only data, parsing before you attach a zone'],
      ['datetime (aware)', 'an exact instant', 'datetime(..., tzinfo=timezone.utc)', 'timestamps, logs, anything shared or stored'],
      ['timedelta', 'a duration', 'timedelta(hours=7, minutes=45)', 'adding to dates, measuring gaps'],
      ['timezone / ZoneInfo', 'a fixed offset / a real place\'s rules', 'timezone.utc, ZoneInfo("Asia/Tokyo")', 'making datetimes aware, converting'],
    ],
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'dates-and-times-q1',
      type: 'mcq',
      prompt: 'What makes a datetime "aware"?',
      options: [
        { text: 'It was created with datetime.now()', why: 'datetime.now() without arguments returns a naive local time.' },
        'Its tzinfo provides a UTC offset',
        { text: 'It includes seconds and microseconds', why: 'Precision has nothing to do with awareness.' },
        { text: 'It was parsed with strptime', why: 'strptime returns a naive datetime unless the format includes %z and the text contains an offset.' },
      ],
      answer: 1,
      explanation: py`An aware datetime has a \`tzinfo\` whose \`utcoffset()\` isn't \`None\`, so it identifies one exact instant. \`datetime.now(timezone.utc)\`, \`fromisoformat("...+01:00")\` and \`replace(tzinfo=...)\` all produce aware datetimes.`,
    },
    {
      id: 'dates-and-times-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`from datetime import date, timedelta
due = date(2026, 1, 30) + timedelta(days=3)
print(due)`,
      answer: '2026-02-02',
      accept: ['2026-02-02'],
      explanation: py`January has 31 days: 30 Jan + 1 = 31 Jan, + 2 = 1 Feb, + 3 = 2 Feb. \`print\` shows a date in ISO format, \`YYYY-MM-DD\`.`,
    },
    {
      id: 'dates-and-times-q3',
      type: 'output',
      prompt: 'Predict the output.',
      code: py`from datetime import datetime, timedelta, timezone
departs = datetime(2026, 7, 3, 9, 30, tzinfo=timezone(timedelta(hours=1)))
arrives = datetime(2026, 7, 3, 12, 15, tzinfo=timezone(timedelta(hours=-4)))
print(arrives - departs)`,
      options: [
        { text: '2:45:00', why: 'That is the difference between the clock readings. Aware datetimes with different zones are compared as instants in UTC.' },
        '7:45:00',
        { text: '-1 day, 21:15:00', why: 'Arrival is later than departure in absolute time, so the result is positive.' },
        { text: 'TypeError', why: 'Both datetimes are aware, so subtracting them is allowed.' },
      ],
      answer: 1,
      explanation: py`Departure is 08:30 UTC (09:30 − 1h) and arrival is 16:15 UTC (12:15 + 4h). The difference is 7 hours 45 minutes.`,
    },
    {
      id: 'dates-and-times-q4',
      type: 'bug',
      prompt: 'This crashes with a TypeError. Click the line that causes the error.',
      code: py`from datetime import datetime, timezone
deadline = datetime.fromisoformat("2026-07-03T17:00:00+00:00")
submitted = datetime.strptime("2026-07-03 16:45", "%Y-%m-%d %H:%M")
on_time = submitted <= deadline
print("on time" if on_time else "late")`,
      answerLine: 4,
      explanation: py`\`deadline\` is aware (it has \`+00:00\`), but \`strptime\` without \`%z\` returns a **naive** datetime. Line 4 compares them: \`TypeError: can't compare offset-naive and offset-aware datetimes\`. Fix line 3 by attaching the known zone: \`.replace(tzinfo=timezone.utc)\`.`,
    },
    {
      id: 'dates-and-times-q5',
      type: 'fill',
      prompt: 'Fill in the format codes so the program prints `2026-07-03` and then `Friday 03 July`.',
      code: py`from datetime import date
d = date(2026, 7, 3)
print(d.strftime("%Y-%m-___"))
print(d.strftime("%___ %d %B"))`,
      answer: [['%d', 'd'], ['A']],
      explanation: py`\`%d\` is the zero-padded day of the month; \`%A\` is the full weekday name (\`%a\` would give "Fri"). \`%B\` is the full month name.`,
    },
    {
      id: 'dates-and-times-q6',
      type: 'mcq',
      prompt: 'You need to store when each order was placed, for customers in many countries. What should you store?',
      options: [
        { text: 'The server\'s local time as a naive datetime', why: 'Naive local times are ambiguous (which zone? which side of a DST change?) and break when servers move.' },
        'An aware datetime in UTC (e.g. ISO 8601 with +00:00)',
        { text: 'The customer\'s local time as text like "03/07/2026 9:30"', why: 'Ambiguous format, no zone, and hard to sort or compare.' },
        { text: 'The customer\'s local time with a fixed offset only', why: 'It is a valid instant, but it complicates comparisons and reporting; normalise to UTC and keep the user\'s IANA zone separately for display.' },
      ],
      answer: 1,
      explanation: py`An instant stored in UTC is unambiguous, sorts correctly and converts to any zone for display. Keep the customer's IANA zone name in their profile to show local times.`,
    },
    {
      id: 'dates-and-times-q7',
      type: 'short',
      prompt: 'Why is there no timedelta(months=1), and how would you add a month to 31 January?',
      answer: py`timedelta represents a fixed duration (days, seconds, microseconds), but months have 28–31 days, so "one month" isn't a fixed duration — it's a calendar rule. To add a month to 31 January you must choose a rule, typically "same day next month, clamped to the last day": use calendar.monthrange to find February's length and replace(month=2, day=min(31, 28)) → 28 February (29 in leap years). The third-party dateutil.relativedelta(months=1) implements that clamping rule.`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'age-on',
      title: 'How old on a given day?',
      difficulty: 'intermediate',
      prompt: py`Write \`age_on(birthday, on_date)\` that returns a person's age in **whole years** on \`on_date\` (both are \`date\` objects). A person gains a year *on* their birthday. Someone born on 29 February has their birthday on 1 March in non-leap years (so on 28 February they are still the younger age).

\`\`\`text
age_on(date(2000, 5, 20), date(2026, 5, 19))   ->  25
age_on(date(2000, 5, 20), date(2026, 5, 20))   ->  26
age_on(date(2004, 2, 29), date(2026, 2, 28))   ->  21
age_on(date(2004, 2, 29), date(2026, 3, 1))    ->  22
\`\`\`

Don't divide a \`timedelta\` by 365 — leap years make that wrong.`,
      files: {
        'main.py': py`from datetime import date


def age_on(birthday, on_date):
    # TODO: whole years between birthday and on_date
    return (on_date - birthday).days // 365


print(age_on(date(2000, 5, 20), date(2026, 5, 19)))
print(age_on(date(2004, 2, 29), date(2026, 2, 28)))
`,
      },
      hints: [
        'Start with the difference in years: on_date.year - birthday.year. When is that one too many?',
        'It is one too many if the birthday hasn\'t happened yet this year: compare (month, day) pairs. Tuples compare element by element.',
        'return on_date.year - birthday.year - ((on_date.month, on_date.day) < (birthday.month, birthday.day))',
      ],
      solution: {
        explanation: py`The year difference is right *after* this year's birthday and one too many *before* it. Comparing \`(month, day)\` tuples answers "has the birthday happened yet?": tuples compare element by element, so \`(2, 28) < (2, 29)\` is \`True\`. Subtracting a boolean works because \`True == 1\` and \`False == 0\`. The 29 February case falls out naturally: on 28 February the pair \`(2, 28)\` is still before \`(2, 29)\`, and on 1 March it is after. Dividing days by 365 drifts by a day for every leap year, which is why the starter's approach fails right around birthdays. (Some legal systems treat 28 February as the birthday — that would be a different, explicit rule.)`,
        files: {
          'main.py': py`from datetime import date


def age_on(birthday, on_date):
    had_birthday = (on_date.month, on_date.day) >= (birthday.month, birthday.day)
    return on_date.year - birthday.year - (0 if had_birthday else 1)


print(age_on(date(2000, 5, 20), date(2026, 5, 19)))
print(age_on(date(2004, 2, 29), date(2026, 2, 28)))
`,
        },
      },
      tests: [
        { name: 'the day before a birthday', code: py`assert age_on(date(2000, 5, 20), date(2026, 5, 19)) == 25` },
        { name: 'on the birthday', code: py`assert age_on(date(2000, 5, 20), date(2026, 5, 20)) == 26` },
        { name: '29 Feb birthday on 28 Feb', code: py`assert age_on(date(2004, 2, 29), date(2026, 2, 28)) == 21` },
        { name: '29 Feb birthday on 1 Mar', code: py`assert age_on(date(2004, 2, 29), date(2026, 3, 1)) == 22` },
        { name: 'born today is 0', code: py`assert age_on(date(2026, 7, 3), date(2026, 7, 3)) == 0` },
      ],
    },
    {
      id: 'log-time-to-utc',
      title: 'Normalise log timestamps to UTC',
      difficulty: 'intermediate',
      prompt: py`Web-server logs write times like \`12/Apr/2026:09:15:02 +0100\`. Write \`to_utc(text)\` that parses such a timestamp and returns it as an **ISO 8601 string in UTC**.

\`\`\`text
to_utc("12/Apr/2026:09:15:02 +0100")  ->  "2026-04-12T08:15:02+00:00"
to_utc("31/Dec/2026:23:30:00 -0500")  ->  "2027-01-01T04:30:00+00:00"
to_utc("01/Jan/2026:00:00:00 +0000")  ->  "2026-01-01T00:00:00+00:00"
\`\`\`

Hint: \`%b\` parses abbreviated month names and \`%z\` parses an offset like \`+0100\`.`,
      files: {
        'main.py': py`from datetime import datetime, timezone


def to_utc(text):
    # TODO: parse with strptime (format codes %d %b %Y %H %M %S %z), convert to UTC, return isoformat()
    return text


print(to_utc("12/Apr/2026:09:15:02 +0100"))
`,
      },
      hints: [
        'Write the format by copying the text and replacing each part with its code: "12/Apr/2026:09:15:02 +0100" → "%d/%b/%Y:%H:%M:%S %z".',
        'Because of %z, strptime returns an aware datetime. Which method re-expresses it on the UTC clock?',
        'return datetime.strptime(text, "%d/%b/%Y:%H:%M:%S %z").astimezone(timezone.utc).isoformat()',
      ],
      solution: {
        explanation: py`Building the format by copying the sample text and swapping each field for its code (\`%d\`, \`%b\`, \`%Y\`, \`%H\`, \`%M\`, \`%S\`, \`%z\`) keeps the literal separators (\`/\`, \`:\`, the space) exactly right. \`%z\` makes the result **aware**, so \`astimezone(timezone.utc)\` can convert it — including rolling over into the next day, month or year, as in the New Year's Eve example. \`isoformat()\` then produces the unambiguous text form. (\`%b\` depends on the locale; server logs use English month names, which match the default C locale.)`,
        files: {
          'main.py': py`from datetime import datetime, timezone

LOG_FORMAT = "%d/%b/%Y:%H:%M:%S %z"


def to_utc(text):
    stamp = datetime.strptime(text, LOG_FORMAT)
    return stamp.astimezone(timezone.utc).isoformat()


print(to_utc("12/Apr/2026:09:15:02 +0100"))
`,
        },
      },
      tests: [
        { name: 'converts +0100 to UTC', code: py`assert to_utc("12/Apr/2026:09:15:02 +0100") == "2026-04-12T08:15:02+00:00"` },
        { name: 'rolls over into the next year', code: py`assert to_utc("31/Dec/2026:23:30:00 -0500") == "2027-01-01T04:30:00+00:00"` },
        { name: 'UTC input stays the same instant', code: py`assert to_utc("01/Jan/2026:00:00:00 +0000") == "2026-01-01T00:00:00+00:00"` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'dates-and-times-naive-aware',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between a naive and an aware datetime in Python, and which should you use?',
      answer: 'A naive datetime has no tzinfo, so it is just a calendar date and clock reading with no defined instant. An aware datetime carries a UTC offset (via tzinfo) and identifies an exact instant. Use aware datetimes — usually in UTC — for anything stored, compared or shared.',
      explanation: py`Python keeps the two apart deliberately: comparing or subtracting naive and aware datetimes raises \`TypeError\` instead of guessing. Naive values are acceptable for purely local, single-zone data, but they become ambiguous the moment data crosses servers, users or daylight-saving changes. \`datetime.now(timezone.utc)\`, \`fromisoformat\` with an offset, and \`replace(tzinfo=...)\` for a known zone create aware values.`,
      whyAsked: 'Time-zone bugs are common and costly; this checks the basic model.',
      mistakes: ['Thinking naive datetimes are "in UTC"', 'Recommending datetime.utcnow()', 'Not mentioning the TypeError when mixing them'],
      followUps: ['What is the difference between replace(tzinfo=...) and astimezone(...)?', 'How would you get the current time in UTC?'],
      modelAnswer: 'A naive datetime has no time zone information — it is a date and a clock reading, but Python cannot tell which instant it refers to. An aware datetime has a tzinfo that gives its offset from UTC, so it pins down one exact moment, and two aware datetimes in different zones can be compared or subtracted correctly. Python refuses to mix the two and raises a TypeError, which is a good thing. In practice I make every timestamp aware as soon as it enters the program, keep it in UTC, and only convert to a local zone for display.',
    },
    {
      id: 'dates-and-times-global-app',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'You are building a booking system used in many countries. How do you store and handle date-times end to end?',
      answer: 'Store past and present instants as aware UTC datetimes (database TIMESTAMP WITH TIME ZONE), exchange ISO 8601 with offsets in APIs, store each user\'s IANA time zone name, and convert to local time only in the presentation layer. For future local events (a 09:00 class in Berlin next March), store local date-time plus the zone name, because DST rules can change.',
      explanation: py`UTC removes ambiguity and makes comparison and sorting trivial. Users think in local time, so the UI converts using \`ZoneInfo(user.timezone)\`. Fixed offsets are wrong for real places (they change with DST). For future events defined in local terms, converting to UTC at booking time bakes in today's DST rules; storing the local time and zone and converting when needed keeps the event at "09:00 Berlin" even if rules change. Keep the tz database (\`tzdata\`) up to date, and test around DST transitions.`,
      whyAsked: 'A design question that reveals whether you have dealt with time zones in production.',
      mistakes: ['Storing local server time', 'Storing a fixed offset as the user\'s zone', 'Converting future local events to UTC and assuming that\'s final'],
      followUps: ['What happens to a recurring 09:00 meeting across a DST change?', 'How would you test DST behaviour?'],
      modelAnswer: 'For anything that has happened or is happening, I store an aware UTC timestamp — in the database as a timestamp with time zone — and APIs exchange ISO 8601 strings with an explicit offset. Each user has an IANA zone name like Europe/Berlin in their profile, and the presentation layer converts with zoneinfo for display; I never store fixed offsets for people, because offsets change with daylight saving. Future events defined in local terms are the exception: a 9 a.m. class in Berlin next March is stored as the local date-time plus the zone name, because governments can change DST rules between now and then. And I would write tests specifically around the DST transition dates.',
    },
    {
      id: 'dates-and-times-dst-arithmetic',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'A job scheduled with `next_run = last_run + timedelta(days=1)` (aware, ZoneInfo("Europe/London")) still runs at 12:00 local time after the clocks go forward, but a monitoring check that computes `next_run - last_run` says exactly 24 hours, while the real gap was 23. Explain.',
      code: { lang: 'python', code: py`from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

london = ZoneInfo("Europe/London")
last_run = datetime(2026, 3, 28, 12, 0, tzinfo=london)
next_run = last_run + timedelta(days=1)
print(next_run - last_run)                       # 1 day, 0:00:00
utc = ZoneInfo("UTC")
print(next_run.astimezone(utc) - last_run.astimezone(utc))   # 23:00:00`, static: true },
      answer: 'Adding a timedelta to an aware datetime does wall-clock arithmetic and keeps the same tzinfo, so 12:00 stays 12:00 local even though the offset changed. Subtracting two datetimes that share the same tzinfo object also ignores the zone and returns the wall-clock difference. To measure real elapsed time, convert both to UTC first.',
      explanation: py`These are documented rules of \`datetime\`: with the *same* tzinfo, arithmetic is naive wall-clock arithmetic; with *different* tzinfo objects, subtraction is done in UTC. The scheduling behaviour (same local time each day) is usually what people want; the measurement is what's wrong. Fix the monitor by computing in UTC, or keep timestamps in UTC everywhere except for display and local scheduling rules.`,
      whyAsked: 'A subtle real-world bug; distinguishes people who have read the semantics from people who assume aware means "always absolute".',
      mistakes: ['Assuming aware arithmetic is always absolute time', 'Blaming zoneinfo', 'Using fixed offsets for a DST zone'],
      followUps: ['How would you schedule "every 24 real hours" instead?', 'What is the fold attribute for?'],
      modelAnswer: 'Python treats arithmetic on aware datetimes that share the same tzinfo as wall-clock arithmetic. So adding one day keeps the local time at 12:00 and just recomputes the offset, which is why the job still runs at noon after the clocks change. The same rule applies to subtraction: because both values use the same ZoneInfo object, the difference is the wall-clock difference, 24 hours, even though only 23 real hours passed. When the tzinfo objects differ, or when I convert both to UTC, subtraction gives real elapsed time. So the scheduler is fine, and the monitor should convert to UTC before subtracting.',
    },
    {
      id: 'dates-and-times-timedelta-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this print?',
      code: { lang: 'python', code: py`from datetime import timedelta
print(timedelta(days=1, hours=-1), "|", timedelta(hours=-1))` },
      options: ['23:00:00 | -1:00:00', '23:00:00 | -1 day, 23:00:00', '1 day, -1:00:00 | -1:00:00', '-1:00:00 | -1 day, 23:00:00'],
      correctOption: 1,
      answer: '23:00:00 | -1 day, 23:00:00. timedelta normalises to days, seconds and microseconds, with 0 ≤ seconds < 86400; only days can be negative.',
      explanation: py`Internally \`timedelta(hours=-1)\` is \`days=-1, seconds=82800\`: minus one day plus 23 hours. The string form shows exactly that. Use \`total_seconds()\` (here \`-3600.0\`) when you need a single signed number, or \`abs(td)\` for a magnitude.`,
      whyAsked: 'Tests whether you understand how durations are represented — this output confuses people reading logs.',
      mistakes: ['Expecting a minus sign on the hours', 'Thinking timedelta stores hours and minutes separately'],
      followUps: ['How would you format a negative duration as "-01:00"?', 'What does timedelta.max look like?'],
      modelAnswer: 'It prints 23:00:00, then -1 day, 23:00:00. timedelta normalises everything into days, seconds and microseconds, and only the days part can be negative — seconds always stay between zero and a day. So one day minus an hour is simply 23 hours, and minus one hour becomes minus one day plus 23 hours. If I need a signed number I use total_seconds(), which gives -3600.0 here.',
    },
    {
      id: 'dates-and-times-elapsed',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare datetime.now(), time.time(), time.monotonic() and time.perf_counter(). Which do you use to measure how long a request took?',
      answer: 'now() and time() read the wall clock (when something happened); they can jump if the system clock is adjusted. monotonic() never goes backwards, and perf_counter() is monotonic with the highest available resolution. Measure durations with perf_counter (or monotonic for long-running timeouts).',
      explanation: py`Wall-clock time is subject to NTP corrections, manual changes and, for local naive times, DST. A request timed across an adjustment could show negative or inflated durations. Monotonic clocks have an undefined reference point, so only differences between two readings are meaningful. Use \`datetime.now(timezone.utc)\` to *timestamp* events and \`perf_counter()\` to *time* them.`,
      code: { lang: 'python', code: py`import time
start = time.perf_counter()
sum(i * i for i in range(10_000))
elapsed = time.perf_counter() - start
print(f"{elapsed * 1000:.2f} ms")` },
      whyAsked: 'Practical observability knowledge: wrong clock choice gives misleading metrics.',
      mistakes: ['Using datetime.now() for latency metrics', 'Comparing monotonic readings across processes or reboots'],
      followUps: ['Why is the reference point of monotonic() undefined?', 'What does time.process_time() measure?'],
      modelAnswer: 'datetime.now and time.time read the wall clock, which answers when something happened, but the wall clock can jump when NTP corrects it or someone changes it, so durations computed from it can be wrong or even negative. time.monotonic is guaranteed never to go backwards, and perf_counter is a monotonic clock with the best resolution available. So I timestamp events with datetime.now(timezone.utc) and measure how long a request took with perf_counter, subtracting two readings — the absolute value of a monotonic clock means nothing on its own.',
    },
    {
      id: 'dates-and-times-business-days',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `business_days(start, end)` returning the number of weekdays (Monday–Friday) in the half-open range [start, end): start included, end excluded. If end <= start, return 0.',
      answer: 'Loop from start to end with timedelta(days=1) and count dates whose weekday() < 5; or compute whole weeks × 5 plus the remaining days to be O(1).',
      explanation: py`\`date.weekday()\` returns 0 for Monday through 6 for Sunday, so \`< 5\` means a weekday. A simple loop is clear and fine for short ranges. For long ranges, count full weeks (\`days // 7 * 5\`) and loop only over the remainder (at most 6 days). Real business-day logic also needs a holiday calendar, which is data, not arithmetic.`,
      starter: { files: { 'main.py': py`from datetime import date, timedelta


def business_days(start, end):
    # TODO: count Monday-Friday dates from start (inclusive) to end (exclusive)
    return (end - start).days


print(business_days(date(2026, 4, 6), date(2026, 4, 13)))
` } },
      tests: [
        { name: 'one full week', code: py`assert business_days(date(2026, 4, 6), date(2026, 4, 13)) == 5` },
        { name: 'a weekend only', code: py`assert business_days(date(2026, 4, 11), date(2026, 4, 13)) == 0` },
        { name: 'two weeks', code: py`assert business_days(date(2026, 4, 6), date(2026, 4, 20)) == 10` },
        { name: 'Wednesday to Tuesday', code: py`assert business_days(date(2026, 4, 8), date(2026, 4, 14)) == 4` },
        { name: 'empty or reversed range', code: py`assert business_days(date(2026, 4, 13), date(2026, 4, 13)) == 0 and business_days(date(2026, 4, 20), date(2026, 4, 6)) == 0` },
      ],
      solution: { files: { 'main.py': py`from datetime import date, timedelta


def business_days(start, end):
    if end <= start:
        return 0
    total_days = (end - start).days
    full_weeks, extra = divmod(total_days, 7)
    count = full_weeks * 5
    for offset in range(extra):
        if (start + timedelta(days=full_weeks * 7 + offset)).weekday() < 5:
            count += 1
    return count


print(business_days(date(2026, 4, 6), date(2026, 4, 13)))
` } },
      hints: ['weekday() is 0 (Monday) to 6 (Sunday).', 'Every full 7-day block contains exactly 5 weekdays; only the leftover days need checking.'],
      whyAsked: 'Common scheduling/billing logic; checks date arithmetic, edge cases and an easy optimisation.',
      mistakes: ['Off-by-one on whether end is included', 'Forgetting reversed ranges', 'Ignoring that real calendars need holidays'],
      followUps: ['How would you add public holidays?', 'How would you find the next business day after a date?'],
      modelAnswer: 'weekday() gives 0 for Monday up to 6 for Sunday, so a weekday is anything below 5. The simple version loops from start to end one day at a time and counts those. To avoid looping over long ranges, I use divmod on the number of days: each full week contributes exactly five weekdays, and I only check the leftover days, at most six of them. I return zero for empty or reversed ranges. In a real system I would also subtract public holidays from a holiday calendar.',
    },
  ],

  takeaways: [
    'date, time, datetime and timedelta model days, clock times, moments and durations; all are immutable and comparable.',
    'date ± timedelta gives a date; subtracting dates/datetimes gives a timedelta. There is no month duration — use calendar.monthrange or dateutil for month rules.',
    'strftime/strptime format and parse with % codes; prefer ISO 8601 via isoformat/fromisoformat (which accepts "Z" since 3.11).',
    'Naive datetimes have no zone; aware ones are exact instants. Mixing them raises TypeError. Use datetime.now(timezone.utc), not utcnow() (deprecated in 3.12).',
    'Store and compute in UTC, convert with astimezone for display; use zoneinfo.ZoneInfo (3.9+, needs tzdata) for real places with daylight saving.',
    'Measure elapsed time with time.perf_counter()/monotonic(), and pass "now" into functions to keep them testable.',
  ],
}

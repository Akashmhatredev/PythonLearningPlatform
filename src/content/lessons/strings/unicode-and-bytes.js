// Python source as written: backslashes stay literal (\n stays \n). Only \` and \${ are unescaped.
const py = (s, ...v) => String.raw(s, ...v).replace(/\\([`$])/g, '$1')

const INSPECTOR = py`# Inspect how text becomes code points and bytes
import unicodedata


def inspect(text):
    data = text.encode("utf-8")
    points = " ".join(f"U+{ord(ch):04X}" for ch in text)
    print(f"{len(text)} chars, {len(data):>2} bytes: {text!r} = {points}")


for sample in ["cafe", "café", "café", "😀", "👍🏽"]:
    inspect(sample)

composed = "café"              # é is one code point, U+00E9
decomposed = "café"      # e followed by COMBINING ACUTE ACCENT
print("Equal as typed?    ", composed == decomposed)
nfc_a = unicodedata.normalize("NFC", composed)
nfc_b = unicodedata.normalize("NFC", decomposed)
print("Equal after NFC?   ", nfc_a == nfc_b)

data = "naïve café".encode("utf-8")
print("UTF-8 bytes:       ", data)
print("Decoded correctly: ", data.decode("utf-8"))
print("Decoded as Latin-1:", data.decode("latin-1"))
print("Bad byte, replaced:", b"caf\xe9!".decode("utf-8", errors="replace"))
`

export default {
  id: 'unicode-and-bytes',
  title: 'Unicode, encodings & bytes',
  summary: 'A str is a sequence of Unicode code points; bytes are raw 0–255 values; an encoding such as UTF-8 converts between them — decode at the edges of your program, work with str inside, and always name the encoding.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['strings-basics', 'string-methods'],
  related: ['string-formatting', 'reading-writing-files', 'csv-data', 'json-data', 'regular-expressions', 'input-validation', 'http-and-rest'],
  tags: ['unicode', 'utf-8', 'encoding', 'decoding', 'bytes', 'bytearray', 'code point', 'ord', 'chr', 'emoji', 'combining characters', 'normalization', 'NFC', 'NFKC', 'unicodedata', 'UnicodeDecodeError', 'UnicodeEncodeError', 'mojibake', 'latin-1', 'cp1252', 'BOM', 'errors=replace'],
  apis: [
    { name: 'ord(ch) / chr(n)', summary: 'Code point number of a one-character string / the character for a code point.' },
    { name: 'str.encode(encoding="utf-8", errors="strict")', summary: 'Converts text to bytes using an encoding.' },
    { name: 'bytes.decode(encoding="utf-8", errors="strict")', summary: 'Converts bytes back to text using an encoding.' },
    { name: 'bytes / b"..."', summary: 'An immutable sequence of integers 0–255; indexing returns an int.' },
    { name: 'bytearray', summary: 'A mutable version of bytes.' },
    { name: 'unicodedata.normalize(form, s)', summary: 'Converts text to a normal form: NFC, NFD, NFKC or NFKD.' },
    { name: 'unicodedata.name(ch)', summary: 'The official Unicode name of a character, e.g. LATIN SMALL LETTER E WITH ACUTE.' },
    { name: 'open(path, encoding="utf-8")', summary: 'Always name the encoding when opening text files; the default depends on the platform.' },
    { name: 'errors= handlers', summary: '"strict" raises, "replace" substitutes, "ignore" drops, "backslashreplace" escapes, "xmlcharrefreplace" (encode only).' },
  ],
  docs: [
    { label: 'Unicode HOWTO', url: 'https://docs.python.org/3/howto/unicode.html' },
    { label: 'Library reference — bytes and bytearray', url: 'https://docs.python.org/3/library/stdtypes.html#binary-sequence-types-bytes-bytearray-memoryview' },
    { label: 'codecs — error handlers and standard encodings', url: 'https://docs.python.org/3/library/codecs.html#error-handlers' },
    { label: 'unicodedata — Unicode database', url: 'https://docs.python.org/3/library/unicodedata.html' },
    { label: 'PEP 597 — EncodingWarning (3.10)', url: 'https://peps.python.org/pep-0597/' },
    { label: 'PEP 686 — make UTF-8 mode the default', url: 'https://peps.python.org/pep-0686/' },
  ],

  // ------------------------------------------------------------------ learn
  intro: [
    py`Computers only store numbers. To store text, every character needs a number, and those numbers need to be written as **bytes** (groups of 8 bits, values 0–255) to go into a file or across a network. Two separate ideas make that work:`,
    py`1. **Unicode** gives every character in every writing system a number called a **code point**: \`A\` is 65 (written \`U+0041\`), \`é\` is 233 (\`U+00E9\`), \`日\` is \`U+65E5\`, \`😀\` is \`U+1F600\`. There are over a million possible code points.
2. An **encoding** is a rule for turning code points into bytes and back. **UTF-8** is the one the web, Linux, macOS and most files use: it stores \`A\` as one byte, \`é\` as two, \`日\` as three and \`😀\` as four.`,
    py`Python keeps the two worlds apart with two types. A \`str\` is a sequence of code points — text. A \`bytes\` object is a sequence of raw byte values. You go from text to bytes with \`.encode()\` and from bytes to text with \`.decode()\`, and you always need to know *which encoding* is being used. Getting that wrong produces gibberish like \`cafÃ©\` or a \`UnicodeDecodeError\`.`,
  ],
  why: [
    py`Every time text leaves or enters your program — reading a file, receiving a web request, talking to a database, writing a CSV — it crosses the boundary between str and bytes. If the two sides disagree on the encoding, names get mangled, accented customers can't log in, and imports crash on line 40,000 of a file.`,
    py`Unicode also breaks assumptions people bring from English: \`len()\` doesn't always match what a human calls "characters", two strings that *look* identical can compare unequal, and \`upper()\` can change a string's length. Knowing why lets you write code that works for every user, not just the ones who type ASCII.`,
  ],
  eli15: [
    py`Imagine a giant phone book that gives every symbol in the world its own number: every letter of every alphabet, every Chinese character, every emoji. That phone book is **Unicode**. "A" is number 65, "é" is number 233, "😀" is number 128512.`,
    py`Now you want to send those numbers to a friend, but you can only send small boxes that each hold a number from 0 to 255. Big numbers don't fit in one box, so you need a rule for splitting them across several boxes. **UTF-8** is the most popular rule: small numbers (plain English letters) take one box, bigger ones take two, three or four.`,
    py`If your friend opens the boxes using a *different* rule, they get the wrong symbols — that's how "café" turns into "cafÃ©". So whenever you save or load text, say which rule you're using: \`encoding="utf-8"\`.`,
  ],
  analogy: {
    title: 'A world dictionary and a packing rule',
    body: [
      py`Unicode is like a world dictionary that assigns an ID number to every symbol humans write. A \`str\` is a list of those ID numbers — pure meaning, no packaging.`,
      py`An encoding is a *packing rule* for shipping those IDs in fixed-size crates (bytes). UTF-8 packs common IDs into one crate and rare ones into up to four. Encoding is packing; decoding is unpacking. Unpack with a different rule than was used to pack and you get nonsense — or the unpacker refuses (\`UnicodeDecodeError\`).`,
    ],
    mapping: [
      ['the world dictionary of symbol IDs', 'Unicode code points (U+00E9 for é)'],
      ['a list of symbol IDs', 'a str'],
      ['the packed crates', 'a bytes object'],
      ['the packing rule', 'an encoding: UTF-8, Latin-1, cp1252…'],
      ['packing', 'text.encode("utf-8")'],
      ['unpacking', 'data.decode("utf-8")'],
      ['unpacking with the wrong rule', 'mojibake (cafÃ©) or UnicodeDecodeError'],
    ],
  },
  visual: {
    type: 'concept-diagram',
    title: 'Text, code points and bytes',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'text', label: 'café', note: 'str: what you see', x: 110, y: 80, tone: 'yellow' },
        { id: 'points', label: 'U+0063 U+0061 U+0066 U+00E9', note: 'code points', x: 360, y: 80, tone: 'paper' },
        { id: 'bytes', label: "b'caf\\xc3\\xa9'", note: 'bytes (5)', x: 630, y: 80, tone: 'blue' },
        { id: 'disk', label: 'file / network', note: 'only bytes travel', x: 630, y: 240, tone: 'kraft' },
        { id: 'back', label: 'café', note: 'decoded with UTF-8', x: 360, y: 240, tone: 'yellow' },
        { id: 'moji', label: 'cafÃ©', note: 'decoded with Latin-1', x: 110, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'text', to: 'points', label: 'ord()' },
        { from: 'points', to: 'bytes', label: 'encode("utf-8")' },
        { from: 'bytes', to: 'disk', label: 'write / send' },
        { from: 'disk', to: 'back', label: 'decode("utf-8")' },
        { from: 'disk', to: 'moji', label: 'decode("latin-1")', dashed: true },
      ],
      steps: [
        { focus: ['text'], text: py`A \`str\` holds **text**. Python doesn't care how it will be stored; it's just a sequence of characters.` },
        { focus: ['text', 'points'], edges: ['text->points'], text: py`Each character is really a **code point** — a number from the Unicode standard. \`ord("é")\` is 233, written \`U+00E9\` in hexadecimal. \`len("café")\` counts these: 4.` },
        { focus: ['points', 'bytes'], edges: ['points->bytes'], text: py`To store or send text you must **encode** it. UTF-8 writes \`c\`, \`a\`, \`f\` as one byte each (they're ASCII) and \`é\` as two bytes, \`0xC3 0xA9\`. Five bytes for four characters.` },
        { focus: ['bytes', 'disk'], edges: ['bytes->disk'], text: py`Files, sockets and databases only ever see **bytes**. The bytes carry no label saying which encoding made them — that knowledge has to travel separately (a file format rule, an HTTP header, a convention).` },
        { focus: ['disk', 'back'], edges: ['disk->back'], text: py`**Decoding** with the same encoding gives the original text back exactly.` },
        { focus: ['disk', 'moji'], edges: ['disk->moji'], text: py`Decoding with the **wrong** encoding either fails with \`UnicodeDecodeError\` or "succeeds" with garbage. Latin-1 reads each byte as its own character, so \`0xC3 0xA9\` becomes \`Ã©\`. This garbage has a name: **mojibake**.` },
        { focus: ['text', 'back'], text: py`The rule that prevents all this — the **Unicode sandwich**: decode bytes to str as soon as data arrives, work only with str inside your program, encode back to bytes at the last moment. Always *name* the encoding at both edges.` },
      ],
    },
    alt: 'Diagram: the str "café" maps to code points U+0063 U+0061 U+0066 U+00E9, which encode with UTF-8 to five bytes b\'caf\\xc3\\xa9\'. The bytes travel to a file or network. Decoding them with UTF-8 gives back "café"; decoding them with Latin-1 gives the mojibake "cafÃ©".',
  },
  syntax: [
    py`#### Code points: ord, chr and escapes`,
    { code: py`print(ord("A"), ord("é"), ord("€"))    # 65 233 8364
print(chr(233), chr(0x1F600))           # é 😀
print(f"U+{ord('€'):04X}")              # U+20AC — the usual notation

print("café")                      # \u + 4 hex digits
print("\U0001F600")                     # \U + 8 hex digits (beyond U+FFFF)
print("\N{EURO SIGN} \N{GREEK SMALL LETTER ALPHA}")   # by official name`, lang: 'python', title: 'every character is a number' },
    py`#### str ↔ bytes: encode and decode`,
    { code: py`text = "café"
data = text.encode("utf-8")      # str -> bytes
print(data)                      # b'caf\xc3\xa9'
print(len(text), len(data))      # 4 5
back = data.decode("utf-8")      # bytes -> str
print(back == text)              # True`, lang: 'python', title: 'the round trip' },
    py`Mnemonic: you **en**code *into* bytes, you **de**code bytes back *out* to text. Calling \`.decode()\` on a str (or \`.encode()\` on bytes) raises \`AttributeError\` — Python 3 keeps the directions strict on purpose.`,
    py`#### The bytes type`,
    { code: py`data = b"hello"            # bytes literal: ASCII characters only
print(data[0])             # 104 — indexing gives an int, not a character!
print(data[:2])            # b'he' — slicing gives bytes
print(list(b"hi"))         # [104, 105]
print(bytes([104, 105]))   # b'hi'
print(data.hex(" "))       # 68 65 6c 6c 6f — handy for inspecting

buffer = bytearray(b"cat")  # bytearray is the mutable version
buffer[0] = ord("b")
print(buffer)               # bytearray(b'bat')`, lang: 'python', title: 'bytes behave like a sequence of small ints' },
    py`Bytes outside the ASCII range are shown as \`\xNN\` escapes. \`b"café"\` is a \`SyntaxError\` (\`bytes can only contain ASCII literal characters\`) — write \`"café".encode("utf-8")\` instead. Mixing the types fails loudly: \`"abc" + b"abc"\` raises \`TypeError\`.`,
    py`#### How many bytes does UTF-8 use?`,
    py`| code points | bytes in UTF-8 | examples |
|---|---|---|
| U+0000 – U+007F | 1 | ASCII: \`A\`, \`7\`, \`!\` |
| U+0080 – U+07FF | 2 | \`é\`, \`ß\`, \`Ω\`, Arabic, Hebrew |
| U+0800 – U+FFFF | 3 | \`€\`, \`日\`, most Chinese/Japanese/Korean |
| U+10000 – U+10FFFF | 4 | \`😀\`, many emoji, historic scripts |`,
    py`#### len() counts code points, not "characters you see"`,
    { code: py`print(len("😀"))          # 1 — one code point
print(len("👍🏽"))          # 2 — thumbs up + a skin-tone modifier
print(len("🇬🇧"))          # 2 — two "regional indicator" letters make a flag
print(len("é"))      # 2 — e + a combining accent, displayed as é`, lang: 'python', title: 'surprising lengths' },
    py`What a person sees as one symbol is called a **grapheme cluster**. It can be made of several code points. Python's standard library counts code points; counting graphemes needs a third-party library (for example the \`regex\` module's \`\X\` pattern).`,
    py`#### Normalisation: same look, different code points`,
    { code: py`import unicodedata

composed = "café"        # é as ONE code point
decomposed = "café"     # e + COMBINING ACUTE ACCENT
print(composed == decomposed)                       # False!
print(unicodedata.normalize("NFC", decomposed) == composed)   # True
print(unicodedata.name("́"))                   # COMBINING ACUTE ACCENT

print(unicodedata.normalize("NFKC", "ﬁ ① ＡＢＣ"))  # fi 1 ABC`, lang: 'python', title: 'NFC, NFD, NFKC' },
    py`- **NFC** (composed) — combine letters and accents where possible. The usual choice for storing and comparing text.
- **NFD** (decomposed) — split them apart. Useful for stripping accents (remove the combining marks).
- **NFKC / NFKD** — also replace "compatibility" look-alikes: ligatures, circled digits, full-width letters. Good for identifiers and search keys; too aggressive for storing what a user wrote.`,
    py`#### When encoding or decoding fails: errors=`,
    { code: py`bad = b"caf\xe9!"                 # Latin-1 bytes, not valid UTF-8
print(bad.decode("utf-8", errors="replace"))          # caf�!   (U+FFFD)
print(bad.decode("utf-8", errors="backslashreplace")) # caf\xe9!
print(bad.decode("latin-1"))                          # café!   (the right encoding)

print("café".encode("ascii", errors="replace"))           # b'caf?'
print("café".encode("ascii", errors="xmlcharrefreplace")) # b'caf&#233;'`, lang: 'python', title: 'error handlers' },
    py`The default, \`errors="strict"\`, raises \`UnicodeDecodeError\`/\`UnicodeEncodeError\` — usually what you want, because it tells you something is wrong. \`"replace"\` keeps going but marks damage with \`�\`. \`"ignore"\` **silently deletes** data; avoid it unless you know exactly which bytes it will drop.`,
    py`#### Files: always name the encoding`,
    { code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.write("Zoë\nJosé\n")

with open("names.txt", encoding="utf-8") as f:
    print(f.read())

with open("names.txt", encoding="latin-1") as f:   # wrong encoding
    print(f.read())                                 # ZoÃ« / JosÃ©`, lang: 'python', title: 'encoding= on every open()' },
    py`Without \`encoding=\`, \`open()\` uses the platform's *locale* encoding, which differs between machines (historically cp1252 on many Windows systems, UTF-8 on Linux and macOS). Code that works on your laptop can then fail or corrupt data on a colleague's. See [reading & writing files](lesson:reading-writing-files).`,
    { callout: 'version', title: 'Encoding defaults across versions', text: py`Python 3.7 added *UTF-8 mode* (\`python -X utf8\` or \`PYTHONUTF8=1\`, PEP 540). Python 3.10 added \`EncodingWarning\` (enable with \`-X warn_default_encoding\`, PEP 597) to find \`open()\` calls without an encoding, and \`encoding="locale"\` to request the locale encoding explicitly. PEP 686 makes UTF-8 mode the default, planned for Python 3.15. Until every machine runs such a version, write \`encoding="utf-8"\` yourself.` },
  ],
  walkthrough: {
    title: 'Reading the text inspector line by line',
    lang: 'python',
    code: INSPECTOR,
    intro: py`This is the program in the playground below. Press **Guide** there to follow these steps inside the editor.`,
    steps: [
      { lines: [5, 8], text: py`\`inspect\` encodes the text to UTF-8 bytes, then builds the list of code points: \`ord(ch)\` gives each character's number and \`:04X\` formats it as at least 4 uppercase hex digits — the standard \`U+00E9\` notation.` },
      { lines: [11, 12], text: py`Five samples: plain ASCII, \`é\` as one code point, \`e\` plus a combining accent (\`́\` in the source), an emoji, and an emoji with a skin-tone modifier. Compare the \`chars\` and \`bytes\` counts.` },
      { lines: [14, 16], text: py`\`composed\` and \`decomposed\` *display* identically, but they are different code point sequences, so \`==\` is \`False\`.` },
      { lines: [17, 19], text: py`NFC normalisation turns both into the composed form, after which they compare equal. Normalise before comparing or storing user text.` },
      { lines: [21, 24], text: py`Encoding then decoding with UTF-8 round-trips perfectly. Decoding the same bytes as Latin-1 "works" but produces mojibake: every byte becomes its own character.` },
      { lines: [25], text: py`\`b"caf\xe9!"\` is Latin-1 data, not valid UTF-8. With \`errors="replace"\` the bad byte becomes \`�\` (U+FFFD, the replacement character) instead of raising.` },
    ],
  },
  playground: {
    title: 'Text inspector',
    objective: 'Run it, compare characters vs bytes for each sample, then repair broken text and choose the right encodings.',
    files: { 'main.py': INSPECTOR },
    expected: py`\`\`\`text
4 chars,  4 bytes: 'cafe' = U+0063 U+0061 U+0066 U+0065
4 chars,  5 bytes: 'café' = U+0063 U+0061 U+0066 U+00E9
5 chars,  6 bytes: 'café' = U+0063 U+0061 U+0066 U+0065 U+0301
1 chars,  4 bytes: '😀' = U+1F600
2 chars,  8 bytes: '👍🏽' = U+1F44D U+1F3FD
Equal as typed?     False
Equal after NFC?    True
UTF-8 bytes:        b'na\xc3\xafve caf\xc3\xa9'
Decoded correctly:  naïve café
Decoded as Latin-1: naÃ¯ve cafÃ©
Bad byte, replaced: caf�!
\`\`\`

Lines 2 and 3 *look* the same but have different code points.`,
    experiments: [
      {
        id: 'japanese',
        task: py`Add the Japanese word \`"日本"\` (Japan) to the samples. **Before running**, predict its number of characters and UTF-8 bytes.`,
        hint: py`Look at the UTF-8 table in the syntax section: characters between U+0800 and U+FFFF take 3 bytes each.`,
        tests: [
          { name: 'the new sample is inspected', code: py`assert "U+65E5 U+672C" in output, 'Add "日本" to the samples list'` },
          { name: '2 characters, 6 bytes', code: py`assert "2 chars,  6 bytes: '日本'" in output` },
        ],
        explain: py`Each of these characters is in the U+0800–U+FFFF range, so UTF-8 uses 3 bytes per character: 2 characters, 6 bytes. In UTF-16 they would take 2 bytes each — encodings really differ in size, and none is best for every language.`,
      },
      {
        id: 'fix-mojibake',
        task: py`A database exported \`garbled = "cafÃ©"\`. Someone decoded UTF-8 bytes as Latin-1. Add that line, then reverse the mistake and store the repaired text in \`fixed\`.`,
        hint: py`Undo the wrong step, then do the right one: encode with the encoding that was wrongly used (\`"latin-1"\`), then decode as \`"utf-8"\`.`,
        tests: [
          { name: 'fixed is "café"', code: py`assert ns.get('fixed') == "café", 'fixed = garbled.encode("latin-1").decode("utf-8")'` },
        ],
        explain: py`Mojibake is usually reversible: encoding with the wrong codec gets the original bytes back, and decoding them with the right codec gives the real text. It only works if nothing was lost in between (e.g. by \`errors="ignore"\`). Real-world repair tools like the third-party \`ftfy\` package automate this guesswork.`,
      },
      {
        id: 'legacy-file',
        task: py`An old system sends \`legacy = b"caf\xe9 cr\xe8me"\`. Decoding it as UTF-8 raises \`UnicodeDecodeError\`. Find an encoding that decodes it correctly and store the result in \`text\`.`,
        hint: py`Each accented letter is a single byte above 127, so this is a one-byte-per-character encoding. Try \`legacy.decode("latin-1")\`.`,
        tests: [
          { name: 'text is "café crème"', code: py`assert ns.get('text') == "café crème"` },
        ],
        explain: py`Latin-1 (ISO-8859-1) maps each byte straight to code point 0–255, so \`0xE9\` is \`é\` and \`0xE8\` is \`è\`. Latin-1 can decode *any* byte sequence without error — which is exactly why "it didn't crash" never proves you chose the right encoding. The real fix is to know (or be told) the encoding.`,
      },
      {
        id: 'ascii-only',
        task: py`A legacy system only accepts ASCII. Create \`ascii_bytes\` by encoding \`"café"\` to ASCII so that the \`é\` becomes the HTML entity \`&#233;\`.`,
        hint: py`Use \`errors="xmlcharrefreplace"\` with \`.encode("ascii", ...)\`.`,
        tests: [
          { name: 'ascii_bytes is b"caf&#233;"', code: py`assert ns.get('ascii_bytes') == b"caf&#233;"` },
        ],
        explain: py`\`xmlcharrefreplace\` (encoding only) replaces each unencodable character with \`&#NNN;\`, its code point in decimal — something HTML and XML readers understand. Compare \`errors="replace"\`, which gives \`b"caf?"\` and loses the information.`,
      },
    ],
  },
  animation: {
    type: 'code-tracer',
    title: 'str and bytes are different objects',
    props: {
      code: py`word = "café"
data = word.encode("utf-8")
print(len(word), len(data))
print(data[3], data[4])
back = data.decode("utf-8")
print(back == word)
wrong = data.decode("latin-1")
print(wrong, len(wrong))
`,
      inline: false,
      notes: {
        1: 'A str object with 4 code points.',
        2: '`encode` builds a separate **bytes** object of 5 bytes. The str is unchanged.',
        3: '4 code points, 5 bytes: `é` needs two bytes in UTF-8.',
        4: 'Indexing bytes gives **ints** (195 and 169 = 0xC3 and 0xA9), not characters.',
        5: '`decode` with the same encoding rebuilds an equal str.',
        7: 'Latin-1 maps every byte to one character, so the two bytes of `é` become two characters.',
        8: 'Mojibake: `cafÃ©`, now 5 characters long.',
      },
    },
    alt: 'A step-by-step trace. word is the str "café". encode creates a separate bytes object of length 5. data[3] and data[4] print 195 and 169. Decoding with UTF-8 creates a new str equal to word. Decoding with Latin-1 creates the str "cafÃ©" of length 5.',
  },

  // ------------------------------------------------------------- understand
  internals: {
    beginner: [
      py`Inside your program, text is a \`str\` and you never have to think about bytes. Bytes appear at the **edges**: files, network connections, databases, subprocesses, binary formats. The single most useful habit is the *Unicode sandwich*:`,
      py`1. **Decode** bytes to str as early as possible (when reading).
2. Work with **str** everywhere inside.
3. **Encode** str to bytes as late as possible (when writing).`,
      py`Most of the time the library does steps 1 and 3 for you — \`open(..., encoding="utf-8")\` in text mode, \`json.loads\`, the database driver — but only if it knows the right encoding.`,
    ],
    technical: [
      py`**How UTF-8 works.** A code point below 128 is stored as one byte that looks exactly like ASCII — so every ASCII file is already valid UTF-8. Larger code points use a *lead byte* that says how many bytes follow (\`110xxxxx\` = 2, \`1110xxxx\` = 3, \`11110xxx\` = 4) and *continuation bytes* of the form \`10xxxxxx\`. The code point's bits are spread over the \`x\` positions.`,
      { code: py`for ch in ["A", "é", "€", "😀"]:
    data = ch.encode("utf-8")
    bits = " ".join(f"{byte:08b}" for byte in data)
    print(f"{ch} U+{ord(ch):04X} -> {bits}")`, lang: 'python', title: 'see the bit patterns' },
      py`That design makes UTF-8 *self-synchronising*: from any byte you can tell whether it starts a character, so a decoder can recover after damage and a search for an ASCII byte (\`,\`, \`\n\`) never matches the middle of a multi-byte character. It's also why error messages say "invalid continuation byte" or "unexpected end of data": a lead byte promised more bytes than arrived.`,
      py`**Other encodings.** Latin-1 maps bytes 0–255 directly to code points 0–255 — it can decode anything, which makes it dangerous as a guess. cp1252 ("Windows-1252") is Latin-1 with curly quotes and \`€\` in the 0x80–0x9F range; it's the usual culprit behind \`â€™\` in place of \`’\`. UTF-16 uses 2 or 4 bytes per code point and needs a byte-order mark or a declared endianness. **UTF-8 with BOM** (\`"utf-8-sig"\`) starts with the bytes \`EF BB BF\`; Excel often writes it, and decoding such a CSV with plain \`"utf-8"\` leaves a stray \`﻿\` at the start of the first column name.`,
      py`**Surrogates.** Code points U+D800–U+DFFF are reserved for UTF-16's internal use and are not real characters. A Python \`str\` can contain them (for example via the \`surrogateescape\` error handler, which smuggles undecodable bytes through as lone surrogates), but encoding them as UTF-8 fails: \`'utf-8' codec can't encode character '\ud800' ... surrogates not allowed\`.`,
      { callout: 'note', title: 'CPython detail', text: py`In memory, CPython does **not** store strings as UTF-8. It uses 1, 2 or 4 bytes per code point depending on the widest character in each string (PEP 393), which keeps indexing fast. \`str.encode("utf-8")\` therefore really converts. CPython also caches a UTF-8 copy for some C-API uses. Python source files are read as UTF-8 by default (PEP 3120). Other implementations may represent strings differently; only the str/bytes behaviour above is guaranteed.` },
    ],
    production: [
      py`**Name the encoding everywhere.** \`open(path, encoding="utf-8")\`, \`subprocess.run(..., encoding="utf-8")\`, \`Path.read_text(encoding="utf-8")\`. Enable \`-X warn_default_encoding\` in CI to catch missing ones. For CSV files from Excel, \`encoding="utf-8-sig"\` strips the BOM.`,
      py`**Don't guess silently.** If you must accept files of unknown encoding, try UTF-8 strictly first and fall back to a declared alternative, logging which one was used. Heuristic detectors (the third-party \`charset-normalizer\` package) are guesses, not facts. Never "fix" decode errors with \`errors="ignore"\` — it deletes data quietly.`,
      py`**Normalise identifiers, keep what users typed.** For usernames, search keys and de-duplication, compare \`unicodedata.normalize("NFKC", s).casefold()\`. Store the original for display. Normalisation does **not** stop look-alike (homoglyph) attacks — Latin \`a\` and Cyrillic \`а\` are different letters that look identical — so security-sensitive identifiers often restrict the allowed scripts. See [input validation](lesson:input-validation).`,
      py`**Limits are in bytes, not characters.** Database columns, HTTP headers, SMS messages and filesystem names often limit *bytes*. A 255-character name in Japanese can be 765 UTF-8 bytes. Truncate on encoded length, without cutting a character in half (the first exercise below).`,
    ],
  },
  mistakes: [
    {
      title: 'Opening text files without an encoding',
      wrong: { code: py`with open("customers.csv") as f:       # encoding depends on the machine
    rows = f.read()`, lang: 'python', static: true },
      right: { code: py`with open("customers.csv", "w", encoding="utf-8") as f:
    f.write("name\nZoë\n")
with open("customers.csv", encoding="utf-8") as f:
    rows = f.read()
print(rows)`, lang: 'python' },
      explanation: py`The default encoding comes from the operating system's locale. Name it explicitly so the program behaves the same everywhere.`,
    },
    {
      title: 'Using str() on bytes instead of decode()',
      wrong: { code: py`data = "café".encode("utf-8")
text = str(data)
print(text)        # b'caf\xc3\xa9' — the repr, quotes and all`, lang: 'python' },
      right: { code: py`data = "café".encode("utf-8")
text = data.decode("utf-8")
print(text)        # café`, lang: 'python' },
      explanation: py`\`str(some_bytes)\` doesn't decode; it returns the *printed representation*, including \`b'...'\`. Always use \`.decode(encoding)\`.`,
    },
    {
      title: 'Hiding decode errors with errors="ignore"',
      wrong: { code: py`raw = b"Jos\xe9 Garc\xeda"                # Latin-1 data
print(raw.decode("utf-8", errors="ignore"))   # Jos Garca — letters silently gone`, lang: 'python' },
      right: { code: py`raw = b"Jos\xe9 Garc\xeda"
print(raw.decode("latin-1"))                  # José García — the real encoding`, lang: 'python' },
      explanation: py`A decode error means "you have the wrong encoding" (or corrupt data). Find the right encoding; if you must continue past bad bytes, use \`"replace"\` so the damage stays visible.`,
    },
    {
      title: 'Comparing text without normalising',
      wrong: { code: py`typed = "José"        # from a Mac keyboard: e + combining accent
stored = "José"            # from the database: precomposed é
print(typed == stored)      # False — login fails`, lang: 'python' },
      right: { code: py`import unicodedata
typed = "José"
stored = "José"
same = unicodedata.normalize("NFC", typed) == unicodedata.normalize("NFC", stored)
print(same)                 # True`, lang: 'python' },
      explanation: py`Different keyboards, operating systems and copy-paste sources can produce different code point sequences for the same visible text. Normalise to one form (usually NFC) at the boundary.`,
    },
    {
      title: 'Truncating by characters when the limit is in bytes',
      wrong: { code: py`name = "日本語のファイル名" * 30
short = name[:255]                         # 255 characters…
print(len(short.encode("utf-8")))          # …but 765 bytes`, lang: 'python' },
      right: { code: py`name = "日本語のファイル名" * 30
short = name.encode("utf-8")[:255].decode("utf-8", errors="ignore")
print(len(short.encode("utf-8")))          # at most 255 bytes, no broken character`, lang: 'python' },
      explanation: py`Slicing a str counts code points. When the limit is in bytes, slice the encoded bytes; \`errors="ignore"\` here only drops a trailing *partial* character created by the cut, because the rest of the data is valid UTF-8.`,
    },
    {
      title: 'Indexing bytes and expecting a character',
      wrong: { code: py`header = b"GIF89a"
if header[0] == "G":        # never true: header[0] is the int 71
    print("a GIF")`, lang: 'python' },
      right: { code: py`header = b"GIF89a"
if header.startswith(b"GIF"):
    print("a GIF")`, lang: 'python' },
      explanation: py`Indexing \`bytes\` returns an \`int\`. Compare with \`ord("G")\`, slice (\`header[:1] == b"G"\`) or use bytes methods with bytes arguments.`,
    },
  ],
  debugging: [
    {
      symptom: py`UnicodeDecodeError: 'utf-8' codec can't decode byte 0xe9 in position 3: invalid continuation byte`,
      cause: py`The data isn't UTF-8 — often Latin-1/cp1252 from an old system or Excel on Windows. \`0xE9\` is \`é\` in those encodings.`,
      fix: py`Find out the real encoding (ask the source, check headers/docs) and decode with it, e.g. \`encoding="cp1252"\`. Look at the bytes around the position with \`data[pos-10:pos+10]\`.`,
    },
    {
      symptom: py`UnicodeEncodeError: 'ascii' codec can't encode character '\xe9' in position 3: ordinal not in range(128)`,
      cause: py`Text with non-ASCII characters is being written to something configured for ASCII: an explicit \`encode("ascii")\`, a file opened with \`encoding="ascii"\`, or an old terminal/locale.`,
      fix: py`Use UTF-8 (\`encoding="utf-8"\`). If the target truly only accepts ASCII, choose a deliberate handler such as \`errors="xmlcharrefreplace"\` or transliterate.`,
    },
    {
      symptom: py`Text shows up as cafÃ© or Itâ€™s (mojibake)`,
      cause: py`UTF-8 bytes were decoded as Latin-1 or cp1252 somewhere along the way.`,
      fix: py`Fix the decoding step so it uses UTF-8. To repair already-damaged text: \`text.encode("cp1252").decode("utf-8")\` (or the third-party \`ftfy\` library).`,
    },
    {
      symptom: py`The first CSV column is called '﻿id' instead of 'id'`,
      cause: py`The file starts with a UTF-8 byte-order mark (BOM), typical of Excel exports, and was decoded with plain \`"utf-8"\`.`,
      fix: py`Open it with \`encoding="utf-8-sig"\`, which removes the BOM if present.`,
    },
    {
      symptom: py`TypeError: can only concatenate str (not "bytes") to str`,
      cause: py`A \`str\` and a \`bytes\` value were mixed, e.g. data read from a socket or a file opened in binary mode (\`"rb"\`).`,
      fix: py`Decode the bytes at the boundary (\`data.decode("utf-8")\`), or open the file in text mode with an encoding.`,
    },
    {
      symptom: py`SyntaxError: bytes can only contain ASCII literal characters`,
      cause: py`A bytes literal like \`b"café"\` contains a non-ASCII character.`,
      fix: py`Encode a str instead (\`"café".encode("utf-8")\`) or write the bytes as escapes (\`b"caf\xc3\xa9"\`).`,
    },
  ],
  bestPractices: [
    'Follow the Unicode sandwich: decode on input, use str inside, encode on output.',
    'Always pass encoding="utf-8" (or the known encoding) to open(), read_text(), subprocess and similar APIs.',
    'Default to UTF-8 for everything you create; use "utf-8-sig" to read files that may start with a BOM.',
    'Let decode errors surface (errors="strict"); use "replace" when you must continue, never "ignore" to hide problems.',
    'Normalise text (NFC for storage, NFKC + casefold for identifiers and search keys) before comparing.',
    'Remember len() counts code points, not graphemes and not bytes — check byte limits on the encoded data.',
    'Use repr() and .hex(" ") to see exactly what text or bytes you have when debugging.',
  ],
  useCases: [
    'Reading and writing text files and CSVs that contain names in any language.',
    'Handling HTTP requests and responses, where bodies are bytes and headers declare the charset.',
    'Enforcing byte limits for database columns, file names or SMS messages.',
    'Comparing and de-duplicating user-typed names, emails and search terms.',
    'Repairing mojibake in data exported by legacy systems.',
    'Working with binary data: file signatures, hashes, network protocols (bytes).',
  ],
  comparison: {
    title: 'str vs bytes',
    headers: ['', 'str', 'bytes'],
    rows: [
      ['holds', 'Unicode code points (text)', 'integers 0–255 (raw data)'],
      ['literal', '"café"', 'b"caf\\xc3\\xa9" (ASCII characters only)'],
      ['s[0] returns', 'a one-character str', 'an int'],
      ['convert', '.encode(encoding) → bytes', '.decode(encoding) → str'],
      ['len() counts', 'code points', 'bytes'],
      ['mutable version', 'none (use a list and join)', 'bytearray'],
      ['use for', 'everything a human reads', 'files in "rb"/"wb" mode, sockets, hashing, binary formats'],
    ],
    note: py`They never mix: \`"a" + b"a"\` raises \`TypeError\`, and \`"a" == b"a"\` is simply \`False\`. Run Python with \`-b\` to get a \`BytesWarning\` for such comparisons.`,
  },

  // ------------------------------------------------------------------- quiz
  quiz: [
    {
      id: 'unicode-and-bytes-q1',
      type: 'mcq',
      prompt: py`What does \`"é".encode("utf-8")\` return?`,
      options: [
        "b'\\xc3\\xa9'",
        { text: "b'\\xe9'", why: 'That is the Latin-1 encoding of é. UTF-8 needs two bytes for code points from U+0080 to U+07FF.' },
        { text: "'é'", why: 'encode always returns bytes, never a str.' },
        { text: '233', why: '233 is ord("é"), the code point — not its encoded bytes.' },
      ],
      answer: 0,
      explanation: py`\`é\` is U+00E9. UTF-8 stores code points between U+0080 and U+07FF in two bytes; for \`é\` they are \`0xC3 0xA9\`.`,
    },
    {
      id: 'unicode-and-bytes-q2',
      type: 'output',
      prompt: 'What does this print?',
      code: py`word = "café"
print(len(word), len(word.encode("utf-8")))`,
      answer: '4 5',
      accept: ['4 5'],
      explanation: py`\`len\` on a str counts code points (4). The UTF-8 encoding uses one byte each for \`c\`, \`a\`, \`f\` and two for \`é\` (5).`,
    },
    {
      id: 'unicode-and-bytes-q3',
      type: 'output',
      prompt: py`\`s\` displays as "é" on screen. What does this print?`,
      code: py`s = "é"
print(len(s), s == "é")`,
      options: [
        { text: '1 True', why: 'It looks like one character, but it is two code points: e and a combining accent.' },
        '2 False',
        { text: '2 True', why: 'The literal "é" here is the single code point U+00E9, a different sequence — == compares code points, not appearance.' },
        { text: '1 False', why: 'len counts code points, and s has two.' },
      ],
      answer: 1,
      explanation: py`\`"é"\` is \`e\` followed by U+0301 COMBINING ACUTE ACCENT: two code points. The precomposed \`"é"\` is one. They look identical but differ until you normalise both with \`unicodedata.normalize("NFC", ...)\`.`,
    },
    {
      id: 'unicode-and-bytes-q4',
      type: 'bug',
      prompt: 'This prints `ZoÃ«` instead of `Zoë`. Click the line that causes it.',
      code: py`with open("names.txt", "w", encoding="utf-8") as f:
    f.write("Zoë\n")
with open("names.txt", encoding="latin-1") as f:
    print(f.read())`,
      answerLine: 3,
      explanation: py`The file was written as UTF-8 but read back as Latin-1, so the two bytes of \`ë\` become two separate characters. Read with the same encoding you wrote: \`encoding="utf-8"\`.`,
    },
    {
      id: 'unicode-and-bytes-q5',
      type: 'fill',
      prompt: 'Complete the round trip: text → bytes → text.',
      code: py`data = "naïve".___("utf-8")
text = data.___("utf-8")
print(text)`,
      answer: [['encode'], ['decode']],
      explanation: py`You **en**code text into bytes and **de**code bytes back into text. str has no \`decode\` method and bytes has no \`encode\` method.`,
    },
    {
      id: 'unicode-and-bytes-q6',
      type: 'mcq',
      prompt: py`Which \`errors=\` handler is the most dangerous default choice, because it can lose data **without any visible sign**?`,
      options: [
        { text: '"strict"', why: 'strict raises an exception — the opposite of silent.' },
        { text: '"replace"', why: 'replace substitutes � (or ?), which keeps the damage visible.' },
        '"ignore"',
        { text: '"backslashreplace"', why: 'backslashreplace keeps the bad bytes as visible escape sequences like \\xe9.' },
      ],
      answer: 2,
      explanation: py`\`"ignore"\` simply drops whatever it can't handle — \`b"Jos\xe9".decode("utf-8", errors="ignore")\` gives \`"Jos"\`. Nobody notices until a customer's name is wrong.`,
    },
    {
      id: 'unicode-and-bytes-q7',
      type: 'short',
      prompt: 'Why should you always pass `encoding="utf-8"` when opening text files?',
      answer: py`Without it, open() uses the platform's locale encoding, which differs between machines (often cp1252 on older Windows setups, UTF-8 on Linux/macOS). The same program can then corrupt or fail to read files on another computer. Naming the encoding makes reading and writing deterministic everywhere. (Python 3.10's EncodingWarning helps find missing ones; PEP 686 plans to make UTF-8 the default.)`,
    },
  ],

  // -------------------------------------------------------------- exercises
  exercises: [
    {
      id: 'truncate-utf8',
      title: 'Truncate to a byte limit',
      difficulty: 'intermediate',
      prompt: py`A database column stores at most \`max_bytes\` bytes of UTF-8. Write \`truncate_utf8(text, max_bytes)\` that returns the **longest prefix** of \`text\` whose UTF-8 encoding fits in \`max_bytes\` — **without cutting a character in half**.

\`\`\`text
truncate_utf8("café", 5)    ->  "café"   (exactly 5 bytes)
truncate_utf8("café", 4)    ->  "caf"    (é needs 2 bytes; only 1 left)
truncate_utf8("😀😀", 5)    ->  "😀"     (each emoji is 4 bytes)
truncate_utf8("abc", 10)    ->  "abc"
\`\`\`

The result must be a \`str\`.`,
      files: {
        'main.py': py`def truncate_utf8(text, max_bytes):
    # TODO: limit by UTF-8 bytes, not by characters
    return text[:max_bytes]


print(truncate_utf8("café", 4))
print(truncate_utf8("😀😀", 5))
`,
      },
      hints: [
        'The limit is in bytes, so work on text.encode("utf-8") rather than on text.',
        'Slicing the bytes may cut the last character in half. Decoding that with errors="strict" fails — which error handler drops an incomplete trailing sequence?',
        'return text.encode("utf-8")[:max_bytes].decode("utf-8", errors="ignore")',
      ],
      solution: {
        explanation: py`Encoding gives the real byte count, and slicing the bytes enforces the limit. The only possible damage is at the end: the slice may stop in the middle of a multi-byte character. Because the input came from a valid str, *every other byte is valid UTF-8*, so \`errors="ignore"\` drops exactly that incomplete tail and nothing else — a rare case where "ignore" is safe and deliberate. (Limitation: a combining accent or emoji modifier can still be separated from its base character; grapheme-aware truncation needs a library such as \`regex\`.)`,
        files: {
          'main.py': py`def truncate_utf8(text, max_bytes):
    data = text.encode("utf-8")[:max_bytes]
    # Only a trailing, incomplete character can be invalid here.
    return data.decode("utf-8", errors="ignore")


print(truncate_utf8("café", 4))
print(truncate_utf8("😀😀", 5))
`,
        },
      },
      tests: [
        { name: 'fits exactly', code: py`assert truncate_utf8("café", 5) == "café"` },
        { name: 'does not split é', code: py`assert truncate_utf8("café", 4) == "caf"` },
        { name: 'does not split an emoji', code: py`assert truncate_utf8("😀😀", 5) == "😀"` },
        { name: 'short text is unchanged', code: py`assert truncate_utf8("abc", 10) == "abc"` },
        { name: 'result always fits the limit', code: py`assert len(truncate_utf8("日本語テキスト", 10).encode("utf-8")) <= 10` },
      ],
    },
    {
      id: 'same-text',
      title: 'Compare names like a human would',
      difficulty: 'intermediate',
      prompt: py`Write \`same_text(a, b)\` that returns \`True\` when two strings are equal **ignoring case** and **ignoring how accents were encoded** (composed \`é\` vs \`e\` + combining accent).

\`\`\`text
same_text("Café", "café")    ->  True    (composed vs decomposed é)
same_text("Straße", "STRASSE")     ->  True    (casefolding)
same_text("ÉCOLE", "école")  ->  True
same_text("resume", "résumé")      ->  False   (different letters)
\`\`\`

Use \`unicodedata.normalize\` and \`str.casefold\`.`,
      files: {
        'main.py': py`import unicodedata


def same_text(a, b):
    # TODO: normalise and casefold both strings before comparing
    return a == b


print(same_text("Café", "café"))
print(same_text("Straße", "STRASSE"))
`,
      },
      hints: [
        'Write a small helper that turns a string into a comparison "key", then compare the keys.',
        'casefold() handles case (including ß → ss); normalize("NFC", ...) makes composed and decomposed accents identical.',
        'def key(s): return unicodedata.normalize("NFC", s.casefold()) — then return key(a) == key(b)',
      ],
      solution: {
        explanation: py`Two independent differences have to be removed. \`casefold()\` removes case differences — more thoroughly than \`lower()\`, so \`ß\` matches \`SS\`. \`normalize("NFC", ...)\` rewrites every "letter + combining accent" pair into the single precomposed code point where one exists, so both spellings of \`é\` become identical. Comparing the resulting keys answers "would a human say these are the same text?". (The Unicode standard's precise recipe for caseless matching is \`NFD(casefold(NFD(s)))\`; normalising after casefolding, as here, gives the same answer for everyday text.)`,
        files: {
          'main.py': py`import unicodedata


def same_text(a, b):
    def key(s):
        return unicodedata.normalize("NFC", s.casefold())

    return key(a) == key(b)


print(same_text("Café", "café"))
print(same_text("Straße", "STRASSE"))
`,
        },
      },
      tests: [
        { name: 'composed vs decomposed é', code: py`assert same_text("Café", "café") is True` },
        { name: 'ß matches SS', code: py`assert same_text("Straße", "STRASSE") is True` },
        { name: 'uppercase accented vs decomposed lowercase', code: py`assert same_text("ÉCOLE", "école") is True` },
        { name: 'different letters stay different', code: py`assert same_text("resume", "résumé") is False` },
      ],
    },
  ],

  // -------------------------------------------------------------- interview
  interview: [
    {
      id: 'unicode-and-bytes-str-vs-bytes',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between str and bytes in Python 3, and where in a program should conversions between them happen?',
      answer: 'str is a sequence of Unicode code points (text); bytes is a sequence of integers 0–255 (raw data). You convert with encode/decode and an encoding such as UTF-8. Do it at the boundaries: decode input early, work with str inside, encode output late — the "Unicode sandwich".',
      explanation: py`Python 3 separates text from binary data so that mixing them is an immediate \`TypeError\` instead of silent corruption. Files in text mode, \`json\`, HTTP libraries and database drivers usually do the decoding for you, provided they know the encoding. Inside the program everything should be \`str\`; bytes belong to I/O and binary formats (images, hashes, protocols).`,
      whyAsked: 'Encoding bugs are among the most common production issues around I/O; this checks the basic mental model.',
      mistakes: ['Saying a str is "UTF-8 text" (UTF-8 is one possible byte encoding, not what a str is)', 'Converting back and forth repeatedly in the middle of the program', 'Using str(b) to "convert" bytes'],
      followUps: ['What does open() do in text mode?', 'What encoding would you choose for a new file format and why?'],
      modelAnswer: 'A str is text: an immutable sequence of Unicode code points, with no notion of bytes at all. bytes is binary data: a sequence of integers from 0 to 255. To cross between them you need an encoding — encode turns text into bytes, decode turns bytes into text — and I default to UTF-8. Python 3 keeps them strictly separate, so mixing them raises TypeError instead of corrupting data silently. The pattern I follow is the Unicode sandwich: decode as soon as data arrives, work with str everywhere inside, and encode only at the moment I write or send, always naming the encoding.',
    },
    {
      id: 'unicode-and-bytes-emoji-length',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this print, and why?',
      code: { lang: 'python', code: py`print(len("😀"), len("👍🏽"), len("🇬🇧"), len("👨‍👩‍👧"))` },
      options: ['1 1 1 1', '1 2 2 5', '4 8 8 18', '1 2 2 3'],
      correctOption: 1,
      answer: '1 2 2 5. len counts code points: the smiley is one; the thumbs-up has a skin-tone modifier; a flag is two regional-indicator letters; the family is three people joined by two zero-width joiners.',
      explanation: py`Each emoji is one *grapheme cluster* (one visible symbol) but may contain several code points. The family emoji is \`MAN + ZWJ + WOMAN + ZWJ + GIRL\`. In UTF-8 bytes the lengths would be 4, 8, 8 and 18. Counting user-perceived characters needs grapheme segmentation (the third-party \`regex\` module's \`\X\`), which matters for UI limits like "max 30 characters".`,
      whyAsked: 'Shows whether you know that "character" has several meanings — a source of bugs in validation and text truncation.',
      mistakes: ['Assuming len() counts what users see', 'Assuming len() counts bytes'],
      followUps: ['How would you enforce "maximum 280 characters" like a social network?', 'What is a zero-width joiner?'],
      modelAnswer: 'It prints 1 2 2 5, because len counts code points, not visible symbols. The plain smiley is a single code point. The thumbs-up is the base emoji plus a skin-tone modifier, so two. A flag is made of two regional indicator letters, G and B. The family is three person emoji glued together by two zero-width joiners, so five. What a user sees as one character is a grapheme cluster; counting those needs a library such as regex with the \\X pattern, and byte counts are different again.',
    },
    {
      id: 'unicode-and-bytes-decode-error',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A nightly import crashes with `UnicodeDecodeError: \'utf-8\' codec can\'t decode byte 0xe9 in position 18342: invalid continuation byte`. The file comes from a partner\'s Windows system. How do you investigate and fix it?',
      answer: 'The file is not UTF-8; 0xE9 is "é" in Latin-1/cp1252, so it is probably cp1252. Inspect the bytes around the position, confirm the encoding with the partner, then open the file with that encoding (or agree on UTF-8). Don\'t paper over it with errors="ignore".',
      explanation: py`"Invalid continuation byte" means a byte that started a multi-byte UTF-8 sequence was followed by something that isn't a continuation byte — typical of single-byte encodings. Reading the file in binary and printing \`data[18330:18360]\` shows the context (\`b"Jos\xe9 "\`). Latin-1 would decode anything, so it can't *prove* the encoding; cp1252 vs Latin-1 differ in the 0x80–0x9F range (curly quotes, €). The robust fix is a contract: the partner states the encoding, or switches to UTF-8. If several encodings must be accepted, try strict UTF-8 first and fall back explicitly, logging which was used.`,
      code: { lang: 'python', code: py`data = b"id,name\n7,Jos\xe9 Garc\xeda\n"   # what the partner sent
try:
    text = data.decode("utf-8")
except UnicodeDecodeError as err:
    print(err)
    print(data[err.start - 5:err.end + 5])     # context around the bad byte
    text = data.decode("cp1252")               # the confirmed encoding
print(text)` },
      whyAsked: 'A very common real-world incident; tests systematic debugging and refusal to hide data loss.',
      mistakes: ['Adding errors="ignore" and calling it fixed', 'Decoding as Latin-1 "because it never fails" without confirming', 'Not looking at the actual bytes'],
      followUps: ['What is the difference between Latin-1 and cp1252?', 'How would you make the importer accept both UTF-8 and cp1252 safely?'],
      modelAnswer: 'The message says the bytes are not valid UTF-8, and 0xE9 is a strong hint: that is é in Latin-1 and cp1252, so the partner is probably exporting Windows-1252. I would open the file in binary and print the bytes around position 18342 to see the context, and then confirm the encoding with the partner rather than guess, because Latin-1 will decode anything without complaint. The fix is to read with the agreed encoding, or better, agree that they send UTF-8. What I would not do is add errors="ignore", because that silently deletes letters from people\'s names.',
    },
    {
      id: 'unicode-and-bytes-normalization-security',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Users can choose usernames. You discover two accounts, "admin" and "ａｄｍｉｎ" (full-width letters), plus one that uses a Cyrillic "а". How would you design username handling to prevent confusion and impersonation?',
      answer: 'Compute a canonical key with NFKC normalisation plus casefold and enforce uniqueness on that key; NFKC maps full-width letters to ASCII. Normalisation does not merge different scripts, so also restrict allowed characters (e.g. a per-deployment allowed script set, or ASCII only) or use confusable detection (Unicode TS #39 skeletons). Store the original for display.',
      explanation: py`NFKC folds *compatibility* variants — full-width forms, ligatures, superscripts — into their plain equivalents, so \`"ａｄｍｉｎ"\` becomes \`"admin"\`. But Cyrillic \`а\` (U+0430) is a genuinely different letter from Latin \`a\` (U+0061); no normalisation form merges them. Defences: restrict usernames to a known script set, reject mixed-script names, or compare "confusable skeletons" per Unicode Technical Standard #39 (third-party libraries implement it). Enforce uniqueness on the canonical key with a database constraint, and apply the same canonicalisation at login.`,
      code: { lang: 'python', code: py`import unicodedata

def username_key(name):
    return unicodedata.normalize("NFKC", name).casefold()

print(username_key("ａｄｍｉｎ") == username_key("admin"))   # True
print(username_key("аdmin") == username_key("admin"))  # False: Cyrillic а` },
      whyAsked: 'Homoglyph and normalisation issues are real account-takeover and phishing vectors; this tests security thinking with Unicode.',
      mistakes: ['Believing NFKC solves homoglyphs', 'Normalising only at signup but not at login', 'Storing only the normalised form and losing the user\'s chosen display name'],
      followUps: ['Why NFKC rather than NFC for identifiers?', 'Where would you enforce uniqueness?', 'How do browsers handle look-alike domain names? (Punycode display rules)'],
      modelAnswer: 'I would separate the display name from a canonical key. The key is NFKC-normalised and casefolded, which maps full-width and other compatibility characters to their plain forms, so the full-width admin collides with admin, and I enforce uniqueness on that key with a database constraint and use the same function at login. But normalisation does not touch genuinely different letters: Cyrillic а and Latin a stay different. For that I would restrict the allowed scripts — for many products ASCII letters, digits and underscores — or reject mixed-script names, or use a confusables check based on Unicode TS 39. The user still sees the name they typed.',
    },
    {
      id: 'unicode-and-bytes-works-on-my-machine',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A script that writes a report works on your Mac, but a colleague on Windows gets `UnicodeEncodeError` when it writes a customer named "Łukasz". Nothing in the code mentions encodings. What is going on?',
      answer: 'open() without encoding= uses the locale encoding. On macOS/Linux that is usually UTF-8; on many Windows setups it is cp1252, which has no "Ł". Fix: open(path, "w", encoding="utf-8") everywhere; catch omissions with -X warn_default_encoding (3.10+); optionally run with UTF-8 mode.',
      explanation: py`Text-mode \`open()\` picks its default from \`locale.getencoding()\` (3.11+). cp1252 covers Western European letters but not Polish \`Ł\` (U+0141), so encoding fails. The deterministic fix is to pass \`encoding="utf-8"\`. \`EncodingWarning\` (PEP 597) flags every call that relies on the default. UTF-8 mode (\`-X utf8\` / \`PYTHONUTF8=1\`) changes the default for a whole process, and PEP 686 plans to make it the default in Python 3.15 — but explicit code doesn't depend on any of that.`,
      whyAsked: 'Cross-platform encoding bugs are classic "works on my machine" problems.',
      mistakes: ['Blaming the customer data', 'Fixing it with errors="ignore" (drops the Ł)', 'Changing the Windows system locale instead of the code'],
      followUps: ['What does locale.getencoding() return on your machine?', 'How would you test for this in CI?'],
      modelAnswer: 'The code relies on open()\'s default encoding, which comes from the operating system locale. On the Mac that is UTF-8, which can encode anything, but on many Windows machines it is cp1252, which simply has no Ł, so writing raises UnicodeEncodeError. The fix is to pass encoding="utf-8" to every open call so the output is the same everywhere. To find the places I missed, I would run the tests with -X warn_default_encoding, which emits an EncodingWarning for each call that relies on the default.',
    },
    {
      id: 'unicode-and-bytes-fix-mojibake',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `fix_mojibake(text)` that repairs text whose UTF-8 bytes were wrongly decoded as cp1252 ("cafÃ©" → "café", "Itâ€™s" → "It’s"). If the repair is not possible — or the text was never broken — return it unchanged.',
      answer: 'Try text.encode("cp1252").decode("utf-8"); if either step raises UnicodeError, return the original text.',
      explanation: py`Mojibake is the result of \`utf8_bytes.decode("cp1252")\`. Encoding with cp1252 recovers those bytes; decoding them as UTF-8 recovers the text. Correct text usually fails one of the steps: \`"café".encode("cp1252")\` gives \`b"caf\xe9"\`, which isn't valid UTF-8, and \`"日本"\` can't be encoded in cp1252 at all. Catching \`UnicodeError\` (the base class of both encode and decode errors) covers both. Real-world repair is messier — the third-party \`ftfy\` library handles many layered cases.`,
      starter: { files: { 'main.py': py`def fix_mojibake(text):
    # TODO: undo a wrong cp1252 decode; return text unchanged if that fails
    return text


print(fix_mojibake("cafÃ©"))
print(fix_mojibake("café"))
` } },
      tests: [
        { name: 'repairs cafÃ©', code: py`assert fix_mojibake("cafÃ©") == "café"` },
        { name: 'repairs curly apostrophes', code: py`assert fix_mojibake("Itâ€™s") == "It’s"` },
        { name: 'leaves correct accented text alone', code: py`assert fix_mojibake("café") == "café"` },
        { name: 'leaves text outside cp1252 alone', code: py`assert fix_mojibake("日本") == "日本"` },
        { name: 'leaves ASCII alone', code: py`assert fix_mojibake("plain") == "plain"` },
      ],
      solution: { files: { 'main.py': py`def fix_mojibake(text):
    try:
        return text.encode("cp1252").decode("utf-8")
    except UnicodeError:
        return text


print(fix_mojibake("cafÃ©"))
print(fix_mojibake("café"))
` } },
      hints: ['Mojibake = UTF-8 bytes decoded with the wrong codec. Reverse both steps.', 'UnicodeEncodeError and UnicodeDecodeError both inherit from UnicodeError.'],
      whyAsked: 'Practical data-cleaning task that checks you can reason about which transformation produced the bad text.',
      mistakes: ['Using latin-1 (fails on € and curly quotes, which live in cp1252\'s 0x80–0x9F range)', 'Catching bare Exception', 'Applying the repair to every string without checking'],
      followUps: ['Can this ever damage correct text?', 'How would you detect mojibake in a large dataset?'],
      modelAnswer: 'Mojibake happens when UTF-8 bytes are decoded with cp1252, so I reverse it: encode with cp1252 to get the original bytes back, then decode them as UTF-8. Text that was never broken almost always fails one of those steps — correct accented text produces bytes that are not valid UTF-8, and characters like Japanese cannot be encoded in cp1252 at all — so I catch UnicodeError, which covers both encode and decode errors, and return the input unchanged. For messy real data with several layers of damage I would reach for the ftfy library.',
    },
    {
      id: 'unicode-and-bytes-why-utf8',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Why has UTF-8 become the dominant text encoding, compared with UTF-16 or UTF-32? What are its downsides?',
      answer: 'UTF-8 is ASCII-compatible, has no byte-order issues, is compact for ASCII-heavy data such as markup and source code, and is self-synchronising, so searches for ASCII delimiters are safe. Downsides: variable length (1–4 bytes), so finding the n-th code point requires scanning, and CJK text takes 3 bytes per character versus 2 in UTF-16.',
      explanation: py`UTF-32 is fixed-width (4 bytes per code point) but wasteful. UTF-16 uses 2 bytes for the Basic Multilingual Plane and surrogate pairs (4 bytes) above it, so it is variable-length too, and it needs a byte-order mark or declared endianness. UTF-8's lead/continuation byte design means any ASCII byte in UTF-8 data really is that ASCII character, so parsers for CSV, JSON or HTTP can split on \`,\` or \`\n\` without decoding first. That's why CPython keeps its own fixed-width in-memory format (PEP 393) for fast indexing, but uses UTF-8 for source files, file names on most systems and I/O defaults.`,
      whyAsked: 'Checks depth: encodings as engineering trade-offs, not magic words.',
      mistakes: ['Saying UTF-16 is fixed-width', 'Claiming UTF-8 is always the smallest', 'Confusing Unicode (the character set) with UTF-8 (one encoding of it)'],
      followUps: ['How does CPython store str internally?', 'What is a surrogate pair?'],
      modelAnswer: 'UTF-8 won mainly because it is backwards-compatible with ASCII — every ASCII file is already valid UTF-8 — and because it has no byte-order problem. It is compact for the ASCII-heavy text that dominates the internet, like HTML, JSON and source code. Its design is also self-synchronising: a byte below 128 always means that ASCII character, so tools can split on commas or newlines without decoding. The costs are that it is variable-length, so you cannot jump to the n-th character without scanning, and East Asian text takes three bytes per character instead of two in UTF-16. UTF-16 is variable-length too, because of surrogate pairs, so it does not really buy fixed-width indexing either.',
    },
  ],

  takeaways: [
    'A str is a sequence of Unicode code points; bytes is a sequence of integers 0–255. Encode str → bytes, decode bytes → str, always naming the encoding.',
    'UTF-8 uses 1–4 bytes per code point and is ASCII-compatible; it is the right default for anything you create.',
    'len() counts code points: emoji with modifiers, flags and combining accents can be several code points — and more bytes.',
    'Text that looks identical can differ; normalise with unicodedata.normalize (NFC for storage, NFKC + casefold for keys).',
    'Decode errors mean the wrong encoding or corrupt data: find the right encoding, use "replace" if you must continue, and never hide problems with "ignore".',
    'Always pass encoding="utf-8" to open(): the default depends on the platform until UTF-8 mode becomes the default.',
  ],
}

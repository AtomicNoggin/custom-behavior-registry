# Intl Time

An HTML-first date and time formatter built with `CustomBehaviorRegistry`, using the markup demonstrated in the [Intl Time CodePen](https://codepen.io/AtomicNoggin/pen/ogLzgPW).

The behavior formats native `<time>` elements using their `datetime` value, the closest valid `lang` attribute, and `Intl.DateTimeFormat` options supplied as attributes.

```html
<section lang="en-CA">
  <time datetime="2026-08-27T19:30:00-04:00" intl-format="datetime long short">
    August 27, 2026 at 7:30 PM
  </time>

  <time datetime="2026-08-27" intl-format="date long">August 27, 2026</time>
  <time datetime="19:30" intl-format="time short">7:30 PM</time>
</section>
```

Install the optional `jsln` dependency before loading the example:

```sh
npm install jsln
```

Load the registry and a `Temporal` implementation before loading [`index.js`](index.js). The script expects `CustomBehaviorRegistry` to be globally available and registers formatting for `<time>` elements.

```html
<script type="module">
  import CustomBehaviorRegistry from "./index.js";

  window.customBehavior = new CustomBehaviorRegistry();
</script>
<script src="./examples/intl-time/index.js"></script>
```

## Formatting

`intl-format` accepts `date`, `time`, or `datetime`. Add a date style and, for `datetime`, a time style:

```html
<time datetime="2026-08-27T19:30" intl-format="datetime full short"></time>
```

When no individual fields are given, the formatter uses `short` styles.

Use `intl-skeleton` to select individual fields with a Unicode date-field skeleton:

```html
<time
  datetime="2026-08-27T19:30:45"
  intl-skeleton="EEEE, MMMM d, y HH:mm:ss"
></time>
```

| Token | `Intl.DateTimeFormat` option |
| --- | --- |
| `y`, `yy`, `yyy` | `year: "2-digit"` |
| `yyyy` | `year: "numeric"` |
| `M` | `month: "numeric"` |
| `MM` | `month: "2-digit"` |
| `MMM` | `month: "short"` |
| `MMMM` | `month: "long"` |
| `MMMMM` | `month: "narrow"` |
| `d` | `day: "numeric"` |
| `dd` | `day: "2-digit"` |
| `E`, `EE`, `EEE`, `eee` | `weekday: "short"` |
| `EEEE`, `eeee` | `weekday: "long"` |
| `EEEEE`, `eeeee` | `weekday: "narrow"` |
| `h`, `hh` | 12-hour clock (`h12`) with a numeric or two-digit hour. |
| `H`, `HH` | 24-hour clock (`h23`) with a numeric or two-digit hour. |
| `k`, `kk` | 24-hour clock (`h24`) with a numeric or two-digit hour. |
| `K`, `KK` | 12-hour clock (`h11`) with a numeric or two-digit hour. |
| `m`, `mm` | `minute: "numeric"` or `minute: "2-digit"` |
| `s`, `ss` | `second: "numeric"` or `second: "2-digit"` |
| `S`, `SS`, `SSS`, `SSSS` | `fractionalSecondDigits: 1`, `2`, or `3` (`SSS` and `SSSS` both use `3`). |
| `a`, `aa`, `aaa` | `dayPeriod: "short"` |
| `aaaa` | `dayPeriod: "long"` |
| `aaaaa` | `dayPeriod: "narrow"` |
| `z`, `zz`, `zzz` | `timeZoneName: "shortGeneric"` |
| `zzzz` | `timeZoneName: "longGeneric"` |
| `O`, `OO`, `OOO` | `timeZoneName: "shortOffset"` |
| `OOOO` | `timeZoneName: "longOffset"` |
| `G`, `GG`, `GGG` | `era: "short"` |
| `GGGG` | `era: "long"` |
| `GGGGG` | `era: "narrow"` |

Punctuation and text in single quotes are ignored. When a skeleton repeats a field, its first recognized token supplies that field's option.

Use `intl-options` for a simple `Intl.DateTimeFormat` options object. Its value is strict-mode JSLN with the outer `{}` omitted:

```html
<time
  datetime="2026-08-27T19:30:00-04:00"
  intl-options="year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Toronto',timeZoneName:'short'"
></time>
```

In JavaScript, `element.intlOptions` reads and writes the same object:

```js
element.intlOptions = { month: "long", timeZone: "America/Toronto" };
```

Explicit `intl-options` values override fields derived from `intl-skeleton`.

## Locale

The closest ancestor with a valid `lang` value controls the locale. Updating that value reformats connected time elements.

```html
<section lang="fr-CA">
  <time datetime="2026-08-27" intl-format="date long"></time>
</section>
```

## Attributes

| Attribute | Description |
| --- | --- |
| `datetime` | An ISO 8601 date, time, date-time, instant, or zoned date-time. |
| `intl-format` | `date`, `time`, or `datetime`, optionally followed by style names. |
| `intl-skeleton` | A Unicode date-field skeleton. |
| `intl-options` | A strict-mode JSLN options object without its outer `{}`. |
| `lang` | The inherited locale used for formatting. |
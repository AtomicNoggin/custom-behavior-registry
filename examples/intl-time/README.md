# Intl Time

An HTML-first date and time formatter built with `CustomBehaviorRegistry`, using the markup demonstrated in the [Intl Time CodePen](https://codepen.io/AtomicNoggin/pen/ogLzgPW).

The behavior adds the custom attibute `intl-format` to native `<time>` elements to to display locale specific dates and times using their `datetime` value, the closest valid `lang` attribute, and `Intl.DateTimeFormat` options supplied as attributes. 

```html
<section lang="en-CA">
  <time intl-format="datetime long short" datetime="2026-08-27T19:30:00-04:00">
    August 27, 2026 at 7:30 PM
  </time>

  <time intl-format="date long" datetime="2026-08-27">August 27, 2026</time>
  <time  intl-format="time short" datetime="19:30">7:30 PM</time>

</section>
```

Alternately you can also display thr duration between to time values

```html
<section lang="en-CA">
  <time intl-format="duration narrow" datetime="2026-08-30T10:03" datetime-to="2026-09-12T01:09">12d 15h 6m</time>
</section>
```

Install the optional `jsln` dependency before loading the example:

```sh
npm install jsln
```

Load the registry and a `Temporal` implementation before loading [`index.js`](index.js). The script expects `CustomBehaviorRegistry` to be globally available and registers formatting for `<time>` elements.

```html
<script src="./examples/intl-time/index.js"></script>
```

## Formatting Dates & Times

`intl-format` accepts `date`, `time`, or `datetime`. Optionally, you can add a date style and, for `datetime`, a time style:

```html
<time datetime="2026-08-27T19:30" intl-format="datetime full short"></time>
```

### intl-options
If you don't use the style short-hand variables, you can use `intl-options` to pass in `Intl.DateTimeFormat`  [parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#parameters). Its value is a JavaScript literal notation object with the outer `{}` omitted:

```html
<time
  datetime="2026-08-27T19:30:00-04:00"
  intl-options="year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'America/Toronto',timeZoneName:'short'"
></time>
```

In JavaScript, `element.intlOptions` will read and write the same object:

```js
element.intlOptions = { month: "long", timeZone: "America/Toronto" };
```
### intl-skeleton
Aside from `intl-options` you can use `intl-skeleton` to select individual fields with a Unicode date-field skeleton:

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

Explicit `intl-options` values override fields derived from `intl-skeleton`.

## Formatting duration

Set `intl-format="duration"` to display the elapsed duration between two
date/time values. The behavior selects endpoints in this order:

1. `datetime-from` and `datetime-to`
2. `datetime-from` and `datetime`
3. `datetime` and `datetime-to`

When only one of `datetime-from`, `datetime`, or `datetime-to` is set, the
missing endpoint is the current date and time. `intl-options` may include a default style,
`largestUnit` and/or `smallestUnit` to control the calculated duration;

```html
<time
  datetime-from="2026-08-01T00:00:00"
  datetime-to="2026-08-27T12:00:00"
  intl-format="duration short seconds days"
></time>
```
In JavaScript `element.dateTimeTo` and `element.dateTimeFrom` can also be used to set the secondary datetime values.

```js
  element.dateTimeTo = new Date().toISOString();
```

### intl-options
If you don't use the style short-hand variables, you can use `intl-options` to pass in `Intl.DurationFormat`  [parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#parameters). Its value is a JavaScript literal notation object with the outer `{}` omitted:

```html
<time
  datetime-from="2026-08-01T00:00:00"
  datetime-to="2026-08-27T12:00:00"
  intl-options="years:'narrow',months:'narrow',days:'narrow',hours:'long',minutes:'long'"
></time>
```

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
| `intl-format` | for dates, `date`, `time`, or `datetime`, optionally followed by style names; or `duration` optionally followed by duratiion style, smallestDisplayUnit, and/or largestDisplayUnit|
| `datetime` | An ISO 8601 date, time, date-time, instant, or zoned date-time. |
| `datetime-to` | An optional ISO 8601 date, time, date-time, instant, or zoned date-time. to calculate the duration |
| `datetime-from` | An optional ISO 8601 date, time, date-time, instant, or zoned date-time. to calculate the duration |
| `intl-options` | A JavaScript literal notation object without its outer `{}`. |
| `intl-skeleton` | A Unicode date-field skeleton. |
| `lang` | The inherited locale used for formatting. if Omitted, it will pull in an ancestor lang value, or use browser defaults if none found |
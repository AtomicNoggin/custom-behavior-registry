# Intl Message

An HTML-first message formatter built with `CustomBehaviorRegistry` and
[`IntlMessageFormat`](https://formatjs.github.io/docs/intl-messageformat/).
The behavior adds `intl-message` to ordinary HTML elements and uses the closest
valid `lang` attribute to select a localized ICU message.

```html
<section lang="en">
  <p intl-message="greeting">Hello, {name}!</p>
</section>

<script type="intl-messageformat">
{
  "en": {
    "greeting": "Hello, {name}!"
  }
}
</script>
```

Install the optional dependencies before loading the example:

```sh
npm install intl-messageformat jsln url-builder
```

Load the module-compatible registry and the example [`index.js`](index.js).
The example creates or reuses `window.customBehaviors` through
[`../intl-common.js`](../intl-common.js).

```html
<script type="module" src="./examples/intl-message/index.js"></script>
```

To run the complete harness, serve the repository over HTTP and open
`examples/intl-message/index.html` in a browser. The JSON fixtures are fetched
at runtime, so opening the file directly may be blocked by browser security
rules.

## Formatting messages

Put the message name in `intl-message`. The element's original text remains as
fallback content until a formatter is available.

```html
<p intl-message="inbox" intl-options="count:3">
  {count, plural, =0 {You have no messages} one {You have one message} other {You have # messages}}
</p>
```

Message values use ICU MessageFormat syntax, including arguments, plurals, and
select expressions. See the
[`IntlMessageFormat` documentation](https://formatjs.github.io/docs/intl-messageformat/)
for the complete syntax.

## Message data

Message data is grouped by locale and can contain nested objects. Nested keys
become dot-separated message names:

```json
{
  "en": {
    "account": {
      "status": "Your account is {state}."
    }
  }
}
```

The message is referenced as `intl-message="account.status"`.

### Inline script data

Use `script[type="intl-messageformat"]` for data embedded in the page. Add
`lang` when the object contains messages for one locale:

```html
<script type="intl-messageformat" lang="fr">
{
  "greeting": "Bonjour, {name}!"
}
</script>
```

Without `lang`, the script content should be an object keyed by locale:

```html
<script type="intl-messageformat">
{
  "en": { "greeting": "Hello, {name}!" },
  "fr": { "greeting": "Bonjour, {name}!" }
}
</script>
```

### Linked message data

Use `link[rel="intl-messageformat"]` to fetch locale data from a JSON or JSLN
resource. With `hreflang`, the resource is loaded for that locale:

```html
<link
  rel="intl-messageformat"
  href="./fr/messages.json"
  hreflang="fr"
>
```

Use `hrefpattern` to select a resource when the page locale changes. The
pattern can use `{lang}` or `{locale}` for one locale at a time, and
`{langs}` or `{locales}` for a list of locales:

```html
<link
  rel="intl-messageformat"
  hrefpattern="./:lang/messages.json"
>
```

Each linked resource must contain locale keys at its top level, even when the
URL already identifies the locale.

## intl-options

Use `intl-options` to provide the values required by a message. Its value is a
strict-mode JSLN object with the outer `{}` omitted:

```html
<p
  intl-message="greeting"
  intl-options="name:'Ada'"
>
  Hello, {name}!
</p>
```

In JavaScript, `element.intlOptions` reads and writes the same simple object:

```js
element.intlOptions = { name: "Ada" };
```

Changing `intl-options` reformats a connected element.

## Attribute messages

Use `intl-attribute-messages` to format an element attribute instead of its
text content. The value maps an attribute name to a message name:

```html
<input
  placeholder="Enter your name"
  intl-attribute-messages="placeholder:'form.namePlaceholder'"
>
```

Attribute-specific values can be supplied with
`intl-attribute-options-<attribute>`:

```html
<input
  placeholder="You have messages"
  intl-attribute-messages="placeholder:'inbox'"
  intl-attribute-options-placeholder="count:3"
>
```

The JavaScript properties `element.intlAttributeMessages` and
`element.intlAttributeOptions` expose the corresponding objects and update the
attributes when changed.

## Locale and updates

The closest ancestor with a valid `lang` attribute supplies the locale. When a
locale changes, connected message and attribute bindings are reformatted.

```html
<section lang="fr-CA">
  <p intl-message="greeting">Hello, {name}!</p>
</section>
```

If no valid ancestor locale is present, the browser's preferred languages are
used. A message falls back to the element's original text, or to the message
text itself when no localized formatter has been loaded.

## Attributes

| Attribute | Description |
| --- | --- |
| `intl-message` | Dot-separated message name used to format the element's text content. |
| `intl-options` | A strict-mode JSLN object without its outer `{}`; supplies message arguments. |
| `intl-attribute-messages` | Maps element attributes to message names. |
| `intl-attribute-options-<attribute>` | Supplies arguments for one mapped attribute. |
| `lang` | The inherited locale used for message lookup. |
| `rel="intl-messageformat"` | Marks a `<link>` as a message resource. |
| `href` | URL of a linked JSON or JSLN message resource. |
| `hreflang` | Locale associated with a linked resource. |
| `hrefpattern` | URL pattern used to load resources for changing locales. |

## Tests

Run the example tests from `custom-behavior-registry`:

```sh
npm test -- --runInBand examples/intl-message/index.test.js
```
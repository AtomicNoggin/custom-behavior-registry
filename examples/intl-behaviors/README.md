# Intl Behaviors

This example bundles the shared internationalization behaviors into one importable demo so you can see how the `intl-*` modules work together in a single page.

## Included behaviors

- `intl-lang`: tracks the active document language and dispatches `intl-langchange`
- `intl-data`: formats numeric values using `Intl.NumberFormat`
- `intl-message`: localizes text and attribute values from message bundles
- `intl-time`: formats dates, times, and durations with `Intl.DateTimeFormat`

## Import pattern

```js
import "custom-behavior-registry/examples/intl-behaviors/index.js";
```

The bundle imports each behavior module in sequence, so the registry is populated and the custom behavior names become available to the page.

## Example usage

```html
<script type="module" src="./examples/intl-behaviors/index.js"></script>

<p intl-message="shared.greeting" intl-options="name:'Ada'">
  Hello, {name}!
</p>

<data intl-format="currency" intl-currency="USD">1234.56</data>

<time intl-format="datetime long" datetime="2025-01-11T14:00:00-05:00"></time>
```

The page also includes a language selector that updates `document.documentElement.lang`, which triggers the locale-aware behavior updates.

## Notes

This is a convenience example. It is intended to demonstrate how the individual `intl-*` features compose together.

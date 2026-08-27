# Intl Data

Formats native `<data>` elements with `Intl.NumberFormat` when `intl-format="number"`.

```html
<data
  value="1234.5"
  intl-format="number"
  intl-options="style:'currency',currency:'CAD'"
>$1,234.50</data>
```

Install the optional `jsln` dependency before loading the example:

```sh
npm install jsln
```

Load `CustomBehaviorRegistry`, then load [`index.js`](index.js). The example creates or reuses `window.customBehavior`.

`intl-options` is a simple `Intl.NumberFormat` options object stored as strict-mode JSLN with the outer `{}` removed. The `intlOptions` property reads and writes the same object:

```js
element.intlOptions = { style: "currency", currency: "CAD" };
```

The closest valid `lang` attribute supplies the locale. Updating `value`, `intl-format`, `intl-options`, or `lang` reformats a connected element. Invalid numeric values preserve the element's original text content.

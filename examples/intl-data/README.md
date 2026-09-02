# Intl Data

An HTML-first number formatter for native `<data>` elements, built with
`CustomBehaviorRegistry` and `Intl.NumberFormat`.

```html
<section lang="en-CA">
  <data value="1234.56" intl-format="decimal">1,234.56</data>
  <data value="1234.56" intl-format="currency" intl-currency="CAD">$1,234.56</data>
  <data value="0.1234" intl-format="percent">12%</data>
  <data value="42" intl-format="unit" intl-unit="kilometer">42 km</data>
</section>
```

Install the optional `jsln` dependency before loading the example:

```sh
npm install jsln
```

Load a module-compatible `CustomBehaviorRegistry` and JSLN implementation
before loading [`index.js`](index.js). The example creates or reuses
`window.customBehavior` through [`../intl-common.js`](../intl-common.js).

```html
<script type="module" src="./examples/intl-data/index.js"></script>
```

## Formatting numbers

`intl-format` accepts `number`, `decimal`, `currency`, `percent`, or `unit`.

`decimal`, `currency`, `percent`, and `unit` set the corresponding
`Intl.NumberFormat` `style`, overriding any `style` specified in
`intl-options`. `number` leaves `style` unchanged, so its style can be set
through `intl-options`.

```html
<data value="1234.5" intl-format="number" intl-options="style:'currency',currency:'CAD'">
  $1,234.50
</data>
```

### Currency and unit values

When `intl-format="currency"`, `intl-currency` overrides the `currency`
option in `intl-options`.

```html
<data
  value="1234.5"
  intl-format="currency"
  intl-currency="USD"
  intl-options="currency:'CAD',currencyDisplay:'code'"
>USD 1,234.50</data>
```

When `intl-format="unit"`, `intl-unit` overrides the `unit` option in
`intl-options`.

```html
<data
  value="42"
  intl-format="unit"
  intl-unit="kilometer"
  intl-options="unit:'mile',unitDisplay:'long'"
>42 kilometers</data>
```

The `intlCurrency` and `intlUnit` properties validate assigned values against
`Intl.supportedValuesOf("currency")` and `Intl.supportedValuesOf("unit")`,
respectively.

## intl-options

Use `intl-options` for the remaining
[`Intl.NumberFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#parameters).
Its value is a strict-mode JavaScript literal notation object with the outer
`{}` omitted:

```html
<data
  value="1234.5678"
  intl-format="decimal"
  intl-options="maximumFractionDigits:2,useGrouping:'always'"
>1,234.57</data>
```

In JavaScript, `element.intlOptions` reads and writes the same simple object:

```js
element.intlOptions = { maximumFractionDigits: 2, useGrouping: "always" };
```

## Locale and updates

The closest ancestor with a valid `lang` attribute supplies the locale when
the element is formatted. Changes to `value`, `intl-format`, `intl-currency`,
`intl-unit`, or `intl-options` reformat a connected element. Set one of those
attributes again after changing `lang` to apply the new locale.

Invalid numeric `value` values preserve the element's original text content.

## Attributes

| Attribute | Description |
| --- | --- |
| `value` | The numeric value to format. |
| `intl-format` | `number`, `decimal`, `currency`, `percent`, or `unit`. |
| `intl-currency` | Currency code used when `intl-format="currency"`; overrides `intl-options.currency`. |
| `intl-unit` | Unit identifier used when `intl-format="unit"`; overrides `intl-options.unit`. |
| `intl-options` | A JavaScript literal notation object without its outer `{}`. |
| `lang` | The inherited locale used when formatting. |

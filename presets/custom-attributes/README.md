# Custom Attributes

`customAttributes` connects behaviors to elements that have a custom attribute.
Attribute names must use a hyphenated name such as `data-enhanced` or
`popover-trigger`.

```js
import { customAttributes } from "custom-behavior-registry/presets";

class EnhancedBehavior {
  connectedCallback(element) {
    element.setAttribute("data-ready", "");
  }
}

customAttributes.define("x-enhanced", EnhancedBehavior);
```

```html
<div x-enhanced></div>
```

Each defined attribute is added to the registry's attribute filter, so adding or
removing it on connected elements updates the behavior connection. Names are
normalized to lowercase.

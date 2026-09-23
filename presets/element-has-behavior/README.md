# Element Has Behavior

`elementHasBehavior` connects a behavior to elements whose space-separated
`has` attribute contains the behavior name.

```js
import { elementHasBehavior } from "custom-behavior-registry/presets";

class TooltipBehavior {
  connectedCallback(element) {
    element.setAttribute("data-tooltip-ready", "");
  }
}

elementHasBehavior.define("tooltip", TooltipBehavior);
```

```html
<button has="tooltip">More information</button>
```

The preset watches the `has` attribute, so changing its token list updates
behavior connections. Behavior names use lowercase, hyphenated custom names.

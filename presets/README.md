# Presets

Convenience `CustomBehaviorRegistry` instances for common ways of attaching
behaviors to elements.

```js
import {
  attachBehaviorByClass,
  attachBehaviorByQuery,
  customAttributes,
  customBehaviors,
  elementHasBehavior,
} from "custom-behavior-registry/presets";
```

| Preset | Matches elements by |
| --- | --- |
| [`attach-behavior-by-class`](attach-behavior-by-class/README.md) | CSS class name |
| [`attach-behavior-by-query`](attach-behavior-by-query/README.md) | CSS selector |
| [`custom-attributes`](custom-attributes/README.md) | Custom attribute |
| [`custom-behaviors`](custom-behaviors/README.md) | Definition options such as `asQuery`, `asTag`, `asClass`, and `asAttribute` |
| [`element-has-behavior`](element-has-behavior/README.md) | Space-separated `has` attribute values |

Each preset exports a configured registry. Define behaviors on the chosen
registry using the same `define(name, Behavior)` API as
`CustomBehaviorRegistry`.

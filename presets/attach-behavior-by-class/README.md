# Attach Behavior By Class

`attachBehaviorByClass` connects a behavior to elements whose `class` attribute
contains the behavior name.

```js
import { attachBehaviorByClass } from "custom-behavior-registry/presets";

class SelectedBehavior {
  connectedCallback(element) {
    element.textContent = "Selected";
  }
}

attachBehaviorByClass.define("selected", SelectedBehavior);
```

```html
<div class="selected"></div>
```

The preset watches the `class` attribute, so adding or removing the class from a
connected element updates its behavior connection. Names must be valid CSS class
selectors.

# Attach Behavior By Query

`attachBehaviorByQuery` treats each behavior name as a CSS selector.

```js
import { attachBehaviorByQuery } from "custom-behavior-registry/presets";

class TodoBehavior {
  connectedCallback(element) {
    element.setAttribute("data-ready", "");
  }
}

attachBehaviorByQuery.define("ul.todo-list > li", TodoBehavior);
```

```html
<ul class="todo-list">
  <li>Write documentation</li>
</ul>
```

The selector is validated with `document.querySelector` when the behavior is
defined. Use any selector supported by the browser.

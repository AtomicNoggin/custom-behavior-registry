# CustomBehaviorRegistry

Attach one or more custom element-like behavior classes to any element in the DOM. 
A registry maps behavior names to CSS selectors, creates behavior instances for matching elements, and keeps them connected as the DOM changes.


This project was inspired by other (now-abandoned) packages that do similar functionality:

- [WebReflection / wicked-elements](https://github.com/WebReflection/wicked-elements)
  Attaches one or more behavior objects to any element that match associated query selectors. CustomBehaviorRegistry is a spiritual successor of sorts to this package.
- [matthewp / custom-attributes](https://github.com/matthewp/custom-attributes/)
  Attaches one or more behavior classes to any element that have an associated custom attribute defined.
- [lume / element-behaviors](https://github.com/lume/element-behaviors)
  Attaches one or more behavior classes to any element with an assocated name in a space deliminated list within the non-standard 'has' attribute.


## Install and Create a Registry

```js
import CustomBehaviorRegistry from "./index.js";

const registry = new CustomBehaviorRegistry();
```

The registry relies on `Map.prototype.getOrInsert`. Provide a polyfill when the target browser does not implement it.

```js
Map.prototype.getOrInsert ??= function (key, value) {
  if (!this.has(key)) this.set(key, value);
  return this.get(key);
};
```

## Define a Behavior

`define(name, Behavior, options)` registers a behavior and immediately connects it to matching elements already in the document.

```js
class TooltipBehavior {
  constructor(element, options) {
    this.element = element;
    this.options = options;
  }

  connectedCallback(element) {
    element.hidden = false;
  }

  disconnectedCallback(element) {
    element.hidden = true;
  }
}

registry.define("[data-tooltip]", TooltipBehavior, { placement: "top" });
```

By default, `name` is the CSS selector. Behaviors may provide these optional lifecycle members:

```js
class ExampleBehavior {
  static tagFilter = ["BUTTON"];
  static tagExcludes = ["INPUT"];
  static observedAttributes = ["aria-expanded", "data-state-*"];

  static preConnectionCheck(element, options) {
    return element.hidden ? false : true;
  }

  constructor(element, options) {}

  connectedCallback(element) {}
  disconnectedCallback(element) {}
  connectedMoveCallback(element) {}
  attributeChangedCallback(element, attributeName, oldValue, newValue) {}
}
```

`tagFilter` limits matches to listed tag names; `tagExcludes` rejects listed tag names. `observedAttributes` enables behavior-level attribute callbacks, and supports prefix patterns ending in `-*`.

## Registry Options

Pass options to the constructor to customize how definitions work.

| Option | Description |
| --- | --- |
| `queryPrefix` | String prepended to every definition name when generating its selector. |
| `querySuffix` | String appended to every definition name when generating its selector. |
| `queryGenerator(name, behavior, options)` | Returns the CSS selector for a definition. Overrides prefix and suffix. |
| `nameValidator(name)` | Returns `true` to accept a name, `false` to reject it, or a string to normalize it. |
| `attributeFilter` | Iterable of document attributes whose changes can trigger behavior matching checks. |
| `attributeChangedCallback(element, attributeName, oldValue, newValue)` | Returns `false`, `true`, an element, or an iterable of elements to control matching checks after a filtered attribute changes. |
| `definedCallback(name, behavior, options)` | Called when defining a behavior. May return registry options to apply. |
| `definitionConstructorCallback(name, element, behavior, options)` | Called before a behavior is constructed. May return options to merge into the definition. |
| `definitionConnectedCallback(name, element, options)` | Called before a behavior's `connectedCallback`. |
| `definitionDisconnectedCallback(name, element, options)` | Called after a behavior's `disconnectedCallback`. |
| `definitionConnectedMoveCallback(name, element, options)` | Called before a behavior's `connectedMoveCallback`. |
| `definitionAttributeChangedCallback(name, element, attributeName, oldValue, newValue, options)` | Called before a behavior's `attributeChangedCallback`. |
| `definitionOptionDefaults` | Default options merged with options passed to `define`. |

### Class-Name Registry

```js
const classBehaviors = new CustomBehaviorRegistry({
  queryPrefix: ".",
  nameValidator: (name) => !/\s/.test(name),
  attributeFilter: ["class"],
});

classBehaviors.define("treegrid", TreegridBehavior);
```

This connects `TreegridBehavior` to elements matching `.treegrid` and updates matching when an element's class changes.

### Attribute-Name Registry

```js
const attributes = [];
const attributeBehaviors = new CustomBehaviorRegistry({
  queryPrefix: "[",
  querySuffix: "]",
  nameValidator: (name) =>
    !name.startsWith("aria-") &&
    !name.startsWith("data-") &&
    /^[a-z]([^A-Z]*-)+[^A-Z]+$/.test(name),
  attributeFilter: [],
  definedCallback: (name) => {
    attributes.push(name);
    return { attributeFilter: attributes };
  },
});

attributeBehaviors.define("treegrid-expander", TreegridExpander);
```

This connects the behavior to elements with a `treegrid-expander` attribute and begins watching that attribute when the definition is added.

### Custom Selector Generator

```js
const roleBehaviors = new CustomBehaviorRegistry({
  nameValidator: (name) => !/\s/.test(name) && name.toLowerCase(),
  queryGenerator: (name, Behavior, options) =>
    options.attachToBuiltins && Behavior.builtInSelectors?.length
      ? `:is(${Behavior.builtInSelectors.join(",")},[role="${name}"])`
      : `[role="${name}"]`,
  attributeFilter: ["role"],
});
```

## Instance Methods

### `define(name, behavior, options)`

Adds a definition, connects it to matching elements, and resolves any matching `whenDefined` promise. Throws for invalid names, duplicate names, or non-constructors.

### `whenDefined(name)`

Returns a promise that resolves with the behavior class after the name is defined.

```js
await registry.whenDefined("[data-tooltip]");
```

### `update(root)`

Rechecks `root` and all of its descendants against the registered definitions. Without an argument, checks the document.

```js
registry.update(document.querySelector("main"));
```

### `get(name, element)`

Returns the behavior class for `name`, or the behavior instance connected to `element` when an element is supplied. Returns `null` when absent.

### `getElements(nameOrBehavior)`

Returns a `Map` of connected elements to behavior instances for a definition name or behavior class. Returns `null` when none are connected.

### `getElementBehaviors(element)`

Returns a frozen object containing the behavior instances connected to `element`, keyed by definition name. Returns `null` when there are none.

### `getName(behavior)`

Returns the definition name registered for a behavior class, or `null`.

## Static Registry Controls

```js
CustomBehaviorRegistry.disconnect(registry);
CustomBehaviorRegistry.observe(registry);
```

| Method | Description |
| --- | --- |
| `CustomBehaviorRegistry.observe(registry)` | Enables DOM observation for the registry. |
| `CustomBehaviorRegistry.disconnect(registry)` | Disables DOM observation. Existing definitions and connections remain available. |
| `CustomBehaviorRegistry.getSettings(registry)` | Returns the registry's active settings. |
| `CustomBehaviorRegistry.replaceSettings(registry, settings)` | Replaces active settings with valid values from `settings`. |
| `CustomBehaviorRegistry.clearSettings(registry)` | Restores the default settings. |
| `CustomBehaviorRegistry.undefineBehavior(registry, nameOrBehavior)` | Removes one definition and disconnects its behavior instances. |
| `CustomBehaviorRegistry.undefineAllBehaviors(registry)` | Removes every definition and disconnects all behavior instances. |

## Examples

See [the Intl Time example](examples/intl-time/) for a registry that formats native `<time>` elements.
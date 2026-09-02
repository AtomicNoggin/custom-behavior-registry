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

## Instance Methods

### `define(name, behavior[, options])`

Adds a definition, connects it to matching elements, and resolves any matching `whenDefined` promise. Throws for invalid names, duplicate names, or non-constructors.

### `whenDefined(name)`

Returns a promise that resolves with the behavior class after the name is defined.

```js
await registry.whenDefined("[data-tooltip]");
```

### `update([root])`

Rechecks `root` and all of its descendants against the registered definitions. Without an argument, checks the document.

```js
registry.update(document.querySelector("main"));
```

### `get(name[, element])`

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
| `CustomBehaviorRegistry.disconnect(registry)` | Disables DOM observation. Existing definitions and connections remain available. |
| `CustomBehaviorRegistry.observe(registry)` | Re-enables DOM observation for the registry. |
| `CustomBehaviorRegistry.getSettings(registry)` | Returns the registry's active settings. |
| `CustomBehaviorRegistry.replaceSettings(registry, settings)` | Replaces active settings with valid values from `settings`. |
| `CustomBehaviorRegistry.clearSettings(registry)` | Restores the default settings. |
| `CustomBehaviorRegistry.undefineBehavior(registry, nameOrBehavior)` | Removes one definition and disconnects its behavior instances. |
| `CustomBehaviorRegistry.undefineAllBehaviors(registry)` | Removes every definition and disconnects all behavior instances. |

## Usage Examples
The inspirational packages listed above can be roughly replicated using the CustomElementRegistry constructor

### Create a **wicked-elements** like `attachBehaviorByQuery` registry
```js
// default 'optionless' registry, define method takes in a query selector and behavior class
window.attachBehaviorByQuery = new CustomBehaviorRegistry();

attachBehaviorByQuery.define('table[role="treegrid"] > * > tr[aria-level]', AriaTreegridExpander)
// matches the <tr> in <table role="treegrid" ...> <thead|tfoot|tbody> <tr aria-level="..." ...>
```

Or it could be modified to just look for class names
```js
window.attachBehaviorByClassName = new CustomBehaviorRegistry({
  // wrap the name to generate a query selector
  queryPrefix: '.',
  querySuffix: '',
  // ensure name doesn't have whitespace
  nameValidator: (name) => !/\s/.test(name),
  // scan the DOM for updates to the class attribute
  attributeFilter: ["class"]
});

attachBehaviorByClassName.define('treegrid', AriaTreegridBehavior);
// matches <[tagname] class="treegrid ..." ...>
```

### Create a **element-behaviors** like `elementHasBehavior` registry
```js
window.elementHasBehavior = new CustomBehaviorRegistry({
  // wrap the name to generate a query selector
  queryPrefix: '[has~="',
  querySuffix: '"]',
  // ensure name generally matches the custom ident structure
  nameValidator: (name) => /^[a-z]([^A-Z]*-)+[^A-Z]+$/.test(name),
  // scan the DOM for updates to the has attribute
  attributeFilter: ["has"]
});

elementHasBehavior.define('treegrid-expander', AriaTreegridExpander)
// matches <[tagname] has="treegrid-expander ..." ...>
```

Or it could be modified to check an existing attribute value (like role)
```JS
window.ariaRoleBehaviors = new CustomBehaviorRegistry({
  // wrap the name to generate a query selector
  queryPrefix: '[role="',
  querySuffix: '"]',
  // ensure name doesn't have whitespace and force it to lower case
  nameValidator: (name) => !/\s/.test(name) && name.toLowerCase(),
  // scan the DOM for updates to the role attribute
  attributeFilter: ["role"]
});

ariaRoleBehaviors.define('treegrid', AriaTreegridBehavior);
// matches <[tagname] role="treegrid" ...>
```

### Create a **custom-attributes** like `customAttributes` registry
```JS
//keep an external array to hold attribute names
const attributeNames = [];
window.customAttributes = new CustomBehaviorRegistry({
  // wrap the name to generate a query selector
  queryPrefix: '[',
  querySuffix: ']',
  // ensure name doesn't start with aria- or data-
  // and generally matches the custom ident structure
  nameValidator: (name) => (
    !(name.startsWith('aria-') || name.startsWith('data-'))
    && /^[a-z]([^A-Z]*-)+[^A-Z]+$/.test(name)
  ),
  // no attributes to filter initially
  attributeFilter: [],
  // for each new behavior defined, return a new filter list to scan for
  definedCallback: (name) => (
    attributeNames.push(name) &&
    {attributeFilter: attributeNames}
  );

customAttributes.define('treegrid-expander', AriaTreegridExpander)
// matches <[tagname] treegrid-expander[="..."] ...>
```

Or it could be modified to check for existing attributes (like `aria-*`)
```js
//keep an external array to hold attribute names
const attributeNames = [];
window.ariaAttributeBehaviors = new CustomBehaviorRegistry({
  // wrap the name to generate a query selector
  queryPrefix: '[aria-',
  querySuffix: ']',
  // ensure name doesn't have whitespace and force it to lower case
  nameValidator: (name) => !/\s/.test(name) && name.toLowerCase(),
  // no attributes to filter initially
  attributeFilter: [],
  // for each new behavior defined, return a new filter list to scan for
  definedCallback: (name) => (
    attributeNames.push('aria-'+name) &&
    {attributeFilter: attributeNames}
  );

ariaAttributeBehaviors.define('level', AriaTreegridExpander)
// matches <[tagname] aria-level[="..."] ...>
```

### Combine all of the above into a `customBehaviors` registry

use the options object from each registered behavior devinition to determine how it will connect

| Option | Description |
| --- | --- |
| `asQuery` | Connect this behavior to elements using a custom query. If value is true, use the behavior name as query selector. If value a string, use it is as the query selector. Ignore if false or omitted |
| `asTag` | Connect this behavior to elements with a matching tagname. If value is true, use the behavior name as the tagname. If value is a string, use is it as the tagname. ignore if false or omitted |
| `asClass` | Connect this behavior to elements with a matching classname. If value is true, use the behavior name as the classname. If value is a string, use is it as the classname. Ignore if false or omitted |
| `asAttribute` | Connect this behavior to elements with a specific named attribute. If value is true, use the behavior name as the attribute. If value is a string, use is it as the attribute. ignore if false or omitted |
| `asAttributeValue` | Connect this behavior to elements with a specific named attribute that contains a specific value as one of it's space delimited values. Use the option string value as the attribute name to check. Use the behavior name as the value to compare against. Ignore if omitted |

If more than one option is set, an element will be connected if it matches any one setting.

```JS
window.customBehavior =
  window.customBehavior ||
  new CustomBehaviorRegistry({
    queryGenerator: (name, behavior, options) => {
      let parts = [],
        query = "";
      if (options.asQuery) {
        query =
          options.asQuery + "" === options.asQuery ? options.asQuery : name;
      }
      if (options.asTag) {
        if (!behavior.tagFilter?.length) {
          behavior.tagFilter = [];
        }
        const value =
          options.asTag + "" === options.asTag ? options.asTag : name;
        behavior.tagFilter.includes(value) || behavior.tagFilter.push(value);
        parts.push(value);
      }
      if (options.asClass) {
        parts.push(
          "." + options.asClass + "" === options.asClass
            ? options.asClass
            : name,
        );
      }
      if (options.asAttribute) {
        parts.push(
          "[" +
            (options.asAttribute + "" === options.asAttribute
              ? options.asAttribute
              : name) +
            "]",
        );
      }
      if (options.asAttributeValue + "" === options.asAttributeValue) {
        parts.push("[" + options.asAttributeValue + '="' + name + '"]');
      }
      if (parts.length) {
        query += (query.length ? ", " : "") + ":is(" + parts.join(", ") + ")";
      } else if (!query.length && behavior.tagFilter?.length) {
        query = "*";
      }
      return query;
    },
    definedCallback: (name, behavior, options) => {
      const attributeFilter =
        window.customBehavior[Symbol.for("attributeFilter")] || [];
      let update = false;
      if (options.asClass && !attributeFilter.includes("class")) {
        attributeFilter.push("class");
        update = true;
      }
      if (options.asAttribute) {
        const value =
          options.asAttribute + "" === options.asAttribute
            ? options.asAttribute
            : name;
        if (!attributeFilter.includes(value)) {
          attributeFilter.push(value);
          update = true;
        }
      }
      if (options.asAttributeValue + "" === options.asAttributeValue) {
        const value = options.asAttributeValue.replace(/[*|~$^]$/, "");
        if (!attributeFilter.includes(value)) {
          attributeFilter.push(value);
          update = true;
        }
      }
      if (update) {
        window.customBehavior[Symbol.for("attributeFilter")] = attributeFilter;
        return { attributeFilter };
      }
    },
  });


customBehavior.define('[role="tablist"] > [role="tab"]',TabHandler, {asQuery:true});
// matches the second element in <[tagname]] role="tablist" ...>  <[tagname] role="tab" ...>

customBehavior.define('treegrid-level', AriaTreegridExpander, {asQuery: 'table[role="treegrid"] > * > tr[aria-level]'});
// matches the <tr> in <table role="treegrid" ...> <thead|tfoot|tbody> <tr aria-level="..." ...>

customBehavior.define('shoot-fireworks', ShootFireworks, {asClass:true}); 
// matches <[tagname] class="shoot-fireworks ...">

customBehavior.define('my-customtag', BehaviorAsCustomElement , {asTag:true});
// matches <my-customtag ...>

customBehavior.define('intl-datetime-format',IntlDateTimeFormater,{asTag:'time'});
// matches <time ...>

customBehavior.define('aria-expanded', AriaExpander , {asAttribute:true});
// matches <[tagname] aria-expanded[="... "] ...>

customBehavior.define('intl-lang', IntlLangChangeDispatcher, {asAttribute:'lang'});
// matches <[tagname] lang[='...']>

customBehavior.define('sticky-headers', StickyHeaders, {asAttributeValue:'has'});
// matches <[tagname] has="sticky-headers ...">


customBehavior.define('my-tooltip', StickyHeaders, {asTag: true, asClass: true, asAttribute:true});
// matches either <my-tooltip ...>, <[tagname] class="sticky-headers ...">, or <[tagname] my-tooltip[="..."]>
  ```

## Define a Behavior

`define(name, Behavior, options)` registers a behavior and immediately connects it to matching elements already in the document. It will listen for mustation on the DOM to dynamically update the registry as required.

```js
class ExampleBehavior {
  static observedAttributes = ["aria-expanded", "data-state-*"];
  static tagFilter = ["button", "input", "output"];
  /* static tagExcludes = ["div", "span"];  only include one of these lists */

  static preConnectionCheck(element, options) {}

  constructor(element, options) {}

  connectedCallback(element) {}
  disconnectedCallback(element) {}
  connectedMoveCallback(element) {}
  attributeChangedCallback(element, attributeName, oldValue, newValue) {}
}
```

| Member | Description |
| --- | --- |
| `static tagFilter` | Iterable of allowed tag names. When present, only matching elements that also have one of these tag names will be connected. |
| `static tagExcludes` | Iterable of excluded tag names. When present, only matcing elements WITHOUT one of these tag names will be connected. 

Including both a tagFilter and tegExcludes list will never connect any element|
| `static observedAttributes` | Iterable of attribute names that trigger `attributeChangedCallback`. Names ending in `-*` match any attribute with that prefix. |
| `static preConnectionCheck(element, options)` | Runs before a behavior connects. Return `false` to skip the connection, `true` to continue, or an options object to merge into the definition. |
| `constructor(element, options)` | Creates the behavior instance the first time an element connects. |
| `connectedCallback(element)` | Runs when a behavior instance connects to an element, including reconnections. |
| `disconnectedCallback(element)` | Runs when a connected element is removed or stops matching the behavior selector. |
| `connectedMoveCallback(element)` | Runs when an already connected element is moved within the DOM and still matches. Without it, the registry runs the disconnect and connect callbacks instead. |
| `attributeChangedCallback(element, attributeName, oldValue, newValue)` | Runs when a listed observed attribute changes on a connected element. |

## Examples

For live examples, see:
- [Sticky Table Header, Footer & Columns](https://codepen.io/AtomicNoggin/pen/NPNEprj)
- [Basic ARIA Treegrid show & hide of "nested" rows.](https://codepen.io/AtomicNoggin/pen/VYagYRw)
- [Expandable Table Rows with Details Elements.](https://codepen.io/AtomicNoggin/pen/KwVppbp), and
- [Combining Table Behaviors](https://codepen.io/AtomicNoggin/pen/dPXzeZe)



See [the Intl Time example](examples/intl-time/) for a registry that formats native `<time>` elements.
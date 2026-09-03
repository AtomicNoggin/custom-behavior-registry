# CustomBehaviorRegistry

Attach one or more custom element-like behavior classes to any element in the DOM and attached shadow DOMs.
Create a custom registry that maps named behavior classes to CSS selectors, creates behavior instances for matching elements, and uses a single Mutation Observer to keep them manage the behavior life-cycle as the DOM changes.

This project was inspired by other (now-abandoned) packages that had similar functionality:

- [WebReflection / wicked-elements](https://github.com/WebReflection/wicked-elements)
  Attaches one or more behavior objects to any element that match associated query selectors. CustomBehaviorRegistry is a spiritual successor of sorts to this package.
- [matthewp / custom-attributes](https://github.com/matthewp/custom-attributes/)
  Attaches one or more behavior classes to any element that have an associated custom attribute defined.
- [lume / element-behaviors](https://github.com/lume/element-behaviors)
  Attaches one or more behavior classes to any element with an assocated name in a space deliminated list within the non-standard 'has' attribute.


## Install and Create a Registry

```js
import CustomBehaviorRegistry from "custom-behavior-registry";

const registry = new CustomBehaviorRegistry();
```

## Registry Options

Pass options to the constructor to customize how behavior definitions work.

| Option | Description |
| --- | --- |
| `queryPrefix` | String prepended to every definition name when generating its selector. |
| `querySuffix` | String appended to every definition name when generating its selector. |
| `queryGenerator(name, behavior, options)` | Returns the CSS selector for a definition. Overrides prefix and suffix. |
| `nameValidator(name)` | Returns `true` to accept a name, `false` to reject it, or a string to normalize it. |
| `attributeFilter` | Iterable of document attributes whose changes can trigger behavior matching checks. |
| `attributeChangedCallback(element, attributeName, oldValue, newValue)` | Called when an attribute listed in the attributeFilter changes. Returns `false` to cancel the action, `true` to continue. May also return an element, or an iterable of elements to update instead of the target element. |
| `definedCallback(name, behavior, options)` | Called when defining a behavior. May return updated registry options to apply. |
| `definitionConstructorCallback(name, element, behavior, options)` | Called before a behavior is constructed. May return options to merge into the existing definition options. |
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
await registry.whenDefined("my-tooltip");
```

### `update([root])`

Rechecks `root` element and all of its descendants against the registered definitions. Without an argument, checks the current DOM and attached Shadow DOMs.

```js
registry.update(document.querySelector("main"));
```

### `get(name[, element])`

Returns the behavior class for `name`, or the behavior instance connected to `element` when an element is supplied. Returns `null` when absent.

```js
const behaviorClass = registry.get('my-tooltip'); 
const behaviorInstance = registry.get('my-tooltip',document.querySelector("main")); 
```
### `getElements(nameOrBehavior)`

Returns a `Map` of connected elements to behavior instances for a definition name or behavior class. Returns `null` when none are connected.

### `getElementBehaviors(element)`

Returns a frozen object containing the behavior instances connected to `element`, keyed by definition name. Returns `null` when there are none.

### `getName(behavior)`

Returns the definition name registered for a behavior class, or `null`.

## Static Registry Methods

```js
CustomBehaviorRegistry.disconnect(registry);

// do instense DOM manipulation

registry.update();
CustomBehaviorRegistry.observe(registry);
```
### `CustomBehaviorRegistry.disconnect(registry)` 

Disables DOM observation. Existing definitions and connections remain available, and registry.update() will still manually recan for changes.


### `CustomBehaviorRegistry.observe(registry)` 

Re-enables DOM observation for the registry.
### `CustomBehaviorRegistry.getSettings(registry)`

 Returns the registry's active settings.

### `CustomBehaviorRegistry.replaceSettings(registry, settings)` 

Replaces active registy settings with valid values from `settings`.

### `CustomBehaviorRegistry.clearSettings(registry)`

Restores a registry to default settings.

### `CustomBehaviorRegistry.undefineBehavior(registry, nameOrBehavior)`

Removes one definition and disconnects its behavior instances. |

### `CustomBehaviorRegistry.undefineAllBehaviors(registry)`

Removes every definition and disconnects all behavior instances.

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
  // wrap the name to generate a class query selector
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
  // wrap the name to generate a `has` attribute query selector
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
  // wrap the name to generate a `role` attribute query selector
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
  // wrap the name to generate an attribute query selector
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
  // wrap the name to generate a an `aria-*` attribute query selector
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
```

Uses the options object from each registered behavior definition to determine how it will connect

| Option | Description |
| --- | --- |
| `asQuery` | Connect this behavior to elements using a custom query. If value is true, use the behavior name as query selector. If value a string, use it is as the query selector. Ignore if false or omitted |
| `asTag` | Connect this behavior to elements with a matching tagname. If value is true, use the behavior name as the tagname. If value is a string, use is it as the tagname. ignore if false or omitted |
| `asClass` | Connect this behavior to elements with a matching classname. If value is true, use the behavior name as the classname. If value is a string, use is it as the classname. Ignore if false or omitted |
| `asAttribute` | Connect this behavior to elements with a specific named attribute. If value is true, use the behavior name as the attribute. If value is a string, use is it as the attribute. ignore if false or omitted |
| `asAttributeValue` | Connect this behavior to elements with a specific named attribute that contains a specific value. Use the option string value as the attribute name to check. Append `~`,`^`,`$`, or `*` to the attribute name to do partial value matching. Use the behavior name as the value to compare against. Ignore if omitted |

If more than one option is set, an element will be connected if it matches any one setting.


```js
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

customBehavior.define('button', ButtonRole, {asAttributeValue:'role'});
// matches <[tagname] role="button">

customBehavior.define('sticky-headers', StickyHeaders, {asAttributeValue:'has~'});
// matches <[tagname] has="sticky-headers ...">


customBehavior.define('my-tooltip', FancyTooltip, {asTag: true, asClass: true, asAttribute:true});
// matches either <my-tooltip ...>, <[tagname] class="my-tooltip ...">, or <[tagname] my-tooltip[="..."]>
```

## Define a Behavior

`define(name, Behavior, options)` registers a behavior and immediately connects it to matching elements already in the document. It will listen for mutations on the DOM and any shadow DOMs connected after the registry was created to dynamically update the registry as required.

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
| `static observedAttributes` | Iterable of attribute names that trigger `attributeChangedCallback` when updted. Names ending in `-*` will match any attribute with that name prefix. This is a live list. Changes take effect when a new behavior trigger is observed. |
| `static tagFilter` | Iterable of allowed tag names. When present, only matching elements that also have one of these tag names will be connected.  This is a live list. Changes take effect when a new behavior trigger is observed, but registry.update() should be used to rescan existing elements. |
| `static tagExcludes` | Iterable of excluded tag names. When present, only matcing elements WITHOUT one of these tag names will be connected. This is a live list. Changes take effect when a new behavior trigger is observed, but registry.update() should be used to rescan existing elements. |
| `static preConnectionCheck(element, options)` | Runs before a behavior connects. Return `false` to skip the connection, `true` to continue, or an options object to merge into the definition. |
| `constructor(element, options)` | Creates the behavior instance the first time an element connects. |
| `connectedCallback(element)` | Runs when a behavior instance connects to an element, including reconnections. |
| `disconnectedCallback(element)` | Runs when a connected element is removed or stops matching the behavior selector. |
| `connectedMoveCallback(element)` | Runs when an already connected element is moved within the DOM and still matches. Without it, the registry runs the disconnect and connect callbacks instead. |
| `attributeChangedCallback(element, attributeName, oldValue, newValue)` | Runs when a listed observed attribute changes on a connected element. |

Including both a tagFilter and tagExcludes list will cancel each other out and never connect any element

## Examples

For live examples, see:
- [Sticky Table Header, Footer & Columns](https://codepen.io/AtomicNoggin/pen/NPNEprj)
- [Basic ARIA Treegrid show & hide of "nested" rows.](https://codepen.io/AtomicNoggin/pen/VYagYRw)
- [Expandable Table Rows with Details Elements.](https://codepen.io/AtomicNoggin/pen/KwVppbp), and
- [Combining Table Behaviors](https://codepen.io/AtomicNoggin/pen/dPXzeZe)

See the [Intl Time](examples/intl-time/) and [Intl Data](examples/intl-data/) examples for a behaviors that do locale aware formats with native `<time>`  and `<data>` elements.
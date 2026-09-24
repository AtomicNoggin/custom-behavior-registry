#Custom Behaviors Preset
```js
import { customBehaviors } from custom-behavior-registry/presets

window.customBehaviors =
  window.customBehaviors || customBehaviors;

```

##Usage 

Uses the options object from each registered behavior definition to determine how it will connect

| Option | Description |
| --- | --- |
| `asQuery` | Connect this behavior to elements using a custom query. If value is true, use the behavior name as query selector. If value a string, use it is as the query selector. Ignore if false or omitted |
| `asTag` | Connect this behavior to elements with a matching tagname. If value is true, use the behavior name as the tagname. If value is a string, use is it as the tagname. Ignore if false or omitted |
| `asClass` | Connect this behavior to elements with a matching classname. If value is true, use the behavior name as the classname. If value is a string, use is it as the classname. Ignore if false or omitted |
| `asAttribute` | Connect this behavior to elements with a specific named attribute. If value is true, use the behavior name as the attribute. If value is a string, use is it as the attribute. ignore if false or omitted |
| `asAttributeValue` | Connect this behavior to elements with a specific named attribute that contains a specific value. If the option value is a string, use it as the attribute name to check and the behavior name as the value to check for. If the value is a an array of two or more strings, Use the the first entry as the attribute name to check and the remaining entries as values to check for. Append `~`,`\|`,`^`,`$`, or `*` to the attribute name to do value list or substring matching. Ignore if not a string, array or omitted |

If more than one option is set, an element will be connected if it matches any one setting.

If no options are set, the behavior class must have at least one of `tagFilter`, `tagExcludes`, or `preConnectionCheck` set to limit the number of connected elements.

```js
customBehaviors.define('[role="tablist"] > [role="tab"]',TabHandler, {asQuery:true});
// matches the second element in <[tagname]] role="tablist" ...>  <[tagname] role="tab" ...>

customBehaviors.define('treegrid-level', AriaTreegridExpander, {asQuery: 'table[role="treegrid"] > * > tr[aria-level]'});
// matches the <tr> in <table role="treegrid" ...> <thead|tfoot|tbody> <tr aria-level="..." ...>

customBehaviors.define('shoot-fireworks', ShootFireworks, {asClass:true}); 
// matches <[tagname] class="shoot-fireworks ...">

customBehaviors.define('my-customtag', BehaviorAsCustomElement , {asTag:true});
// matches <my-customtag ...>

customBehaviors.define('intl-datetime-format',IntlDateTimeFormater,{asTag:'time'});
// matches <time ...>

customBehaviors.define('aria-expanded', AriaExpander , {asAttribute:true});
// matches <[tagname] aria-expanded[="... "] ...>

customBehaviors.define('intl-lang', IntlLangChangeDispatcher, {asAttribute:'lang'});
// matches <[tagname] lang[='...']>

customBehaviors.define('sticky-headers', StickyHeaders, {asAttributeValue:'has~'});
// matches <[tagname] has="sticky-headers ...">

customBehaviors.define('aria-button', ButtonRole, {asAttributeValue:['role','button']});
// matches <[tagname] role="button">

customBehaviors.define('my-tooltip', FancyTooltip, {asTag: true, asClass: true, asAttribute:true});
// matches all of <my-tooltip ...>, <[tagname] class="my-tooltip ...">, and <[tagname] my-tooltip[="..."]>
```
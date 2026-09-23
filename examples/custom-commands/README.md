# Custom Commands Behavior

An extention to the [Invoker COmmands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API) 
for connecting controls to custom commands or methods on another element. It uses 
`CustomBehaviorRegistry` and supports buttons, inputs, selects, textareas, and focusable 
elements with `tabindex`.

The example harness is available at [`index.html`](index.html).

## Loading

Load the behavior as an ES module. The behavior creates or reuses
`window.customBehaviors` through [`../common.js`](../common.js).

```html
<script type="module" src="./examples/custom-commands/index.js"></script>
```

## Basic Usage

Give the target an `id`, register a command on its `customCommand` registry, and
point a control at it with `commandfor`:

```html
<button command="--save" commandfor="editor">Save</button>

<div id="editor"></div>

<script type="module">
  const editor = document.querySelector("#editor");

  editor.customCommand.define("--save", function () {});
</script>
```

`commandForElement` can be used instead of an `id` reference:

```js
button.commandForElement = editor;
```

The `customCommand` registry is created lazily and is stable for the lifetime
of its element.

## Custom Commands

Custom command names must start with `--`.

```js
const target = document.querySelector("#editor");

target.customCommand.define("--notify", (message) => {});

target.customCommand.has("--notify");
target.customCommand.get("--notify");
target.customCommand.fire("--notify", "Saved");
target.customCommand.undefine("--notify");
```

Commands are bound to the registry element by default. Use `bindTo` to bind a
command to another element or to the `id` of another element:

```js
const logger = document.querySelector("#logger");

target.customCommand.define(
  "--log",
  function () {
    this.textContent = "Saved";
  },
  { bindTo: logger },
);
```

## Command Arguments

Pass an `arguments` array when defining a command. The behavior resolves these
tokens when it dispatches the command:

| Token             | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| `event`           | The generated `CommandEvent`.                                        |
| `name`            | The command event's `name` value, when provided.                     |
| `source`          | The control that triggered the command.                              |
| `source.property` | A property read from the triggering control, such as `source.value`. |
| Any other string  | The string itself as a literal argument.                             |

```js
target.customCommand.define(
  "--text-changed",
  (value) => {
    document.querySelector("#preview").textContent = value;
  },
  {
    arguments: ["source.value"],
  },
);
```

## Triggers

The default trigger is `click` for buttons & focuable items and `change` for inputs, selects,
& textareas that have both `command` and `commandfor`.

Override it with `commandtrigger` or the `commandTrigger` property:

```html
<input command="--search" commandfor="search-results" commandtrigger="input" />
```

```js
input.commandTrigger = "input";
```

## Element Commands

The existing API is limitted to the following methods on the target element:

- `show-modal`
- `close`
- `request-close`
- `toggle-modal`
- `show-popover`
- `hide-popover`
- `toggle-popover`

Custom Commands will oprtunistically allow any element method name to be fired

For example:

```html
<button command="show-modal" commandfor="settings">Open settings</button>
<dialog id="settings">Settings</dialog>
```

The command name is converted to a camel-cased method name, such as
`show-modal` to `showModal`.

## Running the Example

Serve the repository so the module imports work, then open
`examples/custom-commands/index.html`:

```sh
npx serve .
```

Run the unit tests from the example directory's package root:

```sh
npm test -- --runInBand examples/custom-commands/index.test.js
```

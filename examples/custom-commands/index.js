import "../common.js";

const ALLOWED_KEYSOURCES = ["self", "descendants"];
const BUILTIN_COMMAND_NAMES = [
  "show-modal",
  "close",
  "request-close",
  "toggle-modal",
  "show-popover",
  "hide-popover",
  "toggle-popover",
];
class CustomCommandRegistry {
  #element;
  constructor(element) {
    this.#element = element;
    this.commands = {};
    this.listener = null;
  }
  define(command, method, options = {}) {
    const {
      bindTo,
      arguments: args,
      keyshortcuts,
      keysource,
    } = {
      bindTo: this.#element,
      arguments: [],
      keyshortcuts: "",
      keysource: "self",
      ...Object(options),
    };
    if (typeof command !== "string") {
      throw new TypeError(`Command name must be a string`);
    } else if (!command.startsWith("--")) {
      throw new SyntaxError(
        `Command name must be a custom command starting with '--'`,
      );
    }
    if (typeof method !== "function") {
      throw new TypeError(`Command method must be a function`);
    }
    if (!ALLOWED_KEYSOURCES.includes(keysource)) {
      keysource = "self";
    }
    if (typeof bindTo === "string") {
      bindTo = document.getElementById(bindTo) || this.#element;
    }
    if (bindTo instanceof Element) {
      method = method.bind(bindTo);
    } else {
      method = method.bind(this.#element);
    }
    this.commands[command] = { method, args };
    if (!this.listener) {
      this.listener = (event) => {
        const commandName = event.command;
        if (this.commands[commandName]) {
          const { args, method } = this.commands[commandName];
          let eventArgs = [];
          for (const arg of args) {
            switch (arg) {
              case "event":
                eventArgs.push(event);
                break;
              case "command":
                eventArgs.push(event.command);
                break;
              case "source":
                eventArgs.push(event.source);
                break;
              case "keyshortcut":
                eventArgs.length++;
                break;
              default:
                if (arg.startsWith("source.")) {
                  const parts = arg.split(".");
                  eventArgs.push(event.source?.[parts[1]]);
                } else {
                  eventArgs.push(arg);
                }
            }
          }
          this.commands[commandName].method(...eventArgs);
        }
      };
      this.#element.addEventListener("command", this.listener);
    }
  }
  get(command) {
    if (typeof command !== "string") {
      throw new TypeError(`Command name must be a string`);
    }
    return this.commands[command];
  }
  has(command) {
    return !!this.commands[command];
  }
  undefine(command) {
    delete this.commands[command];
    if (Object.keys(this.commands || {}).length === 0) {
      this.#element.removeEventListener("command", this.listener);
      delete this.listener;
    }
  }
  fire(command, ...args) {
    if (!this.has(command)) {
      throw new Error(`Command "${command}" is not registered on this element`);
    }
    return this.commands[command].method(...args);
  }
}

const CUSTOM_COMMAND_REGISTRY = Symbol("custom-command-registry");
const customCommandProperty = {
  get: function () {
    if (!this[CUSTOM_COMMAND_REGISTRY]) {
      this[CUSTOM_COMMAND_REGISTRY] = new CustomCommandRegistry(this);
    }
    return this[CUSTOM_COMMAND_REGISTRY];
  },
  enumerable: true,
  configurable: true,
};

const commandProperty = {
  get: function () {
    return this.getAttribute("command");
  },
  set: function (value) {
    this.setAttribute("command", value);
  },
  enumerable: true,
  configurable: true,
};

const COMMAND_ELEMENT_SYMBOL = Symbol("command-element");
const commandForElementProperty = {
  get: function () {
    const commandFor = this.getAttribute("commandfor");
    if (
      commandFor &&
      (!this[COMMAND_ELEMENT_SYMBOL]?.deref() ||
        this[COMMAND_ELEMENT_SYMBOL]?.deref()?.id !== commandFor)
    ) {
      try {
        this[COMMAND_ELEMENT_SYMBOL] = new WeakRef(
          document.getElementById(commandFor),
        );
      } catch (e) {
        // ignore errors
      }
    }
    return this[COMMAND_ELEMENT_SYMBOL]?.deref() || null;
  },
  set: function (value) {
    if (value instanceof Element) {
      this[COMMAND_ELEMENT_SYMBOL] = new WeakRef(value);
      // leave commandfor attribute empty if element passed in to mimic default behavior
      this.setAttribute("commandfor", "");
    } else {
      delete this[COMMAND_ELEMENT_SYMBOL];
      this.removeAttribute("commandfor");
    }
  },
  enumerable: true,
  configurable: true,
};
const commandTriggerProperty = {
  get: function () {
    let def = null;
    if (this.command && this.commandForElement) {
      def = "click";
      switch (this.tagName) {
        case "INPUT":
          // skip if an input button
          if (["submit", "reset", "button"].includes(this.type)) {
            break;
          }
        case "SELECT":
        case "TEXTAREA":
          def = "change";
          break;
      }
    }
    return this.getAttribute("commandtrigger") || def;
  },
  set: function (value) {
    this.setAttribute("commandtrigger", value);
  },
  enumerable: true,
  configurable: true,
};
Object.defineProperty(
  Element.prototype,
  "customCommand",
  customCommandProperty,
);
Object.defineProperty(HTMLInputElement.prototype, "command", commandProperty);
Object.defineProperty(
  HTMLInputElement.prototype,
  "commandForElement",
  commandForElementProperty,
);
Object.defineProperty(
  HTMLInputElement.prototype,
  "commandTrigger",
  commandTriggerProperty,
);
Object.defineProperty(HTMLSelectElement.prototype, "command", commandProperty);
Object.defineProperty(
  HTMLSelectElement.prototype,
  "commandForElement",
  commandForElementProperty,
);
Object.defineProperty(
  HTMLSelectElement.prototype,
  "commandTrigger",
  commandTriggerProperty,
);
Object.defineProperty(
  HTMLTextAreaElement.prototype,
  "command",
  commandProperty,
);
Object.defineProperty(
  HTMLTextAreaElement.prototype,
  "commandForElement",
  commandForElementProperty,
);
Object.defineProperty(
  HTMLTextAreaElement.prototype,
  "commandTrigger",
  commandTriggerProperty,
);
// override the command property, so it will return non-standard method names
Object.defineProperty(HTMLButtonElement.prototype, "command", commandProperty);
// button already has commandForElement property
Object.defineProperty(
  HTMLButtonElement.prototype,
  "commandTrigger",
  commandTriggerProperty,
);

class CommandBehavior {
  static observedAttributes = ["commandtrigger"];
  static commmandTriggerEvent(event) {
    const el = event.currentTarget;
    const commandTarget = el.commandForElement;
    let commandName = el.command;
    if (!commandTarget || !commandName) {
      return;
    }
    if (
      el.tagName === "BUTTON" &&
      el.commandTrigger === "click" &&
      (commandName.startsWith("--") ||
        BUILTIN_COMMAND_NAMES.includes(commandName))
    ) {
      // let built in behavior take course.
      return;
    }
    if (commandTarget) {
      const commandEvt = new CommandEvent("command", {
        command: commandName,
        source: el,
      });
      const allowDefault = commandTarget.dispatchEvent(commandEvt);
      if (!commandName.startsWith("--") && allowDefault) {
        commandName = commandName.replace(/-./g, (match) =>
          match[1].toUpperCase(),
        );
        if (typeof commandTarget[commandName] === "function") {
          commandTarget[commandName](event);
        }
      }
    }
  }
  constructor(element, options) {
    // Initialize existing properties to trigger their setters if they exist
    if (element.hasOwnProperty("commandTrigger")) {
      const trigger = element.commandTrigger;
      delete element.commandTrigger;
      element.commandTrigger = trigger;
    }
    if (element.hasOwnProperty("commandForElement")) {
      const commandForElement = element.commandForElement;
      delete element.commandForElement;
      if (!element.getAttribute("commandfor")) {
        element.commandForElement = commandForElement;
      }
    }
    if (element.hasOwnProperty("command")) {
      const command = element.command;
      delete element.command;
      element.command = command;
    }
  }
  attributeChangedCallback(element, name, oldValue, newValue) {
    if (newValue === null) {
      newValue = element.commandTrigger;
    } else if (oldValue === null) {
      oldValue = "click";
      switch (element.tagName) {
        case "INPUT":
          // skip if an input button
          if (["submit", "reset", "button"].includes(element.type)) {
            break;
          }
        case "SELECT":
        case "TEXTAREA":
          oldValue = "change";
          break;
      }
    }
    element.removeEventListener(oldValue, CommandBehavior.commmandTriggerEvent);
    element.addEventListener(newValue, CommandBehavior.commmandTriggerEvent);
  }
  connectedCallback(element) {
    const eventName = element.commandTrigger;
    element.addEventListener(eventName, CommandBehavior.commmandTriggerEvent);
  }
  disconnectedCallback(element) {
    const eventName = element.commandTrigger;
    element.removeEventListener(
      eventName,
      CommandBehavior.commmandTriggerEvent,
    );
  }
  connectedMoveCallback(element) {
    //do nothing.
  }
}

window.customBehaviors.define("command", CommandBehavior, {
  asQuery: ":is(button,input,select,textarea)[command]",
  asAttribute: "tabindex",
});

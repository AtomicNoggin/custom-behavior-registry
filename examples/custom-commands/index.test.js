/** @jest-environment jsdom */

import {
  afterEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

const TestCommandEvent = class CommandEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    Object.defineProperties(this, {
      command: { value: init.command },
      source: { value: init.source },
    });
  }
};
globalThis.CommandEvent = TestCommandEvent;
window.CommandEvent = TestCommandEvent;

Map.prototype.getOrInsert =
  Map.prototype.getOrInsert ||
  function getOrInsert(name, value) {
    if (!this.has(name)) {
      this.set(name, value);
    }
    return this.get(name);
  };

await import("./index.js");

const connect = (element) => {
  document.body.append(element);
  window.customBehaviors.update(element);
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("CustomCommandsBehavior", () => {
  test("creates a command registry on an element", () => {
    const target = document.createElement("div");
    const registry = target.customCommand;

    expect(registry).toBe(target.customCommand);
    expect(registry.has("--missing")).toBe(false);
    expect(registry.get("--missing")).toBeUndefined();
  });

  test("validates and stores command definitions", () => {
    const target = document.createElement("div");
    const method = jest.fn();

    expect(() => target.customCommand.define("invalid", method)).toThrow(
      "Command name must be a custom command starting with '--'",
    );
    expect(() => target.customCommand.define("--test", "not a function")).toThrow(
      "Command method must be a function",
    );

    target.customCommand.define("--test", method);

    expect(target.customCommand.has("--test")).toBe(true);
    expect(target.customCommand.get("--test").method).toEqual(expect.any(Function));
    target.customCommand.fire("--test", "argument");
    expect(method).toHaveBeenCalledWith("argument");
  });

  test("binds commands to the registry element by default", () => {
    const target = document.createElement("div");
    let receiver;

    target.customCommand.define("--receiver", function () {
      receiver = this;
    });

    target.customCommand.fire("--receiver");

    expect(receiver).toBe(target);
  });

  test("dispatches a triggered custom command with mapped arguments", () => {
    const target = document.createElement("div");
    target.id = "command-target";
    const source = document.createElement("button");
    source.value = "value";
    source.command = "--inspect";
    source.commandForElement = target;
    source.commandTrigger = "command-click";
    const method = jest.fn();

    target.customCommand.define("--inspect", method, {
      arguments: ["event", "command", "source", "source.value", "literal"],
    });
    connect(target);
    connect(source);
    source.dispatchEvent(new Event("command-click"));

    expect(method).toHaveBeenCalledTimes(1);
    const [event, command, eventSource, sourceValue, literal] = method.mock.calls[0];
    expect(event).toBeInstanceOf(CommandEvent);
    expect(event.command).toBe("--inspect");
    expect(command).toBe("--inspect");
    expect(eventSource).toBe(source);
    expect(sourceValue).toBe("value");
    expect(literal).toBe("literal");
  });

  test("uses change as the default trigger for select controls", () => {
    const target = document.createElement("div");
    target.id = "change-target";
    const source = document.createElement("select");
    source.command = "--selected";
    source.commandForElement = target;
    source.innerHTML = '<option value="one">One</option>';
    const method = jest.fn();

    target.customCommand.define("--selected", method, { arguments: ["source.value"] });
    connect(target);
    connect(source);

    expect(source.commandTrigger).toBe("change");
    source.value = "one";
    source.dispatchEvent(new Event("change"));

    expect(method).toHaveBeenCalledWith("one");
  });

  test("invokes allowed built-in command methods", () => {
    const target = document.createElement("div");
    target.id = "builtin-target";
    target.showModal = jest.fn();
    const source = document.createElement("button");
    source.command = "show-modal";
    source.commandForElement = target;
    source.commandTrigger = "command-click";

    connect(target);
    connect(source);
    source.dispatchEvent(new Event("command-click"));

    expect(target.showModal).toHaveBeenCalledWith(expect.any(Event));
  });

  test("stops dispatching after a command is undefined", () => {
    const target = document.createElement("div");
    const method = jest.fn();
    target.customCommand.define("--temporary", method);
    target.customCommand.undefine("--temporary");

    expect(target.customCommand.has("--temporary")).toBe(false);
    expect(() => target.customCommand.fire("--temporary")).toThrow(
      'Command "--temporary" is not registered on this element',
    );
  });
});

/** @jest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

Map.prototype.getOrInsert ??= function getOrInsert(key, value) {
  if (!this.has(key)) this.set(key, value);
  return this.get(key);
};

const {
  IntlLangLoadEvent,
  addToLangChangeListener,
  closestLocale,
  getCurrentLocales,
  registerLoaderAction,
  removeFromLangChangeListener,
  unregisterLoaderAction,
} = await import("./intl-common.js");

const JSLN = (await import("jsln")).default;

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe("intl-common", () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = "en-US";
  });

  afterEach(() => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute("lang");
    jest.restoreAllMocks();
  });

  test("defines an intlOptions property that serializes to the intl-options attribute", () => {
    const element = document.createElement("div");

    element.intlOptions = { greeting: "Hello", count: 3, active: true };

    expect(element.intlOptions).toEqual({ greeting: "Hello", count: 3, active: true });
    expect(
      JSLN.parse(`{${element.getAttribute("intl-options")}}`, { strictMode: true }),
    ).toEqual({ greeting: "Hello", count: 3, active: true });

    element.intlOptions.count = 5;
    expect(
      JSLN.parse(`{${element.getAttribute("intl-options")}}`, { strictMode: true }),
    ).toEqual({ greeting: "Hello", count: 5, active: true });
  });

  test("finds the closest locale and includes the document locale in the current locale set", () => {
    const wrapper = document.createElement("section");
    wrapper.lang = "fr-CA";
    const child = document.createElement("p");
    wrapper.appendChild(child);
    document.body.appendChild(wrapper);

    expect(closestLocale(child)).toEqual(Intl.getCanonicalLocales("fr-CA"));

    const locales = getCurrentLocales();
    expect(locales.has("fr-CA")).toBe(true);
    expect(locales.has("en-US")).toBe(true);
  });

  test("registers locale loaders and emits langload events during an intl-langchange", async () => {
    const events = [];
    const loader = jest.fn(async (lang) => {
      events.push(`loader:${lang}`);
      return lang;
    });
    registerLoaderAction(loader);

    const element = document.createElement("p");
    element.lang = "fr";
    document.body.appendChild(element);

    const onLoad = (event) => {
      events.push(`langload:${event.detail.state}:${event.detail.lang}`);
    };
    document.addEventListener("intl-langload", onLoad);

    const callback = jest.fn();
    addToLangChangeListener(element, callback);

    element.dispatchEvent(
      new CustomEvent("intl-langchange", {
        bubbles: true,
        detail: { newValue: "fr" },
      }),
    );

    await flushMicrotasks();

    expect(loader).toHaveBeenCalledWith("fr");
    expect(events).toContain("loader:fr");
    expect(events).toContain("langload:start:fr");
    expect(events).toContain("langload:end:fr");
    expect(callback).toHaveBeenCalled();

    document.removeEventListener("intl-langload", onLoad);
    unregisterLoaderAction(loader);
    removeFromLangChangeListener(element, callback);
  });

  test("tracks lang listeners and removes them cleanly when no longer needed", () => {
    const element = document.createElement("div");
    const callback = jest.fn();

    addToLangChangeListener(element, callback);
    expect(typeof element.intlUpdate).toBe("function");

    const before = element[Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "langchange-callbacks")];
    expect(before).toBeDefined();

    removeFromLangChangeListener(element, callback);
    const after = element[Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "langchange-callbacks")];

    expect(after).toBeUndefined();
    expect(element.intlUpdate).toBeUndefined();
  });

  test("creates an IntlLangLoadEvent with the expected detail payload", () => {
    const event = new IntlLangLoadEvent({ state: "start", lang: "fr" });

    expect(event.type).toBe("intl-langload");
    expect(event.detail).toEqual({ state: "start", lang: "fr" });
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(false);
  });
});

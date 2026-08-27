import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import CustomBehaviorRegistry from "../../index.js";

Map.prototype.getOrInsert ??= function getOrInsert(key, value) {
  if (!this.has(key)) {
    this.set(key, value);
  }
  return this.get(key);
};

describe("intl-data", () => {
  let registry;
  let originalNumberFormat;

  beforeAll(async () => {
    document.body.innerHTML = "";
    globalThis.CustomBehaviorRegistry = CustomBehaviorRegistry;
    originalNumberFormat = Intl.NumberFormat;
    Intl.NumberFormat = class NumberFormat {
      constructor(locale, options) {
        this.locale = locale;
        this.options = options;
      }

      format(value) {
        return `${this.locale}:${this.options.style}:${this.options.currency}:${value}`;
      }
    };
    await import("./index.js");
    registry = window.customBehavior;
  });

  afterAll(() => {
    CustomBehaviorRegistry.undefineAllBehaviors(registry);
    CustomBehaviorRegistry.disconnect(registry);
    Intl.NumberFormat = originalNumberFormat;
    delete window.customBehavior;
    delete globalThis.CustomBehaviorRegistry;
    document.body.innerHTML = "";
  });

  test("formats a number data value with its locale and intlOptions", async () => {
    const element = document.createElement("data");
    element.lang = "en-CA";
    element.value = "1234.5";
    element.intlFormat = "number";
    element.intlOptions = { style: "currency", currency: "CAD" };
    element.textContent = "unformatted number";

    document.body.append(element);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(element.textContent).toBe("en-CA:currency:CAD:1234.5");
    expect(element.getAttribute("intl-options")).toBe(
      "style:'currency',currency:'CAD'",
    );
    element.remove();
  });
});
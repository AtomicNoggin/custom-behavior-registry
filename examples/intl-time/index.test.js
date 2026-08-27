import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";
import CustomBehaviorRegistry from "../../index.js";

Map.prototype.getOrInsert ??= function getOrInsert(key, value) {
  if (!this.has(key)) {
    this.set(key, value);
  }
  return this.get(key);
};

describe("intl-time element properties", () => {
  let registry;
  let originalTemporal;

  beforeAll(async () => {
    document.body.innerHTML = "";
    globalThis.CustomBehaviorRegistry = CustomBehaviorRegistry;
    delete window.customBehavior;
    originalTemporal = globalThis.Temporal;
    globalThis.Temporal = {
      Now: {
        timeZoneId: () => "America/Toronto",
      },
      PlainDate: {
        from: ({ year, month, day }) => ({
          toZonedDateTime: () => ({
            calendarId: "iso8601",
            toLocaleString: (locale, options) => {
              expect(locale).toEqual(["en-CA"]);
              expect(options).toMatchObject({
                requestedFormat: "date",
                dateStyle: "long",
                calendar: "iso8601",
              });
              expect({ year, month, day }).toEqual({
                year: 2026,
                month: 8,
                day: 27,
              });
              return "August 27, 2026";
            },
          }),
        }),
      },
    };
    await import("./index.js");
    registry = window.customBehavior;
  });

  afterAll(() => {
    CustomBehaviorRegistry.undefineAllBehaviors(registry);
    CustomBehaviorRegistry.disconnect(registry);
    delete window.customBehavior;
    delete globalThis.CustomBehaviorRegistry;
    if (originalTemporal === undefined) {
      delete globalThis.Temporal;
    } else {
      globalThis.Temporal = originalTemporal;
    }
    document.body.innerHTML = "";
  });

  test("stores a simple intlOptions object as brace-less strict JSLN", () => {
    const element = document.createElement("time");

    element.intlOptions = {
      month: "long",
      timeZone: "America/Toronto",
      hour12: false,
    };

    expect(element.getAttribute("intl-options")).toBe(
      "month:'long',timeZone:'America/Toronto',hour12:false",
    );
    expect(element.intlOptions).toEqual({
      month: "long",
      timeZone: "America/Toronto",
      hour12: false,
    });
  });

  test("returns an empty object when intl-options is absent", () => {
    expect(document.createElement("time").intlOptions).toEqual({});
  });

  test("rejects non-simple values assigned to intlOptions", () => {
    const element = document.createElement("time");

    expect(() => {
      element.intlOptions = null;
    }).toThrow("intlOptions must be a simple options object");
    expect(() => {
      element.intlOptions = [];
    }).toThrow("intlOptions must be a simple options object");
    expect(() => {
      element.intlOptions = new Date();
    }).toThrow("intlOptions must be a simple options object");
  });

  test("reflects intlFormat and intlSkeleton properties to attributes", () => {
    const element = document.createElement("time");

    element.intlFormat = "datetime long short";
    element.intlSkeleton = "yMMMd";

    expect(element.getAttribute("intl-format")).toBe("datetime long short");
    expect(element.intlFormat).toBe("datetime long short");
    expect(element.getAttribute("intl-skeleton")).toBe("yMMMd");
    expect(element.intlSkeleton).toBe("yMMMd");
  });

  test("formats a connected time element's text content", async () => {
    const element = document.createElement("time");
    element.lang = "en-CA";
    element.dateTime = "2026-08-27";
    element.intlFormat = "date long";
    element.textContent = "unformatted date";

    document.body.append(element);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(element.textContent).toBe("August 27, 2026");
    element.remove();
  });
});
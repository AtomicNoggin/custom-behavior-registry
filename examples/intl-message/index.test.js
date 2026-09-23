/** @jest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSLN from "jsln";
import IntlAttributeMessagesBehavior from "./intl-attribute-messages.js";
import IntlMessageBehavior from "./intl-message.js";
import {
  IntlLinkLoaderBehavior,
  IntlScriptLoaderBehavior,
} from "./intl-message-loaders.js";

Map.prototype.getOrInsert ??= function getOrInsert(key, value) {
  if (!this.has(key)) this.set(key, value);
  return this.get(key);
};

await import("./index.js");

const directory = path.dirname(fileURLToPath(import.meta.url));
const readFixture = (name) =>
  fs.readFileSync(path.join(directory, name), "utf8");

const loadMessages = (messages, locale) => {
  Intl.$formattedMessages.loadFromObject(messages, locale);
};

const append = (element) => {
  document.body.append(element);
  return element;
};

beforeEach(() => {
  document.documentElement.lang = "en";
});

afterEach(() => {
  Intl.$formattedMessages.clearAll();
  jest.restoreAllMocks();
  document.body.replaceChildren();
  document.documentElement.removeAttribute("lang");
});

describe("intl-message example", () => {
  describe("IntlFormattedMessageCache", () => {
    test("flattens nested messages and formats them by locale", () => {
      loadMessages({
        en: { account: { greeting: "Hello, {name}!" } },
      });

      const formatter = Intl.$formattedMessages.get("en", "account.greeting");

      expect(formatter.format({ name: "Ada" })).toBe("Hello, Ada!");
      expect(Intl.$formattedMessages.has("en", "account.greeting")).toBe(true);
    });

    test("falls back from a regional locale to its language", () => {
      loadMessages({
        en: { greeting: "Hello" },
      });

      expect(
        Intl.$formattedMessages.get("en-CA", "greeting").format(),
      ).toBe("Hello");
    });

    test("supports loading one locale object with an explicit locale", () => {
      loadMessages({ greeting: "Bonjour" }, "fr-CA");

      expect(Intl.$formattedMessages.get("fr-CA", "greeting").format()).toBe(
        "Bonjour",
      );
    });

    test("deletes individual messages and locale prefixes", () => {
      loadMessages({
        en: {
          account: { name: "Ada", status: "Active" },
          greeting: "Hello",
        },
      });

      Intl.$formattedMessages.delete("greeting", "en");
      Intl.$formattedMessages.clearMessagesLike("account", "en");

      expect(Intl.$formattedMessages.has("en", "greeting")).toBe(false);
      expect(Intl.$formattedMessages.has("en", "account.name")).toBe(false);
    });
  });

  describe("IntlMessageBehavior", () => {
    test("formats connected text with localized message options", () => {
      loadMessages({ en: { greeting: "Hello, {name}!" } });
      const element = append(document.createElement("p"));
      element.setAttribute("intl-message", "greeting");
      element.setAttribute("intl-options", "name:'Ada'");
      const behavior = new IntlMessageBehavior(element);

      behavior.connectedCallback(element);

      expect(element.textContent).toBe("Hello, Ada!");
      expect(element.intlMessage).toBe("greeting");
      expect(element.intlOptions).toEqual({ name: "Ada" });
      behavior.disconnectedCallback(element);
    });

    test("uses original text as fallback and restores it on disconnect", () => {
      const element = append(document.createElement("p"));
      element.setAttribute("intl-message", "missing");
      element.textContent = "Fallback text";
      const behavior = new IntlMessageBehavior(element);

      behavior.connectedCallback(element);
      expect(element.textContent).toBe("Fallback text");

      loadMessages({ en: { missing: "Loaded text" } });
      behavior.format(element, true);
      expect(element.textContent).toBe("Loaded text");

      behavior.disconnectedCallback(element);
      expect(element.textContent).toBe("Fallback text");
    });

    test("reformats when message options change", () => {
      loadMessages({ en: { inbox: "You have {count} messages" } });
      const element = append(document.createElement("p"));
      element.setAttribute("intl-message", "inbox");
      element.setAttribute("intl-options", "count:1");
      const behavior = new IntlMessageBehavior(element);

      behavior.connectedCallback(element);
      element.intlOptions = { count: 3 };
      behavior.attributeChangedCallback(element, "intl-options");

      expect(element.textContent).toBe("You have 3 messages");
      behavior.disconnectedCallback(element);
    });

    test("uses the closest valid locale when the document locale changes", () => {
      loadMessages({
        en: { greeting: "Hello" },
        fr: { greeting: "Bonjour" },
      });
      const section = append(document.createElement("section"));
      section.lang = "fr";
      const element = section.appendChild(document.createElement("p"));
      element.setAttribute("intl-message", "greeting");
      const behavior = new IntlMessageBehavior(element);

      behavior.connectedCallback(element);
      expect(element.textContent).toBe("Bonjour");

      section.lang = "en";
      behavior.format(element, true);
      expect(element.textContent).toBe("Hello");
      behavior.disconnectedCallback(element);
    });
  });

  describe("IntlAttributeMessagesBehavior", () => {
    test("formats mapped attributes with localized options", () => {
      loadMessages({ en: { placeholder: "Enter {name}" } });
      const element = append(document.createElement("input"));
      element.placeholder = "Enter your name";
      element.setAttribute(
        "intl-attribute-messages",
        "placeholder:'placeholder'",
      );
      element.setAttribute("intl-attribute-options-placeholder", "name:'Ada'");
      const behavior = new IntlAttributeMessagesBehavior(element);

      behavior.connectedCallback(element);

      expect(element.placeholder).toBe("Enter Ada");
      behavior.disconnectedCallback(element);
      expect(element.placeholder).toBe("Enter your name");
    });

    test("supports the true mapping shorthand for an attribute fallback", () => {
      loadMessages({ en: { "Initial label": "Localized label" } });
      const element = append(document.createElement("input"));
      element.title = "Initial label";
      element.setAttribute("intl-attribute-messages", "title:true");
      const behavior = new IntlAttributeMessagesBehavior(element);

      behavior.connectedCallback(element);

      expect(element.title).toBe("Localized label");
      behavior.disconnectedCallback(element);
      expect(element.title).toBe("Initial label");
    });

    test("updates attribute message and option properties", () => {
      const element = document.createElement("input");

      element.intlAttributeMessages = { placeholder: "placeholder" };
      element.intlAttributeOptions = { placeholder: { count: 2 } };

      expect(element.getAttribute("intl-attribute-messages")).toBe(
        "placeholder:'placeholder'",
      );
      expect(element.intlAttributeOptions.placeholder).toEqual({ count: 2 });

      delete element.intlAttributeOptions.placeholder;
      expect(
        element.hasAttribute("intl-attribute-options-placeholder"),
      ).toBe(false);
    });
  });

  describe("IntlScriptLoaderBehavior", () => {
    test("loads locale-keyed inline messages", () => {
      const script = document.createElement("script");
      script.textContent = JSLN.stringify({
        en: { greeting: "Hello" },
        fr: { greeting: "Bonjour" },
      });

      new IntlScriptLoaderBehavior().connectedCallback(script);

      expect(Intl.$formattedMessages.get("en", "greeting").format()).toBe(
        "Hello",
      );
      expect(Intl.$formattedMessages.get("fr", "greeting").format()).toBe(
        "Bonjour",
      );
    });

    test("wraps a lang-qualified inline object in its locale", () => {
      const script = document.createElement("script");
      script.lang = "fr";
      script.textContent = JSLN.stringify({ greeting: "Bonjour" });

      new IntlScriptLoaderBehavior().connectedCallback(script);

      expect(Intl.$formattedMessages.has("fr", "greeting")).toBe(true);
      expect(Intl.$formattedMessages.has("en", "greeting")).toBe(false);
    });

    test("reports invalid inline message data without throwing", () => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      const script = document.createElement("script");
      script.textContent = "{not valid";

      expect(() => new IntlScriptLoaderBehavior().connectedCallback(script)).not.toThrow();
      expect(error).toHaveBeenCalledWith(
        "Failed to load messages from script:",
        expect.any(Error),
      );
    });
  });

  describe("IntlLinkLoaderBehavior", () => {
    test("loads an hreflang resource only once", async () => {
      const originalFetch = globalThis.fetch;
      const fetchMock = jest.fn().mockResolvedValue({
        text: async () => readFixture("en/hreflang.json"),
      });
      globalThis.fetch = fetchMock;
      const link = document.createElement("link");
      link.href = "./en/hreflang.json";
      link.hreflang = "en";
      const behavior = new IntlLinkLoaderBehavior();

      try {
        await behavior.loadLocale(link, "en");
        await behavior.loadLocale(link, "en");
      } finally {
        if (originalFetch) globalThis.fetch = originalFetch;
        else delete globalThis.fetch;
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(
        Intl.$formattedMessages.get("en", "hreflang.greeting").format(),
      ).toBe("This is loaded from the linked JSON file via hreflang");
    });

    test("expands a single-locale hrefpattern", async () => {
      const originalFetch = globalThis.fetch;
      const fetchMock = jest.fn().mockResolvedValue({
        text: async () => readFixture("fr/hrefpattern.json"),
      });
      globalThis.fetch = fetchMock;
      const link = document.createElement("link");
      const behavior = new IntlLinkLoaderBehavior();
      behavior.urlBuilder = {
        hasNamedValue: (name) => name === "lang",
        exec: ({ lang }) => `./${lang}/hrefpattern.json`,
      };

      try {
        await behavior.loadLocale(link, "fr");
      } finally {
        if (originalFetch) globalThis.fetch = originalFetch;
        else delete globalThis.fetch;
      }

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/fr/hrefpattern.json"),
      );
      expect(
        Intl.$formattedMessages.get("fr", "hrefpattern.greeting").format(),
      ).toBe("Ceci est chargé à partir du fichier JSON lié via hrefpattern");
    });

    test("loads an href immediately when no locale is specified", async () => {
      const originalFetch = globalThis.fetch;
      const fetchMock = jest.fn().mockResolvedValue({
        text: async () => readFixture("en/hreflang.json"),
      });
      globalThis.fetch = fetchMock;
      const link = document.createElement("link");
      link.href = "./en/hreflang.json";
      const behavior = new IntlLinkLoaderBehavior();

      try {
        await behavior.connectedCallback(link);
        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        if (originalFetch) globalThis.fetch = originalFetch;
        else delete globalThis.fetch;
      }

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(Intl.$formattedMessages.has("en", "hreflang.greeting")).toBe(true);
    });

  });

  describe("HTML fixture", () => {
    test("documents both link loading modes in the HTML fixture", () => {
      const html = readFixture("index.html");
      const documentFromFixture = new DOMParser().parseFromString(
        html,
        "text/html",
      );
      const links = [...documentFromFixture.querySelectorAll("link")];

      expect(
        links.filter((link) => link.rel === "intl-messageformat"),
      ).toHaveLength(3);
      expect(
        links.some(
          (link) =>
            link.href.endsWith("/en/hreflang.json") && link.hreflang === "en",
        ),
      ).toBe(true);
      expect(
        links.some(
          (link) =>
            link.getAttribute("hrefpattern") === "./:lang/hrefpattern.json",
        ),
      ).toBe(true);
      const frenchScript = documentFromFixture.querySelector(
        'script[type="intl-messageformat"][lang="fr"]',
      );
      expect(() => JSLN.parse(frenchScript.textContent)).not.toThrow();
    });
  });
});
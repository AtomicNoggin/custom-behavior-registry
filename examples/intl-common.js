import CustomBehaviorRegistry from "../index.js";
import JSLN from "jsln";

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

const intlOptionsProperty = {
  configurable: true,
  enumerable: true,
  get() {
    const options = this.getAttribute("intl-options");
    return options === null
      ? {}
      : JSLN.parse(`{${options}}`, { strictMode: true });
  },
  set(value) {
    if (
      value === null ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    ) {
      throw new TypeError("intlOptions must be a simple options object");
    }
    const jsln = JSLN.stringify(value);
    this.setAttribute("intl-options", jsln.slice(1, -1));
  },
};

delete HTMLElement.prototype.intlOptions;
Object.defineProperty(
  HTMLElement.prototype,
  "intlOptions",
  intlOptionsProperty,
);

class IntlLang {
  static observedAttributes = ["lang"];
  lastValue = null;
  constructor(element, options) {
  }
  attributeChangedCallback(element, attributeName, oldValue, newValue) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: { oldValue, newValue, fromDisconnect: null },
    });
    element.dispatchEvent(event);
    this.lastValue = newValue;
  }
  connectedCallback(element) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: {
        oldValue: undefined,
        newValue: element.lang,
        fromDisconnect: null,
      },
    });
    element.dispatchEvent(event);
    this.lastValue = element.lang;
  }
  disconnectedCallback(element) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: {
        oldValue: element.lang || this.lastValue,
        newValue: undefined,
        fromDisconnect: element,
      },
    });
    document.dispatchEvent(event);
  }
}
customBehavior.define("intl-lang", IntlLang, { asAttribute: "lang" });

export const closestLocale = (element) => {
  let current = element;
  while (current) {
    if (current.lang) {
      try {
        return Intl.getCanonicalLocales(current.lang);
      } catch {}
    }
    current = current.parentElement;
  }
  return navigator.languages;
};

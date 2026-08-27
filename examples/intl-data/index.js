import JSLN from "jsln";

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

Object.defineProperty(HTMLDataElement.prototype, "intlOptions", intlOptionsProperty);

Object.defineProperty(HTMLDataElement.prototype, "intlFormat", {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("intl-format") || "";
  },
  set(value) {
    this.setAttribute("intl-format", String(value));
  },
});

const closestLocale = (element) => {
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

class IntlNumber {
  static observedAttributes = ["intl-format", "intl-options", "value", "lang"];

  constructor(element) {
    this.initialContent = element.textContent;
  }

  format(element) {
    const value = Number(element.value);
    element.textContent = Number.isNaN(value)
      ? this.initialContent
      : new Intl.NumberFormat(closestLocale(element), element.intlOptions).format(value);
  }

  connectedCallback(element) {
    this.format(element);
  }

  attributeChangedCallback(element) {
    this.format(element);
  }

  disconnectedCallback(element) {
    element.textContent = this.initialContent;
  }
}

const registry =
  window.customBehavior ||
  new CustomBehaviorRegistry({
    attributeFilter: ["intl-format", "intl-options", "value", "lang"],
  });

window.customBehavior = registry;
registry.define('data[intl-format="number"]', IntlNumber);

import { closestLocale } from "../intl-common.js";

const ALLOWED_FORMATS = ["number", "decimal", "currency", "percent", "unit"];

Object.defineProperties(HTMLDataElement.prototype, {
  intlFormat: {
    configurable: true,
    enumerable: true,
    get() {
      return this.getAttribute("intl-format") || "";
    },
    set(value) {
      if (ALLOWED_FORMATS.includes(value)) {
        this.setAttribute("intl-format", String(value));
      } else {
        console.error(
          `Unexpected intl-format value '${value}'. Please use one of the following: ${ALLOWED_FORMATS.join(
            ", "
          )}.`
        );
      }
    },
  },
  intlCurrency: {
    configurable: true,
    enumerable: true,
    get() {
      return this.getAttribute("intl-currency") || "";
    },
    set(value) {
      if (Intl.supportedValuesOf("currency").includes(value)) {
        this.setAttribute("intl-currency", String(value));
      } else {
        console.error(
          `Unexpected intl-currency value '${value}'. Please use a valid currency from Intl.supportedValuesOf("currency").`
        );
      }
    },
  },
  intlUnit: {
    configurable: true,
    enumerable: true,
    get() {
      return this.getAttribute("intl-unit") || "";
    },
    set(value) {
      if (Intl.supportedValuesOf("unit").includes(value)) {
        this.setAttribute("intl-unit", String(value));
      } else {
        console.error(
          `Unexpected intl-unit value '${value}'. Please use a valid unit from Intl.supportedValuesOf("unit").`
        );
      }
    },
  },
});

class IntlData {
  static observedAttributes = ["intl-format", "intl-currency", "intl-unit", "intl-options", "value"];

  constructor(element) {
    this.initialContent = element.textContent;
  }

  format(element) {
    const value = Number(element.value);
    const format = element.intlFormat;
    const options = { ...(element.intlOptions || {}) };

    if (["decimal", "currency", "percent", "unit"].includes(format)) {
      options.style = format;
    }

    if (format === "currency" && element.hasAttribute("intl-currency")) {
      options.currency = element.getAttribute("intl-currency");
    }

    if (format === "unit" && element.hasAttribute("intl-unit")) {
      options.unit = element.getAttribute("intl-unit");
    }

    element.textContent = Number.isNaN(value)
      ? this.initialContent
      : new Intl.NumberFormat(closestLocale(element), options).format(value);
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

const registry = window.customBehavior;
registry.define("intl-data-format", IntlData, { asTag: "data" });

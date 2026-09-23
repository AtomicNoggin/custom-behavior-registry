import { customBehaviors, closestLocale, addToLangChangeListener, removeFromLangChangeListener } from "../intl-common.js";
import JSLN from "jsln";

const ALLOWED_FORMATS = ["number", "decimal", "currency", "percent", "unit"];

Object.defineProperties(HTMLDataElement.prototype, {
  intlFormat: {
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

export default class IntlData {
  static observedAttributes = ["intl-format", "intl-currency", "intl-unit", "intl-options", "value"];
  static tagFilter = ['data'];

  constructor(element) {
    // Initialize existing properties to trigger their setters
    if (element.hasOwnProperty("intlOptions")) {
      const options = element.intlOptions;
      delete element.intlOptions;
      element.intlOptions = options;
    }
    if (element.hasOwnProperty("intlFormat")) {
      const format = element.intlFormat;
      delete element.intlFormat;
      element.intlFormat = format;
    }
    if (element.hasOwnProperty("intlCurrency")) {
      const currency = element.intlCurrency;
      delete element.intlCurrency;
      element.intlCurrency = currency;
    }
    if (element.hasOwnProperty("intlUnit")) {
      const unit = element.intlUnit;
      delete element.intlUnit;
      element.intlUnit = unit;
    }
  }
  format(element, forceUpdate) {
    const value = Number(element.value);
    const format = element.intlFormat;
    const options = { ...(element.intlOptions || {}) };
    const locale = closestLocale(element);
    if (forceUpdate) {
      this.sig = null;
    }
    if (["decimal", "currency", "percent", "unit"].includes(format)) {
      options.style = format;
    }

    if (format === "currency" && element.hasAttribute("intl-currency")) {
      options.currency = element.getAttribute("intl-currency");
    }

    if (format === "unit" && element.hasAttribute("intl-unit")) {
      options.unit = element.getAttribute("intl-unit");
    }
    console.log("Formatting with locale:", locale, "format:", format, "options:", options);
    const sig = `${value}:${locale}:${format}:${JSLN.stringify(options)}`;
    if (sig !== this.sig) {
      console.log("Signature:", sig, "previous signature:", this.sig);
      this.sig = sig;
      element.textContent = Number.isNaN(value)
        ? this.initialContent
        : new Intl.NumberFormat(locale, options).format(value);
    }
  }
  elementFormatMethod;
  connectedCallback(element) {
    this.initialContent = element.textContent;
    this.elementFormatMethod = (forceUpdate) => this.format(element, forceUpdate);
    addToLangChangeListener(element, this.elementFormatMethod);
    this.format(element);
  }

  attributeChangedCallback(element, attributeName, oldValue, newValue) {
    this.format(element);
  }

  disconnectedCallback(element) {
    removeFromLangChangeListener(element, this.elementFormatMethod);
    element.textContent = this.initialContent;
  }
}
customBehaviors.whenDefined("intl-lang").then(() => {
  customBehaviors.define("intl-data", IntlData, { asAttribute: "intl-format" });
}
);

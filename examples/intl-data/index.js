import { customBehaviors, closestLocale, addToLangChangeListener, removeFromLangChangeListener } from "../intl-common.js";
import JSLN from "jsln";

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

export default class IntlData {
  static observedAttributes = ["intl-format", "intl-currency", "intl-unit", "intl-options", "value"];
  static tafFilter = ['data'];

  constructor(element) {
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
    const sig = `${locale}:${format}:${JSLN.stringify(options)}`;
    if (sig !== this.sig) {
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

  attributeChangedCallback(element) {
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

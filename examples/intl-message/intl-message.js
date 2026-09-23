import JSLN from "jsln";
import {
  addToLangChangeListener,
  removeFromLangChangeListener,
  closestLocale,
} from "../intl-common.js";

const IntlMessageProperty = {
  get() {
    return this.getAttribute("intl-message");
  },
  set(value) {
    this.setAttribute("intl-message", value);
  },
};

Object.defineProperty(
  HTMLElement.prototype,
  "intlMessage",
  IntlMessageProperty,
);

export default class IntlMessageBehavior {
  static observedAttributes = ["intl-message", "intl-options"];
  static tagExcludes = [
    "br",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "time",
    "data",
    "script",
    "style",
  ];

  constructor(element) {
    // Initialize existing properties to trigger their setters if they exist
    if (element.hasOwnProperty("intlMessage")) {
      const message = element.intlMessage;
      delete element.intlMessage;
      element.intlMessage = message;
    }
    if (element.hasOwnProperty("intlOptions")) {
      const options = element.intlOptions;
      delete element.intlOptions;
      element.intlOptions = options;
    }
  }

  format(element, forceUpdate) {
    if (forceUpdate) this.sig = null;
    const realFallback = this.fallback || element.intlMessage;
    const realMessageLabel = element.intlMessage || this.fallback;
    if (!realMessageLabel) return;
    const locale = closestLocale(element);
    const messageOptions = element.intlOptions;
    const sig = `${locale}:${realMessageLabel}:${JSLN.stringify(messageOptions)}`;
    if (sig !== this.sig) {
      this.sig = sig;
      const formatter = Intl.$formattedMessages.getOrInsert(
        locale,
        realMessageLabel,
        realFallback,
      );
      element.textContent = formatter.format(messageOptions);
    }
  }

  connectedCallback(element) {
    this.fallback = element.textContent;
    this.elementCallback = (forceUpdate) => this.format(element, forceUpdate);
    addToLangChangeListener(element, this.elementCallback);
    this.format(element);
  }

  disconnectedCallback(element) {
    removeFromLangChangeListener(element, this.elementCallback);
    this.format(element);
    element.textContent = this.fallback;
  }

  connectedMoveCallback(element) {
    this.format(element);
  }

  attributeChangedCallback(element) {
    this.format(element);
  }
}

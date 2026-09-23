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

Object.defineProperty(HTMLElement.prototype, "intlMessage", IntlMessageProperty);

export default class IntlMessageBehavior {
  static observedAttributes = ["intl-message", "intl-options"];
  static tagExcludes = ["br", "hr", "img", "input", "link", "meta", "time", "data", "script", "style"];

  constructor(element, options) {}

  format(element, forceUpdate) {
    if (forceUpdate) this.sig = null;
    const messageLabel = element.intlMessage;
    const messageOptions = element.intlOptions;
    const locale = closestLocale(element);
    const sig = `${locale}:${messageLabel}:${JSLN.stringify(messageOptions)}`;
    if (sig !== this.sig) {
      this.sig = sig;
      let formatter = Intl.$formattedMessages.get(locale, messageLabel);
      if (!formatter) {
        formatter = new Intl.$messageFormat(this.fallback, "default", { label: messageLabel });
      }
      element.textContent = formatter.format(messageOptions);
    }
  }

  connectedCallback(element) {
    this.fallback = element.textContent;
    this.elementCallback = (forceUpdate) => this.format(element,forceUpdate);
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

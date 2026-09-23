import JSLN from "jsln";
import {
  addToLangChangeListener,
  removeFromLangChangeListener,
  closestLocale,
} from "../intl-common.js";


 const IntlAttributeMessagesProperty = {
  get() {
    const messages = JSLN.parse(`{${this.getAttribute("intl-attribute-messages") || ""}}`);
    const self = this;
    return new Proxy(messages, {
      set(target, prop, value) {
        target[prop] = value;
        self.setAttribute("intl-attribute-messages", JSLN.stringify(target).slice(1, -1));
        return true;
      },
      deleteProperty(target, prop) {
        delete target[prop];
        self.setAttribute("intl-attribute-messages", JSLN.stringify(target).slice(1, -1));
        return true;
      },
      getPrototypeOf(target) {
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      }
    });
  },
  set(value) {
        if (value === null || value === undefined) {
      this.removeAttribute("intl-attribute-messages");
      return;
    }
    else if (
      (Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    ) {
      try {
        throw new TypeError("intl-attribute-messages must be a simple object");
      } catch (e) {
        console.error(e);
        this.removeAttribute("intl-attribute-messages");
      }
      return;
    }
    this.setAttribute("intl-attribute-messages", JSLN.stringify(value).slice(1, -1));
  },
};

export const IntlAttributeOptionsProperty = {
  get() {
    const attrOptions = {};
    const self = this;
    for (const attr of this.getAttributeNames()) {
      if (attr.startsWith("intl-attribute-options-")) {
        const key = attr.slice("intl-attribute-options-".length);
        const options = JSLN.parse(`{${this.getAttribute(attr) || ""}}`);
        attrOptions[key] = new Proxy(options, {
          set(target, prop, value) {
            Reflect.set(target, prop, value);
            if (target.hasOwnProperty(prop)) {
              self.setAttribute(`intl-attribute-options-${key}`, JSLN.stringify(target).slice(1, -1));
            }
            return true;
          },
          deleteProperty(target, prop) {
            delete target[prop];
            if (target.hasOwnProperty(prop)) {
              self.setAttribute(`intl-attribute-options-${key}`, JSLN.stringify(target).slice(1, -1));
            }
            return true;
          },
          getPrototypeOf(target) {
            return Reflect.getPrototypeOf(target);
          },
          ownKeys(target) {
            return Reflect.ownKeys(target);
          },
        });
      }
    }
    return new Proxy(attrOptions, {
      set(target, prop, value) {
        if (value === null || value === undefined) {
          self.removeAttribute(`intl-attribute-options-${prop}`);
          return true;
        }
        else if (
          (Object.getPrototypeOf(value) !== Object.prototype &&
            Object.getPrototypeOf(value) !== null)
        ) {
          try {
            throw new TypeError(`intl-attribute-options-${prop} must be a simple options object`);
          } catch (e) {
            console.error(e);
            self.removeAttribute(`intl-attribute-options-${prop}`);
          }
          return false;
        }
        self.setAttribute(`intl-attribute-options-${prop}`, JSLN.stringify(value).slice(1, -1));
        Reflect.set(target, prop, value);
        return true;
      },
      deleteProperty(target, prop) {
        delete target[prop];
        self.removeAttribute(`intl-attribute-options-${prop}`);
        return true;
      },
      getPrototypeOf(target) {
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        return Reflect.ownKeys(target);
      },
    });
  },
  set(value) {
    const current = this.intlAttributeOptions;
    const keys = new Set(Object.keys(current));
    for (const key in value) {
      current[key] = value[key];
      keys.delete(key);
    }
    for (const key of keys) {
      delete current[key];
    }
  },
};

Object.defineProperty(HTMLElement.prototype, "intlAttributeMessages", IntlAttributeMessagesProperty);
Object.defineProperty(HTMLElement.prototype, "intlAttributeOptions", IntlAttributeOptionsProperty);


export default class IntlAttributeMessagesBehavior {
  static observedAttributes = ["intl-attribute-messages", "intl-attribute-options-*"];

  constructor(element) {
    // Initialize existing properties to trigger their setters if they exist
    if (element.hasOwnProperty("intlAttributeMessages")) {
      const messages = element.intlAttributeMessages;
      delete element.intlAttributeMessages;
      element.intlAttributeMessages = messages;
    }
    if (element.hasOwnProperty("intlAttributeOptions")) {
      const options = element.intlAttributeOptions;
      delete element.intlAttributeOptions;
      element.intlAttributeOptions = options;
    }
  }

  format(element, forceUpdate) {
    if (forceUpdate || !this.sig) this.sig = {};
    const attributeMessages = element.intlAttributeMessages;
    const fallbacks = this.fallbacks;    
    const locale = closestLocale(element);
    for (const [attr, messageLabel] of Object.entries(attributeMessages)) {
      const realMessageLabel = messageLabel === true ? fallbacks?.[attr] : messageLabel;
      const realFallback = fallbacks?.[attr] || messageLabel;
      if (!realMessageLabel) continue;
      const attrOptions = element.intlAttributeOptions?.[attr] || {};
      const sig = `${locale}:${realMessageLabel}:${JSLN.stringify(attrOptions)}`;
      if (sig !== this.sig[attr]) {
        this.sig[attr] = sig;
        let formatter = Intl.$formattedMessages.get(locale, realMessageLabel);
        if (!formatter) {
          formatter = new Intl.$messageFormat(realFallback, "default", { label: realMessageLabel });
        }
        element.setAttribute(attr, formatter.format(attrOptions));
      }
    }
  }

  connectedCallback(element) {
    this.fallbacks = {};
    const keys = Object.keys(element.intlAttributeMessages);
    for (const attr of keys) {
      this.fallbacks[attr] = element.getAttribute(attr);
    }
    this.elementCallback = () => this.format(element);
    addToLangChangeListener(element, this.elementCallback);
    this.format(element);
  }

  disconnectedCallback(element) {
    removeFromLangChangeListener(element, this.elementCallback);
    this.format(element);
    for (const [attr, fallback] of Object.entries(this.fallbacks)) {
      element.setAttribute(attr, fallback);
    }
  }

  connectedMoveCallback(element) {
    this.format(element);
  }

  attributeChangedCallback(element) {
    this.format(element);
  }
}

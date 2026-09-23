import customBehaviors from "./common.js";
import JSLN from "jsln";
import IntlLang from "./intl-lang/index.js";

const langchangeSet = new Set();
const langloadSet = new Set();
const INTL_LANGCHANGE_CALLBACKS = Symbol("langchange-callbacks");
const INTL_CLOSEST_LANG_ELEMENT = Symbol("closest-lang-element");

customBehaviors.define("intl-lang", IntlLang, { asAttribute: "lang" });

const intlOptionsProperty = {
  get() {
    const options = this.getAttribute("intl-options") === null
      ? {}
      : JSLN.parse(`{${this.getAttribute("intl-options")}}`, { strictMode: true });
    const self = this;
    return new Proxy(options, {
      set(target, prop, value) {
        target[prop] = value;
        self.setAttribute("intl-options", JSLN.stringify(target).slice(1, -1));
        return true;
      },
      deleteProperty(target, prop) {
        delete target[prop];
        self.setAttribute("intl-options", JSLN.stringify(target).slice(1, -1));
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
      this.removeAttribute("intl-options");
      return;
    }
    else if (
      (Object.getPrototypeOf(value) !== Object.prototype &&
        Object.getPrototypeOf(value) !== null)
    ) {
      try {
        throw new TypeError("intlOptions must be a simple options object");
      } catch (e) {
        console.error(e);
        this.removeAttribute("intl-options");
      }
      return;
    }
    const jsln = JSLN.stringify(value);
    this.setAttribute("intl-options", jsln.slice(1, -1));
  },
};

Object.defineProperty(
  HTMLElement.prototype,
  "intlOptions",
  intlOptionsProperty,
);

const getClosestLangElement = (element) => {
  let current = element.closest("[lang]");
  while (current) {
    if (current.lang) {
      try {
        Intl.getCanonicalLocales(current.lang);
        return current;
      } catch {}
    }
    current = current.closest("[lang]");
  }
  return document.documentElement;
}


export { customBehaviors };


export class IntlLangLoadEvent extends CustomEvent {
  constructor(detail) {
    super("intl-langload", {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail,
    });
  }
}

export const registerLoaderAction = (method)   => {
  langloadSet.add(method);
};
export const unregisterLoaderAction = (method) => {
  langloadSet.delete(method);
};

export const closestLocale = (element) => {
  let current = element.closest("[lang]");
  while (current) {
    if (current.lang) {
      try {
        const lang = Intl.getCanonicalLocales(current.lang);
        element[INTL_CLOSEST_LANG_ELEMENT] = current;
        return lang;
      } catch {}
    }
    current = current.closest("[lang]");
  }
  return navigator.languages;
};

export const getCurrentLocales = () => {
  const localeEls = document.querySelectorAll(':not(script, link, style)[lang]');
  const locales = new Set();
  for (const lang of navigator.languages) {
    locales.add(lang);
  }
  for (const el of localeEls) {
    if (el.lang) {
      try {
        const canonicalLocales = Intl.getCanonicalLocales(el.lang);
        for (const canonicalLocale of canonicalLocales) {
          locales.add(canonicalLocale);
        }
      } catch {}
    }
  }
  return locales;
};



const intlLangchangeHandler = async (e) => {
  const newLang = e.detail?.newValue || e.detail?.fromDisconnect?.lang || e.target.lang || navigator.language;
  const target= e.target
  const disconnected = e.detail?.fromDisconnect;
  const forceUpdate = e.detail?.forceUpdate;
  // forceUpdate comes from a load event, so don't re-trigger loader actions
  if (!forceUpdate && langloadSet.size) {
    const promises = [];
    for (const method of langloadSet) {
      const promise = method(newLang);
      if (promise) {
        promises.push(promise);
      }
    }
    if (promises.length) {
      document.dispatchEvent(new IntlLangLoadEvent({ state: "start", lang: newLang }));
      await Promise.all(promises);
      document.dispatchEvent(new IntlLangLoadEvent({ state: "end", lang: newLang }));
    }
  }
  for (const element of langchangeSet) {
    if (!disconnected) {
      let closest = closestLocale(element);
      if  (Array.isArray(closest)) {
        closest = closest[0];
      }
      if (forceUpdate && closest === newLang) {
        element.intlUpdate?.(forceUpdate);
      }
      if (getClosestLangElement(element) === target) {
        element[INTL_CLOSEST_LANG_ELEMENT] = target;
        element.intlUpdate?.();
      }
    } else {
      if (element[INTL_CLOSEST_LANG_ELEMENT] === disconnected || !element[INTL_CLOSEST_LANG_ELEMENT]) {
        element[INTL_CLOSEST_LANG_ELEMENT] = null;
        element.intlUpdate?.();
      }
    }
  }
};

export const addToLangChangeListener = (element, callback) => {
  if (langchangeSet.size === 0) {
    document.addEventListener("intl-langchange", intlLangchangeHandler);
  }
  langchangeSet.add(element);
  element[INTL_LANGCHANGE_CALLBACKS] =
    element[INTL_LANGCHANGE_CALLBACKS] || new Set();
  element[INTL_LANGCHANGE_CALLBACKS].add(callback);
  element.intlUpdate =
    element.intlUpdate ||
    ((forceUpdate) => {
      for (const handler of element[INTL_LANGCHANGE_CALLBACKS])
        handler(forceUpdate);
    });
};
export const removeFromLangChangeListener = (element, callback) => {
  if (element[INTL_LANGCHANGE_CALLBACKS]) {
    element[INTL_LANGCHANGE_CALLBACKS].delete(callback);
    if (element[INTL_LANGCHANGE_CALLBACKS].size === 0) {
      delete element[INTL_LANGCHANGE_CALLBACKS];
      delete element.intlUpdate;
      langchangeSet.delete(element);
      if (langchangeSet.size === 0) {
        document.removeEventListener("intl-langchange", intlLangchangeHandler);
      }
    }
  }
};

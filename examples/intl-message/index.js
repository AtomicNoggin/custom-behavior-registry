import IntlMessageFormat from "intl-messageformat";
import JSLN from "jsln";
import { customBehaviors } from "../intl-common.js";
import {IntlLangChangeEvent} from "../intl-lang/index.js";
import IntlMessageBehavior from "./intl-message.js";
import IntlAttributeMessagesBehavior from "./intl-attribute-messages.js";
import { IntlLinkLoaderBehavior, IntlScriptLoaderBehavior, MESSAGELOADER_MIMETYPES } from "./intl-message-loaders.js";

const flattenJSON = (json) => {
  const result = {};
  const recurse = (cur, prop) => {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else {
      for (const key in cur) {
        recurse(cur[key], prop ? prop + "." + key : key);
      }
    }
  };
  recurse(json, "");
  return result;
};

class IntlFormattedMessageCache {
  constructor() {
    this.cache = {};
  }

  get(locale, key) {
    locale = Intl.getCanonicalLocales(locale)[0]; // IntlMessageFormat.resolveLocale(locale);
    // start with the default locale message if available
    let msg = this.cache["default"]?.[key] || null;
    // then try the given locale and its less specific variants
    const localeParts = locale.split("-");
    while (localeParts.length > 0) {
      const localeKey = localeParts.join("-");
      if (this.cache[localeKey]?.[key]) {
        msg = this.cache[localeKey][key];
        break;
      }
      localeParts.pop();
    }
    if (msg && localeParts.join("-") !== locale) {
      // hoist the found message into the locale-specific cache 
      // to spead up future lookups
      this.cache[locale] = this.cache[locale] || {};
      this.cache[locale][key] = msg;
    }
    return msg;
  }
  
  getOrInsert(locale, key, fallback) {
    locale = Intl.getCanonicalLocales(locale)[0]; // IntlMessageFormat.resolveLocale(locale);
    let msg = this.get(locale, key);
    const realFallback = fallback || key;
    if (!msg) {
      // this will auto set the default locale cache for this message
      msg = new IntlMessageFormatWrapper(realFallback, "default", { label: key });
      this.set(locale, key, msg);
    }
    return msg;
  }

  has(locale, key) {
    return !!this.get(locale, key);
  }

  set(locales, key, value) {
    if (typeof locales === "string") locales = [locales];
    for (const locale of locales) {
      this.cache[locale] = this.cache[locale] || {};
      this.cache[locale][key] = value;
    }
    
  }

  delete(key, locale) {
    if (locale) locale = Intl.getCanonicalLocales(locale)[0]; // IntlMessageFormat.resolveLocale(locale);
    for (const cacheLocale in this.cache) {
      if (locale && cacheLocale !== locale) continue;
      if (this.cache[cacheLocale]?.[key]) delete this.cache[cacheLocale][key];
    }
  }

  clearMessagesLike(prefix, locale) {
    if (locale) locale = Intl.getCanonicalLocales(locale)[0];  // IntlMessageFormat.resolveLocale(locale);
    for (const cacheLocale in this.cache) {
      if (locale && cacheLocale !== locale) continue;
      for (const key in this.cache[cacheLocale]) {
        if (key.startsWith(prefix)) delete this.cache[cacheLocale][key];
      }
    }
  }

  clearAll(locale) {
    if (locale) delete this.cache[locale];
    else this.cache = {};
  }

  loadFromObject(json, locale) {
    if (locale) {
      locale =  Intl.getCanonicalLocales(locale)[0];  // IntlMessageFormat.resolveLocale(locale);
      json = { [locale]: json };
    }
    for (const locale in json) {
      const flattened = flattenJSON(json[locale]);
      for (const key in flattened) {
        if (typeof flattened[key] === "string") {
          // this will auto set the locale cache for this message
          new IntlMessageFormatWrapper(flattened[key], locale, { label: key });
        }
      }
      document.dispatchEvent(new IntlLangChangeEvent(
        {
          newValue: locale,
          forceUpdate: true,
        },
      ));
    }
  }
}

class IntlMessageFormatWrapper extends IntlMessageFormat {
  static cache = new IntlFormattedMessageCache();
  static formatters = null;

  constructor(message, locales, options) {
    options = {
      label: "",
      formatters: IntlMessageFormatWrapper.formatters,
      ...options,
    };
    locales = Intl.getCanonicalLocales(locales); // IntlMessageFormat.resolveLocale(locales);
    super(message, locales, {}, options);
    if (options.label) {
      for (const locale of locales) {
        IntlMessageFormatWrapper.cache.set(locale, options.label, this);
      }
    }
  }
}

Intl.$messageFormat = IntlMessageFormatWrapper;
Intl.$formattedMessages = IntlMessageFormatWrapper.cache;


customBehaviors.whenDefined("intl-lang").then(() => {
  customBehaviors.define("intl-message", IntlMessageBehavior, {
    asAttribute: "intl-message",
  });
  customBehaviors.define("intl-attribute-messages", IntlAttributeMessagesBehavior, {
    asAttribute: "intl-attribute-messages",
  });
  customBehaviors.define("intl-link-loader", IntlLinkLoaderBehavior, {
    asAttributeValue: ["rel", ...MESSAGELOADER_MIMETYPES],
  });
  customBehaviors.define("intl-script-loader", IntlScriptLoaderBehavior, {
    asAttributeValue: ["type", ...MESSAGELOADER_MIMETYPES],
  });
});

import JSLN from "jsln";
import URLBuilder from "url-builder";
import {
  registerLoaderAction,
  unregisterLoaderAction,
  getCurrentLocales,
} from "../intl-common.js";

export const MESSAGELOADER_MIMETYPES = [
  "intl-messageformat",
  "text/intl-messageformat",
  "text/intl-messageformat+json",
  "text/intl-messageformat+jsln",
];

const hrefPatternProperty = {
  get() {
    return this.getAttribute("hrefpattern");
  },
  set(value) {
    this.setAttribute("hrefpattern", value);
  },
};

Object.defineProperty(
  HTMLLinkElement.prototype,
  "hrefpattern",
  hrefPatternProperty,
);

export class IntlLinkLoaderBehavior {
  static observedAttributes = [
    "type",
    "href",
    "hreflang",
    "hrefpattern",
    "rel",
  ];
  static tagFilter = ["link"];
  fetchFile(url) {
    if (!this.loadedLocales) this.loadedLocales = new Set();
    return fetch(url)
      .then((response) => response.text())
      .then((content) => {
        const messages = JSLN.parse(content);
        const locales = Object.keys(messages);
        for (const locale of locales) {
          this.loadedLocales.add(locale);
        }
        Intl.$formattedMessages.loadFromObject(JSLN.parse(content));
      })
      .catch((error) => {
        console.error("Failed to fetch URL:", url, error);
      });
  }
  loadLocale(element, locales) {
    if (typeof locales === "string") locales = new Set([locales]);
    if (!this.loadedLocales) this.loadedLocales = new Set();
    const toLoad = locales.difference(this.loadedLocales);
    if (toLoad.size === 0) return null;
    if (this.urlBuilder) {
      // if the hrefpattern allows multiple locales to be loaded at once, return a single promise
      if (
        this.urlBuilder.hasNamedValue("locales") ||
        this.urlBuilder.hasNamedValue("langs")
      ) {
        const url = this.urlBuilder.exec({
          locales: Array.from(toLoad),
          langs: Array.from(toLoad),
        });
        return this.fetchFile(url);
      }
      // if the hrefpattern allows only a single locale to be loaded at a time, return multiple promises
      if (
        this.urlBuilder.hasNamedValue("locale") ||
        this.urlBuilder.hasNamedValue("lang")
      ) {
        return Promise.all(
          Array.from(toLoad).map((locale) => {
            const url = this.urlBuilder.exec({ locale, lang: locale });
            return this.fetchFile(url);
          }),
        );
      }
    } else if (
      element.hreflang &&
      toLoad.has(element.hreflang) &&
      !this.loadedLocales.has(element.hreflang)
    ) {
      return this.fetchFile(element.href);
    }
    return null;
  }

  loaderAction;

  connectedCallback(element) {
    if (element.hrefpattern) {
      this.urlBuilder = new URLBuilder(element.hrefpattern, location.href);
    }
    if (element.hrefpattern || (element.href && element.hreflang)) {
      this.loaderAction = (newlang) => this.loadLocale(element, newlang);
      registerLoaderAction(this.loaderAction);
      this.loadLocale(element, getCurrentLocales());
    } else if (element.href) {
      // Load messages from the href immediately
      this.fetchFile(element.href);
    }
  }

  disconnectedCallback() {
    if (this.loaderAction) {
      unregisterLoaderAction(this.loaderAction);
    }
  }

  attributeChangedCallback(element, attributeName, oldValue, newValue) {
    if (attributeName === "hrefpattern") {
      if (newValue && !(element.hreflang || element.href)) {
        this.urlBuilder = new URLBuilder(newValue, location.href);
        this.loadLocale(element, getCurrentLocales());
      } else {
        this.urlBuilder = null;
      }
    } else if (attributeName === "hreflang") {
      if (newValue && element.href) this.loadLocale(element, element.hreflang);
    } else if (attributeName === "href") {
      if (newValue && element.hreflang) {
        this.loadLocale(element, element.hreflang);
      } else if (newValue) {
        fetch(element.href)
          .then((response) => response.text())
          .then((content) => {
            Intl.$formattedMessages.loadFromObject(JSLN.parse(content));
          });
      }
    }
  }
}

export class IntlScriptLoaderBehavior {
  static observedAttributes = ["type", "lang"];
  static tagFilter = ["script"];

  static preConnectionCheck(element) {
    return MESSAGELOADER_MIMETYPES.includes(element.type);
  }

  connectedCallback(element) {
    try {
      let messages = JSLN.parse(element.textContent);
      if (element.lang) {
        messages = { [element.lang]: messages };
      }
      Intl.$formattedMessages.loadFromObject(messages);
    } catch (e) {
      console.error("Failed to load messages from script:", e);
    }
  }
}

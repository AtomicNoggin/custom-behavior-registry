import JSLN from "jsln";

window.customBehavior =
  window.customBehavior ||
  new CustomBehaviorRegistry({
    queryGenerator: (name, behavior, options) => {
      let parts = [],
        query = "";
      if (options.asQuery) {
        query =
          options.asQuery + "" === options.asQuery ? options.asQuery : name;
      }
      if (options.asTag) {
        if (!behavior.tagFilter?.length) {
          behavior.tagFilter = [];
        }
        const value =
          options.asTag + "" === options.asTag ? options.asTag : name;
        behavior.tagFilter.includes(value) || behavior.tagFilter.push(value);
        parts.push(value);
      }
      if (options.asClass) {
        parts.push(
          "." + options.asClass + "" === options.asClass
            ? options.asClass
            : name,
        );
      }
      if (options.asAttribute) {
        parts.push(
          "[" +
            (options.asAttribute + "" === options.asAttribute
              ? options.asAttribute
              : name) +
            "]",
        );
      }
      if (options.asAttributeValue + "" === options.asAttributeValue) {
        parts.push("[" + options.asAttributeValue + '="' + name + '"]');
      }
      if (parts.length) {
        query += (query.length ? ", " : "") + ":is(" + parts.join(", ") + ")";
      } else if (!query.length && behavior.tagFilter?.length) {
        query = "*";
      }
      return query;
    },
    definedCallback: (name, behavior, options) => {
      const attributeFilter =
        window.customBehavior[Symbol.for("attributeFilter")] || [];
      let update = false;
      if (options.asClass && !attributeFilter.includes("class")) {
        attributeFilter.push("class");
        update = true;
      }
      if (options.asAttribute) {
        const value =
          options.asAttribute + "" === options.asAttribute
            ? options.asAttribute
            : name;
        if (!attributeFilter.includes(value)) {
          attributeFilter.push(value);
          update = true;
        }
      }
      if (options.asAttributeValue + "" === options.asAttributeValue) {
        const value = options.asAttributeValue.replace(/[*|~$^]$/, "");
        if (!attributeFilter.includes(value)) {
          attributeFilter.push(value);
          update = true;
        }
      }
      if (update) {
        window.customBehavior[Symbol.for("attributeFilter")] = attributeFilter;
        return { attributeFilter };
      }
    },
  });

const intlOptionsProperty = {
  configurable: true,
  enumerable: true,
  get() {
    const options = this.getAttribute("intl-options");
    return options === null ? {} : JSLN.parse(`{${options}}`, { strictMode: true });
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

delete HTMLElement.prototype.intlOptions;
Object.defineProperty(
  HTMLElement.prototype,
  "intlOptions",
  intlOptionsProperty,
);

const intlFormatProperty = {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("intl-format");
  },
  set(value) {
    this.setAttribute("intl-format", value + "");
  },
};
delete HTMLTimeElement.prototype.intlFormat;
Object.defineProperty(
  HTMLTimeElement.prototype,
  "intlFormat",
  intlFormatProperty,
);
const intlSkeletonProperty = {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("intl-skeleton") || "";
  },
  set(value) {
    this.setAttribute("intl-skeleton", value + "");
  },
};
delete HTMLTimeElement.prototype.intlSkeleton;
Object.defineProperty(
  HTMLTimeElement.prototype,
  "intlSkeleton",
  intlSkeletonProperty,
);

class IntlLang {
  static attributeFilter = ["lang"];
  lastValue = null;
  constructor(element, options) {}
  attributeChangedCallback(element, attributeName, oldValue, newValue) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: { oldValue, newValue, fromDisconnect: null },
    });
    element.dispatchEvent(event);
    this.lastValue = newValue;
  }
  connectedCallback(element) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: {
        oldValue: undefined,
        newValue: element.lang,
        fromDisconnect: null,
      },
    });
    element.dispatchEvent(event);
    this.lastValue = element.lang;
  }
  disconnectedCallback(element) {
    const event = new CustomEvent("intl-langchange", {
      bubbles: true,
      composed: true,
      detail: {
        oldValue: element.lang || this.lastValue,
        newValue: undefined,
        fromDisconnect: element,
      },
    });
    document.dispatchEvent(event);
  }
}
customBehavior.define("intl-lang", IntlLang, { asAttribute: "lang" });

class IntlTimeType {
  static tagFilter = ["time"];
  static attributeFilter = [
    "intl-format",
    "intl-skeleton",
    "intl-options",
    "datetime",
  ];

  skeletonToOptions = (skeleton) => {
    const skeletonRE = /([GMeEca]{1,5}|[ySzO]{1,4}|[dhHkKms]{1,2})/g,
      options = {},
      isSet = {};
    //strip out escaped and non-alpha charters
    skeleton?.replace(/'[^']*'|[^a-zA-Z]/g, "").replace(skeletonRE, (part) => {
      switch (part) {
        case "y":
        case "yy":
        case "yyy":
          if (!isSet.year) {
            options.year = "2-digit";
            isSet.year = true;
          }
          break;
        case "yyyy":
          if (!isSet.year) {
            options.year = "numeric";
            isSet.year = true;
          }
          break;
        case "M":
          if (!isSet.month) {
            options.month = "numeric";
            isSet.month = true;
          }
          break;
        case "MM":
          if (!isSet.month) {
            options.month = "2-digit";
            isSet.month = true;
          }
          break;
        case "MMM":
          if (!isSet.month) {
            options.month = "short";
            isSet.month = true;
          }
          break;
        case "MMMM":
          if (!isSet.month) {
            options.month = "long";
            isSet.month = true;
          }
          break;
        case "MMMMM":
          if (!isSet.month) {
            options.month = "narrow";
            isSet.month = true;
          }
          break;
        case "d":
          if (!isSet.day) {
            options.day = "numeric";
            isSet.day = true;
          }
          break;
        case "dd":
          if (!isSet.day) {
            options.day = "2-digit";
            isSet.day = true;
          }
          break;
        case "eee":
        case "E":
        case "EE":
        case "EEE":
          if (!isSet.weekday) {
            options.weekday = "short";
            isSet.weekday = true;
          }
          break;
        case "eeee":
        case "EEEE":
          if (!isSet.weekday) {
            options.weekday = "long";
            isSet.weekday = true;
          }
          break;
        case "eeeee":
        case "EEEEE":
          if (!isSet.weekday) {
            options.weekday = "narrow";
            isSet.weekday = true;
          }
          break;
        case "h":
          if (!isSet.hour) {
            options.hour = "numeric";
            options.hour12 = true;
            options.hourCycle = "h12";
            isSet.hour = true;
          }
          break;
        case "hh":
          if (!isSet.hour) {
            options.hour = "2-digit";
            options.hour12 = true;
            options.hourCycle = "h12";
            isSet.hour = true;
          }
          break;
        case "H":
          if (!isSet.hour) {
            options.hour = "numeric";
            options.hour12 = false;
            options.hourCycle = "h23";
            isSet.hour = true;
          }
          break;
        case "HH":
          if (!isSet.hour) {
            options.hour = "2-digit";
            options.hour12 = false;
            options.hourCycle = "h23";
            isSet.hour = true;
          }
          break;
        case "k":
          if (!isSet.hour) {
            options.hour = "numeric";
            options.hour12 = true;
            options.hourCycle = "h24";
            isSet.hour = true;
          }
          break;
        case "kk":
          if (!isSet.hour) {
            options.hour = "2-digit";
            options.hour12 = true;
            options.hourCycle = "h24";
            isSet.hour = true;
          }
          break;
        case "K":
          if (!isSet.hour) {
            options.hour = "numeric";
            options.hour12 = false;
            options.hourCycle = "h11";
            isSet.hour = true;
          }
          break;
        case "KK":
          if (!isSet.hour) {
            options.hour = "2-digit";
            options.hour12 = false;
            options.hourCycle = "h11";
            isSet.hour = true;
          }
          break;
        case "m":
          if (!isSet.minute) {
            options.minute = "numeric";
            isSet.minute = true;
          }
          break;
        case "mm":
          if (!isSet.minute) {
            options.minute = "2-digit";
            isSet.minute = true;
          }
          break;
        case "s":
          if (!isSet.minute) {
            options.second = "numeric";
            isSet.minute = true;
          }
          break;
        case "ss":
          if (!isSet.minute) {
            options.second = "2-digit";
            isSet.minute = true;
          }
          break;
        case "S":
          if (!isSet.fractionalSecondDigits) {
            options.fractionalSecondDigits = 1;
            isSet.fractionalSecondDigits = true;
          }
          break;
        case "SS":
          if (!isSet.fractionalSecondDigits) {
            options.fractionalSecondDigits = 2;
            isSet.fractionalSecondDigits = true;
          }
          break;
        case "SSS":
        case "SSSS":
          if (!isSet.fractionalSecondDigits) {
            options.fractionalSecondDigits = 3;
            isSet.fractionalSecondDigits = true;
          }
          break;
        case "a":
        case "aa":
        case "aaa":
          if (!isSet.dayPeriod) {
            options.dayPeriod = "short";
            isSet.dayPeriod = true;
          }
          break;
        case "aaaa":
          if (!isSet.dayPeriod) {
            options.dayPeriod = "long";
            isSet.dayPeriod = true;
          }
          break;
        case "aaaaa":
          if (!isSet.dayPeriod) {
            options.dayPeriod = "narrow";
            isSet.dayPeriod = true;
          }
          break;
        case "z":
        case "zz":
        case "zzz":
          if (!isSet.timeZoneName) {
            options.timeZoneName = "shortGeneric";
            isSet.timeZoneName = true;
          }
          break;
        case "zzzz":
          if (!isSet.timeZoneName) {
            options.timeZoneName = "longGeneric";
            isSet.timeZoneName = true;
          }
          break;
        case "O":
        case "OO":
        case "OOO":
          if (!isSet.timeZoneName) {
            options.timeZoneName = "shortOffset";
            isSet.timeZoneName = true;
          }
          break;
        case "OOOO":
          if (!isSet.timeZoneName) {
            options.timeZoneName = "longOffset";
            isSet.timeZoneName = true;
          }
          break;
        case "G":
        case "GG":
        case "GGG":
          if (!isSet.era) {
            options.era = "short";
            isSet.era = true;
          }
          break;
        case "GGGG":
          if (!isSet.era) {
            options.era = "long";
            isSet.era = true;
          }
          break;
        case "GGGGG":
          if (!isSet.era) {
            options.era = "narrow";
            isSet.era = true;
          }
          break;
      }
      return "";
    });
    return options;
  };
  getCombinedOptions(element) {
    const skeleton = this.skeletonToOptions(element.intlSkeleton),
      options = element.intlOptions,
      combined = {
        ...skeleton,
        ...options,
      };
    const type = element.intlFormat.split(/\s/);
    combined.requestedFormat = type[0] || 'datetime';
      if (combined.requestedFormat === "date") {
        delete combined.hour;
        delete combined.minute;
        delete combined.second;
        delete combined.fractionalSecondDigits;
        delete combined.timeZoneName;
      } else if (combined.requestedFormat === "time") {
        delete combined.weekday;
        delete combined.era;
        delete combined.year;
        delete combined.month;
        delete combined.day;
      }
      if (
        !(
          combined.weekday ||
          combined.era ||
          combined.year ||
          combined.month ||
          combined.day ||
          combined.hour ||
          combined.minute ||
          combined.second ||
          combined.fractionalSecondDigits ||
          combined.timeZoneName
        )
      ) {
        switch (combined.requestedFormat) {
          case "date":
            combined.dateStyle = combined.dateStyle || type[1] || "short";
            break;
          case "time":
            combined.timeStyle = combined.timeStyle || type[1] || "short";
            break;
          case "datetime":
            combined.dateStyle = combined.dateStyle || type[1] || "short";
            combined.timeStyle =
              combined.timeStyle || type[2] || type[1] || "short";
            break;
        }
    }
    return combined;
  }
  getClosestLang(element) {
    let langEl = element,
      lang;
    while (!lang) {
      try {
        // if langEl exists, find the closest element with a lang attribute.
        langEl = langEl?.closest("[lang]");
        // if found, make sure the lang attribute has a real locale value
        // otherwise use browser defaults
        lang = langEl
          ? Intl.getCanonicalLocales(langEl.lang)
          : navigator.languages;
      } catch (e) {
        // non-locale value in lang attribute
        // move up the dom tree, if possible
        langEl = langEl.parentElement;
      }
    }
    return lang;
  }
  getDateValue(element) {
    const lclTzId = element.intlOptions.timeZone || Temporal.Now.timeZoneId(),
      dt = element.dateTime || "",
      [
        match,
        date,
        year,
        month,
        day,
        time,
        hour,
        minute,
        second,
        ms,
        tzOffset,
        tzId,
        calId,
      ] =
        dt.match(
          /^((\d{4}|[+-]\d{6})?-?(\d{2})?-?(\d{2})?)[Tt\s]?((\d{2}):?(\d{2})(?:\:?(\d{2}))?([.,]\d{1,9})?)?([Zz]|[+-]\d{2}:?\d{2})?([.,]\d{1,9})?(?:\[(\w+(?:\/\w+){1,2})\])?(?:\[u-ca=([\w-]+)\])?$/,
        ) || [];
    let temporal = null;
    if (date && !month) {
      // probably only found 4 digits
      // fail ambigous format
    }
    if (date && !year && !day) {
      // only found 2 digits
      // fail incorrect format
    }
    if (date && year && day && date.slice(1).split("-") === 2) {
      // only has 1 dash
      // fail incorrect format
    }
    if (time && date && (!year || !day)) {
      // not a complete date when required
      // fail incorrect format
    }
    if (!time && (tzOffset || tzId)) {
      //
    }
    if (date && time && tzId) {
      try {
        temporal = Temporal.ZonedDateTime.from(match);
      } catch (e) {}
    } else if (date && time && tzOffset) {
      try {
        temporal = Temporal.Instant.from(match).toZonedDateTime(lclTzId);
      } catch (e) {}
    } else if (date && time) {
      try {
        temporal = Temporal.PlainDateTime.from({
          year: +year,
          month: +month,
          day: +day,
          hour: +hour,
          minute: +minute,
          second: second ? +second : 0,
          millisecond: ms ? +ms.slice(1) : 0,
        }).toZonedDateTimeISO(lclTzId);
      } catch (e) {}
    } else if (!date && time) {
      temporal = Temporal.Now.plainDateISO().toZonedDateTime({
        timeZone: lclTzId,
        plainTime: Temporal.PlainTime.from({
          hour: +hour,
          minute: +minute,
          second: second ? +second : 0,
          millisecond: ms ? +ms.slice(1) : 0,
        }),
      });
    } else if (date && !time && day && month && year) {
      temporal = Temporal.PlainDate.from({
        month: +month,
        year: +year,
        day: +day,
      }).toZonedDateTime(lclTzId);
    } else if (date && !time && day && month && !year) {
      try {
        temporal = Temporal.PlainMonthDay.from({ month: +month, day: +day });
        temporal.dropTimeStyle = true;
      } catch (e) {}
    } else if (date && !time && year && month && !day) {
      try {
        temporal = Temporal.PlainYearMonth.from({ month: +month, year: +year });
        temporal.dropTimeStyle = true;
      } catch (e) {}
    }
    return temporal;
  }
  format(element) {
    this.initValue = this.initContent || element.textContent;
    if (
      element.intlFormat ||
      element.intlSkeleton ||
      Object.keys(element.intlOptions).length
    ) {
      const options = this.getCombinedOptions(element),
        lang = this.getClosestLang(element),
        sig = lang + ":" + JSON.stringify(options) + ":" + element.dateTime;
      if (sig !== this.sig) {
        this.sig = sig;
        const temporal = this.getDateValue(element);
        temporal.calendarId &&
          (options.calendar = options.calendar || temporal.calendarId);
        temporal.dropTimeStyle && delete options.timeStyle;
        element.textContent = temporal
          ? temporal.toLocaleString(lang, options)
          : this.initContent;
      }
    } else {
      element.textContent = this.initContent;
    }
  }

  constructor(element) {}
  attributeChangedCallback(element, attributeName, newValue, oldValue) {
    this.format(element);
  }
  connectedCallback(element) {
    if (!document[Symbol.for("intl-format-langchange")]) {
      document[Symbol.for("intl-format-langchange-set")] =
        document[Symbol.for("intl-format-langchange-set")] || new Set();
      const handler = (document[Symbol.for("intl-format-langchange")] = (e) => {
        console.log(e);
        for (const element of document[
          Symbol.for("intl-format-langchange-set")
        ]) {
          element.format?.();
        }
      });
      document.addEventListener("intl-langchange", handler);
    }
    document[Symbol.for("intl-format-langchange-set")].add(element);
    element.format = () => this.format(element);
    this.format(element);
  }
  disconnectedCallback(element) {
    document[Symbol.for("intl-format-langchange-set")].delete(element);
    if (!document[Symbol.for("intl-format-langchange-set")].size) {
      document.removeEventListener(
        "intl-langchange",
        document[Symbol.for("intl-format-langchange")],
      );
      delete document[Symbol.for("intl-format-langchange")];
      delete document[Symbol.for("intl-format-langchange-set")];
    }
    element.textContent = this.initContent;
  }
}
customBehavior.define("intil-time-format", IntlTimeType, { asTag: "time" });

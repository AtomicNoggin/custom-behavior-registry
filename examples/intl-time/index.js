import { closestLocale } from "../intl-common.js";

const ALLOWED_FORMATS = ["date", "time", "datetime", "duration"];
const ALLOWED_STYLES = ["full", "long", "medium", "short"]; 

const DURATION_STYLES = ["long", "short", "narrow", "digital"];
const DURATION_UNITS = ["years", "months", "weeks", "days", "hours", "minutes", "seconds","milliseconds", "microseconds", "nanoseconds"];


const getLargestUnitFromOptions = (options) => {
  if (options.yearsDisplay === "always") return "years"
  else if (options.monthsDisplay === "always") return "months"
  else if (options.weeksDisplay === "always") return "weeks"
  else if (options.daysDisplay === "always") return "days"
  else if (options.hoursDisplay === "always") return "hours"
  else if (options.minutesDisplay === "always") return "minutes"
  else if (options.secondsDisplay === "always") return "seconds"
  else if (options.millisecondsDisplay === "always") return "milliseconds"
  else if (options.microsecondsDisplay === "always") return "microseconds"
  else if (options.nanosecondsDisplay === "always") return "nanoseconds"
  return "";
};
const getSmallestUnitFromOptions = (options) => {
  if (options.nanosecondsDisplay === "always") return "nanoseconds"
  else if (options.microsecondsDisplay === "always") return "microseconds"
  else if (options.millisecondsDisplay === "always") return "milliseconds"
  else if (options.secondsDisplay === "always") return "seconds"
  else if (options.minutesDisplay === "always") return "minutes"
  else if (options.hoursDisplay === "always") return "hours"
  else if (options.daysDisplay === "always") return "days"
  else if (options.weeksDisplay === "always") return "weeks"
  else if (options.monthsDisplay === "always") return "months"
  else if (options.yearsDisplay === "always") return "years"
  return "";
};


const intlFormatProperty = {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("intl-format");
  },
  set(value) {
    const [format, firstStyle, secondStyle] = String(value).split(/\s/);

    if (!ALLOWED_FORMATS.includes(format)) {
      console.error(
        `Invalid intl-format value '${format}'. Allowed values are: ` + ALLOWED_FORMATS.join(", "),
      );
      return;
    }
    if ((format === "date" || format === "time") && !(firstStyle === undefined || ALLOWED_STYLES.includes(firstStyle))) {
      console.error(
        `Invalid intl-format style modifier '${firstStyle}'. Allowed values are: ` + ALLOWED_STYLES.join(", "),
      );
      return;
    } else if (format === "datetime" && !(firstStyle === undefined || ALLOWED_STYLES.includes(firstStyle)) && !(secondStyle === undefined || ALLOWED_STYLES.includes(secondStyle))) {
      console.error(
        `Invalid intl-format style modifier '${secondStyle ? firstStyle+' '+secondStyle : firstStyle}'. Allowed values are: ` + ALLOWED_STYLES.join(", "),
      );
      return;
    }
    this.setAttribute("intl-format", value);
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

const dateTimeFromProperty = {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("datetime-from") || "";
  },
  set(value) {
    this.setAttribute("datetime-from", value + ""); 
  },
};
delete HTMLTimeElement.prototype.dateTimeFrom;
Object.defineProperty(
  HTMLTimeElement.prototype,
  "dateTimeFrom",
  dateTimeFromProperty,
);

const dateTimeToProperty = {
  configurable: true,
  enumerable: true,
  get() {
    return this.getAttribute("datetime-to") || "";
  },
  set(value) {
    this.setAttribute("datetime-to", value + "");
  },
};
delete HTMLTimeElement.prototype.dateTimeTo;
Object.defineProperty(
  HTMLTimeElement.prototype,
  "dateTimeTo",
  dateTimeToProperty,
);

class IntlTimeType {
  static tagFilter = ["time"];
  static observedAttributes = [
    "intl-format",
    "intl-skeleton",
    "intl-options",
    "datetime",
    "datetime-from",
    "datetime-to",
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
    combined.requestedFormat = type[0] || "datetime";
    if (combined.requestedFormat === "duration") {
      combined.style = combined.style || type[1] || "short";
      combined.smallestUnit = getSmallestUnitFromOptions(combined) || type[2] || "seconds";
      combined.largestUnit = getLargestUnitFromOptions(combined) || type[3] || "years";
      if (!DURATION_STYLES.includes(combined.style)) {
        combined.style = "short";
      }
      if (!DURATION_UNITS.includes(combined.smallestUnit)) {
        combined.smallestUnit = "seconds";
      }
      if (!DURATION_UNITS.includes(combined.largestUnit)) {
        combined.largestUnit = "years";
      }
      if (DURATION_UNITS.indexOf(combined.smallestUnit) < DURATION_UNITS.indexOf(combined.largestUnit)) {
        const hold = combined.smallestUnit;
        combined.smallestUnit = combined.largestUnit;
        combined.largestUnit = hold;
      }
      return combined;
    }
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
  getDateValue(element, dt) {
    const lclTzId = element.intlOptions.timeZone || Temporal.Now.timeZoneId();
    dt = dt === undefined ? element.dateTime || "" : dt || "";
    if (!dt) {
      return Temporal.Now.zonedDateTimeISO(lclTzId);
    }
    const [
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
      console.error("Ambiguous date format, only found 4 digits for year:", dt);
    }
    if (date && !year && !day) {
      // only found 2 digits
      console.error("Incorrect date format, only found 2 digits for year:", dt);
    }
    if (date && year && day && date.slice(1).split("-") === 2) {
      // only has 1 dash
      console.error("Incorrect date format, only has 1 dash:", dt);
    }
    if (time && date && (!year || !day)) {
      // not a complete date when required
      console.error("Incorrect date format, not a complete date when required:", dt);
    }
    if (date && time && tzId) {
      try {
        temporal = Temporal.ZonedDateTime.from(match);
      } catch (e) {
        console.error("Error parsing ZonedDateTime:", e, "datetime:", match);
      }
    } else if (date && time && tzOffset) {
      try {
        temporal = Temporal.Instant.from(match).toZonedDateTimeISO(lclTzId);
      } catch (e) {
        console.error("Error parsing ZonedDateTime:", e, "datetime:", match);
      }
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
        }).toZonedDateTime(lclTzId);
      } catch (e) {
        console.error("Error parsing PlainDateTime:", e, "datetime:", match);
      }
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
      } catch (e) {
        console.error("Error parsing PlainMonthDay:", e, "datetime:", match);
      }
    } else if (date && !time && year && month && !day) {
      try {
        temporal = Temporal.PlainYearMonth.from({ month: +month, year: +year });
        temporal.dropTimeStyle = true;
      } catch (e) {
        console.error("Error parsing PlainYearMonth:", e, "datetime:", match);
      }
    }
    return temporal;
  }
  getDurationValues(element) {
    const from = element.dateTimeFrom || "",
      to = element.dateTimeTo || "",
      dt = element.dateTime || "";
    let fromDt, toDt;
    if (from && to) {
      fromDt = from;
      toDt = to;
    } else if (from && dt) {
      fromDt = from;
      toDt = dt;
    } else if (dt && to) {
      fromDt = dt;
      toDt = to;
    } else if (from) {
      fromDt = from;
      toDt = "";
    } else if (to) {
      fromDt = "";
      toDt = to;
    } else if (dt) {
      if (new Date(dt).toISOString() > new Date().toISOString()) {
        fromDt = "";
        toDt = dt;
      } else {
        fromDt = dt;
        toDt = "";
      }
    } else {
      return null;
    }
    const start = this.getDateValue(element, fromDt),
      end = this.getDateValue(element, toDt);
    if (!start || !end) {
      return null;
    }
    return { start, end };
  }
  formatDuration(element, lang, options) {
    const values = this.getDurationValues(element);
    if (!values) {
      element.textContent = this.initContent;
      return;
    }
    const { start, end } = values;
    try {
      const zdtStart = start.toZonedDateTimeISO
          ? start.toZonedDateTimeISO(Temporal.Now.timeZoneId())
          : start,
        zdtEnd = end.toZonedDateTimeISO
          ? end.toZonedDateTimeISO(Temporal.Now.timeZoneId())
          : end,
        duration = zdtStart.until(zdtEnd, {
          largestUnit: options.largestUnit || "years",
          smallestUnit: options.smallestUnit || "seconds",
        });
        const { requestedFormat, largestUnit, smallestUnit, ...durationOptions } =
          options;
        element.textContent = duration.toLocaleString(lang, durationOptions);
    } catch (e) {
      console.error(
        "Error formatting duration:",
        e,
        "lang:",
        lang,
        "options:",
        options,
      );
      element.textContent = this.initContent;
    }
  }
  format(element) {
    this.initValue = this.initContent || element.textContent;
    if (
      element.intlFormat ||
      element.intlSkeleton ||
      Object.keys(element.intlOptions).length
    ) {
      const options = this.getCombinedOptions(element),
        lang = closestLocale(element),
        sig =
          lang +
          ":" +
          JSON.stringify(options) +
          ":" +
          element.dateTime +
          ":" +
          element.dateTimeFrom +
          ":" +
          element.dateTimeTo;
      if (sig !== this.sig) {
        this.sig = sig;
        if (options.requestedFormat === "duration") {
          this.formatDuration(element, lang, options);
          return;
        }
        let temporal = this.getDateValue(element);
        if (temporal) {
          temporal.dropTimeStyle && delete options.timeStyle;
          if (options.calendar) {
            temporal = temporal.withCalendar(options.calendar);
          }
          if (options.timeZone) {
            temporal = (temporal.withTimeZone
              ? temporal.withTimeZone(options.timeZone)
              : temporal.toZonedDateTime
                ? temporal.toZonedDateTime(options.timeZone)
                : temporal.toZonedDateTimeISO
                  ? temporal.toZonedDateTimeISO(options.timeZone)
                  : temporal);
            delete options.timeZone;
          }
          try {
            element.textContent = temporal.toLocaleString(lang, options);
          }
          catch (e) {
            console.error("Error formatting date:", e, "lang:", lang, "options:", options);
            element.textContent = this.initContent;
          }
        } else {
          element.textContent = this.initContent;
        }
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

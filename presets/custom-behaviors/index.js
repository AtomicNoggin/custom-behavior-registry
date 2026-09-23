import CustomBehaviorRegistry from "../../index.js";

export const customBehaviors = new CustomBehaviorRegistry({
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
      else if (Array.isArray(options.asAttributeValue) && typeof options.asAttributeValue[0] === "string") {
        const [attr] = options.asAttributeValue;
        const values = options.asAttributeValue.slice(1);
        for (const val of values) {
          parts.push("[" + attr + '="' + val + '"]');
        }
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
        customBehaviors[Symbol.for("attributeFilter")] || [];
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
      else if (Array.isArray(options.asAttributeValue) && options.asAttributeValue.length === 2 && typeof options.asAttributeValue[0] === "string" && typeof options.asAttributeValue[1] === "string") {
        const attr = options.asAttributeValue[0].replace(/[*|~$^]$/, "");

        if (!attributeFilter.includes(attr)) {
          attributeFilter.push(attr);
          update = true;
        }
      }
      if (update) {
        customBehaviors[Symbol.for("attributeFilter")] = attributeFilter;
        return { attributeFilter };
      }
  }
});

export default customBehaviors;

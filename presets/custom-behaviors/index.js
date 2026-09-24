import CustomBehaviorRegistry from "../../index.js";

export const customBehaviors = new CustomBehaviorRegistry({
  queryGenerator: (name, behavior, options) => {
    let parts = [],
      query = "";
    if (options.asQuery) {
      query = options.asQuery + "" === options.asQuery ? options.asQuery : name;
    }
    if (options.asTag) {
      const value = options.asTag + "" === options.asTag ? options.asTag : name;
      parts.push(value);
    }
    if (options.asClass) {
      parts.push(
        "." +
          (options.asClass + "" === options.asClass ? options.asClass : name),
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
    } else if (
      Array.isArray(options.asAttributeValue) &&
      typeof options.asAttributeValue[0] === "string"
    ) {
      const [attr] = options.asAttributeValue;
      const values = options.asAttributeValue.slice(1);
      for (const val of values) {
        parts.push("[" + attr + '="' + val + '"]');
      }
    }

    if (parts.length) {
      query += (query.length ? ", " : "") + ":is(" + parts.join(", ") + ")";
    } else if (
      !query.length &&
      (behavior.tagFilter?.length ||
        behavior.tagExcludes?.length ||
        behavior.preConnectionCheck)
    ) {
      query = "*";
    } else if (!query.length) {
      throw new SyntaxError(
        "Unable to generate a valid query for custom behavior: " + name,
      );
    }
    try {
      document.querySelector(query);
    } catch (e) {
      throw new SyntaxError(
        "Invalid query generated for custom behavior: " + query + "\n" + e,
      );
    }
    console.log("Generated query for custom behavior:", query);
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
    } else if (
      Array.isArray(options.asAttributeValue) &&
      typeof options.asAttributeValue[0] === "string"
    ) {
      const attr = options.asAttributeValue[0].replace(/[*|~$^]$/, "");

      if (!attributeFilter.includes(attr)) {
        attributeFilter.push(attr);
        update = true;
      }
    }
    console.log("Attribute filter updated:", attributeFilter);
    if (update) {
      customBehaviors[Symbol.for("attributeFilter")] = attributeFilter;
      return { attributeFilter };
    }
  },
});

export default customBehaviors;

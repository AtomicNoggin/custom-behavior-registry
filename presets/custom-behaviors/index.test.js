/** @jest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
} from "@jest/globals";
import CustomBehaviorRegistry from "../../index.js";
import customBehaviors from "./index.js";

Map.prototype.getOrInsert ??= function getOrInsert(key, value) {
  if (!this.has(key)) {
    this.set(key, value);
  }
  return this.get(key);
};

class QueryBehavior {
  connectedCallback(element) {
    element.dataset.connected = "true";
  }
}

class TagBehavior extends QueryBehavior {}
class ClassBehavior extends QueryBehavior {}
class AttributeBehavior extends QueryBehavior {}
class AttributeValueBehavior extends QueryBehavior {}
class AttributeValueListBehavior extends QueryBehavior {}
class QueryBooleanBehavior extends QueryBehavior {}
class TagBooleanBehavior extends QueryBehavior {}
class ClassBooleanBehavior extends QueryBehavior {}
class AttributeBooleanBehavior extends QueryBehavior {}
class TagFilterBehavior extends QueryBehavior {}
TagFilterBehavior.tagFilter = ["tag-filter-demo"];
class TagExcludesBehavior extends QueryBehavior {}
TagExcludesBehavior.tagExcludes = ["span"];
class PreConnectionCheckBehavior extends QueryBehavior {
  static preConnectionCheck() {
    return true;
  }
}
class NoOptionsBehavior extends QueryBehavior {}
class MultipleOptionsBehavior extends QueryBehavior {}

describe("custom-behaviors preset", () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  afterEach(() => {
    CustomBehaviorRegistry.undefineAllBehaviors(customBehaviors);
    document.body.replaceChildren();
  });

  test("asQuery connects elements matching a custom query", () => {
    const element = document.createElement("div");
    element.setAttribute("data-query-demo", "present");
    document.body.append(element);
    customBehaviors.define("query-demo", QueryBehavior, {
      asQuery: ':is([data-query-demo="present"])',
    });

    expect(customBehaviors.get("query-demo", element)).toBeInstanceOf(
      QueryBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asQuery true uses the behavior name as the query", () => {
    const element = document.createElement("query-true");
    document.body.append(element);
    customBehaviors.define("query-true", QueryBooleanBehavior, {
      asQuery: true,
    });

    expect(customBehaviors.get("query-true", element)).toBeInstanceOf(
      QueryBooleanBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asTag connects elements with the configured tag name", () => {
    const button = document.createElement("button");
    document.body.append(button);
    customBehaviors.define("tag-demo", TagBehavior, {
      asTag: "button",
    });
    expect(customBehaviors.get("tag-demo", button)).toBeInstanceOf(
      TagBehavior,
    );
    expect(button.dataset.connected).toBe("true");
  });

  test("asTag true uses the behavior name as the tag name", () => {
    const element = document.createElement("tag-true");
    document.body.append(element);
    customBehaviors.define("tag-true", TagBooleanBehavior, { asTag: true });

    expect(customBehaviors.get("tag-true", element)).toBeInstanceOf(
      TagBooleanBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asClass connects elements with the configured class", () => {
    const element = document.createElement("div");
    element.className = "primary";
    document.body.append(element);
    customBehaviors.define("class-demo", ClassBehavior, {
      asClass: "primary",
    });

    expect(customBehaviors.get("class-demo", element)).toBeInstanceOf(
      ClassBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asClass true uses the behavior name as the class name", () => {
    const element = document.createElement("div");
    element.className = "class-true";
    document.body.append(element);
    customBehaviors.define("class-true", ClassBooleanBehavior, {
      asClass: true,
    });

    expect(customBehaviors.get("class-true", element)).toBeInstanceOf(
      ClassBooleanBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asAttribute connects elements with the configured attribute", () => {
    const element = document.createElement("div");
    element.setAttribute("data-demo", "yes");
    document.body.append(element);
    customBehaviors.define("attr-demo", AttributeBehavior, {
      asAttribute: "data-demo",
    });

    expect(customBehaviors.get("attr-demo", element)).toBeInstanceOf(
      AttributeBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asAttribute true uses the behavior name as the attribute", () => {
    const element = document.createElement("div");
    element.setAttribute("attribute-true", "present");
    document.body.append(element);
    customBehaviors.define("attribute-true", AttributeBooleanBehavior, {
      asAttribute: true,
    });

    expect(customBehaviors.get("attribute-true", element)).toBeInstanceOf(
      AttributeBooleanBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asAttributeValue as a string uses the behavior name as its value", () => {
    const element = document.createElement("div");
    element.setAttribute("data-state", "selected");
    document.body.append(element);
    customBehaviors.define("selected", AttributeValueBehavior, {
      asAttributeValue: "data-state",
    });

    expect(customBehaviors.get("selected", element)).toBeInstanceOf(
      AttributeValueBehavior,
    );
    expect(element.dataset.connected).toBe("true");
  });

  test("asAttributeValue as an array connects each configured value", () => {
    customBehaviors.define("status-demo", AttributeValueListBehavior, {
      asAttributeValue: ["data-status", "success", "warning"],
    });
    const success = document.createElement("div");
    success.setAttribute("data-status", "success");
    const warning = document.createElement("div");
    warning.setAttribute("data-status", "warning");
    document.body.append(success, warning);
    customBehaviors.update(document.body);

    expect(customBehaviors.get("status-demo", success)).toBeInstanceOf(
      AttributeValueListBehavior,
    );
    expect(customBehaviors.get("status-demo", warning)).toBeInstanceOf(
      AttributeValueListBehavior,
    );
    expect(success.dataset.connected).toBe("true");
    expect(warning.dataset.connected).toBe("true");
  });

  test("connects elements matching any configured option", () => {
    const tagMatch = document.createElement("button");
    const classMatch = document.createElement("div");
    classMatch.className = "multiple-class";
    const attributeMatch = document.createElement("div");
    attributeMatch.setAttribute("data-multiple", "present");
    const noMatch = document.createElement("div");
    document.body.append(tagMatch, classMatch, attributeMatch, noMatch);
    customBehaviors.define("multiple-demo", MultipleOptionsBehavior, {
      asTag: "button",
      asClass: "multiple-class",
      asAttribute: "data-multiple",
    });

    expect(customBehaviors.get("multiple-demo", tagMatch)).toBeInstanceOf(
      MultipleOptionsBehavior,
    );
    expect(customBehaviors.get("multiple-demo", classMatch)).toBeInstanceOf(
      MultipleOptionsBehavior,
    );
    expect(
      customBehaviors.get("multiple-demo", attributeMatch),
    ).toBeInstanceOf(MultipleOptionsBehavior);
    expect(customBehaviors.get("multiple-demo", noMatch)).toBeNull();
  });

  test("connects a behavior without options when tagFilter is set", () => {
    const element = document.createElement("tag-filter-demo");
    document.body.append(element);
    customBehaviors.define("tag-filter-demo", TagFilterBehavior);

    expect(
      customBehaviors.get("tag-filter-demo", element),
    ).toBeInstanceOf(TagFilterBehavior);
    expect(element.dataset.connected).toBe("true");
  });

  test("connects allowed elements without options when tagExcludes is set", () => {
    const allowed = document.createElement("div");
    const excluded = document.createElement("span");
    document.body.append(allowed, excluded);
    customBehaviors.define("tag-excludes-demo", TagExcludesBehavior);

    expect(
      customBehaviors.get("tag-excludes-demo", allowed),
    ).toBeInstanceOf(TagExcludesBehavior);
    expect(customBehaviors.get("tag-excludes-demo", excluded)).toBeNull();
    expect(allowed.dataset.connected).toBe("true");
    expect(excluded.dataset.connected).toBeUndefined();
  });

  test("connects a behavior without options when preConnectionCheck is set", () => {
    const element = document.createElement("div");
    document.body.append(element);
    customBehaviors.define(
      "pre-check-demo",
      PreConnectionCheckBehavior,
    );

    expect(
      customBehaviors.get("pre-check-demo", element),
    ).toBeInstanceOf(PreConnectionCheckBehavior);
    expect(element.dataset.connected).toBe("true");
  });

  test("rejects a behavior without options or a query source", () => {
    expect(() => {
      customBehaviors.define("no-options-demo", NoOptionsBehavior);
    }).toThrow(SyntaxError);
  });
});
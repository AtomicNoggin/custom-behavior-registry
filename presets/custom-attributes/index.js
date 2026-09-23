import CustomBehaviorRegistry from "../../index.js";
const attributeNames = new Set();
export const customAttributes = new CustomBehaviorRegistry({
  // wrap the name to generate a class query selector
  queryPrefix: '[',
  querySuffix: ']',
  nameValidator: (name) => {
      name = name.trim().toLowerCase();
      // ensure the name roughly matches the custom element structure
      if (!/^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(name)) return false;
      try {
        // attempt to create the attribute to ensure it's valid
        document.createAttribute(name);
        return name;
    } catch (e) {
        return false;
    }
  },
  // add the attribute name to the set and update the attribute filter
  definedCallback: (name) => (
    attributeNames.add(name) &&
    {attributeFilter: Array.from(attributeNames)}
  ),
  // scan the DOM for updates to the class attribute
  attributeFilter: ["class"]
});

export default customAttributes;

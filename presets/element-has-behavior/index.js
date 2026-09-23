import CustomBehaviorRegistry from "../../index.js";

export const elementHasBehavior = new CustomBehaviorRegistry({
  // wrap the name to generate a `has` attribute query selector
  queryPrefix: '[has~="',
  querySuffix: '"]',
  // ensure name generally matches the custom element structure
  nameValidator: (name) => /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/.test(name),
  // scan the DOM for updates to the has attribute
  attributeFilter: ["has"]
});

export default elementHasBehavior;

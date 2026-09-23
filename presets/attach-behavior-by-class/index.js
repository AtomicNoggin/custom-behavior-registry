import CustomBehaviorRegistry from "../../index.js";

export const attachBehaviorByClass = new CustomBehaviorRegistry({
  // wrap the name to generate a class query selector
  queryPrefix: '.',
  querySuffix: '',
  // ensure name can be a valid class selector
  nameValidator: (name) => {
    try {
        document.querySelector(`.${name}`);
        return true;
    } catch (e) {
        return false;
    }
  },
  // scan the DOM for updates to the class attribute
  attributeFilter: ["class"],
});

export default attachBehaviorByClass;

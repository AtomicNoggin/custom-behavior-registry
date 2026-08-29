// index.js
var optionsChangeCheck = (update, existing, directComparison = false) => {
  try {
    return (directComparison || !!Object.keys(Object(update)).length) && JSON.stringify(existing) !== JSON.stringify(directComparison ? update : { ...existing, ...update });
  } catch (e) {
    return false;
  }
};
var CustomBehaviorRegistry = class _CustomBehaviorRegistry {
  //
  // static registry management methods
  //
  /**
   * enable a registry's MutationObserver and, if it has defined behaviors, re-observe the DOM and shadowRoots
   * @param {CustomBehaviorRegistry} registry the registry instance to enable
   */
  static observe(registry) {
    registry instanceof _CustomBehaviorRegistry && registry[/* @__PURE__ */ Symbol.for("actions")].observe();
  }
  /**
   * disable a registry's MutationObserver so it will stop connecting or disconnecting elements to its defined behaviors
   * including for any new behaviors defined while disabled.
   * @param {CustomBehaviorRegistry} registry the registry instance to disable
   */
  static disconnect(registry) {
    registry instanceof _CustomBehaviorRegistry && registry[/* @__PURE__ */ Symbol.for("actions")].disconnect();
  }
  static getSettings(registry) {
    return registry instanceof _CustomBehaviorRegistry ? registry[/* @__PURE__ */ Symbol.for("actions")].getSettings() : null;
  }
  static replaceSettings(registry, settings) {
    return registry instanceof _CustomBehaviorRegistry ? registry[/* @__PURE__ */ Symbol.for("actions")].replaceSettings(settings) : null;
  }
  static clearSettings(registry) {
    return registry instanceof _CustomBehaviorRegistry ? registry[/* @__PURE__ */ Symbol.for("actions")].replaceSettings(
      new _CustomBehaviorRegistry()[/* @__PURE__ */ Symbol.for("actions")].getSettings()
    ) : null;
  }
  /**
   * remove a registry's defined behavior, disconnecting any connected elements in the proccess
   * @param {CustomBehaviorRegistry} registry the registry whose behavior is being removed
   * @param {string} name the name of the behavior to remove
   */
  static undefineBehavior(registry, name) {
    registry instanceof _CustomBehaviorRegistry && registry[/* @__PURE__ */ Symbol.for("actions")].undefineBehavior(name);
  }
  /**
   * remove all defined behaviors from a registry, disconnecting any connected elements in the proccess
   * @param {CustomBehaviorRegistry} registry the registry whose behaviors are being removed
   */
  static undefineAllBehaviors(registry) {
    registry instanceof _CustomBehaviorRegistry && registry[/* @__PURE__ */ Symbol.for("actions")].undefineAllBehaviors();
  }
  //
  // internal Registry collections
  //
  /** hold the registry mutation observer */
  #observer = null;
  /** a named list of defined behaviors */
  #definitions = {};
  /** a map of elements to a named list of the their connected behaviors */
  #connected = /* @__PURE__ */ new Map();
  /** a  map of elements to an array containing their mutation observer 
      and a named list of their behaviors with attributeChangeCallback */
  #withAttrCallback = /* @__PURE__ */ new Map();
  /** named list of promises requested from whenDefined */
  #promises = {};
  //
  // Registry options populated by the constuctor
  //
  /** optional  named list of default values for custom definition options */
  #definitionOptionDefaults = {};
  /** optional method to determine if name is formatted properly
   *  @param {string} name,
   *  @param {class} behavior,
   *  @param {Object} options
   *  @returns {boolean || string} true, false or new name string value
   */
  #validateName = (name) => (
    // default action: check if name is a string with at least one chacter
    name?.length && "" + name === name
  );
  /** optional string to attach to the front of the name when creating the query selector */
  #queryPrefix = "";
  /** optional string to attach to the end of the name when creating the query selector */
  #querySuffix = "";
  /**
   * optional, method to generate a query selector from the name
   * @param {string} name
   * @param {class} behavior
   * @param {Object} options
   * @returns {string} CSS selector string
   */
  #generateSelector = (name, behavior, options) => (
    // default action: return queryPrefix + name + querySuffix
    this.#queryPrefix + name + this.#querySuffix
  );
  /**
   * optional method to call when a new definition is created
   * @param {string} name
   * @param {class} behavior
   * @param {Object} options
   * @returns {void || Object} nothing or new Registry settings
   */
  #definedCallback = (name, behavior, options) => void 0;
  // default: do nothing
  /** optional attributes (if any) that can trigger a behavior refresh */
  #attributeFilter = /* @__PURE__ */ new Set();
  /** optional method to determine if a given
   *  attribute change needs a behavior refresh
   *  Only fires if attributeFilter is defined
   * @param {*} element
   * @param {*} attributeName
   * @param {*} oldValue
   * @param {*} newValue
   * @returns {boolean || Element || Element[]} true, false, or a list of elements to check
   */
  #attributeChangedValidator = (element, attributeName, oldValue, newValue) => (
    // default action:
    this.#attributeFilter.size ? this.#attributeFilter.has(attributeName) : false
  );
  /**
   * optional method to call before calling a  behavior contructor
   * @param {string} name
   * @param {Element} element
   * @param {class} behavior
   * @param {Object} options
   * @returns {void|Object} nothing or new definition options
   */
  #definitionConstructorCallback = (name, element, behavior, options) => void 0;
  // default: do nothing
  /** optional method to call before a connected behavior triggers thier 
      connectedCallback
      accepts name, element, definition options  */
  /**
   * optional method to call before a connected behavior triggers thier
   * connectedCallback
   * @param {string} name
   * @param {Element} element
   * @param {Object} options
   * @returns {void}
   */
  #definitionConnectedCallback = (name, element, options) => void 0;
  // default: do nothing
  /**
   * optional method to call after a connected behavior triggers thier
   * disconnectedCallback
   * @param {string} name
   * @param {Element} element
   * @param {Object} options
   * @returns {void}
   */
  #definitionDisconnectedCallback = (name, element, options) => void 0;
  // default: do nothing
  /**
   * optional method to call before a connected behavior triggers thier
   * connectedMoveCallback
   * @param {string} name
   * @param {Element} element
   * @param {Object} options
   * @returns {void}
   */
  #definitionConnectedMoveCallback = (name, element, options) => void 0;
  // default: do nothing
  /**
   * optional method to call before a connected behavior triggers thier
   *  attributeChangedCallback
   * @param {string} name
   * @param {Element} element
   * @param {string} attributeName
   * @param {string || null} oldValue
   * @param {string || null} newValue
   * @param {Object} options
   * @returns {void}
   */
  #definitionAttributeChangedCallback = (name, element, attributeName, oldValue, newValue, options) => void 0;
  // default: do nothing
  //
  // internal helper methods
  //
  /**
   * method for updating an internal behavior definition object
   * accepts name, definition, behavior, and definition options
   * @param {string} name the behavior name
   * @param {Object} defintion the existing definition to be updated
   * @param {class} behavior the behavior class
   * @param {Object} options optional definition options
   * @returns {Object} new definition
   */
  #updateDefinition = (name, definition = {}, behavior = definition.behavior, options = {}) => {
    options = { ...definition.initOptions || {}, ...options };
    const definitionDefaults = this.#definitionOptionDefaults, generateSelector = this.#generateSelector, tagListToSet = (set, tag) => {
      set.add(("" + tag).toUpperCase());
      return set;
    };
    return this.#definitions[name] = {
      behavior,
      // string copy of initial tagFilter array, in case in changes
      initTags: behavior.tagFilter?.toString() || "",
      // convert to a set & make sure tags are strings and upper case
      //just the options that were passed in
      tagSet: behavior.tagFilter?.reduce(tagListToSet, /* @__PURE__ */ new Set()) || /* @__PURE__ */ new Set(),
      // string copy of initial tagExludes array, in case in changes
      initExTags: behavior.tagExcludes?.toString() || "",
      tagExSet: behavior.tagExcludes?.reduce(tagListToSet, /* @__PURE__ */ new Set()) || /* @__PURE__ */ new Set(),
      // update tagSet & tagExSet as needed then return validty of tagname
      tagAllowed(tagName) {
        tagName = ("" + tagName).toUpperCase();
        let current = this.behavior.tagFilter?.toString() || "";
        if (current !== this.initTags) {
          this.initTags = current;
          this.tagSet = this.behavior.tagFilter?.reduce(tagListToSet, /* @__PURE__ */ new Set()) || /* @__PURE__ */ new Set();
        }
        current = this.behavior.tagExcludes?.toString() || "";
        if (current !== this.initExTags) {
          this.initExTags = current;
          this.tagExSet = this.behavior.tagExcludes?.reduce(tagListToSet, /* @__PURE__ */ new Set()) || /* @__PURE__ */ new Set();
        }
        return (!this.tagExSet.size || !this.tagExSet.has(tagName)) && (!this.tagSet.size || this.tagSet.has(tagName));
      },
      initAttrs: behavior.observedAttributes?.toString() || "",
      attrSet: behavior.observedAttributes?.reduce((attrSet, attr) => {
        attr = ("" + attr).toLowerCase();
        if (!attr.endsWith("-*")) {
          attrSet.add(attr);
        }
        return attrSet;
      }, /* @__PURE__ */ new Set()) || /* @__PURE__ */ new Set(),
      attrStarts: behavior.observedAttributes?.reduce((attrStarts, attr) => {
        attr = ("" + attr).toLowerCase();
        if (attr.endsWith("-*")) {
          attrStarts.push(attr.slice(0, -1));
        }
        return attrStarts;
      }, []) || [],
      attributeMatches(attributeName) {
        attributeName = ("" + attributeName).toLowerCase();
        const current = this.behavior.observedAttributes?.toString() || "";
        if (current !== this.initAttrs) {
          this.initAttrs = current;
          [this.attrSet, this.attrStarts] = this.behavior.observedAttributes?.reduce(
            ([attrSet, attrStarts], attr) => {
              attr = ("" + attr).toLowerCase();
              if (attr.endsWith("-*")) {
                attrStarts.push(attr.slice(0, -1));
              } else {
                attrSet.add(attr.toLowerCase());
              }
              return [attrSet, attrStarts];
            },
            [/* @__PURE__ */ new Set(), []]
          ) || [/* @__PURE__ */ new Set(), []];
        }
        return this.attrSet.has(attributeName) || this.attrStarts.some((prefix) => attributeName.startsWith(prefix));
      },
      initOptions: options,
      // consolodated with defaults
      options: { ...definitionDefaults, ...options },
      selector: generateSelector(name, behavior, {
        ...definitionDefaults,
        ...options
      }),
      connected: definition.connected || /* @__PURE__ */ new Map(),
      detached: definition.detached || /* @__PURE__ */ new WeakMap()
    };
  };
  /**
   * get current setting values
   * @returns the current registry settings
   */
  #getSettings = () => ({
    queryPrefix: this.#queryPrefix,
    querySuffix: this.#querySuffix,
    queryGenerator: this.#generateSelector,
    attributeFilter: this.#attributeFilter,
    attributedChangedValidator: this.#attributeChangedValidator,
    definedCallback: this.#definedCallback,
    nameValidator: this.#validateName,
    definitionConstructorCallback: this.#definitionConstructorCallback,
    definitionConnectedCallback: this.#definitionConnectedCallback,
    definitionDisconnectedCallback: this.#definitionDisconnectedCallback,
    definitionAttributeChangedCallback: this.#definitionAttributeChangedCallback,
    definitionConnectedMoveCallback: this.#definitionConnectedMoveCallback,
    definitionOptionDefaults: this.#definitionOptionDefaults
  });
  /**
   * method for overiding one or more registry setting with new values
   * also updates  behavior definition if definitionOptionDefaults changed
   * @param {Object} settings a registry options object
   */
  #overrideSettings = (settings) => {
    this.#queryPrefix = // must be a string
    settings.queryPrefix === settings.queryPrefix + "" ? settings.queryPrefix : this.#queryPrefix;
    this.#querySuffix = settings.querySuffix === settings.querySuffix + "" ? settings.querySuffix : this.#querySuffix;
    this.#generateSelector = // must be a method
    typeof settings.queryGenerator === "function" ? settings.queryGenerator : this.#generateSelector;
    this.#attributeFilter = // must be an Iterator
    Symbol.iterator in Object(settings.attributeFilter) ? new Set(settings.attributeFilter) : this.#attributeFilter;
    this.#attributeChangedValidator = typeof settings.attributeChangedCallback === "function" ? settings.attributeChangedCallback : this.#attributeChangedValidator;
    this.#validateName = typeof settings.nameValidator === "function" ? settings.nameValidator : this.#validateName;
    this.#definedCallback = typeof settings.definedCallback === "function" ? settings.definedCallback : this.#definedCallback;
    this.#definitionConstructorCallback = typeof settings.definitionConstructorCallback === "function" ? settings.definitionConstructorCallback : this.#definitionConstructorCallback;
    this.#definitionConnectedCallback = typeof settings.definitionConnectedCallback === "function" ? settings.definitionConnectedCallback : this.#definitionConnectedCallback;
    this.#definitionDisconnectedCallback = typeof settings.definitionDisconnectedCallback === "function" ? settings.definitionDisconnectedCallback : this.#definitionDisconnectedCallback;
    this.#definitionConnectedMoveCallback = typeof settings.definitionConnectedMoveCallback === "function" ? settings.definitionConnectedMoveCallback : this.#definitionConnectedMoveCallback;
    this.#definitionAttributeChangedCallback = typeof settings.definitionAttributeChangedCallback === "function" ? settings.definitionAttributeChangedCallback : this.#definitionAttributeChangedCallback;
    if (optionsChangeCheck(
      this.#definitionOptionDefaults,
      settings.definitionOptionDefaults,
      true
    )) {
      this.#definitionOptionDefaults = {
        // if no new options passed in, use an an empty object.
        ...Object.keys(Object(settings.definitionOptionDefaults)).length ? settings.definitionOptionDefaults : {}
      };
      if (settings.definitionOptionDefaults) {
        const entries = Object.entries(this.#definitions);
        for (let l = entries.length, i2 = 0; l > i2; i2++) {
          const [name, definition] = entries[i2];
          this.#updateDefinition(name, definition);
        }
      }
    }
  };
  /**
   * method for updating default settings with registry options
   * Also updates any behavior definitions if definitionOptionDefaults changes
   * @param {Object} settings a registry options object
   */
  #updateSettings = (settings) => {
    if (!Object.keys(Object(settings)).length) {
      return;
    }
    const current = {
      // get previous option settings
      ...this.#getSettings(),
      // override with passed in values
      ...settings
    };
    if (settings.definitionOptionDefaults && typeof settings.definitionOptionDefaults === "object") {
      current.definitionOptionDefaults = {
        ...this.#definitionOptionDefaults,
        ...settings.definitionOptionDefaults
      };
    }
    this.#overrideSettings(current);
  };
  /** method for connecting a behavior to an element
      @param {string} name the behavior name
      @param {Element} element the element to attach to
      @param {Object} definition the internal behavior definition
  */
  #connectBehavior = (name, element, definition = this.#definitions[name]) => {
    const { connected, detached, behavior } = definition;
    let options = definition.options, handler = detached.get(element);
    if (behavior.preConnectionCheck) {
      const preCheck = behavior.preConnectionCheck(element, options);
      if (!preCheck) {
        return;
      }
      if (optionsChangeCheck(preCheck, options)) {
        definition = this.#updateDefinition(
          name,
          definition,
          behavior,
          preCheck
        );
        options = { ...definition.options };
      }
    }
    if (!handler) {
      const newOptions = this.#definitionConstructorCallback(
        name,
        element,
        behavior,
        options
      );
      if (optionsChangeCheck(newOptions, options)) {
        definition = this.#updateDefinition(
          name,
          definition,
          behavior,
          newOptions
        );
        options = { ...definition.options };
      }
      handler = new behavior(element, options);
      detached.set(element, handler);
    }
    if (element.isConnected) {
      detached.delete(element);
      connected.set(element, handler);
      this.#connected.getOrInsert(element, {})[name] = handler;
      if (behavior.observedAttributes?.length && handler.attributeChangedCallback) {
        if (this.#withAttrCallback.has(element)) {
          this.#withAttrCallback.get(element).handlers[name] = handler;
        } else {
          const observer = new MutationObserver(
            this.#connectedAttributeChangeAction
          );
          observer.observe(element, { attributeOldValue: true });
          this.#withAttrCallback.set(element, {
            observer,
            handlers: { [name]: handler }
          });
        }
      }
      this.#definitionConnectedCallback(name, element, definition.options);
      handler.connectedCallback?.(element);
    }
  };
  /** method for disconnecting a behavior from an element
      @param {string} name the behavior name
      @param {Element} element the element with the behavior to remove
      @param {Object} definition the internal behavior definition object
      @param {Oblect} handler the behavior instance to remove
  */
  #detachBehavior = (name, element, definition = this.#definitions[name], handler = definition?.connected.get(element)) => {
    definition.connected.delete(element);
    definition.detached.set(element, handler);
    const behaviors = this.#connected.get(element);
    if (behaviors) {
      delete behaviors[name];
      if (!Object.keys(behaviors).length) {
        this.#connected.delete(element);
      }
    }
    if (handler?.attributeChangedCallback) {
      const attrState = this.#withAttrCallback.get(element);
      if (attrState) {
        const { observer, handlers } = attrState;
        const currentHandler = handlers[name];
        if (currentHandler) {
          delete handlers[name];
        }
        if (!Object.keys(handlers).length) {
          observer.disconnect();
          this.#withAttrCallback.delete(element);
        }
      }
    }
    handler.disconnectedCallback?.(element);
    this.#definitionDisconnectedCallback(name, element, definition.options);
  };
  /** MutationObserver action for any element with 
      one or more connected behaviors
      that have an attributeChangedCallback 
    @param {Array.<MutationRecord>} records
  */
  #connectedAttributeChangeAction = (records) => {
    for (let l = records.length, i2 = 0; l > i2; i2++) {
      const { target, attributeName, oldValue } = records[i2], { handlers } = this.#withAttrCallback.get(target);
      if (!handlers) continue;
      const entries = Object.entries(handlers);
      for (let l2 = entries.length, i3 = 0; l2 > i3; i3++) {
        const [name, handler] = entries[i3], definition = this.#definitions[name], { selector, behavior, options } = definition;
        if (definition.attributeMatches(attributeName)) {
          const newValue = target.getAttribute(attributeName);
          this.#definitionAttributeChangedCallback(
            name,
            target,
            attributeName,
            oldValue,
            newValue,
            options
          );
          handler.attributeChangedCallback(
            target,
            attributeName,
            oldValue,
            newValue
          );
        }
      }
    }
  };
  /** method to determine if an element removed from the DOM has 
        any behaviors to disconnect. Also flags behaviors that may 
        trigger their connectedMoveCallback instead, so they can be
        processed by/after the checkAddedNode calls
      @param {Element} element Element being checked
      @param {Map.<string,Map.<Element,Object>} potentialMoves map of behavior names with removed elements whose behavior instances have connectedMoveCallbacks
      @param {Map.<Element,Object.<string,Object>} connected map of connected elements and thier named behavior instances  
      @param {Map.<Element,ShadowRoot>} shadows map of elements with observed shadowRoots
  */
  #checkRemovedNode = (element, potentialMoves, connected, shadows) => {
    const root = shadows.size && shadows.get(element);
    if (root) {
      _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("detatchedShadows")].set(element, root);
      shadows.delete(element);
    }
    if (!connected.size) return;
    const handlers = Object.entries(connected.get(element) || {});
    for (let l = handlers.length, i2 = 0; l > i2; i2++) {
      const [name, handler] = handlers[i2];
      handler.connectedMoveCallback ? potentialMoves.getOrInsert(name, /* @__PURE__ */ new Map()).set(element, handler) : this.#detachBehavior(name, element);
    }
  };
  /** method to deterimine if an element added to the DOM has 
        any behaviors to connect. Also checks behaviors that may 
        trigger their connectedMoveCallback instead and disconnects
        the ones that don't
      @param {Element} element Element being checked
      @param {[string,Object][]} definitions entries array of name & internal behavior definition objects
      @param {Map.<string,Map.<Element,Object>} potentialMoves map of behavior names with removed elements whose behavior instances have connectedMoveCallbacks
  */
  #checkAddedNode = (element, definitions, potentialMoves) => {
    const shadows = _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("detatchedShadows")], root = shadows.get(element);
    if (root) {
      _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")].set(element, root);
      this.#observer.add(root);
      shadows.delete(element);
      setTimeout(() => this.update(root), 0);
    }
    for (let l = definitions.length, i2 = 0; l > i2; i2++) {
      const [name, definition] = definitions[i2], { selector, connected } = definition, matches = (
        // if element matches selector
        element.matches(selector) && // check if behavior is filtering or excluding tag names
        definition.tagAllowed(element.tagName)
      ), moveable = potentialMoves.get(name), handler = moveable?.get(element);
      if (!(matches || handler)) {
        continue;
      } else if (handler) {
        if (matches) {
          this.#definitionConnectedMoveCallback(
            name,
            element,
            definition.options
          );
          handler.connectedMoveCallback(element);
        } else {
          this.#detachBehavior(name, element, definition, handler);
        }
        moveable.delete(element);
        if (!moveable.size) {
          potentialMoves.delete(name);
        }
      } else if (matches && !connected.has(element)) {
        this.#connectBehavior(name, element, definition);
      }
    }
  };
  /** method to deterimine if an element has behaviors to either connect or disconnect
   * called by attribute type mutation actions, registry.define and registry.update
   * @param {Element} element the element to check
   * @param {Array.<[string,Object]>} definitions entries array of name & internal behavior definition objects
   */
  #checkElementBehaviors = (element, definitions) => {
    for (let l = definitions.length, i2 = 0; l > i2; i2++) {
      const [name, definition] = definitions[i2], { selector, connected } = definition, matches = (
        // if element matches selector
        element.matches(selector) && // check if behavior is filtering or excluding tag names
        definition.tagAllowed(element.tagName)
      ), handler = connected.get(element);
      if (handler && !matches) {
        this.#detachBehavior(name, element, definition, handler);
      } else if (matches && !handler) {
        this.#connectBehavior(name, element, definition);
      }
    }
  };
  /** registry mutation action that tracks element instertions, removals and 
        (if #attributeFilter is defined) attribute changes across the entire DOM.
        it will then call #checkRemovedNode, #checkAddedNode, and 
        #checkElementBehaviors as required.
      @param {Array.<MutationRecord>} records
      @param {Map} potentialMoves optional map of removed elements that might be re-added in the records
   */
  #mutationAction = (records, observer = this.#observer, potentialMoves = /* @__PURE__ */ new Map()) => {
    const definitions = Object.entries(this.#definitions);
    for (const {
      type,
      target,
      removedNodes,
      addedNodes,
      attributeName,
      oldValue
    } of records) {
      if (type === "childList") {
        const shadows = _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")], connected = this.#connected;
        if (removedNodes.length && (connected.size || shadows.size)) {
          for (let l = removedNodes.length, i2 = 0; l > i2; i2++) {
            const node = removedNodes[i2];
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            } else {
              this.#checkRemovedNode(node, potentialMoves, connected, shadows);
              const flatten = node.querySelectorAll("*");
              for (let l2 = flatten.length, i3 = 0; l2 > i3; i3++) {
                this.#checkRemovedNode(
                  flatten[i3],
                  potentialMoves,
                  connected,
                  shadows
                );
                if (!(connected.size || shadows.size)) break;
              }
            }
            if (!(connected.size || shadows.size)) break;
          }
        }
        if (addedNodes.length) {
          for (let l = addedNodes.length, i2 = 0; l > i2; i2++) {
            const node = addedNodes[i2];
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            } else {
              this.#checkAddedNode(node, definitions, potentialMoves);
              const flatten = node.querySelectorAll("*");
              for (let l2 = flatten.length, i3 = 0; l2 > i3; i3++) {
                this.#checkAddedNode(flatten[i3], definitions, potentialMoves);
              }
            }
          }
        }
      } else if (type === "attributes") {
        const newValue = target.getAttribute(attributeName), check = this.#attributeChangedValidator(
          target,
          attributeName,
          oldValue,
          newValue
        );
        if (!check) {
          continue;
        } else if (check === true) {
          this.#checkElementBehaviors(target, definitions);
        } else if (check instanceof Element) {
          this.#checkElementBehaviors(check, definitions);
        } else if (Symbol.iterator in Object(check)) {
          for (const element of check) {
            if (!(element instanceof Element)) continue;
            this.#checkElementBehaviors(element, definitions);
          }
        }
      }
    }
    if (potentialMoves.size) {
      records = this.#observer.takeRecords();
      if (records.length) {
        this.#mutationAction(records, observer, potentialMoves);
      } else {
        for (const [name, elements] of potentialMoves) {
          for (const [element] of elements) {
            this.#detachBehavior(name, element);
          }
        }
      }
    }
  };
  //
  // public methods
  //
  /** CustomBehaviorRegistry constructor
      @param {Object} settings registry options */
  constructor(settings = {}) {
    this.#updateSettings(settings);
    this[/* @__PURE__ */ Symbol.for("actions")] = {
      observable: true,
      observe: () => {
        this[/* @__PURE__ */ Symbol.for("actions")].observable = true;
        if (this.#observer) {
          this.#mutationAction(this.observer.takeRecords());
        } else {
          const observer = new MutationObserver(this.#mutationAction);
          observer.add = (root) => {
            observer.observe(root, {
              subtree: true,
              childList: true,
              attributeOldValue: !!this.#attributeFilter.size,
              attributeFilter: [...this.#attributeFilter]
            });
          };
          _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("observers")].set(
            this,
            observer.add
          );
          this.#observer = observer;
        }
        this.#observer.add(document.documentElement);
        _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")].forEach(
          (root) => this.#observer.add(root)
        );
      },
      disconnect: () => {
        this[/* @__PURE__ */ Symbol.for("actions")].observable = false;
        if (this.#observer) {
          this.#mutationAction(this.#observer.takeRecords());
          this.#observer.disconnect();
        }
      },
      getSettings: () => {
        return this.#getSettings();
      },
      replaceSettings: (settings2) => {
        this.#overrideSettings(settings2);
        return this.#getSettings();
      },
      undefineBehavior: (name) => {
        if (name !== "" + name) {
          name = this.getName(name);
          if (!name) return;
        }
        const connected = this.#definitions[name]?.connected;
        if (connected?.size) {
          for (const element of connected.keys()) {
            this.#detachBehavior(name, element);
          }
        }
        delete this.#definitions[name];
        if (!Object.keys(this.#definitions).length && this.#observer) {
          this.#observer.disconnect();
          this.#observer = void 0;
          _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("observers")].delete(this);
        }
      },
      undefineAllBehaviors: () => {
        for (const name of Object.keys(this.#definitions)) {
          this[/* @__PURE__ */ Symbol.for("actions")].undefineBehavior(name);
        }
      }
    };
  }
  /** method to return a promise that resolves after a specified behavior 
        is defined in the registry
      @param name the name of the behavior being waited on
      @returns {Promise.<Class>} a Promise that resolves to the behavior class */
  whenDefined(name) {
    const nameCheck = this.#validateName(name);
    if (!nameCheck) {
      throw `${name} is not a valid elementBehavior name`;
    } else if (nameCheck === nameCheck + "") {
      name = nameCheck;
    }
    if (this.#definitions[name]) {
      return Promise.resolve(this.#definitions[name].behavior);
    } else if (!this.#promises[name]) {
      const entry = this.#promises[name] = {};
      entry.promise = new Promise((resolve, reject) => {
        entry.resolver = resolve;
      });
    }
    return this.#promises[name].promise;
  }
  /** method to create new behavior definitions and
        connect them to any matching elements in the dom. will also resolve
        any promise created by whenDefined
      @param {string} name the name of the behavior being defined
      @param {Class} behavior the behavior class 
      @param {Object} options optional definition options 
  */
  define(name, behavior, options) {
    options = Object.keys(Object(options)).length ? options : {};
    const nameCheck = this.#validateName(name);
    if (!nameCheck) {
      throw new TypeError(`"${name}" is not a valid elementBehavior name`);
    } else if (nameCheck === nameCheck + "") {
      name = nameCheck;
    }
    if (this.#definitions[name]) {
      throw new Error(`elementBehavior already defined for "${name}"`);
    }
    if (!behavior) {
      throw new TypeError(`${behavior} is not a constructor`);
    } else {
      try {
        class Dummy extends behavior {
        }
      } catch (e) {
        throw TypeError(`${behavior} is not a constructor`);
      }
    }
    const registrySettings = this.#definedCallback(name, behavior, {
      ...this.#definitionOptionDefaults,
      ...options
    });
    Object.keys(Object(registrySettings)).length && this.#updateSettings(registrySettings);
    if (this[/* @__PURE__ */ Symbol.for("actions")].observable && (!this.#observer || Symbol.iterator in Object(registrySettings?.attributeFilter))) {
      this[/* @__PURE__ */ Symbol.for("actions")].observe();
    }
    const definition = this.#updateDefinition(name, {}, behavior, options);
    const { selector } = definition, connect = (root) => {
      if (this[/* @__PURE__ */ Symbol.for("actions")].observable) {
        const found = root.querySelectorAll(selector);
        for (const element of found) {
          if (definition.tagAllowed(element.tagName)) {
            this.#connectBehavior(name, element, definition);
          }
        }
      }
    };
    connect(document);
    _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")].forEach(
      (root) => connect(root)
    );
    if (this.#promises[name]) {
      this.#promises[name].resolver(behavior);
      delete this.#promises[name];
    }
  }
  /** method to determine a given element or any child elements 
        need to connect or disconnect bahaviors.
        If no element is provided, will search the entire DOM
  @param {Element | ShadowRoot} root the element to search
  */
  update(root) {
    const checkShadows = !root && _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")].size;
    root = root || document.documentElement;
    const definitions = Object.entries(this.#definitions);
    const clearBehaviors = (element) => {
      const behaviors = this.#connected.get(element);
      if (behaviors) {
        for (const [name] of behaviors) {
          this.#detachBehavior(name, flatten[i]);
        }
      }
    };
    this.#checkElementBehaviors(root, definitions);
    const flatten = root.querySelectorAll("*");
    for (let l = flatten.length, i2 = 0; i2 < l; i2++) {
      this.#checkElementBehaviors(flatten[i2], definitions);
    }
    if (checkShadows) {
      const connected = _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")];
      const detached = _CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("detatchedShadows")];
      this.#checkElementBehaviors(root, definitions);
      const flatten2 = root.querySelectorAll("*");
      for (let l = flatten2.length, i2 = 0; i2 < l; i2++) {
        this.#checkElementBehaviors(flatten2[i2], definitions);
      }
      for (const [element, shadow] of connected) {
        if (element.isConnected) {
          const flatten3 = shadow.querySelectorAll("*");
          for (let l = flatten3.length, i2 = 0; i2 < l; i2++) {
            this.#checkElementBehaviors(flatten3[i2]);
          }
        } else {
          clearBehaviors(element);
          const flatten3 = shadow.querySelectorAll("*");
          for (let l = flatten3.length, i2 = 0; i2 < l; i2++) {
            clearBehaviors(flatten3[i2]);
          }
          disconnected.set(element, connected.get(element));
          connected.delete(element);
        }
      }
    }
  }
  /** method for looking up the behavior class of a given name,
        or the class instance for a given name and element
      @param {string} name the name of the behavior
      @param {Element=} element optional element that has the behavior attached 
      @returns {(Class|Object|null)} the named Behavior class, element's behavior instance, or null if not found
  */
  get(name, element) {
    const checkName = this.#validateName(name);
    if (!checkName) {
      return null;
    } else if (checkName === "" + checkName) {
      name = checkName;
    }
    if (!element) {
      return this.#definitions[name]?.behavior || null;
    } else {
      return this.#connected.get(element)?.[name] || null;
    }
  }
  /** method for getting all elements currently connected to a behavior
      @param {string | class} lookup either the name of the behavior or the behavior class 
      @returns {Map.<Element,Object>|null} a map elements and their associated behavior instances or null if none exist */
  getElements(lookup) {
    if (lookup === "" + lookup) {
      const checkName = this.#validateName(lookup);
      if (!checkName) {
        return null;
      } else if (checkName === "" + checkName) {
        lookup = checkName;
      }
      const connected = this.#definitions[lookup]?.connected;
      if (connected?.size) {
        return new Map(connected.entries());
      }
    } else {
      for (const [name, definition] of Object.entries(this.#definitions)) {
        if (definition.behavior === lookup) {
          return definition.connected?.size ? new Map(definition.connected.entries()) : null;
        }
      }
    }
    return null;
  }
  /** method for getting all behavior instances currently connected to an element
      @param {Element} element the element with attached behaviors
      @returns {Object.<string,Object>|null} a named list of behavior instances or null if none exist */
  getElementBehaviors(element) {
    const entries = Object.entries(this.#connected.get(element) || {});
    return entries.length > 0 ? Object.freeze(Object.fromEntries(entries)) : null;
  }
  /** method for looking up the name of a given behavior class 
      @param {Class} behavior the behavior class to be named */
  getName(behavior) {
    for (const [name, definition] of Object.entries(this.#definitions)) {
      if (definition.behavior === behavior) {
        return name;
      }
    }
    return null;
  }
};
CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")] = /* @__PURE__ */ new Map();
CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("detatchedShadows")] = /* @__PURE__ */ new WeakMap();
CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("observers")] = /* @__PURE__ */ new Map();
if (!CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("attachShadow")]) {
  CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("attachShadow")] = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(init) {
    var shadowRoot = CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("attachShadow")].call(
      this,
      init
    );
    CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("connectedShadows")].set(
      this,
      shadowRoot
    );
    for (const add of CustomBehaviorRegistry[/* @__PURE__ */ Symbol.for("observers")].values()) {
      add(shadowRoot);
    }
    return shadowRoot;
  };
}
window.CustomBehaviorRegistry = CustomBehaviorRegistry;
export {
  CustomBehaviorRegistry as default
};

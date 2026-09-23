/**
 * see if proposed updates to an options object will change existing
 * if directComparison is true, only checks that the objects don't match
 *
 * @param {any} update possible new options
 * @param {Object} existing currrent options
 * @param {boolean} directComparison defaults to false
 * @returns {boolean} is update required
 */
const optionsChangeCheck = (update, existing, directComparison = false) => {
  try {
    return (
      (directComparison || !!Object.keys(Object(update)).length) &&
      JSON.stringify(existing) !==
        JSON.stringify(directComparison ? update : { ...existing, ...update })
    );
  } catch (e) {
    return false;
  }
};
/**
  Class that allows a user to create their own Custom Behavior Registries
  @class
 */

export default class CustomBehaviorRegistry {
  //
  // static registry management methods
  //
  /**
   * enable a registry's MutationObserver and, if it has defined behaviors, re-observe the DOM and shadowRoots
   * @param {CustomBehaviorRegistry} registry the registry instance to enable
   */
  static observe(registry) {
    registry instanceof CustomBehaviorRegistry &&
      registry[Symbol.for("actions")].observe();
  }
  /**
   * disable a registry's MutationObserver so it will stop connecting or disconnecting elements to its defined behaviors
   * including for any new behaviors defined while disabled.
   * @param {CustomBehaviorRegistry} registry the registry instance to disable
   */
  static disconnect(registry) {
    registry instanceof CustomBehaviorRegistry &&
      registry[Symbol.for("actions")].disconnect();
  }
  static getSettings(registry) {
    return registry instanceof CustomBehaviorRegistry
      ? registry[Symbol.for("actions")].getSettings()
      : null;
  }
  static replaceSettings(registry, settings) {
    return registry instanceof CustomBehaviorRegistry
      ? registry[Symbol.for("actions")].replaceSettings(settings)
      : null;
  }
  static clearSettings(registry) {
    return registry instanceof CustomBehaviorRegistry
      ? registry[Symbol.for("actions")].replaceSettings(
          new CustomBehaviorRegistry()[Symbol.for("actions")].getSettings(),
        )
      : null;
  }
  /**
   * remove a registry's defined behavior, disconnecting any connected elements in the proccess
   * @param {CustomBehaviorRegistry} registry the registry whose behavior is being removed
   * @param {string} name the name of the behavior to remove
   */
  static undefineBehavior(registry, name) {
    registry instanceof CustomBehaviorRegistry &&
      registry[Symbol.for("actions")].undefineBehavior(name);
  }
  /**
   * remove all defined behaviors from a registry, disconnecting any connected elements in the proccess
   * @param {CustomBehaviorRegistry} registry the registry whose behaviors are being removed
   */
  static undefineAllBehaviors(registry) {
    registry instanceof CustomBehaviorRegistry &&
      registry[Symbol.for("actions")].undefineAllBehaviors();
  }
  //
  // internal Registry collections
  //
  /** hold the registry mutation observer */
  #observer = null;
  /** a named list of defined behaviors */
  #definitions = {};
  /** a map of elements to a named list of the their connected behaviors */
  #connected = new Map();
  /** a  map of elements to an array containing their mutation observer 
      and a named list of their behaviors with attributeChangeCallback */
  #withAttrCallback = new Map();
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
  #validateName = (name) =>
    // default action: check if name is a string with at least one chacter
    name?.length && "" + name === name;
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
  #generateSelector = (name, behavior, options) =>
    // default action: return queryPrefix + name + querySuffix
    this.#queryPrefix + name + this.#querySuffix;
  /**
   * optional method to call when a new definition is created
   * @param {string} name
   * @param {class} behavior
   * @param {Object} options
   * @returns {void || Object} nothing or new Registry settings
   */
  #definedCallback = (name, behavior, options) => void 0; // default: do nothing
  /** optional attributes (if any) that can trigger a behavior refresh */
  #attributeFilter = new Set();
  /** optional method to determine if a given
   *  attribute change needs a behavior refresh
   *  Only fires if attributeFilter is defined
   * @param {*} element
   * @param {*} attributeName
   * @param {*} oldValue
   * @param {*} newValue
   * @returns {boolean || Element || Element[]} true, false, or a list of elements to check
   */
  #attributeChangedValidator = (element, attributeName, oldValue, newValue) =>
    // default action:
    this.#attributeFilter.size //check if the filter exists
      ? this.#attributeFilter.has(attributeName) //and the attribute is in it
      : false;
  /**
   * optional method to call before calling a  behavior contructor
   * @param {string} name
   * @param {Element} element
   * @param {class} behavior
   * @param {Object} options
   * @returns {void|Object} nothing or new definition options
   */
  #definitionConstructorCallback = (name, element, behavior, options) => void 0; // default: do nothing
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
  #definitionConnectedCallback = (name, element, options) => void 0; // default: do nothing
  /**
   * optional method to call after a connected behavior triggers thier
   * disconnectedCallback
   * @param {string} name
   * @param {Element} element
   * @param {Object} options
   * @returns {void}
   */
  #definitionDisconnectedCallback = (name, element, options) => void 0; // default: do nothing
  /**
   * optional method to call before a connected behavior triggers thier
   * connectedMoveCallback
   * @param {string} name
   * @param {Element} element
   * @param {Object} options
   * @returns {void}
   */
  #definitionConnectedMoveCallback = (name, element, options) => void 0; // default: do nothing
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
  #definitionAttributeChangedCallback = (
    name,
    element,
    attributeName,
    oldValue,
    newValue,
    options,
  ) => void 0; // default: do nothing
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
  #updateDefinition = (
    name,
    definition = {},
    behavior = definition.behavior,
    options = {},
  ) => {
    options = { ...(definition.initOptions || {}), ...options };
    const definitionDefaults = this.#definitionOptionDefaults,
      generateSelector = this.#generateSelector,
      tagListToSet = (set, tag) => {
        set.add(("" + tag).toUpperCase());
        return set;
      };
    return (this.#definitions[name] = {
      behavior: behavior,
      // string copy of initial tagFilter array, in case in changes
      initTags: behavior.tagFilter?.toString() || "",
      // convert to a set & make sure tags are strings and upper case
      //just the options that were passed in
      tagSet: behavior.tagFilter?.reduce(tagListToSet, new Set()) || new Set(),
      // string copy of initial tagExludes array, in case in changes
      initExTags: behavior.tagExcludes?.toString() || "",
      tagExSet:
        behavior.tagExcludes?.reduce(tagListToSet, new Set()) || new Set(),
      // update tagSet & tagExSet as needed then return validty of tagname
      tagAllowed(tagName) {
        tagName = ("" + tagName).toUpperCase();
        let current = this.behavior.tagFilter?.toString() || "";
        if (current !== this.initTags) {
          this.initTags = current;
          this.tagSet =
            this.behavior.tagFilter?.reduce(tagListToSet, new Set()) ||
            new Set();
        }
        current = this.behavior.tagExcludes?.toString() || "";
        if (current !== this.initExTags) {
          this.initExTags = current;
          this.tagExSet =
            this.behavior.tagExcludes?.reduce(tagListToSet, new Set()) ||
            new Set();
        }
        // return true if tagExcludes is empty or passed in tag missing from tagExcludes
        // AND tagFilter is empty or passed in tag is in tagFilter
        return (
          (!this.tagExSet.size || !this.tagExSet.has(tagName)) &&
          (!this.tagSet.size || this.tagSet.has(tagName))
        );
      },
      initAttrs: behavior.observedAttributes?.toString() || "",
      attrSet:
        behavior.observedAttributes?.reduce((attrSet, attr) => {
          attr = ("" + attr).toLowerCase();
          if (!attr.endsWith("-*")) {
            attrSet.add(attr);
          }
          return attrSet;
        }, new Set()) || new Set(),
      attrStarts:
        behavior.observedAttributes?.reduce((attrStarts, attr) => {
          attr = ("" + attr).toLowerCase();
          //strip the star
          if (attr.endsWith("-*")) {
            attrStarts.push(attr.slice(0, -1));
          }
          return attrStarts;
        }, []) || [],
      attributeMatches(attributeName) {
        attributeName = ("" + attributeName).toLowerCase();
        const current = this.behavior.observedAttributes?.toString() || "";
        // on the off chance observedAttributes was updated since definition
        if (current !== this.initAttrs) {
          // rebuild initAttrs, attrSet & attrStarts
          this.initAttrs = current;
          [this.attrSet, this.attrStarts] =
            this.behavior.observedAttributes?.reduce(
              ([attrSet, attrStarts], attr) => {
                attr = ("" + attr).toLowerCase();
                if (attr.endsWith("-*")) {
                  //strip ther star
                  attrStarts.push(attr.slice(0, -1));
                } else {
                  attrSet.add(attr.toLowerCase());
                }
                return [attrSet, attrStarts];
              },
              [new Set(), []],
            ) || [new Set(), []];
        }
        return (
          this.attrSet.has(attributeName) ||
          this.attrStarts.some((prefix) => attributeName.startsWith(prefix))
        );
      },
      initOptions: options,
      // consolodated with defaults
      options: { ...definitionDefaults, ...options },
      selector: generateSelector(name, behavior, {
        ...definitionDefaults,
        ...options,
      }),
      connected: definition.connected || new Map(),
      detached: definition.detached || new WeakMap(),
    });
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
    definitionAttributeChangedCallback:
      this.#definitionAttributeChangedCallback,
    definitionConnectedMoveCallback: this.#definitionConnectedMoveCallback,
    definitionOptionDefaults: this.#definitionOptionDefaults,
  });
  /**
   * method for overiding one or more registry setting with new values
   * also updates  behavior definition if definitionOptionDefaults changed
   * @param {Object} settings a registry options object
   */
  #overrideSettings = (settings) => {
    // push up any valid changes to private vars
    this.#queryPrefix = // must be a string
      settings.queryPrefix === settings.queryPrefix + ""
        ? settings.queryPrefix
        : this.#queryPrefix;
    this.#querySuffix =
      settings.querySuffix === settings.querySuffix + ""
        ? settings.querySuffix
        : this.#querySuffix;
    this.#generateSelector = // must be a method
      typeof settings.queryGenerator === "function"
        ? settings.queryGenerator
        : this.#generateSelector;
    this.#attributeFilter = // must be an Iterator
      Symbol.iterator in Object(settings.attributeFilter)
        ? new Set(settings.attributeFilter)
        : this.#attributeFilter;
    this.#attributeChangedValidator =
      typeof settings.attributeChangedCallback === "function"
        ? settings.attributeChangedCallback
        : this.#attributeChangedValidator;
    this.#validateName =
      typeof settings.nameValidator === "function"
        ? settings.nameValidator
        : this.#validateName;
    this.#definedCallback =
      typeof settings.definedCallback === "function"
        ? settings.definedCallback
        : this.#definedCallback;
    this.#definitionConstructorCallback =
      typeof settings.definitionConstructorCallback === "function"
        ? settings.definitionConstructorCallback
        : this.#definitionConstructorCallback;
    this.#definitionConnectedCallback =
      typeof settings.definitionConnectedCallback === "function"
        ? settings.definitionConnectedCallback
        : this.#definitionConnectedCallback;
    this.#definitionDisconnectedCallback =
      typeof settings.definitionDisconnectedCallback === "function"
        ? settings.definitionDisconnectedCallback
        : this.#definitionDisconnectedCallback;
    this.#definitionConnectedMoveCallback =
      typeof settings.definitionConnectedMoveCallback === "function"
        ? settings.definitionConnectedMoveCallback
        : this.#definitionConnectedMoveCallback;
    this.#definitionAttributeChangedCallback =
      typeof settings.definitionAttributeChangedCallback === "function"
        ? settings.definitionAttributeChangedCallback
        : this.#definitionAttributeChangedCallback;
    if (
      optionsChangeCheck(
        this.#definitionOptionDefaults,
        settings.definitionOptionDefaults,
        true,
      )
    ) {
      this.#definitionOptionDefaults = {
        // if no new options passed in, use an an empty object.
        ...(Object.keys(Object(settings.definitionOptionDefaults)).length
          ? settings.definitionOptionDefaults
          : {}),
      };
      // update defintions if required
      if (settings.definitionOptionDefaults) {
        const entries = Object.entries(this.#definitions);
        for (let l = entries.length, i = 0; l > i; i++) {
          const [name, definition] = entries[i];
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
      ...settings,
    };
    // make sure we aren't overwritting previous defaults
    if (
      settings.definitionOptionDefaults &&
      typeof settings.definitionOptionDefaults === "object"
    ) {
      // consolidate the values
      current.definitionOptionDefaults = {
        ...this.#definitionOptionDefaults,
        ...settings.definitionOptionDefaults,
      };
    }
    // push up any valid changes to private vars
    this.#overrideSettings(current);
  };
  /** method for connecting a behavior to an element
      @param {string} name the behavior name
      @param {Element} element the element to attach to
      @param {Object} definition the internal behavior definition
  */
  #connectBehavior = (name, element, definition = this.#definitions[name]) => {
    const { connected, detached, behavior } = definition;
    let options = definition.options,
      handler = detached.get(element);
    // need to do precheck
    if (behavior.preConnectionCheck) {
      const preCheck = behavior.preConnectionCheck(element, options);
      if (!preCheck) {
        // returned false, fail silently
        return;
      }
      if (optionsChangeCheck(preCheck, options)) {
        definition = this.#updateDefinition(
          name,
          definition,
          behavior,
          preCheck,
        );
        options = { ...definition.options };
      }
    }
    // need to construct a new behavior instance
    if (!handler) {
      const newOptions = this.#definitionConstructorCallback(
        name,
        element,
        behavior,
        options,
      );
      if (optionsChangeCheck(newOptions, options)) {
        // object passed back. update the definition
        definition = this.#updateDefinition(
          name,
          definition,
          behavior,
          newOptions,
        );
        options = { ...definition.options };
      }
      handler = new behavior(element, options);
      // in case we got here from registry.update(element) to pre-construct the handler
      // before adding the element to the dom
      detached.set(element, handler);
    }
    // don't do anything else if the element isn't in the dom right now.
    if (element.isConnected) {
      detached.delete(element);
      connected.set(element, handler);
      // add the element to the registry-wide connected list
      this.#connected.getOrInsert(element, {})[name] = handler;
      // if the behavior tracks attribute changes
      if (behavior.observedAttributes?.length && handler.attributeChangedCallback) {
        // add the handler to the existing collection
        if (this.#withAttrCallback.has(element)) {
          this.#withAttrCallback.get(element).handlers[name] = handler;
        } else {
          // or create a new collection if needed
          const observer = new MutationObserver(
            this.#connectedAttributeChangeAction,
          );
          observer.observe(element, { attributeOldValue: true });
          this.#withAttrCallback.set(element, {
            observer: observer,
            handlers: { [name]: handler },
          });
        }
      }
      // call the connected callbacks
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
  #detachBehavior = (
    name,
    element,
    definition = this.#definitions[name],
    handler = definition?.connected.get(element),
  ) => {
    // remove element from the definition's connected list
    definition.connected.delete(element);
    // pop it in the detached list, in case it re-connects later
    definition.detached.set(element, handler);
    // remove it from the element's registry-wide behavior list too
    const behaviors = this.#connected.get(element);
    if (behaviors) {
      delete behaviors[name];
      // if the element has no connected behaviors
      if (!Object.keys(behaviors).length) {
        // clear it as well
        this.#connected.delete(element);
      }
    }
    // clean up the attribute list as well
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
    // call the detatch callbacks
    handler.disconnectedCallback?.(element);
    this.#definitionDisconnectedCallback(name, element, definition.options);
  };
  /** MutationObserver action for any element with 
      one or more connected behaviors
      that have an attributeChangedCallback 
    @param {Array.<MutationRecord>} records
  */
  #connectedAttributeChangeAction = (records) => {
    //old school for loop with static length is fastest way to iterate
    for (let l = records.length, i = 0; l > i; i++) {
      const { target, attributeName, oldValue } = records[i],
        { handlers } = this.#withAttrCallback.get(target);
      // on the off chance it doesn't have attribute callbacks, skip
      if (!handlers) continue;
      const entries = Object.entries(handlers);
      for (let l = entries.length, i = 0; l > i; i++) {
        const [name, handler] = entries[i],
          definition = this.#definitions[name],
          { selector, behavior, options } = definition;
        if (definition.attributeMatches(attributeName)) {
          const newValue = target.getAttribute(attributeName);
          this.#definitionAttributeChangedCallback(
            name,
            target,
            attributeName,
            oldValue,
            newValue,
            options,
          );
          handler.attributeChangedCallback(
            target,
            attributeName,
            oldValue,
            newValue,
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
    // if the element has a shadow we're observing
    const root = shadows.size && shadows.get(element);
    if (root) {
      // move it to the detatched weakmap, so we don't keep a hard reference to it.
      CustomBehaviorRegistry[Symbol.for("detatchedShadows")].set(element, root);
      shadows.delete(element);
    }
    // no connected elements to clear. stop
    if (!connected.size) return;
    // see if there's any connected behaviors for this element
    const handlers = Object.entries(connected.get(element) || {});
    //old school for loop with static length is fastest way to iterate
    for (let l = handlers.length, i = 0; l > i; i++) {
      const [name, handler] = handlers[i];
      // if handler has a move callback
      handler.connectedMoveCallback
        ? potentialMoves // wait to see if it's re-added
            // by grouping the elements & handlers by definition name
            .getOrInsert(name, new Map())
            // so checkAddedNode can proccess them later
            .set(element, handler)
        : this.#detachBehavior(name, element); //otherwise detach it
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
    // is this element has a previously observed shadow dom
    const shadows = CustomBehaviorRegistry[Symbol.for("detatchedShadows")],
      root = shadows.get(element);
    if (root) {
      // flip it back into the connected shadow list
      CustomBehaviorRegistry[Symbol.for("connectedShadows")].set(element, root);
      //and re-observe the element, in case the attribute list changed
      this.#observer.add(root);
      shadows.delete(element);
      //re-scan the shadow root document.
      setTimeout(() => this.update(root), 0);
    }

    //old school for loop with static length is fastest way to iterate
    for (let l = definitions.length, i = 0; l > i; i++) {
      const [name, definition] = definitions[i],
        { selector, connected } = definition,
        matches =
          // if element matches selector
          element.matches(selector) &&
          // check if behavior is filtering or excluding tag names
          definition.tagAllowed(element.tagName),
        // if one or more moveable elements were removed for this definition
        moveable = potentialMoves.get(name),
        // was this element one of them?
        handler = moveable?.get(element);
      //not a match and not movable, skip
      if (!(matches || handler)) {
        continue;
      } else if (handler) {
        //if element was in move list
        if (matches) {
          // and it still matches, trigger the callbacks
          this.#definitionConnectedMoveCallback(
            name,
            element,
            definition.options,
          );
          handler.connectedMoveCallback(element);
        } else {
          // no longer matching, detach the behavior
          this.#detachBehavior(name, element, definition, handler);
        }
        // no need to re-check the element
        moveable.delete(element);
        if (!moveable.size) {
          // all moveable elements found, stop checking this definition
          potentialMoves.delete(name);
        }
      } else if (matches && !connected.has(element)) {
        // non-moving matching element that wasn't already connected
        this.#connectBehavior(name, element, definition);
      }
      //ignore non-moving matches that are connected
    }
  };
  /** method to deterimine if an element has behaviors to either connect or disconnect
   * called by attribute type mutation actions, registry.define and registry.update
   * @param {Element} element the element to check
   * @param {Array.<[string,Object]>} definitions entries array of name & internal behavior definition objects
   */
  #checkElementBehaviors = (element, definitions) => {
    //old school for loop with static length is fastest way to iterate
    for (let l = definitions.length, i = 0; l > i; i++) {
      const [name, definition] = definitions[i],
        { selector, connected } = definition,
        matches =
          // if element matches selector
          element.matches(selector) &&
          // check if behavior is filtering or excluding tag names
          definition.tagAllowed(element.tagName),
        //is element already connected?
        handler = connected.get(element);
      if (handler && !matches) {
        // previously matching element doesn't anymore
        this.#detachBehavior(name, element, definition, handler);
      } else if (matches && !handler) {
        // element newly matched
        this.#connectBehavior(name, element, definition);
      }
      // ignores matching & connected or not matched & not connected
    }
  };
  /** registry mutation action that tracks element instertions, removals and 
        (if #attributeFilter is defined) attribute changes across the entire DOM.
        it will then call #checkRemovedNode, #checkAddedNode, and 
        #checkElementBehaviors as required.
      @param {Array.<MutationRecord>} records
      @param {Map} potentialMoves optional map of removed elements that might be re-added in the records
   */
  #mutationAction = (
    records,
    observer = this.#observer,
    potentialMoves = new Map(),
  ) => {
    // a map of elements with handlers that might need to call
    // get a copy of the definitions list entries to re-use
    const definitions = Object.entries(this.#definitions);
    for (const {
      type,
      target,
      removedNodes,
      addedNodes,
      attributeName,
      oldValue,
    } of records) {
      if (type === "childList") {
        // get copies of the maps we may need to remove nodes from
        const shadows = CustomBehaviorRegistry[Symbol.for("connectedShadows")],
          connected = this.#connected;
        // check removed nodes first (if we have nodes to remove)
        if (removedNodes.length && (connected.size || shadows.size)) {
          //old school for loop with static length is fastest way to iterate
          for (let l = removedNodes.length, i = 0; l > i; i++) {
            const node = removedNodes[i];
            //skip non elements
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            } else {
              // see if the node has connected handlers.
              this.#checkRemovedNode(node, potentialMoves, connected, shadows);
              // and check any elements in the node
              const flatten = node.querySelectorAll("*");
              for (let l = flatten.length, i = 0; l > i; i++) {
                this.#checkRemovedNode(
                  flatten[i],
                  potentialMoves,
                  connected,
                  shadows,
                );
                //no nodes to remove anymore. stop checking
                if (!(connected.size || shadows.size)) break;
              }
            }
            if (!(connected.size || shadows.size)) break;
          }
        }
        if (addedNodes.length) {
          for (let l = addedNodes.length, i = 0; l > i; i++) {
            const node = addedNodes[i];
            if (node.nodeType !== Node.ELEMENT_NODE) {
              continue;
            } else {
              this.#checkAddedNode(node, definitions, potentialMoves);
              const flatten = node.querySelectorAll("*");
              for (let l = flatten.length, i = 0; l > i; i++) {
                this.#checkAddedNode(flatten[i], definitions, potentialMoves);
              }
            }
          }
        }
      } else if (type === "attributes") {
        // attribute change
        const newValue = target.getAttribute(attributeName),
          // see if we need to check for behavior updates
          check = this.#attributeChangedValidator(
            target,
            attributeName,
            oldValue,
            newValue,
          );
        if (!check) {
          // no update needed
          continue;
        } else if (check === true) {
          // boolean returned, check target element
          this.#checkElementBehaviors(target, definitions);
        } else if (check instanceof Element) {
          //some other element returned, check it instead
          this.#checkElementBehaviors(check, definitions);
        } else if (Symbol.iterator in Object(check)) {
          // element list returned
          // use for...of because it could be an Array, Set or NodeList.
          for (const element of check) {
            // skip non-elements
            if (!(element instanceof Element)) continue;
            this.#checkElementBehaviors(element, definitions);
          }
        }
      }
    }
    // all records checked. still some potentialMoves floating about
    if (potentialMoves.size) {
      // check if any new records showed up.
      records = this.#observer.takeRecords();
      if (records.length) {
        // and see if the moves happened in that batch
        this.#mutationAction(records, observer, potentialMoves);
      } else {
        //otherwise detatch the elements from their behaviors
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
    this[Symbol.for("actions")] = {
      observable: true,
      observe: () => {
        this[Symbol.for("actions")].observable = true;
        // existing observer
        if (this.#observer) {
          //flush records
          this.#mutationAction(this.#observer.takeRecords());
        } else {
          // create a new mutation observer
          const observer = new MutationObserver(this.#mutationAction);
          // give it a method to (re)observe any root element with the
          // latest attribute list pulled in real time.
          observer.add = (root) => {
            observer.observe(root, {
              subtree: true,
              childList: true,
              attributeOldValue: !!this.#attributeFilter.size,
              attributeFilter: [...this.#attributeFilter],
            });
          };
          // to make sure any newly attached shadow dom can auto-observe itself
          CustomBehaviorRegistry[Symbol.for("observers")].set(
            this,
            observer.add,
          );
          this.#observer = observer;
        }
        // (re)observe the document to ensure it gets the latest attributeFilter
        this.#observer.add(document.documentElement);
        // same for the current list of shadow doms.
        CustomBehaviorRegistry[Symbol.for("connectedShadows")].forEach((root) =>
          this.#observer.add(root),
        );
      },
      disconnect: () => {
        this[Symbol.for("actions")].observable = false;
        // is there an existing observer
        if (this.#observer) {
          //flush records
          this.#mutationAction(this.#observer.takeRecords());
          this.#observer.disconnect();
        }
      },
      getSettings: () => {
        return this.#getSettings();
      },
      replaceSettings: (settings) => {
        this.#overrideSettings(settings);
        return this.#getSettings();
      },
      undefineBehavior: (name) => {
        if (name !== "" + name) {
          // in case a Behavior class wa passed in instead.
          name = this.getName(name);
          // stop if it isn't
          if (!name) return;
        }
        const connected = this.#definitions[name]?.connected;
        if (connected?.size) {
          for (const element of connected.keys()) {
            this.#detachBehavior(name, element);
          }
        }
        delete this.#definitions[name];
        // no more definitions, shut down the mustation observer and remove it
        if (!Object.keys(this.#definitions).length && this.#observer) {
          this.#observer.disconnect();
          this.#observer = undefined;
          CustomBehaviorRegistry[Symbol.for("observers")].delete(this);
        }
      },
      undefineAllBehaviors: () => {
        for (const name of Object.keys(this.#definitions)) {
          this[Symbol.for("actions")].undefineBehavior(name);
        }
      },
    };
  }
  /** method to return a promise that resolves after a specified behavior 
        is defined in the registry
      @param name the name of the behavior being waited on
      @returns {Promise.<Class>} a Promise that resolves to the behavior class */
  whenDefined(name) {
    // quick validation
    const nameCheck = this.#validateName(name);
    if (!nameCheck) {
      throw `${name} is not a valid elementBehavior name`;
    } else if (nameCheck === nameCheck + "") {
      //validator returned a string.
      name = nameCheck;
    }
    if (this.#definitions[name]) {
      //already defined
      return Promise.resolve(this.#definitions[name].behavior);
    } else if (!this.#promises[name]) {
      // first request
      const entry = (this.#promises[name] = {});
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
    //make sure options is an object
    options = Object.keys(Object(options)).length ? options : {};
    // other quick validations
    const nameCheck = this.#validateName(name);
    if (!nameCheck) {
      throw new TypeError(`"${name}" is not a valid elementBehavior name`);
    } else if (nameCheck === nameCheck + "") {
      //validator returned a string.
      name = nameCheck;
    }
    if (this.#definitions[name]) {
      throw new Error(`elementBehavior already defined for "${name}"`);
    }
    if (!behavior) {
      //specifically checking for null but any other falsey value should also fail
      throw new TypeError(`${behavior} is not a constructor`);
    } else {
      try {
        // try and extend the passed in behavior to see if it's a class
        class Dummy extends behavior {}
      } catch (e) {
        // failed
        throw TypeError(`${behavior} is not a constructor`);
      }
    }
    // fire the callback
    const registrySettings = this.#definedCallback(name, behavior, {
      ...this.#definitionOptionDefaults,
      ...options,
    });
    //if new registry options returned, update the settings
    Object.keys(Object(registrySettings)).length &&
      this.#updateSettings(registrySettings);
    // first definition or new attributeFilter returned from the definedCallback
    if (
      this[Symbol.for("actions")].observable &&
      (!this.#observer ||
        Symbol.iterator in Object(registrySettings?.attributeFilter))
    ) {
      this[Symbol.for("actions")].observe();
    }
    // create our new definition
    const definition = this.#updateDefinition(name, {}, behavior, options);
    // find any matching elements in the document and connected shadow roots
    const { selector } = definition,
      connect = (root) => {
        if (this[Symbol.for("actions")].observable) {
          const found = root.querySelectorAll(selector);
          for (const element of found) {
            // check if behavior is filtering or excluding tag names
            if (definition.tagAllowed(element.tagName)) {
              this.#connectBehavior(name, element, definition);
            }
          }
        }
      };
    connect(document);
    CustomBehaviorRegistry[Symbol.for("connectedShadows")].forEach((root) =>
      connect(root),
    );
    //inform anything waiting for this behavior to be defined
    if (this.#promises[name]) {
      //they're ready to go.
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
    // if called without root, check any connected shadows as well
    const checkShadows =
      !root && CustomBehaviorRegistry[Symbol.for("connectedShadows")].size;
    // and default to documentElement as root
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
    for (let l = flatten.length, i = 0; i < l; i++) {
      this.#checkElementBehaviors(flatten[i], definitions);
    }
    if (checkShadows) {
      const connected = CustomBehaviorRegistry[Symbol.for("connectedShadows")];
      const detached = CustomBehaviorRegistry[Symbol.for("detatchedShadows")];
      this.#checkElementBehaviors(root, definitions);
      const flatten = root.querySelectorAll("*");
      for (let l = flatten.length, i = 0; i < l; i++) {
        this.#checkElementBehaviors(flatten[i], definitions);
      }
      for (const [element, shadow] of connected) {
        if (element.isConnected) {
          // elements directly in the dom already checked above
          const flatten = shadow.querySelectorAll("*");
          for (let l = flatten.length, i = 0; i < l; i++) {
            this.#checkElementBehaviors(flatten[i]);
          }
        } else {
          // no longer connected
          clearBehaviors(element);
          const flatten = shadow.querySelectorAll("*");
          for (let l = flatten.length, i = 0; i < l; i++) {
            clearBehaviors(flatten[i]);
          }
          // move it to the disconnected
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
          return definition.connected?.size
            ? new Map(definition.connected.entries())
            : null;
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
    return entries.length > 0
      ? Object.freeze(Object.fromEntries(entries))
      : null;
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
}
//track any elements with attached shadowRoots in the document
CustomBehaviorRegistry[Symbol.for("connectedShadows")] = new Map();
//weakly hold removed elements with shadowRoots
CustomBehaviorRegistry[Symbol.for("detatchedShadows")] = new WeakMap();
//list of methods to observe the shadow roots in each Registry created
CustomBehaviorRegistry[Symbol.for("observers")] = new Map();
// monkey patch Element attachShadow to use the above.
if (!CustomBehaviorRegistry[Symbol.for("attachShadow")]) {
  CustomBehaviorRegistry[Symbol.for("attachShadow")] =
    Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    var shadowRoot = CustomBehaviorRegistry[Symbol.for("attachShadow")].call(
      this,
      init,
    );
    CustomBehaviorRegistry[Symbol.for("connectedShadows")].set(
      this,
      shadowRoot,
    );
    for (const add of CustomBehaviorRegistry[
      Symbol.for("observers")
    ].values()) {
      add(shadowRoot);
    }
    return shadowRoot;
  };
}
window.CustomBehaviorRegistry = CustomBehaviorRegistry;

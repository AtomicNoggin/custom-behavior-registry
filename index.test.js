import {
  describe,
  expect,
  test,
  jest,
  afterAll,
  beforeAll,
} from "@jest/globals";
import CustomBehaviorRegistry from "./index.js";

// quick and dirty Map.getOrInsert polyfill for jest
Map.prototype.getOrInsert =
  Map.prototype.getOrInsert ||
  function getOrInsert(name, value) {
    if (!this.has(name)) {
      this.set(name, value);
    }
    return this.get(name);
  };
const nextTick = (ms) => new Promise((res) => setTimeout(res, 0));

describe("calling new CustomBehaviorRegistry() with no arguments", () => {
  const registry = new CustomBehaviorRegistry();
  const notString = {};
  const notConstructor = notString;
  const notElement = notConstructor;
  const unmatchedName = "crazyfakenamethatshouldnotbematched";
  const unmatchedEl = document.createElement(unmatchedName);
  const emptyName =
    "this is is a realy long name that should never match an element";
  class NotBehavior {
    constructor() {}
  }
  class EmptyBehavior {
    constructor() {}
  }
  beforeAll(() => {
    registry.define(emptyName, EmptyBehavior);
  });
  afterAll(() => {
    CustomBehaviorRegistry.undefineAllBehaviors(registry);
    CustomBehaviorRegistry.disconnect(registry);
    document.body.innerHTML = "";
  });
  test("returns a new CustomBehaviorRegistry instance", () => {
    expect(registry).toBeInstanceOf(CustomBehaviorRegistry);
  });
  describe("calling registry.define", () => {
    const name = "same-name";
    class Behavior {
      constructor() {}
    }
    class SameNameBehavior {
      constructor() {}
    }
    afterAll(() => {
      CustomBehaviorRegistry.undefineBehavior(registry, name);
    });
    test("fails if first argument is missing", () => {
      expect(() => registry.define()).toThrow();
    });
    test("fails if first argument is not a string", () => {
      expect(() => registry.define(34)).toThrow();
    });
    test("fails if second argument is missing", () => {
      expect(() => registry.define("foo")).toThrow();
    });
    test("fails if second argument is not a constructor (function or class)", () => {
      expect(() => registry.define("foo", "foo")).toThrow();
    });
    test("defines the behavior with string in first argument as definition name and constructor in second argument as behavior class", () => {
      registry.define(name, Behavior);
      expect(registry.get(name)).toBe(Behavior);
    });
    test("fails if a previously defined behavior has the same name", () => {
      expect(() => registry.define(name, SameNameBehavior)).toThrow();
    });
    describe("attempts to connect behavior to existing elements in the DOM", () => {
      const constructorMock = jest.fn();
      const connectedMock = jest.fn();
      const className = "prior-element";
      const name = `.${className}`;
      const ops = { prior: "element" };
      const el = document.createElement("div");
      let constructorArgs;
      class Behavior {
        constructor(...args) {
          constructorArgs = args;
          constructorMock(...args);
        }
        connectedCallback(...args) {
          connectedMock(...args);
        }
      }
      const noOpsClassName = `${className}-no-ops`;
      const noOpsName = `.${noOpsClassName}`;
      let noOpsConstructorArgs;
      class NoOpsBehavior {
        constructor(...args) {
          noOpsConstructorArgs = args;
        }
      }

      beforeAll(() => {
        el.classList.add(className);
        el.classList.add(noOpsClassName);
        document.body.append(el);
        registry.define(name, Behavior, ops);
        registry.define(noOpsName, NoOpsBehavior);
      });
      afterAll(() => {
        CustomBehaviorRegistry.undefineBehavior(registry, name);
        CustomBehaviorRegistry.undefineBehavior(registry, noOpsName);
        el.remove();
      });
      test("the definition name from registry.define is used as behavior matching query", () => {
        expect(document.querySelector(name)).toBe(el);
        expect(el).toBe(constructorArgs[0]);
      });
      describe("when a behavior class has a constructor method", () => {
        test("behavior constructor is called with query matching element and the the third argument from registry.define as definition options", () => {
          expect(constructorMock).toHaveBeenCalledWith(el, ops);
        });
        test("definition options default to empty object ({}) when the third argument from registry.define is missing", () => {
          expect(JSON.stringify(noOpsConstructorArgs[1])).toBe("{}");
        });
      });
      describe("when a behavior class hase a connectedCallback method", () => {
        test("behavior connectedCallback is called with matching element as its only argument", () => {
          expect(connectedMock).toHaveBeenCalledWith(el);
        });
      });
      test("multiple behaviors can connect to the same element", () => {
        expect(constructorArgs[0]).toBe(noOpsConstructorArgs[0]);
      });
    });
    describe("listens for changes to the DOM", () => {
      const constructorMock = jest.fn();
      const connectedMock = jest.fn();
      const connectedMoveMock = jest.fn();
      const disconnectedMock = jest.fn();
      const className = "dom-changes";
      const name = `.${className}`;
      const el = document.createElement("div");
      const prevConnectedEl = document.createElement("div");
      const prevUnconnectedEl = document.createElement("div");
      const ops = { isnew: "element" };
      class Behavior {
        constructor(...args) {
          constructorMock(...args);
        }
        connectedCallback(...args) {
          connectedMock(...args);
        }
        disconnectedCallback(...args) {
          disconnectedMock(...args);
        }
      }
      const movableClassName = "dom-move";
      const movableName = `.${movableClassName}`;
      const movableEl = document.createElement("div");
      class MovableBehavior {
        connectedCallback(...args) {
          connectedMock(...args);
        }
        connectedMoveCallback(...args) {
          connectedMoveMock(...args);
        }
        disconnectedCallback(...args) {
          disconnectedMock(...args);
        }
      }
      beforeAll(() => {
        el.classList.add(className);
        prevConnectedEl.classList.add(className);
        movableEl.classList.add(movableClassName);
        registry.define(name, Behavior, ops);
        registry.define(movableName, MovableBehavior);
        document.body.append(prevConnectedEl);
        document.body.append(prevUnconnectedEl);
        document.body.append(movableEl);
      });
      afterAll(() => {
        CustomBehaviorRegistry.undefineBehavior(registry, Behavior);
        CustomBehaviorRegistry.undefineBehavior(registry, MovableBehavior);
        el.remove();
        movableEl.remove();
      });
      describe("new elements that are inserted into the DOM", () => {
        beforeAll(() => {
          document.body.append(el);
        }, 1);
        test("get connected to query matching behaviors", () => {
          expect(registry.get(name, el)).toBeInstanceOf(Behavior);
        });
        test("calling any behavior constructor methods that exist", () => {
          expect(constructorMock).toHaveBeenCalledWith(el, ops);
        });
        test("calling any behavior connectedCallback methods that exist", () => {
          expect(connectedMock).toHaveBeenCalledWith(el);
        });
      });
      describe("connected elements that are removed from the DOM", () => {
        beforeAll(() => {
          el.remove();
        });
        test("get disconnected from the behavior", () => {
          expect(registry.get(name, el)).toBe(null);
        });
        describe("when a behavior has a disconnectedCallback method", () => {
          test("call the disconnectedCallback method with the disconnected element as its only argument", () => {
            expect(disconnectedMock).toHaveBeenCalledWith(el);
          });
        });
      });
      describe("previously connected elements that are eventually re-inserted into the DOM", () => {
        beforeAll(() => {
          constructorMock.mockClear();
          connectedMock.mockClear();
          document.body.append(el);
        });
        test("get re-connected to the behavior", () => {
          expect(registry.get(name, el)).toBeInstanceOf(Behavior);
        });
        test("call the behavior connectedCallback method if it exists", () => {
          expect(connectedMock).toHaveBeenCalledTimes(1);
        });
        test("do not call an existing behavior constructor method", () => {
          expect(constructorMock).toHaveBeenCalledTimes(0);
        });
      });
      describe("connected elements that are moved to another part of the DOM with a single call (e.g with body.append(element))", () => {
        describe("when the behavior has a connectedMoveCallback method", () => {
          beforeAll(() => {
            connectedMock.mockClear();
            disconnectedMock.mockClear();
            document.body.append(movableEl);
          });
          test("call the behavior connectedMoveCallback method with the connected element as the only argument", () => {
            expect(connectedMoveMock).toHaveBeenCalledWith(movableEl);
          });
          test("do not call an existing disconnectedCallback method", () => {
            expect(disconnectedMock).toHaveBeenCalledTimes(0);
          });
          test("do not call an existing connectedCallback method", () => {
            expect(connectedMock).toHaveBeenCalledTimes(0);
          });
        });
        describe("when the behavior does NOT have a connectedMoveCallback method", () => {
          beforeAll(() => {
            connectedMock.mockClear();
            disconnectedMock.mockClear();
            document.body.append(el);
          });
          test("call the behavior disconnectedCallback method if it exists", () => {
            expect(disconnectedMock).toHaveBeenCalledTimes(1);
          });
          test("call the behavior connectedCallback method if it exists", () => {
            expect(connectedMock).toHaveBeenCalledTimes(1);
          });
        });
      });
      describe("when attributes are changed on elements in the DOM", () => {
        test("do NOT automatically disconnect elements whose attribute change causes them to no longer match a behavior query", async () => {
          prevConnectedEl.classList.remove(className);
          await nextTick();
          expect(registry.get(name, prevConnectedEl)).toBeInstanceOf(Behavior);
        });
      });
      describe("parent elements with query matching children", () => {
        const parent = document.createElement("div");
        const child = document.createElement("span");
        beforeAll(() => {
          parent.append(child);
          child.classList.add(movableClassName);
          connectedMock.mockClear();
          connectedMoveMock.mockClear();
          disconnectedMock.mockClear();
        });
        test("connect the child to query matching behaviors when the parent is added to the DOM", async () => {
          document.body.append(parent);
          await nextTick();
          expect(connectedMock).toHaveBeenCalledWith(child);
          expect(registry.get(movableName, child)).toBeInstanceOf(
            MovableBehavior,
          );
        });
        test("call any existing connectedMoveCallback methods for behaviors connected to the child when the parent is moved with a single call", async () => {
          document.body.prepend(parent);
          await nextTick();
          expect(connectedMoveMock).toHaveBeenCalledWith(child);
        });
        test("disconnect the child from behaviors when the parent is removed from the DOM", async () => {
          parent.remove();
          await nextTick();
          expect(disconnectedMock).toHaveBeenCalledWith(child);
          expect(registry.get(movableName, child)).toBe(null);
        });
      });
      describe("when a behavior has a populated static observedAttributes array and an attributeChangedCallback method", () => {
        const attributeChangeMock = jest.fn();
        const checkAttr = "check-update";
        const unlistedAttr = "not-listed";
        const partialPattern = "pattern-*";
        const partialAttr = "pattern-match";
        const newAttr = "newly-added";
        const initValue = "initial";
        const changeValue = "changed";
        const unmatchValue = "unmatched";
        const className = "attribute-change";
        const name = `.${className}:not([${unlistedAttr}="${unmatchValue}"])`;
        const el = document.createElement("div");
        class Behavior {
          static observedAttributes = [partialPattern, checkAttr];
          attributeChangedCallback(...args) {
            attributeChangeMock(...args);
          }
        }
        beforeAll(() => {
          el.className = className;
          el.setAttribute(checkAttr, initValue);
          registry.define(name, Behavior);
        });
        afterAll(() => {
          el.remove();
          CustomBehaviorRegistry.undefineBehavior(registry, Behavior);
        });
        describe("adding a query matching element with an an attribute listed in observedAttributes already set", () => {
          beforeAll(() => {
            document.body.append(el);
          });
          test("does NOT call the attributeChangedCallback method", () => {
            expect(attributeChangeMock).toHaveBeenCalledTimes(0);
          });
        });
        describe("changing the value of an attribute listed in observedAttributes for a connected element", () => {
          beforeAll(() => {
            el.setAttribute(checkAttr, changeValue);
          });
          test("calls the attributeChangedCallback method with the element, attributeName, oldValue and newValue as arguments", () => {
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              checkAttr,
              initValue,
              changeValue,
            );
          });
        });
        describe("removing an attribute listed in observedAttributes from a connected element", () => {
          beforeAll(() => {
            attributeChangeMock.mockClear();
            el.removeAttribute(checkAttr);
          });
          test("calls the attributeChangedCallback method with the null as the newValue in the argument list", () => {
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              checkAttr,
              changeValue,
              null,
            );
          });
        });
        describe("adding an attribute listed in observedAttributes to a connected element", () => {
          beforeAll(() => {
            attributeChangeMock.mockClear();
            el.setAttribute(checkAttr, initValue);
          });
          test("calls the attributeChangedCallback method with the null as the oldValue in the argument list", () => {
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              checkAttr,
              null,
              initValue,
            );
          });
        });
        describe("changes to a listed attribute that causes a connected element to no longer match the behavior query", () => {
          beforeAll(() => {
            attributeChangeMock.mockClear();
            el.setAttribute(checkAttr, unmatchValue);
          });
          test("calls the attributeChangedCallback with appropriate values", () => {
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              checkAttr,
              initValue,
              unmatchValue,
            );
          });
          test("does NOT disconnect the element from the behavior", () => {
            expect(registry.get(name, el)).toBeInstanceOf(Behavior);
          });
        });
        describe("when the observervedAttributes list contains a attribute prefix wildcard pattern (e.g. prefix-*)", () => {
          test("adding an attribute matching the pattern (e.g. prefix-match) to a connected element calls the attributeChangedCallback method with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.setAttribute(partialAttr, initValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              partialAttr,
              null,
              initValue,
            );
          });
          test("changing the value of an attribute matching the pattern for a connected element calls the attributeChangedCallback method with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.setAttribute(partialAttr, changeValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              partialAttr,
              initValue,
              changeValue,
            );
          });
          test("removing an attribute matching the pattern from a connected element calls the attributeChangedCallback method with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.removeAttribute(partialAttr);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              partialAttr,
              changeValue,
              null,
            );
          });
        });
        describe("when changes occur to an unlisted attribute for a connected element", () => {
          beforeAll(() => {
            attributeChangeMock.mockClear();
          });
          test("adding an unlisted attribute does NOT call the attributeChangedCallback", async () => {
            el.setAttribute(unlistedAttr, initValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledTimes(0);
          });
          test("changing the value of an unlisted attribute does NOT call the attributeChangedCallback", async () => {
            el.setAttribute(unlistedAttr, changeValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledTimes(0);
          });
          test("removing an unlisted attribute does NOT call the attributeChangedCallback", async () => {
            el.removeAttribute(unlistedAttr);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledTimes(0);
          });
        });
        describe("adding a new attribute to the observervedAttributes list after behavior definition", () => {
          beforeAll(() => {
            Behavior.observedAttributes.push(newAttr);
          });
          test("adding the newly listed attribute to a connected element calls the attributeChangedCallback with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.setAttribute(newAttr, initValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              newAttr,
              null,
              initValue,
            );
          });
          test("changing the value of the newly listed attribute for a connected element  calls the attributeChangedCallback with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.setAttribute(newAttr, changeValue);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              newAttr,
              initValue,
              changeValue,
            );
          });
          test("removing the newly listed attribute from a connected element calls the attributeChangedCallback with appropriate values", async () => {
            attributeChangeMock.mockClear();
            el.removeAttribute(newAttr);
            await nextTick();
            expect(attributeChangeMock).toHaveBeenCalledWith(
              el,
              newAttr,
              changeValue,
              null,
            );
          });
        });
      });
      describe("when a behavior has a populated static tagFilter list", () => {
        const connectedMoveMock = jest.fn();
        const className = "tag-filter";
        const name = `.${className}`;
        const filteredTag = "h1";
        const unfilteredTag = "h2";
        const newFilteredTag = "h3";
        const matchingEl = document.createElement(filteredTag);
        const nonmatchingEl = document.createElement(unfilteredTag);
        const preListChangeEl = document.createElement(newFilteredTag);
        const postListChangeEl = document.createElement(newFilteredTag);
        class Behavior {
          static tagFilter = [filteredTag];
          connectedMoveCallback() {
            connectedMoveMock();
          }
        }
        beforeAll(() => {
          for (const element of [
            matchingEl,
            nonmatchingEl,
            preListChangeEl,
            postListChangeEl,
          ]) {
            element.classList.add(className);
          }
          //ensure the toString evals differ
          preListChangeEl.classList.add("pre-change");
          postListChangeEl.classList.add("post-change");
          registry.define(name, Behavior);
        });
        afterAll(() => {
          CustomBehaviorRegistry.undefineBehavior(registry, name);
          matchingEl.remove();
          nonmatchingEl.remove();
          preListChangeEl.remove();
          postListChangeEl.remove();
        });
        describe("adding an otherwise query matching element to the DOM", () => {
          beforeAll(() => {
            document.body.append(matchingEl);
            document.body.append(nonmatchingEl);
          });
          afterAll(() => {
            matchingEl.remove();
            nonmatchingEl.remove();
          });
          test("is connected to the behavior when its tagName matches a listed tag", async () => {
            expect(registry.get(name, matchingEl)).toBeInstanceOf(Behavior);
          });
          test("is NOT connected to the behavior when its tagName does not match a listed tag", async () => {
            expect(registry.get(name, nonmatchingEl)).toBe(null);
          });
        });
        describe("when a new tagName is added to the tagFilter after defintintion", () => {
          beforeAll(async () => {
            document.body.append(preListChangeEl);
            await nextTick();
            Behavior.tagFilter.push(newFilteredTag);
          });
          describe("an otherwise query matching element with the new tagName", () => {
            test("does NOT automatically connect to the behavior if it was already in the DOM prior to tagName insertion", () => {
              expect(registry.get(name, preListChangeEl)).toBe(null);
            });
            test("connects to the behavior when it's added to the DOM after tagName insertion", async () => {
              document.body.append(postListChangeEl);
              await nextTick();
              expect(registry.get(name, postListChangeEl)).toBeInstanceOf(
                Behavior,
              );
            });
            test("connects to the behavior without calling any existing connectedMoveCallback method when its moved after tagName insertion", async () => {
              connectedMoveMock.mockClear();
              document.body.prepend(preListChangeEl);
              await nextTick();
              expect(registry.get(name, preListChangeEl)).toBeInstanceOf(
                Behavior,
              );
              expect(connectedMoveMock).toHaveBeenCalledTimes(0);
            });
          });
        });
        describe("when a tagName is removed from the tagFilter after defintintion", () => {
          beforeAll(async () => {
            Behavior.tagFilter.pop();
          });
          describe("a connected element with the removed tagName", () => {
            test("does NOT automatically disconnect after the tagName removal", () => {
              expect(registry.get(name, preListChangeEl)).toBeInstanceOf(
                Behavior,
              );
            });
            test("disconnects from the behavior when it's removed from the DOM after the tagName removal", async () => {
              postListChangeEl.remove();
              await nextTick();
              expect(registry.get(name, postListChangeEl)).toBe(null);
            });
            test("disconnects from the behavior without calling any existing connectedMoveCallback method when its moved after tagName removal", async () => {
              connectedMoveMock.mockClear();
              document.body.append(preListChangeEl);
              await nextTick();
              expect(registry.get(name, preListChangeEl)).toBe(null);
              expect(connectedMoveMock).toHaveBeenCalledTimes(0);
            });
          });
        });
      });
      describe("when a behavior has a populated static tagExcludes list", () => {
        const connectedMoveMock = jest.fn();
        const className = "tag-excludes";
        const name = `.${className}`;
        const excludedTag = "h1";
        const unexcludedTag = "h2";
        const newExludedTag = "h3";
        const matchingEl = document.createElement(excludedTag);
        const nonmatchingEl = document.createElement(unexcludedTag);
        const preListChangeEl = document.createElement(newExludedTag);
        const postListChangeEl = document.createElement(newExludedTag);
        class Behavior {
          static tagExcludes = [excludedTag];
          connectedMoveCallback() {
            connectedMoveMock();
          }
        }
        beforeAll(() => {
          for (const element of [
            matchingEl,
            nonmatchingEl,
            preListChangeEl,
            postListChangeEl,
          ]) {
            element.classList.add(className);
          }
          //ensure the toString evals differ
          preListChangeEl.classList.add("pre-change");
          postListChangeEl.classList.add("post-post");
          registry.define(name, Behavior);
        });
        afterAll(() => {
          CustomBehaviorRegistry.undefineBehavior(registry, name);
          matchingEl.remove();
          nonmatchingEl.remove();
          preListChangeEl.remove();
          postListChangeEl.remove();
        });
        describe("adding an otherwise query matching element to the DOM", () => {
          beforeAll(() => {
            document.body.append(matchingEl);
            document.body.append(nonmatchingEl);
          });
          afterAll(() => {
            matchingEl.remove();
            nonmatchingEl.remove();
          });
          test("is NOT connected to the behavior when its tagName matches a listed tag", async () => {
            expect(registry.get(name, matchingEl)).toBe(null);
          });
          test("is connected to the behavior when its tagName does not match a listed tag", async () => {
            expect(registry.get(name, nonmatchingEl)).toBeInstanceOf(Behavior);
          });
        });
        describe("when a new tagName is added to the tagExcludes after defintintion", () => {
          beforeAll(async () => {
            document.body.append(preListChangeEl);
            document.body.append(postListChangeEl);
            await nextTick();
            Behavior.tagExcludes.push(newExludedTag);
          });
          describe("a connected element with the new tagName", () => {
            test("does NOT automatically disconnect to the behavior if it was already in the DOM prior to tagName insertion", () => {
              expect(registry.get(name, preListChangeEl)).toBeInstanceOf(
                Behavior,
              );
            });
            test("disconnects from the behavior when it's removed from the DOM after tagName insertion", async () => {
              postListChangeEl.remove();
              await nextTick();
              expect(registry.get(name, postListChangeEl)).toBe(null);
            });
            test("disconnects from the behavior without calling any existing connectedMoveCallback method when its moved after tagName insertion", async () => {
              connectedMoveMock.mockClear();
              document.body.prepend(preListChangeEl);
              await nextTick();
              expect(registry.get(name, preListChangeEl)).toBe(null);
              expect(connectedMoveMock).toHaveBeenCalledTimes(0);
            });
          });
        });
        describe("when a tagName is removed from the tagExcludes after defintintion", () => {
          beforeAll(async () => {
            Behavior.tagExcludes.pop();
          });
          describe("an otherwise query matching element with the removed tagName", () => {
            test("does NOT automatically connect to the behavior after the tagName removal", () => {
              expect(registry.get(name, preListChangeEl)).toBe(null);
            });
            test("connects to the behavior without calling any existing connectedMoveCallback method when its moved after tagName removal", async () => {
              connectedMoveMock.mockClear();
              document.body.append(preListChangeEl);
              await nextTick();
              expect(registry.get(name, preListChangeEl)).toBeInstanceOf(
                Behavior,
              );
              expect(connectedMoveMock).toHaveBeenCalledTimes(0);
            });
          });
        });
      });
      describe("when a behavior has a static preConnectionCheck method", () => {
        let preConnectionMock = jest.fn(() => true);
        let constructorArgs;
        const className = "pre-connection";
        const defintionOptions = { foo: "bar", bar: "baz" };
        const name = `.${className}`;
        const el = document.createElement("div");
        const newOptionEl = document.createElement("div");
        class Behavior {
          static preConnectionCheck(...args) {
            return preConnectionMock(...args);
          }
          constructor(...args) {
            constructorArgs = args;
          }
        }
        beforeAll(() => {
          registry.define(name, Behavior, defintionOptions);
          el.classList.add(className);
          newOptionEl.classList.add(className);
        });
        describe("adding a query matching element to the dom", () => {
          beforeAll(async () => {
            document.body.append(el);
          });
          test("calls preConnectionCheck with element and definition options as arguments", () => {
            expect(preConnectionMock).toHaveBeenCalledWith(
              el,
              defintionOptions,
            );
          });
          describe("when preConnectionCheck returns true", () => {
            test("connects the element to the behavior", () => {
              expect(registry.get(name, el)).toBeInstanceOf(Behavior);
            });
          });
          describe("when preConnectionCheck returns false", () => {
            beforeAll(async () => {
              el.remove();
              await nextTick();
              preConnectionMock = jest.fn(() => false);
              document.body.append(el);
            });
            test("does NOT connect the element to the behavior", () => {
              expect(registry.get(name, el)).toBe(null);
            });
          });
          describe("when preConnectionCheck returns a new options object", () => {
            const newOptions = { bar: "new", baz: "foo" };
            beforeAll(async () => {
              constructorArgs = [];
              preConnectionMock = jest.fn(() => newOptions);
              document.body.append(newOptionEl);
            });
            test("connects the element to the behavior", () => {
              expect(registry.get(name, newOptionEl)).toBeInstanceOf(Behavior);
            });
            describe("passes a consolodation of the definition options and the new options to the constuctor method", () => {
              let currentOptions;
              beforeAll(() => {
                currentOptions = constructorArgs[1];
              });
              test("keeping definition option properties not found in the new options object", () => {
                expect(newOptions.foo).toBe(undefined);
                expect(defintionOptions.foo).not.toBe(undefined);
                expect(currentOptions.foo).toBe(defintionOptions.foo);
              });
              test("overriding definition option properties also found in the new options object", () => {
                expect(defintionOptions.bar).not.toBe(undefined);
                expect(newOptions.bar).not.toBe(undefined);
                expect(newOptions.bar).not.toBe(defintionOptions.bar);
                expect(currentOptions.bar).toBe(newOptions.bar);
              });
              test("including new option properties not found in the definition options object", () => {
                expect(defintionOptions.baz).toBe(undefined);
                expect(newOptions.baz).not.toBe(undefined);
                expect(currentOptions.baz).toBe(newOptions.baz);
              });
              test("replaces the the definition options with the consolodated ones on subsiquent element connections", async () => {
                el.remove();
                await nextTick();
                document.body.append(el);
                await nextTick();
                expect(preConnectionMock).toHaveBeenCalledWith(
                  el,
                  currentOptions,
                );
              });
            });
          });
        });
      });
    });
  });
  describe("calling registry.update", () => {
    const className = "update-behavior";
    const name = `.${className}`;
    const registry = new CustomBehaviorRegistry();
    const el = document.createElement("div");
    const child = document.createElement("span");
    class Behavior {
      constructor(element) {
        this.element = element;
      }
    }
    beforeAll(() => {
      el.classList.add(className);
      child.classList.add(className);
      document.body.append(el);
      registry.define(name, Behavior);
    });
    afterAll(() => {
      CustomBehaviorRegistry.undefineBehavior(registry, name);
      el.remove();
      child.remove();
    });
    test("reconnects a matching element when a root is updated", () => {
      el.classList.remove(className);
      registry.update(document.body);
      expect(registry.get(name, el)).toBe(null);

      el.classList.add(className);
      registry.update(document.body);
      expect(registry.get(name, el)).toBeInstanceOf(Behavior);
    });
    test("checks child elements beneath the root passed to update", () => {
      const parent = document.createElement("div");
      parent.append(child);
      document.body.append(parent);

      registry.update(parent);
      expect(registry.get(name, child)).toBeInstanceOf(Behavior);

      child.classList.remove(className);
      registry.update(parent);
      expect(registry.get(name, child)).toBe(null);

      parent.remove();
    });
  });
  describe("calling registry.whenDefined", () => {
    const notYetDefinedName = "not-yet-defined";
    class NotYetDefinedBehavior {
      constructor() {}
    }
    const alreadyDefinedName = "already-defined";
    class AlreadyDefinedBehavior {
      constructor() {}
    }
    beforeAll(() => {
      registry.define(alreadyDefinedName, AlreadyDefinedBehavior);
    });
    test("fails if first argument is missing", () => {
      expect(() => registry.whenDefined()).toThrow();
    });
    test("fails if first argument is not a string", () => {
      expect(() => registry.whenDefined(notString)).toThrow();
    });
    test("returns a promise that resolves after a behaviour is defined whose name matches the first argument", async () => {
      const promise = registry.whenDefined(notYetDefinedName);
      await nextTick();
      registry.define(notYetDefinedName, NotYetDefinedBehavior);
      expect(await promise).toBe(NotYetDefinedBehavior);
    });
    test("returns a resolved promise when the first argument matches the name of perviously defined behavior", async () => {
      const result = await registry.whenDefined(alreadyDefinedName);
      expect(result).toBe(AlreadyDefinedBehavior);
    });
  });
  describe("calling registry.get", () => {
    const className = "get-behavior";
    const name = `.${className}`;
    const el = document.createElement("div");
    el.className = className;
    document.body.append(el);
    class Behavior {
      constructor(element) {
        // so we can trace the instance back to the connected elments
        this.element = element;
      }
    }
    registry.define(name, Behavior);
    test("returns null when the first argument is missing", () => {
      expect(registry.get()).toBe(null);
    });
    test("returns null when the first argument is not a string", () => {
      expect(registry.get(notString)).toBe(null);
    });
    test("returns null when the first argument does not match the name of a defined behavior", () => {
      expect(registry.get(unmatchedName)).toBe(null);
    });
    test("returns the behaviour class whose name matches the first argument when the second argument is missing", () => {
      expect(registry.get(name)).toBe(Behavior);
    });
    test("returns null when the second argument is not an element", () => {
      expect(registry.get(name, notElement)).toBe(null);
    });
    test("returns null when the second argument is an element that is not connected to the behavior class named in the first agument", () => {
      expect(registry.get(name, unmatchedEl)).toBe(null);
    });
    test("returns the behavior instance connected to the element in the second argument of the the behavior class named in the first agument", () => {
      const instance = registry.get(name, el);
      expect(instance.element).toBe(el);
      expect(instance instanceof Behavior).toBe(true);
    });
  });
  describe("calling registry.getName", () => {
    const name = "get-name";
    class Behavior {
      constructor() {}
    }
    registry.define(name, Behavior);
    test("returns null if the first argument is missing", () => {
      expect(registry.getName()).toBe(null);
    });
    test("returns null if the first argument is not a constructor", () => {
      expect(registry.getName(notConstructor)).toBe(null);
    });
    test("returns null if the first argument is not a defined behavior", () => {
      expect(registry.getName()).toBe(null);
    });
    test("returns then name of the defined behavior in the fist argument", () => {
      expect(registry.getName(Behavior)).toBe(name);
    });
  });
  describe("calling registry.getElements", () => {
    const className = "get-elements";
    const name = `.${className}`;
    const el = document.createElement("div");
    class Behavior {
      constructor() {}
    }
    el.className = className;
    document.body.appendChild(el);
    registry.define(name, Behavior);
    test("returns null when the first argument is missing", () => {
      expect(registry.getElements()).toBe(null);
    });
    test("returns null when the first argument is neither a string nor a constructor", () => {
      expect(registry.getElements(notString)).toBe(null);
    });
    test("returns null when the first argument is a string that does not match a behavior name", () => {
      expect(registry.getElements(unmatchedName)).toBe(null);
    });
    test("returns null when the behavior whose name matches the provided string has no connected elements", () => {
      expect(registry.get(emptyName)).toBe(EmptyBehavior);
      expect(registry.getElements(emptyName)).toBe(null);
    });
    test("returns a Map of element:instance pairs of each element connected to the behavior whose name matches the provided string", () => {
      const result = registry.getElements(name);
      expect(result instanceof Map).toBe(true);
      expect(Array.from(result.keys())).toStrictEqual([el]);
      expect(result.get(el) instanceof Behavior).toBe(true);
    });
    test("returns null when the first argument is a constructor that is not a defined behavior", () => {
      expect(registry.getElements(NotBehavior)).toBe(null);
    });
    test("returns null when the first argument is a defined behavior class that has no connected elements", () => {
      expect(registry.getElements(EmptyBehavior)).toBe(null);
    });
    test("returns a Map of element:instance pairs of each element connected to the behavior provided", () => {
      const result = registry.getElements(Behavior);
      expect(result instanceof Map).toBe(true);
      expect(Array.from(result.keys())).toStrictEqual([el]);
      expect(result.get(el) instanceof Behavior).toBe(true);
    });
  });
  describe("calling registry.getElementBehaviors", () => {
    const className = "get-element-behaviors";
    const name = `.${className}`;
    const el = document.createElement("div");
    class Behavior {
      constructor() {}
    }
    el.className = className;
    document.body.appendChild(el);
    registry.define(name, Behavior);
    test("returns null is first argument is missing", () => {
      expect(registry.getElementBehaviors()).toBe(null);
    });
    test("returns null when the first argument is not an element", () => {
      expect(registry.getElementBehaviors(notElement)).toBe(null);
    });
    test("returns null when the first argument is an element that does not have connected behaviors", () => {
      expect(registry.getElementBehaviors(document.createElement("div"))).toBe(
        null,
      );
    });
    test("returns a frozen object of name: instance pairs for each behavior connected to the provided element", () => {
      const result = registry.getElementBehaviors(el);
      expect(Object.keys(result)).toStrictEqual([name]);
      expect(registry.get(name, el)).toBe(result[name]);
      expect(() => delete result[name]).toThrow();
    });
  });
});
describe("Creating a registry with a queryPrefix string in its settings", () => {
  test("attaches to DOM elements that match the prefixed selector", () => {
    document.body.innerHTML = "";
    const name = "target";
    const registry = new CustomBehaviorRegistry({
      queryPrefix: ".",
    });
    const matching = document.createElement("div");
    matching.className = name;
    const nonMatching = document.createElement("div");
    nonMatching.className = "other";
    document.body.append(matching, nonMatching);

    const attached = [];
    class behavior {
      constructor(element) {
        attached.push(element);
      }
    }

    registry.define(name, behavior);

    expect(attached).toHaveLength(1);
    expect(attached[0]).toBe(matching);
    expect(registry.get(name, matching) instanceof behavior).toBe(true);
    expect(registry.get(name, nonMatching)).toBe(null);
  });
});

describe("Creating a registry with a querySuffix string in its settings", () => {
  test("attaches to DOM elements that match the suffixed selector", () => {
    document.body.innerHTML = "";
    const name = ".target";
    const registry = new CustomBehaviorRegistry({
      querySuffix: ".test",
    });
    const matching = document.createElement("div");
    matching.className = "target test";
    const nonMatching = document.createElement("div");
    nonMatching.className = "target";
    document.body.append(matching, nonMatching);

    const attached = [];
    class behavior {
      constructor(element) {
        attached.push(element);
      }
    }

    registry.define(name, behavior);

    expect(attached).toHaveLength(1);
    expect(attached[0]).toBe(matching);
    expect(registry.get(name, matching) instanceof behavior).toBe(true);
    expect(registry.get(name, nonMatching)).toBe(null);
  });
});
describe("Creating a registry with a queryGenerator method in its settings", () => {
  test("calls queryGenerator with name, behavior and options arguments when registry.define called", () => {
    document.body.innerHTML = "";
    const mock = jest.fn();
    const name = "query-generator-args";
    const selector = ".query-generator-args";
    const ops = { foo: "bar" };
    const el = document.createElement("div");
    el.className = "query-generator-args";
    document.body.append(el);

    const attached = [];
    class behavior {
      constructor(element) {
        attached.push(element);
      }
    }

    const registry = new CustomBehaviorRegistry({
      queryGenerator: (...args) => {
        mock(...args);
        return selector;
      },
    });

    registry.define(name, behavior, ops);

    expect(mock).toHaveBeenCalledWith(name, behavior, ops);
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBe(el);
    expect(registry.get(name, el) instanceof behavior).toBe(true);
  });

  test("ignores querySuffix and queryPrefix if they are included", () => {
    document.body.innerHTML = "";
    const mock = jest.fn();
    const name = "query-generator-ignore-parts";
    const selector = ".query-generator-ignore-parts";
    const ops = { foo: "bar" };
    const el = document.createElement("div");
    el.className = "query-generator-ignore-parts";
    document.body.append(el);

    const attached = [];
    class behavior {
      constructor(element) {
        attached.push(element);
      }
    }

    const registry = new CustomBehaviorRegistry({
      queryPrefix: "[",
      querySuffix: "]",
      queryGenerator: (...args) => {
        mock(...args);
        return selector;
      },
    });

    registry.define(name, behavior, ops);

    expect(mock).toHaveBeenCalledWith(name, behavior, ops);
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBe(el);
    expect(registry.get(name, el) instanceof behavior).toBe(true);
  });

  test("leaves the definition name intact for other look ups", () => {
    document.body.innerHTML = "";
    const name = "query-generator-name";
    const selector = ".query-generator-name";
    const registry = new CustomBehaviorRegistry({
      queryGenerator: () => selector,
    });
    const el = document.createElement("div");
    el.className = "query-generator-name";
    document.body.append(el);

    const attached = [];
    class behavior {
      constructor(element) {
        attached.push(element);
      }
    }

    registry.define(name, behavior);

    expect(registry.get(name)).toBe(behavior);
    expect(registry.getName(behavior)).toBe(name);
    expect(attached).toHaveLength(1);
    expect(attached[0]).toBe(el);
    expect(registry.get(name, el) instanceof behavior).toBe(true);
  });
});

describe("Creating a registry with a nameValidator method in its settings", () => {
  let registry;
  let validator;
  let el;

  beforeAll(() => {
    document.body.innerHTML = "";
    validator = jest.fn((name) => {
      if (name === "invalid") {
        return false;
      }
      return name.startsWith(".") ? true : `.${name}`;
    });
    registry = new CustomBehaviorRegistry({ nameValidator: validator });
    el = document.createElement("div");
    el.className = "validated-name";
    document.body.append(el);
  });
  afterAll(() => {
    CustomBehaviorRegistry.undefineAllBehaviors(registry);
    CustomBehaviorRegistry.disconnect(registry);
    document.body.innerHTML = "";
  });

  test("rejects definition names the validator marks as invalid", () => {
    class Behavior {}

    expect(() => registry.define("invalid", Behavior)).toThrow(
      '"invalid" is not a valid elementBehavior name',
    );
    expect(validator).toHaveBeenCalledWith("invalid");
  });

  test("uses a string returned by the validator as the definition name", () => {
    class Behavior {}

    registry.define("validated-name", Behavior);

    expect(validator).toHaveBeenCalledWith("validated-name");
    expect(registry.get("validated-name")).toBe(Behavior);
    expect(registry.get(".validated-name")).toBe(Behavior);
    expect(registry.get("validated-name", el)).toBeInstanceOf(Behavior);
    expect(registry.getName(Behavior)).toBe(".validated-name");
  });
});

describe("Creating a registry with an attributeFilter string array in it's settings", () => {
  test("calls behavior constructor if adding an attribute in the filter list to an element in the dom causes a query match", () => {
    document.body.innerHTML = "";
    const attr = "my-attr";
    const name = `[${attr}]`;
    const registry = new CustomBehaviorRegistry({ attributeFilter: [attr] });
    const el = document.createElement("div");
    document.body.append(el);
    class behavior {
      constructor(element) {
        expect(element).toBe(el);
      }
    }
    registry.define(name, behavior);
    el.setAttribute(attr, "");
  });
  test("calls disconnectedCallback if adding an attribute in the filter list to an element in the dom causes a element to stop matching", () => {
    document.body.innerHTML = "";
    const mock = jest.fn();
    const attr = "not-my-attr";
    const name = `.test:not([${attr}])`;
    const registry = new CustomBehaviorRegistry({ attributeFilter: [attr] });
    const el = document.createElement("div");
    el.className = "test";
    document.body.append(el);
    class behavior {
      constructor() {}
      disconnectedCallback() {
        mock();
        expect(mock).toHaveBeenCalled();
      }
    }
    registry.define(name, behavior);
    el.setAttribute(attr, "");
  });
});

describe("Creating a registry with an attributeChangedCallback validator in its settings", () => {
  let registry;
  let el;
  let validator;
  beforeAll(() => {
    document.body.innerHTML = "";
    el = document.createElement("div");
    el.className = "watch";
    document.body.append(el);
    validator = jest.fn((element, attributeName) => {
      expect(element).toBe(el);
      expect(attributeName).toBe("data-check");
      return true;
    });
    registry = new CustomBehaviorRegistry({
      attributeFilter: ["data-check"],
      attributeChangedCallback: validator,
    });
    class Behavior {
      static observedAttributes = ["data-check"];
      constructor() {}
      attributeChangedCallback() {}
    }
    registry.define(".watch", Behavior);
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("allows custom validation to cancel or allow attribute-triggered behavior checks", async () => {
    el.setAttribute("data-check", "first");
    await Promise.resolve();
    expect(validator).toHaveBeenCalledWith(el, "data-check", null, "first");
    expect(registry.get(".watch", el)).toBeTruthy();
  });
});

describe("Creating a registry with a definedCallback method in its settings", () => {
  let registry;
  let callback;
  let el;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn((name, behavior, options) => ({
      queryPrefix: ".",
      querySuffix: ".override",
    }));
    registry = new CustomBehaviorRegistry({ definedCallback: callback });
    el = document.createElement("div");
    el.className = "test-behavior override";
    document.body.append(el);
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called at definition time and can override registry settings", () => {
    class Behavior {
      constructor() {}
    }
    registry.define("test-behavior", Behavior, { foo: "bar" });
    expect(callback).toHaveBeenCalledWith("test-behavior", Behavior, {
      foo: "bar",
    });
    expect(registry.get("test-behavior", el) instanceof Behavior).toBe(true);
  });
});

describe("Creating a registry with a definitionConstructorCallback method in its settings", () => {
  let registry;
  let el;
  let callback;
  let captured;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn((name, element, behavior, options) => ({
      ...options,
      foo: "new-value",
      extra: true,
    }));
    registry = new CustomBehaviorRegistry({
      definitionConstructorCallback: callback,
    });
    el = document.createElement("div");
    el.className = "constructor-callback";
    document.body.append(el);
    class Behavior {
      constructor(element, options) {
        captured = { element, options };
      }
    }
    registry.define(".constructor-callback", Behavior, { foo: "original" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called before construction and can merge new option values", () => {
    expect(callback).toHaveBeenCalledWith(
      ".constructor-callback",
      el,
      expect.any(Function),
      { foo: "original" },
    );
    expect(captured.options.foo).toBe("new-value");
    expect(captured.options.extra).toBe(true);
  });
});

describe("Creating a registry with a definitionConnectedCallback method in its settings", () => {
  let registry;
  let el;
  let callback;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn();
    registry = new CustomBehaviorRegistry({
      definitionConnectedCallback: callback,
    });
    el = document.createElement("div");
    el.className = "connected-callback";
    document.body.append(el);
    class Behavior {
      connectedCallback() {}
    }
    registry.define(".connected-callback", Behavior, { foo: "bar" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called before behavior connectedCallback for new connections", () => {
    expect(callback).toHaveBeenCalledWith(".connected-callback", el, {
      foo: "bar",
    });
  });
});

describe("Creating a registry with a definitionConnectedMoveCallback method in its settings", () => {
  let registry;
  let parent;
  let el;
  let callback;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn();
    registry = new CustomBehaviorRegistry({
      definitionConnectedMoveCallback: callback,
    });
    parent = document.createElement("div");
    el = document.createElement("div");
    el.className = "move-callback";
    parent.append(el);
    document.body.append(parent);
    class Behavior {
      connectedMoveCallback() {}
    }
    registry.define(".move-callback", Behavior, { foo: "bar" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called before behavior connectedMoveCallback", async () => {
    callback.mockClear();
    parent.prepend(el);
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(".move-callback", el, { foo: "bar" });
  });
});

describe("Creating a registry with a definitionAttributeChangedCallback method in its settings", () => {
  let registry;
  let el;
  let callback;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn();
    registry = new CustomBehaviorRegistry({
      attributeFilter: ["data-check"],
      definitionAttributeChangedCallback: callback,
    });
    el = document.createElement("div");
    el.className = "attribute-callback";
    document.body.append(el);
    class Behavior {
      static observedAttributes = ["data-check"];
      attributeChangedCallback() {}
    }
    registry.define(".attribute-callback", Behavior, { foo: "bar" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called before behavior attributeChangedCallback for tracked attributes", async () => {
    callback.mockClear();
    el.setAttribute("data-check", "one");
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(
      ".attribute-callback",
      el,
      "data-check",
      null,
      "one",
      { foo: "bar" },
    );
  });
});

describe("Creating a registry with a definitionDisconnectedCallback method in its settings", () => {
  let registry;
  let el;
  let callback;
  beforeAll(() => {
    document.body.innerHTML = "";
    callback = jest.fn();
    registry = new CustomBehaviorRegistry({
      definitionDisconnectedCallback: callback,
    });
    el = document.createElement("div");
    el.className = "disconnected-callback";
    document.body.append(el);
    class Behavior {
      disconnectedCallback() {}
    }
    registry.define(".disconnected-callback", Behavior, { foo: "bar" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("gets called after behavior disconnectedCallback", async () => {
    callback.mockClear();
    el.remove();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledWith(".disconnected-callback", el, {
      foo: "bar",
    });
  });
});

describe("Creating a registry with a definitionOptionDefaults object in its settings", () => {
  let registry;
  let el;
  let captured;
  beforeAll(() => {
    document.body.innerHTML = "";
    registry = new CustomBehaviorRegistry({
      definitionOptionDefaults: { foo: "default", shared: "base" },
    });
    el = document.createElement("div");
    el.className = "option-defaults";
    document.body.append(el);
    class Behavior {
      constructor(element, options) {
        captured = options;
      }
    }
    registry.define(".option-defaults", Behavior, { shared: "override" });
  });
  afterAll(() => {
    document.body.innerHTML = "";
    CustomBehaviorRegistry.disconnect(registry);
  });

  test("uses the defaults when no options are passed and merges passed options on top", () => {
    expect(captured.foo).toBe("default");
    expect(captured.shared).toBe("override");
  });
});
// Creating a registry with an attributeFilter string array in it's settings
// triggers defined behavior connect if adding an attribute in the filter list to an element causes a query match
// triggers defined behavior disconnect if adding an attribute in the filter list to an element causes a query to no longer match
// triggers defined behavior connect if removing an attribute in the filter list to an element causes a query match
// triggers defined behavior disconnect if removing an attribute in the filter list to an element causes a query to no longer match
// triggers defined behavior connect if updating the value of an element's existing attribute in the filter list causes a query match
// triggers defined behavior disconnect if updating the value of a connected element's existing attribute in the filter list causes a query to no longer match
// does not trigger behavior connect if adding non-listed attribute to an element causes a query match

// Creating a registry with an attributedChangedValidator method in it's settings
// will be ignored if attributeFilter setting is empty of missing
// calls if adding attribute in the filter list to an element
// takes in target element, attributeName, newValue, oldValue
// cancels behavior query checks on target element if false returned
// allows behavior query checks on target element if true returned
// applies behavior query check to returned element, overriding target element
// applies behavior query check to all elements in a returned array, overriding target element

// Creating a registry with a definedCallback method in its settings
// gets called at definition time
// takes in passed in definition name, behavior class, and definition options object
// overrides the existing registry definition options with any returned object
// will NOT update elements connected to existing behaviors

// Creating a registry with a definitionConstructorCallback method in its settings
// gets called before defined behavior instance construction
// takes in name, element, behavior class, and definition options
// merges any passed back options with existing definition options

// Creating a registry with a definitionConnectedCallback method in its settings
// gets called before defined behavior connectedCallback for new connections
// gets called before defined behavior connectedCallback for re-connections
// takes in name, element, and definition options
// ignores any passed back values

// Creating a registry with a definitionConnectedMoveCallback method in its settings
// gets called before defined behavior connectedMoveCallback
// takes in name, element, and definition options
// ignores any passed back values

// Creating a registry with a definitionConnectedMoveCallback method in its settings
// gets called before defined behavior connectedMoveCallback
// takes in name, element, and definition options

// Creating a registry with a definitionAttributeChangedCallback method in its settings
// gets called before defined behavior dttributeChangedCallback
// takes in name, element, attributeName, oldValue, newValue, and definition options

// Creating a registry with a definitionDisconnectedCallback method in its settings
// gets called after defined behavior diconnectedCallback for new connections
// takes in name, element, and definition options

// Creating a registry with a  definitionOptionDefaults object in its settings
// uses the defaults as definition options if no options provided during behavior definition
// merges the defaults with any passed options provided during behavior definition

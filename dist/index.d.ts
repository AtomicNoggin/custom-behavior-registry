export type BehaviorOptions = Record<string, unknown>;

export interface BehaviorInstance {
  connectedCallback?(element: Element): void;
  disconnectedCallback?(element: Element): void;
  connectedMoveCallback?(element: Element): void;
  attributeChangedCallback?(
    element: Element,
    attributeName: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
}

export interface BehaviorClass<
  TInstance extends BehaviorInstance = BehaviorInstance,
> {
  new (element: Element, options?: BehaviorOptions): TInstance;
  observedAttributes?: string[];
  preConnectionCheck?(
    element: Element,
    options: BehaviorOptions,
  ): boolean;
  tagFilter?: string[];
  tagExcludes?: string[];
}

export type NameValidator = (
  name: string,
) => boolean | string | null | undefined;

export type QueryGenerator = (
  name: string,
  behavior: BehaviorClass,
  options: BehaviorOptions,
) => string;

export interface RegistrySettings {
  queryPrefix?: string;
  querySuffix?: string;
  queryGenerator?: QueryGenerator;
  nameValidator?: NameValidator;
  attributeFilter?: Iterable<string>;
  attributeChangedCallback?: (
    element: Element,
    attributeName: string,
    oldValue: string | null,
    newValue: string | null,
  ) => boolean | Element | Iterable<Element> | undefined;
  definedCallback?: (
    name: string,
    behavior: BehaviorClass,
    options: BehaviorOptions,
  ) => void | RegistrySettings;
  definitionConstructorCallback?: (
    name: string,
    element: Element,
    behavior: BehaviorClass,
    options: BehaviorOptions,
  ) => void | BehaviorOptions;
  definitionConnectedCallback?: (
    name: string,
    element: Element,
    options: BehaviorOptions,
  ) => void;
  definitionDisconnectedCallback?: (
    name: string,
    element: Element,
    options: BehaviorOptions,
  ) => void;
  definitionConnectedMoveCallback?: (
    name: string,
    element: Element,
    options: BehaviorOptions,
  ) => void;
  definitionAttributeChangedCallback?: (
    name: string,
    element: Element,
    attributeName: string,
    oldValue: string | null,
    newValue: string | null,
    options: BehaviorOptions,
  ) => void;
  definitionOptionDefaults?: BehaviorOptions;
}

export default class CustomBehaviorRegistry {
  constructor(settings?: RegistrySettings);

  static observe(registry: CustomBehaviorRegistry): void;
  static disconnect(registry: CustomBehaviorRegistry): void;
  static getSettings(registry: CustomBehaviorRegistry): RegistrySettings | null;
  static replaceSettings(
    registry: CustomBehaviorRegistry,
    settings: RegistrySettings,
  ): RegistrySettings | null;
  static clearSettings(registry: CustomBehaviorRegistry): RegistrySettings | null;
  static undefineBehavior(
    registry: CustomBehaviorRegistry,
    nameOrBehavior: string | BehaviorClass,
  ): void;
  static undefineAllBehaviors(registry: CustomBehaviorRegistry): void;

  define(
    name: string,
    behavior: BehaviorClass,
    options?: BehaviorOptions,
  ): void;
  whenDefined(name: string): Promise<BehaviorClass>;
  update(root?: Element | ShadowRoot): void;
  get(
    name: string,
    element?: Element,
  ): BehaviorClass | BehaviorInstance | null;
  getElements(
    nameOrBehavior: string | BehaviorClass,
  ): Map<Element, BehaviorInstance> | null;
  getElementBehaviors(
    element: Element,
  ): Readonly<Record<string, BehaviorInstance>> | null;
  getName(behavior: BehaviorClass): string | null;
}

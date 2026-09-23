export class IntlLangChangeEvent extends CustomEvent {
  constructor(detail) {
    super("intl-langchange", {
      bubbles: true,
      composed: true,
      detail,
    });
  }
}
export default class IntlLang {
  static observedAttributes = ["lang"];
  static tagExcludes = ["script", "link"];
  lastValue = null;
  constructor(element, options) {}
  attributeChangedCallback(element, attributeName, oldValue, newValue) {
    const event = new IntlLangChangeEvent({
      bubbles: true,
      composed: true,
      detail: { oldValue, newValue, fromDisconnect: null },
    });
    element.dispatchEvent(event);
    this.lastValue = newValue;
  }
  connectedMoveCallback(element) {
    const event = new IntlLangChangeEvent({
      oldValue: element.lang,
      newValue: element.lang,
      fromDisconnect: element,
    });
    element.dispatchEvent(event);
    this.lastValue = element.lang;
  }
  connectedCallback(element) {
    const event = new IntlLangChangeEvent({
      oldValue: undefined,
      newValue: element.lang,
      fromDisconnect: null,
    });
    element.dispatchEvent(event);
    this.lastValue = element.lang;
  }
  disconnectedCallback(element) {
    const event = new IntlLangChangeEvent({
      oldValue: element.lang || this.lastValue,
      newValue: undefined,
      fromDisconnect: element,
    });
    document.dispatchEvent(event);
  }
}

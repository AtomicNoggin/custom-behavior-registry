export {};

declare global {
  type IntlMessageValue = string | { [key: string]: IntlMessageValue };
  type IntlMessageData = Record<string, IntlMessageValue>;
  type IntlMessageOptions = Record<string, unknown>;
  type IntlAttributeMessageName = string | true;
  type IntlAttributeMessages = Record<string, IntlAttributeMessageName>;
  type IntlAttributeOptions = Record<string, IntlMessageOptions>;

  interface IntlMessageFormatter {
    format(values?: IntlMessageOptions): string;
  }

  interface IntlMessageFormatConstructor {
    new (
      message: string,
      locales?: string | readonly string[],
      options?: Record<string, unknown>,
    ): IntlMessageFormatter;
  }

  interface IntlFormattedMessageCache {
    get(
      locale: string | readonly string[],
      key: string,
    ): IntlMessageFormatter | undefined;
    has(locale: string | readonly string[], key: string): boolean;
    set(
      locales: string | readonly string[],
      key: string,
      value: IntlMessageFormatter,
    ): void;
    delete(key: string, locale?: string): void;
    clearMessagesLike(prefix: string, locale?: string): void;
    clearAll(locale?: string): void;
    loadFromObject(messages: IntlMessageData, locale?: string): void;
  }

  namespace Intl {
    let $messageFormat: IntlMessageFormatConstructor;
    let $formattedMessages: IntlFormattedMessageCache;
  }

  interface HTMLElement {
    intlMessage: string | null;
    intlOptions: IntlMessageOptions;
    intlAttributeMessages: IntlAttributeMessages;
    intlAttributeOptions: IntlAttributeOptions;
  }

  interface HTMLLinkElement {
    hrefpattern: string | null;
  }
}

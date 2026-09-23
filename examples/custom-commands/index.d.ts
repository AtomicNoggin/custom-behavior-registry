export {};

declare global {
  type BuiltInCommandName =
    | "show-modal"
    | "close"
    | "request-close"
    | "toggle-modal"
    | "show-popover"
    | "hide-popover"
    | "toggle-popover";

  type CommandName = `--${string}` | BuiltInCommandName | string;
  type CommandArgument =
    | "event"
    | "command"
    | "source"
    | "keyshortcut"
    | `source.${string}`
    | (string & {});

  interface CustomCommandDefinition {
    method: (...args: unknown[]) => unknown;
    args: readonly string[];
  }

  interface CustomCommandOptions {
    bindTo?: Element | string;
    arguments?: readonly CommandArgument[];
    keyshortcuts?: string;
    keysource?: "self" | "descendants";
  }

  class CustomCommandRegistry {
    define(
      name: CommandName,
      method: (...args: any[]) => unknown,
      options?: CustomCommandOptions,
    ): void;
    get(name: CommandName): CustomCommandDefinition | undefined;
    has(name: CommandName): boolean;
    undefine(name: CommandName): void;
    fire<TResult = unknown>(name: CommandName, ...args: any[]): TResult;
  }

  interface CommandEvent extends Event {
    readonly command: string;
    readonly source: Element;
    readonly name?: string;
  }

  interface Element {
    readonly customCommand: CustomCommandRegistry;
  }

  interface HTMLElement {
    command: CommandName | null;
    commandForElement: Element | null;
    commandTrigger: string | null;
  }
}

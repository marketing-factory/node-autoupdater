interface Logger {
  log(message: string): void,
  error(message: string): void,
  group(label: string): void,
  groupEnd(): void,
}

export const logger: Logger = console;

export const NullLogger: Logger = {
  log(message: string): void {},
  error(message: string): void {},
  group(label: string): void {},
  groupEnd(): void {}
};
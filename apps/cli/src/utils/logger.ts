/**
 * Logger - CLI logging utility
 * AIDEV-TODO: implement-logger; CLI logging system
 */

export class Logger {
  static info(message: string): void {
    console.log(message);
  }

  static error(message: string): void {
    console.error(message);
  }

  static debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message);
    }
  }
}
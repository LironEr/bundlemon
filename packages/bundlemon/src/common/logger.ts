import * as util from 'util';
import chalk from 'chalk';

let _verbose = false;

export const setVerbose = (verbose: boolean): void => {
  _verbose = verbose;
};

class Logger {
  prefix: string | undefined;

  constructor(prefix?: string) {
    this.prefix = prefix;
  }

  log = (message: string): void => {
    console.log(this.messageWithPrefix(message));
  };

  debug = (message: string): void => {
    if (!_verbose) {
      return;
    }

    console.log(chalk.grey(`[DEBUG] ${this.messageWithPrefix(message)}`));
  };

  info = (message: string): void => {
    console.log(chalk.cyan(`[INFO] ${this.messageWithPrefix(message)}`));
  };

  warn = (message: string): void => {
    console.log(chalk.yellow(`[WARN] ${this.messageWithPrefix(message)}`));
  };

  error = (message: string, err?: unknown): void => {
    console.error(chalk.red(`[ERROR] ${this.messageWithPrefix(message)}`));
    if (err) {
      if (err instanceof Error) {
        console.error(err);
      } else {
        console.error(chalk.red(util.inspect(err)));
      }
    }
  };

  private messageWithPrefix = (message: string) => {
    return (this.prefix ? this.prefix + ': ' : '').concat(message);
  };

  clone = (prefix: string) => {
    const newLogger = new Logger((this.prefix ? `${this.prefix} - ` : '') + prefix);

    return newLogger;
  };
}

const logger = new Logger();

export default logger;

export function createLogger(prefix: string): Logger {
  return logger.clone(prefix);
}

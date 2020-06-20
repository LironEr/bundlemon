import * as chalk from 'chalk';

interface LoggerOptions {
  verbose: boolean;
  prefix?: string;
}

class Logger {
  verbose = false;
  prefix: string | undefined = undefined;

  init = ({ verbose, prefix }: LoggerOptions) => {
    this.verbose = verbose;
    this.prefix = prefix;
  };

  log = (message: string): void => {
    console.log(this.messageWithPrefix(message));
  };

  debug = (message: string): void => {
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
        console.error(chalk.red(err));
      }
    }
  };

  private messageWithPrefix = (message: string) => {
    return (this.prefix ? this.prefix + ' ' : '').concat(message);
  };

  clone = (prefix: string) => {
    const logger = new Logger();
    logger.init({ verbose: logger.verbose, prefix });

    return logger;
  };
}

const logger = new Logger();

export default logger;

export function createLogger(prefix: string): Logger {
  return logger.clone(prefix);
}

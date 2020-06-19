import * as chalk from 'chalk';

interface LoggerOptions {
  verbose: boolean;
}

class Logger {
  verbose = false;

  init = ({ verbose }: LoggerOptions) => {
    this.verbose = verbose;
  };

  log = (message: string): void => {
    console.log(message);
  };

  debug = (message: string): void => {
    console.log(chalk.grey(`[DEBUG] ${message}`));
  };

  info = (message: string): void => {
    console.log(chalk.cyan(`[INFO] ${message}`));
  };

  warn = (message: string): void => {
    console.log(chalk.yellow(`[WARN] ${message}`));
  };

  error = (message: string, err?: unknown): void => {
    console.error(chalk.red(`[ERROR] ${message}`));
    if (err) {
      if (err instanceof Error) {
        console.error(err);
      } else {
        console.error(chalk.red(err));
      }
    }
  };
}

export default new Logger();

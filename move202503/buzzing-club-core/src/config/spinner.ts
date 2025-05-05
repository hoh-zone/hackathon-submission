import ora, { Ora } from "ora";
import { logger } from "./index";

class SpinnerManager {
  private spinner: Ora | null = null;

  start(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    } else {
      this.spinner = ora({
        text,
        color: "blue",
        spinner: "dots",
      }).start();
    }
  }

  succeed(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
      if (text) {
        logger.info(text);
      }
    }
  }

  fail(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
      if (text) {
        logger.error(text);
      }
    }
  }

  update(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  stop(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}

export const spinner = new SpinnerManager();

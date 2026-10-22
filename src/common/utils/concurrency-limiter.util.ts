import { serverBusyError } from '../errors/auth-errors.js';

export class ConcurrencyLimiter {
  private active = 0;
  private readonly waiting: (() => void)[] = [];

  constructor(
    private readonly concurrency: number,
    private readonly queueLimit: number,
  ) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.active < this.concurrency) {
      this.active++;
      return Promise.resolve();
    }
    if (this.waiting.length >= this.queueLimit) {
      throw serverBusyError();
    }
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  private release(): void {
    const next = this.waiting.shift();
    if (next) {
      next();
    } else {
      this.active--;
    }
  }
}

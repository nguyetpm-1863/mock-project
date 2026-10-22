import { ConcurrencyLimiter } from './concurrency-limiter.util.js';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};

describe('ConcurrencyLimiter', () => {
  it('runs at most the configured number of tasks at once', async () => {
    const limiter = new ConcurrencyLimiter(2, 10);
    const gates = [deferred(), deferred(), deferred()];
    let running = 0;
    let peak = 0;
    const runs = gates.map((gate) =>
      limiter.run(async () => {
        running++;
        peak = Math.max(peak, running);
        await gate.promise;
        running--;
      }),
    );

    await Promise.resolve();
    expect(running).toBe(2);
    gates.forEach((gate) => gate.resolve());
    await Promise.all(runs);
    expect(peak).toBe(2);
  });

  it('rejects with 503 when the queue is full', async () => {
    const limiter = new ConcurrencyLimiter(1, 1);
    const gate = deferred();
    const first = limiter.run(() => gate.promise);
    const second = limiter.run(() => Promise.resolve());

    await expect(limiter.run(() => Promise.resolve())).rejects.toMatchObject({
      status: 503,
    });
    gate.resolve();
    await Promise.all([first, second]);
  });

  it('frees the slot when a task fails', async () => {
    const limiter = new ConcurrencyLimiter(1, 0);

    await expect(
      limiter.run(() => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    await expect(limiter.run(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });
});

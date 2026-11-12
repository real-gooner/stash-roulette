/** Runs async tasks with a concurrency limit. Tasks never throw into the queue. */
export class TaskQueue<T> {
  private pending: T[] = [];
  private active = 0;
  constructor(
    private limit: number,
    private worker: (item: T) => Promise<void>,
    private onIdle?: () => void,
    private delayMs = 0,
  ) {}

  push(item: T): void { this.pending.push(item); this.pump(); }
  clear(): void { this.pending.length = 0; }
  get busy(): boolean { return this.active > 0 || this.pending.length > 0; }

  private pump(): void {
    while (this.active < this.limit && this.pending.length) {
      const item = this.pending.shift() as T;
      this.active++;
      setTimeout(() => {
        this.worker(item)
          .catch(() => undefined)
          .finally(() => {
            this.active--;
            if (!this.pending.length && this.active === 0) this.onIdle?.();
            this.pump();
          });
      }, this.delayMs);
    }
  }
}

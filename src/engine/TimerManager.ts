export class TimerManager {
  private timers: Set<number> = new Set();
  private destroyed = false;

  setTimeout(callback: () => void, delay: number): number {
    if (this.destroyed) {
      return -1;
    }
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      if (!this.destroyed) {
        callback();
      }
    }, delay);
    this.timers.add(timerId);
    return timerId;
  }

  clearTimeout(timerId: number): void {
    if (timerId < 0) return;
    window.clearTimeout(timerId);
    this.timers.delete(timerId);
  }

  clearAll(): void {
    this.timers.forEach((id) => {
      window.clearTimeout(id);
    });
    this.timers.clear();
  }

  get activeCount(): number {
    return this.timers.size;
  }

  destroy(): void {
    this.clearAll();
    this.destroyed = true;
  }
}

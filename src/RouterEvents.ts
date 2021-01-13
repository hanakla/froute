interface Events {
  routeChangeStart: [url: string];
  routeChangeComplete: [url: string];
  routeChangeError: [err: Error, url: string];
}

export class RouterEvents {
  private listeners: Record<string, ((...args: any) => void)[]> = Object.create(
    null
  );

  public on<K extends keyof Events>(
    event: K,
    callback: (...args: Events[K]) => void
  ) {
    const e = (this.listeners[event] = this.listeners[event] ?? []);
    e.push(callback);
  }

  public off<K extends keyof Events>(
    event: K,
    callback: (...args: Events[K]) => void
  ) {
    this.listeners[event] = (this.listeners[event] ?? []).filter(
      (listener) => listener !== callback
    );
  }

  public emit<K extends keyof Events>(event: K, args: Events[K]) {
    (this.listeners[event] ?? []).forEach((listener) => listener(...args));
  }
}

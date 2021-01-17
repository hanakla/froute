interface Events {
  routeChangeStart: [url: string];
  routeChangeComplete: [url: string];
  routeChangeError: [err: Error, url: string];
}

export type RouterEvents = ReturnType<typeof routerEvents>;

export const routerEvents = () => {
  const listeners: Record<string, ((...args: any) => void)[]> = Object.create(
    null
  );

  return {
    on<K extends keyof Events>(
      event: K,
      callback: (...args: Events[K]) => void
    ) {
      (listeners[event] = listeners[event] ?? []).push(callback);
    },
    off<K extends keyof Events>(
      event: K,
      callback: (...args: Events[K]) => void
    ) {
      listeners[event] = (listeners[event] ?? []).filter(
        (listener) => listener !== callback
      );
    },
    emit<K extends keyof Events>(event: K, args: Events[K]) {
      (listeners[event] ?? []).forEach((listener) => listener(...args));
    },
  };
};

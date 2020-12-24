export const canUseDOM = () => typeof window !== "undefined";

export const isDevelopment =
  typeof process !== "undefined"
    ? process.env?.NODE_ENV === "development" ||
      process.env?.NODE_ENV === "test"
    : false;

// prettier-ignore
export type DeepReadonly<T> =
  T extends () => any | boolean | number | string | null | undefined ? T
  : T extends Array<infer R> ? ReadonlyArray<DeepReadonly<R>>
  : T extends Map<infer K, infer V> ? ReadonlyMap<K, V>
  : T extends Set<infer V> ? ReadonlySet<V>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> }

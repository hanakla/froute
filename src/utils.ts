export const canUseDOM = () => typeof window !== "undefined";

export const isDevelopment =
  typeof process !== "undefined"
    ? process.env?.NODE_ENV === "development" ||
      process.env?.NODE_ENV === "test"
    : false;

const hasOwnProperty = Object.prototype.hasOwnProperty;

// eslint-disable-next-line @typescript-eslint/ban-types
export const isEmptyObject = (t: object) => {
  for (const k in t) {
    if (hasOwnProperty.call(t, k)) return false;
  }

  return true;
};

// prettier-ignore
export type DeepReadonly<T> =
  T extends () => any | boolean | number | string | null | undefined ? T
  : T extends Array<infer R> ? ReadonlyArray<DeepReadonly<R>>
  : T extends Map<infer K, infer V> ? ReadonlyMap<K, V>
  : T extends Set<infer V> ? ReadonlySet<V>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> }

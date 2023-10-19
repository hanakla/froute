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

export const parseUrl = (url: string) => {
  const result = new URL(url, "pl:/___.com");
  const path = result.pathname + result.search;

  return {
    protocol: result.protocol === "pl:" ? null : result.protocol,
    // slashes: null,
    auth:
      result.username !== "" || result.password !== ""
        ? `${result.username ?? ""}:${result.password ?? ""}`
        : null,
    host: result.host === "" ? null : result.host,
    port: result.port === "" ? null : result.port,
    hostname: result.hostname === "" ? null : result.hostname,
    hash: result.hash === "" ? null : result.hash,
    search: result.search === "" ? null : result.search,
    query: result.search === "" ? null : result.search.replace(/^\?/, ""),
    pathname:
      result.pathname === "" || result.pathname === "/___.com"
        ? null
        : result.pathname,
    path: path === "" || path === "/___.com" ? null : path,
    href: result.href.replace(/^(pl:)?(\/___.com)?/g, ""),
  };
};

export const parseQueryString = (query: string) => {
  return Array.from(new URLSearchParams(query)).reduce((accum, [k, v]) => {
    if (k in accum) {
      accum[k] = Array.isArray(accum[k])
        ? [...(accum[k] as any[]), v]
        : [accum[k], v];
    } else {
      accum[k] = v;
    }

    return accum;
  }, Object.create(null) as Record<string, string | string[] | undefined>);
};

export const stringifyQueryString = (
  query: Record<string, string | string[]>
) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (Array.isArray(v)) {
      v.forEach((vv) => params.append(k, vv));
    } else {
      params.append(k, v);
    }
  });

  return params.toString();
};

// prettier-ignore
export type DeepReadonly<T> =
  T extends () => any | boolean | number | string | null | undefined ? T
  : T extends Array<infer R> ? ReadonlyArray<DeepReadonly<R>>
  : T extends Map<infer K, infer V> ? ReadonlyMap<K, V>
  : T extends Set<infer V> ? ReadonlySet<V>
  : { readonly [K in keyof T]: DeepReadonly<T[K]> }

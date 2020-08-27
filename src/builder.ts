import { compile } from "path-to-regexp";
import { stringify } from "querystring";
import { IRoute } from "./RouteDefiner";

type ExtractParams<T> = T extends IRoute<infer P> ? P : never;

export const buildPath = <T extends IRoute<any>>(
  def: T,
  params: { [K in ExtractParams<T>]: string },
  query?: { [key: string]: string }
) => {
  const pathname = compile(def.toPath(), { encode: encodeURIComponent })(
    params
  );
  return query ? `${pathname}?${stringify(query)}` : pathname;
};

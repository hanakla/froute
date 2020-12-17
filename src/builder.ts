import { compile } from "path-to-regexp";
import { stringify } from "querystring";
import { IRoute, ParamsOfRoute } from "./RouteDefiner";

export const buildPath = <T extends IRoute<any>>(
  def: T,
  params: ParamsOfRoute<T>,
  query?: { [key: string]: string }
) => {
  const pathname = compile(def.toPath(), { encode: encodeURIComponent })(
    params
  );
  return query ? `${pathname}?${stringify(query)}` : pathname;
};

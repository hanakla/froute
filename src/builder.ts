import { compile } from "path-to-regexp";
import { stringify } from "querystring";
import { isEmptyObject } from "./utils";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";

export type BuildPath = <T extends RouteDefinition<any, any>>(
  def: T,
  params: ParamsOfRoute<T>,
  query?: { [key: string]: string | string[] }
) => string;

export const buildPath: BuildPath = (def, params, query?) => {
  const pathname = compile(def.toPath(), { encode: encodeURIComponent })(
    params
  );

  return query
    ? `${pathname}${isEmptyObject(query) ? "" : "?" + stringify(query)}`
    : pathname;
};

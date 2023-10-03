import { compile } from "path-to-regexp";
import { isEmptyObject, stringifyQueryString } from "./utils";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";

export type BuildPath = <T extends RouteDefinition<any, any>>(
  def: T,
  params: ParamsOfRoute<T>,
  /** Object (encode unnecessory) or query string without `?` prefix */
  query?: { [key: string]: string | string[] } | string
) => string;

export const buildPath: BuildPath = (def, params, query?) => {
  const pathname = compile(def.toPath(), { encode: encodeURIComponent })(
    params
  );

  let queryPart: string;

  if (query == null) {
    queryPart = "";
  } else if (typeof query === "string") {
    queryPart = query.length > 0 ? `?${query}` : "";
  } else {
    queryPart = isEmptyObject(query) ? "" : "?" + stringifyQueryString(query);
  }

  return query ? `${pathname}${queryPart}` : pathname;
};

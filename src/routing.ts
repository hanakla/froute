import { MatchResult } from "path-to-regexp";
import { RouterContext } from "./RouterContext";
import { parse as parseUrl } from "url";
import { parse as qsParse } from "querystring";
import { ParamsOfRoute, RouteDefinition } from "./RouteDefiner";

export interface FrouteMatch<P extends string> {
  route: RouteDefinition<P, any>;
  match: MatchResult<{ [K in P]: string }> & {
    query: ParsedQuery;
    search: string;
  };
}

export type ParsedQuery = { [K: string]: string | string[] | undefined };

export interface RoutingOnlyRouterContext {
  statusCode: number;
  redirectTo: string | null;
  resolveRoute: RouterContext["resolveRoute"];
  buildPath: RouterContext["buildPath"];
}

export interface RouteResolver {
  (
    pathname: string,
    match: FrouteMatch<any> | null,
    context: RoutingOnlyRouterContext
  ): FrouteMatch<any> | null;
}

export const matchByRoutes = (
  pathname: string,
  routes: {
    [key: string]: RouteDefinition<any, any>;
  },
  {
    resolver,
    context,
  }: { resolver?: RouteResolver; context?: RouterContext } = {}
) => {
  context = context ?? new RouterContext(routes, { resolver });

  const parsed = parseUrl(pathname);

  let matched: FrouteMatch<any> | null = null;
  if (!parsed.pathname) return null;

  for (const route of Object.values(routes)) {
    const match = route.match(parsed.pathname);
    if (!match) continue;

    matched = {
      route,
      match: {
        ...(match as MatchResult<ParamsOfRoute<typeof route>>),
        query: qsParse(parsed.search ?? ""),
        search: parsed.search ?? "",
      },
    };

    break;
  }

  if (resolver) {
    return resolver(parsed.pathname, matched, context);
  }

  return matched;
};

export const isMatchToRoute = (
  pathname: string,
  route: RouteDefinition<any, any>,
  {
    resolver,
    context,
  }: { resolver?: RouteResolver; context?: RouterContext } = {}
) => {
  context = context ?? new RouterContext({ route }, { resolver });

  const parsed = parseUrl(pathname);

  let matched: FrouteMatch<any> | null = null;
  if (!parsed.pathname) return null;

  const match = route.match(parsed.pathname);

  matched = match
    ? {
        route,
        match: {
          ...(match as MatchResult<ParamsOfRoute<typeof route>>),
          query: qsParse(parsed.search ?? ""),
          search: parsed.search ?? "",
        },
      }
    : null;

  if (resolver) {
    return resolver(parsed.pathname, matched, context);
  }

  return matched;
};

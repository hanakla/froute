import { MatchResult } from "path-to-regexp";
import { RouterContext } from "./RouterContext";
import { parse as parseUrl } from "url";
import { ParamsOfRoute, RouteDefinition } from "./RouteDefiner";

export interface FrouteMatch<PK extends string> {
  route: RouteDefinition<PK>;
  match: MatchResult<{ [K in PK]: string }>;
}

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
    [key: string]: RouteDefinition<any>;
  },
  {
    resolver,
    context,
  }: { resolver?: RouteResolver; context?: RouterContext } = {}
) => {
  context = context ?? new RouterContext(routes, { resolver });

  const realPathName = parseUrl(pathname).pathname!;
  let matched: FrouteMatch<any> | null = null;

  for (const route of Object.values(routes)) {
    const match = route.match(realPathName);
    if (!match) continue;

    matched = {
      route,
      match: match as MatchResult<ParamsOfRoute<typeof route>>,
    };

    break;
  }

  if (resolver) {
    return resolver(realPathName, matched, context);
  }

  return matched;
};

export const isMatchToRoute = (
  pathname: string,
  route: RouteDefinition<any>,
  {
    resolver,
    context,
  }: { resolver?: RouteResolver; context?: RouterContext } = {}
) => {
  context = context ?? new RouterContext({ route }, { resolver });

  const realPathName = parseUrl(pathname).pathname!;
  let matched: FrouteMatch<any> | null = null;

  const match = route.match(realPathName);

  matched = match
    ? {
        route,
        match: match as MatchResult<ParamsOfRoute<typeof route>>,
      }
    : null;

  if (resolver) {
    return resolver(realPathName, matched, context);
  }

  return matched;
};

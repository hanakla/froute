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
}

export interface RouteResolver {
  (
    pathname: string,
    match: FrouteMatch<any> | null,
    context: RoutingOnlyRouterContext
  ): FrouteMatch<any> | null;
}

type RoutesObject = {
  [key: string]: RouteDefinition<any, any>;
};

const createRoutingOnlyContext = (
  context: RouterContext | RoutingOnlyRouterContext | undefined,
  routes: RoutesObject
): RoutingOnlyRouterContext => {
  if (context) {
    const ctx: RoutingOnlyRouterContext = {
      get statusCode() {
        return context!.statusCode;
      },
      set statusCode(status: number) {
        context!.statusCode = status;
      },
      get redirectTo() {
        return context!.redirectTo;
      },
      set redirectTo(url: string | null) {
        context!.redirectTo = url;
      },
      resolveRoute: (pathname) =>
        matchByRoutes(pathname, routes, { context: ctx }),
    };

    return ctx;
  }

  const stabCtx: RoutingOnlyRouterContext = {
    statusCode: 200,
    redirectTo: null,
    resolveRoute: (pathname) =>
      matchByRoutes(pathname, routes, {
        /* skip resolver: for guard from infinite loop */
        context: stabCtx,
      }),
  };

  return stabCtx;
};

export const matchByRoutes = (
  pathname: string,
  routes: RoutesObject,
  {
    resolver,
    context,
  }: {
    resolver?: RouteResolver;
    context?: RoutingOnlyRouterContext;
  } = {}
): FrouteMatch<any> | null => {
  const usingContext = createRoutingOnlyContext(context, routes);

  const parsed = parseUrl(pathname);

  let matched: FrouteMatch<any> | null = null;
  if (!parsed.pathname) return null;

  for (const route of Object.values(routes)) {
    const match = route.match(parsed.pathname);
    if (!match) continue;

    const search = (parsed.search ?? "")?.slice(1);

    matched = {
      route,
      match: {
        ...(match as MatchResult<ParamsOfRoute<typeof route>>),
        query: qsParse(search),
        search: parsed.search ?? "",
      },
    };

    break;
  }

  if (resolver) {
    return resolver(parsed.pathname, matched, {
      get redirectTo() {
        return usingContext.redirectTo;
      },
      set redirectTo(url: string | null) {
        usingContext.redirectTo = url;
      },
      get statusCode() {
        return usingContext.statusCode;
      },
      set statusCode(code: number) {
        usingContext.statusCode = code;
      },
      resolveRoute: usingContext.resolveRoute,
    });
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
  const search = (parsed.search ?? "")?.slice(1);

  matched = match
    ? {
        route,
        match: {
          ...(match as MatchResult<ParamsOfRoute<typeof route>>),
          query: qsParse(search),
          search: parsed.search ?? "",
        },
      }
    : null;

  if (resolver) {
    return resolver(parsed.pathname, matched, context);
  }

  return matched;
};

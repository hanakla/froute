import {
  FrouteMatch,
  RouteResolver,
  RoutingOnlyRouterContext,
} from "./routing";

/**
 * RouteResolver for combineRouteResolver.
 * It returns `false`, skip to next resolver.
 * If does not match any route expect to return `null`.
 */
export interface CombinableResolver {
  (
    pathname: string,
    match: FrouteMatch<any> | null,
    context: RoutingOnlyRouterContext
  ): FrouteMatch<any> | null | false;
}

export const combineRouteResolver = (
  ...resolvers: CombinableResolver[]
): RouteResolver => {
  return (pathname, match, context) => {
    let prevMatch: FrouteMatch<any> | null = match;
    let prevPath: string = pathname;

    for (const resolver of resolvers) {
      const result = resolver(prevPath, prevMatch, context);

      if (result === false) continue;
      if (result === null) return null;
      prevMatch = result;
      prevPath = result.match.path!;
    }

    return prevMatch;
  };
};

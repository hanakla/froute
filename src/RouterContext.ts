import {
  createBrowserHistory,
  createMemoryHistory,
  History,
  Location,
} from "history";
import { parse as parseUrl } from "url";
import { MatchResult } from "path-to-regexp";
import { parse as qsParse } from "querystring";
import { canUseDOM } from "./utils";
import { IRoute, ParamsOfRoute } from "./RouteDefiner";
import { buildPath } from "./builder";

interface FrouteMatch<PK extends string> {
  route: IRoute<PK>;
  match: MatchResult<{ [K in PK]: string }>;
}

export interface RouterOptions {
  resolver?: (
    pathname: string,
    match: FrouteMatch<any> | null,
    context: RouterContext
  ) => FrouteMatch<any> | null;
  preloadContext?: any;
  history?: History;
}

export const createRouterContext = (
  routes: { [key: string]: IRoute<any> },
  options: RouterOptions = {}
) => {
  return new RouterContext(routes, options);
};

export class RouterContext {
  public statusCode = 200;
  public redirectTo: string | null = null;
  public history: History;

  private location: Location | null = null;
  private currentMatch: FrouteMatch<any> | null = null;
  private listener: Set<() => void> = new Set();

  constructor(
    public routes: { [key: string]: IRoute<any> },
    private options: RouterOptions = {}
  ) {
    this.history =
      options.history ?? canUseDOM()
        ? createBrowserHistory({})
        : createMemoryHistory({ initialEntries: [] });
  }

  public navigate(location: Location): void;
  public navigate(pathname: string): void;
  public navigate(pathname: string | Location) {
    if (typeof pathname === "string") {
      this.currentMatch = this.resolveRoute(pathname);

      const parsed = parseUrl(pathname);
      this.location = {
        key: "",
        pathname: parsed.pathname ?? "",
        search: parsed.search ?? "",
        hash: parsed.hash ?? "",
        state: null,
      };
    } else {
      const location = pathname;
      this.currentMatch = this.resolveRoute(location.pathname);

      if (this.currentMatch) {
        this.location = location;
      }
    }
  }

  public buildPath<R extends IRoute<any>>(route: R, params: ParamsOfRoute<R>) {
    return buildPath(route, params);
  }

  public getCurrentMatch() {
    return this.currentMatch;
  }

  public getCurrentLocation() {
    return this.location;
  }

  public observeFinishPreload(listener: () => void) {
    this.listener.add(listener);
  }

  public unobserveFinishPreload(listener: () => void) {
    this.listener.delete(listener);
  }

  public resolveRoute(pathname: string): null | FrouteMatch<any> {
    const realPathName = parseUrl(pathname).pathname!;
    let matched: FrouteMatch<any> | null = null;

    for (const route of Object.values(this.routes)) {
      const match = route.match(realPathName);
      if (!match) continue;

      matched = {
        route,
        match: match as MatchResult<ParamsOfRoute<typeof route>>,
      };

      break;
    }

    if (this.options.resolver) {
      return this.options.resolver(realPathName, matched, this);
    }

    return matched;
  }

  public async preloadRoute<R extends IRoute<any>>(
    route: R,
    params: ParamsOfRoute<R>,
    query: { [key: string]: string | string[] | undefined } = {}
  ) {
    const actor = route.getActor();
    if (!actor) return;

    await Promise.all([
      actor.loadComponent(),
      actor.preload?.(this.options.preloadContext, params, query),
    ]);
  }

  public async preloadCurrent() {
    const matchedRoute = this.currentMatch;
    if (!matchedRoute) return;

    const query = this.location ? qsParse(this.location.search.slice(1)) : {};
    await this.preloadRoute(
      matchedRoute.route,
      matchedRoute.match.params,
      query
    );

    this.listener.forEach((listener) => listener());
  }
}

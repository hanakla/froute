import {
  createBrowserHistory,
  createMemoryHistory,
  History,
  Location,
} from "history";

import { parse as qsParse } from "querystring";
import { parse as urlParse } from "url";
import { canUseDOM } from "./utils";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";
import { buildPath } from "./builder";
import { FrouteMatch, RouteResolver, matchByRoutes } from "./routing";

export interface RouterOptions {
  resolver?: RouteResolver;
  preloadContext?: any;
  history?: History;
}

export const createRouterContext = (
  routes: { [key: string]: RouteDefinition<any> },
  options: RouterOptions = {}
) => {
  return new RouterContext(routes, options);
};

interface Navigate {
  (location: Location): void;
  (pathname: string): void;
}
export class RouterContext {
  public statusCode = 200;
  public redirectTo: string | null = null;
  public history: History;

  private location: Location | null = null;
  private currentMatch: FrouteMatch<any> | null = null;
  private listener: Set<() => void> = new Set();

  constructor(
    public routes: { [key: string]: RouteDefinition<any> },
    private options: RouterOptions = {}
  ) {
    this.history =
      options.history ?? canUseDOM()
        ? createBrowserHistory({})
        : createMemoryHistory({ initialEntries: [] });
  }

  public navigate: Navigate = (pathname: string | Location) => {
    if (typeof pathname === "string") {
      this.currentMatch = this.resolveRoute(pathname);

      const parsed = urlParse(pathname);
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
  };

  public buildPath = <R extends RouteDefinition<any>>(
    route: R,
    params: ParamsOfRoute<R>
  ) => {
    return buildPath(route, params);
  };

  public getCurrentMatch = () => {
    return this.currentMatch;
  };

  public getCurrentLocation = () => {
    if (!this.location)
      throw new Error(
        "Froute: location is empty. Please call `.navigate` before get current location."
      );
    return this.location;
  };

  public observeFinishPreload = (listener: () => void) => {
    this.listener.add(listener);
  };

  public unobserveFinishPreload = (listener: () => void) => {
    this.listener.delete(listener);
  };

  public resolveRoute = (pathname: string): FrouteMatch<any> | null => {
    return matchByRoutes(pathname, this.routes, {
      resolver: this.options.resolver,
      context: this,
    });
  };

  public async preloadRoute<R extends RouteDefinition<any>>(
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

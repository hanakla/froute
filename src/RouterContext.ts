import {
  BrowserHistory,
  createBrowserHistory,
  createMemoryHistory,
  History,
  Listener,
  Location,
  MemoryHistory,
} from "history";

import { parse as qsParse } from "querystring";
import { parse as urlParse } from "url";
import { canUseDOM, DeepReadonly } from "./utils";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";
import { buildPath } from "./builder";
import { FrouteMatch, RouteResolver, matchByRoutes } from "./routing";
import {
  createFrouteHistoryState,
  FrouteHistoryState,
  StateBase,
} from "./FrouteHistoryState";

export interface RouterOptions {
  resolver?: RouteResolver;
  preloadContext?: any;
  history?: History;
}

export const createRouterContext = (
  routes: { [key: string]: RouteDefinition<any, any> },
  options: RouterOptions = {}
) => {
  return new RouterContext(routes, options);
};

interface Navigate {
  (
    location: Omit<Location<FrouteHistoryState | null>, "key">,
    options?: NavigateOption
  ): Promise<void>;
  (pathname: string, options?: NavigateOption): Promise<void>;
}

interface NavigateOption {
  state?: StateBase;
  action?: "PUSH" | "REPLACE";
  __FROUTE_INTERNAL_STATE_DO_NOT_USE_OR_YOU_WILL_GOT_CRASH?: FrouteHistoryState<
    any
  > | null;
}

/** Return `false` to prevent routing */
export interface BeforeRouteListener {
  (nextMatch: FrouteMatch<any> | null):
    | Promise<boolean | void>
    | boolean
    | void;
}

export type NavigationListener = (
  location: DeepReadonly<Location<FrouteHistoryState>>
) => void;

export class RouterContext {
  public statusCode = 200;
  public redirectTo: string | null = null;
  public readonly history: History<FrouteHistoryState>;

  private location: Location<FrouteHistoryState> | null = null;
  private currentMatch: FrouteMatch<any> | null = null;
  private disposeHistory: () => void;

  private beforeRouteChangeListener: BeforeRouteListener | null = null;

  /** Preload finish listeners */
  private routeChangedListener: Set<NavigationListener> = new Set();

  constructor(
    public routes: { [key: string]: RouteDefinition<any, any> },
    private options: RouterOptions = {}
  ) {
    this.history =
      options.history ?? canUseDOM()
        ? (createBrowserHistory({}) as BrowserHistory<FrouteHistoryState>)
        : (createMemoryHistory({}) as MemoryHistory<FrouteHistoryState>);

    this.disposeHistory = this.history.listen(this.historyListener);
  }

  public dispose() {
    this.disposeHistory();

    this.routeChangedListener.clear();
    (this as any).routeChangedListener = null;
    this.beforeRouteChangeListener = null;
    this.location = null;
    this.currentMatch = null;
  }

  private historyListener: Listener<FrouteHistoryState | null> = ({
    location,
  }) => {
    this.location = {
      key: location.key,
      pathname: location.pathname,
      hash: location.hash,
      search: location.search,
      state: location.state ?? createFrouteHistoryState(),
    };

    this.currentMatch = this.resolveRoute(location.pathname);

    const nextLocation = this.getCurrentLocation();
    this.routeChangedListener.forEach((listener) => listener(nextLocation));
  };

  public navigate: Navigate = async (
    pathname: string | Omit<Location<FrouteHistoryState | null>, "key">,
    { state, action }: NavigateOption = {}
  ) => {
    const loc = typeof pathname === "string" ? urlParse(pathname) : pathname;
    const userState = typeof pathname !== "string" ? pathname.state : state;

    const nextMatch = this.resolveRoute(
      (loc.pathname ?? "") + (loc.search ?? "") + (loc.search ?? "")
    );

    if ((await this.beforeRouteChangeListener?.(nextMatch)) === false) return;

    if (!nextMatch) {
      this.currentMatch = null;
      this.location = {
        key: "",
        pathname: loc.pathname ?? "",
        hash: loc.hash ?? "",
        search: loc.search ?? "",
        state: createFrouteHistoryState(),
      };
      return;
    }

    this.currentMatch = nextMatch;
    this.location = {
      key: "",
      pathname: loc.pathname ?? "",
      search: loc.search ?? "",
      hash: loc.hash ?? "",
      state: createFrouteHistoryState(
        userState ?? nextMatch.route.createState()
      ),
    };

    if (action === "REPLACE") {
      this.history.replace(this.location, this.location.state);
      return;
    }

    if (action === "PUSH") {
      this.history.push(this.location, this.location.state);
      await this.preloadCurrent();
    }

    this.routeChangedListener.forEach((listener) =>
      listener(this.getCurrentLocation())
    );
  };

  public clearBeforeRouteChangeListener() {
    this.beforeRouteChangeListener = null;
  }

  public setBeforeRouteChangeListener(listener: BeforeRouteListener) {
    if (this.beforeRouteChangeListener) {
      throw new Error(
        "Froute: beforeRouteChangeListener already set, please set only current Page not in child components"
      );
    }

    this.beforeRouteChangeListener = listener;
  }

  public get internalHitoryState() {
    return this.getCurrentLocation()?.state.__froute;
  }

  public set internalHistoryState(state: FrouteHistoryState["__froute"]) {
    const nextState: FrouteHistoryState = {
      __froute: state,
      app: this.getCurrentLocation()?.state,
    };

    this.history.replace(this.getCurrentLocation(), nextState);
  }

  public getHistoryState = () => {
    return this.getCurrentLocation().state?.app;
  };

  public setHistoryState = (nextState: FrouteHistoryState["app"]) => {
    const location = this.getCurrentLocation();

    const nextRawState: FrouteHistoryState = {
      __froute: location.state.__froute,
      app: nextState,
    };

    this.history.replace(location, nextRawState);
    this.location = { ...location, state: nextRawState };
  };

  public buildPath = <R extends RouteDefinition<any, any>>(
    route: R,
    params: ParamsOfRoute<R>,
    query?: { [key: string]: string | string[] }
  ) => {
    return buildPath(route, params, query);
  };

  public getCurrentMatch = (): DeepReadonly<FrouteMatch<any>> | null => {
    return this.currentMatch;
  };

  public getCurrentLocation = (): DeepReadonly<
    Location<FrouteHistoryState>
  > => {
    if (!this.location) {
      throw new Error(
        "Froute: location is empty. Please call `.navigate` before get current location."
      );
    }

    return this.location;
  };

  public observeRouteChanged = (listener: NavigationListener) => {
    this.routeChangedListener.add(listener);
  };

  public unobserveRouteChanged = (listener: NavigationListener) => {
    this.routeChangedListener.delete(listener);
  };

  public resolveRoute = (pathname: string): FrouteMatch<any> | null => {
    return matchByRoutes(pathname, this.routes, {
      resolver: this.options.resolver,
      context: this,
    });
  };

  public async preloadRoute<R extends RouteDefinition<any, any>>(
    route: DeepReadonly<R>,
    params: ParamsOfRoute<R>,
    query: { [key: string]: string | string[] | undefined } = {},
    { onlyComponentPreload = false }: { onlyComponentPreload?: boolean } = {}
  ) {
    const actor = route.getActor();
    if (!actor) return;

    await Promise.all([
      actor.loadComponent(),
      onlyComponentPreload
        ? null
        : actor.preload?.(this.options.preloadContext, params, query),
    ]);
  }

  public async preloadCurrent({
    onlyComponentPreload = false,
  }: {
    onlyComponentPreload?: boolean;
  } = {}) {
    const matchedRoute = this.getCurrentMatch();
    const location = this.getCurrentLocation();

    if (!matchedRoute) return;

    const query = location ? qsParse(location.search.slice(1)) : {};
    await this.preloadRoute(
      matchedRoute.route,
      matchedRoute.match.params,
      query,
      { onlyComponentPreload }
    );
  }
}

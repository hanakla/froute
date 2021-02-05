import {
  Blocker,
  BrowserHistory,
  createBrowserHistory,
  createMemoryHistory,
  History,
  Listener,
  Location,
  MemoryHistory,
} from "history";
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
import { RouterEventsInternal, routerEvents } from "./RouterEvents";

export interface RouterOptions {
  resolver?: RouteResolver;
  preloadContext?: any;
  history?: History;
}

export const createRouter = (
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
  /** undefined only used at client side rehydration */
  action?: "PUSH" | "POP" | "REPLACE" | undefined;
  __INTERNAL_STATE_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: FrouteHistoryState<any> | null;
}

/** Return `false` to prevent routing */
export interface BeforeRouteListener {
  (nextMatch: FrouteMatch<any> | null):
    | Promise<boolean | void>
    | boolean
    | void;
}

const createKey = () => Math.random().toString(36).substr(2, 8);

export type NavigationListener = (
  location: DeepReadonly<Location<FrouteHistoryState>>
) => void;

export class RouterContext {
  public statusCode = 200;
  public redirectTo: string | null = null;
  public readonly history: History<FrouteHistoryState>;
  public events: RouterEventsInternal = routerEvents();

  /** Temporary session id for detect reloading */
  private sid = createKey();
  private latestNavKey: string | null = null;
  private location: Location<FrouteHistoryState> | null = null;
  private currentMatch: FrouteMatch<any> | null = null;
  private unlistenHistory: () => void;
  private releaseNavigationBlocker: (() => void) | null;

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

    this.unlistenHistory = this.history.listen(this.historyListener);
  }

  public dispose() {
    this.unlistenHistory();
    this.releaseNavigationBlocker?.();

    this.routeChangedListener.clear();
    (this as any).routeChangedListener = null;
    this.beforeRouteChangeListener = null;
    this.releaseNavigationBlocker = null;
    this.location = null;
    this.currentMatch = null;
  }

  private historyListener: Listener<FrouteHistoryState | null> = async ({
    location,
    action,
  }) => {
    this.navigate(location, {
      action,
      __INTERNAL_STATE_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: location.state,
    });
  };

  public navigate: Navigate = async (
    pathname: string | Omit<Location<FrouteHistoryState | null>, "key">,
    options: NavigateOption = {}
  ) => {
    const {
      state,
      action,
      __INTERNAL_STATE_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: internalState,
    } = options;
    const currentNavKey = (this.latestNavKey = createKey());
    const isCancelled = () => this.latestNavKey !== currentNavKey;
    const loc = typeof pathname === "string" ? urlParse(pathname) : pathname;
    const userState = typeof pathname !== "string" ? pathname.state : state;

    const nextSid =
      "__INTERNAL_STATE_DO_NOT_USE_OR_YOU_WILL_BE_FIRED" in options
        ? internalState?.__froute?.sid
        : this.sid;

    const nextMatch = this.resolveRoute(
      (loc.pathname ?? "") + (loc.search ?? "") + (loc.hash ?? "")
    );

    if (
      (action === "PUSH" || action === "POP") &&
      (await this.beforeRouteChangeListener?.(nextMatch)) === false
    )
      return;

    // Dispose listener for prevent duplicate route handling
    this.unlistenHistory();

    try {
      const nextLocation = {
        key: createKey(),
        pathname: loc.pathname ?? "/",
        search: loc.search ?? "",
        hash: loc.hash ?? "",
        state:
          internalState ??
          createFrouteHistoryState(
            nextSid,
            userState ?? nextMatch?.route.createState()
          ),
      };

      if (action === "REPLACE") {
        this.history.replace(nextLocation, nextLocation.state);

        this.currentMatch = nextMatch;
        this.location = nextLocation;
        return;
      }

      this.events.emit("routeChangeStart", [loc.pathname ?? "/"]);

      if (action === "PUSH" && nextMatch) {
        await this.preloadRoute(nextMatch);

        if (!isCancelled()) {
          this.history.push(nextLocation, nextLocation.state);
        }
      } else if (
        action === "POP" &&
        nextLocation.state.__froute?.sid !== this.sid &&
        nextMatch
      ) {
        await this.preloadRoute(nextMatch);
      } else {
        // on restore location
        if (!isCancelled()) {
          this.history.replace(nextLocation, nextLocation.state);
        }
      }

      // Skip update if next navigation is started
      if (!isCancelled()) {
        this.currentMatch = nextMatch;
        this.location = nextLocation;
        this.routeChangedListener.forEach((listener) => listener(nextLocation));
      }

      this.events.emit("routeChangeComplete", [loc.pathname ?? "/"]);
    } catch (e) {
      this.events.emit("routeChangeError", [e, loc.pathname ?? "/"]);
      throw e;
    } finally {
      // Restore listener
      this.unlistenHistory = this.history.listen(this.historyListener);
    }
  };

  public clearBeforeRouteChangeListener() {
    this.releaseNavigationBlocker?.();
    this.beforeRouteChangeListener = null;
    this.releaseNavigationBlocker = null;
  }

  public setBeforeRouteChangeListener(listener: BeforeRouteListener) {
    if (this.beforeRouteChangeListener) {
      throw new Error(
        "Froute: beforeRouteChangeListener already set, please set only current Page not in child components"
      );
    }

    const block: Blocker = ({ action, location, retry }) => {
      if (action === "REPLACE") {
        return;
      }

      if (action === "PUSH") {
        // When PUSH, navigatable condition are maybe checked in #navigate()

        this.releaseNavigationBlocker?.();
        retry();

        setTimeout(() => {
          this.releaseNavigationBlocker = this.history.block(block);
        });

        return;
      }

      const nextMatch = this.resolveRoute(
        (location.pathname ?? "") +
          (location.search ?? "") +
          (location.hash ?? "")
      );

      if (this.beforeRouteChangeListener?.(nextMatch) === false) {
        return;
      } else {
        // In route changed
        this.events.emit("routeChangeStart", [location.pathname ?? "/"]);

        try {
          this.clearBeforeRouteChangeListener();
          retry();

          setTimeout(() => {
            this.events.emit("routeChangeComplete", [location.pathname ?? "/"]);
          });
        } catch (e) {
          this.events.emit("routeChangeError", [e, location.pathname ?? "/"]);
        }
      }
    };

    this.beforeRouteChangeListener = listener;
    this.releaseNavigationBlocker = this.history.block(block);
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

  public getHistoryState = (): FrouteHistoryState["app"] => {
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
    match: DeepReadonly<FrouteMatch<any> & { route: R }>,
    { onlyComponentPreload = false }: { onlyComponentPreload?: boolean } = {}
  ) {
    const actor = match.route.getActor();
    if (!actor) return;

    const { query, search, params } = match.match;
    await Promise.all([
      actor.loadComponent(),
      onlyComponentPreload
        ? null
        : actor.preload?.(this.options.preloadContext, params, {
            query,
            search,
          }),
    ]);
  }

  public async preloadCurrent({
    onlyComponentPreload = false,
  }: {
    onlyComponentPreload?: boolean;
  } = {}) {
    const matchedRoute = this.getCurrentMatch();
    if (!matchedRoute) return;

    await this.preloadRoute(matchedRoute, { onlyComponentPreload });
  }
}

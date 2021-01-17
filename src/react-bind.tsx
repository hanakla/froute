import React, {
  ComponentType,
  createContext,
  forwardRef,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
} from "react";
import qs from "querystring";
import { canUseDOM, DeepReadonly, isDevelopment } from "./utils";
import { RouteDefinition, ParamsOfRoute, StateOfRoute } from "./RouteDefiner";
import {
  NavigationListener,
  RouterContext,
  BeforeRouteListener,
} from "./RouterContext";
import { RouterEvents } from "./RouterEvents";
import { Location } from "history";

const useIsomorphicEffect = canUseDOM() ? useLayoutEffect : useEffect;

const Context = createContext<RouterContext | null>(null);
Context.displayName = "FrouteContext";

const checkExpectedRoute = (
  router: RouterContext,
  expectRoute?: RouteDefinition<any, any>,
  methodName?: string
) => {
  if (expectRoute && router.getCurrentMatch()?.route !== expectRoute) {
    console.warn(
      `Froute: Expected route and current route not matched in \`${methodName}\``
    );
  }
};

export const FrouteContext = ({
  router,
  children,
}: {
  router: RouterContext;
  children: ReactNode;
}) => {
  useIsomorphicEffect(() => {
    const observer: NavigationListener = async (location) => {
      window.scrollTo({
        left: location.state.__froute.scrollX,
        top: location.state.__froute.scrollY,
      });
    };

    router.observeRouteChanged(observer);
    return () => router.unobserveRouteChanged(observer);
  }, [router]);

  // Save scroll position
  useEffect(() => {
    let scrollTimerId: number;

    const handleScroll = () => {
      if (scrollTimerId) {
        clearTimeout(scrollTimerId);
      }

      scrollTimerId = (setTimeout(() => {
        const location = router.getCurrentLocation();
        if (!location) return;

        router.internalHistoryState = {
          scrollX: window.scrollX || window.pageXOffset,
          scrollY: window.scrollY || window.pageYOffset,
        };
      }, 150) as any) as number;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimerId);
    };
  }, []);

  return <Context.Provider value={router}>{children}</Context.Provider>;
};

/**
 * Do not expose to public API. It's Froute internal only hooks.
 * WHY: Protect direct router operating from Components.
 * If allow it, Router status can changed by anywhere and becomes unpredictable.
 */
export const useRouterContext = () => {
  const router = useContext(Context);
  if (!router) {
    throw new Error("FrouteContext must be placed of top of useRouter");
  }

  return router;
};

export const useRouteComponent = () => {
  const router = useRouterContext();
  const match = router.getCurrentMatch();
  const PageComponent = match?.route.getActor()?.cachedComponent;
  const [, rerender] = useReducer((s) => s + 1, 0);

  useIsomorphicEffect(() => {
    router.observeRouteChanged(rerender);
    return () => router.unobserveRouteChanged(rerender);
  }, [router, rerender]);

  useIsomorphicEffect(() => {
    router.observeRouteChanged(rerender);
    return () => router.unobserveRouteChanged(rerender);
  }, []);

  return useMemo(() => ({ PageComponent }), [match]);
};

export interface UseRouter {
  <R extends RouteDefinition<any, any> = any>(): NextCompatRouter<R>;
}

interface NextCompatRouter<R extends RouteDefinition<any, any>> {
  pathname: string;
  query: ParamsOfRoute<R> & { [key: string]: string | string[] };
  push: (url: string) => void;
  replace: (url: string) => void;
  prefetch: (url: string) => void;
  back: FrouteNavigator["back"];
  reload: () => void;
  events: RouterEvents;
}

/**
 * Next.js subset-compat router
 *
 * - URL Object is not supported in `push`, `replace` currentry
 * - `as` is not supported currentry
 * - `beforePopState` is not supported
 * - router.events
 */
export const useRouter: UseRouter = () => {
  const router = useRouterContext();
  const location = router.getCurrentLocation();
  const match = router.getCurrentMatch();
  const nav = useNavigation();

  return useMemo(
    () => ({
      pathname: location.pathname,
      query: {
        ...(match?.match.query as any),
        ...(match?.match.params as any),
      },
      push: (url: string) => nav.push(url),
      replace: (url: string) => nav.replace(url),
      prefetch: (url: string) => {
        const match = router.resolveRoute(url);

        if (match) {
          router.preloadRoute(
            match.route,
            match.match.params,
            match.match.query,
            { onlyComponentPreload: true }
          );
        }
      },
      back: nav.back,
      reload: () => window.location.reload(),
      events: router.events,
    }),
    [location, match]
  );
};

export type RouterProps = {
  router: ReturnType<typeof useRouter>;
};

export const withRouter = <P extends RouterProps>(
  Component: ComponentType<P>
): ComponentType<Omit<P, "router">> => {
  const WithRouter = forwardRef<any, any>((props, ref) => {
    const router = useRouter();
    return <Component {...props} ref={ref} router={router} />;
  });

  WithRouter.displayName = `WithRouter(${
    Component.displayName ?? (Component as any).name
  })`;

  return WithRouter;
};

export interface UseFrouteRouter {
  <R extends RouteDefinition<any, any> = any>(r?: R): FrouteRouter<R>;
}

interface FrouteRouter<R extends RouteDefinition<any, any>>
  extends NextCompatRouter<R> {
  location: Location<StateOfRoute<R>>;
  buildPath: BuildPath;
  historyState: {
    get: RouterContext["getHistoryState"];
    set: RouterContext["setHistoryState"];
  };
}

export const useFrouteRouter: UseFrouteRouter = <
  R extends RouteDefinition<any, any>
>(
  r?: R
): FrouteRouter<R> => {
  const router = useRouterContext();
  const nextCompatRouter = useRouter<R>();
  const location = useLocation<R>();

  if (isDevelopment) {
    checkExpectedRoute(router, r, "useLocation");
  }

  return useMemo(
    () => ({
      ...nextCompatRouter,
      location,
      buildPath,
      historyState: {
        get: router.getHistoryState,
        set: router.setHistoryState,
      },
    }),
    [location, buildPath]
  );
};

/** @deprecated Use `useFrouteRouter` instead */
export const useLocation = <R extends RouteDefinition<any, any>>(
  expectRoute?: R
) => {
  const router = useRouterContext();
  const location = router.getCurrentLocation();

  if (isDevelopment) {
    checkExpectedRoute(router, expectRoute, "useLocation");
  }

  return useMemo(
    () => ({
      key: location.key,
      pathname: location.pathname,
      search: location.search,
      query: qs.parse(location.search.slice(1) ?? ""),
      hash: location.hash,
      state: location.state.app as StateOfRoute<R>,
    }),
    [location.pathname, location.search, location.search]
  );
};

/** @deprecated Use `useFrouteRouter` instead */
export const useHistoryState = <
  R extends RouteDefinition<any, any> = RouteDefinition<any, any>
>(
  expectRoute?: R
): [
  getHistoryState: () => DeepReadonly<StateOfRoute<R>>,
  setHistoryState: (state: StateOfRoute<R>) => void
] => {
  const router = useRouterContext();

  if (isDevelopment) {
    checkExpectedRoute(router, expectRoute, "useHistoryState");
  }

  return useMemo(() => [router.getHistoryState, router.setHistoryState], []);
};

interface UseParams {
  (): { [param: string]: string | undefined };
  <T extends RouteDefinition<any, any>>(expectRoute?: T): ParamsOfRoute<T>;
}

export const useParams: UseParams = <
  T extends RouteDefinition<any, any> = RouteDefinition<any, any>
>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  expectRoute?: T
) => {
  const router = useRouterContext();
  const location = router.getCurrentLocation();
  const match = location ? router.resolveRoute(location.pathname) : null;

  if (isDevelopment) {
    checkExpectedRoute(router, expectRoute, "useParams");
  }

  return match ? (match.match.params as ParamsOfRoute<T>) : {};
};

export interface FrouteNavigator {
  push<R extends RouteDefinition<any, any>>(
    route: R,
    params: ParamsOfRoute<R>,
    extra?: {
      query?: { [key: string]: string | string[] };
      hash?: string;
      state?: StateOfRoute<R>;
    }
  ): void;
  push(pathname: string): void;
  replace<R extends RouteDefinition<any, any>>(
    route: R,
    params: ParamsOfRoute<R>,
    extra?: {
      query?: { [key: string]: string | string[] };
      hash?: string;
      state?: StateOfRoute<R>;
    }
  ): void;
  replace(pathname: string): void;
  back(): void;
  forward(): void;
}

/** @deprecated Use `useFrouteRouter` instead */
export const useNavigation = () => {
  const router = useRouterContext();
  const { buildPath } = useUrlBuilder();

  return useMemo<FrouteNavigator>(
    () => ({
      push: <R extends RouteDefinition<any, any>>(
        route: R | string,
        params: ParamsOfRoute<R> = {} as any,
        {
          query,
          hash = "",
          state,
        }: {
          query?: { [key: string]: string | string[] };
          hash?: string;
          state?: StateOfRoute<R>;
        } = {}
      ) => {
        const pathname =
          typeof route === "string" ? route : buildPath(route, params, query);

        const resolvedRoute =
          typeof route !== "string"
            ? route
            : router.resolveRoute(pathname + hash)?.route;
        if (!resolvedRoute) return;

        router.navigate(pathname + hash, {
          state,
          action: "PUSH",
        });
      },
      replace: <R extends RouteDefinition<any, any>>(
        route: R | string,
        params: ParamsOfRoute<R> = {} as any,
        {
          query,
          hash = "",
          state,
        }: {
          query?: { [key: string]: string | string[] };
          hash?: string;
          state?: StateOfRoute<R>;
        } = {}
      ) => {
        const pathname =
          typeof route === "string" ? route : buildPath(route, params, query);

        router.navigate(pathname + hash, {
          state,
          action: "REPLACE",
        });
      },
      back: () => router.history.back(),
      forward: () => router.history.forward(),
    }),
    [router, router.history]
  );
};

/** @deprecated Use `useFrouteRouter` instead */
export const useUrlBuilder = () => {
  const router = useRouterContext();
  return useMemo(
    () => ({
      buildPath: router.buildPath,
    }),
    [router]
  );
};

/** Handling */
export const useBeforeRouteChange = (
  /** Return Promise&lt;false&gt; | false to prevent route changing. This listener only one can be set at a time */
  beforeRouteListener: BeforeRouteListener
) => {
  const router = useRouterContext();

  useEffect(() => {
    router.setBeforeRouteChangeListener(beforeRouteListener);
    return () => router.clearBeforeRouteChangeListener();
  }, []);
};

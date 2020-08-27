import React, {
  createContext,
  useContext,
  ReactNode,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
  ComponentType,
} from "react";
import { RouteDefiner } from "./RouteDefiner";
import { canUseDOM } from "./utils";
import {
  Listener as LocationListener,
  createBrowserHistory,
  createMemoryHistory,
} from "history";
import { Match } from "path-to-regexp";

const useIsomorphicEffect = canUseDOM() ? useLayoutEffect : useEffect;

interface FrouteMatch {
  route: RouteDefiner<any>;
  match: Match;
}

interface RouterOptions {}

export class RouterContext {
  public status?: number = 200;
  // public pathname: string;
  private actor: ActorDef<any>;

  constructor(
    public currentPath: string,
    public routes: { [key: string]: RouteDefiner<any> }
  ) {}

  public matchedRoute(pathname: string): FrouteMatch | false {
    for (const route of Object.values(this.routes)) {
      const match = route.match(pathname);
      if (!match) continue;

      return {
        route,
        match,
      };
    }

    return false;
  }

  public setPath(pathname: string) {
    this.currentPath = pathname;
  }

  public async preloadCurrent(...preloadArgs: any[]) {
    const matchedRoute = this.matchedRoute(this.currentPath);
    if (!matchedRoute) return;

    const actor = matchedRoute.route.getActor();
    if (!actor) return;

    await actor.component();
    await actor.preload?.apply(null, preloadArgs);
  }
}

const Context = createContext<RouterContext | null>(null);
Context.displayName = "FrouteContext";

export const createRouterContext = (
  url: string,
  routes: { [key: string]: RouteDefiner<any> },
  options: RouterOptions
) => {
  return new RouterContext(url, routes, options);
};

export const FrouteContext = ({
  context,
  children,
}: {
  context: RouterContext;
  children: ReactNode;
}) => {
  const history = useMemo(
    () => (canUseDOM() ? createBrowserHistory({}) : createMemoryHistory({})),
    []
  );

  const currentPath = history.location.pathname;

  const handleChangeLocation: LocationListener = useCallback(
    (({ pathname, search, hash, state }, action) => {
      context.setPath(pathname);
    }) as LocationListener,
    []
  );

  useIsomorphicEffect(() => {
    const unlisten = history.listen(handleChangeLocation);
    return () => unlisten();
  });

  // Save scroll position
  useEffect(() => {
    let scrollTimerId: number;

    const handleScroll = () => {
      if (scrollTimerId) {
        clearTimeout(scrollTimerId);
      }

      scrollTimerId = (setTimeout(() => {
        // if (route) {
        history.replace(context.currentPath, {
          scrollX: window.scrollX || window.pageXOffset,
          scrollY: window.scrollY || window.pageYOffset,
        });
        // }
      }, 150) as any) as number;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimerId);
    };
  }, [route]);

  return <Context.Provider value={context}>{children}</Context.Provider>;
};

export const TestingFrouteContext = ({
  context,
  children,
}: {
  context: RouterContext;
  children: ReactNode;
}) => {};

export const useRoute = () => {
  return useContext(Context);
};

export const useLocation = () => {
  // const { status } = useRoute();
};

export const useParams = () => {};

export const route = (path: string): RouteDefiner<Exclude<"", "">> => {
  return new RouteDefiner(path);
};

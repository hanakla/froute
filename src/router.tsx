import {
  createContext,
  useContext,
  ReactNode,
  useLayoutEffect,
  useEffect,
  useMemo,
  useCallback,
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

type FrouteMatch = {
  route: RouteDefiner<any>;
  match: Match;
};

export class RouterContext {
  status?: number;

  constructor(
    public url: string,
    public routes: { [key: string]: RouteDefiner<any> }
  ) {}

  matchedRoute(pathname: string): FrouteMatch | false {
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

  async preload() {
    const matchedRoute = this.matchedRoute(this.url);
    if (!matchedRoute) return;

    const actor = matchedRoute.route.getActor();
    if (!actor) return;

    // let component: ComponentType<any>
    // if (typeof actor.component === 'function') {
    // component = await actor.component()
    return null;
  }
}

const Context = createContext<RouterContext>(null);
Context.displayName = "FrouteContext";

export const createRouterContext = (
  url: string,
  routes: { [key: string]: RouteDefiner<any> }
) => {
  return new RouterContext(url, routes);
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
      // if (state && state.fluerHandled) return
      // executeOperation(navigateOp, {
      //   type: action,
      //   url: pathname + search + hash,
      // })
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
        //   history.replace(route.url, {
        //     scrollX: window.scrollX || window.pageXOffset,
        //     scrollY: window.scrollY || window.pageYOffset,
        //   });
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
  const { status } = useRoute();
};

export const useParams = () => {};

export const route = (path: string): RouteDefiner<Exclude<"", "">> => {
  return new RouteDefiner(path);
};

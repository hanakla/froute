import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
} from "react";
import { Action } from "history";
import qs from "querystring";
import { canUseDOM } from "./utils";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";
import { RouterContext } from "./RouterContext";

const useIsomorphicEffect = canUseDOM() ? useLayoutEffect : useEffect;

const Context = createContext<RouterContext | null>(null);
Context.displayName = "FrouteContext";

export const FrouteContext = ({
  router,
  children,
}: {
  router: RouterContext;
  children: ReactNode;
}) => {
  const { history } = useMemo(() => router, []);

  useIsomorphicEffect(() => {
    const unlisten = history.listen(({ action, location }) => {
      router.navigate(location);
      if (action === Action.Push) router.preloadCurrent();
    });

    return () => unlisten();
  }, []);

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

        history.replace(location, {
          scrollX: window.scrollX || window.pageXOffset,
          scrollY: window.scrollY || window.pageYOffset,
        });
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
    router.observeFinishPreload(rerender);
    return () => router.unobserveFinishPreload(rerender);
  }, [router, rerender]);

  useIsomorphicEffect(() => {
    const unlisten = router.history.listen(({ action }) => {
      if (action === Action.Pop) {
        // TODO: Research dispatch timing
        setTimeout(() => rerender());
      }
    });
    return () => unlisten();
  }, []);

  return useMemo(() => ({ PageComponent }), [match]);
};

export const useLocation = () => {
  const router = useRouterContext();
  const location = router.getCurrentLocation();

  return useMemo(
    () => ({
      pathname: location?.pathname,
      search: location?.search,
      query: qs.parse(location?.search.slice(1) ?? ""),
      hash: location?.hash,
      state: location.state,
    }),
    [location?.pathname, location?.search, location?.search]
  );
};

interface UseParams {
  (): { [param: string]: string | undefined };
  <T extends RouteDefinition<any>>(route: T): ParamsOfRoute<T>;
}

export const useParams: UseParams = <
  T extends RouteDefinition<any> = RouteDefinition<any>
>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  route?: T
) => {
  const router = useRouterContext();
  const location = router.getCurrentLocation();
  const match = location ? router.resolveRoute(location.pathname) : null;

  return match ? (match.match.params as ParamsOfRoute<T>) : {};
};

export const useNavigation = () => {
  const router = useRouterContext();

  return useMemo(
    () => ({
      push: (path: string) => router.history.push(path),
      replace: (path: string) => router.history.replace(path),
      back: () => router.history.back(),
      forward: () => router.history.forward(),
    }),
    [router, router.history]
  );
};

export const useUrlBuilder = () => {
  const router = useRouterContext();
  return useMemo(
    () => ({
      buildPath: router.buildPath,
    }),
    [router]
  );
};

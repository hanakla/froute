import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  forwardRef,
  MouseEvent,
  useReducer,
} from "react";
import { Action } from "history";
import qs from "querystring";
import { canUseDOM } from "./utils";
import { parse as parseUrl } from "url";
import { RouteDefinition, ParamsOfRoute } from "./RouteDefiner";
import { RouterContext } from "./RouterContext";
import { useCallback } from "react";

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

const isRoutable = (href: string | undefined) => {
  const parsed = parseUrl(href ?? "");
  const current = parseUrl(location.href);

  if (!href) return false;
  if (href[0] === "#") return false;
  if (parsed.protocol && parsed.protocol !== current.protocol) return false;
  if (parsed.host && parsed.host !== location.host) return false;
  return true;
};

const isModifiedEvent = (event: MouseEvent) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export const Link = forwardRef<
  HTMLAnchorElement,
  React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
>((props, ref) => {
  const { push } = useNavigation();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (props.onClick) props.onClick(e);
      if (e.isDefaultPrevented()) return;
      if (!props.href) return;
      if (isModifiedEvent(e)) return;
      if (!isRoutable(props.href)) return;

      e.preventDefault();

      const parsed = parseUrl(props.href);

      push(
        (parsed.pathname || "") + (parsed.query || "") + (parsed.hash || "")
      );
    },
    [props.onClick, props.href]
  );

  return <a ref={ref} {...props} onClick={handleClick} />;
});

export const ResponseCode = ({
  status,
  children,
}: {
  status: number;
  children: ReactNode;
}) => {
  const router = useRouter();

  useMemo(() => {
    router.statusCode = status;
  }, []);

  return <>{children}</>;
};

export const Redirect: React.FC<{ url: string; status?: number }> = ({
  url,
  status = 302,
  children,
}) => {
  const router = useRouter();

  useMemo(() => {
    router.statusCode = status;
    router.redirectTo = url;
  }, []);

  return <>{children}</>;
};

export const useRouter = () => {
  const router = useContext(Context);
  if (!router) {
    throw new Error("FrouteContext must be placed of top of useRouter");
  }

  return router;
};

export const useRouteComponent = () => {
  const router = useRouter();
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
  const router = useRouter();
  const location = router.getCurrentLocation();

  return useMemo(
    () => ({
      pathname: location?.pathname,
      search: location?.search,
      query: qs.parse(location?.search.slice(1) ?? ""),
      hash: location?.hash,
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
  const router = useRouter();
  const location = router.getCurrentLocation();
  const match = location ? router.resolveRoute(location.pathname) : null;

  return match ? (match.match.params as ParamsOfRoute<T>) : {};
};

export const useNavigation = () => {
  const router = useRouter();

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
  const router = useRouter();
  return useMemo(
    () => ({
      buildPath: router.buildPath,
    }),
    [router]
  );
};

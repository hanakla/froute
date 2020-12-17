import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  forwardRef,
  MouseEvent,
} from "react";
import { Action } from "history";
import qs from "querystring";
import { canUseDOM } from "./utils";
import { parse as parseUrl } from "url";
import { IRoute, ParamsOfRoute } from "./RouteDefiner";
import { RouterContext } from "./RouterContext";
import { useCallback } from "react";

const useIsomorphicEffect = canUseDOM() ? useLayoutEffect : useEffect;

const Context = createContext<RouterContext | null>(null);
Context.displayName = "FrouteContext";

export const FrouteContext = ({
  context,
  children,
}: {
  context: RouterContext;
  children: ReactNode;
}) => {
  const { history } = useMemo(() => context, []);

  useIsomorphicEffect(() => {
    const unlisten = history.listen(({ action, location }) => {
      context.navigate(location);
      if (action === Action.Push) context.preloadCurrent();
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
        const location = context.getCurrentLocation();
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

  return <Context.Provider value={context}>{children}</Context.Provider>;
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

export const useRouter = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("FrouteContext must be placed of top of useRouter");
  }

  return context;
};

export const useRouteRender = () => {
  const context = useRouter();
  const match = context.getCurrentMatch();
  const PageComponent = match?.route.getActor()?.cachedComponent;

  return useMemo(() => ({ PageComponent }), [match]);
};

export const useLocation = () => {
  const context = useRouter();
  const location = context.getCurrentLocation();

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
  <T extends IRoute<any>>(route: T): ParamsOfRoute<T>;
}

export const useParams: UseParams = <T extends IRoute<any> = IRoute<any>>(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  route?: T
) => {
  const context = useRouter();
  const location = context.getCurrentLocation();
  const match = location ? context.resolveRoute(location.pathname) : null;

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
  const context = useRouter();
  return useMemo(
    () => ({
      buildPath: context.buildPath,
    }),
    []
  );
};

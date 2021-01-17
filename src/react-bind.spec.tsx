import React from "react";
import { expectType } from "tsd";
import { renderHook } from "@testing-library/react-hooks";
import { render, act } from "@testing-library/react";
import {
  FrouteContext,
  useBeforeRouteChange,
  useFrouteRouter,
  useHistoryState,
  useLocation,
  useNavigation,
  useParams,
  useRouteComponent,
  useRouter,
  useUrlBuilder,
} from "./react-bind";
import { RouteDefinition, routeOf } from "./RouteDefiner";
import { createRouter, RouterContext } from "./RouterContext";
import { waitTick } from "../spec/utils";
import { rescue } from "@hanakla/rescue";

describe("react-bind", () => {
  const routes = {
    usersShow: routeOf("/users/:id")
      .state(() => ({ hist: 1 }))
      .action({
        component: () => {
          const Component = () => {
            const params = useParams(routes.usersShow);
            return <div>I am user {params.id}</div>;
          };
          return new Promise((resolve) =>
            setTimeout(() => resolve(Component), 100)
          );
        },
      }),
    userArtworks: routeOf("/users/:id/artworks/:artworkId").action({
      component: () => {
        return () => {
          const params = useParams();
          return (
            <div>
              Here is Artwork {params.artworkId} for user {params.id}
            </div>
          );
        };
      },
    }),
  };

  const createWrapper = (router: RouterContext): React.FC => {
    return ({ children }) => (
      <FrouteContext router={router}>{children}</FrouteContext>
    );
  };

  const createAndRenderRouter = async <R extends RouteDefinition<any, any>>(
    url: string,
    expectRoute: R
  ) => {
    const router = createRouter(routes);
    await router.navigate(url);

    return renderHook(() => useFrouteRouter(expectRoute), {
      wrapper: createWrapper(router),
    });
  };

  describe("useRouter", () => {
    it("Should emit events", async () => {
      const router = createRouter({
        users: routeOf("/users/:id").action({
          component: () => () => null,
          preload: () => waitTick(500),
        }),
      });

      await router.navigate("/users/1");

      const { result } = renderHook(() => useRouter(), {
        wrapper: createWrapper(router),
      });

      const startSpy = jest.fn();
      result.current.events.on("routeChangeStart", startSpy);

      const completeSpy = jest.fn();
      result.current.events.on("routeChangeComplete", completeSpy);

      const promise = router.navigate("/users/2", { action: "PUSH" });
      await waitTick();
      expect(startSpy).toBeCalled();
      expect(completeSpy).not.toBeCalled();

      await promise;
      expect(completeSpy).toBeCalled();
    });

    it("Should capture error and emit event", async () => {
      const router = createRouter({
        error: routeOf("/error").action({
          component: () => () => null,
          preload: () => {
            throw new Error("ok");
          },
        }),
      });

      await router.navigate("/");

      const { result } = renderHook(() => useRouter(), {
        wrapper: createWrapper(router),
      });

      const errorSpy = jest.fn();
      result.current.events.on("routeChangeError", errorSpy);

      const [, error] = await rescue(() => {
        return router.navigate("/error", { action: "PUSH" });
      });

      expect(error).not.toEqual(null);
      expect(errorSpy).toBeCalled();
      expect(errorSpy.mock.calls[0][0]).toMatchObject({ message: "ok" });
    });
  });

  describe("useFrouteRouter", () => {
    it("location is passed correctly", async () => {
      const {
        result: { current },
      } = await createAndRenderRouter("/users/1?a=1#1", routes.usersShow);

      expect(current.location.pathname).toBe("/users/1");
      expect(current.location.search).toBe("?a=1");
      expect(current.location.hash).toBe("#1");
    });

    it("searchQuery passed correctly", async () => {
      const {
        result: { current },
      } = await createAndRenderRouter(
        "/users/1?a=1&b=2&b=3#1",
        routes.usersShow
      );

      expect(current.searchQuery).toMatchObject({ a: "1", b: ["2", "3"] });
    });

    it("should get / set history state correctly", async () => {
      const {
        result: { current },
      } = await createAndRenderRouter("/users/1", routes.usersShow);

      expect(current.historyState.get()).toMatchObject({ hist: 1 });

      const eventSpy = jest.fn();
      current.events.on("routeChangeStart", eventSpy);
      current.historyState.set({ hist: 2 });

      expect(current.historyState.get()).toMatchObject({ hist: 2 });
      expect(eventSpy).not.toBeCalled();
    });

    it("buildPath passed correctly", async () => {
      const {
        result: { current },
      } = await createAndRenderRouter("/users/1?a=1#1", routes.usersShow);

      expect(current.buildPath(routes.usersShow, { id: "1" })).toBe("/users/1");
    });

    it("Type inference check", async () => {
      const router = createRouter(routes);
      await router.navigate("/users/1");

      const {
        result: { current },
      } = renderHook(() => useFrouteRouter(routes.usersShow), {
        wrapper: createWrapper(router),
      });

      expectType<{ id: string }>(current.query);
      expectType<string | string[]>(current.query.some_query);
    });
  });

  describe("useRouteComponent", () => {
    it("test", async () => {
      const router = createRouter(routes);

      await act(async () => {
        await router.navigate("/users/1");
        await router.preloadCurrent();
      });

      const App = () => {
        const { PageComponent } = useRouteComponent();
        return PageComponent ? <PageComponent /> : null;
      };

      const result = render(<App />, { wrapper: createWrapper(router) });
      expect(result.container.innerHTML).toMatchInlineSnapshot(
        `"<div>I am user 1</div>"`
      );

      await act(async () => {
        await router.navigate("/users/1/artworks/2");
        await router.preloadCurrent();
      });

      result.rerender(<App />);

      expect(result.container.innerHTML).toMatchInlineSnapshot(
        `"<div>Here is Artwork 2 for user 1</div>"`
      );
    });
  });

  describe("useBeforeRouteChange", () => {
    it("", async () => {
      const routable = { current: () => false };

      const routes = {
        unloadHook: routeOf("/unloadhook").action({
          component: () => () => {
            useBeforeRouteChange(() => routable.current(), []);
            return null;
          },
        }),
      };

      const router = createRouter(routes);
      await router.navigate("/unloadhook", { action: "PUSH" });

      const App = () => {
        const { PageComponent } = useRouteComponent();
        return PageComponent ? <PageComponent /> : null;
      };

      render(<App />, { wrapper: createWrapper(router) });

      routable.current = () => false;
      await act(() => router.navigate("/", { action: "PUSH" }));
      expect(router.getCurrentLocation().pathname).toBe("/unloadhook");

      routable.current = () => true;
      await act(() => router.navigate("/", { action: "PUSH" }));
      expect(router.getCurrentLocation().pathname).toBe("/");
    });
  });

  describe("deprecated hooks", () => {
    describe("useLocation", () => {
      it("Should correctry parsed complex url", async () => {
        const router = createRouter(routes);
        await router.navigate("/users/1?q=1#hash");

        const result = renderHook(() => useLocation(), {
          wrapper: createWrapper(router),
        });

        expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "#hash",
          "key": "",
          "pathname": "/users/1",
          "query": Object {
            "q": "1",
          },
          "search": "?q=1",
          "state": Object {
            "hist": 1,
          },
        }
      `);
      });

      it("in 404, returns location and empty query", async () => {
        const router = createRouter(routes);
        await router.navigate("/notfound");

        const result = renderHook(() => useLocation(), {
          wrapper: createWrapper(router),
        });

        expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "",
          "key": "",
          "pathname": "/notfound",
          "query": Object {},
          "search": "",
          "state": null,
        }
      `);
      });
    });

    describe("useHistoryState", () => {
      it("get / set", async () => {
        const router = createRouter(routes);
        await router.navigate("/users");

        const {
          result: {
            current: [get, set],
          },
          rerender,
        } = renderHook(() => useHistoryState(routes.usersShow), {
          wrapper: createWrapper(router),
        });

        expect(get()).toMatchInlineSnapshot(`null`);

        set({ hist: 1 });
        rerender();

        expect(get()).toMatchInlineSnapshot(`
        Object {
          "hist": 1,
        }
      `);
      });

      it("Logging if expected route isnt match", async () => {
        jest.mock("./utils", () => ({
          isDevelopment: true,
          canUseDom: () => true,
        }));

        const router = createRouter(routes);
        await router.navigate("/users");

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
        renderHook(() => useHistoryState(routes.userArtworks), {
          wrapper: createWrapper(router),
        });

        expect(spy.mock.calls.length).toBe(1);
      });
    });

    describe("useParams", () => {
      it("test", async () => {
        const router = createRouter(routes);

        await router.navigate("/users/1");
        const result = renderHook(
          () => {
            return useParams(routes.usersShow);
          },
          {
            wrapper: createWrapper(router),
          }
        );

        expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "id": "1",
        }
      `);

        await router.navigate("/users/1/artworks/1");
        result.rerender();

        expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "artworkId": "1",
          "id": "1",
        }
      `);
      });
    });

    describe("useNavigation", () => {
      it("", async () => {
        const router = createRouter(routes);
        await router.navigate("/users/1");

        const { result } = renderHook(useNavigation, {
          wrapper: createWrapper(router),
        });

        result.current.push(routes.usersShow, { id: "2" });
        await waitTick(200);

        expect(router.getCurrentLocation()).toMatchObject({
          hash: "",
          pathname: "/users/2",
          search: "",
          state: {
            __froute: {
              scrollX: 0,
              scrollY: 0,
            },
            app: { hist: 1 },
          },
        });

        expect(location.href).toMatchInlineSnapshot(
          `"http://localhost/users/2"`
        );

        result.current.push(routes.userArtworks, { id: "1", artworkId: "2" });
        await waitTick(200);

        expect(router.getCurrentLocation()).toMatchObject({
          hash: "",
          pathname: "/users/1/artworks/2",
          search: "",
          state: {
            __froute: {
              scrollX: 0,
              scrollY: 0,
            },
            app: null,
          },
        });

        expect(location.href).toMatchInlineSnapshot(
          `"http://localhost/users/1/artworks/2"`
        );
      });
    });

    describe("useUrlBuilder", () => {
      const router = createRouter(routes);

      const { result } = renderHook(useUrlBuilder, {
        wrapper: createWrapper(router),
      });

      expect(
        result.current.buildPath(routes.usersShow, { id: "1" })
      ).toMatchInlineSnapshot(`"/users/1"`);
    });
  });
});

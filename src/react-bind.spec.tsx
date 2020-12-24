import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render, act } from "@testing-library/react";
import {
  FrouteContext,
  useHistoryState,
  useLocation,
  useNavigation,
  useParams,
  useRouteComponent,
  useUrlBuilder,
} from "./react-bind";
import { routeOf } from "./RouteDefiner";
import { createRouterContext, RouterContext } from "./RouterContext";

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

  describe("useLocation", () => {
    it("Should correctry parsed complex url", () => {
      const router = createRouterContext(routes);
      router.navigate("/users/1?q=1#hash");

      const result = renderHook(() => useLocation(), {
        wrapper: createWrapper(router),
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "#hash",
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

    it("in 404, returns location and empty query", () => {
      const router = createRouterContext(routes);
      router.navigate("/notfound");

      const result = renderHook(() => useLocation(), {
        wrapper: createWrapper(router),
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "",
          "pathname": "/notfound",
          "query": Object {},
          "search": "",
          "state": null,
        }
      `);
    });
  });

  describe("useHistoryState", () => {
    it("get / set", () => {
      const router = createRouterContext(routes);
      router.navigate("/users");

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

    it("Logging if expected route isnt match", () => {
      jest.mock("./utils", () => ({
        isDevelopment: true,
        canUseDom: () => true,
      }));

      const router = createRouterContext(routes);
      router.navigate("/users");

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(
        () => useHistoryState(routes.userArtworks),
        { wrapper: createWrapper(router) }
      );

      expect(spy.mock.calls.length).toBe(1);
    });
  });

  describe("useParams", () => {
    it("test", () => {
      const router = createRouterContext(routes);

      router.navigate("/users/1");
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

      router.navigate("/users/1/artworks/1");
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
    it("", () => {
      const router = createRouterContext(routes);
      router.navigate("/users/1");

      const { result } = renderHook(useNavigation, {
        wrapper: createWrapper(router),
      });

      result.current.push(routes.usersShow, { id: "2" });

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

      expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/2"`);

      result.current.push(routes.userArtworks, { id: "1", artworkId: "2" });

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

  describe("useRouteComponent", () => {
    it("test", async () => {
      const router = createRouterContext(routes);

      await act(async () => {
        router.navigate("/users/1");
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
        router.navigate("/users/1/artworks/2");
        await router.preloadCurrent();
      });

      result.rerender(<App />);

      expect(result.container.innerHTML).toMatchInlineSnapshot(
        `"<div>Here is Artwork 2 for user 1</div>"`
      );
    });
  });

  describe("useUrlBuilder", () => {
    const router = createRouterContext(routes);

    const { result } = renderHook(useUrlBuilder, {
      wrapper: createWrapper(router),
    });

    expect(
      result.current.buildPath(routes.usersShow, { id: "1" })
    ).toMatchInlineSnapshot(`"/users/1"`);
  });
});

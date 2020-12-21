import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render, act } from "@testing-library/react";
import {
  FrouteContext,
  useLocation,
  useNavigation,
  useParams,
  useRouteComponent,
  useUrlBuilder,
} from "./react-bind";
import { routeBy } from "./RouteDefiner";
import { createRouterContext, RouterContext } from "./RouterContext";

describe("react-bind", () => {
  const routes = {
    usersShow: routeBy("/users")
      .param("id")
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
    userArtworks: routeBy("/users")
      .param("id")
      .path("artworks")
      .param("artworkId")
      .action({
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

  describe("Link", () => {
    it("Click to move location", async () => {
      const router = createRouterContext(routes);
      const spy = jest.spyOn(router, "navigate");

      const result = render(
        <Link data-testid="link" href="/users/1">
          Link
        </Link>,
        { wrapper: createWrapper(router) }
      );

      expect(location.href).toMatchInlineSnapshot(`"http://localhost/"`);

      const link = await result.findByTestId("link");
      link.click();

      expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/1"`);
      expect(spy.mock.calls.length).toBe(1);

      link.click();
      expect(spy.mock.calls.length).toBe(2);
    });
  });

  describe("useLocation", () => {
    it("Should correctry parsed complex url", () => {
      const router = createRouterContext(routes);
      router.navigate("/users/1?q=1#hash");

      const result = renderHook(useLocation, {
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
          "state": null,
        }
      `);
    });

    it("in 404, returns location and empty query", () => {
      const router = createRouterContext(routes);
      router.navigate("/notfound");

      const result = renderHook(useLocation, {
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

      const { result, rerender } = renderHook(useNavigation, {
        wrapper: createWrapper(router),
      });

      result.current.push(router.buildPath(routes.usersShow, { id: "2" }));

      expect(router.getCurrentLocation()).toMatchObject({
        hash: "",
        pathname: "/users/2",
        search: "",
        state: null,
      });

      expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/2"`);

      result.current.push(
        router.buildPath(routes.userArtworks, { id: "1", artworkId: "2" })
      );

      expect(router.getCurrentLocation()).toMatchObject({
        hash: "",
        pathname: "/users/1/artworks/2",
        search: "",
        state: null,
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

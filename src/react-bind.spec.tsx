import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { render } from "@testing-library/react";
import {
  FrouteContext,
  Link,
  useLocation,
  useNavigation,
  useParams,
  useRouteRender,
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
            const params = useParams();
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

  const createWrapper = (context: RouterContext): React.FC => {
    return ({ children }) => (
      <FrouteContext context={context}>{children}</FrouteContext>
    );
  };

  describe("Link", () => {
    it("Click to move location", async () => {
      const context = createRouterContext(routes);
      const spy = jest.spyOn(context, "navigate");

      const result = render(
        <Link data-testid="link" href="/users/1">
          Link
        </Link>,
        { wrapper: createWrapper(context) }
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
    it("Should return parameters", () => {
      const context = createRouterContext(routes);
      context.navigate("/users/1?q=1#hash");

      const result = renderHook(useLocation, {
        wrapper: createWrapper(context),
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "#hash",
          "pathname": "/users/1",
          "query": Object {
            "q": "1",
          },
          "search": "?q=1",
        }
      `);
    });

    it("Should return parameters", () => {
      const context = createRouterContext(routes);
      context.navigate("/users/1");

      const result = renderHook(useLocation, {
        wrapper: createWrapper(context),
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "",
          "pathname": "/users/1",
          "query": Object {},
          "search": "",
        }
      `);
    });

    it("in 404, returns location and empty query", () => {
      const context = createRouterContext(routes);
      context.navigate("/notfound");

      const result = renderHook(useLocation, {
        wrapper: createWrapper(context),
      });

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "hash": "",
          "pathname": "/notfound",
          "query": Object {},
          "search": "",
        }
      `);
    });
  });

  describe("useParams", () => {
    it("test", () => {
      const context = createRouterContext(routes);

      context.navigate("/users/1");
      const result = renderHook(
        () => {
          return useParams(routes.usersShow);
        },
        {
          wrapper: createWrapper(context),
        }
      );

      expect(result.result.current).toMatchInlineSnapshot(`
        Object {
          "id": "1",
        }
      `);

      context.navigate("/users/1/artworks/1");
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
      const context = createRouterContext(routes);
      context.navigate("/users/1");

      const { result, rerender } = renderHook(useNavigation, {
        wrapper: createWrapper(context),
      });

      result.current.push(context.buildPath(routes.usersShow, { id: "2" }));

      expect(context.getCurrentLocation()).toMatchObject({
        hash: "",
        pathname: "/users/2",
        search: "",
        state: null,
      });

      expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/2"`);

      result.current.push(
        context.buildPath(routes.userArtworks, { id: "1", artworkId: "2" })
      );

      expect(context.getCurrentLocation()).toMatchObject({
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

  describe("useRouteRender", () => {
    it("test", async () => {
      const context = createRouterContext(routes);
      context.navigate("/users/1");
      await context.preloadCurrent();

      const App = () => {
        const { PageComponent } = useRouteRender();
        return PageComponent ? <PageComponent /> : null;
      };

      const result = render(<App />, { wrapper: createWrapper(context) });
      expect(result.container.innerHTML).toMatchInlineSnapshot(
        `"<div>I am user 1</div>"`
      );

      context.navigate("/users/1/artworks/2");
      await context.preloadCurrent();
      result.rerender(<App />);

      expect(result.container.innerHTML).toMatchInlineSnapshot(
        `"<div>Here is Artwork 2 for user 1</div>"`
      );
    });
  });
});

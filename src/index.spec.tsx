import React from "react";
import { render } from "@testing-library/react";
import {
  createRouterContext,
  routeBy,
  useRouteRender,
  Link,
  FrouteContext,
  useUrlBuilder,
  RouterOptions,
} from "./";

describe("Usage", () => {
  // Mock of external context likes fleur context or redux store
  const externalContext = {
    foo: async (message: string) => {
      console.log(`hi ${message}`);
    },
  };

  type PreloadContext = { store: typeof externalContext };

  // Define routes
  const routes = {
    usersShow: routeBy("/users")
      .param("id")
      .action({
        // Expecting dynamic import
        component: async () => () => {
          const { buildPath } = useUrlBuilder();

          return (
            <div>
              Here is UserShow
              {/* 👇 froute's Link automatically use history navigation and fire preload */}
              <Link href={buildPath(routes.usersShow, { id: "1" })}>A</Link>
            </div>
          );
        },

        // Expecting API call
        preload: async ({ store }: PreloadContext, params, query) =>
          Promise.all([
            new Promise((resolve) => setTimeout(resolve, 100)),
            store.foo(params.id),
          ]),
      }),
  };

  const routerOptions: RouterOptions = {
    // Passing Fleur context or Redux store to preload function
    preloadContext: { store: externalContext },
  };

  it("Routing", async () => {
    const reqUrl = "/users/1";
    const router = createRouterContext(routes, routerOptions);

    router.navigate(reqUrl);
    await router.preloadCurrent();
  });

  it("In React", async () => {
    const router = createRouterContext(routes, routerOptions);
    router.navigate("/users/1");
    await router.preloadCurrent();

    const App = () => {
      // Get preloaded Page component
      const { PageComponent } = useRouteRender();
      return <div id="app">{PageComponent ? <PageComponent /> : null}</div>;
    };

    const result = render(
      <FrouteContext router={router}>
        <App />
      </FrouteContext>
    );

    expect(result.container.innerHTML).toMatchInlineSnapshot(
      `"<div id=\\"app\\"><div>Here is UserShow<a href=\\"/users/1\\">A</a></div></div>"`
    );
  });

  it("Building", async () => {
    const router = createRouterContext(routes, routerOptions);
    router.buildPath(routes.usersShow, { id: "1" });
  });
});

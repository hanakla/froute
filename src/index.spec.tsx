import React from "react";
import { render } from "@testing-library/react";
import {
  createRouter,
  routeOf,
  useRouteComponent,
  FrouteLink,
  FrouteContext,
  RouterOptions,
} from "./";
import { ResponseCode } from "./components/ResponseCode";
import { useHistoryState } from "./react-bind";

describe("Usage", () => {
  // Mock of external context likes fleur context or redux store
  const externalContext = {
    foo: async (message: string, word: string) => {
      // fetch API
      message;
      word;
    },
  };

  type PreloadContext = { store: typeof externalContext };

  // Define routes
  const routes = {
    usersShow: routeOf("/users/:id").action({
      // Expecting dynamic import
      component: async () => () => {
        return (
          <div>
            Here is UserShow
            {/* 👇 froute's Link automatically use history navigation and fire preload */}
            <FrouteLink to={routes.usersShow} params={{ id: "1" }}>
              A
            </FrouteLink>
          </div>
        );
      },

      // Expecting API call
      preload: async ({ store }: PreloadContext, params, query) =>
        Promise.all([
          new Promise((resolve) => setTimeout(resolve, 100)),
          store.foo(params.id, query.word as string),
        ]),
    }),
  };

  const routerOptions: RouterOptions = {
    // Passing Fleur context or Redux store to preload function
    preloadContext: { store: externalContext },
  };

  it("Routing", async () => {
    const reqUrl = "/users/1";
    const router = createRouter(routes, routerOptions);

    await router.navigate(reqUrl);
    await router.preloadCurrent();
  });

  it("In React", async () => {
    const router = createRouter(routes, routerOptions);
    await router.navigate("/users/1");
    await router.preloadCurrent();

    const App = () => {
      // Get preloaded Page component
      const { PageComponent } = useRouteComponent();

      // Use history state
      const [getHistoryState, setHistoryState] = useHistoryState(
        routes.usersShow
      );

      return (
        <div id="app">
          {PageComponent ? <PageComponent /> : <ResponseCode status={404} />}
        </div>
      );
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

  it("Building URL", async () => {
    const router = createRouter(routes, routerOptions);
    router.buildPath(routes.usersShow, { id: "1" });
  });
});

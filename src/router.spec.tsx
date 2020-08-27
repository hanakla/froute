import { route, FrouteContext, createRouterContext, useRoute } from "./router";

describe("router", () => {
  const routes = {
    index: route("/"),
  };

  it("", async () => {
    const routerContext = createRouterContext("/", routes);
    await routerContext.preloadCurrent();

    const App = () => {
      const { renderRoute } = useRoute();
      return <div>{renderRoute()}</div>;
    };

    <FrouteContext context={routerContext}>
      <App />
    </FrouteContext>;
  });
});

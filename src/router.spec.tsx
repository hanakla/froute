import { route, FrouteContext, createRouterContext } from "./router";

describe("router", () => {
  const routes = {
    index: route("/"),
  };

  it("", async () => {
    const context = createRouterContext("/", routes);
    await context.preload();

    const App = () => {
      //   useRouter();
    };

    <FrouteContext context={context}></FrouteContext>;
  });
});

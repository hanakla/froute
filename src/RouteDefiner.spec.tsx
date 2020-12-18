import { routeBy } from "./RouteDefiner";

describe("RouteDefiner", () => {
  type ExteranalContext = { hi: "hi" };

  it("it's run", () => {
    expect(() => {
      const routes = {
        index: routeBy("/")
          .param("id")
          .action({
            component: () => () => null,
            preload: async (context, params, query) => {
              console.log(context.hi);
            },
          }),
      };
    }).not.toThrow();
  });
});

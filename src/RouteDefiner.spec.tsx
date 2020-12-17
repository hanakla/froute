import { routeBy } from "./RouteDefiner";

describe("RouteDefiner", () => {
  type ExteranalContext = { hi: "hi" };

  it("it's run", () => {
    expect(() => {
      const routes = {
        index: routeBy("/").action({
          component: () => () => null,
          preload: async (context: ExteranalContext) => {
            console.log(context.hi);
          },
        }),
      };
    }).not.toThrow();
  });
});

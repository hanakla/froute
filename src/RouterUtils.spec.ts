import { routeOf } from "./RouteDefiner";
import { createRouter } from "./RouterContext";
import { combineRouteResolver } from "./RouterUtils";
import { FrouteMatch } from "./routing";

describe("RouterUtils", () => {
  const routes = {
    users: routeOf("/users/:userId"),
  };

  describe(combineRouteResolver.name, () => {
    it("Should call to second resolver and reject routing", () => {
      const spy = jest.fn((): FrouteMatch<any> | false | null => false);
      const spy2 = jest.fn((): FrouteMatch<any> | false | null => null);

      const resolver = combineRouteResolver(spy, spy2);
      const router = createRouter(routes, { resolver });

      expect(router.resolveRoute("/users/1")).toBe(null);
      expect(spy.mock.calls.length).toBe(1);
      expect(spy2.mock.calls.length).toBe(1);
    });
  });
});

import { routeOf } from "./RouteDefiner";
import { matchByRoutes } from "./routing";

describe("routing", () => {
  const routes = {
    users: routeOf("/users/:userId"),
  };

  describe("matchByRoutes", () => {
    it("Should match", () => {
      const match = matchByRoutes("/users/1", routes);
      expect(match).not.toBe(null);
    });
  });
});

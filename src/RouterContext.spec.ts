import { routeBy } from "./RouteDefiner";
import { RouterContext } from "./RouterContext";

describe("Router", () => {
  const routes = {
    usersShow: routeBy("/users").param("id"),
  };

  describe("navigate", () => {
    it("Should route to usersShow by string URL", () => {
      const context = new RouterContext(routes);
      context.navigate("/users/1?a=1#1");

      const match = context.getCurrentMatch();

      expect(match).not.toBe(false);
      if (!match) return;

      expect(match.route).toBe(routes.usersShow);
      expect(context.getCurrentLocation()).toMatchInlineSnapshot(`
        Object {
          "hash": "#1",
          "key": "",
          "pathname": "/users/1",
          "search": "?a=1",
          "state": null,
        }
      `);
    });

    it("Should route to usersShow by location", () => {
      const context = new RouterContext(routes);

      context.navigate({
        pathname: "/users/1",
        search: "?a=1",
        hash: "#1",
        state: null,
        key: "1",
      });

      const match = context.getCurrentMatch();

      expect(match).not.toBe(false);
      if (!match) return;

      expect(match.route).toBe(routes.usersShow);
      expect(context.getCurrentLocation()).toMatchInlineSnapshot(`
        Object {
          "hash": "#1",
          "key": "1",
          "pathname": "/users/1",
          "search": "?a=1",
          "state": null,
        }
      `);
    });
  });
});

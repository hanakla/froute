import { routeBy } from "./RouteDefiner";
import {
  combineRouteResolver,
  RouterContext,
  RouterOptions,
} from "./RouterContext";

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

  describe("resolveRoute", () => {
    describe("Edge cases", () => {
      it("dotdot", () => {
        const router = new RouterContext(routes);
        const result = router.resolveRoute("/users/../");
      });
    });
  });

  describe("Custom route resolution", () => {
    const options: RouterOptions = {
      resolver: combineRouteResolver(
        function resolveI18nRoute(pathname, _, context) {
          // I18n path resolve
          const matches = /^\/(?<lang>\w+)(?<path>\/?.*)/.exec(pathname);
          const { lang, path } = matches?.groups ?? {};
          // When langage not found, skip this resolve and run next resolver
          // (Return the `false` to skip to next resolver in combineRouteResolver)
          if (!["en", "ja"].includes(lang)) return false;

          const match = context.resolveRoute(path);
          return match;
        },
        function resolveUserAlias(pathname, match, context) {
          // Alias route (Redirect)
          const [, uid] = /^\/u\/(\d+)/.exec(pathname) ?? [];

          if (uid) {
            context.statusCode = 302;
            context.redirectTo = context.buildPath(routes.usersShow, {
              id: uid,
            });

            // Return the `null` to unmatch any route
            return null;
          }

          return match;
        }
      ),
    };

    describe("Redirection", () => {
      it("Should alias path to real route", () => {
        const router = new RouterContext(routes, options);

        router.navigate("/u/1");
        expect(router.statusCode).toBe(302);
        expect(router.redirectTo).toBe("/users/1");
        expect(router.getCurrentMatch()).toBe(null);
      });
    });

    describe("Language specified route", () => {
      it("Should resolve language specified pathname", () => {
        const router = new RouterContext(routes, options);

        router.navigate("/ja/users/1");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/1"`
        );

        router.navigate("/en/users/2");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/2"`
        );
      });

      it("Should ignore no language specified pathname", () => {
        const router = new RouterContext(routes, options);

        router.navigate("/users/2");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/2"`
        );
      });
    });
  });
});

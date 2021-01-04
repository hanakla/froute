import { buildPath } from "./builder";
import { routeOf } from "./RouteDefiner";
import { createRouter, RouterContext, RouterOptions } from "./RouterContext";
import { combineRouteResolver } from "./RouterUtils";

describe("Router", () => {
  const routes = {
    usersShow: routeOf("/users/:id").state(() => ({ hist: "default" })),
  };

  describe("navigate", () => {
    it("Should route to usersShow by string URL", async () => {
      const router = new RouterContext(routes);
      await router.navigate("/users/1?a=1#1");

      const match = router.getCurrentMatch();

      expect(match).not.toBe(false);
      if (!match) return; // Type guard

      expect(match.route).toBe(routes.usersShow);
      expect(match.match).toMatchObject({
        params: { id: "1" },
        path: "/users/1",
        query: { a: "1" },
        search: "?a=1",
      });

      expect(router.getCurrentLocation()).toMatchObject({
        hash: "#1",
        pathname: "/users/1",
        search: "?a=1",
      });
      expect(router.getCurrentLocation().state.app).toMatchInlineSnapshot(`
        Object {
          "hist": "default",
        }
      `);
    });

    it("Should route to usersShow by location", async () => {
      const router = new RouterContext(routes);

      await router.navigate({
        pathname: "/users/1",
        search: "?a=1",
        hash: "#1",
        state: null,
      });

      const match = router.getCurrentMatch();

      expect(match).not.toBe(false);
      if (!match) return;

      expect(match.route).toBe(routes.usersShow);
      expect(router.getCurrentLocation()).toMatchObject({
        pathname: "/users/1",
        search: "?a=1",
        hash: "#1",
      });
      expect(router.getCurrentLocation().state.app).toMatchInlineSnapshot(`
        Object {
          "hist": "default",
        }
      `);
    });
  });

  describe("History State", () => {
    it("check", async () => {
      const router = createRouter(routes);
      await router.navigate("/users/1");
      router.setHistoryState({ user1: "ok" });

      expect(router.getHistoryState().user1).toBe("ok");

      await router.navigate("/users/2", { state: { user2: "ok" } });
      expect(router.getHistoryState().user2).toBe("ok");
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
            context.redirectTo = buildPath(routes.usersShow, {
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
      it("Should alias path to real route", async () => {
        const router = new RouterContext(routes, options);

        await router.navigate("/u/1");
        expect(router.statusCode).toBe(302);
        expect(router.redirectTo).toBe("/users/1");
        expect(router.getCurrentMatch()).toBe(null);
      });
    });

    describe("Language specified route", () => {
      it("Should resolve language specified pathname", async () => {
        const router = new RouterContext(routes, options);

        await router.navigate("/ja/users/1");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/1"`
        );

        await router.navigate("/en/users/2");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/2"`
        );
      });

      it("Should ignore no language specified pathname", async () => {
        const router = new RouterContext(routes, options);

        await router.navigate("/users/2");
        expect(router.getCurrentMatch()?.match.path).toMatchInlineSnapshot(
          `"/users/2"`
        );
      });
    });
  });
});

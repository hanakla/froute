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

    it.each([
      [
        "not",
        "after reloading",
        {
          sameSession: false,
          calledTimes: 2 /* if invalid implementation, it to be 1 */,
        },
      ],
      [
        "be",
        "on same session",
        {
          sameSession: true,
          calledTimes: 2 /* if invalid implementation, it to be 3 */,
        },
      ],
    ])(
      "Should %s preload on popstate %s",
      async (_, __, { sameSession, calledTimes }) => {
        const preloadSpy = vi.fn();
        const router = createRouter({
          users: routeOf("/users/:id").action({
            component: () => () => null,
            preload: preloadSpy,
          }),
        });

        if (sameSession) {
          await router.navigate("/users/2", { action: "PUSH" });
        } else {
          // Make non froute handled state emulates reload
          history.pushState(null, "", "/users/2");
        }

        await router.navigate("/users/1", { action: "PUSH" });

        router.history.back();
        await new Promise<void>((r) => setTimeout(r, 100));

        expect(preloadSpy).toBeCalledTimes(calledTimes);
      }
    );
  });

  describe("Prevent routing", () => {
    it("on push(navigate)", async () => {
      const router = createRouter(routes);
      await router.navigate("/users/1");

      // Prevent
      const preventSpy = vi.fn(() => false);
      router.setBeforeRouteChangeListener(preventSpy);
      await router.navigate("/users/2", { action: "PUSH" });

      expect(preventSpy).toBeCalledTimes(1);
      expect(router.getCurrentLocation().pathname).toBe("/users/1");
      router.clearBeforeRouteChangeListener();

      // Navigate
      const allowSpy = vi.fn(() => true);
      router.setBeforeRouteChangeListener(allowSpy);
      await router.navigate("/users/2", { action: "PUSH" });

      expect(allowSpy).toBeCalledTimes(1);
      expect(router.getCurrentLocation().pathname).toBe("/users/2");
    });

    it("on popstate", async () => {
      const router = createRouter(routes);

      await router.navigate("/users/1", { action: "PUSH" });
      await router.navigate("/users/2", { action: "PUSH" });

      const preventSpy = vi.fn(() => false);
      router.setBeforeRouteChangeListener(preventSpy);

      history.back();
      await new Promise((r) => setTimeout(r, /* Allows under */ 20));

      expect(preventSpy).toBeCalledTimes(1);
      expect(router.getCurrentLocation().pathname).toBe("/users/2");
      router.clearBeforeRouteChangeListener();

      const allowSpy = vi.fn(() => /* allow transition is */ true);
      router.setBeforeRouteChangeListener(allowSpy);

      history.back();
      await new Promise((r) => setTimeout(r, /* Allows under */ 20));
      expect(allowSpy).toBeCalledTimes(1);
      expect(router.getCurrentLocation().pathname).toBe("/users/1");

      router.setBeforeRouteChangeListener(allowSpy);
      history.forward();
      await new Promise((r) => setTimeout(r, /* Allows under */ 20));
      expect(allowSpy).toBeCalledTimes(2);
      expect(router.getCurrentLocation().pathname).toBe("/users/2");

      router.dispose();
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

        // Basically, the browser will take care of it.
        expect(result!.match.params.id).toBe("..");
        expect(result!.route).toBe(routes.usersShow);
      });

      it("# in fragment", () => {
        const router = new RouterContext(routes);
        const result = router.resolveRoute("/users/%23sharp");

        expect(result!.match.params.id).toBe("#sharp");
        expect(result!.route).toBe(routes.usersShow);
      });
    });
  });

  describe("preload", () => {
    it("should receive params correctly", async () => {
      const preloadSpy = vi.fn();

      const routes = {
        users: routeOf("/users/:id").action({
          component: () => () => null,
          preload: preloadSpy,
        }),
      };

      const router = new RouterContext(routes, { preloadContext: "hello" });
      await router.navigate("/users/1?q1=aaa", { action: "PUSH" });

      expect(preloadSpy).toBeCalledWith(
        "hello",
        expect.objectContaining({
          id: "1",
        }),
        expect.objectContaining({ query: { q1: "aaa" }, search: "?q1=aaa" })
      );
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

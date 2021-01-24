// import { route } from "./index";
import { buildPath } from "./builder";
import { routeOf } from "./RouteDefiner";

describe("index", () => {
  describe("buildPath", () => {
    it("Should build path", () => {
      const def = routeOf("/users/:id").action({ component: () => () => null });
      const def2 = routeOf("/users/:id/comments/:commentId").action({
        component: () => () => null,
      });

      expect(buildPath(def, { id: "1" })).toBe("/users/1");
      expect(buildPath(def2, { id: "1", commentId: "2" })).toBe(
        "/users/1/comments/2"
      );
    });

    it("should encode URI cmponent", () => {
      const route = routeOf("/search/:tag/:frag").action({
        component: () => () => null,
      });

      const path = buildPath(
        route,
        {
          tag: "うちの子",
          frag: "かわいい",
        },
        { ans: "そうだぞ" }
      );

      expect(path).toMatchInlineSnapshot(
        `"/search/%E3%81%86%E3%81%A1%E3%81%AE%E5%AD%90/%E3%81%8B%E3%82%8F%E3%81%84%E3%81%84?ans=%E3%81%9D%E3%81%86%E3%81%A0%E3%81%9E"`
      );
      expect(decodeURIComponent(path)).toMatchInlineSnapshot(
        `"/search/うちの子/かわいい?ans=そうだぞ"`
      );
    });

    it("Should serialize array query", () => {
      const def = routeOf("/users/:userId");

      expect(
        buildPath(def, { userId: "1" }, { q: ["a", "b"] })
      ).toMatchInlineSnapshot(`"/users/1?q=a&q=b"`);
    });

    it("should accept raw query string", () => {
      const def = routeOf("/users/:userId");

      expect(
        buildPath(def, { userId: "1" }, "hello-query-string")
      ).toMatchInlineSnapshot(`"/users/1?hello-query-string"`);

      expect(buildPath(def, { userId: "1" }, "")).toMatchInlineSnapshot(
        `"/users/1"`
      );
    });
  });
});

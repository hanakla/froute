// import { route } from "./index";
import { buildPath } from "./builder";
import { routeOf } from "./RouteDefiner";

describe("index", () => {
  describe("buildPath", () => {
    it("Should build path", () => {
      const def = routeOf("/users/:id").action({ component: () => null });

      const def2 = routeOf("/users/:id/comments/:commentId").action({
        component: () => null,
      });

      expect(buildPath(def, { id: "1" })).toBe("/users/1");
      expect(buildPath(def2, { id: "1", commentId: "2" })).toBe(
        "/users/1/comments/2"
      );
    });

    it("Should serialize array query", () => {
      const def = routeOf("/users/:userId");

      expect(
        buildPath(def, { userId: "1" }, { q: ["a", "b"] })
      ).toMatchInlineSnapshot(`"/users/1?q=a&q=b"`);
    });
  });
});

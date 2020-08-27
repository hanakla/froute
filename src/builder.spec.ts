import { route } from "./index";
import { buildPath } from "./builder";

describe("index", () => {
  describe("buildPath", () => {
    it("Should build path", () => {
      const def = route("users")
        .param("id")
        .action({ component: () => null });

      const def2 = route("users")
        .param("id")
        .path("comments")
        .param("commentId")
        .action({ component: () => null });

      expect(buildPath(def, { id: "1" })).toBe("/users/1");
      expect(buildPath(def2, { id: "1", commentId: "2" })).toBe(
        "/users/1/comments/2"
      );
    });
  });
});

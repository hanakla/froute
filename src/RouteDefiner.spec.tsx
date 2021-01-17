import { buildPath } from "./builder";
import { routeBy, routeOf } from "./RouteDefiner";

describe("RouteDefiner", () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  type ExteranalContext = { hi: "hi" };

  describe("routeBy", () => {
    const route = routeBy("/user").param("userId");

    it("Should resolve path", () => {
      expect(route.match("/user/1")).not.toBe(false);
    });

    it("Should build path", () => {
      expect(buildPath(route, { userId: "1" })).toMatchInlineSnapshot(
        `"/user/1"`
      );
    });
  });

  describe("routeOf", () => {
    const route = routeOf("/user/:userId/artworks/:artworkId?").state(() => ({
      userId: "",
    }));

    it("Should resolve path", () => {
      expect(route.match("/user/1/artworks")).not.toBe(false);
      expect(route.match("/user/1/artworks/1")).not.toBe(false);
    });

    it("Should build path", () => {
      expect(buildPath(route, { userId: "1" })).toMatchInlineSnapshot(
        `"/user/1/artworks"`
      );

      expect(
        buildPath(route, { userId: "1", artworkId: "1" })
      ).toMatchInlineSnapshot(`"/user/1/artworks/1"`);
    });
  });

  describe("match", () => {
    it("should decode URI component", () => {
      const route = routeOf("/search/:tag/:frag").action({
        component: () => () => null,
      });

      const match = route.match(
        "/search/%E3%81%86%E3%81%A1%E3%81%AE%E5%AD%90/%E3%81%8B%E3%82%8F%E3%81%84%E3%81%84?ans=%E3%81%9D%E3%81%86%E3%81%A0%E3%81%9E"
      );

      expect(match!.params.tag).toBe("うちの子");
      expect(match!.params.frag).toBe("かわいい");
      expect(match!.query.ans).toBe("そうだぞ");
    });
  });
});

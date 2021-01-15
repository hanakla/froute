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
});

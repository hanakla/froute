import { parse } from "url";
import * as qs from "querystring";
import { parseQueryString, parseUrl, stringifyQueryString } from "./utils";

describe("utils", () => {
  describe("parseUrl", () => {
    it.each([
      [""],
      ["/"],
      ["/aaa/aaa?b=c"],
      ["https://example.com:1000"],
      ["https://user:pass@example.com:1000/aaaa?a=1#aaa"],
    ])("should same result to url.parse", (url) => {
      const { slashes, ...original } = parse(url);
      expect(parseUrl(url)).toEqual(original);
    });
  });

  describe("parseQueryString", () => {
    it.each([
      ["a=1&b[]=1&b[]=2"],
      ["a=1&b[]=1&b[]=22&c[][]=11&c[][]=22&c[][]=33"],
    ])("parse", (query) => {
      const parsed = qs.parse(query);
      // console.log(parsed);
      expect(parseQueryString(query)).toEqual(parsed);
    });
  });

  describe("stringifyQueryString", () => {
    it.each([
      [{ a: "a", b: "b" }],
      [{ "a[]": ["1", "2", "3"] }],
      [{ a: ["1", "2", "3"], b: "1" }],
    ])("parse", (query) => {
      const parsed = qs.stringify(query);
      // console.log(parsed);
      expect(stringifyQueryString(query)).toEqual(parsed);
    });
  });
});

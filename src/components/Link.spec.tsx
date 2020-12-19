import React from "react";
import { render } from "@testing-library/react";
import { routeBy } from "../RouteDefiner";
import { createRouterContext } from "../RouterContext";
import { Link } from "./Link";
import { createComponentWrapper } from "../../spec/createComponentWrapper";

describe("Link", () => {
  const routes = {
    users: routeBy("/users").param("id"),
  };

  it("Click to move location", async () => {
    const router = createRouterContext(routes);
    const spy = jest.spyOn(router, "navigate");

    const result = render(
      <Link data-testid="link" href="/users/1">
        Link
      </Link>,
      { wrapper: createComponentWrapper(router) }
    );

    expect(location.href).toMatchInlineSnapshot(`"http://localhost/"`);

    const link = await result.findByTestId("link");
    link.click();

    expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/1"`);
    expect(spy.mock.calls.length).toBe(1);

    link.click();
    expect(spy.mock.calls.length).toBe(2);
  });
});

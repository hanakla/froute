import React from "react";
import { render } from "@testing-library/react";
import { routeBy, routeOf } from "../RouteDefiner";
import { createRouterContext } from "../RouterContext";
import { FrouteLink } from "./FrouteLink";
import { createComponentWrapper, waitTick } from "../../spec/utils";

describe("FrouteLink", () => {
  const routes = {
    users: routeOf("/users/:id"),
  };

  it("Click to move location", async () => {
    const router = createRouterContext(routes);
    const spy = jest.spyOn(router, "navigate");

    const result = render(
      <FrouteLink data-testid="link" href="/users/1">
        Link
      </FrouteLink>,
      { wrapper: createComponentWrapper(router) }
    );

    expect(location.href).toMatchInlineSnapshot(`"http://localhost/"`);

    const link = await result.findByTestId("link");
    link.click();
    await waitTick();

    expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/1"`);
    expect(spy.mock.calls.length).toBe(1);

    link.click();
    await waitTick();
    expect(spy.mock.calls.length).toBe(2);
  });
});

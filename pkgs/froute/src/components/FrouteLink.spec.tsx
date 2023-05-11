import React from "react";
import { render } from "@testing-library/react";
import { routeOf } from "../RouteDefiner";
import { createRouter } from "../RouterContext";
import { createComponentWrapper, waitTick } from "../../spec/utils";
import { FrouteLink } from "./FrouteLink";

describe("FrouteLink", () => {
  const routes = {
    users: routeOf("/users/:id"),
  };

  it("Click to move location", async () => {
    const router = createRouter(routes);
    await router.navigate("/");

    const spy = vi.spyOn(router, "navigate");

    const result = render(
      <FrouteLink data-testid="link" to={routes.users} params={{ id: "1" }}>
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

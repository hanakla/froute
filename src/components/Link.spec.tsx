import React from "react";
import { render } from "@testing-library/react";
import { routeOf } from "../RouteDefiner";
import { createRouter } from "../RouterContext";
import { Link } from "./Link";
import { createComponentWrapper, waitTick } from "../../spec/utils";

describe("Link", () => {
  const routes = {
    users: routeOf("/users/:id"),
  };

  it("Click to move location", async () => {
    const router = createRouter(routes);
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
    await waitTick();

    expect(location.href).toMatchInlineSnapshot(`"http://localhost/users/1"`);
    expect(spy.mock.calls.length).toBe(1);

    link.click();
    await waitTick();
    expect(spy.mock.calls.length).toBe(2);
  });
});

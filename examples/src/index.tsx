import "regenerator-runtime";
import domready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import { createRouterContext, FrouteContext } from "@fleur/froute";
import { App } from "./components/App";
import { routes } from "./routes";

domready(async () => {
  const root = document.getElementById("root");
  const router = createRouterContext(routes);

  router.navigate(location.href);
  await router.preloadCurrent();

  ReactDOM.render(
    <FrouteContext context={router}>
      <App />
    </FrouteContext>,
    root
  );
});

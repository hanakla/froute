import "regenerator-runtime";
import domready from "domready";
import React from "react";
import ReactDOM from "react-dom";
import { createRouterContext, FrouteContext } from "@fleur/froute";
import { FleurContext } from "@fleur/react";
import { App } from "./components/App";
import { routes } from "./routes";
import { fleurApp } from "./domains";

domready(async () => {
  const root = document.getElementById("root");
  const context = fleurApp.createContext();
  const router = createRouterContext(routes, {
    preloadContext: context,
  });

  await router.navigate(location.href);
  await router.preloadCurrent();

  ReactDOM.render(
    <FleurContext value={context}>
      <FrouteContext router={router}>
        <App />
      </FrouteContext>
    </FleurContext>,
    root
  );

  console.log({ responseCode: router.statusCode });
});

import React from "react";
import { FrouteContext } from "../src/react-bind";
import { RouterContext } from "../src/RouterContext";

export const createComponentWrapper = (router: RouterContext): React.FC => {
  return ({ children }) => (
    <FrouteContext router={router}>{children}</FrouteContext>
  );
};

export const waitTick = () => new Promise((resolve) => setTimeout(resolve));
